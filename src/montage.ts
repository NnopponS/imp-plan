/**
 * Unofficial fan adaptation. Source anchor: The Devil's Plan S1E9 rules briefing
 * (English transcript mirror, lines 1560–1648).
 * https://www.springfieldspringfield.co.uk/view_episode_scripts.php?episode=s01e09&tv-show=the-devils-plan-2023
 *
 * The episode establishes five cooperative rounds, three seconds per picture,
 * one Piece to the first correct buzzer, cumulative false-buzz penalties,
 * immediate failure on the eleventh error or a missed repeat, and success on
 * five clears. It also shows a rehearsal. All Pieces here are fictional counters.
 *
 * Digital house rules: shuffled original portrait slots, a three-second
 * match frame measured by the host clock, a two-second opening countdown,
 * command-arrival order for simultaneous buzzes, and at most one buzz per
 * seat per frame. A solo practice uses one shorter deck, 4.5 s frames and no
 * Piece awards. The engine never consumes a client time or sends the deck.
 */
export const montagePortraitCount=32
export const montageRules=Object.freeze({
 rounds:5, frameMs:3_000, errorLimit:10, countdownMs:2_000, practiceFrameMs:4_500
})

export type MontageMode='match'|'practice'
export type MontagePhase='ready'|'countdown'|'live'|'between'|'finished'
export type MontageOutcome='cleared'|'error-limit'|'missed-repeat'
/** Round and frame are one-based position keys, not timestamps or answers. */
export type MontageCommand={readonly round:number;readonly frame:number}
type RoundClear={readonly round:number;readonly seat:string}
type Buzz=MontageCommand&{readonly seat:string;readonly correct:boolean}

/** Host-only state. Expose montageView(), not this object, to room participants. */
export type Montage={
 readonly seats:readonly string[]
 readonly mode:MontageMode
 readonly phase:MontagePhase
 readonly round:number
 readonly frameIndex:number
 readonly nextAt:number|null
 readonly lastHostAt:number
 readonly errors:number
 readonly pieces:readonly number[]
 readonly lastBuzz:Buzz|null
 readonly buzzed:readonly string[]
 readonly history:readonly RoundClear[]
 readonly outcome:MontageOutcome|null
 readonly roundDecks:readonly (readonly number[])[]
}
export type MontageView={
 mode:MontageMode
 phase:MontagePhase
 round:number
 totalRounds:number
 clearedRounds:number
 frame:{index:number;portraitId:number}|null
 nextAt:number|null
 errors:number
 errorLimit:number
 pieces:{seat:string;pieces:number}[]
 lastBuzz:Buzz|null
 history:RoundClear[]
 outcome:MontageOutcome|null
 canBuzz:boolean
}
export type MontageBuzzResult='correct'|'incorrect'|'invalid-time'|'invalid-seat'|'not-live'|'stale-frame'|'already-buzzed'

const matchLengths=[[8,10],[9,12],[11,15],[13,18],[15,21]] as const
const practiceLengths=[[5,8]] as const
const validTime=(now:number)=>Number.isSafeInteger(now)&&now>=0
const frameMs=(mode:MontageMode)=>mode==='practice'?montageRules.practiceFrameMs:montageRules.frameMs
const totalRounds=(mode:MontageMode)=>mode==='practice'?1:montageRules.rounds
const canFitRound=(now:number,mode:MontageMode)=>now<=Number.MAX_SAFE_INTEGER-montageRules.countdownMs-(montagePortraitCount+1)*frameMs(mode)

function roundDecks(seed:number,mode:MontageMode):number[][]{
 // Mulberry32, seeded separately by the host for each game; not a security RNG.
 let x=seed>>>0
 const draw=(limit:number)=>{
  x=(x+0x6d2b79f5)>>>0
  let v=Math.imul(x^(x>>>15),x|1)
  v^=v+Math.imul(v^(v>>>7),v|61)
  return Math.floor(((v^(v>>>14))>>>0)/0x100000000*limit)
 }
 return (mode==='practice'?practiceLengths:matchLengths).map(([min,max])=>{
  const deck=Array.from({length:montagePortraitCount},(_,i)=>i)
  for(let i=deck.length-1;i>0;i--){
   const j=draw(i+1)
   ;[deck[i],deck[j]]=[deck[j],deck[i]]
  }
  const repeatsAt=min+draw(max-min+1)
  // Do not repeat either of the immediately preceding portraits.
  deck.splice(repeatsAt,0,deck[draw(repeatsAt-2)])
  return deck
 })
}

export function montageStart(seats:readonly string[],seed:number,hostNow:number,mode:MontageMode='match'):Montage{
 if((mode!=='match'&&mode!=='practice')||!validTime(hostNow)||!canFitRound(hostNow,mode)||!Number.isSafeInteger(seed)
  ||(mode==='practice'?seats.length!==1:seats.length<2||seats.length>16)
  ||new Set(seats).size!==seats.length||seats.some(seat=>typeof seat!=='string'||!seat.trim()))throw new Error('Invalid Montage setup')
 return {seats:[...seats],mode,phase:'ready',round:1,frameIndex:0,nextAt:null,lastHostAt:hostNow,
  errors:0,pieces:seats.map(()=>0),lastBuzz:null,buzzed:[],history:[],outcome:null,roundDecks:roundDecks(seed,mode)}
}

/** Host-only command. Subsequent rounds deliberately wait for a fresh host start. */
export function montageOpenRound(s:Montage,hostNow:number):Montage{
 if((s.phase!=='ready'&&s.phase!=='between')||!validTime(hostNow))return s
 const now=Math.max(hostNow,s.lastHostAt)
 if(!canFitRound(now,s.mode))return s
 return {...s,phase:'countdown',round:s.phase==='between'?s.round+1:s.round,frameIndex:0,lastHostAt:now,
  nextAt:now+montageRules.countdownMs,lastBuzz:null,buzzed:[]}
}

function isRepeat(s:Montage):boolean{
 const deck=s.roundDecks[s.round-1]
 return deck.indexOf(deck[s.frameIndex-1])<s.frameIndex-1
}

/** Apply absolute cutoffs; a slow host tick cannot extend a face or skip an uncalled repeat. */
export function montageAdvance(s:Montage,hostNow:number):Montage{
 if(!validTime(hostNow)||s.nextAt===null)return s
 const now=Math.max(hostNow,s.lastHostAt)
 const duration=frameMs(s.mode)
 let next=s
 while(next.nextAt!==null&&now>=next.nextAt){
  if(next.phase==='live'&&isRepeat(next)){
   return {...next,phase:'finished',nextAt:null,lastHostAt:now,outcome:'missed-repeat'}
  }
  next={...next,phase:'live',frameIndex:next.frameIndex+1,nextAt:next.nextAt+duration,lastHostAt:now,buzzed:[]}
 }
 return next
}

/**
 * Host stamps receipt and processes serially. Always retain returned state, even
 * on rejection: the clock may have advanced. A command must identify the frame
 * already live before processing; it cannot guess and buzz the next frame.
 */
export function montageBuzz(s:Montage,seat:string,command:MontageCommand,hostNow:number):{state:Montage;result:MontageBuzzResult}{
 if(!validTime(hostNow))return {state:s,result:'invalid-time'}
 const now=Math.max(hostNow,s.lastHostAt)
 const state=montageAdvance(s,now)
 if(!state.seats.includes(seat))return {state,result:'invalid-seat'}
 if(s.phase!=='live')return {state,result:'not-live'}
 if(command.round!==s.round||command.frame!==s.frameIndex||state.phase!=='live'||state.frameIndex!==s.frameIndex)return {state,result:'stale-frame'}
 if(state.buzzed.includes(seat))return {state,result:'already-buzzed'}

 const correct=isRepeat(state)
 const lastBuzz={round:state.round,frame:state.frameIndex,seat,correct}
 if(!correct){
  const errors=state.errors+1
  const next={...state,errors,lastBuzz,lastHostAt:now,buzzed:[...state.buzzed,seat]}
  return {state:errors>montageRules.errorLimit?{...next,phase:'finished',nextAt:null,outcome:'error-limit'}:next,result:'incorrect'}
 }

 const finished=state.round===totalRounds(state.mode)
 return {state:{
  ...state,phase:finished?'finished':'between',nextAt:null,lastHostAt:now,outcome:finished?'cleared':null,lastBuzz,
  history:[...state.history,{round:state.round,seat}],
  pieces:state.mode==='practice'?state.pieces:state.pieces.map((n,i)=>state.seats[i]===seat?n+1:n)
 },result:'correct'}
}

export function montageView(s:Montage,viewer:string|null=null):MontageView{
 return {
  mode:s.mode,phase:s.phase,round:s.round,totalRounds:totalRounds(s.mode),clearedRounds:s.history.length,
  frame:s.phase==='live'?{index:s.frameIndex,portraitId:s.roundDecks[s.round-1][s.frameIndex-1]}:null,
  nextAt:s.nextAt,errors:s.errors,errorLimit:montageRules.errorLimit,
  pieces:s.seats.map((seat,i)=>({seat,pieces:s.pieces[i]})),lastBuzz:s.lastBuzz?{...s.lastBuzz}:null,
  history:s.history.map(result=>({...result})),outcome:s.outcome,
  canBuzz:s.phase==='live'&&viewer!==null&&s.seats.includes(viewer)&&!s.buzzed.includes(viewer)
 }
}
