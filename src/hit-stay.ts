export const hitRules={target:21,chips:20,ante:2,maxSeats:8,maxCards:7,rounds:8,reviewMs:12_000}
export const hitActions=['hit','stay','deal'] as const
export type HitAction=typeof hitActions[number]
export const hitStepLimit=hitRules.rounds*(hitRules.maxSeats*(hitRules.maxCards-1)+1)
const suits=['spade','diamond','club','heart'] as const
export type HitCard={rank:number;suit:typeof suits[number]}
type HandStatus='out'|'playing'|'stayed'|'bust'
type Hand={cards:HitCard[];status:HandStatus}
type Phase={kind:'turn';actor:number;deadline:number}|{kind:'review';nextAt:number}|{kind:'finished'}
type Reveal={winners:string[];paid:number}
export type HitState={
 seats:string[];hands:Hand[];chips:number[];pot:number;round:number;step:number;opener:number;
 phase:Phase;shoe:HitCard[];nextShoe:number;seed:number;window:number;result:Reveal|null;
 shoes:readonly (readonly HitCard[])[];
}

function seededIndex(seed:number){
 let state=seed|0
 return (bound:number)=>{
  state=(state+0x6d2b79f5)|0
  let word=Math.imul(state^state>>>15,state|1)
  word^=word+Math.imul(word^word>>>7,word|61)
  return ((word^word>>>14)>>>0)%bound
 }
}
export function hitDeck(seats:number,index:(upper:number)=>number):HitCard[]{
 const single=suits.flatMap(suit=>Array.from({length:13},(_,i)=>({rank:i+1,suit})))
 const deck=seats*hitRules.maxCards>52?[...single,...single]:single
 for(let i=deck.length-1;i>0;i--){
  const j=index(i+1)
  ;[deck[i],deck[j]]=[deck[j],deck[i]]
 }
 return deck
}
export function hitTotal(cards:readonly HitCard[]){
 const low=cards.reduce((n,c)=>n+Math.min(c.rank,10),0)
 return low+Number(low<=11&&cards.some(c=>c.rank===1))*10
}
function beginHand(g:HitState,round:number,opener:number,now:number):HitState{
 const {seats}=g
 const order=seats.map((_,i)=>(opener+i)%seats.length).filter(i=>g.chips[i]>=hitRules.ante)
 const needsShoe=g.shoe.length<order.length*hitRules.maxCards
 const shoe=needsShoe?[...(g.shoes[g.nextShoe]??hitDeck(seats.length,seededIndex(g.seed^Math.imul(g.nextShoe+1,0x9e3779b9))))]:[...g.shoe]
 const hands:Hand[]=seats.map(()=>({cards:[],status:'out'}))
 for(let p=0;p<2;p++)for(const i of order){
  hands[i].cards.push(shoe.shift()!)
  hands[i].status='playing'
 }
 return {...g,round,opener:order[0],hands,shoe,nextShoe:g.nextShoe+Number(needsShoe),pot:order.length*hitRules.ante,result:null,
  chips:g.chips.map((n,i)=>hands[i].status==='out'?n:n-hitRules.ante),
  phase:{kind:'turn',actor:order[0],deadline:now+g.window}}
}
export function hitStart(seats:readonly string[],seed:number,now:number,window:number,shoes:HitState['shoes']=[],first=(seed>>>0)%seats.length):HitState{
 if(seats.length<2||seats.length>hitRules.maxSeats||seats.some(id=>!id)||new Set(seats).size!==seats.length)throw new RangeError('Hit, Stay requires 2–8 distinct seats')
 return beginHand({seats:[...seats],hands:[],chips:seats.map(()=>hitRules.chips),pot:0,round:0,step:0,opener:first,
  phase:{kind:'finished'},shoe:[],nextShoe:0,seed,window,result:null,shoes},1,first,now)
}
function resolve(g:HitState,now:number):HitState{
 const sorted=g.seats.map((_,i)=>(g.opener+i)%g.seats.length)
 const stands=sorted.filter(i=>g.hands[i].status==='stayed')
 const best=Math.max(...stands.map(i=>hitTotal(g.hands[i].cards)))
 const winners=stands.filter(i=>hitTotal(g.hands[i].cards)===best)
 const chips=[...g.chips]
 if(winners.length){
  const share=Math.floor(g.pot/winners.length),remainder=g.pot%winners.length
  winners.forEach((i,order)=>{chips[i]+=share+Number(order<remainder)})
 }else{
  g.hands.forEach(({status},i)=>{if(status==='bust')chips[i]+=hitRules.ante})
 }
 const finished=g.round>=hitRules.rounds||chips.filter(n=>n>=hitRules.ante).length<=1
 return {...g,chips,pot:0,result:{winners:winners.map(i=>g.seats[i]),paid:g.pot},
  phase:finished?{kind:'finished'}:{kind:'review',nextAt:now+hitRules.reviewMs}}
}
function play(g:HitState,actor:number,action:'hit'|'stay',now:number):HitState{
 const drawing=action==='hit',hands=[...g.hands],shoe=drawing?g.shoe.slice(1):g.shoe
 const cards=drawing?[...hands[actor].cards,g.shoe[0]]:hands[actor].cards
 const status=hitTotal(cards)>hitRules.target?'bust':action==='stay'||cards.length>=hitRules.maxCards?'stayed':'playing'
 hands[actor]={cards,status}
 const next={...g,hands,shoe,step:g.step+1}
 for(let delta=1;delta<=g.seats.length;delta++){
  const i=(actor+delta)%g.seats.length
  if(hands[i].status==='playing')return {...next,phase:{kind:'turn',actor:i,deadline:now+g.window}}
 }
 return resolve(next,now)
}
function nextHand(g:HitState,now:number){
 return beginHand({...g,step:g.step+1},g.round+1,(g.opener+1)%g.seats.length,now)
}
export function hitApply(g:HitState,seat:string,action:unknown,now:number):HitState|null{
 if(g.phase.kind==='review')return action==='deal'&&g.seats.includes(seat)&&now<g.phase.nextAt?nextHand(g,now):null
 if(g.phase.kind!=='turn'||g.seats[g.phase.actor]!==seat||now>=g.phase.deadline||(action!=='hit'&&action!=='stay'))return null
 return play(g,g.phase.actor,action,now)
}
export function hitTick(g:HitState,now:number):HitState{
 if(g.phase.kind==='turn'&&now>=g.phase.deadline)return play(g,g.phase.actor,'stay',now)
 if(g.phase.kind==='review'&&now>=g.phase.nextAt)return nextHand(g,now)
 return g
}
export function hitView(g:HitState,seat?:string){
 const visible=(cards:readonly HitCard[])=>cards.map(c=>({...c}))
 const seats=g.seats.map((id,i)=>({id,chips:g.chips[i],status:g.hands[i].status,count:g.hands[i].cards.length}))
 const i=seat===undefined?-1:g.seats.indexOf(seat)
 const mine=i<0||g.phase.kind!=='turn'||g.hands[i].status==='out'?null:{cards:visible(g.hands[i].cards),total:hitTotal(g.hands[i].cards)}
 const reveal=g.result&&{winners:[...g.result.winners],paid:g.result.paid,rows:seats.flatMap((row,k)=>row.status==='out'?[]:[{
  ...row,cards:visible(g.hands[k].cards),total:hitTotal(g.hands[k].cards)
 }])}
 return {seats,mine,reveal,round:g.round,step:g.step,pot:g.pot,opener:g.seats[g.opener],phase:g.phase.kind,
  turn:g.phase.kind==='turn'?g.seats[g.phase.actor]:null,deadline:g.phase.kind==='turn'?g.phase.deadline:null,
  leaders:g.phase.kind==='finished'?g.seats.filter((_,k)=>g.chips[k]===Math.max(...g.chips)):[]}
}
export type HitView=ReturnType<typeof hitView>
export function hitBot(v:HitView,seat:string,level:'easy'|'normal'|'hard'='normal'){
 if(v.turn!==seat||!v.mine)return null
 const hardTotal=v.mine.cards.reduce((sum,c)=>sum+Math.min(c.rank,10),0)
 const threshold=level==='easy'?14:17
 return v.mine.total<threshold||level==='hard'&&v.mine.total===17&&hardTotal<17?'hit':'stay'
}
