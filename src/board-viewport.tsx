import {useId,useLayoutEffect,useRef,useState,type CSSProperties,type ReactNode} from 'react'
import './board-viewport.css'

const scales=[1,1.25,1.5,2] as const
export function BoardViewport({label,children}:{label:string;children:ReactNode}){
 const [step,setStep]=useState(0)
 const viewer=useRef<HTMLDivElement>(null)
 const center=useRef({x:.5,y:.5})
 const frame=useId()
 const scale=scales[step]
 const next=(st:number)=>{
  const v=viewer.current
  if(v){center.current={x:(v.scrollLeft+v.clientWidth/2)/Math.max(1,v.scrollWidth),y:(v.scrollTop+v.clientHeight/2)/Math.max(1,v.scrollHeight)}}
  setStep(Math.max(0,Math.min(st,scales.length-1)))
 }
 useLayoutEffect(()=>{
  const v=viewer.current
  if(v){v.scrollLeft=step?Math.max(0,center.current.x*v.scrollWidth-v.clientWidth/2):0;v.scrollTop=step?Math.max(0,center.current.y*v.scrollHeight-v.clientHeight/2):0}
 },[step])
 return <div className="board-viewer" data-enlarged={step>0||undefined}>
  <div className="board-camera" role="group" aria-label="Board zoom">
   <button type="button" onClick={()=>next(step-1)} disabled={!step} aria-label="Zoom out" aria-controls={frame}>
    <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10" cy="10" r="5.5"/><path d="m14.5 14.5 5 5M7.5 10h5"/></svg>
   </button>
   <output aria-live="polite">{Math.round(scale*100)}%</output>
   <button type="button" onClick={()=>next(step+1)} disabled={step===scales.length-1} aria-label="Zoom in" aria-controls={frame}>
    <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10" cy="10" r="5.5"/><path d="m14.5 14.5 5 5M7.5 10h5M10 7.5v5"/></svg>
   </button>
   {step>0&&<button type="button" onClick={()=>next(0)} aria-label="Fit board" aria-controls={frame}>Fit</button>}
  </div>
  <div className="board-camera-window" id={frame} ref={viewer} tabIndex={step?0:undefined} role={step?'region':undefined} aria-label={step?label+' scroll view':undefined}>
   <div className="board-camera-surface" style={{'--board-scale':scale} as CSSProperties}>{children}</div>
  </div>
 </div>
}
