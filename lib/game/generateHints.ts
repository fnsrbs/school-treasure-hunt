import {locationById} from '@/data/locations';
import type {Route} from '@/types/game';
export function getClueMarkers(route:Route){const interior=route.path.slice(1,-1).filter(id=>locationById[id]);return [...new Set([interior[Math.floor(interior.length/3)],interior[Math.floor(interior.length*2/3)]].filter(Boolean))].map(id=>locationById[id].markerId);}
export function generateHints(route:Route){const target=locationById[route.path.at(-1)!], start=locationById[route.path[0]];if(!target)return [];
 const direction=target.mapPosition.x>940?'오른쪽':'왼쪽';
 const first=target.floor?`본관 ${target.floor}층 ${direction} 방향을 살펴보세요.`:'본관 밖으로 이어지는 공간을 살펴보세요.';
 const stairs=route.path.some(id=>id.startsWith('stairs-'))||target.floor!==start.floor;
 const second=stairs?'계단을 따라 층을 이동하며 주변의 마커를 살펴보세요.':'복도를 따라 이동하며 주변의 마커를 살펴보세요.';
 let third='학교의 하루를 돕는 장소가 가까워지고 있습니다.';
 if(target.type==='classroom')third='친구들이 함께 수업을 듣는 공간이 가까워지고 있습니다.';
 else if(target.id.includes('과학'))third='실험과 관찰로 궁금증을 해결하는 공간을 찾아보세요.';
 else if(target.id==='음악실')third='아름다운 선율이 들려오는 공간을 찾아보세요.';
 else if(target.id==='미술실')third='색과 선으로 상상을 표현하는 공간을 찾아보세요.';
 else if(target.id==='도서관')third='책 속에서 새로운 세상을 만나는 공간을 찾아보세요.';
 else if(['운동장','체육관'].includes(target.id))third='친구들과 몸을 움직이며 함께하는 공간을 찾아보세요.';
 else if(target.id==='식당')third='함께 한 끼를 나누는 공간을 찾아보세요.';
 else if(target.type==='office')third='선생님들이 수업을 준비하는 공간을 찾아보세요.';
 return [first,second,third];
}
