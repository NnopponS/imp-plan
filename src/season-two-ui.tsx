import type {Snapshot} from './room'
import {RemoveOneBoard} from './remove-one-ui'
import {KnightTourBoard} from './knight-tour-ui'

export function SeasonTwo(props:{snap:Snapshot,active:boolean,submit:(n:number)=>void,name:(s:string)=>string}){
 return props.snap.game?.game==='remove'?<RemoveOneBoard {...props}/>:<KnightTourBoard {...props}/>
}
