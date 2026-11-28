import {expect,test} from 'vitest'
import {renderToStaticMarkup} from 'react-dom/server'
import {BaghLesson,baghFrames,baghLessonModel} from '../src/bagh-lesson'
import {baghActions,baghEdges,baghInit} from '../src/bagh'
import {move,schedule,start} from '../src/engine'

test('the tutorial replays reachable positions and uses the official match winner and next leg',()=>{
 const lessons=baghFrames.map((_,i)=>baghLessonModel(i))
 for(const lesson of lessons){
  const {history,action,before,after}=lesson
  const state=history.reduce((current,a)=>{
   expect(current.done).toBe(false)
   const next=move(current,current.seats[current.turn],a,0)
   expect(next).not.toBeNull()
   return next!
  },start('bagh',schedule(['1','2'])[0],60_000,0,{seed:1}))
  if(lesson.kind==='swap'){
   expect(state.done).toBe(true)
   expect(before.seats).toEqual(state.seats)
   expect(after.seats).toEqual(schedule(state.seats)[1])
   expect(after.bagh).toEqual(baghInit())
   continue
  }
  expect(before).toEqual(state)
  expect(after).toEqual(action===undefined?state:move(state,state.seats[state.turn],action,0))
  expect(after.bagh!.banked+after.bagh!.captured+after.bagh!.board.filter(p=>p===1).length).toBe(20)
 }
 const [setup,place,step,jump,slide,tigers,goats,swap]=lessons
 expect(setup.after.bagh).toEqual(baghInit())
 expect(place.before.bagh).toEqual(setup.after.bagh)
 expect(place.after.bagh!.banked).toBe(19)
 expect(step.before.bagh).toEqual(place.after.bagh)
 expect(baghEdges).toContainEqual(Object.values(step.action as {from:number;to:number}))
 const {from,to}=jump.action as {from:number;to:number}
 expect(jump.before.bagh!.board[(from+to)/2]).toBe(1)
 expect(jump.after.bagh!.board[(from+to)/2]).toBe(0)
 expect(jump.after.bagh!.captured).toBe(1)
 expect(slide.before.bagh!.banked).toBe(0)
 expect(slide.before.turn).toBe(0)
 expect(baghEdges.some(edge=>edge.includes((slide.action as {from:number;to:number}).from)&&edge.includes((slide.action as {from:number;to:number}).to))).toBe(true)
 expect(tigers.before.bagh!.captured).toBe(4)
 expect(tigers.after.bagh!.captured).toBe(5)
 expect(tigers.after.winner).toBe(tigers.after.seats[1])
 expect(goats.before.bagh && baghActions(goats.before.bagh,1).length).toBeGreaterThan(0)
 expect(baghActions(goats.after.bagh!,1)).toEqual([])
 expect(goats.after.winner).toBe(goats.after.seats[0])
 expect(swap.after.seats).toEqual([...swap.before.seats].reverse())
})

test('each lesson shows the real board and exposes its result through a named diagram',()=>{
 expect(baghFrames).toHaveLength(8)
 baghFrames.forEach((frame,i)=>{
  expect(frame.title.trim()).not.toBe('')
  expect(frame.caption.trim()).not.toBe('')
  const {after}=baghLessonModel(i)
  const html=renderToStaticMarkup(<BaghLesson step={i}/>)
  expect(html).toContain('role="img"')
  expect(html).toMatch(/aria-labelledby="[^"]+"/)
  expect(html).toContain('data-bagh-step="'+i+'"')
  expect(html).toContain('data-banked="'+after.bagh!.banked+'"')
  expect(html).toContain('data-captured="'+after.bagh!.captured+'"')
 })
 expect(renderToStaticMarkup(<BaghLesson step={3}/>)).toContain('data-motion="jump"')
 expect(renderToStaticMarkup(<BaghLesson step={5}/>)).toContain('data-victory="tiger"')
 expect(renderToStaticMarkup(<BaghLesson step={6}/>)).toContain('data-victory="goat"')
 expect(renderToStaticMarkup(<BaghLesson step={7}/>)).toContain('data-motion="swap"')
})
