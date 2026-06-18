import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { toNodeHandler } from 'better-auth/node';
import { auth } from './auth.js';
import {
  createRoom,
  getRoom,
  joinRoom,
  removePlayer,
  startGame,
  claimSet,
  getRoomSnapshot,
} from './game.js';
import {
  upsertPlayer,
  createRoomRecord,
  addPlayerToRoom,
  markRoomPlaying,
  recordFoundSet,
  markRoomFinished,
  getActiveRoomForPlayer,
  getLeaderboard,
} from './db-ops.js';

const app = express();
const httpServer = createServer(app);

const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS ?? 'http://localhost:5173,http://localhost:4173')
  .split(',')
  .map(s => s.trim());

// Better Auth handles its own body parsing — mount before express.json()
app.all('/api/auth/*', toNodeHandler(auth));

app.use(express.json());

app.get('/health', (_req, res) => res.json({ ok: true }));

app.get('/leaderboard', async (_req, res) => {
  try {
    const rows = await getLeaderboard(10);
    res.json(rows);
  } catch (err) {
    console.error('[leaderboard]', err);
    res.status(500).json({ error: 'Failed to load leaderboard' });
  }
});

const io = new Server(httpServer, {
  cors: {
    origin: ALLOWED_ORIGINS,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Verify session before any socket events
io.use(async (socket, next) => {
  const token = socket.handshake.auth?.token as string | undefined;
  if (!token) return next(new Error('Unauthorized'));

  try {
    const session = await auth.api.getSession({
      headers: new Headers({ cookie: `better-auth.session_token=${token}` }),
    });
    if (!session) return next(new Error('Unauthorized'));
    socket.data.userId = session.user.id;
    socket.data.userName = session.user.name;
    next();
  } catch {
    next(new Error('Unauthorized'));
  }
});

io.on('connection', socket => {
  const userId: string = socket.data.userId;
  const userName: string = socket.data.userName;
  console.log(`[+] ${socket.id} connected (user: ${userName})`);

  socket.on('register_player', async () => {
    try {
      await upsertPlayer(userId, userName);

      const active = await getActiveRoomForPlayer(userId);
      if (active) {
        const room = getRoom(active.roomId);
        if (room) {
          const player = room.players.get(userId);
          if (player) {
            room.players.delete(userId);
            room.players.set(socket.id, { ...player, id: socket.id });
          }
          socket.join(active.roomId);
          socket.emit('rejoined', { room: getRoomSnapshot(room), playerId: socket.id });
          console.log(`[rejoin] ${userName} rejoined room ${active.roomId}`);
          return;
        }
      }

      socket.emit('registered', { playerId: userId });
    } catch (err) {
      console.error('[register_player]', err);
    }
  });

  socket.on('create_room', async () => {
    try {
      await upsertPlayer(userId, userName);
      const room = createRoom(socket.id, userName);
      await createRoomRecord(room.id);
      await addPlayerToRoom(room.id, userId);

      socket.join(room.id);
      socket.emit('room_joined', { room: getRoomSnapshot(room), playerId: socket.id });
      console.log(`[room] ${userName} created room ${room.id}`);
    } catch (err) {
      console.error('[create_room]', err);
      socket.emit('error', { message: 'Failed to create room.' });
    }
  });

  socket.on('join_room', async ({ roomId }: { roomId: string }) => {
    const upperId = roomId.toUpperCase();
    try {
      await upsertPlayer(userId, userName);
      const player = joinRoom(upperId, socket.id, userName);
      if (!player) {
        socket.emit('error', { message: 'Room not found or game already started.' });
        return;
      }
      await addPlayerToRoom(upperId, userId);

      socket.join(upperId);
      const room = getRoom(upperId)!;
      socket.emit('room_joined', { room: getRoomSnapshot(room), playerId: socket.id });
      socket.to(upperId).emit('player_joined', { player });
      console.log(`[room] ${userName} joined room ${upperId}`);
    } catch (err) {
      console.error('[join_room]', err);
      socket.emit('error', { message: 'Failed to join room.' });
    }
  });

  socket.on('start_game', async ({ roomId }: { roomId: string }) => {
    const room = startGame(roomId, socket.id);
    if (!room) {
      socket.emit('error', { message: 'Cannot start game.' });
      return;
    }
    try {
      await markRoomPlaying(roomId);
    } catch (err) {
      console.error('[start_game] db write failed', err);
    }
    io.to(roomId).emit('game_started', {
      board: room.board,
      deckSize: room.deck.length,
    });
    console.log(`[game] Room ${roomId} started`);
  });

  socket.on('claim_set', async ({ roomId, cardIds }: { roomId: string; cardIds: string[] }) => {
    const result = claimSet(roomId, socket.id, cardIds);
    if (!result) return;

    io.to(roomId).emit('claim_result', result);

    if (result.valid) {
      try {
        await recordFoundSet(roomId, userId, cardIds);
      } catch (err) {
        console.error('[claim_set] db write failed', err);
      }
    }

    if (result.gameOver) {
      const room = getRoom(roomId);
      if (room) {
        const players: { id: string; name: string; score: number }[] = [];
        room.players.forEach(p => players.push(p));
        const winner = players.reduce((a, b) => a.score >= b.score ? a : b);
        io.to(roomId).emit('game_over', {
          players,
          winnerId: winner.id,
          winnerName: winner.name,
        });
        try {
          await markRoomFinished(roomId);
        } catch (err) {
          console.error('[game_over] db write failed', err);
        }
      }
    }
  });

  socket.on('disconnect', () => {
    const roomId = removePlayer(socket.id);
    if (roomId) {
      const room = getRoom(roomId);
      io.to(roomId).emit('player_left', {
        playerId: socket.id,
        newHostId: room?.hostId,
      });
    }
    console.log(`[-] ${socket.id} disconnected`);
  });
});

const PORT = process.env.PORT ?? 3001;
httpServer.listen(PORT, () => {
  console.log(`battle-set server running on http://localhost:${PORT}`);
});
