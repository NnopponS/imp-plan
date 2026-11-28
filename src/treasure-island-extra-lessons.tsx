import {lazy,Suspense} from 'react'
import type {LessonMap} from './lesson-book'

const IslandLesson=lazy(()=>import('./treasure-island-lesson'))
export const extraLessons:LessonMap={
 treasureIsland:{
  frames:[
   {title:'Bid on one arrow',caption:'Spend up to 15 fictional chips across the auction. In this lot, a sealed bid of four wins against three; only the winner pays.'},
   {title:'Lay a route from E5',caption:'This straight arrow goes two cells east. A step north extends it to a new cell. Water, reefs and cells you already crossed are blocked.'},
   {title:'Read your private compass',caption:'Only your destination is dug. An empty cache gives the treasure’s grid distance and whether its row number is odd or even.'},
   {title:'Recover the treasure',caption:'A find ends the game after all current routes resolve. If five expeditions end without a find, unique caches rank first and closest dig breaks ties.'},
  ],
  render:step=><Suspense fallback={<span data-lesson-pending role="status">Unrolling the chart…</span>}><IslandLesson step={step}/></Suspense>,
 },
}
