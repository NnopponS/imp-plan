import {useEffect,useId,useRef,useState,type KeyboardEvent} from 'react'
import type {ThreeRowAction,ThreeRowMark,ThreeRowRole,ThreeRowView} from './three-row'
import './three-row.css'

const files='ABCDE'
const place=(c:number)=>files[c%5]+(Math.floor(c/5)+1)
const printName=(mark:ThreeRowMark)=>mark==='A'?'Laurel':'Thorn'
const prettyRole=(role:ThreeRowRole)=>role==='ally'?'Ally':'Saboteur'

// Two cuts on one woodblock. Use these same dies for the tray, tools, and worked example.
function Dies({id}:{id:string}){
 return <svg className="tr-dies" width="0" height="0" aria-hidden="true" focusable="false"><defs>
  <symbol id={id+'A'} viewBox="0 0 56 56">
   <path d="m7 31 2-14 9-9 15-2 12 6 5 13-2 15-11 10-15 1-11-8Z" fill="#312822" stroke="#261c19" strokeWidth="2"/>
   <path d="m7 28 2-13 10-9 15-1 11 6 5 13-3 13-10 9-14 2-12-8Z" fill="#e6cfa1" stroke="#44362a" strokeWidth="1.6"/>
   <path d="m10 26 2-10 9-8 12-1 10 5 5 12-4 12-8 8-13 2-10-7Z" fill="none" stroke="#9b805c" strokeDasharray="22 2 6 1" />
   <g fill="#45493c" stroke="#45493c" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 37c5-2 11-8 16-17m-10 12c-5-2-6-6-6-10 5 2 7 5 6 10Zm4-5c-4-3-4-8-2-12 4 3 5 8 2 12Zm3-5c1-6 5-9 9-10 0 5-4 9-9 10Zm-4 7c5-5 10-5 13-3-3 4-8 5-13 3Zm-5 6c5-4 9-4 13-2-3 4-9 5-13 2Z"/>
    <path d="m19 24 4 6m3-12 1 6m11-10-5 6m4 7-7 1m2 6-7 1" fill="none" stroke="#bca777" strokeWidth=".8"/>
   </g><path d="m12 19 2-4m0 22 3 3m21 0 5-5" fill="none" stroke="#927552"/>
  </symbol>
  <symbol id={id+'B'} viewBox="0 0 56 56">
   <path d="m6 23 7-12 15-4 14 3 8 12-1 16-8 11-16 3-14-9Z" fill="#251719" stroke="#27181a" strokeWidth="2"/>
   <path d="m6 20 7-11 15-5 14 4 8 12-2 15-8 10-15 3-14-9Z" fill="#833d3c" stroke="#472624" strokeWidth="1.7"/>
   <path d="m9 21 6-10 13-4 12 3 7 11-2 13-7 9-13 2-12-8Z" fill="none" stroke="#c28369" strokeDasharray="16 2 4 2"/>
   <g fill="#edc695" strokeLinejoin="round">
    <path d="m15 38 7-10-3-12 5 6 2-5-1 9 6-8 1-8 2 5 7-3-7 7-1 7 7-2-6 5-6 1-9 10z"/>
    <path d="m27 27 5 1-2 2-6 1m-7 3-4-7 7 3M34 19l9-2-6 4z"/>
   </g><path d="m16 39 9-11 9-12m-9 18 8-2m-17 7 3 2 4 1M12 19l3-5m25 22-3 4" fill="none" stroke="#ae6b55" strokeWidth=".85"/>
  </symbol>
 </defs></svg>
}
function Seal({id,mark,style}:{id:string;mark:ThreeRowMark;style?:string}){
 return <svg className={'tr-seal '+(style??'')} viewBox="0 0 56 56" focusable="false" aria-hidden="true"><use href={'#'+id+mark}/></svg>
}
function Rail(){
 return <svg className="tr-rail" aria-hidden="true" viewBox="0 0 500 500" preserveAspectRatio="none" focusable="false">
  <path d="M6 16 13 6l79 1 82-2 93 2 128-2 92 2 8 10-2 91 2 133-2 131 2 112-10 9-123 1-103-2-97 2-145-1-11-10 2-87-2-139 1-128z" fill="#4f443a" stroke="#2c211d" strokeWidth="3"/>
  <path d="m13 16 5-4 118-1 129 2 126-2 89 1 7 6-1 130 1 165-1 164-8 10-133-1-153 1-175-2-5-7 1-124-2-157Z" fill="none" stroke="#aa8c63" strokeWidth="1.5"/>
  <path d="m21 8 105 1m52-1 71 1m41-1 151 1M7 52l2 104m-1 49v69m485-214-1 139m-1 42 2 169M36 491l143-1m104 0 156 1" fill="none" stroke="#ad9475" opacity=".6"/>
  {[0,90,180,270].map(r=><g key={r} transform={'rotate('+r+' 250 250)'} fill="none" stroke="#e0be8a" strokeWidth="1.2"><path d="m12 19 8-7 22 1-13 2-8 6-6 12 1-9zM18 26q3-3 7-4M22 18l9-2"/></g>)}
 </svg>
}
function Envelope(){return <svg aria-hidden="true" focusable="false" viewBox="0 0 60 48" className="tr-envelope"><path d="m5 10 48-3 3 32-48 3Z" fill="#dec599" stroke="#48362a" strokeWidth="2"/><path d="m6 11 22 16L53 8M9 39l14-17m31 14L37 22" fill="none" stroke="#876c4c"/><path d="m25 23 2-4 6-1 4 3 1 5-4 4-6-1-3-3z" fill="#86443c" stroke="#58302c"/><path d="m28 25 4-4m-2 3 4-1" stroke="#e2b883" fill="none"/></svg>}

type Props={view:ThreeRowView;you:string;names:Readonly<Record<string,string>>;hostNow:number;active?:boolean;submit:(action:ThreeRowAction)=>void}
function Clock({deadline,hostNow,onExpiry}:{deadline:number;hostNow:number;onExpiry:()=>void}){
 const [remaining,setRemaining]=useState(()=>Math.max(0,Math.ceil((deadline-hostNow)/1000)))
 const callback=useRef(onExpiry);callback.current=onExpiry
 useEffect(()=>{
  const start=performance.now()
  const tick=()=>{const left=Math.max(0,Math.ceil((deadline-hostNow-(performance.now()-start))/1000))
   setRemaining(left);if(left===0)callback.current()}
  tick();const timer=window.setInterval(tick,250);document.addEventListener('visibilitychange',tick)
  return ()=>{window.clearInterval(timer);document.removeEventListener('visibilitychange',tick)}
 },[deadline,hostNow])
 return <span className="tr-clock" role="timer" aria-label={remaining+' seconds remaining'}><svg aria-hidden="true" width="13" height="16" viewBox="0 0 14 18"><path d="M2 1h10M2 17h10M3 2c0 5 3 5 4 7-1 2-4 2-4 7m8-14c0 5-3 5-4 7 1 2 4 2 4 7" fill="none" stroke="currentColor" strokeWidth="1.45"/><path d="m4 4 3 4 3-4zm0 11 3-3 3 3z" fill="currentColor"/></svg>{remaining}s</span>
}
export function ThreeRowBoard({view:v,you,names,hostNow,active=true,submit}:Props){
 const id=useId().replace(/[^\w-]/g,'')+'row'
 const [choice,setChoice]=useState<ThreeRowMark>('A')
 const [focus,setFocus]=useState(12)
 const [expired,setExpired]=useState<number|null>(null)
 const refs=useRef<Array<HTMLButtonElement|null>>([])
 const name=(seat:string)=>names[seat]??'Seat'
 const playing=active&&v.role!==null
 const inTime=expired!==v.deadline&&hostNow<v.deadline
 const mayPlace=playing&&v.phase==='place'&&v.turn===you&&inTime
 const mayVote=playing&&v.phase==='vote'&&v.vote===null&&inTime
 const bAllowed=v.role==='saboteur'||(v.bluffs??0)>0
 const mark=choice==='B'&&bAllowed?'B':'A'
 const marked=v.line[0]===undefined?null:v.board[v.line[0]]
 function key(e:KeyboardEvent<HTMLButtonElement>,cell:number){
  const row=Math.floor(cell/5),col=cell%5
  const next=e.key==='ArrowUp'?Math.max(0,row-1)*5+col:e.key==='ArrowDown'?Math.min(4,row+1)*5+col:e.key==='ArrowRight'?row*5+Math.min(4,col+1):e.key==='ArrowLeft'?row*5+Math.max(0,col-1):e.key==='Home'?(e.ctrlKey?0:row*5):e.key==='End'?(e.ctrlKey?24:row*5+4):null
  if(next===null)return
  e.preventDefault();setFocus(next);refs.current[next]?.focus()
 }
 const boardVerdict=marked==='A'?'Laurel line':marked==='B'?'Thorn line':'No Laurel line'
 const turnText=!active&&v.phase!=='done'?'Reconnecting':v.phase==='vote'?'Sealed ballot':v.phase==='done'?'Verdict':v.turn===you?'Your turn':v.turn?name(v.turn)+' to play':'At the table'
 return <section className="tr-bench" aria-label="Three in a Row table" data-tr-phase={v.phase}>
  <Dies id={id}/>
  <header className="tr-top"><div><span className="tr-small">THE SIGNET TABLE</span><strong role="status">{turnText}</strong></div><div className="tr-figures"><span>Turn {v.phase==='place'?Math.min(12,v.turns+1):v.turns}/12</span>{v.phase!=='done'&&<Clock deadline={v.deadline} hostNow={hostNow} onExpiry={()=>setExpired(v.deadline)}/>}</div></header>
  {v.role?<div className="tr-private" data-tr-private><span>Your role: <b>{prettyRole(v.role)}</b></span><span>{v.role==='ally'?'Make a Laurel line':'Block the Laurel line'}</span></div>:<p className="tr-private">Spectating</p>}
  <div className="tr-play">
   <div className="tr-boardwrap"><Rail/><div className="tr-grid" role="group" aria-label="Five by five board. Use arrow keys to explore. Press Enter or Space to place.">
    {v.board.map((stone,c)=>{
     const legal=mayPlace&&!stone
     return <button key={c} ref={el=>{refs.current[c]=el}} className="tr-cell" type="button" data-tr-cell={c} data-tr-move={legal||undefined} data-tr-stone={stone??undefined} data-tr-line={v.line.includes(c)||undefined} tabIndex={focus===c?0:-1} aria-label={place(c)+': '+(stone?stone+' '+printName(stone):'empty')} aria-disabled={!legal} onFocus={()=>setFocus(c)} onKeyDown={e=>key(e,c)} onClick={()=>{if(legal)submit({kind:'threeRowPlace',cell:c,mark})}}>
      <span className="tr-cellco" aria-hidden="true">{place(c)}</span>{stone?<Seal id={id} mark={stone}/>:<span className="tr-register" aria-hidden="true">+</span>}
     </button>
    })}
   </div></div>
   <div className="tr-docket">
    {v.phase==='place'&&<>{v.role?<fieldset className="tr-tools"><legend>Choose a seal</legend>{(['A','B'] as const).map(m=><button key={m} type="button" data-tr-mark={m} disabled={!mayPlace||(m==='B'&&!bAllowed)} aria-pressed={mark===m} onClick={()=>setChoice(m)}><Seal id={id} mark={m}/><span>{m} · {printName(m)}<small>{m==='A'?'Open to all':v.role==='ally'?(v.bluffs??0)+' bluffs left':'Unrestricted'}</small></span></button>)}</fieldset>:<div className="tr-legend"><span>A · Laurel</span><span>B · Thorn</span></div>}
    <p className="tr-note">{!active?'Waiting to reconnect.':mayPlace?'Tap an empty square to stamp it.':inTime?'Watch the seals. Either side can place Thorn.':'Waiting for the host clock.'}</p></>}
    {v.phase==='vote'&&<div className="tr-ballot" data-tr-sealed={v.vote!==null||undefined}><Envelope/><h3>{v.vote!==null?'Your ballot is sealed':v.role?'Who is the saboteur?':'Ballots are private'}</h3>
     {v.vote!==null?<p className="tr-note">Your pick: {name(v.vote)}. Waiting for the reveal.</p>:v.role?<><p className="tr-note">{active?'Choose once. Your pick stays hidden from the other players.':'Waiting to reconnect.'}</p><div className="tr-suspects">{Object.keys(names).filter(s=>s!==you).map(s=><button type="button" key={s} data-tr-suspect={s} disabled={!mayVote} onClick={()=>submit({kind:'threeRowVote',suspect:s})}>{name(s)}</button>)}</div></>:<p className="tr-note">Watch for the final reveal.</p>}
    </div>}
    {v.phase==='done'&&<div className="tr-result"><p className="tr-small">THE REVEAL</p><h3>{boardVerdict}</h3><p className="tr-note">{v.alliesIdentified?'Saboteur identified':'Saboteur escaped identification'}</p>
     <ul>{Object.entries(v.roleReveal??{}).map(([s,r])=><li key={s} data-tr-reveal={s}><span><b>{name(s)}</b><small>{prettyRole(r)}</small></span><strong>{v.scores?.[s]??0} points</strong></li>)}</ul>
    </div>}
   </div>
  </div>
 </section>
}

export function ThreeRowLesson({step}:{step:number}){
 const id=useId().replace(/[^\w-]/g,'')+'lesson'
 const phase=Math.min(3,Math.max(0,step))
 return <figure className="tr-lesson" data-tr-example={phase}><Dies id={id}/>
  {phase<2?<svg viewBox="0 0 195 88" aria-hidden="true"><path d="m13 12 163-3 3 62-161 4z" fill="#decba7" stroke="#5e4b3d" strokeWidth="3"/><path d="m68 12 2 59m52-60 2 60" fill="none" stroke="#91805d" strokeWidth="1.5"/>{[0,1,2].map((n)=><use href={'#'+id+(phase===0||n!==1?'A':'B')} x={20+54*n} y={17} width="45" height="45" key={n}/>)}</svg>:<div className="tr-example-paper"><Envelope/>{phase===3&&<span>+2</span>}</div>}
  <figcaption>{['Three Laurels in a line score for the allies.','Both sides can stamp a Thorn. A mark does not prove a role.','Seal a private ballot for another player.','A strict majority of allies must identify the saboteur.'][phase]}</figcaption>
 </figure>
}
