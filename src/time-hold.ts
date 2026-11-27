/**
 * Source-anchored Time Auction variant, separate from the existing sealed-bid fan mode.
 * Source: The Devil's Plan S2E4 unofficial English subtitle mirror (rules briefing ~lines 1517–1612).
 * https://www.subtitlecat.com/subs/1738/The.Devil%27s.Plan.S02E04.en.html
 *
 * The episode establishes 19 rounds, a ten-minute bank, a five-second withdrawal
 * window, tenth-second resolution, private bids, and tokens then reserve for standings.
 * This browser interpretation uses a free withdrawal window, equal *rounded* highs tie,
 * and an unspent reserve below 5 s cannot enter. A brief private arming phase, progress
 * review, liveness lease, and disconnect costs are browser-specific rules, not claimed
 * episode details. A naturally depleted held bid can win; a lost hold cannot. Equal
 * totals share rank, with no prize, stakes, or elimination.
 *
 * Host-only reducer: never ship TimeHold or use a client-provided elapsed/timestamp.
 * Transport must not expose private press/release/pulse traffic or increments to other
 * seats via eager broadcasts, public revisions, action counts, or latency side channels.
 */
export const timeHoldRules=Object.freeze({
 rounds:19,reserveTenths:6000,tenthMs:100,graceMs:5000,armMs:3000,reviewMs:3500,leaseMs:3500
})
type Phase='arming'|'live'|'review'|'finished'
type HoldStatus='idle'|'holding'|'closed'
type Slot={reserve:number;status:HoldStatus;leaseUntil:number;bid:number}
export type TimeHoldRound={round:number;winner:string|null;elapsedTenths:number}
export type TimeHoldAction={kind:'hold'|'pulse'|'release'|'cancel';round:number}
export type TimeHold={
 readonly seats:readonly string[]
 readonly round:number
 readonly phase:Phase
 readonly bidAt:number
 readonly nextAt:number|null
 readonly lastHostAt:number
 readonly slots:readonly Slot[]
 readonly tokens:readonly number[]
 readonly history:readonly TimeHoldRound[]
}
export type TimeHoldView={
 phase:Phase;round:number;rounds:number;bidAt:number;nextAt:number|null
 mine:{status:HoldStatus;remainingTenths:number|null}|null
 tokens:{seat:string;tokens:number}[]
 last:TimeHoldRound|null
 history:TimeHoldRound[]
 ranks:string[][]|null
 winner:string|null
}
const {rounds,reserveTenths,tenthMs,armMs,graceMs,reviewMs,leaseMs}=timeHoldRules
const idle=(reserve:number):Slot=>({reserve,status:'idle',leaseUntil:0,bid:0})
const spentAt=(slot:Slot,bidAt:number,t:number)=>Math.max(0,Math.min(slot.reserve,Math.round((t-bidAt)/tenthMs)))
const validNow=(now:number)=>Number.isFinite(now)&&now>=0&&now<=Number.MAX_SAFE_INTEGER-reserveTenths*tenthMs-armMs-reviewMs-leaseMs
function clock(s:TimeHold,now:number){return Math.max(s.lastHostAt,now)}

export function timeHoldStart(seats:readonly string[],hostNow:number):TimeHold{
 if(!validNow(hostNow)||seats.length<2||seats.length>16||new Set(seats).size!==seats.length||seats.some(s=>!s))throw new Error('Invalid Time Auction setup')
 return {seats:[...seats],round:1,phase:'arming',bidAt:hostNow+armMs,nextAt:null,lastHostAt:hostNow,
  slots:seats.map(()=>idle(reserveTenths)),tokens:seats.map(()=>0),history:[]}
}
function close(slot:Slot,bidAt:number,at:number,eligible:boolean):Slot{
 const spend=at>=bidAt+graceMs?spentAt(slot,bidAt,at):0
 return {reserve:slot.reserve-spend,status:'closed',leaseUntil:0,bid:eligible?spend:0}
}
function settle(s:TimeHold,hostNow:number):TimeHold{
 if(s.phase!=='live'||hostNow<s.bidAt+graceMs||s.slots.some(p=>p.status==='holding'))return s
 const high=Math.max(0,...s.slots.map(p=>p.bid))
 const leaders=high>0?s.slots.flatMap((p,i)=>p.bid===high?[i]:[]):[]
 const won=leaders.length===1?leaders[0]:-1
 return {...s,phase:'review',nextAt:hostNow+reviewMs,lastHostAt:hostNow,
  slots:s.slots.map(p=>p.status==='idle'?{...p,status:'closed'}:p),
  tokens:s.tokens.map((n,i)=>i===won?n+1:n),
  history:[...s.history,{round:s.round,winner:won>=0?s.seats[won]:null,elapsedTenths:high}]}
}

/** The room calls this with its monotonic clock, independently of client commands. */
export function timeHoldAdvance(s:TimeHold,hostNow:number):TimeHold{
 if(!validNow(hostNow)||s.phase==='finished')return s
 const now=clock(s,hostNow)
 if(s.phase==='review'){
  if(now<s.nextAt!)return s
  if(s.round===rounds)return {...s,phase:'finished',nextAt:null,lastHostAt:now}
  // Do not silently run through unobserved rounds when a host tab wakes up.
  return {...s,phase:'arming',round:s.round+1,bidAt:now+armMs,nextAt:null,lastHostAt:now,slots:s.slots.map(p=>idle(p.reserve))}
 }
 let changed=s.phase==='arming'&&now>=s.bidAt
 const slots=s.slots.map(slot=>{
  if(slot.status!=='holding')return slot
  const exhausted=s.bidAt+slot.reserve*tenthMs
  const next=Math.min(exhausted,slot.leaseUntil)
  if(now<next)return slot
  changed=true
  return close(slot,s.bidAt,next,exhausted<=slot.leaseUntil)
 })
 const state=changed?{...s,phase:now>=s.bidAt?'live' as const:'arming' as const,slots,lastHostAt:now}:s
 return settle(state,now)
}

/** A successful pulse is private transport liveness; it never purchases or extends reserve. */
export function timeHoldAction(s:TimeHold,seat:string,action:TimeHoldAction,hostNow:number):TimeHold|null{
 if(!validNow(hostNow)||action.round!==s.round)return null
 const i=s.seats.indexOf(seat)
 if(i<0)return null
 const now=clock(s,hostNow)
 const current=timeHoldAdvance(s,now)
 if(current.round!==action.round||current.phase==='review'||current.phase==='finished')return null
 const old=current.slots[i]
 let slot:Slot
 if(action.kind==='hold'){
  if(current.phase!=='arming'||old.status!=='idle'||old.reserve<graceMs/tenthMs)return null
  slot={...old,status:'holding',leaseUntil:now+leaseMs}
 }else if(action.kind==='pulse'){
  if(old.status!=='holding'||now+leaseMs<=old.leaseUntil)return null
  slot={...old,leaseUntil:now+leaseMs}
 }else if(action.kind==='release'||action.kind==='cancel'){
  if(old.status!=='holding')return null
  slot=close(old,current.bidAt,now,action.kind==='release')
 }else return null
 const next={...current,lastHostAt:now,slots:current.slots.map((p,j)=>i===j?slot:p)}
 return settle(next,now)
}

/** Host policy: no connection means forfeiting a live hold. No winning bid on forced release. */
export function timeHoldDisconnect(s:TimeHold,seat:string,hostNow:number):TimeHold{
 if(!validNow(hostNow)||!s.seats.includes(seat))return s
 const now=clock(s,hostNow)
 const current=timeHoldAdvance(s,now)
 const index=current.seats.indexOf(seat)
 const slot=current.slots[index]
 if((current.phase!=='arming'&&current.phase!=='live')||slot.status!=='holding')return current
 const next={...current,lastHostAt:now,slots:current.slots.map((p,i)=>i===index?close(p,current.bidAt,now,false):p)}
 return settle(next,now)
}

function standings(s:TimeHold):string[][]{
 const order=s.seats.map((_,i)=>i).sort((a,b)=>s.tokens[b]-s.tokens[a]||s.slots[b].reserve-s.slots[a].reserve)
 const groups:string[][]=[]
 for(let j=0;j<order.length;j++){
  const i=order[j],p=order[j-1]
  if(j&&s.tokens[p]===s.tokens[i]&&s.slots[p].reserve===s.slots[i].reserve)groups.at(-1)!.push(s.seats[i])
  else groups.push([s.seats[i]])
 }
 return groups
}
export function timeHoldView(s:TimeHold,viewer:string|null,hostNow:number):TimeHoldView{
 const now=validNow(hostNow)?hostNow:s.bidAt
 const own=viewer===null?undefined:s.slots[s.seats.indexOf(viewer)]
 const ranks=s.phase==='finished'?standings(s):null
 return {
  phase:s.phase,round:s.round,rounds,bidAt:s.bidAt,nextAt:s.nextAt,
  mine:own?{status:own.status,remainingTenths:s.phase==='live'&&own.status==='holding'?own.reserve-spentAt(own,s.bidAt,now):null}:null,
  tokens:s.seats.map((seat,i)=>({seat,tokens:s.tokens[i]})),
  last:s.history.length?{...s.history.at(-1)!}:null,
  history:s.history.map(result=>({...result})),ranks,winner:ranks?.[0]?.length===1?ranks[0][0]:null
 }
}
