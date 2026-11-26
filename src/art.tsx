import React,{useEffect,useRef,useState} from 'react'
import {base} from './brand'
export function Crest(){return <svg className="crest" width="33" height="33" viewBox="0 0 40 40" fill="none" aria-hidden="true"><path d="M20 1.5 38.5 20 20 38.5 1.5 20Z" fill="#4c3169"/><path d="M20 6 34 20 20 34 6 20Z" stroke="#d9b97b"/><path d="m20 9 8 14-8 7-8-7Z" fill="#ab7a4c" stroke="#f2d5a1"/><path d="m20 9 3 14-3 7-3-7Z" fill="#eee0c0"/><path d="M12 23h16" stroke="#f2d5a1"/></svg>}
export function GameArt({mode}:{mode:string}){return <div className={'game-art '+mode}><img data-arena-art src={base+'art/'+mode+'.webp'} width={650} height={430} loading="lazy" decoding="async" alt=""/></div>}
export function StageArt({exhibit,exhibitTitle}:{exhibit?:string;exhibitTitle?:string}){
 const video=useRef<HTMLVideoElement>(null)
 const [reduced,setReduced]=useState(true)
 const [running,setRunning]=useState(false)
 const [loaded,setLoaded]=useState(false)
 useEffect(()=>{
  const query=matchMedia('(prefers-reduced-motion: reduce)')
  const apply=()=>{setReduced(query.matches);setRunning(!exhibit&&!query.matches&&matchMedia('(min-width:761px)').matches)}
  apply()
  query.addEventListener('change',apply)
  return ()=>query.removeEventListener('change',apply)
 },[exhibit])
 useEffect(()=>{
  const el=video.current
  if(running&&el){
   if(el.ended)el.currentTime=0
   void el.play().catch(()=>setRunning(false))
  }else el?.pause()
 },[running,reduced])
 return <figure className="stage" data-animated={running?true:undefined}>
  <div className="stage-window">
   <img data-arena-art src={base+'art/'+(exhibit??'arena-stage')+'.webp'} alt="" width={1120} height={672} fetchPriority="high"/>
   {!exhibit&&!reduced&&(running||loaded)&&<video ref={video} className={'stage-video'+(loaded?' is-loaded':'')} src={base+'art/arena-motion.webm'} muted playsInline preload="none" aria-hidden="true" tabIndex={-1}
    onPlaying={()=>setLoaded(true)} onEnded={()=>setRunning(false)} onError={()=>setRunning(false)}/>}
   <svg aria-hidden="true" className="stage-reticle" viewBox="0 0 1000 600" preserveAspectRatio="xMidYMid slice">
    <g stroke="currentColor" fill="none" strokeWidth="1">
     <path d="M34 60V34h26m880 0h26v26m0 480v26h-26m-880 0H34v-26"/>
     <path d="M34 105v18m0 354v18m932-390v18m0 354v18" opacity=".45"/>
     <circle cx="500" cy="282" r="235" strokeDasharray="1 12" opacity=".45"/>
     <circle cx="500" cy="282" r="256" strokeDasharray="40 764" className="stage-orbit"/>
     <path d="M500 34v24m0 482v26m-466-266h24m884 0h24" opacity=".65"/>
    </g>
   </svg>
   <span className="stage-number">01 / THE TABLE</span>
  </div>
  <figcaption><span>{exhibitTitle?'TABLE EXHIBIT · '+exhibitTitle.toUpperCase():'OBJECT 01 · THE ARENA PIECE'}</span>{!exhibit&&!reduced&&<button className="motion-toggle" type="button" onClick={()=>setRunning(v=>!v)}>{running?'Pause motion':'Play motion'}</button>}</figcaption>
 </figure>
}
