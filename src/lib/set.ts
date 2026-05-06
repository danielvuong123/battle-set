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
