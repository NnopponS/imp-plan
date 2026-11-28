import {useState} from 'react'
import type {BigSmallAction,BigSmallDirection,BigSmallView} from './big-small'
import './big-small.css'

type Props={view:BigSmallView;you:string;name:(id:string)=>string;active:boolean;submit:(action:BigSmallAction)=>void}
const directions=['big','small'] as const
const title=(value:string)=>value[0].toUpperCase()+value.slice(1)
const signed=(value:number)=>value>0?'+'+value:value<0?'−'+(-value):'0'

function CardFace({value,back=false}:{value?:number;back?:boolean}){
 return <svg viewBox="0 0 64 86" aria-hidden="true" focusable="false" className="bs-card-face" data-back={back||undefined}>
  <rect x="2" y="2" width="60" height="82" rx="7" className="bs-card-stock"/>
  <rect x="6" y="6" width="52" height="74" rx="4" className="bs-card-frame"/>
  <path d="M11 22v-9h9m24 0h9v9m0 42v9h-9m-24 0h-9v-9M10 43h4m36 0h4" className="bs-card-marks"/>
  {back?<><path d="m32 19 16 24-16 24-16-24zM32 25l12 18-12 18-12-18zM25 43l7-10 7 10-7 10z" className="bs-card-marks"/><circle cx="32" cy="43" r="2" className="bs-card-medallion"/></>:
   value===undefined?<path d="M23 43h18" className="bs-card-marks"/>:<text x="32" y="53" textAnchor="middle" className="bs-card-value">{value}</text>}
 </svg>
}
function Disc({className}:{className?:string}){
 return <svg className={className} width="25" height="25" viewBox="0 0 32 32" aria-hidden="true" focusable="false"><circle cx="16" cy="16" r="14" fill="currentColor" fillOpacity=".15" stroke="currentColor"/><circle cx="16" cy="16" r="10" fill="none" stroke="currentColor" strokeDasharray="1 2.4"/><path d="m16 9 5 7-5 7-5-7z" fill="currentColor" fillOpacity=".55"/></svg>
}

function Choice({value,select}:{value:BigSmallDirection|null;select:(side:BigSmallDirection)=>void}){
 return <div className="bs-direction" role="group" aria-label="Direction">{directions.map(side=><button key={side} type="button" aria-pressed={value===side} onClick={()=>select(side)}>
  <span aria-hidden="true">{side==='big'?'↑':'↓'}</span>{title(side)}
 </button>)}</div>
}
function Controls({view:v,submit,disabled}:{view:BigSmallView;submit:Props['submit'];disabled:boolean}){
 const sealing=v.phase==='seal'
 const [card,setCard]=useState<number|null>(null)
 const [side,setSide]=useState<BigSmallDirection|null>(null)
 const [stake,setStake]=useState(Math.min(1,v.maxStake))
 const enabled=side!==null&&(!sealing||card!==null)
 function post(){
  if(!side||disabled)return
  if(sealing&&card!==null)submit({kind:'seal',card,call:side})
  if(!sealing)submit({kind:'predict',prediction:side,stake})
 }
 return <fieldset className="bs-controls" disabled={disabled}>
  <legend>{sealing?'Your sealed play':'Your prediction'}</legend>
  {sealing?<div className="bs-hand" role="group" aria-label="Available cards">
   {v.ownCards.map(n=><button key={n} type="button" aria-label={'Card '+n} aria-pressed={card===n} data-bs-card={n} onClick={()=>setCard(n)}><CardFace value={n}/></button>)}
  </div>:<div className="bs-stakes" role="group" aria-label="Fictional chip stake">
   {Array.from({length:Math.max(1,v.maxStake)},(_,i)=>v.maxStake===0?0:i+1).map(n=><button key={n} type="button" aria-pressed={stake===n} onClick={()=>setStake(n)}><Disc/>{n} {n===1?'chip':'chips'}</button>)}
  </div>}
  <div className="bs-actions"><Choice value={side} select={setSide}/><button type="button" className="primary bs-submit" disabled={!enabled} onClick={post}>{sealing?'Seal card':'Reveal comparison'}</button></div>
 </fieldset>
}

const outcomes={big:'Bigger',small:'Smaller',equal:'Equal'}
const finishes={'stack-empty':'A stack is empty.','round-limit':'The eighteen-round set is complete.',tiebreak:'The two-round tiebreak is complete.',draw:'Both stacks are still equal after the tiebreak.'}
export function BigSmallBoard({view:v,you,name,active,submit}:Props){
 const ownTurn=v.phase==='seal'?you===v.duelist:v.phase==='predict'&&you===v.bettor
 const latest=v.latest
 const duelName=name(v.duelist??''),betName=name(v.bettor??'')
 const status=!active&&!latest?'Controls paused.':v.phase==='seal'?ownTurn?'Choose an unused card, then call its direction.':duelName+' is sealing a card.':
  v.phase==='predict'?ownTurn?'Predict whether the hidden card is bigger or smaller.':betName+' is predicting.':
  v.phase==='finished'?(v.winner?name(v.winner)+' wins. ':'The match is drawn. ')+finishes[v.end!]:
  v.tiePending?'Tied stacks. Play a fresh two-round tiebreak with the other seat opening.':outcomes[latest!.relation]+' card. Compare the two chip changes below.'
 return <section className="bs-table" aria-label="Big Small table" data-bs-phase={v.phase}>
  <header className="bs-header"><span>{v.set==='tiebreak'?'Tiebreak':'The comparison table'}</span><b>Round {v.round} / {v.totalRounds}</b></header>
  <ol className="bs-stacks" aria-label="Chip stacks">{v.seats.map((seat,i)=><li data-bs-stack key={seat}>
   <Disc/><span><strong>{name(seat)}</strong><small>{seat===v.duelist?'Duelist':'Bettor'}{seat===you?' · You':''}</small></span><b>{v.chips[i]} {v.chips[i]===1?'chip':'chips'}</b>
  </li>)}</ol>
  <div className="bs-comparison">
   <figure><CardFace value={v.reference??undefined}/><figcaption data-bs-reference={v.reference}>Reference <b>{v.reference}</b></figcaption></figure>
   <svg className="bs-axis" viewBox="0 0 44 80" aria-hidden="true" focusable="false"><path d="M22 4v17m-6-11 6-6 6 6m-6 49v17m-6-6 6 6 6-6M14 34h16m-16 12h16" fill="none" stroke="currentColor" strokeWidth="1.65"/></svg>
   <figure><CardFace value={latest?.card} back={v.sealed}/><figcaption data-bs-revealed={latest?.card}>{latest?<>Played <b>{latest.card}</b></>:v.sealed?'Face down':'Not selected'}</figcaption></figure>
  </div>
  <p className="bs-status" role="status" aria-atomic="true">{status}</p>
  {v.ownSeal&&<p className="bs-seal-receipt" data-bs-own-seal>Your sealed card: <b>{v.ownSeal.card}</b> · {title(v.ownSeal.call)} call</p>}
  {ownTurn&&<Controls key={v.step} view={v} disabled={!active} submit={submit}/>}
  {latest&&<div className="bs-settlement">
   <p><strong>{duelName}</strong><span>Called {title(latest.call)}</span><b>{signed(latest.duelistDelta)}</b></p>
   <p><strong>{betName}</strong><span>Predicted {title(latest.prediction)} · {latest.stake} {latest.stake===1?'chip':'chips'}</span><b>{signed(latest.bettorDelta)}</b></p>
  </div>}
  {v.phase==='reveal'&&v.seats.includes(you)&&<button type="button" className="primary bs-next" disabled={!active} onClick={()=>submit({kind:'advance'})}>{v.tiePending?'Start tiebreak':'Next round'}</button>}
  {v.history.length>0&&<details className="bs-ledger"><summary>Round ledger ({v.history.length})</summary><ol>{[...v.history].reverse().map(r=><li key={r.set+r.round}>
   <span>{r.set==='tiebreak'?'Tiebreak':'Round'} {r.round}</span><span>{r.card} vs {r.reference} · {outcomes[r.relation]}</span>
  </li>)}</ol></details>}
  <p className="bs-fiction">Fictional chips only. No money or prizes.</p>
 </section>
}

const examples=[
 'The dealer turns a reference card face up. Here it is 4.',
 'The duelist seals an unused card and a Big or Small call.',
 'The bettor predicts the comparison and sets aside up to three chips.',
 'Here 7 beats 4. The duelist’s Big call earns three and the bettor’s correct Big prediction earns two.',
 'If the regular stacks tie, reset to ten chips and play one round in each role with the other seat opening.',
]
export function BigSmallLesson({step}:{step:number}){
 const n=Math.max(0,Math.min(examples.length-1,Math.trunc(step)||0))
 return <figure className="bs-lesson" data-bs-example={n}>
  {n===4?<div><div><Disc/><small>10 chips</small></div><span aria-hidden="true">⇄</span><div><Disc/><small>10 chips</small></div></div>:
   <div><CardFace value={4}/><span aria-hidden="true">{n===0?'·':n===3?'<':'?'}</span><CardFace value={n===3?7:undefined} back={n===1||n===2}/>{n>=2&&<div><Disc/><small>{n===3?'+2':'2'}</small></div>}</div>}
  <figcaption>{examples[n]}</figcaption>
 </figure>
}
