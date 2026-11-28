import {useRef,useState} from 'react'
import {equationLimit,equationValid} from './equations'
import type {Snapshot} from './room'
import './equations.css'

const marks={exact:'Exact',present:'Elsewhere',absent:'Absent'}
const operators={
 '+':{label:'Plus',cut:'M19.8 8.4v13.7M13.1 15.3l13.9-.2'},
 '-':{label:'Minus',cut:'M12.4 15.1l15 .3'},
 '*':{label:'Multiply',cut:'M14 9.5l12 12m-.2-12.2L14 21.5'},
 '/':{label:'Divide',cut:'M12.6 15.6l14.7-.2m-7.4-5.7.1.3m-.3 11.1.1.2'},
 '=':{label:'Equals',cut:'M13 11.8l14.1.1m-14.4 7 14.6.1'},
}
export function EquationOperatorFace({op}:{op:keyof typeof operators}){
 const cut=operators[op].cut
 return <svg className="equation-key-face" viewBox="0 0 40 32" aria-hidden="true">
  <path className="equation-key-chassis" d="M5.4 3.7 34.5 4l3 3.5-.3 19.3-3.3 2.9-27.8-.3-3.6-3.2.2-19Z"/>
  <path className="equation-key-bevel" d="M7.7 5.4 32 5.6l2.8 2.6-.3 16.1-2.3 2.2-24.6-.4-2.3-2.1.2-16.3Z"/>
  <path className="equation-key-grain" d="m6.7 11.1 3.3-3.3m-3 5.5 3.5-2m-.5 11.4 4.8.1m13.1-.1 3.4-3.6m-2 4.8 3-2.6m-16-14 6.8.1"/>
  <path className="equation-key-cut-shadow" d={cut} transform="translate(0 1.2)"/>
  <path className="equation-key-glyph" d={cut}/>
 </svg>
}
const lampDevices={
 exact:{rim:'M9 1.5c-4.5 0-7.5 3.2-7.5 7.4 0 4.5 3.3 7.4 7.5 7.6 4.3-.1 7.4-3.2 7.5-7.5-.1-4.4-3.1-7.2-7.5-7.5Z',cut:'m5.5 8.8 2.5 2.6L12.6 6'},
 present:{rim:'M9 1.1 16.6 8.8 9.1 16.8 1.5 9.1Z',cut:'M5.3 9.2h7.4m-5.5-2-2 2 2 2m3.6-4 2 2-2 2'},
 absent:{rim:'M4.6 2h8.9l2.4 2.7-.1 8.8-2.5 2.4H4.8l-2.7-2.5V4.5Z',cut:'m6.6 6.6 4.8 4.8m0-4.8-4.8 4.9'},
}
export function EquationFeedbackLamp({mark}:{mark:keyof typeof marks}){
 const device=lampDevices[mark]
 return <svg className="equation-lamp" viewBox="0 0 18 18" aria-hidden="true">
  <path className="equation-lamp-rim" d={device.rim}/>
  <path className="equation-lamp-glint" d="M4 7.2c.4-1.5 1.4-2.7 2.8-3"/>
  <path className="equation-lamp-cut" d={device.cut}/>
 </svg>
}
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
   <div className="equation-operators" role="group" aria-label="Equation operators">{(Object.keys(operators) as (keyof typeof operators)[]).map(op=><button key={op} type="button" aria-label={operators[op].label} onClick={()=>append(op)} disabled={!enabled}><EquationOperatorFace op={op}/></button>)}</div>
   <p id="equation-hint">{duplicate?'You already tried that equation.':term.length===8&&!valid?'Use a true equation with no leading zeros or fractional division.':'Use eight characters, for example 2+3*4=14. No spaces.'}</p>
  </form>}
  <ul className="equation-legend" aria-label="Feedback legend">{Object.keys(marks).map(k=>{const mark=k as keyof typeof marks;return <li data-mark={mark} key={k}><EquationFeedbackLamp mark={mark}/> {marks[mark]}</li>})}</ul>
  {e.rows.length>0&&<div className="equation-history">{e.rows.map((row,n)=><ol className="equation-row" key={n} aria-label={'Guess '+(n+1)}>{row.marks.map((mark,i)=><li key={i} data-mark={mark}><b>{row.guess[i]}</b><EquationFeedbackLamp mark={mark}/><span className="sr"> {marks[mark]}</span></li>)}</ol>)}</div>}</>}
 </div>
}
