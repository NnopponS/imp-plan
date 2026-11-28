import {useRef,useState,type ComponentProps} from 'react'
import {GameArt} from './art'
import {useCardPress} from './card-press'
import {CardMark,GameDetailsDialog} from './game-details'
import {GameCardIdentity,GameVenue} from './game-identity'
import {titles,type Game} from './engine'
import './card-shelf.css'

export function GalleryCard({game,entry,motionOff,practice}:{game:Game;entry:ComponentProps<typeof GameCardIdentity>['entry']&{sources:string[]}|undefined;motionOff:boolean;practice:(launcher:string)=>void}){
 const [sheet,setSheet]=useState<'cover'|'details'|null>(null)
 const cover=useRef<HTMLButtonElement>(null)
 const detail=useRef<HTMLButtonElement>(null)
 const launcher='practice-gallery-'+game
 const press=useCardPress(()=>setSheet('cover'))
 const close=()=>setSheet(null)
 const play=()=>{close();practice(launcher)}
 return <article className="card" data-cover-card>
  <GameArt mode={game} motionOff={motionOff}/>
  <button {...press} className="game-cover-hit" type="button" ref={cover} aria-label={'Open '+titles[game]} title="Tap or hold for game preview" aria-haspopup="dialog"/>
  <div className="game-card-body">
   <GameCardIdentity game={game} entry={entry}/>
   <div className="game-card-actions">
    <button type="button" className="game-practice-mark" id={launcher} onClick={play} aria-label={'Practice '+titles[game]} title="Practice"><CardMark kind="play"/></button>
    <button type="button" className="game-details-trigger" ref={detail} onClick={()=>setSheet('details')} aria-label={'Details for '+titles[game]} title="Details" aria-haspopup="dialog"><CardMark kind="inspect"/></button>
   </div>
  </div>
  {sheet&&<GameDetailsDialog game={game} motionOff={motionOff} source={entry?.sources[0]} context={entry&&<GameVenue entry={entry}/>}
   compact={sheet==='cover'} action={{verb:'Practice',run:play}} close={close} restore={()=> (sheet==='cover'?cover:detail).current?.focus({preventScroll:true})}/>}
 </article>
}
