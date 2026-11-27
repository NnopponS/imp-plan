import {symmetryAxes} from './symmetry'
import {useId,useRef,type CSSProperties,type KeyboardEvent,type ReactNode} from 'react'
import {fragmentCounts,type FragmentCount} from './fragments'
import {episodePokerRoster,humanOnly,isHoldAuction,seatRules,seatCapacity,type Settings,type Snapshot} from './room'
import './table-instruments.css'

type Instrument={value:string;label:string;face?:string;art?:ReactNode;unavailable?:string;description?:string}
type Wire=(settings:Partial<Settings>)=>void

function Choices({name,caption,value,choices,readOnly,choose,dial}:{name:string;caption?:string;value:string;choices:Instrument[];readOnly:boolean;choose:(value:string)=>void;dial?:ReactNode}){
 const label=useId(),nodes=useRef(new Map<string,HTMLButtonElement>())
 const visible=readOnly?choices.filter(c=>c.value===value):choices
 const enabled=visible.filter(c=>!c.unavailable)
 function step(event:KeyboardEvent<HTMLButtonElement>,current:string){
  if(readOnly||!enabled.length)return
  const i=enabled.findIndex(c=>c.value===current)
  const dir=event.key==='ArrowRight'||event.key==='ArrowDown'?1:event.key==='ArrowLeft'||event.key==='ArrowUp'?-1:0
  const next=dir?enabled[(i+enabled.length+dir)%enabled.length]:event.key==='Home'?enabled[0]:event.key==='End'?enabled.at(-1):undefined
  if(!next)return
  event.preventDefault()
  nodes.current.get(next.value)?.focus()
  choose(next.value)
 }
 const tabbable=enabled.some(c=>c.value===value)?value:enabled[0]?.value
 return <section className="instrument" data-dial={!!dial||undefined} role="radiogroup" aria-labelledby={label} aria-disabled={readOnly||undefined}>
  <span id={label} className="instrument-name">{caption?<><span aria-hidden="true">{caption}</span><span className="sr">{name}</span></>:name}</span>
  <div className="instrument-face">
   {!readOnly&&dial}
   <div className="instrument-choices" data-length={visible.length} style={{'--instrument-count':Math.min(visible.length,3)} as CSSProperties}>
    {visible.map(choice=><button type="button" key={choice.value} role="radio" aria-label={choice.label} aria-checked={choice.value===value}
      aria-disabled={readOnly||!!choice.unavailable||undefined} aria-description={choice.unavailable??choice.description} title={choice.unavailable??choice.description}
      tabIndex={!readOnly&&tabbable===choice.value?0:-1}
      ref={node=>{if(node)nodes.current.set(choice.value,node);else nodes.current.delete(choice.value)}}
      onKeyDown={event=>step(event,choice.value)}
      onClick={()=>{if(!readOnly&&!choice.unavailable&&choice.value!==value)choose(choice.value)}}>
      {readOnly&&dial?dial:<>{choice.art}<span className="instrument-choice-label">{choice.face??choice.label}</span></>}
    </button>)}
   </div>
  </div>
 </section>
}

function Clock({numeral,unit,fraction}:{numeral:number;unit:string;fraction:number}){
 return <svg aria-hidden="true" focusable="false" className="instrument-clock" viewBox="0 0 64 64">
  <path d="M24 3h16l3 5H21Z" className="instrument-metal"/>
  <circle cx="32" cy="33" r="27" className="instrument-metal"/>
  <circle cx="32" cy="33" r="23.5" className="instrument-clock-face"/>
  {Array.from({length:12},(_,i)=><path key={i} d={i%3===0?'M32 11V16':'M32 11V14'} transform={`rotate(${i*30} 32 33)`} className="instrument-meter-tick"/>)}
  <path d="M32 10a23 23 0 1 1-.01 0" pathLength="100" strokeDasharray={Math.max(fraction*100,4)+' 100'} className="instrument-meter-sweep"/>
  <text x="32" y="37" className="instrument-clock-number">{numeral}</text>
  <text x="32" y="47" className="instrument-clock-unit">{unit}</text>
 </svg>
}

function Timer({name,caption,seconds,presets,readOnly,minutes=false,config}:{name:string;caption?:string;seconds:number;presets:number[];readOnly:boolean;minutes?:boolean;config:Wire}){
 const ordered=[...new Set([...presets,seconds])].sort((a,b)=>a-b)
 const displayed=(n:number)=>minutes&&n%60===0?n/60:n
 return <Choices name={name} caption={caption} value={String(seconds)} readOnly={readOnly} choose={n=>config({seconds:Number(n)})}
  dial={<Clock numeral={displayed(seconds)} unit={minutes&&seconds%60===0?'MIN':'SEC'} fraction={seconds/ordered.at(-1)!}/>}
  choices={ordered.map(n=>({value:String(n),label:displayed(n)+(minutes&&n%60===0?' minutes':' seconds'),face:displayed(n)+(minutes&&n%60===0?'m':'s')}))}/>
}

function GridMark({side}:{side:number}){
 const l=side+1,d=27/side
 return <svg aria-hidden="true" focusable="false" viewBox="0 0 36 36" className="instrument-mark instrument-grid-mark">
  <rect x="1.5" y="1.5" width="33" height="33" rx="3"/>
  <rect x="4.5" y="4.5" width="27" height="27" rx="1"/>
  {Array.from({length:l-2},(_,i)=><path key={i} d={`M${4.5+d*(i+1)} 4.5v27M4.5 ${4.5+d*(i+1)}h27`}/>)}
  <rect className="instrument-grid-tile" x={4.5+d*Math.floor(side/2)} y={4.5+d*Math.floor(side/2)} width={d} height={d}/>
 </svg>
}

const icons={
 sealed:'M3 9h26v16H3ZM3 9l13 10L29 9m-26 16 8-9m18 9-8-9m-7 4 2-2 2 2-2 2Z',
 hold:'M12 28V18l-4-5q-1-3 2-3l4 4V5a2 2 0 0 1 4 0v8l4 1 3 4-2 10ZM6 5h3m13 0h5m-2-2 2 2-2 2',
 casual:'M4 5h19v14H11l-6 5v-5H4Zm8 7h5m6 0h6v12h-3v4l-5-4h-8v-3',
 strict:'M3 14s6-7 13-7 13 7 13 7-6 7-13 7S3 14 3 14Zm16 0a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM4 27 27 4',
 fan:'M4 20 8 7l11 4m-9 12 1-15 11 1m-8 17V10h13v16Zm3-8 3-4 3 4-3 4Z',
 duel:'M4 6h9v19H4ZM19 6h9v19h-9ZM6 15l2.5-3 2.5 3-2.5 3Zm15 0 2.5-3 2.5 3-2.5 3Zm-5-10v21',
 lock:'M7 14h18v13H7Zm4-1V8a5 5 0 0 1 10 0v5m-5 5v5',
 loop:'M7 8h18v18H7Zm-4 3 4-4 4 4m10 11 4 4 4-4',
 key:'M17 11a6 6 0 1 1 12 0 6 6 0 0 1-12 0Zm3 5-11 11H4v-5l4-4h4v-3h5',
 peek:'M3 16s6-8 13-8 13 8 13 8-6 8-13 8-13-8-13-8Zm17 0a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z',
}
function Mark({name}:{name:keyof typeof icons}){
 return <svg aria-hidden="true" focusable="false" viewBox="0 0 32 32" className="instrument-mark"><path d={icons[name]}/></svg>
}
function Stones({count}:{count:number}){
 return <svg aria-hidden="true" focusable="false" viewBox="0 0 36 29" className="instrument-mark instrument-stones">
  {Array.from({length:count},(_,i)=><g key={i}><path d={`M7 ${22-i*5}v3c0 4 22 4 22 0v-3`}/><ellipse cx="18" cy={22-i*5} rx="11" ry="3.1"/></g>)}
 </svg>
}
function Pips({count}:{count:number}){
 return <svg aria-hidden="true" focusable="false" viewBox="0 0 32 26" className="instrument-mark instrument-pips">
  <path d="M2 3h28v20H2Z"/>
  {Array.from({length:Math.floor(count/4)},(_,i)=><path key={i} d={`M${5+i*4.4} 7v12`}/>)}
 </svg>
}

function Latch({label,face,mark,checked,readOnly,change}:{label:string;face?:string;mark:keyof typeof icons;checked:boolean;readOnly:boolean;change:()=>void}){
 return <button className="instrument-latch" type="button" role="switch" aria-label={label} aria-checked={checked} aria-disabled={readOnly||undefined} tabIndex={readOnly?-1:undefined} onClick={()=>{if(!readOnly)change()}}>
  <Mark name={mark}/><span>{face??label}</span><span className="instrument-latch-track" aria-hidden="true"><i/></span>
 </button>
}

function SeatLimit({snap,readOnly,episode,config}:{snap:Snapshot;readOnly:boolean;episode:boolean;config:Wire}){
 const {min:floor,max,fixtureSize}=seatRules(snap.settings)
 const league=fixtureSize===2&&max>2
 const value=seatCapacity(snap.settings)
 const tournament=league&&value>2
 const min=Math.max(floor,snap.seats.length,tournament?3:0)

 return <section className="instrument instrument-seats" aria-label="Seat limit">
  {league&&<div className="instrument-seat-layout" role="group" aria-label="Table format">
   <button type="button" aria-pressed={!tournament} disabled={readOnly||snap.seats.length>2} onClick={()=>config({capacity:2})}><Mark name="duel"/> Duel</button>
   <button type="button" aria-pressed={tournament} disabled={readOnly} onClick={()=>config({capacity:Math.max(3,snap.seats.length)})}><Mark name="fan"/> Tournament</button>
  </div>}
  <div className="instrument-seat-top">
   <span className="instrument-name">Seat limit</span>
   <div className="instrument-stepper">
    {!readOnly&&!episode&&(!league||tournament)&&<button type="button" aria-label="Decrease seat limit" disabled={value<=min} onClick={()=>config({capacity:value-1})}>−</button>}
    <strong aria-label={value+' seats allowed'}>{value}</strong>
    {!readOnly&&!episode&&(!league||tournament)&&<button type="button" aria-label="Increase seat limit" disabled={value>=max} onClick={()=>config({capacity:value+1})}>+</button>}
   </div>
  </div>
  {tournament&&<small>2 on each board · up to {value*(value-1)} legs</small>}
  <div className="instrument-seat-marks" aria-hidden="true">{Array.from({length:max},(_,i)=>{
   const seat=snap.seats[i]
   return <i key={i} data-mark={seat?(seat.bot?'bot':'occupied'):i<value?'open':'closed'}/>
  })}</div>
 </section>
}

export function TableInstruments({snap,solo,readOnly,config}:{snap:Snapshot;solo:boolean;readOnly:boolean;config:Wire}){
 const s=snap.settings
 const hold=isHoldAuction(s)
 const episode=s.game==='memoryPoker'&&s.memoryPokerMode==='episode'
 const noBots=hold||humanOnly(s.game)
 const hasBots=snap.seats.some(seat=>seat.bot)
 const dualGame=s.game==='divine'||s.game==='knight'
 const gameTimer=s.game==='auction'&&!hold||s.game==='remove'||s.game==='secret'||s.game==='heavy13'||s.game==='wallGo'||s.game==='colorLink'||s.game==='threeRow'
 const switches=[
  ...(s.game==='divine'?[{label:'Deduce the numeral key',face:'Hidden numerals',mark:'key' as const,checked:s.divineHard??false,change:()=>config({divineHard:!s.divineHard})}]:[]),
  ...(s.game==='knight'?[{label:'Closed tour',mark:'loop' as const,checked:s.closed??false,disabled:(s.size??5)===5,change:()=>config({closed:!s.closed})}]:[]),
  ...(s.game==='memoryPoker'&&!episode?[{label:'Allow one-card peek (−1 point)',face:'One-card peek',mark:'peek' as const,checked:s.memoryPokerPeek??false,change:()=>config({memoryPokerPeek:!s.memoryPokerPeek})}]:[]),
  ...(!solo?[{label:'Lock new joins',face:'Lock room',mark:'lock' as const,checked:s.locked,change:()=>config({locked:!s.locked})}]:[]),
 ]
 if(solo&&!dualGame&&!gameTimer&&s.game!=='symmetry'&&s.game!=='fragments'&&noBots&&!switches.length)return null
 return <section className="panel lobby party-settings table-instruments" aria-label="Table settings" data-read-only={readOnly||undefined}>
  <h2 className="party-setting-title">Table settings</h2>
  <div className="instrument-bank">
   {dualGame&&<Choices name={s.game==='divine'?'Square size':'Board size'} value={String(s.game==='divine'?s.divineSide??7:s.size??5)} readOnly={readOnly}
    choices={(s.game==='divine'?[3,5,7]:[5,6,8]).map(n=>({value:String(n),label:n+' × '+n,description:s.game==='divine'&&solo&&n===3?'Starter board':undefined,art:<GridMark side={n}/>}))}
    choose={value=>s.game==='divine'?config({divineSide:Number(value) as 3|5|7}):config({size:Number(value) as 5|6|8,closed:value==='5'?false:s.closed})}/>}
   {s.game==='symmetry'&&<Choices name="Mirror axis" value={s.symmetryAxis??'surprise'} readOnly={readOnly}
    choices={[{value:'surprise',label:'Surprise me',face:'Surprise'},...symmetryAxes.map(axis=>({value:axis,label:axis[0].toUpperCase()+axis.slice(1)}))]}
    choose={value=>config({symmetryAxis:symmetryAxes.find(axis=>axis===value)})}/>}
   {s.game==='divine'&&<Timer name="Time limit" seconds={s.seconds} presets={[120,300,600,900]} readOnly={readOnly} minutes config={config}/>}
   {s.game==='knight'&&<Timer name="Minutes" seconds={s.seconds} presets={[180,240,300,360,420,480]} readOnly={readOnly} minutes config={config}/>}
   {s.game==='auction'&&!solo&&<Choices name="Time Auction mode" caption="Auction mode" value={hold?'hold':'sealed'} readOnly={readOnly} choose={v=>config({auctionMode:v==='hold'?'hold':'sealed'})}
    choices={[{value:'sealed',label:'Sealed bids',face:'Sealed',art:<Mark name="sealed"/>},{value:'hold',label:'Hold & release (episode-inspired)',face:'Hold & release',art:<Mark name="hold"/>,unavailable:hasBots?'Remove bots to use Hold & release.':undefined}]}/>}
   {gameTimer&&<Timer name={s.game==='colorLink'?'Seconds to place or respond':s.game==='secret'?'Seconds per contact round':s.game==='heavy13'?'Seconds per selection or placement':s.game==='threeRow'?'Seconds per turn or ballot':s.game==='wallGo'?'Seconds per turn':'Seconds to submit'}
    caption={s.game==='colorLink'?'Link clock':s.game==='secret'?'Contact clock':s.game==='heavy13'?'Play clock':s.game==='wallGo'||s.game==='threeRow'?'Turn clock':'Submission clock'}
    seconds={s.seconds} presets={s.game==='colorLink'?[15,30,45,60,90]:s.game==='heavy13'?[15,25,45,60,90]:[10,15,25,45,60,90]} readOnly={readOnly} config={config}/>}
   {s.game==='fragments'&&<>
    <Choices name="Questions" value={String(s.fragmentCount??12)} readOnly={readOnly} choose={v=>config({fragmentCount:Number(v) as FragmentCount})}
     choices={fragmentCounts.map(n=>({value:String(n),label:n+' questions',face:String(n),art:<Pips count={n}/>}))}/>
    <Choices name="Memory mode" value={s.fragmentStrict?'strict':'casual'} readOnly={readOnly} choose={v=>config({fragmentStrict:v==='strict'})}
     choices={[{value:'casual',label:'Casual · team discussion',face:'Casual',art:<Mark name="casual"/>},{value:'strict',label:'Strict · no discussion',face:'Strict',art:<Mark name="strict"/>}]}/>
   </>}
   {s.game==='memoryPoker'&&!solo&&<Choices name="Memory Poker mode" caption="Poker mode" value={episode?'episode':'fan'} readOnly={readOnly} choose={v=>config({memoryPokerMode:v==='episode'?'episode':'fan'})}
    choices={[{value:'fan',label:'Fan table',art:<Mark name="fan"/>},{value:'episode',label:'Episode-style duel',face:'Duel',art:<Mark name="duel"/>,unavailable:!episode&&!episodePokerRoster(snap.seats)?'Two connected human players required.':undefined}]}/>}
   {!solo&&<SeatLimit snap={snap} readOnly={readOnly} episode={episode} config={config}/>}
   {!noBots&&<Choices name="Bot difficulty" value={s.botLevel??'normal'} readOnly={readOnly} choose={v=>config({botLevel:v as 'easy'|'normal'|'hard'})}
    choices={[{value:'easy',label:'Easy',art:<Stones count={1}/>},{value:'normal',label:'Standard',art:<Stones count={2}/>},{value:'hard',label:'Hard',art:<Stones count={3}/>}]}/>}
   {switches.length>0&&<div className="instrument-latches">{switches.map(item=><Latch key={item.label} {...item} readOnly={readOnly||!!('disabled'in item&&item.disabled)}/>)}</div>}
  </div>
 </section>
}
