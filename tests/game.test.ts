import test from 'node:test';
import assert from 'node:assert/strict';
import {findShortestPath} from '../lib/algorithms/aStar';
import {locations,locationById} from '../data/locations';
import {edges,schoolGraph} from '../data/schoolGraph';
import {assignTreasures} from '../lib/game/assignTreasures';
import {newGame,scanMarker,nextTreasure} from '../lib/game/engine';
import {getClueMarkers} from '../lib/game/generateHints';
import {saveGame,loadGame} from '../services/gameStorage';
import {decodeMarker} from '../services/markerRecognition';
import QRCode from 'qrcode';

test('36 actual rooms and 4 virtual stair nodes; exact symmetric graph',()=>{assert.equal(locations.length,36);assert.equal(Object.keys(schoolGraph).length,40);assert.equal(edges.length,46);for(const [a,b,w] of edges)assert.ok(schoolGraph[b].some(e=>e.to===a&&e.weight===w));assert.equal(findShortestPath('과학실1','과학실2').distance,20);assert.equal(findShortestPath('전환반','진로활동실').distance,40);assert.equal(findShortestPath('중앙현관','식당').distance,40);assert.equal(findShortestPath('3-1','3-3').distance,16);assert.deepEqual(findShortestPath('없음','식당'),{path:[],distance:Infinity});});
test('A* agrees with independently computed all-pairs distances',()=>{const ids=Object.keys(schoolGraph);const d=Object.fromEntries(ids.map(a=>[a,Object.fromEntries(ids.map(b=>[b,a===b?0:Infinity]))]));for(const [a,b,w] of edges)d[a][b]=d[b][a]=w;for(const k of ids)for(const a of ids)for(const b of ids)d[a][b]=Math.min(d[a][b],d[a][k]+d[k][b]);for(const a of ids)for(const b of ids)assert.equal(findShortestPath(a,b).distance,d[a][b]);});
test('random treasures exclude start, duplicates, virtual nodes',()=>{for(const loc of locations)for(let i=0;i<20;i++){const t=assignTreasures(loc.id);assert.equal(new Set(t).size,3);assert.ok(t.every(id=>id!==loc.id&&locationById[id]));}});
test('wrong marker is immutable, clues unlock, three discoveries issue one persistent coupon',()=>{let game=newGame('길벗','중앙현관');game={...game,status:'hunting'};assert.equal(scanMarker(game,'WRONG').game,game);const route=findShortestPath('보건실','진로활동실');const clues=getClueMarkers(route);const clueGame={...game,treasures:['진로활동실','식당','도서관'],currentRoute:route,clueMarkers:clues};assert.equal(scanMarker(clueGame,clues[0]).game.hintStage,2);for(let i=0;i<3;i++){const r=scanMarker(game,locationById[game.treasures[i]].markerId);assert.equal(r.kind,'found');assert.equal(r.game.currentLocation,game.treasures[i]);assert.equal(scanMarker(r.game,locationById[game.treasures[i]].markerId).kind,'wrong');game=nextTreasure(r.game);}assert.equal(game.status,'complete');assert.match(game.coupon!.number,/^\d{6}$/);const store=new Map();Object.defineProperty(globalThis,'localStorage',{value:{getItem:(k:string)=>store.get(k)??null,setItem:(k:string,v:string)=>store.set(k,v)},configurable:true});saveGame(game);assert.deepEqual(loadGame(),game);assert.equal(loadGame()?.coupon?.number,game.coupon?.number);store.set('school-treasure-hunt-v1','broken');assert.equal(loadGame(),null);});
test('actual generated QR pixels decode to assigned marker id',()=>{const marker=locations[0].markerId;const qr=QRCode.create(marker,{errorCorrectionLevel:'M'});const scale=8,size=(qr.modules.size+8)*scale,data=new Uint8ClampedArray(size*size*4).fill(255);for(let y=0;y<qr.modules.size;y++)for(let x=0;x<qr.modules.size;x++)if(qr.modules.get(y,x))for(let yy=0;yy<scale;yy++)for(let xx=0;xx<scale;xx++){const offset=(((y+4)*scale+yy)*size+(x+4)*scale+xx)*4;data[offset]=data[offset+1]=data[offset+2]=0;}assert.equal(decodeMarker(data,size,size),marker);});

