'use client';
import {useEffect,useRef,useState} from 'react';
import {Camera} from 'lucide-react';
import {openRearCamera,watchMarkers} from '@/services/markerRecognition';
import TrackedImage from './TrackedImage';
import type {MarkerPose} from '@/lib/game/markerPose';
export default function CameraScanner({onMarker,discovery,onConfirm}:{onMarker:(id:string)=>void;discovery?:'clue'|'found';onConfirm:()=>void}){
 const [pose,setPose]=useState<MarkerPose|null>(null); const video=useRef<HTMLVideoElement>(null),callback=useRef(onMarker);callback.current=onMarker;const [error,setError]=useState(''),[retry,setRetry]=useState(0);
 useEffect(()=>{let disposed=false,stream:MediaStream|undefined,stop:(()=>void)|undefined;setError('');openRearCamera().then(async s=>{if(disposed){s.getTracks().forEach(t=>t.stop());return;}stream=s;if(video.current){video.current.srcObject=s;await video.current.play();if(!disposed)stop=watchMarkers(video.current,id=>callback.current(id),setPose);}}).catch(e=>{if(!disposed)setError(e.name==='NotAllowedError'?'카메라 권한이 꺼져 있습니다. 브라우저 설정에서 카메라를 허용해주세요.':e.name==='NotFoundError'?'연결된 카메라를 찾을 수 없습니다.':e.message||'카메라를 시작하지 못했습니다.');});return ()=>{disposed=true;stop?.();stream?.getTracks().forEach(t=>t.stop());};},[retry]);
 return <div className={`camera-box ${discovery?'has-discovery':''}`}><video ref={video} muted playsInline aria-label="AR 마커 인식 카메라"/>{!discovery&&<div className="scan-frame"/>}{error&&!discovery?<div className="camera-error" role="alert"><Camera size={30}/><p>{error}</p><button className="secondary" onClick={()=>setRetry(n=>n+1)}>카메라 다시 시작</button></div>:!discovery&&<p className="scan-caption">장소의 QR 마커를 사각형 안에 맞춰주세요</p>}
 {discovery&&<div className="ar-discovery" role="region" aria-label="AR 발견 확인"><div className="ar-discovery-title" role="status"><strong>{discovery==='found'?'보물을 발견했습니다!':'보물의 단서를 발견했습니다!'}</strong><span>{discovery==='found'?'눈앞에 나타난 보물을 확인해보세요.':'두루마리에 새로운 힌트가 담겨 있어요.'}</span></div><TrackedImage pose={pose} kind={discovery}/>{!pose&&(discovery==='clue'?<img className="ar-clue-preview" src="/clues/scroll.png" alt="발견한 단서 두루마리"/>:<p className="ar-tracking-lost">인식한 QR을 다시 비춰주세요.</p>)}<div className="ar-confirm"><p>{discovery==='found'?'확인을 누르면 보물을 획득합니다.':'다음으로 넘어가면 새로운 힌트가 열립니다.'}</p><button className="gold" onClick={onConfirm}>{discovery==='found'?'확인':'다음으로 넘어가기'}</button></div></div>}</div>;
}

