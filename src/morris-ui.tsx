import {useId,useLayoutEffect,useRef,useState} from 'react'
import {mills,points,type GameView} from './engine'
import {base} from './brand'
import {CarvedBoard,MorrisMark,MorrisPawn,morrisPosition as p} from './morris-art'
import './morris.css'

type Move=number|{from:number;to:number}
const direction:Record<string,readonly [number,number]>={ArrowUp:[0,-1],ArrowDown:[0,1],ArrowLeft:[-1,0],ArrowRight:[1,0]}

function nextPoint(i:number,key:string){
 const [x,y]=points[i],step=direction[key]
 for(let n=1;n<=6;n++){
  const candidate=points.findIndex(([a,b])=>a===x+step[0]*n&&b===y+step[1]*n)
  if(candidate!==-1)return candidate
 }
 return i
}
function Stone({side,placed=false}:{side:number;placed?:boolean}){
 const [entry]=useState(placed)
 return <MorrisPawn side={side} entering={entry}/>
}
export function MorrisBoard({v,you,name,active,submit}:{v:GameView;you:string;name:(id:string)=>string;active:boolean;submit:(move:Move)=>void}){
 const [from,setFrom]=useState<number|null>(null)
 const [focus,setFocus]=useState(0)
 const [touchGhost,setTouchGhost]=useState<number|null>(null)
 const buttons=useRef<Array<HTMLButtonElement|null>>([])
 const seenStage=useRef(false)
 const guide=useId()
 useLayoutEffect(()=>{seenStage.current=true},[])
 const moves=v.legal.filter((move):move is Exclude<Move,number>=>typeof move==='object')
 const myTurn=active&&!v.done&&v.turn===you
 const selection=myTurn&&moves.some(move=>move.from===from)?from:null
 const lit=v.capture?mills.filter(line=>line.every(i=>v.board[i]===v.turn)):[]
 const cue=v.done?(v.winner?name(v.winner)+' wins':'Shared result'):!active?'Waiting for connection':!v.seats.includes(you)?'Watching this leg':!myTurn?name(v.turn)+'’s turn'+(v.capture?' · Mill':''):v.capture?'Mill · Remove a stone':selection!==null?'Choose a destination':moves.length?'Choose a stone':'Place a stone'
 const phase=v.done?'record':v.capture?'capture':!myTurn?'wait':moves.length?
  (v.board.filter(value=>value===you).length===3?'fly':'slide'):'place'
 const movingSide=v.seats.indexOf(you)
 return <section className="morris-stage" aria-label="Nine Men’s Morris table">
  <img className="morris-chamber-art" src={base+'art/morris-live-chamber.webp'} alt="" width={1400} height={780} decoding="async"/>
  <header className="morris-score">
   {v.seats.map((seat,side)=>{
    const count=v.board.filter(value=>value===seat).length
    return <div key={seat} className="morris-player" role="group" aria-label={name(seat)+', '+count+' '+(count===1?'stone':'stones')+' on board'} data-turn={!v.done&&v.turn===seat||undefined}>
     <Stone side={side}/><span>{name(seat)}</span><b>{count}</b>
    </div>
   })}
  </header>
  <p role="status" className="morris-cue"><MorrisMark mark={phase}/><span>{cue}</span></p>
  <p className="sr" id={guide}>Arrow keys move between points. Enter or Space selects a point. Escape clears a selected stone.</p>
  <div className="morris-surface" data-morris-board role="group" aria-label="Nine Men’s Morris board" aria-describedby={guide}>
   <CarvedBoard lit={lit}/>
   {points.map(([x,y],i)=>{
    const value=v.board[i]
    const side=v.seats.indexOf(value)
    const to=selection!==null&&moves.some(move=>move.from===selection&&move.to===i)
    const canFrom=moves.some(move=>move.from===i)
    const isNumber=v.legal.includes(i)
    const action=myTurn?(isNumber?(v.capture?'capture':'place'):to?'move':canFrom?'select':undefined):undefined
    const canPreview=!value&&(action==='place'||action==='move')
    const stopTouch=()=>setTouchGhost(current=>current===i?null:current)
    return <button key={i} type="button" className="morris-point" data-morris-point={i+1} data-action={action} ref={node=>{buttons.current[i]=node}} tabIndex={focus===i?0:-1}
     aria-label={'Point '+(i+1)+', '+(value?name(value):'open')} aria-disabled={!action} aria-pressed={selection===i}
     data-touch-ghost={canPreview&&touchGhost===i||undefined}
     onPointerDown={event=>{if(event.pointerType!=='mouse'&&canPreview)setTouchGhost(i)}}
     onPointerUp={stopTouch} onPointerCancel={stopTouch} onLostPointerCapture={stopTouch}
     style={{left:p(x)/5.2+'%',top:p(y)/5.2+'%'}} onFocus={()=>setFocus(i)} onKeyDown={event=>{
      if(Object.hasOwn(direction,event.key)){
       event.preventDefault()
       buttons.current[nextPoint(i,event.key)]?.focus()
      }else if(event.key==='Escape'&&selection!==null){event.preventDefault();setFrom(null)}
     }} onClick={()=>{
      if(action==='capture'||action==='place'){submit(i);setFrom(null)}
      else if(action==='move'&&selection!==null){submit({from:selection,to:i});setFrom(null)}
      else if(action==='select')setFrom(selection===i?null:i)
     }}>
     <MorrisMark mark={action==='capture'?'target':selection===i?'selected':'socket'}/>
     {side!==-1&&<Stone key={value} side={side} placed={seenStage.current}/>}
     {canPreview&&<MorrisPawn side={movingSide} ghost/>}
    </button>
   })}
  </div>
 </section>
}
