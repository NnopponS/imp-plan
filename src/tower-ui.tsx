import {useEffect,useState} from 'react'
import {applyTowerStep,packTower,towerHeight,type TowerEdit} from './tower'
import type {Snapshot} from './room'
import './tower.css'

export function TowerBoard({snap,active,name,submit}:{snap:Snapshot,active:boolean,name:(id:string)=>string,submit:(i:number)=>void}){
 const g=snap.game!,t=g.tower!
 const [edits,setEdits]=useState<TowerEdit[]>([]),[selected,setSelected]=useState<number|null>(null)
 const [now,setNow]=useState(Date.now),[offset,setOffset]=useState(()=>snap.hostNow-Date.now())
 useEffect(()=>{const id=setInterval(()=>setNow(Date.now()),200);return()=>clearInterval(id)},[])
 useEffect(()=>{setNow(Date.now());setOffset(snap.hostNow-Date.now())},[snap.hostNow])
 const seconds=Math.max(0,Math.min(240,Math.ceil(((g.deadline??now)-now-offset)/1000)))
 const enabled=active&&!g.done&&seconds>0&&g.turn===snap.you
 const columns=edits.reduce((cols,edit)=>applyTowerStep({tiles:t.tiles,columns:cols},edit)??cols,t.columns)
 const used=new Set(columns.flat())
 const available=(edit:TowerEdit)=>enabled&&edits.length<2&&!!applyTowerStep({tiles:t.tiles,columns},edit)
 const schedule=(edit:TowerEdit)=>{
  if(available(edit)){setEdits([...edits,edit]);setSelected(null)}
 }
 const tile=(id:number)=>{
  const canSelect=enabled&&edits.length<2&&(selected===null||selected===id||available({tile:selected,dest:id+7}))
  return <button type="button" key={id} className="tower-tile" data-tile={id} data-letter={t.tiles[id]} disabled={!canSelect}
   aria-label={t.tiles[id]+' tile '+(id+1)} aria-pressed={selected===id}
   onClick={()=>{if(selected!==null&&selected!==id)schedule({tile:selected,dest:id+7});else setSelected(v=>v===id?null:id)}}>
    {t.tiles[id]}
  </button>
 }
 const action=(dest:number)=>selected===null?undefined:{tile:selected,dest}
 const can=(dest:number)=>!!action(dest)&&available(action(dest)!)
 const put=(dest:number)=>{const edit=action(dest);if(edit)schedule(edit)}
 return <section className="tower-game" aria-label="Word Tower workshop">
  <div className="auction-top"><strong>{t.columns.length} words · {t.theme}</strong><span className="pill" aria-label="Time remaining">{g.done?'Finished':seconds+' s'}</span></div>
  <p role="status">{g.done?`Team score: ${t.score.valid} / ${t.columns.length} words · ${t.score.used} / ${t.tiles.length} tiles used.`:enabled?'Your turn. '+edits.length+' / 2 edits staged.':name(g.turn)+'’s turn.'}</p>
  <div className="tower-tray" aria-label="Letter tray">{t.tiles.map((_,id)=>used.has(id)?null:tile(id))}{used.size===t.tiles.length&&<p>Tray empty.</p>}</div>
  <div className="tower-columns">{columns.map((col,i)=><section aria-label={'Word column '+(i+1)} key={i}>
    <h3>{String(i+1).padStart(2,'0')} <span>{col.length} / {towerHeight}</span></h3>
    <div className="tower-stack">{col.length?col.map(tile):<span className="tower-slot" aria-hidden="true">·</span>}</div>
    {!g.done&&<button type="button" className="tower-add" aria-label={'Add to column '+(i+1)} disabled={!can(i+1)} onClick={()=>put(i+1)}>＋</button>}
   </section>)}</div>
  {!g.done&&<><p>Select a tile, then a column’s <strong>+</strong> or another tile to swap. A column tile can also return to the tray.</p>
  <div className="actions">
   <button type="button" disabled={!can(0)} onClick={()=>put(0)}>Return tile</button>
   <button type="button" disabled={!enabled||(!edits.length&&selected===null)} onClick={()=>{setEdits([]);setSelected(null)}}>Clear edits</button>
   <button type="button" className="primary" disabled={!enabled} onClick={()=>{submit(packTower(edits));setSelected(null);setEdits([])}}>{edits.length?'Commit turn':'Pass turn'}</button>
   <span>Turn {g.round} / {t.limit}</span>
  </div></>}
  {t.example&&<details><summary>One possible solution</summary><p>{t.example.join(' · ')}</p></details>}
 </section>
}
