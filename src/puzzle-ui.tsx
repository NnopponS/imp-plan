import {CubeView} from './cube-view'
import React,{useEffect,useState} from 'react'
import {hexCells,hexLines,isPuzzle,puzzleRounds} from './puzzles'
import type {Snapshot} from './room'
export function PuzzleBoard({snap,active,submit,name}:{snap:Snapshot,active:boolean,submit:(i:number)=>void,name:(s:string)=>string}){
 const g=snap.game!, p=g.puzzle!
 const rounds=isPuzzle(g.game)?puzzleRounds(g.game):0
 const cubes=g.game==='cubes',hex=g.game==='hex', study=p.stage==='study', locked=g.mine!==null
 const [now,setNow]=useState(Date.now())
 const [offset,setOffset]=useState(()=>snap.hostNow-Date.now())
 const [picked,pick]=useState<number[]>([])
 const [answer,setAnswer]=useState('')
 useEffect(()=>{const t=setInterval(()=>setNow(Date.now()),200);return()=>clearInterval(t)},[])
 useEffect(()=>{setOffset(snap.hostNow-Date.now())},[snap.hostNow])
 const seconds=Math.max(0,Math.ceil(((g.deadline??now)-now-offset)/1000))
 const line=hexLines().findIndex(l=>picked.length===3&&l.every(i=>picked.includes(i)))
 const max=cubes?p.rows*p.cols*4:p.rows*(p.rows+1)*p.cols*(p.cols+1)/4
 const valid=hex?line>=0:/^\d+$/.test(answer)&&Number(answer)<=max
 const enabled=active&&!study&&!locked&&!g.done
 const toggle=(i:number)=>pick(a=>a.includes(i)?a.filter(n=>n!==i):hex&&a.length>=3?a:[...a,i])
 return <div>
  <div className="auction-top"><strong>{(hex?'Target ':cubes?'Stack ':'Grid ')+g.round+' / '+rounds}</strong><span className="pill" aria-label="Time remaining">{g.done?'Finished':seconds+' s'}</span></div>
  {!g.done&&<>
   <p role="status">{study?'Study the board. Numbers disappear before the target is revealed.':locked?'Answer locked. Waiting for the other seats.':hex?'Pick three neighboring tiles in a straight line.':cubes?'Count every unit cube, including hidden supports.':'Count all rectangles, including squares and single tiles, that add up to the target.'}</p>
   {!study&&!cubes&&<div className="puzzle-target">Target sum <strong>{p.target}</strong></div>}
   {cubes?<CubeView heights={p.values} side={p.cols}/>:<div role="group" className={'puzzle-board '+(hex?'hex-puzzle':g.game==='exile'?'rect-puzzle exile-grid':'rect-puzzle')} style={hex?{}:{gridTemplateColumns:`repeat(${p.cols},minmax(0,1fr))`}} aria-label={hex?'Hexagon tiles':'Rectangle grid'}>
    {hex?[-2,-1,0,1,2].map(row=><div className="hex-row" key={row}>{hexCells.map((cell,i)=>cell.r===row?<button type="button" key={i} aria-label={`Tile ${i+1}${study?', value '+p.values[i]:''}`} aria-pressed={picked.includes(i)} disabled={!enabled} onClick={()=>toggle(i)}>{study?p.values[i]:String.fromCharCode(65+i)}</button>:null)}</div>):p.values.map((value,i)=><button type="button" key={i} aria-label={`Row ${Math.floor(i/p.cols)+1}, column ${i%p.cols+1}: ${value}`} aria-pressed={picked.includes(i)} disabled={!enabled} onClick={()=>toggle(i)}>{value}</button>)}
   </div>}
   {!study&&<form className="actions" onSubmit={e=>{e.preventDefault();if(enabled&&valid)submit(hex?line:Number(answer))}}>
    {!hex&&<label>{cubes?'Cube count':'Rectangle count'}<input type="text" inputMode="numeric" pattern="[0-9]+" maxLength={3} value={answer} onChange={e=>setAnswer(e.target.value)} disabled={!enabled}/></label>}
    <button type="submit" className="primary" disabled={!enabled||!valid}>Lock answer</button>
    {!cubes&&<button type="button" disabled={!enabled||!picked.length} onClick={()=>pick([])}>Clear {hex?'selection':'highlights'}</button>}
   </form>}
  </>}
  <div className="scores">{g.seats.map((s,i)=><div key={s}><span>{name(s)}</span><strong>{g.scores[i]} correct</strong>{g.last&&<small>{g.last[i]?'Previous answer correct':'Previous round: no point'}</small>}</div>)}</div>
 </div>
}
