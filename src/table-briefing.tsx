import {useEffect,useRef,useState,type CSSProperties,type ReactNode} from 'react'
import {titles,tutorials,type Game} from './engine'
import type {Seat} from './room'
import {RuleDemo,hasRuleDemo} from './rule-demo'
import {ChamberEntrance} from './blind-chamber'
import {WallGoLesson} from './wall-go-ui'
import {hasIllustratedGame,IllustratedGame} from './art'
import {EngravedRule,hasEngravedRule} from './engraved-rule'
import {HexBriefing} from './hex-briefing'
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
export function TableBriefing({game,seats,caption,close,start,variant,mechanic,setupHint,hold=false,motionOff=false}:{game:Game;hold?:boolean;seats:Seat[];caption:string;mechanic?:ReactNode;setupHint?:string;motionOff?:boolean;close:()=>void;start?:{enabled:boolean;confirm:()=>void};variant?:{label:string;rules:string;demo:(step:number)=>ReactNode}}){
 const dialog=useRef<HTMLDialogElement>(null)
 const [step,setStep]=useState(0)
 const [reduced,setReduced]=useState(()=>window.matchMedia('(prefers-reduced-motion: reduce)').matches)
 const staticScene=motionOff||reduced
 const instruction=variant?.rules??tutorials[game]
 const rules=instruction.match(/[^.!?]+[.!?]+(?:\s|$)|[^.!?]+$/g)?.map(x=>x.trim()).filter(Boolean)??[instruction]
 useEffect(()=>{
  const el=dialog.current
  const focus=document.activeElement instanceof HTMLElement?document.activeElement:null
  el?.showModal()
  return ()=>{el?.close();if(focus?.isConnected)focus.focus()}
 },[])
 useEffect(()=>{
  const media=window.matchMedia('(prefers-reduced-motion: reduce)')
  const change=()=>setReduced(media.matches)
  media.addEventListener('change',change)
  return ()=>media.removeEventListener('change',change)
 },[])
 const hex=game==='hex'
 const diagram=variant?variant.demo(step):game==='wallGo'?<WallGoLesson step={step}/>:hasRuleDemo(game)?<RuleDemo game={game} step={step}/>:hasEngravedRule(game)?<EngravedRule game={game} step={step}/>:null
 const hasPoster=hasIllustratedGame(game)
 const uniquePreview=!start&&game==='auction'&&variant?mechanic:undefined
 const scene=uniquePreview??diagram??(!start&&mechanic?mechanic:hasPoster?<IllustratedGame game={game} className="brief-theater-poster" loading="eager"/>:null)
 return <dialog ref={dialog} className="briefing briefing-theater" aria-labelledby="brief-game" data-brief-game={game} data-motion-off={staticScene||undefined} onCancel={e=>{e.preventDefault();close()}}>
  <div className="brief-head">
   <div><p className="eyebrow">{start?'TABLE BRIEFING':'RULES PREVIEW'} · {variant?.label??'FAN RULES'}<FolioTransition scene={{phase:start?'brief':'rules',game,hold}} motionOff={staticScene}/></p><h2 id="brief-game">{titles[game]}</h2></div>
   <button type="button" className="brief-back" data-chamber-next={!start||undefined} onClick={close}>{start?'Back to setup':'Back to lobby'}</button>
  </div>
  {game==='blind'&&<ChamberEntrance/>}
  {hex?<HexBriefing motionOff={staticScene}/>:<div className="brief-theater-content" data-scene={scene?'on':undefined}>
   {scene&&<div className="brief-theater-scene" data-diagram={diagram?'on':undefined}>
    {diagram&&hasPoster&&<IllustratedGame game={game} className="brief-theater-backdrop" loading="eager"/>}
    {scene}
   </div>}
   <div className="brief-theater-rules"><p>{caption}</p>{setupHint&&<p>{setupHint}</p>}
    <ol>{rules.map((rule,i)=><li key={i}>{diagram?<button type="button" aria-pressed={step===i} onClick={()=>setStep(i)}><span aria-hidden="true">{String(i+1).padStart(2,'0')}</span>{rule}</button>:<p><span aria-hidden="true">{String(i+1).padStart(2,'0')}</span>{rule}</p>}</li>)}</ol>
   </div>
  </div>}
  <Seats seats={seats}/>
  <footer><span>{start?'Timers start only after you enter.':'Only the host can start the match.'}</span>{start&&<button className="primary" data-chamber-next type="button" disabled={!start.enabled} onClick={start.confirm}>Enter match</button>}</footer>
 </dialog>
}
