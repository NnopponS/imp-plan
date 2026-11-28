import {useId} from 'react'
import {unknownAct,unknownSize,unknownStart,unknownView,type UnknownView,type CubeFaces} from './unknown'
import './unknown.css'

const palettes={
 red:['#a64e45','#713631','#d18867'],gold:['#b99549','#80612b','#e8c375'],blue:['#486b7a','#2d4653','#84a6aa'],
 green:['#54705a','#344c3e','#97a67d'],violet:['#6e536f','#4b394f','#ad86a6'],white:['#e7d7ad','#baaa86','#fff3cb'],
 start:['#676258','#47433b','#aaa08b'],goal:['#252e2d','#161d1e','#bd9550'],
}
const symbols={
 red:'M30 11C21 20 34 20 24 32c-5-6-7-11-2-16-12 8-11 21 1 23 11 1 16-8 7-17m-5 18v4',
 gold:'M24 10v31m-14-16h28M14 15l21 21m0-21L14 36m10-17 6 6-6 6-6-6z',
 blue:'M10 20c5-7 10 7 15 0s10-7 15 0M10 27c5-7 10 7 15 0s10-7 15 0M10 34c5-7 10 7 15 0s10-7 15 0',
 green:'M25 11c-9 7-14 14-8 21 6 7 16 1 17-8 0-5-4-10-9-13zm-1 28 2-18m-8 6 7 2m6-5-5 3',
 violet:'M24 11c-4 7 0 15 9 16l8-2c-4 12-15 16-23 10-9-7-6-20 6-24zm9 1v9m-4-4h9',
 white:'M11 25l13-13 13 13-13 13zm6 0 7-7 7 7-7 7z',
 start:'M12 22h26m-24 5h22m-17 5h12m-9 5h6m-9-21h12',
 goal:'M24 5 42 24 24 43 6 24zm0 8 11 11-11 11-11-11zm0 6v10m-5-5h10',
} as const
export const tileNames={red:'Cinder',gold:'Sun',blue:'Tide',green:'Leaf',violet:'Moon',white:'Ivory',start:'Starting socket',goal:'Center seal',wall:'Wall'} as const
const step=54
const margin=21
const center=(cell:number)=>[margin+step*(cell%unknownSize+.5),margin+step*(Math.floor(cell/unknownSize)+.5)]
function CubeArt({faces,serial}:{faces:CubeFaces;serial:number}){
 const face=palettes[faces[0]],south=palettes[faces[3]],east=palettes[faces[4]]
 return <>
  <ellipse cx="2" cy="14" rx="20" ry="9" fill="#16140d" opacity=".58"/>
  <path d="M-17-8-2-2v19l-14-7zm15 6 19-7v17L-2 17Z" fill={south[1]} stroke="#231a13" strokeWidth="1.25"/>
  <path d="M-2-2 17-9v17L-2 17Z" fill={east[1]} stroke="#231a13" strokeWidth="1.25"/>
  <path d="M-17-8-1-17 17-9-2-1Z" fill={face[0]} stroke="#f2c68b" strokeWidth="1.15"/>
  <path d="m-15-7 13 6m4-1 12-6m-28 4v10m18-2 9-4m-10 8 10-5" fill="none" stroke="#fff0c2" strokeOpacity=".4" strokeWidth=".65"/>
  <path d={symbols[faces[0]]} transform="translate(-7 -16) scale(.31 .29)" fill="none" stroke="#fff2ce" strokeWidth="2.2" strokeLinecap="round"/>
  <text x="6" y="9" textAnchor="middle" fill="#fff2ce" fontSize="9" fontFamily="system-ui" fontWeight="700">{serial}</text>
 </>
}
export function UnknownMosaic({board,cubes,trace,nested=false}:{nested?:boolean;board:UnknownView['board'];cubes:UnknownView['cubes'];trace?:UnknownView['trace'][number]}){
 const grain=useId()
 const latest=trace?.to!==null?trace:undefined
 return <svg viewBox="0 0 420 420" className="unknown-mosaic" style={nested?{inlineSize:420,blockSize:420}:undefined} role="img" aria-label="Engraved mosaic with colored cube counters and a central seal" data-unknown-mosaic="">
  <defs><pattern id={grain} width="10" height="13" patternUnits="userSpaceOnUse"><path d="M1 1h2m2 4h1m-4 6h3m3-2h1" stroke="#e4c48c" strokeOpacity=".12" strokeWidth=".6" strokeLinecap="round"/></pattern></defs>
  <path d="M17 4H403l13 13v386l-13 13H17L4 403V17Z" fill="#30231b" stroke="#8c603b" strokeWidth="2"/>
  <path d="M20 9h380l11 11v380l-11 11H20L9 400V20Z" fill="none" stroke="#b58950" strokeWidth="1"/>
  <path d="M19 15h382m4 4v383m-4 3H19m-4-5V20" fill="none" stroke="#a17146" strokeOpacity=".76" strokeDasharray="1 4" strokeLinecap="round"/>
  <path d="M20 16h380l5 5v378l-5 5H20l-5-5V21Z" fill={`url(#${grain})`}/>
  {board.map((tile,i)=>{
   const [x,y]=center(i)
   if(tile==='wall')return <path key={i} d="M27 14c8 9 8 17 0 26-8-9-8-17 0-26zM14 27c9-8 17-8 26 0-9 8-17 8-26 0z" transform={`translate(${x-27} ${y-27})`} stroke="#b78d55" strokeOpacity=".4" fill="none" strokeWidth=".8"/>
   const [base,shadow,rim]=palettes[tile]
   return <g key={i} transform={`translate(${x-25} ${y-25})`} data-unknown-tile={tile}>
    <path d="M4 0h42l4 4v42l-4 4H4l-4-4V4Z" fill={shadow} stroke="#231b15" strokeWidth="1"/>
    <path d="M4 1h41l3 3v39l-3 4H4l-3-4V4Z" fill={base} stroke={rim} strokeOpacity=".85" strokeWidth="1"/>
    <path d="M5 45h41M2 43l3 2m37-43 4 3" fill="none" stroke={shadow} strokeWidth="1.1"/>
    <path d="M6 4h9m-11 4v5m41 25v6m-2 0h-6m-30-5c3 3 9 3 13 2m12-36 10 1" fill="none" stroke={rim} strokeOpacity=".72" strokeWidth=".6"/>
    <path d="M2 2h45v44H3z" fill={`url(#${grain})`}/>
    <path d={symbols[tile]} fill="none" stroke={tile==='white'?shadow:rim} strokeOpacity={tile==='goal'?1:.74} strokeWidth={tile==='goal'?1.6:.9} strokeLinejoin="round" strokeLinecap="round"/>
   </g>
  })}
  {latest&&<g className="unknown-route" aria-hidden="true">
   <path d={`M${center(latest.from).join(' ')}L${center(latest.to).join(' ')}`} stroke="#fff1ba" strokeWidth="3" strokeLinecap="round" strokeDasharray="1 6"/>
   {latest.pushed&&<path d={`M${center(latest.to).join(' ')}L${center(latest.pushed.to).join(' ')}`} stroke="#ffbc78" strokeWidth="3" strokeLinecap="round" strokeDasharray="2 5"/>}
  </g>}
  {cubes.map((c,i)=>{
   const [x,y]=center(c.cell)
   return <g transform={`translate(${x} ${y})`} key={c.seat} data-unknown-cube={i+1} data-cell={c.cell} data-face={c.faces[0]}>
    <g key={c.cell+':'+c.faces[0]} className={latest&&(latest.seat===c.seat||latest.pushed?.seat===c.seat)?'unknown-tumble':undefined}><CubeArt faces={c.faces} serial={i+1}/></g>
   </g>
  })}
 </svg>
}
export function UnknownCubePreview({faces,serial}:{faces:CubeFaces;serial:number}){
 return <svg viewBox="-24 -24 48 48" className="unknown-cube-preview" aria-hidden="true"><CubeArt faces={faces} serial={serial}/></svg>
}
const origin=unknownStart(['sample-a','sample-b'],17,0,25000,()=>0)
const field=unknownStart(['sample-a','sample-b'],17,0,25000,()=>0)
const neighbors={...field,cubes:field.cubes.map((c,i)=>({...c,cell:i===0?16:17}))}
const final={...field,cubes:field.cubes.map((c,i)=>({...c,cell:i===0?23:25}))}
const lessons=[
 origin,
 unknownAct(origin,'sample-a','south',1)??origin,
 unknownAct(neighbors,'sample-a','east',1)??neighbors,
 unknownAct(final,'sample-a','east',1)??final,
].map(s=>unknownView(s,'sample-a'))
export function UnknownLesson({step}:{step:number}){
 const stage=lessons[Math.min(Math.max(step,0),lessons.length-1)]
 return <div className="unknown-lesson" data-unknown-lesson={step}>
  <UnknownMosaic board={stage.board} cubes={stage.cubes} trace={stage.trace.at(-1)}/>
 </div>
}

export function UnknownWorkedScene(){
 const stage=lessons[2]
 return <g transform="translate(69 31) scale(.145)"><UnknownMosaic nested board={stage.board} cubes={stage.cubes} trace={stage.trace.at(-1)}/></g>
}
