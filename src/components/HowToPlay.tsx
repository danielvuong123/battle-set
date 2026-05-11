import './HowToPlay.css';

type HowToPlayProps = {
  onBack: () => void;
};

type CardAttribs = {
  number: 1 | 2 | 3;
  shape: 'oval' | 'diamond' | 'squiggle';
  color: 'red' | 'green' | 'purple';
  shading: 'solid' | 'striped' | 'open';
};

const COLOR_HEX: Record<string, string> = {
  red: '#d33',
  green: '#2a8',
  purple: '#7a3db8',
};

function ExampleCard({ number, shape, color, shading }: CardAttribs) {
  const hex = COLOR_HEX[color];
  const patternId = `htp-${color}-${shape}-${number}-${shading}`;
  const fill =
    shading === 'solid' ? hex :
    shading === 'striped' ? `url(#${patternId})` :
    'none';

  return (
    <div className="example-card">
      <div className="example-symbol-row">
        {Array.from({ length: number }).map((_, i) => (
          <svg key={i} className="example-symbol" viewBox="0 0 100 200" preserveAspectRatio="xMidYMid meet">
            <defs>
              <pattern id={patternId} patternUnits="userSpaceOnUse" width="8" height="8">
                <line x1="0" y1="0" x2="0" y2="8" stroke={hex} strokeWidth="3" />
              </pattern>
            </defs>
            {shape === 'oval' && (
              <ellipse cx="50" cy="100" rx="35" ry="85" fill={fill} stroke={hex} strokeWidth="3" />
            )}
            {shape === 'diamond' && (
              <polygon points="50,0 100,100 50,200 0,100" fill={fill} stroke={hex} strokeWidth="3" />
            )}
            {shape === 'squiggle' && (
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
    </div>
  );
}

type ExampleGroupProps = {
  cards: CardAttribs[];
  label: string;
  valid?: boolean;
};

function ExampleGroup({ cards, label, valid }: ExampleGroupProps) {
  return (
    <div className="example-group">
      <div className="example-cards">
        {cards.map((card, i) => <ExampleCard key={i} {...card} />)}
      </div>
      <p className={`example-label ${valid === true ? 'valid' : valid === false ? 'invalid' : ''}`}>
        {valid === true && '✓ '}{valid === false && '✗ '}{label}
      </p>
    </div>
  );
}

export default function HowToPlay({ onBack }: HowToPlayProps) {
  return (
    <div className="how-to-play">
      <div className="htp-header">
        <button onClick={onBack}>← Back</button>
        <h1>How to Play</h1>
      </div>

      <div className="htp-content">

        <section className="htp-section">
          <h2>The Cards</h2>
          <p>
            SET is played with 81 unique cards. Every card has four attributes,
            each with three possible values:
          </p>
          <div className="htp-attributes">
            <div className="htp-attr">
              <strong>Number</strong>
              <span>1, 2, or 3 symbols</span>
            </div>
            <div className="htp-attr">
              <strong>Shape</strong>
              <span>Oval, Diamond, or Squiggle</span>
            </div>
            <div className="htp-attr">
              <strong>Color</strong>
              <span>Red, Green, or Purple</span>
            </div>
            <div className="htp-attr">
              <strong>Shading</strong>
              <span>Solid, Striped, or Open</span>
            </div>
          </div>
        </section>

        <section className="htp-section">
          <h2>What is a SET?</h2>
          <p>
            A <strong>SET</strong> is a group of three cards where, for each of the four attributes,
            the values across the three cards are either <strong>all the same</strong> or{' '}
            <strong>all different</strong>. Never two the same and one different.
          </p>

          <ExampleGroup
            cards={[
              { number: 1, shape: 'oval',     color: 'red',    shading: 'solid'   },
              { number: 2, shape: 'diamond',  color: 'green',  shading: 'striped' },
              { number: 3, shape: 'squiggle', color: 'purple', shading: 'open'    },
            ]}
            label="All different on every attribute — a valid SET"
            valid={true}
          />

          <ExampleGroup
            cards={[
              { number: 2, shape: 'diamond', color: 'red',    shading: 'solid' },
              { number: 2, shape: 'diamond', color: 'green',  shading: 'solid' },
              { number: 2, shape: 'diamond', color: 'purple', shading: 'solid' },
            ]}
            label="Number, shape, and shading all the same — color all different — a valid SET"
            valid={true}
          />

          <ExampleGroup
            cards={[
              { number: 1, shape: 'oval', color: 'red',   shading: 'solid' },
              { number: 2, shape: 'oval', color: 'red',   shading: 'solid' },
              { number: 2, shape: 'oval', color: 'green', shading: 'solid' },
            ]}
            label="Number is 1, 2, 2 — not all the same and not all different — not a SET"
            valid={false}
          />
        </section>

        <section className="htp-section">
          <h2>How to Play</h2>
          <ol className="htp-steps">
            <li>12 cards are dealt face up on the board</li>
            <li>Scan the board for three cards that form a valid SET</li>
            <li>Click each card to select it — selected cards glow purple</li>
            <li>If the three cards form a valid SET, they are removed and replaced from the deck</li>
            <li>If no SET exists on the board, three more cards are added automatically</li>
            <li>The game ends when the deck runs out and no more SETs remain on the board</li>
          </ol>
        </section>

        <section className="htp-section">
          <h2>Controls</h2>
          <div className="htp-controls">
            <div className="htp-control">
              <strong>Hint</strong>
              <span>Highlights two cards that belong to a valid SET — you find the third</span>
            </div>
            <div className="htp-control">
              <strong>Shuffle</strong>
              <span>Rearranges the board without changing which cards are showing</span>
            </div>
            <div className="htp-control">
              <strong>New Game</strong>
              <span>Starts a fresh game with a new shuffled deck</span>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
