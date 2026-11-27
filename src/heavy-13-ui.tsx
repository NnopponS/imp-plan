import {useEffect,useState} from 'react'
import {base} from './brand'
import {heavy13Colors,heavy13Lock,heavy13Pass,heavy13Place,heavy13Rounds,heavy13Stands,heavy13Threshold,type Heavy13Color,type Heavy13Stand} from './heavy-13'
import type {Snapshot} from './room'
import './heavy-13.css'

const art=base+'art/'
const labels={red:'Red',green:'Green',blue:'Blue',rainbow:'Rainbow'}
const mark={red:'◆',green:'▲',blue:'●',rainbow:'✦'}
const colorArt=(color:Heavy13Color)=>art+'heavy13-stand-'+(color==='rainbow'?'wild':color)+'.svg'
const cubeArt=(value:number)=>art+'heavy13-cube-'+value+'.svg'
const nums=[0,1,2,3,4,5,6]

function Cube({value}:{value:number}){return <img className="h13-cube" src={cubeArt(value)} width="60" height="60" alt={String(value)}/>}
type Draft={round:number,value:number|null,color:Heavy13Color|null}
export function Heavy13Board({snap,active,name,submit}:{snap:Snapshot;active:boolean;name:(seat:string)=>string;submit:(action:number)=>void}){
 const v=snap.game!.heavy13!,mine=v.mine
 const [draft,setDraft]=useState<Draft>({round:0,value:null,color:null})
 const [pending,setPending]=useState<string|null>(null)
 const [clock,setClock]=useState(()=>performance.now()),[offset,setOffset]=useState(()=>snap.hostNow-performance.now())
 useEffect(()=>{const now=performance.now();setClock(now);setOffset(snap.hostNow-now)},[snap.hostNow])
 useEffect(()=>{
  if(v.deadline===null)return
  const timer=setInterval(()=>setClock(performance.now()),140)
  return ()=>clearInterval(timer)
 },[v.deadline])
 useEffect(()=>{
  if(pending===null)return
  const timer=setTimeout(()=>setPending(null),750)
  return ()=>clearTimeout(timer)
 },[pending])
 const phaseKey=v.round+':'+v.phase+':'+(v.slot??'-')
 const seconds=v.deadline===null?null:Math.max(0,Math.ceil((v.deadline-clock-offset)/1000))
 const available=active&&seconds!==0&&pending!==phaseKey
 const selecting=v.phase==='select'&&mine!==null&&mine.locked===null
 const action=available&&v.phase==='resolve'&&v.currentSeat===snap.you
 const pick=draft.round===v.round?draft:{round:v.round,value:null,color:null}
 const lockCode=pick.value===null||pick.color===null?-1:heavy13Lock(pick.value,pick.color)
 const send=(n:number)=>{if(available&&v.legal.includes(n)){setPending(phaseKey);submit(n)}}
 const spoken=v.phase==='finished'?'The table is closed.':
  !active?'Connection interrupted.':
  seconds===0?'Time is up. Waiting for the table.':
  pending===phaseKey&&mine?.locked==null?'Sending your choice.':
  v.phase==='select'?mine?.locked?'Locked privately. Pairs reveal together.':mine?'Choose one number and one color.':'Waiting for the reveal.':
  v.currentSeat===snap.you?v.returning?'Your call on the return. Place your cube.':'Your call. Place your cube or pass if available.':
  v.currentSeat?name(v.currentSeat)+'’s call.':'Waiting for the next call.'
 const displayed=v.phase==='finished'?[...v.scores].sort((a,b)=>a.penalty-b.penalty||(a.lastPenalty??-1)-(b.lastPenalty??-1)):v.scores
 return <section className="h13" aria-label="Heavy 13 table">
  <div className="h13-top"><div><strong>Round {v.round} / {heavy13Rounds}</strong><span>Hand {v.cycle} of 2</span></div>
   {seconds!==null&&<span className="h13-clock" role="timer" aria-label="Time remaining" data-urgent={seconds<=5||undefined}>{seconds} s</span>}
  </div>
  <p className="h13-status" role="status">{spoken}</p>
  <div className="h13-stands" aria-label="Shared stands">
   {heavy13Stands.map(stand=><Stand key={stand} stand={stand} pile={v.stands[stand]}
    onPlace={v.phase==='resolve'&&v.currentSeat===snap.you&&v.legal.includes(heavy13Place(stand))?()=>send(heavy13Place(stand)):undefined}
    canPlace={action}/>)}
  </div>
  {v.last?.kind==='place'&&v.last.penalty>0&&<p className="h13-event" aria-live="polite">{name(v.last.seat)} took {v.last.penalty} penalty {v.last.penalty===1?'cube':'cubes'} ({v.last.removed.join(', ')}).</p>}
  {v.phase==='select'&&mine&&<div className="h13-private">
   <div className="h13-private-head"><strong>Your private selection</strong><small>Only you can see it until reveal</small></div>
   {mine.locked?<div className="h13-locked"><Cube value={mine.locked.value}/><span data-color={mine.locked.color}>{mark[mine.locked.color]} {labels[mine.locked.color]}</span></div>:<>
    <p className="h13-field-label">01 · Number</p>
    <div className="h13-nums" role="group" aria-label="Your available number cards">
     {nums.map(value=><button className="h13-number" type="button" key={value} aria-label={'Number '+value}
      aria-pressed={pick.value===value} disabled={!selecting||!available||!mine.hand.values.includes(value)}
      onClick={()=>setDraft({...pick,value})}><Cube value={value}/></button>)}
    </div>
    <p className="h13-field-label">02 · Color</p>
    <div className="h13-colors" role="group" aria-label="Your available colors">
     {heavy13Colors.map(color=><button type="button" key={color} aria-label={labels[color]+', '+mine.hand.colors[color]+' left'}
      aria-pressed={pick.color===color} disabled={!available||mine.hand.colors[color]<=0} data-color={color}
      onClick={()=>setDraft({...pick,color})}><span aria-hidden="true">{mark[color]}</span><b>{labels[color]}</b><small>×{mine.hand.colors[color]}</small></button>)}
    </div>
    <button className="primary h13-confirm" type="button" disabled={!available||!v.legal.includes(lockCode)} onClick={()=>send(lockCode)}>Lock pair privately</button>
   </>}
  </div>}
  {v.reveal&&<div className="h13-reveal">
   <div className="h13-private-head"><strong>Placement order</strong>{v.phase==='resolve'&&v.currentSeat===snap.you&&
    <button type="button" disabled={!action||!v.legal.includes(heavy13Pass)} onClick={()=>send(heavy13Pass)}>Pass once</button>}</div>
   <ol aria-label="Placement order">{v.order.map(seat=>{
    const pair=v.reveal?.find(p=>p.seat===seat)
    if(!pair)return null
    return <li key={seat} data-active={v.currentSeat===seat||undefined}>
     <strong>{name(seat)}</strong><span data-color={pair.color}>{mark[pair.color]} {labels[pair.color]}</span><b>{pair.value}</b>
     {v.currentSeat===seat?<small>{v.returning?'Returning':'Called'}</small>:v.passed.includes(seat)?<small>Deferred</small>:null}
    </li>
   })}</ol>
   {v.passed.length>0&&<small>Return order: {[...v.passed].reverse().map(name).join(' → ')}</small>}
  </div>}
  <div className="h13-scores" aria-label="Penalty totals">
   {displayed.map(({seat,penalty,lastPenalty})=><div key={seat}>
    <div><strong>{name(seat)}</strong>{v.marker===seat&&<small> ◈ Marker</small>}</div>
    <b>{penalty} {penalty===1?'penalty':'penalties'}</b>
    {v.phase==='finished'&&<small>{lastPenalty===null?'Never penalized':'Last penalty at placement '+lastPenalty}</small>}
   </div>)}
  </div>
  {v.phase==='finished'&&!v.winner&&v.leaders.length>0&&<p className="h13-status">Shared lead: {v.leaders.map(name).join(', ')}.</p>}
 </section>
}

function Stand({stand,pile,onPlace,canPlace}:{stand:Heavy13Stand;pile:{cubes:number[],sum:number};onPlace?:()=>void;canPlace:boolean}){
 return <div className="h13-stand" role="group" aria-label={labels[stand]+' stand'} data-color={stand} data-called={!!onPlace||undefined}>
  <div className="h13-stand-head"><strong><span aria-hidden="true">{mark[stand]}</span> {labels[stand]}</strong><span>{pile.sum} / {heavy13Threshold}</span></div>
  <div className="h13-stack"><div className="h13-cubes" aria-label="Cubes on this stand">{pile.cubes.length?
   pile.cubes.map((n,i)=><Cube key={i} value={n}/>):<small>Empty</small>}</div>
   <img className="h13-plinth" src={colorArt(stand)} width="80" height="52" alt=""/>
  </div>
  {onPlace&&<button type="button" className="primary h13-place" disabled={!canPlace} onClick={onPlace}>Place on {labels[stand]}</button>}
 </div>
}

export function Heavy13Lesson({step}:{step:number}){
 const scoring=step>=5
 return <svg className="h13-lesson" role="img" aria-label="Heavy 13 scoring example" viewBox="0 0 380 160">
  <rect width="380" height="160" rx="8" fill="#25241f"/>
  <rect x="10" y="10" width="360" height="140" rx="5" fill="none" stroke="#9c8253"/>
  <text x="22" y="39" fill="#f7e5b1" fontSize="16" fontFamily="Georgia, serif">{scoring?'At 13, collect the old cubes':'Read the room before you lock'}</text>
  {scoring?<>{[4,0,6,3].map((n,i)=><image key={i} href={cubeArt(n)} x={22+49*i} y="52" width="42" height="42"/>)}
   <text x="22" y="128" fill="#ead7ad" fontSize="12">4 + 0 + 6 + 3 = 13 · take 3 penalties; keep the new 3</text></>:
   <>{heavy13Colors.map((c,i)=><image key={c} href={colorArt(c)} x={22+83*i} y="50" width="66" height="46"/>)}
    <text x="22" y="128" fill="#ead7ad" fontSize="12">Rainbow opens the queue and can use any stand</text></>}
 </svg>
}
