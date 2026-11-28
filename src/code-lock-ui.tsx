import {useEffect,useId,useRef,useState} from 'react'
import {clueText,codeCard,packCode} from './code-lock'
import {useCardPress} from './card-press'
import type {Snapshot} from './room'
import './code-lock.css'

const full=(n:number)=>codeCard(n)
function Face({card}:{card:number}){
 const seal=['M12 3 20 12 12 21 4 12Z','M12 4 20 19H4Z','M12 4a8 8 0 1 0 0 16 8 8 0 1 0 0-16Z'][Math.floor(card/4)]
 return <><svg aria-hidden="true" className="code-symbol" viewBox="0 0 24 24"><path d={seal}/><path d="M12 9v6m-3-3h6" className="code-seal-inlay"/></svg><b>{card%4+1}</b></>
}
type Clue=Parameters<typeof clueText>[0]
const clueMarks:Record<Clue['kind'],string>={
 sum:'M5 12h14m-7-7v14',
 count:'M9 5 7 19m10-14-2 14M5 10h14m-15 5h14',
 order:'m16 6-8 6 8 6',
 adjacent:'M10 5H5v14h5m4-14h5v14h-5m-4-7h4',
 exclude:'M6 6l12 12m0-12L6 18',
}
function Clues({clues}:{clues:readonly Clue[]}){
 return <ol className="code-clues" role="list">{clues.map((clue,i)=><li key={i}>
  <svg aria-hidden="true" viewBox="0 0 24 24"><path d={clueMarks[clue.kind]}/></svg>{clueText(clue)}
 </li>)}</ol>
}
function PaletteCard({card,selected,enabled,select,drag,clearDrag}:{card:number,selected:boolean,enabled:boolean,select:()=>void,drag:(event:React.DragEvent)=>void,clearDrag:()=>void}){
 const press=useCardPress(select)
 return <button {...press} type="button" data-tone={Math.floor(card/4)} aria-label={full(card)} aria-pressed={selected}
  disabled={!enabled} draggable={enabled} onDragStart={drag} onDragEnd={clearDrag}><Face card={card}/></button>
}
export function CodeLockBoard({snap,active,name,submit}:{snap:Snapshot,active:boolean,name:(id:string)=>string,submit:(code:number)=>void}){
 const g=snap.game!,s=g.codeLock!
 const [slots,setSlots]=useState<number[]>([-1,-1,-1,-1]),[pick,setPick]=useState<number|null>(null)
 const [now,setNow]=useState(Date.now)
 const [pending,setPending]=useState<number|null>(null)
 const dragged=useRef<number|null>(null)
 const clueDialog=useRef<HTMLDialogElement>(null),clueTrigger=useRef<HTMLButtonElement>(null)
 const clueHeading=useId()
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
  <div className="code-bar">
   {!g.done&&<span className="code-clock" role="timer" aria-label="Time remaining"><svg aria-hidden="true" viewBox="0 0 24 24"><path d="M12 7v6l3 2m6-3a9 9 0 1 1-18 0 9 9 0 1 1 18 0Z"/></svg>{Math.floor(remaining/60)}:{String(remaining%60).padStart(2,'0')}</span>}
   {!s.solo&&<span className="code-tries">{s.attempts.length}/3 attempts used</span>}
   <button type="button" className="code-clue-trigger" ref={clueTrigger} aria-label={'Clue sheet, '+s.clues.length+' clues'} aria-haspopup="dialog"
    onClick={()=>clueDialog.current?.showModal()}>
    <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M6 3h10l3 3v15H6Zm10 0v4h3M9 11h7m-7 4h7m-7 3h4"/></svg>Clues <span>{s.clues.length}</span>
   </button>
  </div>
  <dialog className="code-clue-panel code-clue-dialog" ref={clueDialog} aria-labelledby={clueHeading} onClose={()=>clueTrigger.current?.focus({preventScroll:true})}>
   <div className="code-clue-title"><h3 id={clueHeading}>Clue sheet</h3><button type="button" aria-label="Close clues" onClick={()=>clueDialog.current?.close()}>Close</button></div>
   <Clues clues={s.clues}/>
  </dialog>
  <div className="code-layout">
   <section className="code-work" aria-label="Your answer tray">
    <p role="status" className="code-status">{g.done?g.winner===snap.you?'You cracked the code.':'The race is over.':waiting||remaining===0?'Your tray is locked. Waiting for the race to end.':pick!==null?'Selected '+full(pick)+'. Choose a slot.':last?s.solo?'Last try: '+last.correct+' of 4 in the correct positions.':'Last try was incorrect. 15 seconds deducted from your clock.':'Pick a card, then a slot.'}</p>
    <div className="code-slots" role="group" aria-label="Code slots">{slots.map((card,i)=><button type="button" key={i} data-tone={card<0?-1:Math.floor(card/4)} aria-label={'Slot '+(i+1)+': '+(card<0?'empty':full(card))}
     disabled={!canPlay} draggable={canPlay&&card>=0} onDragStart={e=>drag(card,e)} onDragEnd={()=>{dragged.current=null}}
     onDragOver={e=>{if(dragged.current!==null)e.preventDefault()}} onDrop={e=>{e.preventDefault();const value=dragged.current;dragged.current=null;if(value!==null)place(i,value)}}
     onClick={()=>{if(pick!==null){if(pick===card)setPick(null);else place(i,pick)}else if(card>=0)setPick(card)}}>{card<0?<span>{i+1}</span>:<Face card={card}/>}</button>)}</div>
    {!g.done&&<><div className="code-palette" role="group" aria-label="Available cards">{Array.from({length:12},(_,i)=><PaletteCard key={i}
     card={i} selected={pick===i} enabled={canPlay&&!slots.includes(i)} select={()=>setPick(previous=>previous===i?null:i)}
     drag={e=>drag(i,e)} clearDrag={()=>{dragged.current=null}}/>)}</div>
    <div className="actions code-actions"><button type="button" className="primary" disabled={!canPlay||code===null} onClick={()=>{if(code!==null){setPending(s.attempts.length);submit(code);setPick(null)}}}>Lock answer</button><button type="button" disabled={!canPlay||slots.every(x=>x<0)} onClick={()=>{setSlots([-1,-1,-1,-1]);setPick(null)}}>Clear tray</button></div></>}
    {s.attempts.length>0&&<details><summary>Your attempts</summary><ol>{[...s.attempts].reverse().map((a,i)=><li key={i}>{a.cards.map(full).join(' · ')}{a.correct!==null?' ('+a.correct+'/4 correct positions)':''}</li>)}</ol></details>}
    {s.answer&&<div className="code-answer"><h3>Solution</h3><p>{s.answer.map(full).join(' · ')}</p><ul>{g.seats.map((id,i)=><li key={id}>{name(id)}: {g.scores[i]}/4 positions</li>)}</ul></div>}
   </section>
   <section className="code-clue-panel code-clue-inset" aria-label="Clue sheet"><h3>Clue sheet</h3><Clues clues={s.clues}/></section>
  </div>
 </div>
}
