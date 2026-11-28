import {ArrowTile,IslandMap} from './treasure-island-map'
import {islandRoute} from './treasure-island'
import './treasure-island.css'

const exampleRoute=islandRoute([{shape:'long',id:1},{shape:'step',id:0}],[{arrow:1,turn:1},{arrow:0,turn:0}])!
export default function IslandLesson({step}:{step:number}){
 return <div className="island-lesson" data-island-lesson="">
  <IslandMap example route={step===1?exampleRoute:[]} digs={step>=2?[{endpoint:33,kind:'clue'}]:[]} treasure={step===3?42:null}/>
  <aside>
   {step===0?<><ArrowTile shape="long"/><strong>4 chips beats 3</strong><small>Winner pays 4</small></>:step===1?<><ArrowTile shape="long" turn={1}/><ArrowTile shape="step"/><strong>E5 → G5 → G4</strong></>:step===2?<><strong>1 step away</strong><small>Odd-numbered row</small></>:<><strong>G5 · Treasure</strong><small>+10 bonus</small></>}
  </aside>
 </div>
}
