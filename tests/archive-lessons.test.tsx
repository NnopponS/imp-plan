import {renderToStaticMarkup} from 'react-dom/server'
import {expect,it} from 'vitest'
import {extraLessons} from '../src/archive-extra-lessons'
import {countRectangles} from '../src/puzzles'
import {equationMarks,equationValid} from '../src/equations'
import {magicCheck,magicSolution} from '../src/divine'
import {rankPokerHand} from '../src/memory-poker'

it.each(Object.entries(extraLessons))('%s changes its illustration, not just its caption',(key,lesson)=>{
 const scenes=lesson.frames.map((_,i)=>{
  const html=renderToStaticMarkup(lesson.render(i))
  expect(html).toContain('role="img"')
  // Exclude both the slide index and its text: graphical geometry or ink must change.
  return html.replace(/<svg[^>]*>/,'<svg>').replace(/<text\b[^>]*>[\s\S]*?<\/text>/g,'')
 })
 expect(new Set(scenes).size,key).toBe(scenes.length)
})
it('uses valid rectangle totals, magic square, equations and five-card hand',()=>{
 expect(countRectangles([3,2,1,1],2,2,3)).toBe(2)
 expect(countRectangles([2,-2,5,-5],2,2,0)).toBe(3)
 expect(magicCheck(magicSolution(3,0),3)).toBe(true)
 expect(magicSolution(3,0).slice(0,3)).toEqual([8,1,6])
 for(const expression of ['12+13=25','10+12=22'])expect(equationValid(expression)).toBe(true)
 expect(new Set(equationMarks('12+13=25','10+12=22'))).toEqual(new Set(['exact','present','absent']))
 expect(rankPokerHand([8,9,10,11,12])?.name).toBe('Straight flush')
})
