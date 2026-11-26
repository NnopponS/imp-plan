import {useEffect,useState} from 'react'
import {fractionLabel,packPyramid,pyramidChoices,pyramidOps,pyramidRounds} from './pyramid'
import type {Snapshot} from './room'
import './pyramid.css'

const opLabel=['Add','Subtract','Multiply','Divide']
export function PyramidBoard({snap,active,name,submit}:{snap:Snapshot,active:boolean,name:(s:string)=>string,submit:(a:number)=>void}){
 const g=snap.game!,p=g.pyramid!
 const [tiles,setTiles]=useState<number[]>([]),[op1,set1]=useState(0),[op2,set2]=useState(0),[right,group]=useState(false)
 const [now,setNow]=useState(Date.now),[offset,setOffset]=useState(()=>snap.hostNow-Date.now())
 useEffect(()=>{const id=setInterval(()=>setNow(Date.now()),200);return()=>clearInterval(id)},[])
 useEffect(()=>setOffset(snap.hostNow-Date.now()),[snap.hostNow])
 const time=Math.max(0,Math.min(45,Math.ceil(((g.deadline??now)-now-offset)/1000)))
 const enabled=active&&!p.locked&&!g.done&&time>0
 const valid=(id:number)=>tiles.includes(id)||tiles.length<3&&pyramidChoices.some(t=>[...tiles,id].every(n=>t.includes(n)))
 const code=packPyramid(tiles,op1,op2,right)
 const values=[0,1,2].map(i=>p.values[tiles[i]]??'□')
 const expr=right?`${values[0]} ${pyramidOps[op1]} (${values[1]} ${pyramidOps[op2]} ${values[2]})`:`(${values[0]} ${pyramidOps[op1]} ${values[1]}) ${pyramidOps[op2]} ${values[2]}`
 return <div className="pyramid-game">
  <div className="auction-top"><strong>Puzzle {g.round} / {pyramidRounds}</strong><span className="pill" aria-label="Time remaining">{g.done?'Finished':time+' s'}</span></div>
  {!g.done&&<>
   <div className="pyramid-target">Target <strong data-target={fractionLabel(p.target)}>{fractionLabel(p.target)}</strong></div>
   <p role="status">{p.locked?'Answer locked. Waiting for the round to end.':'Select a tile and its two immediate lower neighbors in any expression order.'}</p>
   <div className="pyramid-board" role="group" aria-label="Pyramid tiles">{Array.from({length:5},(_,r)=><div className="pyramid-row" key={r}>{Array.from({length:r+1},(_,c)=>{
    const i=r*(r+1)/2+c,order=tiles.indexOf(i)
    return <button type="button" key={c} data-value={p.values[i]} aria-label={`Row ${r+1} column ${c+1}: ${p.values[i]}`}
      title={order>=0?'Selected in position '+(order+1):undefined} disabled={!enabled||!valid(i)} aria-pressed={order>=0}
      onClick={()=>setTiles(v=>v.includes(i)?v.filter(k=>k!==i):[...v,i])}>{p.values[i]}{order>=0&&<small aria-hidden="true">{order+1}</small>}</button>
   })}</div>)}</div>
   <fieldset className="pyramid-controls" disabled={!enabled}>
    <legend>Build expression</legend>
    <div className="actions">
    <label>First operator<select value={op1} onChange={e=>set1(Number(e.target.value))}>{pyramidOps.map((s,i)=><option key={s} value={i}>{s} {opLabel[i]}</option>)}</select></label>
    <label>Second operator<select value={op2} onChange={e=>set2(Number(e.target.value))}>{pyramidOps.map((s,i)=><option key={s} value={i}>{s} {opLabel[i]}</option>)}</select></label>
    <label>Grouping<select value={right?'right':'left'} onChange={e=>group(e.target.value==='right')}><option value="left">(A op B) op C</option><option value="right">A op (B op C)</option></select></label>
    </div>
   </fieldset>
   <output className="pyramid-expression" aria-label="Your expression">{expr}</output>
   <div className="actions"><button className="primary" type="button" disabled={!enabled||code===null} onClick={()=>{if(code!==null)submit(code)}}>Lock answer</button><button type="button" disabled={!enabled||!tiles.length} onClick={()=>setTiles([])}>Clear tiles</button></div>
  </>}
  <ul className="pyramid-scores" aria-label="Scores">{g.seats.map((s,i)=><li key={s}><strong>{name(s)}: {g.scores[i]} pts</strong>{g.last&&<span>Last puzzle: +{g.last[i]}</span>}</li>)}</ul>
 </div>
}
