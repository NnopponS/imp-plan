import type {LessonMap} from './lesson-book'
import {shiftTower,type TowerStacks} from './equation-tower'
import {TowerPedestals} from './equation-tower-figures'

const base:TowerStacks=[[3,0],[2],[1,4,5],[6,7]]
const transferred=shiftTower(base,{from:0,to:1,count:2,flip:false})!
const lesson={
 frames:[
  {title:'Read the brass plates',caption:'This target is 11, with exactly three floors.'},
  {title:'Lift the top bundle',caption:'Lift the 7 and +2 together. The group costs one move.'},
  {title:'Set down the bundle',caption:'Keep its order and place it above ×2. A flip reverses the group instead.'},
  {title:'Prove the tower',caption:'Read 7 + 2 × 2 from the top. Multiplication comes first. In a party, match the move count you called.'},
 ],
 render:(i:number)=><div className="et-lesson" data-equation-lesson={i}>
  <div className="et-lesson-numbers"><span>Target <b>11</b></span><span>Floors <b>3</b></span></div>
  <TowerPedestals stacks={i<2?base:transferred} bundle={i===1?{from:0,count:2}:undefined} matching={i===3?1:null}/>
  <p>{i===3?'7 + 2 × 2 = 11':i===2?'A → B · one move':i===1?'Lift two blocks from A':'Four brass stands'}</p>
 </div>,
}
export const extraLessons:LessonMap={equationTower:lesson}
