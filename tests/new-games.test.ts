import {expect,it} from 'vitest'
import {start,move,view,timeout} from '../src/engine'

it('deals distinct physical cards, keeps opponent cards private, and scores the lowest unique kept value',()=>{
 let g=start('remove',['a','b','c'],10,0,{seed:312})
 expect(view(g,'a').hand).toHaveLength(2)
 expect(new Set(Object.values(g.hands).flat().map(c=>c.id)).size).toBe(6)
 g={...g,hands:{a:[{id:1,value:1},{id:2,value:4}],b:[{id:3,value:1},{id:4,value:5}],c:[{id:5,value:3},{id:6,value:6}]}}
 g=move(g,'a',1,1)!
 expect(view(g,'b').mine).toBeNull()
 expect(view(g,'b')).not.toHaveProperty('hands')
 expect(move(g,'a',0,2)).toBeNull()
 g=move(g,'b',1,1)!
 g=move(g,'c',1,1)!
 expect(view(g,'a').last).toEqual([1,1,3])
 expect(view(g,'a').scores).toEqual([5,5,7])
})
it('ends an all-tied Remove One game after eight rounds and three tiebreaks',()=>{
 let g=start('remove',['a','b','c'],10,0,{seed:312})
 for(let i=1;i<=11;i++)g=timeout(g,i*10)
 expect(g.done).toBe(true)
 expect(g.round).toBe(11)
 expect(g.winner).toBeNull()
})
it('Knight’s Tour starts from a validated route, rejects illegal moves, undoes and finishes',()=>{
 let g=start('knight',['a'],180000,0,{size:5,seed:312})
 const solution=g.tour
 expect(new Set(solution).size).toBe(25)
 expect(view(g,'a')).not.toHaveProperty('tour')
 expect(move(g,'a',solution[0],1)).toBeNull()
 g=move(g,'a',solution[1],1)!
 g=move(g,'a',-1,2)!
 expect(view(g,'a').path).toHaveLength(1)
 for(const [i,square] of solution.slice(1).entries()) g=move(g,'a',square,3+i)!
 expect(g.winner).toBe('a')
})
it('validates all supplied sizes including closed even boards and discloses only personal paths',()=>{
 for(const size of [5,6,8] as const)for(const closed of [false,true]){
  if(size===5&&closed)continue
  let g=start('knight',['a','b'],180000,0,{size,closed,seed:49})
  expect(new Set(g.tour).size).toBe(size*size)
  for(const [i,square] of g.tour.slice(1).entries())g=move(g,'a',square,i+1)!
  expect(g.winner).toBe('a')
  expect(view(g,'b').path).toHaveLength(1)
 }
})
