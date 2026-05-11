import './Menu.css';

type MenuProps = {
  onPlay: () => void;
  onHowToPlay: () => void;
  onSettings: () => void;
};

export default function Menu({ onPlay, onHowToPlay, onSettings }: MenuProps) {
  return (
    <div className="menu">
      <div className="menu-content">
        <h1 className="menu-title">SET</h1>
        <p className="menu-subtitle">The pattern recognition card game</p>
        <div className="menu-buttons">
          <button className="menu-btn-primary" onClick={onPlay}>Single Player</button>
          <button onClick={onHowToPlay}>How to Play</button>
          <button onClick={onSettings}>Settings</button>
        </div>
      </div>
    </div>
  );
}
