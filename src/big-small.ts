export type BigSmallDirection='big'|'small'
type Seal={card:number;call:BigSmallDirection}
type Prediction={prediction:BigSmallDirection;stake:number}
export type BigSmallAction=({kind:'seal'}&Seal)|({kind:'predict'}&Prediction)|{kind:'advance'}
type SeatIndex=0|1
type SetKind='regular'|'tiebreak'
type End='stack-empty'|'round-limit'|'tiebreak'|'draw'
type Ledger=Readonly<{chips:number;cards:readonly number[];references:readonly number[]}>
type Round=Readonly<Seal&Prediction&{
 set:SetKind;round:number;duelist:string;bettor:string;reference:number;relation:BigSmallDirection|'equal';
 duelistDelta:number;bettorDelta:number
}>
type Stage=
 |{phase:'seal'}
 |{phase:'predict';seal:Seal}
 |{phase:'reveal';tiePending:boolean}
 |{phase:'finished';winner:string|null;end:End}
export type BigSmallState=Readonly<{
 seats:readonly [string,string];ledgers:readonly [Ledger,Ledger];stage:Readonly<Stage>;
 opener:SeatIndex;set:SetKind;round:number;step:number;history:readonly Round[];seed:number
}>
export type BigSmallView={
 phase:Stage['phase'];set:SetKind;round:number;totalRounds:number;step:number;seats:[string,string];chips:[number,number];
 duelist:string|null;bettor:string|null;reference:number|null;ownCards:number[];ownSeal:Seal|null;sealed:boolean;
 maxStake:number;latest:Round|null;history:Round[];tiePending:boolean;winner:string|null;end:End|null
}
const cards=Array.from({length:11},(_,i)=>i)
const references=cards.slice(1,-1)
const other=(i:SeatIndex):SeatIndex=>i===0?1:0
const duelistIndex=(s:BigSmallState):SeatIndex=>s.round%2===1?s.opener:other(s.opener)
const roundLimit=(set:SetKind)=>set==='regular'?18:2
const isDirection=(s:unknown):s is BigSmallDirection=>s==='big'||s==='small'
const compare=(card:number,reference:number)=>card===reference?'equal':card>reference?'big':'small'
const stakeLimit=(chips:number)=>Math.min(3,chips)

function random(seed:number){
 let state=seed|0
 return ()=>{
  state=(state+0x6d2b79f5)|0
  let x=Math.imul(state^(state>>>15),1|state)
  x^=x+Math.imul(x^(x>>>7),61|x)
  return ((x^(x>>>14))>>>0)/4294967296
 }
}
function freshLedgers(seed:number,set:SetKind):[Ledger,Ledger]{
 const pick=random(seed^(set==='tiebreak'?0x1b873593:0))
 const ledger=()=>{
  const deck=references.slice()
  for(let i=deck.length-1;i>0;i--){
   const j=Math.floor(pick()*(i+1))
   ;[deck[i],deck[j]]=[deck[j],deck[i]]
  }
  return {chips:10,cards:cards.slice(),references:set==='tiebreak'?deck.slice(0,1):deck}
 }
 return [ledger(),ledger()]
}
export function bigSmallStart(seats:readonly string[],seed:number):BigSmallState{
 if(seats.length!==2||seats[0]===seats[1]||seats.some(s=>typeof s!=='string'||!s.trim())||!Number.isSafeInteger(seed))throw new TypeError('Big Small needs two different seats and an integer seed.')
 return {seats:[seats[0],seats[1]],ledgers:freshLedgers(seed,'regular'),stage:{phase:'seal'},opener:0,set:'regular',round:1,step:0,history:[],seed}
}

export function bigSmallStep(s:BigSmallState,seat:string,a:BigSmallAction):BigSmallState|null{
 if(!a||!s.seats.includes(seat))return null
 const {stage,set,round,seats,ledgers}=s,d=duelistIndex(s),b=other(d),step=s.step+1
 const duel=ledgers[d],bet=ledgers[b]
 if(stage.phase==='seal'&&a.kind==='seal'){
  if(seat!==seats[d]||!duel.cards.includes(a.card)||!isDirection(a.call))return null
  return {...s,step,stage:{phase:'predict',seal:{card:a.card,call:a.call}}}
 }
 if(stage.phase==='predict'&&a.kind==='predict'){
  const max=stakeLimit(bet.chips)
  if(seat!==seats[b]||!isDirection(a.prediction)||!Number.isInteger(a.stake)||a.stake<(max===0?0:1)||a.stake>max)return null
  const {card,call}=stage.seal,reference=duel.references[0],relation=compare(card,reference)
  const duelistDelta=relation===call?Math.abs(card-reference):0
  const bettorDelta=relation==='equal'?0:relation===a.prediction?a.stake:-a.stake
  const settled:[Ledger,Ledger]=[...ledgers]
  settled[d]={chips:duel.chips+duelistDelta,cards:duel.cards.filter(n=>n!==card),references:duel.references.slice(1)}
  settled[b]={...bet,chips:bet.chips+bettorDelta}
  const left=settled[0].chips,right=settled[1].chips,winner=left===right?null:seats[left>right?0:1]
  const empty=left===0||right===0,last=round===roundLimit(set)
  const end=empty?'stack-empty':last&&set==='tiebreak'?winner?'tiebreak':'draw':last&&winner?'round-limit':null
  const next:Stage=end?{phase:'finished',winner,end}:{phase:'reveal',tiePending:last}
  return {...s,step,ledgers:settled,stage:next,history:[...s.history,{set,round,duelist:seats[d],bettor:seats[b],reference,card,call,relation,prediction:a.prediction,stake:a.stake,duelistDelta,bettorDelta}]}
 }
 if(stage.phase==='reveal'&&a.kind==='advance'){
  if(stage.tiePending)return {...s,step,opener:other(s.opener),set:'tiebreak',round:1,ledgers:freshLedgers(s.seed,'tiebreak'),stage:{phase:'seal'}}
  return {...s,step,round:round+1,stage:{phase:'seal'}}
 }
 return null
}

export function bigSmallView(s:BigSmallState,seat?:string):BigSmallView{
 const {stage,seats,ledgers,set,round,step}=s,d=duelistIndex(s),b=other(d),{phase}=stage
 const index=seats.indexOf(seat??'')
 const finished=phase==='finished',reviewing=phase==='reveal'||finished
 const latest=reviewing?s.history.at(-1)??null:null
 return {phase,set,round,totalRounds:roundLimit(set),step,seats:[...seats],chips:[ledgers[0].chips,ledgers[1].chips],
  duelist:seats[d],bettor:seats[b],reference:latest?.reference??ledgers[d].references[0]??null,
  ownCards:index===-1||finished?[]:[...ledgers[index as SeatIndex].cards],
  ownSeal:phase==='predict'&&seat===seats[d]?{...stage.seal}:null,sealed:phase==='predict',
  maxStake:phase==='predict'&&seat===seats[b]?stakeLimit(ledgers[b].chips):0,
  latest:latest?{...latest}:null,history:s.history.map(r=>({...r})),
  tiePending:phase==='reveal'&&stage.tiePending,winner:finished?stage.winner:null,end:finished?stage.end:null}
}

/** The bot can see its own hand, the current reference, and the revealed ledger, never the deal seed. */
export function bigSmallBot(v:BigSmallView,seat:string,seed:number,level:'easy'|'normal'|'hard'):BigSmallAction|null{
 if(v.reference===null)return null
 const ref=v.reference,pick=random(seed^Math.imul(v.step+1,0x9e3779b9))
 if(v.phase==='seal'&&v.duelist===seat&&v.ownCards.length){
  const hand=[...v.ownCards].sort((a,b)=>Math.abs(b-ref)-Math.abs(a-ref))
  const n=level==='hard'?1:level==='normal'?Math.min(3,hand.length):hand.length
  const card=hand[Math.floor(pick()*n)]
  return {kind:'seal',card,call:card>=ref?'big':'small'}
 }
 if(v.phase==='predict'&&v.bettor===seat){
  const used=new Set(v.history.filter(r=>r.set===v.set&&r.duelist===v.duelist).map(r=>r.card))
  let big=0,small=0
  for(const n of cards){
   if(n===ref||used.has(n))continue
   const weight=level==='hard'?Math.abs(n-ref):1
   if(n>ref)big+=weight
   else small+=weight
  }
  const prediction=level==='easy'||big===small?pick()<.5?'big':'small':big>small?'big':'small'
  const confident=Math.max(big,small)>1.6*Math.min(big,small)
  return {kind:'predict',prediction,stake:Math.min(v.maxStake,level==='hard'&&confident?3:level==='normal'&&confident?2:1)}
 }
 return null
}
