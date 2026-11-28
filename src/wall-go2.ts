import {wallGoEdges} from './wall-go'

export const wallGo2Side=7
export const wallGo2Edges=wallGoEdges
const size=wallGo2Side
const cells=size*size
const edgeCount=wallGo2Edges.length
const draftLimit=cells*2
export const wallGo2ActionLimit=draftLimit+cells*(cells+1)*cells*edgeCount
export const wallGo2StepLimit=6+edgeCount+3
export type WallGo2Shape='square'|'round'
type Piece={side:number;shape:WallGo2Shape;cell:number}
type Draft={code:number;shape:WallGo2Shape;cell:number}
type Route={code:number;from:number;via:number|null;to:number;wall:number;breach:number|null}
type Choice=Draft|Route
type Last=Choice&{side:number}
type Result={reason:'separated'|'blocked';winners:string[]}
export type WallGo2={
 seats:string[];pieces:Piece[];walls:number[];breaches:boolean[];opening:number;turn:number;
 turns:number;last:Last|null;skipped:number[];result:Result|null
}
const steps=Array.from({length:cells},()=>[] as {cell:number;edge:number;delta:number}[])
wallGo2Edges.forEach(([a,b],edge)=>{
 steps[a].push({cell:b,edge,delta:b-a})
 steps[b].push({cell:a,edge,delta:a-b})
})
const isIndex=(n:number,length:number)=>Number.isSafeInteger(n)&&n>=0&&n<length
const draftTurns=(count:number)=>count*2
export const wallGo2Step=(g:WallGo2)=>g.opening+g.turns

export function wallGo2Draft(shape:WallGo2Shape,cell:number){
 return isIndex(cell,cells)?(shape==='round'?cells:0)+cell:-1
}
export function wallGo2Move(from:number,via:number|null,to:number,wall:number){
 const mid=via??cells
 return isIndex(from,cells)&&isIndex(mid,cells+1)&&isIndex(to,cells)&&isIndex(wall,edgeCount)
  ?draftLimit+((from*(cells+1)+mid)*cells+to)*edgeCount+wall:-1
}
export function wallGo2Start(seats:readonly string[]):WallGo2{
 if((seats.length!==2&&seats.length!==3)||new Set(seats).size!==seats.length||seats.some(id=>!id.trim()))throw new RangeError('Wall Go II requires two or three distinct seats')
 const pieces:Piece[]=seats.length===2?[8,40,12,36].map((cell,i)=>({cell,side:i<2?0:1,shape:'round'})):[]
 return {seats:[...seats],pieces,walls:[],breaches:seats.map(()=>seats.length===3),opening:0,turn:0,turns:0,last:null,skipped:[],result:null}
}

function draftChoices(g:WallGo2):Draft[]{
 const occupied=new Set(g.pieces.map(p=>p.cell))
 const shapes:WallGo2Shape[]=g.seats.length===2?['square']:['square','round']
 const mine=g.pieces.filter(p=>p.side===g.turn)
 return shapes.flatMap(shape=>g.seats.length===3&&mine.some(p=>p.shape===shape)?[]:
  Array.from({length:cells},(_,cell)=>({cell,shape,code:wallGo2Draft(shape,cell)})).filter(p=>!occupied.has(p.cell)))
}

function routeChoices(g:WallGo2,side:number):Route[]{
 const walls=new Set(g.walls),occupied=new Set(g.pieces.map(p=>p.cell)),canBreak=g.breaches[side]
 const result:Route[]=[]
 function arrive(from:number,via:number|null,to:number,breach:number|null){
  for(const {edge:wall} of steps[to]){
   if(!walls.has(wall))result.push({code:wallGo2Move(from,via,to,wall),from,via,to,wall,breach})
  }
 }
 for(const {cell:from,shape,side:owner} of g.pieces){
  if(owner!==side)continue
  for(const a of steps[from]){
   if(occupied.has(a.cell))continue
   const first=walls.has(a.edge)?a.edge:null
   if(first!==null&&!canBreak)continue
   arrive(from,null,a.cell,first)
   for(const b of steps[a.cell]){
    if(occupied.has(b.cell)||(shape==='square'?a.delta!==b.delta:Math.abs(a.delta)===Math.abs(b.delta)))continue
    const second=walls.has(b.edge)?b.edge:null
    if(second!==null&&(!canBreak||first!==null))continue
    arrive(from,a.cell,b.cell,first??second)
   }
  }
 }
 return result
}

export function wallGo2Score(g:Pick<WallGo2,'pieces'|'walls'|'seats'>){
 const closed=new Set(g.walls),seen=new Set<number>(),owners=Array<number|null>(cells).fill(null)
 const totals=g.seats.map(()=>0),largest=g.seats.map(()=>0),pieceAt=new Map(g.pieces.map(p=>[p.cell,p.side]))
 let shared=0,neutral=0
 for(let cell=0;cell<cells;cell++){
  if(seen.has(cell))continue
  const room=[cell],roomSeats=new Set<number>()
  seen.add(cell)
  for(let index=0;index<room.length;index++){
   const p=room[index],side=pieceAt.get(p)
   if(side!==undefined)roomSeats.add(side)
   for(const {cell:k,edge} of steps[p]){
    if(!seen.has(k)&&!closed.has(edge)){seen.add(k);room.push(k)}
   }
  }
  if(roomSeats.size!==1){neutral+=room.length;shared+=Number(roomSeats.size>1);continue}
  const side=roomSeats.values().next().value!
  totals[side]+=room.length
  largest[side]=Math.max(largest[side],room.length)
  for(const k of room)owners[k]=side
 }
 return {owners,totals,largest,neutral,shared}
}
function finish(g:WallGo2,reason:Result['reason'],{totals,largest}=wallGo2Score(g)):WallGo2{
 const best=Math.max(...totals)
 const room=Math.max(...largest.filter((_,side)=>totals[side]===best))
 return {...g,result:{reason,winners:g.seats.filter((_,side)=>totals[side]===best&&largest[side]===room)}}
}

function choices(g:WallGo2):Choice[]{
 if(g.result)return []
 return g.opening<draftTurns(g.seats.length)?draftChoices(g):routeChoices(g,g.turn)
}
export function wallGo2Play(g:WallGo2,seat:string,action:unknown):WallGo2|null{
 if(g.result||g.seats[g.turn]!==seat||typeof action!=='number'||!isIndex(action,wallGo2ActionLimit))return null
 const choice=choices(g).find(c=>c.code===action)
 if(!choice)return null
 const {turn,seats}=g
 const last={...choice,side:turn}
 if('shape' in choice){
  const opening=g.opening+1
  const next=opening<seats.length?opening:draftTurns(seats.length)-1-opening
  return {...g,pieces:[...g.pieces,{shape:choice.shape,cell:choice.cell,side:turn}],opening,turn:Math.max(0,next),last}
 }
 const pieces=g.pieces.map(p=>p.cell===choice.from?{...p,cell:choice.to}:p)
 const walls=[...g.walls.filter(w=>w!==choice.breach),choice.wall]
 const breaches=g.breaches.map((usable,side)=>side===turn&&choice.breach!==null?false:usable)
 const updated={...g,pieces,walls,breaches,last,turns:g.turns+1,skipped:[] as number[]}
 const score=wallGo2Score(updated)
 if(score.shared===0)return finish(updated,'separated',score)
 for(let advance=1;advance<=seats.length;advance++){
  const side=(turn+advance)%seats.length
  if(routeChoices(updated,side).length)return {...updated,turn:side}
  updated.skipped.push(side)
 }
 return finish(updated,'blocked',score)
}

export function wallGo2View(g:WallGo2,seat:string){
 return {
  seats:[...g.seats],pieces:g.pieces.map(p=>({...p})),walls:[...g.walls],breaches:[...g.breaches],
  step:wallGo2Step(g),drafting:g.opening<draftTurns(g.seats.length),opening:g.opening,turn:g.result?null:g.seats[g.turn],
  turns:g.turns,last:g.last&&{...g.last},skipped:[...g.skipped],result:g.result&&{...g.result,winners:[...g.result.winners]},
  score:wallGo2Score(g),legal:g.seats[g.turn]===seat?choices(g):[]
 }
}
export type WallGo2View=ReturnType<typeof wallGo2View>

function pick<T>(choices:readonly T[],seed:number,step:number){
 const hash=Math.imul((seed|0)^Math.imul(step+1,0x9e3779b9),0x85ebca6b)
 return choices[((hash^(hash>>>16))>>>0)%choices.length]
}
export function wallGo2Fallback(v:WallGo2View,seed=0){
 const safe=v.legal.filter(c=>'shape' in c||c.breach===null)
 return pick(safe.length?safe:v.legal,seed,v.step)?.code
}
function near(cell:number,to:number){
 return Math.abs(cell%size-to%size)+Math.abs(Math.floor(cell/size)-Math.floor(to/size))
}
function directionValue(pieces:Piece[],walls:number[],seats:string[],side:number,hard:boolean){
 const {totals,largest,shared}=wallGo2Score({pieces,walls,seats})
 const rivals=totals.map((total,i)=>i===side?0:total)
 if(!shared)return 75*Math.sign(totals[side]-Math.max(...rivals))+4*totals[side]+largest[side]/10
 const closed=new Set(walls),busy=new Set(pieces.map(p=>p.cell))
 const owned=pieces.filter(p=>p.side===side),others=pieces.filter(p=>p.side!==side)
 const freedom=(list:Piece[])=>list.reduce((n,p)=>n+steps[p.cell].filter(x=>!busy.has(x.cell)&&!closed.has(x.edge)).length,0)
 let value=4*totals[side]-3*Math.max(...rivals)+1.8*freedom(owned)-freedom(others)/(seats.length-1)
 if(hard){
  // Favor keeping influence in shared space, not just walling off tiny rooms.
  const dist=(list:Piece[])=>{
   const ds=Array<number>(cells).fill(cells),queue=list.map(p=>p.cell)
   for(const c of queue)ds[c]=0
   for(let i=0;i<queue.length;i++)for(const {cell,edge} of steps[queue[i]]){
    if(ds[cell]===cells&&!closed.has(edge)){ds[cell]=ds[queue[i]]+1;queue.push(cell)}
   }
   return ds
  }
  const my=dist(owned),their=dist(others)
  value+=my.reduce((sum,d,i)=>sum+Number(d<their[i])-Number(d>their[i]),0)*0.42
 }
 return value
}
export function wallGo2Bot(v:WallGo2View,seat:string,seed=0,level:'easy'|'normal'|'hard'='normal'){
 if(v.turn!==seat||!v.legal.length)return
 if(level==='easy')return wallGo2Fallback(v,seed)
 const side=v.seats.indexOf(seat)
 let best=-Infinity,winners:Choice[]=[]
 for(const c of v.legal){
  let score:number
  if('shape' in c){
   const own=v.pieces.filter(p=>p.side===side)
   score=-2*near(c.cell,24)+own.reduce((sum,p)=>sum+Math.min(4,near(c.cell,p.cell)),0)
   if(c.shape==='round')score+=0.5
  }else{
   const pieces=v.pieces.map(p=>p.cell===c.from?{...p,cell:c.to}:p)
   const walls=[...v.walls.filter(w=>w!==c.breach),c.wall]
   score=directionValue(pieces,walls,v.seats,side,level==='hard')-(c.breach===null?0:4)
  }
  if(score>best){best=score;winners=[c]}else if(score===best)winners.push(c)
 }
 return pick(winners,seed,v.step)?.code
}
