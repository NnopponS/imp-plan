import {useEffect,useId,useRef,useState,type CSSProperties,type KeyboardEvent} from 'react'
import type {Snapshot} from './room'
import './knight-tour.css'

function KnightCarving(){
 return <svg viewBox="0 0 76 82" className="knight-carving" aria-hidden="true" focusable="false">
  <path d="M13 74h55l-3-5-6-3c3-11 3-24-2-35-3-7-8-12-16-16l-1-9-8 6-5-9-2 12-7 6-2 7-9 10 3 11 13 2 10-7c-1 8-11 13-16 23Z" fill="#372632" stroke="#342030" strokeWidth="2.2" strokeLinejoin="round"/>
  <path d="M23 65c4-10 15-16 15-26l-13 8-13-2-3-7 10-10 2-6 8-6 1-9 4 8 7-5 1 10c12 7 17 20 12 45Z" fill="#dcb982" stroke="#674153" strokeWidth="1.55" strokeLinejoin="round"/>
  <path d="M40 15c18 5 23 21 25 34 1 5 0 12-3 17h-9c3-11 4-20 1-29-2-6-7-13-12-16Z" fill="#8f604f" stroke="#4e3044" strokeWidth="1.5"/>
  <path d="M48 24q8 4 13 15m-10-7 10 8m-8-2 9 9m-8-2 9 10m-8-3 8 10" fill="none" stroke="#db9f72" strokeWidth="1.1" strokeLinecap="round"/>
  <path d="M20 26c7-8 16-10 24-7-8 1-14 3-18 9l-9 9-5 2 3-5Z" fill="#f4daa1"/>
  <path d="M39 37c8 0 11 7 12 13 1 4-2 10-4 14h-18q9-8 10-13c2-4 2-9 0-14Z" fill="#b3825f"/>
  <path d="m11 40 8 1 10-5m12 6q3 8-7 18m-11-35 8-3m-1-10 2 6m7-4 1 4" fill="none" stroke="#815749" strokeWidth="1.1" strokeLinecap="round"/>
  <path d="M24 28q4-4 10 0-3 5-8 4Z" fill="#4b3040"/>
  <path d="m27 29 3-.6" stroke="#ffe4b0" strokeWidth=".95" strokeLinecap="round"/>
  <path d="M18 62h45l1 6 5 3v6H12v-6l5-3Z" fill="#af8159" stroke="#452d42" strokeWidth="1.75" strokeLinejoin="round"/>
  <path d="M20 65h41m-45 8h50m-43-4 5 2 5-2 4 2 5-2 5 2 5-2 6 2" fill="none" stroke="#e9bd82" strokeWidth="1.07" strokeLinecap="round"/>
 </svg>
}

function EtchedFrame(){
 return <svg className="knight-frame-etch" viewBox="0 0 300 300" preserveAspectRatio="none" aria-hidden="true" focusable="false">
  <path d="M13 3h274l10 10v274l-10 10H13L3 287V13Z" fill="none" stroke="#a77751" strokeWidth="1.15"/>
  <path d="M20 5H9v7m271-7h11v7m-11 283h11v-7m-271 7H9v-7M144 6l6-3 6 3m-12 288 6 3 6-3" fill="none" stroke="#e0ad73" strokeWidth="1.05"/>
  <path d="M23 8h254m0 284H23M7 21v258M293 21v258" fill="none" stroke="#785245" opacity=".83" strokeWidth=".95"/>
  <path d="m12 21 3-3-3-3-3 3Zm276 0 3-3-3-3-3 3ZM12 285l3-3-3-3-3 3Zm276 0 3-3-3-3-3 3Z" fill="#b3825c"/>
 </svg>
}

function GuideGlyph({kind}:{kind:'time'|'undo'|'landing'|'spent'}){
 const path={
  time:'M6 3h12M6 21h12M8 3v4c0 3 4 3 4 5s-4 2-4 5v4m8-18v4c0 3-4 3-4 5s4 2 4 5v4m-6-3h4',
  undo:'m9 4-5 5 5 5M4 9h10a5 5 0 0 1 0 10h-2',
  landing:'m12 3 8 9-8 9-8-9Zm-1 9h2',
  spent:'M12 3v18m-5-1 5-4 5 4M7 4l10 8m0-8L7 12'
 }[kind]
 return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.55" strokeLinejoin="round" strokeLinecap="round" aria-hidden="true" focusable="false"><path d={path}/></svg>
}

function TourClock({snap}:{snap:Snapshot}){
 const g=snap.game!
 const [now,setNow]=useState(Date.now)
 const [offset,setOffset]=useState(()=>snap.hostNow-Date.now())
 useEffect(()=>{const id=setInterval(()=>setNow(Date.now()),200);return()=>clearInterval(id)},[])
 useEffect(()=>{const at=Date.now();setNow(at);setOffset(snap.hostNow-at)},[snap.hostNow])
 const seconds=Math.max(0,Math.ceil(((g.deadline??now)-now-offset)/1000))
 return <span className="knight-clock" role="timer" aria-label="Time remaining" data-urgent={!g.done&&seconds<=10||undefined}>
  <GuideGlyph kind="time"/>{g.done?'Finished':Math.floor(seconds/60)+':'+String(seconds%60).padStart(2,'0')}
 </span>
}

const file=(i:number)=>String.fromCharCode(65+i)

export function KnightTourBoard({snap,active,submit,name}:{snap:Snapshot,active:boolean,submit:(n:number)=>void,name:(s:string)=>string}){
 const g=snap.game!,size=g.size,total=size*size,current=g.path.at(-1)??-1
 const currentScore=g.scores[g.seats.indexOf(snap.you)]??0
 const [focus,setFocus]=useState(Math.max(0,current))
 const refs=useRef<(HTMLButtonElement|null)[]>([])
 const instructions=useId()
 const labels=Array.from({length:size},(_,i)=>i)
 const visited=new Map(g.path.map((cell,step)=>[cell,step+1]))
 const candidates=new Set<number>(active&&!g.done?g.legal.filter((m):m is number=>typeof m==='number'&&m>=0):[])
 const canUndo=active&&!g.done&&g.legal.includes(-1)
 const finishedRoute=g.path.length===total
 const status=finishedRoute?'Tour complete.':g.done?'Round ended. Best trail recorded.':!active?'Connection paused.':
  candidates.size===0?(canUndo?'No legal landing. Undo a step.':'No legal landing.'):
  g.closed&&g.path.length===total-1?'The last landing must be one jump from the start.':
  candidates.size+' legal '+(candidates.size===1?'landing':'landings')+'.'
 function inspect(e:KeyboardEvent<HTMLButtonElement>,i:number){
  if(e.metaKey||e.ctrlKey||e.altKey)return
  const x=i%size,y=Math.floor(i/size)
  const next:Record<string,number>={
   ArrowLeft:y*size+Math.max(0,x-1),ArrowRight:y*size+Math.min(size-1,x+1),
   ArrowUp:Math.max(0,y-1)*size+x,ArrowDown:Math.min(size-1,y+1)*size+x,
   Home:y*size,End:y*size+size-1
  }
  if(!Object.hasOwn(next,e.key))return
  e.preventDefault();refs.current[next[e.key]]?.focus()
 }
 const trace=g.path.map(i=>(i%size+.5)+','+(Math.floor(i/size)+.5)).join(' ')
 return <section className="knight-atlas" aria-label="Knight’s Tour table">
  <header className="knight-plaque">
   <strong>{size} × {size} · {g.closed?'Closed tour':'Open tour'}</strong>
   <TourClock snap={snap}/>
  </header>
  <div className="knight-desk">
   <div className="knight-boardwell" style={{'--knight-side':size} as CSSProperties}>
    <EtchedFrame/>
    <div className="knight-coordinates">
     <div aria-hidden="true" className="knight-files">{labels.map(i=><span key={i}>{file(i)}</span>)}</div>
     <div aria-hidden="true" className="knight-ranks">{labels.map(i=><span key={i}>{i+1}</span>)}</div>
     <div className="knight-board" role="group" aria-label="Knight’s Tour board" aria-describedby={instructions}>
      {Array.from({length:total},(_,i)=>{
       const ordinal=visited.get(i)
       const legal=candidates.has(i)
       const position=file(i%size)+(Math.floor(i/size)+1)
       const here=i===current
       const label=position+(here?', knight, step '+ordinal:ordinal?', visited '+ordinal:legal?', legal move':', unvisited')
       return <button key={i} type="button" tabIndex={i===focus?0:-1} ref={node=>{refs.current[i]=node}}
        aria-disabled={!legal} aria-label={label} data-color={(i%size+Math.floor(i/size))%2?'plum':'ivory'}
        data-visited={!!ordinal||undefined} data-legal={legal||undefined} data-current={here||undefined}
        onFocus={()=>setFocus(i)} onClick={()=>{if(legal)submit(i)}} onKeyDown={e=>inspect(e,i)}>
        {here&&<KnightCarving/>}
        {ordinal&&<span className="knight-waymark" aria-hidden="true" data-start={ordinal===1||undefined}>{ordinal}</span>}
        {legal&&<span className="knight-landing" aria-hidden="true"/>}
       </button>
      })}
      {g.path.length>1&&<svg className="knight-trace" viewBox={`0 0 ${size} ${size}`} aria-hidden="true" focusable="false">
       <polyline points={trace} className="knight-route-shadow" vectorEffect="non-scaling-stroke"/>
       <polyline points={trace} data-path-jumps={g.path.length-1} vectorEffect="non-scaling-stroke"/>
      </svg>}
     </div>
    </div>
   </div>
   <div className="knight-readout">
    <div className="knight-progress">
     <p className="knight-count"><strong>{g.path.length} / {total}</strong> visited</p>
     <div className="knight-tally" role="progressbar" aria-label="Tour progress" aria-valuemin={0} aria-valuemax={total} aria-valuenow={g.path.length}
      style={{'--knight-side':size} as CSSProperties}>
      {labels.map(i=><span key={i} style={{'--knight-ink':Math.min(1,Math.max(0,(g.path.length-i*size)/size))*100+'%'} as CSSProperties}/>)}
     </div>
     <p className="knight-status" role="status"><GuideGlyph kind={!g.done&&candidates.size>0?'landing':'spent'}/><span>{status}</span></p>
    </div>
    <button className="knight-undo" type="button" disabled={!canUndo} onClick={()=>submit(-1)}><GuideGlyph kind="undo"/>Undo step</button>
    {g.seats.length>1?<ul className="knight-scores" aria-label="Best trails" role="list">{g.seats.map((seat,i)=><li key={seat} data-winner={g.done&&g.winner===seat||undefined}>
     <span>{name(seat)}</span><strong>{g.scores[i]} visited (best)</strong>
    </li>)}</ul>:<p className="knight-best"><span>Best trail</span><strong>{currentScore} visited (best)</strong></p>}
   </div>
  </div>
  <p id={instructions} className="sr">Use arrow keys, Home or End to inspect squares. Press Enter or Space on a marked landing to move. Each square may only be visited once.</p>
 </section>
}
