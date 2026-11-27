import {useEffect,useId,useRef,useState,type CSSProperties} from 'react'
import {base} from './brand'
import type {Snapshot} from './room'
import {wallGoCap,wallGoDecode,wallGoEdges,wallGoEncode,wallGoSide} from './wall-go'
import './wall-go.css'

const n=wallGoSide
const cells=Array.from({length:n*n},(_,i)=>i)
const coordinate=(cell:number)=>'ABCDEFG'[cell%n]+(Math.floor(cell/n)+1)
const pawnArt=(side:number)=>base+'art/wall-go-pawn-'+(side===0?'gold':'crimson')+'.svg'
const wallArt=base+'art/wall-go-wall.svg'
const edgePoints=(edge:number)=>{
 const [a,b]=wallGoEdges[edge],upright=b-a===1
 return {x:100*((a%n+b%n)/2+.5)/n,y:100*((Math.floor(a/n)+Math.floor(b/n))/2+.5)/n,upright}
}
const wallName=(cell:number,edge:number)=>{
 const [a,b]=wallGoEdges[edge],q=cell===a?b:a
 const side=q===cell-1?'West':q===cell+1?'East':q<cell?'North':'South'
 return {side,label:side+' edge '+coordinate(cell)+' to '+coordinate(q)}
}
const keyboardStep=(cell:number,key:string)=>{
 if(key==='ArrowLeft'&&cell%n!==0)return cell-1
 if(key==='ArrowRight'&&cell%n!==n-1)return cell+1
 if(key==='ArrowUp'&&cell>=n)return cell-n
 if(key==='ArrowDown'&&cell<n*(n-1))return cell+n
 return cell
}
type Stage={turn:number,destination:number}
export function WallGoBoard({snap,active,name,submit}:{snap:Snapshot;active:boolean;name:(id:string)=>string;submit:(code:number)=>void}){
 const game=snap.game!,v=game.wallGo!,side=v.seats.indexOf(snap.you)
 const [stage,setStage]=useState<Stage|null>(null)
 const [pending,setPending]=useState<number|null>(null)
 const sent=useRef<number|null>(null)
 const hint=useId()
 const [focus,setFocus]=useState<number>(()=>v.pawns[side]??v.pawns[0])
 const [clock,setClock]=useState(Date.now),[offset,setOffset]=useState(()=>snap.hostNow-Date.now())
 const cellRefs=useRef<Array<HTMLButtonElement|null>>([])
 useEffect(()=>{const now=Date.now();setClock(now);setOffset(snap.hostNow-now)},[snap.hostNow])
 useEffect(()=>{
  if(game.deadline===null)return
  const timer=setInterval(()=>setClock(Date.now()),175)
  return ()=>clearInterval(timer)
 },[game.deadline])
 useEffect(()=>{
  if(pending===null)return
  if(v.turns!==pending||!active){
   sent.current=null;setPending(null);return
  }
  // If nothing acknowledged the command, choosing a new destination is
  // required before another attempt; never resend a sealed board edge.
  const timer=setTimeout(()=>{sent.current=null;setPending(null)},1_600)
  return ()=>clearTimeout(timer)
 },[pending,v.turns,active])
 useEffect(()=>{if(!active)setStage(null)},[active])

 const ms=Math.max(0,(game.deadline??0)-clock-offset),seconds=Math.ceil(ms/1000)
 const mine=active&&v.turn===snap.you&&!v.end&&ms>0
 const waiting=pending===v.turns
 const canEdit=mine&&!waiting
 const draft=mine&&stage?.turn===v.turns?stage:null
 const legal=new Map<number,number[]>()
 for(const code of v.legal){
  const a=wallGoDecode(code)!
  const list=legal.get(a.destination)
  if(list)list.push(a.edge)
  else legal.set(a.destination,[a.edge])
 }
 // The decorative wall layer is hidden from assistive tech. Its committed
 // information belongs on both adjacent cells, not on the local preview.
 const blocked=new Map<number,string[]>()
 for(const edge of v.walls){
  const [a,b]=wallGoEdges[edge]
  for(const p of [a,b]){
   const direction=wallName(p,edge).side.toLowerCase()+' to '+coordinate(p===a?b:a)
   const old=blocked.get(p)
   if(old)old.push(direction)
   else blocked.set(p,[direction])
  }
 }
 const edges=draft?legal.get(draft.destination)??[]:[]
 const clearDraft=()=>{
  if(draft)cellRefs.current[draft.destination]?.focus({preventScroll:true})
  setStage(null)
 }
 const placeEdge=(edge:number)=>{
  if(!canEdit||!draft||sent.current===v.turns||!edges.includes(edge))return
  if(game.deadline===null||Date.now()+offset>=game.deadline)return
  sent.current=v.turns
  setPending(v.turns)
  clearDraft()
  submit(wallGoEncode(draft.destination,edge))
 }
 const status=v.end==='separated'?'Pawns separated. Only regions containing one pawn are scored.':
  v.end==='turn-limit'?'Turn limit reached. The common region is neutral.':
  v.end==='blocked'?'No turn is available. The table is closed.':
  !active?'Connection interrupted.':
  ms===0?'Turn time expired. Waiting for the table.':
  v.turn!==snap.you?(side<0?'Watching this leg. ':'')+(v.turn?name(v.turn)+'’s turn.':'Waiting for the next turn.'):
  waiting?'Submitting your move.':
  draft?'Destination '+coordinate(draft.destination)+'. Choose a marked edge to place the wall and end your turn. Choose another square or select '+coordinate(draft.destination)+' again to clear.':
  'Your turn. Choose a marked cell or stay where you are, then place a wall on the board.'
 return <section className="wall-go" aria-label="Wall Go territory board" data-draft={draft!==null||undefined}>
  <div className="wg-meta"><span className="wg-table-label">TERRITORY DUEL <i aria-hidden="true">/</i> 7 × 7</span>
   <span>Turns {v.turns} / {wallGoCap}</span>
   {game.deadline!==null&&<span className="wg-clock" role="timer" aria-label="Turn time remaining" data-urgent={seconds<=5||undefined}>{seconds} s</span>}
  </div>
  <div className="wg-seats">{v.seats.map((id,i)=><div key={id} className="wg-seat" data-side={i} data-active={v.turn===id||undefined}>
   <img src={pawnArt(i)} width="32" height="36" alt="" />
   <div><strong>{name(id)}</strong><small>{i===0?'Gold pawn':'Crimson pawn'}{id===snap.you?' · You':''}</small></div>
   <span className="wg-score">{v.territory.scores[i]} {v.territory.scores[i]===1?'cell':'cells'}</span>
  </div>)}</div>
  <p className="wg-status" role="status">{status}</p>
  <div className="wg-stage">
   <div className="wg-address" aria-hidden="true">{'ABCDEFG'.split('').map(letter=><span key={letter}>{letter}</span>)}</div>
   <div className="wg-address wg-ranks" aria-hidden="true">{Array.from({length:n},(_,i)=><span key={i}>{i+1}</span>)}</div>
   <div className="wg-board">
    <div className="wg-grid" role="group" aria-label="Board cells. Use arrow keys to move focus." aria-describedby={hint}>
     {cells.map(p=>{
      const pawn=v.pawns.indexOf(p),owner=v.territory.owners[p],available=canEdit&&legal.has(p),preview=draft?.destination===p
      const walls=blocked.get(p)
      const label=coordinate(p)+(pawn!==-1?' · '+name(v.seats[pawn])+'’s pawn':'')+(owner!==null?' · '+name(v.seats[owner])+' territory':'')+
       (available?pawn===side?' · stay':' · reachable':'')+
       (walls?' · '+(walls.length===1?'Wall ':'Walls ')+walls.join(', '):'')
      return <button className={'cell wg-cell'+((Math.floor(p/n)+p%n)%2?' wg-shade':'')} type="button" key={p}
       ref={el=>{cellRefs.current[p]=el}} aria-label={label} tabIndex={focus===p?0:-1}
       aria-disabled={!available} aria-pressed={preview} data-owner={owner??undefined} data-reachable={available||undefined}
       onFocus={()=>setFocus(p)}
       onKeyDown={e=>{
        if(e.key.startsWith('Arrow')){
         e.preventDefault()
         cellRefs.current[keyboardStep(p,e.key)]?.focus()
        }else if(e.key==='Escape'){e.preventDefault();clearDraft()}
       }}
       onClick={()=>{if(available&&sent.current!==v.turns)setStage(preview?null:{turn:v.turns,destination:p})}}>
       {owner!==null&&<span className="wg-owned" aria-hidden="true">{owner===0?'·':'×'}</span>}
       {pawn!==-1&&<img className="wg-pawn" data-faded={!!draft&&side===pawn&&!preview||undefined} src={pawnArt(pawn)} width="32" height="36" alt="" />}
       {preview&&pawn!==side&&<img className="wg-pawn wg-ghost" src={pawnArt(side)} width="32" height="36" alt="" />}
       {available&&pawn===-1&&!preview&&<span className="wg-target" aria-hidden="true"/>}
      </button>
     })}
    </div>
    <div className="wg-fences" aria-hidden="true">
     {v.walls.map(edge=>{
      const {x,y,upright}=edgePoints(edge)
      return <span key={edge} className="wg-edge" data-wall-go="placed" data-upright={upright||undefined}
       data-last={edge===v.lastMove?.edge||undefined} style={{left:x+'%',top:y+'%',backgroundImage:'url('+wallArt+')'} as CSSProperties}/>
     })}
    </div>
    {draft&&canEdit&&<div className="wg-edge-layer" role="group" aria-label={'Place a wall beside '+coordinate(draft.destination)}>
     {edges.map(edge=>{
      const {x,y,upright}=edgePoints(edge),{side,label}=wallName(draft.destination,edge)
      return <button key={edge} className="cell wg-edge-action" type="button" aria-label={label} aria-describedby={hint}
       data-wall-go="choice" data-side={side.toLowerCase()} data-upright={upright||undefined}
       style={{left:x+'%',top:y+'%'}} onClick={()=>placeEdge(edge)}
       onKeyDown={e=>{if(e.key==='Escape'){e.preventDefault();clearDraft()}}}>
       <span aria-hidden="true">{side[0]}</span>
      </button>
     })}
    </div>}
   </div>
   <p id={hint} className="sr">Enter on a cell to select it. Tab to a marked edge and press Enter to place a wall and end your turn. Press Escape to clear the destination.</p>
  </div>
  {v.end&&<p className="wg-neutral">{v.territory.neutral} neutral {v.territory.neutral===1?'cell':'cells'} · {v.turns} turns played</p>}
 </section>
}

export function WallGoLesson({step}:{step:number}){
 const size=16,origin=14
 const display=step>=2&&step<=3?'score':step===0?'move':'wall'
 const pawns=display==='move'?[0,48]:[8,48]
 const demoWalls=display==='move'?[]:display==='score'?Array.from({length:n},(_,r)=>r*(n-1)+2):[wallGoEdges.findIndex(([a,b])=>a===8&&b===9)]
 const miniPoint=(p:number)=>({x:origin+(p%n+.5)*size,y:origin+(Math.floor(p/n)+.5)*size})
 return <svg className="wg-lesson" role="img" aria-label="Wall Go rule example" viewBox="0 0 245 140">
  <rect width="245" height="140" rx="8" fill="#281e1a"/>
  {cells.map(p=><rect key={p} x={origin+p%n*size} y={origin+Math.floor(p/n)*size} width={size} height={size}
   fill={display==='score'?(p%n<=2?'#77532c':'#753e42'):(Math.floor(p/n)+p%n)%2?'#3c3127':'#4a3a30'} stroke="#846d54" strokeWidth=".5"/>)}
  {display==='move'&&<polyline points={[0,1,8].map(p=>{const {x,y}=miniPoint(p);return x+','+y}).join(' ')}
   fill="none" stroke="#ffda91" strokeWidth="2" strokeDasharray="3 2"/>}
  {demoWalls.map(edge=>{const {x,y,upright}=edgePoints(edge)
   const dx=upright?0:size/2,dy=upright?size/2:0,p=origin+n*size*x/100,q=origin+n*size*y/100
   return <path key={edge} d={'M '+(p-dx)+' '+(q-dy)+' L '+(p+dx)+' '+(q+dy)} stroke="#f3d095" strokeWidth="3"/>
  })}
  {pawns.map((p,i)=>{const {x,y}=miniPoint(p)
   return <image key={i} href={pawnArt(i)} x={x-6} y={y-7} width="12" height="14"/>
  })}
  <text x="139" y="53" fontSize="13" fill="#fff4d9" fontFamily="Georgia, serif">{display==='move'?'Choose a cell':display==='wall'?'Close an edge':'Count each side'}</text>
  <text x="139" y="73" fontSize="10" fill="#e5cda2">{display==='move'?'0, 1 or 2 steps':display==='wall'?'Beside your pawn':'21 gold · 28 red'}</text>
 </svg>
}
