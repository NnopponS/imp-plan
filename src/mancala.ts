export type Mancala={pits:number[][],points:number[][],placements:number,sows:number,last:{pit:number,earnedBy:number}|null}
export const makeMancala=(n:number):Mancala=>({pits:Array.from({length:3*n+3},()=>[]),points:Array.from({length:n},()=>[0,0,0]),placements:0,sows:0,last:null})
export function plant(g:Mancala,i:number,seat:number):Mancala|null{
 if(g.placements>=g.points.length*4||!g.pits[i]||g.pits[i].length>=2)return null
 return {...g,placements:g.placements+1,pits:g.pits.map((p,j)=>i===j?[...p,seat]:p)}
}
export const pitType=(i:number,n:number)=>i===n-2?3:i===n-1?4:i%3
export const landing=(g:Mancala,i:number)=>(i+g.pits[i].length)%g.pits.length
export function sow(g:Mancala,i:number,seat:number):Mancala|null{
 if(g.placements<g.points.length*4||!g.pits[i]?.includes(seat)||g.sows>=g.points.length*12)return null
 const pits=g.pits.map(p=>[...p]),picked=pits[i];pits[i]=[]
 const len=pits.length
 for(let j=0;j<picked.length;j++)pits[(i+j+1)%len].push(picked[j])
 const pit=landing(g,i),earnedBy=picked.at(-1)!
 const type=pitType(pit,len),points=g.points.map((p,j)=>j!==earnedBy?p:p.map((v,k)=>type===3?v+1:type===4?Math.max(0,v-1):k===type?v+pits[pit].length:v))
 return {...g,pits,points,sows:g.sows+1,last:{pit,earnedBy}}
}
export const balance=(p:number[])=>Math.min(...p)
export const total=(p:number[])=>p.reduce((a,b)=>a+b,0)
export const compare=(p:number[],q:number[])=>balance(p)-balance(q)||total(p)-total(q)
