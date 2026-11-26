export type PuzzleGame='hex'|'rectangles'|'cubes'|'exile'
export const isPuzzle=(g:string):g is PuzzleGame=>g==='hex'||g==='rectangles'||g==='cubes'||g==='exile'
export const puzzleRounds=(g:PuzzleGame)=>g==='hex'?8:g==='cubes'?5:g==='exile'?3:4
export const hexCells=Array.from({length:5},(_,i)=>i-2).flatMap(r=>Array.from({length:5},(_,i)=>i-2).filter(q=>Math.abs(q+r)<=2).map(q=>({q,r})))
const lines=hexCells.flatMap(({q,r},i)=>[[1,0],[0,1],[1,-1]].flatMap(([dq,dr])=>{
 const at=(s:number)=>hexCells.findIndex(p=>p.q===q+s*dq&&p.r===r+s*dr)
 const a=at(1),b=at(2)
 return a<0||b<0?[]:[[i,a,b]]
}))
export const hexLines=()=>lines
function areas(v:number[],rows:number,cols:number):number[]{
 const stride=cols+1,p=Array((rows+1)*stride).fill(0) as number[]
 for(let y=1;y<=rows;y++)for(let x=1;x<=cols;x++){
  const i=y*stride+x
  p[i]=v[(y-1)*cols+x-1]+p[i-1]+p[i-stride]-p[i-stride-1]
 }
 const sums=[]
 for(let y=0;y<rows;y++)for(let x=0;x<cols;x++)for(let b=y+1;b<=rows;b++)for(let r=x+1;r<=cols;r++){
  sums.push(p[b*stride+r]-p[b*stride+x]-p[y*stride+r]+p[y*stride+x])
 }
 return sums
}
export const countRectangles=(v:number[],r:number,c:number,target:number)=>areas(v,r,c).filter(s=>s===target).length
function rng(seed:number){
 let x=seed>>>0
 return (n:number)=>{x=(Math.imul(x,1664525)+1013904223)>>>0;return Math.floor(x/4294967296*n)}
}
export function puzzle(g:PuzzleGame,seed:number,round:number){
 const random=rng((seed^Math.imul(g==='hex'?Math.ceil(round/4):round,0x9e3779b9))>>>0)
 if(g==='hex'){
  const values=Array.from({length:19},()=>random(20)+1)
  const targets=[...new Set(lines.map(line=>line.reduce((s,i)=>s+values[i],0)))]
  return {values,target:targets[(random(targets.length)+round-1)%targets.length],rows:5,cols:5}
 }
 if(g==='cubes'){
  const side=round<3?3:4
  const values=Array.from({length:side*side},()=>random(5))
  if(values.reduce((a,b)=>a+b,0)===0)values[0]=1
  return {values,target:0,rows:side,cols:side}
 }
 if(g==='exile'){
  const rows=round===1?6:8,cols=8
  const values=Array.from({length:rows*cols},()=>random(13)-6)
  // Guarantee at least one qualifying rectangle without fixing its location.
  if(!countRectangles(values,rows,cols,0))values[random(values.length)]=0
  return {values,target:0,rows,cols}
 }
 const rows=round+3,cols=Math.max(5,rows)
 const values=Array.from({length:rows*cols},()=>random(10)-4)
 const sums=areas(values,rows,cols)
 return {values,target:sums[random(sums.length)],rows,cols}
}
