import type { LocationId } from './treasure-data';

export type SavedGame = {
  nickname: string;
  currentLocation: LocationId;
  assignedTreasures: LocationId[];
  collectedTreasures?: LocationId[];
  step: number;
  hintLevel: number;
  coupon?: string;
  screen: string;
};

const key = 'school-treasure-hunt-game';

export const loadGame = (): SavedGame | null => {
  try { return JSON.parse(window.localStorage.getItem(key) ?? 'null'); } catch { return null; }
};
export const saveGame = (game: SavedGame) => window.localStorage.setItem(key, JSON.stringify(game));
export const clearGame = () => window.localStorage.removeItem(key);
