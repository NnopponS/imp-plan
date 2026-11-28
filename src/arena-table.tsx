import {SealedAuction} from './sealed-auction'
import {MontageBoard} from './montage-ui'
import {WallGoBoard} from './wall-go-ui'
import {MemoryDuelBoard} from './memory-duel-ui'
import {isPuzzle} from './puzzles'
import {Suspense,lazy,useRef,useState,type ComponentProps,type ReactNode} from 'react'
import {mills,points,titles,isDuel,type Game,type GameView} from './engine'
import type {Command,Snapshot} from './room'
import {BlindMatchStage} from './blind-match'
import {BoardViewport} from './board-viewport'
import {PointScores,RoundHeading} from './match-record'
import {PointStone,TableMakersMark,tableMaterial} from './engraved-tables'
import {PointPlate,PointScoreRuler} from './point-table-art'
import {loadTable,TableLoadBoundary} from './lazy-table'
const loadHitStay=()=>loadTable(()=>import('./hit-stay-ui'))
const HitStayBoard=lazy(()=>loadHitStay().then(m=>({default:m.HitStayBoard})))
export const loadTreasureIsland=()=>loadTable(()=>import('./treasure-island-ui'))
const TreasureIslandBoard=lazy(()=>loadTreasureIsland().then(m=>({default:m.TreasureIslandBoard})))
export const loadDoubtBet=()=>loadTable(()=>import('./doubt-bet-ui'))
const DoubtBetBoard=lazy(()=>loadDoubtBet().then(m=>({default:m.DoubtBetBoard})))
const loadWallGo2=()=>loadTable(()=>import('./wall-go2-ui'))
const WallGo2Board=lazy(()=>loadWallGo2().then(m=>({default:m.WallGo2Board})))
export const loadThreeRow=()=>loadTable(()=>import('./three-row-ui'))
const ThreeRowBoard=lazy(()=>loadThreeRow().then(m=>({default:m.ThreeRowBoard})))
export const loadRelay=()=>loadTable(()=>import('./coop-puzzle-ui'))
const RelayBoard=lazy(()=>loadRelay().then(m=>({default:m.RelayBoard})))
export const loadGradation=()=>loadTable(()=>import('./gradation-ui'))
const GradationBoard=lazy(()=>loadGradation().then(m=>({default:m.GradationBoard})))
export const loadBigSmall=()=>loadTable(()=>import('./big-small-ui'))
const BigSmallBoard=lazy(()=>loadBigSmall().then(m=>({default:m.BigSmallBoard})))
const loadAuctionBingo=()=>loadTable(()=>import('./auction-bingo-ui'))
const AuctionBingoBoard=lazy(()=>loadAuctionBingo().then(m=>({default:m.AuctionBingoBoard})))
const loadEquationHighLow=()=>loadTable(()=>import('./equation-high-low-ui'))
const EquationHighLowBoard=lazy(()=>loadEquationHighLow().then(m=>({default:m.EquationHighLowBoard})))
export const loadTripleDice=()=>loadTable(()=>import('./triple-dice-ui'))
const TripleDiceBoard=lazy(()=>loadTripleDice().then(m=>({default:m.TripleDiceBoard})))
const loadUnknown=()=>loadTable(()=>import('./unknown-ui'))
const UnknownBoard=lazy(()=>loadUnknown().then(m=>({default:m.UnknownBoard})))
const loadPiggy=()=>loadTable(()=>import('./piggy-bank-ui'))
const PiggyBankBoard=lazy(()=>loadPiggy().then(m=>({default:m.PiggyBankBoard})))
const loadEquationTower=()=>loadTable(()=>import('./equation-tower-ui'))
const EquationTowerBoard=lazy(()=>loadEquationTower().then(m=>({default:m.EquationTowerBoard})))
const loadHiddenWord=()=>loadTable(()=>import('./hidden-word-ui'))
const HiddenWordBoard=lazy(()=>loadHiddenWord().then(m=>({default:m.HiddenWordBoard})))
export const loadFlags=()=>loadTable(()=>import('./flags-ui'))
const FlagsBoard=lazy(()=>loadFlags().then(m=>({default:m.FlagsBoard})))
export const loadSymmetry=()=>loadTable(()=>import('./symmetry-ui'))
const SymmetryPuzzleBoard=lazy(()=>loadSymmetry().then(m=>({default:m.SymmetryPuzzleBoard})))
export const loadColorLink=()=>loadTable(()=>import('./color-link-ui'))
const ColorLinkBoard=lazy(()=>loadColorLink().then(m=>({default:m.ColorLinkBoard})))
export const loadHeavy13=()=>loadTable(()=>import('./heavy-13-ui'))
const Heavy13Board=lazy(()=>loadHeavy13().then(m=>({default:m.Heavy13Board})))
export const loadTimeHold=()=>loadTable(()=>import('./time-hold-ui'))
const TimeHoldBoard=lazy(()=>loadTimeHold().then(module=>({default:module.TimeHoldBoard})))
// Rules remain synchronous. Load board graphics only after a game is selected.
const loadMemoryPokerBoard=()=>loadTable(()=>import('./memory-poker-ui'))
const MemoryPokerBoard=lazy(()=>loadMemoryPokerBoard().then(m=>({default:m.MemoryPokerBoard})))
const loadPieceBoard=()=>loadTable(()=>import('./piece-ui'))
const PieceBoard=lazy(()=>loadPieceBoard().then(m=>({default:m.PieceBoard})))
const loadTowerBoard=()=>loadTable(()=>import('./tower-ui'))
const TowerBoard=lazy(()=>loadTowerBoard().then(m=>({default:m.TowerBoard})))
const loadFenceBoard=()=>loadTable(()=>import('./fence-ui'))
const FenceBoard=lazy(()=>loadFenceBoard().then(m=>({default:m.FenceBoard})))
const loadScaleBoard=()=>loadTable(()=>import('./scale-ui'))
const ScaleBoard=lazy(()=>loadScaleBoard().then(m=>({default:m.ScaleBoard})))
const loadSpotBoard=()=>loadTable(()=>import('./spot-ui'))
const SpotBoard=lazy(()=>loadSpotBoard().then(m=>({default:m.SpotBoard})))
const loadFragmentsBoard=()=>loadTable(()=>import('./fragments-ui'))
const FragmentsBoard=lazy(()=>loadFragmentsBoard().then(m=>({default:m.FragmentsBoard})))
const loadPyramidBoard=()=>loadTable(()=>import('./pyramid-ui'))
const PyramidBoard=lazy(()=>loadPyramidBoard().then(m=>({default:m.PyramidBoard})))
const loadCodeLockBoard=()=>loadTable(()=>import('./code-lock-ui'))
const CodeLockBoard=lazy(()=>loadCodeLockBoard().then(m=>({default:m.CodeLockBoard})))
const loadEquationBoard=()=>loadTable(()=>import('./equations-ui'))
const EquationBoard=lazy(()=>loadEquationBoard().then(m=>({default:m.EquationBoard})))
const loadDivineBoard=()=>loadTable(()=>import('./divine-ui'))
const DivineBoard=lazy(()=>loadDivineBoard().then(m=>({default:m.DivineBoard})))
const loadGrassBoard=()=>loadTable(()=>import('./grass-ui'))
const GrassBoard=lazy(()=>loadGrassBoard().then(m=>({default:m.GrassBoard})))
const loadBaghBoard=()=>loadTable(()=>import('./season-expansion-ui'))
const BaghBoard=lazy(()=>loadBaghBoard().then(m=>({default:m.BaghBoard})))
const SecretBoard=lazy(()=>loadBaghBoard().then(m=>({default:m.SecretBoard})))
const loadMancalaBoard=()=>loadTable(()=>import('./mancala-ui'))
const MancalaBoard=lazy(()=>loadMancalaBoard().then(m=>({default:m.MancalaBoard})))
const loadMorrisBoard=()=>loadTable(()=>import('./morris-ui'))
const MorrisBoard=lazy(()=>loadMorrisBoard().then(m=>({default:m.MorrisBoard})))
const loadPuzzleBoard=()=>loadTable(()=>import('./puzzle-ui'))
const PuzzleBoard=lazy(()=>loadPuzzleBoard().then(m=>({default:m.PuzzleBoard})))
const loadSeasonTwo=()=>loadTable(()=>import('./season-two-ui'))
const SeasonTwo=lazy(()=>loadSeasonTwo().then(m=>({default:m.SeasonTwo})))
const boardWarmers:Partial<Record<Game,()=>Promise<unknown>>>={
 hitStay:loadHitStay,treasureIsland:loadTreasureIsland,wallGo2:loadWallGo2,doubtBet:loadDoubtBet,piggyBank:loadPiggy,
 equationHighLow:loadEquationHighLow,coopPuzzle:loadRelay,gradation:loadGradation,bigSmall:loadBigSmall,tripleDice:loadTripleDice,auctionBingo:loadAuctionBingo,hiddenWord:loadHiddenWord,unknown:loadUnknown,equationTower:loadEquationTower,flags:loadFlags,threeRow:loadThreeRow,colorLink:loadColorLink,symmetry:loadSymmetry,
 memoryPoker:loadMemoryPokerBoard,
 piece:loadPieceBoard,
 tower:loadTowerBoard,
 fence:loadFenceBoard,
 scale:loadScaleBoard,
 spot:loadSpotBoard,
 fragments:loadFragmentsBoard,
 pyramid:loadPyramidBoard,
 codeLock:loadCodeLockBoard,
 equations:loadEquationBoard,
 divine:loadDivineBoard,
 grass1:loadGrassBoard,grass3:loadGrassBoard,
 bagh:loadBaghBoard,secret:loadBaghBoard,
 mancala:loadMancalaBoard,
 morris:loadMorrisBoard,
 hex:loadPuzzleBoard,rectangles:loadPuzzleBoard,cubes:loadPuzzleBoard,exile:loadPuzzleBoard,
 remove:loadSeasonTwo,knight:loadSeasonTwo,
}

export function warmTable(game:Game){return boardWarmers[game]?.()}

type TableProps={
 snap:Snapshot&{game:GameView}
 active:boolean
 nameOf:(id:string)=>string
 command:(action:Command)=>void
 send:(action:Command,expectedMatch?:string)=>string|false|undefined
 practice:boolean
 motionOff:boolean
 preview?:boolean
 receivedAt?:number
 holdRejection?:string
 blindActions?:Pick<ComponentProps<typeof BlindMatchStage>,'onReturn'|'onExport'|'next'|'extra'|'resultFolio'>
 children?:ReactNode
}

export function ArenaTable({snap,active,nameOf,command,send,practice,motionOff,preview,receivedAt,holdRejection,blindActions,children}:TableProps){
 const finished=snap.game.done
 const pointPreview=preview&&snap.game.game==='point'
 if(snap.game.game==='blind')return <BlindMatchStage key={snap.match} game={snap.game} you={snap.you} name={nameOf} active={active} practice={practice}
   leg={snap.fixture+1} legs={snap.count} submit={action=>command({kind:'move',action})} {...blindActions}/>
 return <section className="panel match" data-rendered-table={snap.game.game} data-table-material={finished?undefined:tableMaterial[snap.game.game]}>
     {!finished&&!pointPreview&&<TableMakersMark game={snap.game.game}/>}
     {!pointPreview&&<p className="eyebrow">{snap.game.timeHold?'EPISODE-INSPIRED · FAN RECREATION':snap.game.memoryDuel?'EPISODE-STYLE DUEL · FAN RECREATION':'FAN MODE'}{!(snap.game.grass||isPuzzle(snap.game.game)||snap.game.divine||snap.game.codeLock||snap.game.pyramid||snap.game.fragments||snap.game.spot||snap.game.scale||snap.game.fence||snap.game.tower||snap.game.piece||snap.game.memoryPoker||snap.game.memoryDuel||snap.game.timeHold||snap.game.montage||snap.game.heavy13||snap.game.colorLink||snap.game.symmetry||snap.game.threeRow||snap.game.flags||snap.game.coopPuzzle||snap.game.gradation||snap.game.bigSmall||snap.game.tripleDice||snap.game.wallGo2||snap.game.auctionBingo||snap.game.equationHighLow||snap.game.hiddenWord||snap.game.unknown||snap.game.doubtBet||snap.game.equationTower||snap.game.hitStay||snap.game.treasureIsland)&&(snap.game.wallGo?' · Leg ':' · Round ')+(snap.fixture+1)+' of '+snap.count}</p>}
     {!pointPreview&&!snap.game.treasureIsland&&!snap.game.timeHold&&!snap.game.unknown&&!snap.game.piggyBank&&snap.game.game!=='morris'&&<RoundHeading game={snap.game} you={snap.you} active={active}>{snap.game.hitStay?(finished?'Final chip stacks':'Play to 21'):snap.game.doubtBet?(finished?snap.game.winner?nameOf(snap.game.winner)+' wins':'Shared lead':'Read the hidden cards'):snap.game.equationHighLow?(finished?snap.game.winner?nameOf(snap.game.winner)+' wins':'Shared lead':'Play the two targets'):snap.game.coopPuzzle?(finished?snap.game.coopPuzzle.reason==='tiled'?'Mosaic complete':'Relay closed':'Fit the mosaic'):snap.game.gradation?(finished?'Cabinet result':snap.game.gradation.phase==='arrange'?'Arrange the seven gates':'Read the weight register'):snap.game.bigSmall?(finished?snap.game.winner?nameOf(snap.game.winner)+' wins':'Match drawn':'Compare your cards'):snap.game.auctionBingo?(finished?snap.game.winner?nameOf(snap.game.winner)+' wins':'Shared lead':snap.game.auctionBingo.phase==='select'?'Choose a lot':snap.game.auctionBingo.phase==='bid'?'Seal your bid':'Read the price ledger'):snap.game.tripleDice?(finished?snap.game.winner?nameOf(snap.game.winner)+' wins':'Shared lead':snap.game.tripleDice.phase==='review'?'Round scores':'Seal three dice'):snap.game.equationTower?(finished?'Tower results':'Build the equation'):snap.game.hiddenWord?(finished?snap.game.winner?nameOf(snap.game.winner)+' wins':'Shared lead':'The lexical observatory'):snap.game.flags?(finished?'Dispatch results':snap.game.flags.phase==='study'?'Study the flag archive':'Seal your dispatch'):snap.game.threeRow?(finished?'The cabinet is unsealed':snap.game.threeRow.phase==='vote'?'Seal your suspicion':'Print three in a row'):snap.game.symmetry?(finished?snap.game.seats.length===1?'Practice complete':snap.game.winner?nameOf(snap.game.winner)+' wins':'Shared result':'Assemble the reflection'):snap.game.colorLink?(finished?snap.game.winner?nameOf(snap.game.winner)+' wins':'Match drawn':'Route the pairs'):snap.game.heavy13?(finished?snap.game.winner?nameOf(snap.game.winner)+' wins':'Shared result':'Balance the three stands'):snap.game.montage?(finished?snap.game.montage.outcome==='cleared'?'Gallery cleared':'Gallery closed':'Recognize the repeat'):snap.game.wallGo2?(finished?snap.game.winner?nameOf(snap.game.winner)+' wins':'Shared fortress':snap.game.wallGo2.drafting?'Draft your crew':'Partition the fortress'):snap.game.wallGo?(finished?snap.game.winner?nameOf(snap.game.winner)+' wins':'Draw':'Fence the board'):snap.game.memoryDuel?(finished?snap.game.winner?nameOf(snap.game.winner)+' wins':'No winner':'Head-to-head'):snap.game.memoryPoker?(finished?snap.game.seats.length===1?'Practice complete':snap.game.winner?nameOf(snap.game.winner)+' wins':'Shared result':'Memory Poker table'):snap.game.piece?(finished?snap.game.piece.score.adjustedMs===null?'Puzzle closed':'Silhouette complete':'Fill the silhouette'):snap.game.tower?(finished?snap.game.tower.score.passed?'Tower cleared':'Tower closed':'Build the word tower'):snap.game.fence?(finished?snap.game.seats.length===1?'Practice complete':snap.game.winner?nameOf(snap.game.winner)+' wins':'Shared result':'Build one closed loop'):snap.game.scale?(finished?snap.game.scale.score===5?'Weights solved':'Scale challenge complete':'Balance the minerals'):snap.game.fragments?(finished?snap.game.fragments.passed?'Exhibit cleared':'Exhibit not cleared':'Recall together'):finished?((isPuzzle(snap.game.game)||snap.game.codeLock||snap.game.pyramid||snap.game.spot)&&snap.game.seats.length===1?'Practice complete':snap.game.winner?nameOf(snap.game.winner)+' wins':'Shared result'):snap.game.game==='auction'?'Submit in secret':snap.game.game==='remove'?'Lowest unique card wins':snap.game.game==='knight'?'Trace your tour':isPuzzle(snap.game.game)||snap.game.game==='secret'||snap.game.grass||snap.game.divine||snap.game.codeLock||snap.game.pyramid||snap.game.spot?titles[snap.game.game]:!snap.game.seats.includes(snap.you)?'Watching this leg':snap.game.turn===snap.you?'Your turn':nameOf(snap.game.turn)+'’s turn'}</RoundHeading>}
     {snap.game.game!=='point'&&isDuel(snap.game.game)&&snap.game.game!=='morris'&&snap.game.game!=='bagh'&&!snap.game.equations&&!snap.game.wallGo&&!snap.game.colorLink&&!snap.game.bigSmall&&<p className="versus">{snap.game.seats.map((s,i)=><span key={s}>{mark(i)} {nameOf(s)}</span>)}</p>}
      <TableLoadBoundary key={snap.match+':'+snap.game.game} title={titles[snap.game.game]}><Suspense fallback={<p role="status">Opening the table…</p>}>
      {snap.game.timeHold?<TableLoadBoundary key={snap.match} title="Time Auction"><Suspense fallback={<p role="status">Loading hold controls…</p>}><TimeHoldBoard key={snap.match} matchKey={snap.match} view={snap.game.timeHold}
       active={active} clockSample={receivedAt===undefined?null:{hostNow:snap.hostNow,receivedAt:receivedAt}}
       seatNames={Object.fromEntries(snap.seats.map(s=>[s.id,s.name]))} rejectedPress={holdRejection}
       reducedMotion={motionOff} submit={a=>send({kind:'time-hold',round:a.round,action:a.kind},snap.match)??false}/></Suspense></TableLoadBoundary>:
      snap.game.hitStay?<HitStayBoard key={snap.match} view={snap.game.hitStay} you={snap.you} name={nameOf} host={snap.you===snap.host} active={active} hostNow={snap.hostNow} receivedAt={receivedAt} preview={preview}
       submit={action=>command({kind:'hit-stay',match:snap.match,step:snap.game.hitStay!.step,action})}/>:
      snap.game.treasureIsland?<TreasureIslandBoard key={snap.match+':'+snap.game.treasureIsland.step} view={snap.game.treasureIsland} you={snap.you} name={nameOf} active={active} hostNow={snap.hostNow} receivedAt={receivedAt} preview={preview}
       submit={action=>command({kind:'treasure-island',match:snap.match,step:snap.game.treasureIsland!.step,action})}/>:
      snap.game.doubtBet?<DoubtBetBoard key={snap.match+':'+snap.game.doubtBet.step} view={snap.game.doubtBet} you={snap.you} name={nameOf} host={snap.you===snap.host} active={active} hostNow={snap.hostNow} receivedAt={receivedAt} preview={preview}
       submit={action=>command({kind:'doubt-bet',match:snap.match,step:snap.game!.doubtBet!.step,action})}/>:snap.game.piggyBank?<PiggyBankBoard key={snap.match} view={snap.game.piggyBank} you={snap.you} name={nameOf} active={active} preview={preview} hostNow={snap.hostNow} receivedAt={receivedAt}
       send={action=>command({kind:'piggy-bank',match:snap.match,step:snap.game!.piggyBank!.step,action})}/>:snap.game.equationTower?<EquationTowerBoard key={snap.match} view={snap.game.equationTower} you={snap.you} name={nameOf} active={active} preview={preview} hostNow={snap.hostNow} receivedAt={receivedAt}
       send={action=>command({kind:'equation-tower',match:snap.match,step:snap.game!.equationTower!.step,action})}/>:
      snap.game.equationHighLow?<EquationHighLowBoard view={snap.game.equationHighLow} you={snap.you} name={nameOf} active={active} hostNow={snap.hostNow}
       submit={action=>command({kind:'equation-high-low',match:snap.match,step:snap.game!.equationHighLow!.step,action})}/>:
      snap.game.bigSmall?<BigSmallBoard key={snap.match} view={snap.game.bigSmall} you={snap.you} name={nameOf} active={active}
       submit={action=>command({kind:'big-small',match:snap.match,step:snap.game!.bigSmall!.step,action})}/>:
      snap.game.coopPuzzle?<RelayBoard key={snap.match} state={snap.game.coopPuzzle} you={snap.you} name={nameOf} active={active} hostNow={snap.hostNow} submit={action=>command({kind:'relay',match:snap.match,turn:snap.game!.coopPuzzle!.turns,action})}/>:
      snap.game.wallGo2?<WallGo2Board key={snap.match} view={snap.game.wallGo2} you={snap.you} name={nameOf} active={active} hostNow={snap.hostNow} deadline={snap.game.deadline}
       submit={action=>command({kind:'wall-go2',match:snap.match,step:snap.game!.wallGo2!.step,action})}/>:
      snap.game.auctionBingo?<AuctionBingoBoard key={snap.match+':'+snap.game.round} view={snap.game.auctionBingo} you={snap.you} name={nameOf} hostNow={snap.hostNow} active={active}
       send={action=>command({kind:'bingo-lock',match:snap.match,round:snap.game!.round,action})}/>:snap.game.gradation?<GradationBoard key={snap.match+':'+snap.game.round} view={snap.game.gradation} you={snap.you} name={nameOf} active={active} hostNow={snap.hostNow} send={(order,target)=>command({kind:'gradation-lock',match:snap.match,round:snap.game!.round,order,target})}/>:snap.game.tripleDice?<TripleDiceBoard key={snap.match} view={snap.game.tripleDice} you={snap.you} name={nameOf} hostNow={snap.hostNow} active={active}
       send={(positions,prediction)=>command({kind:'dice-lock',match:snap.match,round:snap.game!.tripleDice!.round,positions,prediction})}/>:snap.game.unknown?<UnknownBoard key={snap.match} view={snap.game.unknown} you={snap.you} name={nameOf} hostNow={snap.hostNow} receivedAt={receivedAt} active={active} preview={preview} send={action=>command({kind:'unknown-roll',match:snap.match,step:snap.game.unknown!.step,action})}/>:snap.game.hiddenWord?<HiddenWordBoard key={snap.match} view={snap.game.hiddenWord} you={snap.you} name={nameOf} active={active} hostNow={snap.hostNow} receivedAt={receivedAt}
       send={action=>command({kind:'hidden-word',match:snap.match,step:snap.game!.hiddenWord!.step,action})}/>:snap.game.flags?<FlagsBoard key={snap.match} view={snap.game.flags} you={snap.you} names={Object.fromEntries(snap.game.seats.map(id=>[id,nameOf(id)]))} hostNow={snap.hostNow} active={active&&snap.game.seats.includes(snap.you)} send={choices=>command({kind:'flags-lock',match:snap.match,choices})}/>:snap.game.threeRow?<ThreeRowBoard key={snap.match} view={snap.game.threeRow} you={snap.you} names={Object.fromEntries(snap.game.seats.map(id=>[id,nameOf(id)]))} hostNow={snap.hostNow} active={active} submit={action=>command({kind:'three-row',match:snap.match,turns:snap.game!.threeRow!.turns,action})}/>:
      snap.game.symmetry?<SymmetryPuzzleBoard key={snap.match} board={snap.game.symmetry.board} hostNow={snap.hostNow}
       active={active&&!snap.game.done&&snap.game.seats.includes(snap.you)}
       submit={action=>send({kind:'move',round:1,action},snap.match)}/>:snap.game.colorLink?<ColorLinkBoard key={snap.match} snap={snap} name={nameOf} active={active} receivedAt={receivedAt}
       submit={action=>command({kind:'color-link',match:snap.match,step:snap.game!.colorLink!.step,action})}/>:snap.game.heavy13?<TableLoadBoundary key={snap.match} title="Heavy 13"><Suspense fallback={<p role="status">Preparing the Heavy 13 table…</p>}><Heavy13Board key={snap.match} snap={snap} name={nameOf} active={active} submit={action=>{
       const game=snap.game?.heavy13
       if(game?.phase==='select')command({kind:'heavy-lock',match:snap.match,round:game.round,action})
       if(game?.phase==='resolve'&&game.slot!==null)command({kind:'heavy-act',match:snap.match,round:game.round,slot:game.slot,action})
      }}/></Suspense></TableLoadBoundary>:snap.game.montage?<MontageBoard key={snap.match} preview={preview} snap={snap} name={nameOf} active={active} open={round=>command({kind:'montage-open',match:snap.match,round})} buzz={position=>command({kind:'montage-buzz',match:snap.match,...position})}/>:snap.game.wallGo?<WallGoBoard key={snap.match} snap={snap} name={nameOf} active={active} submit={action=>command({kind:'move',action})}/>:
       snap.game.memoryDuel?<MemoryDuelBoard key={snap.match+':'+snap.game.memoryDuel.dealNumber} snap={snap} name={nameOf} active={active} submit={(a,deal)=>command({kind:'memory-lock',action:a,deal})}/>:snap.game.memoryPoker?<MemoryPokerBoard key={snap.match+':'+snap.game.round} snap={snap} name={nameOf} active={active} submit={a=>command({kind:'move',action:a,round:snap.game?.round})}/>:snap.game.piece?<PieceBoard key={snap.match} snap={snap} name={nameOf} active={active} submit={a=>command({kind:'move',action:a})}/>:snap.game.tower?<TowerBoard key={snap.match+':'+snap.game.round} snap={snap} name={nameOf} active={active} submit={a=>command({kind:'move',action:a})}/>:snap.game.fence?<FenceBoard key={snap.match} snap={snap} name={nameOf} active={active} submit={a=>command({kind:'move',action:a,round:snap.game?.round})}/>:snap.game.scale?<ScaleBoard key={snap.match} snap={snap} name={nameOf} active={active} submit={a=>command({kind:'move',action:a,round:snap.game?.round})}/>:snap.game.spot?<SpotBoard key={snap.match} snap={snap} name={nameOf} active={active} submit={a=>command({kind:'move',action:a,round:snap.game?.round})}/>:snap.game.fragments?<FragmentsBoard key={snap.match} snap={snap} name={nameOf} active={active} preview={preview} receivedAt={receivedAt} submit={a=>command({kind:'move',action:a,round:snap.game?.round})}/>:snap.game.pyramid?<PyramidBoard key={snap.match+':'+snap.game.round} snap={snap} name={nameOf} active={active} submit={a=>command({kind:'move',action:a,round:snap.game?.round})}/>:snap.game.codeLock?<CodeLockBoard key={snap.match} snap={snap} name={nameOf} active={active} submit={a=>command({kind:'move',action:a,round:snap.game?.round})}/>:snap.game.equations?<EquationBoard key={snap.match} snap={snap} name={nameOf} active={active} submit={a=>command({kind:'move',action:a})}/>:snap.game.divine?<DivineBoard key={snap.match} snap={snap} active={active} submit={a=>command({kind:'move',action:a,round:snap.game?.round})}/>:snap.game.grass?<GrassBoard key={snap.match+':'+snap.game.round+':'+snap.game.turn} g={snap.game} you={snap.you} name={nameOf} active={active} submit={a=>command({kind:'move',action:a})}/>:snap.game.game==='bagh'?<BaghBoard key={snap.match} g={snap.game} you={snap.you} active={active} submit={a=>command({kind:'move',action:a})}/>:snap.game.game==='secret'?<SecretBoard key={snap.match+':'+snap.game.round} snap={snap} active={active} name={nameOf} submit={a=>command({kind:'move',action:a,round:snap.game?.round})}/>:snap.game.game==='auction'?<SealedAuction key={snap.match} snap={snap} active={active} submit={a=>command({kind:'move',action:a,round:snap.game?.round})}/>:isPuzzle(snap.game.game)?<PuzzleBoard key={snap.match+':'+snap.game.round+':'+snap.game.puzzle?.stage} snap={snap} active={active} name={nameOf} submit={a=>command({kind:'move',action:a,round:snap.game?.round})}/>:snap.game.game==='mancala'?<MancalaBoard key={snap.match+':'+snap.game.mancala?.placements+':'+snap.game.mancala?.sows} g={snap.game} you={snap.you} active={active} name={nameOf} submit={a=>command({kind:'move',action:a})}/>:!isDuel(snap.game.game)?<SeasonTwo key={snap.match} snap={snap} active={active} name={nameOf} submit={a=>command({kind:'move',action:a,round:snap.game?.round})}/>:snap.game.game==='morris'?<MorrisBoard key={snap.match} v={snap.game} you={snap.you} name={nameOf} active={active} submit={a=>command({kind:'move',action:a})}/>:<Board key={snap.match} v={snap.game} name={nameOf} active={active&&!pointPreview} preview={pointPreview} submit={a=>command({kind:'move',action:a})}/>}
     </Suspense></TableLoadBoundary>
    {children}
    </section>
}
const mark=(i:number)=>i===0?'●':'◆'
function Board({v,name,active,submit,preview}:{v:GameView,name:(s:string)=>string,active:boolean,preview?:boolean,submit:(a:number|{from:number,to:number})=>void}){
 const [from,setFrom]=useState<number|null>(null)
 const [focus,setFocus]=useState(0)
 const [row,setRow]=useState(0)
 const [column,setColumn]=useState(0)
 const refs=useRef<Array<HTMLButtonElement|null>>([])
 const linear=v.game!=='morris'
 const size=v.game==='point'?13:15
 function cell(i:number){
  const value=v.board[i]
  const canFrom=v.legal.some(a=>typeof a==='object'&&a.from===i)
  const canPlace=v.legal.includes(i)
  const canTo=v.legal.some(a=>typeof a==='object'&&a.from===from&&a.to===i)
  const can=active&&(canPlace||canFrom||canTo)
  const label=(linear?'Row '+(Math.floor(i/size)+1)+', column '+(i%size+1):'Point '+(i+1))+', '+(!value?'open':value==='?'?'veiled':name(value))
  const [x,y]=points[i]??[0,0]
  return <button type="button" key={i} style={linear?{}:{left:(7+x*(86/6))+'%',top:(7+y*(86/6))+'%'}} ref={el=>{refs.current[i]=el}} tabIndex={i===focus?0:-1} aria-label={label} aria-disabled={!can} aria-pressed={from===i}
   className={'cell '+(value==='?'?'veil':value?'color'+v.seats.indexOf(value):'')+(can?' legal':'')}
   onFocus={()=>setFocus(i)} onKeyDown={e=>{
    const nav:Record<string,number>={ArrowRight:1,ArrowLeft:-1,ArrowUp:linear?-size:-1,ArrowDown:linear?size:1}
    if(!(e.key in nav))return
    e.preventDefault();const next=Math.max(0,Math.min(v.board.length-1,i+nav[e.key]));refs.current[next]?.focus()
   }}
   onClick={()=>{if(!can)return;if(canPlace){submit(i);setFrom(null)}else if(canTo&&from!==null){submit({from,to:i});setFrom(null)}else if(canFrom)setFrom(from===i?null:i)}}>
   <span className={value?'placed-piece':undefined} key={value} aria-hidden="true">{value==='?'?'●':value?v.game==='point'?<PointStone side={v.seats.indexOf(value)}/>:mark(v.seats.indexOf(value)):''}</span>
  </button>
 }
 const coordinates=linear&&!v.done&&!preview&&<details><summary>Place by coordinates</summary><div className="actions"><label>Row<select aria-label="Row" value={row} onChange={e=>setRow(Number(e.target.value))}>{Array.from({length:size},(_,i)=><option key={i} value={i}>{i+1}</option>)}</select></label><label>Column<select aria-label="Column" value={column} onChange={e=>setColumn(Number(e.target.value))}>{Array.from({length:size},(_,i)=><option key={i} value={i}>{i+1}</option>)}</select></label><button disabled={!active||!v.legal.includes(row*size+column)} onClick={()=>submit(row*size+column)}>Place stone</button></div></details>
 if(v.game==='point'){
  const plate=<div className="board gomoku point-board" aria-label={titles.point+' board'} role="group">
   <PointPlate/>{v.board.map((_,i)=>cell(i))}
  </div>
  return <>
   <div className="point-table-scene" data-point-preview={preview||undefined}>
    <PointScores game={v} name={name} active={active}/>
    <div className="point-table-play">{preview?plate:<BoardViewport label={titles.point+' board'} hint={<span className="point-camera-hint">{v.done||!active?'Arrows: inspect':'Arrows: inspect · Enter: place'}</span>}>{plate}</BoardViewport>}</div>
    <PointScoreRuler/>
   </div>
   {coordinates}
  </>
 }
 return <><p className="board-hint">{v.capture?'Mill formed. Choose an opposing stone to remove.':'Use the arrow keys to inspect points and Enter to play.'}</p>{linear?<BoardViewport label={titles[v.game]+' board'}><div className={'board '+(linear?'gomoku':'morris-board')} style={linear?{gridTemplateColumns:'repeat('+size+',1fr)',gridTemplateRows:'repeat('+size+',1fr)'}:{}} aria-label={titles[v.game]+' board'}>
 {linear?null:<svg viewBox="0 0 100 100" aria-hidden="true">{mills.map((m,i)=><line key={i} x1={7+points[m[0]][0]*86/6} y1={7+points[m[0]][1]*86/6} x2={7+points[m[2]][0]*86/6} y2={7+points[m[2]][1]*86/6}/>)}</svg>}
 {v.board.map((_,i)=>cell(i))}</div></BoardViewport>:<div className={'board '+(linear?'gomoku':'morris-board')} style={linear?{gridTemplateColumns:'repeat('+size+',1fr)',gridTemplateRows:'repeat('+size+',1fr)'}:{}} aria-label={titles[v.game]+' board'}>
 {linear?null:<svg viewBox="0 0 100 100" aria-hidden="true">{mills.map((m,i)=><line key={i} x1={7+points[m[0]][0]*86/6} y1={7+points[m[0]][1]*86/6} x2={7+points[m[2]][0]*86/6} y2={7+points[m[2]][1]*86/6}/>)}</svg>}
 {v.board.map((_,i)=>cell(i))}</div>}{coordinates}</>
}
