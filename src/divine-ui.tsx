import {useEffect,useRef,useState,type CSSProperties} from 'react'
import {divineSymbols} from './divine'
import type {Snapshot} from './room'
import './divine.css'

const marks=(ids:number[])=>ids.map(i=>divineSymbols[i]).join('')
const moves={ArrowUp:[-1,0],ArrowDown:[1,0],ArrowLeft:[0,-1],ArrowRight:[0,1]} as const

function AltarMark(){
 return <svg viewBox="0 0 36 36" aria-hidden="true" className="divine-emblem" fill="none" stroke="currentColor" strokeWidth="1">
  <path d="m18 2 16 16-16 16L2 18Zm-9 16 9-9 9 9-9 9Zm9-12v6m0 12v6M6 18h6m12 0h6M12 12l12 12m0-12L12 24"/>
  <path d="m18 12 1.6 4.4L24 18l-4.4 1.6L18 24l-1.6-4.4L12 18l4.4-1.6Z" fill="currentColor"/>
 </svg>
}

export function DivineBoard({snap,active,submit}:{snap:Snapshot,active:boolean,submit:(code:number)=>void}){
 const g=snap.game!,p=g.divine!
 const [selected,setSelected]=useState<number|null>(null),[now,setNow]=useState(Date.now)
 const [keyOpen,setKeyOpen]=useState(false)
 const [focus,setFocus]=useState(p.fixed===0?1:0)
 const [railBounds,setRailBounds]=useState({previous:false,next:false})
 const grid=useRef<HTMLElement>(null),rail=useRef<HTMLElement>(null),rack=useRef<HTMLDivElement>(null)
 const dragged=useRef<number|null>(null)
 const offset=useRef({host:snap.hostNow,local:Date.now()})
 useEffect(()=>{if(g.done)return;const t=setInterval(()=>setNow(Date.now()),250);return()=>clearInterval(t)},[g.done])
 useEffect(()=>{offset.current={host:snap.hostNow,local:Date.now()}},[snap.hostNow])
 const seconds=Math.max(0,Math.ceil(((g.deadline??0)-offset.current.host-Math.max(0,now-offset.current.local))/1000))
 const enabled=active&&!g.done&&p.cells.length>0&&seconds>0

 function measureRail(){
  const el=rail.current
  if(!el)return
  const previous=el.scrollLeft>1,next=el.scrollLeft+el.clientWidth<el.scrollWidth-1
  setRailBounds(old=>old.previous===previous&&old.next===next?old:{previous,next})
 }
 useEffect(()=>{
  if(g.done||!rail.current||!rack.current)return
  const observer=new ResizeObserver(measureRail)
  observer.observe(rail.current)
  observer.observe(rack.current)
  measureRail()
  return()=>observer.disconnect()
 },[g.done])
 function browse(direction:number){
  const el=rail.current
  if(el)el.scrollBy({left:direction*Math.max(44,el.clientWidth-44),behavior:'auto'})
 }
 const focusCell=(index:number)=>grid.current?.querySelector<HTMLButtonElement>('[data-cell="'+index+'"]')?.focus()
 const choose=(tile:number,keyboard:boolean)=>{
  setSelected(tile===selected?null:tile)
  if(keyboard&&tile!==selected)focusCell(focus)
 }
 const place=(index:number,tile:number)=>{
  if(!enabled||index===p.fixed||tile===p.cells[index])return
  submit(index*50+tile)
  setSelected(null)
 }
 const decoded=(tile:number)=>p.legend?p.tileGlyphs[tile].map(mark=>p.legend!.indexOf(mark)).join(''):null
 const description=(tile:number)=>marks(p.tileGlyphs[tile])+(p.legend?', value '+decoded(tile):'')
 const face=(tile:number)=><><span className="divine-glyph" aria-hidden="true">{marks(p.tileGlyphs[tile])}</span>{p.legend&&<small aria-hidden="true">{decoded(tile)}</small>}</>
 const clock=g.done?'Finished':Math.floor(seconds/60)+':'+String(seconds%60).padStart(2,'0')
 const action=g.done?g.winner?'A valid square was completed.':'Time expired without a solution.':
  selected===null?'Pick a tile, then tap a cell.':selected===0?'Eraser selected. Choose a filled cell.':'Selected '+description(selected)+'. Choose a cell.'
 const keyLabel=p.hard?'Numeral clues':'Numeral legend'

 return <section className="divine" aria-label="Divine Test altar" data-closed={g.done} data-side={p.side} onKeyDown={event=>{
  if(event.key==='Escape'&&selected!==null){event.preventDefault();setSelected(null)}
 }}>
  <header className="divine-plaque">
   <AltarMark/>
   <div><p className="divine-inscription">Rows · Columns · Diagonals</p><strong>Every line: {p.target}</strong></div>
   <div className="divine-clock"><span role="timer" aria-label="Time remaining" data-urgent={seconds<=30&&!g.done}>{clock}</span><small>{p.side} × {p.side}</small></div>
   <p className="divine-cue" role="status" data-selected={selected!==null}>{action}</p>
  </header>
  <div className="divine-workbench">
   <div className="divine-tools">
    <button type="button" aria-expanded={keyOpen} aria-controls="divine-key" onClick={()=>setKeyOpen(!keyOpen)}>{keyLabel}</button>
    {!g.done&&<>
     <button type="button" disabled={!enabled} aria-pressed={selected===0} onClick={e=>choose(0,e.detail===0)}>Eraser</button>
     <button type="button" aria-label="Previous tiles" aria-disabled={!railBounds.previous} onClick={()=>{if(railBounds.previous)browse(-1)}}><span aria-hidden="true">‹</span></button>
     <button type="button" aria-label="Next tiles" aria-disabled={!railBounds.next} onClick={()=>{if(railBounds.next)browse(1)}}><span aria-hidden="true">›</span></button>
    </>}
   </div>
   <div className="divine-key" id="divine-key" hidden={!keyOpen}>
    <ul>{p.legend?p.legend.map((glyph,n)=><li key={glyph}>{divineSymbols[glyph]} = {n}</li>):p.clues?.map(({glyph,previous})=><li key={glyph}>{divineSymbols[glyph]} = {previous===null?'0':divineSymbols[previous]+' + 1'}</li>)}</ul>
    <small>{p.hard?'Start at zero and follow the +1 clues. ':''}Two symbols are two digits.</small>
   </div>
   {!g.done&&<section aria-label="Tile tray" className="divine-tray" ref={rail} onScroll={measureRail}>
    <div ref={rack} className="divine-rack">{p.tileGlyphs.slice(1).map((_,i)=>{
     const tile=i+1
     return p.cells.includes(tile)?null:<button type="button" key={tile} disabled={!enabled}
      draggable={enabled} aria-label={'Tile '+description(tile)} aria-pressed={selected===tile}
      onClick={e=>choose(tile,e.detail===0)}
      onDragStart={e=>{dragged.current=tile;e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/plain',String(tile))}}
      onDragEnd={()=>{dragged.current=null}}>{face(tile)}</button>
    })}</div>
   </section>}
   <p className="divine-table-note">Select a placed tile to move it. The sealed tile stays put.</p>
  </div>
  <div className="divine-slab">
   <section className="divine-grid" ref={grid} aria-label="Magic square grid" style={{'--divine-side':p.side} as CSSProperties} onKeyDown={e=>{
    if(!(e.key in moves)||!(e.target instanceof HTMLButtonElement))return
    const index=Number(e.target.dataset.cell)
    if(!Number.isInteger(index))return
    e.preventDefault()
    const [dy,dx]=moves[e.key as keyof typeof moves]
    let row=Math.floor(index/p.side),col=index%p.side
    for(let i=1;i<p.side;i++){
     row=(row+dy+p.side)%p.side;col=(col+dx+p.side)%p.side
     const next=row*p.side+col
     if(next!==p.fixed){focusCell(next);break}
    }
   }}>
    {p.cells.map((value,i)=><button key={i} type="button" data-cell={i} data-fixed={i===p.fixed} data-tile={!!value}
     data-lifted={selected!==null&&selected!==0&&value===selected} disabled={!enabled||i===p.fixed} tabIndex={i===focus?0:-1}
     onFocus={()=>setFocus(i)}
     aria-label={`Row ${Math.floor(i/p.side)+1}, column ${i%p.side+1}: ${value?description(value):'empty'}${i===p.fixed?' (fixed)':''}`}
     draggable={enabled&&i!==p.fixed&&!!value}
     onDragStart={e=>{dragged.current=value;e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/plain',String(value))}}
     onDragEnd={()=>{dragged.current=null}}
     onDragOver={e=>{if(enabled&&dragged.current!==null&&i!==p.fixed)e.preventDefault()}}
     onDrop={e=>{e.preventDefault();const tile=dragged.current;dragged.current=null;if(tile!==null)place(i,tile)}}
     onClick={()=>{if(value&&value===selected)setSelected(null);else if(selected!==null)place(i,selected);else if(value)setSelected(value)}}>{value?face(value):<span className="divine-pip" aria-hidden="true"/>}</button>)}
   </section>
  </div>
 </section>
}
