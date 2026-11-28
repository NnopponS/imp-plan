// Fan allocation duel. Host-only state holds sealed permutations and the timeout seed.
type Side=0|1
type Pair<T>=[T,T]
export type GradationPlan={order:number[];target:number|null}
type Gate={values:Pair<number>;winner:Side|null;double:boolean;bonus:Side|null}
type Round={round:number;targets:Pair<number|null>;gates:Gate[];points:Pair<number>}
export type Gradation={
 teams:Pair<string[]>; marked:boolean; phase:'arrange'|'reveal'|'done'; round:number; opened:number; deadline:number|null;
 seed:number; window:number; locks:Pair<GradationPlan|null>; current:Round; history:Round[];
}
const pair=<T,>(f:(s:Side)=>T):Pair<T>=>[f(0),f(1)]
const empty=(round:number):Round=>({round,targets:[null,null],gates:[],points:[0,0]})
const fresh=()=>[1,2,3,4,5,6,7]
const clock=(at:number)=>Number.isSafeInteger(at)&&at>=0&&at<=Number.MAX_SAFE_INTEGER-1_000_000
function generator(seed:number){
 let n=seed>>>0
 return ()=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return n/4294967296}
}
function shuffle(rng:()=>number){
 const order=fresh()
 for(let i=6;i>0;i--){const j=Math.floor(rng()*(i+1));[order[j],order[i]]=[order[i],order[j]]}
 return order
}
function allocator(s:Gradation,side:Side){
 const team=s.teams[side]
 // In large rooms a five-round match cannot give every teammate a turn. Vary the opening seat.
 const offset=team.length>5?(s.seed>>>0)%team.length:0
 return team[(s.round-1+offset)%team.length]
}
function totals(s:Gradation):Pair<number>{
 return pair(side=>s.history.reduce((n,r)=>n+r.points[side],0)+s.current.points[side])
}
export function gradationStart(seats:string[],seed:number,now:number,window:number,marked=false):Gradation{
 if(seats.length<2||seats.length>16||new Set(seats).size!==seats.length||seats.some(s=>typeof s!=='string'||!s.trim())||
  !Number.isSafeInteger(seed)||!clock(now)||!Number.isInteger(window)||window<1||window>900_000||typeof marked!=='boolean')throw new RangeError('Invalid Gradation setup')
 return {teams:pair(side=>seats.filter((_,i)=>i%2===side)),round:1,phase:'arrange',seed,window,opened:now,deadline:now+window,marked,locks:[null,null],current:empty(1),history:[]}
}
function openGate(s:Gradation,now:number):Gradation{
 const i=s.current.gates.length,values=pair(side=>s.locks[side]!.order[i])
 const winner=values[0]===values[1]?null:values[0]>values[1]?0:1
 const gates=s.current.gates,targets=pair(side=>s.locks[side]!.target)
 const double=winner!==null&&targets[winner]===i
 const streak=winner!==null&&i>=2&&gates[i-1].winner===winner&&gates[i-2].winner===winner&&!gates.some(g=>g.bonus===winner)
 const bonus=streak?winner:null
 const points=pair(side=>s.current.points[side]+(winner===side?1+Number(double)+Number(streak):0))
 return {...s,phase:'reveal',opened:now,deadline:now+(i===6?3200:1050),current:{round:s.round,targets,points,gates:[...gates,{values,winner,double,bonus}]}}
}
export function gradationLock(s:Gradation,actor:string,order:number[],target:number|null,now:number):Gradation|null{
 if(s.phase!=='arrange'||!clock(now)||now<s.opened||now>=s.deadline!||!Array.isArray(order)||order.length!==7||
  new Set(order).size!==7||![...order].every(n=>Number.isInteger(n)&&n>=1&&n<=7)||
  (s.marked?!(target!==null&&Number.isInteger(target)&&target>=0&&target<7):target!==null))return null
 const side=actor===allocator(s,0)?0:actor===allocator(s,1)?1:null
 if(side===null||s.locks[side])return null
 const locks=pair(i=>i===side?{order:[...order],target}:s.locks[i])
 const next={...s,locks}
 return locks.every(Boolean)?openGate(next,now):next
}
export function gradationTick(s:Gradation,now:number):Gradation{
 if(s.phase==='done'||s.deadline===null||!clock(now)||now<s.deadline)return s
 if(s.phase==='arrange'){
  const locks=pair(i=>{
   const rng=generator(s.seed^Math.imul(s.round,0x9e3779b9)^Math.imul(i+1,0x85ebca6b))
   return s.locks[i]??{order:shuffle(rng),target:s.marked?Math.floor(rng()*7):null}
  })
  return openGate({...s,locks},now)
 }
 if(s.current.gates.length<7)return openGate(s,now)
 const score=totals(s),done=s.round===6||(s.round===5&&score[0]!==score[1])
 const round=done?s.round:s.round+1
 return {...s,round,phase:done?'done':'arrange',opened:now,deadline:done?null:now+s.window,history:[...s.history,s.current],current:empty(round),locks:[null,null]}
}
function copyRound(r:Round):Round{
 return {...r,targets:[...r.targets],points:[...r.points],gates:r.gates.map(g=>({...g,values:[...g.values]}))}
}
export function gradationView(s:Gradation,actor?:string){
 const allocators=pair(i=>allocator(s,i)),side=allocators.indexOf(actor??'')
 const lock=side<0?null:s.locks[side]
 const score=totals(s)
 const winner:Side|null=s.phase!=='done'||score[0]===score[1]?null:score[0]>score[1]?0:1
 return {phase:s.phase,round:s.round,deadline:s.deadline,marked:s.marked,allocators,teams:pair(i=>[...s.teams[i]]),
  mine:lock?{order:[...lock.order],target:lock.target}:null,current:copyRound(s.current),history:s.history.map(copyRound),totals:score,winner}
}
export type GradationView=ReturnType<typeof gradationView>
export function gradationBot(v:GradationView,actor:string,seed:number,level:'easy'|'normal'|'hard'):GradationPlan|null{
 const side=v.allocators.indexOf(actor)
 if(v.phase!=='arrange'||v.mine||side<0)return null
 const rng=generator(seed^Math.imul(v.round,0x9e3779b9)^Math.imul(side+1,0x85ebca6b))
 const last=v.history.at(-1)?.gates,other=1-side
 let best=shuffle(rng)
 if(last&&level!=='easy'){
  const rate=(o:number[])=>o.reduce((sum,n,i)=>sum+Math.sign(n-last[i].values[other]),0)
  for(let i=0;i<(level==='hard'?20:4);i++){const c=shuffle(rng);if(rate(c)>rate(best))best=c}
 }
 const target=v.marked?(level==='easy'?Math.floor(rng()*7):best.indexOf(7)):null
 return {order:best,target}
}
