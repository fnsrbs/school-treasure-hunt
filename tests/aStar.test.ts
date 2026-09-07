import test from 'node:test';
import assert from 'node:assert/strict';
import { findShortestPath, estimateDistance, heuristicScale } from '../lib/algorithms/aStar';
import { schoolGraph, edges } from '../data/schoolGraph';
import { locations, locationById } from '../data/locations';
import { generateHints, getClueMarkers } from '../lib/game/generateHints';
import { newGame, nextTreasure, scanMarker } from '../lib/game/engine';

test('coordinate heuristic is positive, admissible and consistent for all destinations', () => {
 assert.ok(heuristicScale > 0 && Number.isFinite(heuristicScale));
 assert.ok(estimateDistance('중앙현관','음악실') > 0);
 for(const target of Object.keys(schoolGraph)) {
  assert.equal(estimateDistance(target,target),0);
  for(const node of Object.keys(schoolGraph)) assert.ok(estimateDistance(node,target) <= findShortestPath(node,target).distance + 1e-9);
  for(const [a,b,w] of edges) assert.ok(Math.abs(estimateDistance(a,target)-estimateDistance(b,target)) <= w + 1e-9);
 }
});
test('all actual-room routes form valid weighted paths and feed three hints', () => {
 for(const a of locations) for(const b of locations) {
  const route=findShortestPath(a.id,b.id);
  assert.equal(route.path[0],a.id);assert.equal(route.path.at(-1),b.id);
  let length=0;for(let i=1;i<route.path.length;i++) {const edge=schoolGraph[route.path[i-1]].find(e=>e.to===route.path[i]);assert.ok(edge);length+=edge.weight;}
  assert.equal(length,route.distance);assert.equal(generateHints(route).length,3);
  assert.ok(getClueMarkers(route).every(marker=>locations.some(l=>l.markerId===marker)));
 }
 assert.deepEqual(findShortestPath('중앙현관','중앙현관'),{path:['중앙현관'],distance:0});
 assert.deepEqual(findShortestPath('toString','중앙현관'),{path:[],distance:Infinity});
});
test('new game and next treasure use A* route and its clue markers', () => {
 let game=newGame('경로검증','중앙현관');
 assert.deepEqual(game.currentRoute,findShortestPath(game.currentLocation,game.treasures[0]));
 const found=scanMarker({...game,status:'hunting'},locationById[game.treasures[0]].markerId);
 game=nextTreasure(found.game);
 assert.deepEqual(game.currentRoute,findShortestPath(game.currentLocation,game.treasures[1]));
 assert.deepEqual(game.clueMarkers,getClueMarkers(game.currentRoute));assert.equal(game.hintStage,1);
});
