import test from 'node:test';
import assert from 'node:assert/strict';
import { newGame, nextTreasure, scanMarker } from '../lib/game/engine';
import { TEST_MARKER_ID, scanWithTestMarker } from '../lib/testing/testMarker';
import { locationById } from '../data/locations';

test('one test marker unlocks both hints and collects all three treasures without skipping', () => {
 let game = { ...newGame('테스트', '중앙현관'), status: 'hunting' as const };
 for (let i = 0; i < 3; i++) {
  const before = game;
  for (const stage of [2,3]) {
   const result = scanWithTestMarker(game, TEST_MARKER_ID, true);
   assert.equal(result.kind, 'clue');
   assert.equal(result.game.hintStage, stage);
   assert.deepEqual(result.game.collected, before.collected);
   assert.equal(result.game.currentLocation, before.currentLocation);
   game = result.game as typeof game;
  }
  const found = scanWithTestMarker(game, TEST_MARKER_ID, true);
  assert.equal(found.kind, 'found');
  assert.equal(found.game.collected.length, i+1);
  assert.equal(scanWithTestMarker(found.game, TEST_MARKER_ID, true).game, found.game);
  game = nextTreasure(found.game) as typeof game;
 }
 assert.equal(game.status, 'complete');
 assert.match(game.coupon!.number, /^\d{6}$/);
 assert.equal(scanWithTestMarker(game, TEST_MARKER_ID, true).game, game);
});
test('disabled test marker is rejected and real marker matching stays unchanged', () => {
 const game = {...newGame('테스트','중앙현관'),status:'hunting' as const};
 assert.equal(scanWithTestMarker(game,TEST_MARKER_ID,false).game,game);
 assert.equal(scanWithTestMarker(game,TEST_MARKER_ID,false).kind,'wrong');
 const real = locationById[game.treasures[0]].markerId;
 assert.deepEqual(scanWithTestMarker(game,real,true),scanMarker(game,real));
 assert.equal(scanWithTestMarker({...game,hintStage:2},TEST_MARKER_ID,true).game.hintStage,3);
});

test('printable test PNG decodes through the real camera decoder', async () => {
 const { createRequire } = await import('node:module');
 const { readFileSync } = await import('node:fs');
 const { decodeMarker } = await import('../services/markerRecognition');
 const require = createRequire(import.meta.url);
 const qrRequire = createRequire(require.resolve('qrcode'));
 const { PNG } = qrRequire('pngjs');
 const png = PNG.sync.read(readFileSync('public/markers/test/marker.png'));
 assert.equal(decodeMarker(new Uint8ClampedArray(png.data), png.width, png.height), TEST_MARKER_ID);
});
