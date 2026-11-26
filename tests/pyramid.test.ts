import {expect,it} from 'vitest'
import {pyramidFraction,pyramidDeal,pyramidChoices,packPyramid,pyramidValid} from '../src/pyramid'
import {start,move,timeout,view} from '../src/engine'

it('uses exact rational arithmetic and both parenthesizations',()=>{
 expect(pyramidFraction([1,2,3],3,0,false)).toEqual({n:7,d:2})
 expect(pyramidFraction([1,2,3],3,0,true)).toEqual({n:1,d:5})
 expect(pyramidFraction([1,2,2],3,1,true)).toBeNull()
 expect(pyramidFraction([1,2,3],1,1,false)).toEqual({n:-4,d:1})
})
it('enumerates ten valid triangles and verifies every seeded deal',()=>{
 expect(pyramidChoices).toHaveLength(10)
 expect(packPyramid([0,1,1],0,0,false)).toBeNull()
 expect(packPyramid([0,1,3],0,0,false)).toBeNull()
 for(let i=1;i<=8;i++)for(let seed=0;seed<16;seed++){
  const p=pyramidDeal(seed,i)
  expect(p.values.every(v=>v>=1&&v<=12)).toBe(true)
  expect(pyramidValid(p,p.witness)).toBe(true)
 }
 expect(new Set(Array.from({length:8},(_,i)=>pyramidDeal(42,i+1).values.join(','))).size).toBe(8)
})
it('keeps guesses and scores private until settle, then gives first 2 and others 1',()=>{
 let s=start('pyramid',['a','b','c'],45000,0,{seed:7})
 const {witness}=pyramidDeal(7,1)
 s=move(s,'b',witness,500)!
 expect(view(s,'a').pyramid!.locked).toBe(false)
 expect(view(s,'a').pyramid).not.toHaveProperty('witness')
 expect(view(s,'a').scores).toEqual([0,0,0])
 expect(move(s,'b',witness,700)).toBeNull()
 s=move(s,'a',witness,1000)!
 expect(move(s,'c',witness,45000)).toBeNull()
 s=timeout(s,45000)
 expect(s.round).toBe(2)
 expect(view(s,'c').scores).toEqual([1,2,0])
 expect(view(s,'c').last).toEqual([1,2,0])
})
it('finishes all eight rounds and uses correct-answer time to resolve score ties',()=>{
 let s=start('pyramid',['a','b'],45000,0,{seed:9})
 for(let r=1;r<=8;r++){
  const {witness}=pyramidDeal(9,r),now=s.opened
  const first=r%2?'a':'b',second=r%2?'b':'a'
  s=move(s,first,witness,now+(r%2?200:100))!
  s=move(s,second,witness,now+(r%2?450:300))!
 }
 expect(s.done).toBe(true)
 expect(view(s,'a').scores).toEqual([12,12])
 expect(s.winner).toBe('a')
})
