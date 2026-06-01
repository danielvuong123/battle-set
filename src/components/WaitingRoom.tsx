import { useEffect, useRef, useState } from 'react';
import { socket } from '../hooks/socket';
import type { MPPlayer } from '../hooks/useMultiplayerGame';
import type { SetCard } from '../lib/set';
import './WaitingRoom.css';

type WaitingRoomProps = {
  roomId: string;
  playerId: string;
  initialPlayers: MPPlayer[];
  isHost: boolean;
  onGameStart: (board: SetCard[], deckSize: number, players: MPPlayer[]) => void;
  onBack: () => void;
};

export default function WaitingRoom({
  roomId,
  playerId,
  initialPlayers,
  isHost,
  onGameStart,
  onBack,
}: WaitingRoomProps) {
  const [players, setPlayers] = useState<MPPlayer[]>(initialPlayers);
  const [hostId, setHostId] = useState<string>(
    isHost ? playerId : initialPlayers.find(p => p.id !== playerId)?.id ?? ''
  );

  // ref so the game_started handler always reads the latest player list
  const playersRef = useRef(players);
  useEffect(() => { playersRef.current = players; }, [players]);

  useEffect(() => {
    function onPlayerJoined({ player }: { player: MPPlayer }) {
      setPlayers(prev => prev.some(p => p.id === player.id) ? prev : [...prev, player]);
    }

    function onPlayerLeft({ playerId: leftId, newHostId }: { playerId: string; newHostId?: string }) {
      setPlayers(prev => prev.filter(p => p.id !== leftId));
      if (newHostId) setHostId(newHostId);
    }

    function onGameStarted({ board, deckSize }: { board: SetCard[]; deckSize: number }) {
      onGameStart(board, deckSize, playersRef.current);
    }

    socket.on('player_joined', onPlayerJoined);
    socket.on('player_left', onPlayerLeft);
    socket.on('game_started', onGameStarted);

    return () => {
      socket.off('player_joined', onPlayerJoined);
      socket.off('player_left', onPlayerLeft);
      socket.off('game_started', onGameStarted);
    };
  }, [onGameStart]);

  function startGame() {
    socket.emit('start_game', { roomId });
  }

  const amHost = hostId === playerId;

  return (
    <div className="waiting-room">
      <div className="waiting-content">
        <h1>Waiting Room</h1>

        <div className="room-code-box">
          <span className="room-code-label">Room code</span>
          <span className="room-code">{roomId}</span>
          <span className="room-code-hint">Share this with friends</span>
        </div>

        <div className="player-list">
          <h3>Players ({players.length})</h3>
          {players.map(p => (
            <div key={p.id} className="player-row">
              <span>{p.name}</span>
              {p.id === hostId && <span className="host-badge">host</span>}
              {p.id === playerId && <span className="you-badge">you</span>}
            </div>
          ))}
        </div>

        {amHost ? (
          <button
            className="start-btn"
            onClick={startGame}
            disabled={players.length < 2}
          >
            {players.length < 2 ? 'Waiting for players...' : 'Start Game'}
          </button>
        ) : (
          <p className="waiting-msg">Waiting for host to start...</p>
        )}

        <button className="back-btn" onClick={onBack}>← Leave</button>
      </div>
    </div>
  );
}
