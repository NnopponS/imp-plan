import {useEffect,useId,useMemo,useRef,useState} from 'react'
import {ArrowTile,IslandMap} from './treasure-island-map'
import {islandArrows,islandCellName,islandDirections,islandRounds,islandRoute,type Direction,type IslandAction,type IslandPiece,type IslandView} from './treasure-island'
import './treasure-island.css'

const directions=[0,1,2,3] as const
type Props={view:IslandView;you:string;name:(id:string)=>string;active:boolean;hostNow:number;receivedAt?:number;preview?:boolean;submit:(action:IslandAction)=>void}

function PhaseClock({deadline,hostNow,receivedAt}:{deadline:number;hostNow:number;receivedAt?:number}){
 const [local,setLocal]=useState(()=>performance.now())
 const base=useRef(performance.now())
 useEffect(()=>{
  const clock=window.setInterval(()=>setLocal(performance.now()),250)
  return ()=>window.clearInterval(clock)
 },[])
 const secs=Math.max(0,Math.ceil((deadline-hostNow-Math.max(0,local-(receivedAt??base.current)))/1000))
 return <span className="island-clock" role="timer" aria-label="Seconds remaining">{secs}<small> s</small></span>
}

export function TreasureIslandBoard({view:v,you,name,active,hostNow,receivedAt,preview=false,submit}:Props){
 const heading=useRef<HTMLHeadingElement>(null)
 const bidId=useId()
 const [amount,setAmount]=useState(1)
 const [route,setRoute]=useState<IslandPiece[]>([])
 const [picked,setPicked]=useState<number|null>(null)
 const arrows=v.mine?.arrows
 const selected=arrows?.find(a=>a.id===picked)??arrows?.find(a=>!route.some(p=>p.arrow===a.id))
 const sealed=v.table.find(s=>s.id===you)?.sealed
 const open=active&&!preview&&!!v.mine&&!sealed&&v.phase!=='finished'
 const cells=useMemo(()=>islandRoute(arrows??[],route)??[],[arrows,route])
 const result=v.result
 const lead=result?.standings.filter(r=>r.rank===1)??[]
 // When an action advances the briefing, input focus must not fall out of the match.
 useEffect(()=>{
  if(!preview&&v.step>0&&document.activeElement===document.body)heading.current?.focus({preventScroll:true})
 },[preview,v.step])
 const bid=Math.min(amount,v.mine?.chips??0)
 function add(turn:Direction){
  if(!selected)return
  const next=[...route,{arrow:selected.id,turn}]
  if(islandRoute(arrows??[],next)){setRoute(next);setPicked(null)}
 }
 const stage=result?'Expedition results':v.phase==='auction'?'Arrow exchange':'Plot your expedition'
 return <div className="island-table" data-island-phase={v.phase}>
  <header className="island-header">
   <div><p className="island-kicker">{result?'CHART CLOSED':v.phase==='auction'?`SEALED LOT ${v.lot} / ${v.lotCount}`:`EXPEDITION ${v.round} / ${islandRounds}`}</p><h2 tabIndex={-1} ref={heading}>{stage}</h2></div>
   {!preview&&v.deadline!==null&&<PhaseClock deadline={v.deadline} hostNow={hostNow} receivedAt={receivedAt}/>}
  </header>
  <div className="island-layout">
   <figure className="island-chart">
    <IslandMap route={sealed?v.mine?.route??[]:cells} digs={v.mine?.digs} treasure={result?.treasure??null} example={preview}/>
    <figcaption><span><i data-key="land"/> Land</span><span><i data-key="water"/> Water</span><span><i data-key="reef"/> Reef</span><span>⚑ Landing E5</span></figcaption>
   </figure>
   <div className="island-console">
    {v.phase==='auction'&&v.arrow&&<>
     <div className="island-lot"><ArrowTile shape={v.arrow.shape}/><div><p className="island-kicker">CURRENT ARROW</p><h3>{islandArrows[v.arrow.shape].name}</h3><small>Only the highest bidder pays.</small></div></div>
     {v.lastLot&&<p className="island-receipt">Lot {v.lastLot.lot}: {v.lastLot.winner?`${name(v.lastLot.winner)} won for ${v.lastLot.price} chip${v.lastLot.price===1?'':'s'}${v.lastLot.tied?' on priority':''}.`:'No winning bid.'}</p>}
     {v.seatCount>1&&v.priority&&<p className="island-priority">First in a tie: <strong>{name(v.priority)}</strong></p>}
     <div className="island-private">
      <div className="island-sidehead"><h3>Your purse</h3><strong>{v.mine?.chips??0} chips</strong></div>
      <div className="island-cabinet" aria-label="Your arrows">{arrows?.map(a=><span key={a.id} title={islandArrows[a.shape].name}><ArrowTile shape={a.shape}/><span>{islandArrows[a.shape].name}</span></span>)}</div>
      {sealed?<p role="status">Your {v.mine?.bid===0?'pass':`${v.mine?.bid}-chip bid`} is sealed.</p>:!preview&&v.mine&&<div className="island-bid">
       <label htmlFor={bidId}>Bid amount</label><div className="island-stepper">
        <button type="button" aria-label="Lower your bid" disabled={!open||bid<=1} onClick={()=>setAmount(bid-1)}>−</button>
        <input id={bidId} type="number" min={v.mine.chips===0?0:1} max={v.mine.chips} value={bid} disabled={!open||!v.mine.chips} onChange={e=>setAmount(Math.max(1,Math.min(v.mine!.chips,Math.floor(Number(e.target.value)||1))))}/>
        <button type="button" aria-label="Raise your bid" disabled={!open||bid>=v.mine.chips} onClick={()=>setAmount(bid+1)}>+</button></div>
       <div className="island-cta"><button className="primary" type="button" disabled={!open||bid<1} onClick={()=>submit({kind:'bid',amount:bid})}>Seal bid</button><button type="button" disabled={!open} onClick={()=>submit({kind:'bid',amount:0})}>Pass lot</button></div>
      </div>}
     </div>
    </>}
    {v.phase==='explore'&&<>
     <div className="island-private">
      <div className="island-sidehead"><h3>Your route</h3><span>{route.length} of {arrows?.length??0} arrows laid</span></div>
      <p>Choose an arrow, then the direction of its first step. The chart outlines your endpoint.</p>
      <div className="island-cabinet" aria-label="Your arrows">
       {arrows?.map(a=><button key={a.id} type="button" aria-pressed={selected?.id===a.id&&!route.some(p=>p.arrow===a.id)} aria-label={islandArrows[a.shape].name+' arrow '+a.id} disabled={!open||route.some(p=>p.arrow===a.id)} onClick={()=>setPicked(a.id)}><ArrowTile shape={a.shape}/><span>{islandArrows[a.shape].name}</span></button>)}
      </div>
      {!sealed&&!preview&&<div className="island-bearings" role="group" aria-label="Rotate and lay selected arrow">
       {directions.map(d=><button type="button" key={d} disabled={!open||!selected||!islandRoute(arrows??[],[...route,{arrow:selected.id,turn:d}])} onClick={()=>add(d)}>{islandDirections[d]}</button>)}
      </div>}
      <p className="island-endpoint" aria-live="polite">{sealed?(v.mine?.route?.length?`Route to ${islandCellName(v.mine.route.at(-1)!)} sealed.`:'Your pass is sealed.'):route.length?`Dig at ${islandCellName(cells.at(-1)!)}.`:'Start at landing point E5.'}</p>
      {!sealed&&!preview&&<div className="island-cta">
       <button type="button" className="primary" disabled={!open||!route.length} onClick={()=>submit({kind:'sail',route})}>Seal route</button>
       <button type="button" disabled={!open||!route.length} onClick={()=>{setRoute(route.slice(0,-1));setPicked(null)}}>Undo arrow</button>
       <button type="button" disabled={!open} onClick={()=>submit({kind:'sail',route:[]})}>Pass dig</button>
      </div>}
     </div>
    </>}
    {result&&<section className="island-private island-results" aria-label="Island standings">
     <p className="island-kicker">{result.reason==='treasure'?'TREASURE FOUND': 'FIVE EXPEDITIONS COMPLETE'}</p>
     <h3>{v.seatCount===1?(result.reason==='treasure'?'You found the treasure':'Practice complete'):lead.length===1?name(lead[0].seat)+' wins':'Shared first place'}</h3>
     <p>Treasure location: <strong>{islandCellName(result.treasure)}</strong></p>
     <ol>{result.standings.map(r=><li key={r.seat}><strong>#{r.rank} {name(r.seat)}</strong><span>{r.clues} {r.clues===1?'cache':'caches'} · {r.distance===null?'no dig':r.distance+' away'}{r.bonus?' · +10 treasure':''}</span></li>)}</ol>
    </section>}
    {!result&&<p className="island-seals" role="status">{v.table.filter(s=>s.sealed).length} of {v.seatCount} sealed{preview?' · example only':''}</p>}
    {(v.phase==='explore'||result)&&<section className="island-private island-notebook" aria-label="Your private notebook">
     <h3>Private notebook</h3>
     {v.mine?.digs.length?<ol>{[...v.mine.digs].reverse().map(d=><li key={d.round}>
      <strong>#{d.round}{d.endpoint===null?' · Pass':' · '+islandCellName(d.endpoint)}</strong>
      <span>{d.kind==='clue'?`Cache · ${d.clue!.distance} grid steps away · ${d.clue!.rowParity} row`:d.kind==='sand'?'No cache':d.kind==='treasure'?'Treasure recovered':'No dig'}</span>
     </li>)}</ol>:<p>Your finds appear here after every crew has sealed or the clock closes.</p>}
    </section>}
   </div>
  </div>
 </div>
}
