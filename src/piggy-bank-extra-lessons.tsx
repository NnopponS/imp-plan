import type {LessonMap} from './lesson-book'
import {PiggyCoin,PiggyFigure,PiggyShelf} from './piggy-bank-art'

const frames=[
 {title:'Start with two shelves',caption:'Every numbered pig starts with one black and one white coin.'},
 {title:'Feed the lower pig',caption:'Drop in one to five coins. Everyone sees what you add.'},
 {title:'Pass and claim',caption:'Send your lower pig to any rival’s top shelf. The receiver names one color’s count.'},
 {title:'Doubt the count',caption:'The first doubt opens that pig. Catch a wrong count for +1; a wrong doubt costs −1.'},
 {title:'Reset or race to five',caption:'All but one can request reset. The holdout can try to name every bank’s two totals.'},
]
export const extraLessons:LessonMap={piggyBank:{frames,render:i=><div key={i} className="piggy-lesson-stage" data-piggy-lesson={i}>
 <p>{['All banks: 1 black + 1 white','Bank 1 gets +2 black, +1 white','Bank 1 moves to the receiver','Claim: 2 black · Actual: 3 black','All totals right: +3 · any error: −2'][i]}</p>
 <div className="piggy-lesson-shelves">
  <PiggyShelf label="Your lower" bank={i<2?1:5} selected={i===1}/>
  <PiggyShelf label="Your upper" bank={i<2?5:null}/>
  {i===3?<div className="piggy-shelf" data-selected><span className="piggy-shelf-label">Opened bank</span><PiggyFigure bank={1} open/><span className="piggy-shelf-detail">Bank 1</span></div>:
   <PiggyShelf label="Rival’s upper" bank={i<2?null:1} selected={i===2}/>}
 </div>
 <div className="piggy-lesson-mark" aria-hidden="true">{(i===0?['black','white']:i<4?['black','black',i===3?'black':'white']:['black','white']).map((color,j)=><PiggyCoin key={j} color={color as 'black'|'white'}/>)}</div>
 </div>}}
