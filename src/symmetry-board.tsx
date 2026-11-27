import {useId,useRef,useState,type CSSProperties,type KeyboardEvent} from 'react'
import './symmetry-board.css'

export type MirrorAxis='vertical'|'horizontal'|'diagonal'|'anti-diagonal'
export type MirrorCell=readonly [number,number]
export interface MirrorFit {x:number;y:number;turns:number;mirrored:boolean}
export interface MirrorStone {id:number;cells:readonly MirrorCell[];placed:MirrorFit|null}
export interface MirrorBenchProps {
 size:number;axis:MirrorAxis;pieces:readonly MirrorStone[];allowFlip:boolean;
 /** Allowed cells for the optional outline variant, as row-major indices. Omit in free form. */
 mask?:readonly number[]; remainingMs?:number; locked?:boolean; status?:string; balanceHint?:string;
 onPlace:(id:number,p:MirrorFit)=>void;onLift:(id:number)=>void;
}
const names=['Moth','Reed','Star','Fang','Plume','Shell','Crown','Flint','Tide','Iris'] as const
const surfaces=['#e1ae74','#8fac9c','#bd8d94','#9eabc0','#ddc382','#b5a3b9','#95bcc1','#d3a389','#a7b48e','#c0a082'] as const
const emblems=[
 'M0 3Q-5 2 -7 -5Q-3 -6 0 -2Q4 -6 7 -5Q6 1 2 2L4 5L0 3L-3 5Z M0 -3V3',
 'M-5 6Q-2 -2 5 -6Q6 0 0 4L-3 4 M-3 3L3 -3',
 'M0 -7L2 -2L7 0L2 2L0 7L-2 2L-7 0L-2 -2Z M-4 -4L4 4',
 'M-6 -4Q1 -3 6 -6Q5 2 -5 6Q0 1 -2 -2 M-2 4L2 -2',
 'M-5 6L5 -5 M-4 4Q-6 -5 5 -6Q7 -1 0 3L-3 4 M-1 1L-1 -3 M1 0L4 0',
 'M-5 4Q-9 -1 -3 -5Q3 -8 7 -2L2 5Z M-3 3L-5 -1 M-1 3L-2 -4 M1 3L2 -4 M2 3L5 -1',
 'M-6 -4L-3 0L0 -5L3 0L6 -4L4 4H-4Z M-3 6H3',
 'M-5 1L-1 -6L5 -2L4 4L-2 6Z M-1 -5L1 -1L-2 5 M1 -1L5 -2',
 'M-7 -2Q-4 -5 -1 -2T6 -2 M-7 2Q-4 -1 -1 2T6 2 M-4 5Q-2 4 1 5',
 'M-7 0Q0 -8 7 0Q0 7 -7 0Z M0 -3Q-3 0 0 3Q3 0 0 -3Z'
] as const
const stoneName=(n:number)=>names[n%names.length]
const unit=24,corner=9
/** Reflect across x before clockwise turns; then top-left normalize. */
export function orient(cells:readonly MirrorCell[],turns:number,flip:boolean):MirrorCell[]{
 const out=cells.map(([cx,cy])=>{let x=flip?-cx:cx,y=cy;for(let i=0;i<((turns%4)+4)%4;i++)[x,y]=[-y,x];return [x,y] as MirrorCell})
 const x0=Math.min(...out.map(c=>c[0])), y0=Math.min(...out.map(c=>c[1]));return out.map(([x,y])=>[x-x0,y-y0])
}
function onBoard(s:MirrorStone,p:MirrorFit):MirrorCell[]{return orient(s.cells,p.turns,p.mirrored).map(([x,y])=>[x+p.x,y+p.y])}
function edge(shape:readonly MirrorCell[]){
 const keys=new Set(shape.map(([x,y])=>`${x},${y}`)), has=(x:number,y:number)=>keys.has(`${x},${y}`)
 let path='';for(const [x,y] of shape){const a=x*unit,b=y*unit;if(!has(x,y-1))path+=`M${a} ${b}h24`;if(!has(x+1,y))path+=`M${a+24} ${b}v24`;if(!has(x,y+1))path+=`M${a+24} ${b+24}h-24`;if(!has(x-1,y))path+=`M${a} ${b+24}v-24`};return path
}
function Engraving({shape,n}:{shape:readonly MirrorCell[];n:number}){
 const hue=surfaces[n%surfaces.length]; const stamp=shape.slice().sort((a,b)=>a[1]-b[1]||a[0]-b[0])[0];if(!stamp)return null
 return <g className="mb-stone" style={{'--mb-stone':hue} as CSSProperties}>
 {shape.map(([x,y],i)=><g key={x+':'+y} transform={`translate(${x*unit},${y*unit})`}><rect width="24.15" height="24.15" fill="var(--mb-stone)"/><path d={['M3 3l6 .3m6 17l5-1m-17-4l.3-4','M3 19l5 .6m11-15l2-1m-10 4l4-.3','M3 6l3 -.5m9 11l5-1m-1 3l2-.4'][i%3]} fill="none" stroke="#372d2b" opacity=".38" strokeWidth=".7"/></g>)}
 <path d={edge(shape)} stroke="#403327" fill="none" strokeWidth="2.4" strokeLinejoin="round"/><path d={edge(shape)} stroke="#ead8ad" fill="none" strokeWidth=".65"/>
 <g transform={`translate(${stamp[0]*unit+12} ${stamp[1]*unit+12})`}><path d={emblems[n%emblems.length]} fill="none" stroke="#2d2924" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></g></g>
}
export function MirrorStoneMini({piece,n,turns=0,flipped=false}:{piece:MirrorStone;n:number;turns?:number;flipped?:boolean}){
 const cells=orient(piece.cells,turns,flipped);const w=unit*(1+Math.max(...cells.map(c=>c[0]))),h=unit*(1+Math.max(...cells.map(c=>c[1])));
 return <svg aria-hidden="true" viewBox={`-3 -3 ${w+6} ${h+6}`}><Engraving shape={cells} n={n}/></svg>
}
function Axis({axis,side}:{axis:MirrorAxis;side:number}){
 const h=side/2;const [x1,y1,x2,y2]=axis==='vertical'?[h,0,h,side]:axis==='horizontal'?[0,h,side,h]:axis==='diagonal'?[0,0,side,side]:[0,side,side,0];
 return <g className="mb-axis" aria-hidden="true"><line {...{x1,y1,x2,y2}} stroke="#251b18" strokeWidth="3.2"/><line {...{x1,y1,x2,y2}} stroke="#f6ce8a" strokeWidth="1.35" strokeDasharray="4 3"/>{[[x1,y1],[x2,y2]].map(([x,y],i)=><path key={i} transform={`translate(${x} ${y})`} d="M0 -4l3 4-3 4-3-4Z" fill="#e8c68e" stroke="#251b18" strokeWidth="1"/>)}</g>
}
const axisLabel=(axis:MirrorAxis)=>({vertical:'Vertical',horizontal:'Horizontal',diagonal:'Descending diagonal','anti-diagonal':'Ascending diagonal'}[axis])
const axes:Record<MirrorAxis,string>={vertical:'M12 3v18 M9 6l3-3 3 3 M9 18l3 3 3-3',horizontal:'M3 12h18 M6 9l-3 3 3 3 M18 9l3 3-3 3',diagonal:'M4 4l16 16 M4 9V4h5 M15 20h5v-5','anti-diagonal':'M4 20L20 4 M4 15v5h5 M15 4h5v5'}
const clock=(t:number)=>{const s=Math.max(0,Math.ceil(t/1000));return `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`}
function Tool({d}:{d:string}){return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round"><path d={d}/></svg>}
export function SymmetryBoard({size,axis,pieces,allowFlip,mask,remainingMs,locked=false,status,balanceHint,onPlace,onLift}:MirrorBenchProps){
 const uid=useId().replace(/:/g,'');const [pick,setPick]=useState<number|null>(null),[turns,setTurns]=useState(0),[mirrored,setMirrored]=useState(false),[cursor,setCursor]=useState(0),[hover,setHover]=useState<number|null>(null),[aiming,setAiming]=useState(false),[notice,setNotice]=useState('');const refs=useRef<(HTMLButtonElement|null)[]>([])
 const frozen=locked||remainingMs!==undefined&&remainingMs<=0;const chosen=pieces.find(p=>p.id===pick);const allowed=mask===undefined?null:new Set(mask);
 const placed=new Map<number,number>();pieces.forEach(s=>{if(s.placed)onBoard(s,s.placed).forEach(([x,y])=>placed.set(y*size+x,s.id))});
 const gridSide=size*unit;const focusAt=(i:number)=>{setCursor(i);setAiming(true);refs.current[i]?.focus({preventScroll:true})};
 const draft=(i:number):MirrorFit=>({x:i%size,y:Math.floor(i/size),turns,mirrored});const valid=(p:MirrorFit)=>!!chosen&&onBoard(chosen,p).every(([x,y])=>{const i=y*size+x,o=placed.get(i);return x>=0&&y>=0&&x<size&&y<size&&(!allowed||allowed.has(i))&&(o===undefined||o===chosen.id)})
 const aim=hover??cursor,ghost=!frozen&&chosen&&(aiming||hover!==null)?onBoard(chosen,draft(aim)):[];const fit=valid(draft(aim));
 const choose=(id:number)=>{if(frozen)return;const s=pieces.find(p=>p.id===id);if(!s)return;setPick(id);setTurns(s.placed?.turns??0);setMirrored(s.placed?.mirrored??false);setNotice('');setHover(null);setAiming(false)};
 const rotate=()=>{if(!frozen&&chosen){setTurns((turns+1)%4);setNotice('')}};const flip=()=>{if(!frozen&&chosen&&allowFlip){setMirrored(!mirrored);setNotice('')}};
 const lift=()=>{if(frozen||!chosen?.placed)return;onLift(chosen.id);setPick(null);setNotice('');setAiming(false)};
 const act=(i:number)=>{if(frozen)return;setCursor(i);if(!chosen){const id=placed.get(i);if(id!==undefined)choose(id);return}const p=draft(i);if(!valid(p)){setNotice('No fit. Try another square or turn the piece.');setAiming(true);return}if(chosen.placed){const key=(c:MirrorCell)=>c[0]+','+c[1],prev=new Set(onBoard(chosen,chosen.placed).map(key));if(onBoard(chosen,p).every(c=>prev.has(key(c)))){setNotice('Already in that position. Choose another square or lift.');return}}onPlace(chosen.id,p);setPick(null);setHover(null);setAiming(false);setNotice('')}
 const key=(e:KeyboardEvent<HTMLButtonElement>,i:number)=>{const x=i%size,y=Math.floor(i/size),clamp=(n:number)=>Math.max(0,Math.min(size-1,n));switch(e.key){case 'ArrowLeft':e.preventDefault();focusAt(clamp(x-1)+size*y);break;case 'ArrowRight':e.preventDefault();focusAt(clamp(x+1)+size*y);break;case 'ArrowUp':e.preventDefault();focusAt(x+size*clamp(y-1));break;case 'ArrowDown':e.preventDefault();focusAt(x+size*clamp(y+1));break;case 'Home':e.preventDefault();focusAt(size*y);break;case 'End':e.preventDefault();focusAt(size*y+size-1);break;case 'r':case 'R':e.preventDefault();rotate();break;case 'f':case 'F':e.preventDefault();flip();break;case 'Delete':e.preventDefault();lift();break;case 'Escape':if(chosen){e.preventDefault();setPick(null);setNotice('')}break}}
 const total=pieces.length,used=pieces.filter(s=>s.placed).length
 return <section className="mirror-bench" aria-label="Symmetrical Puzzle board" style={{'--mb-n':size,'--mb-tray-cols':total<=7?Math.ceil(total/2):total<=9?4:5,'--mb-gutter':(corner/(size*unit+2*corner)*100)+'%'} as CSSProperties}>
 <div className="mb-strip"><span><Tool d={axes[axis]}/>{axisLabel(axis)} mirror</span><span className="mb-count" aria-label={`${used} of ${total} pieces placed`}>{used}<i>/</i>{total}</span>{remainingMs!==undefined&&<time aria-label="Time remaining">{clock(remainingMs)}</time>}</div>
 <div className="mb-desk"><div className="mb-slab"><svg className="mb-panel" aria-hidden="true" viewBox={`${-corner} ${-corner} ${gridSide+2*corner} ${gridSide+2*corner}`}>
 <defs><pattern id={uid+'-floor'} width="24" height="24" patternUnits="userSpaceOnUse"><path d="M0 24V0H24" fill="none" stroke="#718279" strokeWidth=".8"/><path d="M3 3h2m-2 0v2m14 14l2-.5" fill="none" stroke="#899889" strokeWidth=".6" opacity=".65"/></pattern><clipPath id={uid+'-bounds'}><rect width={gridSide} height={gridSide}/></clipPath></defs>
 <rect x={-corner+1} y={-corner+1} width={gridSide+2*corner-2} height={gridSide+2*corner-2} fill="#272f2d" stroke="#9a7954"/>{[[1,1,0],[gridSide-1,1,90],[gridSide-1,gridSide-1,180],[1,gridSide-1,270]].map(([x,y,r],i)=><g key={i} transform={`translate(${x} ${y}) rotate(${r})`} fill="none" stroke="#c6a078" strokeWidth=".55"><path d="M-5 16V-4H18m-21 15V-2h12M5-5l3-1 3 1m-16 9-1 4 1 3"/><path d="M14-3l3-1 3 1-3 1Zm-17 16 1 3-1 3-1-3z"/></g>)}<rect x="-3.5" y="-3.5" width={gridSide+7} height={gridSide+7} fill="#2d3d3a" stroke="#7f775e" strokeWidth=".7"/>
 {allowed&&Array.from({length:size*size},(_,i)=>!allowed.has(i)&&<rect key={i} x={i%size*unit} y={Math.floor(i/size)*unit} width={unit} height={unit} fill="#192020"/>)}<rect width={gridSide} height={gridSide} fill={`url(#${uid}-floor)`}/>
 {[[0,0],[gridSide,0],[0,gridSide],[gridSide,gridSide]].map(([x,y],i)=><path key={i} d="M0 -3l3 3-3 3-3-3Zm-1 3h2" transform={`translate(${x===0?-5:x+5} ${y===0?-5:y+5})`} fill="#c9a875" stroke="#393128" strokeWidth=".75"/>)}
 {pieces.map((p,n)=>p.placed&&<Engraving key={p.id} shape={onBoard(p,p.placed)} n={n}/>)}<Axis axis={axis} side={gridSide}/>
 <g clipPath={`url(#${uid}-bounds)`}>{ghost.map(([x,y])=><g key={x+','+y} transform={`translate(${x*unit},${y*unit})`}><rect x="1.5" y="1.5" width="21" height="21" fill={fit?'#dfd7a7':'#eab39e'} fillOpacity=".25" stroke={fit?'#f9e5ad':'#ffbca2'} strokeWidth="1.4" strokeDasharray="3 2"/>{!fit&&<path d="M8 8l8 8m0-8l-8 8" stroke="#ffc5af" strokeWidth="2"/>}</g>)}</g>
 </svg><div className="mb-hit" role="group" aria-label="Placement grid" aria-describedby={uid+'-help'} onPointerLeave={()=>setHover(null)}>
 {Array.from({length:size*size},(_,i)=>{const owner=placed.get(i),pos=pieces.findIndex(s=>s.id===owner);return <button key={i} type="button" data-spot={i} ref={n=>{refs.current[i]=n}} aria-disabled={frozen||(!chosen&&pos<0)||!!chosen&&!valid(draft(i))} tabIndex={i===cursor?0:-1} aria-label={`Row ${Math.floor(i/size)+1}, column ${i%size+1}, ${pos>=0?stoneName(pos):allowed&&!allowed.has(i)?'outside outline':'empty'}`} onPointerEnter={e=>{if(e.pointerType==='mouse')setHover(i)}} onFocus={()=>{setCursor(i);setAiming(true)}} onKeyDown={e=>key(e,i)} onClick={()=>act(i)}/>})}</div></div>
 <div className="mb-benchside"><div className="mb-tray" role="group" aria-label="Carved pieces">{pieces.map((p,n)=><button key={p.id} type="button" disabled={frozen} data-inlaid={!!p.placed} aria-pressed={p.id===pick} aria-label={`${stoneName(n)}, ${p.cells.length} cells, ${p.placed?'on board':'in tray'}`} onClick={()=>choose(p.id)}><MirrorStoneMini piece={p} n={n} turns={p.id===pick?turns:p.placed?.turns??0} flipped={p.id===pick?mirrored:p.placed?.mirrored??false}/><span>{stoneName(n)}</span>{p.placed&&<b aria-hidden="true">✓</b>}</button>)}</div>
 <div className="mb-tools" role="group" aria-label="Piece tools"><button type="button" disabled={frozen||!chosen} onClick={rotate}><Tool d="M5 10a7 7 0 1 1 1 7M5 4v6h6"/>Turn</button>{allowFlip&&<button type="button" disabled={frozen||!chosen} onClick={flip}><Tool d="M12 3v18M3 17l5-10v10zm18 0L16 7v10z"/>Flip</button>}<button type="button" onClick={lift} disabled={frozen||!chosen?.placed}><Tool d="M3 14v5h18v-5M12 15V3m-4 4 4-4 4 4"/>Lift</button></div></div></div>
 <p className="mb-help" id={uid+'-help'} role="status">{status|| (frozen?'Board closed.':notice|| (chosen?`${stoneName(pieces.indexOf(chosen))} · ${turns*90}°${mirrored?' · flipped':''}. Pick its top-left corner.`:balanceHint||'Choose a piece. Join them into one mirrored shape.'))}</p><span className="mb-sr">Arrow keys explore. Enter places. R turns, F flips, Delete lifts, Escape clears the selection.</span></section>
}

/** A miniature THREE-piece example (not a generated game); the underlying silhouette, not each tile, must mirror. */
export function SymmetryPuzzleLesson({step}:{step:number}){
 const phase=Number.isFinite(step)?Math.max(0,Math.min(2,Math.trunc(step))):0
 const lesson:readonly (readonly MirrorCell[])[]=[[[1,2],[1,3],[2,3]],[[3,2],[3,3],[3,4]],[[5,2],[4,3],[5,3]]]
 const captions=['Follow the brass mirror line. The outline on one side must match the other.','Pieces may cross the mirror line. Neighbours must meet along an edge.','The complete outline matches its reflection, even though each carved piece need not.']
 return <figure className="mb-lesson" data-rule-demo="symmetry"><svg viewBox="-8 -8 184 184" role="img" aria-label={'Three-piece miniature. '+captions[phase]}><rect x="-7" y="-7" width="182" height="182" fill="#292f2a" stroke="#987d57"/><rect width="168" height="168" fill="#2d3d3a"/>
 {Array.from({length:8},(_,i)=><path key={i} d={`M${i*24} 0v168M0 ${i*24}h168`} stroke="#829386" strokeWidth=".7" opacity=".65"/>)}
 {lesson.slice(0,phase+1).map((cells,i)=><g key={i} className="mb-example-in"><Engraving shape={cells} n={i}/></g>)}<Axis axis="vertical" side={168}/></svg><figcaption>{captions[phase]}</figcaption></figure>
}
