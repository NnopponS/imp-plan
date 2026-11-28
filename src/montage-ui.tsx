import {useEffect,useLayoutEffect,useRef,useState,type CSSProperties,type KeyboardEvent} from 'react'
import {base} from './brand'
import {montageRules,type MontageCommand} from './montage'
import {montagePortraits} from './montage-portraits'
import type {Snapshot} from './room'
import './montage.css'

export const montageSource='https://www.springfieldspringfield.co.uk/view_episode_scripts.php?episode=s01e09&tv-show=the-devils-plan-2023'
export const montagePracticeRules='Watch one gallery of portraits at four and a half seconds per face. Buzz before a portrait disappears if you already saw it in this round. A wrong buzz adds an error. The eleventh error or a missed repeat ends this practice. No Pieces are awarded.'
const image=(id:number)=>base+'art/montage/p'+String(id).padStart(2,'0')+'.svg'
const editable='input, textarea, select, [contenteditable="true"], [role="textbox"]'

export function MontageLesson({step}:{step:number}){
 const example=[3,12,3]
 return <div className="montage-lesson" role="group" aria-label="Montage rule example">
  <div>{example.map((id,i)=><figure key={i} data-cued={step>0&&i===2||undefined}>
   <img src={image(id)} width={80} height={96} alt={montagePortraits[id].label}/>
   <figcaption>{['First','Next','Repeat'][i]}</figcaption>
  </figure>)}</div>
  <p>These are sample portraits, not the live sequence.</p>
 </div>
}

type BoardProps={preview?:boolean;snap:Snapshot;name:(id:string)=>string;active:boolean;open:(round:number)=>void;buzz:(command:MontageCommand)=>void}
export function MontageBoard({snap,name,active,open,buzz,preview}:BoardProps){
 const m=snap.game!.montage!
 const button=useRef<HTMLButtonElement>(null)
 const opened=useRef(false)
 const [now,setNow]=useState(snap.hostNow)
 const anchor=useRef({host:snap.hostNow,local:0})
 // Preload every illustration in asset order. No upcoming sequence is available here.
 useEffect(()=>{
  if(preview)return
  const deck=montagePortraits.map((_,id)=>{
   const asset=new Image()
   asset.src=image(id)
   return asset
  })
  return ()=>{deck.length=0}
 },[preview])
 useLayoutEffect(()=>{
  anchor.current={host:snap.hostNow,local:performance.now()}
  setNow(snap.hostNow)
 },[snap])
 useEffect(()=>{
  if(preview||m.nextAt===null||!active)return
  const timer=setInterval(()=>setNow(anchor.current.host+performance.now()-anchor.current.local),70)
  return ()=>clearInterval(timer)
 },[m.nextAt,active,preview])
 useLayoutEffect(()=>{
  if(m.phase==='countdown'&&opened.current){
   button.current?.focus({preventScroll:true})
   opened.current=false
  }
 },[m.phase])

 const host=snap.host===snap.you
 const between=m.phase==='ready'||m.phase==='between'
 const nextRound=m.phase==='between'?m.round+1:m.round
 const clock=m.nextAt===null?null:Math.max(0,m.nextAt-now)
 const frame=active&&clock!==0?m.frame:null
 const canBuzz=!!frame&&m.canBuzz
 const duration=m.phase==='countdown'?montageRules.countdownMs:m.mode==='practice'?montageRules.practiceFrameMs:montageRules.frameMs
 const last=m.lastBuzz
 const success=m.outcome==='cleared'
 const progress=`${m.clearedRounds} / ${m.totalRounds} rounds cleared`
 const feedback=m.phase==='finished'?
  success?(m.mode==='practice'?'Practice complete: you found the repeat.':'Gallery clear. Your team found all five repeats.'):
   m.outcome==='missed-repeat'?'The repeat passed without a buzz.':'The eleventh team error closed the gallery.':
  last?.correct?`${name(last.seat)} found the repeat. Round ${last.round} cleared.`:
  last?`${name(last.seat)} buzzed on a new portrait.`:
  between?(host?`Open round ${nextRound} when everyone is ready.`:`Waiting for the host to open round ${nextRound}.`):
  m.phase==='countdown'?'The gallery is opening.':'Buzz only if you have seen this face in the current round.'
 const blank=m.phase==='finished'?(success?'Gallery cleared':'Gallery closed'):m.phase==='countdown'?'Watch this space':m.phase==='between'?'Round cleared':m.phase==='ready'?'Gallery ready':'Waiting for the next portrait'
 const fire=()=>{if(canBuzz&&frame)buzz({round:m.round,frame:frame.index})}
 const keyboard=(e:KeyboardEvent<HTMLElement>)=>{
  if(e.key.toLowerCase()!=='b'||e.repeat||e.altKey||e.ctrlKey||e.metaKey||(e.target instanceof HTMLElement&&e.target.closest(editable)))return
  e.preventDefault()
  fire()
 }

 return <section className="montage-board" aria-label="Montage portrait gallery" onKeyDown={keyboard}>
  <header className="montage-top">
   <div><span>{m.mode==='practice'?'SOLO PRACTICE':'COOPERATIVE MATCH'}</span><strong>Round {m.round} / {m.totalRounds}</strong></div>
   <ol className="montage-progress" aria-label={progress}>
    {Array.from({length:m.totalRounds},(_,i)=><li aria-hidden="true" key={i} data-clear={i<m.clearedRounds||undefined} data-round={i+1===m.round||undefined}>{i+1}</li>)}
   </ol>
  </header>
  <div className="montage-frame" data-portrait-live={!!frame||undefined}>
   <div className="montage-trim" aria-hidden="true"><span/><span/><span/><span/></div>
   {frame?<figure data-montage-frame={frame.index} key={`${m.round}:${frame.index}`}>
    <img src={image(frame.portraitId)} width={80} height={96} fetchPriority="high" alt={montagePortraits[frame.portraitId].label}/>
   </figure>:<div className="montage-aperture"><span aria-hidden="true">◇</span><p>{blank}</p></div>}
   <span className="sr" role="status" aria-atomic="true">{frame?montagePortraits[frame.portraitId].label:''}</span>
   {clock!==null&&active&&<div className="montage-clock" role="timer" aria-label={m.phase==='countdown'?'Portrait countdown':'Portrait time remaining'}>
    <span aria-hidden="true" style={{'--timed':clock/duration} as CSSProperties}/><b>{Math.ceil(clock/1000)} s</b>
   </div>}
  </div>
  <p className="montage-status" role="status">{active?feedback:'Connection lost. The host keeps the gallery clock.'}</p>
  <div className="montage-controls">
   {between&&host?<button className="primary montage-open" disabled={!active} onClick={()=>{opened.current=true;open(nextRound)}}>Start round {nextRound}</button>:
    m.phase!=='finished'&&<button ref={button} type="button" className="montage-buzz" aria-disabled={!canBuzz} aria-keyshortcuts="B" onClick={fire}>
     <span aria-hidden="true" className="montage-buzz-icon">◎</span> Buzz: I saw this face <kbd aria-hidden="true">B</kbd>
    </button>}
  </div>
  <dl className="montage-meta">
   <div><dt>Gallery progress</dt><dd>{progress}</dd></div>
   <div><dt>Team errors</dt><dd>{m.errors} / {m.errorLimit}</dd></div>
  </dl>
  {m.mode==='match'&&<div className="montage-scores" aria-label="Fictional Pieces">
   {m.pieces.map(({seat,pieces})=><div key={seat}><span>{name(seat)}</span><strong>{pieces} {pieces===1?'Piece':'Pieces'}</strong></div>)}
  </div>}
 </section>
}
