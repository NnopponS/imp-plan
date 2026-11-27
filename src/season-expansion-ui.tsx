import React,{useEffect,useState} from 'react'
import {buyer,candidates,contactAction,guessAction,ticketNames} from './secret'
import type {Snapshot} from './room'
export {BaghBoard} from './bagh-ui'
export function SecretBoard({snap,active,submit,name}:{snap:Snapshot,active:boolean,submit:(a:number)=>void,name:(s:string)=>string}){
 const g=snap.game!,v=g.secret!,i=g.seats.indexOf(snap.you)
 const [other,setOther]=useState('')
 const [ticket,setTicket]=useState(0)
 const [own,setOwn]=useState('')
 const [aSeat,setASeat]=useState('')
 const [bSeat,setBSeat]=useState('')
 const [a,setA]=useState('')
 const [b,setB]=useState('')
 const [now,setNow]=useState(Date.now())
 const [offset,setOffset]=useState(()=>snap.hostNow-Date.now())
 useEffect(()=>{setOffset(snap.hostNow-Date.now())},[snap.hostNow])
 useEffect(()=>{const t=setInterval(()=>setNow(Date.now()),200);return()=>clearInterval(t)},[])
 const options=g.seats.flatMap((s,k)=>i===k?[]:[<option key={s} value={k}>{name(s)}</option>])
 const seconds=Math.max(0,Math.ceil(((g.deadline??now)-now-offset)/1000))
 const valid=(s:string)=>/^\d{1,3}$/.test(s)&&Number(s)>=1&&Number(s)<=100
 const q=candidates(v.clues)
 return <div>
  <div className="auction-top"><strong>{v.phase==='contact'?'Contact '+g.round+' / 4':'Final guesses'}</strong><span className="pill">{g.done?'Finished':seconds+' s'}</span></div>
  {!g.done&&v.phase==='contact'&&<>
   <p>Your tickets: {ticketNames.map((n,j)=>n+' '+v.tickets[j]).join(' · ')}. Chips: {v.chips}.</p>
   <form className="actions" onSubmit={e=>{e.preventDefault();if(active&&other!=='')submit(contactAction(i,Number(other),ticket))}}>
    <label>Contact player<select aria-label="Contact player" value={other} onChange={e=>setOther(e.target.value)}><option value="">Choose a player</option>{options}</select></label>
    <label>Ticket<select aria-label="Ticket" value={ticket} onChange={e=>setTicket(Number(e.target.value))}>{ticketNames.map((n,j)=><option key={n} value={j}>{n}</option>)}</select></label>
    <button type="submit" disabled={!active||other===''||!v.tickets[ticket]||v.used.includes(Number(other))}>Offer contact</button>
    <button type="button" disabled={!active||v.chips<2} onClick={()=>submit(buyer)}>Buy ticket set (2 chips)</button>
   </form>
   {v.offers.map(o=><p key={o.from+':'+o.to}>{o.to===i?<>{name(g.seats[o.from])} offers {ticketNames[o.ticket]}. <button type="button" disabled={!active||!v.tickets[o.ticket]} onClick={()=>submit(contactAction(i,o.from,o.ticket))}>Accept {ticketNames[o.ticket]} from {name(g.seats[o.from])}</button></>:'Awaiting '+name(g.seats[o.to])+' on '+ticketNames[o.ticket]+'.'}</p>)}
  </>}
  {!g.done&&v.phase==='guess'&&<>{v.locked?<p role="status">Guesses locked · {v.submitted}/{g.seats.length} submitted.</p>:<form className="actions" onSubmit={e=>{
   e.preventDefault()
   if(!active||!valid(own)||aSeat!==''&&!valid(a)||bSeat!==''&&!valid(b)||aSeat!==''&&aSeat===bSeat)return
   submit(guessAction(Number(own),aSeat===''?null:[Number(aSeat),Number(a)],bSeat===''?null:[Number(bSeat),Number(b)]))
  }}>
   <label>Your number<input inputMode="numeric" maxLength={3} value={own} onChange={e=>setOwn(e.target.value)}/></label>
   <label>First optional player<select value={aSeat} onChange={e=>setASeat(e.target.value)}><option value="">Skip</option>{options}</select></label>
   {aSeat!==''&&<label>First guess<input inputMode="numeric" maxLength={3} value={a} onChange={e=>setA(e.target.value)}/></label>}
   <label>Second optional player<select value={bSeat} onChange={e=>setBSeat(e.target.value)}><option value="">Skip</option>{options}</select></label>
   {bSeat!==''&&<label>Second guess<input inputMode="numeric" maxLength={3} value={b} onChange={e=>setB(e.target.value)}/></label>}
   <button type="submit" className="primary" disabled={!active||!valid(own)||aSeat!==''&&!valid(a)||bSeat!==''&&!valid(b)||aSeat!==''&&aSeat===bSeat}>Lock guesses</button>
  </form>}</>}
  <section className="secret-notebook"><h3>Private notebook</h3>{v.clues.length?<ul>{v.clues.map(c=><li key={c.round+':'+c.other}>Round {c.round} · {name(g.seats[c.other])} · {ticketNames[c.ticket]} = <strong>{c.result}</strong></li>)}</ul>:<p>No contacts yet.</p>}
   <details><summary>{q.length} possible own numbers before considering all players jointly</summary><p>{q.join(', ')||'None'}</p></details></section>
  {v.reveal&&<div className="scores">{g.seats.map((s,j)=><div key={s}><span>{name(s)}</span><strong>{g.scores[j]} points</strong><small>Number: {v.reveal![j]}</small></div>)}</div>}
 </div>
}
