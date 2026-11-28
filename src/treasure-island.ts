export const islandSize=9
export const islandStart=40
export const islandRounds=5
export const islandMaxSeats=16
export const islandChips=15
export const islandStepLimit=islandMaxSeats*2+islandRounds
export const islandRouteLimit=islandChips+1
const chart=[
 '~~~..~~~~',
 '~~.....~~',
 '~..#....~',
 '~......~~',
 '.........',
 '~.......~',
 '~~....#.~',
 '~~~.....~',
 '~~~~...~~',
]
export const islandTerrain=chart.join('').split('').map(c=>c==='~'?'water':c==='#'?'reef':'land')
export const islandCellName=(cell:number)=>'ABCDEFGHI'[cell%islandSize]+String(Math.floor(cell/islandSize)+1)

export type Direction=0|1|2|3
export const islandDirections=['North','East','South','West'] as const
export type ArrowShape='step'|'long'|'bend'|'reach'|'hook'
export const islandArrows:Record<ArrowShape,{name:string;directions:readonly Direction[]}> ={
 step:{name:'Step',directions:[0]},long:{name:'Straight II',directions:[0,0]},bend:{name:'Elbow II',directions:[0,1]},
 reach:{name:'Straight III',directions:[0,0,0]},hook:{name:'Elbow III',directions:[0,0,1]},
}
export type IslandArrow={id:number;shape:ArrowShape}
export type IslandPiece={arrow:number;turn:Direction}
export type IslandAction={kind:'bid';amount:number}|{kind:'sail';route:IslandPiece[]}
type CompassClue={distance:number;rowParity:'even'|'odd'}
export type IslandDig={round:number;endpoint:number|null;kind:'pass'|'sand'|'clue'|'treasure';clue?:CompassClue}
type IslandLot={lot:number;arrow:IslandArrow;winner:string|null;price:number;tied:boolean}
type IslandRanking={seat:string;rank:number;clues:number;distance:number|null;bonus:number}
type IslandResults={reason:'treasure'|'expeditions';treasure:number;round:number;standings:IslandRanking[]}
type IslandSeat={id:string;chips:number;arrows:IslandArrow[];digs:IslandDig[]}
type IslandPhase={kind:'auction';lot:number;bids:Record<string,number>}|{kind:'explore';round:number;routes:Record<string,number[]|null>}|{kind:'finished';result:IslandResults}
export type IslandState={players:IslandSeat[];market:IslandArrow[];chests:number[];treasure:number;phase:IslandPhase;step:number;deadline:number|null;window:number;lastLot:IslandLot|null}
export type IslandView={
 phase:'auction'|'explore'|'finished';step:number;deadline:number|null;seatCount:number;lot:number;lotCount:number;round:number;
 arrow:IslandArrow|null;priority:string|null;lastLot:IslandLot|null;table:{id:string;sealed:boolean}[];
 mine:{chips:number;arrows:IslandArrow[];digs:IslandDig[];bid:number|null;route:number[]|null}|null;result:IslandResults|null
}

const vectors=[[0,-1],[1,0],[0,1],[-1,0]] as const
const taxi=(a:number,b:number)=>Math.abs(a%9-b%9)+Math.abs(Math.floor(a/9)-Math.floor(b/9))
const rowParity=(a:number)=>Math.floor(a/9)%2===0?'odd':'even'
const candidateCells=islandTerrain.flatMap((tile,i)=>tile==='land'&&i!==islandStart&&taxi(i,islandStart)<=4?[i]:[])
const nearby=[31,39,41,49]
const owns=(record:object,id:string)=>Object.hasOwn(record,id)
const empty=<T>():Record<string,T>=>Object.create(null)
const mod=(a:number,n:number)=>((a%n)+n)%n
function rng(seed:number){
 let next=seed>>>0
 return (bound:number)=>{
  next=(next+0x9e3779b9)>>>0
  let bits=Math.imul(next^(next>>>16),0x21f0aaad)
  bits=Math.imul(bits^(bits>>>15),0x735a2d97)
  return ((bits^(bits>>>15))>>>0)%bound
 }
}
function take<T>(values:readonly T[],count:number,draw:(bound:number)=>number){
 const stock=[...values]
 return Array.from({length:count},()=>stock.splice(draw(stock.length),1)[0])
}
export function islandOpen(ids:readonly string[],seed:number,now:number,window:number,secretDraw?:(bound:number)=>number):IslandState{
 if(!ids.length||ids.length>islandMaxSeats||new Set(ids).size!==ids.length)throw new Error('Invalid island crew')
 const draw=rng(seed),secrets=secretDraw??draw
 // Every crew can investigate four real caches with the starter arrow alone.
 const chests=[...nearby,...take(candidateCells.filter(cell=>!nearby.includes(cell)),6,secrets)]
 // The four shore caches teach clues and cannot end the game on a blind one-step turn.
 const treasure=chests[nearby.length+secrets(chests.length-nearby.length)]
 const shapes:ArrowShape[]=['long','bend','reach','hook']
 const market=Array.from({length:ids.length*2},(_,i)=>({id:i+1,shape:shapes[(draw(shapes.length)+i)%shapes.length]}))
 if(ids.length===1){market[0].shape='long';market[1].shape='reach'}
 return {
  players:ids.map(id=>({id,chips:islandChips,arrows:[{id:0,shape:'step'}],digs:[]})),market,chests,treasure,
  phase:{kind:'auction',lot:1,bids:empty()},step:0,deadline:now+window,window,lastLot:null,
 }
}

export function islandRoute(arrows:readonly IslandArrow[],route:readonly IslandPiece[]):number[]|null{
 if(route.length>islandRouteLimit)return null
 const cells=[islandStart],used=new Set<number>()
 let row=Math.floor(islandStart/islandSize),col=islandStart%islandSize
 for(const {arrow,turn} of route){
  const tile=arrows.find(a=>a.id===arrow)
  if(!tile||used.has(arrow)||!Number.isInteger(turn)||turn<0||turn>=4)return null
  used.add(arrow)
  for(const dir of islandArrows[tile.shape].directions){
   const [dx,dy]=vectors[(dir+turn)%4]
   col+=dx;row+=dy
   if(col<0||row<0||col>=islandSize||row>=islandSize)return null
   const cell=row*islandSize+col
   if(islandTerrain[cell]!=='land'||cells.includes(cell))return null
   cells.push(cell)
  }
 }
 return cells
}

export function islandAccept(s:IslandState,seat:string,action:IslandAction,now:number):IslandState|null{
 const p=s.players.find(p=>p.id===seat)
 if(!p||s.deadline===null||now>=s.deadline)return null
 const phase=s.phase
 if(phase.kind==='auction'&&action.kind==='bid'&&!owns(phase.bids,seat)){
  if(!Number.isInteger(action.amount)||action.amount<0||action.amount>p.chips)return null
  const next={...s,phase:{...phase,bids:{...phase.bids,[seat]:action.amount}}}
  return Object.keys(next.phase.bids).length===s.players.length?resolveIsland(next,now):next
 }
 if(phase.kind==='explore'&&action.kind==='sail'&&!owns(phase.routes,seat)){
  const cells=islandRoute(p.arrows,action.route)
  if(!cells)return null
  const next={...s,phase:{...phase,routes:{...phase.routes,[seat]:action.route.length?cells:null}}}
  return Object.keys(next.phase.routes).length===s.players.length?resolveIsland(next,now):next
 }
 return null
}

export function islandTick(s:IslandState,now:number):IslandState{
 return s.deadline!==null&&now>=s.deadline?resolveIsland(s,now):s
}
function resolveIsland(s:IslandState,now:number):IslandState{
 const {phase,players}=s
 const step=s.step+1,deadline=now+s.window
 if(phase.kind==='auction'){
  const {lot,bids}=phase,arrow=s.market[lot-1]
  const order=players.map((_,i)=>players[(i+lot-1)%players.length].id)
  const price=Math.max(0,...Object.values(bids))
  const top=price?order.filter(seat=>bids[seat]===price):[]
  const winner=top[0]??null
  return {...s,step,deadline,players:players.map(p=>p.id===winner?{...p,chips:p.chips-price,arrows:[...p.arrows,arrow]}:p),
   lastLot:{lot,arrow,winner,price,tied:top.length>1},
   phase:lot<s.market.length?{kind:'auction',lot:lot+1,bids:empty()}:{kind:'explore',round:1,routes:empty()}}
 }
 if(phase.kind!=='explore')return s
 const {round,routes}=phase
 const updated=players.map(p=>{
  const endpoint=owns(routes,p.id)?routes[p.id]?.at(-1)??null:null
  let dig:IslandDig={round,endpoint,kind:'pass'}
  if(endpoint!==null){
   if(endpoint===s.treasure)dig={round,endpoint,kind:'treasure'}
   else if(s.chests.includes(endpoint))dig={round,endpoint,kind:'clue',clue:{distance:taxi(endpoint,s.treasure),rowParity:rowParity(s.treasure)}}
   else dig={round,endpoint,kind:'sand'}
  }
  return {...p,digs:[...p.digs,dig]}
 })
 const discovered=updated.some(p=>p.digs.at(-1)?.kind==='treasure')
 if(discovered||round===islandRounds){
  const reason=discovered?'treasure':'expeditions'
  const result={reason,round,treasure:s.treasure,standings:rankIsland(updated,s.treasure)} satisfies IslandResults
  return {...s,players:updated,phase:{kind:'finished',result},deadline:null,step}
 }
 return {...s,players:updated,step,deadline,phase:{kind:'explore',round:round+1,routes:empty()}}
}
function rankIsland(players:IslandSeat[],treasure:number):IslandRanking[]{
 const entries=players.map(p=>{
  const positions=p.digs.flatMap(d=>d.endpoint===null?[]:[d.endpoint])
  return {seat:p.id,rank:0,bonus:p.digs.some(d=>d.kind==='treasure')?10:0,
   clues:new Set(p.digs.filter(d=>d.kind==='clue').map(d=>d.endpoint)).size,
   distance:positions.length?Math.min(...positions.map(pos=>taxi(pos,treasure))):null}
 })
 const compare=(a:IslandRanking,b:IslandRanking)=>b.bonus-a.bonus||
  (a.bonus?0:b.clues-a.clues||(a.distance??99)-(b.distance??99))
 entries.sort(compare)
 let rank=1
 return entries.map((entry,i)=>{
  if(i>0&&compare(entries[i-1],entry)!==0)rank=i+1
  return {...entry,rank}
 })
}

export function islandView(s:IslandState,seat:string):IslandView{
 const p=s.players.find(p=>p.id===seat),{phase}=s
 const locks=phase.kind==='auction'?phase.bids:phase.kind==='explore'?phase.routes:empty()
 const lot=phase.kind==='auction'?phase.lot:s.market.length
 return {phase:phase.kind,step:s.step,deadline:s.deadline,lot,lotCount:s.market.length,seatCount:s.players.length,
  round:phase.kind==='explore'?phase.round:phase.kind==='finished'?phase.result.round:0,
  arrow:phase.kind==='auction'?s.market[lot-1]:null,priority:phase.kind==='auction'?s.players[(lot-1)%s.players.length].id:null,
  lastLot:s.lastLot,table:s.players.map(p=>({id:p.id,sealed:owns(locks,p.id)})),
  mine:p?{chips:p.chips,arrows:p.arrows,digs:p.digs,bid:phase.kind==='auction'&&owns(phase.bids,seat)?phase.bids[seat]:null,
   route:phase.kind==='explore'&&owns(phase.routes,seat)?phase.routes[seat]:null}:null,
  result:phase.kind==='finished'?phase.result:null}
}

/** Legal, bounded candidate routes for browser drafting and bots. */
export function islandRoutes(arrows:readonly IslandArrow[],maxPieces=4):Map<number,IslandPiece[]>{
 const paths=new Map<number,IslandPiece[]>()
 const available: IslandArrow[]=[]
 for(const arrow of arrows){
  if(available.filter(a=>a.shape===arrow.shape).length<maxPieces)available.push(arrow)
 }
 let budget=3200
 function visit(prefix:IslandPiece[]){
  if(--budget<0)return
  const cells=islandRoute(arrows,prefix)
  if(!cells)return
  const endpoint=cells.at(-1)!
  if(prefix.length&&(!paths.has(endpoint)||paths.get(endpoint)!.length>prefix.length))paths.set(endpoint,prefix)
  if(prefix.length>=maxPieces)return
  const seen=new Set<ArrowShape>()
  for(const {id,shape} of available){
   if(budget<=0)return
   if(prefix.some(p=>p.arrow===id)||seen.has(shape))continue
   seen.add(shape)
   for(const turn of [0,1,2,3] as const)visit([...prefix,{arrow:id,turn}])
  }
 }
 visit([])
 return paths
}

export function islandBot(v:IslandView,seat:string,seed:number,level: 'easy'|'normal'|'hard'='normal'):IslandAction|null{
 const mine=v.mine
 if(!mine||v.table.find(p=>p.id===seat)?.sealed||v.phase==='finished')return null
 const draw=rng(seed^Math.imul(v.step+1,0x632be59b))
 if(v.phase==='auction'){
  const spread=(arrows:readonly IslandArrow[])=>[...islandRoutes(arrows,3).keys()].filter(c=>candidateCells.includes(c)).length
  const gain=spread([...mine.arrows,v.arrow!])-spread(mine.arrows)
  const amount=gain>0?Math.min(mine.chips,level==='easy'?1:2+Math.min(3,Math.floor(gain/4))+draw(2)+(level==='hard'?1:0)):0
  return {kind:'bid',amount}
 }
 const visited=new Set(mine.digs.map(d=>d.endpoint))
 const clues=mine.digs.flatMap(d=>d.endpoint!==null&&d.clue?[{...d.clue,from:d.endpoint}]:[])
 const candidates=candidateCells.filter(c=>!nearby.includes(c)&&!visited.has(c)&&clues.every(h=>taxi(c,h.from)===h.distance&&rowParity(c)===h.rowParity))
 const needsClue=clues.length===0||candidates.length>2
 const routes=islandRoutes(mine.arrows,level==='hard'?4:3)
 const ranked=[...routes].filter(([c])=>!visited.has(c)).map(([cell,route])=>({
  route,grade:(nearby.includes(cell)&&needsClue?400:level!=='easy'&&candidates.includes(cell)?300:nearby.includes(cell)?200:0)-route.length*10+draw(10)
 })).sort((a,b)=>b.grade-a.grade)
 return {kind:'sail',route:ranked[0]?.route??[]}
}
