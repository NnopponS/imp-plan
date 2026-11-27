import {TableToolMark} from './engraved-tables'
import {memo,useEffect,useRef,useState,type CSSProperties} from 'react'
import {packPiece,pieceCanPlace,pieceClue,pieceFootprint,pieceOccupancy,piecePass,pieceRemove,pieceRotation,pieceSide,pieceTime,type PieceCell} from './piece'
import type {Snapshot} from './room'
import './piece.css'

const coordinate=(i:number)=>'Row '+(Math.floor(i/pieceSide)+1)+', column '+(i%pieceSide+1)
const clock=(ms:number)=>{
 const seconds=Math.max(0,Math.ceil(ms/1000))
 return Math.floor(seconds/60)+':'+String(seconds%60).padStart(2,'0')
}
const styleFor=(id:number)=>({'--piece-ink':['#56397f','#176453','#993d53','#235e8a','#80500e','#7e477b','#3f6651','#7c472e'][id]} as CSSProperties)
// Original hand-cut contours. All artwork is non-interactive and sized to the underlying 7×7 controls.
const cuts=[
 'M5 2.7 15 2.2 27 3.3 34.4 2.5 37.5 6.2 37.2 15.7 38 27.4 36.6 34.5 33.1 37.6 23.8 36.5 13.6 37.4 6.8 36.7 3.1 34 3.6 24 2.6 14.5 3.2 7.1Z',
 'M6.4 3.2 17.4 3.7 24.1 2.5 34.3 3 37.6 5.6 36.8 14.3 37.4 23.5 36.8 33 34 36.8 26 37.6 17.2 36.7 7.4 37.4 3 34.2 3.7 23.3 2.7 12.3 3.1 6.9Z',
 'M5.5 2.6 11.6 3.4 25.3 2.8 34.9 3.6 37.2 7.8 36.9 18.6 37.7 28.4 36.5 34.5 33.2 37.2 25.6 36.6 14.7 37.6 5.7 36.9 2.6 33.4 3.2 23.5 2.7 14.4 3.6 6.6Z',
] as const
const emblems=[
 'M20 4.5 24 8.9l-4 4.4-4-4.4Z M20 6.2v5.3m-2.2-2.6h4.4',
 'M14.5 11q2.1-5 5.5-5.3 3.3 0 5.5 5.3m-8.1 0q1.3-2.4 2.6-2.5 1.3.1 2.6 2.5',
 'M15 11.8l5-6.6 5 6.6m-7.5-1.9 2.5-3.4 2.5 3.4',
 'M16 10.8q-1.1-2.1 1.2-3.6l2.8 1.1 2.8-1.1q2.3 1.5 1.2 3.6l-4 1.8Z',
 'M15.1 10.8h9.8M17.2 7.3v5m2.8-6.2v6.2m2.8-5v5',
 'M16 6.5l8 4.9m-8 0 8-4.9m-8 .2h8v4.5h-8Z',
 'M16.5 10.8h6.9l.8-2.4-2.3-1.8-1.9 2-1.9-2-2.3 1.8Z',
 'M14.7 10.8q1.6-3.1 3.6-2.9l3.4 2.1q1.8.7 3.4-1.3m-6-2h2.6',
] as const
const scuffs=[
 'M9 11.4l3.5-1.5M10 14.7l2-.9M28 25.5l2.5-1.6m-3.4 4.7 4.4-2.5m-17.1 4.7 2.5-.8',
 'M8.5 12.4l4.2-2.4M9 16l2.8-1.6M27.9 27l3-1.5m-5.9 5.6 6.9-3.2m-21.9 3 2.4-.7',
 'M8.2 12.2l3.9-2M11 14.6l2-.8m15 10.8 3-1.5m-4.9 5.6 5.2-2.6M9.8 30.9l3.9-1.1',
] as const

function CarvedFace({ink,cut,showStamp=true}:{ink:number;cut:number;showStamp?:boolean}){
 const border=cuts[cut]
 return <>
  <path className="piece-face-shadow" d={border} transform="translate(0 1.55)"/>
  <path className="piece-face-body" d={border}/>
  <path className="piece-face-lip" d="M6.8 10.7 7.9 6.8 14 6.6l12-.1 6.3.8 1.3 4.2M7.2 12.7 6.7 21l.5 7m23.9 2.2 2.2-4 .4-6.7m-25.1 12 3.2 1.3 9.7-.4 6.4.5"/>
  <path className="piece-face-line" d={scuffs[cut]}/>
  <path className="piece-face-wear" d="M9 33.2l-1.8-2m7.5 3.3 10-.2 5.8-.4 2.1-2.8m1.1-11.7.3-6.2"/>
  {showStamp&&<path className="piece-face-stamp" d={emblems[ink]} />}
 </>
}

const SlotFace=memo(function SlotFace({index,target,hint}:{index:number;target:boolean;hint:boolean}){
 const cut=index%cuts.length
 return <svg className="piece-cell-art" aria-hidden="true" focusable="false" viewBox="0 0 40 40" data-craft-slot={target?'recess':'outside'} data-craft-clue={hint||undefined}>
  {target?<>
   <path className="piece-slot-lip" d={cuts[cut]}/>
   <path className="piece-slot-recess" d={cuts[cut]} transform="translate(3.6 3.5) scale(.82)"/>
   <path className="piece-slot-bevel" d="M8.7 30.5l.4 2 5.7.9 7.3-.5 7.4.3 3.1-3.6.3-7.5m-24-5.5.3-4.7 2.8-3.2 6-.1m6.3.5 4.7-.2 3 2.5.1 4.7"/>
   <path className="piece-slot-chisel" d={scuffs[cut]}/>
   <path className={hint?'piece-clue-stamp':'piece-slot-axis'} d={hint?'M20 14v12m-6-6h12m-9-3 6 6m-6 0 6-6':'M17 20h6m-3-3v6'}/>
  </>:<path className="piece-outside-etch" d="M7 12V8l4-.6m20 5v-4h-4M8 28v3.8l4 .5m16 .1 3.2-.6v-3.6M18 21l4-2"/>}
 </svg>
})

const FitMark=memo(function FitMark({legal}:{legal:boolean}){
 return <svg className="piece-ghost-art" aria-hidden="true" focusable="false" viewBox="0 0 40 40" data-craft-ghost={legal?'fit':'collision'}>
  <path className="piece-ghost-outline" d="M12 3H3v9m25-9h9v9m-9 25h9v-9m-25 9H3v-9"/>
  <path className="piece-ghost-glyph" d={legal?'m27 28 3 3 5-6':'m26 25 8 8m0-8-8 8'}/>
 </svg>
})

const BoardTile=memo(function BoardTile({owner,index}:{owner:number;index:number}){
 return <>
  <svg className="piece-cell-art" aria-hidden="true" focusable="false" viewBox="0 0 40 40" data-carved-piece={owner+1}><CarvedFace ink={owner} cut={(owner+index)%cuts.length}/></svg>
  <span className="piece-board-number" aria-hidden="true">{owner+1}</span>
 </>
})

const Mini=memo(function Mini({unturned,rotation,owner}:{unturned:PieceCell[];rotation:number;owner:number}){
 const shape=pieceRotation(unturned,rotation)
 const cols=1+Math.max(...shape.map(([x])=>x)),rows=1+Math.max(...shape.map(([,y])=>y))
 return <svg className="piece-tray-shape" aria-hidden="true" focusable="false" viewBox={`0 0 ${cols*40} ${rows*40}`} data-carved-piece={owner+1}>
  {shape.map(([x,y],i)=><g key={x+':'+y} transform={`translate(${x*40} ${y*40})`} data-carved-cell=""><CarvedFace ink={owner} cut={(owner+x+y)%cuts.length} showStamp={i===0}/></g>)}
 </svg>
})
export function PieceBoard({snap,name,active,submit}:{snap:Snapshot;name:(id:string)=>string;active:boolean;submit:(n:number)=>void}){
 const game=snap.game!,piece=game.piece!
 const [selected,setSelected]=useState<number|null>(null)
 const [rotation,setRotation]=useState(0)
 const [focus,setFocus]=useState(()=>piece.target.indexOf(true))
 const [hover,setHover]=useState<number|null>(null)
 const [notice,setNotice]=useState('')
 const [localTime,setLocalTime]=useState(()=>performance.now())
 const [delta,setDelta]=useState(()=>snap.hostNow-performance.now())
 const refs=useRef<(HTMLButtonElement|null)[]>([])
 useEffect(()=>{const id=setInterval(()=>setLocalTime(performance.now()),150);return()=>clearInterval(id)},[])
 useEffect(()=>{const n=performance.now();setLocalTime(n);setDelta(snap.hostNow-n)},[snap.hostNow])
 const remaining=Math.min(pieceTime,Math.max(0,(game.deadline??snap.hostNow)-localTime-delta))
 const enabled=active&&!game.done&&game.turn===snap.you&&remaining>0
 const occupied=pieceOccupancy(piece)
 const hint=piece.hint
 const clues=hint?.kind==='place'?pieceFootprint(piece,hint.piece,hint.fit.rotation,hint.fit.anchor):[]
 const aim=hover??focus
 const previous=selected===null?null:piece.placements[selected]
 const fit=selected===null?[]:pieceFootprint(piece,selected,rotation,aim)
 const legal=selected!==null&&pieceCanPlace(piece,selected,{rotation,anchor:aim})
 const display=piece.score
 const choose=(id:number)=>{
  setSelected(id===selected?null:id)
  setRotation(piece.placements[id]?.rotation??0)
  setNotice('')
 }
 const act=(action:number)=>{setSelected(null);setHover(null);setNotice('');submit(action)}
 const click=(i:number)=>{
  if(!enabled)return
  if(selected===null){if(occupied[i]>=0)choose(occupied[i]);return}
  if(!pieceCanPlace(piece,selected,{anchor:i,rotation})){
   setNotice('This piece does not fit there. Try rotating it or choosing a different cell.')
   return
  }
  if(previous&&pieceFootprint(piece,selected,previous.rotation,previous.anchor).join()===pieceFootprint(piece,selected,rotation,i).join()){
   setNotice('That piece is already there. Choose another cell or use Return piece.')
   return
  }
  act(packPiece(selected,rotation,i))
 }
 const onArrow=(i:number,key:string)=>{
  const dx=key==='ArrowLeft'?-1:key==='ArrowRight'?1:0,dy=key==='ArrowUp'?-1:key==='ArrowDown'?1:0
  const x=i%pieceSide,y=Math.floor(i/pieceSide)
  const j=Math.max(0,Math.min(pieceSide-1,x+dx))+pieceSide*Math.max(0,Math.min(pieceSide-1,y+dy))
  setFocus(j);refs.current[j]?.focus()
 }
 return <section className="piece-workshop" aria-label="Piece Puzzle workshop">
  <div className="auction-top"><strong>{display.filled} / {display.total} cells filled</strong><span className="pill" aria-label="Time remaining">{game.done?'Finished':clock(remaining)}</span></div>
  <p className="piece-turn" role="status">{game.done?(display.adjustedMs===null?`Partial result: ${display.filled} of ${display.total} cells filled.`:`Rated time: ${(display.adjustedMs/1000).toFixed(1)} seconds, including clues.`):enabled?'Your turn. '+(notice||'Select a piece or pass.'):name(game.turn)+'’s turn.'}</p>
  <div className="piece-play-area">
   <div className="piece-silhouette" role="group" aria-label="Piece silhouette" aria-describedby="piece-instructions" onPointerLeave={()=>setHover(null)}>
    {occupied.map((owner,i)=>{
     const ghost=enabled&&fit.includes(i)
     return <button key={i} type="button" ref={node=>{refs.current[i]=node}} tabIndex={focus===i?0:-1}
      aria-label={coordinate(i)+', '+(owner>=0?'piece '+(owner+1):piece.target[i]?'empty target':'outside target')+(clues.includes(i)?', clue cell':'')}
      aria-disabled={!enabled||(selected===null&&owner<0)}
      className={(clues.includes(i)?'hint ': '')+(ghost?(legal?'fit':'collision'):'')}
      style={owner<0?undefined:styleFor(owner)} data-target={piece.target[i]} data-filled={owner>=0}
      // Scroll can move a cell under a resting pointer, but must not replace keyboard aim.
      onPointerMove={e=>{if(e.pointerType==='mouse'||e.pointerType==='pen')setHover(i)}} onFocus={()=>{setFocus(i);setHover(null)}}
      onKeyDown={e=>{if(e.key.startsWith('Arrow')){e.preventDefault();onArrow(i,e.key)}}} onClick={()=>click(i)}>
      {owner>=0?<BoardTile owner={owner} index={i}/>:<SlotFace index={i} target={piece.target[i]} hint={clues.includes(i)}/>}
      {ghost&&<FitMark legal={legal}/>}
     </button>
    })}
   </div>
   <div className="piece-tray" role="group" aria-label="Piece tray">
    {piece.pieces.map((shape,i)=>{
     const isSelected=i===selected
     const placed=piece.placements[i]
     return <button key={i} type="button" style={styleFor(i)} disabled={!enabled} aria-pressed={isSelected} aria-label={`Piece ${i+1}, ${placed?'on board':'in tray'}, ${shape.length} cells`}
      data-shape={JSON.stringify(shape)} onClick={()=>choose(i)}>
      <span aria-hidden="true">{i+1}</span><Mini unturned={shape} rotation={isSelected?rotation:placed?.rotation??0} owner={i}/>
     </button>
    })}
   </div>
  </div>
  {!game.done&&<><p className="piece-instructions" id="piece-instructions">Select a piece, then choose the top-left of its bounding box on the grid. Rotate to change its shape. Use arrow keys to explore the grid and Enter to place.</p>
  {hint&&<p className="piece-hint">{hint.kind==='place'?`Clue: try piece ${hint.piece+1} at ${coordinate(hint.fit.anchor).toLowerCase()}, turned ${hint.fit.rotation*90}° clockwise from the tray.`:`Clue: consider returning piece ${hint.piece+1} to follow one known solution.`}</p>}
  <div className="actions piece-actions">
   <button type="button" disabled={!enabled||selected===null} onClick={()=>{setRotation(r=>(r+1)%4);setNotice('')}}><TableToolMark mark="rotate"/>Rotate clockwise</button>
   <button type="button" disabled={!enabled||selected===null||!previous} onClick={()=>act(pieceRemove(selected!))}><TableToolMark mark="return"/>Return piece</button>
   <button type="button" disabled={!enabled||!!hint} onClick={()=>act(pieceClue)}><TableToolMark mark="clue"/>Use clue (−20 s)</button>
   <button type="button" disabled={!enabled} onClick={()=>act(piecePass)}>Pass turn</button>
  </div></>}
 </section>
}
