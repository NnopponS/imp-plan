import type {ReactNode} from 'react'
import type {Lesson,LessonMap} from './lesson-book'
import {countRectangles} from './puzzles'
import {magicSolution} from './divine'
import {equationMarks} from './equations'
import {orient} from './grass'
import {clue} from './secret'
import {rankPokerHand} from './memory-poker'
import './archive-lessons.css'

type Row=[title:string,caption:string,picture:ReactNode]
function lesson(name:string,rows:Row[]):Lesson{
 return {frames:rows.map(([title,caption])=>({title,caption})),render:i=><svg className="archive-plate" viewBox="0 0 320 172" role="img" aria-label={name+' example: '+rows[i][0]} data-archive-frame={i}>
  <rect x="5" y="5" width="310" height="162" rx="3" className="al-border"/>
  <path d="M13 26V13h19m256 0h19v13M13 145v14h19m256 0h19v-14" className="al-corners"/>{rows[i][2]}
 </svg>}
}
function text(x:number,y:number,value:ReactNode,size=16,tone='paper'){
 return <text x={x} y={y} fontSize={size} textAnchor="middle" fill={colors[tone]}>{value}</text>
}
const colors:Record<string,string>={ink:'#30271e',paper:'#f5e3bd',gold:'#e5b567',green:'#94c4ab',red:'#df9e89',muted:'#bba487'}
function tile(x:number,y:number,value:ReactNode,w=32,h=30,tone='paper'){
 return <g key={x+':'+y}><rect x={x} y={y} width={w-2} height={h-2} rx="2" fill={colors[tone]} stroke="#6e5840"/>{text(x+(w-2)/2,y+h*.67,value,Math.min(18,h*.6),'ink')}</g>
}
function tablet(x:number,y:number,value:string,tone='gold',w=100){return <g><rect x={x-w/2} y={y-21} width={w} height="34" rx="2" fill={colors[tone]}/>{text(x,y+2,value,15,'ink')}</g>}
function gridBoard(values:(string|number)[],cols:number,x:number,y:number,side:number,on:number[]=[],tone='gold'){
 return values.map((v,i)=>tile(x+(i%cols)*side,y+Math.floor(i/cols)*side,v,side,side,on.includes(i)?tone:v===''?'ink':'paper'))
}
function rectangles(zero:boolean){
 const values=zero?[2,-2,5,-5]:[3,2,1,1],goal=zero?0:3,focus=zero?[0,1]:[0],last=zero?[2,3]:[1,3],total=countRectangles(values,2,2,goal)
 const scene=(cells:number[],legend:string,summary?:string)=><>{gridBoard(values,2,45,36,46,cells)}{text(216,54,'TARGET',12,'muted')}{text(216,89,goal,36,'gold')}{text(216,119,legend,15)}{summary&&text(92,145,summary,12,'muted')}</>
 return lesson(zero?'Exile Rectangle Counting':'Count the Rectangles',[
  ['Read the grid',zero?'Find rectangles with a sum of zero. Negative values count.':'Count rectangles whose tiles add up to the target.',scene([],'2 × 2 example')],
  [zero?'Cancel a pair':'Count single tiles',zero?'The top pair cancels: 2 + (−2) = 0.':'A single 3 is a rectangle that already meets the target.',scene(focus,zero?'2 − 2 = 0':'3 = 3')],
  [zero?'Include larger shapes':'Scan both directions',zero?'Both rows qualify, and so does the entire square. Submit three.':'The right column also qualifies: 2 + 1 = 3. The total here is two.',scene(last,total+' rectangles',zero?'Whole grid also sums to 0':'Only the two shown qualify')]
 ])
}
function cube(x:number,y:number,color='gold'){
 return <g key={x+':'+y} transform={`translate(${x} ${y})`} stroke="#4a3a29" strokeWidth="1.1"><path d="M0-16 21-6 0 4-21-6Z" fill={colors[color]}/><path d="M-21-6 0 4v21l-21-10Z" fill={color==='green'?'#799d8a':'#c39458'}/><path d="M0 4 21-6v21L0 25Z" fill={color==='green'?'#526f62':'#967246'}/></g>
}
function cubeStack(step:number){
 // 2 x 2 base; one cube sits directly on the rear cube.
 return <>{cube(90,88,step===1?'green':'gold')}{cube(69,98)}{cube(111,98)}{cube(90,108)}{step===0&&cube(90,67,'green')}
  {step===2&&cube(192,65,'green')}{step===2?text(204,117,'4 + 1 = 5',19,'gold'):<>{text(216,77,step===0?'Two layers':'Bottom layer',18,'gold')}{text(216,101,step===0?'Side view':'4 supports',14)}</>}</>
}
function secretScene(stage:number){
 return <>{tile(37,48,'?',55,61)}{tile(228,48,'?',55,61)}{text(64,132,'Your number',12)}{text(255,132,'Partner',12)}
  {stage===0?<>{text(160,76,'≠',30,'gold')}{text(160,100,'Hidden',12)}</>:stage===1?<>{tablet(160,56,'SUM TICKET','green',111)}<path d="M86 88h148" className="al-corners" strokeDasharray="3 3"/>{text(160,113,'Both agree',16)}</>:<><rect x="115" y="37" width="90" height="99" rx="4" fill="#433b30" stroke="#ae8d63" strokeDasharray="4 2"/>{text(160,59,'Private clue',14,'green')}{text(160,95,clue(0,12,35),34,'gold')}{text(160,124,'? + ? = 47',14)}</>}</>
}
function grass(stage:number,bonus:boolean){
 if(stage===0&&bonus)return <>{text(155,36,'DRAFT ORDER',15,'muted')}{tablet(98,77,'Seat A')}{tablet(224,77,'Seat B','green')}{text(160,124,'⇄',36,'gold')}</>
 const area=Array(16).fill(''),size=27,x=37,y=31,patch=[5,6],newCells=[9,10]
 return <>{gridBoard(area,4,x,y,size,patch.concat(stage>0?newCells:[]),'green')}{stage<2&&bonus&&text(x+size*2.5,y+size*2.72,'✦',19,'ink')}
  {stage===0?<>{orient(0,0).map(([a,b])=>tile(193+size*a,61+size*b,'',size,size,'green'))}{text(218,113,'Draft a tile',14)}</>:stage===1?<>{text(219,76,'Edge to edge',18,'green')}{text(219,101,'No overlap',14)}</>:<>
   <rect x={x+size+1} y={y+size+1} width={size*2-4} height={size*2-4} className="al-mark"/>
   {text(222,79,bonus?'4 cells':'2 × 2',23,'gold')}{text(222,103,bonus?'+ bonus':'solid square',14)}</>}</>
}
const magic=magicSolution(3,0)
function magicDiagram(stage:number){
 const shown=stage===0?[4]:stage===1?[0,1,2,4]:[0,1,2,3,4,5,6,7,8]
 return <>{gridBoard(magic.map((n,i)=>shown.includes(i)?n:''),3,32,28,38,[4],'gold')}
  {text(220,66,stage===0?'Fixed clue':stage===1?'One row':'Every line',16,'green')}
  {text(220,98,stage===0?'5':stage===1?'8 + 1 + 6':'15',stage===1?19:30,'gold')}{stage===1&&text(220,123,'= 15',18)}</>
}
const secretEq='12+13=25',guessEq='10+12=22'
function equation(stage:number){
 const guess=stage===2?secretEq:guessEq
 const marks=equationMarks(secretEq,guess)
 return <>{text(160,44,stage===0?'HIDDEN EQUATION':stage===1?'FIRST GUESS':'SOLVED',13,'muted')}
  {Array.from(stage===0?secretEq:guess).map((v,i)=>tile(21+i*35,61,v,35,38,stage===0?'paper':marks[i]==='exact'?'green':marks[i]==='present'?'gold':'red'))}
  {stage>0&&marks.map((m,i)=><g key={i}>{text(37+i*35,121,m==='exact'?'✓':m==='present'?'↔':'·',19)}</g>)}</>
}
function pyramid(stage:number){
 return <>{[7,3,2].map((v,i)=>tile([84,56,112][i],[29,80,80][i],v,42,40,stage===0?'paper':'gold'))}
  <path d="m93 71-7 7m28-7 7 7" className="al-corners"/>
  {stage===2&&<><circle cx="91" cy="72" r="9" fill={colors.green}/>{text(91,76,'+',14,'ink')}<circle cx="122" cy="72" r="9" fill={colors.green}/>{text(122,76,'+',14,'ink')}</>}{text(223,59,'TARGET',13,'muted')}{text(223,89,'12',32,'green')}{text(220,122,stage===0?'Choose a family':stage===1?'7   3   2':'(7 + 3) + 2',16)}</>
}
function fragments(stage:number){
 const exhibit=<><path d="M33 106H287" className="al-corners"/><path d="M73 88q0-13 9-17V55h16v16q8 5 8 17v13H73Z" fill={colors.green}/><path d="m148 99-13-20 13-20 14 20Z" fill={colors.gold}/><path d="M193 75h38v23h-38z M231 80q16-3 12 8-2 6-12 5" fill="none" stroke={colors.red} strokeWidth="3"/>{tablet(160,135,'ATLAS','paper',79)}</>
 return stage===0?exhibit:<><path d="M37 36H283V117H37Z" fill="#3e362c" stroke="#927554"/><path d="M42 41l231 68M278 41 47 109" stroke="#635342"/>{tablet(160,81,stage===1?'Which word?':'ATLAS',stage===1?'paper':'green',147)}{text(160,142,stage===1?'The exhibit is covered':'Correct recall',14)}</>
}
function specimen(x:number,right:boolean,marked:boolean){
 return <g transform={`translate(${x} 47)`}><rect width="113" height="75" fill="#46392c" stroke="#9b7b52"/><path d="M38 1v73m38-73v73" stroke="#836c4f"/><circle cx="19" cy="38" r="12" fill={colors.gold}/><path d="m57 23 12 15-12 15-12-15Z" fill={colors.green}/>
  {right?<path d="M94 24v28m-14-14h28" stroke={colors.red} strokeWidth="7"/>:<circle cx="94" cy="38" r="12" fill={colors.red}/>}
  {marked&&<rect x="78" y="11" width="32" height="53" className="al-mark"/>}</g>
}
function scale(stage:number){
 const tilt=stage===1?-8:0
 return <>{text(160,39,stage===0?'Known reference':stage===1?'One jade is lighter':'Two jade balance',17)}
  <path d="M160 69v56m-22 3h44" className="al-corners"/><g transform={`rotate(${tilt} 160 73)`}><path d="M73 72h174m-168 0-14 35h30L79 72m162 0-15 35h31l-16-35" className="al-corners"/>{tile(68,83,'6',23,23,'gold')}{stage>0&&tile(232,84,'?',21,21,'green')}{stage===2&&tile(244,84,'?',21,21,'green')}</g>
  {text(160,149,stage===2?'Jade = 3':stage===1?'Brass > jade':'Brass = 6',15,'gold')}</>
}
function word(stage:number){
 const words=['FOG','RAIN','WIND']
 return <>{words.map((v,i)=><g key={v}>{Array.from(v).map((letter,j)=>tile(78+i*59,26+j*30,stage===2||i===0&&(stage===1||j<2)?letter:'',33,30,stage===2?'green':'paper'))}</g>)}
  {stage===0&&tile(253,67,'G',34,33,'gold')}{stage===0&&text(270,116,'Tray',13)}</>
}
const hand=[8,9,10,11,12],pokerRank=rankPokerHand(hand)!.name
const cards=[...hand,...Array.from({length:15},(_,i)=>i+13)]
function poker(stage:number){
 const names=['2','3','4','5','6','7','8','9','10','J','Q','K','A'],suits=['♣','♦','♥','♠']
 return <>{cards.map((card,i)=>tile(23+(i%5)*38,30+Math.floor(i/5)*29,stage===0||stage===2&&i<5?names[card%13]+suits[Math.floor(card/13)]:String.fromCharCode(65+i),37,29,stage>0&&i<5?'green':'paper'))}
  {stage>0&&cards.map((_,i)=>stage===2&&i<5?null:<path key={i} transform={`translate(${26+(i%5)*38} ${33+Math.floor(i/5)*29})`} d="m0 7 7-7m16 19 5-5" stroke="#89774f" fill="none"/>)}
  {text(252,74,stage===0?'25 sec':stage===1?'Lock five':'Straight',16,'gold')}{text(252,99,stage===0?'Study':stage===1?'30 sec':pokerRank.split(' ')[1],16)}</>
}
export const extraLessons={
 rectangles:rectangles(false),exile:rectangles(true),
 cubes:lesson('Count the Cubes',[
  ['Inspect the stack','Count unit cubes, including hidden supports.',cubeStack(0)],
  ['Peel away a layer','The lower layer contains four cubes, including the one under the top cube.',cubeStack(1)],
  ['Add the layers','Four on the bottom plus one on top gives five. Lock your total.',cubeStack(2)]
 ]),
 secret:lesson('Secret Number',[
  ['Start in the dark','Each number is private. Even your own is hidden.',secretScene(0)],
  ['Match tickets','Agree with another player to spend the same kind of math ticket.',secretScene(1)],
  ['Use the clue','A Sum ticket reveals your combined total only to the pair. After four rounds, guess your number.',secretScene(2)]
 ]),
 grass1:lesson('Laying Grass',[
  ['Draft a tile','Choose a shape from the shared tray. You have one redraw in nine rounds.',grass(0,false)],
  ['Extend your patch','Rotate the tile and fit it beside your territory without overlapping.',grass(1,false)],
  ['Grow a solid square','A filled 2 × 2 outranks a loose strip of the same area.',grass(2,false)]
 ]),
 grass3:lesson('Lay the Grass',[
  ['Negotiate the order','Swap draft positions only if both seats agree, or keep your place.',grass(0,true)],
  ['Cover a bonus','Draft a tile that touches your patch; marked cells bring extra points.',grass(1,true)],
  ['Compare territory','After four rounds, score your area plus bonuses.',grass(2,true)]
 ]),
 divine:lesson('Divine Test',[
  ['Keep the fixed tile','Read the symbols as values. In this decoded example, the middle 5 is fixed.',magicDiagram(0)],
  ['Build equal sums','Choose a tile, then an empty cell. This top row totals 15.',magicDiagram(1)],
  ['Check every line','All rows, all columns and both diagonals must total the same number.',magicDiagram(2)]
 ]),
 equations:lesson('Equation Lights',[
  ['Hide an equation','Choose a true equation with exactly eight characters.',equation(0)],
  ['Read the lights','A check is an exact match; an arrow means elsewhere, and a dot means absent.',equation(1)],
  ['Find the exact equation','Use feedback to revise your next guess. Both seats get equal attempts.',equation(2)]
 ]),
 pyramid:lesson('Equation Pyramid',[
  ['Choose three neighbours','Pick one tile with its two immediate children.',pyramid(0)],
  ['Arrange the expression','Select those tiles in the order you want to calculate.',pyramid(1)],
  ['Make the target','Choose two operators and a grouping. Here (7 + 3) + 2 makes 12.',pyramid(2)]
 ]),
 fragments:lesson('Fragments of Memory',[
  ['Study the exhibit','Notice objects, positions and labels before the 45-second study ends.',fragments(0)],
  ['Recall without peeking','When the exhibit disappears, answer the question on your turn.',fragments(1)],
  ['Check the answer','The label was ATLAS. A correct answer adds to the team’s total.',fragments(2)]
 ]),
 spot:lesson('Spot the Difference',[
  ['Compare the trays','Look at corresponding regions, not just the whole scene.',<>{specimen(30,false,false)}{specimen(177,true,false)}</>],
  ['Mark the change','The rightmost symbol changes from a circle to a cross. Select its region once.',<>{specimen(30,false,true)}{specimen(177,true,true)}{text(160,147,'One difference found',16,'green')}</>],
  ['Avoid false marks','The diamond is unchanged. A wrong mark costs five seconds.',<>{specimen(30,false,false)}{specimen(177,true,false)}<path d="m222 71 23 25m0-25-23 25" stroke={colors.red} strokeWidth="2"/>{text(160,147,'−5 seconds',16,'red')}</>]
 ]),
 scale:lesson('Scale Game',[
  ['Start with brass','Use the known brass weight to measure four unknown minerals.',scale(0)],
  ['Compare the pans','Here one jade is lighter than a brass weight of six.',scale(1)],
  ['Deduce the weight','Two jade balance six: each jade weighs three. Lock the team answer after testing.',scale(2)]
 ]),
 tower:lesson('Word Tower',[
  ['Read down the column','Build different words from the given theme. This example uses Weather.',word(0)],
  ['Place letters','Add G under FO to make FOG. Up to two tile edits are allowed per turn.',word(1)],
  ['Finish every tower','Use all letters to make distinct valid words in every column.',word(2)]
 ]),
 memoryPoker:lesson('Memory Poker',[
  ['Study the layout','Memorize the ranks and suits of 20 cards in 25 seconds.',poker(0)],
  ['Lock five positions','After the cards turn over, choose five positions in 30 seconds.',poker(1)],
  ['Reveal your hand','These five clubs make a straight flush. Poker rank decides the round; no betting.',poker(2)]
 ])
} satisfies LessonMap
