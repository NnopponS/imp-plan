import {useEffect,useId,useState} from 'react'
import {reward} from './engine'
import type {Snapshot} from './room'
import './sealed-auction.css'

const exact=new Intl.NumberFormat('en',{maximumFractionDigits:3})
const presets=[1,5,10,15]
const bankCapacity=60

function BankEngraving({balance}:{balance:number}){
 const grain=useId(),sand=useId(),bezel=useId()
 const marks=[70,105,140,175,210,245,280]
 return <svg viewBox="0 0 310 52" aria-hidden="true" className="sealed-dial">
  <defs>
   <pattern id={grain} width="9" height="6" patternUnits="userSpaceOnUse"><path d="M-2 4C1 4 3 3 7 1m-5 6 6-2m1-4 3-1" fill="none" stroke="#e3ad6a" strokeWidth=".55" opacity=".33"/></pattern>
   <pattern id={sand} width="7" height="4" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r=".5" fill="#805b30"/><circle cx="4" cy="3" r=".4" fill="#936732"/><path d="M5 1h2" stroke="#fff0b9" opacity=".72" strokeWidth=".5"/></pattern>
   <linearGradient id={bezel} x2="0" y2="1"><stop stopColor="#765034"/><stop offset=".5" stopColor="#4c3021"/><stop offset="1" stopColor="#2d2019"/></linearGradient>
  </defs>
  <path d="m12 1 286 1 10 9-1 30-9 9H11L2 41 3 11Z" fill={'url(#'+bezel+')'} stroke="#c39659"/>
  <path d="M12 4h285l8 9v26l-9 8H13l-8-7V13Z" fill={'url(#'+grain+')'} stroke="#a77846" strokeWidth=".65"/>
  <path d="M15 8q144 2 280 0m-280 35q143-2 282-1" fill="none" stroke="#d4a46a" strokeOpacity=".63" strokeWidth=".65"/>
  <path d="M61 18l7-4h215l9 4v16l-8 5H68l-7-5Z" fill="#281c16" stroke="#d1a163"/>
  <path d="M70 21h210v11H70z" fill="#433123" stroke="#a1794d" strokeWidth=".7"/>
  <rect data-auction-sand x="70" y="21" width={210*balance/bankCapacity} height="11" fill="#edc77d"/>
  <rect x="70" y="21" width={210*balance/bankCapacity} height="11" fill={'url(#'+sand+')'}/>
  {marks.map((x,i)=><path key={x} d={`M${x} 19v${i%3===0?15:6}m0 10v4`} stroke="#624021" strokeWidth={i%3===0?'.9':'.7'}/>)}
  <path d="m296 13 6 1m-3 23 3 1M9 13l4 1m-4 23 4 1" fill="none" stroke="#e3bd82" strokeWidth="1.1"/>
  <g data-engraved-hourglass fill="none" stroke="#f2c984" strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round">
   <path d="M26 10q9 1 20 0m-21 31h22m-20-28h18m-17 25h16M29 14c.3 6 2.8 8.6 6.6 11.6-4.9 3.9-7.2 7.4-6.7 11.4m13.8-23c-.7 6.5-3 8.8-6.9 11.6 4.2 3.4 6.8 6.4 7.1 11.4"/>
   <path d="m32 18 4 5 4-5m-7 16 3-4 4 4z" fill="#f7cd87" strokeWidth=".65"/>
   <path d="M20 14v23m31-23v23m-32-1 1 4 2-4m27-21 2-4 2 4" stroke="#bb8b5e" strokeWidth=".75"/>
  </g>
 </svg>
}

export function SealedAuction({snap,active,submit}:{snap:Snapshot;active:boolean;submit:(v:number)=>void}){
 const g=snap.game!
 const [bid,setBid]=useState('1'),[remaining,setRemaining]=useState(0)
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
     <BankEngraving balance={balance}/>
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
