import {makeMancala,plant,sow,balance,pitType} from './mancala'
import type {CSSProperties} from 'react'
import './mancala-lesson.css'

export const mancalaFrames=[
 {title:'Plant',caption:'Each player places four stones, at most two per pit.'},
 {title:'Pick a pit',caption:'Choose any pit containing one of your stones.'},
 {title:'Sow clockwise',caption:'Sow bottom first. Here, Red owns the last stone and earns 2 green points.'},
 {title:'Balance the colors',caption:'Your lowest color score ranks first. Two green points alone still leave Red at zero.'},
] as const
const index=(step:number)=>Number.isFinite(step)?Math.max(0,Math.min(mancalaFrames.length-1,Math.trunc(step))):0
export function mancalaLessonState(step:number){
 const n=index(step),setup=[0,0,2,4,6,7,8,5]
 let m=makeMancala(2)
 for(let i=0;i<(n===0?2:setup.length);i++){
  const next=plant(m,setup[i],i%2)
  if(!next)throw Error('Mancala lesson contains an illegal placement')
  m=next
 }
 if(n>1){
  const moved=sow(m,0,0)
  if(!moved)throw Error('Mancala lesson contains an illegal sow')
  m=moved
 }
 return m
}
const cx=79,cy=64
const coords=(i:number)=>{const a=(i*40-90)*Math.PI/180;return [Math.round(cx+52*Math.cos(a)),Math.round(cy+44*Math.sin(a))]}
const colors=['Scarlet','Blue','Green','Bonus','Penalty']
const movement=(dx:number,dy:number,delay:number)=>({'--sow-x':dx+'px','--sow-y':dy+'px','--sow-delay':delay+'ms'}) as CSSProperties
export function MancalaLesson({step}:{step:number}){
 const n=index(step),m=mancalaLessonState(n),[sx,sy]=coords(0)
 return <svg className="mancala-lesson" viewBox="0 0 220 132" role="img" data-mancala-lesson={n} aria-label={n>1?'Balance Mancala. Pit three resolves for Red. Balanced score: '+balance(m.points[1])+'.':'Balance Mancala. Nine clockwise pits. Gold and Red occupy pit one.'}>
  <rect className="mcl-paper" x="1" y="1" width="218" height="130" rx="2"/>
  <ellipse className="mcl-wood" cx={cx} cy={cy} rx="72" ry="58"/><ellipse className="mcl-ring" cx={cx} cy={cy} rx="53" ry="45"/>
  <path className="mcl-arrow" d="M75 48a18 18 0 1 1-14 20m-5 7 4-8 8 3"/>
  {m.pits.map((stones,i)=>{
   const [x,y]=coords(i),type=pitType(i,m.pits.length),picked=n===1&&i===0,landing=n>1&&m.last?.pit===i
   return <g key={i} data-lesson-pit={i+1} data-pit-type={type} className="mcl-pit" data-pick={picked||undefined} data-last={landing||undefined}>
    <title>{`Pit ${i+1}, ${colors[type]}, ${stones.length} stones`}</title>
    <ellipse cx={x} cy={y} rx="10.5" ry="8.2"/><text x={x} y={y+13}>{i+1}</text>
    {stones.map((owner,j)=>{
     const stoneX=x+(j-(stones.length-1)/2)*6,sw=n===2&&((i===1&&j===0)||(i===2&&j===1))
     return <g className="mcl-stone" data-owner={owner} data-stone-transfer={sw||undefined} key={j+(sw?':transfer':'')} style={sw?movement(sx-stoneX,sy-y,i===2?170:0):undefined}>
      <circle cx={stoneX} cy={y} r="3.5"/><text x={stoneX} y={y+1.1}>{owner===0?'G':'R'}</text>
     </g>
    })}
   </g>
  })}
  <g className="mcl-score" aria-hidden="true">
   <text x="184" y="28">RED SCORES</text>
   {m.points[1].map((score,k)=><g key={k} data-lesson-low={n===3&&score===balance(m.points[1])||undefined}><rect x={155+k*20} y="37" width="17" height="28"/><text x={163.5+k*20} y="45">{colors[k].slice(0,1)}</text><text x={163.5+k*20} y="59" className="mcl-value">{score}</text></g>)}
   <text x="184" y="86">BALANCED</text><text x="184" y="105" className="mcl-value">{balance(m.points[1])}</text>
  </g>
 </svg>
}
export const extraLessons={mancala:{frames:mancalaFrames,render:(step:number)=><MancalaLesson step={step}/>}}
