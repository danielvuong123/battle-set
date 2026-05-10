// src/components/SetCard.tsx
import type { SetCard as CardType } from '../lib/set';
import './SetCard.css';

type SetCardProps = {
  card: CardType;
  onClick: () => void;
  selected: boolean;
  animating?: boolean;
  hinted?: boolean;
};

export default function SetCard({ card, onClick, selected, animating, hinted }: SetCardProps) {
  return (
    <div
      className={`card${selected ? ' selected' : ''}${animating ? ' animating-out' : ''}${hinted ? ' hinted' : ''}`}
      onClick={onClick}
    >
      <div className="symbol-row">
        {Array.from({ length: card.number }).map((_, i) => (
          <Symbol key={i} card={card} />
        ))}
      </div>
    </div>
  );
}

function Symbol({ card }: { card: CardType }) {
  const { shape, color, shading } = card;
  const patternId = `striped-${color}`;
  const fill =
    shading === 'solid'
      ? color
      : shading === 'striped'
      ? `url(#${patternId})`
      : 'white';

  return (
    <svg
      className="symbol"
      viewBox="0 0 100 200"
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <pattern
          id={patternId}
          patternUnits="userSpaceOnUse"
          width="8"
          height="8"
          patternTransform="rotate(0)"
        >
          <line
            x1="0"
            y1="0"
            x2="0"
            y2="8"
            stroke={color}
            strokeWidth="3"
          />
        </pattern>
      </defs>

      {shape === 'oval' && (
      <ellipse
        cx="50"
        cy="100"
        rx="35"
        ry="85"
        fill={fill}
        stroke={color}
        strokeWidth="3"
      />
      )}

      {shape === 'diamond' && (
        <polygon
          points="
            50,0
            100,100
            50,200
            0,100
          "
          fill={fill}
          stroke={color}
          strokeWidth="3"
        /> 
      )}

      {shape === 'squiggle' && (
       <path
         d="
           M50 0
           C 20 40, 20 60, 50 100
           C 80 140, 80 160, 50 200
           C 20 160, 20 140, 50 100
           C 80 60, 80 40, 50 0
         "
         fill={fill}
         stroke={color}
         strokeWidth="3"
       /> 
      )}
    </svg>
  );
}
