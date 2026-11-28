import {useEffect,useState} from 'react'
import type {GradationView} from './gradation'
import {GradationGauge,GradationSluice,GradationWeight as Weight} from './gradation-figures'
import './gradation.css'

const gates=[1,2,3,4,5,6,7],sides=['Copper','Jade']
type Props={view:GradationView;you:string;name:(id:string)=>string;active:boolean;hostNow:number;send:(order:number[],target:number|null)=>void}
type Round=GradationView['current']
function Register({row,compact=false}:{row:Round;compact?:boolean}){
 return <div className={'grad-register'+(compact?' compact':'')} role="group" aria-label={'Round '+row.round+' gate comparison'}>
 {row.targets.some(n=>n!==null)&&<p data-grad-shown-targets>Marked gates: Copper {row.targets[0]!+1} · Jade {row.targets[1]!+1}</p>}
 <div className="grad-comparison">{gates.map((n,i)=>{
  const g=row.gates[i]
  return <div key={n} data-grad-gate={i} data-side={g?.winner??'none'} className="grad-column">
   <GradationSluice gate={n} closed={!g}/>
   <span className="sr">Gate {n}</span>
   {g?<><div className="grad-public-pair" role="img" aria-label={'Copper '+g.values[0]+', Jade '+g.values[1]}>
     <Weight value={g.values[0]} small/><Weight value={g.values[1]} small metal="jade"/>
    </div><small>{g.winner===null?'Tie':sides[g.winner]}</small>
    <em>{g.bonus!==null?'Streak +1':''}{g.bonus!==null&&g.double?' · ':''}{g.double?'Mark +1':''}</em></>:<span className="sr">Sealed</span>}
  </div>})}</div>
 </div>
}
function useSeconds(deadline:number|null,now:number,phase:string){
 const [left,setLeft]=useState<number|null>(null)
 useEffect(()=>{
  if(deadline===null||phase!=='arrange')return
  const began=performance.now(),tick=()=>setLeft(Math.max(0,Math.ceil((deadline-now-(performance.now()-began))/1000)))
  tick();const t=window.setInterval(tick,200);return ()=>window.clearInterval(t)
 },[deadline,now,phase])
 return deadline===null?0:left??Math.max(0,Math.ceil((deadline-now)/1000))
}
export function GradationBoard({view:v,you,name,active,hostNow,send}:Props){
 const [draft,setDraft]=useState<number[]>(Array(7).fill(0)),[slot,setSlot]=useState(0),[target,setTarget]=useState<number|null>(null)
 const own=v.allocators.indexOf(you),phase=v.phase,arranging=phase==='arrange',left=useSeconds(v.deadline,hostNow,phase)
 const ready=active&&arranging&&own!==-1&&!v.mine&&left>0,order=v.mine?.order??draft,filled=order.filter(Boolean).length
 const publicRow=phase==='done'?v.history.at(-1)!:v.current
 function place(w:number){
  if(!ready)return
  const next=[...draft],old=next.indexOf(w)
  if(old!==-1)next[old]=next[slot]
  next[slot]=w
  setDraft(next)
  const empty=next.indexOf(0)
  setSlot(empty<0?(slot+1)%7:empty)
 }
 const team=v.teams.findIndex(t=>t.includes(you))
 const outcome=v.winner===null?'Draw after six rounds':sides[v.winner]+' wins'
 return <section className="grad-board" aria-label="Gradation tide cabinet" data-grad-phase={phase} data-grad-round={v.round}>
 <header className="grad-header"><GradationGauge/><div><span className="grad-kicker">The tide cabinet</span><h3>{phase==='done'?outcome:arranging?(v.mine?'Tray sealed':own<0?'At the rail':'Set your weights'):'Opening the gates'}</h3></div>
 <p className="grad-dial">{phase==='done'?'Final':v.round===6?'Tiebreak':'Round '+v.round+' / 5'}{arranging&&<strong>{left}s</strong>}</p></header>
 <div className="grad-scores">{v.teams.map((t,i)=>{
  const allocator=v.allocators[i]
  return <div key={i} data-side={i}><span>{sides[i]}{i===team?' · You':''}</span><strong>{v.totals[i]}</strong><small>{arranging&&allocator?name(allocator):t.length+' '+(t.length===1?'player':'players')}</small></div>
 })}</div>
 {arranging&&own!==-1?<>
  {v.mine&&<p data-grad-receipt className="grad-note" role="status">Sealed. Only you can see this tray until the gates open.</p>}
  <div className="grad-slots" role="group" aria-label="Your seven gates">{gates.map((n,i)=><button type="button" className="grad-slot" key={n} aria-label={'Gate '+n+(order[i]?', weight '+order[i]:', empty')} aria-pressed={slot===i&&ready} disabled={!ready} onClick={()=>setSlot(i)}>
   <GradationSluice gate={n} closed={!order[i]}/>{order[i]>0&&<Weight key={order[i]} value={order[i]} metal={own===1?'jade':'copper'}/>}
  </button>)}</div>
  {!v.mine&&<>
   <div className="grad-bank" role="group" aria-label="Weight bank">{gates.map(n=><button type="button" key={n} data-used={draft.includes(n)} disabled={!ready} aria-label={'Place weight '+n} onClick={()=>place(n)}><Weight value={n} small metal={own===1?'jade':'copper'}/></button>)}</div>
   {v.marked&&<label className="grad-marked">My double-point gate <select value={target??''} disabled={!ready} onChange={e=>setTarget(e.target.value===''?null:Number(e.target.value))}><option value="">Choose gate</option>{gates.map((n,i)=><option key={n} value={i}>Gate {n}</option>)}</select></label>}
   <div className="grad-tools"><button type="button" disabled={!ready} aria-label="Fill in ascending order" onClick={()=>{setDraft([...gates]);setSlot(0)}}>Autofill</button><span>{filled}/7</span>
   <button type="button" className="grad-submit" disabled={!ready||filled!==7||v.marked&&target===null} onClick={()=>send([...draft],target)}>Seal my tray</button></div></>}
  {v.mine&&v.marked&&<p className="grad-note">My marked gate: {v.mine.target!+1}</p>}
 </>:arranging?<p className="grad-note">Your allocator is working behind the screen. Both trays will open one gate at a time.</p>:<>
  <p className="grad-note" role="status">{phase==='done'?'Final round':('Gate '+publicRow.gates.length+' of 7')} · Copper above, Jade below. {publicRow.gates.length===7?'Round score: '+publicRow.points.join(' : '):'The larger weight wins.'}</p>
  <Register row={publicRow}/></>}
 {arranging&&<details className="grad-help"><summary>Cabinet notes</summary>
  {own>=0&&<p>Pick a weight for the outlined gate. To swap, pick a gate, then a weight already in use.</p>}
  <p className="grad-caption">Allocators this round: {name(v.allocators[0])} (Copper) and {name(v.allocators[1])} (Jade).</p>
  {v.teams.map((t,i)=><p key={i}>{sides[i]}: {t.map(name).join(', ')}</p>)}
 </details>}
 {v.history.length>0&&<details className="grad-history"><summary>Round ledger ({v.history.length})</summary>{v.history.map(r=><section key={r.round}><h4>Round {r.round} · Copper {r.points[0]} : {r.points[1]} Jade</h4><Register row={r} compact/></section>)}</details>}
 </section>
}
const lessonText=['Distribute 1 to 7. Each number fits exactly one gate.','Copper 6 beats Jade 3 at the first gate.','Three Copper wins in a row pay one extra point.','Mark gate 2 for a bonus if your own weight wins there.','Five rounds decide the match. If tied, one final round can settle it.']
export function GradationLesson({step,caption=true}:{step:number;caption?:boolean}){
 const i=Math.min(4,Math.max(0,step))
 return <div className="grad-lesson" data-grad-lesson={i}><span className="grad-kicker">THE TIDE CABINET · FIELD NOTES</span>
 {i===4?<div className="grad-ledger-scene" aria-hidden="true"><span>ROUND</span><b>COPPER</b><b>JADE</b>{[[5,3],[3,5],[5,3],[3,5],[5,3]].map(([a,b],j)=><div key={j}><span>{j+1}</span><b>{a}</b><b>{b}</b></div>)}<footer><span>Total</span><b>21</b><b>19</b></footer></div>:<div key={i} aria-hidden="true" className="grad-lesson-row">{(i===0?[1,4,2,7,5,6,3]:[6,4,5,1,2,7,3]).map((n,k)=><div key={k} data-lit={i===1?k===0:i===2?k<3:i===3?k===1:false}><GradationSluice gate={k+1}/><Weight value={n} small/>{i>0&&<small>{[3,2,1,4,7,5,6][k]}</small>}{i===3&&k===1&&<i className="grad-lesson-mark">×2</i>}</div>)}</div>}
 {caption&&<p>{lessonText[i]}</p>}</div>
}
