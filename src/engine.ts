import {colorLinkAct,colorLinkStart,colorLinkTick,colorLinkView,type ColorLink,type LinkAction} from './color-link'
import {heavy13Action,heavy13Bot,heavy13Start,heavy13Tick,heavy13View,type Heavy13} from './heavy-13'
import {montageAdvance,montageBuzz,montageOpenRound,montageStart,montageView,type Montage,type MontageCommand} from './montage'
import {wallGoBot,wallGoFallback,wallGoPlay,wallGoStart,wallGoTerritory,wallGoView,type WallGo} from './wall-go'
import {timeHoldStart,timeHoldAdvance,timeHoldView,type TimeHold} from './time-hold'
import {memoryDuelAction,memoryDuelRedeal,memoryDuelStart,memoryDuelTick,memoryDuelView,type MemoryDuelDeal,type MemoryDuelState} from './memory-duel'
import {memoryPokerAction,memoryPokerStart,memoryPokerStudy,memoryPokerTick,memoryPokerView,type MemoryPoker} from './memory-poker'
import {pieceClue,pieceHintCost,pieceResult,pieceStart,pieceStep,pieceTime,pieceView,type Piece} from './piece'
import {towerStart,towerEdit,towerCheck,towerView,towerTime,type Tower} from './tower'
import {fenceStart,fencePlay,fenceView,fenceScores,fenceTime,type Fence} from './fence'
import {scaleStart,scaleMove,scaleView,scaleWindow,type Scale} from './scale'
import {spotStart,spotView,spotPlay,spotScore,spotClosed,spotWindow,type Spot} from './spot'
import {fragmentStart,fragmentView,fragmentNeed,type FragmentCount,type Fragments} from './fragments'
import {pyramidStart,pyramidAnswer,pyramidView,pyramidRounds,type Pyramid} from './pyramid'
import {codeStart,codeClosed,codeMove,codeScores,codeView,type CodeLock} from './code-lock'
import {equationStart,equationPlay,equationView,equationBot,equationMarks,equationPool,type Equations} from './equations'
import {divineInit,divinePlay,divineView,magicCheck,type Divine,type DivineSide} from './divine'
import {canPlace,footprint,grassBot,grassRank,grassStart,grassStep,isGrass,orient,placeCode,square,type Grass,type GrassGame} from './grass'
import {baghActions,baghInit,baghStep,type Bagh} from './bagh'
import {buyer,candidates,clue,contactAction,guessAction,initSecret,secretScore,secretStep,secretView,type Secret} from './secret'
import {balance,compare,makeMancala,pitType,plant,sow,total,type Mancala} from './mancala'
import {puzzleRounds,countRectangles,hexLines,isPuzzle,puzzle as makePuzzle,type PuzzleGame} from './puzzles'
import {deal,lowestUnique,tourRoute,tourLegal,type Card,type TourSize} from './season-two'
export type Game='blind'|'morris'|'auction'|'point'|'remove'|'knight'|PuzzleGame|GrassGame|'mancala'|'bagh'|'secret'|'divine'|'equations'|'codeLock'|'pyramid'|'fragments'|'spot'|'scale'|'fence'|'tower'|'piece'|'memoryPoker'|'wallGo'|'montage'|'heavy13'|'colorLink'
export const botLevels=['easy','normal','hard'] as const
export type BotLevel=typeof botLevels[number]
export const titles={blind:'Blind Gomoku',morris:'Nine Men’s Morris',auction:'Time Auction',point:'Point Gomoku',remove:'Remove One',knight:'Knight’s Tour',hex:'Hexagon',rectangles:'Count the Rectangles',cubes:'Count the Cubes',exile:'Exile Rectangle Counting',mancala:'Balance Mancala',bagh:'Bagh Chal',secret:'Secret Number',grass1:'Laying Grass',grass3:'Lay the Grass',divine:'Divine Test',equations:'Equation Lights',codeLock:'Secret Code',pyramid:'Equation Pyramid',fragments:'Fragments of Memory',spot:'Spot the Difference',scale:'Scale Game',fence:'Loop Fence Puzzle',tower:'Word Tower',piece:'Piece Puzzle',memoryPoker:'Memory Poker',wallGo:'Wall Go',montage:'Montage',heavy13:'Heavy 13',colorLink:'Color Link'}
export const tutorials={
 colorLink:'Place a matching pair on any two open cells. Accept your opponent’s pair to keep playing, or challenge if the pairs cannot all connect. Routes use horizontal and vertical steps and never share a cell. If you challenge a connectable board, the placer wins the round. Accept six pairs to race; the first complete valid set of paths wins. Win two rounds to take the match.',
 heavy13:'Private rounds start by locking one number and one color. Reveal together: rainbow first, then descending numbers, with equal numbers called clockwise from the marker. On your call, place on the matching stand or choose any stand with rainbow. You can defer once, except on the final regular call. Deferred players place in reverse pass order. At 13 or more, take every old cube as one penalty each; your new cube remains. Both hands refill after seven rounds. After 14 rounds, fewest penalties wins, then older most recent penalty.',
 montage:'Watch one portrait every three seconds. Buzz before a portrait disappears if you have seen it earlier in this round. The first correct buzz earns one fictional Piece and clears the round. An incorrect buzz adds one team error; the eleventh error or any missed repeat ends the match. Clear all five rounds together.',
 wallGo:'Stay or move up to two open orthogonal steps without passing through the other pawn. Pick a square, then a marked edge to place the wall and end your turn. When your pawns are separated, the larger connected territory wins. If the board is still shared after 40 turns, or territories are equal, draw. If your turn clock expires, your pawn stays and the table places an adjacent wall.',
 memoryPoker:'Memorize twenty cards in twenty-five seconds. When the cards turn over, choose five positions and lock your hand in thirty seconds. Standard poker ranks decide each round; tied hands split rank points. Play four rounds with no betting.',
 piece:'Fill the silhouette with the pieces in the tray. Select, rotate and place one piece at a time; it cannot overlap another or extend beyond the target. You have four minutes, and a clue costs twenty seconds. In a party, each action passes control to the next seat.',
 tower:'Build distinct words from the given theme. Read each column from top to bottom and use every letter. Take turns to add, return or swap up to two tiles. The team has four minutes or a shared turn limit.',
 fence:'Draw a single closed fence. Every number says how many of its four borders belong to the loop. Cross out edges to keep notes. Everyone gets four minutes and a private grid.',
 scale:'Four mineral weights are hidden. Compare them with the brass reference, then submit one team answer. You have five minutes and up to twelve weighings.',
 spot:'Compare the two specimen trays. Select each changed region only once. Wrong regions deduct five seconds. You have 90 seconds; most differences found wins, then time to the last find plus penalties.',
 fragments:'Study the exhibit for 45 seconds. After it disappears, take turns answering one question in 20 seconds. In casual play the team needs five out of six correct; strict mode ends at the first miss.',
 pyramid:'Build the target using one tile with its two immediate lower neighbors. Choose the tiles in expression order, then select two operators and a grouping. Each of eight puzzles lasts up to 45 seconds; the first correct answer earns two points, and other correct answers earn one.',
 codeLock:'Deduce the order of four different cards from the clue sheet. In a room, you have three tries in three minutes; each miss deducts 15 seconds from your clock. Practice gives feedback and retries. First exact answer wins, or the highest positional score at the end.',
 equations:'Hide a true eight-character equation. Take turns guessing your rival’s equation. Patterned lights show which symbols match. You each get up to eight guesses. Both players get the same number of attempts.',
 divine:'Arrange the symbolic tiles so every row, column and both diagonals have the same sum. The engraved tile is fixed. Tap a tile, then a cell, or drag it into place.',
 grass1:'Draft and rotate tiles to build the largest solid square. You have one redraw in nine rounds.',
 grass3:'Trade draft spots by mutual agreement or keep your position. Draft tiles, expand your territory and cover marked bonus cells over four rounds.',
 bagh:'A traditional Nepali duel. Goats place twenty pieces, then slide on marked lines. Four tigers can step or jump a goat along a straight line. Tigers win with five captures; goats win by trapping every tiger. The next leg swaps roles.',
 secret:'Nobody sees even their own number. Agree with another player to spend matching tickets and learn a private math clue. After four contact rounds, lock a guess for yourself and optionally two other seats. Correct self earns four; each correct other earns two, each wrong other costs one.',

 mancala:'Take turns placing four stones per player, at most two per pit during setup. Then choose a pit containing one of your stones and sow its entire stack clockwise, bottom first. The owner of the last stone earns points in the destination color. Keep all three scores high; your lowest color score ranks first.',
 exile:'Count every axis-aligned rectangle that totals zero on a signed grid. Single tiles and squares count. Each of three grids gives you 90 seconds and one private answer. Most correct wins; ties go to the lower cumulative time on correct answers.',
 cubes:'Count every unit cube, including ones supporting other cubes. Switch between three table angles or inspect each numbered layer. Lock one answer in 25 seconds; there are five stacks.',

 hex:'Memorize the numbers for 30 seconds. Then select three contiguous tiles in a straight line that add up to the target. Each correct answer earns a point. A new board appears after four of the eight targets.',
 rectangles:'Count every axis-aligned rectangle whose numbers add up to the target. Squares and single tiles count. There are four grids; each exact answer earns one point. You can highlight tiles to track your count.',
 remove:'Discard one of your two cards in secret. After the reveal, the lowest value kept by exactly one player earns two chips. Start with five chips and play eight rounds; ties can add up to three rounds.',
 knight:'Move in a chess knight’s L-shape, visiting every square once. You can undo and try another path. Finish the full board first or build the longest route before time runs out; closed tours must return within a knight move of the start.',
 point:'Place on a 13 × 13 board. A newly lengthened line scores 1 for three, 2 for four, or 5 for five or more; extensions of five-plus lines do not score again. After 20 moves each, highest score wins.',
 blind:'Take turns placing a stone on the 15 × 15 board. Choose any cover: the color on top never tells you the side underneath. Make five in a line to flip the stones and reveal each side. In solo practice, the bot echoes your last cover.',
 morris:'Place nine stones each on the marked points. A line of three on a drawn segment lets you remove an opposing stone. Once all stones are placed, slide to neighboring points; with three left, fly to any open point. A player with fewer than three stones or no legal move loses.',
 auction:'Start with a 60-second time bank. In each of eight timed rounds privately commit up to 15 seconds. Everyone pays their own bid; the highest positive bid wins the revealed reward, split across ties. Score wins, then time remaining.'
}
export const mills=[[0,1,2],[3,4,5],[6,7,8],[9,10,11],[12,13,14],[15,16,17],[18,19,20],[21,22,23],[0,9,21],[3,10,18],[6,11,15],[1,4,7],[16,19,22],[8,12,17],[5,13,20],[2,14,23]]
export const points=[[0,0],[3,0],[6,0],[1,1],[3,1],[5,1],[2,2],[3,2],[4,2],[0,3],[1,3],[2,3],[4,3],[5,3],[6,3],[2,4],[3,4],[4,4],[1,5],[3,5],[5,5],[0,6],[3,6],[6,6]]
const neighbors=(a:number,b:number)=>mills.some(m=>Math.abs(m.indexOf(a)-m.indexOf(b))===1&&m.includes(a)&&m.includes(b))
export type State={game:Game,timeHold:TimeHold|null,seats:string[],board:string[],blindCovers:(BlindCover|null)[]|null,turn:number,capture:boolean,placed:number[],winner:string|null,done:boolean,round:number,deadline:number,window:number,bids:Record<string,number>,scores:number[],credits:number[],last:number[]|null,plies:number,quiet:number,history:Record<string,number>,publicMoves:number[],hands:Record<string,Card[]>,seed:number,paths:Record<string,number[]>,tour:number[],size:TourSize,closed:boolean,reached:Record<string,number>,reveal:{round:number,winner:string|null}|null,puzzleStage:'study'|'answer',spent:number[],opened:number,mancala:Mancala|null,bagh:Bagh|null,secret:Secret|null,grass:Grass|null,divine:Divine|null,equations:Equations|null,codeLock:CodeLock|null,pyramid:Pyramid|null,fragments:Fragments|null,spot:Spot|null,scale:Scale|null,fence:Fence|null,tower:Tower|null,piece:Piece|null,memoryPoker:MemoryPoker|null,memoryDuel:MemoryDuelState|null,wallGo:WallGo|null,montage:Montage|null,heavy13:Heavy13|null,colorLink:ColorLink|null}
type BoardAction=number|{from:number,to:number}
export type Action=BoardAction|string
export const blindCoverIds=[0,1,2,3,4,5,6] as const
export type BlindCover=typeof blindCoverIds[number]
const blindCoverBase=299_998_000, blindCellCount=15*15
export function blindCoverAction(cell:number,cover:BlindCover){
 if(!Number.isInteger(cell)||cell<0||cell>=blindCellCount||!blindCoverIds.includes(cover))throw new RangeError('Invalid Blind Gomoku cell or cover.')
 return blindCoverBase+cell*blindCoverIds.length+cover
}
export const isDuel=(g:Game)=>g==='blind'||g==='morris'||g==='point'||g==='bagh'||g==='equations'||g==='wallGo'||g==='colorLink'
export const minSeats=(g:Game,solo=false)=>g==='montage'?(solo?1:2):g==='knight'||g==='divine'||g==='codeLock'||g==='pyramid'||g==='fragments'||g==='spot'||g==='scale'||g==='fence'||g==='tower'||g==='piece'||g==='memoryPoker'||isPuzzle(g)?1:g==='remove'||g==='secret'?3:2
export const simultaneous=(g:Game)=>!isDuel(g)&&g!=='mancala'&&g!=='piece'&&g!=='montage'&&g!=='heavy13'&&!isGrass(g)
export function start(game:Game,seats:string[],window:number,now:number,options:{seed?:number,size?:TourSize,closed?:boolean,divineSide?:DivineSide,divineHard?:boolean,solo?:boolean,fragmentStrict?:boolean,fragmentCount?:FragmentCount,memoryPokerPeek?:boolean,memoryDuelDeal?:MemoryDuelDeal,holdAuction?:boolean}={}):State{
 if(new Set(seats).size!==seats.length||seats.length<minSeats(game,options.solo)||seats.length>(game==='heavy13'?7:game==='mancala'?8:game==='grass1'?12:16)||(isDuel(game)&&seats.length!==2))throw Error('Invalid seats')
 const {size=5,closed=false,seed=31337}=options
 const tour=game==='knight'?tourRoute(size,closed,seed):[]
 const memoryDuel=game==='memoryPoker'&&options.memoryDuelDeal?memoryDuelStart([seats[0],seats[1]],options.memoryDuelDeal,now):null
 if(memoryDuel&&seats.length!==2)throw Error('Invalid duel seats')
 const hands=game==='remove'?Object.fromEntries(deal(seats.length,seed).map((cards,i)=>[seats[i],cards])):{}
 const timeHold=game==='auction'&&options.holdAuction?timeHoldStart(seats,now):null
 const heavy13=game==='heavy13'?heavy13Start(seats,now,{lockMs:window,actionMs:window,marker:(seed>>>0)%seats.length}):null
 return {colorLink:game==='colorLink'?colorLinkStart(seats,now,window):null,heavy13,timeHold,montage:game==='montage'?montageStart(seats,seed,now,options.solo?'practice':'match'):null,wallGo:game==='wallGo'?wallGoStart(seats):null,memoryDuel,memoryPoker:game==='memoryPoker'&&!memoryDuel?memoryPokerStart(seed,seats,now,options.memoryPokerPeek):null,piece:game==='piece'?pieceStart(seed):null,tower:game==='tower'?towerStart(seed,seats.length):null,fence:game==='fence'?fenceStart(seed,seats):null,scale:game==='scale'?scaleStart(seed):null,spot:game==='spot'?spotStart(seed,seats):null,fragments:game==='fragments'?fragmentStart(seed,options.fragmentStrict??false,options.fragmentCount??12):null,pyramid:game==='pyramid'?pyramidStart(seed,1):null,codeLock:game==='codeLock'?codeStart(seats.length,seed,options.solo??false):null,equations:game==='equations'?equationStart():null,divine:game==='divine'?divineInit(options.divineSide??7,seed,options.divineHard??false,seats):null,grass:isGrass(game)?grassStart(game,seats.length,seed):null,bagh:game==='bagh'?baghInit():null,secret:game==='secret'?initSecret(seats.length,seed):null,mancala:game==='mancala'?makeMancala(seats.length):null,game,seats,blindCovers:game==='blind'?Array(blindCellCount).fill(null):null,board:Array(game==='blind'?blindCellCount:game==='morris'?24:game==='point'?169:0).fill(''),turn:0,capture:false,placed:[0,0],winner:null,done:false,round:1,deadline:memoryDuel?.deadline??now+(game==='memoryPoker'?memoryPokerStudy:game==='hex'?30000:game==='fragments'?45000:game==='spot'?spotWindow:game==='scale'?scaleWindow:game==='fence'?fenceTime:game==='tower'?towerTime:game==='piece'?pieceTime:window),window,puzzleStage:game==='hex'?'study':'answer',opened:now,spent:seats.map(()=>0),bids:{},scores:seats.map(()=>game==='remove'?5*720720:game==='knight'?720720:0),credits:seats.map(()=>60000),last:null,plies:0,quiet:0,history:{},publicMoves:[],hands,seed,paths:Object.fromEntries(seats.map(id=>[id,tour.slice(0,1)])),tour,size,closed,reached:isPuzzle(game)?{}:Object.fromEntries(seats.map(id=>[id,now])),reveal:null}
}
export function schedule(ids:string[]):string[][] {
 const ring=[...ids]; if(ring.length%2)ring.push('')
 const rounds:string[][]=[]
 for(let k=0;k<ring.length-1;k++){
  for(let i=0;i<ring.length/2;i++){const a=ring[i],b=ring[ring.length-1-i];if(a&&b)rounds.push(k%2?[b,a]:[a,b])}
  ring.splice(1,0,ring.pop()!)
 }
 return [...rounds,...rounds.map(([a,b])=>[b,a])]
}
const inMill=(board:string[],i:number)=>mills.some(m=>m.includes(i)&&m.every(j=>board[j]===board[i]))
const complete=(g:State,winner:string|null)=>({...g,winner,done:true})
const own=(g:State,seat:string)=>g.board.reduce<number[]>((ls,v,i)=>v===seat?[...ls,i]:ls,[])
function legal(g:State,seat:string):BoardAction[]{
 if(g.done)return []
 if(g.grass||g.divine||g.equations||g.codeLock||g.pyramid||g.fragments||g.spot||g.scale||g.fence||g.tower||g.piece||g.memoryPoker||g.memoryDuel||g.wallGo||g.montage||g.heavy13||g.colorLink)return []
 if(g.bagh)return g.seats[g.turn]===seat?baghActions(g.bagh,g.turn):[]
 if(g.mancala){
  if(g.seats[g.turn]!==seat)return []
  const setup=g.mancala.placements<g.seats.length*4
  return g.mancala.pits.flatMap((p,i)=>(setup?p.length<2:p.includes(g.turn))?[i]:[])
 }
 if(g.game==='knight'){const path=g.paths[seat];return path?[...tourLegal(path,g.size,g.closed),...(path.length>1?[-1]:[])]:[]}
 if(g.game==='remove')return g.hands[seat]&&!Object.hasOwn(g.bids,seat)?[0,1]:[]
 if(g.game==='auction'||g.seats[g.turn]!==seat)return []
 const opens=g.board.reduce<number[]>((ls,v,i)=>v===''?[...ls,i]:ls,[])
 if(g.game==='blind'||g.game==='point')return opens
 if(g.capture){
  const opponent=own(g,g.seats[1-g.turn])
  const exposed=opponent.filter(i=>!inMill(g.board,i))
  return exposed.length?exposed:opponent
 }
 if(g.placed[g.turn]<9)return opens
 const pieces=own(g,seat)
 return pieces.flatMap(from=>opens.filter(to=>pieces.length===3||neighbors(from,to)).map(to=>({from,to})))
}
function next(g:State):State{
 g.turn=1-g.turn
 if(g.game==='morris'&&g.placed[g.turn]>=9&&(own(g,g.seats[g.turn]).length<3||!legal(g,g.seats[g.turn]).length))return complete(g,g.seats[1-g.turn])
 if(g.game==='morris'&&g.placed.every(n=>n===9)){
  const key=g.turn+':'+g.board.join(',')
  const count=(g.history[key]??0)+1
  g.history={...g.history,[key]:count}
  if(count>=3||g.quiet>=50)return complete(g,null)
 }
 return g
}
export const reward=(round:number)=>[1,2,4,3,5,3,2,5][round-1]
function settle(g:State,now:number):State {
 const bids=g.seats.map(s=>g.bids[s]??0), high=Math.max(...bids), tied=bids.filter(v=>v===high).length
 // 720720 is divisible by all possible tied counts up to 16. Score units stay exact.
 const scores=g.scores.map((score,i)=>score+(high>0&&bids[i]===high?720720*reward(g.round)/tied:0))
 const updated={...g,last:bids,scores,credits:g.credits.map((n,i)=>n-bids[i]),bids:{}}
 if(g.round===8||updated.credits.every(c=>c===0)){const leaders=g.seats.filter((_,i)=>scores[i]===Math.max(...scores));const best=Math.max(...leaders.map(s=>updated.credits[g.seats.indexOf(s)]));const tied=leaders.filter(s=>updated.credits[g.seats.indexOf(s)]===best);return complete(updated,tied.length===1?tied[0]:null)}
 return {...updated,round:g.round+1,deadline:now+g.window}
}
function settleRemove(g:State,now:number):State{
 const kept=g.seats.map(s=>Object.hasOwn(g.bids,s)?g.hands[s][1-g.bids[s]].value:0)
 const best=lowestUnique(kept),winner=best?g.seats[kept.indexOf(best)]:null
 const scores=g.scores.map((v,i)=>v+(g.seats[i]===winner?2*720720:0))
 const top=g.seats.filter((_,i)=>scores[i]===Math.max(...scores))
 const scored={...g,last:kept,scores,bids:{},reveal:{round:g.round,winner}}
 if(g.round>=8&&(top.length===1||g.round>=11))return complete(scored,top.length===1?top[0]:null)
 const seed=(Math.imul(g.seed^g.round,1664525)+1013904223)>>>0
 return {...scored,round:g.round+1,deadline:now+g.window,seed,hands:Object.fromEntries(deal(g.seats.length,seed).map((cards,i)=>[g.seats[i],cards]))}
}
function settlePuzzle(g:State,now:number):State{
 const scores=g.scores
 const next={...g,last:g.seats.map(seat=>g.reached[seat]===1?1:0),bids:{},reached:{}}
 if(isPuzzle(g.game)&&g.round===puzzleRounds(g.game)){
  const top=g.seats.map((_,i)=>i).sort((a,b)=>scores[b]-scores[a]||g.spent[a]-g.spent[b])
  const [a,b]=top
  return complete(next,b===undefined||scores[a]>scores[b]||g.spent[a]<g.spent[b]?g.seats[a]:null)
 }
 const study=g.game==='hex'&&g.round===4
 return {...next,round:g.round+1,puzzleStage:study?'study':'answer',opened:now,deadline:now+(study?30000:g.window)}
}
function finishSecret(g:State){
 const scores=g.seats.map((_,i)=>secretScore(g.secret!,i)*720720)
 const top=g.seats.filter((_,i)=>scores[i]===Math.max(...scores))
 return complete({...g,scores},top.length===1?top[0]:null)
}
function settleCode(g:State,now:number):State{
 const s=g.codeLock!
 const points=codeScores(s)
 const solved=points.indexOf(4)
 if(solved<0&&!g.seats.every((_,i)=>codeClosed(s,i,now,g.deadline)))return g
 const top=Math.max(...points)
 const leaders=g.seats.filter((_,i)=>points[i]===top)
 return complete({...g,scores:points.map(n=>n*720720)},solved>=0?g.seats[solved]:top>0&&leaders.length===1?leaders[0]:null)
}
function settlePyramid(g:State,now:number):State{
 const answers=g.pyramid!.answers
 const last=g.seats.map(id=>answers[id]?.points??0)
 const scores=g.scores.map((n,i)=>n+last[i]*720720)
 const spent=g.spent.map((t,i)=>t+(answers[g.seats[i]]?.elapsed??0))
 if(g.round===pyramidRounds){
  const leaders=g.seats.map((_,i)=>i).sort((a,b)=>scores[b]-scores[a]||spent[a]-spent[b])
  const [a,b]=leaders
  return complete({...g,last,scores,spent},scores[a]>0&&(b===undefined||scores[a]!==scores[b]||spent[a]!==spent[b])?g.seats[a]:null)
 }
 return {...g,last,scores,spent,round:g.round+1,opened:now,deadline:now+g.window,pyramid:pyramidStart(g.seed,g.round+1)}
}
function settleFragment(g:State,correct:boolean,now:number):State{
 const f=g.fragments!,total=f.deal.questions.length
 const points=f.correct+Number(correct)
 const next={...f,correct:points,last:correct}
 if(g.round>=total||f.strict&&!correct)return complete({...g,fragments:{...next,passed:points>=fragmentNeed(f.strict,total)}},null)
 return {...g,fragments:next,turn:(g.turn+1)%g.seats.length,round:g.round+1,opened:now,deadline:now+20000}
}
function settleSpot(g:State,now:number):State{
 const spot=g.spot!
 if(!g.seats.every(id=>spotClosed(spot,id,now-g.opened)))return g
 const results=g.seats.map(id=>spotScore(spot.players[id]))
 const ranked=g.seats.map((_,i)=>i).sort((a,b)=>results[b][0]-results[a][0]||results[a][1]-results[b][1])
 const [a,b]=ranked
 return complete({...g,scores:results.map(([points])=>points*720720)},results[a][0]>0&&(b===undefined||results[a][0]!==results[b][0]||results[a][1]!==results[b][1])?g.seats[a]:null)
}
function settleFence(g:State):State{
 const results=fenceScores(g.fence!)
 const sorted=results.slice().sort((a,b)=>Number(b.elapsed!==null)-Number(a.elapsed!==null)||b.points-a.points||(a.elapsed??Infinity)-(b.elapsed??Infinity))
 const [best,next]=sorted
 const winner=(best.elapsed!==null||best.points>0)&&(!next||best.elapsed!==next.elapsed||best.points!==next.points)?best.id:null
 return complete({...g,scores:results.map(r=>r.points*720720)},winner)
}
function syncMemoryPoker(g:State,memoryPoker:MemoryPoker):State{
 return g.memoryPoker===memoryPoker?g:{...g,memoryPoker,round:memoryPoker.round,deadline:memoryPoker.deadline,
  scores:memoryPoker.scores,winner:memoryPoker.winner,done:memoryPoker.phase==='finished'}
}
export const memoryDuelTiePause=3500
function syncMemoryDuel(g:State,memoryDuel:MemoryDuelState):State{
 const winner=memoryDuel.result?.winner??null
 return g.memoryDuel===memoryDuel?g:{...g,memoryDuel,round:memoryDuel.dealNumber,
  deadline:memoryDuel.phase==='tie'?memoryDuel.openedAt+memoryDuelTiePause:memoryDuel.deadline??memoryDuel.openedAt,
  winner,done:memoryDuel.phase==='finished',scores:g.seats.map(seat=>seat===winner?720720:0)}
}
export function redealMemoryDuel(g:State,deck:MemoryDuelDeal,now:number):State{
 if(!g.memoryDuel||g.memoryDuel.phase!=='tie'||now<g.deadline)return g
 const duel=memoryDuelRedeal(g.memoryDuel,deck,now)
 return duel?syncMemoryDuel(g,duel):g
}
function stepWallGo(g:State,seat:string,action:number,now:number):State|null{
 const wallGo=g.wallGo&&wallGoPlay(g.wallGo,seat,action)
 if(!wallGo)return null
 const scores=wallGoTerritory(wallGo.pawns,wallGo.walls).scores.map(n=>n*720720)
 return {...g,wallGo,turn:wallGo.turn,plies:wallGo.turns,publicMoves:[...g.publicMoves,action],
  opened:now,deadline:now+g.window,winner:wallGo.winner,done:wallGo.end!==null,scores}
}
export function syncTimeHold(g:State,timeHold:TimeHold):State{
 if(g.timeHold===timeHold)return g
 const final=timeHold.phase==='finished'?timeHoldView(timeHold,null,timeHold.lastHostAt):null
 return {...g,timeHold,round:timeHold.round,done:!!final,winner:final?.winner??null,scores:timeHold.tokens.map(n=>n*720720)}
}
function syncMontage(g:State,montage:Montage):State{
 return montage===g.montage?g:{...g,montage,round:montage.round,deadline:montage.nextAt??0,
  done:montage.phase==='finished',scores:montage.pieces.map(p=>p*720720)}
}
export function openMontageRound(g:State,round:number,now:number):State{
 const m=g.montage
 if(!m||round!==m.round+(m.phase==='between'?1:0))return g
 return syncMontage(g,montageOpenRound(m,now))
}
export function submitMontageBuzz(g:State,seat:string,command:MontageCommand,now:number){
 if(!g.montage)return {game:g,result:'not-live' as const}
 const {state,result}=montageBuzz(g.montage,seat,command,now)
 return {game:syncMontage(g,state),result}
}
// Place consumes a base turn (+2); a pass and its later return each
// increase the slot by one. Slots never repeat within one revealed round.
export function heavy13Slot(s:Heavy13){
 return s.phase==='resolve'?2*(s.order.length-s.pending.length)-s.deferred.length:null
}
function syncHeavy13(g:State,heavy13:Heavy13):State{
 if(heavy13===g.heavy13)return g
 const current=heavy13.pending[0]??heavy13.deferred.at(-1)
 return {...g,heavy13,round:heavy13.round,turn:current??0,deadline:heavy13.deadline??0,
  opened:heavy13.openedAt,done:heavy13.phase==='finished',winner:heavy13.winner,scores:heavy13.penalties.map(n=>n*720720)}
}
export function playHeavy13(g:State,seat:string,action:unknown,now:number):State|null{
 const next=g.heavy13&&heavy13Action(g.heavy13,seat,action,now)
 return next?syncHeavy13(g,next):null
}
function syncColorLink(g:State,colorLink:ColorLink):State{
 return colorLink===g.colorLink?g:{...g,colorLink,round:colorLink.round,turn:colorLink.actor===g.seats[1]?1:0,
  deadline:colorLink.deadline??0,done:colorLink.phase==='finished',winner:colorLink.winner,scores:colorLink.score.map(n=>n*720720)}
}
export function playColorLink(g:State,seat:string,action:LinkAction,now:number):State|null{
 const next=g.colorLink&&colorLinkAct(g.colorLink,seat,action,now)
 return next?syncColorLink(g,next):null
}
export function timeout(g:State,now:number):State {
 if(g.colorLink)return syncColorLink(g,colorLinkTick(g.colorLink,now))
 if(g.heavy13)return syncHeavy13(g,heavy13Tick(g.heavy13,now))
 if(g.montage)return syncMontage(g,montageAdvance(g.montage,now))
 if(g.timeHold)return syncTimeHold(g,timeHoldAdvance(g.timeHold,now))
 if(g.memoryDuel)return syncMemoryDuel(g,memoryDuelTick(g.memoryDuel,now))
 if(g.memoryPoker)return syncMemoryPoker(g,memoryPokerTick(g.memoryPoker,now))
 if(g.spot&&!g.done)return settleSpot(g,now)
 if(g.codeLock&&!g.done)return settleCode(g,now)
 if(g.done||now<g.deadline)return g
 if(g.wallGo){
  const v=wallGoView(g.wallGo),action=wallGoFallback(v)
  return v.turn!==null&&action!==undefined?stepWallGo(g,v.turn,action,now)??g:g
 }
 if(g.fragments)return g.fragments.study?{...g,opened:now,deadline:now+20000,fragments:{...g.fragments,study:false}}:settleFragment(g,false,now)
 if(g.piece||g.tower)return complete(g,null)
 if(g.fence)return settleFence(g)
 if(g.scale)return complete(g,null)
 if(g.pyramid)return settlePyramid(g,now)
 if(g.divine)return complete(g,null)
 if(g.secret){
  if(g.secret.phase==='guess')return finishSecret(g)
  const round=g.round+1
  return {...g,round,opened:now,deadline:now+(round===5?90000:g.window),secret:{...g.secret,used:[],offers:[],phase:round===5?'guess':'contact'}}
 }
 if(isPuzzle(g.game))return g.puzzleStage==='study'?{...g,puzzleStage:'answer',opened:now,deadline:now+g.window}:settlePuzzle(g,now)
 if(g.game==='auction')return settle(g,now)
 if(g.game==='remove')return settleRemove(g,now)
 if(g.game==='knight'){
  const best=Math.max(...g.scores)
  const leaders=g.seats.filter((_,i)=>g.scores[i]===best).sort((a,b)=>g.reached[a]-g.reached[b])
  return complete(g,leaders.length===1||g.reached[leaders[0]]<g.reached[leaders[1]]?leaders[0]:null)
 }
 return g
}
export function move(old:State,seat:string,a:Action,now:number,expectedMemoryDeal?:number):State|null{
 const idx=old.seats.indexOf(seat)
 if(idx<0||old.done||old.timeHold||old.montage||old.heavy13||old.colorLink)return null
 if(old.wallGo)return now<old.deadline&&typeof a==='number'?stepWallGo(old,seat,a,now):null
 let cover:BlindCover|undefined
 if(typeof a==='number'&&a>=blindCoverBase){
  const code=a-blindCoverBase
  if(old.game!=='blind'||!Number.isInteger(code)||code>=blindCellCount*blindCoverIds.length)return null
  cover=blindCoverIds[code%blindCoverIds.length]
  a=Math.floor(code/blindCoverIds.length)
 }
 if(old.memoryDuel){
  if(typeof a!=='number'||expectedMemoryDeal===undefined)return null
  const duel=memoryDuelAction(old.memoryDuel,seat,expectedMemoryDeal,a,now)
  return duel?syncMemoryDuel(old,duel):null
 }
 if(old.memoryPoker){
  if(typeof a!=='number')return null
  const poker=memoryPokerAction(old.memoryPoker,seat,a,now)
  return poker?syncMemoryPoker(old,poker):null
 }
 if(old.piece){
  if(idx!==old.turn||now>=old.deadline||typeof a!=='number')return null
  const piece=pieceStep(old.piece,a)
  if(!piece)return null
  const deadline=old.deadline-(a===pieceClue?pieceHintCost:0)
  const next={...old,piece,deadline}
  const {filled,total}=pieceResult(piece)
  if(filled===total)return complete({...next,piece:{...piece,adjustedMs:Math.max(0,now-old.opened)+piece.hints*pieceHintCost}},null)
  return now>=deadline?complete(next,null):{...next,turn:(old.turn+1)%old.seats.length,round:old.round+1}
 }
 if(old.tower){
  if(idx!==old.turn||now>=old.deadline||typeof a!=='number')return null
  const tower=towerEdit(old.tower,a)
  if(!tower)return null
  const next={...old,tower}
  return towerCheck(tower).passed||old.round>=tower.limit?complete(next,null):{...next,turn:(old.turn+1)%old.seats.length,round:old.round+1}
 }
 if(old.fence){
  if(typeof a!=='number'||now>=old.deadline)return null
  const fence=fencePlay(old.fence,seat,a,Math.max(0,now-old.opened))
  if(!fence)return null
  const next={...old,fence}
  return Object.values(fence.players).every(p=>p.solvedAt!==null)?settleFence(next):next
 }
 if(old.scale){
  if(idx!==old.turn||now>=old.deadline||typeof a!=='number')return null
  const scale=scaleMove(old.scale,a)
  if(!scale)return null
  return scale.answer?complete({...old,scale},null):{...old,scale,turn:(old.turn+1)%old.seats.length,round:old.round+1}
 }
 if(old.spot){
  if(typeof a!=='number')return null
  const spot=spotPlay(old.spot,seat,a,Math.max(0,now-old.opened))
  return spot?settleSpot({...old,spot},now):null
 }
 if(old.fragments){
  if(old.fragments.study||idx!==old.turn||now>=old.deadline||typeof a!=='number'||!Number.isInteger(a)||a<0||a>3)return null
  const q=old.fragments.deal.questions[old.round-1]
  return settleFragment(old,q.options[a]===q.answer,now)
 }
 if(old.pyramid){
  if(typeof a!=='number'||now>=old.deadline)return null
  const pyramid=pyramidAnswer(old.pyramid,seat,a,Math.max(0,now-old.opened))
  if(!pyramid)return null
  const g={...old,pyramid}
  return Object.keys(pyramid.answers).length===g.seats.length?settlePyramid(g,now):g
 }
 if(old.codeLock){
  if(typeof a!=='number')return null
  const codeLock=codeMove(old.codeLock,idx,a,now,old.deadline)
  return codeLock?settleCode({...old,codeLock},now):null
 }
 if(old.equations){
  if(typeof a!=='string')return null
  const equations=equationPlay(old.equations,idx,a)
  if(!equations)return null
  const g={...old,equations,turn:equations.turn}
  return equations.phase==='done'?complete(g,equations.winner===null?null:g.seats[equations.winner]):g
 }
 if(typeof a==='string')return null
 if(old.divine){
  if(typeof a!=='number'||now>=old.deadline)return null
  const divine=divinePlay(old.divine,seat,a)
  if(!divine)return null
  const g={...old,divine}
  return magicCheck(divine.entries[seat],divine.side)?complete({...g,scores:g.scores.map((v,i)=>i===idx?720720:v)},seat):g
 }
 if(old.grass){
  if(typeof a!=='number')return null
  const grass=grassStep(old.grass,idx,a,old.seed)
  if(!grass)return null
  const ranks=old.seats.map((_,i)=>grassRank(grass,i))
  const best=Math.max(...ranks.map(([a,b])=>a*1000+b))
  const winners=old.seats.filter((_,i)=>ranks[i][0]*1000+ranks[i][1]===best)
  const next={...old,grass,turn:grass.order[grass.position],round:grass.round,scores:ranks.map(([a])=>a*720720)}
  return grass.done?complete(next,winners.length===1?winners[0]:null):next
 }
 if(old.secret){
  if(typeof a!=='number'||now>=old.deadline)return null
  const secret=secretStep(old.secret,idx,a,old.round)
  if(!secret)return null
  const g={...old,secret}
  return secret.phase==='guess'&&secret.guesses.every(Boolean)?finishSecret(g):g
 }
 if(old.bagh){
  if(idx!==old.turn)return null
  const bagh=baghStep(old.bagh,idx,a)
  if(!bagh)return null
  const turn=1-idx,g={...old,bagh,turn}
  if(bagh.captured>=5)return complete(g,old.seats[1])
  if((turn===1||!bagh.banked)&&!baghActions(bagh,turn).length)return complete(g,old.seats[idx])
  const key=turn+':'+bagh.banked+':'+bagh.board.join('')
  const count=(old.history[key]??0)+1
  g.history={...old.history,[key]:count}
  return count>=3||bagh.turns>=100?complete(g,null):g
 }
 if(old.mancala){
  if(idx!==old.turn||typeof a!=='number'||!Number.isInteger(a))return null
  const mancala=old.mancala.placements<old.seats.length*4?plant(old.mancala,a,idx):sow(old.mancala,a,idx)
  if(!mancala)return null
  const g={...old,mancala,turn:(idx+1)%old.seats.length,scores:mancala.points.map(p=>720720*balance(p))}
  if(mancala.sows<12*old.seats.length)return g
  const top=old.seats.map((_,i)=>i).sort((i,j)=>compare(mancala.points[j],mancala.points[i]))
  return complete(g,compare(mancala.points[top[0]],mancala.points[top[1]])>0?old.seats[top[0]]:null)
 }
 if(isPuzzle(old.game)){
  if(old.puzzleStage!=='answer'||now>=old.deadline||Object.hasOwn(old.bids,seat)||typeof a!=='number'||!Number.isInteger(a)||a<0)return null
  const p=makePuzzle(old.game,old.seed,old.round)
  const line=hexLines()[a]
  const limit=old.game==='cubes'?p.rows*p.cols*4:p.rows*(p.rows+1)*p.cols*(p.cols+1)/4
  if(old.game==='hex'?!line:a>limit)return null
  const correct=old.game==='hex'?line.reduce((sum,i)=>sum+p.values[i],0)===p.target:a===(old.game==='cubes'?total(p.values):countRectangles(p.values,p.rows,p.cols,p.target))
  const g={...old,bids:{...old.bids,[seat]:a},reached:{...old.reached,[seat]:correct?1:0},
   scores:old.scores.map((n,i)=>i===idx&&correct?n+720720:n),spent:old.spent.map((n,i)=>i===idx&&correct?n+Math.max(0,now-old.opened):n)}
  return Object.keys(g.bids).length===g.seats.length?settlePuzzle(g,now):g
 }
 if(old.game==='knight'){
  if(typeof a!=='number'||now>=old.deadline||!legal(old,seat).includes(a))return null
  const path=a===-1?old.paths[seat].slice(0,-1):[...old.paths[seat],a]
  const better=path.length*720720>old.scores[idx]
  const g={...old,paths:{...old.paths,[seat]:path},scores:old.scores.map((n,i)=>i===idx&&better?path.length*720720:n),reached:better?{...old.reached,[seat]:now}:old.reached}
  return path.length===old.size*old.size?complete(g,seat):g
 }
 if(old.game==='remove'){
  if(typeof a!=='number'||now>=old.deadline||!legal(old,seat).includes(a))return null
  const g={...old,bids:{...old.bids,[seat]:a}}
  return Object.keys(g.bids).length===g.seats.length?settleRemove(g,now):g
 }
 if(old.game==='auction'){
  if(typeof a!=='number'||!Number.isInteger(a)||a<0||a>Math.min(old.credits[idx],15000)||Object.hasOwn(old.bids,seat)||now>=old.deadline)return null
  const g={...old,bids:{...old.bids,[seat]:a}}
  return Object.keys(g.bids).length===g.seats.length?settle(g,now):g
 }
 if(!legal(old,seat).some(l=>typeof l==='number'?l===a:typeof a==='object'&&a!==null&&a.from===l.from&&a.to===l.to))return null
 const g={...old,board:[...old.board],placed:[...old.placed],plies:old.plies+1}
 if(g.capture){g.board[a as number]='';g.capture=false;g.quiet=0;return next(g)}
 const i=typeof a==='number'?a:a.to
 if(typeof a!=='number'){g.board[a.from]='';g.quiet++}
 g.board[i]=seat
 if(g.game==='point'){
  let scored=0
  for(const [dx,dy] of [[1,0],[0,1],[1,1],[1,-1]]){
   let [a,b]=[0,0]
   for(const sign of [-1,1])for(let k=1;k<13;k++){
    const x=i%13+sign*dx*k,y=Math.floor(i/13)+sign*dy*k
    if(x<0||x>12||y<0||y>12||g.board[y*13+x]!==seat)break
    if(sign===-1)a++;else b++
   }
   const count=a+b+1
   scored+=count===3?1:count===4?2:count>=5&&a<5&&b<5?5:0
  }
  g.scores=g.scores.map((n,j)=>n+(j===idx?scored*720720:0))
  return g.plies>=40?complete(g,g.scores[0]===g.scores[1]?null:g.seats[g.scores[0]>g.scores[1]?0:1]):next(g)
 }
 if(g.game==='blind'){
  const covers=g.blindCovers!.slice()
  // The automatic cover depends on the public cell/ply and a game seed,
  // never on the stone's hidden side.
  const colorSeed=(g.seed^Math.imul(i+1,0x9e3779b9)^Math.imul(g.plies,0x85ebca6b))>>>0
  covers[i]=cover??blindCoverIds[colorSeed%blindCoverIds.length]
  g.blindCovers=covers
  g.publicMoves=[...g.publicMoves,i]
  const x=i%15,y=Math.floor(i/15)
  const longest=[[1,0],[0,1],[1,1],[1,-1]].some(([dx,dy])=>{
   let n=1
   for(const sign of [-1,1])for(let k=1;k<5;k++){
    const px=x+k*dx*sign,py=y+k*dy*sign
    if(px<0||px>14||py<0||py>14||g.board[py*15+px]!==seat)break
    n++
   }
   return n>=5
  })
  return longest?complete(g,seat):g.plies>=100||g.board.every(Boolean)?complete(g,null):next(g)
 }
 if(typeof a==='number')g.placed[g.turn]++
 if(inMill(g.board,i)&&own(g,g.seats[1-g.turn]).length){g.capture=true;return g}
 return next(g)
}
export function view(g:State,seat:string,now=g.timeHold?.lastHostAt??g.memoryDuel?.openedAt??0){
 const p=isPuzzle(g.game)?makePuzzle(g.game,g.seed,g.round):null
 const puzzle=p?{...p,values:g.game==='hex'&&g.puzzleStage==='answer'?[]:p.values,target:g.game==='cubes'||g.puzzleStage==='study'?null:p.target,stage:g.puzzleStage}:null
 const scores=isPuzzle(g.game)?g.scores.map((v,i)=>v-(g.reached[g.seats[i]]===1?720720:0)):g.scores
 const knightElapsedMs=g.game==='knight'&&g.done&&g.seats.includes(seat)&&g.paths[seat]?.length===g.size*g.size
  ?Math.max(0,g.reached[seat]-g.opened):undefined
 return {...(knightElapsedMs===undefined?{}:{knightElapsedMs}),colorLink:g.colorLink?colorLinkView(g.colorLink):null,heavy13:g.heavy13?{...heavy13View(g.heavy13,seat),slot:heavy13Slot(g.heavy13)}:null,timeHold:g.timeHold?timeHoldView(g.timeHold,seat,now):null,puzzle,montage:g.montage?montageView(g.montage,seat):null,wallGo:g.wallGo?wallGoView(g.wallGo):null,memoryDuel:g.memoryDuel?memoryDuelView(g.memoryDuel,seat,now):null,memoryPoker:g.memoryPoker?memoryPokerView(g.memoryPoker,seat):null,piece:g.piece?pieceView(g.piece):null,tower:g.tower?towerView(g.tower,g.done):null,fence:g.fence?fenceView(g.fence,seat,g.done):null,scale:g.scale?scaleView(g.scale,g.done):null,spot:g.spot?spotView(g.spot,seat,g.done):null,fragments:g.fragments?fragmentView(g.fragments,g.round,g.done):null,pyramid:g.pyramid?pyramidView(g.pyramid,seat):null,codeLock:g.codeLock?codeView(g.codeLock,g.seats.indexOf(seat),g.done):null,equations:g.equations?equationView(g.equations,g.seats.indexOf(seat)):null,divine:g.divine?divineView(g.divine,seat):null,grass:g.grass,bagh:g.bagh,secret:g.secret?secretView(g.secret,g.seats.indexOf(seat),g.done):null,mancala:g.mancala,game:g.game,seats:g.seats,board:g.board.map(v=>g.game==='blind'&&!g.done&&v?'?':v),blindCovers:g.blindCovers?.slice()??null,turn:g.seats[g.turn],capture:g.capture,done:g.done,winner:g.winner,round:g.round,deadline:g.heavy13?g.heavy13.deadline:g.montage?g.montage.nextAt:!g.timeHold&&(simultaneous(g.game)||g.game==='piece'||g.wallGo&&!g.done)?g.deadline:null,mine:g.timeHold?null:g.bids[seat]??null,submitted:g.timeHold?0:Object.keys(g.bids).length,credits:g.timeHold?[]:g.credits,scores:scores.map(s=>s/720720),last:g.timeHold?null:g.last,legal:legal(g,seat),hand:g.game==='remove'&&!g.done?g.hands[seat]??[]:[],path:g.game==='knight'?g.paths[seat]??[]:[],size:g.size,closed:g.closed,reveal:g.reveal}
}
export type GameView=ReturnType<typeof view>
/** Uses the current seat's view, public move order, and a dedicated policy seed.
 * The policy never receives the seed used to deal hidden information. */
export function botAction(v:GameView,seat:string,observed:number[]=[],seed=0,level:BotLevel='normal',rejected?:ReadonlySet<number>):Action|undefined{
 if(v.done||v.timeHold||v.montage||!v.seats.includes(seat))return
 if(v.heavy13)return heavy13Bot(v.heavy13,seed,level)
 if(v.wallGo)return wallGoBot(v.wallGo,seat,seed,level,rejected)
 const index=v.seats.indexOf(seat)
 if(v.secret?.phase==='contact')return secretBotContact(v.secret,index,v.seats.length,rejected)
 if(level==='normal')return normalBotAction(v,seat,observed,seed)
 const publicTurn=v.mancala?v.mancala.placements+v.mancala.sows:v.bagh?.turns??v.equations?.rows.length??observed.length
 const position=v.game==='point'||v.game==='morris'?v.board.reduce((hash,cell,i)=>cell?Math.imul(hash^(3*i+v.seats.indexOf(cell)+1),16777619):hash,0):0
 const rng=botRandom(seed^Math.imul(index+1,0x9e3779b9)^Math.imul(v.round,0x85ebca6b)^Math.imul(publicTurn,0x27d4eb2d)^position)
 if(v.equations)return v.turn===seat?equationPolicy(v.equations,seed^index,level,rng):undefined
 if(v.grass)return grassPolicy(v.grass,index,level,rng)
 if(v.secret){
  if(v.secret.locked)return
  if(level==='easy'){
   const options=candidates(v.secret.clues.slice(-1))
   return guessAction(options[Math.floor(rng()*options.length)]??1,null,null)
  }
  return secretAdvanced(v.secret.clues)
 }
 if(v.game==='auction'){
  if(v.mine!==null)return
  const budget=v.credits[index]
  const cap=Math.min(15000,budget)
  const baseline=normalBid(budget,v.round)
  if(level==='easy')return Math.floor(baseline*(.33+.32*rng()))
  const bids=v.credits.filter((_,i)=>i!==index).map(n=>normalBid(n,v.round))
  if(v.round===8)return cap
  // Use a stable profile per seat rather than marching in lockstep above
  // the same nominal bid. Same budgets can still tie at a hard cap.
  const profile=((seed>>>0)+index)&15
  const target=Math.max(...bids)+1+profile*(reward(v.round)>=4?29:13)
  // Don't exhaust the bank to chase another player on a low-value lot.
  const reserveCap=Math.ceil(budget*(reward(v.round)>=4?.42+profile*.005:.15+profile*.003))
  return Math.min(cap,reserveCap,target)
 }
 if(!v.legal.length)return
 if(level==='easy'&&['blind','morris','point','remove','bagh','mancala'].includes(v.game)){
  return v.legal[Math.floor(rng()*v.legal.length)]
 }
 if(v.game==='remove')return removeAdvanced(v,rng)
 if(v.bagh)return bestAction(v.legal,a=>{
  const next=baghStep(v.bagh!,index,a)!
  const score=(board:Bagh)=>{
   if(board.captured>=5)return index===1?10000:-10000
   const replies=baghActions(board,1)
   if(!replies.length)return index===1?-10000:10000
   const tigerScore=100*board.captured+replies.length
   return index===1?tigerScore:-tigerScore
  }
  const replies=baghActions(next,1-index)
  if(next.captured>=5||index===0&&!replies.length||index===1&&!next.banked&&!replies.length)return 60000
  const worst=replies.length?Math.min(...replies.map(b=>score(baghStep(next,1-index,b)!))):score(next)
  return worst*5+score(next)
 })
 if(v.mancala)return mancalaAdvanced(v.mancala,index,v.legal)
 if(v.game==='blind'){
  const remembered=v.board.map<string>(mark=>mark?'?':'')
  observed.forEach((point,k)=>{if(remembered[point])remembered[point]=v.seats[k%2]})
  const rival=v.seats[1-index]
  const projected={...v,board:remembered}
  return bestAction(v.legal,a=>{
   const i=a as number
   return Number(connectsFive(remembered,i,seat))*1000000+Number(connectsFive(remembered,i,rival))*100000+
    2*blindWeight(i,projected,seat)+blindWeight(i,projected,rival)
  })
 }
 if(v.game==='point')return bestAction(v.legal,a=>{
  const i=a as number
  return 100*pointGain(v.board,i,seat)+93*pointGain(v.board,i,v.seats[1-index])+pointWeight(i,v,seat)
 })
 if(v.game==='morris')return bestAction(v.legal,a=>morrisAdvanced(a,v,seat))
 return
}
function normalBotAction(v:GameView,seat:string,observed:number[],seed:number):Action|undefined{
 if(v.equations)return !v.done&&v.turn===seat?equationBot(v.equations,seed^v.seats.indexOf(seat)):undefined
 if(v.grass)return grassBot(v.grass,v.seats.indexOf(seat))
 if(v.game==='remove'){
  if(!v.legal.length)return
  return v.hand[0].value<=v.hand[1].value?1:0
 }
 if(v.bagh){
  const board=v.bagh,role=v.seats.indexOf(seat)
  const score=(a:BoardAction)=>{
   const next=baghStep(board,role,a)
   if(!next)return -Infinity
   return role===1?100*(next.captured-board.captured)+baghActions(next,1).length:-baghActions(next,1).length-100*baghActions(next,1).filter(x=>typeof x==='object'&&baghStep(next,1,x)!.captured>next.captured).length
  }
  return [...v.legal].sort((a,b)=>score(b)-score(a))[0]
 }
 if(v.secret)return v.secret.locked?undefined:guessAction(candidates(v.secret.clues)[0]??1,null,null)
 if(v.mancala){
  const m=v.mancala
  const index=v.seats.indexOf(seat)
  if(m.placements<v.seats.length*4)return [...v.legal].sort((a,b)=>m.pits[a as number].length-m.pits[b as number].length)[0]
  const weight=(a:Action)=>{
   const after=sow(m,a as number,index)
   if(!after)return -Infinity
   const opp=Math.max(...after.points.filter((_,i)=>i!==index).map(balance))
   return 40*(balance(after.points[index])-opp)+total(after.points[index])
  }
  return [...v.legal].sort((a,b)=>weight(b)-weight(a))[0]
 }
 if(v.game==='knight'||v.game==='divine'||v.game==='codeLock'||v.game==='pyramid'||v.game==='fragments'||v.game==='spot'||v.game==='scale'||v.game==='fence'||v.game==='tower'||v.game==='piece'||v.game==='memoryPoker'||isPuzzle(v.game))return
 if(v.game==='auction'){
  if(v.mine!==null||v.done)return
  const balance=v.credits[v.seats.indexOf(seat)]??0
  return normalBid(balance,v.round)
 }
 if(v.game==='point'){
  return [...v.legal].sort((i,j)=>pointWeight(j as number,v,seat)-pointWeight(i as number,v,seat))[0]
 }
 if(v.game==='blind'){
  const remembered=[...v.board]; observed.forEach((point,k)=>{remembered[point]=v.seats[k%2]===seat?seat:'?'});const mem={...v,board:remembered};return [...v.legal].sort((a,b)=>blindWeight(b as number,mem,seat)-blindWeight(a as number,mem,seat))[0]
 }
 return [...v.legal].sort((a,b)=>morrisWeight(b,v,seat)-morrisWeight(a,v,seat))[0]
}
type ContactView=ReturnType<typeof secretView>
// The same encoded move is an offer or an acceptance depending on what this
// seat can see. Keep their rejection memories distinct.
export function secretBotIntentKey(v:ContactView,index:number,action:number){
 return v.offers.some(o=>o.to===index&&contactAction(index,o.from,o.ticket)===action)?-action:action
}
function secretBotContact(v:ContactView,index:number,count:number,rejected?:ReadonlySet<number>){
 for(const o of v.offers)if(o.to===index&&v.tickets[o.ticket]>0){
  const action=contactAction(index,o.from,o.ticket)
  if(!rejected?.has(-action))return action
 }
 const byPartner=Array.from({length:count},(_,other)=>{
  if(other===index||v.used.includes(other)||v.offers.some(o=>o.from===index&&o.to===other))return []
  return v.tickets.flatMap((n,ticket)=>n>0&&!v.clues.some(c=>c.other===other&&c.ticket===ticket)?[contactAction(index,other,ticket)]:[])
 })
 // Rotate through partners before trying the next ticket with any one partner.
 for(let rank=0;rank<v.tickets.length;rank++)for(const group of byPartner){
  const action=group[rank]
  if(action!==undefined&&!rejected?.has(secretBotIntentKey(v,index,action)))return action
 }
 if(!v.tickets.some(Boolean)&&v.chips>=2&&!rejected?.has(buyer))return buyer
 return
}
const normalBid=(budget:number,round:number)=>Math.min(15000,budget,Math.ceil(budget/(9-round)*(reward(round)/3)))
function botRandom(seed:number){
 let x=seed>>>0
 return ()=>{x=(Math.imul(x,1664525)+1013904223)>>>0;return x/4294967296}
}
function bestAction<T>(options:readonly T[],score:(candidate:T)=>number):T|undefined{
 let leader:T|undefined,best=-Infinity
 for(const a of options){const n=score(a);if(leader===undefined||n>best){leader=a;best=n}}
 return leader
}
function connectsFive(board:string[],i:number,seat:string){
 const x=i%15,y=Math.floor(i/15)
 return axis.some(([dx,dy])=>{
  let run=1
  for(const sign of [-1,1])for(let k=1;k<5;k++){
   const px=x+k*dx*sign,py=y+k*dy*sign
   if(px<0||px>=15||py<0||py>=15||board[py*15+px]!==seat)break
   run++
  }
  return run>=5
 })
}
const axis=[[1,0],[0,1],[1,1],[1,-1]]
function pointGain(board:string[],i:number,seat:string){
 let score=0
 for(const [dx,dy] of axis){
  const side=(sign:number)=>{
   let n=0
   for(let k=1;k<13;k++){
    const x=i%13+sign*dx*k,y=Math.floor(i/13)+sign*dy*k
    if(x<0||x>12||y<0||y>12||board[y*13+x]!==seat)break
    n++
   }
   return n
  }
  const a=side(-1),b=side(1),length=a+b+1
  score+=length===3?1:length===4?2:length>=5&&a<5&&b<5?5:0
 }
 return score
}
function morrisAdvanced(a:BoardAction,v:GameView,seat:string){
 const board=[...v.board], other=v.seats.find(s=>s!==seat)!
 const i=typeof a==='number'?a:a.to
 if(v.capture)board[i]=''
 else{
  if(typeof a==='object')board[a.from]=''
  board[i]=seat
 }
 const lineScore=(player:string,rival:string)=>mills.reduce((score,m)=>{
  if(m.some(j=>board[j]===rival))return score
  const n=m.filter(j=>board[j]===player).length
  return score+[0,1,14,0][n]
 },0)
 const newMill=!v.capture&&inMill(board,i)
 return Number(newMill)*100+lineScore(seat,other)-2*lineScore(other,seat)+morrisWeight(a,v,seat)/100
}
function mancalaAdvanced(s:Mancala,seat:number,legal:BoardAction[]){
 const n=s.points.length,len=s.pits.length
 if(s.placements<n*4)return bestAction(legal,a=>{
  const i=a as number
  const landingType=pitType((i+s.pits[i].length+1)%len,len)
  return (landingType===3?14:landingType===4?-12:s.points[seat][landingType]===balance(s.points[seat])?5:0)-4*s.pits[i].length
 })
 const value=(state:Mancala)=>{
  const mine=state.points[seat],others=state.points.filter((_,i)=>seat!==i)
  return 100*(balance(mine)-Math.max(...others.map(balance)))+2*total(mine)-Math.max(...others.map(total))
 }
 return bestAction(legal,a=>{
  const after=sow(s,a as number,seat)!
  const next=(seat+1)%n
  const replies=after.pits.flatMap((p,i)=>p.includes(next)?[sow(after,i,next)]:[]).filter((x):x is Mancala=>x!==null)
  return 2*value(after)+(replies.length?Math.min(...replies.map(value)):value(after))
 })
}
function removeAdvanced(v:GameView,rng:()=>number){
 const ids=new Set(v.hand.map(c=>c.id))
 const deck=Array.from({length:Math.max(8,v.seats.length+2)*4},(_,i)=>i).filter(i=>!ids.has(i))
 const score=[0,0]
 for(let trial=0;trial<96;trial++){
  const sample=[...deck],others:number[]=[]
  // Draw plausible competing hands from the known deck, not the actual deal.
  for(let k=0;k<(v.seats.length-1)*2;k++){
   const j=k+Math.floor(rng()*(sample.length-k))
   ;[sample[k],sample[j]]=[sample[j],sample[k]]
   if(k%2===1)others.push(Math.floor(Math.min(sample[k],sample[k-1])/4)+1)
  }
  for(let a=0;a<2;a++){
   const keep=v.hand[1-a].value
   if(lowestUnique([...others,keep])===keep&&!others.includes(keep))score[a]++
  }
 }
 return score[0]===score[1]?(v.hand[0].value<=v.hand[1].value?1:0):Number(score[1]>score[0])
}
function grassPolicy(s:Grass,seat:number,level:Exclude<BotLevel,'normal'>,rng:()=>number){
 if(s.done||s.phase!=='draft'||s.order[s.position]!==seat)return grassBot(s,seat)
 const w=s.width
 const adjacent=(i:number)=>[i%w>0?i-1:-1,i%w<w-1?i+1:-1,i>=w?i-w:-1,i+w<s.board.length?i+w:-1].filter(j=>j>=0)
 const edges=[...new Set(s.board.flatMap((v,i)=>v===seat?adjacent(i).filter(j=>s.board[j]===-1):[]))]
 const seen=new Set<number>()
 let chosen:number|undefined,best=-Infinity
 const shift=Math.floor(rng()*s.tiles.length)
 for(let j=0;j<s.tiles.length;j++){
  const k=(j+shift)%s.tiles.length,tile=s.tiles[k]
  if(tile.taken)continue
  for(let t=0;t<8;t++)for(const [x,y] of orient(tile.shape,t))for(const border of edges){
   if(border%w<x)continue
   const anchor=border-y*w-x
   if(anchor<0)continue
   const code=placeCode(k,t,anchor)
   if(seen.has(code))continue
   seen.add(code)
   const cells=footprint(s,k,t,anchor)
   if(!canPlace(s,seat,cells))continue
   if(level==='easy')return code
   const board=s.board.slice()
   for(const cell of cells)board[cell]=seat
   const area=cells.length,side=square(board,w,seat)
   const contact=cells.reduce((n,cell)=>n+adjacent(cell).filter(i=>s.board[i]===seat).length,0)
   const bonus=cells.some(i=>s.markers[i])?tile.bonus:0
   const value=s.mode==='grass1'?100*side+8*area+contact:32*(area+bonus)+3*side+contact/10
   if(value>best){best=value;chosen=code}
  }
 }
 return chosen??grassBot(s,seat)
}
function secretAdvanced(clues:ReturnType<typeof secretView>['clues']){
 const bySeat=new Map<number,typeof clues>()
 for(const c of clues)bySeat.set(c.other,[...(bySeat.get(c.other)??[]),c])
 const options=candidates(clues)
 const numbers=Array.from({length:100},(_,i)=>i+1)
 if(!options.length)return guessAction(1,null,null)
 const posterior=options.map(own=>{
  const pairs=[...bySeat.entries()].map(([other,cs])=>({other,numbers:numbers.filter(n=>n!==own&&cs.every(c=>clue(c.ticket,own,n)===c.result))}))
  return {own,pairs,weight:pairs.reduce((w,p)=>w*p.numbers.length,1)}
 })
 const most=bestAction(posterior,p=>p.weight)!
 const guesses=[...bySeat.keys()].flatMap(other=>{
  const weights=new Map<number,number>()
  for(const p of posterior){
   const ns=p.pairs.find(x=>x.other===other)?.numbers??[]
   for(const n of ns)weights.set(n,(weights.get(n)??0)+p.weight/ns.length)
  }
  const best=bestAction([...weights],x=>x[1])
  return best&&best[1]*3>posterior.reduce((sum,p)=>sum+p.weight,0)?[[other,best[0],best[1]] as const]:[]
 }).sort((a,b)=>b[2]-a[2]||a[0]-b[0])
 const pick=(i:number):[number,number]|null=>guesses[i]?[guesses[i][0],guesses[i][1]]:null
 return guessAction(most.own,pick(0),pick(1))
}
function equationPolicy(v:ReturnType<typeof equationView>,seed:number,level:Exclude<BotLevel,'normal'>,rng:()=>number){
 if(v.phase!=='guess')return equationBot(v,seed)
 const options=equationPool()
 const tried=new Set(v.rows.map(row=>row.guess))
 const advance=Math.floor(rng()*options.length)
 const pool=Array.from({length:options.length},(_,i)=>options[(i+advance)%options.length]).filter(x=>!tried.has(x))
 if(level==='easy')return pool[0]
 const possible=pool.filter(s=>v.rows.every(row=>equationMarks(s,row.guess).every((mark,i)=>mark===row.marks[i])))
 if(possible.length<3)return possible[0]??equationBot(v,seed)
 const stride=Math.max(1,Math.floor(possible.length/128))
 const answers=possible.filter((_,i)=>i%stride===0).slice(0,128)
 const choices=possible.filter((_,i)=>i%Math.max(1,Math.floor(possible.length/18))===0).slice(0,18)
 return bestAction(choices,guess=>{
  const buckets=new Map<string,number>()
  for(const answer of answers){
   const key=equationMarks(answer,guess).join()
   buckets.set(key,(buckets.get(key)??0)+1)
  }
  return -[...buckets.values()].reduce((sum,size)=>sum+size*size,0)
 })
}
function blindWeight(i:number,v:GameView,seat:string){
 const x=i%15,y=Math.floor(i/15);let weight=14-Math.abs(x-7)-Math.abs(y-7)
 for(const [dx,dy] of [[1,0],[0,1],[1,1],[1,-1]])for(let offset=0;offset<5;offset++){
  const line=Array.from({length:5},(_,k)=>[x+(k-offset)*dx,y+(k-offset)*dy])
  if(line.some(([a,b])=>a<0||a>=15||b<0||b>=15))continue
  let n=0;for(const [a,b] of line){const cell=v.board[b*15+a];if(cell===seat)n++;if(cell==='?'){n=-1;break}}
  if(n>0)weight+=4**n
 }
 return weight
}
function morrisWeight(a:BoardAction,v:GameView,seat:string){
 const i=typeof a==='number'?a:a.to
 return mills.filter(m=>m.includes(i)).reduce((acc,m)=>acc+1+(v.capture?m.filter(j=>v.board[j]===v.board[i]).length:m.filter(j=>j!==i&&v.board[j]===seat&&!(typeof a==='object'&&j===a.from)).length**3),0)
}

function pointWeight(i:number,v:GameView,seat:string){
 let score=12-Math.abs(i%13-6)-Math.abs(Math.floor(i/13)-6)
 for(const [dx,dy] of [[1,0],[0,1],[1,1],[1,-1]])for(const target of v.seats){
  let n=0
  for(const sign of [-1,1])for(let k=1;k<5;k++){
   const x=i%13+sign*dx*k,y=Math.floor(i/13)+sign*dy*k
   if(x<0||x>12||y<0||y>12||v.board[y*13+x]!==target)break
   n++
  }
  score+=n*n*(target===seat?2:1)
 }
 return score
}
