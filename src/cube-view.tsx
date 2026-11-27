import {useState} from 'react'
import {InstrumentPicker} from './instrument-picker'
type Point=[number,number]

function LevelFace({level}:{level:number}){
 return <span className="cube-level-face" aria-hidden="true"><svg viewBox="0 1 28 30" focusable="false">
  {Array.from({length:level},(_,i)=>{
   const y=22-5*i
   return <path key={i} d={`M4 ${y}l9-4 9 4v3l-9 4-9-4zM4 ${y}l9 4 9-4m-9 4v3`}/>
  })}
 </svg><span>{level}</span></span>
}
const levels=[1,2,3,4].map(value=>({value,label:'Layer '+value,face:<LevelFace level={value}/>}))
export function CubeView({heights,side}:{heights:number[],side:number}){
 const [angle,setAngle]=useState(0)
 const [layer,setLayer]=useState(1)
 const rotated=(x:number,y:number):Point=>angle===1?[side-1-y,x]:angle===2?[side-1-x,side-1-y]:[x,y]
 const voxels=heights.flatMap((h,i)=>{
  const [x,y]=rotated(i%side,Math.floor(i/side))
  return Array.from({length:h},(_,z)=>({x,y,z}))
 }).sort((a,b)=>a.x+a.y+a.z-b.x-b.y-b.z||a.z-b.z)
 const at=(x:number,y:number,z:number):Point=>[146+22*(x-y),118+12*(x+y)-23*z]
 const path=(vertices:Point[])=>vertices.map(p=>p.join(',')).join(' ')
 return <div className="cube-view">
  <div className="cube-views" role="group" aria-label="Puzzle view">
   {['Front','Quarter turn','Back','Layers'].map((name,i)=><button type="button" key={name} aria-pressed={angle===i} onClick={()=>setAngle(i)}>{name}</button>)}
  </div>
  {angle===3?<div className="cube-cross-section">
   <InstrumentPicker label="Stack levels" className="cube-levels" options={levels} value={layer} select={setLayer}/>
   <div role="group" aria-label={'Layer '+layer+' occupancy'} className="cube-layer" style={{gridTemplateColumns:`repeat(${side},1fr)`}}>{heights.map((h,i)=><span key={i} role="img" aria-label={`Row ${Math.floor(i/side)+1}, column ${i%side+1}: ${h>=layer?'occupied':'empty'}`} className={h>=layer?'occupied':''}>{h>=layer?'■':'·'}</span>)}</div>
  </div>:<svg role="img" aria-label="Isometric cube stack. Use Layers to inspect individual levels." className="voxel-diagram" viewBox="20 5 252 218">
   <g className="cube-engraved-base" aria-hidden="true">
    <polygon points={path([at(0,side,0),at(side,side,0),at(side,side,-.24),at(0,side,-.24)])}/>
    <polygon points={path([at(side,0,0),at(side,side,0),at(side,side,-.24),at(side,0,-.24)])}/>
    <polygon points={path([at(0,0,0),at(side,0,0),at(side,side,0),at(0,side,0)])}/>
    {Array.from({length:side-1},(_,i)=><g key={i}><polyline points={path([at(i+1,side,0),at(i+1,0,0)])}/><polyline points={path([at(0,i+1,0),at(side,i+1,0)])}/></g>)}
   </g>
   {voxels.map(({x,y,z})=><g key={x+':'+y+':'+z} stroke="#72543e" strokeWidth="1" strokeLinejoin="round">
    <polygon fill="#b48859" points={path([at(x+1,y,z),at(x+1,y+1,z),at(x+1,y+1,z+1),at(x+1,y,z+1)])}/>
    <polygon fill="#d7b382" points={path([at(x,y+1,z),at(x+1,y+1,z),at(x+1,y+1,z+1),at(x,y+1,z+1)])}/>
    <polygon fill="#eee1c7" points={path([at(x,y,z+1),at(x+1,y,z+1),at(x+1,y+1,z+1),at(x,y+1,z+1)])}/>
    <polyline className="cube-chisel" points={path([at(x+.13,y+.13,z+1),at(x+.87,y+.13,z+1),at(x+.87,y+.87,z+1),at(x+.13,y+.87,z+1),at(x+.13,y+.13,z+1)])}/>
   </g>)}
  </svg>}
 </div>
}
