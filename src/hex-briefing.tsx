import {useId,type CSSProperties} from 'react'
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

export function HexLesson({step}:{step:number}){
 const frame=frames[step]
 return <section className="hex-brief-film" aria-label="Hexagon rule example">
  <div className="hex-brief-shot" data-hex-step={frame.key}>
   <img src={base+'art/hex-live-landscape.webp'} className="hex-shot-art" width={1400} height={780} alt=""/>
   <div className="hex-brief-slate">
    <span>{step===0?'Study window':'Target sum'}</span>
    <strong>{step===0?<>30 <small>SEC</small></>:<b data-testid="hex-example-target">{target}</b>}</strong>
    {step===2&&<span className="hex-brief-proof">{total}</span>}
   </div>
   <HexBoard step={step}/>
  </div>
 </section>
}
