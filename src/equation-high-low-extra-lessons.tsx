import {lazy,Suspense} from 'react'
import {loadTable,TableLoadBoundary} from './lazy-table'
import type {LessonMap} from './lesson-book'

const Lesson=lazy(()=>loadTable(()=>import('./equation-high-low-ui')).then(m=>({default:m.EquationHighLowLesson})))

export const extraLessons={
 equationHighLow:{
  frames:[
   {title:'Check your private card',caption:'Pay one chip to enter the deal. See your own hidden face and two open faces at each seat.'},
   {title:'Bet, then see the final card',caption:'Check, call, raise, or fold. Once wagers match, the last open card starts a second betting pass.'},
   {title:'Arrange all four cards',caption:'Use +, −, and ÷ once each. Divide first: 8 ÷ 2 is 4, so this arrangement makes exactly 1.'},
   {title:'Seal your lane',caption:'Low chases 1; High chases 20. Swing uses two arrangements and only pays if both win.'},
   {title:'Read the split',caption:'Low and High split six chips, three each. The largest stack at the end of the match wins.'},
  ],
  render:step=><TableLoadBoundary title="Equation High-Low"><Suspense fallback={<span data-lesson-pending role="status">Opening the arithmetic salon…</span>}><Lesson step={step}/></Suspense></TableLoadBoundary>,
 },
} satisfies LessonMap
