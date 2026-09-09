import {readFile} from 'node:fs/promises';

// Browser-only fixture: feed the printed room QR through the real video decoder.
export async function installLocationCamera(page){
 const html=await readFile(new URL('../../public/markers/index.html',import.meta.url),'utf8');
 const markers=Object.fromEntries([...html.matchAll(/<h2>(.*?)<\/h2><img src="([^"]+)"/g)].map(([,name,file])=>[name,'/markers/'+file]));
 if(Object.keys(markers).length!==36)throw new Error('Expected 36 printed location markers');
 await page.addInitScript(markers=>{
  Object.defineProperty(navigator.mediaDevices,'getUserMedia',{value:async()=>{
   const game=JSON.parse(localStorage.getItem('school-treasure-hunt-v1'));
   const image=new Image();image.src=markers[game.treasures[game.currentTreasure]];
   await image.decode();
   const canvas=document.createElement('canvas');canvas.width=canvas.height=720;
   const context=canvas.getContext('2d');const stream=canvas.captureStream(15);
   const draw=()=>{if(stream.getVideoTracks()[0].readyState==='ended')return;context.fillStyle='white';context.fillRect(0,0,720,720);context.drawImage(image,104,104,512,512);requestAnimationFrame(draw);};
   draw();return stream;
  }});
 },markers);
}
