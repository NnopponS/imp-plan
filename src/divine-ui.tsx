import React,{useEffect,useRef,useState} from 'react'
import {divineSymbols} from './divine'
import type {Snapshot} from './room'
import './divine.css'

const marks=(ids:number[])=>ids.map(i=>divineSymbols[i]).join('')
export function DivineBoard({snap,active,submit}:{snap:Snapshot,active:boolean,submit:(code:number)=>void}){
 const g=snap.game!,p=g.divine!
 const [selected,setSelected]=useState<number|null>(null),[now,setNow]=useState(Date.now)
 const ref=useRef<HTMLElement>(null)
 const choice=useRef<number|null>(null)
 useEffect(()=>{const t=setInterval(()=>setNow(Date.now()),250);return()=>clearInterval(t)},[])
 const enabled=active&&!g.done
 const offset=useRef({host:snap.hostNow,local:Date.now()})
 useEffect(()=>{offset.current={host:snap.hostNow,local:Date.now()}},[snap.hostNow])
 const seconds=Math.max(0,Math.ceil(((g.deadline??0)-offset.current.host-(now-offset.current.local))/1000))
 const choose=(tile:number)=>{
  setSelected(tile)
  if(ref.current&&!ref.current.contains(document.activeElement))ref.current.querySelector<HTMLButtonElement>('button:not(:disabled)')?.focus()
 }
 const place=(index:number,tile:number)=>{
  if(!enabled||index===p.fixed||tile===p.cells[index])return
  submit(index*50+tile);setSelected(null)
 }
 return <div className="divine">
  <div className="auction-top"><strong>Every line: {p.target}</strong><span className="pill" aria-label="Time remaining">{g.done?'Finished':Math.floor(seconds/60)+':'+String(seconds%60).padStart(2,'0')}</span></div>
  <p role="status">{g.done?g.winner?'A valid square was completed.':'Time expired without a solution.':selected!==null?'Selected '+(selected===0?'eraser':marks(p.tileGlyphs[selected]))+'. Choose a cell.':'Choose a tile below, then select where it goes. Select an occupied cell to move its tile.'}</p>
  <section className="divine-grid" ref={ref} aria-label="Magic square grid" style={{gridTemplateColumns:`repeat(${p.side},minmax(0,1fr))`}} onKeyDown={e=>{
   if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)||!(e.target instanceof HTMLButtonElement))return
   const index=Number(e.target.dataset.cell),d=e.key==='ArrowUp'?-p.side:e.key==='ArrowDown'?p.side:e.key==='ArrowLeft'?-1:1
   if(!Number.isInteger(index))return
   e.preventDefault()
   const j=(index+d+p.cells.length)%p.cells.length
   ref.current?.querySelector<HTMLButtonElement>('[data-cell="'+(j===p.fixed?(j+d+p.cells.length)%p.cells.length:j)+'"]')?.focus()
  }}>
   {p.cells.map((value,i)=><button key={i} type="button" data-cell={i} data-fixed={i===p.fixed} disabled={!enabled||i===p.fixed}
    aria-label={`Row ${Math.floor(i/p.side)+1}, column ${i%p.side+1}: ${value?marks(p.tileGlyphs[value]):'empty'}${i===p.fixed?' (fixed)':''}`}
    draggable={enabled&&i!==p.fixed&&!!value}
    onDragStart={e=>{choice.current=value;e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/plain',String(value))}}
    onDragEnd={()=>{choice.current=null}}
    onDragOver={e=>{if(choice.current!==null&&i!==p.fixed)e.preventDefault()}}
    onDrop={e=>{e.preventDefault();const tile=choice.current;choice.current=null;if(tile!==null)place(i,tile)}}
    onClick={()=>{if(selected!==null)place(i,selected);else if(value)setSelected(value)}}>{value?marks(p.tileGlyphs[value]):'·'}</button>)}
  </section>
  {!g.done&&<section aria-label="Tile tray" className="divine-tray"><button type="button" disabled={!enabled} aria-pressed={selected===0} onClick={()=>choose(0)}>Eraser</button>{p.tileGlyphs.slice(1).map((glyphs,i)=>p.cells.includes(i+1)?null:<button type="button" key={i} disabled={!enabled}
   draggable={enabled} aria-label={'Tile '+marks(glyphs)} aria-pressed={selected===i+1} onClick={()=>choose(i+1)}
   onDragStart={e=>{choice.current=i+1;e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/plain',String(i+1))}} onDragEnd={()=>{choice.current=null}}>{marks(glyphs)}</button>)}</section>}
  <details open className="divine-key"><summary>{p.hard?'Numeral clues':'Numeral legend'}</summary>
   <ul>{p.legend?p.legend.map((glyph,n)=><li key={glyph}>{divineSymbols[glyph]} = {n}</li>):p.clues?.map(({glyph,previous})=><li key={glyph}>{divineSymbols[glyph]} = {previous===null?'0':divineSymbols[previous]+' + 1'}</li>)}</ul>
   <small>Two symbols are two digits. The fixed tile cannot move.</small>
  </details>
 </div>
}
