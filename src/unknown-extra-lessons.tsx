import {UnknownLesson} from './unknown-art'
import type {LessonMap} from './lesson-book'

export const extraLessons:LessonMap={unknown:{
 frames:[
  {title:'Read the mosaic',caption:'Each cube begins on its own edge socket. Race to the center seal.'},
  {title:'Roll, do not slide',caption:'A roll changes the cube’s top symbol. Watch how the chamber reacts.'},
  {title:'Nudge one cube',caption:'Roll into a rival to push it one space. The far space must be free.'},
  {title:'Reach the seal',caption:'First to the center wins. The chamber reveals a hidden law after every two circuits.'},
 ],
 render:step=><UnknownLesson step={step}/>,
}}
