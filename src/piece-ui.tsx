import {useEffect,useRef,useState,type CSSProperties} from 'react'
import {packPiece,pieceCanPlace,pieceClue,pieceFootprint,pieceOccupancy,piecePass,pieceRemove,pieceRotation,pieceSide,pieceTime,type PieceCell} from './piece'
import type {Snapshot} from './room'
import './piece.css'

const coordinate=(i:number)=>'Row '+(Math.floor(i/pieceSide)+1)+', column '+(i%pieceSide+1)
const clock=(ms:number)=>{
 const seconds=Math.max(0,Math.ceil(ms/1000))
 return Math.floor(seconds/60)+':'+String(seconds%60).padStart(2,'0')
}
const styleFor=(id:number)=>({'--piece-ink':['#56397f','#176453','#993d53','#235e8a','#80500e','#7e477b','#3f6651','#7c472e'][id]} as CSSProperties)
function Mini({shape}:{shape:PieceCell[]}){
 const cols=1+Math.max(...shape.map(([x])=>x)),rows=1+Math.max(...shape.map(([,y])=>y))
 return <svg aria-hidden="true" viewBox={`0 0 ${cols} ${rows}`}><title>Piece shape</title>{shape.map(([x,y])=><rect key={x+':'+y} x={x+.06} y={y+.06} width=".88" height=".88" rx=".11"/>)}</svg>
}
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
   <div className="piece-silhouette" role="group" aria-label="Piece silhouette" aria-describedby="piece-instructions" onMouseLeave={()=>setHover(null)}>
    {occupied.map((owner,i)=>{
     const ghost=enabled&&fit.includes(i)
     return <button key={i} type="button" ref={node=>{refs.current[i]=node}} tabIndex={focus===i?0:-1}
      aria-label={coordinate(i)+', '+(owner>=0?'piece '+(owner+1):piece.target[i]?'empty target':'outside target')+(clues.includes(i)?', clue cell':'')}
      aria-disabled={!enabled||(selected===null&&owner<0)}
      className={(clues.includes(i)?'hint ': '')+(ghost?(legal?'fit':'collision'):'')}
      style={owner<0?undefined:styleFor(owner)} data-target={piece.target[i]} data-filled={owner>=0}
      onMouseEnter={()=>setHover(i)} onFocus={()=>{setFocus(i);setHover(null)}}
      onKeyDown={e=>{if(e.key.startsWith('Arrow')){e.preventDefault();onArrow(i,e.key)}}} onClick={()=>click(i)}>{owner>=0?owner+1:''}</button>
    })}
   </div>
   <div className="piece-tray" role="group" aria-label="Piece tray">
    {piece.pieces.map((shape,i)=>{
     const isSelected=i===selected
     const placed=piece.placements[i]
     return <button key={i} type="button" style={styleFor(i)} disabled={!enabled} aria-pressed={isSelected} aria-label={`Piece ${i+1}, ${placed?'on board':'in tray'}, ${shape.length} cells`}
      data-shape={JSON.stringify(shape)} onClick={()=>choose(i)}>
      <span>{i+1}</span><Mini shape={pieceRotation(shape,isSelected?rotation:placed?.rotation??0)}/>
     </button>
    })}
   </div>
  </div>
  {!game.done&&<><p className="piece-instructions" id="piece-instructions">Select a piece, then choose the top-left of its bounding box on the grid. Rotate to change its shape. Use arrow keys to explore the grid and Enter to place.</p>
  {hint&&<p className="piece-hint">{hint.kind==='place'?`Clue: try piece ${hint.piece+1} at ${coordinate(hint.fit.anchor).toLowerCase()}, turned ${hint.fit.rotation*90}° clockwise from the tray.`:`Clue: consider returning piece ${hint.piece+1} to follow one known solution.`}</p>}
  <div className="actions piece-actions">
   <button type="button" disabled={!enabled||selected===null} onClick={()=>{setRotation(r=>(r+1)%4);setNotice('')}}>Rotate clockwise</button>
   <button type="button" disabled={!enabled||selected===null||!previous} onClick={()=>act(pieceRemove(selected!))}>Return piece</button>
   <button type="button" disabled={!enabled||!!hint} onClick={()=>act(pieceClue)}>Use clue (−20 s)</button>
   <button type="button" disabled={!enabled} onClick={()=>act(piecePass)}>Pass turn</button>
  </div></>}
 </section>
}
