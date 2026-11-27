// S3-05: independently specified fan adaptation, not verified broadcast rules.
// Cards are suit-major 0–51: rank = card % 13 + 2, suit = floor(card / 13).
export const memoryPokerGrid={rows:4,columns:5} as const
const slots=memoryPokerGrid.rows*memoryPokerGrid.columns
const handSize=5
export const memoryPokerRounds=4
export const memoryPokerStudy=25_000
export const memoryPokerSelect=30_000
export const memoryPokerReveal=6_000
const scoreUnit=720_720
const peekBase=slots**handSize

const fits=(value:number,limit:number)=>Number.isInteger(value)&&value>=0&&value<limit
const validFive=(values:number[],limit:number)=>values.length===handSize&&Array.from(values).every(v=>fits(v,limit))&&new Set(values).size===handSize

const handNames=['High card','One pair','Two pair','Three of a kind','Straight','Flush','Full house','Four of a kind','Straight flush'] as const
export type PokerRank={name:typeof handNames[number],strength:number[]}
export function rankPokerHand(cards:number[]):PokerRank|null{
 if(!validFive(cards,52))return null
 const ranks=cards.map(c=>c%13+2).sort((a,b)=>b-a)
 const flush=cards.every(c=>Math.floor(c/13)===Math.floor(cards[0]/13))
 const unique=new Set(ranks)
 const run=unique.size!==5?0:ranks[0]-ranks[4]===4?ranks[0]:[14,5,4,3,2].every((r,i)=>r===ranks[i])?5:0
 const groups=[...unique].map(r=>({r,n:ranks.filter(x=>x===r).length})).sort((a,b)=>b.n-a.n||b.r-a.r)
 const grouped=groups.map(g=>g.r)
 const [a,b]=groups
 const strength=flush&&run?[8,run]:a.n===4?[7,...grouped]:a.n===3&&b.n===2?[6,...grouped]:
  flush?[5,...ranks]:run?[4,run]:a.n===3?[3,...grouped]:a.n===2&&b.n===2?[2,...grouped]:
  a.n===2?[1,...grouped]:[0,...ranks]
 return {name:handNames[strength[0]],strength}
}
function compare(a:PokerRank,b:PokerRank){
 for(let i=0;i<a.strength.length;i++)if(a.strength[i]!==b.strength[i])return a.strength[i]-b.strength[i]
 return 0
}

export function memoryPokerDeal(seed:number,round:number){
 let x=(seed^Math.imul(round,0x9e3779b9))>>>0
 const deck=Array.from({length:52},(_,i)=>i)
 for(let i=51;i>0;i--){
  // Deterministic, non-cryptographic mix for reproducible test decks.
  x=(x+0x6d2b79f5)|0
  let t=Math.imul(x^(x>>>15),1|x)
  t=(t+Math.imul(t^(t>>>7),61|t))^t
  const j=Math.floor(((t^(t>>>14))>>>0)*(i+1)/4_294_967_296)
  ;[deck[i],deck[j]]=[deck[j],deck[i]]
 }
 return deck.slice(0,slots)
}

// Canonical base-20 encoding stays within the current room's numeric action bounds.
export const packMemoryPoker=(positions:number[])=>validFive(positions,slots)?[...positions].sort((a,b)=>a-b).reduce((n,i)=>n*slots+i,0):null
export const memoryPokerPeekAction=(position:number)=>fits(position,slots)?peekBase+position:null
function unpack(code:number){
 if(!fits(code,peekBase))return null
 const positions=Array(handSize).fill(0) as number[]
 for(let i=handSize-1;i>=0;i--){positions[i]=code%slots;code=Math.floor(code/slots)}
 return positions.every((position,i)=>i===0||position>positions[i-1])?positions:null
}

export type MemoryPokerPhase='study'|'select'|'reveal'|'finished'
type SelectedCard={position:number,card:number}
type Entry={seat:string,cards:SelectedCard[],hand:PokerRank|null,points:number,peeked:boolean}
type RoundResult={round:number,entries:Entry[]}
export type MemoryPoker={
 seats:string[],round:number,phase:MemoryPokerPhase,deadline:number,scores:number[],winner:string|null,results:RoundResult[],
 allowPeek:boolean,seed:number,layout:number[],picks:(number[]|null)[],peeks:(number|null)[],
}
const blanks=<T,>(seats:string[])=>seats.map(()=>null as T|null)
export function memoryPokerStart(seed:number,seats:string[],now:number,allowPeek=false):MemoryPoker{
 if(seats.length<1||seats.length>16||new Set(seats).size!==seats.length)throw Error('Invalid seats')
 return {seats:[...seats],round:1,phase:'study',deadline:now+memoryPokerStudy,scores:seats.map(()=>0),winner:null,results:[],
  allowPeek,seed,layout:memoryPokerDeal(seed,1),picks:blanks<number[]>(seats),peeks:blanks<number>(seats)}
}
function reveal(s:MemoryPoker,now:number):MemoryPoker{
 const n=s.seats.length
 const entries:Entry[]=s.seats.map((seat,i)=>{
  const cards=s.picks[i]?.map(position=>({position,card:s.layout[position]}))??[]
  return {seat,cards,hand:rankPokerHand(cards.map(c=>c.card)),points:0,peeked:s.peeks[i]!==null}
 })
 const ranked=entries.flatMap((entry,i)=>entry.hand?[{i,hand:entry.hand}]:[]).sort((a,b)=>compare(b.hand,a.hand))
 const points=s.seats.map(()=>0)
 if(n===1&&ranked.length)points[0]=(ranked[0].hand.strength[0]+1)*scoreUnit
 else for(let offset=0;offset<ranked.length;){
  let end=offset+1
  while(end<ranked.length&&compare(ranked[offset].hand,ranked[end].hand)===0)end++
  // Average of the N-minus-rank credits for this contiguous tie interval.
  const credit=(2*n-1-offset-end)*scoreUnit/2
  for(let i=offset;i<end;i++)points[ranked[i].i]=credit
  offset=end
 }
 for(let i=0;i<n;i++){
  if(entries[i].peeked)points[i]-=scoreUnit
  entries[i].points=points[i]/scoreUnit
 }
 return {...s,phase:'reveal',deadline:now+memoryPokerReveal,scores:s.scores.map((score,i)=>score+points[i]),
  results:[...s.results,{round:s.round,entries}]}
}
export function memoryPokerTick(s:MemoryPoker,now:number):MemoryPoker{
 // Cross elapsed deadlines at their recorded timestamps, never granting time because a tab slept.
 while(Number.isFinite(now)&&s.phase!=='finished'&&now>=s.deadline){
  const at=s.deadline
  if(s.phase==='study')s={...s,phase:'select',deadline:at+memoryPokerSelect}
  else if(s.phase==='select')s=reveal(s,at)
  else if(s.round===memoryPokerRounds){
   const best=Math.max(...s.scores)
   const leaders=s.seats.filter((_,i)=>s.scores[i]===best)
   s={...s,phase:'finished',winner:s.seats.length>1&&leaders.length===1?leaders[0]:null}
  }else{
   const round=s.round+1
   s={...s,round,phase:'study',deadline:at+memoryPokerStudy,layout:memoryPokerDeal(s.seed,round),
    picks:blanks<number[]>(s.seats),peeks:blanks<number>(s.seats)}
  }
 }
 return s
}
export function memoryPokerAction(old:MemoryPoker,seat:string,code:number,now:number):MemoryPoker|null{
 const s=memoryPokerTick(old,now)
 const i=s.seats.indexOf(seat)
 // A command never crosses a round boundary into a new hand even if host ticking lags.
 if(!Number.isFinite(now)||i<0||s.round!==old.round||s.phase!=='select'||s.picks[i])return null
 if(fits(code-peekBase,slots)){
  if(!s.allowPeek||s.peeks[i]!==null)return null
  return {...s,peeks:s.peeks.map((p,j)=>i===j?code-peekBase:p)}
 }
 const positions=unpack(code)
 if(!positions)return null
 const next={...s,picks:s.picks.map((p,j)=>i===j?positions:p)}
 return next.picks.every(p=>p!==null)?reveal(next,now):next
}
export function memoryPokerView(s:MemoryPoker,seat:string){
 const i=s.seats.indexOf(seat)
 const mine=i<0?null:s.picks[i]
 const peek=i<0?null:s.peeks[i]
 return {round:s.round,phase:s.phase,deadline:s.phase==='finished'?null:s.deadline,
  cards:s.layout.map((card,j)=>i>=0&&(s.phase==='study'||(s.phase==='select'&&!mine&&peek===j))?card:null),
  mine:s.phase==='select'?mine:null,submitted:s.picks.filter(p=>p!==null).length,
  canPeek:i>=0&&s.allowPeek&&s.phase==='select'&&!mine&&peek===null,
  peekEnabled:s.allowPeek,scores:s.scores.map(points=>points/scoreUnit),results:s.results,winner:s.winner}
}
