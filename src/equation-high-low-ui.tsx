import {Fragment,useEffect,useState} from 'react'
import {base} from './brand'
import {arrangeEquation,equationOperatorOrders,equationRank,equationRounds,equationSuit,formatEquation,formatEquationValue,type Arrangement,type EquationAction,type EquationView} from './equation-high-low'
import './equation-high-low.css'

const chipWord=(n:number)=>n===1?'chip':'chips'
const phases={opening:'Opening wager',closing:'Final wager',seal:'Seal the equation',review:'Showdown',finished:'Final ledger'}
const targetNames={low:'Low',high:'High',swing:'Swing'}
const directions=['low','high','swing'] as const
type Direction=typeof directions[number]
type Props={view:EquationView;you:string;active:boolean;name:(seat:string)=>string;hostNow:number;submit:(a:EquationAction)=>void}

export function EquationCard({card,kind,small=false}:{card:number|null;kind?:string;small?:boolean}){
 return <span className="eh-card" data-eh-card-face={card===null?'covered':undefined} data-eh-ink={card===null?undefined:equationSuit(card).toLowerCase()} data-small={small||undefined} role="img"
  aria-label={card===null?'Face down':equationRank(card)+' '+equationSuit(card)+(kind?', '+kind:'')}>
  {kind==='Private'?<small className="eh-private" aria-hidden="true">Private</small>:<i aria-hidden="true">◇</i>}
  <b aria-hidden="true">{card===null?'✦':equationRank(card)}</b>{!small&&<span aria-hidden="true">{card===null?'Sealed':equationSuit(card)}</span>}
 </span>
}
function useClock(deadline:number|null,hostNow:number){
 const [seconds,setSeconds]=useState(0)
 useEffect(()=>{
  if(deadline===null)return
  const received=performance.now()
  const tick=()=>setSeconds(Math.max(0,Math.ceil((deadline-hostNow-performance.now()+received)/1000)))
  tick()
  const timer=window.setInterval(tick,225)
  return ()=>window.clearInterval(timer)
 },[deadline,hostNow])
 return seconds
}

function EquationWorkbench({hand,enabled,submit}:{hand:number[];enabled:boolean;submit:Props['submit']}){
 const [direction,setDirection]=useState<Direction>('low')
 const [lane,setLane]=useState<'low'|'high'>('low')
 const [plans,setPlans]=useState({low:{order:[] as number[],ops:0},high:{order:[] as number[],ops:0}})
 const edit=direction==='swing'?lane:direction
 const draft=plans[edit]
 const change=(patch:Partial<typeof draft>)=>setPlans(value=>({...value,[edit]:{...value[edit],...patch}}))
 const proposal=(key:'low'|'high'):Arrangement|null=>{
  const plan=plans[key]
  return plan.order.length===4?{order:[plan.order[0],plan.order[1],plan.order[2],plan.order[3]],ops:plan.ops}:null
 }
 const low=direction==='high'?null:proposal('low'),high=direction==='low'?null:proposal('high')
 const valid=(plan:Arrangement|null)=>plan?arrangeEquation(hand,plan):null
 const preview=valid(proposal(edit))
 const identical=low&&high&&low.ops===high.ops&&low.order.every((n,i)=>n===high.order[i])
 const canSeal=enabled&&!identical&&(direction==='high'||!!valid(low))&&(direction==='low'||!!valid(high))
 return <div className="eh-work">
  <h4>Choose your lane</h4>
  <div className="eh-lanes" role="group" aria-label="Target lane">
   {directions.map(d=><button type="button" key={d} data-lane={d} disabled={!enabled} aria-pressed={direction===d} onClick={()=>setDirection(d)}>
    <small>{d==='low'?'01':d==='high'?'20':'↔'}</small><strong>{targetNames[d]}</strong>
    <span>{d==='swing'?'Win both':'Closest to '+(d==='low'?'1':'20')}</span>
   </button>)}
  </div>
  {direction==='swing'&&<div className="eh-actions" role="group" aria-label="Swing equation">
   <button type="button" disabled={!enabled} aria-pressed={edit==='low'} onClick={()=>setLane('low')}>Build Low {valid(low)?'✓':''}</button>
   <button type="button" disabled={!enabled} aria-pressed={edit==='high'} onClick={()=>setLane('high')}>Build High {valid(high)?'✓':''}</button>
  </div>}
  <div className="eh-rack" role="group" aria-label="Arrange your four number cards">
   {hand.map((card,i)=><button type="button" key={i} disabled={!enabled} data-eh-pick={i} aria-pressed={draft.order.includes(i)}
     aria-label={(i===0?'Private':'Open')+' card '+(i+1)+': '+equationRank(card)+' '+equationSuit(card)}
     onClick={()=>change({order:draft.order.includes(i)?draft.order.filter(n=>n!==i):[...draft.order,i]})}>
    <EquationCard card={card} kind={i===0?'Private':undefined}/><span className="eh-slot">{draft.order.includes(i)?'Slot '+(draft.order.indexOf(i)+1):'Add card'}</span>
   </button>)}
  </div>
  <div className="eh-actions"><label>Operator order
   <select disabled={!enabled} value={draft.ops} onChange={e=>change({ops:Number(e.target.value)})}>
    {equationOperatorOrders.map((ops,i)=><option value={i} key={i}>{ops.join('  ')}</option>)}
   </select>
  </label>
  <button type="button" disabled={!enabled||draft.order.length===0} onClick={()=>change({order:[]})}>Clear cards</button></div>
  <div className="eh-expression" aria-label="Equation in progress">
   {hand.map((_,i)=><Fragment key={i}>
    <span>{draft.order[i]===undefined?'□':equationRank(hand[draft.order[i]])}</span>
    {i<3&&<i>{equationOperatorOrders[draft.ops][i]}</i>}
   </Fragment>)}<i>=</i><b>{preview?formatEquationValue(preview):'?'}</b>
  </div>
  <p className="eh-note" role="status">{identical?'Swing needs two different arrangements.':draft.order.length===4&&!preview?'Division by zero. Try a different card or move ÷.':'Tap all four cards in expression order. Division happens first.'}</p>
  <button type="button" className="eh-primary" disabled={!canSeal} onClick={()=>submit({kind:'seal',low,high})}>Seal {targetNames[direction]} equation{direction==='swing'?'s':''}</button>
 </div>
}

function Showdown({v,name,active,submit}:{v:EquationView;name:Props['name'];active:boolean;submit:Props['submit']}){
 const result=v.latest!
 const contributions=result.rows.map(row=>({
  ...row,delta:row.award-(v.table.find(r=>r.seat===row.seat)?.paid??0),
 }))
 const done=v.phase==='finished'
 return <div className="eh-work">
  <span className="eh-index">Round {v.round} / Pot {result.pot}</span>
  <h4>{done?'Final standings':'Round settlement'}</h4>
  {done&&<p className="eh-result">{v.leaders.length===1?name(v.leaders[0])+' takes the table':'Shared lead: '+v.leaders.map(name).join(', ')}</p>}
  <div className="eh-lane-results" role="status">
   {result.uncontested?<p><strong>{name(result.uncontested)}</strong> takes the uncontested pot.</p>:result.refunded?<p>No qualifying lanes. Contributions returned.</p>:<>
    <p data-lane="low"><small>Low · 1</small><strong>{result.low?name(result.low):'No winner'}</strong></p>
    <p data-lane="high"><small>High · 20</small><strong>{result.high?name(result.high):'No winner'}</strong></p>
   </>}
  </div>
  <ul className="eh-reveal" aria-label="Showdown equations">
   {contributions.map(r=><li key={r.seat} data-eh-result-seat={r.seat}>
    <div><strong>{name(r.seat)}</strong>{r.swingMiss&&<small>Swing missed</small>}</div>
    <div>{r.hand?<>{r.entries.map(e=><p key={e.lane}><small>{targetNames[e.lane]}</small> {formatEquation(r.hand!,e.arrangement)} = <b>{formatEquationValue(e.value)}</b></p>)}
     <div className="eh-reveal-cards" aria-label="Revealed cards">{r.hand.map(card=><EquationCard key={card} card={card} small/>)}</div>
    </>:<small>Hand not shown</small>}</div>
    <div><strong>{r.delta>0?'+':''}{r.delta} {chipWord(Math.abs(r.delta))}</strong><small>{r.award} received</small></div>
   </li>)}
  </ul>
  {!done&&<button type="button" className="eh-primary" disabled={!active} onClick={()=>submit({kind:'advance'})}>Next deal</button>}
 </div>
}

export function EquationHighLowBoard({view:v,you,active,name,hostNow,submit}:Props){
 const seconds=useClock(v.deadline,hostNow)
 const mine=v.mine,bet=v.phase==='opening'||v.phase==='closing',finished=v.phase==='finished'
 const betting=bet&&v.turn===you&&active
 const raise=Array.from({length:v.cap-v.price},(_,i)=>v.price+i+1)
 const roster=finished?v.table.slice().sort((a,b)=>b.stack-a.stack):v.table
 return <section className="eh-board" aria-label="Equation High-Low table" data-eh-phase={v.phase}>
  <header className="eh-header">
   <div><span className="eh-index">S1 / 11 · Arithmetic salon</span><h3>{phases[v.phase]}</h3><p>Deal {v.round} of {equationRounds} · {v.pot} {chipWord(v.pot)} in pot</p></div>
   <img src={base+'art/equation-high-low-instrument.svg'} alt="" width="280" height="96"/>
   {v.deadline!==null&&<span className="eh-clock" role="timer" aria-label={seconds+' seconds remaining'}>{seconds}s</span>}
  </header>
  <div className="eh-body">
   <div>
    {bet&&<div className="eh-work">
     <span className="eh-index">{v.phase==='opening'?'01 · Two open numbers':'02 · Final open number'}</span>
     <h4>{v.turn===you?'Your wager':name(v.turn!)+' to act'}</h4>
     {mine?.live&&<div className="eh-rack" aria-label="Your number cards">
      {mine.hand.map((card,i)=><EquationCard key={i} card={card} kind={i===0?'Private':undefined}/>)}
      {mine.hand.length===3&&<EquationCard card={null}/>}
     </div>}
     {mine?.live&&<><p className="eh-note">{v.price===0?'No wager yet. Check or open the betting.':v.toCall>0?v.toCall+' to call.':'Your wager already matches.'} Current wager cap: {v.cap}.</p>
      <div className="eh-actions" aria-label="Wager actions" role="group">
       <button type="button" className="eh-primary" disabled={!betting} onClick={()=>submit({kind:'call'})}>{v.toCall?'Call '+v.toCall:'Check'}</button>
       {raise.map(n=><button type="button" key={n} disabled={!betting} onClick={()=>submit({kind:'raise',to:n})}>Raise to {n}</button>)}
       <button type="button" disabled={!betting} onClick={()=>submit({kind:'fold'})}>Fold</button>
      </div></>}
     {!mine?.live&&<p className="eh-note">You are watching this deal.</p>}
    </div>}
    {v.phase==='seal'&&(mine?.live&&!mine.locked?<EquationWorkbench key={v.round} hand={mine.hand} enabled={active} submit={submit}/>:<div className="eh-work"><h4>{mine?.locked?'Your equation is sealed':'Watching the showdown'}</h4><p className="eh-note" role="status">Equations and targets open together at the reveal.</p></div>)}
    {v.latest&&<Showdown v={v} name={name} active={active} submit={submit}/>}
   </div>
   <aside className="eh-ledger">
    <span className="eh-index">Open information</span><h4>{finished?'Final stacks':'Table ledger'}</h4>
    <ul aria-label="Chip stacks">{roster.map(r=><li key={r.seat} data-eh-live={r.live||undefined} data-eh-turn={v.turn===r.seat||undefined}>
     <div className="eh-row-label"><strong>{name(r.seat)}{r.seat===you?' (you)':''}</strong><b>{r.stack} {chipWord(r.stack)}</b></div>
     {v.phase!=='finished'&&<div className="eh-open">
      {!!r.open.length&&<div><EquationCard card={null} small/>{r.open.map(card=><EquationCard key={card} card={card} small/>)}</div>}
      <small>{!r.open.length?'Out of chips':!r.live?'Folded':r.paid+' in pot'}</small>
     </div>}
    </li>)}</ul>
   </aside>
  </div>
  <footer><span>Division first · No real stakes</span><span>FAN TABLE / 2–8 SEATS</span></footer>
 </section>
}

const lessonCardRows=[[8,17,32,null],[8,17,32,4]]
const lessonLabel=['One private card, two open, and a covered final position','The last number opens after the opening wager','One plus four minus eight divided by two equals one','Choose a lane or try both with different arrangements','A Low winner and a High winner split six chips']

export function EquationHighLowLesson({step}:{step:number}){
 const i=Number.isInteger(step)&&step>=0&&step<lessonLabel.length?step:0
 return <figure className="eh-lesson" data-equation-high-low-example={i}>
  <div className="eh-example" key={i} role="img" aria-label={lessonLabel[i]}>
   <div className="eh-example-plate">
    <span className="eh-index">{['01 · The private card','02 · The two wagers','03 · The equation','04 · The declaration','05 · The settlement'][i]}</span>
    {i<2&&<div className="eh-example-rack">
     {lessonCardRows[i].map((card,j)=><EquationCard key={j} card={card} kind={j===0?'Private':undefined}/>)}
    </div>}
    {i===0&&<svg className="eh-example-rail" viewBox="0 0 260 22" fill="none" aria-hidden="true">
     <path d="M10 2v8h53V2m15 0v8h108V2m12 0v8h52V2" stroke="#e1b299" strokeWidth="1.5"/>
     <circle cx="36" cy="10" r="3" fill="#e1b299"/><path d="m125 10 7 7 7-7m78 0h15" stroke="#e1b299" strokeWidth="1.5"/>
    </svg>}
    {i===1&&<p>Raise to 2 → Call 2</p>}
    {i===2&&<div className="eh-example-rack">
     <EquationCard card={4}/><b>+</b><EquationCard card={17}/><b>−</b>
     <div className="eh-example-divide"><EquationCard card={32}/><b>÷</b><EquationCard card={8}/></div><b>= 1</b>
    </div>}
    {i===3&&<div className="eh-example-gates"><mark>LOW <b>1</b></mark><mark>SWING <b>↔</b></mark><mark>HIGH <b>20</b></mark></div>}
    {i===4&&<div className="eh-example-gates">
     {['ADA · LOW','BO · HIGH'].map(lane=><mark key={lane}>{lane}
      <span className="eh-example-coins" aria-hidden="true"><i/><i/><i/></span><b>+3</b>
     </mark>)}
    </div>}
   </div>
  </div>
 </figure>
}
