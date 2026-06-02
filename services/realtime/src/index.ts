import { type WebSocket, WebSocketServer } from 'ws';

const port = Number(process.env.PORT ?? 5000);
const wss = new WebSocketServer({ port });

wss.on('connection', (socket: WebSocket) => {
  socket.on('message', (message: unknown) => {
    console.log('realtime message received', String(message));
    socket.send(JSON.stringify({ status: 'received' }));
  });
});

console.log(`Realtime service listening on ws://localhost:${port}`);
