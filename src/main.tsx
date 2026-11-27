import {MontageBoard,MontageLesson,montagePracticeRules,montageSource} from './montage-ui'
import {WallGoBoard} from './wall-go-ui'
import {MemoryDuelBoard,MemoryDuelLesson} from './memory-duel-ui'
import {total} from './mancala'
import {isPuzzle} from './puzzles'
import React,{Suspense,lazy,useEffect,useLayoutEffect,useRef,useState} from 'react'
import {createRoot} from 'react-dom/client'
import {mills,points,reward,titles,tutorials,isDuel,minSeats,type Game,type GameView} from './engine'
import {defaults,explain,episodePokerRoster,episodePokerRules,holdAuctionRules,isHoldAuction,humanOnly,nickname,validCode,type Command,type Snapshot} from './room'
import {hostRoom,joinRoom,practice,type SessionState,type ConnectOptions,type Session} from './session'
import catalog from './catalog.json'
import {GameArt} from './art'
import {GameDetails} from './game-details'
import {gameSearchKey} from './game-search'
import {GameCardIdentity,GameVenue} from './game-identity'
import {getGameVenue} from './game-venues'
import {BrandSeal} from './brand-seal'
import {CodexEntry} from './codex-entry'
import {base,brand,currentSeason,seasons,seasonHref} from './brand'
import './style.css'
import './design.css'
import './arena-refresh.css'
import {TableBriefing} from './table-briefing'
import {BlindMatchStage,ChamberGlyph} from './blind-match'
import {getPlayerLook,PlayerPortrait,PlayerWardrobe} from './player-wardrobe'
import {GameFeedbackControls,useGameFeedback} from './game-feedback'
import './cinematic.css'
import './library.css'
import {ChapterArt,LandingMark,LandingPainting} from './landing-art'
import './landing-art.css'
import './room-stage.css'
import './codex.css'
import {ChapterBookmarks,ChallengeFolio,EntryNameplate,EntryInviteTag,FolioMark,useFolioFilters} from './folio-controls'
import {PartyActionBar,PartyGlyph,PartyMechanicPreview,PartyRoster,PartyTable} from './party-table'
import {TableInstruments} from './table-instruments'
import {BoardViewport} from './board-viewport'
import {LeagueStandings,MatchRecord,PointScores,ReturnToLobby,RoundHeading} from './match-record'
import {useOfflinePractice} from './offline-practice'
import {loadTable,TableLoadBoundary} from './lazy-table'
const loadHeavy13=()=>loadTable(()=>import('./heavy-13-ui'))
const Heavy13Board=lazy(()=>loadHeavy13().then(m=>({default:m.Heavy13Board})))
const Heavy13Lesson=lazy(()=>loadHeavy13().then(m=>({default:m.Heavy13Lesson})))
const loadTimeHold=()=>loadTable(()=>import('./time-hold-ui'))
const TimeHoldBoard=lazy(()=>loadTimeHold().then(module=>({default:module.TimeHoldBoard})))
// Rules remain synchronous. Load board graphics only after a game is selected.
const loadMemoryPokerBoard=()=>loadTable(()=>import('./memory-poker-ui'))
const MemoryPokerBoard=lazy(()=>loadMemoryPokerBoard().then(m=>({default:m.MemoryPokerBoard})))
const loadPieceBoard=()=>loadTable(()=>import('./piece-ui'))
const PieceBoard=lazy(()=>loadPieceBoard().then(m=>({default:m.PieceBoard})))
const loadTowerBoard=()=>loadTable(()=>import('./tower-ui'))
const TowerBoard=lazy(()=>loadTowerBoard().then(m=>({default:m.TowerBoard})))
const loadFenceBoard=()=>loadTable(()=>import('./fence-ui'))
const FenceBoard=lazy(()=>loadFenceBoard().then(m=>({default:m.FenceBoard})))
const loadScaleBoard=()=>loadTable(()=>import('./scale-ui'))
const ScaleBoard=lazy(()=>loadScaleBoard().then(m=>({default:m.ScaleBoard})))
const loadSpotBoard=()=>loadTable(()=>import('./spot-ui'))
const SpotBoard=lazy(()=>loadSpotBoard().then(m=>({default:m.SpotBoard})))
const loadFragmentsBoard=()=>loadTable(()=>import('./fragments-ui'))
const FragmentsBoard=lazy(()=>loadFragmentsBoard().then(m=>({default:m.FragmentsBoard})))
const loadPyramidBoard=()=>loadTable(()=>import('./pyramid-ui'))
const PyramidBoard=lazy(()=>loadPyramidBoard().then(m=>({default:m.PyramidBoard})))
const loadCodeLockBoard=()=>loadTable(()=>import('./code-lock-ui'))
const CodeLockBoard=lazy(()=>loadCodeLockBoard().then(m=>({default:m.CodeLockBoard})))
const loadEquationBoard=()=>loadTable(()=>import('./equations-ui'))
const EquationBoard=lazy(()=>loadEquationBoard().then(m=>({default:m.EquationBoard})))
const loadDivineBoard=()=>loadTable(()=>import('./divine-ui'))
const DivineBoard=lazy(()=>loadDivineBoard().then(m=>({default:m.DivineBoard})))
const loadGrassBoard=()=>loadTable(()=>import('./grass-ui'))
const GrassBoard=lazy(()=>loadGrassBoard().then(m=>({default:m.GrassBoard})))
const loadBaghBoard=()=>loadTable(()=>import('./season-expansion-ui'))
const BaghBoard=lazy(()=>loadBaghBoard().then(m=>({default:m.BaghBoard})))
const SecretBoard=lazy(()=>loadBaghBoard().then(m=>({default:m.SecretBoard})))
const loadMancalaBoard=()=>loadTable(()=>import('./mancala-ui'))
const MancalaBoard=lazy(()=>loadMancalaBoard().then(m=>({default:m.MancalaBoard})))
const loadMorrisBoard=()=>loadTable(()=>import('./morris-ui'))
const MorrisBoard=lazy(()=>loadMorrisBoard().then(m=>({default:m.MorrisBoard})))
const loadPuzzleBoard=()=>loadTable(()=>import('./puzzle-ui'))
const PuzzleBoard=lazy(()=>loadPuzzleBoard().then(m=>({default:m.PuzzleBoard})))
const loadSeasonTwo=()=>loadTable(()=>import('./season-two-ui'))
const SeasonTwo=lazy(()=>loadSeasonTwo().then(m=>({default:m.SeasonTwo})))
const boardWarmers:Partial<Record<Game,()=>Promise<unknown>>>={
 memoryPoker:loadMemoryPokerBoard,
 piece:loadPieceBoard,
 tower:loadTowerBoard,
 fence:loadFenceBoard,
 scale:loadScaleBoard,
 spot:loadSpotBoard,
 fragments:loadFragmentsBoard,
 pyramid:loadPyramidBoard,
 codeLock:loadCodeLockBoard,
 equations:loadEquationBoard,
 divine:loadDivineBoard,
 grass1:loadGrassBoard,grass3:loadGrassBoard,
 bagh:loadBaghBoard,secret:loadBaghBoard,
 mancala:loadMancalaBoard,
 morris:loadMorrisBoard,
 hex:loadPuzzleBoard,rectangles:loadPuzzleBoard,cubes:loadPuzzleBoard,exile:loadPuzzleBoard,
 remove:loadSeasonTwo,knight:loadSeasonTwo,
}
const games=Object.keys(titles) as Game[]
const catalogGame=new Map(catalog.filter(row=>row.game).map(row=>[row.game,row]))
const route=()=>{const [page,query]=location.hash.slice(1).split('?');return {page,room:new URLSearchParams(query).get('room')??''}}
const cleanCode=(x:string)=>x.toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,6)
const invite=(code:string)=>location.origin+base+'#/join?room='+code
const joinStatus={signaling:'Contacting signaling…',peer:'Opening a direct connection…',snapshot:'Waiting for the host’s room state…'} as const
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
 const offlinePractice=useOfflinePractice()
 const [notice,setNotice]=useState('')
 const [inviteCopy,setInviteCopy]=useState<'copied'|'manual'|null>(null)
 const inviteInput=useRef<HTMLInputElement>(null)
 const [ice,setIce]=useState('')
 const selected=currentSeason()
 const [galleryQuery,setGalleryQuery]=useState('')
 const folioFilters=useFolioFilters()
 const [briefing,setBriefing]=useState<'preview'|'start'|null>(null)
 const [chat,setChat]=useState('')
 const [pendingEntry,setPendingEntry]=useState<'join'|'host'|null>(null)
 const [page,setPage]=useState(startRoute.page)
 const matchHeading=useRef<HTMLHeadingElement>(null)
 const practiceOrigin=useRef<{top:number,launcher:string,catalogOpen:boolean,entering:boolean}|null>(null)
 const sig=useRef(0)
 const didAuto=useRef(false)
 const session=useRef<Session|null>(null)
 const submitEntry=pendingEntry??(page==='/join'?'join':'host')
 const snap=state.snapshot
 const matchOpen=!!snap?.game
 const practiceLobby=kind==='solo'&&!!snap&&!matchOpen
 useLayoutEffect(()=>{
  const origin=practiceOrigin.current
  if(!origin)return
  if(practiceLobby&&origin.entering){
   origin.entering=false
   matchHeading.current?.focus({preventScroll:true})
   window.scrollTo(0,0)
  }else if(!kind){
   practiceOrigin.current=null
   if(origin.catalogOpen)document.getElementById('catalog')?.setAttribute('open','')
   if(origin.launcher)document.getElementById(origin.launcher)?.focus({preventScroll:true})
   window.scrollTo(0,origin.top)
  }
 },[kind,practiceLobby])
 useEffect(()=>{
  if(!matchOpen||!briefing)return
  setBriefing(null)
  matchHeading.current?.focus()
 },[matchOpen,briefing])
 function connect(type:'host'|'join'|'solo',game:Game='blind',launcher=''){
  const wardrobeLook=getPlayerLook()
  const options:ConnectOptions={appearance:wardrobeLook??undefined}
  let onlineName=''
  if(type!=='solo'){
   const n=nickname(name)
   if(!n){setPendingEntry(type);setNotice('Enter a nickname of 1–24 visible characters.');document.getElementById('nickname')?.focus();return}
   onlineName=n
   if(type==='join'&&!validCode(code)){setNotice('Enter the six-character invite code.');return}
   if(ice.trim()){
    const urls=ice.trim().split(/\s+/)
    if(urls.length>4||urls.some(x=>!/^stuns?:[\w.:[\]-]+$/i.test(x))){setNotice('Enter up to four STUN URLs, such as stun:example.net:3478.');return}
    options.iceServers=urls.map(urls=>({urls}))
   }
  }
  if(type==='solo'&&!kind)practiceOrigin.current={top:window.scrollY,launcher,catalogOpen:!!document.getElementById('catalog')?.hasAttribute('open'),entering:true}
  const attempt=++sig.current
  session.current?.close();session.current=null
  setPendingEntry(null);setNotice('');setInviteCopy(null);setKind(type);setState({phase:'connecting',snapshot:null,error:''});setRoom(type==='join'?code:'')
  const listen=(v:SessionState)=>{if(attempt===sig.current)setState(v)}
  if(type==='solo'){
   session.current=practice(listen,options.appearance)
   if(game!=='blind')session.current.send({kind:'config',settings:{...defaults,game}})
  }else if(type==='join'){
   location.hash='/join?room='+code
   session.current=joinRoom(code,onlineName,listen,options)
  }else{
   void hostRoom(onlineName,listen,options).then(s=>{
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
  setBriefing(null);setKind(null);setRoom('');setState({phase:'offline',snapshot:null,error:''});setNotice('');setInviteCopy(null);if(!practiceOrigin.current)location.hash='/'
 }
 useEffect(()=>{if(inviteCopy==='manual'){inviteInput.current?.focus();inviteInput.current?.select()}},[inviteCopy])
 async function copyInvite(){
  const attempt=sig.current
  try{
   await navigator.clipboard.writeText(invite(room))
   if(attempt===sig.current)setInviteCopy('copied')
  }catch{
   if(attempt!==sig.current)return
   if(inviteCopy==='manual'){inviteInput.current?.focus();inviteInput.current?.select()}
   setInviteCopy('manual')
  }
 }
 const command=(c:Command)=>{setNotice('');session.current?.send(c)}
 const host=snap?.host===snap?.you
 const nameOf=(id:string)=>snap?.seats.find(s=>s.id===id)?.name??'Unknown'
 const playable=games.filter(g=>!selected||catalog.some(c=>c.game===g&&c.season===selected.id))
 const galleryNeedle=gameSearchKey(galleryQuery)
 const shown=playable.filter(g=>{
  const row=catalogGame.get(g),venue=row&&getGameVenue(row)
  return gameSearchKey([titles[g],row?.title,row?.genre,row?.id,venue?.label,venue?.caption].join(' ')).includes(galleryNeedle)
 })
 const choice=snap?.settings.game
 useEffect(()=>{if(choice)void boardWarmers[choice]?.().catch(()=>{})},[choice])
 const holdAuction=!!snap&&isHoldAuction(snap.settings)
 useEffect(()=>{if(holdAuction)void loadTimeHold().catch(()=>{})},[holdAuction])
 const botBlocked=!!snap&&(holdAuction||humanOnly(snap.settings.game))
 const episodePoker=snap?.settings.game==='memoryPoker'&&snap.settings.memoryPokerMode==='episode'
 const episodeRoster=!!snap&&kind!=='solo'&&episodePokerRoster(snap.seats)
 const heavyTable=snap?.settings.game==='heavy13'
 useEffect(()=>{if(heavyTable)void loadHeavy13().catch(()=>{})},[heavyTable])
 const montagePractice=snap?.settings.game==='montage'&&kind==='solo'
 const canStart=!!snap&&host&&state.phase==='online'&&(!episodePoker||episodeRoster)&&snap.seats.length>=minSeats(snap.settings.game,kind==='solo')&&snap.seats.every(s=>s.online&&s.ready&&(!s.bot||!botBlocked))
 const partyLobby=kind!=='solo'&&!!snap&&!snap.game
 const youReady=snap?.seats.find(s=>s.id===snap.you)?.ready
 const missingSeats=snap?Math.max(0,minSeats(snap.settings.game)-snap.seats.length):0
 const waitingSeats=snap?.seats.filter(s=>s.online&&!s.ready).length??0
 const partyNote=state.phase!=='online'?'Waiting for a connection.':!host?(youReady?'Ready. Waiting for the host.':'Ready up when you’re set.'):canStart?'The table is ready.':
  episodePoker&&!episodeRoster?'Episode-style duel needs two connected humans.':botBlocked&&snap?.seats.some(s=>s.bot)?'Remove bots to play this game.':
  missingSeats?'Add '+missingSeats+' more '+(missingSeats===1?'player.':'players.'):snap?.seats.some(s=>!s.online)?'Wait for offline players to reconnect or remove their seats.':
  'Waiting for '+waitingSeats+' '+(waitingSeats===1?'player':'players')+' to ready up.'
 const count=(n:number)=>catalog.filter(x=>x.season===n).length
 const numberPlayable=(n:number)=>catalog.filter(x=>x.season===n&&x.game).length
 const seasonLibrary=page==='/join'?undefined:selected
 const isLanding=!kind&&!selected&&page!=='/join'
 const openCatalog=()=>document.getElementById('catalog')?.setAttribute('open','')
 const roomEntry=(
   <form id="room-entry" tabIndex={-1} className="panel entrance entry-ticket-form" onSubmit={e=>{e.preventDefault();connect(submitEntry)}}>
    <h2><FolioMark kind={page==='/join'?'invite':'create'}/>{page==='/join'?'Join a party':'Start or join a game'}</h2>
    <EntryNameplate><label htmlFor="nickname">Nickname</label><input id="nickname" autoComplete="off" placeholder="e.g. Ash" value={name} onChange={e=>setName(e.target.value)} maxLength={160} required/></EntryNameplate>
    {page!=='/join'&&<button className="primary entry-create" type={submitEntry==='join'?'button':'submit'} onClick={submitEntry==='join'?()=>connect('host'):undefined}><FolioMark kind="create"/>Create party<FolioMark kind="arrow"/></button>}
    <div className="join-line"><EntryInviteTag><label htmlFor="invite">Invite code</label><input id="invite" autoCapitalize="characters" spellCheck={false} value={code} onChange={e=>setCode(cleanCode(e.target.value))} placeholder="ABC234" maxLength={6}/></EntryInviteTag><button className="entry-join" type={submitEntry==='join'?'submit':'button'} onClick={submitEntry==='join'?undefined:()=>connect('join')}><FolioMark kind="join"/>Join party</button></div>
    <button type="button" className="plain" id="practice-entry" onClick={e=>connect('solo','blind',e.currentTarget.id)}><FolioMark kind="play"/>Solo practice</button>
    <details className="entry-connection"><summary><FolioMark kind="settings"/>Connection options</summary><p>For an online room, signaling is provided by PeerJS, with Google STUN for network discovery by default. Peers can learn network information; some networks can’t connect directly.</p><label htmlFor="ice">Custom STUN URLs (optional)</label><input id="ice" value={ice} onChange={e=>setIce(e.target.value)} placeholder="stun:example.net:3478"/></details>
    {offlinePractice&&<small className="practice-availability" role="status">{offlinePractice==='ready'?'Ready for offline practice.':offlinePractice==='saving'?'Saving games for offline practice… Keep this page open.':offlinePractice==='updating'?'This release isn’t ready for offline play. Finish any open games, then close all Imp Plan tabs and reopen online.':'Offline files aren’t saved. Open or reload this page with an internet connection.'}</small>}
    {notice&&<p role="alert" className="error">{notice}</p>}
   </form>
 )
 const setupHint=snap?.settings.game==='auction'&&kind!=='solo'&&snap.seats.some(seat=>seat.bot)?'Remove bots to use Hold & release.':
  snap?.settings.game==='memoryPoker'&&kind!=='solo'&&!episodeRoster?'Episode-style duel needs two connected human players.':
  snap?.settings.game==='knight'&&(snap.settings.size??5)===5?'Closed tours are available on the 6 × 6 and 8 × 8 boards.':undefined
 const lobbySettings=snap&&!snap.game?<TableInstruments snap={snap} solo={kind==='solo'} readOnly={!host||state.phase!=='online'} config={changes=>command({kind:'config',settings:{...snap.settings,...changes}})}/>:null
 const finished=snap?.game?.done
 const playing=!!snap?.game
 return <>
  {isLanding&&<CodexEntry motionOff={feedback.prefs.motion==='off'}/>}
  <header className={'bar'+(isLanding?' landing-bar':playing?' playing-bar':'')}><div className="wrap top">
   <a className="brand" href={base} onClick={e=>{if(kind)e.preventDefault()}}><BrandSeal/><span>{brand}<small>Unofficial fan project</small></span></a>
    {!kind&&<ChapterBookmarks selected={selected?.id}/>}
   <span className="pill alpha-pill">Playable alpha</span>
  </div></header>
  <main className={'wrap'+(isLanding?' illustrated-landing':playing?' playing-arena':'')}>
  {!kind?<>{seasonLibrary?<section className="season-heading" aria-labelledby="season-title">
   <div><p className="eyebrow">Season {seasonLibrary.id} · {seasonLibrary.year}</p><h1 id="season-title">{seasonLibrary.title}</h1></div>
   <a className="front-cta chapter-entry-link" href="#room-entry"><FolioMark kind="invite"/>Create or join a room</a>
  </section>:<section className={'front-desk'+(selected?' season-desk':'')+(page==='/join'?' invite-desk':'')+(isLanding?' painted-desk':'')}>
   {isLanding&&<LandingPainting/>}
   <div className="front-copy">
    {selected&&<p className="eyebrow">Season {selected.id} · {selected.year}</p>}
    {isLanding&&<p className="eyebrow landing-kicker"><LandingMark mark="lantern"/> THE STRATEGY CHAMBERS</p>}
    <h1>{selected?selected.title:page==='/join'?'Join a game':'Imp Plan'}</h1>
    <p>{selected?numberPlayable(selected.id)+' playable games and '+count(selected.id)+' indexed challenges.':page==='/join'?'Enter a nickname and your friend’s room code.':'Strategy games inspired by The Devil’s Plan. Play solo or invite friends.'}</p>
    {page!=='/join'&&<div className="front-actions"><a className="primary front-cta" href="#play"><LandingMark mark="table"/> Browse games</a><a className="front-cta" href="#room-entry"><LandingMark mark="door"/> Create or join a room</a></div>}
   </div>
   {isLanding&&<div className="landing-table"><PlayerWardrobe/></div>}
   {roomEntry}
  </section>}
  {!selected&&<section className="season-directory"><div className="section-head"><div><h2><LandingMark mark="lantern"/> Browse by season</h2></div><p>{catalog.length} indexed challenges</p></div><div className="season-cards">{seasons.map(x=><a key={x.id} className={'season-card '+x.tone} href={seasonHref(x.id)}>{isLanding&&<ChapterArt season={x.id}/>}<span className="season-sigil" aria-hidden="true">{x.roman}</span><div><p className="eyebrow">SEASON {x.id}</p><h3>{x.title}</h3><small>{numberPlayable(x.id)} playable · {count(x.id)} indexed</small></div><span className="season-arrow" aria-hidden="true"><LandingMark mark="arrow"/></span></a>)}</div></section>}
  <section className={'featured'+(seasonLibrary?' season-gallery':'')} id="play"><div className="section-head"><h2>{isLanding&&<LandingMark mark="table"/>}{selected?'Play this season':'Pick a game'}</h2><p>{playable.length} playable{!seasonLibrary&&(playable.length===1?' fan adaptation':' fan adaptations')}</p></div>
  <div className="gallery-tools library-tools">
   <label className="sr" htmlFor="gallery-search">Find playable games</label>{isLanding&&<LandingMark className="collection-search" mark="search"/>}<input id="gallery-search" type="search" value={galleryQuery} onChange={e=>setGalleryQuery(e.target.value)} placeholder="Find a game" />
   <a href="#catalog" onClick={openCatalog}><FolioMark kind="folio"/>Challenge index</a>
  </div>
  {shown.length===0&&<p role="status" className="gallery-empty">No playable games match this search.</p>}
  <div className="cards">{shown.map(g=>{
   const entry=catalogGame.get(g)
   const reference=entry?.sources[0]
   return <article className="card" key={g}>
    <GameArt mode={g} motionOff={feedback.prefs.motion==='off'}/>
    <div className="game-card-body">
     <GameCardIdentity game={g} entry={entry}/>
     <div className="game-card-actions"><button type="button" id={'practice-gallery-'+g} onClick={e=>connect('solo',g,e.currentTarget.id)}>Practice <span className="sr">{titles[g]}</span></button>
      <GameDetails game={g} context={entry&&<GameVenue entry={entry}/>} source={reference} motionOff={feedback.prefs.motion==='off'}/></div>
    </div>
   </article>
  })}</div>
  </section>
  {seasonLibrary&&<div className="front-desk season-room">{roomEntry}</div>}
  <ChallengeFolio entries={catalog} selected={selected?.id} filters={folioFilters} onPractice={(game,launcher)=>connect('solo',game,launcher)}/></>
  :<section className="room" data-party-lobby={partyLobby||undefined} data-practice-lobby={practiceLobby||undefined} data-playing={playing||undefined} data-game={snap?.game?.game} data-layout={snap?.game?.game==='blind'?'chamber':undefined}>
   <div className="section-head"><div><p className="eyebrow">{kind==='solo'?'OFFLINE PRACTICE':'PRIVATE PARTY'}</p><h1 ref={matchHeading} tabIndex={snap?.game||kind==='solo'?-1:undefined}>{snap?.game?titles[snap.game.game]:kind==='solo'?'Practice lobby':'Party room'}</h1></div><div className="room-controls"><GameFeedbackControls feedback={feedback}/><button className="room-leave" onClick={leave}>{snap?.game?.game==='blind'&&<ChamberGlyph icon="exit"/>}Leave room</button></div></div>
   {room&&<div className="invite">{partyLobby&&<PartyGlyph kind="invite"/>}<span>Invite code <strong data-testid="room-code">{room}</strong></span>{snap&&<button onClick={()=>{void copyInvite()}}>Copy invite</button>}
    {inviteCopy==='copied'&&<small role="status">Invite copied.</small>}
    {inviteCopy==='manual'&&<div className="invite-manual"><p id="invite-copy-help">Couldn’t copy automatically. Copy the link below or share the invite code.</p><label>Invite link<input ref={inviteInput} readOnly value={invite(room)} aria-describedby="invite-copy-help" onFocus={e=>e.currentTarget.select()}/></label></div>}
   </div>}
   <p role="status" className="notice">{state.phase==='connecting'?joinStatus[state.joinStage??'signaling']:state.phase==='offline'?'Disconnected.':''}</p>
   {state.error&&<p role="alert" className="error">{state.error}</p>}
   {state.phase==='offline'&&<div className="actions"><button onClick={()=>connect(kind)}>Retry</button><button onClick={()=>connect('solo')}>Solo practice</button></div>}
   {snap&&<div className="room-grid"><div>
    {!snap.game?<><section className="panel lobby party-workspace"><PartyTable practice={kind==='solo'} game={snap.settings.game} variant={holdAuction?'hold':episodePoker?'episode':undefined} canChoose={host} online={state.phase==='online'} motionOff={feedback.prefs.motion==='off'} error={state.error} choose={game=>command({kind:'config',settings:{...snap.settings,game}})} preview={()=>setBriefing('preview')}/>
      <PartyActionBar note={partyLobby?partyNote:undefined}>
       {host?<><button className="primary" disabled={!canStart} onClick={()=>setBriefing('start')}>Start match</button><button disabled={state.phase!=='online'||snap.seats.length>=snap.settings.capacity||botBlocked} onClick={()=>command({kind:'bot'})}><PartyGlyph kind="bot"/> Add bot</button></>:<button className="primary" disabled={state.phase!=='online'} onClick={()=>command({kind:'ready'})}>{youReady?'Unready':'Ready up'}</button>}
      </PartyActionBar>
     </section>
     {practiceLobby&&lobbySettings}</>:snap.game.game==='blind'?<BlindMatchStage key={snap.match} game={snap.game} you={snap.you} name={nameOf} active={state.phase==='online'}
     practice={kind==='solo'} leg={snap.fixture+1} legs={snap.count} submit={action=>command({kind:'move',action})}
     onReturn={host?()=>{if(finished||window.confirm('End this match and return to the lobby?'))command({kind:'lobby'})}:undefined}
     onExport={finished?()=>exportMatch(snap):undefined} next={finished&&host?{label:snap.seriesDone?'Rematch':'Next leg',run:()=>command({kind:'next'})}:undefined}
     extra={finished?<LeagueStandings snap={snap} name={nameOf}/>:undefined}/>:<section className="panel match">
     <p className="eyebrow">{snap.game.timeHold?'EPISODE-INSPIRED · FAN RECREATION':snap.game.memoryDuel?'EPISODE-STYLE DUEL · FAN RECREATION':'FAN MODE'}{!(snap.game.grass||isPuzzle(snap.game.game)||snap.game.divine||snap.game.codeLock||snap.game.pyramid||snap.game.fragments||snap.game.spot||snap.game.scale||snap.game.fence||snap.game.tower||snap.game.piece||snap.game.memoryPoker||snap.game.memoryDuel||snap.game.timeHold||snap.game.montage||snap.game.heavy13)&&(snap.game.wallGo?' · Leg ':' · Round ')+(snap.fixture+1)+' of '+snap.count}</p>
     {!snap.game.timeHold&&snap.game.game!=='morris'&&<RoundHeading game={snap.game} you={snap.you} active={state.phase==='online'}>{snap.game.heavy13?(finished?snap.game.winner?nameOf(snap.game.winner)+' wins':'Shared result':'Balance the three stands'):snap.game.montage?(finished?snap.game.montage.outcome==='cleared'?'Gallery cleared':'Gallery closed':'Recognize the repeat'):snap.game.wallGo?(finished?snap.game.winner?nameOf(snap.game.winner)+' wins':'Draw':'Fence the board'):snap.game.memoryDuel?(finished?snap.game.winner?nameOf(snap.game.winner)+' wins':'No winner':'Head-to-head'):snap.game.memoryPoker?(finished?snap.game.seats.length===1?'Practice complete':snap.game.winner?nameOf(snap.game.winner)+' wins':'Shared result':'Memory Poker table'):snap.game.piece?(finished?snap.game.piece.score.adjustedMs===null?'Puzzle closed':'Silhouette complete':'Fill the silhouette'):snap.game.tower?(finished?snap.game.tower.score.passed?'Tower cleared':'Tower closed':'Build the word tower'):snap.game.fence?(finished?snap.game.seats.length===1?'Practice complete':snap.game.winner?nameOf(snap.game.winner)+' wins':'Shared result':'Build one closed loop'):snap.game.scale?(finished?snap.game.scale.score===5?'Weights solved':'Scale challenge complete':'Balance the minerals'):snap.game.fragments?(finished?snap.game.fragments.passed?'Exhibit cleared':'Exhibit not cleared':'Recall together'):finished?((isPuzzle(snap.game.game)||snap.game.codeLock||snap.game.pyramid||snap.game.spot)&&snap.game.seats.length===1?'Practice complete':snap.game.winner?nameOf(snap.game.winner)+' wins':'Shared result'):snap.game.game==='auction'?'Submit in secret':snap.game.game==='remove'?'Lowest unique card wins':snap.game.game==='knight'?'Trace your tour':isPuzzle(snap.game.game)||snap.game.game==='secret'||snap.game.grass||snap.game.divine||snap.game.codeLock||snap.game.pyramid||snap.game.spot?titles[snap.game.game]:!snap.game.seats.includes(snap.you)?'Watching this leg':snap.game.turn===snap.you?'Your turn':nameOf(snap.game.turn)+'’s turn'}</RoundHeading>}
     {snap.game.game==='point'?<PointScores game={snap.game} name={nameOf} active={state.phase==='online'}/>:isDuel(snap.game.game)&&snap.game.game!=='morris'&&snap.game.game!=='bagh'&&!snap.game.equations&&!snap.game.wallGo&&<p className="versus">{snap.game.seats.map((s,i)=><span key={s}>{mark(i)} {nameOf(s)}</span>)}</p>}
      <TableLoadBoundary key={snap.match+':'+snap.game.game} title={titles[snap.game.game]}><Suspense fallback={<p role="status">Opening the table…</p>}>
      {snap.game.timeHold?<TableLoadBoundary key={snap.match} title="Time Auction"><Suspense fallback={<p role="status">Loading hold controls…</p>}><TimeHoldBoard key={snap.match} matchKey={snap.match} view={snap.game.timeHold}
       active={state.phase==='online'} clockSample={state.receivedAt===undefined?null:{hostNow:snap.hostNow,receivedAt:state.receivedAt}}
       seatNames={Object.fromEntries(snap.seats.map(s=>[s.id,s.name]))} rejectedPress={state.holdRejection}
       reducedMotion={feedback.prefs.motion==='off'} submit={a=>session.current?.send({kind:'time-hold',round:a.round,action:a.kind},snap.match)??false}/></Suspense></TableLoadBoundary>:
      snap.game.heavy13?<TableLoadBoundary key={snap.match} title="Heavy 13"><Suspense fallback={<p role="status">Preparing the Heavy 13 table…</p>}><Heavy13Board key={snap.match} snap={snap} name={nameOf} active={state.phase==='online'} submit={action=>{
       const game=snap.game?.heavy13
       if(game?.phase==='select')command({kind:'heavy-lock',match:snap.match,round:game.round,action})
       if(game?.phase==='resolve'&&game.slot!==null)command({kind:'heavy-act',match:snap.match,round:game.round,slot:game.slot,action})
      }}/></Suspense></TableLoadBoundary>:snap.game.montage?<MontageBoard key={snap.match} snap={snap} name={nameOf} active={state.phase==='online'} open={round=>command({kind:'montage-open',match:snap.match,round})} buzz={position=>command({kind:'montage-buzz',match:snap.match,...position})}/>:snap.game.wallGo?<WallGoBoard key={snap.match} snap={snap} name={nameOf} active={state.phase==='online'} submit={action=>command({kind:'move',action})}/>:
       snap.game.memoryDuel?<MemoryDuelBoard key={snap.match+':'+snap.game.memoryDuel.dealNumber} snap={snap} name={nameOf} active={state.phase==='online'} submit={(a,deal)=>command({kind:'memory-lock',action:a,deal})}/>:snap.game.memoryPoker?<MemoryPokerBoard key={snap.match+':'+snap.game.round} snap={snap} name={nameOf} active={state.phase==='online'} submit={a=>command({kind:'move',action:a,round:snap.game?.round})}/>:snap.game.piece?<PieceBoard key={snap.match} snap={snap} name={nameOf} active={state.phase==='online'} submit={a=>command({kind:'move',action:a})}/>:snap.game.tower?<TowerBoard key={snap.match+':'+snap.game.round} snap={snap} name={nameOf} active={state.phase==='online'} submit={a=>command({kind:'move',action:a})}/>:snap.game.fence?<FenceBoard key={snap.match} snap={snap} name={nameOf} active={state.phase==='online'} submit={a=>command({kind:'move',action:a,round:snap.game?.round})}/>:snap.game.scale?<ScaleBoard key={snap.match} snap={snap} name={nameOf} active={state.phase==='online'} submit={a=>command({kind:'move',action:a,round:snap.game?.round})}/>:snap.game.spot?<SpotBoard key={snap.match} snap={snap} name={nameOf} active={state.phase==='online'} submit={a=>command({kind:'move',action:a,round:snap.game?.round})}/>:snap.game.fragments?<FragmentsBoard key={snap.match} snap={snap} name={nameOf} active={state.phase==='online'} submit={a=>command({kind:'move',action:a,round:snap.game?.round})}/>:snap.game.pyramid?<PyramidBoard key={snap.match+':'+snap.game.round} snap={snap} name={nameOf} active={state.phase==='online'} submit={a=>command({kind:'move',action:a,round:snap.game?.round})}/>:snap.game.codeLock?<CodeLockBoard key={snap.match} snap={snap} name={nameOf} active={state.phase==='online'} submit={a=>command({kind:'move',action:a,round:snap.game?.round})}/>:snap.game.equations?<EquationBoard key={snap.match} snap={snap} name={nameOf} active={state.phase==='online'} submit={a=>command({kind:'move',action:a})}/>:snap.game.divine?<DivineBoard key={snap.match} snap={snap} active={state.phase==='online'} submit={a=>command({kind:'move',action:a,round:snap.game?.round})}/>:snap.game.grass?<GrassBoard key={snap.match+':'+snap.game.round+':'+snap.game.turn} g={snap.game} you={snap.you} name={nameOf} active={state.phase==='online'} submit={a=>command({kind:'move',action:a})}/>:snap.game.game==='bagh'?<BaghBoard key={snap.match} g={snap.game} you={snap.you} active={state.phase==='online'} submit={a=>command({kind:'move',action:a})}/>:snap.game.game==='secret'?<SecretBoard key={snap.match+':'+snap.game.round} snap={snap} active={state.phase==='online'} name={nameOf} submit={a=>command({kind:'move',action:a,round:snap.game?.round})}/>:snap.game.game==='auction'?<Auction key={snap.match} snap={snap} active={state.phase==='online'} submit={a=>command({kind:'move',action:a,round:snap.game?.round})}/>:isPuzzle(snap.game.game)?<PuzzleBoard key={snap.match+':'+snap.game.round+':'+snap.game.puzzle?.stage} snap={snap} active={state.phase==='online'} name={nameOf} submit={a=>command({kind:'move',action:a,round:snap.game?.round})}/>:snap.game.game==='mancala'?<MancalaBoard key={snap.match+':'+snap.game.mancala?.placements+':'+snap.game.mancala?.sows} g={snap.game} you={snap.you} active={state.phase==='online'} name={nameOf} submit={a=>command({kind:'move',action:a})}/>:!isDuel(snap.game.game)?<SeasonTwo key={snap.match} snap={snap} active={state.phase==='online'} name={nameOf} submit={a=>command({kind:'move',action:a,round:snap.game?.round})}/>:snap.game.game==='morris'?<MorrisBoard key={snap.match} v={snap.game} you={snap.you} name={nameOf} active={state.phase==='online'} submit={a=>command({kind:'move',action:a})}/>:<Board key={snap.match} v={snap.game} name={nameOf} active={state.phase==='online'} submit={a=>command({kind:'move',action:a})}/>}
     </Suspense></TableLoadBoundary>
     <details><summary>How to play</summary><p>{snap.game.timeHold?holdAuctionRules:snap.game.memoryDuel?episodePokerRules:snap.game.montage?.mode==='practice'?montagePracticeRules:tutorials[snap.game.game]}</p>{snap.game.montage&&<p><a href={montageSource} target="_blank" rel="noreferrer">Season 1 Episode 9 transcript</a> · The deck, countdown and host-receipt timing are fan rules.</p>}</details>
     {finished?<MatchRecord snap={snap} name={nameOf} active={state.phase==='online'} onExport={()=>exportMatch(snap)}
      onReturn={host?()=>command({kind:'lobby'}):undefined} onNext={host?()=>command({kind:'next'}):undefined}/>
      :host&&<ReturnToLobby active={state.phase==='online'} onReturn={()=>{if(window.confirm('End this match and return to the lobby?'))command({kind:'lobby'})}}/>}
    </section>}
   </div><aside>{partyLobby?<PartyRoster snap={snap} capacity={episodePoker?2:snap.settings.capacity} canRemove={host} online={state.phase==='online'} remove={seat=>command({kind:'kick',seat})}/>:<section className="panel roster"><h2>Seats <small>{snap.seats.length}/{episodePoker?2:snap.settings.capacity}</small></h2>{snap.seats.map((s,i)=><div key={s.id} className="seat"><span className="avatar" data-seat-look={s.appearance}>{s.appearance===undefined?s.bot?'◈':i+1:<PlayerPortrait look={s.appearance} decorative/>}</span><div><strong>{s.name}</strong><small>{s.id===snap.host?'Host':s.bot?'Bot':!s.online?'Offline':s.ready?'Ready':'Not ready'} · Seat {i+1}</small></div>{host&&s.id!==snap.host&&!snap.game&&<button aria-label={'Remove '+s.name+' from seat '+(i+1)} onClick={()=>command({kind:'kick',seat:s.id})}>×</button>}</div>)}</section>}
   {kind!=='solo'&&(!snap.game?.fragments?.strict||snap.game.done)&&<section className="panel chat"><h2>{partyLobby&&<PartyGlyph kind="chat"/>}Table talk</h2><div className="messages" role="log">{snap.chat.length?snap.chat.map((m,i)=><p key={i}><strong>{m.name}:</strong> {m.text}</p>):<p>No messages yet.</p>}</div><form onSubmit={e=>{e.preventDefault();if(chat.trim()){command({kind:'chat',text:chat});setChat('')}}}><input aria-label="Message" value={chat} onChange={e=>setChat(e.target.value)} maxLength={240} placeholder="Say something"/><button disabled={state.phase!=='online'||!chat.trim()}>Send</button></form></section>}</aside>{partyLobby&&lobbySettings}</div>}
  </section>}
   {briefing&&snap&&!snap.game&&<TableBriefing key={snap.settings.game+':'+episodePoker+':'+holdAuction} game={snap.settings.game} seats={snap.seats} motionOff={feedback.prefs.motion==='off'} setupHint={briefing==='preview'?setupHint:undefined} mechanic={briefing==='preview'?<PartyMechanicPreview game={snap.settings.game} variant={holdAuction?'hold':episodePoker?'episode':undefined} motionOff={feedback.prefs.motion==='off'}/>:undefined} caption={holdAuction?'The table shares the round clock and results, never your live bid.':episodePoker?'Two duelists. The grid is read together; each pair is locked privately.':explain(snap.settings.game,snap.seats.length)} variant={holdAuction?{label:'Hold & release · episode-inspired',rules:holdAuctionRules,demo:()=> <img style={{display:'block',width:'100%',height:'auto',borderRadius:4}} src={base+'art/time-auction-chamber.svg'} alt="The timekeepers’ cabinet" width={1200} height={660}/>}:episodePoker?{label:'Episode-style duel',rules:episodePokerRules,demo:step=><MemoryDuelLesson step={step}/>} :snap.settings.game==='montage'?{label:montagePractice?'FAN RULES · SOLO PRACTICE':'FAN RULES',rules:montagePractice?montagePracticeRules:tutorials.montage,demo:step=><MontageLesson step={step}/>} :snap.settings.game==='heavy13'?{label:'FAN RULES · 2–7 SEATS',rules:tutorials.heavy13,demo:step=><TableLoadBoundary title="Heavy 13"><Suspense fallback={<span>Preparing example…</span>}><Heavy13Lesson step={step}/></Suspense></TableLoadBoundary>} :undefined} close={()=>setBriefing(null)} start={briefing==='start'&&host?{enabled:canStart,confirm:()=>command({kind:'start'})}:undefined}/>}
  </main>
  <footer className={'wrap footer'+(isLanding?' landing-footer':'')}><strong>{isLanding&&<BrandSeal/>}{brand}</strong><span>Fan-made and not affiliated with Netflix. No real stakes.</span></footer>
 </>
}
function Board({v,name,active,submit}:{v:GameView,name:(s:string)=>string,active:boolean,submit:(a:number|{from:number,to:number})=>void}){
 const [from,setFrom]=useState<number|null>(null)
 const [focus,setFocus]=useState(0)
 const [row,setRow]=useState(0)
 const [column,setColumn]=useState(0)
 const refs=useRef<Array<HTMLButtonElement|null>>([])
 const linear=v.game!=='morris'
 const size=v.game==='point'?13:15
 function cell(i:number){
  const value=v.board[i]
  const canFrom=v.legal.some(a=>typeof a==='object'&&a.from===i)
  const canPlace=v.legal.includes(i)
  const canTo=v.legal.some(a=>typeof a==='object'&&a.from===from&&a.to===i)
  const can=active&&(canPlace||canFrom||canTo)
  const label=(linear?'Row '+(Math.floor(i/size)+1)+', column '+(i%size+1):'Point '+(i+1))+', '+(!value?'open':value==='?'?'veiled':name(value))
  const [x,y]=points[i]??[0,0]
  return <button type="button" key={i} style={linear?{}:{left:(7+x*(86/6))+'%',top:(7+y*(86/6))+'%'}} ref={el=>{refs.current[i]=el}} tabIndex={i===focus?0:-1} aria-label={label} aria-disabled={!can} aria-pressed={from===i}
   className={'cell '+(value==='?'?'veil':value?'color'+v.seats.indexOf(value):'')+(can?' legal':'')}
   onFocus={()=>setFocus(i)} onKeyDown={e=>{
    const nav:Record<string,number>={ArrowRight:1,ArrowLeft:-1,ArrowUp:linear?-size:-1,ArrowDown:linear?size:1}
    if(!(e.key in nav))return
    e.preventDefault();const next=Math.max(0,Math.min(v.board.length-1,i+nav[e.key]));refs.current[next]?.focus()
   }}
   onClick={()=>{if(!can)return;if(canPlace){submit(i);setFrom(null)}else if(canTo&&from!==null){submit({from,to:i});setFrom(null)}else if(canFrom)setFrom(from===i?null:i)}}>
   <span className={value?'placed-piece':undefined} key={value} aria-hidden="true">{value==='?'?'●':value?mark(v.seats.indexOf(value)):''}</span>
  </button>
 }
 return <><p className="board-hint">{v.capture?'Mill formed. Choose an opposing stone to remove.':'Use the arrow keys to inspect points and Enter to play.'}</p>{linear?<BoardViewport label={titles[v.game]+' board'}><div className={'board '+(linear?'gomoku':'morris-board')} style={linear?{gridTemplateColumns:'repeat('+size+',1fr)',gridTemplateRows:'repeat('+size+',1fr)'}:{}} aria-label={titles[v.game]+' board'}>
 {linear?null:<svg viewBox="0 0 100 100" aria-hidden="true">{mills.map((m,i)=><line key={i} x1={7+points[m[0]][0]*86/6} y1={7+points[m[0]][1]*86/6} x2={7+points[m[2]][0]*86/6} y2={7+points[m[2]][1]*86/6}/>)}</svg>}
 {v.board.map((_,i)=>cell(i))}</div></BoardViewport>:<div className={'board '+(linear?'gomoku':'morris-board')} style={linear?{gridTemplateColumns:'repeat('+size+',1fr)',gridTemplateRows:'repeat('+size+',1fr)'}:{}} aria-label={titles[v.game]+' board'}>
 {linear?null:<svg viewBox="0 0 100 100" aria-hidden="true">{mills.map((m,i)=><line key={i} x1={7+points[m[0]][0]*86/6} y1={7+points[m[0]][1]*86/6} x2={7+points[m[2]][0]*86/6} y2={7+points[m[2]][1]*86/6}/>)}</svg>}
 {v.board.map((_,i)=>cell(i))}</div>}{linear&&!v.done&&<details><summary>Place by coordinates</summary><div className="actions"><label>Row<select value={row} onChange={e=>setRow(Number(e.target.value))}>{Array.from({length:size},(_,i)=><option key={i} value={i}>{i+1}</option>)}</select></label><label>Column<select value={column} onChange={e=>setColumn(Number(e.target.value))}>{Array.from({length:size},(_,i)=><option key={i} value={i}>{i+1}</option>)}</select></label><button disabled={!active||!v.legal.includes(row*size+column)} onClick={()=>submit(row*size+column)}>Place stone</button></div></details>}</>
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
function exportMatch(snap:Snapshot){
 const g=snap.game
 if(!g?.done)return
 const seats=Object.fromEntries(snap.seats.map(s=>[s.id,s.name]))
 const out={game:titles[g.game],rules:g.heavy13?'heavy-13-fan-1':g.timeHold?'time-auction-hold-fan-1':g.memoryDuel?'memory-poker-episode-duel-1':'fan-alpha-1',...(g.timeHold?{rounds:g.timeHold.history.map(r=>({round:r.round,winner:r.winner?seats[r.winner]:null,seconds:r.elapsedTenths/10})),ranks:g.timeHold.ranks?.map(group=>group.map(id=>seats[id]))}:{}),...(g.heavy13?{penalties:g.heavy13.scores.map(s=>({name:seats[s.seat],count:s.penalty,lastPlacement:s.lastPenalty})),leaders:g.heavy13.leaders.map(id=>seats[id])}:{}),...(g.montage?{team:{mode:g.montage.mode,outcome:g.montage.outcome,cleared:g.montage.clearedRounds,rounds:g.montage.totalRounds,errors:g.montage.errors,pieces:g.montage.pieces.map(p=>({name:seats[p.seat],pieces:p.pieces}))}}:{}),...(g.wallGo?{territory:{turns:g.wallGo.turns,reason:g.wallGo.end,neutral:g.wallGo.territory.neutral,areas:g.seats.map((s,i)=>({name:seats[s],cells:g.wallGo!.territory.scores[i]}))}}:{}),...(g.memoryDuel?{deal:g.memoryDuel.dealNumber,outcome:g.memoryDuel.result?.kind}:{}),...(g.piece?{team:{...g.piece.score,clues:g.piece.hints}}:{}),...(g.tower?{team:{...g.tower.score,maximum:g.tower.columns.length}}:{}),...(g.scale?{team:{score:g.scale.score,maximum:5,weighings:g.scale.log.length}}:{}),...(g.fragments?{team:{correct:g.fragments.correct,total:g.fragments.total,passed:g.fragments.passed,strict:g.fragments.strict}}:{}),winner:g.winner?seats[g.winner]:null,fixtures:snap.fixtures.slice(0,snap.fixture+1).map(f=>({seats:f.sides.map(s=>seats[s]),winner:f.winner?seats[f.winner]:null})),scores:!g.heavy13&&!isDuel(g.game)?g.seats.map((s,i)=>({name:seats[s],points:g.scores[i],...(g.fence?.results?{solvedSeconds:(g.fence.results.find(r=>r.id===s)?.elapsed??null)===null?null:g.fence.results.find(r=>r.id===s)!.elapsed!/1000}:{}),...(g.spot?.results?.[s]?{adjustedSeconds:g.spot.results[s][1]/1000}:{}),...(g.mancala?{colorScores:g.mancala.points[i],total:total(g.mancala.points[i])}:{}),...(g.game==='auction'&&!g.timeHold?{timeBank:g.credits[i]/1000}:{})})):undefined}
 const url=URL.createObjectURL(new Blob([JSON.stringify(out,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='mind-arena-result.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)
}
createRoot(document.getElementById('root')!).render(<App/>)
