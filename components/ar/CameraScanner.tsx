'use client';
import {useEffect,useRef,useState} from 'react';
import {Camera} from 'lucide-react';
import {openRearCamera,watchMarkers} from '@/services/markerRecognition';
export default function CameraScanner({onMarker}:{onMarker:(id:string)=>void}){const video=useRef<HTMLVideoElement>(null),callback=useRef(onMarker);callback.current=onMarker;const [error,setError]=useState(''),[retry,setRetry]=useState(0);
 useEffect(()=>{let disposed=false,stream:MediaStream|undefined,stop:(()=>void)|undefined;setError('');openRearCamera().then(async s=>{if(disposed){s.getTracks().forEach(t=>t.stop());return;}stream=s;if(video.current){video.current.srcObject=s;await video.current.play();if(!disposed)stop=watchMarkers(video.current,id=>callback.current(id));}}).catch(e=>{if(!disposed)setError(e.name==='NotAllowedError'?'카메라 권한이 꺼져 있습니다. 브라우저 설정에서 카메라를 허용해주세요.':e.name==='NotFoundError'?'연결된 카메라를 찾을 수 없습니다.':e.message||'카메라를 시작하지 못했습니다.');});return ()=>{disposed=true;stop?.();stream?.getTracks().forEach(t=>t.stop());};},[retry]);
 return <div className="camera-box"><video ref={video} muted playsInline aria-label="AR 마커 인식 카메라"/><div className="scan-frame"/>{error?<div className="camera-error" role="alert"><Camera size={30}/><p>{error}</p><button className="secondary" onClick={()=>setRetry(n=>n+1)}>카메라 다시 시작</button></div>:<p className="scan-caption">장소의 QR 마커를 사각형 안에 맞춰주세요</p>}</div>;
}
