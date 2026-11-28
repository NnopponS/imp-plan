import {hiddenClues,hiddenNouns,hiddenScore,type Clue,type ClueStage} from './hidden-word-lexicon'
export {hiddenClues,hiddenNouns,hiddenScore}

export type HiddenAction=
 | {kind:'choose';word:string}
 | {kind:'clue';word:string}
 | {kind:'guess';words:string[]}
type Round=1|2
type Phase='choose'|'clue'|'guess'|'review'|'done'
export type HiddenReview={
 guesses:readonly {seat:string;words:readonly string[]}[]
 correct:readonly string[]
 setterPoints:number
 guessPoints:number
 answer:string|null
}
type Case={round:Round;setter:string;answer:string;stages:ClueStage;scored:number;correct:readonly string[]}

export type HiddenState={
 seats:readonly string[];order:readonly string[];envelopes:readonly (readonly string[])[]
 phase:Phase;step:number;round:Round;slot:number;stage:ClueStage;deadline:number;window:number
 picks:readonly (string|null)[];retired:readonly (string|null)[]
 clues:readonly Clue[];guesses:readonly (readonly string[]|null)[];seals:readonly number[];usedSeal:readonly boolean[]
 scores:readonly number[];reviews:readonly HiddenReview[];history:readonly Case[]
}

export const hiddenReviewMs=4200
export const hiddenSeals=2
const blank=<T>(size:number,value:T)=>Array<T>(size).fill(value)
const update=<T>(all:readonly T[],i:number,value:T)=>all.map((old,j)=>i===j?value:old)
const slotIndex=(s:HiddenState)=>s.seats.indexOf(s.order[s.slot])
const available=(s:HiddenState,i:number)=>s.envelopes[i].filter(word=>word!==s.retired[i])
const advance=(s:HiddenState,phase:Phase,now:number)=>({...s,phase,step:s.step+1,deadline:now+(phase==='review'?hiddenReviewMs:s.window)})
const normalize=(word:string)=>word.trim().toLowerCase()
const lexicon=new Set(hiddenNouns)

function seededIndex(seed:number){
 return (upper:number)=>{
  seed=(Math.imul(seed,1664525)+1013904223)>>>0
  return Math.floor(seed/2**32*upper)
 }
}

function shuffle<T>(all:readonly T[],randomIndex:(upper:number)=>number){
 const sorted=[...all]
 for(let i=sorted.length-1;i>0;i--){
  const j=randomIndex(i+1)
  ;[sorted[i],sorted[j]]=[sorted[j],sorted[i]]
 }
 return sorted
}

export function hiddenStart(seats:readonly string[],seed:number,now:number,window:number,randomIndex=seededIndex(seed)):HiddenState{
 if(seats.length<3||seats.length>16||new Set(seats).size!==seats.length)throw new RangeError('Hidden Word needs 3–16 distinct seats.')
 const deck=shuffle(hiddenNouns,randomIndex)
 return {seats:[...seats],order:shuffle(seats,randomIndex),envelopes:seats.map((_,i)=>deck.slice(i*5,i*5+5)),
  phase:'choose',step:1,round:1,slot:0,stage:1,window,deadline:now+window,picks:blank(seats.length,null),retired:blank(seats.length,null),
  clues:[],guesses:blank(seats.length,null),usedSeal:blank(seats.length,false),seals:blank(seats.length,hiddenSeals),scores:blank(seats.length,0),reviews:[],history:[]}
}

function options(s:HiddenState){
 return hiddenClues(s.picks[slotIndex(s)]!,s.stage)
}

function postClue(s:HiddenState,clue:Clue,now:number):HiddenState{
 return {...advance(s,'guess',now),clues:[...s.clues,clue]}
}

function settle(s:HiddenState,now:number):HiddenState{
 const active=slotIndex(s),answer=s.picks[active]!
 const guesses=s.seats.flatMap((seat,i)=>i===active?[]:[{seat,words:s.guesses[i]??[]}])
 const correct=guesses.filter(g=>g.words.includes(answer)).map(g=>g.seat)
 const setterPoints=correct.length?0:s.stage*s.round
 const guessPoints=correct.length?s.round:0
 const closed=correct.length>0||s.stage===3
 const review={guesses,correct,setterPoints,guessPoints,answer:closed?answer:null}
 const reviews=[...s.reviews,review]
 const scores=s.scores.map((old,i)=>old+(i===active?setterPoints:correct.includes(s.seats[i])?guessPoints:0))
 const history=closed?[...s.history,{round:s.round,setter:s.seats[active],answer,stages:s.stage,scored:reviews.reduce((sum,r)=>sum+r.setterPoints,0),correct}]:s.history
 return {...advance(s,'review',now),scores,history,reviews}
}

export function hiddenStep(s:HiddenState,seat:string,action:HiddenAction,now:number):HiddenState|null{
 const i=s.seats.indexOf(seat)
 if(i<0||now>=s.deadline)return null
 if(action.kind==='choose'&&s.phase==='choose'&&!s.picks[i]){
  const word=normalize(action.word)
  if(!available(s,i).includes(word))return null
  const next={...s,picks:update(s.picks,i,word)}
  return next.picks.every(Boolean)?advance(next,'clue',now):next
 }
 if(action.kind==='clue'&&s.phase==='clue'&&i===slotIndex(s)){
  const clue=options(s).find(c=>c.word===normalize(action.word))
  return clue?postClue(s,clue,now):null
 }
 if(action.kind==='guess'&&s.phase==='guess'&&i!==slotIndex(s)&&s.guesses[i]===null){
  const words=action.words.map(normalize)
  const bonus=words.length===2
  if(words.length>2||new Set(words).size!==words.length||words.some(w=>!lexicon.has(w)||s.history.some(c=>c.answer===w)||s.envelopes[i].includes(w)||s.reviews.some(r=>r.guesses.some(g=>g.words.includes(w))))||
   bonus&&(s.usedSeal[i]||s.seals[i]<1))return null
  const next={...s,guesses:update(s.guesses,i,words),usedSeal:bonus?update(s.usedSeal,i,true):s.usedSeal,seals:bonus?update(s.seals,i,s.seals[i]-1):s.seals}
  return next.guesses.every((g,j)=>j===slotIndex(s)||g!==null)?settle(next,now):next
 }
 return null
}

export function hiddenTick(s:HiddenState,now:number):HiddenState{
 if(s.phase==='done'||now<s.deadline)return s
 if(s.phase==='choose')return {...advance(s,'clue',now),picks:s.picks.map((word,i)=>word??available(s,i)[0])}
 if(s.phase==='clue')return postClue(s,options(s)[0],now)
 if(s.phase==='guess')return settle(s,now)
 const last=s.reviews.at(-1)!
 const guesses=blank(s.seats.length,null)
 if(!last.answer)return {...advance(s,'clue',now),stage:(s.stage+1) as ClueStage,guesses}
 if(s.slot===s.seats.length-1&&s.round===2)return {...advance(s,'done',now),deadline:0}
 const newRound=s.slot===s.seats.length-1
 return {...advance(s,newRound?'choose':'clue',now),round:newRound?2:s.round,slot:newRound?0:s.slot+1,stage:1,
  picks:newRound?blank(s.seats.length,null):s.picks,retired:newRound?s.picks:s.retired,guesses,clues:[],reviews:[],usedSeal:blank(s.seats.length,false)}
}

export function hiddenView(s:HiddenState,seat:string){
 const i=s.seats.indexOf(seat)
 const standings=s.seats.map((seat,j)=>({seat,points:s.scores[j],rank:1+s.scores.filter(v=>v>s.scores[j]).length})).sort((a,b)=>a.rank-b.rank)
 return {
  phase:s.phase,step:s.step,round:s.round,slot:s.slot,stage:s.stage,order:s.order,deadline:s.phase==='done'?null:s.deadline,
  setter:s.phase==='choose'||s.phase==='done'?null:s.order[s.slot],
  clues:s.clues,review:s.phase==='review'?s.reviews.at(-1)??null:null,
  misses:s.reviews.flatMap(r=>r.answer?[]:r.guesses.flatMap(g=>g.words)),history:s.history,standings,
  mine:i<0||s.phase==='done'?null:{
   isSetter:i===slotIndex(s),envelope:available(s,i),chosen:s.picks[i],locked:s.picks[i]!==null,guess:s.phase==='guess'?s.guesses[i]:null,
   clues:s.phase==='clue'&&i===slotIndex(s)?options(s):[],seals:s.seals[i],bonusAvailable:!s.usedSeal[i]&&s.seals[i]>0,
  },
 }
}

export type HiddenView=ReturnType<typeof hiddenView>

export function hiddenBot(v:HiddenView,seed:number,level:'easy'|'normal'|'hard'):HiddenAction|undefined{
 const {mine}=v
 if(!mine)return
 const random=seededIndex(seed^Math.imul(v.step,0x9e3779b9))
 if(v.phase==='choose'&&!mine.locked)return {kind:'choose',word:mine.envelope[random(mine.envelope.length)]}
 if(v.phase==='clue'&&mine.clues.length)return {kind:'clue',word:mine.clues[random(mine.clues.length)].word}
 if(v.phase!=='guess'||mine.guess!==null||mine.isSetter)return
 const excluded=new Set([...mine.envelope,...v.misses,...v.history.map(c=>c.answer)])
 const clues=level==='easy'?v.clues.slice(0,Math.max(1,v.clues.length-1)):v.clues
 const exact=hiddenNouns.filter(word=>!excluded.has(word)&&clues.every(c=>hiddenScore(word,c.word)===c.score))
 const near=hiddenNouns.filter(word=>!excluded.has(word)&&hiddenScore(word,v.clues[0].word)>0)
 const choices=level==='normal'&&random(4)===0&&near.length?near:exact
 return {kind:'guess',words:shuffle(choices,random).slice(0,level==='hard'&&v.stage===1&&mine.bonusAvailable?2:1)}
}
