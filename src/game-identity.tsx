import type {JSX} from 'react'
import {titles,type Game} from './engine'
import {glyphsA} from './game-glyphs-a'
import {glyphsB} from './game-glyphs-b'
import {getGameVenue} from './game-venues'
import './game-identity.css'

type VenueEntry=Parameters<typeof getGameVenue>[0]
const engravings={...glyphsA,...glyphsB,doubtBet:<path d="m9 9 14 2-3 20-14-2zm15 4 8 4-8 15-3-2m-9-11 4-4 3 5-4 4zm14 5 2-3"/>,wallGo2:<path d="M7 8h26v24H7zM15 8v24m9-24v24M7 16h26M7 24h26m-23-6h3v4h-3zM27 12h3m-3 0v8h3"/>,auctionBingo:<path d="M7 8h26v24H7zM7 16h26M7 24h26M16 8v24M24 8v24m-14-4 19-16"/>,equationHighLow:<path d="M6 10h11v20H6zM23 10h11v20H23zM9 21h5m-2.5-2.5v5m14-4h6m-6 4h6"/>,coopPuzzle:<path d="M7 8h23v23H7zM8 19h9v-5h6v-6m-6 11v12m0-7h13m-7-10v10"/>,gradation:<><path d="M8 28h24M10 26v-6h4v6m3 0V15h4v11m3 0V9h5v17M10 13l5-3m15 23H12"/></>,bigSmall:<path d="m12 8 13 4-5 19-13-4zm15 3 7 2-5 19-7-2m-11-9 5-5 2 6z"/>,tripleDice:<path d="m10 14 10-6 10 6v12l-10 6-10-6zm0 0 10 6 10-6m-10 6v12m-5-13v1m10 1v1m2 2v1m-7-12v1"/>,flags:<path d="M11 32V8m0 2q5-4 10 0t9 0v13q-4 4-9 0t-10 0M8 32h7"/>,threeRow:<><path d="M10 10h20v20H10zM10 16h20M10 24h20M16 10v20m8-20v20m-12-3 16-15"/><path d="m13 26 1.5-5 3 1m3.5-4 1.5-5 3 1"/></>,equationTower:<path d="M6 31h28M9 30v-5h9v5m-8-6v-5h7v5m4 6v-7h9v7m-8-8v-6h7v6m-6-7V9h5v6M13 19v4m-2-2h4m9-1h4"/>,hiddenWord:<path d="M7 12h21v15H7zm0 1 10.5 7.5L28 13m-21 13 7.3-6m13.7 6-6.5-6m6.5 1a5.4 5.4 0 1 0 0-10.8m3.7 9 4.7 4.7"/> ,unknown:<path d="M8 15 20 8l12 7v12l-12 7-12-7zM8 15l12 7 12-7M20 22v12m-6-20h.5m12 7h.5m-12 6h.5"/>} satisfies Record<Game,JSX.Element>
const tokenEnamel:Record<Game,'wood'|'green'|'red'|'blue'|'teal'>={
 fragments:'wood',secret:'red',tower:'green',scale:'wood',grass1:'green',
 montage:'blue',blind:'red',morris:'wood',hex:'blue',remove:'red',auction:'wood',
 mancala:'green',wallGo:'blue',wallGo2:'teal',pyramid:'wood',bagh:'red',knight:'blue',cubes:'blue',
 rectangles:'wood',grass3:'green',memoryPoker:'red',heavy13:'red',piece:'wood',
 doubtBet:'red',spot:'blue',codeLock:'red',fence:'green',exile:'green',divine:'red',point:'wood',equations:'blue',colorLink:'teal',symmetry:'teal',threeRow:'red',coopPuzzle:'wood',flags:'teal',gradation:'wood',bigSmall:'green',tripleDice:'teal',auctionBingo:'red',equationHighLow:'red',hiddenWord:'teal',unknown:'wood',equationTower:'wood',
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
