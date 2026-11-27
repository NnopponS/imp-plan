import {useEffect,useState,type CSSProperties} from 'react'
import {applyTowerStep,packTower,towerHeight,type TowerEdit} from './tower'
import type {Snapshot} from './room'
import './tower.css'

function TowerGlyph({kind}:{kind:'rack'|'tower'|'add'|'swap'|'return'|'clock'}){
 return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.45" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
  {kind==='rack'?<path d="M2.5 14h19v5h-19zM5 13V6h6v7m2 0V8h6v5M7 16.5h10"/>:
   kind==='tower'?<path d="M3 20h18M5 20V9l3-3 3 3v11m2 0V6l3-3 3 3v14M5 14h6m2-4h6m-6 5h6"/>:
   kind==='add'?<><rect x="3" y="4" width="9" height="9" rx="1"/><path d="M6 8.5h3m-1.5-1.5v3m5 5h7m-3.5-3.5v7M4 18h5"/></>:
   kind==='swap'?<path d="M3 8h17m-4-3 4 3-4 3M4 16h16m-12-3-4 3 4 3"/>:
   kind==='return'?<path d="M2.5 16v4h19v-4M12 3v10m-4-4 4 4 4-4"/>:
   <><circle cx="12" cy="13" r="7.5"/><path d="M10 2h4m-2 8v3l2 1.5m3.5-7 1-1"/></>}
 </svg>
}

function TowerEngraving(){
 return <svg className="tower-engraving" viewBox="0 0 410 158" aria-hidden="true" fill="none">
  <g stroke="currentColor" opacity=".57">
   <path d="M2 154h408M25 150V75q0-22 34-47 34 25 34 47v75m-77 0V76q0-30 43-58 43 28 43 58v74m31 0V64q0-30 47-61 47 31 47 61v86m-82 0V67q0-25 35-50 35 25 35 50v83m47 0V74q0-35 55-71 55 36 55 71v76m-98 0V75q0-30 43-60 43 30 43 60v75M0 92h29m64 0h49m72 0h62m83 0h51M0 115h410M0 138h410"/>
   <path d="M258 152v-36m-27 38v-21m142 19v-23M89 152v-25m35-12V94m115 21V95m144 20V95"/>
   <path d="M178 22v8m-4-4h8m136-8v8m-4-4h8"/>
  </g>
  <path d="M118 151l18-15h225l26 15z" fill="#392d28" stroke="#806247"/>
  <path d="M131 151l19-10h199l20 10M169 145h161" stroke="#a18057" opacity=".68"/>
  <g stroke="#a17b52" strokeWidth="1.2" textAnchor="middle" fontFamily="Georgia, serif" fontSize="16" fontWeight="bold">
   <path fill="#5d4536" d="M168 137V85h12l12-13 12 13h12v52zm59 0V55h12l12-13 12 13h12v82zm59 0V77h12l12-13 12 13h12v60z"/>
   <path fill="#86694b" d="M171 134h42v-17h-42zm0-19h42V98h-42zm59 19h42v-17h-42zm0-19h42V98h-42zm0-19h42V79h-42zm0-19h42V60h-42zm59 57h42v-17h-42zm0-19h42V98h-42zm0-19h42V79h-42z"/>
   <path d="M172 89h40m19-35h40m18 19h40M174 120h35m24-35h35m24 21h35" stroke="#bc976a" opacity=".55"/>
   <g stroke="none" fill="#e2c18c"><text x="192" y="111">T</text><text x="192" y="130">Y</text><text x="251" y="73">W</text><text x="251" y="92">O</text><text x="251" y="111">R</text><text x="251" y="130">D</text><text x="310" y="93">I</text><text x="310" y="112">N</text><text x="310" y="131">K</text></g>
  </g>
 </svg>
}

export function TowerBoard({snap,active,name,submit}:{snap:Snapshot,active:boolean,name:(id:string)=>string,submit:(i:number)=>void}){
 const g=snap.game!,t=g.tower!
 const [edits,setEdits]=useState<TowerEdit[]>([]),[selected,setSelected]=useState<number|null>(null)
 const [now,setNow]=useState(Date.now),[offset,setOffset]=useState(()=>snap.hostNow-Date.now())
 useEffect(()=>{const id=setInterval(()=>setNow(Date.now()),200);return()=>clearInterval(id)},[])
 useEffect(()=>{setNow(Date.now());setOffset(snap.hostNow-Date.now())},[snap.hostNow])
 const seconds=Math.max(0,Math.min(240,Math.ceil(((g.deadline??now)-now-offset)/1000)))
 const enabled=active&&!g.done&&seconds>0&&g.turn===snap.you
 const columns=g.done?t.columns:edits.reduce((cols,edit)=>applyTowerStep({tiles:t.tiles,columns:cols},edit)??cols,t.columns)
 const used=new Set(columns.flat())
 const available=(edit:TowerEdit)=>enabled&&edits.length<2&&!!applyTowerStep({tiles:t.tiles,columns},edit)
 const schedule=(edit:TowerEdit)=>{
  if(available(edit)){setEdits([...edits,edit]);setSelected(null)}
 }
 const tile=(id:number)=>{
  const canSelect=enabled&&edits.length<2&&(selected===null||selected===id||available({tile:selected,dest:id+7}))
  return <button type="button" key={id} className="tower-tile" data-tile={id} data-letter={t.tiles[id]} disabled={!canSelect}
   aria-label={t.tiles[id]+' tile '+(id+1)} aria-pressed={enabled&&selected===id}
   onClick={()=>{if(selected!==null&&selected!==id)schedule({tile:selected,dest:id+7});else setSelected(v=>v===id?null:id)}}>
    {t.tiles[id]}
  </button>
 }
 const action=(dest:number)=>selected===null?undefined:{tile:selected,dest}
 const can=(dest:number)=>!!action(dest)&&available(action(dest)!)
 const put=(dest:number)=>{const edit=action(dest);if(edit)schedule(edit)}
 const left=t.tiles.length-used.size
 const clock=Math.floor(seconds/60)+':'+String(seconds%60).padStart(2,'0')
 return <section className="tower-game" aria-label="Word Tower workshop">
  <header className="tower-mast">
   <TowerEngraving/>
   <div className="tower-mast-copy">
    <p className="tower-imprint"><span aria-hidden="true">◆</span> Season I <i aria-hidden="true"/> Fan mode</p>
    <h2>{g.done?t.score.passed?'Tower cleared':'Tower closed':'Build the word tower'}</h2>
   </div>
   <div className="tower-metrics">
    <strong>{t.columns.length} words · {t.theme}</strong>
    <span>Turn {g.round} / {t.limit}</span>
    <span className="tower-clock" role="timer" aria-label="Time remaining" data-low={seconds<=30&&!g.done}><TowerGlyph kind="clock"/>{g.done?'Finished':clock}</span>
   </div>
  </header>
  <div className="tower-console">
   <p className="tower-turn" role="status" data-active={enabled}>
    {g.done?<>Team score: <strong>{t.score.valid} / {t.columns.length} words</strong> · {t.score.used} / {t.tiles.length} tiles used.</>:
     enabled?<><strong>Your turn.</strong> <span>{edits.length} / 2 edits staged.</span></>:<strong>{name(g.turn)}’s turn.</strong>}
   </p>
   {!g.done&&<div className="tower-actions">
    <button type="button" disabled={!can(0)} onClick={()=>put(0)}>Return tile</button>
    <button type="button" disabled={!enabled||(!edits.length&&selected===null)} onClick={()=>{setEdits([]);setSelected(null)}}>Clear edits</button>
    <button type="button" className="primary" disabled={!enabled} onClick={()=>{submit(packTower(edits));setSelected(null);setEdits([])}}>{edits.length?'Commit turn':'Pass turn'}</button>
   </div>}
  </div>
  <div className="tower-workspace">
   <section className="tower-rack" aria-label="Letter tray">
    <header className="tower-station"><h3><TowerGlyph kind="rack"/>Letter rack</h3><span>{left} left</span></header>
    <div className="tower-tray">{t.tiles.map((_,id)=>used.has(id)?null:tile(id))}
     {!left&&<p className="tower-tray-empty" aria-live="polite">Tray empty.</p>}
    </div>
   </section>
   <section className="tower-board" aria-label="Word towers">
    <header className="tower-station"><h3><TowerGlyph kind="tower"/>Word towers</h3><span>Read top to bottom</span></header>
    <div className="tower-columns" data-dense={columns.length>3} style={{'--tower-count':columns.length} as CSSProperties}>
     {columns.map((col,i)=><section className="tower-column" aria-label={'Word column '+(i+1)} key={i}>
      <h3>{String(i+1).padStart(2,'0')} <span>{col.length} / {towerHeight}</span></h3>
      <div className="tower-stack">{col.length?col.map(tile):<span className="tower-slot" aria-hidden="true">◇</span>}</div>
      {!g.done&&<button type="button" className="tower-add" aria-label={'Add to column '+(i+1)} disabled={!can(i+1)} onClick={()=>put(i+1)}>+</button>}
     </section>)}
    </div>
   </section>
  </div>
  <div className="tower-manual">
   {!g.done&&<ul className="tower-moves" aria-label="Available edits">
    <li><TowerGlyph kind="add"/><span>Tile + tower</span></li>
    <li><TowerGlyph kind="swap"/><span>Two tiles swap</span></li>
    <li><TowerGlyph kind="return"/><span>Return to rack</span></li>
   </ul>}
   <details><summary>How to play</summary>
    <p>Build distinct words in the given theme and use every letter. Read each word from top to bottom. You share four minutes and a limited number of turns.</p>
    <p>On your turn, choose a tile, then select a tower’s + to add it, another tile to swap, or Return tile to put a tower tile back in the rack. You can stage up to two edits. Nothing is shared until you commit.</p>
   </details>
   {t.example&&<details><summary>One possible solution</summary><p>{t.example.join(' · ')}</p></details>}
  </div>
 </section>
}
