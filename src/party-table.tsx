import {PlayerPortrait} from './player-wardrobe'
import {useEffect,useId,useLayoutEffect,useRef,useState,type ReactNode,type CSSProperties} from 'react'
import {CardMark,GameDetailsDialog,GameRulePreview} from './game-details'
import {useCardPress} from './card-press'
import {GameVenue} from './game-identity'
import {gameSearchKey} from './game-search'
import {GameArt} from './art'
import {seasons} from './brand'
import catalog from './catalog.json'
import {titles,type Game} from './engine'
import {makeMancala,pitType,plant,sow} from './mancala'
import {seatRules,type Settings,type Snapshot} from './room'
import './party-table.css'

const gallery=catalog.flatMap(row=>row.game&&Object.hasOwn(titles,row.game)?[{...row,game:row.game as Game}]:[])
const forGame=new Map(gallery.map(row=>[row.game,row]))
export function PartyGlyph({kind}:{kind:'cards'|'eye'|'invite'|'bot'|'host'|'person'|'open'|'check'|'chat'}){
 const paths={
  cards:'M7 3H20V17H7ZM4 7H2V21H16V20M10 7h7m-7 4h5',
  eye:'M2 12s4-6 10-6 10 6 10 6-4 6-10 6-10-6-10-6Zm13 0a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z',
  invite:'M2 9l5-5h12l3 3v3a2 2 0 0 0 0 4v3l-3 3H7L2 15v-2a1 1 0 0 0 0-2Zm9-2v2m0 2v2m0 2v2',
  bot:'M6 6H18L21 9V17L18 20H6L3 17V9ZM12 6V2M8 11h1m6 0h1M8 16h8',
  host:'M3 7l5 4 4-6 4 6 5-4-2 11H5ZM6 21h12',
  person:'M16 8a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM4 21v-2a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v2',
  open:'M12 6v12M6 12h12',
  check:'m5 12 4 4 10-9',
  chat:'M3 4h18v13h-9l-5 4v-4H3ZM7 9h10m-10 4h7',
 }
 return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false"><path d={paths[kind]}/></svg>
}

// A legal two-seat diagram, independent of any live state: eight placements, then a two-stone sow.
const mancalaDemo=[0,4,0,5,3,5,6,7].reduce((g,pit,i)=>plant(g,pit,i%2)!,makeMancala(2))
const mancalaResult=sow(mancalaDemo,0,0)!
function MancalaStill(){
 const colors=['#ab6561','#668baf','#7caa92','#dab479','#bc96b6']
 return <svg className="party-mancala" viewBox="0 0 180 106" role="img" aria-label="Example Mancala sow" data-game-preview="mancala">
  <ellipse cx="90" cy="53" rx="78" ry="45" fill="#362a21" stroke="#a98358"/>
  <ellipse cx="90" cy="53" rx="53" ry="28" fill="none" stroke="#765739" strokeDasharray="1 3"/>
  <path d="M97 23Q125 20 143 43m-14-3 14 3-2-11" fill="none" stroke="#f6cc87" strokeWidth="1.6"/>
  <path d="M74 48H105L110 53 105 59H74L69 53Z" fill="#281b17" stroke="#7b5b41"/>
  <text x="90" y="56" textAnchor="middle" fontSize="8.4" fill="#f6d49e" letterSpacing="1.3">SOW</text>
  {mancalaResult.pits.map((stones,i)=>{
   const angle=i/9*Math.PI*2-Math.PI/2
   const color=colors[pitType(i,9)]
   const x=90+Math.cos(angle)*64,y=53+Math.sin(angle)*34
   return <g key={i} transform={`translate(${x} ${y})`}>
    <ellipse rx="11.5" ry="8.8" fill="#211915" stroke={color} strokeWidth={i===2?2:1}/>
    {i===2&&<ellipse rx="14" ry="11" fill="none" stroke="#ffdda2" strokeWidth=".85" strokeDasharray="1.75 1.75"/>}
    {stones.map((owner,j)=><circle key={j} className={i===1||i===2?'party-preview-stone':undefined} style={i===1||i===2?{'--sow-x':90-x+'px','--sow-y':19-y+'px','--sow-delay':i*245+'ms'} as CSSProperties:undefined} cx={(j-(stones.length-1)/2)*6} cy="0" r="2.65" fill={owner===0?'#f3d7a0':'#a87487'} stroke={owner===0?'#fff2d4':'#e6abb7'} strokeWidth=".55"/>)}
    {i===0&&<circle r="2" fill="none" stroke="#e9bd7d"/>}
   </g>
  })}
 </svg>
}
function TimingStill(){
 return <svg className="party-mancala" viewBox="0 0 180 106" role="img" aria-label="Example: releasing an eight-second qualifying hold" data-game-preview="auction">
  <path d="M17 32h146v43H17Z" fill="#362a21" stroke="#a98358"/>
  <path d="M28 63h124" stroke="#cdb18c" strokeWidth=".8"/>
  <path className="party-preview-meter" d="M28 63h82" stroke="#f6cc87" strokeWidth="4"/>
  <path d="M79 54v18" stroke="#b3c6ad" strokeWidth="1.5"/>
  <circle cx="110" cy="63" r="6" fill="#e8c68b" stroke="#fff1c4"/>
  <text x="28" y="51" fontSize="10" fill="#e6c69b">0</text>
  <text x="79" y="48" fontSize="10" fill="#b3c6ad" textAnchor="middle">5 s</text>
  <text x="110" y="85" fontSize="10" fill="#f6d49e" textAnchor="middle">8 s</text>
 </svg>
}
function MemoryDuelStill(){
 return <svg className="party-mancala" viewBox="0 0 180 106" role="img" aria-label="Episode Memory Poker: two private picks plus three shared cards" data-game-preview="memoryPoker">
  {Array.from({length:16},(_,i)=>{
   const selected=i===5||i===10
   return <g key={i} transform={`translate(${26+i%4*18} ${22+Math.floor(i/4)*17})`}>
    <rect width="14" height="14" rx="1.8" fill={selected?'#b88950':'#513633'} className={selected?'party-preview-pick':undefined} style={selected?{'--pick-delay':i*80+'ms'} as CSSProperties:undefined} stroke={selected?'#f8d898':'#997751'}/>
    <text x="7" y="10" fontSize="8" textAnchor="middle" fill={selected?'#281a15':'#f0daba'}>{String.fromCharCode(65+i)}</text>
   </g>
  })}
  {['10','J','Q'].map((card,i)=><g key={card} transform={`translate(${103+i*18} 41)`}><rect width="16" height="24" rx="2" fill="#f6e4b8" stroke="#a98358"/><text x="8" y="16" fontSize="10" textAnchor="middle" fill="#47281f">{card}</text></g>)}
 </svg>
}

type Variant='hold'|'episode'
export function PartyMechanicPreview({game,variant,motionOff}:{game:Game;variant?:Variant;motionOff?:boolean}){
 const illustration=variant==='hold'?<TimingStill/>:variant==='episode'?<MemoryDuelStill/>:game==='mancala'?<MancalaStill/>:undefined
 return <GameRulePreview game={game} motionOff={motionOff} illustration={illustration}/>
}
type PartyTableProps={game:Game;settings:Settings;practice?:boolean;variant?:Variant;canChoose:boolean;online:boolean;motionOff?:boolean;error:string;choose:(game:Game)=>void;preview:()=>void}
export function PartyTable({game,settings,practice,variant,canChoose,online,motionOff,error,choose,preview}:PartyTableProps){
 const row=forGame.get(game)
 const trigger=useRef<HTMLButtonElement>(null)
 const [open,setOpen]=useState(false)
 const tableTrigger=useRef<HTMLButtonElement>(null)
 const [sample,setSample]=useState(false)
 useEffect(()=>{setSample(false)},[game])
 useEffect(()=>{if(!online||!canChoose)setOpen(false)},[online,canChoose])
 const {min,max,fixtureSize}=seatRules({game,memoryPokerMode:variant==='episode'?'episode':undefined,auctionMode:variant==='hold'?'hold':undefined},practice)
 const seats=min===max?String(min):min+'–'+max
 const people=variant==='episode'||variant==='hold'?seats+' humans':fixtureSize&&max>2?'2 per board · up to '+max+' in a tournament':seats+' players'
 return <section className="party-table" aria-label="Current table" data-party-game={game} data-chapter={row?.season}>
  <div className="party-cover">
   <GameArt mode={game} motionOff={motionOff}/>
   <span className="party-chapter">{row?'SEASON '+row.season:'FAN TABLE'}</span>
   <button className="party-cover-preview" type="button" aria-haspopup="dialog" aria-label="Preview the table" title="Preview the table" ref={tableTrigger} onClick={()=>setSample(true)}><CardMark kind="inspect"/><span>Preview</span></button>
  </div>
  <div className="party-ident">
   <div aria-live="polite" aria-atomic="true">
    <p className="eyebrow">{practice?'PRACTICE TABLE':canChoose?'AT THE TABLE':'HOST’S PICK'}</p>
    <h2>{titles[game]}</h2>
    {!practice&&<p className="party-game-meta">{variant==='hold'?'Hold & release':variant==='episode'?'Episode-style duel':row?.genre}<span aria-hidden="true"> · </span>{people}</p>}
   </div>
   <div className="party-pick-actions">
    {canChoose&&<button type="button" className="party-choose" aria-haspopup="dialog" ref={trigger} disabled={!online} onClick={()=>setOpen(true)}><PartyGlyph kind="cards"/> Choose game</button>}
    <button type="button" aria-haspopup="dialog" onClick={preview}><PartyGlyph kind="eye"/> Details</button>
   </div>
  </div>
  {sample&&<GameDetailsDialog compact game={game} settings={settings} motionOff={motionOff} source={row?.sources[0]} context={row&&<GameVenue entry={row}/>}
   illustration={variant==='hold'?<TimingStill/>:variant==='episode'?<MemoryDuelStill/>:undefined}
   close={()=>setSample(false)} restore={()=>tableTrigger.current?.focus({preventScroll:true})}/>}
  {open&&canChoose&&online&&<PartyPicker selected={game} motionOff={motionOff} error={error} choose={choose} close={()=>setOpen(false)} restore={()=>trigger.current?.focus({preventScroll:true})}/>}
 </section>
}

function PartyPicker({selected,motionOff,choose,close,restore,error}:{selected:Game;motionOff?:boolean;choose:(g:Game)=>void;close:()=>void;restore:()=>void;error:string}){
 const modal=useRef<HTMLDialogElement>(null)
 const search=useRef<HTMLInputElement>(null)
 const title=useId()
 const restoreFocus=useRef(restore)
 const [query,setQuery]=useState('')
 const [chapter,setChapter]=useState<number|null>(null)
 const [requested,setRequested]=useState<Game|null>(null)
 const needle=gameSearchKey(query)
 const results=gallery.filter(g=>(!chapter||g.season===chapter)&&gameSearchKey(`${titles[g.game]} ${g.title} ${g.genre} ${g.id}`).includes(needle))
 useLayoutEffect(()=>{
  const el=modal.current
  el?.showModal()
  search.current?.focus({preventScroll:true})
  return ()=>{el?.close();restoreFocus.current()}
 },[])
 useEffect(()=>{if(requested&&requested===selected)close()},[requested,selected,close])
 return <dialog ref={modal} className="party-picker" aria-labelledby={title} onCancel={e=>{e.preventDefault();close()}}>
  <div className="party-picker-rail"><header className="party-picker-head">
   <div><p className="eyebrow">THE GAME SHELF</p><h2 id={title}>Choose a game</h2></div>
   <button type="button" onClick={close} aria-label="Close game picker">Close</button>
  </header>
  <div className="party-picker-tools">
   <input type="search" ref={search} value={query} onChange={e=>setQuery(e.target.value)} aria-label="Find a game" placeholder="Find a game or genre" onKeyDown={e=>{if(e.key==='Escape'){e.preventDefault();close()}}}/>
   <div className="party-chapters" aria-label="Filter by season" role="group">
    <button type="button" aria-pressed={chapter===null} onClick={()=>setChapter(null)}>All</button>
    {seasons.map(s=><button type="button" key={s.id} aria-pressed={chapter===s.id} onClick={()=>setChapter(s.id)}>Season {s.id}</button>)}
   </div>
   <p className="party-results" role="status">{results.length===0?'No games match.':results.length+' '+(results.length===1?'game':'games')}</p>
   {requested&&error&&selected!==requested&&<p className="error" role="alert">{error}</p>}
  </div></div>
  <ul className="party-cards">
   {results.map(row=><li key={row.game}><PartyChoiceCard row={row} current={row.game===selected} motionOff={motionOff} select={()=>{
    if(row.game===selected){close();return}
    setRequested(row.game)
    choose(row.game)
   }}/></li>)}
  </ul>
 </dialog>
}

function PartyChoiceCard({row,current,motionOff,select}:{row:typeof gallery[number];current:boolean;motionOff?:boolean;select:()=>void}){
 const [sheet,setSheet]=useState<'cover'|'details'|null>(null)
 const card=useRef<HTMLButtonElement>(null)
 const details=useRef<HTMLButtonElement>(null)
 const press=useCardPress(select,()=>setSheet('cover'))
 const close=()=>setSheet(null)
 return <div className="party-card" data-current={current||undefined}>
  <button {...press} type="button" className="party-card-pick" data-game-choice={row.game} ref={card} aria-pressed={current}>
   <GameArt mode={row.game} motionOff={motionOff}/>
   <span className="party-card-caption">
    <strong>{titles[row.game]}</strong><span className="party-card-stamp" aria-label={current?'At the table':'Season '+row.season}>{current?<PartyGlyph kind="check"/>:['','Ⅰ','Ⅱ','Ⅲ'][row.season]}</span>
   </span>
  </button>
  <div className="party-card-links"><button type="button" className="game-details-trigger" ref={details} onClick={()=>setSheet('details')} aria-label={'Details for '+titles[row.game]} title="Details" aria-haspopup="dialog"><CardMark kind="inspect"/></button></div>
  {sheet&&<GameDetailsDialog game={row.game} motionOff={motionOff} source={row.sources[0]} context={<GameVenue entry={row}/>}
   compact={sheet==='cover'} action={{verb:'Choose',run:()=>{close();select()}}} close={close}
   restore={()=> (sheet==='cover'?card:details).current?.focus({preventScroll:true})}/>}
 </div>
}

export function PartyRoster({snap,capacity,canRemove,online,remove}:{snap:Snapshot;capacity:number;canRemove:boolean;online:boolean;remove:(id:string)=>void}){
 const heading=useId()
 const vacant=Math.max(0,capacity-snap.seats.length)
 const occupied=snap.seats.filter(seat=>!seat.bot).length
 return <section className="panel roster party-roster" aria-labelledby={heading}>
  <header><div><p className="eyebrow">THE ROSTER</p><h2 id={heading}>Seats</h2></div><strong className="party-count">{snap.seats.length}/{capacity}<span className="sr"> occupied</span></strong></header>
  <div className="party-seating-marks" aria-hidden="true">{Array.from({length:capacity},(_,i)=>{
   const seat=snap.seats[i]
   return <span key={i} data-seat-marker={seat?(seat.bot?'bot':!seat.online?'offline':seat.ready?'ready':'waiting'):'open'} />
  })}</div>
  <ul>
   {snap.seats.map((s,i)=>{
    const isHost=s.id===snap.host
    const state=!s.online?'offline':s.bot?'bot':s.ready?'ready':'waiting'
    const label=!s.online?'Offline':s.bot?(s.ready?'Bot ready':'Bot'):s.ready?'Ready':'Not ready'
    return <li key={s.id} className="seat party-seat" data-seat-state={state} data-seat-look={s.appearance}>
     <span className="avatar">{s.appearance===undefined?<PartyGlyph kind={isHost?'host':s.bot?'bot':'person'}/>:<PlayerPortrait look={s.appearance} decorative/>}</span>
     <div><strong>{s.name}</strong><small>{isHost?'Host · ':''}Seat {i+1}{s.id===snap.you?' · You':''}</small></div>
     <span className="party-seat-status">{label}</span>
     {canRemove&&!isHost&&<button type="button" disabled={!online} aria-label={'Remove '+s.name+' from seat '+(i+1)} onClick={()=>remove(s.id)}>×</button>}
    </li>
   })}
  </ul>
  <p className="party-open-seats"><PartyGlyph kind="open"/> {vacant?vacant+' open '+(vacant===1?'seat':'seats'):'Table full'} <span>· {occupied} {occupied===1?'human':'humans'}{snap.seats.length>occupied?' · '+(snap.seats.length-occupied)+' '+(snap.seats.length-occupied===1?'bot':'bots'):''}</span></p>
 </section>
}

export function PartyActionBar({note,children}:{note?:string;children:ReactNode}){
 return <div className="party-action-bar"><div className="party-main-actions">{children}</div>{note&&<p>{note}</p>}</div>
}
