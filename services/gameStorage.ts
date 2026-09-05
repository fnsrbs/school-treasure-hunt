import type {GameState} from '@/types/game';
import {locationById} from '@/data/locations';
const KEY='school-treasure-hunt-v1';
export function saveGame(game:GameState){try{localStorage.setItem(KEY,JSON.stringify(game));return true;}catch{return false;}}
export function loadGame():GameState|null {try{const g=JSON.parse(localStorage.getItem(KEY)||'null');if(!g||g.version!==1||typeof g.player?.nickname!=='string'||!locationById[g.currentLocation]||!Array.isArray(g.treasures)||g.treasures.length!==3||new Set(g.treasures).size!==3||!g.treasures.every((id:string)=>locationById[id])||!Array.isArray(g.collected)||!Array.isArray(g.currentRoute?.path)||!Array.isArray(g.clueMarkers)||!Number.isInteger(g.currentTreasure)||g.currentTreasure<0||g.currentTreasure>2||!['assignment','hunting','found','complete'].includes(g.status))return null;return g as GameState;}catch{return null;}}
