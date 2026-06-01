import { useState } from 'react';
import { type Settings, DEFAULT_SETTINGS } from './types';
import Board from './components/Board';
import Menu from './components/Menu';
import HowToPlay from './components/HowToPlay';
import SettingsPage from './components/Settings';
import Lobby from './components/Lobby';
import WaitingRoom from './components/WaitingRoom';
import MultiplayerBoard from './components/MultiplayerBoard';
import type { MPPlayer } from './hooks/useMultiplayerGame';
import type { SetCard } from './lib/set';

type View = 'menu' | 'game' | 'how-to-play' | 'settings' | 'lobby' | 'waiting-room' | 'multiplayer-game';

type RoomInfo = {
  roomId: string;
  playerId: string;
  players: MPPlayer[];
  isHost: boolean;
  initialBoard: SetCard[];
  initialDeckSize: number;
};

export default function App() {
  const [view, setView] = useState<View>('menu');
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [room, setRoom] = useState<RoomInfo | null>(null);

  function handleRoomReady(roomId: string, playerId: string, players: MPPlayer[], isHost: boolean) {
    setRoom({ roomId, playerId, players, isHost, initialBoard: [], initialDeckSize: 0 });
    setView('waiting-room');
  }

  function handleGameStart(initialBoard: SetCard[], initialDeckSize: number, players: MPPlayer[]) {
    setRoom(prev => prev ? { ...prev, initialBoard, initialDeckSize, players } : prev);
    setView('multiplayer-game');
  }

  function handleLeaveMultiplayer() {
    setRoom(null);
    setView('menu');
  }

  if (view === 'game') return <Board settings={settings} onMenu={() => setView('menu')} />;
  if (view === 'how-to-play') return <HowToPlay onBack={() => setView('menu')} />;
  if (view === 'settings') return <SettingsPage settings={settings} onChange={setSettings} onBack={() => setView('menu')} />;

  if (view === 'lobby') return (
    <Lobby onRoomReady={handleRoomReady} onBack={() => setView('menu')} />
  );

  if (view === 'waiting-room' && room) return (
    <WaitingRoom
      roomId={room.roomId}
      playerId={room.playerId}
      initialPlayers={room.players}
      isHost={room.isHost}
      onGameStart={handleGameStart}
      onBack={handleLeaveMultiplayer}
    />
  );

  if (view === 'multiplayer-game' && room) return (
    <MultiplayerBoard
      roomId={room.roomId}
      playerId={room.playerId}
      initialPlayers={room.players}
      initialBoard={room.initialBoard}
      initialDeckSize={room.initialDeckSize}
      settings={settings}
      onMenu={handleLeaveMultiplayer}
    />
  );

  return <Menu
    onPlay={() => setView('game')}
    onMultiplayer={() => setView('lobby')}
    onHowToPlay={() => setView('how-to-play')}
    onSettings={() => setView('settings')}
  />;
}
