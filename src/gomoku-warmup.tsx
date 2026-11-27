import {useState} from 'react'
import {move,start} from './engine'

const at=(r:number,c:number)=>(r-1)*15+c-1
const you='You', other='Opponent'
const opening=[at(8,5),at(8,4),at(8,6),at(7,5),at(8,7),at(9,7),at(8,8),at(9,9)]
const lesson=opening.reduce((g,i)=>move(g,g.seats[g.turn],i,0)!,start('blind',[you,other],25000,0))
const crop=Array.from({length:35},(_,i)=>[6+Math.floor(i/7),4+i%7] as const)

export function GomokuWarmup({practice}:{practice:()=>void}){
 const [result,setResult]=useState<{cell:number;won:boolean}|null>(null)
 const won=!!result?.won
 return <section className="warmup" aria-labelledby="warmup-title">
  <header><div><h2 id="warmup-title">One-move warm-up</h2><p>Blind Gomoku · stones revealed for this example</p></div><button type="button" onClick={()=>setResult(null)} disabled={!result}>Reset warm-up</button></header>
  <div className="mini-board" aria-label="Center of the 15 by 15 Blind Gomoku board">
   {crop.map(([r,c])=>{
    const cell=at(r,c),piece=lesson.board[cell]||(won&&result?.cell===cell?you:'')
    const name='Row '+r+', column '+c+', '+(piece?(piece===you?'your stone':'opponent stone'):'empty')
    return <button type="button" key={cell} aria-label={name} data-piece={piece||undefined} data-winning={won&&r===8&&c>=5&&c<=9?true:undefined} disabled={!!piece||won} onClick={()=>setResult({cell,won:move(lesson,you,cell,0)?.winner===you})}><span aria-hidden="true"/></button>
   })}
  </div>
  <footer><p role="status">{!result?'Find the fifth stone in the row.':won?'Five in a row. You win!':'Not quite. Look for four matching stones in a row.'}</p><button type="button" className="warm-link" onClick={practice}>Full Blind Gomoku <span aria-hidden="true">↗︎</span></button></footer>
 </section>
}
