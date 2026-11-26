import React,{useEffect,useRef,useState} from 'react'
import type {Snapshot} from './room'
import type {TourSize} from './season-two'
function Clock({snap}:{snap:Snapshot}){
 const [now,setNow]=useState(Date.now())
 const offset=useRef(0)
 useEffect(()=>{offset.current=snap.hostNow-Date.now()},[snap])
 useEffect(()=>{const t=setInterval(()=>setNow(Date.now()),200);return()=>clearInterval(t)},[])
 const seconds=Math.max(0,Math.ceil(((snap.game!.deadline??now)-now-offset.current)/1000))
 return <span className="pill">{snap.game!.done?'Finished':Math.floor(seconds/60)+':'+String(seconds%60).padStart(2,'0')}</span>
}
export function SeasonTwo({snap,active,submit,name}:{snap:Snapshot,active:boolean,submit:(n:number)=>void,name:(s:string)=>string}){
 const g=snap.game!
 const [focus,setFocus]=useState(0)
 const refs=useRef<Array<HTMLButtonElement|null>>([])
 const sz=g.size as TourSize
 if(g.game==='remove')return <div>
  <div className="auction-top"><strong>Round {g.round} {g.round>8?'· Tiebreak':'/ 8'}</strong><Clock snap={snap}/></div>
  {!g.done&&<><p>{g.mine!==null?'Choice locked. Waiting for the reveal.':'Choose the card to discard.'} {g.submitted}/{g.seats.length} locked.</p><div className="remove-cards">
   {g.hand.map((c,i)=><button type="button" key={c.id} disabled={!active||g.mine!==null} className={g.mine===i?'discarded':''} onClick={()=>submit(i)} aria-label={`Discard ${c.value}, card ${i+1}`}><span>{c.value}</span><small>{g.mine===i?'Discarded':'Discard'}</small></button>)}
  </div></>}
  {g.reveal&&<p role="status">Round {g.reveal.round}: {g.reveal.winner?name(g.reveal.winner)+' wins 2 chips':'no unique card'}.</p>}
  <div className="scores">{g.seats.map((s,i)=><div key={s}><span>{name(s)}</span><strong>{g.scores[i]} chips</strong>{g.last&&<small>{g.last[i]?'Kept '+g.last[i]:'No submission'}</small>}</div>)}</div>
 </div>
 return <div>
  <div className="auction-top"><strong>{sz} × {sz} · {g.closed?'Closed tour':'Open tour'}</strong><Clock snap={snap}/></div>
  <p>{g.path.length} / {sz*sz} visited. {g.legal.filter(x=>x!==-1).length===0&&!g.done?'No legal step from here. Undo to try another route.':'Follow the outlined knight moves.'}</p>
  <div className="tour-board" style={{gridTemplateColumns:`repeat(${sz}, minmax(0, 1fr))`}} aria-label="Knight’s Tour board">
   {Array.from({length:sz*sz},(_,i)=>{
    const ordinal=g.path.indexOf(i)+1
    const legal=g.legal.includes(i)&&active
    const position=String.fromCharCode(65+(i%sz))+(Math.floor(i/sz)+1)
    return <button key={i} type="button" tabIndex={i===focus?0:-1} ref={e=>{refs.current[i]=e}} aria-disabled={!legal} aria-label={position+(i===g.path.at(-1)?', knight':ordinal?', visited '+ordinal:legal?', legal move':'')} className={`${(i+Math.floor(i/sz)*(sz%2===0?1:0))%2?'shade':''} ${legal?'legal':''} ${ordinal?'visited':''}`} onFocus={()=>setFocus(i)} onClick={()=>{if(legal)submit(i)}} onKeyDown={e=>{
      const offsets:Record<string,number>={ArrowLeft:-1,ArrowRight:1,ArrowUp:-sz,ArrowDown:sz}
      if(e.key in offsets){e.preventDefault();refs.current[Math.max(0,Math.min(sz*sz-1,i+offsets[e.key]))]?.focus()}
     }}>{i===g.path.at(-1)?'♞':ordinal||''}</button>
   })}
  </div>
  <button type="button" disabled={!active||!g.legal.includes(-1)} onClick={()=>submit(-1)}>Undo step</button>
  {g.seats.length>1&&<div className="scores">{g.seats.map((s,i)=><div key={s}><span>{name(s)}</span><strong>{g.scores[i]} visited (best)</strong></div>)}</div>}
 </div>
}
