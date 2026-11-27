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
export const cardName=(card:number)=>ranks[rank(card)]+' of '+suits[suit(card)]
const scoreText=(score:number)=>(score<0?'−':'')+String(Math.abs(score))+(Math.abs(score)===1?' pt':' pts')

export function MemoryPlaque({label,title,seconds,phase}:{label:string;title:string;seconds:number|null;phase:string}){
 return <header className="memory-hud">
  <svg className="memory-table-seal" viewBox="0 0 40 44" aria-hidden="true">
   <path d="M20 1 38 13v18L20 43 2 31V13Z" fill="#391e2d" stroke="#c49b61"/>
   <path d="M20 5 34 15v14L20 39 6 29V15Z" fill="none" stroke="#9f694e"/>
   <path d="M20 10c-3 6-10 8-10 13 0 5 7 6 9 1-1 4-3 6-5 7h12c-2-1-4-3-5-7 2 5 9 4 9-1 0-5-7-7-10-13Z" fill="#e6bf81"/>
   <path d="M20 13v13m-3-7 3 3 3-3" fill="none" stroke="#82533e"/>
  </svg>
  <div className="memory-plaque-title"><p className="eyebrow">{label}</p><h3>{title}</h3></div>
  {seconds!==null&&<span className="memory-clock" data-urgent={seconds<=5||undefined} role="timer" aria-label="Time remaining">{seconds} s</span>}
  {seconds===null&&<span className="memory-phase-stamp" aria-hidden="true">{phase==='tie'?'Redeal':'Settled'}</span>}
 </header>
}

export function MemoryBack({label}:{label:string}){
 return <span className="memory-back" aria-hidden="true">
   <svg viewBox="0 0 36 36" className="memory-card-etch" focusable="false">
    <path d="M18 2 34 18 18 34 2 18Z M18 6 30 18 18 30 6 18Z" fill="none" stroke="currentColor"/>
    <path d="M18 0v6m0 24v6M0 18h6m24 0h6 M6 6l4 4m16 16 4 4m0-24-4 4M6 30l4-4" stroke="currentColor" fill="none"/>
   </svg>
   <span>{label}</span><i>✓</i>
 </span>
}

// On short screens keep the complete timed grid visible, without stealing
// focus or scrolling someone away while they are using another room control.
export function useMemoryGridFrame(grid:{current:HTMLDivElement|null},phase:string,round:number){
 useEffect(()=>{
  if(!matchMedia('(max-width: 700px)').matches)return
  const id=requestAnimationFrame(()=>{
   const el=grid.current,focus=document.activeElement
   if(!el||(focus&&focus!==document.body&&!el.contains(focus)&&!focus.matches('h1[tabindex="-1"]')))return
   const {top,bottom,height}=el.getBoundingClientRect()
   const table=el.closest<HTMLElement>('.memory-table')
   const controls=phase==='select'?table?.querySelector('.memory-actions'):null
   if(table&&controls){
    const start=table.getBoundingClientRect().top,end=controls.getBoundingClientRect().bottom
    if(end>innerHeight&&end-start<=innerHeight-16){
     table.scrollIntoView({block:'start',inline:'nearest',behavior:'instant'})
     return
    }
   }
   if(height<=innerHeight&&(top<0||bottom>innerHeight))el.scrollIntoView({block:'nearest',inline:'nearest',behavior:'instant'})
  })
  return ()=>cancelAnimationFrame(id)
 },[grid,phase,round])
}

export function Face({card}:{card:number}){
 const i=suit(card)
 return <span className={'memory-face '+(i===1||i===2?'memory-red':'memory-black')} aria-hidden="true">
  <span className="memory-corner">{codes[rank(card)]}<small>{suitPips[i]}</small></span>
  <strong><span>{suitPips[i]}</span></strong>
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
 const grid=useRef<HTMLDivElement>(null)
 useMemoryGridFrame(grid,poker.phase,poker.round)
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
 return <section className="memory-table memory-fan" data-phase={poker.phase} aria-label="Memory Poker table">
  <MemoryPlaque label={'Round '+poker.round+' / '+memoryPokerRounds}
   title={poker.phase==='study'?'Study the cards':selecting?'Choose five cards':poker.phase==='reveal'?'Hands revealed':'Final table'}
   seconds={poker.deadline===null?null:seconds} phase={poker.phase}/>
  <p className="memory-instruction" role="status">{selectedPhrase}</p>
  {(poker.phase==='study'||selecting)&&<div className="memory-cabinet"><div ref={grid} className="memory-board" role="group" aria-label="Card layout">
   {poker.cards.map((card,i)=><button type="button" key={i} ref={b=>{buttons.current[i]=b}}
    className={'memory-card '+(card===null?'memory-down':'memory-up')}
    aria-label={'Position '+(i+1)+': '+(card===null?'face down':cardName(card))}
    aria-pressed={selecting?choices.includes(i):undefined} disabled={!interact} onClick={()=>choose(i)} onKeyDown={e=>step(i,e)}>
    {card===null?<MemoryBack label={String(i+1)}/>:<><Face card={card}/><span className="duel-position" aria-hidden="true">{i+1}</span></>}
   </button>)}
  </div></div>}
  {selecting&&<div className="memory-actions">
   <button className="primary" type="button" disabled={!interact||peekMode||choices.length!==5} onClick={lock}>Lock hand</button>
   <button type="button" disabled={!interact||!selection.length} onClick={()=>setSelection([])}>Clear selection</button>
   {poker.canPeek&&<button type="button" aria-pressed={peekMode} disabled={!interact} onClick={()=>setPeek(p=>!p)}>{peekMode?'Cancel peek':'Peek at one card (−1 point)'}</button>}
   <span className="memory-lock-log">{poker.submitted} / {snap.game!.seats.length} hands locked</span>
  </div>}
  {poker.phase==='finished'&&<ul className="memory-score" aria-label="Final scores">{total.map(row=><li key={row.id}><strong>{name(row.id)}</strong><span>{scoreText(row.score)}</span></li>)}</ul>}
  {current&&results(current)}
  {history.length>0&&<details className="memory-history"><summary>Earlier hands ({history.length})</summary>{[...history].reverse().map(results)}</details>}
 </section>
}
