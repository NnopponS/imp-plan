import {expect,it} from 'vitest'
import {fragmentDeal,fragmentNeed} from '../src/fragments'
import {start,view,timeout,move} from '../src/engine'
import {Host} from '../src/room'

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

it('omits expired study state from a guest snapshot even before the host tick advances the round',()=>{
 let now=1000
 const host=new Host('Curator',()=>now)
 const config={...host.settings,game:'fragments' as const,fragmentStrict:true}
 expect(host.command('host','configure',host.rev,{kind:'config',settings:config})).toBeNull()
 expect(host.join('reader','Reader')).not.toBeNull()
 expect(host.command('reader','ready',host.rev,{kind:'ready'})).toBeNull()
 expect(host.command('host','start',host.rev,{kind:'start'})).toBeNull()
 const wire=()=>JSON.parse(JSON.stringify({type:'snapshot',state:host.snapshot('reader')})).state.game
 now=45999
 expect(wire().fragments.scene.objects).toHaveLength(9)
 expect(wire().fragments.question).toBeNull()
 now=46000
 const expired=wire()
 expect(expired.fragments.scene).toBeNull()
 expect(expired.fragments.question).toBeNull()
 expect(expired).not.toHaveProperty('seed')
 expect(host.game!.fragments!.study).toBe(true)
 expect(host.tick()).toBe(true)
 const recall=wire()
 expect(recall.deadline-now).toBe(20_000)
 expect(recall.fragments.scene).toBeNull()
 expect(Object.keys(recall.fragments.question).sort()).toEqual(['options','prompt'])
 expect(recall.fragments.question.options).toHaveLength(4)
 expect(recall.fragments).not.toHaveProperty('deal')
})
