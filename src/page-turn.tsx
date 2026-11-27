import {useEffect,useLayoutEffect,useRef,useState,type CSSProperties} from 'react'
import {base} from './brand'
import './page-turn.css'

export type PageTurnScreen='home'|'season-1'|'season-2'|'season-3'|'invite'|'practice'|'party'|'match'|'result'
const intentKey='imp-plan-chapter-turn-v1'
const mediaQuery='(prefers-reduced-motion: reduce)'
const turnMs=780
const turnTiming={'--turn-time':turnMs+'ms'} as CSSProperties
const order:Record<PageTurnScreen,number>={home:0,'season-1':1,'season-2':2,'season-3':3,invite:4,practice:5,party:5,match:6,result:7}

function chapterPath(url:URL){
 if(url.origin!==location.origin||!url.pathname.startsWith(base))return null
 const chapter=url.pathname.slice(base.length).replace(/index\.html$/,'')
 return chapter===''||/^season\/[123]\/$/.test(chapter)?base+chapter:null
}

/** No clicks are intercepted: this cue only survives ordinary native navigation in the same tab. */
function rememberChapter(event:MouseEvent){
 if(event.defaultPrevented||event.button!==0||event.altKey||event.ctrlKey||event.metaKey||event.shiftKey)return
 const link=event.target instanceof Element?event.target.closest<HTMLAnchorElement>('a[href]'):null
 if(!link||link.hasAttribute('download')||(link.target&&link.target!=='_self'))return
 const from=chapterPath(new URL(location.href))
 const to=chapterPath(new URL(link.href))
 if(!from||!to||from===to)return
 try{sessionStorage.setItem(intentKey,JSON.stringify({from,to,at:Date.now()}))}catch{/* Navigation must also work with blocked storage. */}
}

function reverseChapter(from:string,to:string){
 const rank=(path:string)=>Number(path.match(/season\/([123])\/$/)?.[1]??0)
 return rank(from)>rank(to)
}

/** Shared with Home intro so opening a chapter and returning never runs both sequences. */
export function chapterArrival():{back:boolean}|null{
 const nav=performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming|undefined
 if(nav?.type==='reload')return null
 const to=chapterPath(new URL(location.href))
 if(!to)return null
 if(nav?.type==='back_forward')return {back:true}
 try{
  const hint=JSON.parse(sessionStorage.getItem(intentKey)??'null')
  if(hint?.to===to&&typeof hint.from==='string'&&hint.from!==to&&typeof hint.at==='number'&&
   Date.now()>=hint.at&&Date.now()-hint.at<15_000)return {back:reverseChapter(hint.from,to)}
 }catch{/* Referrer is a best-effort fallback. */}
 try{
  const from=chapterPath(new URL(document.referrer))
  return from&&from!==to?{back:reverseChapter(from,to)}:null
 }catch{return null}
}

function available(motionOff:boolean){
 return !motionOff&&!document.hidden&&!window.matchMedia?.(mediaQuery)?.matches
}

/** A brief painted leaf over real UI: never waits for navigation, assets, focus, or gameplay. */
export function PageTurn({screen,motionOff}:{screen?:PageTurnScreen;motionOff:boolean}){
 const [cue,setCue]=useState<{screen:PageTurnScreen;back:boolean;serial:number}|null>(null)
 const previous=useRef<PageTurnScreen|undefined>(undefined)
 const serial=useRef(0)
 useLayoutEffect(()=>{
  const before=previous.current
  if(!screen)return
  previous.current=screen
  if(!available(motionOff)){setCue(null);return}
  if(screen===before)return
  const arrival=before?{back:order[before]>order[screen]}:chapterArrival()
  if(arrival)setCue({screen,back:arrival.back,serial:++serial.current})
 },[screen,motionOff])
 useEffect(()=>{
  document.addEventListener('click',rememberChapter)
  return ()=>document.removeEventListener('click',rememberChapter)
 },[])
 useEffect(()=>{
  const restore=(event:PageTransitionEvent)=>{
   if(event.persisted&&screen&&available(motionOff))
    setCue({screen,back:true,serial:++serial.current})
  }
  window.addEventListener('pageshow',restore)
  return ()=>window.removeEventListener('pageshow',restore)
 },[screen,motionOff])
 useEffect(()=>{
  if(!cue)return
  const stop=()=>setCue(null)
  const media=window.matchMedia?.(mediaQuery)
  const reduce=()=>{if(media?.matches)stop()}
  const hide=()=>{if(document.hidden)stop()}
  // CSS normally clears the cue when the leaf exits. Allow first-paint
  // scheduling slack before this stuck-animation guard releases it.
  const timer=window.setTimeout(stop,turnMs+320)
  const skipKeys=(event:KeyboardEvent)=>{if(!event.altKey&&!event.ctrlKey&&!event.metaKey)stop()}
  document.addEventListener('pointerdown',stop,true)
  document.addEventListener('keydown',skipKeys,true)
  document.addEventListener('wheel',stop,{capture:true,passive:true})
  document.addEventListener('visibilitychange',hide)
  media?.addEventListener?.('change',reduce)
  return ()=>{
   window.clearTimeout(timer)
   document.removeEventListener('pointerdown',stop,true)
   document.removeEventListener('keydown',skipKeys,true)
   document.removeEventListener('wheel',stop,true)
   document.removeEventListener('visibilitychange',hide)
   media?.removeEventListener?.('change',reduce)
  }
 },[cue])
 if(!cue||motionOff)return null
 return <div key={cue.serial} className="page-turn" style={turnTiming} data-page-turn={cue.screen} data-turn-back={cue.back||undefined} aria-hidden="true">
  <span className="page-turn-shadow"/>
  <svg className="page-turn-leaf" viewBox="0 0 520 1000" preserveAspectRatio="none" focusable="false"
   onAnimationEnd={()=>setCue(null)}>
   <path className="page-turn-paper" d="M78-12H540v1024H57Q116 788 63 641 29 510 43 364 49 186 78-12Z"/>
   <path className="page-turn-fold" d="M78-12h66Q86 177 86 375 78 513 115 645 154 817 98 1012H57Q116 788 63 641 29 510 43 364 49 186 78-12Z"/>
   <path className="page-turn-edge" d="M78-12Q49 186 43 364 29 510 63 641 116 788 57 1012"/>
   <path className="page-turn-ink" d="M101-9Q60 190 60 369 50 520 90 648 136 817 72 1009M130-7Q82 176 80 368 62 517 106 650 150 820 91 1010M246-10q-49 92-112 106m389 807q-138 9-187 108M146 109q32 75 7 145m-10 484q51 120 1 184"/>
   <path className="page-turn-rule" d="M203 15H524m-332 6H524M179 975h345m-340 7h340M170 174q87 15 149-8m-141 20q77 15 124-8m-138 642q96-18 161-1m-152 13q78-13 147 2"/>
   <path className="page-turn-rule" d="m103 490 13 12-10 14-12-13Zm35-15 20 26-19 23-20-23Zm35 12 13 15-13 13-12-13Zm18 15 69-1m-177-10 8 11-8 11-8-10Z"/>
  </svg>
 </div>
}
