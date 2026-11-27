import React,{useEffect,useState} from 'react'
import {buyer,candidates,contactAction,guessAction,ticketNames} from './secret'
import {PactChoices,SeatMark,TicketMark,type PactChoice} from './pact-tokens'
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
 const colors=['#754a45','#4b6658','#5b6381','#805d34']
 const seated=active&&i>=0&&!g.done
 const seats=(blocked:(k:number)=>boolean=()=>false):PactChoice[]=>g.seats.flatMap((s,k)=>k===i?[]:[{
  value:String(k),label:name(s),face:name(s),disabled:blocked(k),art:<SeatMark seat={k} color={colors[k%colors.length]}/>
 }])
 const tickets: PactChoice[]=ticketNames.map((n,j)=>({
  value:String(j),label:n+', '+(v.tickets[j]??0)+' available',face:['Sum','Last digit','Quotient','Difference'][j],
  count:v.tickets[j]??0,disabled:!v.tickets[j],art:<TicketMark ticket={j}/>
 }))
 const skipped:PactChoice={value:'',label:'Skip',face:'Skip',art:<SeatMark seat={-1}/>}
 const seconds=Math.max(0,Math.ceil(((g.deadline??now)-now-offset)/1000))
 const valid=(s:string)=>/^\d{1,3}$/.test(s)&&Number(s)>=1&&Number(s)<=100
 const q=candidates(v.clues)
 const to=Number(other)
 const canOffer=seated&&other!==''&&to>=0&&to<g.seats.length&&to!==i&&!!v.tickets[ticket]&&!v.used.includes(to)&&!v.offers.some(o=>o.from===i&&o.to===to&&o.ticket===ticket)
 const canGuess=seated&&valid(own)&&!(aSeat!==''&&!valid(a))&&!(bSeat!==''&&!valid(b))&&!(aSeat!==''&&aSeat===bSeat)
 return <div>
  <div className="auction-top"><strong>{v.phase==='contact'?'Contact '+g.round+' / 4':'Final guesses'}</strong><span className="pill">{g.done?'Finished':seconds+' s'}</span></div>
  {!g.done&&v.phase==='contact'&&<section className="pact-board" data-pact="secret" aria-label="Contact desk">
   <header><h3>Contact desk</h3><strong className="pact-tally">Chips: {v.chips}</strong></header>
   <form onSubmit={e=>{e.preventDefault();if(canOffer)submit(contactAction(i,to,ticket))}}>
    <PactChoices label="Contact player" kind="seats" choices={seats(k=>v.used.includes(k))} value={other} choose={setOther} disabled={!seated}/>
    <PactChoices label="Ticket" kind="tickets" choices={tickets} value={String(ticket)} choose={value=>setTicket(Number(value))} disabled={!seated}/>
    <div className="pact-actions">
     <button type="submit" className="primary" disabled={!canOffer}>Offer contact</button>
     <button type="button" disabled={!seated||v.chips<2} onClick={()=>submit(buyer)}>Buy ticket set (2 chips)</button>
    </div>
   </form>
   {v.offers.length>0&&<div className="pact-offers" aria-label="Contact offers">{v.offers.map(o=>o.to===i?
    <button className="pact-offer-button" key={o.from+':'+o.to} type="button" disabled={!seated||!v.tickets[o.ticket]} onClick={()=>submit(contactAction(i,o.from,o.ticket))}>
     <TicketMark ticket={o.ticket}/> Accept {ticketNames[o.ticket]} from {name(g.seats[o.from])}
    </button>:<span className="pact-thread" key={o.from+':'+o.to}><TicketMark ticket={o.ticket}/> Awaiting {name(g.seats[o.to])} · {ticketNames[o.ticket]}</span>)}</div>}
  </section>}
  {!g.done&&v.phase==='guess'&&<>{v.locked?<p role="status">Guesses locked · {v.submitted}/{g.seats.length} submitted.</p>:<section className="pact-board" data-pact="secret" aria-label="Final guesses">
   <form onSubmit={e=>{
    e.preventDefault()
    if(canGuess)submit(guessAction(Number(own),aSeat===''?null:[Number(aSeat),Number(a)],bSeat===''?null:[Number(bSeat),Number(b)]))
   }}>
    <label className="pact-guess-number">Your number<input inputMode="numeric" maxLength={3} value={own} onChange={e=>setOwn(e.target.value)} disabled={!seated}/></label>
    <details className="pact-guess-option" open={aSeat!==''||undefined}><summary>First optional guess{aSeat!==''?' · '+name(g.seats[Number(aSeat)]):''}</summary>
     <PactChoices label="First optional player" kind="seats" choices={[skipped,...seats(k=>bSeat===String(k))]} value={aSeat} choose={setASeat} disabled={!seated}/>
     {aSeat!==''&&<label className="pact-guess-number">First guess<input inputMode="numeric" maxLength={3} value={a} onChange={e=>setA(e.target.value)}/></label>}
    </details>
    <details className="pact-guess-option" open={bSeat!==''||undefined}><summary>Second optional guess{bSeat!==''?' · '+name(g.seats[Number(bSeat)]):''}</summary>
     <PactChoices label="Second optional player" kind="seats" choices={[skipped,...seats(k=>aSeat===String(k))]} value={bSeat} choose={setBSeat} disabled={!seated}/>
     {bSeat!==''&&<label className="pact-guess-number">Second guess<input inputMode="numeric" maxLength={3} value={b} onChange={e=>setB(e.target.value)}/></label>}
    </details>
    <div className="pact-actions"><button type="submit" className="primary" disabled={!canGuess}>Lock guesses</button></div>
   </form>
  </section>}</>}
  <section className="secret-notebook" aria-label="Private notebook"><h3>Private notebook</h3>{v.clues.length?<ul>{v.clues.map(c=><li key={c.round+':'+c.other}>Round {c.round} · {name(g.seats[c.other])} · {ticketNames[c.ticket]} = <strong>{c.result}</strong></li>)}</ul>:<p>No contacts yet.</p>}
   <details><summary>{q.length} possible own numbers before considering all players jointly</summary><p>{q.join(', ')||'None'}</p></details></section>
  {v.reveal&&<div className="scores">{g.seats.map((s,j)=><div key={s}><span>{name(s)}</span><strong>{g.scores[j]} points</strong><small>Number: {v.reveal![j]}</small></div>)}</div>}
 </div>
}
