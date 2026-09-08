import test from 'node:test';
import assert from 'node:assert/strict';
import {createPlayerService,createPlayerToken,normalizeNickname,DUPLICATE_NICKNAME,PLAYER_ERROR,COMPLETION_ERROR,COUPON_ERROR} from '../services/players';
import {SupabaseRpcError} from '../lib/supabase/client';
import {newGame} from '../lib/game/engine';
import {generateCoupon} from '../lib/game/generateCoupon';
import type {GameState} from '../types/game';

const token='a'.repeat(64);
const result={coupon_number:'123456',nickname:'Tester',is_completed:true,completed_at:'2026-09-08T00:00:00Z'};
function completed():GameState{
 const g=newGame('Tester','중앙현관');
 return {...g,collected:[...g.treasures],status:'found',coupon:generateCoupon(g.player),database:{token,registered:true}};
}
test('nickname trim and English case normalization; random 256-bit token',()=>{
 assert.equal(normalizeNickname(' \tTreasure\u00a0'),'treasure');
 const a=createPlayerToken();assert.match(a,/^[a-f0-9]{64}$/);assert.notEqual(a,createPlayerToken());
});
test('registration precheck runs before insert with trimmed nickname',async()=>{
 const names:string[]=[];
 const api=createPlayerService(async(name,args)=>{
  names.push(name);assert.equal(args.p_nickname,'Tester');
  return name==='nickname_available'?true:[{id:'player',nickname:'Tester',is_completed:false,coupon_number:null,completed_at:null}];
 });
 assert.equal((await api.register(' Tester ',token)).is_completed,false);
 assert.deepEqual(names,['nickname_available','register_player']);
});
test('empty nickname never requests registration',async()=>{
 let calls=0;const api=createPlayerService(async()=>{calls++;return true;});
 await assert.rejects(api.register('  ',token),/닉네임을 입력/);assert.equal(calls,0);
});
test('precheck and concurrent UNIQUE violation show identical duplicate message',async()=>{
 let calls=0;
 await assert.rejects(createPlayerService(async()=>{calls++;return false;}).register('Tester',token),{message:DUPLICATE_NICKNAME});
 assert.equal(calls,1);
 await assert.rejects(createPlayerService(async name=>{
  if(name==='nickname_available')return true;
  throw new SupabaseRpcError('23505','duplicate key violates unique constraint "players_nickname_normalized_key"');
 }).register('Tester',token),{message:DUPLICATE_NICKNAME});
});
test('network and malformed responses prevent registration success',async()=>{
 for(const rpc of [async()=>{throw new TypeError('offline');},async()=>({bad:true})]){
  await assert.rejects(createPlayerService(rpc).register('Tester',token),{message:PLAYER_ERROR});
 }
});
test('completion persists original coupon before requesting and uses server-returned coupon',async()=>{
 const g=completed();let persisted='';
 const api=createPlayerService(async(name,args)=>{
  assert.equal(name,'complete_game');assert.equal(args.p_coupon_number,g.coupon!.number);assert.equal(persisted,g.coupon!.number);
  return [result]; // Already completed RPC may return a different authoritative coupon.
 });
 const value=await api.complete(g,c=>{persisted=c.number;});
 assert.equal(value.coupon_number,'123456');
});
test('coupon collisions retry boundedly using the existing generator contract',async()=>{
 let calls=0,generated=0;
 const api=createPlayerService(async()=>{
  calls++;throw new SupabaseRpcError('23505','players_coupon_number_key');
 });
 await assert.rejects(api.complete(completed(),()=>{},player=>{generated++;return generateCoupon(player);}),{message:COMPLETION_ERROR});
 assert.equal(calls,4);assert.equal(generated,3);
});
test('completion rejects missing treasures; network failure does not generate a new coupon',async()=>{
 let calls=0,generated=0;const api=createPlayerService(async()=>{calls++;throw new Error('offline');});
 await assert.rejects(api.complete({...completed(),collected:[]},()=>{}));assert.equal(calls,0);
 await assert.rejects(api.complete(completed(),()=>{},p=>{generated++;return generateCoupon(p);}),{message:COMPLETION_ERROR});
 assert.equal(calls,1);assert.equal(generated,0);
});
test('lookup trims, limits result fields, handles missing and failed requests',async()=>{
 const api=createPlayerService(async(_,args)=>{assert.equal(args.p_coupon_number,'123456');return [{...result,id:'must-not-leak',player_token_hash:'must-not-leak'}];});
 assert.deepEqual(await api.lookup(' 123456 '),result);
 assert.equal(await createPlayerService(async()=>[]).lookup('000000'),null);
 await assert.rejects(createPlayerService(async()=>{throw new Error('offline');}).lookup('123456'),{message:COUPON_ERROR});
});
