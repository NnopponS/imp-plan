import {useEffect,useRef,useState,type KeyboardEvent} from 'react'
import type {FlagsView} from './flags'
import './flags.css'

const art=import.meta.env.BASE_URL+'art/flags/'
type Card={code:string;description:string;symbol:string}
type Props={view:FlagsView;hostNow:number;you:string;names:Record<string,string>;active?:boolean;send:(choices:number[])=>void}

function Compass(){return <svg className="fa-mark" viewBox="0 0 60 60" fill="none" aria-hidden="true">
 <path d="M9 35c-2-13 5-24 17-27s24 4 26 18-4 24-18 26S11 46 9 35Z" fill="#f1e3bd" stroke="currentColor" strokeWidth="1.5"/><ellipse cx="30.5" cy="30" rx="18" ry="18" stroke="#987b48" strokeDasharray="21 2 7 1"/>
 <path d="m31 3 4 21 18 9-21 1-8 21 1-23-19-9 21 2z" fill="#a58b58" stroke="currentColor"/><path d="m31 3-1 26-5 3 2-7z" fill="#8a3f36"/><path d="m24 55 6-25 4 4z" fill="#364c50"/><circle cx="30" cy="30" r="3" fill="#edd299" stroke="currentColor"/>
 <path d="m7 10 9 10m28 23 7 7M6 48l9-7m32-27 5-4" stroke="currentColor" strokeDasharray="3 2"/>
 </svg>}
function Glyph({kind}:{kind:'time'|'pattern'|'pin'|'symbol'}){return <svg fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 22 24" aria-hidden="true">{kind==='symbol'?<><path d="m11 2 9 10-9 10-9-10z"/><circle cx="11" cy="12" r="3.5"/></>:kind==='time'?<><path d="M4 2h14M4 22h14M6 3c0 5 1 6 5 9-4 3-5 4-5 9m10-18c0 5-1 6-5 9 4 3 5 4 5 9"/><path d="m8 6 3 4 3-4zm0 13 3-5 3 5z" fill="currentColor"/></>:kind==='pattern'?<><path d="m2 6 13-3 4 14-13 3Z"/><path d="m5 9 8-2m-7 6 8-2m-7 6 7-2"/></>:<><path d="m3 3 15 1-1 18-7-5-7 4z" fill="currentColor"/><path d="m5 10 3 3 6-7" stroke="#fff1d1"/></>}</svg>}
function useClock(deadline:number|null,hostNow:number){
 const [expired,setExpired]=useState<{deadline:number|null;hostNow:number;left:number}|null>(null)
 useEffect(()=>{if(deadline===null)return
  const received=performance.now()
  const tick=()=>setExpired({deadline,hostNow,left:Math.max(0,Math.ceil((deadline-hostNow-(performance.now()-received))/1000))})
  tick();const timer=window.setInterval(tick,250);document.addEventListener('visibilitychange',tick)
  return ()=>{window.clearInterval(timer);document.removeEventListener('visibilitychange',tick)}
 },[deadline,hostNow])
 return deadline===null?null:expired?.deadline===deadline&&expired.hostNow===hostNow?expired.left:Math.max(0,Math.ceil((deadline-hostNow)/1000))
}
// Twenty distinct emblems using a shape and 1–4 notches. The numbers are the host's
// randomly assigned specimen labels, never a shorthand for the country.
const emblems=['Circle','Triangle','Diamond','Square','Cross']
function token(symbol:string){
 const value=Number(symbol.match(/\d+/)?.[0])
 const idx=Number.isInteger(value)&&value>=1&&value<=20?value-1:0
 return {shape:idx%5,count:1+Math.floor(idx/5)}
}
function Insignia({symbol}:{symbol:string}){
 const {shape,count}=token(symbol)
 return <svg viewBox="0 0 68 48" className="fa-insignia" aria-hidden="true"><g fill="none" stroke="currentColor" strokeWidth="2.7" strokeLinejoin="round">
 {shape===0?<circle cx="34" cy="18" r="11"/>:shape===1?<path d="m34 6 13 23H21Z"/>:shape===2?<path d="m34 3 14 15-14 15-14-15z"/>:shape===3?<path d="M23 7h22v22H23z"/>:<path d="M30 5h8v9h9v8h-9v9h-8v-9h-9v-8h9z"/>}
 </g>{Array.from({length:count},(_,i)=><circle key={i} cx={34+(i-(count-1)/2)*7} cy="40" r="2.15" fill="currentColor"/>)}</svg>
}
function Specimen({card,name,patterns,picked,matched,symbolsOnly}:{card:Card;name?:string;patterns:boolean;picked?:boolean;matched?:string;symbolsOnly:boolean}){
 const t=token(card.symbol)
 const label=emblems[t.shape]+', '+t.count+' '+(t.count===1?'dot':'dots')
 return <><span className="fa-specimen">{symbolsOnly?<span className="fa-token" role="img" aria-label={label}><Insignia symbol={card.symbol}/></span>:<img src={art+encodeURIComponent(card.code)+'.svg'} alt={card.description} width="120" height="90" draggable={false}/>}</span>
 <span className="fa-caption"><span className="fa-folio">{card.symbol}</span>{!symbolsOnly&&<span className="fa-small-sigil" title={label}><Insignia symbol={card.symbol}/></span>}{picked&&<span className="fa-pin" aria-label="Selected"><Glyph kind="pin"/></span>}</span>
 {(name||matched)&&<span className="fa-name">{name??matched}</span>}{patterns&&<span className="fa-pattern" aria-hidden="true">{symbolsOnly?label:card.description}</span>}</>
}
const unique=(a:number[])=>[...new Set(a.filter(i=>i>=0))]
function position(e:KeyboardEvent<HTMLButtonElement>,elems:(HTMLButtonElement|null)[],i:number){
 const keys=['ArrowUp','ArrowDown','ArrowRight','ArrowLeft','Home','End']
 if(!keys.includes(e.key))return
 const current=elems[i];if(!current)return
 const cols=Math.max(1,elems.filter(el=>el&&Math.abs(el.offsetTop-(elems[0]?.offsetTop??0))<=2).length)
 let j=i
 if(e.key==='Home')j=0;else if(e.key==='End')j=elems.length-1
 else if(e.key==='ArrowLeft')j--;else if(e.key==='ArrowRight')j++;else if(e.key==='ArrowUp')j-=cols;else j+=cols
 e.preventDefault();elems[Math.max(0,Math.min(j,elems.length-1))]?.focus()
}
export function FlagsBoard({view:v,hostNow,you,names,active=true,send}:Props){
 const [patterns,setPatterns]=useState(false),[symbolsOnly,setSymbolsOnly]=useState(false),[draft,setDraft]=useState<number[]>([]),[nameAt,setNameAt]=useState(0)
 const [posting,setPosting]=useState(false),lock=useRef(false),cooldown=useRef<number|undefined>(undefined)
 const ref=useRef<Array<HTMLButtonElement|null>>([]),left=useClock(v.deadline,hostNow)
 useEffect(()=>{if(v.phase==='study'){setDraft([]);setNameAt(0)}setPosting(false);lock.current=false;return ()=>window.clearTimeout(cooldown.current)},[v.phase,v.mode])
 useEffect(()=>{if(!active||v.ownChoices!==null){setPosting(false);lock.current=false;window.clearTimeout(cooldown.current)}},[active,v.ownChoices])
 const inAnswer=v.phase==='answer',done=v.phase==='done',matching=v.mode==='names'
 const assigned=v.ownChoices??draft,capacity=matching?v.names.length:12
 const slots=matching?Array.from({length:v.names.length},(_,i)=>assigned[i]??-1):assigned
 const selected=unique(slots),locked=v.ownChoices!==null,enabled=inAnswer&&active&&!locked&&!posting&&(left??0)>0
 const choose=(i:number)=>{
  if(!enabled||lock.current)return
  if(!matching){
   setDraft(d=>d.includes(i)?d.filter(j=>j!==i):d.length<capacity?[...d,i]:d)
  }else{
   const next=Array.from({length:v.names.length},(_,j)=>j===nameAt?(slots[j]===i?-1:i):slots[j]===i?-1:slots[j])
   setDraft(next)
   if(next[nameAt]>=0){for(let j=1;j<next.length;j++){const k=(nameAt+j)%next.length;if(next[k]<0){setNameAt(k);break}}}
  }
 }
 const seal=()=>{
  if(!enabled||!selected.length||lock.current)return
  lock.current=true;setPosting(true)
  cooldown.current=window.setTimeout(()=>{lock.current=false;setPosting(false)},2400)
  send([...slots])
 }
 const who=(s:string)=>names[s]??(s===you?'You':'Player')
 const studyClosed=v.phase==='study'&&left!==null&&left<=0
 const title=studyClosed?'Waiting for host':v.phase==='study'?'Study the flag register':done?'The register is open':locked?'Answer sealed':matching?'Assign a flag':'Which flags did you see?'
 const taken=done?(v.solutions??[]):[]
 const list=studyClosed?[]:v.phase==='study'?v.study:v.options
 const point=(n:number)=>n+' '+(n===1?'point':'points')
 return <section className="fa-atlas" aria-label="Flags Around the World table" data-fa-phase={v.phase}>
  <div className="fa-bound"><header className="fa-head"><Compass/><div className="fa-titles"><small>Exile / Atlas room</small><h3 aria-live="polite">{title}</h3></div>
  {left!==null&&<span className="fa-clock" role="timer" aria-label={left+' seconds remaining'}><Glyph kind="time"/>{left}s</span>}</header>
  <div className="fa-sheet">
   {done&&<div className="fa-summary"><span className="fa-section-label">Filed dispatch</span><h4>{v.players===1?'Practice complete':v.leaders.length>1?'Shared lead':v.leaders.length===1?who(v.leaders[0])+' wins':'Field report'}</h4>
    {v.leaders.length>1&&<p>{v.leaders.map(who).join(' · ')}</p>}
    <ul className="fa-ledger" aria-label="Final scores">{(v.results??[]).map(r=><li key={r.seat}><span><b>{who(r.seat)}</b><small>{r.hits} hits · {r.misses} wrong · {r.elapsed===null?'No seal':(r.elapsed/1000).toFixed(1)+'s'}</small></span><strong>{point(r.points)}</strong></li>)}</ul></div>}
   <div className="fa-bar"><p>{studyClosed?'Study time is over. The answer rack opens when the host is ready.':v.phase==='study'?'Remember the twelve flags and their names.':done?'Outlined flags belong to the original register.':locked?'Your dispatch is locked. The key opens after everyone finishes.':!active?'Viewing only.':matching?'Select a name, then its flag.':'Mark up to twelve flags from the register.'}</p>
    {!studyClosed&&<div className="fa-display"><button type="button" className="fa-toggle" aria-label="Use symbols only" aria-pressed={symbolsOnly} onClick={()=>setSymbolsOnly(on=>!on)}><Glyph kind="symbol"/> Symbols only</button>
    <button type="button" className="fa-toggle" aria-label="Show pattern descriptions" aria-pressed={patterns} onClick={()=>setPatterns(p=>!p)}><Glyph kind="pattern"/> Patterns</button></div>}</div>
   {matching&&inAnswer&&<div className="fa-index" role="group" aria-label="Names to match">{v.names.map((s,j)=><button data-fa-name={j} type="button" className="fa-tab" key={j} aria-label={s+(slots[j]>=0?', assigned to '+v.options[slots[j]]?.symbol:', not assigned')} aria-pressed={j===nameAt} data-filled={slots[j]>=0||undefined} disabled={!enabled} onClick={()=>setNameAt(j)}>{s}{slots[j]>=0&&<span aria-hidden="true"> ✓</span>}</button>)}</div>}
   <div className="fa-rack" role="group" aria-label={v.phase==='study'?'Study register':done?'Answer key':'Flag choices'}>
    {list.map((card,i)=>{
     const picked=selected.includes(i)
     const named=v.phase==='study'?v.study[i].name:undefined
     const mapped=matching?slots.indexOf(i):-1
     const right=done&&taken.includes(i)
     const match=done&&matching&&right?v.names[taken.indexOf(i)]:inAnswer&&matching&&mapped>=0?v.names[mapped]:undefined
     const face=<Specimen card={card} symbolsOnly={symbolsOnly} name={named} matched={match} picked={v.phase!=='study'&&picked} patterns={patterns}/>
     return inAnswer?<button key={v.phase+':'+i} ref={el=>{ref.current[i]=el}} type="button" className="fa-slip" disabled={!enabled} data-fa-option={i}
      data-picked={picked||undefined} aria-pressed={picked} aria-label={card.symbol+': '+(symbolsOnly?emblems[token(card.symbol).shape]+', '+token(card.symbol).count+' dots':card.description)+(match?', assigned to '+match:'')}
      onKeyDown={e=>position(e,ref.current.slice(0,list.length),i)} onClick={()=>choose(i)}>{face}</button>
      :<figure className="fa-slip" key={v.phase+':'+i} data-fa-study={v.phase==='study'?i:undefined} data-correct={right||undefined} aria-label={done?(right?'Correct flag: ':'Distractor: ')+card.description:undefined}>{face}{done&&right&&<span className="fa-name">In register ✓</span>}</figure>
    })}
   </div>
   <footer className="fa-foot">
    {v.phase==='study'?<span className="fa-meter">{studyClosed?'Register closed':'Plate I · 12 specimens'}</span>:done?<span className="fa-stamp">Archive closed</span>:<>
     <span className="fa-meter" role="status">{locked?'Sealed':!active?'Watching':matching?'Assigned':'Marked'}{(active||locked)&&' '+selected.length+' / '+capacity} · {v.submitted}/{v.players} sealed</span>
     {locked?<span className="fa-stamp">Answer sealed</span>:active&&<button className="fa-send" type="button" data-fa-seal="" disabled={!enabled||!selected.length} onClick={seal}>{posting?'Sealing…':'Seal answer'}</button>}
    </>}
   </footer>
  </div></div>
 </section>
}

function Sample({x,y,kind,seal=false}:{x:number;y:number;kind:number;seal?:boolean}){
 return <g transform={'translate('+x+' '+y+')'}><path d="m0 0 40-1 1 34-41 1z" fill="#f7eed5" stroke="#705f45" strokeWidth="1.4"/>
 <svg x="4" y="4" width="32" height="20" viewBox="0 0 32 20"><path fill={kind===0?'#7c3c3a':kind===1?'#526858':'#435863'} d="M0 0h32v20H0z"/>{kind===0?<path d="m0 0 16 10L0 20z" fill="#edcf86"/>:kind===1?<circle cx="16" cy="10" r="5" fill="#edcf86"/>:<path d="M0 8h32v4H0z" fill="#edcf86"/>}</svg>
 <path d="m6 28 15-1m3 0h5" stroke="#aa9674"/>{seal&&<g><circle cx="36" cy="28" r="7" fill="#873e34" stroke="#5c342c"/><path d="m32 28 3 3 5-6" stroke="#f5e0ad" fill="none" strokeWidth="2"/></g>}</g>
}
export function FlagsLesson({step}:{step:number}){
 const n=Math.max(0,Math.min(3,Math.floor(step)||0))
 return <figure className="fa-lesson" data-fa-example={n}><svg viewBox="0 0 190 80" aria-hidden="true">
 <path d="m5 8 51-3 73 2 54-3 2 65-54 3-71-1-54 4Z" fill="#ead9b4" stroke="#67573d" strokeWidth="1.5"/>
 <path d="m60 7-2 64m72-64 2 63M10 14h20m137 50 10-1" stroke="#bca67b" fill="none" strokeDasharray="3 2"/>
 {n===0?<><Sample x={20} y={21} kind={0}/><Sample x={74} y={19} kind={1}/><Sample x={130} y={21} kind={2}/></>:n===1?<><Sample x={16} y={22} kind={1} seal/><Sample x={74} y={19} kind={0}/><Sample x={134} y={22} kind={2} seal/></>:n===2?<><path d="m20 28 57-3 3 21-59 4z" fill="#d9c28b" stroke="#836d49"/><path d="m27 35 37-2m-36 8 22-1m34-4h24m-7-5 8 5-8 5" fill="none" stroke="#644c39" strokeWidth="2"/><Sample x={115} y={19} kind={1} seal/></>:<><path d="m37 18 114-3 2 46-114 3z" fill="#f8edcd" stroke="#70583e" strokeWidth="2"/><path d="m38 19 57 26 55-30m-108 44 41-20m23-2 42 20" fill="none" stroke="#9b7f55"/><circle cx="94" cy="43" r="10" fill="#8a3e32"/><path d="m88 43 4 4 8-9" stroke="#f1d29b" strokeWidth="2" fill="none"/></>}
 </svg><figcaption>{['Study each flag with its name and pattern.','In Recall, mark the flags that appeared.','In Names, match each name to its flag.','Seal once; compare the register after the reveal.'][n]}</figcaption></figure>
}
