'use client';
import {useRef,useState} from 'react';
import {Panel,Badge,GoldButton} from '../common/Panel';
import {players,COUPON_ERROR,COUPON_NOT_FOUND} from '@/services/players';
import type {CouponLookup as CouponResult} from '@/types/player';
export default function CouponLookup({onBack}:{onBack:()=>void}){
 const [number,setNumber]=useState(''),[busy,setBusy]=useState(false),[message,setMessage]=useState(''),[result,setResult]=useState<CouponResult|null>(null);
 const lock=useRef(false);
 const lookup=async()=>{
  if(lock.current)return;
  if(!number.trim()){setMessage('쿠폰 번호를 입력해 주세요.');setResult(null);return;}
  lock.current=true;setBusy(true);setMessage('');setResult(null);
  try{const data=await players.lookup(number);setResult(data);if(!data)setMessage(COUPON_NOT_FOUND);}
  catch{setMessage(COUPON_ERROR);}finally{lock.current=false;setBusy(false);}
 };
 return <Panel onBack={onBack} className="coupon-lookup-panel"><Badge>쿠폰 조회</Badge><h2>교환권 번호를<br/>확인해 보세요</h2>
  <form onSubmit={e=>{e.preventDefault();void lookup();}}>
   <label className="field-label" htmlFor="coupon-search">쿠폰 번호</label>
   <input id="coupon-search" inputMode="numeric" placeholder="6자리 쿠폰 번호" value={number} disabled={busy} onChange={e=>{setNumber(e.target.value);setResult(null);setMessage('');}}/>
   <GoldButton disabled={busy}>{busy?'조회 중…':'조회하기'}</GoldButton>
  </form>
  <div aria-live="polite">{message&&<p className="description" role="status">{message}</p>}{result&&<dl className="coupon-lookup-result">
   <dt>쿠폰 번호</dt><dd>{result.coupon_number}</dd><dt>닉네임</dt><dd>{result.nickname}</dd>
   <dt>게임 완료 여부</dt><dd>{result.is_completed?'완료':'미완료'}</dd>
   <dt>게임 완료 시간</dt><dd>{new Date(result.completed_at).toLocaleString('ko-KR',{timeZone:'Asia/Seoul'})} (한국 시간)</dd>
  </dl>}</div>
 </Panel>;
}
