/**
 * S3-21 Symmetrical Puzzle — original fan rules, not a reproduction.
 * A marked centerline is public; the generator's witness is not a target.
 * All rotations are clockwise in screen coordinates. Flipping is not enabled.
 */
export const symmetrySide=7
export const symmetryTime=240000
export const symmetryAxes=['vertical','horizontal','diagonal'] as const
export type SymmetryAxis=typeof symmetryAxes[number]
export type SymmetryCell=readonly [x:number,y:number]
export type SymmetryFit={anchor:number;rotation:number}
export type SymmetryLayout={axis:SymmetryAxis;pieces:SymmetryCell[][];placements:(SymmetryFit|null)[]}
export type SymmetryScore={solved:boolean;elapsedMs:number|null;placed:number;partial:number;connected:boolean;mirrored:boolean}
export type SymmetryBoard=SymmetryLayout&{solution:SymmetryFit[];startedAt:number;deadline:number;finished:boolean;solvedAt:number|null}
export type SymmetryView=SymmetryLayout&{deadline:number;finished:boolean;score:SymmetryScore}

const side=symmetrySide, area=side**2, center=(area-1)/2, maxPieces=10, maxPieceArea=7
const removalBase=1000, placementBase=10000
const valid=(n:number,end:number)=>Number.isInteger(n)&&n>=0&&n<end
const coord=(i:number):SymmetryCell=>[i%side,Math.floor(i/side)]
const index=([x,y]:SymmetryCell)=>y*side+x
const neighbors=Array.from({length:area},(_,i)=>{
 const [x,y]=coord(i)
 return [x>0?i-1:-1,x<side-1?i+1:-1,y>0?i-side:-1,y<side-1?i+side:-1].filter(n=>n>=0)
})

/** Main diagonal means top-left to bottom-right. The other axes pass through the center row or column. */
export function mirrorSymmetryCell(axis:SymmetryAxis,i:number):number{
 if(!valid(i,area))return -1
 const [x,y]=coord(i)
 return axis==='vertical'?index([side-1-x,y]):axis==='horizontal'?index([x,side-1-y]):index([y,x])
}

const random=(seed:number)=>{
 let x=seed|0
 return (n:number)=>{
  x=(x+0x6d2b79f5)|0
  let y=Math.imul(x^(x>>>15),1|x)
  y^=y+Math.imul(y^(y>>>7),61|y)
  return Math.floor(((y^(y>>>14))>>>0)/4294967296*n)
 }
}
type PickIndex=(n:number)=>number
const order=(a:SymmetryCell,b:SymmetryCell)=>a[1]-b[1]||a[0]-b[0]
const minCorner=(cells:readonly SymmetryCell[]):SymmetryCell=>[Math.min(...cells.map(c=>c[0])),Math.min(...cells.map(c=>c[1]))]
const normalize=(cells:readonly SymmetryCell[]):SymmetryCell[]=>{
 const [x0,y0]=minCorner(cells)
 return cells.map(([x,y]):SymmetryCell=>[x-x0,y-y0]).sort(order)
}
const rotate=([x,y]:SymmetryCell):SymmetryCell=>[-y,x]
function shuffle<T>(values:T[],pick:PickIndex):T[]{
 for(let i=values.length-1;i>0;i--){
  const j=pick(i+1)
  ;[values[i],values[j]]=[values[j],values[i]]
 }
 return values
}
export function symmetryRotation(cells:readonly SymmetryCell[],rotation:number):SymmetryCell[]{
 if(!valid(rotation,4)||cells.length===0)return []
 let result=cells
 for(let i=0;i<rotation;i++)result=result.map(rotate)
 return normalize(result)
}

function growSilhouette(axis:SymmetryAxis,pick:PickIndex):number[]{
 const count=23+pick(10), visited=new Set([center])
 while(visited.size<count){
  const frontier=[...visited].flatMap(i=>neighbors[i]).filter(i=>!visited.has(i))
  const cell=frontier[pick(frontier.length)]
  // The reflected neighbor touches the reflected source, already in this symmetric set.
  visited.add(cell)
  visited.add(mirrorSymmetryCell(axis,cell))
 }
 return [...visited]
}

function partition(cells:number[],count:number,pick:PickIndex):number[][]|null{
 const groups=cells.map(cell=>[cell])
 while(groups.length>count){
  const owner=new Int8Array(area).fill(-1)
  for(const [i,group] of groups.entries())for(const cell of group)owner[cell]=i
  const pairs:[a:number,b:number][]=[]
  const singletons:[a:number,b:number][]=[]
  const seen=new Set<number>()
  for(const cell of cells){
   const i=owner[cell]
   for(const other of neighbors[cell]){
    const j=owner[other]
    if(j<0||i===j||groups[i].length+groups[j].length>maxPieceArea)continue
    const lo=Math.min(i,j),hi=Math.max(i,j),key=lo*area+hi
    if(seen.has(key))continue
    seen.add(key)
    const p:[number,number]=[lo,hi]
    pairs.push(p)
    if(groups[i].length===1||groups[j].length===1)singletons.push(p)
   }
  }
  if(!pairs.length)return null
  const list=singletons.length?singletons:pairs
  const [a,b]=list[pick(list.length)]
  groups[a].push(...groups[b])
  groups.splice(b,1)
 }
 return groups.every(group=>group.length>=2)?groups:null
}

/** The central 5×5 square is invariant under all three axes; consecutive snake cells always touch. */
function fallback():number[][]{
 const snake=Array.from({length:25},(_,i)=>{
  const row=1+Math.floor(i/5),col=row%2?1+i%5:5-i%5
  return index([col,row])
 })
 let at=0
 return [3,4,3,4,3,4,4].map(size=>{
  const cells=snake.slice(at,at+size)
  at+=size
  return cells
 })
}
export function symmetryStart(seed:number,startedAt:number,axis?:SymmetryAxis):SymmetryBoard{
 const pick=random(seed),chosen=axis??symmetryAxes[pick(symmetryAxes.length)]
 let groups:number[][]|null=null
 const count=6+pick(maxPieces-6+1)
 for(let attempt=0;attempt<24&&!groups;attempt++)groups=partition(growSilhouette(chosen,pick),count,pick)
 const solution:SymmetryFit[]=[]
 const pieces=shuffle(groups??fallback(),pick).map(group=>{
  const cells=group.map(coord),turn=pick(4)
  solution.push({anchor:index(minCorner(cells)),rotation:(4-turn)%4})
  return symmetryRotation(cells,turn)
 })
 return {axis:chosen,pieces,placements:pieces.map(()=>null),solution,startedAt,deadline:startedAt+symmetryTime,finished:false,solvedAt:null}
}

export function symmetryFootprint(layout:Pick<SymmetryLayout,'pieces'>,id:number,rotation:number,anchor:number):number[]{
 if(!valid(id,layout.pieces.length)||!valid(rotation,4)||!valid(anchor,area))return []
 const [x,y]=coord(anchor)
 const cells=symmetryRotation(layout.pieces[id],rotation).map(([u,v]):SymmetryCell=>[u+x,v+y])
 return cells.every(([u,v])=>u<side&&v<side)?cells.map(index):[]
}
const fitCells=(layout:SymmetryLayout,id:number,fit:SymmetryFit)=>symmetryFootprint(layout,id,fit.rotation,fit.anchor)
export function symmetryOccupancy(layout:SymmetryLayout):number[]{
 const out=Array<number>(area).fill(-1)
 for(const [id,fit] of layout.placements.entries())if(fit)for(const i of fitCells(layout,id,fit))out[i]=id
 return out
}
export function symmetryCanPlace(layout:SymmetryLayout,id:number,fit:SymmetryFit):boolean{
 const cells=fitCells(layout,id,fit)
 if(!cells.length)return false
 const occupied=symmetryOccupancy(layout)
 return cells.every(i=>occupied[i]===-1||occupied[i]===id)
}
export const packSymmetry=(id:number,rotation:number,anchor:number)=>
 valid(id,maxPieces)&&valid(rotation,4)&&valid(anchor,area)?placementBase+id*4*area+rotation*area+anchor:NaN
export const symmetryRemove=(id:number)=>valid(id,maxPieces)?removalBase+id:NaN

function status(layout:SymmetryLayout):Omit<SymmetryScore,'elapsedMs'>{
 const occupied=symmetryOccupancy(layout),placed=layout.placements.filter(Boolean).length
 const cells=new Set(occupied.flatMap((id,at)=>id>=0?[at]:[]))
 const mirrored=cells.size>0&&[...cells].every(i=>cells.has(mirrorSymmetryCell(layout.axis,i)))
 let connected=false
 if(cells.size){
  const queue=[cells.values().next().value!],seen=new Set(queue)
  for(const i of queue)for(const next of neighbors[i]){
   if(cells.has(next)&&!seen.has(next)){seen.add(next);queue.push(next)}
  }
  connected=seen.size===cells.size
 }
 const partial=connected&&mirrored?placed:0
 return {placed,connected,mirrored,partial,solved:partial>0&&partial===layout.pieces.length}
}
export function symmetryStep(board:SymmetryBoard,action:number,now:number):SymmetryBoard|null{
 if(board.finished||!Number.isFinite(now)||now<board.startedAt||now>=board.deadline||!Number.isSafeInteger(action))return null
 const removal=action-removalBase
 if(valid(removal,board.pieces.length)){
  if(!board.placements[removal])return null
  return {...board,placements:board.placements.map((fit,id)=>id===removal?null:fit)}
 }
 const code=action-placementBase
 if(!valid(code,board.pieces.length*4*area))return null
 const id=Math.floor(code/(4*area)),fit={anchor:code%area,rotation:Math.floor(code/area)%4}
 if(!symmetryCanPlace(board,id,fit))return null
 const previous=board.placements[id]
 if(previous&&fitCells(board,id,previous).join()===fitCells(board,id,fit).join())return null
 const next={...board,placements:board.placements.map((old,i)=>i===id?fit:old)}
 return status(next).solved?{...next,finished:true,solvedAt:now}:next
}
export function symmetryTimeout(board:SymmetryBoard,now:number):SymmetryBoard{
 return !board.finished&&Number.isFinite(now)&&now>=board.deadline?{...board,finished:true}:board
}
export function symmetryView(board:SymmetryBoard):SymmetryView{
 return {axis:board.axis,pieces:board.pieces.map(cells=>cells.map(([x,y])=>[x,y])),placements:board.placements.map(fit=>fit?{...fit}:null),
  deadline:board.deadline,finished:board.finished,score:{...status(board),elapsedMs:board.solvedAt===null?null:board.solvedAt-board.startedAt}}
}
/** Ascending comparator for the contest leaderboard. Equal results remain true ties. */
export function compareSymmetryScores(a:SymmetryScore,b:SymmetryScore):number{
 if(a.solved!==b.solved)return a.solved?-1:1
 if(!a.solved)return b.partial-a.partial
 // A genuine solved projection always has elapsedMs; maintain a total comparator at the adapter boundary.
 const first=a.elapsedMs??Infinity,second=b.elapsedMs??Infinity
 return first<second?-1:first>second?1:0
}
