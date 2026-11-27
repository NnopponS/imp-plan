import {useEffect,useRef,useState,type CSSProperties} from 'react'
import {titles,tutorials,type Game} from './engine'
import type {Seat} from './room'
import {RuleDemo,hasRuleDemo} from './rule-demo'
import {ChamberEntrance} from './blind-chamber'

const seatText=(n:number,s:string)=>n+' '+s+(n===1?'':'s')
export function TableBriefing({game,seats,caption,close,start}:{game:Game;seats:Seat[];caption:string;close:()=>void;start?:{enabled:boolean;confirm:()=>void}}){
 const dialog=useRef<HTMLDialogElement>(null)
 const [step,setStep]=useState(0)
 const rules=tutorials[game].match(/[^.!?]+[.!?]+(?:\s|$)|[^.!?]+$/g)?.map(x=>x.trim()).filter(Boolean)??[tutorials[game]]
 const bots=seats.filter(s=>s.bot).length
 useEffect(()=>{
  const el=dialog.current
  const focus=document.activeElement instanceof HTMLElement?document.activeElement:null
  el?.showModal()
  return ()=>{el?.close();if(focus?.isConnected)focus.focus()}
 },[])
 return <dialog ref={dialog} className="briefing" aria-labelledby="brief-game" onCancel={e=>{e.preventDefault();close()}}>
  <div className="brief-head">
   <div><p className="eyebrow">{start?'TABLE BRIEFING':'RULES PREVIEW'} · FAN RULES</p><h2 id="brief-game">{titles[game]}</h2></div>
   <button type="button" className="brief-back" data-chamber-next={!start||undefined} onClick={close}>{start?'Back to setup':'Back to lobby'}</button>
  </div>
  {game==='blind'&&<ChamberEntrance/>}
  <div className="brief-body">
   <div className="brief-stage">
    <div className="brief-seat-ring" data-dense={seats.length>10||undefined} aria-label="Player seating">
     <span className="brief-ring-label" aria-hidden="true">Seats</span>
     {seats.map((s,i)=>{
      const angle=(i/Math.max(1,seats.length))*Math.PI*2+Math.PI/2
      return <span key={s.id} role="img" aria-label={'Seat '+(i+1)+': '+s.name+(s.bot?', bot':'')} title={s.name} data-brief-seat={s.bot?'bot':'human'} style={{'--x':50+Math.cos(angle)*42+'%','--y':50+Math.sin(angle)*39+'%','--delay':i*24+'ms'} as CSSProperties}><i aria-hidden="true"/><b aria-hidden="true">{i+1}</b></span>
     })}
    </div>
    <div className="brief-count"><strong>{seats.length} at the table</strong><span>{seatText(seats.length-bots,'human')} · {seatText(bots,'bot')}</span></div>
   </div>
   <div className="brief-lesson"><p>{caption}</p>{hasRuleDemo(game)&&<div className="brief-example"><span>Rule example</span><RuleDemo game={game} step={step}/></div>}<ol>{rules.map((rule,i)=><li key={i}><button type="button" aria-pressed={step===i} onClick={()=>setStep(i)}><span aria-hidden="true">{String(i+1).padStart(2,'0')}</span>{rule}</button></li>)}</ol></div>
  </div>
  <footer><span>{start?'Any match timer starts after you enter.':'Only the host can start the match.'}</span>{start&&<button className="primary" data-chamber-next type="button" disabled={!start.enabled} onClick={start.confirm}>Enter match</button>}</footer>
 </dialog>
}
