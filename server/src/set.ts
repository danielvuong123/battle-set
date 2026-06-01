// src/lib/set.ts

export type Shape = 'oval' | 'diamond' | 'squiggle';
export type Color = 'red' | 'green' | 'purple';
export type Shading = 'solid' | 'striped' | 'open';

export interface SetCard {
  id: string;
  number: 1 | 2 | 3;
  shape: Shape;
  color: Color;
  shading: Shading;
}

const shapes: Shape[] = ['oval', 'diamond', 'squiggle'];
const colors: Color[] = ['red', 'green', 'purple'];
const shadings: Shading[] = ['solid', 'striped', 'open'];
const numbers = [1, 2, 3] as const;

export function generateDeck(): SetCard[] {
  const deck: SetCard[] = [];

  for (const shape of shapes) {
    for (const color of colors) {
      for (const shading of shadings) {
        for (const number of numbers) {
          deck.push({
            id:`${shape}-${color}-${shading}-${number}`, 
            shape,
            color,
            shading,
            number,
          });
        }
      }
    }
  }

  return shuffle(deck);
}

export function shuffle<T>(array: T[]): T[] {
  const copy = [...array];

  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));

    [copy[i], copy[j]] = [copy[j], copy[i]];
  }

  return copy;
}

function isValidTriple(a: unknown, b: unknown, c: unknown): boolean {
  return (
    (a === b && b === c) ||
    (a !== b && a !== c && b !== c)
  );
}

export function isSet(cards: SetCard[]): boolean {
  if (cards.length !== 3) return false;

  const [a, b, c] = cards;

  return (
    isValidTriple(a.shape, b.shape, c.shape) &&
    isValidTriple(a.color, b.color, c.color) &&
    isValidTriple(a.shading, b.shading, c.shading) &&
    isValidTriple(a.number, b.number, c.number)
  );
}

export function findSets(board: SetCard[]): SetCard[][] {
  const sets: SetCard[][] = [];

  for (let i = 0; i < board.length; i++) {
    for (let j = i + 1; j < board.length; j++) {
      for (let k = j + 1; k < board.length; k++) {
        const candidate = [
          board[i],
          board[j],
          board[k],
        ];

        if (isSet(candidate)) {
          sets.push(candidate);
        }
      }
    }
  }

  return sets;
}

export function hasSet(board: SetCard[]): boolean {
  return findSets(board).length > 0;
}

export function hasDuplicateCards(
  board: SetCard[]
): boolean {
  const ids = board.map(card => card.id);

  return new Set(ids).size !== ids.length;
}

export function repairBoard(
  board: SetCard[],
  deck: SetCard[]
): {
  board: SetCard[];
  deck: SetCard[];
} {
  let nextBoard = [...board];
  let nextDeck = [...deck];

  // remove duplicates
  const seen = new Set<string>();

  nextBoard = nextBoard.map(card => {
    if (!seen.has(card.id)) {
      seen.add(card.id);
      return card;
    }

    // replace duplicate card
    const replacement = nextDeck.shift();

    if (!replacement) {
      return card;
    }

    seen.add(replacement.id);

    return replacement;
  });

    return {
      board: nextBoard,
      deck: nextDeck,
    };
  }

export function validateBoard(
  board: SetCard[]
): void {
  if (hasDuplicateCards(board)) {
    throw new Error(
      'Board contains duplicate cards'
    );
  }

  if (!hasSet(board)) {
    throw new Error(
      'Board contains no valid sets'
    );
  }
}

export function ensurePlayableBoard(
  board: SetCard[],
  deck: SetCard[]
): {
  board: SetCard[];
  deck: SetCard[];
} {
  let nextBoard = [...board];
  let nextDeck = [...deck];

  while (
    !hasSet(nextBoard) &&
    nextDeck.length >= 3
  ) {
    nextBoard.push(...nextDeck.splice(0, 3));
  }

  return {
    board: nextBoard,
    deck: nextDeck,
  };
}
