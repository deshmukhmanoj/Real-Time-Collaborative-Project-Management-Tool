import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { verifyAccessToken } from '../utils/jwt.util';
import { env } from '../config/env';

/**
 * Real-time events emitted from controllers (import `io` where needed):
 *   io.to(`board:${boardId}`).emit('task:created', task)
 *   io.to(`board:${boardId}`).emit('task:moved', payload)
 *   io.to(`board:${boardId}`).emit('task:updated', task)
 *   io.to(`board:${boardId}`).emit('comment:added', comment)
 */
let io: Server;

export function initSocket(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: {
      origin: env.CLIENT_URL,
      credentials: true,
    },
  });

  // Auth handshake: client passes accessToken, we verify before allowing connection
  io.use((socket: Socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('NO_TOKEN_PROVIDED'));
      const decoded = verifyAccessToken(token);
      (socket as any).userId = decoded.userId;
      next();
    } catch (err) {
      next(new Error('INVALID_OR_EXPIRED_TOKEN'));
    }
  });

  io.on('connection', (socket: Socket) => {
    // Client joins a board "room" to receive live updates for that board
    socket.on('board:join', (boardId: number) => {
      socket.join(`board:${boardId}`);
    });

    socket.on('board:leave', (boardId: number) => {
      socket.leave(`board:${boardId}`);
    });

    socket.on('disconnect', () => {
      // cleanup if needed
    });
  });

  return io;
}

export function getIO(): Server {
  if (!io) throw new Error('Socket.io not initialized. Call initSocket() first.');
  return io;
}
