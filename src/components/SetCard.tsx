// src/components/SetCard.tsx
import type { SetCard as CardType } from '../lib/set';
import './SetCard.css';

export default function SetCard({ 
		card, 
		onClick, 
		selected 
	}: { 
		card: CardType; 
		onClick?: () => void; 
		selected?: boolean; 
	}) {
  return (
    <div className={`card ${selected ? 'selected' : ''}`} onClick={onClick}>
      {Array.from({ length: card.number }).map((_, i) => (
        <Symbol key={i} card={card} />
      ))}
    </div>
  );
}

function Symbol({ card }: { card: CardType }) {
  const { shape, color } = card;

  return (
    <svg className={`symbol ${color}`} viewBox="0 0 100 40">
      {shape === 'oval' && <ellipse cx="50" cy="20" rx="40" ry="15" />}
      {shape === 'diamond' && (
        <polygon points="50,5 90,20 50,35 10,20" />
      )}
      {shape === 'squiggle' && (
        <path d="M10 20 C 20 0, 80 40, 90 20 S 20 40, 10 20" />
      )}
    </svg>
  );
}
