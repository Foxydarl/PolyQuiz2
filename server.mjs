import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { Server } from 'socket.io';
import { GAME_STATE_INIT } from './config.mjs';

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  const io = new Server(server, {
    path: '/socket.io/',
    transports: ['websocket'],
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  let gameState = { ...GAME_STATE_INIT };

  io.on('connection', (socket) => {
    console.log(`A user connected ${socket.id}`);
    // Ваши обработчики событий
  });

  server.listen(3000, (err) => {
    if (err) throw err;
    console.log('> Ready on http://localhost:3000');
  });
}); 