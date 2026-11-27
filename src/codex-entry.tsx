import {useEffect,useRef,useState} from 'react'
import {base} from './brand'
import {KeeperCharacter} from './keeper-character'
import {chapterArrival} from './page-turn'
import {IntroStory,storyBeats,storyLength} from './intro-story'
import './codex-entry.css'

const visitKey='imp-plan-sixteen-seats-v1'
const reducedMotion='(prefers-reduced-motion: reduce)'

function shouldOpen(motionOff:boolean){
 if(motionOff||typeof window==='undefined'||location.hash||location.search||document.hidden||scrollY>24||window.matchMedia?.(reducedMotion)?.matches)return false
 try{
  if(chapterArrival())return false
  return sessionStorage.getItem(visitKey)!=='1'&&localStorage.getItem(visitKey)!=='1'
 }
 catch{return false}
}

function FolioLeaf({side}:{side:'west'|'east'}){
 return <div className={'codex-entry-leaf codex-entry-'+side}>
  <svg viewBox="0 0 420 690" preserveAspectRatio="none" focusable="false">
   <g fill="none" vectorEffect="non-scaling-stroke">
    <path className="codex-entry-keyline" d="M420 27Q200 11 31 24L14 42v605l18 18q171 15 388-3M420 33Q200 18 35 30L21 45v598l14 16q171 14 385-3"/>
    <path className="codex-entry-ruling" d="M420 49Q216 30 53 45L35 64v561l18 18q163 15 367-3M420 61Q218 42 59 57L47 70v549l12 13q159 14 361-4"/>
    <path className="codex-entry-ruling" d="M420 202Q319 172 303 77m117 411q-101 30-117 125M420 217Q302 188 288 83m132 390q-118 29-132 134"/>
    <path className="codex-entry-keyline" d="M420 213c-55 22-93 70-93 132s38 110 93 132m0-245c-45 24-75 62-75 113s30 89 75 113"/>
    <path className="codex-entry-ruling" d="M420 295c-16 7-30 27-30 50s14 43 30 50M419 281c-25 12-42 34-42 64s17 52 42 64"/>
    <path className="codex-entry-keyline" d="m317 337-8 8 8 8 8-8Zm-13 8h-30m-8-4-4 4 4 4 4-4Zm-14 0h-14M69 54l-12 15 12 15 12-15Zm-9 562 9-13 10 13-10 13Zm-15-7v16M45 64v17"/>
   </g>
  </svg>
 </div>
}

/** Decorative only. Never locks scrolling, focus, or clicks on the live Home. */
export function CodexEntry({motionOff}:{motionOff:boolean}){
 const [open,setOpen]=useState(()=>shouldOpen(motionOff))
 const skip=useRef<HTMLButtonElement>(null)
 const [chapter,setChapter]=useState(0)
 function dismiss(){
  if(document.activeElement===skip.current)document.querySelector<HTMLElement>('.landing-bar .brand')?.focus({preventScroll:true})
  setOpen(false)
 }
 useEffect(()=>{
  if(motionOff){setOpen(false);return}
  if(!open)return
  try{sessionStorage.setItem(visitKey,'1');localStorage.setItem(visitKey,'1')}
  catch{dismiss();return}
  const motion=window.matchMedia?.(reducedMotion)
  const key=(event:KeyboardEvent)=>{
   if(event.key==='Escape'||(event.target!==skip.current&&event.key!=='Tab'&&!event.altKey&&!event.ctrlKey&&!event.metaKey))dismiss()
  }
  const interaction=(event:Event)=>{if(event.target!==skip.current)dismiss()}
  const onVisibility=()=>{if(document.hidden)dismiss()}
  const onMotion=()=>{if(motion?.matches)dismiss()}
  const timers=storyBeats.slice(1).map((beat,index)=>window.setTimeout(()=>setChapter(index+1),beat.at))
  timers.push(window.setTimeout(dismiss,storyLength))
  document.addEventListener('keydown',key,true)
  document.addEventListener('pointerdown',interaction,true)
  document.addEventListener('focusin',interaction,true)
  document.addEventListener('wheel',interaction,{capture:true,passive:true})
  document.addEventListener('visibilitychange',onVisibility)
  window.addEventListener('hashchange',dismiss)
  motion?.addEventListener?.('change',onMotion)
  return ()=>{
   timers.forEach(timer=>window.clearTimeout(timer))
   document.removeEventListener('keydown',key,true)
   document.removeEventListener('pointerdown',interaction,true)
   document.removeEventListener('focusin',interaction,true)
   document.removeEventListener('wheel',interaction,true)
   document.removeEventListener('visibilitychange',onVisibility)
   window.removeEventListener('hashchange',dismiss)
   motion?.removeEventListener?.('change',onMotion)
  }
 },[open,motionOff])
 if(!open||motionOff)return null
 return <div className="codex-entry" data-story-duration={storyLength} data-story-chapter={storyBeats[chapter].id}>
  <IntroStory beat={storyBeats[chapter]}/>
  <div className="codex-entry-covers" aria-hidden="true">
   <FolioLeaf side="west"/><FolioLeaf side="east"/>
   <div className="codex-entry-stamp">
    <div className="codex-entry-portrait">
     <KeeperCharacter cue="signal"/>
     <div className="codex-entry-medallion"><img src={base+'art/imp-plan-mark.svg'} alt="" width={64} height={64}/></div>
    </div>
    <span>Imp Plan</span>
    <small>The Strategy Chambers</small>
   </div>
  </div>
  <div className="codex-entry-progress" aria-hidden="true"><i/></div>
  <button ref={skip} className="codex-entry-skip" type="button" onClick={dismiss}>Skip intro</button>
 </div>
}
