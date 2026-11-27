import {useEffect,useId,useRef,useState, type KeyboardEvent, type PointerEvent} from 'react'
import {timeHoldRules, type TimeHoldAction,type TimeHoldView} from './time-hold'
import './time-hold-ui.css'

export type TimeHoldInput={kind:'pointer';id:number}|{kind:'key';id:'Space'|'Enter'}
export type TimeHoldClockSample={hostNow:number;receivedAt:number}
type HoldControls={
 view:TimeHoldView
 active:boolean
 matchKey?:string
 /** Return false on immediate rejection. An accepted transmission is not a confirmed bid. */
 submit:(action:TimeHoldAction)=>boolean|string|void
}
export type TimeHoldBoardProps=HoldControls&{
 /** Capture receivedAt with performance.now() when receiving the exact view projected at hostNow. */
 clockSample:TimeHoldClockSample|null
 seatNames?:Readonly<Record<string,string>>
 reducedMotion?:boolean
 /** A private delivery/validation notice, never shared with the table. */
 notice?:string
 /** Local request ID of a rejected press; does not affect newer gestures. */
 rejectedPress?:string
}

const {armMs,tenthMs,graceMs,leaseMs}=timeHoldRules
const live=(view:TimeHoldView)=>view.phase==='arming'||view.phase==='live'

/** Bound to a single physical/keyboard input. The payload never includes a client timestamp. */
export function createTimeHoldGesture(read:()=>HoldControls,changed:(pressed:boolean)=>void){
 let hold:{input:TimeHoldInput;round:number;matchKey?:string;request?:string}|null=null
 function current(){
  const props=read()
  if(hold&&(!props.active||props.matchKey!==hold.matchKey||props.view.round!==hold.round||
   !live(props.view)||!props.view.mine||props.view.mine.status==='closed')){
   hold=null
   changed(false)
  }
  return props
 }
 function send(props:HoldControls,action:TimeHoldAction){
  try{return props.submit(action)}catch{return false}
 }
 function end(kind:'release'|'cancel',input?:TimeHoldInput){
  const props=current()
  if(!hold||input&&(input.kind!==hold.input.kind||input.id!==hold.input.id))return false
  const round=hold.round
  hold=null
  changed(false)
  return send(props,{kind,round})!==false
 }
 return {
  press(input:TimeHoldInput){
   const props=current()
   if(hold||!props.active||props.view.phase!=='arming'||props.view.mine?.status!=='idle')return false
   const round=props.view.round
   hold={input,round,matchKey:props.matchKey}
   const receipt=send(props,{kind:'hold',round})
   if(receipt===false){hold=null;return false}
   if(typeof receipt==='string')hold.request=receipt
   changed(true)
   return true
  },
  release(input?:TimeHoldInput){return end('release',input)},
  cancel(input?:TimeHoldInput){return end('cancel',input)},
  reject(request:string){
   if(hold?.request===request){hold=null;changed(false)}
  },
  pulse(){
   const props=current()
   if(hold)send(props,{kind:'pulse',round:hold.round})
  },
  sync(){current()}
 }
}

type ClockReading={armTenths:number|null;heldTenths:number|null;reserveTenths:number|null;chargeable?:boolean}
const tenths=(ms:number)=>Math.max(0,Math.round(ms/tenthMs))

/** Display-only estimate from a filtered view; never used to accept bids or award tokens. */
export function timeHoldClock(view:TimeHoldView,sample:TimeHoldClockSample|null,localNow:number):ClockReading{
 const reading:ClockReading={armTenths:null,heldTenths:null,reserveTenths:null}
 const own=view.phase==='live'&&view.mine?.status==='holding'?view.mine.remainingTenths:null
 if(!sample||![sample.hostNow,sample.receivedAt,localNow].every(Number.isFinite)){
  return {...reading,reserveTenths:own}
 }
 // Do not let a dropped or heavily throttled transport animate an apparently live reserve indefinitely.
 const estimatedNow=sample.hostNow+Math.max(0,Math.min(leaseMs,localNow-sample.receivedAt))
 if(view.phase==='arming')reading.armTenths=Math.max(0,Math.ceil((view.bidAt-estimatedNow)/tenthMs))
 if(own!==null){
  reading.chargeable=estimatedNow-view.bidAt>=graceMs
  const elapsedAtSample=tenths(sample.hostNow-view.bidAt)
  reading.heldTenths=Math.min(elapsedAtSample+own,tenths(estimatedNow-view.bidAt))
  reading.reserveTenths=Math.max(0,own-Math.max(0,reading.heldTenths-elapsedAtSample))
 }
 return reading
}

const format=(value:number)=>(value/10).toFixed(1)
const dialMarks=Array.from({length:60},(_,i)=><path key={i} className={i%5===0?'time-hold-major':'time-hold-minor'}
 transform={`rotate(${i*6} 120 120)`} d={i%5===0?'M120 23v13':'M120 24v5'}/>)
function Dial({angle,label,value,unit}:{angle:number;label:string;value:string|null;unit?:string}){
 return <div className="time-hold-dial">
  <svg viewBox="0 0 240 240" width="240" height="240" aria-hidden="true" focusable="false">
   <circle className="time-hold-dial-case" cx="120" cy="120" r="117" />
   <circle className="time-hold-dial-rim" cx="120" cy="120" r="110" />
   <circle className="time-hold-dial-face" cx="120" cy="120" r="101" />
   <circle className="time-hold-dial-rule" cx="120" cy="120" r="81" />
   {dialMarks}
   <path className="time-hold-dial-pointer" transform={`rotate(${angle} 120 120)`} d="M120 21l-5 13h10z"/>
   <path className="time-hold-dial-rule" d="M104 72h32m-17 93h2m-11 0h2m16 0h2"/>
  </svg>
  <div className="time-hold-dial-copy">
   <span className="time-hold-dial-label">{label}</span>
   {value!==null&&<span className="time-hold-value">{value}{unit&&<span className="time-hold-unit"> {unit}</span>}</span>}
  </div>
 </div>
}
const keyInput=(event:KeyboardEvent<HTMLButtonElement>):TimeHoldInput|null=>
 event.code==='Space'||event.key===' '?{kind:'key',id:'Space'}:event.key==='Enter'?{kind:'key',id:'Enter'}:null

/**
 * Render only recipient-filtered TimeHoldView. When the match/connection is replaced,
 * change matchKey (or key the component) and active; the host still owns liveness/disconnect.
 */
export function TimeHoldBoard(props:TimeHoldBoardProps){
 const {view,active,clockSample,seatNames,reducedMotion,notice,rejectedPress}=props
 const latest=useRef(props)
 latest.current=props
 const [pressed,setPressed]=useState(false)
 const [now,setNow]=useState(()=>performance.now())
 const [gesture]=useState(()=>createTimeHoldGesture(()=>latest.current,setPressed))
 const ruleId=useId(),titleId=useId()
 const running=view.phase==='arming'||view.phase==='live'&&view.mine?.status==='holding'
 useEffect(()=>{gesture.sync()},[view,active,props.matchKey,gesture])
 useEffect(()=>{if(rejectedPress)gesture.reject(rejectedPress)},[rejectedPress,gesture])
 useEffect(()=>{
  if(!running)return
  const tick=()=>{if(document.visibilityState==='visible')setNow(performance.now())}
  tick()
  const id=window.setInterval(tick,100)
  return ()=>window.clearInterval(id)
 },[running])
 useEffect(()=>{
  if(!pressed)return
  const id=window.setInterval(()=>gesture.pulse(),1000)
  return ()=>window.clearInterval(id)
 },[pressed,gesture])
 useEffect(()=>{
  const stop=()=>gesture.cancel()
  const hide=()=>{if(document.visibilityState!=='visible')stop()}
  const pointerEnd=(evt:globalThis.PointerEvent)=>gesture.release({kind:'pointer',id:evt.pointerId})
  const pointerCancel=(evt:globalThis.PointerEvent)=>gesture.cancel({kind:'pointer',id:evt.pointerId})
  window.addEventListener('blur',stop)
  window.addEventListener('pagehide',stop)
  window.addEventListener('pointerup',pointerEnd)
  window.addEventListener('pointercancel',pointerCancel)
  document.addEventListener('visibilitychange',hide)
  return ()=>{
   window.removeEventListener('blur',stop)
   window.removeEventListener('pagehide',stop)
   window.removeEventListener('pointerup',pointerEnd)
   window.removeEventListener('pointercancel',pointerCancel)
   document.removeEventListener('visibilitychange',hide)
   stop()
  }
 },[gesture])

 const clock=timeHoldClock(view,clockSample,now)
 const ready=active&&view.phase==='arming'&&view.mine?.status==='idle'
 const elapsed=active?clock.heldTenths:null
 const reserve=active?clock.reserveTenths:null
 const arm=clock.armTenths
 const readout={angle:0,label:'Stand by',value:null as string|null}
 if(view.phase==='arming'){
  readout.label='Bidding opens in'
  if(arm!==null){readout.value=format(arm);readout.angle=360*(1-Math.min(1,arm*tenthMs/armMs))}
 }else if(view.phase==='review'){
  readout.label=view.last?.winner?'Winning time':(view.last?.elapsedTenths??0)>0?'Tied time':'No valid bid'
  if(view.last&&view.last.elapsedTenths>0){
   readout.value=format(view.last.elapsedTenths)
   readout.angle=view.last.elapsedTenths*.6
  }
 }else if(view.phase==='finished'){
  readout.label='Auction complete'
 }else if(elapsed!==null){
  readout.label='Your held time'
  readout.value=format(elapsed)
  readout.angle=elapsed*.6
 }else if(view.mine?.status==='holding'&&active)readout.label='Clock syncing'
 else readout.label='Bids are private'

 const seatLabel=(seat:string)=>seatNames&&Object.hasOwn(seatNames,seat)?seatNames[seat]:
  `Player ${Math.max(0,view.tokens.findIndex(t=>t.seat===seat))+1}`
 const resultText=view.last?.winner?seatLabel(view.last.winner)+' won the token':
  (view.last?.elapsedTenths??0)>0?'Longest bids tied. No token awarded.':'No token awarded.'
 const status=view.phase==='finished'?(view.winner?seatLabel(view.winner)+' wins the auction.':'Top rank is shared.'):
  view.phase==='review'?resultText:
  !view.mine?'Spectating. Live bids stay private.':
  !active?'Connection paused. The host handles interrupted holds.':
  view.mine.status==='holding'?'Release the button to finish your hold.':
  view.mine.status==='closed'?'Your turn is closed. Waiting for the round to settle.':
  pressed?'Waiting for the host to confirm your hold.':
  ready?'Press and hold to enter this round.':'This round is underway. Wait for the next one.'
 const holdText=pressed?'Release to stop':view.phase==='finished'?'Auction complete':ready?'Press & hold':
  view.phase==='review'?'Round settled':'Stand by'
 function pointerDown(event:PointerEvent<HTMLButtonElement>){
  if(event.button!==0||!event.isPrimary)return
  event.currentTarget.focus({preventScroll:true})
  if(!gesture.press({kind:'pointer',id:event.pointerId}))return
  event.preventDefault()
  try{event.currentTarget.setPointerCapture(event.pointerId)}catch{/* window pointerup remains a backstop */}
 }
 function pointerEnd(event:PointerEvent<HTMLButtonElement>){
  gesture.release({kind:'pointer',id:event.pointerId})
 }
 function pointerCancel(event:PointerEvent<HTMLButtonElement>){gesture.cancel({kind:'pointer',id:event.pointerId})}
 function keyDown(event:KeyboardEvent<HTMLButtonElement>){
  if(event.key==='Escape'&&pressed){event.preventDefault();gesture.release();return}
  const input=keyInput(event)
  if(!input)return
  event.preventDefault()
  if(!event.repeat)gesture.press(input)
 }
 function keyUp(event:KeyboardEvent<HTMLButtonElement>){
  const input=keyInput(event)
  if(!input)return
  event.preventDefault()
  gesture.release(input)
 }

 return <section className="time-hold" aria-labelledby={titleId} data-reduced-motion={reducedMotion?'yes':undefined}>
  <header className="time-hold-head">
   <span className="time-hold-kicker">Time Auction <span>·</span> Episode-inspired rules</span>
   <h2 id={titleId}>Round <span>{String(view.round).padStart(2,'0')}</span> <small>/ {view.rounds}</small></h2>
  </header>
  <div className="time-hold-field">
   <div className="time-hold-instrument">
    <Dial {...readout} unit="s"/>
    {reserve!==null&&<p className="time-hold-reserve">{clock.chargeable?'Your time bank':'Bank if committed'} <strong>{format(reserve)} <span>s</span></strong></p>}
    {elapsed!==null&&<p className="time-hold-grace">{clock.chargeable?'Your hold is using its time bank.':'Release before 5 s to pass for free.'}</p>}
    {view.mine&&<button type="button" className="time-hold-plunger"
     aria-label="Hold to bid" aria-keyshortcuts="Space Enter Escape" aria-describedby={ruleId} aria-disabled={!ready&&!pressed} data-held={pressed?'yes':undefined}
     onPointerDown={pointerDown} onPointerUp={pointerEnd} onPointerCancel={pointerCancel}
     onLostPointerCapture={pointerCancel} onKeyDown={keyDown} onKeyUp={keyUp}
     onBlur={()=>gesture.cancel()} onContextMenu={event=>event.preventDefault()} onClick={event=>event.preventDefault()}>
     <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M12 3v12m-4-4 4 4 4-4M5 19h14"/>
     </svg><span>{holdText}</span>
    </button>}
    <p className="time-hold-status" role="status">{status}</p>
    {notice&&view.mine&&<p className="time-hold-notice" role="alert">{notice}</p>}
   </div>
   <aside className="time-hold-ledger" aria-label="Round and scoring information">
    <p id={ruleId} className="time-hold-rule">Hold during the countdown to enter. Release before 5 seconds to pass for free; at 5 seconds or more, the full held time is spent. The highest hold wins a token only if untied.</p>
    {view.mine&&<p className="time-hold-keys"><kbd>Space</kbd> or touch and hold</p>}
    <h3>{view.ranks?'Final standings':'Token tally'}</h3>
    {view.ranks?<ol className="time-hold-tally">{view.ranks.flatMap((group,i)=>group.map(seat=>
     <li key={seat}><span><small>{view.ranks!.slice(0,i).reduce((n,r)=>n+r.length,1)}.</small> {seatLabel(seat)}</span><strong>{view.tokens.find(t=>t.seat===seat)?.tokens??0}</strong></li>))}</ol>:
     <ul className="time-hold-tally">{view.tokens.map(({seat,tokens})=>
      <li key={seat}><span>{seatLabel(seat)}</span><strong>{tokens}</strong></li>)}</ul>}
    {view.last&&view.phase!=='review'&&<div className="time-hold-previous">
     <h3>Round {view.last.round}</h3><p>{resultText}{view.last.elapsedTenths>0?` · ${format(view.last.elapsedTenths)} s`:''}</p>
    </div>}
    <p className="time-hold-foot">Display times are approximate. The host measures every bid.</p>
   </aside>
  </div>
 </section>
}
