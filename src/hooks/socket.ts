import { io } from 'socket.io-client';

const SERVER_URL = import.meta.env.VITE_SERVER_URL ?? 'http://localhost:3001';

export const socket = io(SERVER_URL, {
  autoConnect: false,
  transports: ['websocket'],
});

// Persistent identity — survives page refresh
export function getPlayerId(): string {
  let id = localStorage.getItem('battleset_player_id');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('battleset_player_id', id);
  }
  return id;
}
