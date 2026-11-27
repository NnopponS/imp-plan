import {CubeView} from './cube-view'
import {useEffect,useState,type CSSProperties} from 'react'
import {hexCells,hexLines,isPuzzle,puzzleRounds} from './puzzles'
import type {Snapshot} from './room'
import {base} from './brand'
import './puzzle-instruments.css'

const instrumentNames={
 hex:['Hexagon instrument','Memory lattice','Target'],
 cubes:['Cube workbench','Cube workbench','Stack'],
 rectangles:['Rectangle ledger instrument','Rectangle ledger','Grid'],
 exile:['Exile counting instrument','Zero-sum audit','Grid']
} as const

const hexPoint=({q,r}:{q:number,r:number})=>[265+(q+r/2)*95,217.5+r*78]

// Each seal uses the same touch footprint; only the patina changes with the casting.
function HexSeal({index}:{index:number}){
 const vein=[
  'M7 31q8-9 16-10m-12 34q6 2 12 2m25 11 11-6m2-19 5-8',
  'M12 30q6-5 13-7m-13 27 4 6m33 11q7-2 10-8m-1-30 4 7',
  'M12 36 17 28m0 39 6 2m30-39q7 4 9 10m-9 20 5-5',
  'M8 33q5-6 15-10m29 2 8 7m-9 36 7-5m-43-8q-1-5 2-8',
 ][index%4]
 return <svg className="hex-seal" viewBox="0 0 82 94" preserveAspectRatio="none" aria-hidden="true" focusable="false">
  <path className="hex-seal-depth" d="M41 2 79 23 80 69 42 93 3 72 2 27Z"/>
  <path className="hex-seal-bevel" d="M41 2 79 23 78 66 42 88 4 67 3 26Z"/>
  <path className="hex-seal-face" d="M41 7 74 26 73 63 42 82 9 64 8 29Z"/>
  <path className="hex-seal-edge" d="m7 25 34-21 33 19M5 32l1 32m7 5 26 16m6 0 27-18M78 29l-1 29"/>
  <path className="hex-seal-vein" d={vein}/>
  <path className="hex-seal-crease" d="m26 16 15-8 7 3m19 58-7 4m-32 4L15 68"/>
  <path className="hex-seal-stamp" d="m41 65 4 4-4 4-4-4Z"/>
  <path className="hex-seal-focus" d="M41 5 76 25 75 65 42 85 8 65 6 28Z"/>
 </svg>
}

function HexField({values,study,picked,valid,enabled,toggle}:{values:number[],study:boolean,picked:number[],valid:boolean,enabled:boolean,toggle:(n:number)=>void}){
 const path=valid?picked.map(i=>hexPoint(hexCells[i])).sort((a,b)=>a[0]-b[0]||a[1]-b[1]).map(p=>p.join(',')).join(' '):''
 return <div className="puzzle-board hex-instrument" role="group" aria-label="Hexagon tiles">
  <svg className="hex-cradle" viewBox="0 0 530 435" aria-hidden="true" focusable="false">
   <path className="hex-cradle-edge" d="M153 4 377 2 521 161 527 276 382 430 149 433 5 275 9 162Z"/>
   <path className="hex-cradle-ink" d="M153 13 377 10 512 168 516 269 378 420 154 424 17 269 18 167Z"/>
   <path className="hex-cradle-wear" d="M154 7 375 5m-221 6 102-1m77-1 41-1m7 3 67 72m68 84 3 96m-15 20-39 44m-75 84-11 10-225 2m-9-2-23-23M55 317l-38-44m-5-12 3-96m23-31 70-81m25-27 13-14"/>
  </svg>
  {path&&<svg className="hex-trace" viewBox="0 0 530 435" aria-hidden="true" focusable="false"><polyline points={path}/><polyline points={path}/></svg>}
  {hexCells.map((cell,i)=>{
   const [x,y]=hexPoint(cell)
   return <button type="button" key={i} style={{left:x/530*100+'%',top:y/435*100+'%'}} aria-label={`Tile ${i+1}${study?', value '+values[i]:''}`}
     aria-pressed={picked.includes(i)} disabled={!enabled} onClick={()=>toggle(i)}>
    <HexSeal index={i}/><span className="hex-seal-letter">{study?values[i]:String.fromCharCode(65+i)}</span>
   </button>
  })}
 </div>
}

function RectangleField({values,rows,cols,exile,picked,enabled,toggle}:{values:number[],rows:number,cols:number,exile:boolean,picked:number[],enabled:boolean,toggle:(n:number)=>void}){
 const gridStyle={'--puzzle-cols':cols,'--puzzle-rows':rows} as CSSProperties
 return <div className="rect-chart" style={gridStyle}>
  <div className="puzzle-axis-corner" aria-hidden="true">⊕</div>
  <div className="puzzle-axis-x" aria-hidden="true">{Array.from({length:cols},(_,i)=><span key={i}>{String.fromCharCode(65+i)}</span>)}</div>
  <div className="puzzle-axis-y" aria-hidden="true">{Array.from({length:rows},(_,i)=><span key={i}>{i+1}</span>)}</div>
  <div role="group" className="puzzle-board rect-puzzle" aria-label="Rectangle grid">
   {values.map((value,i)=><button type="button" key={i} data-sign={value<0?'negative':value>0?'positive':'zero'}
    aria-label={`Row ${Math.floor(i/cols)+1}, column ${i%cols+1}: ${value}`} aria-pressed={picked.includes(i)} disabled={!enabled} onClick={()=>toggle(i)}>{exile&&value>0?'+'+value:value}</button>)}
  </div>
 </div>
}

function InstrumentMark({kind}:{kind:keyof typeof instrumentNames}){
 return <svg viewBox="0 0 32 32" fill="none" aria-hidden="true" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round">
  {kind==='cubes'?<path d="m16 3 11 6v14l-11 6-11-6V9zm0 12 11-6m-11 6L5 9m11 6v14m-6-17 11-6m-5 16 11-6M5 16l11 6"/>:
   kind==='hex'?<path d="m16 3 11 6.5v13L16 29 5 22.5v-13zm-9 18 18-10m-12 7 6-4m-3-4v12"/>:
   kind==='exile'?<path d="M3 5h26v22H3zm13 0v22M3 16h26m-22-6h5m-2.5-2.5v5m10-2.5h5M7 21h5m7 0h5m-5 2h5"/>:
   <path d="M4 4h24v24H4zm8 0v24m8-24v24M4 12h24M4 20h24M8 8h12v12H8z"/>}
 </svg>
}

export function PuzzleBoard({snap,active,submit,name}:{snap:Snapshot,active:boolean,submit:(i:number)=>void,name:(s:string)=>string}){
 const g=snap.game!, p=g.puzzle!
 const rounds=isPuzzle(g.game)?puzzleRounds(g.game):0
 const cubes=g.game==='cubes',hex=g.game==='hex',exile=g.game==='exile',study=p.stage==='study',locked=g.mine!==null
 const [now,setNow]=useState(Date.now)
 const [offset,setOffset]=useState(()=>snap.hostNow-Date.now())
 const [picked,pick]=useState<number[]>([])
 const [answer,setAnswer]=useState('')
 useEffect(()=>{const t=setInterval(()=>setNow(Date.now()),200);return()=>clearInterval(t)},[])
 useEffect(()=>{setNow(Date.now());setOffset(snap.hostNow-Date.now())},[snap.hostNow])
 const seconds=Math.max(0,Math.ceil(((g.deadline??now)-now-offset)/1000))
 const line=hexLines().findIndex(l=>picked.length===3&&l.every(i=>picked.includes(i)))
 const max=cubes?p.rows*p.cols*4:p.rows*(p.rows+1)*p.cols*(p.cols+1)/4
 const valid=hex?line>=0:/^\d+$/.test(answer)&&Number(answer)<=max
 const enabled=active&&!study&&!locked&&!g.done&&seconds>0
 const toggle=(i:number)=>pick(a=>a.includes(i)?a.filter(n=>n!==i):hex&&a.length>=3?a:[...a,i])
 const clock=Math.floor(seconds/60)+':'+String(seconds%60).padStart(2,'0')
 const kind=cubes?'cubes':hex?'hex':exile?'exile':'rectangles'
 const [label,title,unit]=instrumentNames[kind]
 const cue=locked?'Answer locked. Waiting for the other seats.':study?'Study the board. Then the numbers disappear.':
  hex?picked.length===3&&line<0?'That is not a straight line.':line>=0?'Straight line selected.':`${picked.length} / 3 tiles · one straight line`:
  cubes?'Include hidden supports.':exile?'Count every rectangle that balances to zero.':'Squares and single tiles count.'
 const answerPanel=<div className="puzzle-answer">
    {cubes&&<div className="puzzle-cube-index"><InstrumentMark kind="cubes"/><span>{p.cols} × {p.rows} footprint<small>Every occupied level counts</small></span></div>}
    {exile&&<div className="puzzle-signs" aria-label="Number sign key"><span data-sign="negative">− Negative</span><span data-sign="zero">0 Zero</span><span data-sign="positive">+ Positive</span></div>}
    {hex&&!study&&<span className="hex-peg-rail" aria-hidden="true">
     {[0,1,2].map(i=><i key={i} data-occupied={i<picked.length}/>)}
    </span>}
    <p className="puzzle-cue" role="status">{cue}</p>
    {!study&&<form className="puzzle-lock" onSubmit={e=>{e.preventDefault();if(enabled&&valid)submit(hex?line:Number(answer))}}>
     {!hex&&<label>{cubes?'Cube count':'Rectangle count'}<input type="text" inputMode="numeric" pattern="[0-9]+" maxLength={3} value={answer} onChange={e=>setAnswer(e.target.value)} disabled={!enabled}/></label>}
     <button type="submit" className="primary" disabled={!enabled||!valid}>Lock answer</button>
     {!cubes&&<button type="button" disabled={!enabled||!picked.length} onClick={()=>pick([])}>Clear {hex?'selection':'highlights'}</button>}
    </form>}
   </div>
 const titleplate=<header className="puzzle-titleplate">
   <div className="puzzle-titlemark"><InstrumentMark kind={kind}/><div><p className="puzzle-imprint">{study?'Study phase':g.done?'Final record':hex?'Recall phase':'Counting table'}</p><h3>{title}</h3></div></div>
   {!g.done&&!study&&!cubes&&<div className="puzzle-target"><span>Target sum</span><strong>{p.target}</strong></div>}
   <div className="puzzle-phase"><span>{unit} {g.round} / {rounds}</span><span role="timer" aria-label="Time remaining" data-urgent={seconds<=5&&!g.done}>{g.done?'Finished':clock}</span></div>
  </header>
 const visual=<div className="puzzle-visual">
   {cubes?<CubeView heights={p.values} side={p.cols}/>:
    hex?<HexField values={p.values} study={study} picked={picked} valid={valid} enabled={enabled} toggle={toggle}/>:
    <RectangleField values={p.values} rows={p.rows} cols={p.cols} exile={exile} picked={picked} enabled={enabled} toggle={toggle}/>}
  </div>
 return <section className="puzzle-instrument" data-instrument={kind} data-closed={g.done} aria-label={label}>
  {hex&&!g.done?<div className="hex-stage" data-phase={study?'study':'recall'}>
   <picture className="hex-scene-picture" aria-hidden="true">
    {/* From seasonal-hex.svg: the original keeper, masonry, lantern and table, never the painted tiles or target. */}
    <source media="(max-width: 600px)" srcSet={base+'art/hex-live-portrait.webp'}/>
    <img className="hex-chamber-art" src={base+'art/hex-live-landscape.webp'} alt="" decoding="async" draggable={false}/>
   </picture>
   {titleplate}{visual}{answerPanel}
  </div>:<>{titleplate}{!g.done&&<div className="puzzle-desk">
   {exile&&answerPanel}{visual}{!exile&&answerPanel}
  </div>}</>}
  <ul className="puzzle-record" role="list" aria-label="Score record">{g.seats.map((s,i)=><li key={s}>
   <span>{name(s)}</span><strong>{g.scores[i]} correct</strong>
   {g.done&&<span className="puzzle-score-pips" aria-hidden="true">{Array.from({length:rounds},(_,pip)=><i key={pip} data-correct={pip<g.scores[i]}/>)}</span>}
   {g.last&&<small>{g.last[i]?'Previous answer correct':'Previous round: no point'}</small>}
  </li>)}</ul>
 </section>
}
