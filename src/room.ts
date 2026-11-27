import {heavy13Rounds} from './heavy-13'
import {timeHoldAction,timeHoldAdvance,timeHoldDisconnect,timeHoldRules,timeHoldView,type TimeHold} from './time-hold'
import {montagePortraitCount,montageRules} from './montage'
import {memoryDuelDeal} from './memory-duel'
import {isGrass} from './grass'
import {isPuzzle} from './puzzles'
import {z} from 'zod'
import {start,move,titles,heavy13Slot,playHeavy13,schedule,view,timeout,blindCoverAction,botAction,botLevels,isDuel,minSeats,secretBotIntentKey,simultaneous,redealMemoryDuel,syncTimeHold,openMontageRound,submitMontageBuzz,type State,type Game,type GameView} from './engine'
const codeAlphabet='ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
export const roomCode=()=>Array.from(crypto.getRandomValues(new Uint8Array(6)),x=>codeAlphabet[x&31]).join('')
export const validCode=(x:string)=>/^[A-HJ-NP-Z2-9]{6}$/.test(x)
export const id=()=>Array.from(crypto.getRandomValues(new Uint8Array(16)),x=>x.toString(16).padStart(2,'0')).join('')
export const protocolVersion=1
export const appearanceCount=27
export const appearancePreset=(value:unknown):number|undefined=>
 typeof value==='number'&&Number.isInteger(value)&&value>=0&&value<appearanceCount?value:undefined
const unsafe=/[\p{Cc}\p{Cs}\p{Zl}\p{Zp}\u061c\u200b\u200e\u200f\u202a-\u202e\u2060-\u206f\ufeff]/u
export function nickname(value:string):string|null{
 if(unsafe.test(value)||value.length>160)return null
 const s=value.normalize('NFKC').trim()
 const n=[...new Intl.Segmenter('en',{granularity:'grapheme'}).segment(s)].length
 return n>=1&&n<=24?s:null
}
const settings=z.strictObject({game:z.enum(['blind','morris','auction','point','remove','knight','hex','rectangles','mancala','cubes','bagh','secret','grass1','grass3','exile','divine','equations','codeLock','pyramid','fragments','spot','scale','fence','tower','piece','memoryPoker','wallGo','montage','heavy13']),seconds:z.number().int().min(10).max(900),size:z.union([z.literal(5),z.literal(6),z.literal(8)]).optional(),closed:z.boolean().optional(),divineSide:z.union([z.literal(3),z.literal(5),z.literal(7)]).optional(),divineHard:z.boolean().optional(),fragmentStrict:z.boolean().optional(),fragmentCount:z.union([z.literal(8),z.literal(12),z.literal(16),z.literal(24)]).optional(),capacity:z.number().int().min(1).max(16),locked:z.boolean(),botLevel:z.enum(botLevels).optional(),memoryPokerPeek:z.boolean().optional(),memoryPokerMode:z.enum(['fan','episode']).optional(),auctionMode:z.enum(['sealed','hold']).optional()})
const montageMatch=z.string().regex(/^[a-f0-9]{32}$/)
const montageRound=z.number().int().min(1).max(montageRules.rounds)
const heavyMatch=z.string().regex(/^[a-f0-9]{32}$/)
const heavyRound=z.number().int().min(1).max(heavy13Rounds)
const schema=z.discriminatedUnion('kind',[
 z.strictObject({kind:z.literal('ready')}),
 z.strictObject({kind:z.literal('config'),settings}),
 z.strictObject({kind:z.literal('start')}),
 z.strictObject({kind:z.literal('next')}),
 z.strictObject({kind:z.literal('lobby')}),
 z.strictObject({kind:z.literal('bot')}),
 z.strictObject({kind:z.literal('kick'),seat:z.string().max(32)}),
 z.strictObject({kind:z.literal('chat'),text:z.string().min(1).max(240)}),
 z.strictObject({kind:z.literal('montage-open'),match:montageMatch,round:montageRound}),
 z.strictObject({kind:z.literal('montage-buzz'),match:montageMatch,round:montageRound,frame:z.number().int().min(1).max(montagePortraitCount)}),
 z.strictObject({kind:z.literal('heavy-lock'),match:heavyMatch,round:heavyRound,action:z.number().int().min(0).max(27)}),
 z.strictObject({kind:z.literal('heavy-act'),match:heavyMatch,round:heavyRound,slot:z.number().int().min(0).max(13),action:z.number().int().min(28).max(31)}),
 z.strictObject({kind:z.literal('memory-lock'),deal:z.number().int().min(1).max(1e8),action:z.number().int().min(0).max(255)}),
 z.strictObject({kind:z.literal('time-hold'),round:z.number().int().min(1).max(timeHoldRules.rounds),action:z.enum(['hold','pulse','release','cancel'])}),
 z.strictObject({kind:z.literal('move'),round:z.number().int().min(1).max(24).optional(),action:z.union([z.number().int().min(-1).max(300000000),z.string().length(8).regex(/^[0-9+*/=\-]+$/),z.strictObject({from:z.number().int().min(0).max(24),to:z.number().int().min(0).max(24)})])})
])
/** Sample uniformly without modulo bias. */
const secureIndex=(upper:number)=>{
 const buffer=new Uint32Array(1),limit=2**32-(2**32%upper)
 do crypto.getRandomValues(buffer);while(buffer[0]>=limit)
 return buffer[0]%upper
}
const liveMemoryDeal=()=>memoryDuelDeal(secureIndex)
export const episodePokerRules='Study sixteen cards for twenty seconds. After the board turns over, three shared cards appear. Privately lock two positions within sixty seconds to complete your five-card hand. Exact ties deal a fresh board. No betting.'
export const episodePokerRoster=(seats:readonly {bot:boolean;online:boolean}[])=>seats.length===2&&seats.every(s=>s.online&&!s.bot)
const isEpisodePoker=(config:Pick<Settings,'game'|'memoryPokerMode'>)=>config.game==='memoryPoker'&&config.memoryPokerMode==='episode'
export const holdAuctionRules='Start with ten minutes for nineteen rounds. Press and hold during the countdown to enter; release before five seconds to pass for free. At five seconds or more, your full held time is spent. The highest hold wins a token only if untied. Final standings use tokens, then time left. An interrupted hold cannot win.'
export const isHoldAuction=(config:Pick<Settings,'game'|'auctionMode'>)=>config.game==='auction'&&config.auctionMode==='hold'
export type Command=z.infer<typeof schema>
export type Settings=z.infer<typeof settings>
export const humanOnly=(g:Game)=>g==='knight'||g==='divine'||g==='codeLock'||g==='pyramid'||g==='fragments'||g==='spot'||g==='scale'||g==='fence'||g==='tower'||g==='piece'||g==='memoryPoker'||g==='montage'||isPuzzle(g)
// Room limits for the available fan tables, not contestant counts from the show.
const partyMaximum={
 blind:4,morris:4,point:4,equations:4,wallGo:4,bagh:2,
 auction:16,remove:16,knight:16,hex:16,rectangles:16,cubes:16,exile:16,
 grass1:12,grass3:16,mancala:8,secret:16,divine:16,codeLock:16,pyramid:16,
 fragments:8,spot:16,scale:6,fence:16,tower:8,piece:4,memoryPoker:16,montage:16,heavy13:7,
} as const satisfies Record<Game,number>
type SeatMode=Pick<Settings,'game'|'memoryPokerMode'|'auctionMode'>
/** Occupied seats for this room (participants plus any supported bots); fixtures still use two participants. */
export function seatRules(settings:SeatMode,solo=false):{min:number,max:number,fixtureSize?:2}{
 const {game}=settings,episode=isEpisodePoker(settings),duel=isDuel(game)
 if(episode)return {min:2,max:2,fixtureSize:2}
 const min=solo?minSeats(game,true):Math.max(2,minSeats(game))
 const max=solo?(humanOnly(game)?1:duel?2:partyMaximum[game]):partyMaximum[game]
 return duel?{min,max,fixtureSize:2}:{min,max}
}
export const defaults:Settings={game:'blind',seconds:25,capacity:2,locked:false,botLevel:'normal'}
export function seatCapacity(settings:SeatMode&Pick<Settings,'capacity'>,solo=false){
 const {min,max}=seatRules(settings,solo)
 return Math.max(min,Math.min(max,settings.capacity))
}
const seatCountWords:Readonly<Partial<Record<number,string>>>={4:'four',6:'six',7:'seven',8:'eight',12:'twelve'}
const tooManySeats=(game:Game,min:number,max:number)=>titles[game]+(min===max?' seats '+max+' players.':' seats up to '+(seatCountWords[max]??max)+' players.')+' Remove extra seats first.'
export function seatStartError(settings:Settings,seats:readonly Pick<Seat,'bot'|'online'|'ready'>[],solo=false){
 const {min,max}=seatRules(settings,solo)
 if(isEpisodePoker(settings)&&(solo||!episodePokerRoster(seats)))return 'Episode-style duel needs exactly two connected human players.'
 if(seats.length>max)return tooManySeats(settings.game,min,max)
 if(seats.length>seatCapacity(settings,solo))return 'The table is above its seat limit. Remove extra seats first.'
 if(seats.length<min||seats.some(s=>!s.ready||!s.online))return 'More connected, ready seats are needed.'
 if(isHoldAuction(settings)&&(solo||seats.some(s=>s.bot)))return 'Hold & release needs connected human players only.'
 if(humanOnly(settings.game)&&seats.some(s=>s.bot))return 'Remove the bots before starting this puzzle.'
 return null
}
const wire=z.discriminatedUnion('type',[
 z.strictObject({version:z.literal(1),type:z.literal('hello'),name:z.string().max(160),token:z.string().regex(/^[a-f0-9]{32}$/).optional(),appearance:z.unknown().optional().transform(appearancePreset)}),
 z.strictObject({version:z.literal(1),type:z.literal('command'),epoch:z.string().length(32),match:z.string().max(32),seq:z.number().int().positive().max(1e8),request:z.string().length(32),rev:z.number().int().nonnegative(),command:schema}),
 z.strictObject({version:z.literal(1),type:z.literal('ping')}),
])
export function decode(raw:unknown){
 if(typeof raw!=='string'||raw.length>4096)return null
 try{const parsed=wire.safeParse(JSON.parse(raw));return parsed.success?parsed.data:null}catch{return null}
}
export type Seat={id:string,name:string,ready:boolean,bot:boolean,online:boolean,appearance?:number}
type PrivateSeat=Seat&{token:string,connection:string,appearance:number}
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
 private seats:PrivateSeat[]=[]
 private issuedAppearances=new Set<number>()
 // Private reducer changes may occur between pulses of the shared clock. Only tick
 // promotes phase/result to the public projection; transient state never advances rev.
 private publishedHold:State|null=null
 private holdUpdates=new Set<string>()
 private requests=new Map<string,Map<string,string|null>>()
 private lastChat=new Map<string,number>()
 constructor(name:string,clock=()=>Date.now(),private readonly solo=false,appearance?:number){
  this.clock=clock
  this.settings.capacity=seatCapacity(this.settings,this.solo)
  this.seats=[{id:this.owner,name,ready:true,bot:false,online:true,token:'',connection:'host',appearance:this.assignAppearance(appearance)}]
 }
 join(connection:string,raw:string,token?:string,appearance?:number){
  const name=nickname(raw)
  if(!name||this.seats.some(s=>s.connection===connection))return null
  if(token){
   const s=this.seats.find(s=>s.token===token&&s.name===name&&!s.bot)
   if(!s)return null
   const old=s.connection
   this.forfeitHold(s)
   s.connection=connection;s.online=true;s.token=id();this.rev++
   return {id:s.id,token:s.token,old}
  }
  if(this.solo||this.game||this.settings.locked||this.seats.length>=seatCapacity(this.settings,this.solo))return null
  const seat={id:id(),name,ready:false,bot:false,online:true,token:id(),connection,appearance:this.assignAppearance(appearance)}
  this.seats.push(seat);this.rev++
  return {id:seat.id,token:seat.token,old:''}
 }
 disconnect(connection:string){
  const s=this.seats.find(s=>s.connection===connection)
  if(s&&s.online&&s.id!==this.owner){this.forfeitHold(s);s.online=false;this.rev++}
 }
 snapshot(connection:string):Snapshot|null{
  const u=this.seats.find(s=>s.connection===connection&&s.online)
  if(!u)return null
  const hostNow=this.clock(), game=this.publishedHold??(this.game?.memoryDuel?timeout(this.game,hostNow):this.game)
  const projected=game?view(game,u.id,hostNow):null
  const own=this.game?.timeHold
  if(projected?.timeHold&&own&&own.round===projected.round){
   const mine=timeHoldView(own,u.id,hostNow).mine
   if(mine&&projected.timeHold.phase!=='live')mine.remainingTenths=null
   projected.timeHold.mine=mine
  }
  return {you:u.id,host:this.owner,epoch:this.epoch,match:this.match,rev:this.rev,settings:this.settings,seats:this.seats.map(({id,name,ready,bot,online,appearance})=>({id,name,ready,bot,online,appearance})),game:projected,fixture:this.fixture,count:isDuel(this.settings.game)?this.fixtures.length:1,fixtures:this.fixtures.map(f=>({...f})),seriesDone:!!game?.done&&(!isDuel(this.settings.game)||this.fixture+1===this.fixtures.length),chat:this.chat,hostNow}
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
  const privateHeavy=c.kind==='heavy-lock'&&this.game?.heavy13?.phase==='select'
  if(result===null&&!privateHeavy&&c.kind!=='time-hold'&&!(c.kind==='memory-lock'&&this.game?.memoryDuel?.phase==='select'))this.rev++
  return result
 }
 private apply(s:PrivateSeat,rev:number,c:Command):string|null{
  if(c.kind==='heavy-lock'||c.kind==='heavy-act'){
   const current=this.game?.heavy13
   if(!current||c.match!==this.match)return 'This action no longer matches the current game.'
   if(rev>this.rev||c.round!==current.round||current.phase!==(c.kind==='heavy-lock'?'select':'resolve'))return 'That round or phase has ended.'
   if(c.kind==='heavy-act'&&c.slot!==heavy13Slot(current))return 'That placement slot has ended.'
   const next=playHeavy13(this.game!,s.id,c.action,this.clock())
   if(!next)return c.kind==='heavy-lock'?'That pair cannot be locked.':'That placement is not available.'
   this.setGame(next);return null
  }
  const sameHoldRound=c.kind==='time-hold'&&c.round===this.publishedHold?.round
  const concurrentBid=c.kind==='move'&&this.game&&simultaneous(this.game.game)&&c.round===this.game.round
  if(c.kind==='move'&&this.game&&simultaneous(this.game.game)&&c.round!==undefined&&c.round!==this.game.round)return 'That round has ended.'
  const sameDuelDeal=c.kind==='memory-lock'&&this.game?.memoryDuel?.dealNumber===c.deal
  const isMontageCommand=c.kind==='montage-buzz'||c.kind==='montage-open'
  if(isMontageCommand&&(!this.game?.montage||c.match!==this.match))return 'This action no longer matches the current game.'
  const concurrentMontage=c.kind==='montage-buzz'
  if(rev>this.rev||(rev!==this.rev&&!concurrentBid&&!sameDuelDeal&&!sameHoldRound&&!concurrentMontage))return 'The room updated. Try again.'
  if(c.kind==='montage-open'&&this.game){
   if(s.id!==this.owner)return 'Only the host can open a Montage round.'
   const g=openMontageRound(this.game,c.round,this.clock())
   if(g===this.game)return 'This round cannot be opened.'
   this.setGame(g);return null
  }
  if(c.kind==='montage-buzz'&&this.game){
   const {game,result}=submitMontageBuzz(this.game,s.id,c,this.clock())
   const accepted=result==='correct'||result==='incorrect'
   if(game!==this.game){
    this.setGame(game)
    if(!accepted)this.rev++ // The clock still advanced on a rejected late buzz.
   }
   if(accepted)return null
   if(result==='stale-frame')return 'That portrait has already changed.'
   if(result==='already-buzzed')return 'You already buzzed on this portrait.'
   return 'The buzzer is closed.'
  }
  if(c.kind==='chat'){
   if(this.game?.fragments?.strict&&!this.game.done)return 'Discussion is off during the strict challenge.'
   const msg=c.text.trim()
   if(!msg||unsafe.test(msg))return 'Enter a plain-text message.'
   const now=this.clock()
   if(now-(this.lastChat.get(s.id)??-Infinity)<750)return 'Please slow down.'
   this.lastChat.set(s.id,now);this.chat=[...this.chat.slice(-39),{seat:s.id,name:s.name,text:msg}];return null
  }
  if(c.kind==='time-hold'){
   const hold=this.game?.timeHold
   if(!hold||!sameHoldRound||hold.round!==c.round)return 'That hold round has ended.'
   const now=this.clock(), current=this.advanceHold(hold,now)
   const next=timeHoldAction(current,s.id,{kind:c.action,round:c.round},now)
   this.setHold(next??current,s.id)
   return next?null:c.action==='hold'?'Could not enter this round. Hold during the countdown with at least five seconds left.':'That hold is no longer active.'
  }
  if(c.kind==='memory-lock'){
   const current=this.game
   if(current?.memoryDuel?.dealNumber!==c.deal)return 'That deal has ended.'
   const now=this.clock(),clocked=timeout(current,now)
   // A snapshot may hide the study faces at the exact deadline, before the
   // periodic ticker runs. Commit that public clock change before locking.
   if(clocked!==current){this.setGame(clocked);this.rev++}
   if(clocked.memoryDuel?.phase!=='select')return 'Wait for the selection phase.'
   const next=move(clocked,s.id,c.action,now,c.deal)
   if(!next)return 'That pair cannot be locked.'
   this.setGame(next);return null
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
   this.game=null;this.publishedHold=null;this.holdUpdates.clear();this.fixtures=[];this.fixture=0;this.match='';for(const seat of this.seats)if(!seat.bot&&seat.id!==this.owner)seat.ready=false
   return null
  }
  if(c.kind==='next'){
   if(!(this.publishedHold??this.game)?.done)return 'Finish the current game first.'
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
   if(isHoldAuction(changes)&&this.solo)return 'Hold & release needs two or more connected human players.'
   if(isHoldAuction(changes)&&this.seats.some(s=>s.bot))return 'Remove the bots before selecting Hold & release.'
   if(isEpisodePoker(changes)&&(this.solo||!episodePokerRoster(this.seats)))return 'Episode-style duel needs exactly two connected human players.'
   const gameChanged=changes.game!==this.settings.game
   const variantChanged=isEpisodePoker(changes)!==isEpisodePoker(this.settings)||isHoldAuction(changes)!==isHoldAuction(this.settings)
   const reseat=this.solo&&gameChanged
   const roster=reseat?this.seats.filter(s=>!s.bot):this.seats
   const {min,max,fixtureSize}=seatRules(changes,this.solo)
   if(roster.length>max)return tooManySeats(changes.game,min,max)
   if(humanOnly(changes.game)&&roster.some(s=>s.bot))return 'Remove the bots before selecting this human-only table.'
   // A carried limit belongs to the previous table; a deliberate new limit is honored.
   const capacity=reseat||(gameChanged||variantChanged)&&changes.capacity===this.settings.capacity?(fixtureSize?Math.max(min,roster.length):max):seatCapacity(changes,this.solo)
   if(capacity<roster.length)return 'Capacity cannot be below the current roster.'
   const seconds=(changes.game==='wallGo'||changes.game==='heavy13')&&this.settings.game!==changes.game?25:changes.game==='fence'||changes.game==='tower'||changes.game==='piece'?240:changes.game==='scale'?300:changes.game==='spot'?90:changes.game==='fragments'?20:changes.game==='pyramid'?45:changes.game==='codeLock'?180:changes.game==='divine'?(this.settings.game!=='divine'?600:Math.max(60,changes.seconds)):changes.game==='knight'?Math.max(180,Math.min(480,changes.seconds)):changes.game==='hex'?20:changes.game==='rectangles'?45:changes.game==='cubes'?25:changes.game==='exile'?90:changes.game==='secret'&&this.settings.game!=='secret'?90:Math.min(90,changes.seconds)
   this.settings={...changes,auctionMode:changes.game==='auction'?changes.auctionMode:undefined,memoryPokerMode:changes.game==='memoryPoker'?changes.memoryPokerMode:undefined,botLevel:changes.botLevel??'normal',capacity,seconds,closed:changes.size===5||!changes.size?false:changes.closed}
   if(this.solo){
    if(changes.game==='divine')this.settings.divineSide??=3
    this.seats=roster
    for(let i=this.seats.length;i<min;i++)this.addBot()
   }
   return null
  }
  if(c.kind==='bot'){
   if(this.seats.length>=seatCapacity(this.settings,this.solo))return 'The room is full.'
   if(isHoldAuction(this.settings))return 'Hold & release uses human seats only.'
   if(humanOnly(this.settings.game))return 'This puzzle uses human seats only.'
   this.addBot()
   return null
  }
  if(c.kind==='kick'){
   if(c.seat===this.owner||!this.seats.some(s=>s.id===c.seat))return 'That seat cannot be removed.'
   this.seats=this.seats.filter(s=>s.id!==c.seat);this.requests.delete(c.seat);this.lastChat.delete(c.seat);return null
  }
  const seating=seatStartError(this.settings,this.seats,this.solo)
  if(seating)return seating
  this.prepare(false);this.begin();return null
 }
 private assignAppearance(requested?:number){
  let preset=appearancePreset(requested)
  if(preset===undefined){
   const inUse=new Set(this.seats.map(s=>s.appearance))
   const vacant=Array.from({length:appearanceCount},(_,i)=>i).filter(i=>!inUse.has(i))
   // Keep the entire room (including disconnected, resumable seats) distinct
   // for automatic assignments, preferring never-used presets after a kick.
   const fresh=vacant.filter(i=>!this.issuedAppearances.has(i))
   const choices=fresh.length?fresh:vacant
   preset=choices[secureIndex(choices.length)] // Maximum room size is 16.
  }
  this.issuedAppearances.add(preset)
  return preset
 }
 private addBot(){
  this.seats.push({id:id(),name:'Bot '+(this.seats.filter(x=>x.bot).length+1),ready:true,online:true,bot:true,token:'',connection:'',appearance:this.assignAppearance()})
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
  this.setGame(start(game,seats,seconds*1000,this.clock(),{seed:gameSeed,size,closed,divineSide,divineHard,fragmentStrict,fragmentCount,memoryPokerPeek,memoryDuelDeal:isEpisodePoker(this.settings)?liveMemoryDeal():undefined,holdAuction:isHoldAuction(this.settings),solo:this.solo}))
  this.publishedHold=this.game?.timeHold?this.game:null
  this.holdUpdates.clear()
 }
 private setGame(g:State){
  if(g.round!==this.game?.round)this.secretBotRejected.clear()
  const prior=this.game?.heavy13
  const heavyChanged=g.heavy13&&prior&&(g.heavy13.phase!==prior.phase||heavy13Slot(g.heavy13)!==heavy13Slot(prior))
  if(!this.game||heavyChanged||isGrass(g.game)||isDuel(g.game)||g.round!==this.game.round)this.botDue=this.clock()+650
  this.game=g
  if(g.done&&this.fixtures[this.fixture])this.fixtures[this.fixture].winner=g.winner
 }
 /** Same-phase private deliveries, consumed by the room transport on its normal tick. */
 takeTimeHoldUpdates(){
  const connections=this.seats.filter(s=>s.online&&this.holdUpdates.has(s.id)).map(s=>s.connection)
  this.holdUpdates.clear()
  return connections
 }
 private setHold(next:TimeHold,alreadyNotified?:string){
  const current=this.game?.timeHold
  if(!current||current===next)return
  if(current.round===next.round)current.slots.forEach(({status},i)=>{
   if(status!==next.slots[i].status&&current.seats[i]!==alreadyNotified)this.holdUpdates.add(current.seats[i])
  })
  this.setGame(syncTimeHold(this.game!,next))
 }
 private advanceHold(hold:TimeHold,now:number){
  // If a release caused a review between ticks, don't let a suspended host
  // skip that unannounced review on wake.
  return hold.phase==='review'&&this.publishedHold?.timeHold?.phase!=='review'?hold:timeHoldAdvance(hold,now)
 }
 private forfeitHold(s:PrivateSeat){
  const hold=this.game?.timeHold
  if(hold&&(hold.phase==='arming'||hold.phase==='live'))this.setHold(timeHoldDisconnect(hold,s.id,this.clock()),s.id)
 }
 tick(){
  if(!this.game)return false
  const now=this.clock()
  if(this.game.timeHold){
   const old=this.publishedHold?.timeHold
   if(!old||old.phase==='finished')return false
   let next=this.advanceHold(this.game.timeHold,now)
   if(next.phase==='review'&&old.phase!=='review')next={...next,nextAt:Math.max(next.nextAt!,now+timeHoldRules.reviewMs)}
   this.setHold(next)
   if(old.phase===next.phase&&old.round===next.round)return false
   this.publishedHold=this.game;this.holdUpdates.clear();this.rev++;return true
  }
  if(this.game.done)return false
  if(this.game.heavy13)return this.tickHeavy13(this.game,now)
  if(!this.game.wallGo&&!this.game.montage&&this.game.game!=='piece'&&!this.game.seats.every(id=>this.seats.find(s=>s.id===id)?.online)&&!simultaneous(this.game.game))return false
  const past=this.game
  let g=past.memoryDuel?.phase==='tie'&&now>=past.deadline?redealMemoryDuel(past,liveMemoryDeal(),now):timeout(past,now)
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
 private tickHeavy13(past:State,now:number){
  let next=timeout(past,now)
  if(next===past&&now>=this.botDue){
   for(const bot of this.seats.filter(s=>s.bot&&past.seats.includes(s.id))){
    const a=botAction(view(next,bot.id),bot.id,[],this.botSeed,this.settings.botLevel)
    if(a===undefined)continue
    const moved=playHeavy13(next,bot.id,a,now)
    if(!moved)continue
    next=moved
    if(past.heavy13?.phase!=='select'||next.heavy13?.phase!=='select')break
   }
  }
  if(next===past)return false
  this.setGame(next)
  // Sealed human and bot locks change no public sequence or recipient view.
  if(past.heavy13?.phase==='select'&&next.heavy13?.phase==='select')return false
  this.rev++
  return true
 }
}
export function explain(game:Game,count:number) {
 if(game==='heavy13')return 'One shared table for 2–7 seats. Lock your pair privately, then place on three stands. Practice adds a bot; larger parties are not split into heats.'
 if(game==='montage')return count===1?'One gallery round in solo practice. Private parties need two to sixteen humans.':'One shared portrait feed, simultaneous buzzers, and one team error allowance.'
 if(game==='wallGo')return count>2?'Two players per board. Each pair plays twice, swapping starting sides. Everyone else watches the current leg.':'Two players fence territory on a 7 × 7 board. Each turn ends with one adjacent wall.'
 return game==='memoryPoker'?'All seats memorize the same layout, then privately lock a five-card hand. Cards are revealed together. No betting.':game==='piece'?'Rotate and fit irregular tiles onto one shared silhouette. Each move passes control; the team has four minutes.':game==='tower'?'A shared letter tray and one team tower. Up to two tile edits per turn, then pass control.':game==='fence'?'Draw your own loop on a private grid. The same clues are shared by everyone.':game==='scale'?'Take turns operating one shared balance. Discuss the evidence and lock one team answer.':game==='spot'?'Compare two shared trays. Each seat has private marks and a private time penalty.':game==='fragments'?'Study one shared exhibit. Players take turns recalling details; in strict mode chat is disabled.':game==='pyramid'?'Every seat gets the same eight puzzles and submits privately. Solo practice needs no bots.':game==='codeLock'?'Everyone gets the same clues and a private answer tray. Offline practice has unlimited retries before the clock runs out.':game==='equations'?'Hide an equation and take turns at each table. Both players receive equal guesses; no turn timer. Larger rooms rotate through a two-leg league.':game==='divine'?'Everyone solves the same magic square on a private grid. Solo practice needs no bots.':isGrass(game)?(game==='grass1'?'2–12 players draft from a shared tile tray.':'2–16 players share a tile draft with optional trades.') :game==='secret'?'3–16 seats exchange private clues. Solo practice fills with two bots.':game==='bagh'?'A two-leg duel swaps goat and tiger roles. Larger rooms run a rotating league.':game==='mancala'?'2–8 players share one circular board. Up to eight seats, including bots.':isPuzzle(game)?'Everyone solves the same challenge and submits privately. Solo practice needs no bots.':game==='knight'?'Everyone solves the same board on a private grid.':game==='remove'?'Every seat gets a private hand; at least three seats.':game==='auction'?'Every seat bids in the same match.':count<=2?'Two players at one board.':'Two legs per pairing, with a different starting player in each leg. Other seats watch the current table. No points for a bye.'
}
