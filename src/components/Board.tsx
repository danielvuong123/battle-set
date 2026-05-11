import { useEffect, useRef, useState } from 'react';

import SetCard from './SetCard';
import {
  type SetCard as CardType,
  generateDeck,
  isSet,
  hasSet,
  findSets,
  ensurePlayableBoard,
  shuffle,
} from '../lib/set';
import { type Settings, DEFAULT_SETTINGS } from '../types';

import './Board.css';

const COLOR_NAMES: CardType['color'][] = ['red', 'green', 'purple'];

function createInitialGame(): { deck: CardType[]; board: CardType[] } {
  let newDeck: CardType[];
  let initialBoard: CardType[];

  do {
    newDeck = generateDeck();
    initialBoard = newDeck.slice(0, 12);
  } while (!hasSet(initialBoard));

  return {
    board: initialBoard,
    deck: newDeck.slice(12),
  };
}

function MiniCard({ card, colorMap }: { card: CardType; colorMap: Record<string, string> }) {
  const hex = colorMap[card.color];
  const patternId = `mini-striped-${card.color}`;
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

type BoardProps = {
  onMenu?: () => void;
  settings?: Settings;
};

export default function Board({ onMenu, settings = DEFAULT_SETTINGS }: BoardProps) {
  const colorMap: Record<string, string> = Object.fromEntries(
    COLOR_NAMES.map((name, i) => [name, settings.colors[i]])
  );

  const [{ deck, board }, setGameData] = useState(createInitialGame);
  const [selected, setSelected] = useState<CardType[]>([]);
  const [score, setScore] = useState(0);
  const [message, setMessage] = useState('');
  const [gameOver, setGameOver] = useState(false);
  const [foundSets, setFoundSets] = useState<CardType[][]>([]);
  const [animatingOut, setAnimatingOut] = useState<string[]>([]);
  const [hinted, setHinted] = useState<string[]>([]);
  const historyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (historyRef.current) {
      historyRef.current.scrollTop = historyRef.current.scrollHeight;
    }
  }, [foundSets]);

  function shuffleBoard() {
    if (animatingOut.length > 0) return;
    setHinted([]);
    setGameData(prev => ({ ...prev, board: shuffle(prev.board) }));
  }

  function startNewGame() {
    setGameData(createInitialGame());
    setSelected([]);
    setScore(0);
    setMessage('');
    setGameOver(false);
    setFoundSets([]);
    setAnimatingOut([]);
    setHinted([]);
  }

  function handleHint() {
    const sets = findSets(board);
    if (sets.length === 0) return;
    const pick = sets[Math.floor(Math.random() * sets.length)];
    setHinted([pick[0].id, pick[1].id]);
  }

  function handleCardClick(card: CardType) {
    if (gameOver || animatingOut.length > 0) return;

    let nextSelection = [...selected];

    if (nextSelection.some(c => c.id === card.id)) {
      nextSelection = nextSelection.filter(c => c.id !== card.id);
    } else {
      if (nextSelection.length >= 3) return;
      nextSelection.push(card);
    }

    setSelected(nextSelection);

    if (nextSelection.length === 3) {
      evaluateSelection(nextSelection);
    }
  }

  function evaluateSelection(cards: CardType[]) {
    setHinted([]);
    if (!isSet(cards)) {
      setMessage('Not a set!');
      setTimeout(() => {
        setSelected([]);
        setMessage('');
      }, 1000);
      return;
    }

    setScore(prev => prev + 1);
    setFoundSets(prev => [...prev, cards]);
    setAnimatingOut(cards.map(c => c.id));
    setMessage('SET found!');

    setTimeout(() => {
      const selectedIds = new Set(cards.map(c => c.id));
      let updatedDeck = [...deck];
      const isExpanded = board.length > 12;

      const updatedBoard = board
        .map(card => {
          if (!selectedIds.has(card.id)) return card;
          if (isExpanded) return null;
          return updatedDeck.shift() ?? null;
        })
        .filter((c): c is CardType => c !== null);

      const result = ensurePlayableBoard(updatedBoard, updatedDeck);
      setGameData({ board: result.board, deck: result.deck });
      setAnimatingOut([]);
      setSelected([]);

      const isGameOver = result.deck.length === 0 && !hasSet(result.board);
      if (isGameOver) {
        setGameOver(true);
        setMessage('Game Over');
      } else {
        setMessage('');
      }
    }, 500);
  }

  return (
    <div>
      <div className="game-header">
        <div className="game-stats">
          {onMenu && <button onClick={onMenu}>← Menu</button>}
          <h2>Score: {score}</h2>
          <span className="deck-counter">Deck: {deck.length}</span>
        </div>
        <div className="header-buttons">
          <button onClick={handleHint} disabled={gameOver || animatingOut.length > 0}>Hint</button>
          <button onClick={shuffleBoard} disabled={gameOver || animatingOut.length > 0}>Shuffle</button>
          <button onClick={startNewGame}>New Game</button>
        </div>
      </div>

      <div className="message-area">
        {message && <div className="message">{message}</div>}
      </div>

      <div className="board" data-layout={settings.layout}>
        {board.map(card => (
          <SetCard
            key={card.id}
            card={card}
            onClick={() => handleCardClick(card)}
            selected={selected.some(c => c.id === card.id)}
            animating={animatingOut.includes(card.id)}
            hinted={hinted.includes(card.id)}
            colorMap={colorMap}
          />
        ))}
      </div>

      {foundSets.length > 0 && (
        <div className="found-set-history" ref={historyRef}>
          {foundSets.map((set, i) => (
            <div key={i} className="found-set-entry">
              {set.map(card => (
                <MiniCard key={card.id} card={card} colorMap={colorMap} />
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
