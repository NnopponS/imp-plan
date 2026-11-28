import {MontageLesson,montagePracticeRules,montageSource} from './montage-ui'
import {MemoryDuelLesson} from './memory-duel-ui'
import {total} from './mancala'
import React,{Suspense,lazy,useEffect,useLayoutEffect,useRef,useState} from 'react'
import {createRoot} from 'react-dom/client'
import {titles,tutorials,isDuel,type Game} from './engine'
import {defaults,explain,episodePokerRoster,episodePokerRules,holdAuctionRules,isHoldAuction,humanOnly,seatRules,seatCapacity,seatStartError,nickname,validCode,type Command,type Snapshot} from './room'
import {hostRoom,joinRoom,practice,type SessionState,type ConnectOptions,type Session} from './session'
import catalog from './catalog.json'
import {GalleryCard} from './gallery-card'
import {gameSearchKey} from './game-search'
import {GameVenue} from './game-identity'
import {getGameVenue} from './game-venues'
import {BrandSeal} from './brand-seal'
import {CodexEntry} from './codex-entry'
import {PageTurn,type PageTurnScreen} from './page-turn'
import {base,brand,currentSeason,seasons,seasonHref} from './brand'
import './style.css'
import './design.css'
import './arena-refresh.css'
import {TableBriefing} from './table-briefing'
import {ChamberGlyph} from './blind-match'
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
import {FolioTransition,stageFolio} from './stage-folio'
import {LeagueStandings,MatchRecord,ReturnToLobby} from './match-record'
import {MatchInstruments,useBoardFocus} from './match-play'
import {useOfflinePractice} from './offline-practice'
import {TableLoadBoundary} from './lazy-table'
import {ArenaTable,warmTable,loadTimeHold,loadHeavy13,loadThreeRow,loadRelay,loadGradation,loadBigSmall,loadTripleDice,loadFlags,loadSymmetry,loadColorLink} from './arena-table'
const ThreeRowLesson=lazy(()=>loadThreeRow().then(m=>({default:m.ThreeRowLesson})))
const RelayLesson=lazy(()=>loadRelay().then(m=>({default:m.RelayLesson})))
const GradationLesson=lazy(()=>loadGradation().then(m=>({default:m.GradationLesson})))
const BigSmallLesson=lazy(()=>loadBigSmall().then(m=>({default:m.BigSmallLesson})))
const TripleDiceLesson=lazy(()=>loadTripleDice().then(m=>({default:m.TripleDiceLesson})))
const FlagsLesson=lazy(()=>loadFlags().then(m=>({default:m.FlagsLesson})))
const SymmetryPuzzleLesson=lazy(()=>loadSymmetry().then(m=>({default:m.SymmetryPuzzleLesson})))
const ColorLinkLesson=lazy(()=>loadColorLink().then(m=>({default:m.ColorLinkLesson})))
const Heavy13Lesson=lazy(()=>loadHeavy13().then(m=>({default:m.Heavy13Lesson})))
const games=Object.keys(titles) as Game[]
const catalogGame=new Map(catalog.filter(row=>row.game).map(row=>[row.game,row]))
const route=()=>{const [page,query]=location.hash.slice(1).split('?');return {page,room:new URLSearchParams(query).get('room')??''}}
const cleanCode=(x:string)=>x.toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,6)
const invite=(code:string)=>location.origin+base+'#/join?room='+code
const joinStatus={signaling:'Contacting signaling…',peer:'Opening a direct connection…',snapshot:'Waiting for the host’s room state…'} as const
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
 useEffect(()=>{if(choice)void warmTable(choice)?.catch(()=>{})},[choice])
 const holdAuction=!!snap&&isHoldAuction(snap.settings)
 useEffect(()=>{if(holdAuction)void loadTimeHold().catch(()=>{})},[holdAuction])
 const botBlocked=!!snap&&(holdAuction||humanOnly(snap.settings.game))
 const episodePoker=snap?.settings.game==='memoryPoker'&&snap.settings.memoryPokerMode==='episode'
 const episodeRoster=!!snap&&kind!=='solo'&&episodePokerRoster(snap.seats)
 const heavyTable=snap?.settings.game==='heavy13'
 useEffect(()=>{if(heavyTable)void loadHeavy13().catch(()=>{})},[heavyTable])
 const montagePractice=snap?.settings.game==='montage'&&kind==='solo'
 const limit=snap?seatCapacity(snap.settings,kind==='solo'):0
 const canStart=!!snap&&host&&state.phase==='online'&&!seatStartError(snap.settings,snap.seats,kind==='solo')
 const partyLobby=kind!=='solo'&&!!snap&&!snap.game
 const youReady=snap?.seats.find(s=>s.id===snap.you)?.ready
 const missingSeats=snap?Math.max(0,seatRules(snap.settings).min-snap.seats.length):0
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
    <div className="entry-tools"><button type="button" className="plain" id="practice-entry" onClick={e=>connect('solo','blind',e.currentTarget.id)}><FolioMark kind="play"/>Solo practice</button>
    <details className="entry-connection"><summary><FolioMark kind="settings"/>Connection options</summary><p>For an online room, signaling is provided by PeerJS, with Google STUN for network discovery by default. Peers can learn network information; some networks can’t connect directly.</p><label htmlFor="ice">Custom STUN URLs (optional)</label><input id="ice" value={ice} onChange={e=>setIce(e.target.value)} placeholder="stun:example.net:3478"/></details></div>
    {offlinePractice&&<small className="practice-availability" role="status">{offlinePractice==='ready'?'Ready for offline practice.':offlinePractice==='saving'?'Saving games for offline practice… Keep this page open.':offlinePractice==='updating'?'This release isn’t ready for offline play. Finish any open games, then close all Imp Plan tabs and reopen online.':'Offline files aren’t saved. Open or reload this page with an internet connection.'}</small>}
    {notice&&<p role="alert" className="error">{notice}</p>}
   </form>
 )
 const setupHint=snap?.settings.game==='auction'&&kind!=='solo'&&snap.seats.some(seat=>seat.bot)?'Remove bots to use Hold & release.':
  snap?.settings.game==='memoryPoker'&&kind!=='solo'&&!episodeRoster?'Episode-style duel needs two connected human players.':
  snap?.settings.game==='knight'&&(snap.settings.size??5)===5?'Closed tours are available on the 6 × 6 and 8 × 8 boards.':undefined
 const lobbySettings=snap&&!snap.game?<TableInstruments snap={snap} solo={kind==='solo'} readOnly={!host||state.phase!=='online'} config={changes=>command({kind:'config',settings:{...snap.settings,...changes}})}/>:null
 const tableChat=snap&&<><div className="messages" role="log">{snap.chat.length?snap.chat.map((m,i)=><p key={i}><strong>{m.name}:</strong> {m.text}</p>):<p>No messages yet.</p>}</div><form onSubmit={e=>{e.preventDefault();if(chat.trim()){command({kind:'chat',text:chat});setChat('')}}}><input aria-label="Message" value={chat} onChange={e=>setChat(e.target.value)} maxLength={240} placeholder="Say something"/><button disabled={state.phase!=='online'||!chat.trim()}>Send</button></form></>
 const finished=snap?.game?.done
 const playing=!!snap?.game
 const liveMatch=playing&&!finished
 const boardFocus=useBoardFocus(liveMatch?snap?.match:undefined,finished?snap?.match:undefined)
 const motionOff=feedback.prefs.motion==='off'
 const scene=stageFolio({invite:page==='/join',season:selected?.id,seat:kind??undefined,
  game:snap?.game?.game??choice,match:playing?snap?.match:undefined,finished,hold:holdAuction})
 const turnScreen:PageTurnScreen|undefined=!kind?(page==='/join'?'invite':selected?`season-${selected.id}`:'home'):
  !snap?undefined:playing?(finished?'result':'match'):kind==='solo'?'practice':'party'
 const folio=scene.phase==='result'?null:<FolioTransition key={scene.key} scene={scene} motionOff={motionOff} suspend={!!briefing&&!playing}/>
 return <>
  <PageTurn screen={turnScreen} motionOff={motionOff}/>
  {isLanding&&<CodexEntry motionOff={feedback.prefs.motion==='off'}/>}
  <header className={'bar'+(isLanding?' landing-bar':playing?' playing-bar':'')} data-board-focus={boardFocus.focused||undefined}><div className="wrap top">
   <a className="brand" href={base} onClick={e=>{if(kind)e.preventDefault()}}><BrandSeal/><span>{brand}<small>Unofficial fan project</small></span></a>
    {!kind&&<ChapterBookmarks selected={selected?.id}/>}
   <span className="pill alpha-pill">Playable alpha</span>
  </div></header>
  <main className={'wrap'+(isLanding?' illustrated-landing':playing?' playing-arena':'')} data-live-arena={liveMatch||undefined} data-board-focus={boardFocus.focused||undefined}>
  {!kind?<>{seasonLibrary?<section className="season-heading" aria-labelledby="season-title">
   <div><p className="eyebrow">Season {seasonLibrary.id} · {seasonLibrary.year}{folio}</p><h1 id="season-title">{seasonLibrary.title}</h1></div>
   <a className="front-cta chapter-entry-link" href="#room-entry"><FolioMark kind="invite"/>Create or join a room</a>
  </section>:<section className={'front-desk'+(selected?' season-desk':'')+(page==='/join'?' invite-desk':'')+(isLanding?' painted-desk':'')}>
   {isLanding&&<LandingPainting/>}
   <div className="front-copy">
    {selected&&<p className="eyebrow">Season {selected.id} · {selected.year}{folio}</p>}
    {isLanding&&<p className="eyebrow landing-kicker"><LandingMark mark="lantern"/> THE STRATEGY CHAMBERS{folio}</p>}
    {!selected&&page==='/join'&&<span className="invite-folio-line" aria-hidden="true">{folio}</span>}
    <h1>{selected?selected.title:page==='/join'?'Join a game':'Imp Plan'}</h1>
    <p>{selected?numberPlayable(selected.id)+' playable games and '+count(selected.id)+' indexed challenges.':page==='/join'?'Enter a nickname and your friend’s room code.':'Strategy games inspired by The Devil’s Plan. Play solo or invite friends.'}</p>
    {page!=='/join'&&<div className="front-actions"><a className="primary front-cta" href="#play"><LandingMark mark="table"/> Browse games</a><a className="front-cta" href="#room-entry"><LandingMark mark="door"/> Create or join a room</a></div>}
   </div>
   {isLanding&&<div className="landing-table"><PlayerWardrobe/></div>}
   {roomEntry}
  </section>}
  {!selected&&<section className="season-directory"><div className="section-head"><div><h2><LandingMark mark="lantern"/> Browse by season</h2></div><p>{catalog.length} indexed challenges</p></div><div className="season-cards">{seasons.map(x=><a key={x.id} className={'season-card '+x.tone} href={seasonHref(x.id)}>{isLanding&&<ChapterArt season={x.id}/>}<span className="season-sigil" aria-hidden="true">{x.roman}</span><div><p className="eyebrow">SEASON {x.id}</p><h3>{x.title}</h3><small>{numberPlayable(x.id)} playable · {count(x.id)} indexed</small></div><span className="season-arrow" aria-hidden="true"><LandingMark mark="arrow"/></span></a>)}</div></section>}
  <section className={'featured'+(seasonLibrary?' season-gallery':'')} id="play"><div className="section-head"><h2>{isLanding&&<LandingMark mark="table"/>}{selected?'Play this season':'Pick a game'}</h2><div className="gallery-reel-actions"><p>{playable.length} playable{!seasonLibrary&&(playable.length===1?' fan adaptation':' fan adaptations')}</p><button className="preview-reel-control" type="button" onClick={feedback.toggleMotion}>{motionOff?'Play previews':'Pause previews'}</button></div></div>
  <div className="gallery-tools library-tools">
   <label className="sr" htmlFor="gallery-search">Find playable games</label>{isLanding&&<LandingMark className="collection-search" mark="search"/>}<input id="gallery-search" type="search" value={galleryQuery} onChange={e=>setGalleryQuery(e.target.value)} placeholder="Find a game" />
   <a href="#catalog" onClick={openCatalog}><FolioMark kind="folio"/>Challenge index</a>
  </div>
  {shown.length===0&&<p role="status" className="gallery-empty">No playable games match this search.</p>}
  <div className="cards">{shown.map(g=><GalleryCard key={g} game={g} entry={catalogGame.get(g)} motionOff={motionOff} practice={launcher=>connect('solo',g,launcher)}/>)}</div>
  </section>
  {seasonLibrary&&<div className="front-desk season-room">{roomEntry}</div>}
  <ChallengeFolio entries={catalog} selected={selected?.id} filters={folioFilters} onPractice={(game,launcher)=>connect('solo',game,launcher)}/></>
  :<section className="room" data-party-lobby={partyLobby||undefined} data-practice-lobby={practiceLobby||undefined} data-playing={playing||undefined} data-live-match={liveMatch||undefined} data-board-focus={boardFocus.focused||undefined} data-game={snap?.game?.game} data-layout={snap?.game?.game==='blind'?'chamber':undefined}>
   <div className="section-head"><div><p className="eyebrow">{kind==='solo'?'OFFLINE PRACTICE':'PRIVATE PARTY'}{folio}</p><h1 ref={matchHeading} tabIndex={snap?.game||kind==='solo'?-1:undefined}>{snap?.game?titles[snap.game.game]:kind==='solo'?'Practice lobby':'Party room'}</h1></div><div className="room-controls"><GameFeedbackControls feedback={feedback}/><button className="room-leave" onClick={leave}>{snap?.game?.game==='blind'&&<ChamberGlyph icon="exit"/>}Leave room</button></div></div>
   {room&&!liveMatch&&<div className="invite">{partyLobby&&<PartyGlyph kind="invite"/>}<span>Invite code <strong data-testid="room-code">{room}</strong></span>{snap&&<button onClick={()=>{void copyInvite()}}>Copy invite</button>}
    {inviteCopy==='copied'&&<small role="status">Invite copied.</small>}
    {inviteCopy==='manual'&&<div className="invite-manual"><p id="invite-copy-help">Couldn’t copy automatically. Copy the link below or share the invite code.</p><label>Invite link<input ref={inviteInput} readOnly value={invite(room)} aria-describedby="invite-copy-help" onFocus={e=>e.currentTarget.select()}/></label></div>}
   </div>}
   <p role="status" className="notice">{state.phase==='connecting'?joinStatus[state.joinStage??'signaling']:state.phase==='offline'?'Disconnected.':''}</p>
   {state.error&&<p role="alert" className="error">{state.error}</p>}
   {state.phase==='offline'&&<div className="actions"><button onClick={()=>connect(kind)}>Retry</button><button onClick={()=>connect('solo')}>Solo practice</button></div>}
   {liveMatch&&snap?.game&&<MatchInstruments snap={{...snap,game:snap.game}} title={titles[snap.game.game]} active={state.phase==='online'} control={boardFocus}/>}
   {snap&&<div className="room-grid"><div>
    {!snap.game?<><section className="panel lobby party-workspace"><PartyTable practice={kind==='solo'} game={snap.settings.game} settings={snap.settings} variant={holdAuction?'hold':episodePoker?'episode':undefined} canChoose={host} online={state.phase==='online'} motionOff={feedback.prefs.motion==='off'} error={state.error} choose={game=>command({kind:'config',settings:{...snap.settings,game}})} preview={()=>setBriefing('preview')}/>
      <PartyActionBar note={partyLobby?partyNote:undefined}>
       {host?<><button className="primary" disabled={!canStart} onClick={()=>setBriefing('start')}>Start match</button><button disabled={state.phase!=='online'||snap.seats.length>=limit||botBlocked} onClick={()=>command({kind:'bot'})}><PartyGlyph kind="bot"/> Add bot</button></>:<button className="primary" disabled={state.phase!=='online'} onClick={()=>command({kind:'ready'})}>{youReady?'Unready':'Ready up'}</button>}
      </PartyActionBar>
     </section>
     {practiceLobby&&lobbySettings}</>:<ArenaTable snap={{...snap,game:snap.game}} active={state.phase==='online'} nameOf={nameOf} command={command}
     send={(action,expectedMatch)=>session.current?.send(action,expectedMatch)} practice={kind==='solo'} motionOff={motionOff}
     receivedAt={state.receivedAt} holdRejection={state.holdRejection}
     blindActions={snap.game.game==='blind'?{
      onReturn:host?()=>{if(finished||window.confirm('End this match and return to the lobby?'))command({kind:'lobby'})}:undefined,
      onExport:finished?()=>exportMatch(snap):undefined,
      next:finished&&host?{label:snap.seriesDone?'Rematch':'Next leg',run:()=>command({kind:'next'})}:undefined,
      extra:finished?<LeagueStandings snap={snap} name={nameOf}/>:undefined,
      resultFolio:finished?<FolioTransition key={scene.key} scene={scene} motionOff={motionOff}/>:undefined,
     }:undefined}>
     <details className="match-rules"><summary>How to play</summary><p>{snap.game.timeHold?holdAuctionRules:snap.game.memoryDuel?episodePokerRules:snap.game.montage?.mode==='practice'?montagePracticeRules:tutorials[snap.game.game]}</p>{snap.game.montage&&<p><a href={montageSource} target="_blank" rel="noreferrer">Season 1 Episode 9 transcript</a> · The deck, countdown and host-receipt timing are fan rules.</p>}</details>
     {finished?<MatchRecord snap={snap} name={nameOf} active={state.phase==='online'} onExport={()=>exportMatch(snap)}
      onReturn={host?()=>command({kind:'lobby'}):undefined} onNext={host?()=>command({kind:'next'}):undefined} folio={<FolioTransition key={scene.key} scene={scene} motionOff={motionOff}/>}/>
      :host&&<ReturnToLobby active={state.phase==='online'} onReturn={()=>{if(window.confirm('End this match and return to the lobby?'))command({kind:'lobby'})}}/>}
    </ArenaTable>}
   </div>{(!liveMatch||kind!=='solo'&&!snap.game?.fragments?.strict)&&<aside className={liveMatch?'match-secondary':undefined}>{liveMatch?null:partyLobby?<PartyRoster snap={snap} capacity={limit} canRemove={host} online={state.phase==='online'} remove={seat=>command({kind:'kick',seat})}/>:<section className="panel roster"><h2>Seats <small>{snap.seats.length}/{limit}</small></h2>{snap.seats.map((s,i)=><div key={s.id} className="seat"><span className="avatar" data-seat-look={s.appearance}>{s.appearance===undefined?s.bot?'◈':i+1:<PlayerPortrait look={s.appearance} decorative/>}</span><div><strong>{s.name}</strong><small>{s.id===snap.host?'Host':s.bot?'Bot':!s.online?'Offline':s.ready?'Ready':'Not ready'} · Seat {i+1}</small></div>{host&&s.id!==snap.host&&!snap.game&&<button aria-label={'Remove '+s.name+' from seat '+(i+1)} onClick={()=>command({kind:'kick',seat:s.id})}>×</button>}</div>)}</section>}
   {kind!=='solo'&&(!snap.game?.fragments?.strict||snap.game.done)&&(liveMatch?<details className="panel chat match-chat"><summary><PartyGlyph kind="chat"/>Table talk</summary>{tableChat}</details>:<section className="panel chat"><h2>{partyLobby&&<PartyGlyph kind="chat"/>}Table talk</h2>{tableChat}</section>)}</aside>}{partyLobby&&lobbySettings}</div>}
  </section>}
   {briefing&&snap&&!snap.game&&<TableBriefing key={snap.settings.game+':'+episodePoker+':'+holdAuction+':'+(snap.settings.flagsMode??'')} game={snap.settings.game} seats={snap.seats} hold={holdAuction} motionOff={motionOff} setupHint={briefing==='preview'?setupHint:undefined} mechanic={briefing==='preview'?<PartyMechanicPreview game={snap.settings.game} variant={holdAuction?'hold':episodePoker?'episode':undefined} motionOff={feedback.prefs.motion==='off'}/>:undefined} caption={holdAuction?'The table shares the round clock and results, never your live bid.':episodePoker?'Two duelists. The grid is read together; each pair is locked privately.':explain(snap.settings.game,snap.seats.length)} variant={holdAuction?{label:'Hold & release · episode-inspired',rules:holdAuctionRules,demo:()=> <img style={{display:'block',width:'100%',height:'auto',borderRadius:4}} src={base+'art/time-auction-chamber.svg'} alt="The timekeepers’ cabinet" width={1200} height={660}/>}:episodePoker?{label:'Episode-style duel',rules:episodePokerRules,demo:step=><MemoryDuelLesson step={step}/>} :snap.settings.game==='montage'?{label:montagePractice?'FAN RULES · SOLO PRACTICE':'FAN RULES',rules:montagePractice?montagePracticeRules:tutorials.montage,demo:step=><MontageLesson step={step}/>} :snap.settings.game==='colorLink'?{label:'6 × 6 FAN TABLE',rules:tutorials.colorLink,demo:step=><TableLoadBoundary title="Color Link"><Suspense fallback={<span data-lesson-pending role="status">Preparing route example…</span>}><ColorLinkLesson step={step}/></Suspense></TableLoadBoundary>} :snap.settings.game==='coopPuzzle'?{label:'FAN RULES · MOSAIC RELAY',rules:tutorials.coopPuzzle,demo:step=><TableLoadBoundary title="Cooperative Puzzle"><Suspense fallback={<span data-lesson-pending role="status">Preparing the mosaic…</span>}><RelayLesson step={step}/></Suspense></TableLoadBoundary>}:snap.settings.game==='gradation'?{label:'FAN RULES · WEIGHT ALLOCATION',rules:tutorials.gradation,demo:step=><TableLoadBoundary title="Gradation"><Suspense fallback={<span data-lesson-pending role="status">Opening the cabinet…</span>}><GradationLesson step={step}/></Suspense></TableLoadBoundary>}:snap.settings.game==='bigSmall'?{label:'FAN RULES · FICTIONAL CHIPS',rules:tutorials.bigSmall,demo:step=><TableLoadBoundary title="Big Small"><Suspense fallback={<span data-lesson-pending role="status">Preparing the comparison…</span>}><BigSmallLesson step={step}/></Suspense></TableLoadBoundary>}:snap.settings.game==='tripleDice'?{label:'FAN RULES · DICE & FORECAST',rules:tutorials.tripleDice,demo:step=><TableLoadBoundary title="Triple Dice"><Suspense fallback={<span data-lesson-pending role="status">Opening tray example…</span>}><TripleDiceLesson step={step}/></Suspense></TableLoadBoundary>}:snap.settings.game==='flags'?{label:'FAN RULES · FLAG MEMORY',rules:tutorials.flags,demo:step=><TableLoadBoundary title="Flags Around the World"><Suspense fallback={<span data-lesson-pending role="status">Preparing the flag archive…</span>}><FlagsLesson step={step}/></Suspense></TableLoadBoundary>}:snap.settings.game==='threeRow'?{label:'FAN RULES · SEALED ROLES',rules:tutorials.threeRow,demo:step=><TableLoadBoundary title="Four-Player Three in a Row"><Suspense fallback={<span data-lesson-pending role="status">Preparing the print block…</span>}><ThreeRowLesson step={step}/></Suspense></TableLoadBoundary>} :snap.settings.game==='symmetry'?{label:'FAN RULES · PRIVATE BOARDS',rules:tutorials.symmetry,demo:step=><TableLoadBoundary title="Symmetrical Puzzle"><Suspense fallback={<span data-lesson-pending role="status">Preparing mirror tiles…</span>}><SymmetryPuzzleLesson step={step}/></Suspense></TableLoadBoundary>} :snap.settings.game==='heavy13'?{label:'FAN RULES · 2–7 SEATS',rules:tutorials.heavy13,demo:step=><TableLoadBoundary title="Heavy 13"><Suspense fallback={<span data-lesson-pending role="status">Preparing example…</span>}><Heavy13Lesson step={step}/></Suspense></TableLoadBoundary>} :undefined} close={()=>setBriefing(null)} start={briefing==='start'&&host?{enabled:canStart,confirm:()=>command({kind:'start'})}:undefined}/>}
  </main>
  <footer className={'wrap footer'+(isLanding?' landing-footer':'')}><strong>{isLanding&&<BrandSeal/>}{brand}</strong><span>Fan-made and not affiliated with Netflix. No real stakes.</span></footer>
 </>
}
function exportMatch(snap:Snapshot){
 const g=snap.game
 if(!g?.done)return
 const seats=Object.fromEntries(snap.seats.map(s=>[s.id,s.name]))
 const out={game:titles[g.game],rules:g.hitStay?'hit-stay-fan-1':g.treasureIsland?'treasure-island-fan-1':g.piggyBank?'piggy-bank-fan-1':g.equationTower?'equation-tower-fan-1':g.doubtBet?'doubt-and-bet-fan-1':g.unknown?'unknown-fan-1':g.equationHighLow?'equation-high-low-fan-1':g.coopPuzzle?'cooperative-puzzle-fan-1':g.gradation?'gradation-fan-1':g.bigSmall?'big-small-fan-1':g.tripleDice?'triple-dice-fan-1':g.auctionBingo?'auction-bingo-fan-1':g.hiddenWord?'hidden-word-fan-1':g.flags?'flags-fan-1':g.threeRow?'three-row-fan-1':g.symmetry?'symmetry-fan-1':g.colorLink?'color-link-fan-1':g.heavy13?'heavy-13-fan-1':g.timeHold?'time-auction-hold-fan-1':g.memoryDuel?'memory-poker-episode-duel-1':'fan-alpha-1',...(g.treasureIsland?.result?{treasureIsland:{...g.treasureIsland.result,standings:g.treasureIsland.result.standings.map(({seat,...row})=>({name:seats[seat],...row}))}}:{}),...(g.coopPuzzle?{team:{outcome:g.coopPuzzle.reason,covered:g.scores[0],area:g.coopPuzzle.width*g.coopPuzzle.height,turns:g.coopPuzzle.turns,elapsedMs:g.coopPuzzle.elapsed}}:{}),...(g.gradation?{gradation:{teams:g.gradation.teams.map(t=>t.map(id=>seats[id])),winner:g.gradation.winner,totals:g.gradation.totals,marked:g.gradation.marked,rounds:g.gradation.history}}:{}),...(g.hitStay?{hitStay:{hands:g.hitStay.round,stacks:g.hitStay.seats.map(({id,chips})=>({name:seats[id],chips}))}}:{}),...(g.bigSmall?{bigSmall:{end:g.bigSmall.end,rounds:g.bigSmall.history.length,stacks:g.bigSmall.seats.map((id,i)=>({name:seats[id],chips:g.bigSmall!.chips[i]}))}}:{}),...(g.auctionBingo?.results?{auctionBingo:{standings:g.auctionBingo.results.map(({seat,...row})=>({name:seats[seat],...row}))}}:{}),...(g.flags?.results?{flags:{mode:g.flags.mode,standings:g.flags.results.map(({seat,...row})=>({name:seats[seat],...row}))}}:{}),...(g.symmetry?.results?{symmetry:g.symmetry.results.map(({seat,rank,score})=>({name:seats[seat],rank,solved:score.solved,elapsedMs:score.elapsedMs,partial:score.partial}))}:{}),...(g.timeHold?{rounds:g.timeHold.history.map(r=>({round:r.round,winner:r.winner?seats[r.winner]:null,seconds:r.elapsedTenths/10})),ranks:g.timeHold.ranks?.map(group=>group.map(id=>seats[id]))}:{}),...(g.heavy13?{penalties:g.heavy13.scores.map(s=>({name:seats[s.seat],count:s.penalty,lastPlacement:s.lastPenalty})),leaders:g.heavy13.leaders.map(id=>seats[id])}:{}),...(g.montage?{team:{mode:g.montage.mode,outcome:g.montage.outcome,cleared:g.montage.clearedRounds,rounds:g.montage.totalRounds,errors:g.montage.errors,pieces:g.montage.pieces.map(p=>({name:seats[p.seat],pieces:p.pieces}))}}:{}),...(g.wallGo?{territory:{turns:g.wallGo.turns,reason:g.wallGo.end,neutral:g.wallGo.territory.neutral,areas:g.seats.map((s,i)=>({name:seats[s],cells:g.wallGo!.territory.scores[i]}))}}:{}),...(g.memoryDuel?{deal:g.memoryDuel.dealNumber,outcome:g.memoryDuel.result?.kind}:{}),...(g.piece?{team:{...g.piece.score,clues:g.piece.hints}}:{}),...(g.tower?{team:{...g.tower.score,maximum:g.tower.columns.length}}:{}),...(g.scale?{team:{score:g.scale.score,maximum:5,weighings:g.scale.log.length}}:{}),...(g.fragments?{team:{correct:g.fragments.correct,total:g.fragments.total,passed:g.fragments.passed,strict:g.fragments.strict}}:{}),winner:g.winner?seats[g.winner]:null,fixtures:snap.fixtures.slice(0,snap.fixture+1).map(f=>({seats:f.sides.map(s=>seats[s]),winner:f.winner?seats[f.winner]:null})),scores:!g.hitStay&&!g.heavy13&&!isDuel(g.game)?g.seats.map((s,i)=>({name:seats[s],points:g.scores[i],...(g.fence?.results?{solvedSeconds:(g.fence.results.find(r=>r.id===s)?.elapsed??null)===null?null:g.fence.results.find(r=>r.id===s)!.elapsed!/1000}:{}),...(g.spot?.results?.[s]?{adjustedSeconds:g.spot.results[s][1]/1000}:{}),...(g.mancala?{colorScores:g.mancala.points[i],total:total(g.mancala.points[i])}:{}),...(g.game==='auction'&&!g.timeHold?{timeBank:g.credits[i]/1000}:{})})):undefined}
 const url=URL.createObjectURL(new Blob([JSON.stringify(out,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='mind-arena-result.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)
}
createRoot(document.getElementById('root')!).render(<App/>)
