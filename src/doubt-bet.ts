export const doubtColors=['red','yellow','green','blue','purple'] as const
export const doubtRounds=4
export const doubtMaxSeats=10
const startPoints=6
const maxStake=4
const reviewMs=12000
export type DoubtColor=typeof doubtColors[number]
export type DoubtCard=DoubtColor|'wild'
type Stake={points:number;slots:number}
type Claim={seat:string;color:DoubtColor;count:number}
type Wager=Stake&{seat:string}
type Player={seat:string;points:number;slots:number;hand:DoubtCard[]}
type Phase=
 |{phase:'open'|'reply'|'raise';actor:string;deadline:number}
 |{phase:'review';deadline:number}
 |{phase:'done';deadline:null}
type Showdown={
 claim:Claim;winner:string;loser:string;reason:'call'|'fold';counted:number|null;
 cards:{seat:string;hand:DoubtCard[]}[]|null;points:number;slots:number
}
export type DoubtAction=
 |({kind:'bid';color:DoubtColor;count:number}&Stake)
 |({kind:'doubt'|'counter'}&Stake)
 |{kind:'fold'|'next'}
export type DoubtState={
 round:number;step:number;stage:Phase;window:number;claim:Claim|null;wagers:Wager[];
 deals:readonly (readonly number[])[];table:Player[];latest:Showdown|null
}
const cardColors=[...doubtColors,'wild'] as const
const cardIds=Array.from({length:60},(_,i)=>i)
const isCard=(n:unknown):n is number=>typeof n==='number'&&Number.isInteger(n)&&n>=0&&n<60
const stakeOf=(s:Stake)=>s.points+s.slots
const power=(r:Player)=>r.points+r.slots-1
const live=(r:Player)=>power(r)>0
const wallet=(points:number,slots:number,total:number):Stake=>{
 const fromPoints=Math.min(total,points)
 return {points:fromPoints,slots:Math.min(slots,total-fromPoints)}
}
export function doubtDeck(index:(bound:number)=>number){
 const result=[...cardIds]
 for(let i=result.length-1;i>0;i--){
  const j=index(i+1)
  ;[result[i],result[j]]=[result[j],result[i]]
 }
 return result
}
function nextTurn(table:Player[],after:string){
 const pivot=table.findIndex(r=>r.seat===after)
 for(let offset=1;offset<table.length;offset++){
  const candidate=table[(pivot+offset)%table.length]
  if(live(candidate))return candidate
 }
 return table[pivot]
}
function nextDeal(s:DoubtState,first:string,now:number):DoubtState{
 const deck=s.deals[s.round-1]
 let cursor=0
 const table=s.table.map(row=>{
  if(!live(row))return {...row,hand:[]}
  const hand=deck.slice(cursor,cursor+row.slots).map(n=>cardColors[Math.floor(n/10)])
  cursor+=row.slots
  return {...row,hand}
 })
 return {...s,claim:null,wagers:[],latest:null,table,stage:{phase:'open',actor:first,deadline:now+s.window}}
}
export function doubtStart(seats:readonly string[],seed:number,now:number,window:number,deals?:readonly (readonly number[])[]):DoubtState{
 if(seats.length<2||seats.length>doubtMaxSeats||seats.some(s=>!s.trim())||new Set(seats).size!==seats.length||
    !Number.isSafeInteger(seed)||!Number.isFinite(now)||!Number.isFinite(window)||window<=0)throw new Error('Doubt and Bet needs 2–10 distinct seats and a finite clock.')
 let salt=seed>>>0
 const rounds=deals??Array.from({length:doubtRounds},()=>doubtDeck(bound=>{
  salt=(Math.imul(salt,1664525)+1013904223)>>>0
  return Math.floor(salt/2**32*bound)
 }))
 if(rounds.length!==doubtRounds||rounds.some(deck=>deck.length!==60||!deck.every(isCard)||new Set(deck).size!==60))throw new Error('Each deal needs 60 distinct cards.')
 const table=seats.map(seat=>({seat,points:startPoints,slots:5,hand:[]}))
 const first=seats[(seed>>>0)%seats.length]
 return nextDeal({table,round:1,step:0,stage:{phase:'open',actor:first,deadline:now+window},window,claim:null,wagers:[],
  deals:rounds.map(r=>[...r]),latest:null},first,now)
}
function limits(s:DoubtState,row:Player){
 const b=s.stage
 const other=b.phase==='raise'?s.wagers.find(w=>w.seat!==row.seat)?.seat:nextTurn(s.table,row.seat).seat
 const counterpart=s.table.find(r=>r.seat===other)
 const cap=Math.min(maxStake,power(row),counterpart?power(counterpart):0)
 return {min:b.phase==='raise'?stakeOf(s.wagers.find(w=>w.seat!==row.seat)!):1,cap}
}
function sizeCap(s:DoubtState){return Math.min(20,s.table.reduce((n,r)=>n+r.hand.length,0))}
function funded(row:Player,stake:Stake,cap:number){
 return Number.isInteger(stake.points)&&stake.points>=0&&stake.points<=row.points&&
  Number.isInteger(stake.slots)&&stake.slots>=0&&stake.slots<row.slots&&stakeOf(stake)>0&&stakeOf(stake)<=cap
}
function settle(s:DoubtState,now:number,fold?:string):DoubtState{
 const c=s.claim!,other=s.wagers.find(w=>w.seat!==c.seat)!.seat
 const count=fold?null:s.table.reduce((total,r)=>total+r.hand.filter(card=>card===c.color||card==='wild').length,0)
 const winner=fold?fold===c.seat?other:c.seat:count!>=c.count?c.seat:other
 const lost=s.wagers.find(w=>w.seat!==winner)!
 const won=stakeOf(lost)
 const table=s.table.map(r=>r.seat===winner?{...r,points:r.points+won}:r.seat===lost.seat?{...r,points:r.points-lost.points,slots:r.slots-lost.slots}:r)
 return {...s,table,step:s.step+1,wagers:[],latest:{
  claim:c,winner,loser:lost.seat,reason:fold?'fold':'call',counted:count,
  cards:fold?null:s.table.filter(r=>r.hand.length>0).map(r=>({seat:r.seat,hand:[...r.hand]})),points:lost.points,slots:lost.slots
 },stage:s.round>=doubtRounds||table.filter(live).length<2?{phase:'done',deadline:null}:{phase:'review',deadline:now+reviewMs}}
}
function advance(s:DoubtState,now:number){
 const loser=s.table.find(r=>r.seat===s.latest!.loser)!
 return nextDeal({...s,round:s.round+1,step:s.step+1},live(loser)?loser.seat:nextTurn(s.table,loser.seat).seat,now)
}
function apply(s:DoubtState,seat:string,a:DoubtAction,now:number):DoubtState|null{
 const b=s.stage,row=s.table.find(r=>r.seat===seat)
 if(!row||b.phase==='done')return null
 if(b.phase==='review')return a.kind==='next'?advance(s,now):null
 if(!('actor' in b)||b.actor!==seat)return null
 const {cap,min}=limits(s,row)
 if(a.kind==='bid'){
  if(b.phase==='raise'||!doubtColors.includes(a.color)||!Number.isInteger(a.count)||a.count<=(s.claim?.count??0)||a.count>sizeCap(s)||!funded(row,a,cap))return null
  const claim={seat,color:a.color,count:a.count}
  return {...s,claim,wagers:[{seat,points:a.points,slots:a.slots}],step:s.step+1,stage:{phase:'reply',actor:nextTurn(s.table,seat).seat,deadline:now+s.window}}
 }
 if(a.kind==='fold')return b.phase==='raise'?settle(s,now,seat):null
 if((b.phase!=='reply'||a.kind!=='doubt')&&(b.phase!=='raise'||a.kind!=='counter'))return null
 if(!('points' in a)||!s.claim)return null
 const old=s.wagers.find(w=>w.seat===seat)
 const previous=s.wagers.find(w=>w.seat!==seat)!
 const other=s.table.find(r=>r.seat===previous.seat)!
 const amount=Math.min(b.phase==='reply'?maxStake:cap,power(row),power(other))
 if(!funded(row,a,amount)||a.points<(old?.points??0)||a.slots<(old?.slots??0)||stakeOf(a)<Math.max(min,stakeOf(previous)))return null
 const changed={...s,wagers:[previous,{seat,points:a.points,slots:a.slots}]}
 if(stakeOf(a)===stakeOf(previous))return settle(changed,now)
 return {...changed,step:s.step+1,stage:{phase:'raise',actor:previous.seat,deadline:now+s.window}}
}
export function doubtStep(s:DoubtState,seat:string,a:DoubtAction,now:number):DoubtState|null{
 if(!a||!Number.isFinite(now)||s.stage.deadline===null||now>=s.stage.deadline)return null
 return apply(s,seat,a,now)
}
export function doubtTick(s:DoubtState,now:number):DoubtState{
 const b=s.stage
 if(!Number.isFinite(now)||b.deadline===null||now<b.deadline)return s
 if(b.phase==='review')return advance(s,now)
 if(!('actor' in b))return s
 const seat=b.actor,row=s.table.find(r=>r.seat===seat)!
 if(b.phase==='raise')return apply(s,seat,{kind:'fold'},now)??s
 if(b.phase==='reply'){
  const pay=wallet(row.points,row.slots-1,stakeOf(s.wagers[0]))
  return apply(s,seat,{kind:'doubt',...pay},now)??s
 }
 const color=doubtColors.reduce((best,c)=>row.hand.filter(x=>x===c).length>row.hand.filter(x=>x===best).length?c:best)
 return apply(s,seat,{kind:'bid',color,count:1,...wallet(row.points,row.slots-1,1)},now)??s
}
export function doubtView(s:DoubtState,seat?:string){
 const stage=s.stage,row=s.table.find(r=>r.seat===seat),actor='actor' in stage?stage.actor:null
 const leaderScore=Math.max(...s.table.map(r=>r.points+r.slots))
 const turn=row?.seat===actor?row:undefined
 const amount=s.wagers.length&&stage.phase==='reply'?stakeOf(s.wagers[0]):0
 const bettor=s.table.find(r=>r.seat===s.claim?.seat)
 const wager=turn?s.wagers.find(w=>w.seat===turn.seat):null
 const constraints=turn?limits(s,turn):null
 return {
  phase:stage.phase,round:s.round,step:s.step,deadline:stage.deadline,claim:s.claim,wagers:s.wagers,turn:actor,latest:s.latest,
  maxCount:sizeCap(s),leaders:stage.phase==='done'?s.table.filter(r=>r.points+r.slots===leaderScore).map(r=>r.seat):[],
  table:s.table.map(r=>({seat:r.seat,points:r.points,slots:r.slots,active:live(r)})),
  mine:row?{hand:[...row.hand],points:row.points,slots:row.slots,escrowPoints:wager?.points??0,escrowSlots:wager?.slots??0,
   cap:constraints?.cap??0,min:constraints?.min??0,challengeMin:amount,
   challengeCap:turn&&bettor?Math.min(maxStake,power(turn),power(bettor)):0}:null
 }
}
export type DoubtView=ReturnType<typeof doubtView>
type Level='easy'|'normal'|'hard'
function combinations(n:number,k:number){
 if(k<0||k>n)return 0
 let result=1
 for(let i=1;i<=Math.min(k,n-k);i++)result=result*(n-i+1)/i
 return result
}
function likelihood(v:DoubtView,color:DoubtColor,count:number,level:Level){
 const hand=v.mine?.hand??[]
 const already=hand.filter(c=>c===color||c==='wild').length,needed=count-already
 if(needed<=0)return 1
 const unshown=v.table.filter(r=>r.active).reduce((n,r)=>n+r.slots,0)-hand.length
 const outside=60-hand.length,success=20-already
 if(level!=='hard')return Math.min(.99,Math.max(.01,.65+(already+unshown*success/outside-count)*.17))
 const total=combinations(outside,unshown)
 let favorable=0
 for(let i=needed;i<=Math.min(unshown,success);i++)favorable+=combinations(success,i)*combinations(outside-success,unshown-i)
 return favorable/total
}
export function doubtBot(v:DoubtView,level:Level,seed:number):DoubtAction|null{
 const m=v.mine
 if(!m?.hand.length||!v.turn)return null
 if(!m.cap)return null
 const mood=((Math.imul(seed+v.step+13*v.round,0x9e3779b9)>>>0)%100)/100
 const fit=(total:number):Stake=>{
  const add=wallet(m.points-m.escrowPoints,m.slots-1-m.escrowSlots,total-m.escrowPoints-m.escrowSlots)
  return {points:add.points+m.escrowPoints,slots:add.slots+m.escrowSlots}
 }
 if(v.phase==='raise'&&v.claim){
  const odds=likelihood(v,v.claim.color,v.claim.count,level)
  const confidence=v.claim.seat===v.turn?odds:1-odds
  if(confidence<.28&&mood<.8)return {kind:'fold'}
  const amount=m.min+(confidence>.82&&mood<.4&&m.cap>m.min?1:0)
  return {kind:'counter',...fit(amount)}
 }
 const count=(v.claim?.count??0)+1
 const choices=doubtColors.map(color=>({color,odds:likelihood(v,color,count,level)})).sort((a,b)=>b.odds-a.odds)
 const best=choices[level==='easy'&&mood>.45?Math.min(2,choices.length-1):0]
 if(v.phase==='reply'&&v.claim){
  const weak=likelihood(v,v.claim.color,v.claim.count,level)<(level==='easy'?.46:.58)||best.odds<.30&&mood<.65
  if(weak||count>v.maxCount){
   const more=m.challengeCap>m.challengeMin&&mood<.22
   return {kind:'doubt',...fit(m.challengeMin+(more?1:0))}
  }
 }
 return {kind:'bid',color:best.color,count, ...fit(m.cap>1&&best.odds>.76&&mood<.34?2:1)}
}
