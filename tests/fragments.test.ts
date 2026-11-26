import {expect,it} from 'vitest'
import {fragmentDeal,fragmentNeed} from '../src/fragments'
import {start,view,timeout,move} from '../src/engine'

it('constructs 12 objective, unique-choice questions each with one valid key',()=>{
 for(let seed=0;seed<30;seed++){
  const d=fragmentDeal(seed)
  expect(d.questions).toHaveLength(12)
  expect(new Set(d.questions.map(q=>q.prompt)).size).toBe(12)
  for(const q of d.questions){
   expect(q.options.includes(q.answer)).toBe(true)
   expect(new Set(q.options).size).toBe(4)
  }
  expect(d.scene.objects).toHaveLength(9)
  expect(d.questions.find(q=>q.prompt.startsWith('What is the clock'))?.answer).toBe(d.scene.time)
 }
 expect(fragmentDeal(7)).toEqual(fragmentDeal(7))
})
it('rotates respondents after study without projecting truth, then meets the casual threshold',()=>{
 let s=start('fragments',['a','b','c'],20000,0,{seed:43})
 expect(view(s,'b').fragments!.scene).not.toBeNull()
 expect(move(s,'a',0,40000)).toBeNull()
 expect(timeout(s,44999)).toBe(s)
 s=timeout(s,45000)
 expect(view(s,'a').fragments!.scene).toBeNull()
 expect(view(s,'a').fragments!.question).not.toHaveProperty('answer')
 for(let i=0;i<12;i++){
  const seat=s.seats[i%3],q=s.fragments!.deal.questions[i],key=q.options.indexOf(q.answer)
  expect(view(s,seat).turn).toBe(seat)
  expect(move(s,s.seats[(i+1)%3],key,s.opened+500)).toBeNull()
  s=move(s,seat,i<2?(key+1)%4:key,s.opened+1000)!
 }
 expect(s.done).toBe(true)
 expect(view(s,'a').fragments!.correct).toBe(fragmentNeed(false,12))
 expect(view(s,'a').fragments!.passed).toBe(true)
})
it('treats a strict timeout as a miss, and never exposes a future question',()=>{
 let s=start('fragments',['a','b'],20000,0,{seed:12,fragmentStrict:true,fragmentCount:8})
 s=timeout(s,45000)
 const q=s.fragments!.deal.questions[1].prompt
 expect(JSON.stringify(view(s,'b'))).not.toContain(q)
 expect(move(s,'a',0,65000)).toBeNull()
 s=timeout(s,65000)
 expect(s.done).toBe(true)
 expect(view(s,'b').fragments!.passed).toBe(false)
 expect(view(s,'b').fragments!.scene).toBeNull()
})
