import type {JSX} from 'react'
import {titles,type Game} from './engine'
import {glyphsA} from './game-glyphs-a'
import {glyphsB} from './game-glyphs-b'
import {getGameVenue} from './game-venues'
import './game-identity.css'

type VenueEntry=Parameters<typeof getGameVenue>[0]
const engravings={...glyphsA,...glyphsB,flags:<path d="M11 32V8m0 2q5-4 10 0t9 0v13q-4 4-9 0t-10 0M8 32h7"/>,threeRow:<><path d="M10 10h20v20H10zM10 16h20M10 24h20M16 10v20m8-20v20m-12-3 16-15"/><path d="m13 26 1.5-5 3 1m3.5-4 1.5-5 3 1"/></>} satisfies Record<Game,JSX.Element>
const tokenEnamel:Record<Game,'wood'|'green'|'red'|'blue'|'teal'>={
 fragments:'wood',secret:'red',tower:'green',scale:'wood',grass1:'green',
 montage:'blue',blind:'red',morris:'wood',hex:'blue',remove:'red',auction:'wood',
 mancala:'green',wallGo:'blue',pyramid:'wood',bagh:'red',knight:'blue',cubes:'blue',
 rectangles:'wood',grass3:'green',memoryPoker:'red',heavy13:'red',piece:'wood',
 spot:'blue',codeLock:'red',fence:'green',exile:'green',divine:'red',point:'wood',equations:'blue',colorLink:'teal',symmetry:'teal',threeRow:'red',flags:'teal',
}
export function GameToken({game}:{game:Game}){
 return <svg className="game-token" data-enamel={tokenEnamel[game]} viewBox="0 0 40 40" width="40" height="40" aria-hidden="true" focusable="false">
  <path className="token-rim" d="M11 2h18l9 9v18l-9 9H11l-9-9V11z"/>
  <path className="token-inlay" d="M12 5h16l7 7v16l-7 7H12l-7-7V12z"/>
  <g data-token-engraving fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{engravings[game]}</g>
 </svg>
}
export function GameVenue({entry,compact=false}:{entry:VenueEntry;compact?:boolean}){
 const venue=getGameVenue(entry)
 return <span className="game-venue" title={compact?venue.caption:undefined}><span className="game-venue-badge" data-venue={venue.kind}>{venue.label}</span>{' '}<span className="game-venue-place" hidden={compact}>{venue.caption}</span></span>
}
export function GameCardIdentity({game,entry}:{game:Game;entry?:VenueEntry}){
 return <>
  <div className="game-card-title"><GameToken game={game}/><h3>{titles[game]}</h3></div>
  {entry&&<div className="game-card-provenance"><GameVenue entry={entry} compact/></div>}
 </>
}
