export const piggyRules={min:3,max:8,practiceSeats:4,maxCoins:5,goal:5,exchanges:24,resets:4,
 depositMs:30_000,claimMs:20_000,doubtMs:10_000,challengeMs:35_000,reviewMs:3_500} as const
export const piggyCountMax=1+piggyRules.exchanges*piggyRules.maxCoins
export type PiggyColor='black'|'white'
export type PiggyCoins={black:number,white:number}
type Bank=PiggyCoins&{id:number}
export type PiggyPass=PiggyCoins&{bank:number,from:number,to:number}
type Claim={bank:number,color:PiggyColor,count:number|null}
type Verdict={kind:'doubt',caller:number,answerer:number,correct:boolean,bank:Bank,claim:Claim}
 |{kind:'challenge',challenger:number,correct:boolean}
 |{kind:'reset'}
type Stage={kind:'deposit',actor:number}|{kind:'claim',actor:number,color:PiggyColor}
 |{kind:'doubt',actor:number,claim:Claim,passes:number[]}
 |{kind:'challenge',actor:number}
 |{kind:'review',verdict:Verdict,next:{kind:'replace',starter:number}|{kind:'reset',starter:number}}
 |{kind:'done',reason:'goal'|'limit',verdict:Verdict|null}
export type PiggyCommand={kind:'pass-bank',black:number,white:number,to:number}
 |{kind:'claim',count:number}|{kind:'doubt'}|{kind:'accept'}|{kind:'reset'}
 |{kind:'challenge',counts:PiggyCoins[]}|{kind:'skip'}
export type PiggyBank={seats:readonly string[],banks:Bank[],bottom:number[],top:number|null,scores:number[],
 stage:Stage,step:number,exchange:number,color:PiggyColor,deadline:number|null,opened:number,practice:boolean,
 lastPass:PiggyPass|null,resetVotes:number[],resets:number,nextBank:number,salt:number}

const bank=(id:number):Bank=>({id,black:1,white:1})
const otherColor=(color:PiggyColor):PiggyColor=>color==='black'?'white':'black'
const nextSeat=(g:PiggyBank,i:number)=>(i+1)%g.seats.length
const windowFor={deposit:piggyRules.depositMs,claim:piggyRules.claimMs,doubt:piggyRules.doubtMs,challenge:piggyRules.challengeMs,review:piggyRules.reviewMs,done:null}
const enter=(g:PiggyBank,stage:Stage,now:number):PiggyBank=>{
 const ms=windowFor[stage.kind]
 const untimed=g.practice&&(stage.kind==='deposit'||stage.kind==='claim'||stage.kind==='challenge')
 return {...g,stage,step:g.step+1,opened:now,deadline:ms===null||untimed?null:now+ms}
}
export function piggyStart(seats:readonly string[],seed:number,now:number,practice=false):PiggyBank{
 if(new Set(seats).size!==seats.length||seats.length<piggyRules.min||seats.length>piggyRules.max)throw Error('Invalid Piggy Bank seats')
 const banks=Array.from({length:seats.length+1},(_,i)=>bank(i+1))
 const starter=practice?0:(seed>>>0)%seats.length
 return enter({seats:[...seats],banks,bottom:banks.slice(0,-1).map(b=>b.id),top:banks.at(-1)!.id,scores:seats.map(()=>0),
  stage:{kind:'deposit',actor:starter},step:0,exchange:0,color:'black',opened:now,deadline:null,practice,
  lastPass:null,resetVotes:[],resets:0,nextBank:seats.length+2,salt:seed>>>0},{kind:'deposit',actor:starter},now)
}
const integer=(n:number,max:number)=>Number.isInteger(n)&&n>=0&&n<=max
const coinCount=(n:number)=>integer(n,piggyCountMax)
const activeBank=(g:PiggyBank,id:number)=>g.banks.find(b=>b.id===id)!
const mark=(g:PiggyBank,loss:number,gain?:number)=>g.scores.map((pts,i)=>pts+(i===gain?1:0)-(i===loss?1:0))

function passBank(g:PiggyBank,from:number,to:number,coins:PiggyCoins,now:number){
 const id=g.bottom[from]
 const banks=g.banks.map(b=>b.id===id?{...b,black:b.black+coins.black,white:b.white+coins.white}:b)
 const bottom=g.bottom.map((id,i)=>i===from?g.top!:id)
 return enter({...g,banks,bottom,top:id,exchange:g.exchange+1,lastPass:{bank:id,from,to,black:coins.black,white:coins.white}},
  {kind:'claim',actor:to,color:g.color},now)
}
const submitClaim=(g:PiggyBank,actor:number,count:number|null,now:number)=>
 enter(g,{kind:'doubt',actor,claim:{bank:g.top!,color:g.color,count},passes:[]},now)
function closeExchange(g:PiggyBank,actor:number,now:number){
 if(g.exchange>=piggyRules.exchanges)return enter(g,{kind:'done',reason:'limit',verdict:null},now)
 return enter({...g,color:otherColor(g.color)},{kind:'deposit',actor},now)
}
function review(g:PiggyBank,verdict:Verdict,next:Extract<Stage,{kind:'review'}>['next'],now:number){
 return enter(g,{kind:'review',verdict,next},now)
}
function closeReview(g:PiggyBank,s:Extract<Stage,{kind:'review'}>,now:number){
 if(Math.max(...g.scores)>=piggyRules.goal||g.exchange>=piggyRules.exchanges)
  return enter(g,{kind:'done',reason:Math.max(...g.scores)>=piggyRules.goal?'goal':'limit',verdict:s.verdict},now)
 if(s.next.kind==='reset'){
  const banks=Array.from({length:g.seats.length+1},(_,i)=>bank(i+1))
  return enter({...g,banks,bottom:banks.slice(0,-1).map(b=>b.id),top:banks.at(-1)!.id,color:'black',
   resets:g.resets+1,resetVotes:[],lastPass:null,nextBank:g.seats.length+2},{kind:'deposit',actor:s.next.starter},now)
 }
 const banks=g.banks.filter(b=>b.id!==g.top).concat(bank(g.nextBank))
 return enter({...g,banks,top:g.nextBank,nextBank:g.nextBank+1,color:otherColor(g.color),lastPass:null,resetVotes:[]},{kind:'deposit',actor:s.next.starter},now)
}
export function piggyApply(g:PiggyBank,seat:string,action:PiggyCommand,now:number):PiggyBank|null{
 const who=g.seats.indexOf(seat),s=g.stage
 if(who<0||s.kind==='done'||s.kind==='review'||now<g.opened||(g.deadline!==null&&now>=g.deadline))return null
 if(action.kind==='reset'&&s.kind!=='challenge'&&g.resets<piggyRules.resets&&!g.resetVotes.includes(who)){
  const resetVotes=g.resetVotes.concat(who)
  const voted={...g,resetVotes}
  if(resetVotes.length===g.seats.length-1)
   return enter(voted,{kind:'challenge',actor:g.seats.findIndex((_,i)=>!resetVotes.includes(i))},now)
  return voted
 }
 if(s.kind==='deposit'&&action.kind==='pass-bank'&&who===s.actor){
  if(!integer(action.black,piggyRules.maxCoins)||!integer(action.white,piggyRules.maxCoins)||
   action.black+action.white<1||action.black+action.white>piggyRules.maxCoins||!integer(action.to,g.seats.length-1)||action.to===who)return null
  return passBank(g,who,action.to,action,now)
 }
 if(s.kind==='claim'&&action.kind==='claim'&&who===s.actor&&coinCount(action.count))return submitClaim(g,who,action.count,now)
 if(s.kind==='doubt'&&who!==s.actor&&!s.passes.includes(who)){
  if(action.kind==='accept'){
   const passes=s.passes.concat(who)
   return passes.length===g.seats.length-1?closeExchange(g,s.actor,now):{...g,stage:{...s,passes}}
  }
  if(action.kind==='doubt'){
   const opened=activeBank(g,s.claim.bank)
   const correct=s.claim.count!==opened[s.claim.color]
   const loss=correct?s.actor:who
   return review({...g,scores:mark(g,loss,correct?who:undefined)},
    {kind:'doubt',caller:who,answerer:s.actor,correct,bank:{...opened},claim:{...s.claim}},{kind:'replace',starter:loss},now)
  }
 }
 if(s.kind==='challenge'&&who===s.actor){
  if(action.kind==='skip')return review(g,{kind:'reset'},{kind:'reset',starter:nextSeat(g,who)},now)
  if(action.kind==='challenge'&&action.counts.length===g.banks.length&&action.counts.every(c=>coinCount(c.black)&&coinCount(c.white))){
   const correct=g.banks.every((b,i)=>b.black===action.counts[i].black&&b.white===action.counts[i].white)
   const scores=g.scores.map((p,i)=>p+(i===who?(correct?3:-2):0))
   return review({...g,scores},{kind:'challenge',challenger:who,correct},{kind:'reset',starter:nextSeat(g,who)},now)
  }
 }
 return null
}
export function piggyTick(g:PiggyBank,now:number):PiggyBank{
 if(g.deadline===null||now<g.deadline)return g
 const s=g.stage
 if(s.kind==='deposit')return passBank(g,s.actor,nextSeat(g,s.actor),{black:1,white:0},now)
 if(s.kind==='claim')return submitClaim(g,s.actor,null,now)
 if(s.kind==='doubt')return closeExchange(g,s.actor,now)
 if(s.kind==='challenge')return review(g,{kind:'reset'},{kind:'reset',starter:nextSeat(g,s.actor)},now)
 if(s.kind==='review')return closeReview(g,s,now)
 return g
}
export function piggyView(g:PiggyBank,seat=''){
 const who=g.seats.indexOf(seat),s=g.stage
 const canReset=who>=0&&s.kind!=='review'&&s.kind!=='challenge'&&s.kind!=='done'&&g.resets<piggyRules.resets&&!g.resetVotes.includes(who)
 const verdict=s.kind==='review'||s.kind==='done'?s.verdict:null
 return {step:g.step,exchange:g.exchange,seats:[...g.seats],bottom:[...g.bottom],top:g.top,bankIds:g.banks.map(b=>b.id),scores:[...g.scores],
  phase:s.kind,actor:'actor' in s?s.actor:null,color:s.kind==='doubt'?s.claim.color:g.color,deadline:g.deadline,opened:g.opened,
  claim:s.kind==='doubt'?{...s.claim}:null,lastPass:g.lastPass?{...g.lastPass}:null,
  canReset,resetCount:g.resetVotes.length,resetUsed:!canReset&&g.resetVotes.includes(who),resets:g.resets,
  canDoubt:s.kind==='doubt'&&who>=0&&who!==s.actor&&!s.passes.includes(who),
  verdict:verdict?.kind==='doubt'?{...verdict,bank:{...verdict.bank},claim:{...verdict.claim}}:verdict?{...verdict}:null,
  reason:s.kind==='done'?s.reason:null,leaders:s.kind==='done'?g.seats.filter((_,i)=>g.scores[i]===Math.max(...g.scores)):[]}
}
export type PiggyView=ReturnType<typeof piggyView>
export function piggyBot(g:PiggyBank,seat:string,level:'easy'|'normal'|'hard'):PiggyCommand|null{
 const who=g.seats.indexOf(seat),s=g.stage
 if(who<0||s.kind==='done'||s.kind==='review')return null
 if(g.practice&&s.kind==='deposit'&&g.resets<piggyRules.resets&&!g.resetVotes.includes(who)){
  if(g.resetVotes.includes(0)&&who<g.seats.length-1)return {kind:'reset'}
  if(!g.resetVotes.includes(0)&&g.exchange>=8*(g.resets+1)&&s.actor!==0)return {kind:'reset'}
 }
 const roll=(n:number)=>((Math.imul((g.salt+n+Math.imul(who+1,333667))|0,1103515245)>>>8)%100)
 const estimate=(b:Bank,c:PiggyColor)=>{
  const r=roll(b.id*7+(c==='white'?1:0)+g.exchange*113)
  if(r>=(level==='easy'?58:level==='normal'?76:88))return Math.min(piggyCountMax,Math.max(0,b[c]+(r%2?1:-1)))
  return b[c]
 }
 if(s.kind==='deposit'&&s.actor===who){
  const total=1+roll(g.exchange*31)%5,black=roll(g.exchange*37)%(total+1)
  const other=g.seats.map((_,i)=>i).filter(i=>i!==who)
  return {kind:'pass-bank',black,white:total-black,to:other[(g.practice?0:roll(g.exchange*79)%other.length)]}
 }
 if(s.kind==='claim'&&s.actor===who)return {kind:'claim',count:estimate(activeBank(g,g.top!),s.color)}
 if(s.kind==='doubt'&&s.actor!==who&&!s.passes.includes(who)){
  const r=roll(g.exchange*43+101)
  const isWrong=s.claim.count!==estimate(activeBank(g,s.claim.bank),s.claim.color)
  return {kind:isWrong&&r<(level==='easy'?52:level==='normal'?68:86)?'doubt':'accept'}
 }
 if(s.kind==='challenge'&&s.actor===who){
  if(level==='easy')return {kind:'skip'}
  return {kind:'challenge',counts:g.banks.map(b=>({black:estimate(b,'black'),white:estimate(b,'white')}))}
 }
 return null
}
