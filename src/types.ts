export type Layout = '2x6' | '3x4' | '4x3' | '6x2';

export type Settings = {
  colors: [string, string, string];
  layout: Layout;
};

export const DEFAULT_SETTINGS: Settings = {
  colors: ['#d33', '#2a8', '#7a3db8'],
  layout: '4x3',
};
