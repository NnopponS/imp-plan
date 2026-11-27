import {useState} from 'react'
import {baghEdges,type BaghAction} from './bagh'
import type {GameView} from './engine'
import tableArt from './bagh-art/table.svg'
import './bagh.css'

type Animal='goat'|'tiger'
function Carving({animal}:{animal:Animal}){
 return <svg className="bagh-carving" data-animal={animal} viewBox="0 0 50 50" aria-hidden="true">
  {animal==='tiger'?<>
   <path d="M5.4 18.7Q5 7.3 12.2 6.3c5-.8 7.2 2.4 12.6 2.7 5.6-.2 9.7-3.8 14-2q6.9 2.4 5.8 12.4 3.4 5.3 1.6 13.1-1.9 6.8-8.9 9l-12.2 5-12.7-4.7q-6.5-3.7-8.6-9.2-1.7-6.4 1.6-13.9Z" fill="#241820" stroke="#c08a62" strokeWidth="1.4"/>
   <path d="M7.7 18.8Q7.7 8.9 12.5 8.9c3.1-.9 6.3 2.4 12.2 2.6 5.8-.3 9.8-3.7 14.1-2q4.8 2.9 3.3 10 3.6 6.1.9 12.5-1.8 4.9-6.9 6.7L25 43.6l-11.2-4.4q-5.5-2-7.2-7.2-1.9-6.6 1.1-13.2Z" fill="#61404f" stroke="#9f6b57" strokeWidth="1"/>
   <path d="M10.7 16.2q-.8-4.8 3-4.8l5 3.6-6.3 2.5Zm29.4-.4q-.2-4.1-4.2-4.1L31 15l6 3Z" fill="#b58362" stroke="#2c2029" strokeWidth=".9"/>
   <path d="m14 19.3 6 1.8 2.2 4.3-5.2.8-5.6-3.5Zm23-.2-6.5 1.8-2.2 4.2 5.3.7 5.5-3.8ZM22 13l3.4 5.8 3.2-5.9m-10 .3 2.2 4.3m10.6-4.4-1.8 4.8M9 26.3l7.2 3-5.7 2.2m30.9-5.3-7.5 3.1 6.6 2.4M13.6 33.9l4.2 2m17.9-2.3-3.9 2.6" fill="#d19e6b" stroke="#d19e6b" strokeWidth=".68" strokeLinecap="round" strokeLinejoin="round"/>
   <path d="M15.1 23q2-1.3 4.3.8m15.8-.8q-2.1-1.1-4.7.8" fill="none" stroke="#271a24" strokeWidth="1.25" strokeLinecap="round"/>
   <path d="M25 25.2c2.5 2.1 5.7 4.4 7.6 7.9L29 37.6l-4-1.3-3.9 1.3-4.5-4.3q2.4-5.9 8.4-8.1Z" fill="#c29372" stroke="#302333" strokeWidth="1"/>
   <path d="m22.2 30 5.6-.25-2.9 3.2Zm2.7 3.1v2.2m0-.4-2.9 1m2.9-1 2.7 1.2m-10.8-4.4 2.6.8m11.6.2 2.7-1.3m-15.1 5.8 6.2 3.5 7.3-3.7" fill="none" stroke="#302333" strokeWidth="1.08" strokeLinecap="round" strokeLinejoin="round"/>
   <path d="m7 28.2.6 2.5m35.1-9 .3 2m-28.3 16.8 3.7 1.4m20.6-5.5 2-2.3" fill="none" stroke="#e0a77c" strokeWidth=".7" strokeLinecap="round"/>
  </>:<>
   <path d="M25 45.8 13 41.7 6.8 34.1 5.2 24.3 9.7 14l6.2-8.1L25.3 4l8.5 2 7.3 8.3 3.6 9.7-1.5 10-5 7.1Z" fill="#76533d" stroke="#4e302d" strokeWidth="1.4" strokeLinejoin="round"/>
   <path d="M25 42.6 14.5 39 9 32.5l-1.1-8.1 3.9-9.2L17 8.8l8.2-2.2 7.3 2 6.4 7 3 8.8-1.3 8.1-4.4 6Z" fill="#d8be8f" stroke="#be986b" strokeWidth="1.12" strokeLinejoin="round"/>
   <path d="M16.1 24.6Q11.4 17 16 12.7q2.2-2.7 7-3.5-6.7 5.4-4.1 12Zm17.6.1Q38.7 16 33 12.2q-2.8-2.7-6.3-3 6.8 6.1 4.1 12.4Z" fill="#f2deae" stroke="#6a4939" strokeWidth="1.1" strokeLinejoin="round"/>
   <path d="m14 22.8 3.9 1.7 4.6-3.6 5.4-.2 4.3 3.5 4 .3 1.6 1.7-3.2 3.1-2.9-.8-3.4 6-1 3.2-2.5 2.1-2.4-2.2-.7-3-3.5-6.1-3.4 1.3-3.1-3.1Z" fill="#a87e58" stroke="#624234" strokeWidth="1" strokeLinejoin="round"/>
   <path d="M22.2 23.2 24.7 22l3.1 1.1 2.5 5.3-3.1 5.2-2.4-.8-2 .9-3.6-5.2Z" fill="#e9d2a3"/>
   <path d="m20.1 25.3 2.3 1.1m7.3-1.4-2.3 1.4m-4 4.5 3.1-.1-1.5 1.4Zm-2.5 4.3 4.1 .3 2.8-.5m-3.1.6-.4 2.2m-8.7-20.5 2.2-.8m12.7-.1 2 1.1m-17.3 1.3 1.8-.7m14.2-.1 1.8 1.1" fill="none" stroke="#5e4034" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
   <path d="m10 30 1.2 3m27.1-15 .8 2.1m-23.7 17.4 3 1.8m13.6-.6 3.2-1.6" stroke="#f6dfb3" fill="none" strokeWidth=".85" strokeLinecap="round"/>
  </>}
 </svg>
}
const pos=(i:number):[number,number]=>[10+i%5*20,10+Math.floor(i/5)*20]
const shifts=baghEdges.map(([from,to],i)=>{
 const [x,y]=pos(from),[X,Y]=pos(to)
 const move=((i*7)%9-4)*.13
 return `M${x} ${y}Q${(x+X)/2+move} ${(y+Y)/2-move} ${X} ${Y}`
})
type Move=Exclude<BaghAction,number>
const isMove=(a:GameView['legal'][number]):a is Move=>typeof a==='object'&&a!==null&&'from' in a&&'to' in a
const isLeap=(a:Move)=>{
 const [x,y]=pos(a.from),[X,Y]=pos(a.to)
 return Math.max(Math.abs(x-X),Math.abs(y-Y))===40
}
function Counter({animal,name,total,filled}:{animal:Animal,name:string,total:number,filled:number}){
 return <div className="bagh-counter" data-register={animal}>
  <Carving animal={animal}/>
  <div className="bagh-tally"><span>{name}</span><strong>{filled}{animal==='tiger'?'/'+total:''}</strong></div>
  <div className="bagh-count-marks" aria-hidden="true">{Array.from({length:total},(_,i)=><i key={i} data-filled={i<filled}/>)}</div>
 </div>
}
function Point({mark}:{mark:'place'|'step'|'leap'|undefined}){
 return <svg className="bagh-node-mark" viewBox="0 0 36 36" aria-hidden="true">
  {mark==='leap'?<><path d="m18 6 12 12-12 12L6 18Z"/><path d="m13 15 5 5 5-5m-8 5 3 3 3-3"/></>:mark==='step'?<><path d="m18 8 10 10-10 10L8 18Z"/><path d="M17 18q1-2 2 .2-1.6 1.7-2-.2Z"/></>:mark==='place'?<><path d="M18 10q7.9-.4 7.8 8-.3 7.6-7.8 7.7-7.9 0-8-7.7.4-8 8-8Z"/><path d="m15 18 6-.15m-3-2.8.1 6"/></>:<path d="M16.8 16.6q2-1.4 3.1.8.4 2.4-2.1 2.6-2-.2-2-1.7Z"/>}
 </svg>
}
export function BaghBoard({g,you,active,submit}:{g:GameView,you:string,active:boolean,submit:(a:BaghAction)=>void}){
 const b=g.bagh!,role=g.seats.indexOf(you)
 const [from,setFrom]=useState<number|null>(null)
 const mine=active&&!g.done&&g.turn===you
 const moves=mine?g.legal.filter(isMove):[]
 const picked=from!==null&&moves.some(a=>a.from===from)?from:null
 const targets=picked===null?[]:moves.filter(a=>a.from===picked)
 const leaps=targets.filter(isLeap)
 const hit=new Set(leaps.map(a=>(a.from+a.to)/2))
 const enabled=(i:number)=>mine&&(g.legal.includes(i)||moves.some(a=>a.from===i)||targets.some(a=>a.to===i))
 const fire=(i:number)=>{
  if(!enabled(i))return
  if(g.legal.includes(i))submit(i)
  else if(targets.some(a=>a.to===i)){submit({from:picked!,to:i});setFrom(null)}
  else setFrom(picked===i?null:i)
 }
 const action=g.done?'Leg complete.':!active?'Waiting for the table.':!mine?'Waiting for '+(g.turn===g.seats[0]?'goats.':'tigers.'):
   role===0&&b.banked>0?'Place a goat on an open point.':picked!==null?(leaps.length?'Choose a landing. Double arrows mark captures.':'Choose a marked destination.'):'Choose a piece to move.'
 return <section className="bagh-stage" aria-label="Tigers and goats">
  <div className="bagh-instruments">
   <p className="bagh-turn" role="status"><strong>{role<0?'Spectating.':'You play '+(role===0?'goats.':'tigers.')}</strong> <span>{action}</span></p>
   <div className="bagh-register">
    <Counter animal="goat" name="Goats to place" total={20} filled={b.banked}/>
    <Counter animal="tiger" name="Captures" total={5} filled={b.captured}/>
   </div>
  </div>
  <div className="bagh-board" role="group" aria-label="Bagh Chal board">
   <svg className="bagh-table-drawing" viewBox="0 0 100 100" aria-hidden="true">
    <image href={tableArt} width="100" height="100"/>
    <g className="bagh-scratches">{shifts.map((d,i)=><path key={i} d={d}/>)}</g>
    <g className="bagh-lines">{shifts.map((d,i)=><path key={i} d={d}/>)}</g>
    {leaps.map(({from,to})=>{
     const [x,y]=pos(from),[X,Y]=pos(to)
     return <path className="bagh-leap-track" key={to} d={`M${x} ${y}L${X} ${Y}`}/>
    })}
   </svg>
   {b.board.map((v,i)=>{
    const [x,y]=pos(i),target=targets.find(a=>a.to===i)
    const mark=!v&&mine&&g.legal.includes(i)?'place':target?(isLeap(target)?'leap':'step'):undefined
    return <button key={i} type="button" className="bagh-node" data-piece={v===2?'tiger':v===1?'goat':undefined}
     data-bagh-hint={mark} data-capturable={hit.has(i)||undefined} aria-disabled={!enabled(i)} aria-pressed={i===picked}
     aria-label={`Row ${1+Math.floor(i/5)}, column ${1+i%5}, ${v===2?'tiger':v===1?'goat':'open'}`}
     aria-description={mark==='leap'?'Capture landing':mark==='step'?'Legal destination':mark==='place'?'Place a goat here':undefined}
     style={{left:x+'%',top:y+'%'}} onClick={()=>fire(i)}>{v?<Carving animal={v===2?'tiger':'goat'}/>:<Point mark={mark}/>}</button>
   })}
  </div>
 </section>
}
