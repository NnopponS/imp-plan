import React,{useState} from 'react'
import {balance,total,landing,pitType} from './mancala'
import type {GameView} from './engine'
const color=['Red','Blue','Green','Bonus','Penalty']
export function MancalaBoard({g,you,active,submit,name}:{g:GameView,you:string,active:boolean,submit:(i:number)=>void,name:(s:string)=>string}){
 const m=g.mancala!, setup=m.placements<g.seats.length*4
 const [pick,setPick]=useState<number|null>(null)
 const legal=active&&!g.done&&g.turn===you
 const selected=pick!==null&&g.legal.includes(pick)&&legal?pick:null
 const end=selected!==null&&!setup?landing(m,selected):null
 const earned=selected!==null?m.pits[selected].at(-1):undefined
 return <div>
  <p><strong>{setup?'Placement '+m.placements+' / '+g.seats.length*4:'Sowing round '+Math.min(12,1+Math.floor(m.sows/g.seats.length))+' / 12'}</strong> · {setup?'Add a stone to a pit with room.':'Choose a pit with one of your stones. Higher-numbered pits follow clockwise, then wrap to 1.'}</p>
  {m.last&&<p role="status">Last landing: pit {m.last.pit+1}. {name(g.seats[m.last.earnedBy])} resolves {color[pitType(m.last.pit,m.pits.length)].toLowerCase()}.</p>}
  <div className="mancala-grid" role="group" aria-label="Mancala pits">
   {m.pits.map((stones,i)=>{
    const t=pitType(i,m.pits.length)
    return <button type="button" key={i} className={'pit pit-'+t+(end===i?' landing':'')} disabled={!legal||!g.legal.includes(i)} aria-pressed={selected===i} aria-label={`Pit ${i+1}, ${color[t]}, ${stones.length} stones`} onClick={()=>setPick(i)}>
     <small>{i+1} · {color[t]}</small><span aria-hidden="true">{stones.length?stones.map((owner,n)=><b title={name(g.seats[owner])} key={n}>{owner+1}</b>):'∅'}</span>
    </button>
   })}
  </div>
  {!g.done&&<div className="actions"><button type="button" className="primary" disabled={selected===null} onClick={()=>{if(selected!==null){submit(selected);setPick(null)}}}>{setup?'Place stone':'Sow selected pit'}</button>
   {end!==null&&earned!==undefined&&<p role="status">Last stone: {name(g.seats[earned])} → pit {end+1} ({color[pitType(end,m.pits.length)]}).</p>}</div>}
  <div className="scores">{m.points.map((p,i)=><div key={g.seats[i]}><span>{i+1}. {name(g.seats[i])}</span><strong>{balance(p)} balanced · {total(p)} total</strong><small>Red {p[0]} · Blue {p[1]} · Green {p[2]}</small></div>)}</div>
 </div>
}
