import {isGrass} from './grass'
import {isPuzzle} from './puzzles'
import {z} from 'zod'
import {start,move,schedule,view,timeout,blindCoverAction,botAction,botLevels,isDuel,minSeats,secretBotIntentKey,simultaneous,type State,type Game,type GameView} from './engine'
const codeAlphabet='ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
export const roomCode=()=>Array.from(crypto.getRandomValues(new Uint8Array(6)),x=>codeAlphabet[x&31]).join('')
export const validCode=(x:string)=>/^[A-HJ-NP-Z2-9]{6}$/.test(x)
export const id=()=>Array.from(crypto.getRandomValues(new Uint8Array(16)),x=>x.toString(16).padStart(2,'0')).join('')
export const protocolVersion=1
const unsafe=/[\p{Cc}\p{Cs}\p{Zl}\p{Zp}\u061c\u200b\u200e\u200f\u202a-\u202e\u2060-\u206f\ufeff]/u
export function nickname(value:string):string|null{
 if(unsafe.test(value)||value.length>160)return null
 const s=value.normalize('NFKC').trim()
 const n=[...new Intl.Segmenter('en',{granularity:'grapheme'}).segment(s)].length
 return n>=1&&n<=24?s:null
}
const settings=z.strictObject({game:z.enum(['blind','morris','auction','point','remove','knight','hex','rectangles','mancala','cubes','bagh','secret','grass1','grass3','exile','divine','equations','codeLock','pyramid','fragments','spot','scale','fence','tower','piece','memoryPoker']),seconds:z.number().int().min(10).max(900),size:z.union([z.literal(5),z.literal(6),z.literal(8)]).optional(),closed:z.boolean().optional(),divineSide:z.union([z.literal(3),z.literal(5),z.literal(7)]).optional(),divineHard:z.boolean().optional(),fragmentStrict:z.boolean().optional(),fragmentCount:z.union([z.literal(8),z.literal(12),z.literal(16),z.literal(24)]).optional(),capacity:z.number().int().min(2).max(16),locked:z.boolean(),botLevel:z.enum(botLevels).optional(),memoryPokerPeek:z.boolean().optional()})
const schema=z.discriminatedUnion('kind',[
 z.strictObject({kind:z.literal('ready')}),
 z.strictObject({kind:z.literal('config'),settings}),
 z.strictObject({kind:z.literal('start')}),
 z.strictObject({kind:z.literal('next')}),
 z.strictObject({kind:z.literal('lobby')}),
 z.strictObject({kind:z.literal('bot')}),
 z.strictObject({kind:z.literal('kick'),seat:z.string().max(32)}),
 z.strictObject({kind:z.literal('chat'),text:z.string().min(1).max(240)}),
 z.strictObject({kind:z.literal('move'),round:z.number().int().min(1).max(24).optional(),action:z.union([z.number().int().min(-1).max(300000000),z.string().length(8).regex(/^[0-9+*/=\-]+$/),z.strictObject({from:z.number().int().min(0).max(24),to:z.number().int().min(0).max(24)})])})
])
export type Command=z.infer<typeof schema>
export type Settings=z.infer<typeof settings>
export const humanOnly=(g:Game)=>g==='knight'||g==='divine'||g==='codeLock'||g==='pyramid'||g==='fragments'||g==='spot'||g==='scale'||g==='fence'||g==='tower'||g==='piece'||g==='memoryPoker'||isPuzzle(g)
export const defaults:Settings={game:'blind',seconds:25,capacity:16,locked:false,botLevel:'normal'}
const wire=z.discriminatedUnion('type',[
 z.strictObject({version:z.literal(1),type:z.literal('hello'),name:z.string().max(160),token:z.string().regex(/^[a-f0-9]{32}$/).optional()}),
 z.strictObject({version:z.literal(1),type:z.literal('command'),epoch:z.string().length(32),match:z.string().max(32),seq:z.number().int().positive().max(1e8),request:z.string().length(32),rev:z.number().int().nonnegative(),command:schema}),
 z.strictObject({version:z.literal(1),type:z.literal('ping')}),
])
export function decode(raw:unknown){
 if(typeof raw!=='string'||raw.length>4096)return null
 try{const parsed=wire.safeParse(JSON.parse(raw));return parsed.success?parsed.data:null}catch{return null}
}
export type Seat={id:string,name:string,ready:boolean,bot:boolean,online:boolean}
type PrivateSeat=Seat&{token:string,connection:string}
type Fixture={sides:string[],winner:string|null}
type Chat={seat:string,name:string,text:string}
export type Snapshot={you:string,host:string,epoch:string,match:string,rev:number,settings:Settings,seats:Seat[],game:GameView|null,fixture:number,count:number,fixtures:Fixture[],seriesDone:boolean,chat:Chat[],hostNow:number}
export class Host{
 readonly epoch=id()
 readonly owner=id()
 readonly clock:()=>number
 rev=0
 match=''
 settings:Settings={...defaults}
 game:State|null=null
 fixture=0
 fixtures:Fixture[]=[]
 chat:Chat[]=[]
 private botDue=0
 private botSeed=0
 private secretBotRejected=new Map<string,Set<number>>()
 private seats:PrivateSeat[]
 private requests=new Map<string,Map<string,string|null>>()
 private lastChat=new Map<string,number>()
 constructor(name:string,clock=()=>Date.now(),private readonly solo=false){
  this.clock=clock
  this.seats=[{id:this.owner,name,ready:true,bot:false,online:true,token:'',connection:'host'}]
 }
 join(connection:string,raw:string,token?:string){
  const name=nickname(raw)
  if(!name||this.seats.some(s=>s.connection===connection))return null
  if(token){
   const s=this.seats.find(s=>s.token===token&&s.name===name&&!s.bot)
   if(!s)return null
   const old=s.connection
   s.connection=connection;s.online=true;s.token=id();this.rev++
   return {id:s.id,token:s.token,old}
  }
  if(this.game||this.settings.locked||this.seats.length>=this.settings.capacity)return null
  const seat={id:id(),name,ready:false,bot:false,online:true,token:id(),connection}
  this.seats.push(seat);this.rev++
  return {id:seat.id,token:seat.token,old:''}
 }
 disconnect(connection:string){
  const s=this.seats.find(s=>s.connection===connection)
  if(s&&s.online&&s.id!==this.owner){s.online=false;this.rev++}
 }
 snapshot(connection:string):Snapshot|null{
  const u=this.seats.find(s=>s.connection===connection&&s.online)
  if(!u)return null
  return {you:u.id,host:this.owner,epoch:this.epoch,match:this.match,rev:this.rev,settings:this.settings,seats:this.seats.map(({id,name,ready,bot,online})=>({id,name,ready,bot,online})),game:this.game?view(this.game,u.id):null,fixture:this.fixture,count:isDuel(this.settings.game)?this.fixtures.length:1,fixtures:this.fixtures.map(f=>({...f})),seriesDone:!!this.game?.done&&(!isDuel(this.settings.game)||this.fixture+1===this.fixtures.length),chat:this.chat,hostNow:this.clock()}
 }
 command(connection:string,request:string,rev:number,c:Command):string|null{
  const seat=this.seats.find(s=>s.connection===connection&&s.online)
  if(!seat)return 'No active seat.'
  let prior=this.requests.get(seat.id)
  if(!prior){prior=new Map();this.requests.set(seat.id,prior)}
  if(prior.has(request))return prior.get(request)!
  const result=this.apply(seat,rev,c)
  prior.set(request,result)
  if(prior.size>128)prior.delete(prior.keys().next().value!)
  if(result===null)this.rev++
  return result
 }
 private apply(s:PrivateSeat,rev:number,c:Command):string|null{
  const concurrentBid=c.kind==='move'&&this.game&&simultaneous(this.game.game)&&c.round===this.game.round
  if(c.kind==='move'&&this.game&&simultaneous(this.game.game)&&c.round!==undefined&&c.round!==this.game.round)return 'That round has ended.'
  if(rev>this.rev||(rev!==this.rev&&!concurrentBid))return 'The room updated. Try again.'
  if(c.kind==='chat'){
   if(this.game?.fragments?.strict&&!this.game.done)return 'Discussion is off during the strict challenge.'
   const msg=c.text.trim()
   if(!msg||unsafe.test(msg))return 'Enter a plain-text message.'
   const now=this.clock()
   if(now-(this.lastChat.get(s.id)??-Infinity)<750)return 'Please slow down.'
   this.lastChat.set(s.id,now);this.chat=[...this.chat.slice(-39),{seat:s.id,name:s.name,text:msg}];return null
  }
  if(c.kind==='move'){
   if(!this.game)return 'No active match.'
   const g=move(this.game,s.id,c.action,this.clock())
   if(!g)return 'That move is not available.'
   this.setGame(g);return null
  }
  if(c.kind==='ready'){
   if(this.game||s.id===this.owner)return 'Readiness is locked.'
   s.ready=!s.ready;return null
  }
  if(s.id!==this.owner)return 'Only the host can do that.'
  if(c.kind==='lobby'){
   this.game=null;this.fixtures=[];this.fixture=0;this.match='';for(const seat of this.seats)if(!seat.bot&&seat.id!==this.owner)seat.ready=false
   return null
  }
  if(c.kind==='next'){
   if(!this.game?.done)return 'Finish the current game first.'
   if(isDuel(this.settings.game)&&this.fixture+1<this.fixtures.length)this.fixture++
   else{
    if(this.seats.some(s=>!s.online))return 'A seat is offline. Return to the lobby to adjust the roster.'
    this.prepare(true)
   }
   this.begin();return null
  }
  if(this.game)return 'Settings are locked during a match.'
  if(c.kind==='config'){
   const changes=c.settings
   const reseat=this.solo&&changes.game!==this.settings.game
   const roster=reseat?this.seats.filter(s=>!s.bot):this.seats
   const nativeMax=changes.game==='mancala'?8:changes.game==='grass1'?12:16
   const capacity=reseat?nativeMax:Math.min(changes.capacity,nativeMax)
   if(changes.game==='mancala'&&roster.length>nativeMax)return 'Balance Mancala seats up to eight players. Remove extra seats first.'
   if(changes.game==='grass1'&&roster.length>nativeMax)return 'Laying Grass seats up to twelve players.'
   if(capacity<roster.length)return 'Capacity cannot be below the current roster.'
   const seconds=changes.game==='fence'||changes.game==='tower'||changes.game==='piece'?240:changes.game==='scale'?300:changes.game==='spot'?90:changes.game==='fragments'?20:changes.game==='pyramid'?45:changes.game==='codeLock'?180:changes.game==='divine'?(this.settings.game!=='divine'?600:Math.max(60,changes.seconds)):changes.game==='knight'?Math.max(180,Math.min(480,changes.seconds)):changes.game==='hex'?20:changes.game==='rectangles'?45:changes.game==='cubes'?25:changes.game==='exile'?90:changes.game==='secret'&&this.settings.game!=='secret'?90:Math.min(90,changes.seconds)
   this.settings={...changes,botLevel:changes.botLevel??'normal',capacity,seconds,closed:changes.size===5||!changes.size?false:changes.closed}
   if(this.solo){
    this.seats=roster
    for(let i=this.seats.length;i<minSeats(changes.game);i++)this.addBot()
   }
   return null
  }
  if(c.kind==='bot'){
   if(this.seats.length>=this.settings.capacity)return 'The room is full.'
   if(humanOnly(this.settings.game))return 'This puzzle uses human seats only.'
   this.addBot()
   return null
  }
  if(c.kind==='kick'){
   if(c.seat===this.owner||!this.seats.some(s=>s.id===c.seat))return 'That seat cannot be removed.'
   this.seats=this.seats.filter(s=>s.id!==c.seat);this.requests.delete(c.seat);this.lastChat.delete(c.seat);return null
  }
  if(this.seats.length<minSeats(this.settings.game)||this.seats.some(s=>!s.ready||!s.online))return 'More connected, ready seats are needed.'
  if(humanOnly(this.settings.game)&&this.seats.some(s=>s.bot))return 'Remove the bots before starting this puzzle.'
  this.prepare(false);this.begin();return null
 }
 private addBot(){
  this.seats.push({id:id(),name:'Bot '+(this.seats.filter(x=>x.bot).length+1),ready:true,online:true,bot:true,token:'',connection:''})
 }
 private prepare(reverse:boolean){
  this.fixture=0
  const list=this.seats.map(s=>s.id)
  this.fixtures=!isDuel(this.settings.game)?[]:(list.length===2&&this.settings.game!=='bagh'?[reverse?[list[1],list[0]]:list]:schedule(list)).map(sides=>({sides,winner:null}))
 }
 private begin(){
  this.match=id()
  this.secretBotRejected.clear()
  const [gameSeed,botSeed]=crypto.getRandomValues(new Uint32Array(2))
  this.botSeed=botSeed
  const {game,seconds,size,closed,divineSide,divineHard,fragmentStrict,fragmentCount,memoryPokerPeek}=this.settings
  const seats=isDuel(game)?this.fixtures[this.fixture].sides:this.seats.map(s=>s.id)
  this.setGame(start(game,seats,seconds*1000,this.clock(),{seed:gameSeed,size,closed,divineSide,divineHard,fragmentStrict,fragmentCount,memoryPokerPeek,solo:this.solo}))
 }
 private setGame(g:State){
  if(g.round!==this.game?.round)this.secretBotRejected.clear()
  if(!this.game||isGrass(g.game)||isDuel(g.game)||g.round!==this.game.round)this.botDue=this.clock()+650
  this.game=g
  if(g.done&&this.fixtures[this.fixture])this.fixtures[this.fixture].winner=g.winner
 }
 tick(){
  if(!this.game||this.game.done)return false
  const now=this.clock()
  if(this.game.game!=='piece'&&!this.game.seats.every(id=>this.seats.find(s=>s.id===id)?.online)&&!simultaneous(this.game.game))return false
  const past=this.game
  let g=timeout(past,now)
  if(g===past&&g.piece&&!this.seats.find(s=>s.id===past.seats[past.turn])?.online){
   // Preserve roster order, but don't let the active seat's disconnect stall a timed team puzzle.
   for(let offset=1;offset<past.seats.length;offset++){
    const turn=(past.turn+offset)%past.seats.length
    if(this.seats.some(s=>s.id===past.seats[turn]&&s.online)){g={...past,turn,round:past.round+1};break}
   }
  }
  if(g===past&&now>=this.botDue){
   for(const s of this.seats.filter(s=>s.bot&&g.seats.includes(s.id))){
    const v=view(g,s.id), rejected=this.secretBotRejected.get(s.id), contact=v.secret?.phase==='contact'?v.secret:null
    const index=contact?v.seats.indexOf(s.id):-1
    if(contact&&rejected)for(const key of rejected)if(key<0&&secretBotIntentKey(contact,index,-key)!==key)rejected.delete(key)
    let a=botAction(v,s.id,g.publicMoves,this.botSeed,this.settings.botLevel,rejected)
    if(a===undefined)continue
    if(this.solo&&g.game==='blind'&&g.seats[1-g.turn]===this.owner&&typeof a==='number'){
     const previous=g.publicMoves.at(-1)
     const cover=previous===undefined?null:v.blindCovers?.[previous]
     if(cover!=null)a=blindCoverAction(a,cover)
    }
    const result=move(g,s.id,a,now)
    if(result){g=result;if(g.done||g.round!==past.round||!simultaneous(g.game))break}
    else if(contact&&typeof a==='number'){
     // A genuine action can fail on a hidden ticket. Don't preview validity
     // or expose the result to other seats; choose again on the next host tick.
     const memory=rejected??new Set<number>()
     memory.add(secretBotIntentKey(contact,index,a))
     if(!rejected)this.secretBotRejected.set(s.id,memory)
    }
   }
  }
  if(g===past)return false
  this.setGame(g);this.rev++;return true
 }
}
export function explain(game:Game,count:number) {
 return game==='memoryPoker'?'All seats memorize the same layout, then privately lock a five-card hand. Cards are revealed together. No betting.':game==='piece'?'Rotate and fit irregular tiles onto one shared silhouette. Each move passes control; the team has four minutes.':game==='tower'?'A shared letter tray and one team tower. Up to two tile edits per turn, then pass control.':game==='fence'?'Draw your own loop on a private grid. The same clues are shared by everyone.':game==='scale'?'Take turns operating one shared balance. Discuss the evidence and lock one team answer.':game==='spot'?'Compare two shared trays. Each seat has private marks and a private time penalty.':game==='fragments'?'Study one shared exhibit. Players take turns recalling details; in strict mode chat is disabled.':game==='pyramid'?'Every seat gets the same eight puzzles and submits privately. Solo practice needs no bots.':game==='codeLock'?'Everyone gets the same clues and a private answer tray. Offline practice has unlimited retries before the clock runs out.':game==='equations'?'Hide an equation and take turns at each table. Both players receive equal guesses; no turn timer. Larger rooms rotate through a two-leg league.':game==='divine'?'Everyone solves the same magic square on a private grid. Solo practice needs no bots.':isGrass(game)?(game==='grass1'?'2–12 players draft from a shared tile tray.':'2–16 players share a tile draft with optional trades.') :game==='secret'?'3–16 seats exchange private clues. Solo practice fills with two bots.':game==='bagh'?'A two-leg duel swaps goat and tiger roles. Larger rooms run a rotating league.':game==='mancala'?'2–8 players share one circular board. Up to eight seats, including bots.':isPuzzle(game)?'Everyone solves the same challenge and submits privately. Solo practice needs no bots.':game==='knight'?'Everyone solves the same board on a private grid.':game==='remove'?'Every seat gets a private hand; at least three seats.':game==='auction'?'Every seat bids in the same match.':count<=2?'Two players at one board.':'Two legs per pairing, with a different starting player in each leg. Other seats watch the current table. No points for a bye.'
}
