export type Point = {x:number;y:number};
export type MarkerPose = {id:string;corners:[Point,Point,Point,Point];width:number;height:number};
// Map decoded pixels through the video's centered object-fit: cover crop.
export function coverCorners(pose:MarkerPose,width:number,height:number):Point[]{
 const scale=Math.max(width/pose.width,height/pose.height);
 const dx=(width-pose.width*scale)/2,dy=(height-pose.height*scale)/2;
 return pose.corners.map(p=>({x:p.x*scale+dx,y:p.y*scale+dy}));
}
// Unit square -> QR quadrilateral homography, in CSS column-major order.
export function quadMatrix(p:Point[]):string|null{
 if(p.length!==4||p.some(q=>!Number.isFinite(q.x)||!Number.isFinite(q.y)))return null;
 const [a,b,c,d]=p,dx1=b.x-c.x,dx2=d.x-c.x,dy1=b.y-c.y,dy2=d.y-c.y;
 const sx=a.x-b.x+c.x-d.x,sy=a.y-b.y+c.y-d.y;
 const den=dx1*dy2-dx2*dy1;if(Math.abs(den)<0.001)return null;
 const g=(sx*dy2-dx2*sy)/den,h=(dx1*sy-sx*dy1)/den;
 const m=[b.x-a.x+g*b.x,b.y-a.y+g*b.y,0,g,d.x-a.x+h*d.x,d.y-a.y+h*d.y,0,h,0,0,1,0,a.x,a.y,0,1];
 return m.every(Number.isFinite)?`matrix3d(${m.join(',')})`:null;
}
