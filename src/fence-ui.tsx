import {useEffect,useMemo,useRef,useState} from 'react'
import {fenceGeometry,fenceSide} from './fence'
import type {Snapshot} from './room'
import slate from './fence-art/slate.svg'
import './fence.css'

const {edges,w,horizontal,cells}=fenceGeometry
const side=400, inset=34, step=(side-2*inset)/fenceSide
const at=(v:number):[number,number]=>[inset+v%w*step,inset+Math.floor(v/w)*step]
const dots=Array.from({length:w*w},(_,i)=>at(i))
const lines=edges.map(([a,b],i)=>{
 const [x,y]=at(a),[X,Y]=at(b),mx=(x+X)/2,my=(y+Y)/2
 const wobble=((i*13)%11-5)*.36,sweep=((i*17)%7-3)*2
 return {mx,my,straight:`M${x} ${y}L${X} ${Y}`,
  ink:i<horizontal?`M${x} ${y}Q${mx+sweep} ${my+wobble} ${X} ${Y}`:`M${x} ${y}Q${mx+wobble} ${my+sweep} ${X} ${Y}`}
})
const directions:Record<string,[number,number]>={ArrowUp:[0,-1],ArrowDown:[0,1],ArrowLeft:[-1,0],ArrowRight:[1,0]}
const nextEdge=(index:number,dx:number,dy:number)=>{
 const {mx,my}=lines[index]
 const alongEdge=dx!==0?index<horizontal:index>=horizontal
 let next=index,distance=Infinity
 lines.forEach((other,i)=>{
  const x=other.mx-mx,y=other.my-my,towards=x*dx+y*dy,across=Math.abs(x*dy-y*dx)
  if(towards<1)return
  const score=towards+across*(alongEdge?1.65:.64)
  if(score<distance){distance=score;next=i}
 })
 return next
}
function label(i:number){
 const v=edges[i][0],r=Math.floor(v/w)+1,c=v%w+1
 return (i<horizontal?'Horizontal':'Vertical')+' edge row '+r+', column '+c
}
function Glyph({kind}:{kind:'line'|'cross'|'clock'|'check'|'eye'|'ledger'}){
 return <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.55" strokeLinecap="round" strokeLinejoin="round">
  {kind==='line'?<><path d="m3.8 17.5 14.1-11.2 2 2.5L6 20l-3 1Z"/><path d="m15.9 7.9 2.3 2.7M3.4 15.6l3.2-2.1m-3.2 5.1-.7 2.4"/></>:kind==='cross'?<><path d="m5 5 14 14M19.1 5.3 5 19.2"/><path d="m6 4.1 13.7 14m.4-12.3L6 20"/></>:kind==='clock'?<><path d="m6.1 2.8 11.7.2m-11.4 18 11.6.1M7 3.4c.2 6.2 4.7 6.1 4.9 8.3.1 2.7-4.6 3.2-4.9 8.9m9.8-17.3c-.2 6.2-4.5 6.4-4.9 8.4.3 2.6 4.9 3.4 5.2 8.9M9.5 16.9l2.4-2 2.8 2.2"/></>:kind==='check'?<><path d="M12.1 2.7 21 12.1l-9.1 9.3L3 12Z"/><path d="m7.3 12 3.1 3.1 6.2-6.5"/></>:kind==='eye'?<><path d="M2 12q9.8-12 20 0-10.2 12.2-20 0Z"/><path d="M15.2 12a3.2 3.2 0 1 1-6.4 0 3.2 3.2 0 0 1 6.4 0Z"/></>:<><path d="m4.3 4 7.6.7 7.8-.7.3 15.6-8 1.1-7.7-.7Zm7.7.8.1 15.6M6.7 8.1l2.5.3m-2.4 3.4 2.4.3m5.4-3.7 3-.4m-2.9 3.9 2.7-.4"/></>}
 </svg>
}
const clock=(seconds:number)=>`${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')}`
export function FenceBoard({snap,active,name,submit}:{snap:Snapshot,active:boolean,name:(u:string)=>string,submit:(a:number)=>void}){
 const g=snap.game!,f=g.fence!
 const [mode,setMode]=useState<1|2>(1),[inspect,setInspect]=useState(false)
 const [focused,setFocused]=useState(0),edgeRefs=useRef<Array<HTMLButtonElement|null>>([])
 const [now,setNow]=useState(Date.now),[offset,setOffset]=useState(()=>snap.hostNow-Date.now())
 useEffect(()=>{
  if(g.done)return
  const id=setInterval(()=>setNow(Date.now()),200)
  return()=>clearInterval(id)
 },[g.done])
 useEffect(()=>{setNow(Date.now());setOffset(snap.hostNow-Date.now())},[snap.hostNow])
 const seconds=Math.max(0,Math.ceil(((g.deadline??now)-now-offset)/1000))
 const marks=inspect&&f.solution?f.solution:f.marks
 const enabled=active&&!g.done&&!f.solved&&seconds>0
 const results=f.results?.slice().sort((a,b)=>Number(b.elapsed!==null)-Number(a.elapsed!==null)||b.points-a.points||(a.elapsed??240000)-(b.elapsed??240000))
 // Count only the lines on this private slate. No solver, remote marks or
 // hidden solution participates in the progress display.
 const progress=useMemo(()=>{
  const counts=cells.map(cell=>cell.reduce((sum,i)=>sum+Number(marks[i]===1),0))
  const total=f.clues.filter(n=>n!==null).length
  const exact=f.clues.filter((n,i)=>n!==null&&n===counts[i]).length
  return {counts,total,exact}
 },[marks,f.clues])
 return <section aria-label="Loop Fence board" className="fence-game" data-fence-phase={g.done?'finished':f.solved?'solved':'drawing'}>
  <div className="fence-instruments">
   <header className="fence-caption"><strong>{fenceSide} × {fenceSide} slate</strong>
    <span className="fence-clock" role="timer" aria-label="Time remaining" data-low={!g.done&&seconds<=20||undefined}><Glyph kind="clock"/>{g.done?'Finished':clock(seconds)}</span>
   </header>
   <p className="fence-status" role="status">{g.done?(inspect?'Showing the solution.':'Round finished.'):(f.solved?'Loop solved. Waiting for the table.':'Draw one continuous loop. Numbers count the edges around their square.')}</p>
   <div className="fence-toolbar" role="group" aria-label="Fence marking tools">
    {g.done?<button type="button" onClick={()=>setInspect(x=>!x)} aria-pressed={inspect}><Glyph kind="eye"/>{inspect?'Show my grid':'Show solution'}</button>:<>
     <button type="button" aria-pressed={mode===1} onClick={()=>setMode(1)} disabled={!enabled}><Glyph kind="line"/>Draw line</button>
     <button type="button" aria-pressed={mode===2} onClick={()=>setMode(2)} disabled={!enabled}><Glyph kind="cross"/>Cross out</button>
    </>}
   </div>
   <div className="fence-progress" role="meter" aria-label="Clues matched" aria-valuemin={0} aria-valuemax={progress.total} aria-valuenow={progress.exact} aria-valuetext={progress.exact+' of '+progress.total+' clues match this slate'}>
    <Glyph kind="check"/><span>Clues matched</span><strong>{progress.exact}/{progress.total}</strong>
   </div>
  </div>
  <div className="fence-grid" data-fence-tool={mode===1?'line':'cross'} role="group" aria-label="Editable slate" aria-describedby="fence-help">
   <p className="sr" id="fence-help">Use arrow keys to move between edges, then Enter or Space to mark one.</p>
   <svg className="fence-drawing" viewBox="0 0 400 400" aria-hidden="true">
    <image href={slate} width={side} height={side}/>
    {lines.map(({straight,ink,mx,my},i)=><g key={i} data-drawn-edge={i} data-mark={marks[i]}>
     <path className="fence-groove" d={straight}/>
     {marks[i]===1&&<><path className="fence-ink-depth" d={ink}/><path className="fence-ink-line" d={ink}/></>}
     {marks[i]===2&&<path className="fence-ink-cross" d={`M${mx-6.8} ${my-5.5}q6.4 5.1 13 11.6M${mx+6.6} ${my-6.2}q-6.1 6.8-13.1 11.5`}/>}
    </g>)}
    {dots.map(([x,y],i)=><path className="fence-pin" key={i} d={`M${x-2.9} ${y+.1}q.3-3.3 3.4-2.8 2.7.4 2.4 3.2-.3 2.6-3.1 2.5-2.5-.1-2.7-2.9Z`}/>)}
    {f.clues.map((n,i)=>{
     if(n===null)return null
     const x=inset+(i%fenceSide+.5)*step,y=inset+(Math.floor(i/fenceSide)+.5)*step
     const count=progress.counts[i],state=count===n?'exact':count>n?'over':'open'
     return <g key={i} data-clue={i} data-clue-state={state}>
      <text className="fence-clue-glyph" x={x} y={y} dy=".32em" textAnchor="middle">{n}</text>
      {state==='over'?<path className="fence-clue-tick" d={`M${x-5.6} ${y+12.8}q5.5 2 11.2.2`}/>:state==='exact'?<path className="fence-clue-tick" d={`M${x-1.8} ${y+13.5}l1.7 2 2.1-2.1-2.1-1.8Z`}/>:null}
     </g>
    })}
   </svg>
   {lines.map(({mx,my},i)=><button key={i} ref={node=>{edgeRefs.current[i]=node}} className={'fence-edge '+(i<horizontal?'horizontal':'vertical')} type="button" disabled={!enabled}
    style={{left:mx/side*100+'%',top:my/side*100+'%',width:step/side*100+'%',height:step/side*100+'%'}} data-edge={i} data-mark={marks[i]}
    tabIndex={enabled&&focused===i?0:-1} onFocus={()=>setFocused(i)} aria-label={label(i)+', '+['empty','line','crossed'][marks[i]]}
    onKeyDown={event=>{
     const direction=directions[event.key]
     if(!direction)return
     event.preventDefault()
     edgeRefs.current[nextEdge(i,...direction)]?.focus()
    }}
    onClick={()=>submit(i*3+(marks[i]===mode?0:mode))}/>)}
  </div>
  <details className="fence-clues"><summary><Glyph kind="ledger"/>Read clues as text</summary>
   <p>Use arrow keys to move between edges, then Enter or Space to mark one.</p>
   <ol>{Array.from({length:fenceSide},(_,r)=><li key={r}>Row {r+1}: {f.clues.slice(fenceSide*r,fenceSide*(r+1)).map((n,c)=>'Column '+(c+1)+' '+(n??'blank')).join(', ')}</li>)}</ol>
  </details>
  {results&&<ol className="fence-results">{results.map(({id,points,elapsed})=><li key={id}><strong>{name(id)}</strong><span>{elapsed===null?points+' net clues':(elapsed/1000).toFixed(2)+' s · solved'}</span></li>)}</ol>}
 </section>
}
