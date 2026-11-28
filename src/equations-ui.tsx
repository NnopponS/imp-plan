import {useRef,useState} from 'react'
import {equationLimit,equationValid} from './equations'
import type {Snapshot} from './room'
import './equations.css'

const marks={exact:'Exact',present:'Elsewhere',absent:'Absent'}
const symbols={exact:'✓',present:'↔',absent:'·'}
export function EquationBoard({snap,active,name,submit}:{snap:Snapshot,active:boolean,name:(s:string)=>string,submit:(value:string)=>void}){
 const g=snap.game!,e=g.equations!,playing=g.seats.includes(snap.you)
 const [term,setTerm]=useState('')
 const input=useRef<HTMLInputElement>(null)
 const append=(op:string)=>{
  const field=input.current
  if(!field)return
  const from=field.selectionStart??term.length,to=field.selectionEnd??from
  if(term.length-(to-from)>=8)return
  setTerm(term.slice(0,from)+op+term.slice(to))
  field.focus({preventScroll:true})
  requestAnimationFrame(()=>field.setSelectionRange(from+1,from+1))
 }
 const choosing=e.phase==='choose', enabled=playing&&active&&g.turn===snap.you&&!g.done
 const duplicate=e.rows.some(r=>r.guess===term)
 const valid=equationValid(term)&&!duplicate
 const status=!playing?'You are watching this table. Equations and feedback stay private.':g.done?'Table complete.':choosing?enabled?'Choose a secret equation.':'Waiting for the other player to lock an equation.':enabled?e.responding?'Final reply: match all eight symbols to tie.':'Enter a valid equation to test it.':'Waiting for the other player’s guess.'
 return <div className="equations">
  <div className="equation-seats">{g.seats.map((id,i)=><span key={id}><strong>{name(id)}</strong> · {choosing?e.locked[i]?'Locked':'Choosing':e.counts[i]+'/'+equationLimit+' guesses'}</span>)}</div>
  <p role="status">{status}</p>
  {e.own&&<p className="equation-private">Your secret <code>{e.own}</code></p>}
  {playing&&<>
  {!g.done&&(!choosing||!e.own)&&<form className="equation-form" onSubmit={event=>{event.preventDefault();if(enabled&&valid){submit(term);setTerm('')}}}>
   <label>{choosing?'Secret equation':'Your guess'}<input ref={input} autoComplete="off" spellCheck={false} autoCapitalize="off" enterKeyHint="go" inputMode="text" maxLength={8} value={term} onChange={event=>setTerm(event.target.value)} aria-describedby="equation-hint" disabled={!enabled}/></label>
   <button className="equation-seal primary" type="submit" disabled={!valid||!enabled}>{choosing?'Lock equation':'Submit guess'}</button>
   <div className="equation-operators" role="group" aria-label="Equation operators">{Object.entries({'+':'Plus','-':'Minus','*':'Multiply','/':'Divide','=':'Equals'}).map(([op,label])=><button key={op} type="button" aria-label={label} onClick={()=>append(op)} disabled={!enabled}>{op}</button>)}</div>
   <p id="equation-hint">{duplicate?'You already tried that equation.':term.length===8&&!valid?'Use a true equation with no leading zeros or fractional division.':'Use eight characters, for example 2+3*4=14. No spaces.'}</p>
  </form>}
  <ul className="equation-legend" aria-label="Feedback legend">{Object.keys(marks).map(k=>{const mark=k as keyof typeof marks;return <li data-mark={mark} key={k}><span aria-hidden="true">{symbols[mark]}</span> {marks[mark]}</li>})}</ul>
  {e.rows.length>0&&<div className="equation-history">{e.rows.map((row,n)=><ol className="equation-row" key={n} aria-label={'Guess '+(n+1)}>{row.marks.map((mark,i)=><li key={i} data-mark={mark}><b>{row.guess[i]}</b><span aria-hidden="true">{symbols[mark]}</span><span className="sr"> {marks[mark]}</span></li>)}</ol>)}</div>}</>}
 </div>
}
