// Wall Go: a public-information fan duel, not the broadcast heat.
// Unit walls occupy one inter-cell edge. They may meet at a corner, but
// cannot overlap, cross, or be removed. A complete turn is one atomic action.
export const wallGoSide=7
export const wallGoCap=40
const cells=wallGoSide**2
type Side=0|1
type Edge=readonly [number,number]
type Finish='separated'|'blocked'|'turn-limit'
type WallGoMove={destination:number,edge:number}
type LastMove=WallGoMove&{seat:string}

const edges:Edge[]=[]
for(let r=0;r<wallGoSide;r++)for(let c=0;c<wallGoSide-1;c++){
 const a=r*wallGoSide+c
 edges.push(Object.freeze([a,a+1] as const))
}
for(let r=0;r<wallGoSide-1;r++)for(let c=0;c<wallGoSide;c++){
 const a=r*wallGoSide+c
 edges.push(Object.freeze([a,a+wallGoSide] as const))
}
export const wallGoEdges:ReadonlyArray<Edge>=Object.freeze(edges)
const edgeCount=wallGoEdges.length
const incidence=Array.from({length:cells},()=>[] as {cell:number,edge:number}[])
const edgeIndex=new Map<number,number>()
wallGoEdges.forEach(([a,b],edge)=>{
 incidence[a].push({cell:b,edge})
 incidence[b].push({cell:a,edge})
 edgeIndex.set(a*cells+b,edge)
})
const reflectCell=(p:number)=>cells-1-p
const reflectedEdges=wallGoEdges.map(([a,b])=>edgeIndex.get(reflectCell(b)*cells+reflectCell(a))!)
const validIndex=(i:number,length:number)=>Number.isSafeInteger(i)&&i>=0&&i<length

// Interchange action: dest × 84 + edge. It names the endpoint rather than a
// route; if two paths reach the same endpoint they have the same effect.
export function wallGoEncode(destination:number,edge:number):number{
 return validIndex(destination,cells)&&validIndex(edge,edgeCount)?destination*edgeCount+edge:-1
}
export function wallGoDecode(action:unknown):WallGoMove|null{
 if(typeof action!=='number'||!validIndex(action,cells*edgeCount))return null
 return {destination:Math.floor(action/edgeCount),edge:action%edgeCount}
}
export type WallGo={
 seats:[string,string]
 pawns:[number,number]
 walls:number[]
 turn:Side
 turns:number
 lastMove:LastMove|null
 end:Finish|null
 winner:string|null
}
type Territory={owners:(Side|null)[],scores:[number,number],neutral:number}
export type WallGoView={
 seats:[string,string]
 pawns:[number,number]
 walls:number[]
 turn:string|null
 turns:number
 lastMove:LastMove|null
 end:Finish|null
 winner:string|null
 territory:Territory
 legal:number[]
}
export function wallGoStart(seats:readonly string[],first=0):WallGo{
 if(seats.length!==2||seats.some(seat=>typeof seat!=='string'||!seat.trim())||seats[0]===seats[1]){
  throw new RangeError('Wall Go requires two distinct seats')
 }
 if(first!==0&&first!==1)throw new RangeError('Wall Go requires a valid first seat')
 return {seats:[seats[0],seats[1]],pawns:[0,cells-1],walls:[],turn:first,turns:0,lastMove:null,end:null,winner:null}
}

function other(at:Side):Side{return at===0?1:0}

// Shared traversal for orthogonal movement and connected-area counting.
// A rival blocks pawn movement, but does not block the territorial graph.
function distances(walls:ReadonlySet<number>,from:number,limit=cells,occupied=-1){
 const distance=new Int8Array(cells).fill(-1)
 const queue=new Int8Array(cells)
 let at=0,tail=1
 queue[0]=from
 distance[from]=0
 while(at<tail){
  const p=queue[at++],next=distance[p]+1
  if(next>limit)continue
  for(const {cell,edge} of incidence[p]){
   if(distance[cell]!==-1||cell===occupied||walls.has(edge))continue
   distance[cell]=next
   queue[tail++]=cell
  }
 }
 return distance
}
function territory(pawns:readonly [number,number],closed:ReadonlySet<number>):Territory{
 const owners=Array<Side|null>(cells).fill(null),scores:[number,number]=[0,0]
 const a=distances(closed,pawns[0])
 if(a[pawns[1]]>=0)return {owners,scores,neutral:cells}
 const b=distances(closed,pawns[1])
 for(let i=0;i<cells;i++){
  const owner=a[i]>=0?0:b[i]>=0?1:null
  if(owner!==null){owners[i]=owner;scores[owner]++}
 }
 return {owners,scores,neutral:cells-scores[0]-scores[1]}
}
export function wallGoTerritory(pawns:readonly [number,number],walls:readonly number[]):Territory{
 return territory(pawns,new Set(walls))
}
function legalMoves(pawns:readonly [number,number],turn:Side,closed:ReadonlySet<number>):number[]{
 const reachable=distances(closed,pawns[turn],2,pawns[other(turn)])
 const result:number[]=[]
 for(let p=0;p<cells;p++)if(reachable[p]>=0){
  for(const {edge} of incidence[p])if(!closed.has(edge))result.push(wallGoEncode(p,edge))
 }
 return result
}
function relocate(pawns:readonly [number,number],turn:Side,cell:number):[number,number]{
 return turn===0?[cell,pawns[1]]:[pawns[0],cell]
}
export function wallGoPlay(s:WallGo,seat:string,action:unknown):WallGo|null{
 const move=wallGoDecode(action)
 if(s.end||s.seats[s.turn]!==seat||!move)return null
 const {destination,edge}=move
 const closed=new Set(s.walls)
 if(closed.has(edge)||!incidence[destination].some(adj=>adj.edge===edge)||
   distances(closed,s.pawns[s.turn],2,s.pawns[other(s.turn)])[destination]<0)return null
 const pawns=relocate(s.pawns,s.turn,destination),turn=other(s.turn),turns=s.turns+1
 closed.add(edge)
 const {scores}=territory(pawns,closed)
 const end:Finish|null=scores[0]>0?'separated':!legalMoves(pawns,turn,closed).length?'blocked':turns>=wallGoCap?'turn-limit':null
 const winner=end&&scores[0]!==scores[1]?s.seats[scores[0]>scores[1]?0:1]:null
 return {...s,pawns,walls:[...s.walls,edge],turn,turns,lastMove:{...move,seat},end,winner}
}
export function wallGoView(s:WallGo):WallGoView{
 const closed=new Set(s.walls)
 // Explicit projection: the UI and every observer see just the committed board.
 // Destination/wall staging stays with the caller until the full turn is submitted.
 return {
  seats:[...s.seats],pawns:[...s.pawns],walls:[...s.walls],turn:s.end?null:s.seats[s.turn],turns:s.turns,
  lastMove:s.lastMove?{...s.lastMove}:null,end:s.end,winner:s.winner,
  territory:territory(s.pawns,closed),legal:s.end?[]:legalMoves(s.pawns,s.turn,closed),
 }
}

function policyIndex(seed:number,turns:number,size:number){
 let n=Math.imul((seed|0)^Math.imul(turns+1,0x9e3779b9),0x85ebca6b)
 n=Math.imul(n^(n>>>16),0xc2b2ae35)
 return ((n^(n>>>13))>>>0)%size
}
function localOrder(actions:readonly number[],turn:Side){
 const key=(code:number)=>{
  if(turn===0)return code
  const {destination,edge}=wallGoDecode(code)!
  return wallGoEncode(reflectCell(destination),reflectedEdges[edge])
 }
 return [...actions].sort((a,b)=>key(a)-key(b))
}
/** A timeout spends the turn without borrowing a strong bot: stay and pick
 * one adjacent wall in mirrored seat order. Nonterminal boards always have
 * at least one such wall; any legal move is a defensive fallback. */
export function wallGoFallback(v:WallGoView,seed=0):number|undefined{
 if(v.turn===null||v.end!==null||!v.legal.length)return
 const turn:Side=v.turn===v.seats[0]?0:1
 const stay=v.legal.filter(code=>wallGoDecode(code)?.destination===v.pawns[turn])
 const choices=localOrder(stay.length?stay:v.legal,turn)
 return choices[policyIndex(seed,v.turns,choices.length)]
}

const victory=10_000
function positionValue(pawns:[number,number],closed:ReadonlySet<number>,side:Side,turns:number){
 const rival=other(side),mine=distances(closed,pawns[side]),their=distances(closed,pawns[rival])
 if(mine[pawns[rival]]<0){
  const margin=mine.reduce((n,d,i)=>n+Number(d>=0)-Number(their[i]>=0),0)
  return Math.sign(margin)*victory+margin
 }
 if(turns>=wallGoCap)return 0
 // Prefer potential territory and room to maneuver while both pawns share a
 // region. Distances and all lookahead material come from the public view.
 let influence=0
 for(let p=0;p<cells;p++)if(mine[p]>=0)influence+=Math.sign(their[p]-mine[p])
 const freedom=(p:number,blocked:number)=>incidence[p].reduce((n,x)=>n+Number(x.cell!==blocked&&!closed.has(x.edge)),0)
 return 2*influence+3*(freedom(pawns[side],pawns[rival])-freedom(pawns[rival],pawns[side]))
}

export function wallGoBot(v:WallGoView,seat:string,seed=0,level:'easy'|'normal'|'hard'='normal',rejected?:ReadonlySet<number>):number|undefined{
 if(v.end||v.turn===null||v.turn!==seat)return
 const side:Side=seat===v.seats[0]?0:1,rival=other(side)
 const choices=localOrder(v.legal.filter(code=>!rejected?.has(code)),side)
 if(!choices.length)return
 if(level==='easy')return choices[policyIndex(seed,v.turns,choices.length)]
 const closed=new Set(v.walls),turns=v.turns+1
 let best=-Infinity,winners:number[]=[]
 for(const code of choices){
  const {destination,edge}=wallGoDecode(code)!
  const pawns=relocate(v.pawns,side,destination)
  closed.add(edge)
  const now=positionValue(pawns,closed,side,turns)
  let score=now
  if(level==='hard'&&Math.abs(now)<victory&&turns<wallGoCap&&distances(closed,pawns[side])[pawns[rival]]>=0){
   let worst=Infinity
   for(const replyCode of legalMoves(pawns,rival,closed)){
    const reply=wallGoDecode(replyCode)!
    closed.add(reply.edge)
    const next=positionValue(relocate(pawns,rival,reply.destination),closed,side,turns+1)
    closed.delete(reply.edge)
    worst=Math.min(worst,next)
   }
   if(worst!==Infinity)score=worst+now/1000
  }
  closed.delete(edge)
  if(score>best){best=score;winners=[code]}
  else if(score===best)winners.push(code)
 }
 return winners[policyIndex(seed,v.turns,winners.length)]
}
