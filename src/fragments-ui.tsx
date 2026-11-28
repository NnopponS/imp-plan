import {useEffect,useId,useState} from 'react'
import {fragmentColors,fragmentNeed,type Gallery,type GalleryObject} from './fragments'
import {artifactArt,artifactTones} from './fragments-art'
import type {Snapshot} from './room'
import './fragments.css'

const shelfNames=['Top','Middle','Bottom'] as const
const columns=[72,180,288]
const clockPoint=(angle:number,r:number)=>[310+Math.sin(angle)*r,26-Math.cos(angle)*r]

function ExhibitClock({scene}:{scene:Gallery}){
 const [hx,hy]=clockPoint((scene.hour+scene.minute/60)*Math.PI/6,10)
 const [mx,my]=clockPoint(scene.minute*Math.PI/30,13)
 return <g>
  <circle cx="310" cy="26" r="19" fill="#e0bc7d" stroke="#251711" strokeWidth="2"/>
  <circle cx="310" cy="26" r="15.6" fill="#f2d9a8" stroke="#805231"/>
  {Array.from({length:12},(_,i)=>{
   const [x1,y1]=clockPoint(i*Math.PI/6,i%3===0?11.5:13),[x2,y2]=clockPoint(i*Math.PI/6,14)
   return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#533624" strokeWidth={i%3===0?1.15:.7}/>
  })}
  <path d={`M310 26 ${hx} ${hy}`} stroke="#372516" strokeWidth="2.8" strokeLinecap="round"/>
  <path d={`M310 26 ${mx} ${my}`} stroke="#86452e" strokeWidth="1.6" strokeLinecap="round"/>
  <circle cx="310" cy="26" r="2" fill="#382619"/>
  <rect x="283" y="42" width="54" height="15" rx="4" fill="#ecd4a3" stroke="#624027"/>
  <text className="cabinet-time" x="310" y="54" textAnchor="middle">{scene.time}</text>
 </g>
}

function Artifact({item,tone,id,x}:{item:GalleryObject['item'],tone:number,id:string,x:number}){
 const color=`url(#${id}-tone-${tone})`
 return <g transform={`translate(${x} 0)`}>
  <ellipse cx="1" cy="54" rx="34" ry="4" fill="#1b100e" opacity=".72"/>
  <ellipse cx="-3" cy="53" rx="23" ry="1.7" fill="#9e7350" opacity=".65"/>
  <g className="cabinet-artifact" transform="translate(0 28)" fill={color} stroke="#241611" strokeWidth="1.25" strokeLinejoin="round">
   {artifactArt[item]}
  </g>
  <g className="cabinet-plaque">
   <rect x="-44" y="57" width="88" height="27" rx="4" fill="#ecd4a5" stroke="#6b422a"/>
   <path d="M-39 59h78" stroke="#fff0c7" opacity=".8"/>
   <circle cx="-39" cy="68" r="1.4" fill="#85603f"/><circle cx="39" cy="68" r="1.4" fill="#85603f"/>
   <text y="69" textAnchor="middle">{item}</text>
   <text y="81" textAnchor="middle">{fragmentColors[tone]}</text>
  </g>
 </g>
}

function GalleryScene({scene,preview}:{scene:Gallery,preview:boolean}){
 const id=useId()
 return <figure className="gallery-scene" aria-label="Study exhibit">
  <svg viewBox="0 0 360 324" role="img" aria-label="Museum shelf exhibit">
   <defs>
    <linearGradient id={id+'-wood'} x2="1" y2="1"><stop stopColor="#9b6c43"/><stop offset=".41" stopColor="#65432e"/><stop offset="1" stopColor="#493129"/></linearGradient>
    <linearGradient id={id+'-bay'} x2="0" y2="1"><stop stopColor="#302321"/><stop offset=".72" stopColor="#594134"/><stop offset="1" stopColor="#75543a"/></linearGradient>
    <linearGradient id={id+'-rail'} x2="0" y2="1"><stop stopColor="#bd9056"/><stop offset=".36" stopColor="#976a41"/><stop offset="1" stopColor="#583722"/></linearGradient>
    <pattern id={id+'-grain'} width="50" height="11" patternUnits="userSpaceOnUse"><path d="M0 1q8-2 17 0t20 1l13-1M4 5q13-2 27 0t16 0M1 9q18-2 24 0t25 0" fill="none" stroke="#f6cca0" opacity=".12" strokeWidth=".57"/></pattern>
    {artifactTones.map(([shine,body,shadow],i)=><linearGradient key={i} id={id+'-tone-'+i} x2=".72" y2="1">
     <stop stopColor={shine}/><stop offset=".48" stopColor={body}/><stop offset="1" stopColor={shadow}/>
    </linearGradient>)}
   </defs>
   <rect x="1" y="1" width="358" height="322" rx="18" fill={`url(#${id}-wood)`} stroke="#251a16" strokeWidth="2"/>
   <rect x="8" y="8" width="344" height="308" rx="12" fill={`url(#${id}-grain)`} stroke="#d2a879" strokeOpacity=".7"/>
   <path d="M16 47V24q0-8 8-8h18m276 0h18q8 0 8 8v23M16 282v24l4 4h20m304-28v24l-4 4h-20" fill="none" stroke="#d9ad73" strokeOpacity=".62"/>
   <path d="m180 19 5 5-5 5-5-5Zm-8 5h-35m51 0h35" fill="none" stroke="#d5ae7d" strokeOpacity=".76"/>
   <text className="cabinet-eyebrow" x="32" y="25">EXHIBIT LABEL</text>
   <text className="cabinet-word" x="31" y="47">{scene.word}</text>

   {shelfNames.map((name,i)=><g key={name} className="cabinet-shelf" transform={`translate(0 ${58+i*85})`}>
    <rect x="22" y="0" width="316" height="85" rx={i===0?7:0} fill={`url(#${id}-bay)`} stroke="#260f0e"/>
    <path d="M25 8h310v44H25Z" fill={`url(#${id}-grain)`}/>
    <path d="M127 0h6l3 52-8 6-4-6Zm101 0h6l2 52-5 6-8-6Z" fill={`url(#${id}-rail)`} stroke="#40271d"/>
    <path d="M27 48h306l7 9H20Z" fill="#7e5739" stroke="#39261d"/>
    <path d="M34 52h74m40 0h64m40 0h74" stroke="#b4835a" opacity=".6"/>
    <path d="M20 57h320v27H20Z" fill={`url(#${id}-wood)`} stroke="#322019"/>
    <path d="M20 78h320v6H20Z" fill={`url(#${id}-rail)`}/>
    <path d="M20 84h320" stroke="#39231a" strokeWidth="1.7"/>
    {scene.objects.slice(i*3,i*3+3).map((item,j)=><Artifact key={item.item} {...item} id={id} x={columns[j]}/>)}
   </g>)}

   <path d="M18 67v235m324-235v235" stroke="#c49a65" strokeOpacity=".8" strokeWidth="2"/>
   <path d="M40 316h280" stroke="#261812" opacity=".6"/>
   <ExhibitClock scene={scene}/>
  </svg>
  {!preview&&<details><summary>Text version of exhibit</summary><p>Label: {scene.word}. Clock: {scene.time}.</p><ol>{shelfNames.map((name,r)=><li key={name}>{name} shelf, left to right: {scene.objects.slice(r*3,r*3+3).map(o=>fragmentColors[o.tone]+' '+o.item.toLowerCase()).join(', ')}.</li>)}</ol></details>}
 </figure>
}
export function FragmentsBoard({snap,active,preview=false,receivedAt,name,submit}:{snap:Snapshot,active:boolean,preview?:boolean,receivedAt?:number,name:(id:string)=>string,submit:(i:number)=>void}){
 const g=snap.game!, f=g.fragments!
 const [mountedAt]=useState(()=>performance.now())
 const [,redraw]=useState(0)
 const deadline=(g.deadline??snap.hostNow)-snap.hostNow+(receivedAt??mountedAt)
 const remaining=deadline-performance.now()
 useEffect(()=>{
  if(preview||g.done)return
  const refresh=()=>redraw(n=>n+1)
  const id=setInterval(refresh,240)
  const conceal=f.scene?setTimeout(refresh,Math.max(0,Math.ceil(deadline-performance.now()))):undefined
  return()=>{clearInterval(id);clearTimeout(conceal)}
 },[preview,g.done,deadline,f.scene])
 const time=Math.max(0,Math.min(f.scene?45:20,Math.ceil(remaining/1000)))
 const scene=preview||time>0?f.scene:null
 const myTurn=active&&g.turn===snap.you&&time>0
 const need=fragmentNeed(f.strict,f.total)
 return <div className="fragments-game">
  {!preview&&<div className="auction-top"><strong>{scene?'Study the exhibit':g.done?'Final team score':f.question?`Question ${g.round} / ${f.total}`:'Exhibit closed'}</strong>{!g.done&&<span className="pill" aria-label="Time remaining">{time} s</span>}</div>}
  {scene&&<>{!preview&&<p>Remember shelf positions, colors, the label and the clock.</p>}<GalleryScene scene={scene} preview={preview}/></>}
  {!scene&&<p className="fragments-score">Team: <strong>{f.correct} / {f.total}</strong> · {need} needed</p>}
  {f.last!==null&&!g.done&&<p role="status">{f.last?'Last answer: correct.':'Last question: no point.'}</p>}
  {f.question&&<section aria-label="Recall question"><p className="eyebrow">{g.turn===snap.you?'YOUR TURN':name(g.turn)+'’S TURN'}</p><h3>{f.question.prompt}</h3><div className="fragments-answers">{f.question.options.map((o,i)=><button type="button" key={i} disabled={!myTurn} onClick={()=>submit(i)}>{o}</button>)}</div></section>}
  {g.done&&<p role="status">{f.passed?'The team remembered enough to clear the exhibit.':'The team did not reach the target.'}</p>}
 </div>
}
