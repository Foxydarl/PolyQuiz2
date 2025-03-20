import Image from "next/image"
import Button from "@/components/Button"
import background from "@/assets/background.webp"
import { usePlayerContext } from "@/context/player"
import { useSocketContext } from "@/context/socket"
import { useEffect, useState } from "react"
import { useRouter } from "next/router"

export default function GameWrapper({ children, textNext, onNext, manager, gameEnded }) {
  const { socket } = useSocketContext()
  const { player, dispatch } = usePlayerContext()
  const router = useRouter()

  const [questionState, setQuestionState] = useState()

  useEffect(() => {
    socket.on("game:kick", () => {
      dispatch({
        type: "LOGOUT",
      })

      router.replace("/")
    })

    socket.on("game:updateQuestion", ({ current, total }) => {
      setQuestionState({
        current,
        total,
      })
    })

    return () => {
      socket.off("game:kick")
      socket.off("game:updateQuestion")
    }
  }, [])

  return (
    <section className="relative flex min-h-screen w-full flex-col justify-between">
      <div className="fixed left-0 top-0 -z-10 h-full w-full bg-orange-600 opacity-70">
        <Image
          className="pointer-events-none h-full w-full object-cover opacity-60"
          src={background}
          alt="background"
        />
      </div>

      <div className="flex w-full justify-between p-4 relative z-50">
        {questionState && (
          <div className="shadow-inset flex items-center rounded-md bg-white p-2 px-4 text-lg font-bold text-black">
            {`${questionState.current} / ${questionState.total}`}
          </div>
        )}

        {manager && (
          <>
            <Button
              className="self-end bg-white px-4 !text-black relative z-50"
              onClick={() => onNext()}
            >
              {textNext}
            </Button>
            
            {/* Дополнительные кнопки для навигации менеджера только после завершения игры */}
            {gameEnded && window.location.pathname === '/manager' && (
              <div className="flex gap-2 relative z-50">
                <Button
                  className="self-end bg-primary px-4 text-white"
                  onClick={() => {
                    console.log("Прямой переход к полному лидерборду");
                    socket.emit("manager:showFullLeaderboard");
                  }}
                >
                  Лидерборд
                </Button>
                <Button
                  className="self-end bg-primary px-4 text-white"
                  onClick={() => {
                    console.log("Прямой переход к подиуму");
                    socket.emit("manager:showPodium");
                  }}
                >
                  Подиум
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {children}

      {!manager && (
        <div className="z-50 flex items-center justify-between bg-white px-4 py-2 text-lg font-bold text-white">
          <p className="text-gray-800">{!!player && player.username}</p>
          <div className="rounded-sm bg-gray-800 px-3 py-1 text-lg">
            {!!player && `${player.correctAnswers || 0}/${player.totalQuestions}`}
          </div>
        </div>
      )}
    </section>
  )
}
