import {useEffect,useState} from 'react'
import {describeSpecimen,regionBox,regionName,type Specimen} from './spot'
import type {Snapshot} from './room'
import './spot.css'

const ink=['#9b422e','#14685f','#234b6b','#754568']
const forms=[
 'M0-20 5-9 15-14 13-3 23 0 13 4 15 14 5 10 0 21-5 10-15 14-13 4-23 0-13-3-15-14-5-9Z',
 'M8-20A20 20 0 1 0 17 11 18 18 0 0 1 8-20Z',
 'M0-22 18 0 0 22-18 0Z',
 'M-6-19H6V-6H19V6H6V19H-6V6H-19V-6H-6Z',
 'M-20-14-8-5 0-17 8-5 20-14 15 13H-15Z'
]
function Tray({cells,marks,select,enabled,label}:{cells:Specimen[],marks:Map<number,boolean>,select:(i:number)=>void,enabled:boolean,label:string}){
 return <figure className="spot-tray"><figcaption>{label}</figcaption><div className="spot-picture">
  <svg viewBox="0 0 288 216" aria-hidden="true">
   <rect width="288" height="216" fill="#493d31"/>
   {cells.map((v,i)=>{
    const [x,y,w,h]=regionBox(i),marked=marks.get(i)
    return <g key={i}><rect x={x} y={y} width={w} height={h} rx="6" fill="#f9eace" stroke="#bfa477"/>
     <circle cx={x+32} cy={y+32} r="24" stroke="#cfb78d" strokeDasharray="1 3" fill="none"/>
     <text x={x+4} y={y+11} fill="#584836" fontSize="8">{regionName(i)}</text>
     {v.shown&&<g transform={`translate(${x+32+[0,-7,7][v.shift]} ${y+33}) scale(${[.78,.54,1][v.scale]})`}>
      <path d={forms[v.shape]} fill={ink[v.ink]} stroke="#302928" strokeWidth="1"/>
      <path d="M-7 5H7M-4 1H4 M-3-3H3" stroke="#fff0cd" strokeWidth="1.6" strokeLinecap="round" strokeDasharray={['','2 2','5 2','1 2'][v.ink]}/>
     </g>}
     {marked!==undefined&&<><rect x={x+1} y={y+1} width={w-2} height={h-2} rx="6" stroke={marked?'#126150':'#a23823'} strokeWidth="3" fill="none"/>
      <text x={x+53} y={y+57} fontSize="14" fontWeight="bold" textAnchor="middle" fill={marked?'#126150':'#9b3924'}>{marked?'✓':'×'}</text></>}
    </g>
   })}
  </svg>
  {cells.map((_,i)=>{
   const [x,y,w,h]=regionBox(i)
   return <button key={i} type="button" data-region={regionName(i)} className="spot-area" tabIndex={-1} aria-hidden="true" disabled={!enabled||marks.has(i)} onClick={()=>select(i)}
    style={{left:x/288*100+'%',top:y/216*100+'%',width:w/288*100+'%',height:h/216*100+'%'}}/>
  })}
 </div></figure>
}
export function SpotBoard({snap,active,name,submit}:{snap:Snapshot,active:boolean,name:(id:string)=>string,submit:(a:number)=>void}){
 const g=snap.game!,p=g.spot!
 const [zoom,setZoom]=useState(false),[now,setNow]=useState(Date.now),[offset,setOffset]=useState(()=>snap.hostNow-Date.now())
 useEffect(()=>{const id=setInterval(()=>setNow(Date.now()),150);return()=>clearInterval(id)},[])
 useEffect(()=>{setNow(Date.now());setOffset(snap.hostNow-Date.now())},[snap.hostNow])
 const remaining=Math.max(0,Math.min(90,Math.ceil(((g.deadline??now)-p.penalty-now-offset)/1000)))
 const marks=new Map(p.marks.map(m=>[m.region,m.correct]))
 const enabled=active&&g.seats.includes(snap.you)&&!g.done&&remaining>0&&p.score<p.target
 const last=p.marks.at(-1)
 const results=Object.entries(p.results??{}).sort((a,b)=>b[1][0]-a[1][0]||a[1][1]-b[1][1])
 return <section className="spot-game" aria-label="Spot the Difference">
  <div className="auction-top"><strong>{p.score} / {p.target} found</strong><span className="pill" aria-label="Time remaining">{g.done?'Finished':remaining+' s'}</span></div>
  <div className="spot-tools"><span>Penalty: +{p.penalty/1000} s</span><button type="button" aria-pressed={zoom} onClick={()=>setZoom(v=>!v)}>{zoom?'Fit both trays':'Zoom trays'}</button></div>
  <p role="status">{g.done?'Solution shown on both trays.':p.score===p.target?'All differences found. Waiting for the table.':!remaining?'Time is up for your seat.':last?regionName(last.region)+(last.correct?' marked correctly.':' is unchanged. Five seconds deducted.'):'Select a changed region on either tray.'}</p>
  <div className={'spot-pan'+(zoom?' spot-zoom':'')}><div className="spot-spread">
   <Tray label="Tray I · Reference" cells={p.left} marks={marks} select={submit} enabled={enabled}/>
   <Tray label="Tray II · Comparison" cells={p.right} marks={marks} select={submit} enabled={enabled}/>
  </div></div>
  <details className="spot-compare"><summary>Compare by region (text and keyboard)</summary><div className="spot-list">
   {p.left.map((v,i)=><div key={i}><div><strong>{regionName(i)}</strong><span>Tray I: {describeSpecimen(v)}</span><span>Tray II: {describeSpecimen(p.right[i])}</span></div>
    <button type="button" disabled={!enabled||marks.has(i)} onClick={()=>submit(i)}>{marks.has(i)?(marks.get(i)?'Found ':'Unchanged '):'Mark '}{regionName(i)}</button></div>)}
  </div></details>
  {g.done&&<ol className="spot-results">{results.map(([id,[count,ms]])=><li key={id}><strong>{name(id)}</strong><span>{count} found · {(ms/1000).toFixed(2)} s adjusted</span></li>)}</ol>}
 </section>
}
