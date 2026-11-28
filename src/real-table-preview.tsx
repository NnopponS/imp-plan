import {useMemo} from 'react'
import {ArenaTable} from './arena-table'
import {blindCoverAction,isDuel,minSeats,move,openMontageRound,start,timeout,titles,view,type Game} from './engine'
import {defaults,isHoldAuction,type Settings,type Snapshot} from './room'
import {memoryDuelDeal} from './memory-duel'
import {montageRules} from './montage'

const noCommand=()=>undefined
const sampleId=(index:number)=>'preview-seat-'+index
const sampleFixtures:Partial<Record<Game,readonly number[]>>={
 blind:[blindCoverAction(112,0),blindCoverAction(127,2),blindCoverAction(113,1),blindCoverAction(97,3)],
 morris:[0,3,6,12],point:[84,97,85,71],mancala:[0,4,0,5,3,5,6,7],
}
function previewSnapshot(game:Game,current?:Settings){
 const exact=current?.game===game?current:undefined
 const settings:Settings={...defaults,divineSide:3,...exact,game}
 const hold=isHoldAuction(settings)
 const episode=game==='memoryPoker'&&settings.memoryPokerMode==='episode'
 const solo=!hold&&!episode
 const count=hold||episode?2:minSeats(game,solo)
 const hostNow=1_800_000_000_000
 const options={
  solo,seed:31337,holdAuction:hold,memoryDuelDeal:episode?memoryDuelDeal(bound=>Math.floor(bound/3)):undefined,
  size:settings.size,closed:settings.closed,divineSide:settings.divineSide,divineHard:settings.divineHard,
  fragmentStrict:settings.fragmentStrict,fragmentCount:settings.fragmentCount,memoryPokerPeek:settings.memoryPokerPeek,
  symmetryAxis:settings.symmetryAxis,flagsMode:settings.flagsMode,coopReflect:settings.coopReflect,gradationMarked:settings.gradationMarked,
 }
 const seats:Snapshot['seats']=Array.from({length:count},(_,i)=>({
  id:sampleId(i),name:i===0?'Player':solo?'Bot '+i:'Guest '+i,ready:true,bot:solo&&i!==0,online:true,appearance:[0,4,12][i],
 }))
 const ids=seats.map(seat=>seat.id),you=ids[0]
 const opening=start(game,ids,settings.seconds*1000,hostNow,options)
 const seeded=(sampleFixtures[game]??[]).reduce((state,action)=>move(state,state.seats[state.turn],action,hostNow)??state,opening)
 const displayed=game==='montage'?hostNow+montageRules.countdownMs:hostNow
 const example=game==='montage'?timeout(openMontageRound(seeded,1,hostNow),displayed):seeded
 return {
  you,host:you,epoch:'preview',match:'preview-'+game,rev:0,hostNow:displayed,
  settings,seats,game:view(example,you,displayed),fixture:0,count:1,
  fixtures:isDuel(game)?[{sides:ids,winner:null}]:[],seriesDone:false,chat:[],
 } satisfies Snapshot
}

export function RealTablePreview({game,motionOff=false,settings}:{game:Game;motionOff?:boolean;settings?:Settings}){
 const snap=useMemo(()=>previewSnapshot(game,settings),[game,settings])
 const variant=snap.game.timeHold?'hold':snap.game.memoryDuel?'episode':undefined
 const context=variant==='hold'?'Hold & release':variant==='episode'?'Episode-style duel':'Example position'
 const nameOf=(id:string)=>snap.seats.find(seat=>seat.id===id)?.name??'Unknown'
 return <figure className="real-table-preview" data-real-table-preview={game} data-sample-variant={variant} data-sample-motion={motionOff?'off':undefined}>
  <figcaption><strong>Game table</strong><span>{context} · read-only</span></figcaption>
  <div className="real-table-window" role="region" aria-label={titles[game]+' table preview, example only'} tabIndex={0}>
   <div inert className="room" data-playing data-live-match data-sample-table data-game={game} data-layout={game==='blind'?'chamber':undefined}>
    <ArenaTable snap={snap} active={true} motionOff={motionOff} practice={!variant} preview receivedAt={performance.now()} nameOf={nameOf} command={noCommand} send={noCommand}/>
   </div>
  </div>
 </figure>
}
