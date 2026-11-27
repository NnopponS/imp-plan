import type {Game} from './engine'
import {pieceFootprint,pieceHintCost,pieceRotation,pieceSide,pieceTime,type PieceFit,type PieceLayout} from './piece'
import './rule-demo.css'

const demos=new Set<Game>(['blind','auction','piece'])
export const hasRuleDemo=(game:Game)=>demos.has(game)
const phase=(step:number,last:number)=>Number.isFinite(step)?Math.min(last,Math.max(0,Math.trunc(step))):0

/** A legal example sequence, independent of the user's game and seats. */
export const blindDemoMoves=[
 [5,7],[6,5],[6,7],[8,6],[7,7],[5,8],[8,7],[9,9],[9,7],
] as const
const demoCap=['#8e4140','#396759','#bf8c45','#495f79']
const boardSize=15
const marks=Array.from({length:boardSize+1},(_,i)=>i*10)
function BlindDemo({step}:{step:number}){
 const stage=phase(step,2)
 const captions=['Take turns on a 15 × 15 board.','The cover stays visible. The color underneath stays hidden.','Five in a row ends the game. Then the stones reveal their owners.']
 const labels=['Example: the first veiled stone on a 15 by 15 board.','Example: eight stones show engraved colored covers. Ownership is not shown.','Example: five circle stones form a line. Four opposing stones reveal as diamonds.']
 const reveal=stage===2
 const stones=blindDemoMoves.slice(0,[1,8,9][stage])
 return <figure className="rule-demo" data-rule-demo="blind">
  <svg className="rule-demo-board" viewBox="-3 -3 156 156" role="img" aria-label={labels[stage]} data-grid-size={boardSize}>
   <rect x="0" y="0" width="150" height="150" rx="1" className="rule-demo-board-field"/>
   <g className="rule-demo-grid" aria-hidden="true">{marks.map(x=><line key={'x'+x} x1={x} y1="0" x2={x} y2="150"/>)}{marks.map(y=><line key={'y'+y} x1="0" y1={y} x2="150" y2={y}/>)}</g>
   {reveal&&<path className="rule-demo-winning-line" d="M55 75H95"/>}
   {stones.map(([x,y],i)=>{
    const cx=x*10+5,cy=y*10+5,kind=!reveal?'veiled':i%2?'diamond':'circle'
    return <g key={i+kind} className="rule-demo-stone" data-stone={kind} style={!reveal?{fill:demoCap[Math.floor(i/2)%demoCap.length]}:undefined} aria-hidden="true">
     {kind==='diamond'?<path d={`M${cx} ${cy-4} l4 4 -4 4 -4 -4Z`}/>:<circle cx={cx} cy={cy} r="3.7"/>}{!reveal&&<path d={`M${cx-1.7} ${cy+1}l3.4 -2`} stroke="#ffebc7" strokeWidth=".45"/>}
    </g>
   })}
  </svg>
  <figcaption>{captions[stage]}</figcaption>
 </figure>
}

const auctionBids=[9,5,8]
const auctionBank=60
function AuctionDemo({step}:{step:number}){
 const stage=phase(step,3)
 return <figure className="rule-demo rule-demo-auction" data-rule-demo="auction">
  {stage===0?<div className="rule-demo-bank">
   <div><span>Starting time bank</span><strong>60 s</strong></div>
   <div className="rule-demo-meter" aria-hidden="true"><i/></div>
  </div>:stage===1?<ul className="rule-demo-bids" aria-label="Example sealed bids">
   <li><span>Your bid</span><strong>9 s locked</strong></li>
   <li><span>Opponent bids</span><strong>Sealed</strong></li>
  </ul>:stage===2?<table className="rule-demo-tally" data-reveal="">
   <caption className="rule-demo-sr">Example round one bids, remaining time, and points</caption>
   <thead><tr><th scope="col">Seat</th><th scope="col">Bid</th><th scope="col">Left</th><th scope="col">Points</th></tr></thead>
   <tbody>{auctionBids.map((bid,i)=><tr key={i} data-won={i===0?true:undefined}><th scope="row">{i===0?'You':i+1}</th><td>{bid} s</td><td>{auctionBank-bid} s</td><td>{i===0?'+1':'0'}</td></tr>)}</tbody>
  </table>:<table className="rule-demo-tally">
   <caption className="rule-demo-sr">Example tied final scoreboard</caption>
   <thead><tr><th scope="col">Seat</th><th scope="col">Points</th><th scope="col">Left</th></tr></thead>
   <tbody><tr data-won><th scope="row">1</th><td>5</td><td>18 s</td></tr><tr><th scope="row">2</th><td>5</td><td>12 s</td></tr></tbody>
  </table>}
  <figcaption>{[
   'Each player starts with 60 seconds.',
   'Choose up to 15 seconds privately.',
   'Everyone pays. Here, the 9-second bid earns one point.',
   'Both scored five points. The seat with 18 s wins the tie.',
  ][stage]}</figcaption>
 </figure>
}

const demoMask=[
 '..###..','.#####.','#######','#######','.#####.','..###..','.......',
]
const demoLayout:PieceLayout={target:demoMask.join('').split('').map(x=>x==='#'),pieces:[[[0,0],[0,1],[1,1],[2,1]]]}
export const pieceDemo:{layout:PieceLayout;fit:PieceFit}={layout:demoLayout,fit:{anchor:2*pieceSide+4,rotation:1}}
const fmt=(value:number)=>Math.floor(value/60000)+':'+String(Math.floor(value%60000/1000)).padStart(2,'0')
function PieceDemo({step}:{step:number}){
 const stage=phase(step,3)
 const {layout,fit}=pieceDemo
 const shown=pieceFootprint(layout,0,fit.rotation,fit.anchor)
 const rotation=stage===0?0:fit.rotation
 return <figure className="rule-demo rule-demo-piece" data-rule-demo="piece">
  {stage===2?<div className="rule-demo-clue" role="img" aria-label="Example: buying a clue reduces four minutes to three minutes and forty seconds">
   <span>{fmt(pieceTime)}</span><span>−{fmt(pieceHintCost)}</span><strong>{fmt(pieceTime-pieceHintCost)}</strong>
  </div>:stage===3?<div className="rule-demo-pass" aria-label="The active player makes a move, then the next seat acts" role="img">
   <span>Action complete</span><span aria-hidden="true">→</span><strong>Next seat</strong>
  </div>:<svg viewBox="0 0 156 81" className="rule-demo-fit" role="img" aria-label={stage===0?'Example: a four-cell tray piece and the silhouette on a seven by seven grid.':'Example: the same piece, rotated 90 degrees clockwise to fit without overlap.'} data-grid-size={pieceSide}>
   <g className="rule-demo-tray" aria-hidden="true">
    <rect x="2" y="15" width="48" height="48" rx="3"/>
    {pieceRotation(layout.pieces[0],rotation).map(([x,y])=><rect className="rule-demo-fit-tile" key={x+':'+y} x={11+x*10} y={24+y*10} width="9" height="9" rx="1"/>)}
   </g>
   <path className="rule-demo-arrow" d="M56 40h13m-5-4 5 4-5 4" aria-hidden="true"/>
   <g transform="translate(80 5)" aria-hidden="true">{layout.target.map((on,i)=><rect key={i} className={stage>0&&shown.includes(i)?'rule-demo-fit-tile':on?'rule-demo-target':'rule-demo-outside'} x={i%pieceSide*10} y={Math.floor(i/pieceSide)*10} width="9" height="9" rx=".7"/>)}</g>
  </svg>}
  <figcaption>{[
   'Fill the silhouette with the tray pieces.',
   'Rotate 90° and fit the piece inside the silhouette.',
   'A clue costs 20 seconds of the shared clock.',
   'In a party, the next seat takes a turn.',
  ][stage]}</figcaption>
 </figure>
}

export function RuleDemo({game,step}:{game:Game;step:number}){
 switch(game){
  case 'blind':return <BlindDemo step={step}/>
  case 'auction':return <AuctionDemo step={step}/>
  case 'piece':return <PieceDemo step={step}/>
  default:return null
 }
}
