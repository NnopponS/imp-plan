import './point-table.css'

const grain=[
 'M6 24C70 17 99 41 160 34c53-6 57-22 123-19 63 3 88 11 145 3 43-6 64 1 87 4',
 'M4 43q75-15 135 6c57 19 93 5 138-3 58-10 164 18 239-10',
 'M6 57c58-6 89 16 152 9s109-27 165-8c46 15 125 5 191-10',
 'M3 84c142-27 156 2 238-18 38-9 61 4 101 10 62 8 107-4 177-1',
 'M2 93c97-16 124-4 185-7 77-4 91-18 149-6 56 11 118 7 182 4',
 'M5 116c45-13 67-4 90-2 107 10 166-20 220-16 57 4 126 27 198 4',
 'M3 135c58-20 103 5 168-1 89-9 127-30 208-10 34 8 94 19 136-4',
 'M5 152c64-10 101 12 165 12 51 0 73-25 127-24 70 1 128 29 217 6',
 'M3 179c95-17 90 17 169 8 86-10 91-40 167-17 69 21 135-1 177-4',
 'M5 191c64-5 107 19 164 5 18-5 60-21 76-21 62 1 77 23 122 21 58-2 94-18 152-14',
 'M4 219c82 10 121-2 178-14 73-15 121-11 193 4 22 5 74-5 140-14',
 'M4 235c41 3 107 2 159-9s107-22 178-7c60 12 70 5 172-7',
 'M2 263c129-35 126 8 235-9 59-9 52-28 123-15 78 14 107-1 156-3',
 'M0 283c47-9 83-23 142-11 49 9 103-7 161-17 54-10 88 26 214-1',
 'M3 294c82-17 90-18 163-13 103 7 106-31 184-12 53 15 94 19 166 2',
 'M4 310c68-21 111-17 186-13 43 2 82-9 99-14 30-8 52-1 84 7 39 11 95 8 144-7',
 'M4 326c79-10 118-25 192-19 54 4 78-15 120-12 45 2 95 32 198 8',
 'M3 349c97-31 137-9 176-12 55-4 85-33 148-22 40 7 112 21 187 5',
 'M4 368c90-27 140-7 213-23 77-16 109-23 154-12 35 9 85 2 145 2',
 'M5 387c96-24 139-10 221-29 84-20 106-7 151 0 54 7 94-20 141-8',
 'M3 398c103-18 174-16 210-23 53-10 89-13 143-9 77 5 100-19 162-5',
 'M5 422c100-23 154 1 226-27 39-16 90-19 147-12 34 4 83-12 138-6',
 'M3 438c88-27 145 1 215-20 53-16 85-40 155-24 53 12 83-14 143-2',
 'M5 455c66-11 117 6 205-19 93-26 100-29 159-22 59 7 99-14 148-6',
 'M1 467c78-9 106 9 172-8 76-19 129-39 191-31 53 7 105-10 152-8',
 'M4 489c78-23 88 6 186-17 45-10 123-36 173-29 61 8 111-12 153-5',
 'M2 502c87-23 124-1 194-20s118-36 184-23c49 10 107-15 136-5',
 'M4 511c78 3 113-5 171-16 97-19 134-32 206-21 49 7 96-14 134-5',
 'M6 519c98-3 122-11 169-16 68-9 169-30 208-11 34 16 87-6 132-9',
]
const grid=Array.from({length:13},(_,i)=>{
 const x=20+i*40
 return `M20 ${x}H500M${x} 20V500`
}).join('')
const anchors=[[3,3],[9,3],[6,6],[3,9],[9,9]]
const edgeTicks=Array.from({length:13},(_,i)=>{
 const x=20+i*40,len=i===0||i===6||i===12?5:2
 return `M${x} 10v${len}m0 ${500-2*len}v${len}M10 ${x}h${len}m${500-2*len} 0h${len}`
}).join('')

/** Artwork is sized against the full 13 × 13 hit plane, not the border. */
export function PointPlate(){
 return <svg className="point-plate" viewBox="0 0 520 520" aria-hidden="true" focusable="false">
  <path fill="#6b442e" d="M7 1h505l7 7v503l-8 8H8l-7-7V8z"/>
  <path fill="#925d3b" d="M8 1h504l-7 8H15l-7 7-7-8z"/>
  <path fill="#4c2f23" d="M511 519H8l7-8h490l6-7 8 7z"/>
  <path fill="#d9ac77" d="M13 6h493l8 8v492l-8 8H13l-7-8V14z"/>
  <path fill="#edc897" d="M8 12 15 7h488c-117 28-163 7-262 35-55 15-78 41-119 52-52 15-62 10-113 21zm1 127c68-15 94-3 162-29 102-40 128-58 324-55-158 16-228 22-328 67-53 23-90 9-158 31z" opacity=".54"/>
  <path fill="#9e6441" d="M514 312v194l-8 8H13l-7-8v-24c100-26 169-13 274-62 76-36 167-50 234-108z" opacity=".17"/>
  <path fill="#b37848" d="M10 277c98-25 122 2 224-14 74-12 64-24 125-13 77 15 115 2 151-4v22c-55 16-104 16-160 2-65-15-96 12-160 17-70 5-117-10-180 11zM10 385c68-19 149-14 218-31 81-20 107-11 158-3 42 7 90-15 124-10v16c-41-10-92 17-142 10-48-6-104-6-142 9-76 26-161 9-216 28z" opacity=".17"/>
  <g fill="none" strokeLinecap="round">
   {grain.map((d,i)=><path key={d} d={d} stroke={i%4===0?'#fae1b5':'#895734'} strokeWidth={i%3===0?1.25:.72} opacity={i%4===0?.52:i%3===0?.23:.28}/>)}
   <path stroke="#92592f" strokeWidth=".65" opacity=".47" d="M13 162q34-7 62-4m13 2q31 5 52 2m129-86q35-7 71 4m11 2q41 7 84 1M20 220q47 3 77-2m252 12q25 5 50 2m10-1 55-8M31 297q34-9 73-11m-87 75q58-18 99-17m185-22q28 0 42 3m-2 133q28-5 54 1m-377 8q31-8 66-8m37 1q48 2 80-8"/>
   <path stroke="#fff1cf" strokeWidth="1.1" opacity=".62" d="m8 506-.1-491 7-7h490l6 6M12 482V18l6-6h470"/>
   <path stroke="#69462e" strokeWidth="1.35" opacity=".82" d="M14 508h491l3-4V17M9 371v134l6 6h489"/>
   <path d={edgeTicks} stroke="#673f2a" strokeWidth="1.25" opacity=".8"/>
   <path d={grid} stroke="#f6d29f" strokeWidth="1.8" opacity=".72" transform="translate(.9 .9)"/>
   <path className="point-grid-ink" d={grid} stroke="#68452e" strokeWidth="1.7"/>
   <path stroke="#59402a" strokeWidth="1.86" d="M20 20h480v480H20z"/>
  </g>
  {anchors.map(([x,y])=><g key={`${x}:${y}`} transform={`translate(${20+x*40} ${20+y*40})`}>
   <circle cy=".7" r="4.3" fill="#f2ce9b"/><circle r="3.85" fill="#573524"/>
  </g>)}
 </svg>
}

const bowlStones=[
 [15,19,-22],[26,16,-8],[38,18,29],[48,20,-17],[24,24,12],[35,23,-14],[44,26,22],[15,26,-4],[29,29,-17],[39,29,6],
]
export function PointBowl({side}:{side:number}){
 const pale=side===1
 return <svg className="point-bowl" data-bowl-side={side} viewBox="0 0 64 54" aria-hidden="true" focusable="false">
  <ellipse cx="32" cy="48" rx="27" ry="4.3" fill="#201610"/>
  <path fill={pale?'#774434':'#725031'} stroke="#251914" strokeWidth="1.2" d="M3.6 25C4.4 32 8 40 13.8 44.4c7 5.4 28.8 6.5 36.7-.4 5.5-4.8 9.9-13.6 10-19z"/>
  <path fill={pale?'#a96d4e':'#ad7846'} d="M4.5 27c7.1 12.3 30.8 14.1 48.8 5.8-3.5 7.3-5.4 10.5-12.8 12.6-13.7 4.1-30.1-1.7-36-18.4z"/>
  <path fill="none" stroke={pale?'#f3b283':'#edbc78'} strokeWidth=".85" opacity=".8" d="M8 32.3c10 8.1 28.8 9.8 42.5 2.4M12 39.7q18.6 9.7 37.6.7"/>
  <path fill="none" stroke="#4b2d21" strokeWidth=".8" strokeLinecap="round" d="M14 35.8l2.2 3m1.4-1.8 2.4 3.3m2.3-2.8 2.5 3.5m2-2.9 2.5 3.2m2.5-3 2.4 2.9m2.4-3.1 2.5 2.4m3-3 2.2 1.8m-19.5 6.2q11 2 16.8-1.3"/>
  <path fill="#c8955b" stroke="#efd1a1" strokeWidth=".95" d="M3.6 24.4c-.2-6.2 9-15.7 27.6-15.7 18.3 0 29.5 7.9 29.2 15.8-.4 8.9-14.1 14.1-28.8 14.2C15.6 38.8 4.1 33.7 3.6 24.4Z"/>
  <path fill={pale?'#3e251f':'#4b3121'} stroke="#845333" strokeWidth="1.1" d="M7.4 24.2C7.2 17 20.2 12.1 31.8 12c12.6-.1 24.5 5.1 24.8 12.2.4 7.5-13.1 10.8-24.8 10.7-11.2-.1-24.3-3.2-24.4-10.7Z"/>
  {bowlStones.map(([x,y,angle],i)=><g transform={`translate(${x} ${y}) rotate(${angle})`} key={i}>
   <ellipse cy="1.6" rx="7.4" ry="4.8" fill="#211711"/>
   <path d="M-7 0c-.2-2.5 2.7-4.8 7.4-4.8 3.5 0 6.9 1.4 7.1 4.2 0 3.2-3.7 5-7.3 5C-3.7 4.4-7.1 2.5-7 0z" fill={pale?(i%3===1?'#c99c6b':'#e7c49b'):(i%3===1?'#4b3030':'#392424')} stroke={pale?'#a67650':'#8e6959'} strokeWidth=".55"/>
   <path d="M-4.9-.6Q-3.9-2.8 1.3-2.9" fill="none" stroke={pale?'#fff1ce':'#ba8b75'} strokeWidth=".8" strokeLinecap="round"/>
   {i>4&&<path d={pale?'m-1.4-1.5 3 2.5m0-2.5-3 2.5':'M0-1.7 2 .1 0 1.8-2 .1z'} fill="none" stroke={pale?'#6a4234':'#eac39a'} strokeWidth=".62"/>}
  </g>)}
  <path fill="none" stroke="#f7d5a4" strokeWidth=".8" strokeLinecap="round" d="M5.3 25.7c4.8 9.8 25.6 14.1 45.7 7.3m-40.3-16c5.4-4.3 16.6-6.3 23.7-5.9"/>
  <path fill="none" stroke="#513021" strokeWidth=".8" d="M19 45.8q13.6 4.5 27-.4"/>
 </svg>
}

export function PointScoreRuler(){
 return <div className="point-score-ruler" aria-label="Line scoring">
  <span>Line length</span>
  {[3,4,5].map((length,i)=><span className="point-ruler-step" key={length}>
   <span>{length}{i===2?'+':''}</span><b>+{[1,2,5][i]} <span className="sr">points</span></b>
  </span>)}
 </div>
}
