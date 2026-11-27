import {MemoryDuelBoard,MemoryDuelLesson} from './memory-duel-ui'
import {MemoryPokerBoard} from './memory-poker-ui'
import {PieceBoard} from './piece-ui'
import {TowerBoard} from './tower-ui'
import {FenceBoard} from './fence-ui'
import {ScaleBoard} from './scale-ui'
import {SpotBoard} from './spot-ui'
import {FragmentsBoard} from './fragments-ui'
import {fragmentCounts,type FragmentCount} from './fragments'
import {PyramidBoard} from './pyramid-ui'
import {CodeLockBoard} from './code-lock-ui'
import {EquationBoard} from './equations-ui'
import {DivineBoard} from './divine-ui'
import {GrassBoard} from './grass-ui'
import {BaghBoard,SecretBoard} from './season-expansion-ui'
import {total} from './mancala'
import {MancalaBoard} from './mancala-ui'
import {PuzzleBoard} from './puzzle-ui'
import {isPuzzle} from './puzzles'
import React,{useEffect,useRef,useState} from 'react'
import {createRoot} from 'react-dom/client'
import {blindCoverAction,mills,points,reward,titles,tutorials,isDuel,minSeats,type BlindCover,type Game,type GameView} from './engine'
import {defaults,explain,episodePokerRoster,episodePokerRules,humanOnly,nickname,validCode,type Command,type Snapshot} from './room'
import {hostRoom,joinRoom,practice,type SessionState,type ConnectOptions} from './session'
import catalog from './catalog.json'
import {SeasonTwo} from './season-two-ui'
import {Crest,GameArt} from './art'
import {base,brand,currentSeason,seasons,seasonHref} from './brand'
import './style.css'
import './design.css'
import './arena-refresh.css'
import {TableBriefing} from './table-briefing'
import {ChamberScene,CoverTray,InlaidStone,coverNames} from './blind-chamber'
import {GomokuWarmup} from './gomoku-warmup'
import {GameFeedbackControls,useGameFeedback} from './game-feedback'
import './cinematic.css'
const games=Object.keys(titles) as Game[]
const route=()=>{const [page,query]=location.hash.slice(1).split('?');return {page,room:new URLSearchParams(query).get('room')??''}}
const cleanCode=(x:string)=>x.toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,6)
const invite=(code:string)=>location.origin+base+'#/join?room='+code
const exact=(v:number)=>new Intl.NumberFormat('en',{maximumFractionDigits:2}).format(v)
const mark=(i:number)=>i===0?'●':'◆'
function App(){
 const startRoute=route()
 const [code,setCode]=useState(cleanCode(startRoute.room))
 const [name,setName]=useState(()=>{try{const stored=JSON.parse(sessionStorage.getItem('arena-resume-'+startRoute.room)??'null');return typeof stored?.name==='string'?stored.name:''}catch{return ''}})
 const [room,setRoom]=useState('')
 const [kind,setKind]=useState<'host'|'join'|'solo'|null>(null)
 const [state,setState]=useState<SessionState>({phase:'offline',snapshot:null,error:''})
 const feedback=useGameFeedback(state)
 const [notice,setNotice]=useState('')
 const [ice,setIce]=useState('')
 const selected=currentSeason()
 const [season,setSeason]=useState(selected?String(selected.id):'all')
 const [search,setSearch]=useState('')
 const [galleryQuery,setGalleryQuery]=useState('')
 const [briefing,setBriefing]=useState<'preview'|'start'|null>(null)
 const [filter,setFilter]=useState(false)
 const [chat,setChat]=useState('')
 const [pendingEntry,setPendingEntry]=useState<'solo'|'join'|'host'|null>(null)
 const [privateGame,setPrivateGame]=useState<Game>('blind')
 const [page,setPage]=useState(startRoute.page)
 const matchHeading=useRef<HTMLHeadingElement>(null)
 const sig=useRef(0)
 const didAuto=useRef(false)
 const session=useRef<{send:(c:Command)=>void;close:()=>void}|null>(null)
 const submitEntry=pendingEntry??(page==='/join'?'join':'host')
 const snap=state.snapshot
 const matchOpen=!!snap?.game
 useEffect(()=>{
  if(!matchOpen||!briefing)return
  setBriefing(null)
  matchHeading.current?.focus()
 },[matchOpen,briefing])
 function connect(type:'host'|'join'|'solo',game=privateGame){
  const n=nickname(name)
  if(!n){setPendingEntry(type);if(type==='solo')setPrivateGame(game);setNotice('Enter a nickname of 1–24 visible characters.');document.getElementById('nickname')?.focus();return}
  if(type==='join'&&!validCode(code)){setNotice('Enter the six-character invite code.');return}
  const options:ConnectOptions={}
  if(ice.trim()){
   const urls=ice.trim().split(/\s+/)
   if(urls.length>4||urls.some(x=>!/^stuns?:[\w.:[\]-]+$/i.test(x))){setNotice('Enter up to four STUN URLs, such as stun:example.net:3478.');return}
   options.iceServers=urls.map(urls=>({urls}))
  }
  const attempt=++sig.current
  session.current?.close();session.current=null
  setPendingEntry(null);setNotice('');setKind(type);setState({phase:'connecting',snapshot:null,error:''});setRoom(type==='join'?code:'')
  const listen=(v:SessionState)=>{if(attempt===sig.current)setState(v)}
  if(type==='solo'){
   session.current=practice(n,listen)
   if(game!=='blind')session.current.send({kind:'config',settings:{...defaults,game}})
  }else if(type==='join'){
   location.hash='/join?room='+code
   session.current=joinRoom(code,n,listen,options)
  }else{
   void hostRoom(n,listen,options).then(s=>{
    if(attempt!==sig.current){s.close();return}
    session.current=s;setRoom(s.code)
   }).catch(()=>listen({phase:'offline',snapshot:null,error:'Couldn’t open signaling. Check your connection, retry, or try solo practice.'}))
  }
 }
 useEffect(()=>{
  const handler=()=>{const v=route();setPage(v.page);if(v.room){setCode(cleanCode(v.room));setPendingEntry(null)}}
  window.addEventListener('hashchange',handler)
  if(!didAuto.current&&startRoute.page==='/join'&&name&&validCode(code)){didAuto.current=true;connect('join')}
  return ()=>window.removeEventListener('hashchange',handler)
 },[])
 function leave(){
  ++sig.current;session.current?.close();session.current=null
  if(room)try{sessionStorage.removeItem('arena-resume-'+room)}catch{/* storage unavailable */}
  setBriefing(null);setKind(null);setRoom('');setState({phase:'offline',snapshot:null,error:''});setNotice('');location.hash='/'
 }
 const command=(c:Command)=>{setNotice('');session.current?.send(c)}
 const host=snap?.host===snap?.you
 const nameOf=(id:string)=>snap?.seats.find(s=>s.id===id)?.name??'Unknown'
 const playable=games.filter(g=>!selected||catalog.some(c=>c.game===g&&c.season===selected.id))
 const shown=playable.filter(g=>{const row=catalog.find(c=>c.game===g);return [titles[g],row?.genre,row?.id].join(' ').toLowerCase().includes(galleryQuery.trim().toLowerCase())})
 const episodePoker=snap?.settings.game==='memoryPoker'&&snap.settings.memoryPokerMode==='episode'
 const episodeRoster=!!snap&&kind!=='solo'&&episodePokerRoster(snap.seats)
 const canStart=!!snap&&host&&state.phase==='online'&&(!episodePoker||episodeRoster)&&snap.seats.length>=minSeats(snap.settings.game)&&snap.seats.every(s=>s.online&&s.ready&&(!s.bot||!humanOnly(snap.settings.game)))
 const count=(n:number)=>catalog.filter(x=>x.season===n).length
 const numberPlayable=(n:number)=>catalog.filter(x=>x.season===n&&x.game).length
 const rows=catalog.filter(g=>(season==='all'||String(g.season)===season)&&(!filter||g.game)&&[g.title,g.genre,g.category,g.id].join(' ').toLowerCase().includes(search.toLowerCase()))
 const finished=snap?.game?.done
 return <>
  <header className="bar"><div className="wrap top">
   <a className="brand" href={base} onClick={e=>{if(kind)e.preventDefault()}}><Crest/><span>{brand}<small>Unofficial fan project</small></span></a>
   {!kind&&<nav className="topright season-nav" aria-label="Seasons">{seasons.map(x=><a key={x.id} href={seasonHref(x.id)} aria-current={selected?.id===x.id?'page':undefined}>Season {x.id}</a>)}</nav>}
   <span className="pill alpha-pill">Playable alpha</span>
  </div></header>
  <main className="wrap">
  {!kind?<><section className={'front-desk'+(selected?' season-desk':'')+(page==='/join'?' invite-desk':'')}>
   <div className="front-copy">
    {selected&&<p className="eyebrow">Season {selected.id} · {selected.year}</p>}
    <h1>{selected?selected.title:page==='/join'?'Join a game':'Imp Plan'}</h1>
    <p>{selected?numberPlayable(selected.id)+' playable games and '+count(selected.id)+' indexed challenges.':page==='/join'?'Enter a nickname and your friend’s room code.':'Strategy games inspired by The Devil’s Plan. Play solo or invite friends.'}</p>
    {page!=='/join'&&<div className="front-actions"><a className="primary front-cta" href="#play">Browse games <span aria-hidden="true">↓</span></a><a className="front-cta" href="#room-entry">Create or join a room</a></div>}
   </div>
   {!selected&&page!=='/join'&&<GomokuWarmup practice={()=>connect('solo','blind')}/>}
   <form id="room-entry" className="panel entrance" onSubmit={e=>{e.preventDefault();connect(submitEntry)}}>
    <h2>{submitEntry==='solo'?'Practice '+titles[privateGame]:page==='/join'?'Join a party':'Start or join a game'}</h2>
    <div className="entry-identity"><label htmlFor="nickname">Nickname</label><input id="nickname" autoComplete="off" placeholder="e.g. Night Owl" value={name} onChange={e=>setName(e.target.value)} maxLength={160} required/></div>
    {(page!=='/join'||submitEntry==='solo')&&<button className="primary" type={submitEntry==='join'?'button':'submit'} onClick={submitEntry==='join'?()=>connect('host'):undefined}>{submitEntry==='solo'?'Start practice':'Create party'} <span className="arrow-text" aria-hidden="true">↗︎</span></button>}
    <div className="join-line"><div><label htmlFor="invite">Invite code</label><input id="invite" autoCapitalize="characters" spellCheck={false} value={code} onChange={e=>setCode(cleanCode(e.target.value))} placeholder="ABC234" maxLength={6}/></div><button type={submitEntry==='join'?'submit':'button'} onClick={submitEntry==='join'?undefined:()=>connect('join')}>Join party</button></div>
    {submitEntry==='solo'?<button type="button" className="plain" onClick={()=>connect('host')}>Create party</button>:<button type="button" className="plain" onClick={()=>connect('solo')}>Solo practice</button>}
    <details><summary>Connection options</summary><p>For an online room, signaling is provided by PeerJS, with Google STUN for network discovery by default. Peers can learn network information; some networks can’t connect directly.</p><label htmlFor="ice">Custom STUN URLs (optional)</label><input id="ice" value={ice} onChange={e=>setIce(e.target.value)} placeholder="stun:example.net:3478"/></details>
    {notice&&<p role="alert" className="error">{notice}</p>}
   </form>
  </section>
  {!selected&&<section className="season-directory"><div className="section-head"><div><h2>Browse by season</h2></div><p>{catalog.length} indexed challenges</p></div><div className="season-cards">{seasons.map(x=><a key={x.id} className={'season-card '+x.tone} href={seasonHref(x.id)}><span className="season-sigil" aria-hidden="true">{x.roman}</span><div><p className="eyebrow">SEASON {x.id}</p><h3>{x.title}</h3><small>{numberPlayable(x.id)} playable · {count(x.id)} indexed</small></div><span className="season-arrow" aria-hidden="true">↗︎</span></a>)}</div></section>}
  <section className="featured" id="play"><div className="section-head"><div><h2>{selected?'Play this season':'Pick a game'}</h2></div><p>{playable.length} playable {playable.length===1?'fan adaptation':'fan adaptations'}</p></div>
  <div className="gallery-tools"><label htmlFor="gallery-search">Find playable games</label><input id="gallery-search" type="search" value={galleryQuery} onChange={e=>setGalleryQuery(e.target.value)} placeholder="Try a title or mechanic" /></div>
  {shown.length===0&&<p role="status" className="gallery-empty">No playable games match this search.</p>}
  <div className="cards">{shown.map(g=>{const entry=catalog.find(x=>x.game===g);return <article className="card" key={g}><GameArt mode={g}/><div><p className="game-caption">{entry?'S'+entry.season+' · '+entry.genre:'Fan rules'}</p><h3>{titles[g]}</h3><p>{tutorials[g].split('. ')[0]}.</p><button type="button" onClick={()=>connect('solo',g)}>Practice <span className="sr">{titles[g]}</span><span aria-hidden="true"> ↗︎</span></button><details><summary>Rules</summary><p>{tutorials[g]}</p></details></div></article>})}</div>
  </section>
  <section id="catalog" className="index"><div className="section-head"><div><p className="eyebrow">{selected?'SEASON '+selected.roman:'SEASONS I–III'}</p><h2>Challenge index</h2></div><p>{selected?count(selected.id):catalog.length} entries, including variants.</p></div>
  <div className="filters"><label>Search<input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Find a game or mechanic"/></label>{!selected&&<label>Season<select value={season} onChange={e=>setSeason(e.target.value)}><option value="all">All seasons</option><option value="1">Season 1</option><option value="2">Season 2</option><option value="3">Season 3</option></select></label>}<label className="check"><input type="checkbox" checked={filter} onChange={e=>setFilter(e.target.checked)}/> Playable only</label></div>
  <div className="directory">{rows.map(g=><article key={g.id}><span className="mono">{g.id}</span><div><strong>{g.title}</strong><br/><small>{g.category} · {g.genre}</small></div><span className={'pill '+(g.game?'live':'')}>{g.game?'Fan mode':g.original==='unaired'?'Unaired · planned':'Planned'}</span></article>)}</div>{!rows.length&&<p>No matching entries.</p>}</section></>
  :<section className="room" data-layout={snap?.game?.game==='blind'?'chamber':undefined}>
   <div className="section-head"><div><p className="eyebrow">{kind==='solo'?'OFFLINE PRACTICE':'PRIVATE PARTY'}</p><h1 ref={matchHeading} tabIndex={snap?.game?-1:undefined}>{snap?.game?titles[snap.game.game]:kind==='solo'?'Practice lobby':'Party room'}</h1></div><div className="room-controls"><GameFeedbackControls feedback={feedback}/><button onClick={leave}>Leave room</button></div></div>
   {room&&<div className="invite"><span>Invite code <strong data-testid="room-code">{room}</strong></span><button onClick={()=>{void navigator.clipboard.writeText(invite(room)).then(()=>setNotice('Invite copied.')).catch(()=>setNotice('Copy this invite: '+invite(room)))}}>Copy invite</button></div>}
   <p role="status" className="notice">{state.phase==='connecting'?'Connecting…':state.phase==='offline'?'Disconnected.':notice||''}</p>
   {state.error&&<p role="alert" className="error">{state.error}</p>}
   {state.phase==='offline'&&<div className="actions"><button onClick={()=>connect(kind)}>Retry</button><button onClick={()=>connect('solo')}>Solo practice</button></div>}
   {snap&&<div className="room-grid"><div>
    {!snap.game?<section className="panel lobby"><h2>Set the table</h2>
     <label>Game<select value={snap.settings.game} disabled={!host} onChange={e=>command({kind:'config',settings:{...snap.settings,game:e.target.value as Game}})}>{games.map(g=><option value={g} key={g}>{titles[g]}</option>)}</select></label>
     {(snap.settings.game==='auction'||snap.settings.game==='remove'||snap.settings.game==='secret')&&<label>{snap.settings.game==='secret'?'Seconds per contact round':'Seconds to submit'}<select value={snap.settings.seconds} disabled={!host} onChange={e=>command({kind:'config',settings:{...snap.settings,seconds:Number(e.target.value)}})}>{[10,15,25,45,60,90].map(n=><option key={n}>{n}</option>)}</select></label>}
     {snap.settings.game==='fragments'&&<div className="actions">
      <label>Questions<select value={snap.settings.fragmentCount??12} disabled={!host} onChange={e=>command({kind:'config',settings:{...snap.settings,fragmentCount:Number(e.target.value) as FragmentCount}})}>{fragmentCounts.map(n=><option key={n}>{n}</option>)}</select></label>
      <label>Memory mode<select value={snap.settings.fragmentStrict?'strict':'casual'} disabled={!host} onChange={e=>command({kind:'config',settings:{...snap.settings,fragmentStrict:e.target.value==='strict'}})}><option value="casual">Casual · team discussion</option><option value="strict">Strict · no discussion</option></select></label>
     </div>}
     {snap.settings.game==='divine'&&<div className="actions">
      <label>Square size<select value={snap.settings.divineSide??7} disabled={!host} onChange={e=>command({kind:'config',settings:{...snap.settings,divineSide:Number(e.target.value) as 3|5|7}})}>{[3,5,7].map(n=><option key={n} value={n}>{n} × {n}</option>)}</select></label>
      <label>Time limit<select value={snap.settings.seconds} disabled={!host} onChange={e=>command({kind:'config',settings:{...snap.settings,seconds:Number(e.target.value)}})}>{[120,300,600,900].map(n=><option key={n} value={n}>{n/60} minutes</option>)}</select></label>
      <label className="check"><input type="checkbox" checked={snap.settings.divineHard??false} disabled={!host} onChange={e=>command({kind:'config',settings:{...snap.settings,divineHard:e.target.checked}})}/> Deduce the numeral key</label>
     </div>}
     {snap.settings.game==='knight'&&<div className="actions"><label>Board size<select disabled={!host} value={snap.settings.size??5} onChange={e=>command({kind:'config',settings:{...snap.settings,size:Number(e.target.value) as 5|6|8,closed:Number(e.target.value)===5?false:snap.settings.closed}})}>{[5,6,8].map(n=><option key={n} value={n}>{n} × {n}</option>)}</select></label><label>Minutes<select disabled={!host} value={snap.settings.seconds/60} onChange={e=>command({kind:'config',settings:{...snap.settings,seconds:Number(e.target.value)*60}})}>{[3,4,5,6,7,8].map(n=><option key={n}>{n}</option>)}</select></label><label className="check"><input type="checkbox" disabled={!host||(snap.settings.size??5)===5} checked={snap.settings.closed??false} onChange={e=>command({kind:'config',settings:{...snap.settings,closed:e.target.checked}})}/> Closed tour</label></div>}
     {kind!=='solo'&&<div className="actions"><label>Seat limit<select value={episodePoker?2:snap.settings.capacity} disabled={!host||episodePoker} onChange={e=>command({kind:'config',settings:{...snap.settings,capacity:Number(e.target.value)}})}>{Array.from({length:snap.settings.game==='mancala'?7:15},(_,i)=>i+2).filter(n=>n>=snap.seats.length).map(n=><option key={n}>{n}</option>)}</select></label><label className="check"><input type="checkbox" disabled={!host} checked={snap.settings.locked} onChange={e=>command({kind:'config',settings:{...snap.settings,locked:e.target.checked}})}/> Lock new joins</label></div>}
     {snap.settings.game==='memoryPoker'&&kind!=='solo'&&<label>Memory Poker mode<select value={episodePoker?'episode':'fan'} disabled={!host} onChange={e=>command({kind:'config',settings:{...snap.settings,memoryPokerMode:e.target.value==='episode'?'episode':'fan'}})}><option value="fan">Fan table</option><option value="episode" disabled={!episodeRoster&&!episodePoker}>Episode-style duel</option></select>{!episodeRoster&&<small>Episode-style duel needs two connected human players.</small>}</label>}
     {snap.settings.game==='memoryPoker'&&!episodePoker&&<label className="check"><input type="checkbox" checked={snap.settings.memoryPokerPeek??false} disabled={!host} onChange={e=>command({kind:'config',settings:{...snap.settings,memoryPokerPeek:e.target.checked}})}/> Allow one-card peek (−1 point)</label>}
     {!humanOnly(snap.settings.game)&&<label className="bot-level">Bot difficulty<select value={snap.settings.botLevel??'normal'} disabled={!host} onChange={e=>command({kind:'config',settings:{...snap.settings,botLevel:e.target.value as 'easy'|'normal'|'hard'}})}><option value="easy">Easy</option><option value="normal">Standard</option><option value="hard">Hard</option></select><small>Changes how bots choose their moves.</small></label>}
     <p>{episodePoker?'Two players, one shared grid. The first stronger hand wins.':explain(snap.settings.game,snap.seats.length)}</p><details><summary>{episodePoker?'Episode-style rules':'Fan rules'}</summary><p>{episodePoker?episodePokerRules:tutorials[snap.settings.game]}</p></details>
     <div className="actions">{host?<><button className="primary" disabled={!canStart} onClick={()=>setBriefing('start')}>Start match</button><button disabled={snap.seats.length>=snap.settings.capacity||humanOnly(snap.settings.game)} onClick={()=>command({kind:'bot'})}>Add bot</button></>:<><button type="button" onClick={()=>setBriefing('preview')}>Preview rules</button><button className="primary" disabled={state.phase!=='online'} onClick={()=>command({kind:'ready'})}>{snap.seats.find(s=>s.id===snap.you)?.ready?'Unready':'Ready up'}</button></>}</div>
    </section>:<section className="panel match">
     <p className="eyebrow">{snap.game.memoryDuel?'EPISODE-STYLE DUEL · FAN RECREATION':'FAN MODE'}{!(snap.game.grass||snap.game.game==='exile'||snap.game.divine||snap.game.codeLock||snap.game.pyramid||snap.game.fragments||snap.game.spot||snap.game.scale||snap.game.fence||snap.game.tower||snap.game.piece||snap.game.memoryPoker||snap.game.memoryDuel)&&' · Round '+(snap.fixture+1)+' of '+snap.count}</p>
     <h2>{snap.game.memoryDuel?(finished?snap.game.winner?nameOf(snap.game.winner)+' wins':'No winner':'Head-to-head'):snap.game.memoryPoker?(finished?snap.game.seats.length===1?'Practice complete':snap.game.winner?nameOf(snap.game.winner)+' wins':'Shared result':'Memory Poker table'):snap.game.piece?(finished?snap.game.piece.score.adjustedMs===null?'Puzzle closed':'Silhouette complete':'Fill the silhouette'):snap.game.tower?(finished?snap.game.tower.score.passed?'Tower cleared':'Tower closed':'Build the word tower'):snap.game.fence?(finished?snap.game.seats.length===1?'Practice complete':snap.game.winner?nameOf(snap.game.winner)+' wins':'Shared result':'Build one closed loop'):snap.game.scale?(finished?snap.game.scale.score===5?'Weights solved':'Scale challenge complete':'Balance the minerals'):snap.game.fragments?(finished?snap.game.fragments.passed?'Exhibit cleared':'Exhibit not cleared':'Recall together'):finished?((isPuzzle(snap.game.game)||snap.game.codeLock||snap.game.pyramid||snap.game.spot)&&snap.game.seats.length===1?'Practice complete':snap.game.winner?nameOf(snap.game.winner)+' wins':'Shared result'):snap.game.game==='auction'?'Submit in secret':snap.game.game==='remove'?'Lowest unique card wins':snap.game.game==='knight'?'Trace your tour':isPuzzle(snap.game.game)||snap.game.game==='secret'||snap.game.grass||snap.game.divine||snap.game.codeLock||snap.game.pyramid||snap.game.spot?titles[snap.game.game]:!snap.game.seats.includes(snap.you)?'Watching this leg':snap.game.turn===snap.you?'Your turn':nameOf(snap.game.turn)+'’s turn'}</h2>
     {isDuel(snap.game.game)&&snap.game.game!=='bagh'&&!snap.game.equations&&<p className="versus">{snap.game.seats.map((s,i)=><span key={s}>{mark(i)} {nameOf(s)}{snap.game?.game==='point'?' · '+exact(snap.game.scores[i])+' pts':''}</span>)}</p>}
      {snap.game.memoryDuel?<MemoryDuelBoard key={snap.match+':'+snap.game.memoryDuel.dealNumber} snap={snap} name={nameOf} active={state.phase==='online'} submit={(a,deal)=>command({kind:'memory-lock',action:a,deal})}/>:snap.game.memoryPoker?<MemoryPokerBoard key={snap.match+':'+snap.game.round} snap={snap} name={nameOf} active={state.phase==='online'} submit={a=>command({kind:'move',action:a,round:snap.game?.round})}/>:snap.game.piece?<PieceBoard key={snap.match} snap={snap} name={nameOf} active={state.phase==='online'} submit={a=>command({kind:'move',action:a})}/>:snap.game.tower?<TowerBoard key={snap.match+':'+snap.game.round} snap={snap} name={nameOf} active={state.phase==='online'} submit={a=>command({kind:'move',action:a})}/>:snap.game.fence?<FenceBoard key={snap.match} snap={snap} name={nameOf} active={state.phase==='online'} submit={a=>command({kind:'move',action:a,round:snap.game?.round})}/>:snap.game.scale?<ScaleBoard key={snap.match} snap={snap} name={nameOf} active={state.phase==='online'} submit={a=>command({kind:'move',action:a,round:snap.game?.round})}/>:snap.game.spot?<SpotBoard key={snap.match} snap={snap} name={nameOf} active={state.phase==='online'} submit={a=>command({kind:'move',action:a,round:snap.game?.round})}/>:snap.game.fragments?<FragmentsBoard key={snap.match} snap={snap} name={nameOf} active={state.phase==='online'} submit={a=>command({kind:'move',action:a,round:snap.game?.round})}/>:snap.game.pyramid?<PyramidBoard key={snap.match+':'+snap.game.round} snap={snap} name={nameOf} active={state.phase==='online'} submit={a=>command({kind:'move',action:a,round:snap.game?.round})}/>:snap.game.codeLock?<CodeLockBoard key={snap.match} snap={snap} name={nameOf} active={state.phase==='online'} submit={a=>command({kind:'move',action:a,round:snap.game?.round})}/>:snap.game.equations?<EquationBoard key={snap.match} snap={snap} name={nameOf} active={state.phase==='online'} submit={a=>command({kind:'move',action:a})}/>:snap.game.divine?<DivineBoard key={snap.match} snap={snap} active={state.phase==='online'} submit={a=>command({kind:'move',action:a,round:snap.game?.round})}/>:snap.game.grass?<GrassBoard key={snap.match+':'+snap.game.round+':'+snap.game.turn} g={snap.game} you={snap.you} name={nameOf} active={state.phase==='online'} submit={a=>command({kind:'move',action:a})}/>:snap.game.game==='bagh'?<BaghBoard key={snap.match} g={snap.game} you={snap.you} active={state.phase==='online'} submit={a=>command({kind:'move',action:a})}/>:snap.game.game==='secret'?<SecretBoard key={snap.match+':'+snap.game.round} snap={snap} active={state.phase==='online'} name={nameOf} submit={a=>command({kind:'move',action:a,round:snap.game?.round})}/>:snap.game.game==='auction'?<Auction key={snap.match} snap={snap} active={state.phase==='online'} submit={a=>command({kind:'move',action:a,round:snap.game?.round})}/>:isPuzzle(snap.game.game)?<PuzzleBoard key={snap.match+':'+snap.game.round+':'+snap.game.puzzle?.stage} snap={snap} active={state.phase==='online'} name={nameOf} submit={a=>command({kind:'move',action:a,round:snap.game?.round})}/>:snap.game.game==='mancala'?<MancalaBoard key={snap.match+':'+snap.game.mancala?.placements+':'+snap.game.mancala?.sows} g={snap.game} you={snap.you} active={state.phase==='online'} name={nameOf} submit={a=>command({kind:'move',action:a})}/>:!isDuel(snap.game.game)?<SeasonTwo key={snap.match} snap={snap} active={state.phase==='online'} name={nameOf} submit={a=>command({kind:'move',action:a,round:snap.game?.round})}/>:<Board key={snap.match} v={snap.game} name={nameOf} active={state.phase==='online'} submit={a=>command({kind:'move',action:a})}/>}
     <details><summary>How to play</summary><p>{snap.game.memoryDuel?episodePokerRules:tutorials[snap.game.game]}</p></details>
     {finished&&<><Results snap={snap} name={nameOf}/><div className="actions"><button onClick={()=>exportMatch(snap)}>Export result</button>{host&&<button className="primary" onClick={()=>command({kind:'next'})}>{snap.seriesDone?'Rematch':'Next leg'}</button>}</div></>}
     {host&&<button className="plain" disabled={state.phase!=='online'} onClick={()=>{if(finished||window.confirm('End this match and return to the lobby?'))command({kind:'lobby'})}}>Return to lobby</button>}
    </section>}
   </div><aside><section className="panel roster"><h2>Seats <small>{snap.seats.length}/{episodePoker?2:snap.settings.capacity}</small></h2>{snap.seats.map((s,i)=><div key={s.id} className="seat"><span className="avatar">{s.bot?'◈':i+1}</span><div><strong>{s.name}</strong><small>{s.id===snap.host?'Host':s.bot?'Bot':!s.online?'Offline':s.ready?'Ready':'Not ready'} · Seat {i+1}</small></div>{host&&s.id!==snap.host&&!snap.game&&<button aria-label={'Remove '+s.name+' from seat '+(i+1)} onClick={()=>command({kind:'kick',seat:s.id})}>×</button>}</div>)}</section>
   {snap.game?.game==='blind'&&<ChamberScene game={snap.game} practice={kind==='solo'}/>}
   {kind!=='solo'&&(!snap.game?.fragments?.strict||snap.game.done)&&<section className="panel chat"><h2>Table talk</h2><div className="messages" role="log">{snap.chat.length?snap.chat.map((m,i)=><p key={i}><strong>{m.name}:</strong> {m.text}</p>):<p>No messages yet.</p>}</div><form onSubmit={e=>{e.preventDefault();if(chat.trim()){command({kind:'chat',text:chat});setChat('')}}}><input aria-label="Message" value={chat} onChange={e=>setChat(e.target.value)} maxLength={240} placeholder="Say something"/><button disabled={state.phase!=='online'||!chat.trim()}>Send</button></form></section>}</aside></div>}
  </section>}
   {briefing&&snap&&!snap.game&&<TableBriefing key={snap.settings.game+':'+episodePoker} game={snap.settings.game} seats={snap.seats} caption={episodePoker?'Two duelists. The grid is read together; each pair is locked privately.':explain(snap.settings.game,snap.seats.length)} variant={episodePoker?{label:'Episode-style duel',rules:episodePokerRules,demo:step=><MemoryDuelLesson step={step}/>} :undefined} close={()=>setBriefing(null)} start={briefing==='start'&&host?{enabled:canStart,confirm:()=>command({kind:'start'})}:undefined}/>}
  </main>
  <footer className="wrap footer"><strong>{brand}</strong><span>Fan-made and not affiliated with Netflix. No real stakes.</span></footer>
 </>
}
function Board({v,name,active,submit}:{v:GameView,name:(s:string)=>string,active:boolean,submit:(a:number|{from:number,to:number})=>void}){
 const blind=v.game==='blind'
 const [cover,setCover]=useState<BlindCover|null>(null)
 const place=(i:number)=>submit(blind&&cover!==null?blindCoverAction(i,cover):i)
 const [from,setFrom]=useState<number|null>(null)
 const [focus,setFocus]=useState(0)
 const [row,setRow]=useState(0)
 const [column,setColumn]=useState(0)
 const refs=useRef<Array<HTMLButtonElement|null>>([])
 const linear=v.game!=='morris'
 const size=v.game==='point'?13:15
 function cell(i:number){
  const value=v.board[i]
  const tile=v.blindCovers?.[i]
  const canFrom=v.legal.some(a=>typeof a==='object'&&a.from===i)
  const canPlace=v.legal.includes(i)
  const canTo=v.legal.some(a=>typeof a==='object'&&a.from===from&&a.to===i)
  const can=active&&(canPlace||canFrom||canTo)
  const label=(linear?'Row '+(Math.floor(i/size)+1)+', column '+(i%size+1):'Point '+(i+1))+', '+(!value?'open':value==='?'?'veiled':name(value))
  const [x,y]=points[i]??[0,0]
  return <button type="button" key={i} style={linear?{}:{left:(7+x*(86/6))+'%',top:(7+y*(86/6))+'%'}} ref={el=>{refs.current[i]=el}} tabIndex={i===focus?0:-1} aria-label={label} aria-description={blind&&value==='?'&&typeof tile==='number'?coverNames[tile]+' cover. Side hidden.':undefined} data-star={blind&&[48,56,112,168,176].includes(i)||undefined} aria-disabled={!can} aria-pressed={from===i}
   className={'cell '+(value==='?'?'veil':value?'color'+v.seats.indexOf(value):'')+(can?' legal':'')}
   onFocus={()=>setFocus(i)} onKeyDown={e=>{
    const nav:Record<string,number>={ArrowRight:1,ArrowLeft:-1,ArrowUp:linear?-size:-1,ArrowDown:linear?size:1}
    if(!(e.key in nav))return
    e.preventDefault();const next=Math.max(0,Math.min(v.board.length-1,i+nav[e.key]));refs.current[next]?.focus()
   }}
   onClick={()=>{if(!can)return;if(canPlace){place(i);setFrom(null)}else if(canTo&&from!==null){submit({from,to:i});setFrom(null)}else if(canFrom)setFrom(from===i?null:i)}}>
   {blind&&<span className="chamber-star" aria-hidden="true"/>}
   {blind&&typeof tile==='number'?<InlaidStone key={value} cover={tile} side={v.done?(value===v.seats[0]?0:1):undefined}/>:<span className={value?'placed-piece':undefined} key={value} aria-hidden="true">{value==='?'?'●':value?mark(v.seats.indexOf(value)):''}</span>}
  </button>
 }
 return <><p className="board-hint">{v.capture?'Mill formed. Choose an opposing stone to remove.':blind?'The cover is visible. The stone’s side stays hidden until the result.':'Use the arrow keys to inspect points and Enter to play.'}</p>{blind&&!v.done&&<CoverTray choice={cover} setChoice={setCover} disabled={!active||!v.legal.length}/>}<div className={'board '+(blind?'gomoku chamber-grid':linear?'gomoku':'morris-board')} style={linear?{gridTemplateColumns:'repeat('+size+',1fr)',gridTemplateRows:'repeat('+size+',1fr)'}:{}} aria-label={titles[v.game]+' board'}>
 {linear?null:<svg viewBox="0 0 100 100" aria-hidden="true">{mills.map((m,i)=><line key={i} x1={7+points[m[0]][0]*86/6} y1={7+points[m[0]][1]*86/6} x2={7+points[m[2]][0]*86/6} y2={7+points[m[2]][1]*86/6}/>)}</svg>}
 {v.board.map((_,i)=>cell(i))}</div>{linear&&!v.done&&<details><summary>Place by coordinates</summary><div className="actions"><label>Row<select value={row} onChange={e=>setRow(Number(e.target.value))}>{Array.from({length:size},(_,i)=><option key={i} value={i}>{i+1}</option>)}</select></label><label>Column<select value={column} onChange={e=>setColumn(Number(e.target.value))}>{Array.from({length:size},(_,i)=><option key={i} value={i}>{i+1}</option>)}</select></label><button disabled={!active||!v.legal.includes(row*size+column)} onClick={()=>place(row*size+column)}>Place stone</button></div></details>}</>
}
function Auction({snap,active,submit}:{snap:Snapshot,active:boolean,submit:(v:number)=>void}){
 const g=snap.game!
 const [bid,setBid]=useState('1')
 const [now,setNow]=useState(Date.now())
 const offset=useRef(0)
 useEffect(()=>{offset.current=snap.hostNow-Date.now()},[snap])
 useEffect(()=>{const i=setInterval(()=>setNow(Date.now()),120);return()=>clearInterval(i)},[])
 const own=g.seats.indexOf(snap.you),max=Math.min(15000,g.credits[own]??0)
 const ms=Math.round(Number(bid)*1000)
 const locked=g.mine!==null
 return <div className="auction">
  <div className="auction-top"><strong>Sealed round {g.round} / 8</strong><span className="pill">{reward(g.round)} points</span><span className="mono">{g.done?'Closed':Math.max(0,Math.ceil(((g.deadline??now)-now-offset.current)/1000))+' s'}</span></div>
  {!g.done&&<><p>Your bank: <strong>{exact((g.credits[own]??0)/1000)} s</strong> · {g.submitted}/{g.seats.length} locked</p>
  {locked?<p role="status">Your bid is locked: {exact(g.mine!/1000)} s</p>:<form className="actions" onSubmit={e=>{e.preventDefault();if(Number.isInteger(ms)&&ms>=0&&ms<=max)submit(ms)}}><label>Bid (seconds)<input type="number" step="0.001" min="0" max={max/1000} value={bid} onChange={e=>setBid(e.target.value)} required/></label><button className="primary" disabled={!active||!bid||ms<0||ms>max}>Lock bid</button><button type="button" disabled={!active} onClick={()=>submit(0)}>Pass</button></form>}</>}
  <div className="scores">{g.seats.map((s,i)=><div key={s}><span>{snap.seats.find(x=>x.id===s)?.name}</span><strong>{exact(g.scores[i])} pts</strong>{g.last&&<small>Last bid {exact(g.last[i]/1000)} s</small>}</div>)}</div>
 </div>
}
function Results({snap,name}:{snap:Snapshot,name:(s:string)=>string}){
 if(snap.game?.game==='auction'||snap.fixtures.length<2||!snap.seriesDone)return null
 const scores=snap.seats.map(s=>({id:s.id,played:0,points:0}))
 for(const f of snap.fixtures)for(const s of scores)if(f.sides.includes(s.id)){s.played++;if(f.winner===s.id)s.points++;else if(!f.winner)s.points+=0.5}
 scores.sort((a,b)=>b.points/b.played-a.points/a.played)
 return <section className="scores"><h3>League standings</h3>{scores.map(s=><div key={s.id}><span>{name(s.id)}</span><strong>{exact(s.points/s.played)} pts / leg</strong></div>)}</section>
}
function exportMatch(snap:Snapshot){
 const g=snap.game
 if(!g?.done)return
 const seats=Object.fromEntries(snap.seats.map(s=>[s.id,s.name]))
 const out={game:titles[g.game],rules:g.memoryDuel?'memory-poker-episode-duel-1':'fan-alpha-1',...(g.memoryDuel?{deal:g.memoryDuel.dealNumber,outcome:g.memoryDuel.result?.kind}:{}),...(g.piece?{team:{...g.piece.score,clues:g.piece.hints}}:{}),...(g.tower?{team:{...g.tower.score,maximum:g.tower.columns.length}}:{}),...(g.scale?{team:{score:g.scale.score,maximum:5,weighings:g.scale.log.length}}:{}),...(g.fragments?{team:{correct:g.fragments.correct,total:g.fragments.total,passed:g.fragments.passed,strict:g.fragments.strict}}:{}),winner:g.winner?seats[g.winner]:null,fixtures:snap.fixtures.slice(0,snap.fixture+1).map(f=>({seats:f.sides.map(s=>seats[s]),winner:f.winner?seats[f.winner]:null})),scores:!isDuel(g.game)?g.seats.map((s,i)=>({name:seats[s],points:g.scores[i],...(g.fence?.results?{solvedSeconds:(g.fence.results.find(r=>r.id===s)?.elapsed??null)===null?null:g.fence.results.find(r=>r.id===s)!.elapsed!/1000}:{}),...(g.spot?.results?.[s]?{adjustedSeconds:g.spot.results[s][1]/1000}:{}),...(g.mancala?{colorScores:g.mancala.points[i],total:total(g.mancala.points[i])}:{}),...(g.game==='auction'?{timeBank:g.credits[i]/1000}:{})})):undefined}
 const url=URL.createObjectURL(new Blob([JSON.stringify(out,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='mind-arena-result.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)
}
createRoot(document.getElementById('root')!).render(<App/>)
