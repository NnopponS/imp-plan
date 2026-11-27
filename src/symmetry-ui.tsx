import {useEffect,useRef,useState} from 'react'
import {SymmetryBoard} from './symmetry-board'
import {packSymmetry,symmetryRemove,symmetrySide,symmetryTime,type SymmetryView} from './symmetry'

/** Only consume the projected, connection-bound seat view. No solution, peer layouts or private seeds belong here. */
export function SymmetryPuzzleBoard({board,hostNow,active,submit}:{board:SymmetryView|null;hostNow:number;active:boolean;submit:(action:number)=>void}){
 const sample=useRef({at:performance.now(),host:hostNow});const [now,setNow]=useState(hostNow)
 useEffect(()=>{sample.current={at:performance.now(),host:hostNow};setNow(hostNow)},[hostNow]);
 const finished=board?.finished??true
 useEffect(()=>{if(finished)return;const advance=()=>setNow(sample.current.host+performance.now()-sample.current.at);const t=window.setInterval(advance,200);document.addEventListener('visibilitychange',advance);return ()=>{clearInterval(t);document.removeEventListener('visibilitychange',advance)}},[finished]);
 if(!board)return <section aria-label="Symmetrical Puzzle spectator view" className="mirror-bench"><p className="mb-help">Each player has a private board. Watch the standings for results.</p></section>
 const ms=Math.min(symmetryTime,Math.max(0,board.deadline-now));const s=board.score;
 const status=s.solved?`Mirror complete${s.elapsedMs===null?'':` in ${(s.elapsedMs/1000).toFixed(3)} seconds`}.`:board.finished||ms===0?`Time is up. ${s.partial} pieces in a connected, mirrored group.`:undefined;
 return <SymmetryBoard size={symmetrySide} axis={board.axis} allowFlip={false} pieces={board.pieces.map((cells,id)=>{const p=board.placements[id];return {id,cells,placed:p?{x:p.anchor%symmetrySide,y:Math.floor(p.anchor/symmetrySide),turns:p.rotation,mirrored:false}:null}})} remainingMs={ms} locked={!active||board.finished} status={status} balanceHint={s.placed===board.pieces.length&&!s.solved?(!s.connected?'All pieces placed. Join the islands edge to edge.':'All pieces joined. Align the silhouette with its reflection.'):undefined} onPlace={(id,p)=>submit(packSymmetry(id,p.turns,p.y*symmetrySide+p.x))} onLift={id=>submit(symmetryRemove(id))}/>
}
export {SymmetryPuzzleLesson} from './symmetry-board'
