import {expect,test} from 'vitest'
import {renderToStaticMarkup} from 'react-dom/server'
import {MancalaLesson,mancalaFrames,mancalaLessonState} from '../src/mancala-extra-lessons'
import {balance} from '../src/mancala'
test('visual Mancala moves follow real engine ownership, deposition, and scoring',()=>{
 expect(mancalaFrames).toHaveLength(4)
 expect(mancalaLessonState(0).pits[0]).toEqual([0,1])
 const before=mancalaLessonState(1),after=mancalaLessonState(2)
 expect(before.placements).toBe(8)
 expect(after.pits[0]).toEqual([])
 expect(after.pits[1]).toEqual([0])
 expect(after.pits[2]).toEqual([0,1])
 expect(after.last).toEqual({pit:2,earnedBy:1})
 expect(after.points).toEqual([[0,0,0],[0,0,2]])
 expect(balance(after.points[1])).toBe(0)
})
test('visual storyboard shows all pits and actual transfers, not the game poster',()=>{
 const render=(step:number)=>renderToStaticMarkup(<MancalaLesson step={step}/>)
 for(const step of [0,1,2,3])expect((render(step).match(/data-lesson-pit=/g)??[]).length).toBe(9)
 expect((render(2).match(/data-stone-transfer="true"/g)??[]).length).toBe(2)
 expect(render(0)).not.toContain('data-stone-transfer')
 expect(render(3)).toContain('Balanced score: 0')
})
