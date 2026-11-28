import {useCallback,useEffect,useLayoutEffect,useRef,useState} from 'react'
import {isDuel,type GameView} from './engine'
import type {Seat,Snapshot} from './room'
import {PlayerPortrait} from './player-wardrobe'
import './match-play.css'

type ActiveSnapshot=Snapshot&{game:GameView}
const hasTurn=(g:GameView)=>!!g.hitStay?.turn||!!g.doubtBet?.turn||isDuel(g.game)||g.game==='mancala'||g.game==='grass1'||g.game==='grass3'||g.game==='piece'||g.game==='coopPuzzle'

export function useBoardFocus(match:string|undefined,finishedMatch:string|undefined){
 const [chosen,setChosen]=useState<string>()
 const button=useRef<HTMLButtonElement>(null)
 const handoff=useRef(false)
 const bindButton=useCallback((node:HTMLButtonElement|null)=>{
  // The detach callback runs before React removes the currently focused node.
  if(!node&&button.current)handoff.current=document.activeElement===button.current
  button.current=node
 },[])
 useLayoutEffect(()=>{
  const wasOnToggle=handoff.current
  handoff.current=false
  if(finishedMatch&&wasOnToggle&&document.activeElement===document.body)
   document.querySelector<HTMLElement>('[data-board-result]')?.focus()
 },[match,finishedMatch])
 const focused=!!match&&chosen===match
 useEffect(()=>{if(!match)setChosen(undefined)},[match])
 useEffect(()=>{
  if(!focused)return
  function leave(event:KeyboardEvent){
   // Game controls get first refusal (e.g. cancel a wall draft or release a bid).
   if(event.key!=='Escape'||event.defaultPrevented||event.repeat||event.altKey||event.ctrlKey||event.metaKey)return
   setChosen(undefined)
   button.current?.focus({preventScroll:true})
  }
  document.addEventListener('keydown',leave)
  return ()=>document.removeEventListener('keydown',leave)
 },[focused])
 return {focused,button:bindButton,toggle:()=>{
  if(!match)return
  setChosen(focused?undefined:match)
  // The same button remains mounted in both layouts and keeps its focus.
  if(!focused)requestAnimationFrame(()=>window.scrollTo({top:0,behavior:'instant'}))
 }}
}

function MatchSeat({seat,you,watching,turn,teammate=false}:{seat:Seat;you:boolean;watching:boolean;turn:boolean;teammate?:boolean}){
 const detail=watching?'Watching':!seat.online?'Offline':you?'You':seat.bot?'Bot':turn?'To move':teammate?'Teammate':'Opponent'
 return <div className="match-seat" data-match-role={you?'self':'opponent'} data-turn-seat={turn||undefined}>
  <span className="match-seat-portrait" aria-hidden="true">
   {seat.appearance===undefined?<span className="match-seat-initial">{seat.name.slice(0,1).toLocaleUpperCase()}</span>:<PlayerPortrait look={seat.appearance} decorative/>}
  </span>
  <div className="match-seat-copy">
   <strong title={seat.name}>{seat.name}</strong>
   <small>{detail}</small>
  </div>
  {turn&&<span className="match-seat-turn" aria-label="To move">◇</span>}
 </div>
}

export function MatchInstruments({snap,title,active,control}:{snap:ActiveSnapshot;title:string;active:boolean;control:ReturnType<typeof useBoardFocus>}){
 const {game,you}=snap
 const byId=new Map(snap.seats.map(seat=>[seat.id,seat]))
 const self=byId.get(you)
 const rivals=game.seats.filter(id=>id!==you).map(id=>byId.get(id)).filter((seat):seat is Seat=>!!seat)
 const yourTeam=game.gradation?.teams.find(side=>side.includes(you))
 const turn=active&&hasTurn(game)?game.turn:undefined
 return <div className="match-instruments">
  {!control.focused?<section className="match-seats" aria-label="At this table" data-crowded={rivals.length>2||undefined}>
   {self&&<MatchSeat seat={self} you watching={!game.seats.includes(you)} turn={you===turn}/>}
   {rivals.length>0&&<div className="match-opponents" role="group" aria-label={game.coopPuzzle?'Teammates':yourTeam&&game.seats.length>2?'Other seats':'Opponents'} tabIndex={rivals.length>1?0:undefined}>
    {rivals.map(seat=><MatchSeat key={seat.id} seat={seat} you={false} watching={false} teammate={!!game.coopPuzzle||!!yourTeam?.includes(seat.id)} turn={seat.id===turn}/>)}
   </div>}
  </section>:<div className="match-focus-title" aria-hidden="true"><small>BOARD VIEW</small><strong>{title}</strong></div>}
  <button type="button" className="board-focus-switch" ref={control.button} aria-pressed={control.focused}
   onClick={control.toggle} title={control.focused?'Exit focus (Esc)':'Enlarge the table and hide side information'}>
   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
    {control.focused?<path d="M3 8h5V3m8 0v5h5M3 16h5v5m8 0v-5h5"/>:<path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5M10 10h4v4h-4z"/>}
   </svg>
   <span>{control.focused?'Exit focus':'Board focus'}</span>
  </button>
 </div>
}
