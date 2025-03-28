import { cooldown, sleep } from "./cooldown.js"

export const startRound = async (game, io, socket) => {
  const question = game.questions[game.currentQuestion]

  if (!game.started) return

  io.to(game.room).emit("game:updateQuestion", {
    current: game.currentQuestion + 1,
    total: game.questions.length,
  })

  io.to(game.room).emit("game:status", {
    name: "SHOW_PREPARED",
    data: {
      totalAnswers: game.questions[game.currentQuestion].answers.length,
      questionNumber: game.currentQuestion + 1,
    },
  })

  await sleep(2)

  if (!game.started) return

  io.to(game.room).emit("game:status", {
    name: "SHOW_QUESTION",
    data: {
      question: question.question,
      image: question.image,
      cooldown: question.cooldown,
    },
  })

  await sleep(question.cooldown)

  if (!game.started) return

  game.roundStartTime = Date.now()

  io.to(game.room).emit("game:status", {
    name: "SELECT_ANSWER",
    data: {
      question: question.question,
      answers: question.answers,
      image: question.image,
      time: question.time,
      totalPlayer: game.players.length,
    },
  })

  await cooldown(question.time, io, game.room)

  if (!game.started) return

  game.players.map(async (player) => {
    let playerAnswer = await game.playersAnswer.find((p) => p.id === player.id)

    let isCorrect = playerAnswer
      ? playerAnswer.answer === question.solution
      : false

    let points =
      (isCorrect && Math.round(playerAnswer && playerAnswer.points)) || 0

    player.points += points
    
    // Увеличиваем счетчик правильных ответов, если ответ правильный
    if (isCorrect) {
      player.correctAnswers = (player.correctAnswers || 0) + 1
    }
    
    // Сохраняем информацию о каждом ответе
    if (!player.answers) {
      player.answers = []
    }
    
    // Сохраняем детали ответа
    if (playerAnswer) {
      player.answers[game.currentQuestion] = {
        questionIndex: game.currentQuestion,
        answer: playerAnswer.answer,
        isCorrect: isCorrect,
        points: isCorrect ? points : 0
      }
    } else {
      // Если игрок не ответил
      player.answers[game.currentQuestion] = {
        questionIndex: game.currentQuestion,
        answer: null,
        isCorrect: false,
        points: 0
      }
    }

    // Сортируем игроков сначала по количеству правильных ответов, затем по очкам
    let sortPlayers = game.players.sort((a, b) => {
      if ((b.correctAnswers || 0) !== (a.correctAnswers || 0)) {
        return (b.correctAnswers || 0) - (a.correctAnswers || 0)
      }
      return b.points - a.points
    })

    let rank = sortPlayers.findIndex((p) => p.id === player.id) + 1
    let aheadPlayer = sortPlayers[rank - 2]

    io.to(player.id).emit("game:status", {
      name: "SHOW_RESULT",
      data: {
        correct: isCorrect,
        message: isCorrect ? "Nice !" : "Too bad",
        points: points,
        myPoints: player.points,
        correctAnswers: player.correctAnswers || 0,
        rank,
        aheadOfMe: aheadPlayer ? aheadPlayer.username : null,
        totalQuestions: game.questions.length,
      },
    })
  })

  let totalType = {}

  game.playersAnswer.forEach(({ answer }) => {
    totalType[answer] = (totalType[answer] || 0) + 1
  })

  // Manager
  io.to(game.manager).emit("game:status", {
    name: "SHOW_RESPONSES",
    data: {
      question: game.questions[game.currentQuestion].question,
      responses: totalType,
      correct: game.questions[game.currentQuestion].solution,
      answers: game.questions[game.currentQuestion].answers,
      image: game.questions[game.currentQuestion].image,
    },
  })

  game.playersAnswer = []
}
