import {useEffect,useRef,useState} from 'react'
import {diceBands,diceRounds,rankDice,type DiceBand,type DiceView,type Die} from './triple-dice'
import {diceLessonFrames} from './triple-dice-lesson-data'
import './triple-dice.css'

const pipColors={open:'#2b4c4e',private:'#5e302b',blind:'#efd6a5'}
const pipPositions=[[13,13],[25,13],[37,13],[13,25],[25,25],[37,25],[13,37],[25,37],[37,37]]
const pipMap={1:[4],2:[0,8],3:[0,4,8],4:[0,2,6,8],5:[0,2,4,6,8],6:[0,2,3,5,6,8]}
const labels={low:{name:'Low',score:'Under 4'},mid:{name:'Mid',score:'4 to under 7'},high:{name:'High',score:'7 or more'}}
const slots=['Open','Open','Private','Blind'] as const

function DiceFace({value,kind='open'}:{value:Die|null;kind?:'open'|'private'|'blind'}){
 const hidden=value===null, color=pipColors[kind]
 const face=hidden?'#493b35':kind==='private'?'#dbb887':'#ecd2a0'
 return <svg viewBox="0 0 50 54" className="td-die" aria-hidden="true">
  <path d="M3 12 8 5h34l5 7v33l-5 7H8l-5-7Z" fill={hidden?'#201715':'#95724c'} stroke="#382b25" strokeWidth="1.1"/>
  <path d="M3 10 8 4h34l5 6v30l-5 6H8l-5-6Z" fill={face} stroke={hidden?'#bc9d71':'#684b32'} strokeWidth="1.35"/>
  <path d="M8 12 12 8h26l4 4v25l-4 5H12l-4-5Z" fill="none" stroke={color} strokeOpacity=".48" strokeWidth=".8"/>
  {hidden?<g fill="none" stroke={color} strokeWidth="1.4"><path d="m25 12 12 13-12 13-12-13z"/><path d="M22 25v-4a3 3 0 0 1 6 0v4m-8-1h10v7H20z"/></g>:pipMap[value].map(i=><circle cx={pipPositions[i][0]} cy={pipPositions[i][1]} r="3.15" key={i} fill={color} stroke="#251b16" strokeWidth=".5"/>)}
 </svg>
}
function DrawerGlyph(){return <svg viewBox="0 0 46 46" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.3">
 <circle cx="23" cy="23" r="20"/><circle cx="23" cy="23" r="16" strokeDasharray="1 2.5"/>
 <path d="m23 9 13 8v13l-13 7-13-7V17zM10 17l13 8 13-8m-13 8v12m-3-20 3-2 3 2-3 2z"/>
 <circle cx="16" cy="25" r="1"/><circle cx="30" cy="25" r="1"/><circle cx="30" cy="29" r="1"/>
 </svg>}
function useSeconds(deadline:number|null,hostNow:number){
 const [readout,setReadout]=useState(()=>({deadline,hostNow,seconds:Math.max(0,Math.ceil(((deadline??hostNow)-hostNow)/1000))}))
 useEffect(()=>{
  if(deadline===null)return
  const received=performance.now()
  const tick=()=>setReadout({deadline,hostNow,seconds:Math.max(0,Math.ceil((deadline-hostNow-(performance.now()-received))/1000))})
  tick()
  const loop=window.setInterval(tick,250)
  document.addEventListener('visibilitychange',tick)
  return ()=>{window.clearInterval(loop);document.removeEventListener('visibilitychange',tick)}
 },[deadline,hostNow])
 return deadline===null?null:deadline===readout.deadline&&hostNow===readout.hostNow?readout.seconds:Math.max(0,Math.ceil((deadline-hostNow)/1000))
}
type Props={view:DiceView;you:string;name:(seat:string)=>string;hostNow:number;active:boolean;send:(positions:[number,number,number],prediction:DiceBand)=>void}

function Drawers({view:v,active,send,seconds}:Props&{seconds:number|null}){
 const [draft,setDraft]=useState<number[]>([])
 const mid=v.table.length>=5,high=v.table.length>=8
 const [forecast,setForecast]=useState<DiceBand|null>(mid?null:'low')
 const [posting,setPosting]=useState(false)
 const sealRef=useRef<number|undefined>(undefined)
 const mine=v.mine, choice=mine?.choice
 useEffect(()=>()=>window.clearTimeout(sealRef.current),[])
 if(!mine)return <p className="td-note">Watching this table.</p>
 const picked=choice?.positions??draft, chosenBand=choice?.prediction??forecast
 const enabled=active&&!choice&&!posting&&(seconds??0)>0
 const [a,b,c]=picked.map(i=>mine.dice[i])
 const pattern=a&&b&&c?rankDice([a,b,c]).name:null
 const status=choice?'Your forecast is sealed':!active?'Controls paused':seconds===0?'Time is up; waiting for the host':picked.length===3?(pattern?'Known hand: '+pattern:'Your blind die opens at reveal'):'Choose three dice'
 return <div className="td-work">
  <div className="td-work-title"><div><span className="td-index">01 / Your tray</span><h4>Build a hand</h4></div><strong className="td-count">{picked.length} / 3</strong></div>
  <div className="td-rack" role="group" aria-label="Your dice">
   {mine.dice.map((value,i)=>{
    const isPicked=picked.includes(i),kind=i<2?'open':i===2?'private':'blind'
    return <button type="button" key={i} className="td-slot" data-dice-slot={i} aria-pressed={isPicked}
     aria-label={slots[i]+' die '+(i+1)+': '+(value??'unseen')} disabled={!enabled}
     onClick={()=>setDraft(list=>list.includes(i)?list.filter(k=>k!==i):list.length<3?[...list,i]:list)}>
     <span className="td-slot-index" aria-hidden="true">{String(i+1).padStart(2,'0')}</span>
     <DiceFace value={value} kind={kind}/>
     <span className="td-slot-kind">{slots[i]}</span><span className="td-notch" aria-hidden="true">{isPicked?'✓':'·'}</span>
    </button>
   })}
  </div>
  <div className="td-work-title td-forecast-title"><div><span className="td-index">02 / Base points</span><h4>Make a forecast</h4></div></div>
  {!mid&&<p className="td-note">With {v.table.length} seats, only Low is possible. Add seats to open more bands.</p>}
  <div className="td-bands" role="group" aria-label="Forecast band">
   {diceBands.map((band,i)=><button type="button" key={band} aria-pressed={band===chosenBand} aria-label={labels[band].name+', '+labels[band].score+' base points'}
    disabled={!enabled||(band==='mid'&&!mid)||(band==='high'&&!high)} onClick={()=>setForecast(band)}>
    <small aria-hidden="true">{['Ⅰ','Ⅱ','Ⅲ'][i]}</small><strong>{labels[band].name}</strong><span>{labels[band].score}</span>
   </button>)}
  </div>
  <div className="td-seal-line">
   <p className="td-note" role="status">{status}</p>
   <button type="button" className="td-seal" disabled={!enabled||!forecast||picked.length!==3} onClick={()=>{
    if(!enabled||!forecast||picked.length!==3||sealRef.current!==undefined)return
    setPosting(true)
    sealRef.current=window.setTimeout(()=>{sealRef.current=undefined;setPosting(false)},1800)
    send([picked[0],picked[1],picked[2]],forecast)
   }}>{posting&&!choice?'Sealing…':'Seal three dice'}</button>
  </div>
 </div>
}

export function TripleDiceBoard(props:Props){
 const {view:v,you,name,hostNow}=props
 const seconds=useSeconds(v.deadline,hostNow)
 const done=v.phase==='done'
 const standing=v.table.slice().sort((a,b)=>b.total-a.total)
 const activeName=(seat:string)=>name(seat)+(seat===you?' (you)':'')
 return <section className="td-board" aria-label="Triple Dice table">
  <div className="td-panel" data-dice-phase={v.phase}>
   <header className="td-heading">
    <DrawerGlyph/><div><span className="td-index">Prison wing / Dice cabinet</span><h3>{v.phase==='select'?'The covered tray':done?'The final ledger':'Round reveal'}</h3></div>
    <div className="td-mark"><strong>Round {v.round} / {diceRounds}</strong>
     {seconds!==null&&<span role="timer" aria-label={(v.phase==='review'?'Next round in ': 'Selection ends in ')+seconds+' seconds'}>{v.phase==='review'?'Next draw · ':''}{seconds}s</span>}
    </div>
   </header>
   <div className="td-body">
    {v.phase==='select'?<Drawers {...props} seconds={seconds} key={v.round}/>:<div className="td-work td-review" aria-live="polite">
     <div className="td-work-title"><div><span className="td-index">{done?'Round eight / Final draw':'Open · Scored'}</span><h4>Round settlement</h4></div></div>
     <ul className="td-settlements" aria-label="Round settlement" role="list">
      {v.reveal?.map(row=><li key={row.seat}>
       <div className="td-score-identity"><strong>{name(row.seat)}</strong><small>{row.pattern??'No submission'}{row.rank!==null?' · rank '+row.rank:''}</small></div>
       <span className="td-mini-hand" role="img" aria-label={row.dice?'Dice '+row.dice.join(', '):'No dice opened'}>{row.dice?.map((pip,i)=><DiceFace key={i} value={pip}/>)??'—'}</span>
       <div className="td-breakdown">{row.prediction&&<small>{labels[row.prediction].name} forecast · {row.prediction===row.actual?'hit':'miss'}</small>}<strong>+{row.points} <small>pts</small></strong>{row.rank!==null&&<small>{row.base} base</small>}</div>
      </li>)}
     </ul>
    </div>}
    <aside className="td-ledger">
     <span className="td-index">{done?'8 rounds filed':'Cumulative points'}</span>
     <h4>{done?'Final standings':'Open faces'}</h4>
     {done&&<p role="status" className="td-result-title">{v.leaders.length===1?name(v.leaders[0])+' wins':'Shared lead'}</p>}
     <ol role="list" aria-label={done?'Final standings':'Open faces at the table'}>
      {(done?standing:v.table).map((row,i)=><li key={row.seat}>
       <span className="td-ledger-order">{String(done?standing.findIndex(r=>r.total===row.total)+1:i+1).padStart(2,'0')}</span>
       <span className="td-ledger-name">{activeName(row.seat)}</span>
       {!done&&<span className="td-mini-hand" role="img" aria-label={'Open dice '+row.publicDice.join(', ')}>{row.publicDice.map((value,j)=><DiceFace key={j} value={value}/>)}</span>}
       <strong>{row.total}<small> pts</small></strong>
      </li>)}
     </ol>
    </aside>
   </div>
   <footer className="td-foot"><span>Triple › Straight › Double › High dice</span><span>Fictional points only</span></footer>
  </div>
 </section>
}

const lessonDice=[
 [3,4,5,null],[3,4,5,null],[3,4,null],[3,4,5],[3,4,5],[],
] satisfies (Die|null)[][]
const lessonLabels=['Four dice: two open, one private, one blind','Choose three dice, leaving the private die','Low forecast sealed','Three, four, five make a straight','Three point five base plus three is six point five','Eight rounds: example final standings']

export function TripleDiceLesson({step,embedded=false}:{step:number;embedded?:boolean}){
 const stage=Number.isInteger(step)&&step>=0&&step<diceLessonFrames.length?step:0
 const frame=diceLessonFrames[stage]
 return <figure className="td-lesson" data-dice-example={stage}>
  <div className="td-lesson-draw" key={stage} role="img" aria-label={lessonLabels[stage]}>
   {stage===5?<div className="td-sample-tally"><span>Final ledger</span><b>Ada · 42 pts</b><small>Bo · 37.5 pts</small></div>:<>
    {lessonDice[stage].map((value,i)=><span key={i} data-example-muted={(stage===1&&i===2)||undefined}><DiceFace value={value} kind={value===null?'blind':i===2&&stage<2?'private':'open'}/></span>)}
    {stage===2&&<div className="td-sample-tally"><span>Sealed</span><b>LOW</b></div>}
    {stage===3&&<div className="td-sample-tally"><span>Revealed</span><b>Straight</b></div>}
    {stage===4&&<div className="td-sample-tally"><span>3.5 + 3</span><b>6.5 pts</b></div>}
   </>}
  </div>
  {!embedded&&<figcaption>{frame.caption}</figcaption>}
 </figure>
}
