import {useEffect,useRef,useState,type KeyboardEvent} from 'react'
import {move,start} from './engine'
import './warmup-keyboard.css'

const at=(r:number,c:number)=>(r-1)*15+c-1
const you='You', other='Opponent'
const opening=[at(8,5),at(8,4),at(8,6),at(7,5),at(8,7),at(9,7),at(8,8),at(9,9)]
const lesson=opening.reduce((g,i)=>move(g,g.seats[g.turn],i,0)!,start('blind',[you,other],25000,0))
const rows=5,columns=7
const crop=Array.from({length:rows*columns},(_,i)=>[6+Math.floor(i/columns),4+i%columns] as const)
const firstOpen=crop.findIndex(([r,c])=>!lesson.board[at(r,c)])

export function GomokuWarmup({practice}:{practice:()=>void}){
 const [result,setResult]=useState<{cell:number;won:boolean}|null>(null)
 const [active,setActive]=useState(firstOpen)
 const cells=useRef<(HTMLButtonElement|null)[]>([])
 const reset=useRef<HTMLButtonElement>(null)
 const fullGame=useRef<HTMLButtonElement>(null)
 const resetting=useRef(false)
 const won=!!result?.won

 useEffect(()=>{
  if(won)reset.current?.focus()
  else if(!result&&resetting.current){
   resetting.current=false
   cells.current[firstOpen]?.focus()
  }
 },[result,won])

 function moveFocus(event:KeyboardEvent<HTMLButtonElement>,index:number){
  let dy=0,dx=0
  switch(event.key){
   case 'ArrowUp': dy=-1;break
   case 'ArrowDown': dy=1;break
   case 'ArrowLeft': dx=-1;break
   case 'ArrowRight': dx=1;break
   default:return
  }
  event.preventDefault()
  let y=Math.floor(index/columns)+dy,x=index%columns+dx
  while(y>=0&&y<rows&&x>=0&&x<columns){
   const next=cells.current[y*columns+x]
   if(next&&!next.disabled){next.focus();return}
   y+=dy;x+=dx
  }
 }

 return <section className="warmup" aria-labelledby="warmup-title">
  <header>
   <div><h2 id="warmup-title">One-move warm-up</h2><p>Blind Gomoku · stones revealed for this example</p></div>
   <div className="warmup-header-actions">
    <button type="button" ref={reset} onClick={()=>{resetting.current=true;setActive(firstOpen);setResult(null)}} disabled={!result}>Reset warm-up</button>
    <a href="#warmup-practice" onClick={event=>{event.preventDefault();fullGame.current?.focus()}}>Skip warm-up</a>
   </div>
  </header>
  <p className="warmup-objective" role="status">{!result?'Find the fifth stone in the row.':won?'Five in a row. You win!':'Not quite. Look for four matching stones in a row.'}</p>
  <p className="warmup-key-hint" id="warmup-key-hint">Use the arrow keys to move between open squares.</p>
  <div className="mini-board" role="group" aria-describedby="warmup-key-hint" aria-label="Center of the 15 by 15 Blind Gomoku board">
   {crop.map(([r,c],index)=>{
    const cell=at(r,c),piece=lesson.board[cell]||(won&&result?.cell===cell?you:'')
    const name='Row '+r+', column '+c+', '+(piece?(piece===you?'your stone':'opponent stone'):'empty')
    return <button type="button" key={cell} ref={node=>{cells.current[index]=node}} aria-label={name}
     data-piece={piece||undefined} data-winning={won&&r===8&&c>=5&&c<=9?true:undefined}
     disabled={!!piece||won} tabIndex={!piece&&!won&&index===active?0:-1}
     onFocus={()=>setActive(index)} onKeyDown={event=>moveFocus(event,index)}
     onClick={()=>setResult({cell,won:move(lesson,you,cell,0)?.winner===you})}><span aria-hidden="true"/></button>
   })}
  </div>
  <footer><button type="button" id="warmup-practice" ref={fullGame} className="warm-link" onClick={practice}>Full Blind Gomoku <span aria-hidden="true">→</span></button></footer>
 </section>
}
