import {useEffect,useState} from 'react'
import {doubtColors,doubtRounds,type DoubtAction,type DoubtColor,type DoubtView} from './doubt-bet'
import {DoubtCardArt,DoubtChip,doubtCardName} from './doubt-bet-art'
import './doubt-bet.css'

type Props={view:DoubtView;you:string;name:(seat:string)=>string;host:boolean;active:boolean;hostNow:number;receivedAt?:number;preview?:boolean;submit:(action:DoubtAction)=>void}
const sum=(s:{points:number;slots:number})=>s.points+s.slots
function Clock({deadline,hostNow,receivedAt,preview}:{deadline:number;hostNow:number;receivedAt?:number;preview?:boolean}){
 const [local,setLocal]=useState(()=>performance.now())
 useEffect(()=>{
  if(preview)return
  const tick=()=>setLocal(performance.now())
  const timer=window.setInterval(tick,250)
  return ()=>window.clearInterval(timer)
 },[preview])
 const seconds=Math.max(0,Math.ceil((deadline-hostNow-(preview||receivedAt===undefined?0:Math.max(0,local-receivedAt)))/1000))
 return <span className="db-clock" aria-label={seconds+' seconds left'} title="Time remaining">{seconds}s</span>
}
function Wallet({points,slots}:{points:number;slots:number}){
 return <span className="db-wallet"><span><DoubtChip/>{points}<span className="sr"> points</span></span><span><DoubtChip slot/>{slots}<span className="sr"> slots</span></span></span>
}
function WagerControls({v,submit}:{v:DoubtView;submit:Props['submit']}){
 const m=v.mine!
 const [doubting,setDoubting]=useState(false)
 const [color,setColor]=useState<DoubtColor>('red')
 const [count,setCount]=useState((v.claim?.count??0)+1)
 const forceDoubt=v.phase==='reply'&&count>v.maxCount
 const raising=v.phase==='raise',challenge=v.phase==='reply'&&(doubting||forceDoubt),betting=!raising&&!challenge
 const min=raising?m.min:challenge?m.challengeMin:1,cap=challenge?m.challengeCap:m.cap
 const [pieces,setPieces]=useState<number|null>(null),[slots,setSlots]=useState<number|null>(null)
 const defaultPoints=Math.min(min-m.escrowSlots,m.points)
 const usePoints=pieces??defaultPoints,useSlots=slots??Math.max(m.escrowSlots,min-defaultPoints)
 const risk=usePoints+useSlots
 const pay={points:usePoints,slots:useSlots}
 const valid=risk>=min&&risk<=cap
 const changeMode=(value:boolean)=>{setDoubting(value);setPieces(null);setSlots(null)}
 const changeStake=(p:number,s:number)=>{setPieces(p);setSlots(s)}
 const send=()=>{
  if(!valid)return
  submit(raising?{kind:'counter',...pay}:challenge?{kind:'doubt',...pay}:{kind:'bid',color,count,...pay})
 }
 return <section className="db-actions" aria-label="Your move">
  {v.phase==='reply'&&!forceDoubt&&<div className="db-modes" aria-label="Respond to the claim">
   <button type="button" aria-pressed={!challenge} onClick={()=>changeMode(false)}>Accept & outbid</button>
   <button type="button" aria-pressed={challenge} onClick={()=>changeMode(true)}>Doubt</button>
  </div>}
  {betting&&<div className="db-builder">
   <div className="db-palette" role="group" aria-label="Claim color">{doubtColors.map(c=><button type="button" key={c} aria-label={doubtCardName(c)} aria-pressed={color===c} onClick={()=>setColor(c)}><DoubtCardArt card={c}/></button>)}</div>
   <label className="db-count">Claim count<select aria-label="Claim count" value={count} onChange={e=>setCount(Number(e.currentTarget.value))}>{Array.from({length:v.maxCount-(v.claim?.count??0)},(_,i)=>i+(v.claim?.count??0)+1).map(n=><option key={n} value={n}>{n}</option>)}</select></label>
  </div>}
  <div className="db-wager-form">
   <label aria-label="Points wagered"><DoubtChip/><select aria-label="Points wagered" value={usePoints} onChange={e=>{const n=Number(e.currentTarget.value);changeStake(n,Math.max(m.escrowSlots,Math.min(useSlots,cap-n)))}}>{Array.from({length:Math.min(m.points,cap-m.escrowSlots)-m.escrowPoints+1},(_,i)=>i+m.escrowPoints).map(n=><option key={n} value={n}>{n}</option>)}</select></label>
   <label aria-label="Slots wagered"><DoubtChip slot/><select aria-label="Slots wagered" value={useSlots} onChange={e=>{const n=Number(e.currentTarget.value);changeStake(Math.max(m.escrowPoints,Math.min(usePoints,cap-n)),n)}}>{Array.from({length:Math.min(m.slots-1,cap-m.escrowPoints)-m.escrowSlots+1},(_,i)=>i+m.escrowSlots).map(n=><option key={n} value={n}>{n}</option>)}</select></label>
   <button type="button" className="primary db-submit" disabled={!valid} onClick={send}>{betting?'Declare claim':risk>min?'Counter-raise':'Call & reveal'}</button>
   {raising&&<button className="db-fold" type="button" onClick={()=>submit({kind:'fold'})}>Fold</button>}
  </div>
  <p className="db-hint">{betting?'Wilds count for every color.':risk<min?'Match at least '+min+' chips.':'The final slot stays protected.'} <span>Fictional points only.</span></p>
 </section>
}

export function DoubtBetBoard({view:v,you,name,host,active,hostNow,receivedAt,preview,submit}:Props){
 const claim=v.claim,score=v.latest,playing=v.phase!=='review'&&v.phase!=='done'
 return <section className="db-board" aria-label="Doubt and Bet table" data-db-phase={v.phase}>
  <header className="db-round"><span>Deal {v.round} / {doubtRounds}</span>{v.deadline!==null&&<Clock deadline={v.deadline} hostNow={hostNow} receivedAt={receivedAt} preview={preview}/>}<span>{playing&&v.turn?(v.turn===you?'Your turn':name(v.turn)+'’s turn'):v.phase==='review'?'Deal review':'Final score'}</span></header>
  <div className="db-shield">
   <div className="db-claim">
    {claim?<><DoubtCardArt card={claim.color}/><p><strong>{claim.count} × {doubtCardName(claim.color)}</strong><span>{name(claim.seat)}’s claim</span></p></>:<><DoubtCardArt/><p><strong>Opening claim</strong><span>One color. At least one card.</span></p></>}
    {v.wagers.length>0&&<ul aria-label="Raised wagers">{v.wagers.map(s=><li key={s.seat}><span>{name(s.seat)}</span><Wallet points={s.points} slots={s.slots}/></li>)}</ul>}
   </div>
   {score&&<div className="db-settlement" role="status">
    <strong>{name(score.winner)} wins the deal</strong><span>{score.reason==='fold'?'Folded · no cards revealed':score.counted+' matching cards, including wilds'}</span>
    {score.slots>0&&<small>{name(score.loser)} loses {score.slots} {score.slots===1?'slot':'slots'}</small>}
   </div>}
   {!score?.cards&&<div className="db-private" role="group" aria-label="Your private hand"><span>YOUR HAND</span>
    <div className="db-hand">{v.mine?.hand.map((card,i)=><DoubtCardArt key={i} card={card}/>)}
    {v.mine?.hand.length===0&&<span>No cards in this deal</span>}</div>
   </div>}
   {active&&playing&&v.turn===you&&v.mine&&<WagerControls v={v} submit={submit}/>}
   {active&&v.phase==='review'&&host&&<button className="primary db-advance" type="button" onClick={()=>submit({kind:'next'})}>Next deal</button>}
  </div>
  {score?.cards&&<section className="db-open" aria-label="Revealed hands">{score.cards.map(({seat,hand})=><div key={seat}><strong>{name(seat)}</strong><div className="db-hand">{hand.map((card,i)=><DoubtCardArt key={i} card={card} highlight={card==='wild'||card===score.claim.color}/>)}</div></div>)}</section>}
  <ul className="db-roster" aria-label="Table seats">{v.table.map(r=><li key={r.seat} data-db-turn={r.seat===v.turn||undefined} data-db-you={r.seat===you||undefined}>
   <span>{name(r.seat)}{r.seat===you?' (you)':''}</span><Wallet points={r.points} slots={r.slots}/>
   {v.phase==='done'&&<small>{sum(r)} score</small>}
  </li>)}</ul>
  {v.phase==='done'&&<p className="db-final">{v.leaders.length>1?'Shared lead: ':'Champion: '}{v.leaders.map(name).join(', ')}</p>}
 </section>
}
