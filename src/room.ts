import {doubtBot,doubtColors,doubtDeck,doubtMaxSeats,doubtRounds,doubtView} from './doubt-bet'
import {wallGo2ActionLimit,wallGo2Step,wallGo2StepLimit} from './wall-go2'
import {bingoAllCoins,bingoBot,bingoRounds,bingoShapes,bingoView} from './auction-bingo'
import {equationBot,equationDeck,equationOperatorOrders,equationRaiseLimit,equationRounds,equationView} from './equation-high-low'
import {unknownBot,unknownMoves,unknownRounds,unknownMaxSeats,unknownView} from './unknown'
import {hiddenBot,hiddenView} from './hidden-word'
import {bigSmallBot} from './big-small'
import {diceBands,diceBot,diceDeal,diceRounds,diceView,type Die} from './triple-dice'
import {flagsWindow} from './flags'
import {gradationBot,gradationView} from './gradation'
import {playRelay,playGradation,playFlags} from './engine'
import {botThreeRow,threeRowView} from './three-row'
import {symmetryAxes,symmetryTime} from './symmetry'
import {colorLinkBot,colorLinkRaceBotDelay,linkCells,linkPairLimit} from './color-link'
import {heavy13Rounds} from './heavy-13'
import {timeHoldAction,timeHoldAdvance,timeHoldDisconnect,timeHoldRules,timeHoldView,type TimeHold} from './time-hold'
import {montagePortraitCount,montageRules} from './montage'
import {memoryDuelDeal} from './memory-duel'
import {isGrass} from './grass'
import {isPuzzle} from './puzzles'
import {z} from 'zod'
import {appearancePreset,legacyAppearance,legacyAppearanceCount,wardrobeVersion} from './wardrobe-look'
export {appearancePreset} from './wardrobe-look'
import {equationTowerRules,equationTowerModes,equationTowerBot,equationTowerView} from './equation-tower'
import {start,move,titles,playEquationTower,heavy13Slot,playDoubtBet,playBigSmall,playEquationHighLow,playHeavy13,playColorLink,playThreeRow,playTripleDice,playAuctionBingo,playHiddenWord,playUnknown,schedule,view,timeout,blindCoverAction,botAction,botLevels,isDuel,minSeats,secretBotIntentKey,simultaneous,redealMemoryDuel,syncTimeHold,openMontageRound,submitMontageBuzz,type State,type Game,type GameView} from './engine'
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
const settings=z.strictObject({game:z.enum(['blind','morris','auction','point','remove','knight','hex','rectangles','mancala','cubes','bagh','secret','grass1','grass3','exile','divine','equations','codeLock','pyramid','fragments','spot','scale','fence','tower','piece','memoryPoker','wallGo','montage','heavy13','colorLink','symmetry','threeRow','flags','coopPuzzle','gradation','bigSmall','tripleDice','wallGo2','auctionBingo','equationHighLow','hiddenWord','unknown','doubtBet','equationTower']),seconds:z.number().int().min(10).max(900),size:z.union([z.literal(5),z.literal(6),z.literal(8)]).optional(),closed:z.boolean().optional(),divineSide:z.union([z.literal(3),z.literal(5),z.literal(7)]).optional(),divineHard:z.boolean().optional(),fragmentStrict:z.boolean().optional(),fragmentCount:z.union([z.literal(8),z.literal(12),z.literal(16),z.literal(24)]).optional(),capacity:z.number().int().min(1).max(16),locked:z.boolean(),botLevel:z.enum(botLevels).optional(),memoryPokerPeek:z.boolean().optional(),memoryPokerMode:z.enum(['fan','episode']).optional(),auctionMode:z.enum(['sealed','hold']).optional(),symmetryAxis:z.enum(symmetryAxes).optional(),coopReflect:z.boolean().optional(),gradationMarked:z.boolean().optional(),flagsMode:z.enum(['recall','names']).optional(),equationTowerMode:z.enum(equationTowerModes).optional()})
const montageMatch=z.string().regex(/^[a-f0-9]{32}$/)
const montageRound=z.number().int().min(1).max(montageRules.rounds)
const heavyMatch=z.string().regex(/^[a-f0-9]{32}$/)
const heavyRound=z.number().int().min(1).max(heavy13Rounds)
const linkCoordinate=z.number().int().min(0).max(linkCells-1)
const linkAction=z.discriminatedUnion('type',[
 z.strictObject({type:z.literal('place'),cells:z.tuple([linkCoordinate,linkCoordinate])}),
 z.strictObject({type:z.literal('accept')}),
 z.strictObject({type:z.literal('challenge')}),
 z.strictObject({type:z.literal('proof'),paths:z.array(z.array(linkCoordinate).min(2).max(linkCells)).max(linkPairLimit)})
])
const relayFit={piece:z.number().int().min(0).max(32),anchor:z.number().int().min(0).max(99),orientation:z.number().int().min(0).max(7)}
const relayAction=z.discriminatedUnion('kind',[
 z.strictObject({kind:z.literal('mark'),...relayFit}),z.strictObject({kind:z.literal('place'),...relayFit}),
 z.strictObject({kind:z.literal('undo'),piece:relayFit.piece})
])
const threeRowAction=z.discriminatedUnion('kind',[
 z.strictObject({kind:z.literal('threeRowPlace'),cell:z.number().int().min(0).max(24),mark:z.enum(['A','B'])}),
 z.strictObject({kind:z.literal('threeRowVote'),suspect:z.string().regex(/^[a-f0-9]{32}$/)})
])
const bigSmallDirection=z.enum(['big','small'])
const bigSmallAction=z.discriminatedUnion('kind',[
 z.strictObject({kind:z.literal('seal'),card:z.number().int().min(0).max(10),call:bigSmallDirection}),
 z.strictObject({kind:z.literal('predict'),prediction:bigSmallDirection,stake:z.number().int().min(0).max(3)}),
 z.strictObject({kind:z.literal('advance')}),
])
const hiddenNoun=z.string().min(1).max(40).regex(/^[a-zA-Z]+(?: [a-zA-Z]+)*$/)
const hiddenAction=z.discriminatedUnion('kind',[
 z.strictObject({kind:z.literal('choose'),word:hiddenNoun}),
 z.strictObject({kind:z.literal('clue'),word:hiddenNoun}),
 z.strictObject({kind:z.literal('guess'),words:z.array(hiddenNoun).max(2).refine(words=>new Set(words.map(word=>word.toLowerCase())).size===words.length)}),
])
const diceSlot=z.number().int().min(0).max(3)
const equationArrangement=z.strictObject({order:z.tuple([diceSlot,diceSlot,diceSlot,diceSlot]).refine(order=>new Set(order).size===4),ops:z.number().int().min(0).max(equationOperatorOrders.length-1)})
const equationAction=z.discriminatedUnion('kind',[
 z.strictObject({kind:z.literal('call')}),z.strictObject({kind:z.literal('fold')}),z.strictObject({kind:z.literal('advance')}),
 z.strictObject({kind:z.literal('raise'),to:z.number().int().min(1).max(equationRaiseLimit)}),
 z.strictObject({kind:z.literal('seal'),low:equationArrangement.nullable(),high:equationArrangement.nullable()}),
])
const doubtStake={points:z.number().int().min(0).max(4),slots:z.number().int().min(0).max(4)}
const doubtAction=z.discriminatedUnion('kind',[
 z.strictObject({kind:z.literal('bid'),color:z.enum(doubtColors),count:z.number().int().min(1).max(20),...doubtStake}),
 z.strictObject({kind:z.literal('doubt'),...doubtStake}),z.strictObject({kind:z.literal('counter'),...doubtStake}),
 z.strictObject({kind:z.literal('fold')}),z.strictObject({kind:z.literal('next')})
])
const schema=z.discriminatedUnion('kind',[
 z.strictObject({kind:z.literal('doubt-bet'),match:heavyMatch,step:z.number().int().min(0).max(128),action:doubtAction}),
 z.strictObject({kind:z.literal('equation-high-low'),match:heavyMatch,step:z.number().int().min(0).max(260),action:equationAction}),
 z.strictObject({kind:z.literal('big-small'),match:heavyMatch,step:z.number().int().min(0).max(59),action:bigSmallAction}),
 z.strictObject({kind:z.literal('ready')}),
 z.strictObject({kind:z.literal('wall-go2'),match:heavyMatch,step:z.number().int().min(0).max(wallGo2StepLimit),action:z.number().int().min(0).max(wallGo2ActionLimit-1)}),
 z.strictObject({kind:z.literal('relay'),match:heavyMatch,turn:z.number().int().min(0).max(68),action:relayAction}),
 z.strictObject({kind:z.literal('gradation-lock'),match:heavyMatch,round:z.number().int().min(1).max(6),order:z.array(z.number().int().min(1).max(7)).length(7),target:z.number().int().min(0).max(6).nullable()}),
 z.strictObject({kind:z.literal('dice-lock'),match:heavyMatch,round:z.number().int().min(1).max(diceRounds),positions:z.tuple([diceSlot,diceSlot,diceSlot]).refine(items=>new Set(items).size===3),prediction:z.enum(diceBands)}),
 z.strictObject({kind:z.literal('unknown-roll'),match:heavyMatch,step:z.number().int().min(0).max(unknownRounds*unknownMaxSeats*2),action:z.enum(unknownMoves)}),
 z.strictObject({kind:z.literal('equation-tower'),match:heavyMatch,step:z.number().int().positive().max(10000),action:z.discriminatedUnion('kind',[
  z.strictObject({kind:z.literal('call'),moves:z.number().int().min(1).max(equationTowerRules.budget)}),
  z.strictObject({kind:z.literal('pass')}),z.strictObject({kind:z.literal('restart')}),z.strictObject({kind:z.literal('advance')}),
  z.strictObject({kind:z.literal('shift'),from:z.number().int().min(0).max(3),to:z.number().int().min(0).max(3),count:z.number().int().min(1).max(8),flip:z.boolean()}),
 ])}),
 z.strictObject({kind:z.literal('hidden-word'),match:heavyMatch,step:z.number().int().min(1).max(292),action:hiddenAction}),
 z.strictObject({kind:z.literal('flags-lock'),match:heavyMatch,choices:z.array(z.number().int().min(-1).max(19)).min(1).max(12)}),
 z.strictObject({kind:z.literal('three-row'),match:heavyMatch,turns:z.number().int().min(0).max(12),action:threeRowAction}),
 z.strictObject({kind:z.literal('config'),settings}),
 z.strictObject({kind:z.literal('bingo-lock'),match:montageMatch,round:z.number().int().min(1).max(bingoRounds),action:z.discriminatedUnion('kind',[
  z.strictObject({kind:z.literal('select'),shape:z.enum(bingoShapes)}),
  z.strictObject({kind:z.literal('bid'),coins:z.number().int().min(0).max(bingoAllCoins)}),
 ])}),
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
 z.strictObject({kind:z.literal('color-link'),match:z.string().regex(/^[a-f0-9]{32}$/),step:z.number().int().min(0).max(100),action:linkAction}),
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
export const humanOnly=(g:Game)=>g==='knight'||g==='divine'||g==='codeLock'||g==='pyramid'||g==='fragments'||g==='spot'||g==='scale'||g==='fence'||g==='tower'||g==='piece'||g==='memoryPoker'||g==='montage'||g==='symmetry'||g==='flags'||g==='coopPuzzle'||isPuzzle(g)
// Room limits for the available fan tables, not contestant counts from the show.
const partyMaximum={
 blind:4,morris:4,point:4,equations:4,wallGo:4,wallGo2:3,bagh:2,
 auction:16,remove:16,knight:16,hex:16,rectangles:16,cubes:16,exile:16,
 grass1:12,grass3:16,mancala:8,secret:16,divine:16,codeLock:16,pyramid:16,
 fragments:8,spot:16,scale:6,fence:16,tower:8,piece:4,memoryPoker:16,montage:16,heavy13:7,colorLink:2,symmetry:16,threeRow:4,flags:16,coopPuzzle:16,gradation:16,bigSmall:2,tripleDice:8,auctionBingo:16,equationHighLow:8,hiddenWord:16,unknown:unknownMaxSeats,doubtBet:doubtMaxSeats,equationTower:8,
} as const satisfies Record<Game,number>
type SeatMode=Pick<Settings,'game'|'memoryPokerMode'|'auctionMode'>
/** Occupied seats for this room (participants plus any supported bots); fixtures still use two participants. */
export function seatRules(settings:SeatMode,solo=false):{min:number,max:number,fixtureSize?:2}{
 const {game}=settings,episode=isEpisodePoker(settings),duel=isDuel(game)
 if(episode)return {min:2,max:2,fixtureSize:2}
 const min=solo?minSeats(game,true):Math.max(2,minSeats(game))
 const max=solo?(humanOnly(game)?1:game==='equationTower'?1:duel||game==='gradation'?2:partyMaximum[game]):partyMaximum[game]
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
 z.strictObject({version:z.literal(1),type:z.literal('hello'),name:z.string().max(160),token:z.string().regex(/^[a-f0-9]{32}$/).optional(),wardrobe:z.literal(wardrobeVersion).optional(),appearance:z.unknown().optional().transform(appearancePreset)}),
 z.strictObject({version:z.literal(1),type:z.literal('command'),epoch:z.string().length(32),match:z.string().max(32),seq:z.number().int().positive().max(1e8),request:z.string().length(32),rev:z.number().int().nonnegative(),command:schema}),
 z.strictObject({version:z.literal(1),type:z.literal('ping')}),
])
export function decode(raw:unknown){
 if(typeof raw!=='string'||raw.length>4096)return null
 try{
  const parsed=wire.safeParse(JSON.parse(raw))
  if(!parsed.success)return null
  const message=parsed.data
  if(message.type==='hello'&&message.wardrobe!==wardrobeVersion&&(message.appearance??0)>=legacyAppearanceCount)message.appearance=undefined
  return message
 }catch{return null}
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
  const bingoPhase=this.game?.auctionBingo?.phase
  const result=this.apply(seat,rev,c)
  prior.set(request,result)
  if(prior.size>128)prior.delete(prior.keys().next().value!)
  const privateGradation=c.kind==='gradation-lock'&&this.game?.gradation?.phase==='arrange'
  const privateEquation=c.kind==='equation-high-low'&&c.action.kind==='seal'&&this.game?.equationHighLow?.stage.phase==='seal'
  const privateHidden=c.kind==='hidden-word'&&this.game?.hiddenWord?.step===c.step
  const privateDice=c.kind==='dice-lock'&&this.game?.tripleDice?.phase==='select'
  const privateFlags=c.kind==='flags-lock'&&this.game?.flags?.phase==='answer'
  const privateHeavy=c.kind==='heavy-lock'&&this.game?.heavy13?.phase==='select'
  const privateRow=c.kind==='three-row'&&c.action.kind==='threeRowVote'&&this.game?.threeRow&&threeRowView(this.game.threeRow).phase==='vote'
  const privateBingo=c.kind==='bingo-lock'&&bingoPhase===this.game?.auctionBingo?.phase
  if(result===null&&!privateBingo&&!privateGradation&&!privateHidden&&!privateDice&&!privateEquation&&!privateFlags&&!privateHeavy&&!privateRow&&c.kind!=='time-hold'&&!(c.kind==='memory-lock'&&this.game?.memoryDuel?.phase==='select'))this.rev++
  return result
 }
 private apply(s:PrivateSeat,rev:number,c:Command):string|null{
  if(c.kind==='relay'){
   const p=this.game?.coopPuzzle
   if(!p||rev>this.rev||this.match!==c.match||p.turns!==c.turn)return 'That relay turn is over.'
   const next=playRelay(this.game!,s.id,c.action,this.clock())
   if(!next)return 'That relay action is not available.'
   this.setGame(next);return null
  }
  if(c.kind==='gradation-lock'){
   if(!this.game?.gradation||c.match!==this.match||rev>this.rev||c.round!==this.game.round)return 'That round has closed.'
   const next=playGradation(this.game,s.id,c.order,c.target,this.clock())
   if(!next)return 'Only the current allocator can seal a complete tray before its clock runs out.'
   this.setGame(next);return null
  }
  if(c.kind==='big-small'){
   if(!this.game?.bigSmall||c.match!==this.match||c.step!==this.game.bigSmall.step||rev>this.rev)return 'That Big Small position has ended.'
   const next=playBigSmall(this.game,s.id,c.action)
   if(!next)return 'That action is not available for your role.'
   this.setGame(next);return null
  }
  if(c.kind==='bingo-lock'){
   const bingo=this.game?.auctionBingo
   if(!bingo||c.match!==this.match||c.round!==bingo.round||rev>this.rev)return 'This choice no longer matches the current Auction Bingo round.'
   const next=playAuctionBingo(this.game!,s.id,c.action,this.clock())
   if(!next)return 'That choice is invalid, already sealed, or too late.'
   this.setGame(next);return null
  }
  if(c.kind==='doubt-bet'){
   const current=this.game?.doubtBet
   if(!current||c.match!==this.match||c.step!==current.step||rev>this.rev)return 'That Doubt and Bet turn has ended.'
   if(c.action.kind==='next'&&s.id!==this.owner)return 'Only the host can deal again.'
   const next=playDoubtBet(this.game!,s.id,c.action,this.clock())
   if(!next)return 'That claim or wager is not available.'
   this.setGame(next);return null
  }
  if(c.kind==='equation-high-low'){
   const current=this.game?.equationHighLow
   if(!current||c.match!==this.match||c.step!==current.step||rev>this.rev)return 'That Equation High-Low phase has ended.'
   const next=playEquationHighLow(this.game!,s.id,c.action,this.clock())
   if(!next)return 'That wager or equation is not available.'
   this.setGame(next);return null
  }
  if(c.kind==='unknown-roll'){
   const race=this.game?.unknown
   if(!race||c.match!==this.match||c.step!==race.step||rev>this.rev)return 'That cube turn has closed.'
   const next=playUnknown(this.game!,s.id,c.action,this.clock())
   if(!next)return 'That roll is unavailable or its clock has expired.'
   this.setGame(next);return null
  }
  if(c.kind==='equation-tower'){
   const current=this.game?.equationTower
   if(!current||c.match!==this.match||c.step!==current.step||rev>this.rev)return 'That tower position has changed.'
   const next=playEquationTower(this.game!,s.id,c.action,this.clock())
   if(!next)return 'That claim or block move is no longer available.'
   this.setGame(next);return null
  }
  if(c.kind==='hidden-word'){
   const current=this.game?.hiddenWord
   if(!current||c.match!==this.match||c.step!==current.step||rev>this.rev)return 'That Hidden Word stage has closed.'
   const next=playHiddenWord(this.game!,s.id,c.action,this.clock())
   if(!next)return 'That word is not available for your role, is already sealed, or arrived too late.'
   this.setGame(next);return null
  }
  if(c.kind==='dice-lock'){
   const current=this.game?.tripleDice
   if(!current||c.match!==this.match||c.round!==current.round||rev>this.rev)return 'This choice no longer matches the current dice round.'
   const next=playTripleDice(this.game!,s.id,c.positions,c.prediction,this.clock())
   if(!next)return 'That choice is invalid, already sealed, or too late.'
   this.setGame(next);return null
  }
  if(c.kind==='flags-lock'){
   if(!this.game?.flags||c.match!==this.match||rev>this.rev)return 'This dispatch no longer matches the current game.'
   const next=playFlags(this.game,s.id,c.choices,this.clock())
   if(!next)return 'That dispatch is invalid, already sealed, or arrived after the deadline.'
   this.setGame(next);return null
  }
  if(c.kind==='three-row'){
   const state=this.game?.threeRow
   if(!state||c.match!==this.match)return 'This action no longer matches the current game.'
   const current=threeRowView(state)
   if(rev>this.rev||current.turns!==c.turns||current.phase!==(c.action.kind==='threeRowPlace'?'place':'vote'))return 'That turn or ballot has ended.'
   const next=playThreeRow(this.game!,s.id,c.action,this.clock())
   if(!next)return c.action.kind==='threeRowVote'?'That ballot cannot be sealed.':'That mark is not available.'
   this.setGame(next);return null
  }
  if(c.kind==='color-link'){
   const current=this.game?.colorLink
   if(!current||c.match!==this.match||c.step!==current.step||rev>this.rev)return 'This Color Link position has ended.'
   const next=playColorLink(this.game!,s.id,c.action,this.clock())
   if(!next)return c.action.type==='proof'?'That proof is incomplete, overlaps, or arrived after the deadline.':'That action is not available on this board.'
   this.setGame(next);return null
  }
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
  if(c.kind==='wall-go2'){
   const game=this.game
   if(!game?.wallGo2||c.match!==this.match||c.step!==wallGo2Step(game.wallGo2))return 'That Wall Go II action has ended.'
   const next=move(game,s.id,c.action,this.clock())
   if(!next)return 'That placement or route is not available.'
   this.setGame(next);return null
  }
  if(c.kind==='move'){
   if(!this.game)return 'No active match.'
   if(this.game.wallGo2)return 'Use the Wall Go II action for this table.'
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
   const seconds=changes.game==='unknown'&&gameChanged?25:changes.game==='wallGo2'?90:changes.game==='coopPuzzle'?20:changes.game==='gradation'&&gameChanged?45:(changes.game==='tripleDice'||changes.game==='auctionBingo'||changes.game==='equationHighLow'||changes.game==='hiddenWord'||changes.game==='doubtBet')&&gameChanged?45:changes.game==='flags'?flagsWindow/1000:changes.game==='symmetry'?symmetryTime/1000:changes.game==='colorLink'&&gameChanged?45:(changes.game==='wallGo'||changes.game==='heavy13')&&this.settings.game!==changes.game?25:changes.game==='fence'||changes.game==='tower'||changes.game==='piece'?240:changes.game==='scale'?300:changes.game==='spot'?90:changes.game==='fragments'?20:changes.game==='pyramid'?45:changes.game==='codeLock'?180:changes.game==='divine'?(this.settings.game!=='divine'?600:Math.max(60,changes.seconds)):changes.game==='knight'?Math.max(180,Math.min(480,changes.seconds)):changes.game==='hex'?20:changes.game==='rectangles'?45:changes.game==='cubes'?25:changes.game==='exile'?90:changes.game==='secret'&&this.settings.game!=='secret'?90:Math.min(90,changes.seconds)
   this.settings={...changes,equationTowerMode:changes.game==='equationTower'?(changes.equationTowerMode??'standard'):undefined,coopReflect:changes.game==='coopPuzzle'?!!changes.coopReflect:undefined,gradationMarked:changes.game==='gradation'?(changes.gradationMarked??false):undefined,flagsMode:changes.game==='flags'?changes.flagsMode??'recall':undefined,symmetryAxis:changes.game==='symmetry'?changes.symmetryAxis:undefined,auctionMode:changes.game==='auction'?changes.auctionMode:undefined,memoryPokerMode:changes.game==='memoryPoker'?changes.memoryPokerMode:undefined,botLevel:changes.botLevel??'normal',capacity,seconds,closed:changes.size===5||!changes.size?false:changes.closed}
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
   const inUse=new Set(this.seats.map(s=>legacyAppearance(s.appearance)))
   const vacant=Array.from({length:legacyAppearanceCount},(_,i)=>i).filter(i=>!inUse.has(i))
   // Keep the entire room (including disconnected, resumable seats) distinct
   // for automatic assignments, preferring never-used presets after a kick.
   const fresh=vacant.filter(i=>!this.issuedAppearances.has(i))
   const choices=fresh.length?fresh:vacant
   preset=choices[secureIndex(choices.length)] // Maximum room size is 16.
  }
  this.issuedAppearances.add(legacyAppearance(preset))
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
  const {game,seconds,size,closed,equationTowerMode,divineSide,divineHard,fragmentStrict,fragmentCount,memoryPokerPeek,symmetryAxis,flagsMode,coopReflect,gradationMarked}=this.settings
  const seats=isDuel(game)?this.fixtures[this.fixture].sides:this.seats.map(s=>s.id)
  this.setGame(start(game,seats,seconds*1000,this.clock(),{seed:gameSeed,equationTowerMode,doubtDeals:game==='doubtBet'?Array.from({length:doubtRounds},()=>doubtDeck(secureIndex)):undefined,equationDeals:game==='equationHighLow'?Array.from({length:equationRounds},()=>equationDeck(secureIndex)):undefined,hiddenIndex:game==='hiddenWord'?secureIndex:undefined,unknownIndex:game==='unknown'?secureIndex:undefined,diceDeal:game==='tripleDice'?diceDeal(seats.length,()=>(secureIndex(6)+1) as Die):undefined,size,closed,divineSide,divineHard,fragmentStrict,fragmentCount,memoryPokerPeek,symmetryAxis,flagsMode,coopReflect,gradationMarked,memoryDuelDeal:isEpisodePoker(this.settings)?liveMemoryDeal():undefined,holdAuction:isHoldAuction(this.settings),solo:this.solo}))
  this.publishedHold=this.game?.timeHold?this.game:null
  this.holdUpdates.clear()
 }
 private setGame(g:State){
  if(g.round!==this.game?.round)this.secretBotRejected.clear()
  const hiddenChanged=g.hiddenWord&&g.hiddenWord.step!==this.game?.hiddenWord?.step||g.unknown&&g.unknown.step!==this.game?.unknown?.step
  const prior=this.game?.heavy13
  const heavyChanged=g.heavy13&&prior&&(g.heavy13.phase!==prior.phase||heavy13Slot(g.heavy13)!==heavy13Slot(prior))
  const doubtChanged=g.doubtBet&&g.doubtBet.step!==this.game?.doubtBet?.step
  const equationChanged=g.equationHighLow&&g.equationHighLow.step!==this.game?.equationHighLow?.step
  const rowChanged=g.threeRow&&(!this.game?.threeRow||g.round!==this.game.round||threeRowView(g.threeRow).phase!==threeRowView(this.game.threeRow).phase)
  const bingoChanged=g.auctionBingo?.phase!==this.game?.auctionBingo?.phase
  if(!this.game||bingoChanged||doubtChanged||equationChanged||hiddenChanged||rowChanged||heavyChanged||isGrass(g.game)||isDuel(g.game)||g.round!==this.game.round)this.botDue=this.clock()+650
  if(g.colorLink?.phase==='race'&&this.game?.colorLink?.phase!=='race')this.botDue=this.clock()+colorLinkRaceBotDelay(this.settings.botLevel)
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
  if(this.game.gradation)return this.tickGradation(this.game,now)
  if(this.game.heavy13)return this.tickHeavy13(this.game,now)
  if(this.game.auctionBingo)return this.tickBingo(this.game,now)
  if(this.game.doubtBet){
   const past=this.game,doubt=this.game.doubtBet
   let next=timeout(past,now)
   const turn='actor' in doubt.stage?doubt.stage.actor:null
   const bot=turn&&this.seats.find(s=>s.id===turn&&s.bot)
   if(next===past&&bot&&now>=this.botDue){
    const action=doubtBot(doubtView(doubt,bot.id),this.settings.botLevel??'normal',this.botSeed^Math.imul(this.seats.indexOf(bot)+1,0x85ebca6b))
    if(action)next=playDoubtBet(past,bot.id,action,now)??past
   }
   if(next===past)return false
   this.setGame(next);this.rev++;return true
  }
  if(this.game.equationHighLow)return this.tickEquation(this.game,now)
  if(this.game.unknown)return this.tickUnknown(this.game,now)
  if(this.game.equationTower)return this.tickTower(this.game,now)
  if(this.game.hiddenWord)return this.tickHiddenWord(this.game,now)
  if(this.game.tripleDice)return this.tickTripleDice(this.game,now)
  if(this.game.threeRow)return this.tickThreeRow(this.game,now)
  if(!this.game.coopPuzzle&&!this.game.colorLink&&!this.game.wallGo&&!this.game.wallGo2&&!this.game.montage&&this.game.game!=='piece'&&!this.game.seats.every(id=>this.seats.find(s=>s.id===id)?.online)&&!simultaneous(this.game.game))return false
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
    if(v.bigSmall){
     const action=bigSmallBot(v.bigSmall,s.id,this.botSeed,this.settings.botLevel??'normal')
     const next=action&&playBigSmall(g,s.id,action)
     if(next){g=next;break}
     continue
    }
    if(v.colorLink){
     const action=colorLinkBot(v.colorLink,s.id,this.botSeed,this.settings.botLevel??'normal')
     const next=action&&playColorLink(g,s.id,action,now)
     if(next){g=next;break}
     continue
    }
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
 private tickGradation(past:State,now:number){
  let next=timeout(past,now)
  if(next===past&&past.gradation?.phase==='arrange'&&now>=this.botDue){
   for(const bot of this.seats.filter(s=>s.bot)){
    const plan=gradationBot(gradationView(next.gradation!,bot.id),bot.id,this.botSeed,this.settings.botLevel??'normal')
    if(plan)next=playGradation(next,bot.id,plan.order,plan.target,now)??next
   }
  }
  if(next===past)return false
  this.setGame(next)
  if(past.gradation?.phase==='arrange'&&next.gradation?.phase==='arrange')return false
  this.rev++;return true
 }
 private tickBingo(past:State,now:number){
  let next=timeout(past,now)
  if(next!==past){this.setGame(next);this.rev++;return true}
  const phase=past.auctionBingo!.phase
  if(now<this.botDue||(phase!=='select'&&phase!=='bid'))return false
  for(const [i,s] of this.seats.entries()){
   if(!s.bot||!past.seats.includes(s.id))continue
   const seed=this.botSeed^Math.imul(i+1,0x9e3779b9)
   const action=bingoBot(bingoView(next.auctionBingo!,s.id),seed,this.settings.botLevel??'normal',s.id)
   if(!action)continue
   next=playAuctionBingo(next,s.id,action,now)??next
   if(next.auctionBingo!.phase!==phase)break
  }
  if(next===past)return false
  this.setGame(next)
  if(next.auctionBingo!.phase===phase)return false
  this.rev++;return true
 }
 private tickEquation(past:State,now:number){
  let next=timeout(past,now)
  if(next===past&&now>=this.botDue){
   for(const [i,s] of this.seats.entries()){
    if(!s.bot)continue
    const v=equationView(next.equationHighLow!,s.id)
    const action=equationBot(v,s.id,this.botSeed^Math.imul(i+1,0x9e3779b9),this.settings.botLevel??'normal')
    if(!action)continue
    next=playEquationHighLow(next,s.id,action,now)??next
    if(next.equationHighLow!.step!==past.equationHighLow!.step)break
   }
  }
  if(next===past)return false
  this.setGame(next)
  if(next.equationHighLow!.step===past.equationHighLow!.step)return false
  this.rev++;return true
 }
 private tickUnknown(past:State,now:number){
  let next=timeout(past,now)
  const race=past.unknown!,seat=race.seats[race.turn]
  if(next===past&&now>=this.botDue&&this.seats.some(s=>s.id===seat&&s.bot)){
   const action=unknownBot(unknownView(race,seat),this.botSeed,this.settings.botLevel??'normal')
   next=playUnknown(past,seat,action,now)??past
  }
  if(next===past)return false
  this.setGame(next);this.rev++;return true
 }
 private tickTower(past:State,now:number){
  let next=timeout(past,now)
  const current=past.equationTower!
  if(next===past&&now>=this.botDue){
   const delay=current.phase==='call'?10000:current.phase==='challenge'?2800:0
   if(now>=current.opened+delay){
    for(const seat of this.seats){
     if(!seat.bot||!current.seats.includes(seat.id))continue
     const action=equationTowerBot(equationTowerView(current,seat.id),seat.id,this.settings.botLevel??'normal')
     if(!action)continue
     const changed=playEquationTower(past,seat.id,action,now)
     if(changed){next=changed;this.botDue=now+650;break}
    }
   }
  }
  if(next===past)return false
  this.setGame(next);this.rev++;return true
 }
 private tickHiddenWord(past:State,now:number){
  const timed=timeout(past,now)
  if(timed!==past){this.setGame(timed);this.rev++;return true}
  if(now<this.botDue)return false
  const step=past.hiddenWord!.step
  let next=past
  for(const [i,seat] of this.seats.entries()){
   if(!seat.bot)continue
   const projection=hiddenView(next.hiddenWord!,seat.id)
   const action=hiddenBot(projection,this.botSeed^Math.imul(i+1,0x9e3779b9),this.settings.botLevel??'normal')
   if(!action)continue
   next=playHiddenWord(next,seat.id,action,now)??next
   if(next.hiddenWord!.step!==step)break
  }
  if(next===past)return false
  this.setGame(next)
  if(next.hiddenWord!.step===step)return false
  this.rev++;return true
 }
 private tickTripleDice(past:State,now:number){
  let next=timeout(past,now)
  if(next!==past){this.setGame(next);this.rev++;return true}
  if(now<this.botDue||past.tripleDice!.phase!=='select')return false
  for(const [i,s] of this.seats.entries()){
   if(!s.bot||!past.seats.includes(s.id))continue
   const projected=diceView(next.tripleDice!,s.id)
   const seed=this.botSeed^Math.imul(i+1,0x9e3779b9)^Math.imul(projected.round,0x85ebca6b)
   const action=diceBot(projected,seed,this.settings.botLevel??'normal',s.id)
   if(!action)continue
   const state=playTripleDice(next,s.id,[...action.positions],action.prediction,now)
   if(!state)continue
   next=state
   if(next.tripleDice!.phase!=='select')break
  }
  if(next===past)return false
  this.setGame(next)
  if(next.tripleDice!.phase==='select')return false
  this.rev++;return true
 }
 private tickThreeRow(past:State,now:number){
  let next=timeout(past,now)
  if(next!==past){this.setGame(next);this.rev++;return true}
  if(now<this.botDue)return false
  const initial=threeRowView(past.threeRow!)
  for(const [i,s] of this.seats.entries()){
   if(!s.bot||!past.seats.includes(s.id))continue
   const mine=threeRowView(next.threeRow!,s.id)
   let number=(this.botSeed^Math.imul(i+1,0x9e3779b9)^Math.imul(mine.turns+1,0x85ebca6b))>>>0
   const rng=()=>{number=(Math.imul(number,1664525)+1013904223)>>>0;return number/4294967296}
   const action=botThreeRow(mine,s.id,past.seats,this.settings.botLevel??'normal',rng)
   const state=action&&playThreeRow(next,s.id,action,now)
   if(!state)continue
   next=state
   if(initial.phase==='place'||next.done)break
  }
  if(next===past)return false
  this.setGame(next)
  if(initial.phase==='vote'&&!next.done)return false // Bot ballots are sealed too.
  this.rev++;return true
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
 if(game==='coopPuzzle')return 'Share one tiling frame. One player places or removes a piece; teammates can leave suggestions. Solo practice or 2–16 human seats.'
 if(game==='gradation')return 'Seven gates, two sides. Practice faces one bot. Parties of 2–16 alternate seats between Copper and Jade; each side changes allocator every round. In groups over ten, not every teammate seals in one match.'
 if(game==='doubtBet')return 'One table for 2–10 seats, or one player and bots in practice. Make a hidden-card claim, outbid the count, or challenge. Fictional points and card slots only.'
 if(game==='equationHighLow')return 'One table for 2–8 seats. Two betting passes, then a private equation declaration. Solo practice starts with one bot. No real stakes.'
 if(game==='bigSmall')return 'Exactly two seats. Seal a card, predict its rank, then compare stacks. Solo practice seats one bot. Chips are fictional.'
 if(game==='auctionBingo')return 'Seven rounds for 2–16 seats. Choose a shape, seal a bid and build lines on your bingo card. Practice starts with one bot.'
 if(game==='unknown')return 'A secret-law cube race for 2–12 seats. Solo practice adds one bot. Each round is one circuit of the table.'
 if(game==='equationTower')return count===1?'Three untimed puzzles. Move numbered blocks between four stands.':'2–8 seats. Call your move budget, undercut a rival, then prove the exact count. Every round carries the same blocks forward.'
 if(game==='hiddenWord')return 'A two-round English word game for 3–16 seats. Solo practice starts with two bots. Only your own envelope and unrevealed answers are sent to your seat.'
 if(game==='tripleDice')return 'Eight rounds for 2–8 seats, with private forecasts and a shared reveal. Practice starts with one bot; five or more seats unlock more forecast bands.'
 if(game==='flags')return 'Study twelve named flag cards for forty seconds, then submit once within sixty seconds. Solo practice or 2–16 humans, no bots.'
 if(game==='threeRow')return 'One shared 5 × 5 table for 3–4 seats. Place engraved marks, then seal a suspect ballot. Practice fills to three seats with bots.'
 if(game==='symmetry')return 'All players get the same tray and mirror axis, but build on private 7 × 7 boards. Four minutes; no bots.'
 if(game==='colorLink')return 'Exactly two seats. Add links without closing the routes your opponent needs. Solo practice adds one bot.'
 if(game==='heavy13')return 'One shared table for 2–7 seats. Lock your pair privately, then place on three stands. Practice adds a bot; larger parties are not split into heats.'
 if(game==='montage')return count===1?'One gallery round in solo practice. Private parties need two to sixteen humans.':'One shared portrait feed, simultaneous buzzers, and one team error allowance.'
 if(game==='wallGo2')return 'Two or three seats share one 7 × 7 board. Squares travel straight; rounds can turn. Practice starts with one bot and can add another.'
 if(game==='wallGo')return count>2?'Two players per board. Each pair plays twice, swapping starting sides. Everyone else watches the current leg.':'Two players fence territory on a 7 × 7 board. Each turn ends with one adjacent wall.'
 return game==='memoryPoker'?'All seats memorize the same layout, then privately lock a five-card hand. Cards are revealed together. No betting.':game==='piece'?'Rotate and fit irregular tiles onto one shared silhouette. Each move passes control; the team has four minutes.':game==='tower'?'A shared letter tray and one team tower. Up to two tile edits per turn, then pass control.':game==='fence'?'Draw your own loop on a private grid. The same clues are shared by everyone.':game==='scale'?'Take turns operating one shared balance. Discuss the evidence and lock one team answer.':game==='spot'?'Compare two shared trays. Each seat has private marks and a private time penalty.':game==='fragments'?'Study one shared exhibit. Players take turns recalling details; in strict mode chat is disabled.':game==='pyramid'?'Every seat gets the same eight puzzles and submits privately. Solo practice needs no bots.':game==='codeLock'?'Everyone gets the same clues and a private answer tray. Offline practice has unlimited retries before the clock runs out.':game==='equations'?'Hide an equation and take turns at each table. Both players receive equal guesses; no turn timer. Larger rooms rotate through a two-leg league.':game==='divine'?'Everyone solves the same magic square on a private grid. Solo practice needs no bots.':isGrass(game)?(game==='grass1'?'2–12 players draft from a shared tile tray.':'2–16 players share a tile draft with optional trades.') :game==='secret'?'3–16 seats exchange private clues. Solo practice fills with two bots.':game==='bagh'?'A two-leg duel swaps goat and tiger roles. Larger rooms run a rotating league.':game==='mancala'?'2–8 players share one circular board. Up to eight seats, including bots.':isPuzzle(game)?'Everyone solves the same challenge and submits privately. Solo practice needs no bots.':game==='knight'?'Everyone solves the same board on a private grid.':game==='remove'?'Every seat gets a private hand; at least three seats.':game==='auction'?'Every seat bids in the same match.':count<=2?'Two players at one board.':'Two legs per pairing, with a different starting player in each leg. Other seats watch the current table. No points for a bye.'
}
