import {useEffect,useState} from 'react'
import {fractionLabel,packPyramid,pyramidChoices,pyramidOps,pyramidRounds} from './pyramid'
import type {Snapshot} from './room'
import {InstrumentPicker} from './instrument-picker'
import './pyramid.css'

const opLabel=['Add','Subtract','Multiply','Divide']
const opChoices=pyramidOps.map((symbol,value)=>({value,label:opLabel[value],face:<span aria-hidden="true">{symbol}</span>}))
function BracketFace({right}:{right:boolean}){
 return <svg viewBox="0 0 108 32" aria-hidden="true" focusable="false">
  <path className="pyramid-bracket" d={right?'M44 5Q35 16 44 27M99 5Q108 16 99 27':'M9 5Q0 16 9 27M64 5Q73 16 64 27'}/>
  <text x="18" y="21">A</text><text x="54" y="21">B</text><text x="90" y="21">C</text>
  <circle cx="35.5" cy="16" r="1.85"/><circle cx="72.5" cy="16" r="1.85"/>
 </svg>
}
const groupChoices=[false,true].map(value=>({
 value,label:value?'Group last two tiles':'Group first two tiles',face:<BracketFace right={value}/>
}))
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
 return <div className="pyramid-game" data-closed={g.done}>
  <div className="pyramid-meter">
   <div><span className="pyramid-mode">Fan mode</span><strong>Puzzle {g.round} / {pyramidRounds}</strong></div>
   {!g.done&&<div className="pyramid-target">Target <strong data-target={fractionLabel(p.target)}>{fractionLabel(p.target)}</strong></div>}
   <span className="pyramid-time" role="timer" aria-label="Time remaining">{g.done?'Finished':time+' s'}</span>
  </div>
  {!g.done&&<>
   <p className="pyramid-cue" role="status">{p.locked?'Answer locked. Waiting for the round to end.':'Pick a tile and its two lower neighbors in expression order.'}</p>
   <section className="pyramid-instrument" aria-label="Equation pyramid instrument">
   <div className="pyramid-board" role="group" aria-label="Pyramid tiles">{Array.from({length:5},(_,r)=><div className="pyramid-row" key={r}>{Array.from({length:r+1},(_,c)=>{
    const i=r*(r+1)/2+c,order=tiles.indexOf(i)
    return <button type="button" key={c} data-value={p.values[i]} aria-label={`Row ${r+1} column ${c+1}: ${p.values[i]}`}
      title={order>=0?'Selected in position '+(order+1):undefined} disabled={!enabled||!valid(i)} aria-pressed={order>=0}
      onClick={()=>setTiles(v=>v.includes(i)?v.filter(k=>k!==i):[...v,i])}>{p.values[i]}{order>=0&&<small aria-hidden="true">{order+1}</small>}</button>
   })}</div>)}</div>
   <div className="pyramid-controls">
    <div className="pyramid-dial"><span aria-hidden="true">First operator</span>
     <InstrumentPicker label="First operator" className="pyramid-operators" options={opChoices} value={op1} select={set1} disabled={!enabled}/>
    </div>
    <div className="pyramid-dial"><span aria-hidden="true">Second operator</span>
     <InstrumentPicker label="Second operator" className="pyramid-operators" options={opChoices} value={op2} select={set2} disabled={!enabled}/>
    </div>
    <div className="pyramid-dial pyramid-grouping"><span aria-hidden="true">Grouping</span>
     <InstrumentPicker label="Grouping" className="pyramid-brackets" options={groupChoices} value={right} select={group} disabled={!enabled}/>
    </div>
    <output className="pyramid-expression" aria-label="Your expression">{expr}</output>
   </div>
   </section>
   <div className="actions"><button className="primary" type="button" disabled={!enabled||code===null} onClick={()=>{if(code!==null)submit(code)}}>Lock answer</button><button type="button" disabled={!enabled||!tiles.length} onClick={()=>setTiles([])}>Clear tiles</button></div>
  </>}
  <ul className="pyramid-scores" aria-label="Scores">{g.seats.map((s,i)=><li key={s}><strong>{name(s)}: {g.scores[i]} pts</strong>{g.last&&<span>Last puzzle: +{g.last[i]}</span>}</li>)}</ul>
 </div>
}
