import {useRef,useState,type CSSProperties,type KeyboardEvent} from 'react'
import {canPlace,footprint,grassRank,orient,placeCode,redraw,tradeAccept,tradeCode,tradeDecline,tradeDone,type Grass} from './grass'
import type {GameView} from './engine'
import {CoinMark,PactChoices,SeatMark} from './pact-tokens'
import './grass.css'
const palette=['#1a604c','#a33f48','#374798','#9a552a','#4c6139','#723c89','#236181','#903956','#6d562b','#55506e','#30696e','#59621c','#7c3d34','#415c7c','#764c74','#55534b']
const mark=(i:number)=>String.fromCharCode(65+i)
const strokes={
 swap:'M4 8h15m-4-4 4 4-4 4M20 16H5m4-4-4 4 4 4',
 ready:'m5 12 5 5L20 7',
 rotate:'M20 11a8 8 0 1 0-3 7m3-7v-6m0 6h-6',
 mirror:'M12 3v18M4 5l5 5v6H4zm16 0-5 5v6h5z',
 place:'M4 4h16v16H4zM8 12l3 3 5-6',
 standings:'M3 20h18M5 16v-5h3v5m2 0V5h4v11m2 0V8h3v8',
} as const
function GrassIcon({kind}:{kind:keyof typeof strokes}){
 return <svg className="grass-tool-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={strokes[kind]}/></svg>
}
const surveyLines=[
 'M2 13q5-6 11-6t10 2M3 17q5-5 10-5t11 2M5 21q5-5 10-4t9 3',
 'M3 7q5 3 8 9t11 6M6 6q5 3 7 8t10 5M11 6q5 5 12 6',
 'M2 20q4-5 10-5 7 1 12-5M3 24q5-5 10-5 7 1 11-4M9 9q4 1 7-3',
 'M2 10q5 2 8 9 4 6 13 3M3 6q6 2 10 9 3 5 10 4M17 7q3 2 7 0'
]
const plotOutline='M1.6 3 7 1.5 22.5 2l2 4-.8 16-4 2-17-.8L1 17Z'
function LeafStamp({variation}:{variation:number}){
 return <g transform={['rotate(-8 13 13)','translate(26 0) scale(-1 1)','rotate(12 13 13)','translate(26 0) scale(-1 1) rotate(-13 13 13)'][variation%4]}>
  <path d="M8 22Q18 20 21 6q-8-.8-13 6-4 4 0 7Q13 20 17 12" className="field-leaf"/>
  <path d="M5 24q8-6 13-15m-5 8-1-5m4 2 4-.6" className="field-veins"/>
 </g>
}
function SurveyMark({type,variation}:{type:'plot'|'parcel'|'bonus'|'trial';variation:number}){
 return <svg className={'field-board-print field-'+type} viewBox="0 0 26 26" aria-hidden="true" focusable="false" data-field-print={type}>
  {type==='plot'?<path d={surveyLines[variation%4]}/>:type==='parcel'?<LeafStamp variation={variation}/>:type==='bonus'?<>
   <path d="m13 2 3 6 6 3-4 5-.8 7-4.2-3-4.2 3-.8-7-4-5 6-3Z" className="field-sun"/>
   <path d="m13 8 1.4 3.6 3.6 1.4-3.6 1.4L13 18l-1.4-3.6L8 13l3.6-1.4Z"/>
  </>:<path d={plotOutline}/>}
 </svg>
}
function FieldPiece({cells,variant}:{cells:ReturnType<typeof orient>;variant:number}){
 const width=(1+Math.max(...cells.map(([x])=>x)))*26
 const height=(1+Math.max(...cells.map(([,y])=>y)))*26
 return <svg className="field-piece" viewBox={'0 0 '+width+' '+height} aria-hidden="true" focusable="false" data-field-print="piece">
  {cells.map(([x,y],i)=><g key={x+','+y} transform={'translate('+x*26+' '+y*26+')'}>
   <path className="field-cut" d={plotOutline}/>
   <LeafStamp variation={variant+i}/>
  </g>)}
 </svg>
}
export function GrassBoard({g,you,active,name,submit}:{g:GameView;you:string;active:boolean;name:(id:string)=>string;submit:(a:number)=>void}){
 const s=g.grass as Grass,i=g.seats.indexOf(you),working=active&&!s.done&&i>=0,turn=working&&s.order[s.position]===i&&s.phase==='draft'
 const trading=!s.done&&s.phase==='trade',mayNegotiate=working&&!s.passed.includes(i)
 const [picked,setPicked]=useState(0),[spin,setSpin]=useState(0),[anchor,setAnchor]=useState<number|null>(null)
 const [target,setTarget]=useState(''),[points,setPoints]=useState(0)
 const [focus,setFocus]=useState(()=>Math.max(0,s.board.findIndex(owner=>owner===i)))
 const refs=useRef<Array<HTMLButtonElement|null>>([])
 const tile=s.tiles[picked]?.taken?s.tiles.findIndex(x=>!x.taken):picked
 const cells=anchor===null?[]:footprint(s,tile,spin,anchor)
 const legal=turn&&canPlace(s,i,cells)
 const offer=s.offer,targetSeat=Number(target),n=s.width
 const canOffer=mayNegotiate&&!s.traded.includes(i)&&!offer&&target!==''&&g.seats[targetSeat]!==undefined&&targetSeat!==i&&!s.passed.includes(targetSeat)&&!s.traded.includes(targetSeat)&&points<=s.bonus[i]
 const roundCount=s.mode==='grass1'?9:4
 const moveFocus=(event:KeyboardEvent<HTMLButtonElement>,k:number)=>{
  const row=Math.floor(k/n),col=k%n
  const next=event.key==='ArrowLeft'?row*n+Math.max(0,col-1):event.key==='ArrowRight'?row*n+Math.min(n-1,col+1):
   event.key==='ArrowUp'?Math.max(0,row-1)*n+col:event.key==='ArrowDown'?Math.min(n-1,row+1)*n+col:
   event.key==='Home'?row*n:event.key==='End'?row*n+n-1:undefined
  if(next!==undefined){event.preventDefault();refs.current[next]?.focus()}
 }
 const standings=<>
  <p className="grass-order">Draft order: {s.order.map(id=>name(g.seats[id])).join(' → ')}</p>
  <ul className="grass-scores" aria-label="Territory standings">{g.seats.map((id,j)=>{
   const [score,tie]=grassRank(s,j)
   return <li key={id}><SeatMark seat={j} color={palette[j]}/> <span>{name(id)}<small>{s.mode==='grass1'?`${score}×${score} square · ${tie} cells`:`${score} ${score===1?'point':'points'} · ${tie}×${tie} square`}</small></span></li>
  })}</ul>
 </>
 return <section className="grass-table" data-grass-phase={s.done?'done':s.phase}>
  <div className="grass-phase">
   <div className="grass-phase-copy"><span>Round <b>{s.round}</b> / {roundCount}</span>
    <p role="status">{s.done?'Draft complete':trading?(s.passed.includes(i)?'Waiting on the table':'Trade or draft'):name(g.seats[s.order[s.position]])+' drafts next'}</p>
   </div>
   {trading&&<button className="primary grass-ready" type="button" disabled={!mayNegotiate} onClick={()=>submit(tradeDone)}><GrassIcon kind="ready"/>Ready to draft</button>}
  </div>
  {trading&&offer&&<div className="grass-incoming">
   <p className="pact-swap-note" role="status" aria-label={name(g.seats[offer.from])+' offers '+offer.points+' points to swap with '+name(g.seats[offer.to])}>
    <SeatMark seat={offer.from} color={palette[offer.from]}/>{name(g.seats[offer.from])} <span aria-hidden="true">↔</span>
    <SeatMark seat={offer.to} color={palette[offer.to]}/>{name(g.seats[offer.to])} <CoinMark points={offer.points}/>{offer.points}
   </p>
   {offer.to===i&&<div className="pact-actions"><button type="button" className="primary" disabled={!mayNegotiate} onClick={()=>submit(tradeAccept)}>Accept swap</button><button type="button" disabled={!mayNegotiate} onClick={()=>submit(tradeDecline)}>Decline swap</button></div>}
  </div>}
  <div className="grass-scroll">
   <div className="grass-grid" role="group" aria-label="Territory board" style={{gridTemplateColumns:`repeat(${n}, minmax(24px,1fr))`}}>
    {s.board.map((seat,k)=>{
     const trial=turn&&cells.includes(k)
     return <button type="button" key={k} ref={el=>{refs.current[k]=el}} tabIndex={turn&&focus===k?0:-1} disabled={!turn}
      data-owner={seat>=0} data-preview={trial?legal?'valid':'invalid':undefined}
      aria-label={`Row ${Math.floor(k/n)+1}, column ${k%n+1}${seat>=0?', '+name(g.seats[seat]):s.markers[k]?', bonus square':''}`}
      aria-pressed={turn?anchor===k:undefined} style={seat>=0?{'--parcel-ink':palette[seat]} as CSSProperties:undefined} onFocus={()=>setFocus(k)}
      onKeyDown={event=>moveFocus(event,k)} onClick={()=>setAnchor(k)}>
      <SurveyMark type="plot" variation={k+Math.floor(k/n)}/>
      {seat>=0?<><SurveyMark type="parcel" variation={k}/><span aria-hidden="true" className="field-owner-stamp">{mark(seat)}</span></>:s.markers[k]?<SurveyMark type="bonus" variation={k}/>:null}
      {trial&&<SurveyMark type="trial" variation={k}/>}
     </button>
    })}
   </div>
  </div>
  {trading&&!offer&&i>=0&&!s.traded.includes(i)&&!s.passed.includes(i)&&<details className="grass-disclosure grass-swap">
   <summary><GrassIcon kind="swap"/>Swap draft spot</summary>
   <fieldset className="pact-board grass-pact" data-pact="grass" disabled={!mayNegotiate}>
    <legend className="sr">Optional trade</legend>
    <PactChoices label="Trade with" kind="seats" value={target} choose={setTarget}
     choices={g.seats.flatMap((id,j)=>j===i?[]:[{
      value:String(j),label:name(id),face:name(id),disabled:s.passed.includes(j)||s.traded.includes(j),art:<SeatMark seat={j} color={palette[j]}/>
     }])}/>
    <PactChoices label="Points offered" kind="coins" value={String(points)} choose={value=>setPoints(Number(value))}
     choices={[0,1,2].map(n=>({value:String(n),label:n+' '+(n===1?'point':'points'),face:String(n),disabled:n>(s.bonus[i]??0),art:<CoinMark points={n}/>}))}/>
    <div className="pact-actions"><button type="button" disabled={!canOffer} onClick={()=>{if(canOffer)submit(tradeCode(targetSeat,points))}}>Offer swap</button></div>
   </fieldset>
  </details>}
  {!s.done&&s.phase==='draft'&&<>
   <fieldset className="grass-tray" disabled={!turn}>
    <legend className="sr">Available tiles</legend>
    {s.tiles.map((t,k)=>!t.taken&&<button key={k} type="button" aria-pressed={k===tile} aria-label={`Tile ${k+1}, ${orient(t.shape,0).length} cells${s.mode==='grass3'?', bonus '+t.bonus:''}`} onClick={()=>{setPicked(k);setSpin(0)}}>
     <FieldPiece cells={orient(t.shape,k===tile?spin:0)} variant={t.shape}/>
     {s.mode==='grass3'?<small>+{t.bonus}</small>:null}
    </button>)}
   </fieldset>
   {turn&&<>
    <div className="grass-controls" role="group" aria-label="Place a tile">
     <button type="button" aria-label="Rotate" title="Rotate" onClick={()=>setSpin(v=>Math.floor(v/4)*4+(v+1)%4)}><GrassIcon kind="rotate"/></button>
     <button type="button" aria-label="Mirror" title="Mirror" onClick={()=>setSpin(v=>v^4)}><GrassIcon kind="mirror"/></button>
     <button className="primary grass-place" type="button" disabled={!legal||anchor===null} onClick={()=>{if(anchor!==null&&legal){submit(placeCode(tile,spin,anchor));setAnchor(null)}}}><GrassIcon kind="place"/>Place tile</button>
    </div>
    <p className="grass-placement-note" role="status">{anchor===null?'':legal?'Legal placement':'Tile must fit beside your territory without overlap.'}</p>
    <details className="grass-disclosure grass-address"><summary>Place by coordinates</summary><div className="grass-address-fields">
     <label>Row <select value={anchor===null?'':Math.floor(anchor/n)} onChange={e=>setAnchor(Number(e.target.value)*n+(anchor===null?0:anchor%n))}><option disabled value="">Row</option>{Array.from({length:n},(_,r)=><option key={r} value={r}>{r+1}</option>)}</select></label>
     <label>Column <select value={anchor===null?'':anchor%n} onChange={e=>setAnchor((anchor===null?0:Math.floor(anchor/n)*n)+Number(e.target.value))}><option disabled value="">Column</option>{Array.from({length:n},(_,r)=><option key={r} value={r}>{r+1}</option>)}</select></label>
     </div></details>
    <details className="grass-disclosure grass-options"><summary>Draft options</summary>
     <div className="pact-actions">
      {s.mode==='grass1'&&<button type="button" disabled={!s.coupons[i]||tile<0} onClick={()=>submit(redraw+tile)}>Use redraw</button>}
      <button type="button" onClick={()=>submit(-1)}>Pass if blocked</button>
     </div>
    </details>
   </>}
  </>}
  {s.done?standings:<details className="grass-disclosure grass-standings"><summary><GrassIcon kind="standings"/>Standings and order</summary>{standings}</details>}
 </section>
}
