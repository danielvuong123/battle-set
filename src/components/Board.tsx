// src/components/Board.tsx
import { useEffect, useState } from 'react';
import { getInitialBoard } from '../lib/set';
import type { SetCard as CardType } from '../lib/set';
import SetCard from './SetCard';
import './Board.css';




export default function Board() {
  const [cards, setCards] = useState<CardType[]>([]);
  const [selected, setSelected] =  useState<CardType[]>([]);

  useEffect(() => {
    setCards(getInitialBoard());
  }, []);

  function handleCardClick(card: CardType) {
    let next = [...selected];
  
    // toggle selection
    if (next.find(c => c.id === card.id)) {
      next = next.filter(c => c.id !== card.id);
    } else {
      next.push(card);
    }
  
    // max 3 cards
    if (next.length > 3) return;
  
    setSelected(next);
  
    if (next.length === 3) {
      const valid = isSet(next);
  
      console.log(valid ? "SET FOUND" : "NOT A SET");
  
      // reset after short delay
      setTimeout(() => setSelected([]), 500);
    }
  }

  return (
    <div className="board">
      {cards.map(card => (
	<SetCard
	  key={card.id}
	  card={card}
	  onClick={() => handleCardClick(card)}
	  selected={selected.some(c => c.id === card.id)}
	/>
      ))}
    </div>
  );
}
