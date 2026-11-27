import {useEffect,useId,useState,type CSSProperties} from 'react'
import type {Snapshot} from './room'
import {base} from './brand'
import {packAnswer,packWeigh,scaleNames,scaleLimit} from './scale'
import './scale.css'

type Pan='left'|'right'
const empty=()=>Array<number>(5).fill(0)
const total=(a:number[])=>a.reduce((s,n)=>s+n,0)
const relation=['Left lighter','Balanced','Left heavier']
const readingKeys=['lighter','balanced','heavier']
const describe=(a:number[])=>a.flatMap((v,i)=>v?[v+' × '+scaleNames[i]]:[]).join(', ')
const caption=(pan:Pan)=>pan==='left'?'Left':'Right'
const mineralShapes=[
 {rock:'M5 25 12 12h22l7 13-5 5H9Z',facet:'M12 12h22l3 7H10Z',stroke:'M9 25h28M16 13l-4 8m12-8-3 8m11-8-2 8',color:'#c39755',light:'#edca87',edge:'#7a553a'},
 {rock:'M4 28 11 14 25 9 39 22 36 30Z',facet:'M11 14 25 9 39 22 25 20Z',stroke:'M12 15l7 10 16 1',color:'#789987',light:'#add1b8',edge:'#455d53'},
 {rock:'M7 30 9 17 15 8l6 4 9-9 7 8 2 19Z',facet:'M15 8l3 16 3-12 9-9 3 10 4-2',stroke:'M18 24l-2 6m17-17-3 15m-19-10-1 9',color:'#aba3b4',light:'#ecdfdf',edge:'#60556c'},
 {rock:'M6 29 4 17 16 8l18 3 7 11-5 8Z',facet:'M4 17 16 8l18 3-1 9-14 4Z',stroke:'M12 18l10-8m-4 11 11-6m-5 10 11-4',color:'#4d5460',light:'#8e8f99',edge:'#2c2b39'},
 {rock:'M5 29V20l9-11 16-2 11 16-6 7Z',facet:'M5 20l9-11 16-2 4 7-13 12Z',stroke:'M12 17q9-5 16 1m-11 6q6-3 15 0',color:'#c98455',light:'#f3b272',edge:'#78412d'},
] as const

function Mineral({index}:{index:number}){
 const stone=mineralShapes[index]
 return <g data-mineral={scaleNames[index].toLowerCase()}>
  <ellipse cx="24" cy="30" rx="18" ry="4" fill="#211615" opacity=".68"/>
  <path d={stone.rock} fill={stone.color} stroke={stone.edge} strokeWidth="1.6" strokeLinejoin="round"/>
  <path d={stone.facet} fill={stone.light} opacity=".84"/>
  <path d={stone.stroke} fill="none" stroke={stone.light} strokeWidth="1" opacity=".76"/>
 </g>
}
function MineralIcon({index}:{index:number}){
 return <svg viewBox="0 0 46 35" className="scale-mineral-icon" aria-hidden="true" focusable="false"><Mineral index={index}/></svg>
}
const bearing=565,axle=205,arm=315,rope=132
function panDrop(pan:Pan,angle:number){
 const rad=angle*Math.PI/180,dir=pan==='left'?-1:1
 return {left:(bearing+dir*arm*Math.cos(rad))/1120*100+'%',top:(axle+dir*arm*Math.sin(rad)+rope+17)/520*100+'%'}
}
function Balance({sign,reading,left,right,selected,editable,choose,draftLeft,draftRight}:{sign:number;reading:string;left:number[];right:number[];selected:Pan;editable:boolean;choose:(pan:Pan)=>void;draftLeft:number[];draftRight:number[]}){
 const angle=sign*-8,metal=useId()
 return <div className="scale-stage" data-reading={reading} style={{'--scale-angle':angle+'deg','--scale-return':-angle+'deg'} as CSSProperties}>
  <svg className="scale-instrument" viewBox="0 0 1120 520" aria-hidden="true" focusable="false">
   <defs><linearGradient id={metal} x1="0" x2=".08" y1="0" y2="1"><stop stopColor="#f2d79b"/><stop offset=".47" stopColor="#bc8c53"/><stop offset="1" stopColor="#79503d"/></linearGradient></defs>
   <image className="scale-chamber-art" href={base+'art/scale-live-chamber.svg'} width="1120" height="520"/>
   <g transform={`translate(${bearing} ${axle})`}>
    <g className="scale-beam">
     <path d="M-324-8-295-12-17-8 6-10 303-11 325-7 325 8 304 12 6 10-18 9-295 12-327 8Z" fill="#6b4839" stroke="#3b2629" strokeWidth="4"/>
     <path d="M-317-5-296-7-15-4 13-5 309-7 320-4 319 3 300 6 17 6-21 4-296 6-317 4Z" fill={`url(#${metal})`}/>
     <path d="M-292-4h260m64 0h260M-292 5h204m177 0h202" fill="none" stroke="#efc883" strokeWidth="1.5" opacity=".63"/>
     {(['left','right'] as const).map((pan,i)=>{
      const values=i?right:left,stones=values.flatMap((n,mineral)=>Array.from({length:n},()=>mineral))
      return <g key={pan} transform={`translate(${i?arm:-arm} 0)`}>
       <circle r="9" fill="#704b3b" stroke="#d3a46c" strokeWidth="2"/><circle r="3.3" fill="#33252a"/>
       <g className="scale-hanger" data-live-pan={pan}>
        <path d={`M0 6-89 ${rope}M0 6 89 ${rope}M0 7v${rope-4}`} fill="none" stroke="#d0a874" strokeWidth="2"/>
        <path d={`M-88 ${rope}Q-78 ${rope+28}-50 ${rope+33}Q10 ${rope+51} 58 ${rope+31}Q78 ${rope+25} 88 ${rope}Z`} fill={`url(#${metal})`} stroke="#614037" strokeWidth="3"/>
        <ellipse cy={rope} rx="88" ry="15" fill="#9c6a43" stroke="#dda56e" strokeWidth="1.8"/>
        <ellipse cy={rope-1} rx="76" ry="10" fill="#6a4a36" stroke="#cf9b68" strokeWidth="1.4"/>
        <path d={`M-75 ${rope+16}Q0 ${rope+46} 75 ${rope+16}m-132 10q52 19 110 0`} fill="none" stroke="#e4b577" strokeWidth="1.6" opacity=".76"/>
        {stones.map((mineral,index)=><g key={index} transform={`translate(${(index%3-1)*43-18+(index>=3?11:0)} ${rope-(index>=3?48:29)}) scale(.85)`}><Mineral index={mineral}/></g>)}
       </g>
      </g>
     })}
    </g>
    <path d="M-15 0 0-19 15 0 0 19Z" fill="#72513e" stroke="#4a2d29" strokeWidth="2.4"/>
    <circle r="7.5" fill="#e0b278" stroke="#946344" strokeWidth="2"/>
   </g>
  </svg>
  <div className="scale-reading" aria-hidden="true">{reading==='unweighed'?'Not weighed':relation[sign+1]}</div>
  {(['left','right'] as const).map(pan=>{
   const count=total(pan==='left'?draftLeft:draftRight)
   const visibleCount=reading==='unweighed'?count:total(pan==='left'?left:right)
   return <button key={pan} type="button" className="scale-pan-target" style={panDrop(pan,angle)} aria-pressed={selected===pan}
    aria-label={`${caption(pan)} pan, ${visibleCount} of 6 ${reading==='unweighed'?'placed':'last weighed'}`} aria-describedby="scale-tray-help" disabled={!editable} onClick={()=>choose(pan)}>
    <span>{caption(pan)} pan <b>{visibleCount}/6</b></span>
   </button>
  })}
 </div>
}

export function ScaleBoard({snap,active,name,submit}:{snap:Snapshot;active:boolean;name:(id:string)=>string;submit:(a:number)=>void}){
 const g=snap.game!,s=g.scale!
 const [left,setLeft]=useState(empty),[right,setRight]=useState(empty),[pan,choose]=useState<Pan>('left')
 const [answer,setAnswer]=useState<number[]>(()=>[s.reference,0,0,0,0])
 const [now,setNow]=useState(Date.now),[offset,setOffset]=useState(()=>snap.hostNow-Date.now())
 useEffect(()=>{if(g.done)return;const id=setInterval(()=>setNow(Date.now()),200);return()=>clearInterval(id)},[g.done])
 useEffect(()=>{setNow(Date.now());setOffset(snap.hostNow-Date.now())},[snap.hostNow])
 const time=Math.max(0,Math.min(300,Math.ceil(((g.deadline??now)-now-offset)/1000)))
 const enabled=active&&!g.done&&time>0&&g.turn===snap.you
 const remaining=scaleLimit-s.log.length,last=s.log.at(-1),editable=enabled&&remaining>0
 const draft=total(left)+total(right)>0&&!g.done
 const measured=draft?undefined:last
 const selected=pan==='left'?left:right
 const canWeigh=editable&&[left,right].every(v=>total(v)>0&&total(v)<=6)&&!left.every((n,i)=>n===right[i])
 function change(index:number,delta:-1|1){
  const set=pan==='left'?setLeft:setRight
  if(!editable)return
  set(values=>{
   const next=values[index]+delta
   if(next<0||next>4||total(values)+delta>6)return values
   return values.map((quantity,i)=>i===index?next:quantity)
  })
 }
 const status=g.done?s.score===null?'Time expired before an answer was locked.':`Team score: ${s.score} / 5.`:
  (last?relation[last.sign+1]+'. ':'')+(enabled?'Your turn.':name(g.turn)+'’s turn.')
 return <section className="scale-game" aria-label="Scale Game bench">
  <header className="scale-register">
   <div><p><strong>Brass: {s.reference} units</strong> · Rank {s.rank} of five</p><p>Possible weights: <b>{s.menu.join(', ')}</b>.</p></div>
   <div className="scale-meter"><strong>{s.log.length} / {scaleLimit} weighings</strong><span aria-label="Time remaining">{g.done?'Finished':time+' s'}</span></div>
  </header>
  <div className="scale-workbench">
   <Balance sign={measured?.sign??0} reading={measured?readingKeys[measured.sign+1]:'unweighed'} left={draft?left:measured?.left??left} right={draft?right:measured?.right??right}
    selected={pan} editable={editable} choose={choose} draftLeft={left} draftRight={right}/>
   <div className="scale-worktray">
    <div className="scale-operator"><p role="status">{status}</p><p id="scale-tray-help">{g.done?'Final reading':editable?(measured?'Last weighed load shown. Add a mineral to start a fresh load.':'Choose a pan, then tap minerals to add them.'):remaining===0?'No weighings left. Lock a team answer.':'The current player can load the pans.'}</p></div>
    {!g.done&&<>
     <div className="scale-mineral-tray" role="group" aria-label="Mineral tray">
      {scaleNames.map((mineral,index)=><button type="button" key={mineral} aria-label={`Add ${mineral} to ${caption(pan)} pan`} disabled={!editable||selected[index]>=4||total(selected)>=6} onClick={()=>change(index,1)}>
       <MineralIcon index={index}/><span>{mineral}</span>
      </button>)}
     </div>
     {selected.some(Boolean)&&<div className="scale-lift" role="group" aria-label={`Lift from ${caption(pan)} pan`}>{selected.map((n,index)=>n?<button key={index} type="button" aria-label={`Remove ${scaleNames[index]} from ${caption(pan)} pan`} disabled={!editable} onClick={()=>change(index,-1)}>
      <span aria-hidden="true">−</span> {scaleNames[index]} ×{n}
     </button>:null)}</div>}
     <div className="scale-weigh"><button type="button" className="primary" disabled={!canWeigh} onClick={()=>{submit(packWeigh(left,right));setLeft(empty());setRight(empty())}}>Weigh minerals</button>
      <small>1–6 per pan · max 4 of a kind · different loads</small></div>
    </>}
   </div>
  </div>
  {!g.done&&<><details className="scale-notes"><summary>Lock one team answer</summary>
   <p>Every mineral has a different weight. Submitting ends the challenge for everyone.</p>
   <div className="scale-answer">{scaleNames.map((mineral,i)=><label key={mineral}>{mineral}<select aria-label={mineral+' weight'} value={answer[i]} disabled={i===0||!enabled} onChange={e=>setAnswer(answer.map((v,j)=>i===j?Number(e.target.value):v))}><option value={0}>Choose</option>{(i===0?[s.reference]:s.menu).map(v=><option key={v}>{v}</option>)}</select></label>)}</div>
   <button type="button" className="primary" disabled={!enabled||answer.includes(0)||new Set(answer).size!==5} onClick={()=>submit(packAnswer(answer))}>Submit final weights</button>
  </details>
  <details className="scale-notes"><summary>How to use the reference</summary><p>To test whether Jade weighs a candidate amount, place it against Brass in whole multiples that would balance if that candidate were true. Brass’s rank starts at the lightest of all five minerals.</p></details></>}
  {!!s.log.length&&<details className="scale-notes" open={g.done}><summary>Weighing history · {s.log.length}</summary><ol>{s.log.map(({left,right,sign},i)=><li key={i}><strong>{relation[sign+1]}</strong><span>{describe(left)} vs {describe(right)}</span></li>)}</ol></details>}
  {s.solution&&<ul className="scale-solution">{scaleNames.map((m,i)=><li key={m}><MineralIcon index={i}/><span><strong>{m}</strong> {s.solution![i]}{s.answer&&s.answer[i]!==s.solution![i]?' · guessed '+s.answer[i]:''}</span></li>)}</ul>}
 </section>
}
