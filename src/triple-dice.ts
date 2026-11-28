export const diceRounds=8
export const diceReviewMs=6000
export const diceBands=['low','mid','high'] as const
export type DiceBand=typeof diceBands[number]
export const diceBand=(points:number):DiceBand=>points<4?'low':points<7?'mid':'high'

const faces=[1,2,3,4,5,6] as const
export type Die=typeof faces[number]
export type DiceHand=readonly [Die,Die,Die,Die]
type Three=readonly [Die,Die,Die]
type Positions=readonly [number,number,number]
type DiceChoice={positions:Positions;prediction:DiceBand}
type DiceRank={name:'Triple'|'Straight'|'Double'|'High dice';strength:number}
type DiceResult={seat:string;dice:Three|null;pattern:DiceRank['name']|null;rank:number|null;base:number;prediction:DiceBand|null;actual:DiceBand|null;points:number}
type DiceDeal=readonly (readonly DiceHand[])[]
export type DiceView={
 phase:'select'|'review'|'done';round:number;deadline:number|null
 table:{seat:string;publicDice:[Die,Die];total:number}[]
 mine:{dice:readonly [Die,Die,Die,null];choice:DiceChoice|null}|null
 reveal:DiceResult[]|null;leaders:string[]
}
export type DiceState=Readonly<{
 phase:'select'|'review'|'done';round:number;deadline:number|null;opened:number;window:number
 seats:readonly string[];deal:DiceDeal;locks:ReadonlyMap<string,DiceChoice>;totals:readonly number[]
 reveal:readonly DiceResult[]|null;leaders:readonly string[]
}>

const triplets:readonly Positions[]=[[0,1,2],[0,1,3],[0,2,3],[1,2,3]]
const three=(hand:DiceHand,positions:Positions):Three=>[hand[positions[0]],hand[positions[1]],hand[positions[2]]]

export function rankDice(dice:Three):DiceRank{
 const [a,b,c]=dice.slice().sort((x,y)=>y-x)
 // Base-seven digits pack exactly the written category and lexicographic face order.
 if(a===c)return {name:'Triple',strength:3*343+a}
 if(a===b+1&&b===c+1)return {name:'Straight',strength:2*343+a}
 if(a===b||b===c)return {name:'Double',strength:343+b*7+(a===b?c:a)}
 return {name:'High dice',strength:a*49+b*7+c}
}
export const compareDice=(a:DiceRank,b:DiceRank)=>a.strength-b.strength

function picker(seed:number){
 let state=seed>>>0
 return (size:number)=>{
  let x=state=(state+0x6d2b79f5)>>>0
  x=Math.imul(x^(x>>>15),x|1)
  x^=x+Math.imul(x^(x>>>7),x|61)
  return Math.floor(((x^(x>>>14))>>>0)*size/2**32)
 }
}
export function diceDeal(count:number,roll:()=>Die):DiceHand[][]{
 if(!Number.isInteger(count)||count<2||count>8)throw new TypeError('Expected 2–8 Triple Dice seats.')
 return Array.from({length:diceRounds},()=>Array.from({length:count},()=>[roll(),roll(),roll(),roll()]))
}
export function diceStart(seats:readonly string[],now:number,window:number,seed=0,deal?:DiceDeal):DiceState{
 if(seats.length<2||seats.length>8||new Set(seats).size!==seats.length||seats.some(s=>!s.trim()))throw new TypeError('Expected 2–8 different Triple Dice seats.')
 if(!Number.isSafeInteger(now)||!Number.isSafeInteger(window)||window<=0||!Number.isSafeInteger(now+window)||!Number.isSafeInteger(seed))throw new TypeError('Invalid Triple Dice settings.')
 const pick=picker(seed)
 const bank=deal??diceDeal(seats.length,()=>faces[pick(faces.length)])
 if(bank.length!==diceRounds||Array.from(bank).some(row=>!row||row.length!==seats.length||Array.from(row).some(tray=>!tray||tray.length!==4||Array.from(tray).some(face=>!faces.includes(face)))))throw new TypeError('Invalid Triple Dice deal.')
 return {phase:'select',round:1,deadline:now+window,opened:now,window,seats:[...seats],
  deal:bank.map(row=>row.map(([a,b,c,d])=>[a,b,c,d])),locks:new Map(),totals:seats.map(()=>0),reveal:null,leaders:[]}
}

function settle(s:DiceState,now:number):DiceState{
 const hands=s.seats.flatMap((seat,i)=>{
  const lock=s.locks.get(seat)
  if(!lock)return []
  const dice=three(s.deal[s.round-1][i],lock.positions)
  return [{seat,dice,pattern:rankDice(dice),prediction:lock.prediction}]
 })
 const ranked=hands.map((entry):DiceResult=>{
  let above=0,tied=0
  for(const rival of hands){const diff=compareDice(rival.pattern,entry.pattern);if(diff>0)above++;else if(!diff)tied++}
  const rank=1+above+(tied-1)/2,base=s.seats.length-rank,actual=diceBand(base)
  return {...entry,pattern:entry.pattern.name,rank,base,actual,points:Math.max(0,base+(entry.prediction===actual?3:-1))}
 })
 const bySeat=new Map(ranked.map(row=>[row.seat,row]))
 const reveal=s.seats.map(seat=>bySeat.get(seat)??{seat,dice:null,pattern:null,rank:null,base:0,prediction:null,actual:null,points:0})
 const totals=s.totals.map((points,i)=>points+reveal[i].points)
 const done=s.round===diceRounds
 return {...s,reveal,totals,phase:done?'done':'review',deadline:done?null:now+diceReviewMs,opened:now,
  leaders:done?s.seats.filter((_,i)=>totals[i]===Math.max(...totals)):[]}
}

export function diceLock(s:DiceState,seat:string,positions:readonly number[],prediction:unknown,now:number):DiceState|null{
 if(s.phase!=='select'||s.deadline===null||!Number.isSafeInteger(now)||now>=s.deadline||now<s.opened||!s.seats.includes(seat)||s.locks.has(seat))return null
 const p=Array.isArray(positions)?Array.from(positions):[]
 if(p.length!==3||new Set(p).size!==3||p.some(i=>!Number.isInteger(i)||i<0||i>3)||!diceBands.some(b=>b===prediction))return null
 p.sort((a,b)=>a-b)
 const locks=new Map(s.locks).set(seat,{positions:[p[0],p[1],p[2]],prediction:prediction as DiceBand})
 const next={...s,locks}
 return locks.size===s.seats.length?settle(next,now):next
}
export function diceTick(s:DiceState,now:number):DiceState{
 if(s.deadline===null||!Number.isSafeInteger(now)||now<s.deadline)return s
 if(s.phase==='select')return settle(s,now)
 return {...s,phase:'select',round:s.round+1,deadline:now+s.window,opened:now,locks:new Map()}
}
export function diceView(s:DiceState,seat?:string):DiceView{
 const at=seat===undefined?-1:s.seats.indexOf(seat)
 const deal=s.deal[s.round-1], offset=(s.round-1)%s.seats.length
 const table=Array.from({length:s.seats.length},(_,i)=>{
  const j=(offset+i)%s.seats.length
  return {seat:s.seats[j],publicDice:[deal[j][0],deal[j][1]] as [Die,Die],total:s.totals[j]}
 })
 const choice=at<0?null:s.locks.get(s.seats[at])??null
 return {phase:s.phase,round:s.round,deadline:s.deadline,table,
  mine:at<0?null:{dice:[deal[at][0],deal[at][1],deal[at][2],null],choice:choice?{positions:[...choice.positions],prediction:choice.prediction}:null},
  reveal:s.reveal?.map(r=>({...r,dice:r.dice?[...r.dice]:null}))??null,leaders:[...s.leaders]}
}

export function diceBot(v:DiceView,seed:number,level:'easy'|'normal'|'hard',seat:string):DiceChoice|null{
 if(v.phase!=='select'||!v.mine||v.mine.choice)return null
 const pick=picker(seed),known=v.mine.dice
 if(level==='easy')return {positions:triplets[pick(triplets.length)],prediction:'low'}
 const opponents=v.table.filter(t=>t.seat!==seat)
 const samples=Array.from({length:level==='hard'?64:24},()=>({
  blind:faces[pick(6)],
  rival:opponents.map(({publicDice:[a,b]})=>{
   const tray:DiceHand=[a,b,faces[pick(6)],faces[pick(6)]]
   return Math.max(...triplets.map(p=>rankDice(three(tray,p)).strength))
  })
 }))
 let best=-Infinity,choice:DiceChoice|null=null
 for(const positions of triplets){
  const totals=diceBands.map(()=>0)
  for(const {blind,rival} of samples){
   const rank=rankDice(three([known[0],known[1],known[2],blind],positions)).strength
   const base=v.table.length-1-rival.filter(r=>r>rank).length-rival.filter(r=>r===rank).length/2
   for(const [i,band] of diceBands.entries())totals[i]+=Math.max(0,base+(band===diceBand(base)?3:-1))
  }
  for(const [i,prediction] of diceBands.entries())if(totals[i]>best){best=totals[i];choice={positions,prediction}}
 }
 return choice
}
