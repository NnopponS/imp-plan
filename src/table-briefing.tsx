import {useEffect,useRef,useState,type CSSProperties} from 'react'
import {titles,tutorials,type Game} from './engine'
import type {Seat} from './room'

const groups={
 strategy:['blind','morris','point','bagh','mancala','grass1','grass3','knight'],
 sealed:['remove','auction','secret','codeLock','equations'],
 spatial:['hex','cubes','rectangles','exile','divine','fence','pyramid','spot','scale','tower','fragments'],
} as const
function motif(game:Game){
 if((groups.sealed as readonly Game[]).includes(game))return 'sealed'
 if((groups.strategy as readonly Game[]).includes(game))return 'strategy'
 return 'spatial'
}
function Diagram({game,phase}:{game:Game;phase:number}){
 const shape=motif(game)
 return <svg viewBox="0 0 144 86" className="brief-diagram" aria-hidden="true" data-phase={phase} data-motif={shape}>
  <ellipse cx="72" cy="45" rx="62" ry="32" fill="none" stroke="currentColor" opacity=".24"/>
  {shape==='strategy'?<>
   <path d="M38 20h68v46H38z M55 20v46m17-46v46m17-46v46 M38 35h68m-68 16h68" fill="none" stroke="currentColor" opacity=".72"/>
   <circle className="diagram-chit" cx={55+17*(phase%3)} cy={35+16*(phase%2)} r="7"/>
  </>:shape==='sealed'?<>
   <path d="M35 23h30v40H35zM79 23h30v40H79z" fill="none" stroke="currentColor"/>
   <path d="m44 42 6-8 6 8-6 8zm44 0 6-8 6 8-6 8z" fill="currentColor" opacity=".6"/>
   <path className="diagram-chit" d={phase%2?'m94 31 10 12-10 12-10-12z':'m50 31 10 12-10 12-10-12z'}/>
  </>:<>
   <path d="M46 25h34v17h17v19H63V46H46z" fill="none" stroke="currentColor"/>
   <path className="diagram-chit" d={phase%2?'M64 44h16v16H64z':'M47 26h16v18H47z'}/>
   <path d="M80 44h16v16H80zM64 26h16v16H64z" fill="none" stroke="currentColor" opacity=".45"/>
  </>}
 </svg>
}
const seatText=(n:number,s:string)=>n+' '+s+(n===1?'':'s')
export function TableBriefing({game,seats,caption,canStart,close,confirm}:{game:Game;seats:Seat[];caption:string;canStart:boolean;close:()=>void;confirm:()=>void}){
 const dialog=useRef<HTMLDialogElement>(null)
 const [step,setStep]=useState(0)
 const rules=tutorials[game].match(/[^.!?]+[.!?]+(?:\s|$)|[^.!?]+$/g)?.map(x=>x.trim()).filter(Boolean)??[tutorials[game]]
 const bots=seats.filter(s=>s.bot).length
 useEffect(()=>{
  const el=dialog.current
  const focus=document.activeElement instanceof HTMLElement?document.activeElement:null
  el?.showModal()
  return ()=>{el?.close();focus?.focus()}
 },[])
 return <dialog ref={dialog} className="briefing" aria-labelledby="brief-game" onCancel={e=>{e.preventDefault();close()}}>
  <div className="brief-head">
   <div><p className="eyebrow">TABLE BRIEFING · FAN RULES</p><h2 id="brief-game">{titles[game]}</h2></div>
   <button type="button" className="brief-back" onClick={close}>Back to setup</button>
  </div>
  <div className="brief-body">
   <div className="brief-stage">
    <div className="brief-seat-ring" aria-label="Player seating">
     <Diagram game={game} phase={step}/>
     {seats.map((s,i)=>{
      const angle=(i/Math.max(1,seats.length))*Math.PI*2+Math.PI/2
      return <span key={s.id} role="img" aria-label={'Seat '+(i+1)+': '+s.name+(s.bot?', bot':'')} title={s.name} data-brief-seat={s.bot?'bot':'human'} style={{'--x':50+Math.cos(angle)*42+'%','--y':50+Math.sin(angle)*39+'%','--delay':i*24+'ms'} as CSSProperties}><i aria-hidden="true"/><b aria-hidden="true">{i+1}</b></span>
     })}
    </div>
    <div className="brief-count"><strong>{seats.length} at the table</strong><span>{seatText(seats.length-bots,'human')} · {seatText(bots,'bot')}</span></div>
   </div>
   <div className="brief-lesson"><p>{caption}</p><ol>{rules.map((rule,i)=><li key={i}><button type="button" aria-pressed={step===i} onClick={()=>setStep(i)}><span aria-hidden="true">{String(i+1).padStart(2,'0')}</span>{rule}</button></li>)}</ol></div>
  </div>
  <footer><span>Any match timer starts after you enter.</span><button className="primary" type="button" disabled={!canStart} onClick={confirm}>Enter match <span aria-hidden="true">↗</span></button></footer>
 </dialog>
}
