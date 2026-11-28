import {useEffect,useState} from 'react'
import {hitRules,type HitAction,type HitView} from './hit-stay'
import {HitCards,HitChip,HitFelt} from './hit-stay-art'

function useCountdown(deadline:number|null,hostNow:number,receivedAt:number|undefined,preview:boolean){
 const [clock,setClock]=useState(()=>performance.now())
 useEffect(()=>{
  if(deadline===null||preview||receivedAt===undefined)return
  const sample=()=>setClock(performance.now())
  sample()
  const interval=window.setInterval(sample,200)
  return ()=>window.clearInterval(interval)
 },[deadline,receivedAt,preview])
 const elapsed=receivedAt===undefined||preview?0:Math.max(0,clock-receivedAt)
 return Math.max(0,Math.ceil(((deadline??hostNow)-hostNow-elapsed)/1000))
}
const outcomes={playing:'Drawing',stayed:'Stayed',bust:'Bust',out:'Sitting out'}
type Props={view:HitView;you:string;name:(id:string)=>string;host?:boolean;active:boolean;preview?:boolean;hostNow:number;receivedAt?:number;submit:(action:HitAction)=>void}
export function HitStayBoard({view:v,you,name,host,active,preview=false,hostNow,receivedAt,submit}:Props){
 const seconds=useCountdown(v.deadline,hostNow,receivedAt,preview)
 const available=active&&!preview&&v.turn===you&&seconds>0
 const winners=v.reveal?.winners.map(name)??[]
 const leaders=v.leaders.map(name)
 return <section className="hit-stay" aria-label="Hit, Stay table" data-hit-phase={v.phase} data-hit-round={v.round}>
  <header className="hit-bar">
   <div><small>PLAY CHIPS ONLY</small><strong>Hand {v.round} / {hitRules.rounds}</strong></div>
   <div className="hit-bar-side">
    <div className="hit-value"><HitChip/><span>{v.phase==='turn'?v.pot:(v.reveal?.paid??0)} <small>{v.phase==='turn'?'in pot':'settled'}</small></span></div>
    {!preview&&active&&v.deadline!==null&&<span className="hit-clock" role="timer" aria-label="Turn clock">{seconds}s</span>}
   </div>
  </header>
  {v.phase==='turn'?<>
   <HitFelt>
    <div className="hit-target"><small>TABLE LIMIT</small><strong>{hitRules.target}</strong></div>
    <div className="hit-deal">
     <span role="status">{preview?'Example hand':v.turn===you?'Your turn':name(v.turn!)+' to play'}</span>
     {v.mine?<div className="hit-private" role="group" aria-label="Your private hand"><HitCards cards={v.mine.cards}/><span className="hit-total"><small>Your total</small><strong>{v.mine.total}</strong></span></div>:<p>You are sitting this hand out.</p>}
    </div>
    <div className="hit-controls">
     <button type="button" disabled={!available} onClick={()=>submit('hit')}>Hit</button>
     <button type="button" disabled={!available} onClick={()=>submit('stay')}>Stay</button>
    </div>
   </HitFelt>
   <ul className="hit-roster" aria-label="Chip stacks">{v.seats.map((s,i)=><li key={s.id} data-hit-turn={s.id===v.turn||undefined}>
    <div className="hit-seat-label"><span className="hit-number">{String(i+1).padStart(2,'0')}</span><strong title={name(s.id)}>{name(s.id)}</strong><span className="hit-value"><HitChip/>{s.chips}</span></div>
    <div className="hit-seat-detail"><small>{outcomes[s.status]}</small>{s.id!==you&&<HitCards count={s.count}/>}</div>
   </li>)}</ul>
  </>:<>
   <HitFelt><div className="hit-announcement" role="status">
    <small>{v.phase==='finished'?'FINAL STACKS':'HAND REVEALED'}</small>
    <strong>{v.phase==='finished'?(leaders.length===1?leaders[0]+' wins':'Shared lead'):(winners.length===0?'All bust. Antes returned.':winners.length===1?winners[0]+' takes the pot':'Pot split')}</strong>
    <span>{v.phase==='finished'?leaders.join(' · '):winners.length>1?winners.join(' · '):winners.length===0?'No hand stayed at or below 21':'Highest total at or below 21'}</span>
   </div></HitFelt>
   {v.phase==='review'&&(host?<button className="hit-deal-next" type="button" disabled={!active||preview} onClick={()=>submit('deal')}>Deal next hand</button>:<p className="hit-wait">The next hand is dealt automatically.</p>)}
   <section className="hit-reveal" aria-label="Revealed hands">{v.seats.map(seat=>{
    const s=v.reveal?.rows.find(row=>row.id===seat.id)
    return <div className="hit-reveal-row" key={seat.id} data-hit-winner={v.reveal?.winners.includes(seat.id)||undefined}>
     <div><strong>{name(seat.id)}</strong><span className="hit-value"><HitChip/>{seat.chips} <small>chips</small></span></div>
     {s?<div><HitCards cards={s.cards}/><span>{s.status==='bust'?'Bust · ':''}{s.total}</span></div>:<small>Sat out</small>}
    </div>
   })}</section>
  </>}
 </section>
}
