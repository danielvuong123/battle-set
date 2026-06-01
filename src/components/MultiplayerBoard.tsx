import { useEffect, useRef, useState } from 'react';
import SetCard from './SetCard';
import { type SetCard as CardType } from '../lib/set';
import { useMultiplayerGame, type MPPlayer } from '../hooks/useMultiplayerGame';
import { type Settings, DEFAULT_SETTINGS } from '../types';
import './Board.css';
import './MultiplayerBoard.css';

const COLOR_NAMES: CardType['color'][] = ['red', 'green', 'purple'];

function MiniCard({ card, colorMap }: { card: CardType; colorMap: Record<string, string> }) {
  const hex = colorMap[card.color];
  const patternId = `mp-mini-striped-${card.color}`;
  const fill =
    card.shading === 'solid' ? hex :
    card.shading === 'striped' ? `url(#${patternId})` :
    'white';

  return (
    <div className="mini-card">
      {Array.from({ length: card.number }).map((_, i) => (
        <svg key={i} className="mini-symbol" viewBox="0 0 100 200" preserveAspectRatio="xMidYMid meet">
          <defs>
            <pattern id={patternId} patternUnits="userSpaceOnUse" width="8" height="8">
              <line x1="0" y1="0" x2="0" y2="8" stroke={hex} strokeWidth="3" />
            </pattern>
          </defs>
          {card.shape === 'oval' && (
            <ellipse cx="50" cy="100" rx="35" ry="85" fill={fill} stroke={hex} strokeWidth="3" />
          )}
          {card.shape === 'diamond' && (
            <polygon points="50,0 100,100 50,200 0,100" fill={fill} stroke={hex} strokeWidth="3" />
          )}
          {card.shape === 'squiggle' && (
            <path
              d="M50 0 C 20 40, 20 60, 50 100 C 80 140, 80 160, 50 200 C 20 160, 20 140, 50 100 C 80 60, 80 40, 50 0"
              fill={fill}
              stroke={hex}
              strokeWidth="3"
            />
          )}
        </svg>
      ))}
    </div>
  );
}

type MultiplayerBoardProps = {
  roomId: string;
  playerId: string;
  initialPlayers: MPPlayer[];
  initialBoard: CardType[];
  initialDeckSize: number;
  settings?: Settings;
  onMenu: () => void;
};

export default function MultiplayerBoard({
  roomId,
  playerId,
  initialPlayers,
  initialBoard,
  initialDeckSize,
  settings = DEFAULT_SETTINGS,
  onMenu,
}: MultiplayerBoardProps) {
  const colorMap: Record<string, string> = Object.fromEntries(
    COLOR_NAMES.map((name, i) => [name, settings.colors[i]])
  );

  const { game, players: hookPlayers, lastClaim, claimSet, setPlayers } = useMultiplayerGame(
    roomId,
    initialBoard,
    initialDeckSize,
  );

  const [seeded, setSeeded] = useState(false);
  if (!seeded && hookPlayers.length === 0 && initialPlayers.length > 0) {
    setSeeded(true);
    setPlayers(initialPlayers);
  }

  const players = hookPlayers.length > 0 ? hookPlayers : initialPlayers;
  const me = players.find(p => p.id === playerId);
  const opponents = players.filter(p => p.id !== playerId);

  const [selected, setSelected] = useState<CardType[]>([]);
  const [animatingOut, setAnimatingOut] = useState<string[]>([]);

  const historyRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (historyRef.current) {
      historyRef.current.scrollTop = historyRef.current.scrollHeight;
    }
  }, [game.foundSets]);

  function handleCardClick(card: CardType) {
    if (game.gameOver || animatingOut.length > 0) return;

    let next = [...selected];
    if (next.some(c => c.id === card.id)) {
      next = next.filter(c => c.id !== card.id);
    } else {
      if (next.length >= 3) return;
      next.push(card);
    }

    setSelected(next);

    if (next.length === 3) {
      const ids = next.map(c => c.id);
      setAnimatingOut(ids);
      claimSet(ids);
      setTimeout(() => {
        setSelected([]);
        setAnimatingOut([]);
      }, 500);
    }
  }

  const myScore = game.scores[playerId] ?? 0;

  return (
    <div>
      <div className="game-header">
        <div className="game-stats">
          <button onClick={onMenu}>← Menu</button>
          <div className="mp-my-info">
            <span className="mp-my-name">{me?.name ?? 'You'}</span>
            <span className="mp-my-score">{myScore} sets</span>
          </div>
          <span className="deck-counter">Deck: {game.deckSize}</span>
        </div>

        <div className="mp-scoreboard">
          {opponents.map(p => (
            <div key={p.id} className="opponent-tile">
              <span className="opponent-name">{p.name}</span>
              <span className="opponent-score-num">{game.scores[p.id] ?? 0}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="message-area">
        {lastClaim && (
          <div className={`message ${lastClaim.valid ? 'msg-success' : 'msg-fail'}`}>
            {lastClaim.valid
              ? `${lastClaim.playerName} found a SET!`
              : `${lastClaim.playerName} — not a set!`}
          </div>
        )}
        {game.gameOver && game.winner && (
          <div className="message msg-gameover">
            Game Over — {game.winner.name} wins!
          </div>
        )}
      </div>

      <div className="board" data-layout={settings.layout}>
        {game.board.map(card => (
          <SetCard
            key={card.id}
            card={card}
            onClick={() => handleCardClick(card)}
            selected={selected.some(c => c.id === card.id)}
            animating={animatingOut.includes(card.id)}
            colorMap={colorMap}
          />
        ))}
      </div>

      {game.foundSets.length > 0 && (
        <div className="found-set-history" ref={historyRef}>
          {game.foundSets.map((entry, i) => (
            <div key={i} className="found-set-entry mp-found-entry">
              <span className={`mp-history-name ${entry.playerId === playerId ? 'mp-history-you' : ''}`}>
                {entry.playerId === playerId ? 'You' : entry.playerName}
              </span>
              {entry.cards.map(card => (
                <MiniCard key={card.id} card={card} colorMap={colorMap} />
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
