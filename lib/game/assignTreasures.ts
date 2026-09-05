import {locations} from '@/data/locations';
import {treasureCount} from '@/data/treasures';
export function assignTreasures(startId:string,random= Math.random){const pool=locations.filter(l=>l.id!==startId).map(l=>l.id);for(let i=pool.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]];}return pool.slice(0,treasureCount);}
