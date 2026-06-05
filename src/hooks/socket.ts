import { io } from 'socket.io-client';
import { authClient } from '../lib/auth';

const SERVER_URL = import.meta.env.VITE_SERVER_URL ?? 'http://localhost:3001';

export const socket = io(SERVER_URL, {
  autoConnect: false,
  transports: ['websocket'],
  withCredentials: true,
});

export async function connectSocket() {
  if (socket.connected) return;
  const { data: session } = await authClient.getSession();
  const token = session?.session?.token;
  if (!token) throw new Error('Not authenticated');
  socket.auth = { token };
  socket.connect();
}
