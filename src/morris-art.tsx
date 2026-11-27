import {useId} from 'react'
import {mills,points} from './engine'

export const morrisPosition=(n:number)=>32+76*n
const p=morrisPosition

// One hand-turned silhouette, cut from two woods. The hollow seal and the diamond
// distinguish the players independently of finish. A preview shares its real pawn.
export function MorrisPawn({side,ghost=false,entering=false}:{side:number;ghost?:boolean;entering?:boolean}){
 const varnish=useId(),cap=useId()
 const dark=side===1
 const stain=dark?['#ad7059','#673f38','#3b272a','#e2ad85']:['#f1d9a5','#bd8f55','#755038','#fff1c9']
 return <svg viewBox="0 0 68 70" className="morris-stone" data-morris-stone={ghost?undefined:side} data-morris-ghost={ghost||undefined}
  data-enter={entering||undefined} aria-hidden="true" focusable="false">
  <defs>
   <linearGradient id={varnish} x1="0%" y1="22%" x2="93%" y2="91%"><stop stopColor={stain[0]}/><stop offset=".47" stopColor={stain[1]}/><stop offset="1" stopColor={stain[2]}/></linearGradient>
   <linearGradient id={cap} x1="21%" y1="9%" x2="100%" y2="82%"><stop stopColor={stain[0]}/><stop offset=".7" stopColor={stain[1]}/><stop offset="1" stopColor={stain[2]}/></linearGradient>
  </defs>
  <path className="morris-pawn-shadow" d="M4 62q9-6 32-5 22-1 28 4 3 5-9 7-26 4-45-1-6-1-6-5Z" fill="#251b1c" opacity=".62"/>
  <path className="morris-pawn-body" d="M8 56Q18 44 22 39l4-7a7 7 0 0 1-3-5q-7-7-6-14Q20 4 29 2l10 1q10 2 12 12 0 8-5 13-1 3-5 4l4 8q4 6 14 15l3 7q-1 3-8 4H14Q6 65 6 62Z"
   fill={`url(#${varnish})`} stroke="#2d1f23" strokeWidth="2.7" strokeLinejoin="round"/>
  <path d="M18 15Q18 7 26 4q10-5 20 2 7 7 3 16-3 7-14 8-8 0-13-6-4-4-4-9Z" fill={`url(#${cap})`} stroke="#51352e" strokeWidth="1.15"/>
  <path d="M17 47q5-5 11-16l8 2-12 23-10 4Z" fill={stain[0]} opacity=".47"/>
  <path d="M44 40q6 8 15 16l2 5-7 2-14-2 5-4-3-8Z" fill={stain[2]} opacity=".54"/>
  <path d="M22 35q12 4 23-1l-3-6q-8 3-17 0Z" fill={stain[2]} stroke="#402d2b" strokeWidth="1.1"/>
  <path d="M24 28q9 3 19 0M10 59q16 5 47 0m-44 4 11 1 23-1M22 15q0-7 9-10m-9 17 4 3m-7 28q3-4 11-17m-10 21 6-9m22 7 3 3" stroke={stain[3]} strokeWidth="1.35" strokeLinecap="round" fill="none" opacity=".87"/>
  <path d="m31 11 6-2m-5 5 9-1m-7 4 9-1m-4 20 4 9m-5 6 2 5m-12-4-2 4m24-4 3 3" stroke={stain[2]} strokeWidth=".8" strokeLinecap="round" fill="none" opacity=".65"/>
  <path className="morris-pawn-sign" d={dark?'m34 40 5 6-5 6-5-6Z':'M34 41q5 0 5 5-1 5-5 5-5 0-5-5 0-4 5-5Z'} fill="none" stroke={dark?'#f3c68a':'#633e37'} strokeWidth="1.9"/>
 </svg>
}

const marks={
 socket:'M12 2 19 6 22 12 19 19 12 22 5 18 2 12 6 5Z M8 8l4-3 4 3m2 7-6 4-5-3',
 selected:'M2 8V3l6-1m8 0 6 1v5m0 8v5l-5 1m-9 0-6-1v-5',
 target:'M1 7V2l6-1m10 0 5 1 1 5m0 10-1 5-5 1m-10 0-5-1-1-5 M10 2l2 3 2-3m0 20-2-3-2 3',
 capture:'M3 8V3l5-1m8 0 5 1 1 5m0 8-1 5-5 1m-8 0-5-1-1-5 M9 3l3 3 3-3m0 18-3-3-3 3',
 place:'M12 2v13m-5-4 5 5 5-5M3 15l2 5q8 3 14 0l2-5',
 slide:'M2 7q4-3 8 0v10q-5 3-8 0Zm10 5h10m-4-4 4 4-4 4',
 fly:'M3 17q4-14 17-11m-4-3 5 2-2 5m-4 7 4 4 3-4m-12 4H3',
 wait:'M6 3h12m-12 18h12M7 3v3l5 6-5 6v3m10-18v3l-5 6 5 6v3m-6-3h2',
 record:'m5 3 14-1 2 4-1 14-15 1-2-3 1-12Zm3 8 3 3 5-6',
} as const
export function MorrisMark({mark}:{mark:keyof typeof marks}){
 const point=mark==='socket'||mark==='selected'||mark==='target'
 return <svg className={point?'morris-point-mark':'morris-phase-mark'} data-point-mark={point?mark:undefined}
  data-phase-mark={!point?mark:undefined} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
  <path d={marks[mark]} strokeLinecap="round" strokeLinejoin="round"/>
 </svg>
}

const pointPosition=(n:number)=>points[n].map(p)
function carvedLine(a:number,b:number){
 const [x,y]=pointPosition(a),[u,v]=pointPosition(b)
 const j=(a%3-1)*1.2
 const wiggleX=x===u?j:0,wiggleY=y===v?j:0
 return `M${x} ${y} Q${(x+u)/2+wiggleX} ${(y+v)/2+wiggleY} ${u} ${v}`
}
const frame='M22 4 158 5 243 3 362 5 498 4 517 23 516 163 518 278 516 411 517 497 497 517 351 516 220 518 114 516 24 517 4 498 5 388 3 244 5 135 4 24Z'
const plate='M22 12 162 14 245 12 360 14 496 12 507 25 506 162 508 275 506 412 507 492 493 507 351 506 221 508 112 506 26 507 13 493 14 387 12 242 14 135 12 26Z'
const grain=Array.from({length:44},(_,i)=>{
 const x=19+i*11.2, tint=i%5===0
 const drift=(n:number)=>Math.sin((i+3)*(n+1)*1.79)*(i%3+1)*2.2
 return {d:`M${x.toFixed(1)} 15Q${(x+drift(1)).toFixed(1)} 52 ${(x+drift(2)).toFixed(1)} 111 T${(x+drift(3)).toFixed(1)} 222 T${(x+drift(4)).toFixed(1)} 351 T${(x+drift(5)).toFixed(1)} 509`,tint}
})
const gouges=[
 'M42 90q2 22 1 31m2 6q-2 9-1 17M76 323q5 29 3 56m-2 4 1 17',
 'M102 55q4 19 3 39m5 35q2 26-3 50m18 204q-3 28 0 61m-5 7 1 12',
 'M142 69q6 22 5 43m-5 53q5 43 2 65m13 133q7 49 4 78',
 'M208 138q3 17-1 31m-3 219q-7 19-4 47m25 46 0-17',
 'M304 62q-12 39-8 65m-3 28q2 23-3 49m8 152q-2 59 2 88',
 'M356 21q-2 16 0 29m31 97q1 30-6 54m-9 196q-3 40 2 62',
 'M423 109q-2 24 4 42m8 47q4 18 0 32m6 40q6 21 4 41',
 'M474 72q2 37-3 58m9 176q-3 36 0 55m-7 31q5 22 3 42',
]

export function CarvedBoard({lit}:{lit:readonly number[][]}){
 const bevel=useId(),wood=useId(),amber=useId(),clip=useId()
 return <svg className="morris-carving" viewBox="0 0 520 520" aria-hidden="true" focusable="false">
  <defs>
   <linearGradient id={bevel} x1="2%" x2="89%" y1="4%" y2="93%"><stop stopColor="#deb174"/><stop offset=".27" stopColor="#8e5c3f"/><stop offset=".64" stopColor="#a87550"/><stop offset="1" stopColor="#55372f"/></linearGradient>
   <radialGradient id={wood} cx="45%" cy="41%" r="78%"><stop stopColor="#deba80"/><stop offset=".51" stopColor="#b88c56"/><stop offset="1" stopColor="#7a5035"/></radialGradient>
   <linearGradient id={amber} x1="0%" y1="0%" x2="100%" y2="100%"><stop stopColor="#fff0ad"/><stop offset=".5" stopColor="#e9aa54"/><stop offset="1" stopColor="#ffdd90"/></linearGradient>
   <clipPath id={clip}><path d={plate}/></clipPath>
  </defs>
  <path className="morris-wood-rim" d={frame} fill={`url(#${bevel})`} stroke="#2a1e22" strokeWidth="5" strokeLinejoin="round"/>
  <path d={plate} fill={`url(#${wood})`} stroke="#4b342d" strokeWidth="3" strokeLinejoin="round"/>
  <g clipPath={`url(#${clip})`} className="morris-wood-grain" fill="none" strokeLinecap="round">
   <path d="M77 0q10 111 2 233t2 290m124-527q12 101 0 202t0 340m104-539q-11 103 3 243t-4 284m111-530q9 122-4 237t1 291" stroke="#7b5037" strokeWidth="4.4" opacity=".26"/>
   <path d="M82 0q11 118 3 231t2 291m124-526q10 104 0 203t3 339m105-542q-11 103 3 244t-4 285m107-530q9 118-4 237t1 297" stroke="#f5ce88" strokeWidth="2.1" opacity=".31"/>
   {grain.map(({d,tint},i)=><path key={i} d={d} stroke={tint?'#783d29':'#ffe4a3'} strokeWidth={tint?1.15:.82} opacity={tint?.23:.17}/>)}
   {gouges.map((d,i)=><path key={i} d={d} stroke={i%3===0?'#fff0ba':'#765039'} opacity=".53" strokeWidth={i%2===0?1.15:.72}/>)}
  </g>
  <path d="m28 8 112 3 74-2m79 0 134 1 67-2 16 17m1 17-1 124 2 67m-1 115v146l-13 14m-13 4-144-2-89 2m-58 0-130-2-25 1-25-20M9 478l2-121-2-65M9 226l2-114-1-80" fill="none" stroke="#e8bf85" strokeWidth="1.6" opacity=".74" strokeLinecap="round"/>
  <g className="morris-lines" fill="none" strokeLinecap="round" strokeLinejoin="round">
   {mills.map(([a,,c],i)=>{
    const d=carvedLine(a,c)
    return <g key={i}><path d={d} stroke="#e5ba76" strokeWidth="10" transform="translate(0 1.4)"/>
     <path d={d} stroke="#57372e" strokeWidth="7"/><path d={d} stroke="#775039" strokeWidth="3.4"/></g>
   })}
  </g>
  <g className="morris-mill-lines" fill="none" strokeLinecap="round">
   {lit.map(([a,b,c])=><g data-morris-mill key={a+'-'+b+'-'+c}>
    <path d={carvedLine(a,c)} stroke="#6b402b" strokeWidth="11"/><path d={carvedLine(a,c)} stroke={`url(#${amber})`} strokeWidth="5.5"/>
   </g>)}
  </g>
  <g className="morris-center-etch" fill="none" stroke="#805436" strokeLinecap="round">
   <path d="M260 237q-10 15-23 23 13 7 23 23 9-16 23-23-14-10-23-23Zm0 10q5 8 12 13-7 4-12 12-6-8-12-12 7-6 12-13Z" strokeWidth="1.7"/>
   <path d="m252 252-7 8 3 4 12 11m9-7 8-8-8-10" stroke="#f4d79e" strokeWidth="1.05"/>
   <path d="m258 258 2-2 3 4-3 4-2-2Zm-34 2 5-3m63 3-5-3m-27-34 3 5m-3 63 3-5" opacity=".76"/>
  </g>
 </svg>
}
