import {GradationLesson} from './gradation-ui'
export const extraLessons={gradation:{frames:[
 {title:'Load seven gates',caption:'Use every weight once. Put 1 through 7 in any order.'},
 {title:'Compare one gate',caption:'Both trays are sealed first. Here Copper’s 6 beats Jade’s 3.'},
 {title:'Build a streak',caption:'Three Copper wins in a row add one bonus. A side can earn it once per round.'},
 {title:'Mark a gate',caption:'Optional: pick one gate in secret. Winning that gate doubles its base point.'},
 {title:'Count the tide',caption:'Higher total wins after five rounds. A tie gets one extra round, then a draw.'},
],render:(step:number)=><GradationLesson step={step} caption={false}/>}} as const
