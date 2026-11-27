import {useEffect,useState,type CSSProperties} from 'react'
import {type Game} from './engine'
import {gameArtSources} from './art'
import {base} from './brand'
import {GameToken} from './game-identity'
import {FolioMark} from './folio-controls'
import {LandingMark} from './landing-art'
import {getGameVenue,type GameVenueKind} from './game-venues'
import catalog from './catalog.json'
import './stage-folio.css'

type Stage='home'|'season'|'invite'|'connecting'|'practice'|'party'|'brief'|'rules'|'match'|'result'
type Scene={phase:Stage;game?:Game;season?:number;hold?:boolean}
type StageInput={invite:boolean;season?:number;seat?:'solo'|'host'|'join';game?:Game;match?:string;finished?:boolean;hold?:boolean}
const venueByGame=new Map(catalog.flatMap(row=>row.game?[[row.game,getGameVenue(row).kind] as const]:[]))
const reduce='(prefers-reduced-motion: reduce)'
export const folioDuration=390
const fallback=465

/** A cue belongs to a screen, not a turn, clock tick, join substep, or players' private data. */
export function stageFolio({invite,season,seat,game,match,finished,hold}:StageInput):Scene&{key:string}{
 const phase=!seat?(invite?'invite':season?'season':'home'):!game?'connecting':match?(finished?'result':'match'):seat==='solo'?'practice':'party'
 const key=[phase,phase==='season'?season:null,game,match,hold?'hold':null].filter(Boolean).join(':')
 return {phase,key,season,game,hold}
}

export function folioArtwork({phase,game,season,hold}:Scene):{src?:string;mobile?:string;venue?:GameVenueKind}{
 if(game){
  const source=gameArtSources(game)
  return {...(game==='auction'&&hold?{src:base+'art/time-auction-chamber.svg'}:source),venue:venueByGame.get(game)}
 }
 if(phase==='home')return {src:base+'art/landing-hero.svg',mobile:base+'art/landing-hero-mobile.svg'}
 if(phase==='season')return {src:base+'art/landing-season-'+season+'.svg'}
 return {}
}

const venueEngraving={
 main:'main',mini:'main',prize:'prize',prison:'prison',secret:'secret',final:'final',exile:'exile',
 side:'other',unconfirmed:'other',unaired:'other',
} as const

/** This is decoration only. Never gate content, move focus, or swallow an input. */
export function FolioTransition({scene,motionOff=false,suspend=false}:{scene:Scene;motionOff?:boolean;suspend?:boolean}){
 const [done,setDone]=useState(()=>motionOff||suspend||
  (typeof window!=='undefined'&&(document.hidden||window.matchMedia?.(reduce)?.matches===true)))
 useEffect(()=>{
  if(done)return
  if(motionOff||suspend){setDone(true);return}
  const media=window.matchMedia?.(reduce)
  const dismiss=()=>setDone(true)
  const visibility=()=>{if(document.hidden)dismiss()}
  const preference=()=>{if(media?.matches)dismiss()}
  const timeout=window.setTimeout(dismiss,fallback)
  document.addEventListener('keydown',dismiss,true)
  document.addEventListener('pointerdown',dismiss,true)
  document.addEventListener('wheel',dismiss,{capture:true,passive:true})
  document.addEventListener('visibilitychange',visibility)
  media?.addEventListener?.('change',preference)
  return ()=>{
   window.clearTimeout(timeout)
   document.removeEventListener('keydown',dismiss,true)
   document.removeEventListener('pointerdown',dismiss,true)
   document.removeEventListener('wheel',dismiss,true)
   document.removeEventListener('visibilitychange',visibility)
   media?.removeEventListener?.('change',preference)
  }
 },[done,motionOff,suspend])
 if(done||motionOff||suspend)return null
 const art=folioArtwork(scene)
 return <span className="stage-folio-slot" aria-hidden="true">
  <span className="stage-folio" data-folio-stage={scene.phase} data-folio-game={scene.game} data-folio-venue={art.venue}
   style={{'--folio-time':folioDuration+'ms'} as CSSProperties} onAnimationEnd={event=>{if(event.target===event.currentTarget)setDone(true)}}>
   {art.src&&<picture>{art.mobile&&<source media="(max-width:685px)" srcSet={art.mobile}/>}<img src={art.src} width={96} height={23} alt="" draggable={false} decoding="async" fetchPriority="low"/></picture>}
   <svg className="stage-folio-edge" viewBox="0 0 96 23" preserveAspectRatio="none" focusable="false" fill="none">
    <path className="stage-folio-rim" d="M2 5 8 1.5h78l8 4v12l-7 4H8l-6-4z"/>
    <path className="stage-folio-engrave" d="M11 5 7 8v7l4 3m74 0 5-3V8l-5-3M16 3.7h25m14 0h25m-64 15.6h25m14 0h25"/>
   </svg>
   {scene.game?<><GameToken game={scene.game}/>{art.venue&&<FolioMark kind={venueEngraving[art.venue]}/>}</>:scene.phase==='invite'||scene.phase==='connecting'?<FolioMark kind={scene.phase==='invite'?'invite':'create'}/>:<LandingMark mark={scene.phase==='season'?'book':'lantern'}/>}
  </span>
 </span>
}
