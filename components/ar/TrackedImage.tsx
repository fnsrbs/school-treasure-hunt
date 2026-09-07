'use client';
import {useEffect,useRef,useState} from 'react';
import {coverCorners,quadMatrix,type MarkerPose} from '@/lib/game/markerPose';
export default function TrackedImage({pose,kind}:{pose:MarkerPose|null;kind:'clue'|'found'}){
 const host=useRef<HTMLDivElement>(null),[size,setSize]=useState({width:0,height:0});
 useEffect(()=>{const el=host.current;if(!el)return;const observer=new ResizeObserver(([entry])=>setSize({width:entry.contentRect.width,height:entry.contentRect.height}));observer.observe(el);return ()=>observer.disconnect();},[]);
 const transform=pose&&size.width?quadMatrix(coverCorners(pose,size.width,size.height)):null;
 return <div ref={host} className="ar-tracking-layer" aria-hidden={!transform}>{transform&&<div className="ar-qr-plane" style={{transform: `${transform} scale(0.00390625)`}}><img className="ar-tracked-image" src={kind==='clue'?'/clues/scroll.png':'/treasures/chest.png'} alt={kind==='clue'?'QR 위의 단서 두루마리':'QR 위의 보물상자'} draggable={false}/></div>}</div>;
}

