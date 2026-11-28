export const equationRounds=4
export const equationStartingChips=12
export const equationRaiseLimit=3
export const equationSuits=['Slate','Copper','Silver','Gold'] as const
export const equationOperatorOrders=[
 ['+','−','÷'],['+','÷','−'],['−','+','÷'],['−','÷','+'],['÷','+','−'],['÷','−','+'],
] as const
export const equationRank=(card:number)=>Math.floor(card/4)
export const equationSuit=(card:number)=>equationSuits[card%4]
export type Arrangement={order:[number,number,number,number];ops:number}
export type EquationAction={kind:'call'|'fold'|'advance'}|{kind:'raise';to:number}|{kind:'seal';low:Arrangement|null;high:Arrangement|null}
type Lane='low'|'high'
type FourCards=readonly [number,number,number,number]
export type EquationValue={numerator:number;denominator:number}
type Entry={lane:Lane;value:EquationValue;arrangement:Arrangement}
type Row={seat:string;stack:number;hand:FourCards|null;wager:number;paid:number;folded:boolean;sealed:Entry[]|null}
type Stage=
 |{phase:'opening'|'closing';actor:number;pending:number[];price:number;cap:number;deadline:number}
 |{phase:'seal'|'review';deadline:number}
 |{phase:'finished';deadline:null}
type RevealRow={seat:string;award:number;entries:Entry[];hand:FourCards|null;swingMiss:boolean}
type Settlement={pot:number;low:string|null;high:string|null;uncontested:string|null;refunded:boolean;rows:RevealRow[]}
export type EquationState={seats:string[];round:number;step:number;window:number;openCount:2|3;decks:readonly (readonly number[])[];table:Row[];stage:Stage;latest:Settlement|null}
export type EquationView=ReturnType<typeof equationView>

const cards=Array.from({length:44},(_,i)=>i)
const isCard=(n:unknown)=>typeof n==='number'&&Number.isInteger(n)&&n>=0&&n<cards.length
const active=(row:Row)=>!!row.hand&&!row.folded
const sum=(values:number[])=>values.reduce((a,b)=>a+b,0)
function gcd(a:number,b:number):number{return b===0?a:gcd(b,a%b)}

export function arrangeEquation(hand:readonly number[],proposal:Arrangement):EquationValue|null{
 if(!proposal||!Array.isArray(proposal.order)||proposal.order.length!==4||hand.length!==4||!Array.from(hand).every(isCard))return null
 const {order,ops}=proposal
 if(!Number.isInteger(ops)||ops<0||ops>=equationOperatorOrders.length||
    Array.from(order).some(n=>!Number.isInteger(n)||n<0||n>3)||new Set(order).size!==4)return null
 const handRanks=order.map(i=>equationRank(hand[i]))
 const rules=equationOperatorOrders[ops]
 const division=rules.indexOf('÷'),den=handRanks[division+1]
 if(den===0)return null
 const terms=handRanks.map(n=>n*den)
 terms.splice(division,2,handRanks[division])
 const [left,right]=rules.filter(op=>op!=='÷')
 const num=terms[0]+(left==='+'?1:-1)*terms[1]+(right==='+'?1:-1)*terms[2]
 const reduce=gcd(Math.abs(num),den)
 return {numerator:num/reduce,denominator:den/reduce}
}
export function formatEquation(hand:readonly number[],proposal:Arrangement){
 const r=proposal.order.map(i=>equationRank(hand[i])),o=equationOperatorOrders[proposal.ops]
 return r[0]+' '+o[0]+' '+r[1]+' '+o[1]+' '+r[2]+' '+o[2]+' '+r[3]
}
export const formatEquationValue=({numerator,denominator}:EquationValue)=>denominator===1?String(numerator):numerator+'/'+denominator

export function equationDeck(index:(bound:number)=>number){
 const deck=[...cards]
 for(let i=deck.length-1;i>0;i--){
  const j=index(i+1)
  ;[deck[i],deck[j]]=[deck[j],deck[i]]
 }
 return deck
}
function seededDeals(seed:number){
 let state=seed|0
 const index=(bound:number)=>{
  state=(state+0x6d2b79f5)|0
  let x=Math.imul(state^(state>>>15),1|state)
  x^=x+Math.imul(x^(x>>>7),61|x)
  return (((x^(x>>>14))>>>0)/4294967296*bound)|0
 }
 return Array.from({length:equationRounds},()=>equationDeck(index))
}
function betStage(s:EquationState,phase:'opening'|'closing',now:number):Stage{
 const pending=s.table.flatMap((r,i)=>active(r)?[i]:[])
 const marker=(s.round-1)%s.seats.length
 const actor=pending.find(i=>i>=marker)??pending[0]
 const cap=Math.min(equationRaiseLimit,...pending.map(i=>s.table[i].stack))
 return {phase,actor,pending,price:0,cap,deadline:now+s.window}
}
function nextDeal(s:EquationState,now:number):EquationState{
 const deck=[...s.decks[s.round-1]]
 let cursor=0
 const table=s.table.map((row):Row=>{
  if(!row.stack)return {...row,hand:null,wager:0,paid:0,folded:false,sealed:null}
  const hand=deck.slice(cursor,cursor+4) as [number,number,number,number]
  cursor+=4
  if(hand.every(n=>equationRank(n)===0)){
   const replacement=deck.findIndex((n,i)=>i>=cursor&&equationRank(n)>0)
   ;[deck[replacement],hand[3]]=[hand[3],deck[replacement]]
  }
  return {...row,stack:row.stack-1,paid:1,wager:0,hand,folded:false,sealed:null}
 })
 return {...s,table,openCount:2,stage:betStage({...s,table},'opening',now)}
}
export function equationStart(seats:readonly string[],seed:number,now:number,window:number,decks:readonly (readonly number[])[]=seededDeals(seed)):EquationState{
 if(seats.length<2||seats.length>8||seats.some(s=>typeof s!=='string'||!s.trim())||new Set(seats).size!==seats.length||
    !Number.isSafeInteger(seed)||!Number.isFinite(now)||!Number.isFinite(window)||window<=0)throw new TypeError('Equation High-Low needs 2–8 different seats and a finite clock.')
 if(decks.length!==equationRounds||decks.some(deck=>deck.length!==cards.length||!deck.every(isCard)||new Set(deck).size!==cards.length))throw new TypeError('Each equation deal needs 44 different number cards.')
 const table=seats.map(seat=>({seat,stack:equationStartingChips,hand:null,paid:0,wager:0,folded:false,sealed:null}))
 return nextDeal({seats:[...seats],round:1,step:0,window,openCount:2,decks:decks.map(deck=>[...deck]),table,stage:{phase:'review',deadline:now},latest:null},now)
}

const targetFor=(lane:Lane)=>lane==='low'?1:20
const error=(v:EquationValue,target:number)=>Math.abs(v.numerator-target*v.denominator)
function distance(a:EquationValue,b:EquationValue,lane:Lane){
 const target=targetFor(lane)
 return error(a,target)*b.denominator-error(b,target)*a.denominator
}
function laneWinner(table:Row[],lane:Lane,exclude:Set<number>){
 const key=(r:Row)=>lane==='high'?Math.max(...r.hand!):-Math.min(...r.hand!)
 const candidates=table.flatMap((r,i)=>{
  const entry=r.sealed?.find(e=>e.lane===lane)
  return active(r)&&entry&&!exclude.has(i)?[{i,value:entry.value,key:key(r)}]:[]
 })
 return candidates.sort((a,b)=>distance(a.value,b.value,lane)||b.key-a.key)[0]?.i??null
}
function settle(s:EquationState,now:number,sole:number|null=null):EquationState{
 const excluded=new Set<number>()
 let low:number|null=null,high:number|null=null
 if(sole===null){
  low=laneWinner(s.table,'low',excluded);high=laneWinner(s.table,'high',excluded)
  s.table.forEach((r,i)=>{if(r.sealed?.length===2&&(low!==i||high!==i))excluded.add(i)})
  low=laneWinner(s.table,'low',excluded);high=laneWinner(s.table,'high',excluded)
 }
 const pot=sum(s.table.map(r=>r.paid)),refunded=sole===null&&low===null&&high===null
 const after=new Map<number,number>()
 if(sole!==null)after.set(sole,pot)
 else if(refunded)s.table.forEach((r,i)=>after.set(i,r.paid))
 else if(low===null||high===null)after.set((low??high)!,pot)
 else if(low===high)after.set(low,pot)
 else{
  after.set(low,Math.floor(pot/2))
  after.set(high,Math.ceil(pot/2))
 }
 const latest:Settlement={pot,low:low===null?null:s.seats[low],high:high===null?null:s.seats[high],
  uncontested:sole===null?null:s.seats[sole],refunded,rows:s.table.filter(r=>r.hand).map(r=>{
   const i=s.seats.indexOf(r.seat)
   return {seat:r.seat,award:after.get(i)??0,entries:r.sealed??[],hand:r.sealed?r.hand:null,swingMiss:excluded.has(i)}
  })}
 const table=s.table.map((r,i)=>({...r,stack:r.stack+(after.get(i)??0)}))
 const final=s.round>=equationRounds||table.filter(r=>r.stack>0).length<2
 return {...s,step:s.step+1,table,latest,stage:final?{phase:'finished',deadline:null}:{phase:'review',deadline:now+20000}}
}
function wager(s:EquationState,i:number,a:EquationAction,now:number):EquationState|null{
 const b=s.stage
 if((b.phase!=='opening'&&b.phase!=='closing')||i!==b.actor)return null
 const row=s.table[i]
 const price=a.kind==='raise'?a.to:b.price
 if(a.kind!=='call'&&a.kind!=='raise'&&a.kind!=='fold')return null
 if(a.kind==='raise'&&(!Number.isInteger(a.to)||a.to<=b.price||a.to>b.cap))return null
 const delta=a.kind==='fold'?0:price-row.wager
 if(delta<0||delta>row.stack)return null
 const table=s.table.map((r,j)=>i===j?{...r,stack:r.stack-delta,wager:r.wager+delta,paid:r.paid+delta,folded:a.kind==='fold'}:r)
 const live=table.flatMap((r,j)=>active(r)?[j]:[])
 const base={...s,table}
 if(live.length===1)return settle(base,now,live[0])
 const pending=(a.kind==='raise'?live:b.pending).filter(j=>j!==i)
 if(!pending.length){
  const reset=table.map(r=>({...r,wager:0}))
  return {...base,table:reset,openCount:3,step:s.step+1,stage:b.phase==='opening'?betStage({...s,table:reset},'closing',now):{phase:'seal',deadline:now+s.window}}
 }
 return {...base,step:s.step+1,stage:{...b,price,pending,actor:pending.find(j=>j>i)??pending[0],deadline:now+s.window}}
}
export function equationStep(s:EquationState,seat:string,a:EquationAction,now:number):EquationState|null{
 const i=s.seats.indexOf(seat),b=s.stage
 if(i<0||!a||!Number.isFinite(now)||b.deadline===null||now>=b.deadline)return null
 if(b.phase==='review')return a.kind==='advance'?nextDeal({...s,round:s.round+1,step:s.step+1,latest:null},now):null
 if(b.phase==='opening'||b.phase==='closing')return wager(s,i,a,now)
 const row=s.table[i]
 if(a.kind!=='seal'||!active(row)||row.sealed||(!a.low&&!a.high))return null
 const entries:Entry[]=[]
 for(const lane of ['low','high'] as const){
  const plan=a[lane]
  if(plan===null)continue
  const value=plan&&arrangeEquation(row.hand!,plan)
  if(!value)return null
  entries.push({lane,value,arrangement:{order:[...plan.order],ops:plan.ops}})
 }
 if(entries.length===2&&a.low!.ops===a.high!.ops&&a.low!.order.every((v,j)=>v===a.high!.order[j]))return null
 const table=s.table.map((r,j)=>i===j?{...r,sealed:entries}:r),updated={...s,table}
 return table.every(r=>!active(r)||r.sealed)?settle(updated,now):updated
}
export function equationTick(s:EquationState,now:number):EquationState{
 const b=s.stage
 if(!Number.isFinite(now)||b.deadline===null||now<b.deadline)return s
 if(b.phase==='review')return nextDeal({...s,round:s.round+1,step:s.step+1,latest:null},now)
 if(b.phase==='seal')return settle(s,now)
 if(b.phase==='opening'||b.phase==='closing')return wager(s,b.actor,{kind:b.price>s.table[b.actor].wager?'fold':'call'},now)??s
 return s
}
export function equationView(s:EquationState,seat?:string){
 const b=s.stage,bet=b.phase==='opening'||b.phase==='closing',shown=s.openCount+1
 const row=s.table.find(r=>r.seat===seat),highest=Math.max(...s.table.map(r=>r.stack))
 const leaders=b.phase==='finished'?s.table.filter(r=>r.stack===highest).map(r=>r.seat):[]
 return {phase:b.phase,round:s.round,step:s.step,deadline:b.deadline,leaders,
  turn:bet?s.seats[b.actor]:null,price:bet?b.price:0,cap:bet?b.cap:0,toCall:bet&&row?Math.max(0,b.price-row.wager):0,
  pot:sum(s.table.map(r=>r.paid)),latest:s.latest,
  table:s.table.map(r=>({seat:r.seat,stack:r.stack,live:active(r),paid:r.paid,wager:r.wager,open:r.hand?.slice(1,shown)??[]})),
  mine:row?.hand?{hand:row.hand.slice(0,shown),live:active(row),locked:!!row.sealed}:null,
 }
}

const permutations=[0,1,2,3].flatMap(a=>[0,1,2,3].flatMap(b=>[0,1,2,3].flatMap(c=>
 a===b||a===c||b===c?[]:[[a,b,c,6-a-b-c] as Arrangement['order']])))
function legalArrangements(hand:readonly number[]){
 return permutations.flatMap(order=>equationOperatorOrders.flatMap((_,ops)=>{
  const arrangement={order,ops},value=arrangeEquation(hand,arrangement)
  return value?[{value,arrangement}]:[]
 }))
}
export function equationBot(v:EquationView,seat:string,seed:number,level:'easy'|'normal'|'hard'):EquationAction|null{
 if(!v.mine?.live||v.mine.locked)return null
 const salt=(Math.imul(seed^v.mine.hand[0],1597334677)+v.round*31+v.step*7)>>>0
 if((v.phase==='opening'||v.phase==='closing')&&v.turn===seat){
  if(v.phase==='opening')return v.price<v.cap&&salt%5===0?{kind:'raise',to:v.price+1}:{kind:'call'}
  const pick=legalArrangements(v.mine.hand)
  const gap=Math.min(...pick.flatMap(({value})=>[1,20].map(t=>error(value,t)/value.denominator)))
  if(v.toCall>0&&gap>(level==='hard'?1:3)&&salt%3===0)return {kind:'fold'}
  return v.price<v.cap&&gap<=(level==='hard'?.25:0)&&salt%3===0?{kind:'raise',to:v.price+1}:{kind:'call'}
 }
 if(v.phase!=='seal')return null
 const picks=legalArrangements(v.mine.hand)
 if(!picks.length)return null
 const pick=(lane:Lane)=>picks.slice().sort((a,b)=>distance(a.value,b.value,lane))[level==='easy'?salt%Math.min(12,picks.length):0]
 const low=pick('low'),high=pick('high')
 const lo=error(low.value,1)/low.value.denominator,hi=error(high.value,20)/high.value.denominator
 if(level==='hard'&&lo===0&&hi===0)return {kind:'seal',low:low.arrangement,high:high.arrangement}
 const useLow=lo<hi||(lo===hi&&salt%2===0)
 return {kind:'seal',low:useLow?low.arrangement:null,high:useLow?null:high.arrangement}
}
