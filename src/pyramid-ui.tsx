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
const incisions=[
 'm11 15 10-3 8 1m-17 33 9-2 7 1m26-30 7 2m-10 29 8 2',
 'm12 19 10-4 5 1m-15 27 12-1m28-24 7 3m-17 22 10 3',
 'm11 16 4-3 10 1m-13 29 10 4 5-1m26-29 7-2m-15 33 10-3',
 'm14 16 7 2 7-2m-16 28 6-3m31-28 8 2 4-1m-13 31 11-2',
 'm12 20 7-4m-6 31 9-3 7 2m23-31 7 2m-13 27 8 3 6-2',
]
function StoneFace({index}:{index:number}){
 return <svg className="pyramid-stone" viewBox="0 0 70 60" preserveAspectRatio="none" aria-hidden="true" focusable="false">
  <path className="stone-wall" d="M5 10 11 5l48-1 8 6 1 41-5 6-54 1-6-6Z"/>
  <path className="stone-front" d="M8 11 13 7l46-1 5 5 1 36-5 6-49 1-5-5Z"/>
  <path className="stone-bevel" d="M11 12l5-3 41-1 4 4M9 45l3 5 47-1 4-5M11 18l-1 22m51-24 1 23"/>
  <path className="stone-incision" d={incisions[index%incisions.length]}/>
  <path className="stone-support-mark" d="m30 46 5 3 5-3m-10-2h10"/>
 </svg>
}
function PyramidMasonry(){
 return <svg className="pyramid-masonry" viewBox="0 0 300 255" preserveAspectRatio="none" aria-hidden="true" focusable="false">
  <path fill="#44303a" stroke="#957350" strokeWidth="2" d="m125 9 50-1 5 42 23 1 6 43 23 2 5 41 24 1 7 43 22 4 5 57-286 2 4-59 25-4 4-40 24-4 6-39 21-5 7-39 24-3Z"/>
  <path fill="none" stroke="#9f7e5c" strokeOpacity=".62" d="m25 243 251-2M16 229l22 6 23-1m181 0 30-3 16-9M37 177l25 3m178-2 27 3m-210-46 22 2m145-3 21 4m-153-44 20 2m89-2 17 2m-97-44 23 1m19 0 21-2M137 27l14-4 13 4"/>
  <path fill="none" stroke="#c39d73" strokeOpacity=".36" d="m18 211 21-14m-18 22 29-20m-19 22 24-16m199-5 26 13m-18-16 22 10m-19-17 16 8m-54-63 13-8m-10 16 20-9m-187-3 13 6m-19 2 13 4"/>
 </svg>
}
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
   <div className="pyramid-board" role="group" aria-label="Pyramid tiles"><PyramidMasonry/>{Array.from({length:5},(_,r)=><div className="pyramid-row" key={r}>{Array.from({length:r+1},(_,c)=>{
    const i=r*(r+1)/2+c,order=tiles.indexOf(i),support=enabled&&tiles.length>0&&!tiles.includes(i)&&valid(i)
    return <button type="button" key={c} data-value={p.values[i]} data-support={support||undefined} aria-label={`Row ${r+1} column ${c+1}: ${p.values[i]}`}
      title={order>=0?'Selected in position '+(order+1):undefined} disabled={!enabled||!valid(i)} aria-pressed={order>=0}
      onClick={()=>setTiles(v=>v.includes(i)?v.filter(k=>k!==i):[...v,i])}><StoneFace index={i}/><span className="stone-value">{p.values[i]}</span>{order>=0&&<small aria-hidden="true">{order+1}</small>}</button>
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
