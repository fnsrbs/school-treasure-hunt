import {locationById} from '@/data/locations';
import {findShortestPath} from '@/lib/algorithms/dijkstra';
import {assignTreasures} from './assignTreasures';
import {getClueMarkers} from './generateHints';
import {generateCoupon} from './generateCoupon';
import type {GameState} from '@/types/game';
export function newGame(nickname:string,start:string):GameState {if(!nickname.trim()||Array.from(nickname.trim()).length>10||!locationById[start])throw new Error('닉네임과 현재 위치를 확인해주세요.');const treasures=assignTreasures(start),currentRoute=findShortestPath(start,treasures[0]);return {version:1,player:{id:crypto.randomUUID(),nickname:nickname.trim()},currentLocation:start,treasures,currentTreasure:0,collected:[],currentRoute,hintStage:1,clueMarkers:getClueMarkers(currentRoute),status:'assignment',coupon:null,screen:'assignment'};}
export function scanMarker(game:GameState,markerId:string):{kind:'wrong'|'clue'|'found';game:GameState}{if(game.status!=='hunting')return {kind:'wrong',game};const target=game.treasures[game.currentTreasure];if(locationById[target].markerId===markerId){const collected=[...game.collected,target];return {kind:'found',game:{...game,collected,currentLocation:target,status:'found',screen:'result',coupon:collected.length===3?(game.coupon??generateCoupon(game.player)):null}};}
 if(game.hintStage<3&&game.clueMarkers[game.hintStage-1]===markerId)return {kind:'clue',game:{...game,hintStage:game.hintStage===game.clueMarkers.length?3:game.hintStage+1,screen:'hint'}};
 return {kind:'wrong',game};}
export function nextTreasure(game:GameState):GameState {if(game.status!=='found')return game;if(game.collected.length===3)return {...game,status:'complete',screen:'final'};const currentTreasure=game.currentTreasure+1,currentRoute=findShortestPath(game.currentLocation,game.treasures[currentTreasure]);return {...game,currentTreasure,currentRoute,clueMarkers:getClueMarkers(currentRoute),hintStage:1,status:'hunting',screen:'map'};}
