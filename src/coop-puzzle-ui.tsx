import {useEffect,useRef,useState,type CSSProperties} from 'react'
import {fits,footprint,orient,owners,relayFilled,type Cell,type Relay,type RelayAction} from './coop-puzzle'
import './coop-puzzle.css'

const inks=['#267263','#a84636','#386c89','#80538a','#99642c','#576e36']
const tone=(i:number)=>({'--inlay':inks[i%inks.length]} as CSSProperties)
const formatClock=(ms:number)=>{const s=Math.max(0,Math.ceil(ms/1000));return Math.floor(s/60)+':'+String(s%60).padStart(2,'0')}
const grains=[
 'M2 22q3-8 8-14t13-6M1 17q5-5 8-11m3 17q4-9 12-12',
 'M3 3q6 4 10 14 2 4 9 6M3 9q5 3 7 9m7-8q3 6 7 7',
 'M2 20q5-7 9-8 7-2 13-8M2 15q6-7 12-7m-4 15q5-6 13-7',
 'M3 4q4 5 6 12 2 5 7 8M7 2q4 8 14 10m-4 4 5 5',
 'M4 21q6-1 8-8 2-7 7-11M3 15q4-1 5-9m8 14q4-4 7-6',
 'M2 10q6 0 11-4 4-3 10-2M3 20q4-4 8-5 8-1 12-6m-12 13 8-3'
]
const flourishes=[
 'M13 5 19 12l-6 8-6-7Zm-2 8h5',
 'M7 13q0-6 6-8 6 3 6 8-1 6-6 8-5-2-6-8Zm6-4v9',
 'M5 15q8-15 16 0-8 7-16 0Zm8-5 3 5-3 4-3-4Z',
 'M6 19 13 6l7 12M8 15h10m-6 4 3-5',
 'M5 12q8-9 16 0-8 9-16 0Zm5 0h6',
 'M7 12q1-5 7-6 5 2 6 7-1 4-6 6-5-2-7-7Zm3.5.5 6 1'
]
function MarquetryFace({piece,grain,seal}:{piece:number;grain:number;seal:boolean}){
 return <g data-inlay-print="face">
  <path className="relay-cut" d="M1.4 4 5 1.4l16 .7L24.4 5l-.5 16-3.6 3.7L3.8 24 1.1 20Z"/>
  <path className="relay-bevel" d="M2.8 19.2 3.6 5 6 3.5l14.5.5M5.4 22l14.1.4 2.5-2.8.4-13.5"/>
  <path className="relay-grain" d={grains[(piece+grain)%grains.length]}/>
  {seal&&<path className="relay-flourish" d={flourishes[piece%flourishes.length]}/>}
 </g>
}
function Inlay({shape,num,rotation=0}:{shape:Cell[];num:number;rotation?:number}){
 const p=orient(shape,rotation),w=1+Math.max(...p.map(c=>c[0])),h=1+Math.max(...p.map(c=>c[1]))
 return <svg className="relay-mini" viewBox={'0 0 '+w*26+' '+h*26} aria-hidden="true" focusable="false" style={tone(num)}>
  {p.map(([x,y],i)=><g key={x+','+y} transform={'translate('+x*26+' '+y*26+')'}><MarquetryFace piece={num} grain={i} seal={!i}/></g>)}
 </svg>
}
function InlaySocket({square}:{square:number}){
 return <g data-inlay-print="socket">
  <path className="relay-recess" d="M2 5 5 2.5l16-.5 3 3.5L23.5 21l-3.5 3L5 23.5l-3-4Z"/>
  <path className="relay-grain" d={grains[square%grains.length]}/>
  <path className="relay-dowel" d="m13 10 2.5 3-2.5 2.5-2.5-2.5Z"/>
 </g>
}
const toolEngravings={
 rotate:'M19 10a7 7 0 1 1-4-5M19 3v7h-7',
 mirror:'M12 3v18M4 17V7l5 10zM20 17V7l-5 10z',
 suggest:'M12 3 20 12 12 21 4 12zM12 8v8m-4-4h8',
 place:'m4 12 5 5L20 6',
 undo:'M9 6 4 11l5 5M4 11h10a5 5 0 0 1 5 5v2',
}
function MosaicMark({tool}:{tool:keyof typeof toolEngravings}){
 return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={toolEngravings[tool]}/></svg>
}
export {RelayLesson} from './coop-puzzle-extra-lessons'
type Props={state:Relay;you:string;name:(id:string)=>string;active:boolean;hostNow:number;submit:(a:RelayAction)=>void}
export function RelayBoard({state:g,you,name,active,hostNow,submit}:Props){
 const [piece,setPiece]=useState(0),[orientation,setOrientation]=useState(0),[anchor,setAnchor]=useState<number|null>(null),[focus,setFocus]=useState(0)
 const [now,setNow]=useState(hostNow),buttons=useRef<(HTMLButtonElement|null)[]>([])
 useEffect(()=>{const start=performance.now();setNow(hostNow);if(g.reason)return;const t=setInterval(()=>setNow(hostNow+performance.now()-start),200);return()=>clearInterval(t)},[hostNow,g.reason])
 const [lastTurn,setLastTurn]=useState(g.turns)
 if(g.turns!==lastTurn){setLastTurn(g.turns);setAnchor(null);setOrientation(0);setPiece(Math.max(0,g.fits.indexOf(null)))}
 const player=g.seats[g.turns%g.seats.length],canAct=active&&!g.reason&&now<g.deadline,mine=you===player
 const attempt={piece,orientation,anchor:anchor??-1},ok=anchor!==null&&fits(g,attempt)
 const owned=owners(g),preview=footprint(g,attempt),count=relayFilled(g),total=owned.length
 const marks=Object.entries(g.marks).map(([seat,f])=>({seat,f,cells:footprint(g,f)}))
 function choose(i:number){setPiece(i);setOrientation(g.fits[i]?.orientation??0);setAnchor(null)}
 const coordinate=(i:number)=>String.fromCharCode(65+i%g.width)+(Math.floor(i/g.width)+1)
 function keyAim(i:number,key:string){
  const x=i%g.width,y=Math.floor(i/g.width),dx=key==='ArrowLeft'?-1:key==='ArrowRight'?1:0,dy=key==='ArrowUp'?-1:key==='ArrowDown'?1:0
  const j=Math.max(0,Math.min(g.width-1,x+dx))+Math.max(0,Math.min(g.height-1,y+dy))*g.width;setFocus(j);buttons.current[j]?.focus()
 }
 return <section className="relay-work" aria-label="Mosaic relay" data-relay-status={g.reason??'playing'}>
 <header className="relay-top"><div><small>MOSAIC</small><strong>{count} / {total} squares</strong></div><div><small>{g.reason?'RECORDED':'TEAM CLOCK'}</small><strong>{formatClock(g.elapsed??(g.ends-now))}</strong></div></header>
 <p className="relay-status" role="status">{g.reason?(g.reason==='tiled'?'All pieces fitted.':g.reason==='clock'?'Five minutes elapsed.':'Turn limit reached.')+' Team score: '+count+' of '+total+'.':(mine?'Your turn':name(player)+'’s turn')+' · '+Math.min(g.limit,g.turns+1)+' of '+g.limit+(mine?'':' · Suggest a fit')}</p>
 {!g.reason&&<p className="relay-time">Seat clock <strong>{formatClock(g.deadline-now)}</strong> · {g.reflect?'Rotation and reflection':'Rotation only'}</p>}
 <div className="relay-bench">
 <div className="relay-board-lane"><div className="relay-frame"><div className="relay-grid" role="group" aria-label={g.width+' by '+g.height+' mosaic frame'} style={{gridTemplateColumns:'repeat('+g.width+',minmax(0,1fr))'}}>
 {owned.map((id,i)=>{
  const m=marks.filter(m=>m.cells.includes(i)),ghost=anchor!==null&&!g.fits[piece]&&preview.includes(i)
  return <button key={i} className="relay-square" type="button" tabIndex={focus===i?0:-1} ref={el=>{buttons.current[i]=el}} aria-label={coordinate(i)+(id<0?', empty':', tile '+(id+1))+(m.length?', suggested':'')} aria-disabled={!canAct}
   data-cell={i} data-tile={id>=0?id:undefined} data-ghost={ghost?(ok?'fit':'collision'):undefined} data-mark={m.length||undefined} style={tone(id<0?piece:id)}
   onFocus={()=>setFocus(i)} onKeyDown={e=>{if(e.key.startsWith('Arrow')){e.preventDefault();keyAim(i,e.key)}}}
   onClick={()=>{if(canAct){if(g.fits[piece]&&id>=0)choose(id);else{if(g.fits[piece])choose(Math.max(0,g.fits.indexOf(null)));setAnchor(i)}}}}>
   <svg className="relay-square-print" viewBox="0 0 26 26" aria-hidden="true" focusable="false">
    {id>=0||ghost&&ok?<MarquetryFace piece={id>=0?id:piece} grain={i} seal={false}/>:<InlaySocket square={i}/>}
   </svg>
   {id>=0?<b aria-hidden="true">{id+1}</b>:ghost?<span className="relay-draft-mark" aria-hidden="true">{ok?'◇':'×'}</span>:null}
   {m.length>0&&<em aria-hidden="true">•</em>}</button>
 })}</div></div>
 {!g.reason&&<div className="relay-console">
 <div className="relay-tools" role="group" aria-label="Mosaic tools">
 <button type="button" aria-label="Rotate 90°" title="Rotate 90°" disabled={!canAct||!!g.fits[piece]} onClick={()=>setOrientation(o=>4*Math.floor(o/4)+(o+1)%4)}><MosaicMark tool="rotate"/></button>
 {g.reflect&&<button type="button" aria-label="Mirror tile" title="Mirror tile" disabled={!canAct||!!g.fits[piece]} onClick={()=>setOrientation(o=>(8-o%4)%4+(o<4?4:0))}><MosaicMark tool="mirror"/></button>}
 <button type="button" aria-label="Suggest fit" title="Suggest fit" disabled={!canAct||!ok} onClick={()=>submit({kind:'mark',...attempt})}><MosaicMark tool="suggest"/></button>
 {g.fits[piece]?<button type="button" aria-label={'Undo tile '+(piece+1)} title="Undo tile" disabled={!canAct||!mine} onClick={()=>submit({kind:'undo',piece})}><MosaicMark tool="undo"/>Undo</button>:
 <button type="button" className="primary" aria-label="Place tile" disabled={!canAct||!mine||!ok} onClick={()=>submit({kind:'place',...attempt})}><MosaicMark tool="place"/>Place</button>}
 </div>
 <div className="relay-readout">{g.fits[piece]?'Tile '+(piece+1)+' placed':'Tile '+(piece+1)+' · '+(orientation%4*90)+'°'+(orientation>=4?' mirrored':'')+(anchor!==null?' · '+coordinate(anchor)+(ok?' fits':' blocked'):' · Choose a square')}</div>
 {marks.length>0&&<ul aria-label="Team suggestions">{marks.map(({seat,f})=><li key={seat}><button disabled={!canAct} onClick={()=>{setPiece(f.piece);setAnchor(f.anchor);setOrientation(f.orientation)}}>Try {name(seat)}’s suggestion: tile {f.piece+1} at {coordinate(f.anchor)}</button></li>)}</ul>}
 </div>}
 </div>
 <div className="relay-rack"><h3>Piece tray</h3><div className="relay-tray" role="group" aria-label="Mosaic pieces">
 {g.pieces.map((s,i)=><button key={i} className="relay-stamp" type="button" data-shape={JSON.stringify(s)} data-piece={i} data-fitted={g.fits[i]?'yes':'no'} disabled={!canAct} aria-pressed={piece===i} aria-label={'Tile '+(i+1)+', '+s.length+' squares, '+(g.fits[i]?'placed':'in tray')} onClick={()=>choose(i)}>
 <b>{i+1}</b><Inlay shape={s} num={i} rotation={piece===i?orientation:g.fits[i]?.orientation??0}/></button>)}</div></div>
 </div>
 </section>
}
