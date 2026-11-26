import {useEffect,useState} from 'react'
import {fenceGeometry,fenceSide} from './fence'
import type {Snapshot} from './room'
import './fence.css'

const {edges,w,horizontal}=fenceGeometry
const label=(i:number)=>{
 const a=edges[i][0],r=Math.floor(a/w)+1,c=a%w+1
 return (i<horizontal?'Horizontal':'Vertical')+' edge row '+r+', column '+c
}
const position=(vertex:number)=>[(vertex%w+0.3)*100/(fenceSide+0.6),(Math.floor(vertex/w)+0.3)*100/(fenceSide+0.6)]
export function FenceBoard({snap,active,name,submit}:{snap:Snapshot,active:boolean,name:(u:string)=>string,submit:(a:number)=>void}){
 const g=snap.game!,f=g.fence!
 const [mode,setMode]=useState<1|2>(1),[inspect,setInspect]=useState(false)
 const [now,setNow]=useState(Date.now),[offset,setOffset]=useState(()=>snap.hostNow-Date.now())
 useEffect(()=>{const id=setInterval(()=>setNow(Date.now()),200);return()=>clearInterval(id)},[])
 useEffect(()=>{setNow(Date.now());setOffset(snap.hostNow-Date.now())},[snap.hostNow])
 const seconds=Math.max(0,Math.ceil(((g.deadline??now)-now-offset)/1000))
 const marks=inspect&&f.solution?f.solution:f.marks
 const enabled=active&&!g.done&&!f.solved&&seconds>0
 const results=f.results?.slice().sort((a,b)=>Number(b.elapsed!==null)-Number(a.elapsed!==null)||b.points-a.points||(a.elapsed??240000)-(b.elapsed??240000))
 return <section aria-label="Loop Fence board" className="fence-game">
  <div className="auction-top"><strong>One loop · {fenceSide} × {fenceSide}</strong><span className="pill" aria-label="Time remaining">{g.done?'Finished':seconds+' s'}</span></div>
  <p role="status">{g.done?(inspect?'Showing the solution.':'Round finished.'):(f.solved?'Loop solved. Waiting for the table.':'Draw one continuous loop. Numbers count the edges around their square.')}</p>
  {g.done?<button type="button" onClick={()=>setInspect(x=>!x)} aria-pressed={inspect}>{inspect?'Show my grid':'Show solution'}</button>:<div className="actions" aria-label="Fence marking tools"><button type="button" aria-pressed={mode===1} onClick={()=>setMode(1)}>Draw line</button><button type="button" aria-pressed={mode===2} onClick={()=>setMode(2)}>Cross out</button></div>}
  <div className="fence-grid">
   <svg viewBox="0 0 100 100" aria-hidden="true">
    <rect width="100" height="100" rx="3" fill="#f8edd5"/>
    {edges.map(([a,b],i)=>{
     const [x,y]=position(a),[X,Y]=position(b),mx=(x+X)/2,my=(y+Y)/2
     return <g key={i}><line x1={x} y1={y} x2={X} y2={Y} stroke={marks[i]===1?'#186056':'#b7a487'} strokeWidth={marks[i]===1?1.8:.36} strokeLinecap="round"/>
      {marks[i]===2&&<path d={`M${mx-1.25} ${my-1.25} l2.5 2.5 m-2.5 0 l2.5 -2.5`} fill="none" stroke="#92462e" strokeWidth=".66"/>}</g>
    })}
    {Array.from({length:w*w},(_,i)=>{const [x,y]=position(i);return <circle key={i} cx={x} cy={y} r=".65" fill="#6d593f"/>})}
    {f.clues.map((n,i)=>n===null?null:<text key={i} x={(i%5+.8)*100/5.6} y={(Math.floor(i/5)+.8)*100/5.6} dy=".34em" textAnchor="middle" fill={n===0?'#756141':'#4e3028'} fontSize="5.6" fontWeight="700">{n}</text>)}
   </svg>
   {edges.map(([a,b],i)=>{
    const [x,y]=position(a),[X,Y]=position(b)
    return <button key={i} className={'fence-edge '+(i<horizontal?'horizontal':'vertical')} type="button" disabled={!enabled}
     style={{left:(x+X)/2+'%',top:(y+Y)/2+'%'}} data-edge={i} data-mark={marks[i]} aria-label={label(i)+', '+['empty','line','crossed'][marks[i]]}
     onClick={()=>submit(i*3+(marks[i]===mode?0:mode))}/>
   })}
  </div>
  <details className="fence-clues"><summary>Read clues as text</summary>
   <ol>{Array.from({length:5},(_,r)=><li key={r}>Row {r+1}: {f.clues.slice(5*r,5*r+5).map((n,c)=>'Column '+(c+1)+' '+(n??'blank')).join(', ')}</li>)}</ol>
  </details>
  {results&&<ol className="fence-results">{results.map(({id,points,elapsed})=><li key={id}><strong>{name(id)}</strong><span>{elapsed===null?points+' net clues':(elapsed/1000).toFixed(2)+' s · solved'}</span></li>)}</ol>}
 </section>
}
