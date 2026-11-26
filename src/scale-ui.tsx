import {useEffect,useState} from 'react'
import type {Snapshot} from './room'
import {packAnswer,packWeigh,scaleNames,scaleLimit} from './scale'
import './scale.css'

const empty=()=>Array<number>(5).fill(0)
const total=(a:number[])=>a.reduce((s,n)=>s+n,0)
const relation=['Left lighter','Balanced','Left heavier']
const colors=['#9c711e','#336e66','#887b8e','#393c4b','#ac5131']
const describe=(a:number[])=>a.flatMap((v,i)=>v?[v+' × '+scaleNames[i]]:[]).join(', ')
function Balance({sign}:{sign:number}){
 return <svg className="scale-instrument" viewBox="0 0 500 134" aria-hidden="true">
  <defs><linearGradient id="scale-brass"><stop stopColor="#8b5f35"/><stop offset=".52" stopColor="#edc988"/><stop offset="1" stopColor="#a27147"/></linearGradient></defs>
  <rect x="2" y="2" width="496" height="130" rx="12" fill="#f8edd8" stroke="#c5a679"/>
  <path d="M24 109H476M24 112H476" stroke="#cbb58f"/>
  <path d="M222 106L244 38H256L280 106Z" fill="url(#scale-brass)" stroke="#6c4a33"/>
  <path d="M211 108H289" stroke="#5a4030" strokeWidth="5" strokeLinecap="round"/>
  <g className="scale-beam" style={{transform:`rotate(${sign* -5}deg)`}}>
   <path d="M100 42H400" stroke="#674937" strokeWidth="7" strokeLinecap="round"/>
   <path d="M103 43L69 81M103 43L137 81M397 43L363 81M397 43L431 81" stroke="#846b4e" fill="none"/>
   <path d="M62 81H144Q134 102 103 102Q72 102 62 81ZM356 81H438Q428 102 397 102Q366 102 356 81Z" fill="url(#scale-brass)" stroke="#7b5635"/>
  </g>
  <circle cx="250" cy="42" r="7" fill="#955c36" stroke="#58392a"/>
 </svg>
}
export function ScaleBoard({snap,active,name,submit}:{snap:Snapshot,active:boolean,name:(id:string)=>string,submit:(a:number)=>void}){
 const g=snap.game!,s=g.scale!
 const [left,setLeft]=useState(empty),[right,setRight]=useState(empty),[answer,setAnswer]=useState<number[]>(()=>[s.reference,0,0,0,0])
 const [now,setNow]=useState(Date.now),[offset,setOffset]=useState(()=>snap.hostNow-Date.now())
 useEffect(()=>{const id=setInterval(()=>setNow(Date.now()),200);return()=>clearInterval(id)},[])
 useEffect(()=>{setNow(Date.now());setOffset(snap.hostNow-Date.now())},[snap.hostNow])
 const time=Math.max(0,Math.min(300,Math.ceil(((g.deadline??now)-now-offset)/1000)))
 const enabled=active&&!g.done&&time>0&&g.turn===snap.you
 const remaining=scaleLimit-s.log.length,last=s.log.at(-1)
 const canWeigh=enabled&&remaining>0&&[left,right].every(v=>total(v)>0&&total(v)<=6)&&!left.every((n,i)=>n===right[i])
 return <section className="scale-game" aria-label="Scale Game bench">
  <div className="auction-top"><strong>{s.log.length} / {scaleLimit} weighings</strong><span className="pill" aria-label="Time remaining">{g.done?'Finished':time+' s'}</span></div>
  <p><strong>Brass: {s.reference} units</strong> · Rank {s.rank} of five, lightest first</p>
  <p>Every other mineral has a different weight. Possible weights: <strong>{s.menu.join(', ')}</strong>.</p>
  <Balance sign={last?.sign??0}/>
  <p role="status">{g.done?s.score===null?'Time expired before an answer was locked.':`Team score: ${s.score} / 5.`:last?relation[last.sign+1]+'. '+(enabled?'Your turn.':name(g.turn)+'’s turn.'):(enabled?'Your turn.':name(g.turn)+'’s turn.')}</p>
  {!g.done&&<><div className="scale-trays">{([['Left',left,setLeft],['Right',right,setRight]] as const).map(([caption,values,set])=>
   <fieldset key={caption} disabled={!enabled||remaining===0}><legend>{caption} pan · {total(values)}/6</legend>
    {scaleNames.map((mineral,i)=><label key={mineral}><i style={{background:colors[i]}}/>{mineral}<select aria-label={caption+' '+mineral+' quantity'} value={values[i]} onChange={e=>set(values.map((v,j)=>i===j?Number(e.target.value):v))}>{[0,1,2,3,4].map(n=><option key={n}>{n}</option>)}</select></label>)}</fieldset>)}</div>
   <div className="actions"><button type="button" disabled={!canWeigh} onClick={()=>{submit(packWeigh(left,right));setLeft(empty());setRight(empty())}}>Weigh minerals</button><small>Put 1–6 pieces on each side, at most four of any mineral per pan.</small></div>
   <details className="scale-notes"><summary>Lock one team answer</summary>
    <p>Enter each mineral’s weight. Submitting ends the challenge for everyone.</p>
    <div className="scale-answer">{scaleNames.map((m,i)=><label key={m}>{m}<select aria-label={m+' weight'} value={answer[i]} disabled={i===0||!enabled} onChange={e=>setAnswer(answer.map((v,j)=>i===j?Number(e.target.value):v))}><option value={0}>Choose</option>{(i===0?[s.reference]:s.menu).map(v=><option key={v}>{v}</option>)}</select></label>)}</div>
    <button type="button" disabled={!enabled||answer.includes(0)||new Set(answer).size!==5} onClick={()=>submit(packAnswer(answer))}>Submit final weights</button>
   </details>
   <details className="scale-notes"><summary>How to use the reference</summary><p>To test whether Jade weighs a candidate amount, place it against Brass in whole multiples that would balance if that candidate were true. Test a middle candidate first: a lighter or heavier result rules out one half of the options.</p></details>
  </>}
  {!!s.log.length&&<details className="scale-notes" open><summary>Weighing history</summary><ol>{s.log.map(({left,right,sign},i)=><li key={i}><strong>{relation[sign+1]}</strong><span>{describe(left)} vs {describe(right)}</span></li>)}</ol></details>}
  {s.solution&&<ul className="scale-solution">{scaleNames.map((m,i)=><li key={m}><strong>{m}</strong> {s.solution![i]}{s.answer&&s.answer[i]!==s.solution![i]?' · guessed '+s.answer[i]:''}</li>)}</ul>}
 </section>
}
