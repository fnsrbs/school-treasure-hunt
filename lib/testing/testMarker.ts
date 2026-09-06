import type { GameState } from '@/types/game';
import { locationById } from '@/data/locations';
import { scanMarker } from '@/lib/game/engine';

export const TEST_MARKER_ID = 'SCHOOL-TEST-PROGRESSION-V1';

// Test-only adapter. Real marker matching remains exclusively in engine.ts.
export function scanWithTestMarker(game: GameState, markerId: string, enabled: boolean): ReturnType<typeof scanMarker> {
  if (!enabled || markerId !== TEST_MARKER_ID) return scanMarker(game, markerId);
  if (game.status !== 'hunting') return { kind: 'wrong', game };
  if (game.hintStage < 3) {
    return { kind: 'clue', game: { ...game, hintStage: game.hintStage + 1, screen: 'hint' } };
  }
  return scanMarker(game, locationById[game.treasures[game.currentTreasure]].markerId);
}
