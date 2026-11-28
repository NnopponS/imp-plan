import {useState} from 'react'
import {balance,total,landing,pitType} from './mancala'
import type {GameView} from './engine'
import './mancala-live.css'

const colors=['Red','Blue','Green','Bonus','Penalty']
const marks=['M6 1 11 6 6 11 1 6Z','M1.5 3h9v6h-9Z','M6 1 11 10H1Z','M6 1v10M1 6h10','M1 6h10']
const stoneColors=['#efd39a','#bf806d','#a9c4c7','#bdb477','#cab0cd','#d7a181','#a6c48b','#a9a8d6']
const stonePoints=[[30,25],[43,25],[23.5,18],[49.5,18],[36.5,15]] as const

function PitMark({type}:{type:number}){
 return <svg className="mancala-pit-mark" viewBox="0 0 12 12" aria-hidden="true" focusable="false"><path data-mancala-mark d={marks[type]}/></svg>
}

function PitBowl({stones}:{stones:readonly number[]}){
 return <svg data-mancala-bowl viewBox="0 0 74 43" aria-hidden="true" focusable="false">
  <ellipse className="mancala-rim" cx="37" cy="22" rx="33" ry="18"/>
  <ellipse className="mancala-well" cx="37" cy="22" rx="28" ry="14"/>
  <path className="mancala-carving" d="M12 22c0 7 11 12 25 12s25-5 25-12M16 14c4-3 12-5 21-5s17 2 21 5"/>
  {stones.length===0?<path className="mancala-empty" d="m37 16 5 6-5 6-5-6Z"/>:stones.slice(0,stonePoints.length).map((owner,i)=>{
   const [x,y]=stonePoints[i]
   return <g key={i} data-mancala-stone transform={'translate('+x+' '+y+')'}>
    <ellipse cy="1" rx="6.3" ry="5.3" fill="#1d130e"/>
    <ellipse rx="6" ry="4.9" fill={stoneColors[owner]}/>
    <text y=".4" fill="#38251a">{owner+1}</text>
   </g>
  })}
 </svg>
}

export function MancalaBoard({g,you,active,submit,name}:{g:GameView,you:string,active:boolean,submit:(i:number)=>void,name:(s:string)=>string}){
 const m=g.mancala!, setup=m.placements<g.seats.length*4
 const [pick,setPick]=useState<number|null>(null)
 const legal=active&&!g.done&&g.turn===you
 const selected=pick!==null&&g.legal.includes(pick)&&legal?pick:null
 const end=selected!==null&&!setup?landing(m,selected):null
 const earned=selected!==null?m.pits[selected].at(-1):undefined
 return <section className="mancala-live" aria-label="Balance Mancala table">
  <header className="mancala-live-hud">
   <strong>{setup?'Placement '+m.placements+' / '+g.seats.length*4:'Sowing round '+Math.min(12,1+Math.floor(m.sows/g.seats.length))+' / 12'}</strong>
   <small>{setup?'Choose a pit with room.':'Choose a pit with one of your stones.'}</small>
  </header>
  <div className="mancala-live-grid" role="group" aria-label="Mancala pits" data-large={m.pits.length>12||undefined}>
   {m.pits.map((stones,i)=>{
    const type=pitType(i,m.pits.length)
    const owners=Array.from(new Set(stones)).map(seat=>name(g.seats[seat])+': '+stones.filter(owner=>owner===seat).length)
    return <button type="button" key={i} className="mancala-pit" data-type={type} data-mancala-landing={end===i||undefined}
     disabled={!legal||!g.legal.includes(i)} aria-pressed={selected===i} aria-label={`Pit ${i+1}, ${colors[type]}, ${stones.length} stones`}
     aria-description={owners.length?owners.join(', '):undefined} title={colors[type]} onClick={()=>setPick(i)}>
     <span className="mancala-pit-id" aria-hidden="true"><PitMark type={type}/>{i+1}</span>
     <PitBowl stones={stones}/>
     <span className="mancala-pit-count" aria-hidden="true">{stones.length}</span>
    </button>
   })}
  </div>
  {!g.done&&<div className="mancala-live-actions">
   <button type="button" className="primary" disabled={selected===null} onClick={()=>{if(selected!==null){submit(selected);setPick(null)}}}>{setup?'Place stone':'Sow selected pit'}</button>
   {end!==null&&earned!==undefined?<p role="status">Last stone: {name(g.seats[earned])} → pit {end+1} ({colors[pitType(end,m.pits.length)]}).</p>:
    m.last&&<p role="status">Last landing: pit {m.last.pit+1}. {name(g.seats[m.last.earnedBy])} resolves {colors[pitType(m.last.pit,m.pits.length)].toLowerCase()}.</p>}
  </div>}
  <ul className="mancala-score-tray" aria-label="Balancing scores">
   {m.points.map((p,i)=><li key={g.seats[i]} className="mancala-score-data"><div><strong>{i+1}. {name(g.seats[i])}</strong><small>{balance(p)} balanced · {total(p)} total</small></div>
    <div className="mancala-score-colors">{p.map((count,type)=><span key={type} data-type={type} aria-label={colors[type]+' '+count} title={colors[type]}><PitMark type={type}/>{count}</span>)}</div>
   </li>)}
  </ul>
 </section>
}
