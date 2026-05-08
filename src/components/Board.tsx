import { useEffect, useState } from 'react';

import SetCard from './SetCard';
import {
  generateDeck,
  isSet,
  hasSet,
  repairBoard,
} from '../lib/set';

import type { SetCard as CardType } from '../lib/set';

import './Board.css';

export default function Board() {
  const [deck, setDeck] = useState<CardType[]>([]);
  const [board, setBoard] = useState<CardType[]>([]);
  const [selected, setSelected] = useState<CardType[]>([]);
  const [score, setScore] = useState(0);
  const [message, setMessage] = useState('');

  useEffect(() => {
    startNewGame();
  }, []);

  function startNewGame() {
    let newDeck: CardType[] = [];
    let initialBoard: CardType[] = [];

    do {
      newDeck = generateDeck();
      initialBoard = newDeck.slice(0,12);
    } while (!hasSet(initialBoard));

    let remainingDeck = newDeck.slice(12);

    const repaired = repairBoard(
      initialBoard,
      remainingDeck
    )

    setBoard(repaired.board);
    setDeck(repaired.deck);
    setSelected([]);
    setScore(0);
    setMessage('');
  }

  function handleCardClick(card: CardType) {
    let nextSelection = [...selected];

    // deselect if already selected
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

    if (
      nextDeck.length === 0 && !hasSet(nextBoard)
    ) { 
      setMessage('Game Over');
    }
  }

  function evaluateSelection(cards: CardType[]) {
    const valid = isSet(cards);

    if (valid) {
      setScore(prev => prev + 1);
      setMessage('SET found!');

      const selectedIds = new Set(cards.map(c => c.id));

      const remainingBoard = board.filter(
        card => !selectedIds.has(card.id)
      );

      const replacementCards = deck.slice(0, 3);
      const updatedDeck = deck.slice(3);

      let nextBoard = [
        ...remainingBoard,
        ...replacementCards,
      ];

      let nextDeck = updatedDeck;

      while (
        !hasSet(nextBoard) && nextDeck.length >= 3
      ) {
        nextBoard = [
          ...nextBoard,
          ...nextDeck.slice(0,3),
        ];
      }

      nextDeck = nextDeck.slice(3);

      const repaired = repairBoard(
        nextBoard,
        nextDeck
      );

      setBoard(repaired.board);
      setDeck(repaired.deck);
    } else {
      setMessage('Not a set!');
    }

    setTimeout(() => {
      setSelected([]);
      setMessage('');
    }, 1000);
  }

  console.log("board:",board);
  return (
    <div>
      <div className="game-header">
        <h2>Score: {score}</h2>

        <button onClick={startNewGame}>
          New Game
        </button>
      </div>

      {message && (
        <div className="message">
          {message}
        </div>
      )}

      <div className="board">
        {(board ?? []).map(card => (
          <SetCard
            key={card.id}
            card={card}
            onClick={() => handleCardClick(card)}
            selected={selected.some(
              c => c.id === card.id
            )}
          />
        ))}
      </div>
    </div>
  );
}
