import {useId,useLayoutEffect,useRef,useState} from 'react'
import {mills,points,type GameView} from './engine'
import {base} from './brand'
import './morris.css'

type Move=number|{from:number;to:number}
const p=(n:number)=>52+(n*416/6)
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
 return <span className="morris-stone" data-morris-stone={side} data-enter={entry||undefined} aria-hidden="true"><i/></span>
}
function CarvedBoard({lit}:{lit:readonly number[][]}){
 const metal=useId(),wood=useId(),grain=useId()
 return <svg className="morris-carving" viewBox="0 0 520 520" aria-hidden="true" focusable="false">
  <defs>
   <linearGradient id={metal} x1="0" y1="0" x2=".8" y2="1" gradientUnits="objectBoundingBox"><stop stopColor="#bc8854"/><stop offset=".48" stopColor="#614230"/><stop offset="1" stopColor="#926247"/></linearGradient>
   <radialGradient id={wood} cx=".38" cy=".31" r=".8" gradientUnits="objectBoundingBox"><stop stopColor="#e6c99b"/><stop offset=".6" stopColor="#c5a57a"/><stop offset="1" stopColor="#98704e"/></radialGradient>
   <pattern id={grain} width="151" height="124" patternUnits="userSpaceOnUse"><path d="M-20 1q45 7 67 3t116 3M-16 17q53-7 119 3t70-3m-184 27q40 9 69-1t110 4m-188 13q55-6 74 2t114-1m-178 22q54 9 79-2t94 3m-166 17q26-5 69 1t95 1m-172 13q45 8 69 0t95 5" fill="none" stroke="#624132" strokeWidth="1" opacity=".24"/><path d="M-20 5q45 7 67 3t116 3m-184 44q40 9 69-1t110 4m-176 29q54 9 79-2t94 3m-166 17q26-5 69 1t95 1" fill="none" stroke="#fbdfaa" opacity=".38"/></pattern>
  </defs>
  <path d="M27 3h466l24 24v466l-24 24H27L3 493V27z" fill="#3b2520" stroke="#1b1414" strokeWidth="5"/>
  <path d="M29 7h462l22 22v462l-22 22H29L7 491V29z" fill={`url(#${metal})`} stroke="#c1935f" strokeWidth="1.5"/>
  <path d="M38 17h444l21 21v444l-21 21H38l-21-21V38z" fill={`url(#${wood})`} stroke="#53362a" strokeWidth="4"/>
  <path d="M38 19h444l19 19v444l-19 19H38l-19-19V38z" fill={`url(#${grain})`}/>
  <path d="M42 24h436l18 18v436l-18 18H42l-18-18V42z" fill="none" stroke="#e2bd87" strokeWidth="1.8"/>
  <g className="morris-lines" fill="none" strokeLinecap="round" strokeLinejoin="round" stroke="#63442f">
   {mills.map(([a,,c],i)=><path key={i} d={`M${p(points[a][0])} ${p(points[a][1])}L${p(points[c][0])} ${p(points[c][1])}`} strokeWidth="3.6"/>)}
   <path d="M38 82V38h44m400 44V38h-44M38 438v44h44m400-44v44h-44" strokeWidth="2" strokeDasharray="2 4"/>
  </g>
  <g className="morris-mill-lines" fill="none" stroke="#fff0b6" strokeWidth="4.8" strokeLinecap="round">
   {lit.map(([a,b,c])=><path data-morris-mill key={a+'-'+b+'-'+c} d={`M${p(points[a][0])} ${p(points[a][1])}L${p(points[c][0])} ${p(points[c][1])}`}/>)}
  </g>
  <path d="m260 239 21 21-21 21-21-21zm0 8 13 13-13 13-13-13zm-1 9 5 4-5 4-4-4z" fill="none" stroke="#8a5d3b" strokeWidth="1.45" opacity=".77"/>
 </svg>
}
export function MorrisBoard({v,you,name,active,submit}:{v:GameView;you:string;name:(id:string)=>string;active:boolean;submit:(move:Move)=>void}){
 const [from,setFrom]=useState<number|null>(null)
 const [focus,setFocus]=useState(0)
 const buttons=useRef<Array<HTMLButtonElement|null>>([])
 const seenStage=useRef(false)
 const guide=useId()
 useLayoutEffect(()=>{seenStage.current=true},[])
 const moves=v.legal.filter((move):move is Exclude<Move,number>=>typeof move==='object')
 const myTurn=active&&!v.done&&v.turn===you
 const selection=myTurn&&moves.some(move=>move.from===from)?from:null
 const lit=v.capture?mills.filter(line=>line.every(i=>v.board[i]===v.turn)):[]
 const cue=v.done?(v.winner?name(v.winner)+' wins':'Shared result'):!active?'Waiting for connection':!v.seats.includes(you)?'Watching this leg':!myTurn?name(v.turn)+'’s turn'+(v.capture?' · Mill':''):v.capture?'Mill · Remove a stone':selection!==null?'Choose a destination':moves.length?'Choose a stone':'Place a stone'
 return <section className="morris-stage" aria-label="Nine Men’s Morris table">
  <img className="morris-chamber-art" src={base+'art/seasonal-morris.svg'} alt="" width={1120} height={624}/>
  <header className="morris-score">
   {v.seats.map((seat,side)=>{
    const count=v.board.filter(value=>value===seat).length
    return <div key={seat} className="morris-player" role="group" aria-label={name(seat)+', '+count+' '+(count===1?'stone':'stones')+' on board'} data-turn={!v.done&&v.turn===seat||undefined}>
     <Stone side={side}/><span>{name(seat)}</span><b>{count}</b>
    </div>
   })}
  </header>
  <p role="status" className="morris-cue">{cue}</p>
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
    return <button key={i} type="button" className="morris-point" data-morris-point={i+1} data-action={action} ref={node=>{buttons.current[i]=node}} tabIndex={focus===i?0:-1}
     aria-label={'Point '+(i+1)+', '+(value?name(value):'open')} aria-disabled={!action} aria-pressed={selection===i}
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
     <span className="morris-point-pip" aria-hidden="true"/>
     {side!==-1&&<Stone key={value} side={side} placed={seenStage.current}/>}
    </button>
   })}
  </div>
 </section>
}
