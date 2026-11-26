import {useEffect,useState} from 'react'
import {fragmentColors,fragmentNeed,type Gallery,type GalleryObject} from './fragments'
import type {Snapshot} from './room'
import './fragments.css'

const pigments=['#3e746b','#a36321','#765276','#a23d40']
const forms:Record<GalleryObject['item'],string>={
 Vase:'M-11-20 H11 L8-13 C8-6 22-5 20 10 Q18 23 0 23 Q-18 23-20 10 C-22-5-8-6-8-13 Z',
 Key:'M-16-12 A10 10 0 1 0-4 1 L15 19 L21 12 L15 6 L10 10 L-1-2 A10 10 0 0 0-16-12 Z',
 Gem:'M-24-9-14-19 H14 L24-9 0 22 Z',
 Cup:'M-19-12 H19 V-7 H25 Q30 6 15 10 Q10 22 0 22 Q-19 22-19 3 Z',
 Crown:'M-24-17-13-5 0-21 13-5 24-17 18 16 H-18 Z',
 Bell:'M-22 13 Q-16 8-16-2 Q-16-17-5-18 Q-5-26 0-26 Q5-26 5-18 Q16-17 16-2 Q16 8 22 13 Z M-6 16 Q0 27 6 16 Z',
 Leaf:'M-19 15 Q-25-16 23-21 Q27 14 0 19 L-12 19-19 24-24 21 Z',
 Compass:'M0-24 A24 24 0 1 0 0 24 A24 24 0 1 0 0-24 Z M6-12-14 14 9 7 Z',
 Lantern:'M-12-23 H12 V-15 L19-8 V19 H-19 V-8 L-12-15 Z M-10-6 V11 H10 V-6 Z'
}
const hand=(angle:number,length:number)=>[304+Math.sin(angle)*length,37-Math.cos(angle)*length]
function GalleryScene({scene}:{scene:Gallery}){
 const [hx,hy]=hand((scene.hour+scene.minute/60)*Math.PI/6,9),[mx,my]=hand(scene.minute*Math.PI/30,13)
 return <figure className="gallery-scene" aria-label="Study exhibit">
  <svg viewBox="0 0 340 328" role="img" aria-label="Museum shelf exhibit">
   <rect width="340" height="328" rx="12" fill="#eee2cd"/>
   <rect x="9" y="9" width="322" height="309" rx="7" fill="#f9f2e3" stroke="#ac916d"/>
   <text x="23" y="34" fontSize="10" letterSpacing="1.5" fill="#553e32">COLLECTION / FIELD NOTES</text>
   <text x="23" y="55" fontSize="17" fontWeight="700" letterSpacing="2.2" fill="#63312e">{scene.word}</text>
   <circle cx="304" cy="37" r="18" stroke="#886e49" fill="#f4ead6"/>
   {[0,1,2,3].map(i=>{const [x1,y1]=hand(i*Math.PI/2,14),[x2,y2]=hand(i*Math.PI/2,16);return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#886e49"/>})}
   <line x1="304" y1="37" x2={hx} y2={hy} stroke="#56362c" strokeWidth="2.7" strokeLinecap="round"/>
   <line x1="304" y1="37" x2={mx} y2={my} stroke="#56362c" strokeWidth="1.3" strokeLinecap="round"/>
   <text x="304" y="67" fontSize="9" textAnchor="middle" fill="#56362c">{scene.time}</text>
   {scene.objects.map(({item,tone},i)=>{
    const x=68+i%3*102,y=102+Math.floor(i/3)*80
    return <g key={item} transform={`translate(${x} ${y})`}><ellipse cx="0" cy="23" rx="27" ry="4" fill="#d7c5a8"/><path d={forms[item]} fill={pigments[tone]} fillRule="evenodd" stroke="#45342b" strokeWidth="1.2" strokeLinejoin="round"/>
    <text y="38" fontSize="12" textAnchor="middle" fontWeight="700" fill="#50372f">{item}</text><text y="50" fontSize="9" textAnchor="middle" fill="#50372f">{fragmentColors[tone]}</text><path d="M-43 55 H43" stroke="#aa926f"/></g>
   })}
  </svg>
  <details><summary>Text version of exhibit</summary><p>Label: {scene.word}. Clock: {scene.time}.</p><ol>{[0,1,2].map(r=><li key={r}>{['Top','Middle','Bottom'][r]} shelf, left to right: {scene.objects.slice(r*3,r*3+3).map(o=>fragmentColors[o.tone]+' '+o.item.toLowerCase()).join(', ')}.</li>)}</ol></details>
 </figure>
}
export function FragmentsBoard({snap,active,name,submit}:{snap:Snapshot,active:boolean,name:(id:string)=>string,submit:(i:number)=>void}){
 const g=snap.game!, f=g.fragments!
 const [now,setNow]=useState(Date.now),[offset,setOffset]=useState(()=>snap.hostNow-Date.now())
 useEffect(()=>{const id=setInterval(()=>setNow(Date.now()),240);return()=>clearInterval(id)},[])
 useEffect(()=>setOffset(snap.hostNow-Date.now()),[snap.hostNow])
 const time=Math.max(0,Math.min(f.scene?45:20,Math.ceil(((g.deadline??now)-now-offset)/1000)))
 const myTurn=active&&g.turn===snap.you&&time>0
 const need=fragmentNeed(f.strict,f.total)
 return <div className="fragments-game">
  <div className="auction-top"><strong>{f.scene?'Study the exhibit':g.done?'Final team score':`Question ${g.round} / ${f.total}`}</strong>{!g.done&&<span className="pill" aria-label="Time remaining">{time} s</span>}</div>
  {f.scene&&<><p>Remember shelf positions, colors, the label and the clock. The exhibit will disappear when time is up.</p><GalleryScene scene={f.scene}/></>}
  {!f.scene&&<p className="fragments-score">Team: <strong>{f.correct} / {f.total}</strong> · {need} needed</p>}
  {f.last!==null&&!g.done&&<p role="status">{f.last?'Last answer: correct.':'Last question: no point.'}</p>}
  {f.question&&<section aria-label="Recall question"><p className="eyebrow">{g.turn===snap.you?'YOUR TURN':name(g.turn)+'’S TURN'}</p><h3>{f.question.prompt}</h3><div className="fragments-answers">{f.question.options.map((o,i)=><button type="button" key={i} disabled={!myTurn} onClick={()=>submit(i)}>{o}</button>)}</div></section>}
  {g.done&&<p role="status">{f.passed?'The team remembered enough to clear the exhibit.':'The team did not reach the target.'}</p>}
 </div>
}
