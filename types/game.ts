export type Location = { id:string; name:string; floor:number; type:string; mapPosition:{x:number;y:number;width:number;height:number}; markerId:string };
export type Route = {path:string[];distance:number};
export type Coupon = {id:string;number:string;playerId:string;nickname:string;issued:boolean;used:boolean};
export type GameState = {version:1;player:{id:string;nickname:string};currentLocation:string;treasures:string[];currentTreasure:number;collected:string[];currentRoute:Route;hintStage:number;clueMarkers:string[];status:'assignment'|'hunting'|'found'|'complete';coupon:Coupon|null;screen:string};
