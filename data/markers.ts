import {locations} from './locations';
export const markers=locations.map(l=>({markerId:l.markerId,locationId:l.id}));
export function markerLocation(markerId:string){return markers.find(m=>m.markerId===markerId)?.locationId;}
