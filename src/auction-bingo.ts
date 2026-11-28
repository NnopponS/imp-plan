export const bingoRounds=7
export const bingoReviewMs=4000
export const bingoShapes=['triangle','circle','star'] as const
export type BingoShape=typeof bingoShapes[number]
export const bingoCoinFaces=[1,1,1,2,2,2,3,3,5,10] as const
export const bingoAllCoins=(1<<bingoCoinFaces.length)-1
export const bingoCard=['triangle','circle','star','circle','triangle','star','star','circle','triangle'] as const
export const bingoLines=[[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]]
const lineMasks=bingoLines.map(line=>line.reduce((mask,i)=>mask|(1<<i),0))
export type BingoPrice=number|'sealed'|null
export type BingoAction={kind:'select';shape:BingoShape}|{kind:'bid';coins:number}
type Phase='select'|'bid'|'review'|'done'
type Shapes=[number,number,number]
type Fit={mask:number;cells:number;lines:number}
type Result=Fit&{seat:string;rank:number;bank:number;shapes:Shapes}
type Prices=[BingoPrice,BingoPrice,BingoPrice]

export type BingoState=Readonly<{
 phase:Phase;round:number;opened:number;window:number;deadline:number|null;seats:readonly string[]
 choices:readonly (BingoShape|null)[];bids:readonly (number|null)[];coins:readonly number[]
 awards:readonly Shapes[];prices:Prices|null;results:Result[]|null
}>
export type BingoView={
 phase:Phase;round:number;deadline:number|null;seats:string[]
 choices:(BingoShape|null)[]|null;prices:Prices|null
 mine:{choice:BingoShape|null;coins:number;bid:number|null}|null
 results:Result[]|null;leaders:string[]
}
export const bingoCoinValue=(mask:number)=>bingoCoinFaces.reduce((value,face,i)=>value+((mask&(1<<i))?face:0),0)
const validClock=(n:number)=>Number.isSafeInteger(n)&&n>=0&&n<Number.MAX_SAFE_INTEGER-1e6

export function bingoStart(seats:readonly string[],now:number,window:number):BingoState{
 if(seats.length<2||seats.length>16||new Set(seats).size!==seats.length||seats.some(seat=>!seat.trim()))throw new RangeError('Expected 2–16 distinct Auction Bingo seats.')
 if(!validClock(now)||!Number.isSafeInteger(window)||window<1||window>900_000)throw new RangeError('Invalid Auction Bingo clock.')
 return {phase:'select',round:1,opened:now,window,deadline:now+window,seats:[...seats],
  choices:seats.map(()=>null),bids:seats.map(()=>null),coins:seats.map(()=>bingoAllCoins),
  awards:seats.map(()=>[0,0,0]),prices:null,results:null}
}

const compare=(a:Fit,b:Fit)=>b.lines-a.lines||b.cells-a.cells
const fits:readonly (Fit&{counts:Shapes})[]=Array.from({length:1<<bingoCard.length},(_,mask)=>{
 const counts:Shapes=[0,0,0]
 for(const [i,shape] of bingoCard.entries())if(mask&(1<<i))counts[bingoShapes.indexOf(shape)]++
 return {mask,counts,cells:counts[0]+counts[1]+counts[2],lines:lineMasks.filter(line=>(mask&line)===line).length}
}).sort((a,b)=>compare(a,b)||a.mask-b.mask)
export function bingoFit(shapes:readonly number[]):Fit{
 const {mask,cells,lines}=fits.find(f=>f.counts.every((count,i)=>count<=shapes[i]))??fits.at(-1)!
 return {mask,cells,lines}
}
function finish(s:BingoState):BingoState{
 const order=s.seats.map((seat,i)=>({seat,shapes:s.awards[i],...bingoFit(s.awards[i]),bank:bingoCoinValue(s.coins[i])}))
 const score=(a:typeof order[number],b:typeof order[number])=>compare(a,b)||b.bank-a.bank
 order.sort(score)
 let rank=1
 const results=order.map((entry,i)=>{
  if(i&&score(entry,order[i-1]))rank=i+1
  return {...entry,rank}
 })
 return {...s,phase:'done',deadline:null,results}
}
function settle(s:BingoState,now:number):BingoState{
 const awards=s.awards.map(counts=>[...counts] as Shapes)
 const values=s.bids.map(mask=>bingoCoinValue(mask??0))
 const highs=bingoShapes.map((shape,k)=>{
  const tickets=s.choices.flatMap((choice,i)=>choice===shape?[i]:[])
  const bidders=tickets.filter(i=>values[i]>0)
  if(!bidders.length)return null
  const highest=Math.max(...bidders.map(i=>values[i]))
  const winners=bidders.filter(i=>values[i]===highest)
  const each=Math.floor(tickets.length/winners.length)
  for(const i of winners)awards[i][k]+=each
  return highest
 })
 const high=Math.max(0,...highs.map(value=>value??0))
 const prices=highs.map(value=>value===high?'sealed':value) as Prices
 return {...s,phase:'review',opened:now,deadline:now+bingoReviewMs,prices,awards,
  coins:s.coins.map((mask,i)=>mask&~(s.bids[i]??0))}
}
function openBids(s:BingoState,now:number):BingoState{
 return s.choices.every(shape=>shape===null)?settle(s,now):{...s,phase:'bid',opened:now,deadline:now+s.window}
}

export function bingoApply(s:BingoState,seat:string,action:BingoAction,now:number):BingoState|null{
 const index=s.seats.indexOf(seat)
 if(index<0||s.deadline===null||!validClock(now)||now<s.opened||now>=s.deadline)return null
 if(action.kind==='select'&&s.phase==='select'){
  if(s.choices[index]!==null||!bingoShapes.includes(action.shape))return null
  const next={...s,choices:s.choices.map((shape,i)=>i===index?action.shape:shape)}
  return next.choices.every(shape=>shape!==null)?openBids(next,now):next
 }
 if(action.kind==='bid'&&s.phase==='bid'){
  const coins=action.coins
  if(s.choices[index]===null||s.bids[index]!==null||!Number.isInteger(coins)||coins<0||coins>bingoAllCoins||(coins&s.coins[index])!==coins)return null
  const next={...s,bids:s.bids.map((mask,i)=>i===index?coins:mask)}
  return next.choices.every((shape,i)=>shape===null||next.bids[i]!==null)?settle(next,now):next
 }
 return null
}
export function bingoAdvance(s:BingoState,now:number):BingoState{
 if(s.deadline===null||!validClock(now)||now<s.deadline)return s
 if(s.phase==='select')return openBids(s,now)
 if(s.phase==='bid')return settle(s,now)
 if(s.round===bingoRounds)return finish(s)
 return {...s,phase:'select',round:s.round+1,opened:now,deadline:now+s.window,
  choices:s.seats.map(()=>null),bids:s.seats.map(()=>null),prices:null}
}
export function bingoView(s:BingoState,seat?:string):BingoView{
 const i=seat===undefined?-1:s.seats.indexOf(seat)
 const bid=i<0?null:s.bids[i]
 return {phase:s.phase,round:s.round,deadline:s.deadline,seats:[...s.seats],
  choices:s.phase==='select'?null:[...s.choices],prices:s.prices?[...s.prices]:null,
  mine:i<0?null:{choice:s.choices[i],coins:s.coins[i],bid:bid===null?null:bingoCoinValue(bid)},
  results:s.results?.map(row=>({...row,shapes:[...row.shapes]}))??null,
  leaders:s.results?.filter(row=>row.rank===1).map(row=>row.seat)??[]}
}
export function bingoBot(v:BingoView,seed:number,level:'easy'|'normal'|'hard',seat:string):BingoAction|null{
 if(!v.mine)return null
 const variation=(Math.imul(seed^0x53bfb975,0x9e3779b9)>>>0)%7
 const shape=bingoShapes[(Math.floor((v.round+variation-1)/(level==='easy'?1:2))+variation)%3]
 if(v.phase==='select'&&!v.mine.choice)return {kind:'select',shape}
 if(v.phase!=='bid'||!v.mine.choice||v.mine.bid!==null)return null
 const demand=v.choices!.filter((choice,i)=>v.seats[i]!==seat&&choice===v.mine!.choice).length
 const reserve=bingoRounds-v.round
 const cap=reserve===0&&level!=='easy'&&demand>0?30:demand===0?1:2+(level==='hard'?3:level==='normal'?2:0)+variation%3
 let best=0
 for(let mask=v.mine.coins;mask>0;mask=(mask-1)&v.mine.coins){
  if(reserve>0&&(v.mine.coins&~mask).toString(2).replace(/0/g,'').length<reserve)continue
  if(!best||Math.abs(bingoCoinValue(mask)-cap)<Math.abs(bingoCoinValue(best)-cap))best=mask
 }
 return {kind:'bid',coins:best}
}
