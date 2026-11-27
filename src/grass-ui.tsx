import React,{useState} from 'react'
import {canPlace,footprint,grassRank,orient,placeCode,redraw,tradeAccept,tradeCode,tradeDecline,tradeDone,type Grass} from './grass'
import type {GameView} from './engine'
import {CoinMark,PactChoices,SeatMark} from './pact-tokens'
import './grass.css'
const palette=['#1a604c','#a33f48','#374798','#9a552a','#4c6139','#723c89','#236181','#903956','#6d562b','#55506e','#30696e','#59621c','#7c3d34','#415c7c','#764c74','#55534b']
const mark=(i:number)=>String.fromCharCode(65+i)
export function GrassBoard({g,you,active,name,submit}:{g:GameView;you:string;active:boolean;name:(id:string)=>string;submit:(a:number)=>void}){
 const s=g.grass as Grass,i=g.seats.indexOf(you),working=active&&!s.done&&i>=0,turn=working&&s.order[s.position]===i&&s.phase==='draft'
 const [picked,setPicked]=useState(0),[spin,setSpin]=useState(0),[anchor,setAnchor]=useState<number|null>(null)
 const [target,setTarget]=useState(''),[points,setPoints]=useState(0)
 const tile=s.tiles[picked]?.taken?s.tiles.findIndex(x=>!x.taken):picked
 const cells=anchor===null?[]:footprint(s,tile,spin,anchor)
 const legal=turn&&canPlace(s,i,cells)
 const offer=s.offer,targetSeat=Number(target)
 const canOffer=working&&!s.passed.includes(i)&&!s.traded.includes(i)&&!offer&&target!==''&&g.seats[targetSeat]!==undefined&&targetSeat!==i&&!s.passed.includes(targetSeat)&&!s.traded.includes(targetSeat)&&points<=s.bonus[i]
 const n=s.width
 return <section className="grass-table">
  <p>{s.done?'Draft complete':`Round ${s.round} of ${s.mode==='grass1'?9:4} · ${s.phase==='trade'?'Trade draft spots':name(g.seats[s.order[s.position]])+' drafts next'}`}</p>
  <p className="grass-order">Draft order: {s.order.map(id=>name(g.seats[id])).join(' → ')}</p>
  <ul className="grass-scores" aria-label="Territory standings">{g.seats.map((id,j)=>{
   const [score,tie]=grassRank(s,j)
   return <li key={id}><span style={{background:palette[j]}}>{mark(j)}</span> {name(id)} · {s.mode==='grass1'?`${score}×${score} square / ${tie} cells`:`${score} ${score===1?'point':'points'} / ${tie}×${tie} square`}</li>
  })}</ul>
  {!s.done&&s.phase==='trade'&&<fieldset className="pact-board grass-pact" data-pact="grass" disabled={!working||s.passed.includes(i)}>
   <legend>Optional trade</legend>
   {offer?<p className="pact-swap-note" aria-label={name(g.seats[offer.from])+' offers '+offer.points+' points to swap with '+name(g.seats[offer.to])}>
    <SeatMark seat={offer.from} color={palette[offer.from]}/>{name(g.seats[offer.from])} <span aria-hidden="true">↔</span>
    <SeatMark seat={offer.to} color={palette[offer.to]}/>{name(g.seats[offer.to])} <CoinMark points={offer.points}/>{offer.points} {offer.points===1?'point':'points'}
   </p>:s.traded.includes(i)||s.passed.includes(i)?<p className="pact-closed">{s.passed.includes(i)?'Draft ready':'Draft spot traded'}</p>:<>
    <PactChoices label="Trade with" kind="seats" value={target} choose={setTarget}
     choices={g.seats.flatMap((id,j)=>j===i?[]:[{
      value:String(j),label:name(id),face:name(id),disabled:s.passed.includes(j)||s.traded.includes(j),art:<SeatMark seat={j} color={palette[j]}/>
     }])}/>
    <PactChoices label="Points offered" kind="coins" value={String(points)} choose={value=>setPoints(Number(value))}
     choices={[0,1,2].map(n=>({value:String(n),label:n+' '+(n===1?'point':'points'),face:String(n),disabled:n>(s.bonus[i]??0),art:<CoinMark points={n}/>}))}/>
   </>}
   <div className="pact-actions">
    {!offer&&!s.traded.includes(i)&&!s.passed.includes(i)&&<button type="button" disabled={!canOffer} onClick={()=>{if(canOffer)submit(tradeCode(targetSeat,points))}}>Offer swap</button>}
    {offer?.to===i&&<><button type="button" className="primary" onClick={()=>submit(tradeAccept)}>Accept swap</button><button type="button" onClick={()=>submit(tradeDecline)}>Decline swap</button></>}
    <button type="button" onClick={()=>submit(tradeDone)}>Ready to draft</button>
   </div>
  </fieldset>}
  {!s.done&&<fieldset className="grass-tray" disabled={!turn}>
   <legend>Available tiles</legend>
   {s.tiles.map((t,k)=>!t.taken&&<button key={k} type="button" aria-pressed={k===tile} aria-label={`Tile ${k+1}, ${orient(t.shape,0).length} cells${s.mode==='grass3'?', bonus '+t.bonus:''}`} onClick={()=>{setPicked(k);setSpin(0)}}>
    <svg aria-hidden="true" viewBox="0 0 40 40">{orient(t.shape,k===tile?spin:0).map(([x,y])=><rect key={x+','+y} x={x*8} y={y*8} width="7" height="7" rx="1" fill="currentColor"/>)}</svg>
    {s.mode==='grass3'?<small>+{t.bonus}</small>:null}
   </button>)}
  </fieldset>}
  <div className="grass-scroll">
   <div className="grass-grid" role="group" aria-label="Territory board" style={{gridTemplateColumns:`repeat(${n}, minmax(26px,1fr))`}}>
    {s.board.map((seat,k)=><button type="button" key={k} tabIndex={-1} disabled={!turn} data-owner={seat>=0} data-preview={cells.includes(k)?legal?'valid':'invalid':undefined}
     aria-label={`Row ${Math.floor(k/n)+1}, column ${k%n+1}${seat>=0?', '+name(g.seats[seat]):s.markers[k]?', bonus square':''}`} style={seat>=0?{background:palette[seat]}:{}} onClick={()=>setAnchor(k)}>{seat>=0?mark(seat):s.markers[k]?'✦':''}</button>)}
   </div>
  </div>
  {!s.done&&<fieldset disabled={!turn} className="grass-controls">
   <legend>Place a tile</legend>
   <details className="grass-address"><summary>Place by coordinates</summary><div className="grass-address-fields">
   <label>Row <select value={anchor===null?'':Math.floor(anchor/n)} onChange={e=>setAnchor(Number(e.target.value)*n+(anchor===null?0:anchor%n))}><option disabled value="">Row</option>{Array.from({length:n},(_,r)=><option key={r} value={r}>{r+1}</option>)}</select></label>
   <label>Column <select value={anchor===null?'':anchor%n} onChange={e=>setAnchor((anchor===null?0:Math.floor(anchor/n)*n)+Number(e.target.value))}><option disabled value="">Column</option>{Array.from({length:n},(_,r)=><option key={r} value={r}>{r+1}</option>)}</select></label>
   </div></details>
   <button type="button" onClick={()=>setSpin(v=>Math.floor(v/4)*4+(v+1)%4)}>Rotate</button>
   <button type="button" onClick={()=>setSpin(v=>v^4)}>Mirror</button>
   <button type="button" disabled={!legal||anchor===null} onClick={()=>{if(anchor!==null&&legal)submit(placeCode(tile,spin,anchor))}}>Place tile</button>
   {s.mode==='grass1'&&<button type="button" disabled={!s.coupons[i]||tile<0} onClick={()=>submit(redraw+tile)}>Use redraw</button>}
   <button type="button" onClick={()=>submit(-1)}>Pass if blocked</button>
   {anchor!==null&&<small role="status">{legal?'Legal placement':'Tile must fit beside your territory without overlap.'}</small>}
  </fieldset>}
 </section>
}
