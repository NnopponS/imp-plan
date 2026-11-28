import {useEffect,useState} from 'react'
import {equationTowerRules,matchedTower,shiftTower,type EquationTowerView,type TowerCommand,type TowerStacks} from './equation-tower'
import {TowerPedestals,inscription,standNames} from './equation-tower-figures'

const phaseNames={call:'Call a budget',challenge:'Undercut the call',build:'Stack the blocks',review:'Read the proof',done:'Tower record'}
type Selection={from:number,count:number,flip:boolean,step:number}
export function EquationTowerBoard({view:g,you,name,active,preview,hostNow,receivedAt,send}:{
 view:EquationTowerView,you:string,name:(id:string)=>string,active:boolean,preview?:boolean,hostNow:number,receivedAt?:number,send:(a:TowerCommand)=>void,
}){
 const solo=g.seats.length===1,planning=g.phase==='call'||g.phase==='challenge'
 const control=active&&!preview&&g.seats.includes(you)
 const canBuild=control&&g.phase==='build'&&g.builder===you
 const canCall=control&&planning&&!g.passed.includes(you)&&!g.declared.some(a=>a.seat===you)
 const best=g.phase==='challenge'?g.budget-1:equationTowerRules.budget
 const [choice,setChoice]=useState(1),value=Math.min(choice,Math.max(1,best))
 const [selection,setSelection]=useState<Selection|null>(null)
 const selected=selection?.step===g.step?selection:undefined
 const [scratch,setScratch]=useState<{round:number,stacks:TowerStacks,moves:number}|null>(null)
 const plan=planning&&scratch?.round===g.round?scratch:null
 const stacks=plan?.stacks??g.stacks
 const matching=matchedTower(stacks,g.target)
 const clock=useClock(g.deadline,hostNow,receivedAt,!!preview)
 const canMove=canBuild||control&&planning
 const update=(patch:Partial<Selection>)=>{if(selected)setSelection({...selected,...patch})}
 function commit(to:number){
  if(!selected)return
  const {from,count,flip}=selected,shift={from,to,count,flip},next=shiftTower(stacks,shift)
  if(!next)return
  if(planning)setScratch({round:g.round,stacks:next,moves:(plan?.moves??0)+1})
  else send({kind:'shift',...shift})
  setSelection(null)
 }
 const report=matching===null?null:inscription(stacks[matching])
 return <section className="et-atelier" aria-label="Tower of Equations table" data-equation-tower={g.phase} data-equation-pace={solo?'workshop':g.mode}>
  <div className="et-plinth" aria-label="Round target">
   <div className="et-target"><span>Target</span><strong data-equation-target={g.target.value}>{g.target.value}</strong></div>
   <div className="et-target et-height"><span>Floors</span><strong data-equation-height={g.target.height}>{g.target.height}</strong></div>
   <div className="et-clock"><small>{solo?'Workshop':g.mode==='quick'?'Quick clock':'Standard clock'}</small><b>{g.round}/{g.maxRounds}</b>{clock!==null&&<span aria-label="Seconds remaining">{clock}s</span>}</div>
  </div>
  <div className="et-stage">
   <p className="et-status"><strong>{phaseNames[g.phase]}</strong><span>{planning?(plan?'Draft · '+plan.moves+(plan.moves===1?' move':' moves'):'Draft privately'):g.phase==='build'?g.used+' / '+g.budget+(g.budget===1?' move':' moves'):g.last?.success?'✶ Proof accepted':g.last?.reason==='skipped'?'No declaration':'Proof closed'}</span></p>
   <TowerPedestals stacks={stacks} bundle={selected} matching={matching} select={canMove?(i)=>selected?commit(i):setSelection({step:g.step,from:i,count:1,flip:false}):undefined}/>
   <p className="et-expression" aria-live="polite">{report??(selected?'Choose a stand for your bundle.':canMove?'Tap a stand to lift its top block.':'Read the stack from the top.')}</p>
  </div>
  {canMove&&selected&&<div className="et-tools" aria-label="Lifted bundle">
    <span className="et-count"><button type="button" aria-label="Lift one fewer block" disabled={selected.count<=1} onClick={()=>update({count:selected.count-1,flip:selected.count===2?false:selected.flip})}>−</button>
     <output aria-label="Blocks lifted">{selected.count}</output><button type="button" aria-label="Lift one more block" disabled={selected.count>=stacks[selected.from].length} onClick={()=>update({count:selected.count+1})}>+</button></span>
    <button type="button" aria-pressed={selected.flip} disabled={selected.count<2} onClick={()=>update({flip:!selected.flip})}>Flip bundle</button>
    <button type="button" disabled={!selected.flip||selected.count<2} onClick={()=>commit(selected.from)}>Flip in place</button>
    <button type="button" onClick={()=>setSelection(null)}>Cancel lift</button>
   </div>}
  {planning&&<div className="et-docket">
    <p>{g.builder?<><strong>{name(g.builder)} called {g.budget}</strong> {g.budget===1?'· Cannot undercut':'moves'}</>:<>First to call opens a challenge window.</>}</p>
    {canCall&&<div className="et-tools">
     {best>0&&<><span className="et-count"><button type="button" aria-label="Decrease declared moves" disabled={value<=1} onClick={()=>setChoice(value-1)}>−</button>
      <output aria-label="Declared moves">{value}</output><button type="button" aria-label="Increase declared moves" disabled={value>=best} onClick={()=>setChoice(value+1)}>+</button></span>
      <button type="button" className="primary" onClick={()=>send({kind:'call',moves:value})}>Call {value} {value===1?'move':'moves'}</button></>}
     <button type="button" onClick={()=>send({kind:'pass'})}>Pass</button>
    </div>}
    {control&&plan&&<button type="button" onClick={()=>{setScratch(null);setSelection(null)}}>Clear private draft</button>}
   </div>}
  {g.phase==='build'&&!solo&&<p className="et-docket">{g.builder===you?'Use exactly the count you called.':g.builder?name(g.builder)+' is building. Watch the shared tower.':'Watching the proof.'}</p>}
  {canBuild&&g.canRestart&&<button type="button" onClick={()=>send({kind:'restart'})}>Reset puzzle</button>}
  {(g.phase==='review'||g.phase==='done')&&g.last&&<div className="et-docket" aria-live="polite"><strong>{g.last.success?'Tower proved':g.last.reason==='skipped'?'Round skipped':'Tower failed'}</strong>
   <span>{g.last.tower!==null?' · Stand '+standNames[g.last.tower]:''} {g.last.points>0?'+':''}{g.last.points} {Math.abs(g.last.points)===1?'point':'points'}</span>
   {solo&&control&&g.phase==='review'&&<button type="button" className="primary" onClick={()=>send({kind:'advance'})}>{g.round===g.maxRounds?'See workshop results':'Open next target'}</button>}
  </div>}
  {(!solo||g.phase==='done')&&<ul className="et-score" aria-label="Tower scores">{g.seats.map((seat,i)=><li key={seat}><span>{name(seat)}</span><strong>{g.scores[i]}</strong></li>)}</ul>}
 </section>
}

function useClock(deadline:number|null,hostNow:number,receivedAt:number|undefined,preview:boolean){
 const [last,setLast]=useState(()=>performance.now())
 useEffect(()=>{
  if(preview||deadline===null)return
  const id=window.setInterval(()=>setLast(performance.now()),250)
  return ()=>window.clearInterval(id)
 },[deadline,preview])
 return deadline===null?null:Math.max(0,Math.ceil((deadline-hostNow-(preview?0:Math.max(0,last-(receivedAt??last))))/1000))
}
