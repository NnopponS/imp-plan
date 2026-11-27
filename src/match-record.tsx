import type {ReactNode} from 'react'
import {isDuel,type GameView} from './engine'
import {isPuzzle} from './puzzles'
import type {Snapshot} from './room'
import './match-record.css'
import {KnightResultImageActions,KnightResultPrint} from './knight-result'
import {knightPrintData} from './knight-result-art'

type RoundMark='move'|'wait'|'watch'|'paused'
type ResultMark='win'|'draw'|'complete'|'closed'
type ActionMark='lobby'|'rematch'|'next'|'export'
type SeatName=(id:string)=>string
const scoreFormat=new Intl.NumberFormat('en',{maximumFractionDigits:2})

function TableMark({kind}:{kind:RoundMark|ActionMark}){
 const lines={
  move:<><circle cx="8" cy="12" r="4"/><path d="M14 12h7m-3.5-3.5L21 12l-3.5 3.5M8 9.7v.1"/></>,
  wait:<path d="M7 4h10M7 20h10m-8-16v3c0 2 3 3 3 5s-3 3-3 5v3m6-16v3c0 2-3 3-3 5s3 3 3 5v3m-5-2h4"/>,
  watch:<><path d="M2 12s4-6 10-6 10 6 10 6-4 6-10 6-10-6-10-6Z"/><circle cx="12" cy="12" r="2.5"/></>,
  paused:<path d="M8 5H5v14h3zm8 0h3v14h-3z"/>,
  lobby:<path d="M10 4h9v16h-9m2-8H3m0 0 4-4m-4 4 4 4m9-4h.1"/>,
  rematch:<path d="M19.5 9A8 8 0 0 0 6 6.5L3 10m0 0V4m0 6h6m-4.5 5A8 8 0 0 0 18 17.5l3-3.5m0 0v6m0-6h-6"/>,
  next:<path d="m4 6 7 6-7 6m8-12 7 6-7 6"/>,
  export:<path d="M8 3H5v18h14V3h-3m-4 0v12m-3-3 3 3 3-3M8 18h8"/>
 }
 return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">{lines[kind]}</svg>
}

// Give existing turn captions a quiet marker without adding another row to the board.
export function RoundHeading({game,you,active,children}:{game:GameView,you:string,active:boolean,children:ReactNode}){
 const hasTurn=['point','morris','bagh','mancala'].includes(game.game)
 if(!hasTurn||game.done)return <h2>{children}</h2>
 const mark:RoundMark=!active?'paused':!game.seats.includes(you)?'watch':game.turn===you?'move':'wait'
 return <h2 className="round-heading" aria-live="polite" aria-atomic="true"><span data-round-mark={mark}><TableMark kind={mark}/></span><span>{active?children:'Controls paused'}</span></h2>
}

export function ReturnToLobby({active,onReturn}:{active:boolean,onReturn:()=>void}){
 return <button className="match-action match-return" type="button" disabled={!active} onClick={onReturn}><TableMark kind="lobby"/>Return to lobby</button>
}

function TableSeal({kind}:{kind:ResultMark}){
 return <svg className="match-seal" data-match-seal={kind} viewBox="0 0 72 72" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
  <path d="m36 3 7 3 7 .3 4.4 5.6 6.5 3 1.7 7 4.3 5.6L66 35l1.1 7.4-4.3 5.6-1.7 7-6.5 3-4.4 5.6-7 .4-7 3-7-3-7-.4-4.4-5.6-6.5-3-1.7-7-4.3-5.6L6 35l-.9-7.5 4.3-5.6 1.7-7 6.5-3 4.4-5.6 7-.3z" fill="currentColor" fillOpacity=".10" strokeWidth=".75"/>
  <circle cx="36" cy="35" r="25.2" strokeWidth=".75"/><circle cx="36" cy="35" r="22" strokeWidth=".6" strokeDasharray="1 2.7"/>
  <path d="M36 11v3m0 42v3M12 35h3m42 0h3" strokeWidth=".8"/>
  {kind==='win'?<g strokeWidth="1.5"><path d="M27 24h18v7a9 9 0 0 1-18 0zm0 2h-6v3a7 7 0 0 0 7 7m17-10h6v3a7 7 0 0 1-7 7m-8 4v7m-7 2h14m-12-2 5-2 5 2"/><path d="m36 27 1.1 2.4 2.6.3-2 1.8.6 2.6-2.3-1.4-2.3 1.4.6-2.6-2-1.8 2.6-.3z" strokeWidth=".85"/></g>:
   kind==='draw'?<g strokeWidth="1.45"><path d="M24 30h24m-24 10h24"/><circle cx="24" cy="30" r="1.4" fill="currentColor"/><circle cx="48" cy="40" r="1.4" fill="currentColor"/><path d="m36 22 1.8 1.8-1.8 1.8-1.8-1.8zm0 23 1.8 1.8-1.8 1.8-1.8-1.8z" strokeWidth=".8"/></g>:
   kind==='complete'?<g strokeWidth="1.6"><path d="m27 35 6 6 12-13M27 24h-3v7m24-7h-3m3 0v7M24 39v7h7m17-7v7h-7"/><path d="M29 48h14" strokeWidth=".6"/></g>:
   <g strokeWidth="1.45"><path d="M26 23h17l3 3v21H26zm16 0v5h4m-15 5h10m-10 5h10m-10 5h6"/><path d="m24 23-1 2v24h21" strokeWidth=".65"/></g>}
 </svg>
}

function resultLabel(g:GameView):{mark:ResultMark,label:string}{
 const team=g.montage?g.montage.outcome==='cleared':g.scale?g.scale.score===5:g.tower?g.tower.score.passed:g.piece?g.piece.score.adjustedMs!==null:g.fragments?g.fragments.passed:null
 if(team!==null)return team?{mark:'complete',label:'Objective met'}:{mark:'closed',label:'Objective not met'}
 if(g.memoryDuel?.result?.kind==='void')return {mark:'closed',label:'No contest'}
 if(isPuzzle(g.game)&&g.seats.length===1)return {mark:'complete',label:'Practice recorded'}
 if(g.winner)return {mark:'win',label:'Victory'}
 if(isDuel(g.game))return {mark:'draw',label:'Draw'}
 if((g.heavy13?.leaders.length??0)>1||(g.timeHold?.ranks?.[0]?.length??0)>1)return {mark:'draw',label:'Shared lead'}
 return {mark:'closed',label:'Play concluded'}
}

export function PointScores({game,name,active}:{game:GameView,name:SeatName,active:boolean}){
 return <ul className="point-scoreboard" role="list" aria-label="Point Gomoku scores">{game.seats.map((seat,i)=><li key={seat} data-side={i} data-current={active&&!game.done&&seat===game.turn||undefined}>
  <span className="point-token" aria-hidden="true"/><span>{name(seat)}</span><strong>{scoreFormat.format(game.scores[i])} <small>pts</small></strong>
 </li>)}</ul>
}

export function LeagueStandings({snap,name}:{snap:Snapshot,name:SeatName}){
 if(snap.game?.game==='auction'||snap.fixtures.length<2||!snap.seriesDone)return null
 const scores=snap.seats.map(s=>({id:s.id,played:0,points:0}))
 for(const f of snap.fixtures)for(const s of scores)if(f.sides.includes(s.id)){s.played++;if(f.winner===s.id)s.points++;else if(!f.winner)s.points+=0.5}
 const rows=scores.filter(s=>s.played>0).map(s=>({...s,average:s.points/s.played})).sort((a,b)=>b.average-a.average)
 return <section className="league-ledger" aria-label="League standings"><h3>League standings</h3>
  <ol role="list">{rows.map(s=>{
   const rank=rows.findIndex(r=>r.average===s.average)+1
   return <li key={s.id}><b className="league-rank"><span className="sr">Rank </span>{rank}</b><span>{name(s.id)}</span><strong>{scoreFormat.format(s.average)} <small>pts / leg</small></strong></li>
  })}</ol>
 </section>
}

export function MatchRecord({snap,name,active,onExport,onReturn,onNext,folio}:{snap:Snapshot,name:SeatName,active:boolean,onExport:()=>void,onReturn?:()=>void,onNext?:()=>void;folio?:ReactNode}){
 if(!snap.game?.done)return null
 const {mark,label}=resultLabel(snap.game)
 const knight=knightPrintData(snap.game)
 const repeat=onNext&&<button className="match-action primary" type="button" disabled={!active} onClick={onNext}><TableMark kind={snap.seriesDone?'rematch':'next'}/>{snap.seriesDone?'Rematch':'Next leg'}</button>
 return <section className={'match-record'+(knight?' knight-match-record':'')} aria-label="Match record">
  {knight?<><div className="match-record-imprint"><TableSeal kind={mark}/><h3>Match record{folio}</h3></div><KnightResultPrint result={knight}/></>:<div className="match-record-imprint"><TableSeal kind={mark}/><div><h3>Match record{folio}</h3><p>{label}{mark==='win'&&snap.game.winner?' · '+name(snap.game.winner):''}</p></div></div>}
  <LeagueStandings snap={snap} name={name}/>
  <div className="match-record-actions">
   {knight&&<><KnightResultImageActions key={snap.match} result={knight}/>{repeat}</>}
   <button className="match-action" type="button" onClick={onExport}><TableMark kind="export"/>Export result</button>
   {onReturn&&<ReturnToLobby active={active} onReturn={onReturn}/>}
   {!knight&&repeat}
  </div>
 </section>
}
