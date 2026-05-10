import { useState } from 'react';

import SetCard from './SetCard';
import {
  type SetCard as CardType,
  generateDeck,
  isSet,
  hasSet,
  ensurePlayableBoard,
} from '../lib/set';

import './Board.css';

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

export default function Board() {
  const [{ deck, board }, setGameData] = useState(createInitialGame);
  const [selected, setSelected] = useState<CardType[]>([]);
  const [score, setScore] = useState(0);
  const [message, setMessage] = useState('');
  const [gameOver, setGameOver] = useState(false);

  function startNewGame() {
    setGameData(createInitialGame());
    setSelected([]);
    setScore(0);
    setMessage('');
    setGameOver(false);
  }

  function handleCardClick(card: CardType) {
    if (gameOver) return;

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
    if (!isSet(cards)) {
      setMessage('Not a set!');
      setTimeout(() => {
        setSelected([]);
        setMessage('');
      }, 1000);
      return;
    }

    setScore(prev => prev + 1);

    const selectedIds = new Set(cards.map(c => c.id));
    let updatedBoard = board.filter(card => !selectedIds.has(card.id));
    let updatedDeck = [...deck];

    if (updatedBoard.length < 12 && updatedDeck.length > 0) {
      updatedBoard.push(
        ...updatedDeck.splice(0, 12 - updatedBoard.length)
      );
    }

    const result = ensurePlayableBoard(updatedBoard, updatedDeck);
    setGameData({ board: result.board, deck: result.deck });

    const isGameOver = result.deck.length === 0 && !hasSet(result.board);

    if (isGameOver) {
      setGameOver(true);
      setMessage('Game Over');
      setTimeout(() => setSelected([]), 1000);
    } else {
      setMessage('SET found!');
      setTimeout(() => {
        setSelected([]);
        setMessage('');
      }, 1000);
    }
  }

  return (
    <div>
      <div className="game-header">
        <h2>Score: {score}</h2>
        <button onClick={startNewGame}>New Game</button>
      </div>

      {message && (
        <div className="message">{message}</div>
      )}

      <div className="board">
        {board.map(card => (
          <SetCard
            key={card.id}
            card={card}
            onClick={() => handleCardClick(card)}
            selected={selected.some(c => c.id === card.id)}
          />
        ))}
      </div>
    </div>
  );
}
