import type {DoubtCard} from './doubt-bet'
const etch:Record<DoubtCard,string>={
 red:'M30 15c2 8 12 11 12 22a12 12 0 0 1-24 0c0-5 4-10 7-13l-1 8c6-3 6-11 6-17Zm1 20c1 4 5 6 5 10a5 5 0 0 1-10 0c0-4 3-7 5-10Z',
 yellow:'M30 13l2 8m-2 26-2 7M12 32l8 1m20 0 8-1M17 20l6 6m13 13 7 6m0-25-6 6m-13 13-6 6M30 24a9 9 0 1 1 0 18 9 9 0 1 1 0-18Z',
 green:'M18 48c0-16 5-25 24-28-1 17-6 27-23 27m-1 8 22-32m-15 22-1-9m8 2 7-1m-8-5 1-5',
 blue:'M11 31c9 0 10-12 20-12 7 0 10 4 11 9-5-3-9-1-9 2 0 2 4 6 14 4M12 40c4 0 7-5 11-5s7 5 11 5 7-5 13-5M14 46c4 0 6-3 9-3 4 0 7 4 11 4 5 0 6-4 11-4',
 purple:'M30 14l11 9 1 19-12 12-12-12 1-19zm0 0-6 10 6 30 6-30zm-11 9 5 1h12l5-1m-23 19 6-5h12l6 5',
 wild:'M30 11l5 16 15 5-15 5-5 17-5-17-15-5 15-5zm-12 9 3 3m21 21-3-3m2-22-3 4m-18 21 3-4m7-17v18m-9-9h18',
}
const back='M30 11 51 33 30 54 9 33Zm0 7 14 15-14 15-14-15Zm0 7 8 8-8 8-8-8Z'
const shades:Record<DoubtCard|'back',string>={red:'#923d3d',yellow:'#946a26',green:'#37664b',blue:'#345975',purple:'#6b4c74',wild:'#70543a',back:'#322c37'}
const borders:Record<DoubtCard|'back',string>={red:'#f3c291',yellow:'#fee19a',green:'#d0e1a7',blue:'#cce1ee',purple:'#ead4eb',wild:'#ffe4a5',back:'#c7a477'}
export const doubtCardName=(c:DoubtCard)=>c==='wild'?'Wild':c[0].toUpperCase()+c.slice(1)
export function DoubtCardArt({card,highlight=false}:{card?:DoubtCard;highlight?:boolean}){
 const tone=card??'back',ink=borders[tone]
 return <svg className="db-card-art" viewBox="0 0 60 78" role="img" aria-label={card?doubtCardName(card)+(highlight?' · matches claim':''):'Face-down card'} data-db-face={tone} data-db-hit={highlight||undefined}>
  <path d="M6 1h48l5 5v66l-5 5H6l-5-5V6Z" fill={shades[tone]} stroke={ink} strokeWidth="1.4"/>
  <path d="M8 5h44l3 3v62l-3 3H8l-3-3V8Zm3 3-3 3m41-3 3 3m-44 57 3 3m41-3-3 3" fill="none" stroke={ink} strokeWidth=".65" opacity=".75"/>
  <path d="M12 18c3 5 4 9 2 14-1 3-1 8 1 12m31-26c-2 5-3 9-1 14 1 3 1 8-1 12M12 54q18 10 36 0" fill="none" stroke={ink} strokeWidth=".6" opacity=".48"/>
  <path d={card?etch[card]:back} fill="none" stroke={ink} strokeWidth={card?1.55:.85} strokeLinejoin="round" strokeLinecap="round"/>
  {tone==='wild'&&<path d="M13 49h8m-6 2h9m11-2h10m-11 2h9" stroke="#b79cda" fill="none"/>}
  {card?<text x="30" y="67" fill={ink} fontSize="7" textAnchor="middle" fontFamily="Georgia,serif" fontWeight="700" letterSpacing=".6">{card.toUpperCase()}</text>:<path d="M20 65h20m-17-2h14" stroke={ink} opacity=".7"/>}
 </svg>
}
export function DoubtChip({slot=false}:{slot?:boolean}){
 return <svg className="db-chip" viewBox="0 0 22 22" aria-hidden="true" fill="none">
  {slot?<><path d="m2 5 3-3h12l3 3v12l-3 3H5l-3-3z" fill="#392b30" stroke="#dbad9e"/><path d="M7 5h8v12H7zM9 8h4v6H9Z" stroke="#f0cec1" strokeWidth=".8"/></>:<>
   <path d="m11 1 7 3 3 7-3 7-7 3-7-3-3-7 3-7Z" fill="#775736" stroke="#e4b778"/>
   <path d="m11 4 5 2 2 5-2 5-5 2-5-2-2-5 2-5Z M11 6l4 5-4 5-4-5Z" stroke="#f6d99a" strokeWidth=".8"/>
  </>}
 </svg>
}
