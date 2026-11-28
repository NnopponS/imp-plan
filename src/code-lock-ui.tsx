import {useEffect,useId,useRef,useState} from 'react'
import {clueText,codeCard,packCode} from './code-lock'
import {useCardPress} from './card-press'
import type {Snapshot} from './room'
import './code-lock.css'

const full=(n:number)=>codeCard(n)
const sealDevices=[
 'M21 7.5 32.4 20.6 21.2 34 9.4 21.2ZM21 12.8l6.8 8-6.8 8.7-7.2-8.7Z M21 17.4v7.1m-3.5-3.5 7.1-.2',
 'M21 7.4 33 30.2l-23.7-.1ZM21 12.7l7.1 13.2H14.2Z M20.9 17.7l2.8 6.2-5.3.1Z M16 29.5l1.7-2.1m6.1 2.6 1.7-2.2',
 'M21 8.2a12.6 12.6 0 1 1-.1 25.3 12.6 12.6 0 0 1 .1-25.3Z M24 12.5c-5.4.3-9.2 4.2-8.9 9.4.2 4.3 3.2 7 7 8.2-6.1.5-10.7-3.1-10.6-8.5.1-5.1 5-9.6 12.5-9.1Z M24.7 17.4l1.1 2.6 2.8 1.1-2.7 1.1-1.2 2.9-1.1-2.9-2.6-1.1 2.6-1.1Z',
]
export function CodeStampFace({card}:{card:number}){
 return <><svg aria-hidden="true" className="code-stamp-face" viewBox="0 0 42 42">
  <path className="code-wax-drop" d="M14 3.9c2.3-1.3 5.1-.7 7.4-1.3 2.9-.9 4.4 1.1 6.7 1.1 3.1.1 3.9 3.8 6.4 4.5 2.5.8 2.7 3.8 3 6.1.3 1.6 2.2 3.1 2.1 5.3-.1 2.9-1.5 4.4-1.3 7.3.2 2.7-1.9 3.8-3.8 5.2-1.5 1.1-2 3.9-4.1 4.4-2.7.6-4.3 2.9-6.6 1.9-2.4-.9-4.9 1.3-7.5.1-1.9-.9-3.3-1.3-5.8-1.6-2.6-.3-2.8-3-4.5-4.4-2.2-1.7-1.8-4.1-2.9-6.7-1.3-3.1.5-4.7.3-7.4-.3-3.2 1.3-4.2 2-6.6 1-3.3 4.1-3.8 5.2-5.3Z"/>
  <path className="code-wax-rim" d="M6.4 18.5c1.1-7 5.9-11.7 12.4-12.9M27.2 5.9c5.7 2.2 9 7.3 9.5 12.8M34.9 28.4c-2.8 5.6-8.8 8.5-14.6 8.3-6.8-.2-11.1-3.2-13.3-9m-1.4-5.3.2 2.2"/>
  <path className="code-seal-device" d={sealDevices[Math.floor(card/4)]}/>
  <path className="code-wax-scrapes" d="M5.7 14.8l1.7-3.3m.5-1 1-1m12.9-5 2.8.1M34 31.8l-1.7 2m-1.3.6-1.8 1.1M9.9 31.2l2 2.3"/>
 </svg><b className="code-stamp-rank">{card%4+1}</b></>
}
function RecessedSlot({index}:{index:number}){
 return <>
  <svg className="code-slot-engrave" viewBox="0 0 72 44" preserveAspectRatio="none" aria-hidden="true">
   <path className="code-slot-bed" d="M8 2h56l5 6v27l-5 6H7l-4-6V8Z" />
   <path className="code-slot-keyline" d="M11 7h50l4 4v22l-4 4H10l-3-4V11ZM14 11h44m-43 21 43 .2"/>
   <path className="code-slot-hatching" d="m8 13 4-4m-4 9 7-7m-7 13 4-4m49 14 3-3m-7 4 5-6m-15 5 4-3"/>
  </svg>
  <span>{index+1}</span>
 </>
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
  disabled={!enabled} draggable={enabled} onDragStart={drag} onDragEnd={clearDrag}><CodeStampFace card={card}/></button>
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
     onClick={()=>{if(pick!==null){if(pick===card)setPick(null);else place(i,pick)}else if(card>=0)setPick(card)}}>{card<0?<RecessedSlot index={i}/>:<CodeStampFace card={card}/>}</button>)}</div>
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
