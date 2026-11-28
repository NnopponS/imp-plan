import {lazy,Suspense} from 'react'
import {loadTable,TableLoadBoundary} from './lazy-table'
import {diceLessonFrames} from './triple-dice-lesson-data'

const DiceLesson=lazy(()=>loadTable(()=>import('./triple-dice-ui')).then(m=>({default:m.TripleDiceLesson})))

export const extraLessons={
 tripleDice:{
  frames:diceLessonFrames,
  render:(step:number)=><TableLoadBoundary title="Triple Dice"><Suspense fallback={<span>Opening tray…</span>}><DiceLesson step={step} embedded/></Suspense></TableLoadBoundary>,
 },
}
