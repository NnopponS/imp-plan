import {useEffect,useRef,useState,type CSSProperties,type ReactNode} from 'react'
import {titles,tutorials,type Game} from './engine'
import type {Seat} from './room'
import {base} from './brand'
import {hasIllustratedGame,IllustratedGame} from './art'
import {lessonFor,type Variant} from './lesson-book'
import {FolioTransition} from './stage-folio'
import './table-briefing.css'

const seatText=(n:number,s:string)=>n+' '+s+(n===1?'':'s')
function Seats({seats}:{seats:Seat[]}){
 const bots=seats.filter(s=>s.bot).length
 return <div className="brief-audience">
  <div className="brief-audience-key"><strong>{seats.length} at the table</strong><span>{seatText(seats.length-bots,'human')} · {seatText(bots,'bot')}</span></div>
  <div className="brief-audience-pieces" role="group" aria-label="Player seating">
   {seats.map((s,i)=><span key={s.id} role="img" aria-label={'Seat '+(i+1)+': '+s.name+(s.bot?', bot':'')} title={s.name} data-brief-seat={s.bot?'bot':'human'} style={{'--delay':i*20+'ms'} as CSSProperties}>
    <svg viewBox="0 0 30 32" aria-hidden="true"><path className="brief-piece-base" d="M15 1 29 16 15 31 1 16z"/><path className="brief-piece-rim" d="M15 5 25 16 15 27 5 16z"/><text x="15" y="19.4" textAnchor="middle">{i+1}</text></svg>
   </span>)}
  </div>
 </div>
}
export function TableBriefing({game,seats,caption,close,start,variant,mechanic,setupHint,hold=false,motionOff=false}:{game:Game;hold?:boolean;seats:Seat[];caption:string;mechanic?:ReactNode;setupHint?:string;motionOff?:boolean;close:()=>void;start?:{enabled:boolean;confirm:()=>void};variant?:Variant}){
 const dialog=useRef<HTMLDialogElement>(null)
 const [step,setStep]=useState(0)
 const [skipEntrance,setSkipEntrance]=useState(false)
 const reader=useRef<HTMLElement>(null)
 const back=useRef<HTMLButtonElement>(null)
 const enter=useRef<HTMLButtonElement>(null)
 const [reduced,setReduced]=useState(()=>window.matchMedia('(prefers-reduced-motion: reduce)').matches)
 const staticScene=motionOff||reduced
 const instruction=variant?.rules??tutorials[game]
 const lesson=lessonFor(game,variant,hold)
 const rules=instruction.match(/[^.!?]+(?:[.!?]+(?=\s|$)|$)/g)?.map(x=>x.trim()).filter(Boolean)??[instruction]
 const frames=lesson?.frames??rules.map(caption=>({title:'Rule note',caption}))
 const {title,caption:line}=frames[step]
 const gesture=useRef<{id:number;x:number;y:number}|null>(null)
 const pageBy=(delta:number)=>setStep(s=>Math.max(0,Math.min(s+delta,frames.length-1)))
 useEffect(()=>{
  const el=dialog.current
  const focus=document.activeElement instanceof HTMLElement?document.activeElement:null
  el?.showModal();reader.current?.focus({preventScroll:true})
  return ()=>{el?.close();if(focus?.isConnected)focus.focus()}
 },[])
 useEffect(()=>{
  const media=window.matchMedia('(prefers-reduced-motion: reduce)')
  const change=()=>setReduced(media.matches)
  media.addEventListener('change',change)
  return ()=>media.removeEventListener('change',change)
 },[])
 const scene=lesson?lesson.render(step):mechanic??(hasIllustratedGame(game)?<IllustratedGame game={game} className="brief-theater-poster" loading="eager"/>:null)
 const blind=game==='blind'
 const showEntrance=blind&&!skipEntrance
 function dismissEntrance(){
  setSkipEntrance(true)
  const next=enter.current
  if(next&&!next.disabled)next.focus({preventScroll:true})
  else back.current?.focus({preventScroll:true})
 }
 return <dialog ref={dialog} className="briefing briefing-theater" aria-labelledby="brief-game" data-brief-game={game} data-motion-off={staticScene||undefined} onCancel={e=>{e.preventDefault();close()}}>
  <div className="brief-head">
   <div><p className="eyebrow">{start?'TABLE BRIEFING':'RULES PREVIEW'} · {variant?.label??'FAN RULES'}<FolioTransition scene={{phase:start?'brief':'rules',game,hold}} motionOff={staticScene}/></p><h2 id="brief-game">{titles[game]}</h2></div>
   <button ref={back} type="button" className="brief-back" onClick={close}><svg viewBox="0 0 16 16" width="16" height="16" fill="none" aria-hidden="true"><path d="M10.5 3 5.5 8l5 5M6 8h8" stroke="currentColor" strokeWidth="1.55" strokeLinecap="round" strokeLinejoin="round"/></svg>{start?'Back to setup':'Back to lobby'}</button>
  </div>
  <div className="brief-theater-scroll">
   <section ref={reader} className="brief-reader" role="region" aria-label="How to play" aria-roledescription="carousel" aria-describedby="brief-gestures" data-lesson-kind={lesson?'worked-example':'rule-notes'} tabIndex={0}
    onKeyDown={e=>{
     if(e.altKey||e.ctrlKey||e.metaKey||e.shiftKey||!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return
     e.preventDefault()
     if(e.key==='Home')setStep(0);else if(e.key==='End')setStep(frames.length-1);else pageBy(e.key==='ArrowRight'?1:-1)
    }}>
    <span className="sr" id="brief-gestures">Swipe or drag right for the next page and left to go back. You can also use the arrow keys or choose a page mark.</span>
    <div className="brief-page" data-step={step} onPointerDown={e=>{
     if(!e.isPrimary||e.button!==0||(e.target as Element).closest('button,a,summary')){gesture.current=null;return}
     gesture.current={id:e.pointerId,x:e.clientX,y:e.clientY}
     e.currentTarget.setPointerCapture(e.pointerId)
    }} onPointerCancel={()=>{gesture.current=null}} onPointerUp={e=>{
     const origin=gesture.current;gesture.current=null
     if(!origin||origin.id!==e.pointerId)return
     const dx=e.clientX-origin.x,dy=e.clientY-origin.y
     if(Math.abs(dx)>=36&&Math.abs(dx)>1.5*Math.abs(dy))pageBy(dx>0?1:-1)
    }}>
     <div role={showEntrance?'region':undefined} aria-label={showEntrance?'Secret Chamber':undefined} className="brief-theater-scene" data-diagram={lesson?'on':undefined} data-entrance={showEntrance||undefined}>
      {showEntrance&&<img className="brief-theater-backdrop" src={base+'art/secret-chamber.svg'} alt="" width={1200} height={660} decoding="async"/>}
      {showEntrance&&<div className="brief-scene-legend"><span className="brief-scene-title">Secret Chamber</span><button type="button" className="brief-skip" onClick={dismissEntrance}>Skip entrance</button></div>}
      {scene&&<div className="brief-scene-object">{scene}</div>}
      <SwipeCue key={step} motionOff={staticScene} finished={step===frames.length-1} canEnter={!!start}/>
     </div>
     <div className="brief-page-copy"><div className="brief-live" aria-live="polite" aria-atomic="true"><span className="brief-scene-title">{lesson?'Field guide':'Rule notes'} · {String(step+1).padStart(2,'0')} / {String(frames.length).padStart(2,'0')}</span><h3>{title}</h3><p>{line}</p></div>
      {frames.length>1&&<div className="brief-marks" role="group" aria-label="Lesson pages">{frames.map((frame,i)=><button key={i} type="button" aria-label={'Go to lesson page '+(i+1)+': '+frame.title} aria-current={step===i?'step':undefined} title={frame.title} onClick={()=>setStep(i)}><i aria-hidden="true"/></button>)}</div>}
     </div>
    </div>
   </section>
   <details className="brief-reference"><summary>Full rules</summary><p>{instruction}</p>{caption&&<p>{caption}</p>}{setupHint&&<p>{setupHint}</p>}</details>
   <Seats seats={seats}/>
  </div>
  <footer><span>{start?'Timers start only after you enter.':'Only the host can start the match.'}</span>{start&&<button ref={enter} className="primary" type="button" disabled={!start.enabled} onClick={start.confirm}>Enter match</button>}</footer>
 </dialog>
}

function SwipeCue({motionOff,finished,canEnter}:{motionOff:boolean;finished:boolean;canEnter:boolean}){
 const el=useRef<HTMLDivElement>(null)
 const [ready,setReady]=useState(false)
 useEffect(()=>{
  if(motionOff)return
  let active=true
  const timer=window.setTimeout(()=>{
   const scene=el.current?.parentElement?.querySelector('.brief-scene-object')
   const movements=scene?.getAnimations({subtree:true}).filter(a=>a.playState==='running'&&Number(a.effect?.getComputedTiming().endTime)<=2000)??[]
   Promise.allSettled(movements.map(a=>a.finished)).then(()=>{if(active)setReady(true)})
  },650)
  return ()=>{active=false;window.clearTimeout(timer)}
 },[motionOff])
 return <div ref={el} aria-hidden="true" className="brief-cue" data-ready={motionOff||ready||undefined} data-finished={finished||undefined}>
  {finished?<><span>{canEnter?'Enter match':'End of guide'}</span><span>{canEnter?'↓':'◆'}</span></>:<>
   <svg className="brief-cue-trail" width="45" height="18" viewBox="0 0 45 18" fill="none"><path d="M4 11h30m-4-4 5 4-5 4" stroke="currentColor" strokeDasharray="2 3" strokeLinecap="round"/><g className="brief-cue-hand"><path d="M8 13 5 9q-1-2 1-2l3 2V4q0-2 2-2t2 2v3l4 1q2 0 2 2l-1 4-2 2h-5Z" fill="#543c29" stroke="currentColor" strokeWidth="1.2"/></g></svg>
   <span className="brief-touch-hint">Swipe right</span><span className="brief-key-hint">Drag right</span>
  </>}
 </div>
}
