import type {Coupon} from '@/types/game';
export function generateCoupon(player:{id:string;nickname:string}):Coupon {const array=new Uint32Array(1);let n:number;do{crypto.getRandomValues(array);n=array[0];}while(n>=4294800000);return {id:crypto.randomUUID(),number:String(100000+n%900000),playerId:player.id,nickname:player.nickname,issued:true,used:false};}
