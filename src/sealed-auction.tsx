import {useEffect,useId,useState} from 'react'
import {reward} from './engine'
import type {Snapshot} from './room'
import './sealed-auction.css'

const exact=new Intl.NumberFormat('en',{maximumFractionDigits:3})
const presets=[1,5,10,15]
const bankCapacity=60

export function SealedAuction({snap,active,submit}:{snap:Snapshot;active:boolean;submit:(v:number)=>void}){
 const g=snap.game!
 const [bid,setBid]=useState('1'),[remaining,setRemaining]=useState(0)
 const grain=useId()
 useEffect(()=>{
  if(g.deadline===null)return
  const started=performance.now()
  const refresh=()=>setRemaining(Math.max(0,Math.ceil((g.deadline!-snap.hostNow-performance.now()+started)/1000)))
  refresh()
  const timer=window.setInterval(refresh,150)
  return ()=>window.clearInterval(timer)
 },[g.deadline,snap.hostNow])
 const own=g.seats.indexOf(snap.you)
 const bankMs=g.credits[own]??0
 const maxMs=Math.min(15000,bankMs)
 const balance=bankMs/1000,limit=maxMs/1000
 const amount=Math.round(Number(bid)*1000)
 const canBid=active&&own>=0&&remaining>0&&g.mine===null
 const valid=canBid&&bid!==''&&Number.isInteger(amount)&&amount>=0&&amount<=maxMs
 return <section className="sealed-auction" aria-label="Sealed Time Auction">
  <header className="auction-top">
   <strong>Sealed round {g.round} / 8</strong><span className="pill">{reward(g.round)} points</span>
   <span className="mono" aria-label="Time remaining">{g.done?'Closed':remaining+' s'}</span>
  </header>
  {!g.done&&own>=0&&<div className="sealed-instrument">
   <div className="sealed-bank">
    <div className="sealed-bank-label"><span>Your time bank</span><strong>{exact.format(balance)} s</strong><span>{g.submitted}/{g.seats.length} locked</span></div>
    <div role="meter" aria-label="Your time bank" aria-valuemin={0} aria-valuemax={bankCapacity} aria-valuenow={balance} aria-valuetext={exact.format(balance)+' seconds remaining'}>
     <svg viewBox="0 0 302 23" aria-hidden="true">
      <defs><pattern id={grain} width="6" height="6" patternUnits="userSpaceOnUse"><path d="M-2 2l4-4M0 6l6-6m-2 8 4-4" stroke="#734524" strokeWidth="1" opacity=".44"/></pattern></defs>
      <path d="M7 2h288l5 5v9l-5 5H7l-5-5V7z" fill="#181512" stroke="#a37e54"/>
      <path d="M12 6h278v11H12z" fill="#48382c"/>
      <rect x="12" y="6" width={278*balance/bankCapacity} height="11" fill="#e1b879"/>
      <rect x="12" y="6" width={278*balance/bankCapacity} height="11" fill={'url(#'+grain+')'}/>
      <path d="M81.5 7v9m69.5-9v9m69.5-9v9" stroke="#372820" strokeWidth="1.35"/>
     </svg>
    </div>
   </div>
   {g.mine!==null?<p role="status">Your bid is locked: {exact.format(g.mine/1000)} s</p>:<form className="sealed-bid" onSubmit={e=>{e.preventDefault();if(valid)submit(amount)}}>
    <div role="group" aria-label="Quick bids" className="sealed-presets">
     {presets.map(seconds=><button key={seconds} type="button" disabled={!canBid||seconds>limit} aria-label={'Set bid to '+seconds+' seconds'} aria-pressed={bid!==''&&Number(bid)===seconds} onClick={()=>setBid(String(seconds))}>{seconds}<small> s</small></button>)}
    </div>
    <label>Bid (seconds)<input type="number" inputMode="decimal" step="0.001" min="0" max={limit} value={bid} onChange={e=>setBid(e.target.value)} required/></label>
    <button className="primary" disabled={!valid}>Lock bid</button><button type="button" disabled={!canBid} onClick={()=>submit(0)}>Pass</button>
   </form>}
  </div>}
  <div className="scores">{g.seats.map((s,i)=><div key={s}><span>{snap.seats.find(x=>x.id===s)?.name}</span><strong>{exact.format(g.scores[i])} pts</strong>{g.last&&<small>Last bid {exact.format(g.last[i]/1000)} s</small>}</div>)}</div>
 </section>
}
