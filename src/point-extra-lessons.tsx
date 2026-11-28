import {move,start,view} from './engine'
import './point-lesson.css'

const side=13
const stepSize=9
const first=8
const stride=(c:number)=>first+(c+.5)*stepSize
const cell=(x:number,y:number)=>y*side+x
const demoMoves=[cell(3,7),cell(9,4),cell(4,7),cell(9,5),cell(5,7),cell(11,8),cell(6,7),cell(1,4),cell(7,7),cell(2,4),cell(8,7)]
const breakpoints=[1,5,7,9,11]
export const pointFrames=[
 {title:'Place a stone',caption:'Take turns placing a stone in an empty square.'},
 {title:'Make three',caption:'Three in line earns 1 point.'},
 {title:'Extend to four',caption:'Four in line earns 2 more points.'},
 {title:'Reach five',caption:'Five in line earns 5 more points.'},
 {title:'Keep playing',caption:'Extending an existing five adds nothing. After 20 moves each, highest score wins.'},
] as const
const index=(step:number)=>Number.isFinite(step)?Math.max(0,Math.min(pointFrames.length-1,Math.trunc(step))):0
export function pointLessonState(step:number){
 const end=breakpoints[index(step)]
 let state=start('point',['gold','red'],25000,0,{seed:17})
 for(let i=0;i<end;i++){
  const next=move(state,state.seats[state.turn],demoMoves[i],i+1)
  if(!next)throw Error('Point Gomoku lesson contains an illegal move')
  state=next
 }
 return state
}
function counterPath(x:number,y:number,w:number){return `M${x+5} ${y}h${w-10}l5 5v19l-5 5h-${w-10}l-5 -5v-19z`}
export function PointLesson({step}:{step:number}){
 const n=index(step)
 const s=pointLessonState(n),total=view(s,'gold').scores[0],prev=n>0?view(pointLessonState(n-1),'gold').scores[0]:0,gained=total-prev
 const bound=first+side*stepSize
 return <svg className="point-lesson" viewBox="0 0 218 133" role="img" aria-label={`Point Gomoku 13 by 13 practice board. Gold total: ${total}. This move: +${gained}.`} data-point-lesson={n}>
  <rect className="point-lesson-paper" x="1" y="1" width="216" height="131" rx="2"/>
  <rect className="point-lesson-field" x={first} y={first} width={side*stepSize} height={side*stepSize}/>
  <g className="point-lesson-grid" aria-hidden="true">{Array.from({length:side+1},(_,i)=>first+i*stepSize).map(u=><g key={u}><line data-point-gridline="x" x1={u} y1={first} x2={u} y2={bound}/><line data-point-gridline="y" x1={first} y1={u} x2={bound} y2={u}/></g>)}</g>
  {gained>0&&<line className="point-lesson-streak" data-point-line="true" x1={stride(3)} x2={stride(demoMoves[breakpoints[n]-1]%side)} y1={stride(7)} y2={stride(7)} aria-hidden="true"/>}
  {s.board.map((player,i)=>{
   if(!player)return null
   const x=stride(i%side),y=stride(Math.floor(i/side)),last=i===demoMoves[breakpoints[n]-1]
   return <g key={i+(last?':new':'')} className="point-lesson-stone" data-point-side={player} data-point-new={last||undefined} aria-hidden="true">
    <circle cx={x} cy={y} r="3.65"/>{player==='red'?<path d={`M${x-1.7} ${y}l1.7 -1.7 1.7 1.7 -1.7 1.7z`}/>:<path d={`M${x-1.5} ${y}h3m-1.5 -1.5v3`}/>}
   </g>
  })}
  <g aria-hidden="true" className="point-lesson-counter">
   <path d="M137 17h68m-68 100h68" className="point-lesson-detail"/>
   <text x="171" y="30" className="point-lesson-label">GOLD TOTAL</text>
   <path d={counterPath(145,36,52)}/><text className="point-lesson-total" x="171" y="59">{total}</text>
   <text x="171" y="82" className="point-lesson-label">THIS MOVE</text>
   <path d={counterPath(145,87,52)}/><text className="point-lesson-total" x="171" y="110">+{gained}</text>
  </g>
 </svg>
}

export const extraLessons={point:{frames:pointFrames,render:(step:number)=><PointLesson step={step}/>}}
