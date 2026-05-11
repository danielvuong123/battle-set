import { useState } from 'react';
import { type Settings, DEFAULT_SETTINGS } from './types';
import Board from './components/Board';
import Menu from './components/Menu';
import HowToPlay from './components/HowToPlay';
import SettingsPage from './components/Settings';

type View = 'menu' | 'game' | 'how-to-play' | 'settings';

export default function App() {
  const [view, setView] = useState<View>('menu');
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);

  if (view === 'game') return <Board settings={settings} onMenu={() => setView('menu')} />;
  if (view === 'how-to-play') return <HowToPlay onBack={() => setView('menu')} />;
  if (view === 'settings') return <SettingsPage settings={settings} onChange={setSettings} onBack={() => setView('menu')} />;
  return <Menu onPlay={() => setView('game')} onHowToPlay={() => setView('how-to-play')} onSettings={() => setView('settings')} />;
}
