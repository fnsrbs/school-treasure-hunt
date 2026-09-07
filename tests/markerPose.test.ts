import test from 'node:test';
import assert from 'node:assert/strict';
import {quadMatrix,coverCorners} from '../lib/game/markerPose';
import {decodeMarkerPose} from '../services/markerRecognition';
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';

test('homography maps all corners for translation, scale, rotation and perspective',()=>{
 for(const points of [ [{x:20,y:30},{x:220,y:30},{x:220,y:230},{x:20,y:230}], [{x:200,y:30},{x:240,y:180},{x:80,y:240},{x:40,y:90}], [{x:50,y:20},{x:240,y:60},{x:180,y:260},{x:70,y:210}] ]){
  const matrix=quadMatrix(points)!;const m=matrix.slice(9,-1).split(',').map(Number);
  [[0,0],[1,0],[1,1],[0,1]].forEach(([x,y],i)=>{const w=m[3]*x+m[7]*y+1;assert.ok(Math.abs((m[0]*x+m[4]*y+m[12])/w-points[i].x)<1e-6);assert.ok(Math.abs((m[1]*x+m[5]*y+m[13])/w-points[i].y)<1e-6);});
 }
 assert.equal(quadMatrix(Array(4).fill({x:0,y:0})),null);
});
test('camera cover crop compensates portrait and landscape viewport dimensions',()=>{
 const pose={id:'test',width:720,height:480,corners:[{x:0,y:0},{x:720,y:0},{x:720,y:480},{x:0,y:480}] as [{x:number;y:number},{x:number;y:number},{x:number;y:number},{x:number;y:number}]};
 assert.deepEqual(coverCorners(pose,300,420),[{x:-165,y:0},{x:465,y:0},{x:465,y:420},{x:-165,y:420}]);
});
test('printed test QR returns four image coordinates; blank image returns no pose',()=>{
 const require=createRequire(import.meta.url),qrRequire=createRequire(require.resolve('qrcode'));
 const {PNG}=qrRequire('pngjs');const png=PNG.sync.read(readFileSync('public/markers/test/marker.png'));
 const pose=decodeMarkerPose(new Uint8ClampedArray(png.data),png.width,png.height)!;
 assert.equal(pose.id,'SCHOOL-TEST-PROGRESSION-V1');assert.equal(pose.corners.length,4);
 assert.ok(pose.corners[1].x>pose.corners[0].x);assert.ok(pose.corners[2].y>pose.corners[1].y);
 assert.equal(decodeMarkerPose(new Uint8ClampedArray(100*100*4).fill(255),100,100),null);
});

test('continuous tracking dispatches once, hides on loss and reacquires same marker',async()=>{
 const {watchMarkers}=await import('../services/markerRecognition');
 const require=createRequire(import.meta.url),qrRequire=createRequire(require.resolve('qrcode'));
 const {PNG}=qrRequire('pngjs'),png=PNG.sync.read(readFileSync('public/markers/test/marker.png'));
 let blank=false;const pixels={data:new Uint8ClampedArray(png.data)};
 const oldDocument=Object.getOwnPropertyDescriptor(globalThis,'document'),oldTimeout=globalThis.setTimeout;
 let next:(()=>void)|undefined;let calls=0;const seen:(string|null)[]=[];
 Object.defineProperty(globalThis,'document',{configurable:true,value:{createElement:()=>({width:0,height:0,getContext:()=>({drawImage:()=>{},getImageData:()=>blank?{data:new Uint8ClampedArray(pixels.data.length).fill(255)}:pixels})})}});
 globalThis.setTimeout=((fn:()=>void)=>{next=fn;return 0;}) as unknown as typeof setTimeout;
 try{
  // 720px keeps the generated frame dimensions consistent with the scan canvas.
  const QRCode=qrRequire('qrcode');const buffer=await QRCode.toBuffer('SCHOOL-TEST-PROGRESSION-V1',{width:720});const frame=PNG.sync.read(buffer);pixels.data=new Uint8ClampedArray(frame.data);
  const stop=watchMarkers({readyState:2,videoWidth:720,videoHeight:720} as HTMLVideoElement,()=>calls++,p=>seen.push(p?.id??null));
  next!();blank=true;next!();blank=false;next!();stop();
  assert.equal(calls,1);assert.deepEqual(seen,['SCHOOL-TEST-PROGRESSION-V1','SCHOOL-TEST-PROGRESSION-V1',null,'SCHOOL-TEST-PROGRESSION-V1']);
 }finally{globalThis.setTimeout=oldTimeout;if(oldDocument)Object.defineProperty(globalThis,'document',oldDocument);else Reflect.deleteProperty(globalThis,'document');}
});

