import {useId,type CSSProperties} from 'react'
import {baghActions,baghEdges,type BaghAction} from './bagh'
import {move,schedule,start,type State} from './engine'
import tableArt from './bagh-art/table.svg'
import './bagh-lesson.css'

export const baghFrames=[
 {title:'Four corners',caption:'Four tigers start in the corners, and goats take the first turn.'},
 {title:'Place a goat',caption:'Place one goat on any empty point on your turn.'},
 {title:'Step along a line',caption:'A tiger can step one point along a marked line.'},
 {title:'Jump to capture',caption:'Jump straight over one goat to an empty point and remove that goat.'},
 {title:'Slide a goat',caption:'Once all 20 goats are placed, slide one goat along a line to a neighboring empty point.'},
 {title:'Tigers win',caption:'The fifth capture wins the leg for the tigers.'},
 {title:'Goats win',caption:'Alternatively, goats win by leaving all four tigers unable to step or jump.'},
 {title:'Switch sides',caption:'For the next leg, trade roles and start with a fresh board.'},
] as const
export const baghLessonStepCount=baghFrames.length

const corners=[0,4,20,24]
const m=(from:number,to:number)=>({from,to})
const placements=[
 [12,0,6],[23,6,18],[11,4,3],[19,20,21],[5,3,2],
 [4,18,12],[20,2,7],[22,12,8],[16,8,12],[6,24,14],
 [2,12,0],[10,7,6],[17,14,13],[14,6,7],[9,7,12],
 [6,12,18],[1,13,8],[3,18,19],[7,8,13],[24,0,12],
].flatMap(([goat,from,to])=>[goat,m(from,to)])
const firstSlide=m(2,8)
const tigerClosing=m(12,2)
const goatClosing=[
 m(12,18),m(1,2),m(13,12),m(2,6),m(18,13),m(5,0),m(12,18),m(7,12),
]
const branch=[...placements,firstSlide]
const legs=schedule(['1','2'])
const newLeg=(i:number)=>start('bagh',legs[i],60_000,0,{seed:1})
function advance(state:State,action:BaghAction){
 const next=move(state,state.seats[state.turn],action,0)
 if(!next)throw Error('Invalid Bagh Chal tutorial move')
 return next
}
const closingTrace=[...branch,...goatClosing]
const played=[newLeg(0)]
for(const action of closingTrace)played.push(advance(played[played.length-1],action))
function frame(kind:'setup'|'place'|'step'|'jump'|'slide'|'tigers'|'goats'|'swap',turn:number,action?:BaghAction){
 const before=played[turn]
 const after=kind==='swap'?newLeg(1):action===undefined?before:advance(before,action)
 return {kind,history:closingTrace.slice(0,turn),action,before,after}
}
const lesson=[
 frame('setup',0),
 frame('place',0,placements[0]),
 frame('step',1,placements[1]),
 frame('jump',3,placements[3]),
 frame('slide',placements.length,firstSlide),
 frame('tigers',branch.length,tigerClosing),
 frame('goats',closingTrace.length-1,goatClosing[goatClosing.length-1]),
 frame('swap',closingTrace.length),
]
export const baghLessonModel=(step:number)=>lesson[step]??lesson[0]

const xy=(i:number):[number,number]=>[10+i%5*20,10+Math.floor(i/5)*20]
const line=(from:number,to:number)=>'M'+xy(from).join(' ')+'L'+xy(to).join(' ')
const square=Array.from({length:25},(_,i)=>xy(i))

function Piece({kind,x,y,size=13}:{kind:'goat'|'tiger';x:number;y:number;size?:number}){
 return <svg x={x-size/2} y={y-size/2} width={size} height={size} viewBox="0 0 50 50" className="bagh-lesson__piece" aria-hidden="true">
  {kind==='tiger'?<>
   <path d="M7 19Q3 9 10 6q6-2 11 4h8q5-6 11-4 7 3 3 13l3 9-5 11-16 8-16-8-5-11Z" fill="#442a39" stroke="#2b1a26" strokeWidth="2"/>
   <path d="m9 20 3-4 6-4 7 1 7-1 6 4 3 4 2 8-4 9-14 7-14-7-4-9Z" fill="#884b55" stroke="#e4ab72" strokeWidth="1.4"/>
   <path d="m10 10 7 3-5 3Zm30 0-7 3 5 3ZM21 14l4 7 4-7m-18 8 8 4m20-4-8 4M9 29l9 2m23-2-9 2M12 35l6 1m20-1-6 1" fill="none" stroke="#f4c18a" strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round"/>
   <path d="m16 21 4 2m14-2-4 2" stroke="#2a1924" strokeWidth="2.2" strokeLinecap="round"/>
   <path d="m25 25 8 6-4 6-4-1-4 1-4-6Z" fill="#e2aa7d" stroke="#392533" strokeWidth="1.25"/>
   <path d="m22 31 3 2 3-2m-3 2v3" fill="none" stroke="#34212c" strokeWidth="1.7" strokeLinecap="round"/>
  </>:<>
   <path d="m25 3 12 4 8 10 2 14-8 10-14 6-14-6-8-10 2-14L13 7Z" fill="#b3895c" stroke="#4b3029" strokeWidth="2"/>
   <path d="m25 6 10 3 8 10 1 11-7 9-12 5-12-5-7-9 1-11 8-10Z" fill="#eed7a3" stroke="#fdedc5" strokeWidth="1.35"/>
   <path d="M18 23q-9-10 4-14-7 6-2 11m12 3q9-10-4-14 7 6 2 11" fill="#faf0c9" stroke="#714d38" strokeWidth="2.1" strokeLinecap="round"/>
   <path d="m20 20 5-2 5 2 4 4 6-2-1 4-6 3-3 6-1 4-4 2-4-2-1-4-3-6-6-3-1-4 6 2Z" fill="#ae8254" stroke="#634433" strokeWidth="1.4" strokeLinejoin="round"/>
   <path d="m25 22 3 3 2 7-2 4-3-2-3 2-2-4 2-7Z" fill="#f8e5b6"/>
   <path d="m20 27 2 1m8-1-2 1m-5 6 2 2 2-2m-2 2v3" fill="none" stroke="#5c3c2a" strokeWidth="1.45" strokeLinecap="round"/>
  </>}
 </svg>
}

const drift=(x:number,y:number,arc=0)=>({'--bagh-x':x+'px','--bagh-y':y+'px','--bagh-arc':arc+'px'} as CSSProperties)
const nodeName=(i:number)=>`row ${1+Math.floor(i/5)}, column ${1+i%5}`

export function BaghLesson({step}:{step:number}){
 const {kind,before,after,action}=baghLessonModel(step)
 const id=useId()
 const b=after.bagh!
 const from=typeof action==='object'?action.from:undefined
 const to=typeof action==='number'?action:action?.to
 const [x,y]=to===undefined?[0,0]:xy(to)
 const [xf,yf]=from===undefined?[x,y-11]:xy(from)
 const hit=b.captured>before.bagh!.captured?(from!+to!)/2:undefined
 const [hx,hy]=hit===undefined?[0,0]:xy(hit)
 const trapped=kind==='goats'
 const swapped=kind==='swap'
 const victory=kind==='tigers'?'tiger':trapped?'goat':undefined
 const motion=kind==='tigers'?'jump':kind
 const route=from===undefined?undefined:line(from,to!)
 const label=swapped?'Player 1 now plays tigers and Player 2 plays goats; the board resets.':
  [kind==='setup'?'Tigers occupy the four corners.':typeof action==='number'?`A goat is placed at ${nodeName(action)}.`:
   `A ${before.turn?'tiger':'goat'} moves from ${nodeName(from!)} to ${nodeName(to!)}.`,
   hit===undefined?'':`The goat at ${nodeName(hit)} is removed.`,
   trapped?`Tigers have ${baghActions(b,1).length} legal moves.`:`${b.banked} goats left to place, ${b.captured} of 5 captured.`].filter(Boolean).join(' ')
 return <div className="bagh-lesson" data-bagh-step={step} data-banked={b.banked} data-captured={b.captured} data-victory={victory}>
  <svg className="bagh-lesson__board" viewBox="0 0 100 100" role="img" aria-labelledby={id+'-title'} aria-describedby={id+'-desc'}>
   <title id={id+'-title'}>Bagh Chal board</title>
   <desc id={id+'-desc'}>{label}</desc>
   <g className="bagh-lesson__surface" data-recedes={swapped||undefined}>
    <image href={tableArt} width="100" height="100"/>
    <g className="bagh-lesson__incisions">{baghEdges.map(([a,c])=><path key={a+'-'+c} d={line(a,c)}/>)}</g>
    <g className="bagh-lesson__lattice">{baghEdges.map(([a,c])=><path key={a+'-'+c} d={line(a,c)}/>)}</g>
    {square.map(([cx,cy],i)=><circle className="bagh-lesson__pin" key={i} cx={cx} cy={cy} r=".77"/>)}
    {b.board.map((p,i)=>p===0||i===to?null:
     <g key={i} className={kind==='setup'?'bagh-lesson__opening':undefined} style={{'--lag':corners.indexOf(i)*65+'ms'} as CSSProperties} data-node={i}>
      {trapped&&p===2&&<circle className="bagh-lesson__trapped" cx={square[i][0]} cy={square[i][1]} r="8"/>}
      <Piece kind={p===2?'tiger':'goat'} x={square[i][0]} y={square[i][1]}/>
     </g>)}
   </g>
   <g key={step} data-motion={motion}>
    {route&&<>
     <path className="bagh-lesson__route-base" d={route}/>
     <path className="bagh-lesson__route" d={route} pathLength="1"/>
     <circle className="bagh-lesson__origin" cx={xf} cy={yf} r={3.3}/>
    </>}
    {to!==undefined&&<>
     <circle className="bagh-lesson__landing" cx={x} cy={y} r={8}/>
     {hit!==undefined&&<>
      <path className="bagh-lesson__removed" d={`M${hx-2.5} ${hy-2.5}l5 5m0-5-5 5`}/>
      <g className="bagh-lesson__loss"><Piece kind="goat" x={hx} y={hy}/></g>
     </>}
     <g className="bagh-lesson__mover" data-node={to} style={drift(xf-x,yf-y,hit===undefined?0:-6)}>
      <Piece kind={b.board[to]===2?'tiger':'goat'} x={x} y={y}/>
     </g>
    </>}
    {swapped&&<>
     <rect className="bagh-lesson__seat-panel" x={15} y={31} width={70} height={38} rx={2}/>
     <path className="bagh-lesson__seat-track" d="M31 49q19-22 38 0M31 49q19 17 38 0"/>
     <circle className="bagh-lesson__seat" cx={31} cy={49} r={10}/>
     <circle className="bagh-lesson__seat" cx={69} cy={49} r={10}/>
     <g className="bagh-lesson__mover" style={drift(38,0,-8)}><Piece kind="tiger" x={31} y={49} size={18}/></g>
     <g className="bagh-lesson__mover" style={drift(-38,0,8)}><Piece kind="goat" x={69} y={49} size={18}/></g>
     <text className="bagh-lesson__seat-name" x={31} y={64}>Player 1</text>
     <text className="bagh-lesson__seat-name" x={69} y={64}>Player 2</text>
    </>}
   </g>
  </svg>
  <div className="bagh-lesson__register" aria-hidden="true">
   <div><span>{trapped?'Tiger moves':'Goats to place'}</span><strong>{trapped?baghActions(b,1).length:b.banked}</strong></div>
   <div><span>Captures</span><span className="bagh-lesson__pips">{Array.from({length:5},(_,i)=><i key={i} data-filled={i<b.captured||undefined}/>)}</span><strong>{b.captured}/5</strong></div>
  </div>
 </div>
}
