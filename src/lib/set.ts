// src/lib/set.ts
import type { SetCard } from './set';

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

function isValidTriple(a: string, b: string, c: string): boolean {
  const allSame = a === b && b === c;
  const allDifferent = a !== b && a !== c && b !== c;
  return allSame || allDifferent;
}

export function isSet(cards: SetCard[]): boolean {
  if (cards.length !== 3) return false;

  return (
    isValidTriple(cards[0].shape, cards[1].shape, cards[2].shape) &&
    isValidTriple(cards[0].color, cards[1].color, cards[2].color) &&
    isValidTriple(cards[0].shading, cards[1].shading, cards[2].shading) &&
    isValidTriple(cards[0].number.toString(), cards[1].number.toString(), cards[2].number.toString())
  );
}

export function generateDeck(): SetCard[] {
  const deck: SetCard[] = [];

  for (const shape of shapes) {
    for (const color of colors) {
      for (const shading of shadings) {
        for (const number of numbers) {
          deck.push({
            id: `${shape}-${color}-${shading}-${number}`,
            shape,
            color,
            shading,
            number,
          });
        }
      }
    }
  }

  return deck;
}

export function getInitialBoard(): SetCard[] {
  const deck = generateDeck();
  return deck.sort(() => Math.random() - 0.5).slice(0, 12);
}
