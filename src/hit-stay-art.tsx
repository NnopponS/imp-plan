import type {ReactNode} from 'react'
import type {HitCard} from './hit-stay'
import './hit-stay.css'

const suits:Record<HitCard['suit'],string>={
 spade:'M20 5c-4 5-12 10-12 16a6 6 0 0 0 11 3c0 4-1 6-4 8h10c-3-2-4-4-4-8a6 6 0 0 0 11-3C32 15 24 10 20 5Z',
 diamond:'M20 6c3 6 8 11 13 15-5 3-10 8-13 14-3-6-8-11-13-14C12 17 17 12 20 6Z',
 club:'M20 7a6 6 0 0 1 4 10 7 7 0 1 1-3 9c1 4 2 6 5 8H14c3-2 4-4 5-8a7 7 0 1 1-3-9 6 6 0 0 1 4-10Z',
 heart:'M20 32C14 28 6 22 6 15a7 7 0 0 1 14-1 7 7 0 0 1 14 1c0 7-8 13-14 17Z',
}
const rankMark=(rank:number)=>['','A','2','3','4','5','6','7','8','9','10','J','Q','K'][rank]
const rankName=(rank:number)=>({1:'Ace',11:'Jack',12:'Queen',13:'King'} as Record<number,string>)[rank]??String(rank)
const ornaments='M7 17v-6h6m44 6v-6h-6M7 75v6h6m44-6v6h-6M20 47l12-19 12 19-12 19zM15 47l17-24 17 24-17 24z'
export function HitCardArt({card}:{card?:HitCard}){
 const warm=card&&(card.suit==='heart'||card.suit==='diamond')
 return <svg className="hit-card" data-hit-card={card?'face':'back'} data-suit={card?.suit} viewBox="0 0 64 92" width="64" height="92" role="img" aria-label={card?rankName(card.rank)+' of '+card.suit+'s':'Face-down card'}>
  <rect x="1" y="1" width="62" height="90" rx="6" fill={card?'#f6e8c9':'#1b3b35'} stroke={card?'#bf9870':'#af8856'} strokeWidth="1.5"/>
  <rect x="4" y="4" width="56" height="84" rx="4" fill="none" stroke={card?'#bd9d6a':'#c49960'} strokeWidth=".75"/>
  {card?<g fill={warm?'#813c3b':'#244540'}>
   <path d={ornaments} fill="none" stroke="#b29363" strokeWidth=".7"/>
   <path d={suits[card.suit]} transform="translate(14 29) scale(.9)"/>
   <path d={suits[card.suit]} transform="translate(6 22) scale(.24)"/>
   <path d={suits[card.suit]} transform="translate(58 70) rotate(180) scale(.24)"/>
   <g fontFamily="Georgia,serif" fontWeight="bold" fontSize="13" textAnchor="start">
    <text x="8" y="22">{rankMark(card.rank)}</text><text transform="translate(56 70) rotate(180)">{rankMark(card.rank)}</text>
   </g>
  </g>:<g fill="none" stroke="#d4b37a" strokeWidth=".85">
   <path d="M7 10l50 72M57 10 7 82M7 24l42 60M57 24 15 84M7 40l30 44M57 40 27 84M14 8l43 61M50 8 7 69M27 8l30 44M37 8 7 52" opacity=".27"/>
   <path d={ornaments}/>
   <path d="m32 35 4 8 8 4-8 4-4 8-4-8-8-4 8-4z" fill="#2b5649"/>
   <circle cx="32" cy="47" r="2.6" fill="#e6bf81"/>
   <path d="m32 11 3 3-3 3-3-3zm0 65 3 3-3 3-3-3z" fill="#ba965f"/>
  </g>}
 </svg>
}
export function HitChip(){
 return <svg className="hit-chip" viewBox="0 0 28 28" width="20" height="20" aria-hidden="true">
  <circle cx="14" cy="14" r="12" fill="#af713b" stroke="#ebc68b"/>
  <circle cx="14" cy="14" r="8" fill="#d2a569" stroke="#754627"/>
  <path d="M14 3v3m0 16v3M3 14h3m16 0h3M6 6l2 2m12 12 2 2M6 22l2-2M20 8l2-2" stroke="#f5d9a3" strokeWidth="1.4"/>
  <path d="m14 9 4 5-4 5-4-5z" fill="#67412c" stroke="#f6d59b"/>
 </svg>
}
export function HitCards({cards,count=cards?.length??0}:{cards?:readonly HitCard[];count?:number}){
 return <div className="hit-cards">{Array.from({length:count},(_,i)=><HitCardArt key={i} card={cards?.[i]}/>)}</div>
}
export function HitFelt({children}:{children:ReactNode}){
 return <div className="hit-felt">
  <svg className="hit-etch" viewBox="0 0 700 296" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
   <g fill="none" stroke="currentColor">
    <ellipse cx="350" cy="148" rx="277" ry="124"/><ellipse cx="350" cy="148" rx="267" ry="117"/>
    <ellipse cx="350" cy="148" rx="253" ry="106" strokeDasharray="2 5"/>
    <path d="M350 23v250M73 148h554M171 54l358 188m0-188L171 242M350 53l182 95-182 95-182-95z" opacity=".45"/>
    <path d="m350 77 8 56 32 15-32 15-8 55-8-55-32-15 32-15z" opacity=".55"/>
    <circle cx="350" cy="148" r="64" strokeDasharray="2 4"/>
   </g>
  </svg>{children}
 </div>
}
