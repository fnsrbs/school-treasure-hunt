import { schoolGraph } from '@/data/schoolGraph';
import type { Route } from '@/types/game';
export function findShortestPath(startId:string,destinationId:string):Route {
 if(!schoolGraph[startId]||!schoolGraph[destinationId])return {path:[],distance:Infinity};
 const distances:Record<string,number> = Object.fromEntries(Object.keys(schoolGraph).map(id=>[id,Infinity]));
 const previous:Record<string,string> = {}, remaining=new Set(Object.keys(schoolGraph)); distances[startId]=0;
 while(remaining.size){let current:string|undefined;for(const id of remaining)if(current===undefined||distances[id]<distances[current])current=id;
 if(current===undefined||distances[current]===Infinity)break;remaining.delete(current);if(current===destinationId)break;
 for(const edge of schoolGraph[current]){const d=distances[current]+edge.weight;if(d<distances[edge.to]){distances[edge.to]=d;previous[edge.to]=current;}}}
 if(!Number.isFinite(distances[destinationId]))return {path:[],distance:Infinity};
 const path=[destinationId];while(path[0]!==startId)path.unshift(previous[path[0]]);return {path,distance:distances[destinationId]};
}
