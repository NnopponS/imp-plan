import {useEffect,useRef,useState,type CSSProperties,type KeyboardEvent} from 'react'
import {wallGo2Edges,wallGo2Side,type WallGo2View,type WallGo2Shape} from './wall-go2'
import './wall-go2.css'

const cells=Array.from({length:wallGo2Side**2},(_,i)=>i)
const side=wallGo2Side
const tint=['#f5b56d','#80e0cc','#f1a1bd']
const coord=(i:number)=>String.fromCharCode(65+i%side)+(Math.floor(i/side)+1)
const coordinates=(i:number)=>[i%side+.5,Math.floor(i/side)+.5] as const
const cellStyle=(index:number):CSSProperties=>({backgroundColor:tint[index]})
const ink=(i:number):CSSProperties=>({'--w2-ink':tint[i]} as CSSProperties)
function wallPosition(wall:number){
 const [a,b]=wallGo2Edges[wall], [ax,ay]=coordinates(a),[bx,by]=coordinates(b)
 return {x:(ax+bx)/2,y:(ay+by)/2,horizontal:ax===bx}
}
function wallSide(to:number,wall:number){
 const [a,b]=wallGo2Edges[wall]
 const diff=(to===a?b:a)-to
 return diff===1?'East':diff===-1?'West':diff===side?'South':'North'
}
export function WallGo2Glyph({shape}:{shape:WallGo2Shape}){
 return <span className="w2-piece" data-shape={shape} aria-hidden="true">{shape==='square'?'Ⅱ':'↳'}</span>
}

export function WallGo2Board({view,you,name,active,hostNow,deadline,submit}:{
 view:WallGo2View;you:string;name:(seat:string)=>string;active:boolean;hostNow:number;
 deadline:number|null;submit:(action:number)=>void
}){
 const [selection,setSelection]=useState<{step:number;source:number|null;target:number|null;path:number}>({step:-1,source:null,target:null,path:0})
 const [focus,setFocus]=useState(0)
 const cellRefs=useRef<(HTMLButtonElement|null)[]>([])
 const [wanted,setWanted]=useState<WallGo2Shape>('square')
 const [remaining,setRemaining]=useState(()=>Math.max(0,Math.ceil(((deadline??hostNow)-hostNow)/1000)))
 useEffect(()=>{
  if(deadline===null)return
  const started=performance.now()
  const sample=()=>setRemaining(Math.max(0,Math.ceil((deadline-hostNow-(performance.now()-started))/1000)))
  sample()
  const handle=window.setInterval(sample,250)
  return ()=>window.clearInterval(handle)
 },[view.step,deadline,hostNow])
 const open=active&&view.turn===you&&!view.result&&remaining>0
 const legal=open?view.legal:[]
 const drafts=legal.filter(c=>'shape' in c)
 const shapes=[...new Set(drafts.map(d=>d.shape))]
 const shape=shapes.includes(wanted)?wanted:shapes[0]
 const draftByCell=new Map(drafts.filter(d=>d.shape===shape).map(d=>[d.cell,d.code]))
 const moves=legal.filter(c=>'from' in c)
 const sources=new Set(moves.map(m=>m.from))
 const {source,target,path}=selection.step===view.step&&open?selection:{source:null,target:null,path:0}
 const moveFrom=moves.filter(m=>m.from===source)
 const destinations=new Map<number,typeof moves>()
 for(const m of moveFrom){
  const found=destinations.get(m.to)
  if(found)found.push(m)
  else destinations.set(m.to,[m])
 }
 const dealing=target===null?[]:destinations.get(target)??[]
 const routes=[...new Set(dealing.map(m=>m.via))].map(via=>dealing.filter(m=>m.via===via))
  .sort((a,b)=>Number(a[0].breach!==null)-Number(b[0].breach!==null))
 const picked=routes[path]??routes[0]
 const queued=picked?.[0]
 const wallChoices=new Map(picked?.map(m=>[m.wall,m.code]))
 const byCell=new Map(view.pieces.map(p=>[p.cell,p]))
 const blocked=new Map<number,string[]>()
 for(const wall of view.walls)for(const c of wallGo2Edges[wall]){
  const directions=blocked.get(c)??[]
  directions.push(wallSide(c,wall).toLowerCase())
  blocked.set(c,directions)
 }
 function navigate(event:KeyboardEvent<HTMLButtonElement>,index:number){
  const col=index%side,row=Math.floor(index/side)
  const known:Record<string,number>={ArrowUp:row>0?index-side:index,ArrowDown:row<side-1?index+side:index,
   ArrowLeft:col>0?index-1:index,ArrowRight:col<side-1?index+1:index,Home:0,End:cells.length-1}
  const next=known[event.key]
  if(next===undefined)return
  event.preventDefault()
  cellRefs.current[next]?.focus()
 }

 const whose=view.turn===you?'Your turn':view.turn?name(view.turn)+'’s turn':''
 const result=view.result
 const hint=result?(result.reason==='separated'?'The walls sealed the last shared room.':'No player can move and build.')+
   ' Unclaimed tiles: '+view.score.neutral+'.':!active?'Reconnect to resume.':!open?whose+'.':
   view.drafting?'Choose a piece for your draft, then place it on an empty tile.':queued?(queued.breach!==null?
   'This route spends your breach. Choose a wall edge to commit.':'Choose an open edge beside '+coord(queued.to)+' to build.') :
   source!==null?'Choose a marked destination. Amber markers require a breach.':'Choose one of your marked pieces.'
 const last=view.last&&'from' in view.last?view.last:null
 const trail=queued??last
 return <section className="wall-go2" data-step={view.step} data-turn={view.turn===you?'self':view.turn?'other':'done'} aria-label="Wall Go II territory board">
  <header className="w2-header"><div><small>Prison D4 · {view.seats.length===3?'Triad':'Duel'}</small>
   <strong>{result?'Survey complete':view.drafting?'Opening draft':`Turn ${view.turns+1}`}</strong></div>
   {deadline!==null&&<div className="w2-clock" role="timer" aria-label="Turn time remaining">{remaining}<span> s</span></div>}
   {view.drafting&&!result&&<span className="w2-opening">{view.opening+1} / {view.seats.length*2}</span>}
  </header>
  <div className="w2-ledger" aria-label="Territory ledger">
   {view.seats.map((seat,i)=><article key={seat} style={ink(i)} data-active={seat===view.turn||undefined}>
    <span className="w2-seat" aria-hidden="true">{i+1}</span>
    <div><strong>{name(seat)}</strong><small>{view.seats.length===3?(view.breaches[i]?'Breach ready':'Breach spent'):'No breach in duels'}</small></div>
    <div className="w2-score"><b>{view.score.totals[i]}</b><small>tiles · max {view.score.largest[i]}</small></div>
   </article>)}
  </div>
  <div className="w2-board-frame">
   <div className="w2-file" aria-hidden="true">{Array.from({length:side},(_,i)=><b key={i}>{String.fromCharCode(65+i)}</b>)}</div>
   <div className="w2-rank" aria-hidden="true">{Array.from({length:side},(_,i)=><b key={i}>{i+1}</b>)}</div>
   <div className="w2-grid" role="group" aria-label="Fortress grid" aria-describedby="wall-go2-grid-help">
    <span className="sr" id="wall-go2-grid-help">Use the arrow keys to inspect cells. Press Enter or Space to select an available cell.</span>
    {cells.map(cell=>{
     const piece=byCell.get(cell),owner=view.score.owners[cell],dest=destinations.get(cell)
     const ghost=queued?.to===cell&&source!==null?byCell.get(source):undefined
     const draft=draftByCell.has(cell),selectable=sources.has(cell),legalTarget=!!dest
     const room=owner!==null?owner:null
     const breach=dest?.every(p=>p.breach!==null)
     const label=[coord(cell),piece?name(view.seats[piece.side])+' '+piece.shape:ghost?'intended arrival':null,
      draft?'available draft tile':selectable?'available piece':legalTarget?(breach?'destination requires a breach':'available destination'):null,
      room!==null?name(view.seats[room])+' territory':null,blocked.has(cell)?'walls '+blocked.get(cell)!.join(', '):null].filter(Boolean).join(' · ')
     return <button type="button" key={cell} ref={el=>{cellRefs.current[cell]=el}} tabIndex={focus===cell?0:-1}
      onFocus={()=>setFocus(cell)} onKeyDown={e=>navigate(e,cell)} className="w2-cell" data-cell={cell} data-draft={draft||undefined}
      data-source={selectable||undefined} data-destination={legalTarget||undefined}
      data-selected={source===cell||undefined} data-ghost={!!ghost||undefined}
      data-breach={breach||undefined}
      data-owned={room!==null||undefined}
      style={{...ink((piece??ghost)?.side??0),'--w2-room':room===null?'transparent':tint[room]} as CSSProperties}
      aria-label={label} aria-pressed={selectable?cell===source:undefined}
      aria-disabled={!draft&&!selectable&&!legalTarget||undefined}
      onClick={()=>{if(draft){submit(draftByCell.get(cell)!);return}
       if(selectable){setSelection({step:view.step,source:cell===source?null:cell,target:null,path:0});return}
       if(legalTarget)setSelection({step:view.step,source,target:cell,path:0})
      }}>
      {(piece??ghost)&&<WallGo2Glyph shape={(piece??ghost)!.shape}/>}
      {room!==null&&<span aria-hidden="true" className="w2-owner">{room+1}</span>}
     </button>
    })}
    {trail&&<svg className="w2-route" viewBox="0 0 7 7" aria-hidden="true" data-current={!!queued||undefined}>
     <polyline points={[trail.from,...(trail.via===null?[]:[trail.via]),trail.to].map(i=>coordinates(i).join(',')).join(' ')}/>
    </svg>}
    {view.walls.map(wall=>{
     const {x,y,horizontal}=wallPosition(wall)
     return <span key={wall} className="w2-wall" data-wall={wall} data-horizontal={horizontal||undefined} data-breaking={queued?.breach===wall||undefined}
      style={{left:`${x/side*100}%`,top:`${y/side*100}%`}} title={'Wall '+wallGo2Edges[wall].map(coord).join('–')}/>
    })}
    {queued&&[...wallChoices].map(([wall,code])=>{
     const {x,y,horizontal}=wallPosition(wall)
     return <button type="button" key={wall} className="w2-socket" data-wall-choice={wall} data-horizontal={horizontal||undefined}
      style={{left:`${x/side*100}%`,top:`${y/side*100}%`}} aria-label={'Place '+wallSide(queued.to,wall).toLowerCase()+' wall at '+coord(queued.to)}
      onClick={()=>submit(code)}/>
    })}
   </div>
  </div>
  <div className="w2-controls">
   <p className="w2-hint" aria-live="polite">{hint}</p>
   {shapes.length>0&&<div className="w2-options" role="group" aria-label="Draft shape">{shapes.map(s=><button type="button" key={s} aria-pressed={shape===s} onClick={()=>setWanted(s)}>{s==='square'?'□ Square':'○ Round'}</button>)}</div>}
   {queued&&routes.length>1&&<div className="w2-options" role="group" aria-label="Choose a route">{routes.map(([r],i)=><button key={r.via} type="button" aria-pressed={r===queued}
    onClick={()=>setSelection({step:view.step,source,target,path:i})}>Via {r.via===null?coord(r.to):coord(r.via)}{r.breach!==null?' · breach':''}</button>)}</div>}
   {queued&&<div className="w2-options" role="group" aria-label="Wall edges">
    {[...wallChoices].map(([wall,code])=><button key={wall} type="button" onClick={()=>submit(code)}>{wallSide(queued.to,wall)} edge</button>)}
   </div>}
   {source!==null&&<button className="w2-reset" type="button" onClick={()=>setSelection({step:view.step,source:null,target:null,path:0})}>Clear route</button>}
   {view.skipped.length>0&&!result&&<small>Skipped: {view.skipped.map(i=>name(view.seats[i])).join(', ')} (no legal route).</small>}
   {result&&<p className="w2-final" data-testid="wall-go2-result"><strong>{result.winners.length===1?name(result.winners[0])+' controls the fortress':result.winners.map(name).join(' and ')+' share the fortress'}</strong><br/>Largest single room breaks a tie in tile count.</p>}
  </div>
  <div className="w2-legend">
   <span style={ink(0)}><WallGo2Glyph shape="square"/> 1–2 straight</span>
   <span style={ink(1)}><WallGo2Glyph shape="round"/> 1 step, then turn</span>
   <span>{view.seats.map((seat,i)=><i key={seat} style={cellStyle(i)} />)} Territory</span>
  </div>
 </section>
}
