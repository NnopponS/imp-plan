import {useEffect,useRef,useState,type KeyboardEvent} from 'react'
import {memoryDuelGrid,memoryDuelPack} from './memory-duel'
import {Face,MemoryBack,MemoryPlaque,cardName,useMemoryGridFrame} from './memory-poker-ui'
import type {Snapshot} from './room'

function OpenCard({card}:{card:number}){
 return <span className="memory-revealed" role="img" data-card={card} aria-label={cardName(card)}><Face card={card}/></span>
}
export function MemoryDuelLesson({step}:{step:number}){
 const demo=[12,18,41,51,8,25,34,48,1,19,31,40,7,20,36,45]
 const sample=[10,23,33]
 const hidden=step>0
 return <div className="duel-lesson" key={step}>
  <div className="duel-preview-board" aria-hidden="true">{demo.map((card,i)=><span key={card} data-chosen={step>=2&&(i===0||i===3)||undefined}>{hidden?String.fromCharCode(65+i):<Face card={card}/>}</span>)}</div>
  <div className="duel-example-note">
   <strong>{step===0?'20 seconds to study':step===1?'Three shared cards':step===2?'Lock two positions':'Exact tie: redeal'}</strong>
   {hidden&&<div className="memory-hand duel-shared-hand">{sample.map(card=><OpenCard key={card} card={card}/>)}</div>}
  </div>
 </div>
}
export function MemoryDuelBoard({snap,active,name,submit}:{snap:Snapshot;active:boolean;name:(id:string)=>string;submit:(action:number,deal:number)=>void}){
 const duel=snap.game!.memoryDuel!
 const [pick,setPick]=useState<number[]>([])
 const [now,setNow]=useState(Date.now)
 const [offset,setOffset]=useState(()=>snap.hostNow-Date.now())
 const buttons=useRef<Array<HTMLButtonElement|null>>([])
 const surface=useRef<HTMLElement>(null)
 const grid=useRef<HTMLDivElement>(null)
 useEffect(()=>{
  const table=surface.current
  if(table)table.scrollIntoView({block:table.offsetHeight<=window.innerHeight?'nearest':'start',inline:'nearest',behavior:'instant'})
 },[])
 useMemoryGridFrame(grid,duel.phase,duel.dealNumber)
 useEffect(()=>{const timer=setInterval(()=>setNow(Date.now()),150);return ()=>clearInterval(timer)},[])
 useEffect(()=>{setOffset(snap.hostNow-Date.now());setNow(Date.now())},[snap.hostNow])
 const seconds=duel.deadline===null?0:Math.max(0,Math.ceil((duel.deadline-now-offset)/1000))
 const study=duel.phase==='study'
 const choose=duel.phase==='select'
 const selectable=choose&&active&&seconds>0&&duel.ownPicks===null
 const marks=duel.ownPicks??pick
 const cursor=(i:number,e:KeyboardEvent<HTMLButtonElement>)=>{
  const w=memoryDuelGrid.columns,left=i-i%w,last=duel.cards.length-1
  const target=e.key==='ArrowRight'?i+1:e.key==='ArrowLeft'?i-1:e.key==='ArrowDown'?i+w:e.key==='ArrowUp'?i-w:e.key==='Home'?left:e.key==='End'?left+w-1:null
  if(target!==null){e.preventDefault();buttons.current[Math.min(last,Math.max(0,target))]?.focus()}
 }
 const toggle=(i:number)=>{if(selectable)setPick(p=>p.includes(i)?p.filter(n=>n!==i):p.length<2?[...p,i]:p)}
 const lock=()=>{const code=memoryDuelPack(pick);if(selectable&&code!==null)submit(code,duel.dealNumber)}
 const result=duel.result
 const reveal=result?.kind==='win'||result?.kind==='tie'
 const instruction=study?'Remember the rank and suit at each position.':
  choose?(duel.ownPicks?'Pair locked. Waiting for the reveal.':marks.length+' / 2 selected'):
  result?.kind==='tie'?'The hands rank equally. A fresh deal starts shortly.':
  result?.kind==='forfeit'?'Only one player locked in time. Neither pair is revealed.':
  result?.kind==='void'?'Neither player locked in time. No winner.':'Each pair combines with the three shared cards.'
 return <section ref={surface} className="memory-table memory-duel" data-phase={duel.phase} aria-label="Episode-style Memory Poker duel">
  <MemoryPlaque label={'Deal '+duel.dealNumber}
   title={study?'Memorize the grid':choose?'Choose two cards':result?.kind==='tie'?'Exact tie':reveal?'Hands revealed':'Duel closed'}
   seconds={duel.deadline===null?null:seconds} phase={duel.phase}/>
  <p className="memory-instruction" role="status">{instruction}</p>
  {(duel.community.length>0||study||choose)&&<div className="memory-floors">
  {duel.community.length>0&&<section className="duel-community" aria-label="Shared cards"><h4>Shared cards</h4><div className="memory-hand duel-shared-hand">{duel.community.map(card=><OpenCard key={card} card={card}/>)}</div></section>}
  {(study||choose)&&<div className="memory-cabinet"><div ref={grid} className="memory-board duel-grid" role="group" aria-label="Duel card layout">
   {duel.cards.map((value,i)=>{
    const card=study&&seconds>0?value:null
    const letter=String.fromCharCode(65+i)
    return <button key={i} type="button" ref={b=>{buttons.current[i]=b}} className={'memory-card '+(card===null?'memory-down':'memory-up')}
     aria-label={'Position '+letter+': '+(card===null?'face down':cardName(card))}
     aria-pressed={choose?marks.includes(i):undefined} disabled={!selectable} data-card={card??undefined} onClick={()=>toggle(i)} onKeyDown={e=>cursor(i,e)}>
     {card===null?<MemoryBack label={letter}/>:<><Face card={card}/><span className="duel-position" aria-hidden="true">{letter}</span></>}
    </button>
   })}
  </div></div>}
  </div>}
  {choose&&<div className="memory-actions"><button className="primary" type="button" disabled={!selectable||marks.length!==2} onClick={lock}>Lock two cards</button><button type="button" disabled={!selectable||!pick.length} onClick={()=>setPick([])}>Clear selection</button></div>}
  {reveal&&<section className="memory-results" aria-label="Revealed hands"><h4>Revealed hands</h4><ul>{result.hands.map(hand=><li key={hand.seat} data-winner={result.winner===hand.seat||undefined}>
   <div className="memory-hand-head"><strong>{name(hand.seat)}</strong>{result.winner===hand.seat&&<span>Winner</span>}</div>
   <p>{hand.rank.name}</p>
   <div className="memory-hand duel-pair">{hand.picks.map(({position,card})=><div key={position}><OpenCard card={card}/><small>Position {String.fromCharCode(65+position)}</small></div>)}</div>
  </li>)}</ul></section>}
 </section>
}
