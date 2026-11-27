import {Fragment,useEffect,useId,useLayoutEffect,useRef,useState,type ReactNode} from 'react'
import {ArenaGamePreview,gamePreviewPlaybackTime,previewDialogIsActive,watchPreview,watchPreviewDialogs} from './arena-preview'
import {titles,tutorials,type Game} from './engine'
import {GameToken} from './game-identity'
import './game-details.css'

export function GameRulePreview({game,motionOff,illustration}:{game:Game;motionOff?:boolean;illustration?:ReactNode}){
 const art=useRef<HTMLDivElement>(null)
 const [cycle,setCycle]=useState(0)
 const [playing,setPlaying]=useState(false)
 // Built-in diagrams get their full authored sequence, then a short hold
 // before resetting. Custom lobby diagrams have at most 1.5 s of motion.
 const period=(illustration?1500:gamePreviewPlaybackTime(game))+650
 useEffect(()=>{
  const target=art.current
  if(!target||motionOff||typeof IntersectionObserver!=='function'){setPlaying(false);return}
  const media=window.matchMedia?.('(prefers-reduced-motion: reduce)')
  let ratio=0,remaining=period,timer:number|undefined
  let start=0
  function replay(){
   start=performance.now()
   timer=window.setTimeout(()=>{
    setCycle(c=>c+1)
    remaining=period
    replay()
   },remaining)
  }
  function changed(){
   const active=ratio>=.25&&!document.hidden&&!media?.matches&&previewDialogIsActive(target!)&&
    document.documentElement.dataset.gameMotion!=='off'
   if(active&&timer===undefined)replay()
   else if(!active&&timer!==undefined){
    window.clearTimeout(timer)
    remaining=Math.max(1,remaining-(performance.now()-start))
    timer=undefined
   }
   setPlaying(active)
  }
  const release=watchPreview(target,entry=>{ratio=entry.isIntersecting?entry.intersectionRatio:0;changed()})
  const releaseDialogs=watchPreviewDialogs(changed)
  document.addEventListener('visibilitychange',changed)
  media?.addEventListener?.('change',changed)
  return ()=>{
   release()
   releaseDialogs()
   window.clearTimeout(timer)
   document.removeEventListener('visibilitychange',changed)
   media?.removeEventListener?.('change',changed)
  }
 },[period,game,motionOff])
 return <figure className="game-rule-preview" data-preview-motion={motionOff?'off':undefined} data-preview-loop={playing?'playing':'paused'} data-preview-cycle={cycle}>
  <figcaption>Gameplay preview</figcaption>
  <div ref={art} className="game-rule-illustration"><Fragment key={cycle}>{illustration??<ArenaGamePreview game={game} motionOff={motionOff}/>}</Fragment></div>
 </figure>
}

export function GameDetails({game,motionOff,source,context}:{game:Game;motionOff?:boolean;source?:string;context?:ReactNode}){
 const [open,setOpen]=useState(false)
 const trigger=useRef<HTMLButtonElement>(null)
 return <>
  <button className="game-details-trigger" type="button" aria-label={'Details for '+titles[game]} aria-haspopup="dialog" ref={trigger} onClick={()=>setOpen(true)}>Details</button>
  {open&&<GameDetailsDialog game={game} motionOff={motionOff} source={source} context={context} close={()=>setOpen(false)} restore={()=>trigger.current?.focus({preventScroll:true})}/>}
 </>
}

function GameDetailsDialog({game,motionOff,source,context,close,restore}:{game:Game;motionOff?:boolean;source?:string;context?:ReactNode;close:()=>void;restore:()=>void}){
 const node=useRef<HTMLDialogElement>(null)
 const closeButton=useRef<HTMLButtonElement>(null)
 const returnTo=useRef(restore)
 const title=useId()
 useLayoutEffect(()=>{
  const dialog=node.current
  dialog?.showModal()
  closeButton.current?.focus({preventScroll:true})
  return ()=>{dialog?.close();returnTo.current()}
 },[])
 return <dialog className="game-details-modal" ref={node} aria-labelledby={title} onCancel={e=>{e.stopPropagation();e.preventDefault();close()}}>
  <header className="game-details-head">
   <GameToken game={game}/>
   <div><p className="eyebrow">Game details</p><h2 id={title}>{titles[game]}</h2></div>
   <button type="button" ref={closeButton} onClick={close} aria-label="Close details">Close</button>
  </header>
  <GameRulePreview game={game} motionOff={motionOff}/>
  <section className="game-details-rules">
   {context&&<div className="game-details-context">{context}</div>}
   <h3>Rules</h3>
   <p>{tutorials[game]}</p>
   {source&&<a className="game-context-source" href={source} target="_blank" rel="noreferrer">Show context reference</a>}
  </section>
 </dialog>
}
