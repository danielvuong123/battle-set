// src/components/Board.tsx
import { useEffect, useState } from 'react';
import { getInitialBoard } from '../lib/set';
import type { SetCard as CardType } from '../lib/set';
import SetCard from './SetCard';
import './Board.css';

export default function Board() {
  const [cards, setCards] = useState<CardType[]>([]);

  useEffect(() => {
    setCards(getInitialBoard());
  }, []);

  return (
    <div className="board">
      {cards.map(card => (
        <SetCard key={card.id} card={card} />
      ))}
    </div>
  );
}
