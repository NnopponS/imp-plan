import {useEffect,useRef,useState,type KeyboardEvent} from 'react'
import {linkAdjacent,linkCells,linkPairLimit,linkSide,type LinkPaths,type LinkView} from './color-link'
import type {Command,Snapshot} from './room'
import {InstrumentPicker} from './instrument-picker'
import './color-link.css'

type LinkCommand=Extract<Command,{kind:'color-link'}>['action']
const letters='ABCDEF', cells=Array.from({length:linkCells},(_,i)=>i)
const coordinate=(cell:number)=>letters[cell%linkSide]+(Math.floor(cell/linkSide)+1)
const xy=(cell:number)=>[(cell%linkSide)*20+10,Math.floor(cell/linkSide)*20+10]
function Traces({paths}:{paths:LinkPaths}){
 return <svg className="cl-traces" viewBox="0 0 120 120" aria-hidden="true">
  {paths.map((path,i)=>path.length>=2&&<g data-link-trace key={i} className={'cl-tone-'+i}>
   <polyline points={path.map(c=>xy(c).join(',')).join(' ')} className="cl-trace-shadow"/>
   <polyline points={path.map(c=>xy(c).join(',')).join(' ')} className="cl-trace-inlay"/>
   <polyline points={path.map(c=>xy(c).join(',')).join(' ')} className="cl-trace-shine"/>
  </g>)}
 </svg>
}

// Show the actual private trace at a glance, without requiring color recognition.
function RouteGlyph({letter,path,ends,done}:{letter:string;path:readonly number[];ends:readonly [number,number];done:boolean}){
 const position=(c:number)=>[6+(c%linkSide)*4,4+Math.floor(c/linkSide)*3.7] as const
 return <svg viewBox="0 0 40 27" data-link-route-glyph aria-hidden="true" focusable="false">
  <path className="cl-route-ruling" d="M4 2.15h24v22.2H4zM8 2.15v22.2m4-22.2v22.2m4-22.2v22.2m4-22.2v22.2m4-22.2v22.2M4 5.85h24M4 9.55h24M4 13.25h24M4 16.95h24M4 20.65h24"/>
  {path.length>1&&<polyline className="cl-route-wire" points={path.map(c=>position(c).join(',')).join(' ')}/>}
  {ends.map(c=>{const [x,y]=position(c);return <circle key={c} cx={x} cy={y} r="2.3" className="cl-route-end"/>})}
  <text x="35" y={done?11:17} textAnchor="middle">{letter}</text>
  {done&&<path className="cl-route-check" d="m32 18 2 2 4-5"/>}
 </svg>
}

type Draft={step:number;placement:number[];route:number|null;paths:number[][]}
const emptyDraft=(step:number):Draft=>({step,placement:[],route:null,paths:Array.from({length:linkPairLimit},()=>[])})
function roundMessage(review:NonNullable<LinkView['review']>,name:(id:string)=>string){
 const winner=review.winner?name(review.winner):''
 switch(review.reason){
  case 'connected':return winner+' wins the challenge. The routes fit.'+(review.automatic?' The table called when time ran out.':'')
  case 'impossible':return winner+' wins the challenge. No disjoint routes fit.'+(review.automatic?' The table called when time ran out.':'')
  case 'accepted-impossible':return winner+' wins. An earlier accepted pair had already blocked the board.'
  case 'race':return winner+' submitted all six routes first.'
  case 'place-timeout':return winner+' wins the round. The placement clock ran out.'
  case 'race-timeout':return 'Round drawn. Neither player proved all six routes in time.'
  case 'inconclusive':return 'Round drawn. The table could not determine whether the routes fit.'
 }
}

export function ColorLinkBoard({snap,name,active,receivedAt,submit}:{snap:Snapshot;name:(id:string)=>string;active:boolean;receivedAt?:number;submit:(a:LinkCommand)=>void}){
 const v=snap.game!.colorLink!, me=snap.you, pair=v.pairs.length
 const [staged,setStaged]=useState(()=>emptyDraft(v.step))
 const [focus,setFocus]=useState(0)
 const [now,setNow]=useState(()=>performance.now())
 const [pending,setPending]=useState<{step:number;at:number}|null>(null)
 const buttons=useRef<Array<HTMLButtonElement|null>>([])
 useEffect(()=>{
  if(v.deadline===null)return
  const timer=window.setInterval(()=>setNow(performance.now()),150)
  return ()=>window.clearInterval(timer)
 },[v.deadline])
 const seconds=v.deadline===null?null:Math.max(0,Math.ceil((v.deadline-snap.hostNow-Math.max(0,now-(receivedAt??now)))/1000))
 const waiting=pending?.step===v.step&&now-pending.at<800
 const draft=staged.step===v.step?staged:emptyDraft(v.step)
 const canAct=active&&seconds!==0&&!waiting
 const canPlace=canAct&&v.phase==='place'&&v.actor===me
 const canRespond=canAct&&v.phase==='respond'&&v.actor===me
 const canRoute=canAct&&v.phase==='race'&&v.seats.includes(me)
 const terminals=new Map<number,number>()
 v.pairs.forEach((p,i)=>p.cells.forEach(c=>terminals.set(c,i)))
 const showingPaths=v.review?.paths??(v.phase==='race'?draft.paths:[])
 const pathOwners=new Map<number,number>()
 showingPaths.forEach((path,i)=>path.forEach(c=>pathOwners.set(c,i)))
 const routeComplete=(i:number)=>{
  const path=draft.paths[i]
  const ends=v.pairs[i]?.cells
  return !!ends&&path.length>1&&ends.includes(path[0])&&ends.includes(path.at(-1)!)
 }
 const completed=draft.paths.filter((_,i)=>routeComplete(i)).length
 const selected=draft.route===null?[]:draft.paths[draft.route]
 const writeRoute=(route:number,path:number[])=>setStaged({...draft,route,paths:draft.paths.map((r,i)=>i===route?path:r)})
 const eligible=(c:number)=>{
  if(canPlace)return !terminals.has(c)
  if(!canRoute)return false
  const endpoint=terminals.get(c)
  if(endpoint!==undefined&&(endpoint!==draft.route||!selected.length))return true
  if(draft.route===null||selected.length===0||pathOwners.has(c)&&pathOwners.get(c)!==draft.route)return false
  return selected.includes(c)||(!routeComplete(draft.route)&&linkAdjacent(selected.at(-1)!,c))
 }
 function pressCell(c:number){
  if(!eligible(c))return
  if(canPlace){
   const marks=draft.placement
   const next=marks.includes(c)?marks.filter(n=>n!==c):marks.length<2?[...marks,c]:[marks[0],c]
   setStaged({...draft,placement:next});return
  }
  const endpoint=terminals.get(c)
  if(endpoint!==undefined&&draft.route!==endpoint){
   const path=draft.paths[endpoint]
   writeRoute(endpoint,path.length?path:[c]);return
  }
  const route=draft.route
  if(route===null)return
  if(!selected.length){if(endpoint===route)writeRoute(route,[c]);return}
  if(selected.includes(c)){writeRoute(route,selected.slice(0,selected.indexOf(c)+1));return}
  if(!routeComplete(route)&&linkAdjacent(selected.at(-1)!,c))writeRoute(route,[...selected,c])
 }
 function gridKey(e:KeyboardEvent<HTMLButtonElement>,c:number){
  let next=c
  switch(e.key){
   case 'ArrowUp':if(c>=linkSide)next=c-linkSide;break
   case 'ArrowDown':if(c+linkSide<linkCells)next=c+linkSide;break
   case 'ArrowLeft':if(c%linkSide>0)next=c-1;break
   case 'ArrowRight':if(c%linkSide<linkSide-1)next=c+1;break
   case 'Home':next=c-c%linkSide;break
   case 'End':next=c-c%linkSide+linkSide-1;break
   default:return
  }
  e.preventDefault();buttons.current[next]?.focus()
 }
 function send(a:LinkCommand){
  setPending({step:v.step,at:performance.now()})
  if(document.activeElement instanceof HTMLButtonElement&&!document.activeElement.classList.contains('cl-cell'))buttons.current[focus]?.focus({preventScroll:true})
  submit(a)
 }
 const status=v.review?roundMessage(v.review,name):!active?'Connection interrupted.':seconds===0?'Time is up. Waiting for the table.':
  v.phase==='race'?'Trace all six pairs on your board. Your rival cannot see your draft.':
  v.phase==='respond'?(v.actor===me?'Your call. Can every pair still connect?':name(v.actor!)+' is deciding whether to challenge.'):
  v.retry&&v.actor===me?'Search was inconclusive. Choose a different placement.':
  v.actor===me?'Your turn. Choose two empty cells for pair '+letters[pair]+'.':name(v.actor!)+' is placing pair '+letters[pair]+'.'
 return <section className="color-link" aria-label="Color Link board" data-phase={v.phase} data-round={v.round}>
  <div className="cl-mast"><span>ROUND {v.round} / 3</span><span>{pair} / {linkPairLimit} PAIRS</span>
   {seconds!==null&&<span className="cl-clock" role="timer" aria-label={v.phase==='review'?'Next round in':'Time remaining'} data-urgent={(v.phase!=='review'&&seconds<=5)||undefined}>{seconds} s</span>}
  </div>
  <p className="cl-status" role="status">{status}</p>
  <div className="cl-shell">
   <span className="cl-corner" aria-hidden="true">+</span>
   <div className="cl-columns" aria-hidden="true">{letters.split('').map(c=><span key={c}>{c}</span>)}</div>
   <div className="cl-rows" aria-hidden="true">{letters.split('').map((_,i)=><span key={i}>{i+1}</span>)}</div>
   <div className="cl-bed">
    <div className="cl-grid" role="grid" aria-label="Routing cells. Use arrow keys to move, Enter or Space to select.">
     {Array.from({length:linkSide},(_,i)=><div key={i} className="cl-row" role="row">
      {cells.slice(i*linkSide,(i+1)*linkSide).map(c=>{
       const terminal=terminals.get(c), preview=v.phase==='place'&&draft.placement.includes(c), routed=pathOwners.get(c)
       const available=eligible(c), key=terminal??(preview?pair:undefined)
       return <div key={c} role="gridcell" className="cl-tile">
        <button type="button" className="cl-cell" aria-label={coordinate(c)+' · '+(terminal!==undefined?'Pair '+letters[terminal]+' endpoint':preview?'Pair '+letters[pair]+' draft':routed!==undefined?'Route '+letters[routed]:'Open')}
         tabIndex={focus===c?0:-1} aria-pressed={preview||(v.phase==='race'&&routed===draft.route&&routed!==undefined)} aria-disabled={!available}
         ref={el=>{buttons.current[c]=el}} onFocus={()=>setFocus(c)} onKeyDown={e=>gridKey(e,c)} onClick={()=>pressCell(c)}>
         {key!==undefined&&<span className={'cl-token cl-tone-'+key} data-link-terminal={terminal!==undefined?letters[terminal]:undefined}
          data-preview={preview||undefined} data-fresh={v.phase==='respond'&&terminal===pair-1||undefined} aria-hidden="true">{letters[key]}</span>}
        </button>
       </div>
      })}
     </div>)}
    </div>
    <Traces paths={showingPaths}/>
   </div>
  </div>
  <div className="cl-tools">
   <div className="cl-duelists" aria-label="Round scores">{v.seats.map((id,i)=><div key={id} data-turn={v.actor===id||undefined}>
    <span>{name(id)}{id===me&&<small> · You</small>}</span><strong aria-label={v.score[i]+' round wins'}>{v.score[i]}</strong>
   </div>)}</div>
   {v.phase==='place'&&v.actor===me&&<div className="cl-place">
    <span>Pair {letters[pair]} {draft.placement.length===0?'· Select both ends':'· '+draft.placement.map(coordinate).join(' / ')}</span>
    <button className="primary" type="button" disabled={!canPlace||draft.placement.length!==2} onClick={()=>send({type:'place',cells:[draft.placement[0],draft.placement[1]]})}>Place pair {letters[pair]}</button>
   </div>}
   {v.phase==='respond'&&v.actor===me&&<div className="cl-actions">
    <button className="primary" type="button" disabled={!canRespond} onClick={()=>send({type:'accept'})}>Accept</button>
    <button type="button" disabled={!canRespond} onClick={()=>send({type:'challenge'})}>Challenge</button>
   </div>}
   {v.phase==='race'&&<div className="cl-race">
    <span>{completed} of 6 routes complete</span>
    <InstrumentPicker className="cl-route-picks" label="Choose a route" value={draft.route??-1} disabled={!canRoute}
     options={v.pairs.map((p,i)=>({value:i,label:'Route '+letters[i]+(routeComplete(i)?' · Complete':''),
      className:'cl-tone-'+i,face:<RouteGlyph letter={letters[i]} path={draft.paths[i]} ends={p.cells} done={routeComplete(i)}/> }))}
     select={i=>writeRoute(i,draft.paths[i].length?draft.paths[i]:[v.pairs[i].cells[0]])}/>
    <div className="cl-actions">
     <button type="button" disabled={!canRoute||selected.length<2} onClick={()=>writeRoute(draft.route!,selected.slice(0,-1))}>Undo step</button>
     <button type="button" disabled={!canRoute||selected.length===0} onClick={()=>writeRoute(draft.route!,[])}>Clear route</button>
    </div>
    <button className="primary" type="button" disabled={!canRoute||completed!==linkPairLimit} onClick={()=>send({type:'proof',paths:draft.paths})}>Submit proof</button>
   </div>}
  </div>
 </section>
}

export function ColorLinkLesson({step}:{step:number}){
 const routes:LinkPaths=[[0,6,12,13,14,8,2],[1,7],[25,26,27,33,34]]
 return <figure className="cl-example" role="img" aria-label="Color Link rule example">
  <div className="cl-sample" aria-hidden="true">
   <Traces paths={step<2?[]:step<4?routes.slice(0,2):routes}/>
   {(step===0?routes.slice(0,1):step<4?routes.slice(0,2):routes).map((path,i)=>[path[0],path.at(-1)!].map(c=>{
    const [x,y]=xy(c)
    return <span key={c} className={'cl-token cl-tone-'+i} style={{left:x/1.2+'%',top:y/1.2+'%'}}>{letters[i]}</span>
   }))}
  </div>
  <figcaption>{['Place two ends of the same letter.','Accept the new pair or challenge the entire layout.','A bends around B. Each route has its own cells.','This board can be connected. A challenge here would fail.','On the sixth pair, both players trace their routes privately.','After each round, the starting player swaps.'][step]??'Make room for a route for every pair.'}</figcaption>
 </figure>
}
