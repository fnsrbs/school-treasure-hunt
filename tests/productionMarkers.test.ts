import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {locations,locationById} from '../data/locations';
import {newGame,scanMarker,nextTreasure} from '../lib/game/engine';
import {decodeMarker} from '../services/markerRecognition';

test('retired generic marker cannot advance any hint or collect any treasure',()=>{
 for(const start of locations){
  let game={...newGame('운영검증',start.id),status:'hunting' as const};
  for(let n=0;n<3;n++){
   for(const hintStage of [1,2,3]){
    const state={...game,hintStage};const result=scanMarker(state,'SCHOOL-TEST-PROGRESSION-V1');
    assert.equal(result.kind,'wrong');assert.equal(result.game,state);
   }
   while(game.hintStage<3&&game.clueMarkers[game.hintStage-1]){
    const result=scanMarker(game,game.clueMarkers[game.hintStage-1]);
    assert.equal(result.kind,'clue');game={...result.game,status:'hunting'};
   }
   const found=scanMarker(game,locationById[game.treasures[n]].markerId);
   assert.equal(found.kind,'found');assert.equal(found.game.collected.length,n+1);
   assert.equal(scanMarker(found.game,locationById[game.treasures[n]].markerId).game,found.game);
   const next=nextTreasure(found.game);
   if(n===2){assert.equal(next.status,'complete');assert.match(next.coupon!.number,/^\d{6}$/);}
   else game={...next,status:'hunting'};
  }
 }
});

test('every distributed room QR decodes to its assigned location',()=>{
 const require=createRequire(import.meta.url);const {PNG}=createRequire(require.resolve('qrcode'))('pngjs');
 for(const location of locations){
  const png=PNG.sync.read(readFileSync(`public/markers/${location.markerId}.png`));
  assert.equal(decodeMarker(new Uint8ClampedArray(png.data),png.width,png.height),location.markerId);
 }
});
