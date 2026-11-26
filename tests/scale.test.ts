import {expect,test} from 'vitest'
import {start,move,timeout,view} from '../src/engine'
import {scaleDeal,calibration,scaleStart,scaleMove,packWeigh,packAnswer} from '../src/scale'
test('every reference calibration partitions the bounded menu in at most two legal comparisons per mineral',()=>{
 const references=new Set<number>()
 for(let seed=0;seed<192;seed++){
  const deal=scaleDeal(seed)
  references.add(deal.reference)
  expect(new Set(deal.weights).size).toBe(5)
  expect(deal.rank).toBe(1+deal.weights.filter(w=>w<deal.reference).length)
  for(let i=1;i<5;i++){
   let pool=deal.menu.slice()
   for(let comparison=0;pool.length>1;comparison++){
    expect(comparison).toBeLessThan(2)
    const pivot=pool[Math.floor(pool.length/2)]
    const [a,b]=calibration(pivot,deal.reference)!
    const left=[0,0,0,0,0],right=[b,0,0,0,0];left[i]=a
    const acted=scaleMove({...scaleStart(seed),weights:deal.weights},packWeigh(left,right))!
    expect(acted).not.toBeNull()
    const sign=acted.log.at(-1)!.sign
    pool=pool.filter(w=>Math.sign(w-pivot)===sign)
   }
   expect(pool).toEqual([deal.weights[i]])
  }
 }
 expect(references.size).toBeGreaterThan(1)
})
test('host rotates operator, hides weights, records equality, accepts one team answer',()=>{
 let g=start('scale',['a','b'],10000,100,{seed:20})
 const answer=g.scale!.weights
 const [a,b]=calibration(answer[1],answer[0])!
 const weighing=packWeigh([0,a,0,0,0],[b,0,0,0,0])
 expect(g.deadline).toBe(300100)
 expect(view(g,'b').scale).not.toHaveProperty('weights')
 expect(move(g,'b',weighing,101)).toBeNull()
 g=move(g,'a',weighing,102)!
 expect(g.turn).toBe(1)
 expect(view(g,'b').scale!.log[0].sign).toBe(0)
 expect(move(g,'a',packAnswer(answer),103)).toBeNull()
 g=move(g,'b',packAnswer(answer),104)!
 expect(g.done).toBe(true)
 expect(g.scale!.score).toBe(5)
 expect(move(g,'b',packAnswer(answer),105)).toBeNull()
 expect(view(g,'a').scale!.solution).toEqual(answer)
})
test('rejects illegal trays/answers and stops weighing after twelve reads',()=>{
 let g=start('scale',['a'],0,0)
 for(const action of [0,-1,15e6,packWeigh([4,4,0,0,0],[1,0,0,0,0]),packAnswer([g.scale!.reference,1,1,2,3])]){
  expect(move(g,'a',action,1)).toBeNull()
 }
 const weigh=packWeigh([1,0,0,0,0],[0,1,0,0,0])
 for(let i=0;i<12;i++)g=move(g,'a',weigh,i+1)!
 expect(move(g,'a',weigh,13)).toBeNull()
 expect(move(g,'a',packAnswer(g.scale!.weights),300000)).toBeNull()
 expect(timeout(g,300000).done).toBe(true)
 expect(timeout(g,300000).scale!.score).toBeNull()
})
