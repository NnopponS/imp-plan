import {useEffect,useRef,useState,type KeyboardEvent} from 'react'
import {memoryPokerGrid,memoryPokerPeekAction,memoryPokerRounds,packMemoryPoker} from './memory-poker'
import type {Snapshot} from './room'
import './memory-poker.css'

const ranks=['2','3','4','5','6','7','8','9','10','Jack','Queen','King','Ace']
const codes=['2','3','4','5','6','7','8','9','10','J','Q','K','A']
const suits=['Clubs','Diamonds','Hearts','Spades']
const suitPips=['♣','◆','♥','♠']
const rank=(card:number)=>card%13
const suit=(card:number)=>Math.floor(card/13)
const cardName=(card:number)=>ranks[rank(card)]+' of '+suits[suit(card)]
const scoreText=(score:number)=>(score<0?'−':'')+String(Math.abs(score))+(Math.abs(score)===1?' pt':' pts')

function Face({card}:{card:number}){
 const i=suit(card)
 return <span className={'memory-face '+(i===1||i===2?'memory-red':'memory-black')} aria-hidden="true">
  <span className="memory-corner">{codes[rank(card)]}<small>{suitPips[i]}</small></span>
  <strong>{suitPips[i]}</strong>
  <span className="memory-corner memory-mirror">{codes[rank(card)]}<small>{suitPips[i]}</small></span>
 </span>
}

export function MemoryPokerBoard({snap,active,name,submit}:{snap:Snapshot;active:boolean;name:(id:string)=>string;submit:(action:number)=>void}){
 const poker=snap.game!.memoryPoker!
 const [selection,setSelection]=useState<number[]>([])
 const [peek,setPeek]=useState(false)
 const [now,setNow]=useState(Date.now)
 const [offset,setOffset]=useState(()=>snap.hostNow-Date.now())
 const buttons=useRef<Array<HTMLButtonElement|null>>([])
 useEffect(()=>{const timer=setInterval(()=>setNow(Date.now()),200);return ()=>clearInterval(timer)},[])
 useEffect(()=>{setOffset(snap.hostNow-Date.now());setNow(Date.now())},[snap.hostNow])
 const seconds=poker.deadline===null?0:Math.max(0,Math.ceil((poker.deadline-now-offset)/1000))
 const choices=poker.mine??selection
 const selecting=poker.phase==='select'
 const interact=selecting&&active&&seconds>0&&poker.mine===null
 const peekMode=peek&&poker.canPeek
 const selectedPhrase=selecting?(poker.mine?'Hand locked. Waiting for the reveal.':peekMode?'Choose one card to peek before locking.':choices.length+' / 5 cards chosen'):
  poker.phase==='study'?'Remember each rank, suit and position.':poker.phase==='reveal'?'Only the cards in locked hands are revealed.':'Four rounds complete.'
 const current=poker.results.find(r=>r.round===poker.round)
 const history=poker.results.filter(r=>r.round!==poker.round)
 const total=snap.game!.seats.map((id,i)=>({id,score:poker.scores[i]})).sort((a,b)=>b.score-a.score)
 const step=(i:number,e:KeyboardEvent<HTMLButtonElement>)=>{
  const width=memoryPokerGrid.columns,edge=i%width,last=poker.cards.length-1
  const next=e.key==='ArrowRight'?Math.min(last,i+1):e.key==='ArrowLeft'?Math.max(0,i-1):e.key==='ArrowDown'?Math.min(last,i+width):
   e.key==='ArrowUp'?Math.max(0,i-width):e.key==='Home'?i-edge:e.key==='End'?Math.min(last,i-edge+width-1):null
  if(next!==null){e.preventDefault();buttons.current[next]?.focus()}
 }
 const choose=(i:number)=>{
  if(!interact)return
  if(peekMode){
   const code=memoryPokerPeekAction(i)
   if(code!==null)submit(code)
   setPeek(false)
   return
  }
  setSelection(s=>s.includes(i)?s.filter(n=>n!==i):s.length<5?[...s,i]:s)
 }
 const lock=()=>{const code=packMemoryPoker(selection);if(interact&&!peekMode&&code!==null)submit(code)}
 const results=(round:NonNullable<typeof current>)=><section key={round.round} className="memory-results" aria-label={'Round '+round.round+' hands'}>
  <h4>{'Round '+round.round+' hands'}</h4>
  <ul>{round.entries.map(row=><li key={row.seat}>
   <div className="memory-hand-head"><strong>{name(row.seat)}</strong><span>{scoreText(row.points)}</span></div>
   <p>{row.hand?.name??'No hand locked'}{row.peeked?' · peek used (−1)':''}</p>
   {row.cards.length>0&&<div className="memory-hand">{row.cards.map(({position,card})=><span className="memory-revealed" role="img" aria-label={cardName(card)} key={position}><Face card={card}/></span>)}</div>}
  </li>)}</ul>
 </section>
 return <section className="memory-table" aria-label="Memory Poker table">
  <div className="memory-hud"><div><p className="eyebrow">Round {poker.round} / {memoryPokerRounds}</p>
   <h3>{poker.phase==='study'?'Study the cards':selecting?'Choose five cards':poker.phase==='reveal'?'Hands revealed':'Final table'}</h3></div>
   {poker.deadline!==null&&<span className="memory-clock" role="timer" aria-label="Time remaining">{seconds} s</span>}
  </div>
  <p className="memory-instruction" role="status">{selectedPhrase}</p>
  {(poker.phase==='study'||selecting)&&<div className="memory-board" role="group" aria-label="Card layout">
   {poker.cards.map((card,i)=><button type="button" key={i} ref={b=>{buttons.current[i]=b}}
    className={'memory-card '+(card===null?'memory-down':'memory-up')}
    aria-label={'Position '+(i+1)+': '+(card===null?'face down':cardName(card))}
    aria-pressed={selecting?choices.includes(i):undefined} disabled={!interact} onClick={()=>choose(i)} onKeyDown={e=>step(i,e)}>
    {card===null?<span className="memory-back" aria-hidden="true"><span>{i+1}</span></span>:<Face card={card}/>}
   </button>)}
  </div>}
  {selecting&&<div className="memory-actions">
   <button className="primary" type="button" disabled={!interact||peekMode||choices.length!==5} onClick={lock}>Lock hand</button>
   <button type="button" disabled={!interact||!selection.length} onClick={()=>setSelection([])}>Clear selection</button>
   {poker.canPeek&&<button type="button" aria-pressed={peekMode} disabled={!interact} onClick={()=>setPeek(p=>!p)}>{peekMode?'Cancel peek':'Peek at one card (−1 point)'}</button>}
   <span>{poker.submitted} / {snap.game!.seats.length} hands locked</span>
  </div>}
  {poker.phase==='finished'&&<ul className="memory-score" aria-label="Final scores">{total.map(row=><li key={row.id}><strong>{name(row.id)}</strong><span>{scoreText(row.score)}</span></li>)}</ul>}
  {current&&results(current)}
  {history.length>0&&<details className="memory-history"><summary>Earlier hands ({history.length})</summary>{[...history].reverse().map(results)}</details>}
 </section>
}
