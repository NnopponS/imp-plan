import {expect,it} from 'vitest'
import {codeChallenge,solveCode,packCode} from '../src/code-lock'
import {start,move,view,timeout} from '../src/engine'

it('proves bounded and uniquely solvable clue sets across seeds',()=>{
 for(let seed=0;seed<36;seed++){
  const puzzle=codeChallenge(Math.imul(seed,2654435761)>>>0)
  expect(puzzle.clues.length).toBeGreaterThanOrEqual(6)
  expect(puzzle.clues.length).toBeLessThanOrEqual(12)
  expect(new Set(puzzle.clues.map(c=>c.kind))).toEqual(new Set(['sum','exclude','adjacent','order','count']))
  expect(solveCode(puzzle.clues)).toEqual([puzzle.answer])
 }
 expect(codeChallenge(42)).toEqual(codeChallenge(42))
 expect(packCode([0,0,1,2])).toBeNull()
})
it('hides attempts and their scores until all seats finish; caps and shortens the clock for wrong answers',()=>{
 let s=start('codeLock',['a','b'],180000,0,{seed:42})
 const answer=s.codeLock!.challenge.answer
 const bad=answer.map((_,i)=>answer[(i+1)%4])
 const other=answer.slice(); other[0]=Array.from({length:12},(_,i)=>i).find(x=>!answer.includes(x))!
 expect(move(s,'a',0,1000)).toBeNull()
 s=move(s,'a',packCode(other)!,1000)!
 expect(view(s,'b').codeLock!.attempts).toEqual([])
 expect(view(s,'a').codeLock!.attempts[0].correct).toBeNull()
 expect(view(s,'a').codeLock!.penalty).toBe(15000)
 expect(view(s,'b').codeLock!.penalty).toBe(0)
 expect(view(s,'b').scores).toEqual([0,0])
 for(let i=0;i<2;i++)s=move(s,'a',packCode(bad)!,1001+i)!
 expect(s.done).toBe(false)
 expect(move(s,'a',packCode(answer)!,1004)).toBeNull()
 s=move(s,'b',packCode(bad)!,169000)!
 expect(s.done).toBe(true)
 expect(s.winner).toBe('a')
 expect(view(s,'b').scores).toEqual([3,0])
})
it('gives practice feedback and a legal first solve ends the race instantly',()=>{
 let s=start('codeLock',['a'],180000,0,{seed:3,solo:true})
 const answer=s.codeLock!.challenge.answer
 const bad=answer.map((_,i)=>answer[(i+1)%4])
 for(let i=0;i<4;i++)s=move(s,'a',packCode(bad)!,1000+i)!
 expect(view(s,'a').codeLock!.attempts.at(-1)?.correct).toBe(0)
 expect(view(s,'a').codeLock!.penalty).toBe(0)
 expect(timeout(s,179999)).toBe(s)
 expect(timeout(s,180000).done).toBe(true)
 s=move(s,'a',packCode(answer)!,1100)!
 expect(s.done).toBe(true)
 expect(s.winner).toBe('a')
})
