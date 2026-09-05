import type { Location } from '@/types/game';
// Coordinates in the supplied 1920 × 1080 school map. No invented rooms.
const rows = [
 {floor:4,y:303,h:67,names:['음악실','3-1','3-2','3-3','3학년 교무실','3-4','3-5','위클래스','진로활동실'],xs:[518,635,722,807,888,999,1084,1169,1258,1350]},
 {floor:3,y:406,h:66,names:['컴퓨터실','2-1','2-2','2-3','2학년 교무실','2-4','2-5','과학실2'],xs:[518,635,722,807,888,999,1084,1169,1350]},
 {floor:2,y:505,h:65,names:['미술실','1-1','1-2','1-3','1학년 교무실','1-4','1-5','과학실1'],xs:[518,635,722,807,888,999,1084,1169,1350]},
 {floor:1,y:605,h:57,names:['보건실','본교무실','행정실','중앙현관','교장실','전환반'],xs:[518,635,799,921,1045,1169,1312]},
];
export const locations:Location[] = rows.flatMap(r=>r.names.map((name,i)=>({id:name,name,floor:r.floor,type:/^\d-\d$/.test(name)?'classroom':name.includes('교무실')?'office':'special',mapPosition:{x:r.xs[i],y:r.y,width:r.xs[i+1]-r.xs[i],height:r.h},markerId:`SCHOOL-${r.floor}-${i+1}`})));
const outside:[string,number,number,number,number,number][]=[['운동장',0,750,736,170,138],['도서관',0,1092,748,220,67],['식당',0,1092,830,220,72],['체육관',0,478,141,297,108],['창고',0,952,198,121,51]];
outside.forEach(([name,floor,x,y,width,height],i)=>locations.push({id:name,name,floor,type:'outside',mapPosition:{x,y,width,height},markerId:`SCHOOL-OUT-${i+1}`}));
export const locationById = Object.fromEntries(locations.map(l=>[l.id,l]));
