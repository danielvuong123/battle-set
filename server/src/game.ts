import {
  type SetCard,
  generateDeck,
  isSet,
  hasSet,
  ensurePlayableBoard,
} from './set.js';

export type Player = {
  id: string;
  name: string;
  score: number;
};

export type Room = {
  id: string;
  hostId: string;
  players: Map<string, Player>;
  deck: SetCard[];
  board: SetCard[];
  status: 'waiting' | 'playing' | 'finished';
  claimInProgress: boolean;
};

export type ClaimResult = {
  valid: boolean;
  playerId: string;
  playerName: string;
  cardIds: string[];
  board?: SetCard[];
  deckSize?: number;
  scores?: Record<string, number>;
  gameOver?: boolean;
};

const rooms = new Map<string, Room>();

function generateRoomId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let id = '';
  for (let i = 0; i < 6; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return rooms.has(id) ? generateRoomId() : id;
}

function createInitialBoard(): { deck: SetCard[]; board: SetCard[] } {
  let deck: SetCard[];
  let board: SetCard[];
  do {
    deck = generateDeck();
    board = deck.slice(0, 12);
  } while (!hasSet(board));
  return { board, deck: deck.slice(12) };
}

export function createRoom(hostId: string, hostName: string): Room {
  const id = generateRoomId();
  const host: Player = { id: hostId, name: hostName, score: 0 };
  const room: Room = {
    id,
    hostId,
    players: new Map([[hostId, host]]),
    deck: [],
    board: [],
    status: 'waiting',
    claimInProgress: false,
  };
  rooms.set(id, room);
  return room;
}

export function getRoom(roomId: string): Room | undefined {
  return rooms.get(roomId);
}

export function joinRoom(roomId: string, playerId: string, playerName: string): Player | null {
  const room = rooms.get(roomId);
  if (!room || room.status !== 'waiting') return null;
  const player: Player = { id: playerId, name: playerName, score: 0 };
  room.players.set(playerId, player);
  return player;
}

export function removePlayer(playerId: string): string | null {
  for (const [roomId, room] of rooms) {
    if (room.players.has(playerId)) {
      room.players.delete(playerId);
      if (room.players.size === 0) {
        rooms.delete(roomId);
        return null;
      }
      // if host left, assign a new host
      if (room.hostId === playerId) {
        room.hostId = room.players.keys().next().value!;
      }
      return roomId;
    }
  }
  return null;
}

export function startGame(roomId: string, requesterId: string): Room | null {
  const room = rooms.get(roomId);
  if (!room || room.hostId !== requesterId || room.status !== 'waiting') return null;
  const { board, deck } = createInitialBoard();
  room.board = board;
  room.deck = deck;
  room.status = 'playing';
  return room;
}

export function claimSet(
  roomId: string,
  playerId: string,
  cardIds: string[]
): ClaimResult | null {
  const room = rooms.get(roomId);
  if (!room || room.status !== 'playing' || room.claimInProgress) return null;

  const player = room.players.get(playerId);
  if (!player) return null;

  room.claimInProgress = true;

  const cards = cardIds.map(id => room.board.find(c => c.id === id)).filter(Boolean) as SetCard[];
  const allOnBoard = cards.length === 3;
  const valid = allOnBoard && isSet(cards);

  const result: ClaimResult = {
    valid,
    playerId,
    playerName: player.name,
    cardIds,
  };

  if (valid) {
    player.score += 1;

    const selectedIds = new Set(cardIds);
    const isExpanded = room.board.length > 12;

    const updatedBoard = room.board
      .map(card => {
        if (!selectedIds.has(card.id)) return card;
        if (isExpanded) return null;
        return room.deck.shift() ?? null;
      })
      .filter((c): c is SetCard => c !== null);

    const { board, deck } = ensurePlayableBoard(updatedBoard, room.deck);
    room.board = board;
    room.deck = deck;

    const gameOver = room.deck.length === 0 && !hasSet(room.board);
    if (gameOver) room.status = 'finished';

    const scores: Record<string, number> = {};
    room.players.forEach(p => { scores[p.id] = p.score; });

    result.board = room.board;
    result.deckSize = room.deck.length;
    result.scores = scores;
    result.gameOver = gameOver;
  }

  room.claimInProgress = false;
  return result;
}

export function getRoomSnapshot(room: Room) {
  const players: Player[] = [];
  room.players.forEach(p => players.push(p));
  return {
    id: room.id,
    hostId: room.hostId,
    players,
    board: room.board,
    deckSize: room.deck.length,
    status: room.status,
  };
}
