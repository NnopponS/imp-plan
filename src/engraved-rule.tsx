import type {Game} from './engine'

const games=new Set<Game>(['morris','knight','remove','fence','codeLock'])
export const hasEngravedRule=(game:Game)=>games.has(game)
const accents={edge:'#87654a',board:'#e9d3a5',ink:'#382922',gold:'#ba8543',red:'#963d37',paper:'#f4e6c9',shade:'#a88458'}
const {edge,board,ink,gold,red,paper,shade}=accents
const clamp=(s:number,last:number)=>Math.min(last,Math.max(0,s|0))
function grid(n:number,x=67,y=12,step=24){
 return <g aria-hidden="true">{Array.from({length:n*n},(_,i)=><rect key={i} x={x+i%n*step} y={y+Math.floor(i/n)*step} width={step} height={step} fill={(i%n+Math.floor(i/n))%2===0?board:paper} stroke={edge} strokeWidth=".7"/>)}</g>
}
const dot=(x:number,y:number,fill:string,r=8)=><circle cx={x} cy={y} r={r} fill={fill} stroke={ink} strokeWidth="1.2"/>
function card(x:number,y:number,value:number|string,on=true){
 return <g opacity={on?1:.45}><rect x={x} y={y} width="38" height="58" rx="2" fill={paper} stroke={edge} strokeWidth="2"/><rect x={x+4} y={y+4} width="30" height="50" rx="1" fill="none" stroke={shade}/><text x={x+19} y={y+35} textAnchor="middle" fontSize="21" fill={ink} fontFamily="Georgia">{value}</text></g>
}
export function EngravedRule({game,step}:{game:Game;step:number}){
 let caption='',picture
 switch(game){
 case 'morris':{
  const s=clamp(step,3)
  caption=['Place a stone on a marked point.','Three along a drawn line form a mill. Remove an opponent’s stone.','After placement, slide along a line. With three stones left, fly to an open point.','Fewer than three stones, or no legal move, loses.'][s]
  picture=<g><rect x="66" y="12" width="108" height="108" rx="3" fill={board} stroke={edge}/><path d="M72 18h96v96H72z M86 32h68v68H86z M100 46h40v40h-40z M120 18v28m0 40v28M72 66h28m40 0h28" fill="none" stroke={ink}/>{[[72,18],[120,18],[168,18],[72,66],[168,66],[72,114],[120,114],[168,114],[86,32],[120,32],[154,32],[86,66],[154,66],[86,100],[120,100],[154,100],[100,46],[120,46],[140,46],[100,66],[140,66],[100,86],[120,86],[140,86]].map(([x,y])=><g key={x+':'+y}>{dot(x,y,ink,1.7)}</g>)}
  {s===1&&<path d="M72 18h96" stroke={gold} strokeWidth="8" opacity=".65"/>}{dot(72,18,gold)}{dot(s===2?120:168,s===2?32:18,gold)}{s>0&&dot(120,18,gold)}
  {s<2?dot(154,100,red):<path d="M150 96l8 8m0-8-8 8" stroke={red} strokeWidth="2"/>}{s===2&&<path d="M120 22v5m-2-2 2 2 2-2" stroke={red} fill="none"/>}</g>
  break
 }
 case 'knight':{
  const s=clamp(step,2)
  caption=['Jump two squares in one direction and one across.','Undo a move to try another route.','Finish the board; a closed tour also ends within one knight jump of the start.'][s]
  picture=<g>{grid(5,60,6,24)}<path d={s===1?'M96 90H120V42':'M96 90h48v-24'} fill="none" stroke={red} strokeWidth="4" strokeDasharray={s===1?'5 4':undefined}/>{dot(96,90,gold,8)}{dot(s===1?120:144,s===1?42:66,red,8)}<path d="M90 89l6-12 5 2-1 5-5-1 6 10h-12Z" fill={ink}/>{s===2&&<path d="M144 66q14 36-48 24" stroke={gold} strokeDasharray="3 3" fill="none"/>}</g>
  break
 }
 case 'remove':{
  const s=clamp(step,2)
  caption=['Keep one of your two cards. The other stays face down.','Here, two players kept 2; the unique 4 earns the chips.','The eight regular rounds start with five chips each.'][s]
  picture=<g>{s===0?<>{card(65,29,4)}{card(137,29,'◆',false)}<path d="M116 35v46" stroke={shade} strokeDasharray="3 4"/></>:s===1?<>{card(31,27,2)}{card(100,27,2)}{card(169,27,4)}{dot(180,105,gold,7)}{dot(199,105,gold,7)}</>:<>{[0,1,2,3,4].map(i=><g key={i}>{dot(65+i*28,66,gold,12)}<circle cx={65+i*28} cy={66} r={8} fill="none" stroke={shade}/></g>)}</>}</g>
  break
 }
 case 'fence':{
  const s=clamp(step,3)
  caption=['A continuous fence returns to its starting edge.','A 2 requires exactly two of the marked cell’s borders.','Cross out an edge to record that it stays open.','Your grid is private during the four-minute solve.'][s]
  picture=<g>{grid(4,68,10,26)}<text x="107" y="55" textAnchor="middle" fontSize="17" fill={ink} fontFamily="Georgia">2</text><path d={s===0?'M94 36h52v52H94z':s===1?'M94 62V36h26':'M94 36h52v52H94z'} fill="none" stroke={red} strokeWidth="3.5" strokeLinejoin="round"/>{s>=2&&<path d="M116 48l8 7m0-7-8 7" stroke={gold} strokeWidth="2"/>}</g>
  break
 }
 case 'codeLock':{
  const s=clamp(step,3)
  caption=['Arrange four different cards so each clue is satisfied.','A wrong party submission costs 15 seconds.','Solo lets you practice and try again.','An exact order beats a partial positional score.'][s]
  picture=<g>{[3,7,1,5].map((n,i)=><g key={n}>{card(25+i*51,26,s===3||i<2?n:'◆',s===3||i!==2)}</g>)}<path d="M47 96h52m-7-4 7 4-7 4" stroke={red} strokeWidth="2" fill="none"/>{s===1&&<text x="178" y="111" textAnchor="middle" fontFamily="Georgia" fontSize="15" fill={red}>−15s</text>}{s===2&&<path d="M170 111a12 12 0 1 0 0-14v-7m0 7h8" stroke={gold} strokeWidth="2" fill="none"/>}</g>
  break
 }
 default:return null
 }
 return <figure className="engraved-rule rule-demo" data-engraved-rule={game}>
  <svg viewBox="0 0 240 126" role="img" aria-label={caption}><rect x="1" y="1" width="238" height="124" rx="3" fill="#eadab7" stroke={edge}/><path d="M10 18v-8h20m180 0h20v8M10 108v8h20m180 0h20v-8" stroke={shade} fill="none"/>{picture}</svg>
  <figcaption>{caption}</figcaption>
 </figure>
}
