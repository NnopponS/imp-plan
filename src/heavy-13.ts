// Heavy 13 engine. Normalized 2–7-seat fan table; seven seats in the episode.
// Engine stays independent of networking: wrappers bind commands to the
// current match/round/slot and must not publish revisions for in-flight locks.
export const heavy13Stands=['red','green','blue'] as const
export const heavy13Colors=[...heavy13Stands,'rainbow'] as const
export const heavy13Threshold=13
export const heavy13Rounds=14
export const heavy13Pass=31
const cycleLength=7,lockLimit=28
const values=[0,1,2,3,4,5,6] as const

export type Heavy13Stand=typeof heavy13Stands[number]
export type Heavy13Color=typeof heavy13Colors[number]
export type Heavy13Pick={value:number,color:Heavy13Color}
export type Heavy13Hand={values:number[],colors:Record<Heavy13Color,number>}
export type Heavy13Event={kind:'pass',seat:string,round:number}|
 ({kind:'place',seat:string,round:number,stand:Heavy13Stand,removed:number[],penalty:number,automatic:boolean}&Heavy13Pick)
type Stands=Record<Heavy13Stand,number[]>
type Phase='select'|'resolve'|'finished'
type Options={lockMs?:number,actionMs?:number,marker?:number}

export type Heavy13={
 phase:Phase
 seats:string[]
 round:number
 marker:number
 hands:Heavy13Hand[]
 locks:(Heavy13Pick|null)[]
 stands:Stands
 order:number[]
 pending:number[]
 deferred:number[]
 penalties:number[]
 penaltyAt:(number|null)[]
 roundLastPenalty:number|null
 placed:number
 last:Heavy13Event|null
 openedAt:number
 deadline:number|null
 lockMs:number
 actionMs:number
 winner:string|null
 leaders:string[]
}
export type Heavy13View={
 phase:Phase
 round:number
 cycle:number
 seats:string[]
 marker:string
 currentSeat:string|null
 deadline:number|null
 stands:Record<Heavy13Stand,{cubes:number[],sum:number}>
 scores:{seat:string,penalty:number,lastPenalty:number|null}[]
 reveal:(Heavy13Pick&{seat:string})[]|null
 order:string[]
 passed:string[]
 returning:boolean
 last:Heavy13Event|null
 mine:{hand:Heavy13Hand,locked:Heavy13Pick|null}|null
 legal:number[]
 winner:string|null
 leaders:string[]
}

function isIndex(value:number,length:number){return Number.isSafeInteger(value)&&value>=0&&value<length}
export function heavy13Lock(value:number,color:string){
 const i=heavy13Colors.findIndex(c=>c===color)
 return isIndex(value,cycleLength)&&i>=0?value*heavy13Colors.length+i:-1
}
export function heavy13Place(stand:string){
 const i=heavy13Stands.findIndex(c=>c===stand)
 return i>=0?lockLimit+i:-1
}
function unpack(code:number):Heavy13Pick{
 return {value:Math.floor(code/heavy13Colors.length),color:heavy13Colors[code%heavy13Colors.length]}
}
function fresh():Heavy13Hand{
 return {values:[...values],colors:{red:2,green:2,blue:2,rainbow:1}}
}
const sum=(pile:readonly number[])=>pile.reduce((total,n)=>total+n,0)
const active=(s:Heavy13)=>s.phase==='resolve'?(s.pending[0]??s.deferred.at(-1)??-1):-1
// Transcript/replay support the last regular actor being mandatory. Returning
// actors cannot pass again; the deferred queue is always resolved LIFO.
const canPass=(s:Heavy13)=>s.pending.length>1

export function heavy13Start(seats:readonly string[],now=0,{lockMs=25_000,actionMs=20_000,marker=0}:Options={}):Heavy13{
 if(seats.length<2||seats.length>7||new Set(seats).size!==seats.length||
  seats.some(x=>typeof x!=='string'||!x.trim()))throw new RangeError('Heavy 13 requires two to seven distinct seats')
 if(!isIndex(marker,seats.length)||!Number.isSafeInteger(now)||now<0||
  !Number.isSafeInteger(lockMs)||lockMs<1||!Number.isSafeInteger(actionMs)||actionMs<1||
  !Number.isSafeInteger(now+Math.max(lockMs,actionMs)))throw new RangeError('Invalid Heavy 13 clock or marker')
 return {
  phase:'select',seats:[...seats],round:1,marker,hands:seats.map(fresh),locks:seats.map(()=>null),
  stands:{red:[],green:[],blue:[]},order:[],pending:[],deferred:[],
  penalties:seats.map(()=>0),penaltyAt:seats.map(()=>null),roundLastPenalty:null,placed:0,last:null,
  openedAt:now,deadline:now+lockMs,lockMs,actionMs,winner:null,leaders:[],
 }
}

function spend(s:Heavy13,at:number,pick:Heavy13Pick):Heavy13{
 const hand=s.hands[at]
 return {...s,locks:s.locks.map((v,i)=>i===at?pick:v),hands:s.hands.map((v,i)=>i===at?
  {values:hand.values.filter(n=>n!==pick.value),colors:{...hand.colors,[pick.color]:hand.colors[pick.color]-1}}:v)}
}
function reveal(s:Heavy13,now:number):Heavy13{
 const distance=(i:number)=>(i-s.marker+s.seats.length)%s.seats.length
 const order=s.seats.map((_,i)=>i).sort((a,b)=>{
  const x=s.locks[a]!,y=s.locks[b]!
  return Number(y.color==='rainbow')-Number(x.color==='rainbow')||y.value-x.value||distance(a)-distance(b)
 })
 return {...s,phase:'resolve',order,pending:[...order],deferred:[],openedAt:now,deadline:now+s.actionMs}
}

function advanceRound(s:Heavy13,now:number):Heavy13{
 // The observed replay retains the marker when nobody incurred a penalty.
 const marker=s.roundLastPenalty??s.marker
 if(s.round===heavy13Rounds){
  const best=Math.min(...s.penalties)
  const tied=s.seats.map((_,i)=>i).filter(i=>s.penalties[i]===best)
  const oldest=Math.min(...tied.map(i=>s.penaltyAt[i]??-1))
  // Equal-minimum leaders who have never taken a penalty share the result.
  // This safe fan fallback does not assert that broadcast match reached it.
  const leaders=tied.filter(i=>(s.penaltyAt[i]??-1)===oldest).map(i=>s.seats[i])
  return {...s,marker,phase:'finished',openedAt:now,deadline:null,leaders,winner:leaders.length===1?leaders[0]:null}
 }
 return {...s,marker,phase:'select',round:s.round+1,order:[],pending:[],deferred:[],locks:s.seats.map(()=>null),
  hands:s.round===cycleLength?s.seats.map(fresh):s.hands,roundLastPenalty:null,openedAt:now,deadline:now+s.lockMs}
}

function place(s:Heavy13,at:number,stand:Heavy13Stand,now:number,automatic:boolean):Heavy13{
 const {value,color}=s.locks[at]!
 const pile=s.stands[stand],clears=sum(pile)+value>=heavy13Threshold
 const removed=clears?[...pile]:[],penalty=removed.length,placed=s.placed+1
 const pending=s.pending.length?s.pending.slice(1):s.pending
 const deferred=s.pending.length?s.deferred:s.deferred.slice(0,-1)
 const next:Heavy13={
  ...s,stands:{...s.stands,[stand]:clears?[value]:[...pile,value]},pending,deferred,placed,
  penalties:penalty?s.penalties.map((v,i)=>i===at?v+penalty:v):s.penalties,
  penaltyAt:penalty?s.penaltyAt.map((v,i)=>i===at?placed:v):s.penaltyAt,
  roundLastPenalty:penalty?at:s.roundLastPenalty,
  last:{kind:'place',seat:s.seats[at],round:s.round,value,color,stand,removed,penalty,automatic},
  openedAt:now,deadline:now+s.actionMs,
 }
 return pending.length||deferred.length?next:advanceRound(next,now)
}

export function heavy13Action(s:Heavy13,seat:string,code:unknown,now:number):Heavy13|null{
 if(s.phase==='finished'||s.deadline===null||!Number.isFinite(now)||now<s.openedAt||now>=s.deadline||
   typeof code!=='number'||!isIndex(code,heavy13Pass+1))return null
 const at=s.seats.indexOf(seat)
 if(at<0)return null
 if(s.phase==='select'){
  if(code>=lockLimit||s.locks[at]!==null)return null
  const pick=unpack(code),hand=s.hands[at]
  if(!hand.values.includes(pick.value)||hand.colors[pick.color]<1)return null
  const next=spend(s,at,pick)
  return next.locks.every(x=>x!==null)?reveal(next,now):next
 }
 if(active(s)!==at||code<lockLimit)return null
 if(code===heavy13Pass){
  if(!canPass(s))return null
  return {...s,pending:s.pending.slice(1),deferred:[...s.deferred,at],
   last:{kind:'pass',seat,round:s.round},openedAt:now,deadline:now+s.actionMs}
 }
 const stand=heavy13Stands[code-lockLimit],color=s.locks[at]!.color
 return color==='rainbow'||color===stand?place(s,at,stand,now,false):null
}

export function heavy13Tick(s:Heavy13,now:number):Heavy13{
 if(s.deadline===null||!Number.isFinite(now)||now<s.deadline)return s
 if(s.phase==='select'){
  let next=s
  // Fan timer fallback: spend the lowest available number and the most
  // plentiful available color (fixed color order, rainbow last on a tie).
  for(let at=0;at<s.seats.length;at++)if(!next.locks[at]){
   const hand=next.hands[at]
   const color=heavy13Colors.reduce((a,b)=>hand.colors[a]>=hand.colors[b]?a:b)
   next=spend(next,at,{value:hand.values[0],color})
  }
  return reveal(next,now)
 }
 const at=active(s)
 if(at<0)return s
 const {value,color}=s.locks[at]!
 // Fan placement fallback: never pass; for rainbow prefer the fewest
 // immediate penalty cubes, then lowest current total, then stand order.
 const rank=(stand:Heavy13Stand)=>sum(s.stands[stand])+value>=heavy13Threshold?s.stands[stand].length:0
 const stand=color==='rainbow'?[...heavy13Stands].sort((a,b)=>rank(a)-rank(b)||sum(s.stands[a])-sum(s.stands[b]))[0]:color
 return place(s,at,stand,now,true)
}

function legal(s:Heavy13,at:number):number[]{
 if(at<0||s.phase==='finished')return []
 if(s.phase==='select'){
  if(s.locks[at])return []
  const {values,colors}=s.hands[at]
  return values.flatMap(value=>heavy13Colors.filter(c=>colors[c]>0).map(c=>heavy13Lock(value,c)))
 }
 if(active(s)!==at)return []
 const {color}=s.locks[at]!
 const placements=color==='rainbow'?heavy13Stands.map(heavy13Place):[heavy13Place(color)]
 return canPass(s)?[...placements,heavy13Pass]:placements
}
function readPile(cubes:number[]){return {cubes:[...cubes],sum:sum(cubes)}}
export function heavy13View(s:Heavy13,reader:string):Heavy13View{
 const at=s.seats.indexOf(reader),current=active(s),own=at<0?null:s.hands[at],lock=at<0?null:s.locks[at]
 const last=s.last?.kind==='place'?{...s.last,removed:[...s.last.removed]}:s.last?{...s.last}:null
 return {
  phase:s.phase,round:s.round,cycle:s.round>cycleLength?2:1,seats:[...s.seats],marker:s.seats[s.marker],
  currentSeat:current<0?null:s.seats[current],deadline:s.deadline,
  stands:{red:readPile(s.stands.red),green:readPile(s.stands.green),blue:readPile(s.stands.blue)},
  scores:s.seats.map((seat,i)=>({seat,penalty:s.penalties[i],lastPenalty:s.penaltyAt[i]})),
  reveal:s.phase==='select'?null:s.seats.map((seat,i)=>({seat,...s.locks[i]!})),
  order:s.order.map(i=>s.seats[i]),passed:s.deferred.map(i=>s.seats[i]),returning:current>=0&&!s.pending.length,last,
  mine:own?{hand:{values:[...own.values],colors:{...own.colors}},locked:lock?{...lock}:null}:null,
  legal:legal(s,at),winner:s.winner,leaders:[...s.leaders],
 }
}

export function heavy13Bot(v:Heavy13View,seed=0,level:'easy'|'normal'|'hard'='normal'):number|undefined{
 if(!v.legal.length||v.mine===null)return
 const choice=(codes:readonly number[])=>{
  let mix=Math.imul((seed|0)^Math.imul(v.round,0x9e3779b9)^Math.imul(v.order.length+1,0x85ebca6b),0x27d4eb2d)
  mix=(mix^(mix>>>16))>>>0
  return codes[mix%codes.length]
 }
 if(level==='easy')return choice(v.legal)
 const penalty=(stand:Heavy13Stand,value:number)=>{
  const pile=v.stands[stand]
  return pile.sum+value>=heavy13Threshold?pile.cubes.length:0
 }
 const stands=(color:Heavy13Color):readonly Heavy13Stand[]=>color==='rainbow'?heavy13Stands:[color]
 const weight=(code:number)=>{
  if(v.phase==='select'){
   const {value,color}=unpack(code)
   const exposure=Math.min(...stands(color).map(stand=>penalty(stand,value)))
   const conserve=color==='rainbow'?(level==='hard'?4:2):0
   return -16*exposure-conserve+(level==='hard'?value:-Math.abs(value-3))
  }
  if(code===heavy13Pass)return -1
  const {value}=v.mine!.locked!,stand=heavy13Stands[code-lockLimit]
  return -16*penalty(stand,value)+(level==='hard'?(v.stands[stand].sum+value)%heavy13Threshold:0)
 }
 const scored=v.legal.map(code=>({code,weight:weight(code)}))
 const best=Math.max(...scored.map(x=>x.weight))
 return choice(scored.filter(x=>x.weight===best).map(x=>x.code))
}
