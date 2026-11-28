import {useEffect,useState} from 'react'
import {UnknownCubePreview,UnknownMosaic,tileNames} from './unknown-art'
import {lawText,rollCube,unknownDestination,unknownDistance,type UnknownMove,type UnknownView} from './unknown'

const directionName={north:'North',east:'East',south:'South',west:'West'} as const
const arrows={north:'↑',east:'→',south:'↓',west:'←'} as const
type Props={view:UnknownView;you:string;name:(id:string)=>string;hostNow:number;receivedAt?:number;active:boolean;preview?:boolean;send:(action:UnknownMove)=>void}
export function UnknownBoard({view:v,you,name,hostNow,receivedAt,active,preview,send}:Props){
 const [local,setLocal]=useState(()=>performance.now())
 useEffect(()=>{
  if(!active||preview||v.end)return
  const sync=()=>setLocal(performance.now())
  sync()
  const timer=window.setInterval(sync,125)
  return ()=>window.clearInterval(timer)
 },[active,preview,v.end,v.step])
 const turn=v.cubes.find(c=>c.seat===v.turn)
 const mine=v.cubes.find(c=>c.seat===you)
 const choice=active&&!preview&&!v.end&&v.turn===you
 const timer=Math.max(0,Math.ceil((v.deadline-hostNow-Math.max(0,local-(receivedAt??local)))/1000))
 const last=v.trace.at(-1)
 const actions=v.allowed.flatMap(dir=>dir==='pass'||!turn?[]:[{dir,cell:unknownDestination(turn.cell,dir),top:rollCube(turn.faces,dir)[0]}])
 const currentStatus=v.end?(v.winner?name(v.winner)+' wins':'Shared lead'):v.turn===you?'Your roll':name(v.turn)+' to roll'
 return <section className="unknown-table" data-unknown-table="" data-stage={v.end?'finished':'race'} aria-label="Unknown cube race">
  <header className="unknown-dial">
   <div aria-live="polite"><strong>{currentStatus}</strong><small>{v.end?(v.end==='center'?'Center reached':'Ten circuits complete'):`Circuit ${v.round} / 10${v.bonus?' · Echo roll':''}`}</small></div>
   {!v.end&&<span className="unknown-clock" role="timer" aria-label={timer+' seconds remaining'}>{timer}<small>s</small></span>}
  </header>
  <div className="unknown-tray">
   <UnknownMosaic board={v.board} cubes={v.cubes} trace={last}/>
   <div className="unknown-actions" aria-label="Roll your cube">
    {actions.map(({dir,cell,top})=><button key={dir} type="button" data-roll={dir} aria-label={`Roll ${dir} to ${tileNames[v.board[cell]]}, ${tileNames[top]} on top`}
     title={`${directionName[dir]} · ${tileNames[top]} on top`}
     style={{gridRow:Math.floor(cell/7)+1,gridColumn:cell%7+1}} disabled={!choice||timer===0} onClick={()=>send(dir)}>{arrows[dir]}</button>)}
   </div>
  </div>
  <div className="unknown-observation" aria-live="polite">
   {last?last.to===null?<span>{name(last.seat)} passed.</span>:<>
    <strong>{name(last.seat)} rolled {tileNames[last.top]}.</strong>
    {last.exiled&&<span>Returned home.</span>}
    {last.shifted&&<span>Turned to {tileNames[last.after]}.</span>}
    {last.pushed&&<span>{name(last.pushed.seat)} pushed{last.pushed.exiled?' home':''}.</span>}
    {last.echo&&<span>One more roll.</span>}
   </>:<span>Follow the cube. The chamber will not explain an effect until its seal opens.</span>}
   {choice&&v.allowed.includes('pass')&&<button type="button" disabled={timer===0} onClick={()=>send('pass')}>Pass blocked turn</button>}
  </div>
  <div className="unknown-rail">
   {mine&&<div className="unknown-yours"><UnknownCubePreview faces={mine.faces} serial={v.seats.indexOf(you)+1}/><div><strong>Your cube</strong><small>{tileNames[mine.faces[0]]} top · {unknownDistance(mine.cell)} from center</small></div></div>}
   <details className="unknown-laws"><summary>Rule seals <span>{v.revealed.length} / 3</span></summary>
    {v.revealed.length?<ul>{v.revealed.map(law=><li key={law}>{lawText[law]}</li>)}</ul>:<p>One seal opens after every two circuits. Observe where cubes roll, shift or return home.</p>}
   </details>
  </div>
  {v.trace.length>1&&<details className="unknown-history">
   <summary>Observation log · {v.trace.length}</summary>
   <ol>{[...v.trace].reverse().map((event,i)=><li key={i}>{event.to===null?
    `${name(event.seat)} passed`:
    `${name(event.seat)} · ${tileNames[event.top]} on ${tileNames[v.board[event.to]]}${event.exiled?' · home':''}${event.shifted?' · shifted to '+tileNames[event.after]:''}${event.echo?' · extra roll':''}${event.pushed?' · pushed '+name(event.pushed.seat)+(event.pushed.exiled?' home':''):''}`
   }</li>)}</ol>
  </details>}
  {v.end&&<ol className="unknown-standings" aria-label="Final cube positions">
   {[...v.cubes].sort((a,b)=>unknownDistance(a.cell)-unknownDistance(b.cell)).map(c=><li key={c.seat}>{name(c.seat)}{c.seat===v.winner?' · Winner':''}<span>{unknownDistance(c.cell)} from center</span></li>)}
  </ol>}
 </section>
}
