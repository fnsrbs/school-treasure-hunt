import {callRpc,SupabaseRpcError,type RpcTransport} from '@/lib/supabase/client';
import {generateCoupon} from '@/lib/game/generateCoupon';
import type {Coupon,GameState} from '@/types/game';
import type {PlayerRecord,CouponLookup} from '@/types/player';

export const DUPLICATE_NICKNAME='이미 사용 중인 닉네임입니다. 다른 닉네임을 입력해 주세요.';
export const PLAYER_ERROR='플레이어 정보를 확인하지 못했습니다. 인터넷 연결을 확인한 후 다시 시도해 주세요.';
export const COMPLETION_ERROR='게임 완료 정보를 저장하지 못했습니다. 인터넷 연결을 확인한 후 다시 시도해 주세요.';
export const COUPON_ERROR='쿠폰 정보를 조회하지 못했습니다. 잠시 후 다시 시도해 주세요.';
export const COUPON_NOT_FOUND='등록되지 않은 쿠폰 번호입니다.';
export function normalizeNickname(value:string){return value.trim().replace(/[A-Z]/g,c=>c.toLowerCase());}
export function createPlayerToken(){return Array.from(crypto.getRandomValues(new Uint8Array(32)),n=>n.toString(16).padStart(2,'0')).join('');}
function record(data:unknown):Record<string,unknown>{
 if(!Array.isArray(data)||data.length!==1||!data[0]||typeof data[0]!=='object')throw new Error('Invalid RPC response');
 return data[0] as Record<string,unknown>;
}
function couponRecord(data:unknown):CouponLookup{
 const r=record(data);
 if(typeof r.coupon_number!=='string'||!/^[1-9][0-9]{5}$/.test(r.coupon_number)||typeof r.nickname!=='string'||r.is_completed!==true||typeof r.completed_at!=='string'||!Number.isFinite(Date.parse(r.completed_at)))throw new Error('Invalid coupon response');
 return {coupon_number:r.coupon_number,nickname:r.nickname,is_completed:r.is_completed,completed_at:r.completed_at};
}
export function createPlayerService(rpc:RpcTransport=callRpc){
 return {
  async register(nickname:string,token:string):Promise<PlayerRecord>{
   const trimmed=nickname.trim();
   if(!trimmed)throw new Error('닉네임을 입력해 주세요.');
   if(Array.from(trimmed).length>10)throw new Error('닉네임은 10자 이내로 입력해 주세요.');
   try{
    const available=await rpc('nickname_available',{p_nickname:trimmed,p_token:token});
    if(available===false)throw new Error(DUPLICATE_NICKNAME);
    if(available!==true)throw new Error('Invalid availability response');
    const r=record(await rpc('register_player',{p_nickname:trimmed,p_token:token}));
    if(typeof r.id!=='string'||typeof r.nickname!=='string'||typeof r.is_completed!=='boolean'||!(r.coupon_number===null||typeof r.coupon_number==='string')||!(r.completed_at===null||typeof r.completed_at==='string'))throw new Error('Invalid player response');
    return {id:r.id,nickname:r.nickname,is_completed:r.is_completed,coupon_number:r.coupon_number,completed_at:r.completed_at};
   }catch(e){
    if(e instanceof Error&&e.message===DUPLICATE_NICKNAME)throw e;
    if(e instanceof SupabaseRpcError&&e.code==='23505'&&e.message.includes('players_nickname_normalized_key'))throw new Error(DUPLICATE_NICKNAME);
    throw new Error(PLAYER_ERROR);
   }
  },
  async complete(game:GameState,onCandidate:(coupon:Coupon)=>void,makeCoupon=generateCoupon):Promise<CouponLookup>{
   if(game.collected.length!==3||new Set(game.collected).size!==3||!game.treasures.every(id=>game.collected.includes(id))||!game.database?.registered)throw new Error(COMPLETION_ERROR);
   let coupon=game.coupon??makeCoupon(game.player);
   for(let attempt=0;attempt<4;attempt++){
    onCandidate(coupon); // Persist before every request, including collision retries.
    try{
     return couponRecord(await rpc('complete_game',{p_player_id:game.player.id,p_token:game.database.token,p_coupon_number:coupon.number}));
    }catch(e){
     const collision=e instanceof SupabaseRpcError&&e.code==='23505'&&e.message.includes('players_coupon_number_key');
     if(!collision||attempt===3)throw new Error(COMPLETION_ERROR);
     coupon=makeCoupon(game.player);
    }
   }
   throw new Error(COMPLETION_ERROR);
  },
  async lookup(number:string):Promise<CouponLookup|null>{
   try{
    const data=await rpc('lookup_coupon',{p_coupon_number:number.trim()});
    if(Array.isArray(data)&&data.length===0)return null;
    return couponRecord(data);
   }catch{throw new Error(COUPON_ERROR);}
  }
 };
}
export const players=createPlayerService();
