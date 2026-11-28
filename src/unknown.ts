export const unknownSize=7
export const unknownGoal=24
export const unknownMaxSeats=12
export const unknownRounds=10
export const unknownMoves=['north','east','south','west','pass'] as const
export const cubeColors=['red','gold','blue','green','violet','white'] as const
type CubeColor=typeof cubeColors[number]
type Tile=CubeColor|'start'|'goal'|'wall'
export type UnknownMove=typeof unknownMoves[number]
type Direction=Exclude<UnknownMove,'pass'>
// Top, bottom, north, south, east, west.
export type CubeFaces=readonly [CubeColor,CubeColor,CubeColor,CubeColor,CubeColor,CubeColor]
type Cube={seat:string,cell:number,home:number,faces:CubeFaces}
const starts=[2,3,4,20,27,34,46,45,44,28,21,14] as const
const defaultFaces:CubeFaces=['red','white','gold','blue','green','violet']
const lawPair=[['whiteFace','whiteTile'],['tripleLine','floorEcho'],['isolatedFace','floorTint']] as const
type Law=typeof lawPair[number][number]
export const lawText:Record<Law,string>={
 whiteFace:'Exile. If the cube shows ivory on top after a roll, it returns home.',
 whiteTile:'Exile. Landing on an ivory tile sends that cube home.',
 tripleLine:'Echo. The top symbol and two neighboring tiles in a straight line grant one more roll.',
 floorEcho:'Echo. A top symbol matching the tile under it grants one more roll.',
 isolatedFace:'Shift. With no matching neighboring tile, the top changes to a neighboring symbol.',
 floorTint:'Shift. On a matching tile, the top changes to a neighboring symbol.',
}
type Event={seat:string,from:number,to:number,top:CubeColor,stop:number,after:CubeColor,echo:boolean,exiled:boolean,shifted:boolean,pushed:{seat:string,to:number,stop:number,top:CubeColor,exiled:boolean}|null}
type Trace=Event|{seat:string,from:null,to:null}
export type UnknownState={
 seats:string[],board:Tile[],cubes:Cube[],laws:Law[],turn:number,step:number,round:number,
 deadline:number,window:number,bonus:boolean,trace:Trace[],end:'center'|'limit'|null,
 winner:string|null,scores:number[]
}
export type UnknownView=ReturnType<typeof unknownView>
const neighbors:Record<Direction,[number,number]>={north:[0,-1],east:[1,0],south:[0,1],west:[-1,0]}
const headings:Direction[]=['north','east','south','west']
export const unknownDistance=(cell:number)=>Math.abs(cell%7-3)+Math.abs(Math.floor(cell/7)-3)
function offset(at:number,dx:number,dy:number){
 const x=at%7+dx,y=Math.floor(at/7)+dy
 return x<0||y<0||x>=7||y>=7?-1:y*7+x
}
export const unknownDestination=(at:number,dir:Direction)=>offset(at,...neighbors[dir])
export function rollCube([t,b,n,s,e,w]:CubeFaces,move:Direction):CubeFaces{
 switch(move){
  case 'north':return [s,n,t,b,e,w]
  case 'east':return [w,e,n,s,t,b]
  case 'south':return [n,s,b,t,e,w]
  case 'west':return [e,w,n,s,b,t]
 }
}
function floor(seed:number):Tile[]{
 const symbols:CubeColor[]=['blue','violet','gold','green','red','green','blue','white','violet','gold','gold','red','green','blue','red','violet','white','gold','white','green','red','blue','violet','gold','blue']
 let k=0
 const order=(seed>>>0)%5
 const invert=Boolean(seed&1)
 return Array.from({length:49},(_,i)=>{
  if((starts as readonly number[]).includes(i))return 'start'
  const x=i%7,y=Math.floor(i/7)
  if(x===0||y===0||x===6||y===6)return 'wall'
  const symbol=symbols[invert?24-k++:k++]
  return i===unknownGoal?'goal':symbol==='white'?symbol:cubeColors[(cubeColors.indexOf(symbol)+order)%5]
 })
}
export function unknownStart(seats:string[],seed:number,now:number,window:number,choose=(upper:number)=>(seed>>>0)%upper):UnknownState{
 if(seats.length<2||seats.length>unknownMaxSeats||new Set(seats).size!==seats.length)throw Error('Invalid cube race seats')
 const cubes=seats.map((seat,i)=>{
  const home=starts[Math.floor(i*starts.length/seats.length)]
  // Lay out identical dice so their first inward roll offers the same colors.
  const inward=rollCube(defaultFaces,'south')
  const face=rollCube(inward,home<7?'north':home%7===6?'east':home>41?'south':'west')
  return {seat,cell:home,faces:face,home}
 })
 return {seats,board:floor(seed),cubes,laws:lawPair.map(pair=>pair[choose(pair.length)]),turn:0,step:0,round:1,deadline:now+window,window,
  bonus:false,trace:[],end:null,winner:null,scores:cubes.map(c=>6-unknownDistance(c.cell))}
}
function moves(board:Tile[],cubes:Cube[],current:Cube):UnknownMove[]{
 const valid=(at:number)=>board[at]!==undefined&&board[at]!=='wall'&&board[at]!=='start'
 const occupied=(at:number)=>cubes.some(c=>c.cell===at)
 const possible=headings.filter(dir=>{
  const landed=unknownDestination(current.cell,dir)
  if(!valid(landed))return false
  if(!occupied(landed))return true
  const beyond=unknownDestination(landed,dir)
  // A cube can vault into the center, including when legally nudged there.
  return valid(beyond)&&!occupied(beyond)
 })
 return possible.length?possible:['pass']
}
export function unknownChoices(s:UnknownState,seat:string):UnknownMove[]{
 return !s.end&&s.seats[s.turn]===seat?moves(s.board,s.cubes,s.cubes[s.turn]):[]
}
const adjacent=(at:number)=>[-1,0,1].flatMap(dy=>[-1,0,1].flatMap(dx=>dx||dy?[offset(at,dx,dy)]:[]))
function matchesLine(at:number,top:CubeColor,board:Tile[]){
 return [[1,0],[0,1],[1,1],[1,-1]].some(([dx,dy])=>
  [[-2,-1],[-1,1],[1,2]].some(([a,b])=>board[offset(at,a*dx,a*dy)]===top&&board[offset(at,b*dx,b*dy)]===top))
}
function shiftFaces(faces:CubeFaces,to:CubeColor):CubeFaces{
 switch(faces.indexOf(to)){
  case 1:return rollCube(rollCube(faces,'north'),'north')
  case 2:return rollCube(faces,'south')
  case 3:return rollCube(faces,'north')
  case 4:return rollCube(faces,'west')
  case 5:return rollCube(faces,'east')
  default:return faces
 }
}
const close=(s:UnknownState,center:string|null):UnknownState=>{
 const scores=s.cubes.map(c=>6-unknownDistance(c.cell))
 const leaders=s.cubes.filter((_,i)=>scores[i]===Math.max(...scores))
 return {...s,scores,end:center?'center':'limit',winner:center??(leaders.length===1?leaders[0].seat:null)}
}
function nextTurn(s:UnknownState,now:number,change:Pick<UnknownState,'cubes'|'trace'>,echo:boolean,center:string|null){
 const turn=echo?s.turn:(s.turn+1)%s.seats.length
 const round=!echo&&turn===0?s.round+1:s.round
 const next={...s,...change,bonus:echo,round:Math.min(unknownRounds,round),turn,step:s.step+1,deadline:now+s.window,
  scores:change.cubes.map(c=>6-unknownDistance(c.cell))}
 return center||round>unknownRounds?close(next,center):next
}
export function unknownAct(s:UnknownState,seat:string,choice:UnknownMove,now:number):UnknownState|null{
 if(now>=s.deadline||!unknownChoices(s,seat).includes(choice))return null
 const current=s.cubes[s.turn]
 if(choice==='pass')return nextTurn(s,now,{cubes:s.cubes,trace:[...s.trace.slice(-11),{seat,from:null,to:null}]},false,null)
 const cubes=s.cubes.slice()
 const from=current.cell,to=unknownDestination(from,choice),top=rollCube(current.faces,choice)[0]
 const pushedIndex=cubes.findIndex(c=>c.cell===to)
 const exile=(tile:number,faces:CubeFaces)=>tile!==unknownGoal&&(s.laws[0]==='whiteFace'?faces[0]==='white':s.board[tile]==='white')
 let pushed:Event['pushed']=null,center:string|null=null
 if(pushedIndex>=0){
  const victim=cubes[pushedIndex],landing=unknownDestination(to,choice),rolled=rollCube(victim.faces,choice)
  const exiled=exile(landing,rolled)
  cubes[pushedIndex]={...victim,cell:exiled?victim.home:landing,faces:rolled}
  pushed={seat:victim.seat,to:landing,stop:cubes[pushedIndex].cell,top:rolled[0],exiled}
  if(landing===unknownGoal)center=victim.seat
 }
 const rolled=rollCube(current.faces,choice)
 const exiled=exile(to,rolled)
 const tiles=adjacent(to).map(i=>s.board[i])
 const shiftTo=!exiled&&!center&&to!==unknownGoal&&(s.laws[2]==='isolatedFace'?!tiles.includes(top):s.board[to]===top)
  ?cubeColors.find(color=>color!==top&&color!=='white'&&tiles.includes(color)):undefined
 const faces=shiftTo?shiftFaces(rolled,shiftTo):rolled
 const echo=!exiled&&!center&&to!==unknownGoal&&!s.bonus&&(s.laws[1]==='tripleLine'?matchesLine(to,faces[0],s.board):s.board[to]===faces[0])
 center=to===unknownGoal?seat:center
 const stop=exiled?current.home:to
 cubes[s.turn]={...current,cell:stop,faces}
 const trace:Trace[]=[...s.trace.slice(-11),{seat,from,to,stop,top,after:faces[0],pushed,echo,exiled,shifted:shiftTo!==undefined}]
 return nextTurn(s,now,{cubes,trace},echo,center)
}
export function unknownTick(s:UnknownState,now:number){
 if(s.end||now<s.deadline)return s
 const seat=s.seats[s.turn]
 return nextTurn(s,now,{cubes:s.cubes,trace:[...s.trace.slice(-11),{seat,from:null,to:null}]},false,null)
}
export function unknownView(s:UnknownState,seat:string){
 const {board,cubes,seats,turn,step,round,deadline,bonus,trace,end,winner,scores}=s
 return {board,cubes,seats,turn:seats[turn],step,round,deadline,bonus,trace,end,winner,scores,
  allowed:unknownChoices(s,seat),revealed:s.laws.slice(0,end?s.laws.length:Math.floor((round-1)/2))}
}
export function unknownBot(v:UnknownView,seed=0,level:'easy'|'normal'|'hard'='normal'):UnknownMove{
 const c=v.cubes.find(c=>c.seat===v.turn)
 if(!c||!v.allowed.length)return 'pass'
 return v.allowed.map(dir=>{
  if(dir==='pass')return [dir,-100] as const
  const there=unknownDestination(c.cell,dir),top=rollCube(c.faces,dir)[0],other=v.cubes.find(cube=>cube.cell===there)
  const faceRule=v.revealed.includes('whiteFace')
  const tileRule=v.revealed.includes('whiteTile')
  const suspectedExile=v.trace.some(ev=>ev.to!==null&&ev.exiled&&((top==='white'&&ev.top==='white')||(v.board[there]==='white'&&v.board[ev.to]==='white')))
  const risk=(faceRule&&top==='white')||(tileRule&&v.board[there]==='white')||(!faceRule&&!tileRule&&suspectedExile)
  const extra=!v.bonus&&(v.revealed.includes('floorEcho')&&v.board[there]===top||v.revealed.includes('tripleLine')&&matchesLine(there,top,v.board))
  const pushesToSeal=other&&unknownDestination(there,dir)===unknownGoal
  const backwards=v.trace.some(ev=>ev.seat===c.seat&&ev.from===there)
  const noise=((seed+v.step*13+there*17)>>>0)%19/19
  const score=there===unknownGoal?100:pushesToSeal?-95:-unknownDistance(there)*2-(risk&&level!=='easy'?7:0)-(other?1:0)-(backwards?.8:0)+(extra&&level==='hard'?3:0)+noise*(level==='easy'?3:1)
  return [dir,score] as const
 }).sort((a,b)=>b[1]-a[1])[0][0]
}
