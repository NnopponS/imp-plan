import {useId,useLayoutEffect,useRef,useState,type ReactNode} from 'react'
import {ArenaGamePreview} from './arena-preview'
import {titles,tutorials,type Game} from './engine'
import {GameToken} from './game-identity'
import './game-details.css'

export function GameRulePreview({game,motionOff,illustration}:{game:Game;motionOff?:boolean;illustration?:ReactNode}){
 return <figure className="game-rule-preview" data-preview-motion={motionOff?'off':undefined}>
  <figcaption>Gameplay preview</figcaption>
  <div className="game-rule-illustration">{illustration??<ArenaGamePreview game={game} motionOff={motionOff}/>}</div>
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
