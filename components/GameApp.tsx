'use client';
import {useEffect,useRef,useState} from 'react';
import {Camera,Gamepad2,MapPin,X,HelpCircle} from 'lucide-react';
import {Panel,Badge,GoldButton} from './common/Panel';
import SchoolMap from './map/SchoolMap';
import HintCards from './hint/HintCards';
import CameraScanner from './ar/CameraScanner';
import Treasure from './treasure/Treasure';
import {locationById} from '@/data/locations';
import {newGame,nextTreasure} from '@/lib/game/engine';
import {loadGame,saveGame} from '@/services/gameStorage';
import {testMarkerConfig} from '@/config/testMarker';
import {scanWithTestMarker} from '@/lib/testing/testMarker';
import CouponLookup from './coupon/CouponLookup';
import {players,createPlayerToken,COMPLETION_ERROR,PLAYER_ERROR} from '@/services/players';
import {registrationToken,clearRegistration} from '@/services/playerRegistration';
import type {GameState} from '@/types/game';
export default function GameApp({initialScreen}:{initialScreen:string}){
 const [pendingDiscovery,setPendingDiscovery]=useState<ReturnType<typeof scanWithTestMarker>|null>(null);const pendingRef=useRef<ReturnType<typeof scanWithTestMarker>|null>(null); const [screen,setScreen]=useState(initialScreen),[game,setGame]=useState<GameState|null>(null),[ready,setReady]=useState(false),[nickname,setNickname]=useState(''),[selected,setSelected]=useState(''),[tab,setTab]=useState('전체'),[notice,setNotice]=useState(''),[wrong,setWrong]=useState(false),[confirmNew,setConfirmNew]=useState(false),[exited,setExited]=useState(false),[saveError,setSaveError]=useState(false);const gameRef=useRef(game);gameRef.current=game;const modalRef=useRef<HTMLDivElement>(null);const wrongRef=useRef(false);
 const [busy,setBusy]=useState(false),[completionError,setCompletionError]=useState('');const busyRef=useRef(false);
 const restored=(saved:GameState):GameState=>saved.collected.length===3&&!saved.database?.completedAt?{...saved,status:'found',screen:'result'}:saved;
 const navigate=(next:string)=>{setScreen(next);window.history.replaceState(null,'',next==='home'?'/':`/game/${next}/`);};
 useEffect(()=>{const loaded=loadGame();const saved=loaded?restored(loaded):null;setGame(saved);setReady(true);if(initialScreen!=='home'&&initialScreen!=='setup'&&initialScreen!=='lookup'){if(saved){const s=saved.screen==='ar'?'hint':saved.screen;navigate(s);}else navigate('home');}},[]);
 useEffect(()=>{if(wrong||confirmNew)modalRef.current?.focus();},[wrong,confirmNew]);
 const persist=(next:GameState)=>{gameRef.current=next;setGame(next);const saved=saveGame(next);setSaveError(!saved);return saved;};
 const go=(next:string)=>{if(busyRef.current)return;pendingRef.current=null;setPendingDiscovery(null);setNotice('');if(game)persist({...game,screen:next});navigate(next);};
 const start=async()=>{
  if(busyRef.current)return;
  if(!nickname.trim()){setNotice('닉네임을 입력해 주세요.');return;}
  if(Array.from(nickname.trim()).length>10){setNotice('닉네임은 10자 이내로 입력해 주세요.');return;}
  busyRef.current=true;setBusy(true);setNotice('');
  try{
   const candidate=newGame(nickname.trim(),selected);
   const token=registrationToken(candidate.player.nickname);
   const player=await players.register(candidate.player.nickname,token);
   const g:GameState={...candidate,player:{id:player.id,nickname:player.nickname},database:{token,registered:true}};
   // A recovered request must never start a second game for an already completed player.
   if(player.is_completed)throw new Error('이미 완료된 탐험입니다. 이어서 하기를 이용해 주세요.');
   if(!persist(g))throw new Error('진행 상태를 저장하지 못했습니다. 브라우저 저장 공간을 확인해주세요.');
   clearRegistration();setCompletionError('');navigate('assignment');
  }catch(e){setNotice(e instanceof Error?e.message:PLAYER_ERROR);}
  finally{busyRef.current=false;setBusy(false);}
 };
 const resume=()=>{if(busyRef.current)return;const loaded=loadGame();if(!loaded){setNotice('저장된 탐험이 없습니다. 새 게임을 시작해주세요.');return;}const saved=restored(loaded);setGame(saved);gameRef.current=saved;setCompletionError('');navigate(saved.screen==='ar'?'hint':saved.screen);};
 const finish=async(advance:boolean)=>{
  if(busyRef.current)return;
  let current=gameRef.current;if(!current||current.collected.length!==3)return;
  busyRef.current=true;setBusy(true);setCompletionError('');
  try{
   if(!current.database?.registered){
    // Old browser saves are registered without discarding their treasure progress or coupon.
    current={...current,database:{token:current.database?.token??createPlayerToken(),registered:false}};
    if(!persist(current))throw new Error(COMPLETION_ERROR);
    const token=current.database!.token;
    const player=await players.register(current.player.nickname,token);
    current={...current,player:{id:player.id,nickname:player.nickname},database:{token,registered:true}};
    if(current.coupon)current={...current,coupon:{...current.coupon,playerId:player.id,nickname:player.nickname}};
    if(!persist(current))throw new Error(COMPLETION_ERROR);
   }
   const saved=await players.complete(current,coupon=>{
    current={...current!,coupon};if(!persist(current))throw new Error(COMPLETION_ERROR);
   });
   const latest=gameRef.current!;
   const updated:GameState={...latest,database:{...latest.database!,completedAt:saved.completed_at},coupon:{...latest.coupon!,number:saved.coupon_number,nickname:saved.nickname,playerId:latest.player.id}};
   const g=advance?nextTreasure({...updated,status:'found'}):updated;
   if(!persist(g))throw new Error('완료 정보는 서버에 저장됐지만 기기에 저장하지 못했습니다. 다시 시도해 주세요.');
   if(advance)navigate(g.screen);
  }catch(e){setCompletionError(e instanceof Error?e.message:COMPLETION_ERROR);}
  finally{busyRef.current=false;setBusy(false);}
 };
 const receive=(id:string)=>{const current=gameRef.current;if(!current||busyRef.current||wrongRef.current||pendingRef.current)return;const result=scanWithTestMarker(current,id,testMarkerConfig.enabled);if(result.kind==='wrong'){wrongRef.current=true;setWrong(true);}else{pendingRef.current=result;setPendingDiscovery(result);setNotice('');}};
 const confirmDiscovery=()=>{const result=pendingRef.current;if(!result||busyRef.current)return;pendingRef.current=null;setPendingDiscovery(null);persist(result.game);navigate(result.game.screen);if(result.kind==='clue')setNotice('단서 마커를 찾았어요! 다음 힌트가 열렸습니다.');if(result.kind==='found'&&result.game.collected.length===3)void finish(false);};
 const next=()=>{if(busyRef.current)return;const current=gameRef.current;if(!current)return;if(current.collected.length===3){void finish(true);return;}const g=nextTreasure(current);persist(g);setTab('전체');navigate(g.screen);};
 const main=()=>{if(!busyRef.current)navigate('home');};
 const backToHint=()=>{wrongRef.current=false;setWrong(false);go('hint');};
 const setup=()=>{if(busyRef.current)return;setNotice('');setCompletionError('');setConfirmNew(false);setNickname('');setSelected('');navigate('setup');};
 const stage=(game?.currentTreasure??0)+1;
 return <main className={`app-shell ${screen==='home'?'home':'inside'}`}><div className="forest-backdrop"/><div className="app-content">
 {!ready?<div className="loading">탐험을 준비하고 있습니다…</div>:screen==='home'?<div className="home-content"><section className="parchment title-scroll"><small>학교 곳곳에 숨겨진</small><h1><em>AR</em> 보물찾기</h1><div className="title-rule"/><p>힌트를 따라 보물을 찾아<br/>현실의 상품과 교환하세요!</p></section><div className="home-actions"><GoldButton onClick={()=>game?setConfirmNew(true):setup()}><Gamepad2 size={17}/> 새 게임</GoldButton><button className="secondary" onClick={resume}><MapPin size={17}/> 이어서 하기</button><button className="secondary" onClick={()=>setExited(true)}><X size={17}/> 종료</button></div><button className="text-button" onClick={()=>navigate('lookup')}>쿠폰 조회</button><footer>학교 축제 · AR 탐험대</footer></div>:screen==='lookup'?<CouponLookup onBack={main}/>:screen==='setup'?<Panel onBack={main} className="setup-panel"><Badge>새 게임 설정</Badge><h2>탐험을 시작하기 전에<br/>정보를 입력해주세요</h2><label className="field-label" htmlFor="nickname">① 닉네임 입력</label><input id="nickname" placeholder="닉네임 10자 이내" value={nickname} onChange={e=>setNickname(e.target.value)} autoComplete="nickname" disabled={busy}/><label className="field-label">② 현재 위치 선택</label><p className="field-help">아래 학교 도면에서 현재 있는 장소를 직접 눌러주세요.</p><div className="setup-map"><div className="map-banner">지도에서 현재 있는 장소를 눌러주세요</div><SchoolMap selected={selected} onSelect={id=>{if(!busyRef.current)setSelected(id);}}/><div className="selection-label">선택된 위치: {selected||'아직 선택하지 않았어요'}</div></div><GoldButton onClick={start} disabled={busy||!selected}>{busy?'등록 중…':'다음'}</GoldButton></Panel>:game&&<>
 {screen==='assignment'&&<Panel onBack={main} className="assignment-panel"><Badge>보물 배정</Badge><Treasure/><h2>보물이 배정되었습니다!</h2><p className="center description">{game.player.nickname} 탐험대만의 보물 순서가 정해졌어요.<br/>위치는 힌트를 따라 찾아야 합니다.</p><div className="assignment-list">{[1,2,3].map(n=><div key={n}><b>{n}</b><strong>보물 {n}</strong><small>위치 비공개</small></div>)}</div><GoldButton onClick={()=>{const g={...game,status:'hunting' as const,screen:'map'};persist(g);navigate('map');}}>확인</GoldButton></Panel>}
 {screen==='map'&&<Panel onBack={main} className="map-panel"><Badge>학교 지도 · 보물 찾기 {stage} / 3</Badge><div className="player-card"><MapPin color="#239ac1" size={25}/><div><strong>{game.player.nickname}</strong><small>현재 위치: {game.currentLocation}</small></div></div><h2>학교 곳곳의 AR 마커를 찾아<br/>보물을 획득하세요!</h2><div className="map-container"><div className="tabs" role="tablist" aria-label="지도 층 선택">{['전체','1층','2층','3층','4층','별관'].map(t=><button key={t} role="tab" aria-selected={tab===t} onClick={()=>setTab(t)}>{t}</button>)}</div><SchoolMap selected={game.currentLocation} collected={game.collected} tab={tab}/><div className="map-legend"><span><MapPin size={13}/> 현재 위치</span><span>🏆 획득한 보물</span></div></div><GoldButton disabled={busy} onClick={game.status==='found'?next:()=>go('hint')}>{game.status==='found'?(game.collected.length===3?'최종 보물 확인하기':'다음 보물 지도 보기'):'힌트 보기'}</GoldButton></Panel>}
 {screen==='hint'&&<Panel onBack={()=>go('map')} backLabel="지도로" className="hint-panel"><Badge>힌트 보기 · {stage} / 3</Badge><h2>단서를 따라<br/>AR 마커를 찾아보세요</h2><HintCards game={game}/><p className="description">마커를 인식하면 다음 단서가 열립니다. 보물 마커를 바로 찾으면 즉시 보물을 획득할 수 있어요.</p><GoldButton onClick={()=>go('ar')}><Camera size={17}/> AR 마커 인식하기</GoldButton></Panel>}
 {screen==='ar'&&<Panel onBack={()=>go('hint')} backLabel="힌트로" className="ar-panel"><Badge>AR 마커 인식 · {stage} / 3</Badge><h2>마커를 비춰보세요</h2>{!wrong&&<CameraScanner onMarker={receive} discovery={pendingDiscovery?.kind === 'wrong' ? undefined : pendingDiscovery?.kind} onConfirm={confirmDiscovery}/>}<p className="description center">학교에 놓인 QR 마커를 찾아보세요.</p>{testMarkerConfig.enabled&&<p className="description center">테스트 모드 · 같은 테스트 마커로 힌트 2 → 힌트 3 → 보물 획득을 확인할 수 있어요. 매번 AR 마커 인식하기를 다시 눌러주세요.<br/><a href="/markers/test/" target="_blank" rel="noopener noreferrer">테스트 마커 보기·인쇄</a></p>}{process.env.NODE_ENV==='development'&&<details className="dev-tools"><summary>개발 테스트</summary><button className="secondary" onClick={()=>receive(locationById[game.treasures[game.currentTreasure]].markerId)}>정답 마커 테스트</button><button className="secondary" onClick={()=>receive('INVALID-TEST-MARKER')}>잘못된 마커 테스트</button>{game.clueMarkers[game.hintStage-1]&&<button className="secondary" onClick={()=>receive(game.clueMarkers[game.hintStage-1])}>단서 마커 테스트</button>}</details>}</Panel>}
 {screen==='result'&&<Panel onBack={()=>go('map')} backLabel="지도로" className="result-panel"><Badge>보물을 찾았습니다!</Badge><div className="found-card"><div className="found-art"><span className="discovery">✦ 보물 발견 ✦</span><Treasure/></div><div className="found-copy"><small>{stage}번째 보물 획득</small><h3>{game.currentLocation}의 보물을 찾았어요!</h3><p>지도에 획득한 보물 표시가 남습니다.</p></div></div><GoldButton onClick={next} disabled={busy}>{busy?'완료 정보 저장 중…':game.collected.length===3?'최종 보물 확인하기':'다음 보물 지도 보기'}</GoldButton></Panel>}
 {screen==='final'&&game.database?.completedAt&&<Panel onBack={main} className="final-panel"><div className="final-card"><span className="discovery">✦ 보물 발견! ✦</span><h2>세 개의 보물이<br/>하나로 모였습니다</h2><p>마지막 빛을 따라가면 현실의 보상이 나타납니다.</p><Treasure large/><strong>최종 보물 등장!</strong></div><GoldButton onClick={()=>go('coupon')}>교환권 확인하기</GoldButton></Panel>}
 {screen==='coupon'&&game.database?.completedAt&&<Panel onBack={main} className="coupon-panel"><Badge>보물 교환권</Badge><Treasure/><h2>탐험을 완성했어요!</h2><p className="description center">{game.player.nickname} 탐험대의 교환권입니다.<br/>아래 번호를 행사 담당 선생님께 보여주세요.</p><div className="coupon-ticket"><small>교환권 번호</small><strong data-testid="coupon-number">{game.coupon?.number}</strong><span>{game.coupon?.used?'사용 완료':'미사용'}</span></div><GoldButton onClick={main}>메인으로</GoldButton></Panel>}
 </>}
 {completionError&&<div className="completion-error parchment" role="alert"><p>{completionError}</p><GoldButton disabled={busy} onClick={()=>void finish(false)}>{busy?'저장 중…':'완료 정보 저장 재시도'}</GoldButton></div>}
 {notice&&<div className="notice" role="status" onClick={()=>setNotice('')}>{notice}</div>}{saveError&&<div className="notice" role="alert">진행 상태를 저장하지 못했습니다. 브라우저 저장 공간을 확인해주세요.</div>}
 {(wrong||confirmNew||exited)&&<div className="modal-overlay"><div role="dialog" aria-modal="true" aria-label={wrong?'다시 찾아보세요':confirmNew?'새 게임 시작':'탐험 종료'} ref={modalRef} tabIndex={-1} onKeyDown={e=>{if(e.key==='Escape'){if(wrong)backToHint();else{setConfirmNew(false);setExited(false);}}if(e.key==='Tab'){const buttons=modalRef.current?.querySelectorAll('button');if(buttons?.length){const first=buttons[0],last=buttons[buttons.length-1];if(e.shiftKey&&(document.activeElement===first||document.activeElement===modalRef.current)){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}}}}><Panel onBack={wrong?backToHint:()=>{setConfirmNew(false);setExited(false);}} backLabel={wrong?'지도로':'메인'} className="wrong-panel"><Badge>{wrong?'다시 찾아보세요':confirmNew?'새 게임':'탐험 종료'}</Badge>{wrong?<><HelpCircle className="question-icon" size={48}/><h2>현재 찾고 있는<br/>보물 마커가 아닙니다.</h2><p className="description center">기존 힌트를 다시 확인하고 탐험을 계속하세요. 게임 단계와 힌트는 바뀌지 않습니다.</p><GoldButton onClick={backToHint}>힌트 다시 보기</GoldButton></>:confirmNew?<><h2>새로운 탐험을 시작할까요?</h2><p className="description center">새 게임 정보를 입력하고 다음을 누르면<br/>기존 탐험과 교환권이 교체됩니다.</p><GoldButton onClick={setup}>새 게임 시작</GoldButton><button className="text-button" onClick={()=>setConfirmNew(false)}>이어서 탐험하기</button></>:<><h2>탐험을 종료했습니다.</h2><p className="description center">이 탭을 닫아도 됩니다.<br/>저장된 탐험은 이어서 할 수 있어요.</p><GoldButton onClick={()=>setExited(false)}>메인으로</GoldButton></>}</Panel></div></div>}
 </div></main>;
}




