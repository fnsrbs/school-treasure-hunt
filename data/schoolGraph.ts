export type Edge = { to:string; weight:number };
export const schoolGraph:Record<string,Edge[]> = {};
export const edges:[string,string,number][]=[];
function add(a:string,b:string,w:number){edges.push([a,b,w]);(schoolGraph[a]??=[]).push({to:b,weight:w});(schoolGraph[b]??=[]).push({to:a,weight:w});}
function chain(ids:string[],weights:number[]){ids.slice(1).forEach((id,i)=>add(ids[i],id,weights[i]));}
chain(['음악실','3-1','3-2','3-3','3학년 교무실','3-4','3-5','위클래스','진로활동실'],[12,8,8,12,8,8,12,3]);
chain(['컴퓨터실','2-1','2-2','2-3','2학년 교무실','2-4','2-5','과학실2'],[12,8,8,12,8,8,12]);
chain(['미술실','1-1','1-2','1-3','1학년 교무실','1-4','1-5','과학실1'],[12,8,8,12,8,8,12]);
chain(['음악실','컴퓨터실','미술실','보건실'],[10,10,10]);
chain(['3학년 교무실','2학년 교무실','1학년 교무실','중앙현관'],[10,10,10]);
chain(['보건실','본교무실','행정실','중앙현관','교장실','전환반'],[15,12,15,14,14]);
[['중앙현관','운동장',25],['중앙현관','도서관',20],['운동장','도서관',30],['도서관','식당',20],['중앙현관','체육관',40],['중앙현관','창고',35]].forEach(([a,b,w])=>add(a as string,b as string,w as number));
['전환반','과학실1','과학실2','진로활동실'].forEach((room,i)=>{add(room,`stairs-right-${i+1}`,5);if(i>0)add(`stairs-right-${i}`,`stairs-right-${i+1}`,10);});
