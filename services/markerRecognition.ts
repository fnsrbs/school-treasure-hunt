import jsQR from 'jsqr';
import type {MarkerPose} from '@/lib/game/markerPose';
export function decodeMarkerPose(data:Uint8ClampedArray,width:number,height:number):MarkerPose|null {
 const qr=jsQR(data,width,height,{inversionAttempts:'dontInvert'});if(!qr?.data.trim())return null;
 const l=qr.location;return {id:qr.data.trim(),width,height,corners:[l.topLeftCorner,l.topRightCorner,l.bottomRightCorner,l.bottomLeftCorner]};
}
export function decodeMarker(data:Uint8ClampedArray,width:number,height:number):string|null{return decodeMarkerPose(data,width,height)?.id??null;}
export async function openRearCamera(){if(!window.isSecureContext)throw new Error('카메라는 HTTPS 또는 localhost에서 사용할 수 있습니다.');if(!navigator.mediaDevices?.getUserMedia)throw new Error('이 브라우저에서는 카메라를 지원하지 않습니다.');return navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'},width:{ideal:1280}},audio:false});}
// Deliver game recognition once, but keep measuring the same QR until disposed.
export function watchMarkers(video:HTMLVideoElement,onMarker:(id:string)=>void,onPose:(pose:MarkerPose|null)=>void=()=>{}){
 const canvas=document.createElement('canvas'),context=canvas.getContext('2d',{willReadFrequently:true});
 let active=true,timer:ReturnType<typeof setTimeout>,recognized:string|null=null;
 function tick(){if(!active)return;let pose:MarkerPose|null=null;
  if(context&&video.readyState>=2&&video.videoWidth&&video.videoHeight){
   canvas.width=Math.min(video.videoWidth,720);canvas.height=Math.round(video.videoHeight*canvas.width/video.videoWidth);
   context.drawImage(video,0,0,canvas.width,canvas.height);
   const pixels=context.getImageData(0,0,canvas.width,canvas.height);pose=decodeMarkerPose(pixels.data,canvas.width,canvas.height);
  }
  if(pose&&!recognized){recognized=pose.id;onPose(pose);onMarker(pose.id);}
  else onPose(pose?.id===recognized?pose:null);
  if(active)timer=setTimeout(tick,80);
 }
 tick();return ()=>{active=false;clearTimeout(timer);};
}
