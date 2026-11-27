import {useEffect,useId,useState,type CSSProperties} from 'react'
import {base} from './brand'
import {hexCells,hexLines,puzzle} from './puzzles'

// The example is a separate, deterministic board. It never reads or starts a match.
const {values,target}=puzzle('hex',79,1)
const hits=hexLines().filter(path=>path.reduce((sum,i)=>sum+values[i],0)===target)
const line=hits.find(path=>path[0]===8)||hits[0]
const glyphs='ABCDEFGHIJKLMNOPQRS'
const letters=line.map(i=>glyphs[i]).join(', ')
const total=line.map(i=>values[i]).join(' + ')+' = '+target
const points=hexCells.map(({q,r})=>[95+(q+r/2)*34,78+r*29])
const studyRows=Array.from({length:5},(_,row)=>'row '+(row+1)+': '+hexCells.flatMap((cell,i)=>cell.r===row-2?[values[i]]:[]).join(', ')).join('; ')
const trace=line.map(i=>points[i].join(',')).join(' ')
const frames=[
 {key:'study',name:'Memorize',description:'Study the numbers for 30 seconds in the real round.',accessible:'Memorize these numbers. '+studyRows},
 {key:'veil',name:'Veil',description:'Letters replace the numbers. The target appears.',accessible:'Numbers hidden. Use their positions to remember them. Target '+target},
 {key:'line',name:'Choose line',description:'Pick three adjacent tiles in one straight line.',accessible:'Tiles '+letters+' form a straight line. '+total},
] as const

function HexBoard({step}:{step:number}){
 const frame=frames[step]
 const gradient=useId()
 return <svg className="hex-brief-board" viewBox="0 0 190 156" role="img" aria-label={'Hexagon example: '+frame.accessible}>
  <defs><linearGradient id={gradient} x1="0" x2="0" y1="0" y2="1" gradientUnits="objectBoundingBox">
   <stop stopColor="#efce8d"/><stop offset="1" stopColor="#b88850"/>
  </linearGradient></defs>
  <path className="hex-board-border" d="M64 4h62l61 71v6l-61 71H64L3 81v-6z"/>
  <path className="hex-board-inset" d="M67 8h56l58 70-58 70H67L9 78z"/>
  {points.map(([x,y],i)=><g key={i} transform={`translate(${x} ${y})`} data-hex-cell={i} style={{'--plate':`url(#${gradient})`} as CSSProperties} data-hex-pick={step===2&&line.includes(i)?'':undefined}>
   <path d="m0-17 14.7 8.5v17L0 17l-14.7-8.5v-17z"/>
   <path d="m0-14 12.1 7v14L0 14l-12.1-7V-7z"/>
   <text key={frame.key} textAnchor="middle" y="4.3">{step===0?values[i]:glyphs[i]}</text>
  </g>)}
  {step===2&&<polyline className="hex-board-trace" points={trace} pathLength="1" aria-hidden="true"/>}
 </svg>
}

export function HexBriefing({motionOff}:{motionOff:boolean}){
 const [step,setStep]=useState(0)
 const [cycle,setCycle]=useState(0)
 const [playing,setPlaying]=useState(true)
 const running=playing&&!motionOff
 useEffect(()=>{
  if(!running)return
  const veil=window.setTimeout(()=>setStep(1),3000)
  const finish=window.setTimeout(()=>{setStep(2);setPlaying(false)},4500)
  return ()=>{window.clearTimeout(veil);window.clearTimeout(finish)}
 },[cycle,running])
 const frame=frames[step]
 return <section className="hex-brief-film" aria-label="Hexagon rule example">
  <div className="hex-brief-shot" data-hex-step={frame.key} data-demo-playing={running||undefined}>
   <img src={base+'art/hex-live-landscape.webp'} className="hex-shot-art" width={1400} height={780} alt=""/>
   <div className="hex-brief-slate">
    <span>Worked example</span>
    <strong>{step===0?<>30 <small>SEC</small></>:<b data-testid="hex-example-target">{target}</b>}</strong>
    <span>{step===0?'Study window':'Target sum'}</span>
    <span className="hex-brief-proof">{step===2?total:step===1?'Numbers hidden':'Numbers visible'}</span>
   </div>
   <HexBoard step={step}/>
  </div>
  <div className="hex-brief-guide">
    <div className="hex-brief-controls">
     <div className="hex-brief-frames" role="group" aria-label="Example steps">
      {frames.map((f,i)=><button key={f.key} type="button" aria-pressed={step===i} onClick={()=>{setPlaying(false);setStep(i)}}><span aria-hidden="true">0{i+1}</span>{f.name}</button>)}
     </div>
     {!motionOff&&<button type="button" className="hex-brief-replay" aria-label={running?'Pause example':'Replay example'} title={running?'Pause example':'Replay example'} onClick={()=>{if(running)setPlaying(false);else {setStep(0);setCycle(v=>v+1);setPlaying(true)}}}>
      <svg width="19" height="19" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d={running?'M7 5v10m6-10v10':'M16 10a6 6 0 1 1-2-4.5L17 8m0-4v4h-4'} stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>
     </button>}
    </div>
    <p className="hex-brief-description" aria-live={running?'off':'polite'}>{frame.description}</p>
    <p className="hex-brief-rules">Correct line: +1 point. New board after 4 of 8 targets.</p>
  </div>
 </section>
}
