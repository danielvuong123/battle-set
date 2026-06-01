import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
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

const io = new Server(httpServer, {
  cors: {
    origin: ALLOWED_ORIGINS,
    methods: ['GET', 'POST'],
  },
});

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

io.on('connection', socket => {
  console.log(`[+] ${socket.id} connected`);

  // Client sends their persistent UUID from localStorage on every connect
  socket.on('register_player', async ({ playerId, playerName }: { playerId: string; playerName?: string }) => {
    try {
      if (playerName) await upsertPlayer(playerId, playerName);

      // Check if this player was mid-game when they disconnected
      const active = await getActiveRoomForPlayer(playerId);
      if (active) {
        const room = getRoom(active.roomId);
        if (room) {
          // Find the player entry in the in-memory room and update their socket id
          const player = room.players.get(playerId);
          if (player) {
            room.players.delete(playerId);
            room.players.set(socket.id, { ...player, id: socket.id });
          }
          socket.join(active.roomId);
          socket.emit('rejoined', { room: getRoomSnapshot(room), playerId: socket.id });
          console.log(`[rejoin] ${playerName ?? playerId} rejoined room ${active.roomId}`);
          return;
        }
      }

      socket.emit('registered', { playerId });
    } catch (err) {
      console.error('[register_player]', err);
    }
  });

  socket.on('create_room', async ({ playerId, playerName }: { playerId: string; playerName: string }) => {
    try {
      await upsertPlayer(playerId, playerName);
      const room = createRoom(socket.id, playerName);
      await createRoomRecord(room.id);
      await addPlayerToRoom(room.id, playerId);

      socket.join(room.id);
      socket.emit('room_joined', { room: getRoomSnapshot(room), playerId: socket.id });
      console.log(`[room] ${playerName} created room ${room.id}`);
    } catch (err) {
      console.error('[create_room]', err);
      socket.emit('error', { message: 'Failed to create room.' });
    }
  });

  socket.on('join_room', async ({ roomId, playerId, playerName }: { roomId: string; playerId: string; playerName: string }) => {
    const upperId = roomId.toUpperCase();
    try {
      await upsertPlayer(playerId, playerName);
      const player = joinRoom(upperId, socket.id, playerName);
      if (!player) {
        socket.emit('error', { message: 'Room not found or game already started.' });
        return;
      }
      await addPlayerToRoom(upperId, playerId);

      socket.join(upperId);
      const room = getRoom(upperId)!;
      socket.emit('room_joined', { room: getRoomSnapshot(room), playerId: socket.id });
      socket.to(upperId).emit('player_joined', { player });
      console.log(`[room] ${playerName} joined room ${upperId}`);
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

  socket.on('claim_set', async ({ roomId, cardIds, playerId }: { roomId: string; cardIds: string[]; playerId: string }) => {
    const result = claimSet(roomId, socket.id, cardIds);
    if (!result) return;

    io.to(roomId).emit('claim_result', result);

    if (result.valid) {
      try {
        await recordFoundSet(roomId, playerId, cardIds);
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
