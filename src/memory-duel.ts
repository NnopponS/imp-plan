/**
 * Memory Poker duel, based on the Season 3 Episode 2 mini-game. Independently
 * recreated, not a broadcast-verified mode. This module deliberately excludes
 * the surrounding nomination/ladder, Pieces, and elimination metagame.
 *
 * Rule evidence:
 * - https://www.subtitlecat.com/subs/1787/The.Devil%27s.Plan.S03E02.en.html
 *   (unofficial English captions: timing, shared board and deal replay)
 * - https://playdevilplan.com/en/games/memory-poker
 *   (fan corroboration: shared positions allowed; straight and tie handling)
 * - https://quoridorgame.com/en/memory-poker/rules/
 *   (fan corroboration of core mechanism; its shorter pick and series scoring
 *   are adaptation choices, not used here).
 *
 * Integration: a trusted host passes its monotonic time and supplies a newly
 * shuffled deal for each start/redeal. Only send memoryDuelView, not host state;
 * bind viewer seat to an authenticated room connection, never a message field.
 * Study faces are intentionally visible to both duelists: this is a memory
 * game, not an anti-cheat mechanism against clients which record that view.
 */
import {rankPokerHand,type PokerRank} from './memory-poker'

export const memoryDuelGrid={rows:4,columns:4} as const
export const memoryDuelStudy=20_000
export const memoryDuelSelect=60_000
const slots=memoryDuelGrid.rows*memoryDuelGrid.columns
const sharedSlots=3
const deckSize=52
type Pair<T>=[T,T]
type Positions=Pair<number>
type Community=readonly [number,number,number]

/** Cards use the same 0–51 suit-major encoding as rankPokerHand. */
export type MemoryDuelDeal={readonly board:readonly number[];readonly community:Community}
export type MemoryDuelPhase='study'|'select'|'tie'|'finished'
type SelectedCard={position:number;card:number}
type Hand={seat:string;picks:Pair<SelectedCard>;rank:PokerRank}
type Result=
 | {kind:'tie';winner:null;hands:Pair<Hand>}
 | {kind:'win';winner:string;hands:Pair<Hand>}
 | {kind:'forfeit';winner:string;hands:Pair<null>}
 | {kind:'void';winner:null;hands:Pair<null>}

/** Host-only state: includes all faces and sealed submissions. */
export type MemoryDuelState={
 readonly seats:readonly [string,string]
 readonly deal:MemoryDuelDeal
 readonly dealNumber:number
 readonly phase:MemoryDuelPhase
 readonly openedAt:number
 readonly deadline:number|null
 readonly picks:Readonly<Pair<Positions|null>>
 readonly result:Result|null
}

const inRange=(value:unknown,upper:number):value is number=>
 typeof value==='number'&&Number.isInteger(value)&&value>=0&&value<upper

/**
 * Partial Fisher–Yates draw. The host supplies an unbiased integer in
 * [0, upperExclusive), ideally from cryptographic entropy in a live room.
 * No random generator, remainder of the deck, or seed is retained.
 */
export function memoryDuelDeal(randomInt:(upperExclusive:number)=>number):MemoryDuelDeal{
 const deck=Array.from({length:deckSize},(_,i)=>i)
 for(let i=0;i<slots+sharedSlots;i++){
  const remaining=deckSize-i
  const offset=randomInt(remaining)
  if(!inRange(offset,remaining))throw new RangeError('Random draw out of range')
  const j=i+offset
  ;[deck[i],deck[j]]=[deck[j],deck[i]]
 }
 return {board:deck.slice(0,slots),community:[deck[slots],deck[slots+1],deck[slots+2]]}
}

function copyDeal(deal:MemoryDuelDeal):MemoryDuelDeal{
 const {board,community}=deal
 if(!Array.isArray(board)||!Array.isArray(community)||board.length!==slots||community.length!==sharedSlots)
  throw new RangeError('A duel needs sixteen grid cards and three shared cards')
 const cards=[...board,...community]
 if(!cards.every(card=>inRange(card,deckSize))||new Set(cards).size!==cards.length)
  throw new RangeError('Duel cards must be distinct deck members')
 return {board:[...board],community:[community[0],community[1],community[2]]}
}

function startDeal(seats:readonly [string,string],deck:MemoryDuelDeal,now:number,dealNumber:number):MemoryDuelState{
 if(!Number.isFinite(now)||!Number.isFinite(now+memoryDuelStudy+memoryDuelSelect))
  throw new RangeError('Invalid host clock')
 return {seats:[...seats],deal:copyDeal(deck),dealNumber,phase:'study',openedAt:now,
  deadline:now+memoryDuelStudy,picks:[null,null],result:null}
}

/** Start a two-seat duel with fresh cards and a fresh study window. */
export function memoryDuelStart(seats:readonly [string,string],deal:MemoryDuelDeal,now:number){
 if(seats.length!==2||typeof seats[0]!=='string'||typeof seats[1]!=='string'||!seats[0]||!seats[1]||seats[0]===seats[1])
  throw new RangeError('A duel needs two distinct seats')
 return startDeal(seats,deal,now,1)
}

/** Only a completed exact tie permits a follow-up deal in the same duel. */
export function memoryDuelRedeal(s:MemoryDuelState,deal:MemoryDuelDeal,now:number):MemoryDuelState|null{
 return s.phase==='tie'&&Number.isFinite(now)&&now>=s.openedAt?startDeal(s.seats,deal,now,s.dealNumber+1):null
}

/** Canonical numeric action for the room protocol: lower position first. */
export function memoryDuelPack(positions:unknown):number|null{
 if(!Array.isArray(positions)||positions.length!==2)return null
 const [a,b]=positions as unknown[]
 return inRange(a,slots)&&inRange(b,slots)&&a!==b?Math.min(a,b)*slots+Math.max(a,b):null
}

function unpack(code:unknown):Positions|null{
 if(!inRange(code,slots*slots))return null
 const a=Math.floor(code/slots),b=code%slots
 return a<b?[a,b]:null
}

function makeHand(s:MemoryDuelState,seat:string,[a,b]:Positions):Hand{
 const first=s.deal.board[a],second=s.deal.board[b]
 const rank=rankPokerHand([...s.deal.community,first,second])
 // Deal and action validation make this unreachable for engine-produced state.
 if(!rank)throw new Error('Invalid duel hand')
 return {seat,picks:[{position:a,card:first},{position:b,card:second}],rank}
}

function compare(a:PokerRank,b:PokerRank){
 for(let i=0;i<a.strength.length;i++)if(a.strength[i]!==b.strength[i])return a.strength[i]-b.strength[i]
 return 0
}

/** Advance at exact recorded boundaries even after a sleeping host tab. */
export function memoryDuelTick(s:MemoryDuelState,now:number):MemoryDuelState{
 if(!Number.isFinite(now)||s.deadline===null||now<s.deadline)return s
 const at=s.deadline
 if(s.phase==='study')return memoryDuelTick({...s,phase:'select',openedAt:at,deadline:at+memoryDuelSelect},now)
 if(s.phase!=='select')return s
 // Online adaptation: one lock wins by forfeit; no locks voids the duel.
 // Never publish a lock unless both duelists chose to submit by the deadline.
 const winner=s.picks[0]?s.seats[0]:s.picks[1]?s.seats[1]:null
 return {...s,phase:'finished',openedAt:at,deadline:null,
  result:winner?{kind:'forfeit',winner,hands:[null,null]}:{kind:'void',winner:null,hands:[null,null]}}
}

/**
 * Lock one private pair. Return null for an invalid or stale command.
 * expectedDeal is carried by the client alongside the room revision; the
 * host must independently call tick so rejections never halt the clock.
 */
export function memoryDuelAction(s:MemoryDuelState,seat:string,expectedDeal:number,code:unknown,now:number):MemoryDuelState|null{
 if(!Number.isFinite(now)||s.dealNumber!==expectedDeal)return null
 const next=memoryDuelTick(s,now)
 const i=next.seats.indexOf(seat)
 const positions=unpack(code)
 if(next.phase!=='select'||now<next.openedAt||i<0||next.picks[i]||!positions)return null
 const picks:Pair<Positions|null>=i===0?[positions,next.picks[1]]:[next.picks[0],positions]
 if(!picks[0]||!picks[1])return {...next,picks}
 const hands:Pair<Hand>=[makeHand(next,next.seats[0],picks[0]),makeHand(next,next.seats[1],picks[1])]
 const order=compare(hands[0].rank,hands[1].rank)
 return {...next,picks,openedAt:now,deadline:null,phase:order===0?'tie':'finished',
  result:order===0?{kind:'tie',winner:null,hands}:{kind:'win',winner:next.seats[order>0?0:1],hands}}
}

function copyHand(hand:Hand):Hand{
 const [a,b]=hand.picks
 return {seat:hand.seat,picks:[{...a},{...b}],rank:{name:hand.rank.name,strength:[...hand.rank.strength]}}
}

function copyResult(result:Result|null):Result|null{
 if(!result)return null
 if(result.kind==='forfeit'||result.kind==='void')return {...result,hands:[null,null]}
 return {...result,hands:[copyHand(result.hands[0]),copyHand(result.hands[1])]}
}

/**
 * Safe snapshot for a connection already bound to seat by the room host.
 * Pass undefined for spectators. Advance expiry before projecting so an
 * unticked host never retransmits faces after the study deadline.
 */
export function memoryDuelView(s:MemoryDuelState,seat:string|undefined,now:number){
 const next=memoryDuelTick(s,now)
 const i=seat===undefined?-1:next.seats.indexOf(seat)
 const picks=i<0?null:next.picks[i]
 const visibleStudy=Number.isFinite(now)&&now>=next.openedAt&&next.phase==='study'&&i>=0
 return {dealNumber:next.dealNumber,phase:next.phase,deadline:next.deadline,
  cards:next.deal.board.map(card=>visibleStudy?card:null),
  community:next.phase==='study'?[]:[...next.deal.community],
  ownPicks:next.phase==='select'&&picks?[...picks]:null,
  result:copyResult(next.result)}
}
