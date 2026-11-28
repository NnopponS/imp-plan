import type {LessonMap} from './lesson-book'
import './wall-go2-lesson.css'

const frames=[
 {title:'Draft your crew',caption:'Three seats draft one square and one round each. Go around the table once, then back in reverse. In a duel, four round pieces are already in place and you draft only squares.'},
 {title:'Square takes the straight lane',caption:'Move one or two open tiles along a row or column. A square cannot turn, stand still, or cross another piece.'},
 {title:'Round bends the route',caption:'Move one tile, then turn a quarter turn for an optional second step. Both steps must be clear. Build a wall on an open edge at the arrival tile.'},
 {title:'Break through in a triad',caption:'In a three-seat game, each seat may cross and remove one wall on its route once. You still build a new wall at the destination. Duels have no breaches.'},
 {title:'Count the sealed rooms',caption:'Once no room is shared, score each room for its single owner. Empty and shared rooms score nothing. Compare total tiles, then the largest single room.'},
]
const title=[
 'Seats place pieces in the order 1, 2, 3, 3, 2, 1',
 'A square moves two cells east',
 'A round stone moves east then south and builds to the east',
 'A wall disappears as a round stone crosses it',
 'Amber holds 13 tiles, teal holds 12 tiles',
]
const coords=(c:number)=>[156+40*(c%5),31+33*Math.floor(c/5)] as const
function Token({cell,shape,side,drift,stamp}:{cell:number;shape:'round'|'square';side:number;drift?:'straight'|'turn'|'breach';stamp?:number}){
 const [x,y]=coords(cell), colors=['#f5bc81','#9bead2','#f1a4bd']
 return <g transform={`translate(${x} ${y})`}>
  <g className={drift?'w2-lesson-'+drift:stamp!==undefined?'w2-lesson-draft':undefined} style={stamp!==undefined?{animationDelay:stamp*105+'ms'}:undefined} fill={colors[side]} stroke="#492d3e" strokeWidth="2">
   {shape==='square'?<><rect x="-11" y="-11" width="22" height="22" rx="3"/><path d="M-4-5v10m8-10v10" strokeWidth="1.6"/></>:
    <><circle r="11"/><path d="M-5-5v7h9m-3-3 3 3-3 3" strokeWidth="1.6" fill="none" strokeLinecap="round"/></>}
  </g>
 </g>
}
function WallGo2Lesson({step}:{step:number}){
 const svgGrid=Array.from({length:25},(_,i)=>{
  const [x,y]=coords(i),amber=i%5<2||(i%5===2&&i<15)
  return <rect key={i} className={step===4?'w2-lesson-room':undefined} style={step===4?{animationDelay:(i%5+Math.floor(i/5))*57+'ms'}:undefined} x={x-19} y={y-15.5} rx="2" width="38" height="31" fill={step===4?(amber?'#805d4b':'#3e7771'):i%2?'#3c3342':'#493943'} stroke="#815b5a"/>
 })
 return <svg key={step} className="w2-lesson" role="img" aria-label={title[step]} data-wall2-lesson={step} viewBox="0 0 480 205">
  <rect x="9" y="6" width="462" height="192" rx="11" fill="#292331" stroke="#b1806a"/>
  <path d="M35 21h51m312 0h43M35 183h51m312 0h43m-410-20V44m416 119V44" stroke="#836272" fill="none"/>
  <g>{svgGrid}</g>
  <g textAnchor="middle" fontFamily="Georgia,serif">
   <text x="78" y="67" fontSize="14" fill="#e0bda7">{['SNAKE','SQUARE','ROUND','BREACH','AMBER'][step]}</text>
   <text x="400" y="67" fontSize="14" fill="#e0bda7">{['DRAFT','STRAIGHT','TURN','TRIAD ONLY','TEAL'][step]}</text>
   <text x="78" y="109" fontSize={step===0?25:31} fill="#f7c788">{['1→2→3','Ⅱ','○','1×','13'][step]}</text>
   <text x="400" y="109" fontSize={step===0?25:31} fill="#a9e5d7">{['3→2→1','⟶','↳','×','12'][step]}</text>
  </g>
  {step===0&&<><Token cell={1} shape="round" side={0} stamp={0}/><Token cell={8} shape="square" side={1} stamp={1}/><Token cell={16} shape="round" side={2} stamp={2}/><Token cell={11} shape="square" side={2} stamp={3}/><Token cell={23} shape="round" side={1} stamp={4}/><Token cell={20} shape="square" side={0} stamp={5}/></>}
  {step===1&&<><path className="w2-lesson-path" d="M196 97h80" stroke="#f3ce9b"/><Token cell={13} shape="square" side={0} drift="straight"/><Token cell={19} shape="round" side={1}/></>}
  {step===2&&<><path className="w2-lesson-path" d="M196 97h40v33" stroke="#a4ead5"/><path className="w2-lesson-built" d="M256 117v26" stroke="#ffe1af" strokeWidth="6" strokeLinecap="round"/><Token cell={17} shape="round" side={1} drift="turn"/></>}
  {step===3&&<><path className="w2-lesson-path" d="M196 97h40" stroke="#f1b28d"/><path className="w2-lesson-broken" d="M216 84v26" stroke="#ffc589" strokeWidth="6"/><path className="w2-lesson-built" d="M256 84v26" stroke="#ffe1af" strokeWidth="6" strokeLinecap="round"/><Token cell={12} shape="round" side={2} drift="breach"/></>}
  {step===4&&<><path d="M256 14v99h-40v66" stroke="#f5d5a2" strokeWidth="5" fill="none"/><Token cell={1} shape="square" side={0}/><Token cell={9} shape="round" side={1}/><Token cell={16} shape="round" side={0}/><Token cell={22} shape="square" side={1}/></>}
 </svg>
}
export const extraLessons:LessonMap={wallGo2:{frames,render:step=><WallGo2Lesson step={step}/>}}
