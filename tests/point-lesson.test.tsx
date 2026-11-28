import {expect,test} from 'vitest'
import {renderToStaticMarkup} from 'react-dom/server'
import {PointLesson,pointFrames,pointLessonState} from '../src/point-extra-lessons'
import {view} from '../src/engine'

test('Point Gomoku lesson uses a legal 13 × 13 position and real incremental scoring',()=>{
 expect(pointFrames).toHaveLength(5)
 const states=pointFrames.map((_,step)=>pointLessonState(step))
 expect(states.map(s=>s.board.length)).toEqual([169,169,169,169,169])
 expect(states.map(s=>view(s,'gold').scores)).toEqual([[0,0],[1,0],[3,0],[8,0],[8,0]])
 expect(states.map(s=>s.board.filter(p=>p==='gold').length)).toEqual([1,3,4,5,6])
 expect(states.every(s=>!s.done)).toBe(true)
})
test('the lesson keeps the board in place, animates the newly placed piece, and only highlights newly scoring lines',()=>{
 const render=(step:number)=>renderToStaticMarkup(<PointLesson step={step}/>)
 for(const step of [0,1,2,3,4]){
  const html=render(step)
  expect((html.match(/data-point-gridline=/g)??[]).length).toBe(28)
  expect((html.match(/data-point-new="true"/g)??[]).length).toBe(1)
  expect(html.includes('data-point-line')).toBe(step>0&&step<4)
 }
 expect(render(3)).toContain('Gold total: 8. This move: +5.')
 expect(render(4)).toContain('Gold total: 8. This move: +0.')
 expect(render(-10)).toBe(render(0))
 expect(render(99)).toBe(render(4))
})
