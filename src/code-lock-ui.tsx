import {useEffect,useRef,useState} from 'react'
import {clueText,codeCard,codeSymbols,packCode} from './code-lock'
import type {Snapshot} from './room'
import './code-lock.css'

const full=(n:number)=>codeCard(n)
function Face({card}:{card:number}){
 return <><span aria-hidden="true" className="code-symbol">{codeSymbols[Math.floor(card/4)]}</span><b>{card%4+1}</b></>
}

export function CodeLockBoard({snap,active,name,submit}:{snap:Snapshot,active:boolean,name:(id:string)=>string,submit:(code:number)=>void}){
 const g=snap.game!,s=g.codeLock!
 const [slots,setSlots]=useState<number[]>([-1,-1,-1,-1]),[pick,setPick]=useState<number|null>(null)
 const [now,setNow]=useState(Date.now)
 const [pending,setPending]=useState<number|null>(null)
 const dragged=useRef<number|null>(null)
 const offset=useRef({host:snap.hostNow,local:Date.now()})
 useEffect(()=>{const t=setInterval(()=>setNow(Date.now()),200);return()=>clearInterval(t)},[])
 useEffect(()=>{offset.current={host:snap.hostNow,local:Date.now()}},[snap.hostNow])
 useEffect(()=>{if(pending===null)return;const t=setTimeout(()=>setPending(null),1700);return()=>clearTimeout(t)},[pending])
 const remaining=Math.max(0,Math.ceil(((g.deadline??0)-offset.current.host-(now-offset.current.local)-s.penalty)/1000))
 const waiting=!s.solo&&s.attempts.length>=3
 const canPlay=active&&!g.done&&!waiting&&remaining>0&&pending!==s.attempts.length
 const code=packCode(slots)
 const place=(slot:number,card:number)=>{
  if(!canPlay||slots[slot]===card)return
  setSlots(old=>{const next=old.slice(),current=next.indexOf(card);if(current>=0)next[current]=next[slot];next[slot]=card;return next})
  setPick(null)
 }
 const drag=(card:number,e:React.DragEvent)=>{dragged.current=card;e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/plain',String(card))}
 const last=s.attempts.at(-1)
 return <div className="code-lock">
  <div className="code-bar"><strong>{s.solo?'Practice':'Code race'}</strong>{!g.done&&<span className="pill" aria-label="Time remaining">{Math.floor(remaining/60)}:{String(remaining%60).padStart(2,'0')}</span>}
   <span>{s.solo?'Retries until time runs out':s.attempts.length+'/3 attempts used'}</span></div>
  <div className="code-layout">
   <section className="code-clue-panel" aria-label="Clue sheet"><h3>Clue sheet</h3><ol>{s.clues.map((c,i)=><li key={i}>{clueText(c)}</li>)}</ol></section>
   <section className="code-work" aria-label="Your answer tray">
    <p role="status">{g.done?g.winner===snap.you?'You cracked the code.':'The race is over.':waiting||remaining===0?'Your tray is locked. Waiting for the race to end.':pick!==null?'Selected '+full(pick)+'. Choose a slot.':last?s.solo?'Last try: '+last.correct+' of 4 in the correct positions.':'Last try was incorrect. 15 seconds deducted from your clock.':'Choose a card, then a slot. All four cards must be different.'}</p>
    <div className="code-slots" role="group" aria-label="Code slots">{slots.map((card,i)=><button type="button" key={i} data-tone={card<0?-1:Math.floor(card/4)} aria-label={'Slot '+(i+1)+': '+(card<0?'empty':full(card))}
     disabled={!canPlay} draggable={canPlay&&card>=0} onDragStart={e=>drag(card,e)} onDragEnd={()=>{dragged.current=null}}
     onDragOver={e=>{if(dragged.current!==null)e.preventDefault()}} onDrop={e=>{e.preventDefault();const value=dragged.current;dragged.current=null;if(value!==null)place(i,value)}}
     onClick={()=>{if(pick!==null){if(pick===card)setPick(null);else place(i,pick)}else if(card>=0)setPick(card)}}>{card<0?<span>{i+1}</span>:<Face card={card}/>}</button>)}</div>
    {!g.done&&<><div className="code-palette" role="group" aria-label="Available cards">{Array.from({length:12},(_,i)=><button type="button" key={i}
     data-tone={Math.floor(i/4)} aria-label={full(i)} aria-pressed={pick===i} disabled={!canPlay||slots.includes(i)} draggable={canPlay&&!slots.includes(i)}
     onClick={()=>setPick(pick===i?null:i)} onDragStart={e=>drag(i,e)} onDragEnd={()=>{dragged.current=null}}><Face card={i}/></button>)}</div>
    <div className="actions"><button type="button" className="primary" disabled={!canPlay||code===null} onClick={()=>{if(code!==null){setPending(s.attempts.length);submit(code);setPick(null)}}}>Lock answer</button><button type="button" disabled={!canPlay||slots.every(x=>x<0)} onClick={()=>{setSlots([-1,-1,-1,-1]);setPick(null)}}>Clear tray</button></div></>}
    {s.attempts.length>0&&<details><summary>Your attempts</summary><ol>{[...s.attempts].reverse().map((a,i)=><li key={i}>{a.cards.map(full).join(' · ')}{a.correct!==null?' ('+a.correct+'/4 correct positions)':''}</li>)}</ol></details>}
    {s.answer&&<div className="code-answer"><h3>Solution</h3><p>{s.answer.map(full).join(' · ')}</p><ul>{g.seats.map((id,i)=><li key={id}>{name(id)}: {g.scores[i]}/4 positions</li>)}</ul></div>}
   </section>
  </div>
 </div>
}
