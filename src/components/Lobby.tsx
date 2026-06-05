import { useState } from 'react';
import { socket, connectSocket } from '../hooks/socket';
import type { MPPlayer } from '../hooks/useMultiplayerGame';
import './Lobby.css';

type RoomSnapshot = {
  id: string;
  hostId: string;
  players: MPPlayer[];
  status: string;
};

type LobbyProps = {
  playerName: string;
  onRoomReady: (roomId: string, playerId: string, players: MPPlayer[], isHost: boolean) => void;
  onBack: () => void;
};

export default function Lobby({ playerName, onRoomReady, onBack }: LobbyProps) {
  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState('');
  const [connecting, setConnecting] = useState(false);

  async function connect(action: 'create' | 'join') {
    if (action === 'join' && !joinCode.trim()) { setError('Enter a room code.'); return; }

    setError('');
    setConnecting(true);

    try {
      await connectSocket();
    } catch {
      setError('Not signed in.');
      setConnecting(false);
      return;
    }

    socket.once('room_joined', ({ room, playerId: socketId }: { room: RoomSnapshot; playerId: string }) => {
      setConnecting(false);
      onRoomReady(room.id, socketId, room.players, room.hostId === socketId);
    });

    socket.once('rejoined', ({ room, playerId: socketId }: { room: RoomSnapshot; playerId: string }) => {
      setConnecting(false);
      onRoomReady(room.id, socketId, room.players, room.hostId === socketId);
    });

    socket.once('error', ({ message }: { message: string }) => {
      setError(message);
      setConnecting(false);
    });

    socket.once('connect', () => {
      socket.emit('register_player');
      if (action === 'create') {
        socket.emit('create_room');
      } else {
        socket.emit('join_room', { roomId: joinCode.trim() });
      }
    });

    if (socket.connected) {
      socket.emit('register_player');
      if (action === 'create') {
        socket.emit('create_room');
      } else {
        socket.emit('join_room', { roomId: joinCode.trim() });
      }
    }
  }

  return (
    <div className="lobby">
      <div className="lobby-content">
        <h1>Multiplayer</h1>
        <p className="lobby-playing-as">Playing as <strong>{playerName}</strong></p>

        <button
          className="lobby-btn-primary"
          onClick={() => connect('create')}
          disabled={connecting}
        >
          Create Game
        </button>

        <div className="lobby-divider">or join an existing game</div>

        <label>
          Room code
          <input
            value={joinCode}
            onChange={e => setJoinCode(e.target.value.toUpperCase())}
            placeholder="e.g. AB3K9Z"
            maxLength={6}
            disabled={connecting}
          />
        </label>

        <button onClick={() => connect('join')} disabled={connecting}>
          Join Game
        </button>

        {error && <p className="lobby-error">{error}</p>}

        <button className="lobby-back" onClick={onBack} disabled={connecting}>
          ← Back
        </button>
      </div>
    </div>
  );
}
