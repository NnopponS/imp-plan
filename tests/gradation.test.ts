import {expect,test} from 'vitest'
import {gradationStart,gradationView,gradationLock,gradationTick,gradationBot,type Gradation} from '../src/gradation'
const up=[1,2,3,4,5,6,7],shift=[2,3,4,5,6,7,1]
const start=(seats=['a','b'],marked=false)=>gradationStart(seats,1234,0,25_000,marked)
function lockPair(s:Gradation,a:number[],b:number[],targets:[number|null,number|null]=[null,null]){
 const [one,two]=gradationView(s).allocators
 return gradationLock(gradationLock(s,one,a,targets[0],s.deadline!-2)!,two,b,targets[1],s.deadline!-1)!
}
const tick=(s:Gradation)=>gradationTick(s,s.deadline!)
function finishRound(s:Gradation){while(s.phase==='reveal')s=tick(s);return s}

test('requires an exact permutation; the private seal does not change another player or spectator view',()=>{
 const s=start(),other=gradationView(s,'b')
 for(const bad of [[1],[1,1,2,3,4,5,6],[1,2,3,4,5,6,8],[1,2,3,4,5,6,.2],new Array(7)])expect(gradationLock(s,'a',bad,null,1)).toBeNull()
 expect(gradationLock(s,'a',up,1,1)).toBeNull()
 expect(gradationLock(s,'no-seat',up,null,1)).toBeNull()
 expect(gradationLock(s,'a',up,null,25000)).toBeNull()
 const a=gradationLock(s,'a',up,null,1)!
 expect(gradationView(a,'a').mine?.order).toEqual(up)
 expect(gradationLock(a,'a',shift,null,2)).toBeNull()
 expect(gradationView(a,'b')).toEqual(other)
 expect(gradationView(a)).toEqual(gradationView(s))
 const b=gradationLock(a,'b',shift,null,2)!
 expect(gradationView(b).current.gates.map(g=>g.values)).toEqual([[1,2]])
 expect(gradationView(tick(b)).current.gates.map(g=>g.values)).toEqual([[1,2],[2,3]])
})
test('six straight wins pay the streak only once; double gate pays only its own winner',()=>{
 const s=start(['a','b'],true)
 expect(gradationLock(s,'a',up,null,1)).toBeNull()
 const showing=lockPair(s,shift,up,[4,0])
 expect(gradationView(showing).current.targets).toEqual([4,0])
 const next=finishRound(showing)
 expect(gradationView(next)).toMatchObject({round:2,phase:'arrange',totals:[8,1],history:[{points:[8,1]}]})
 expect(gradationView(next).history[0].gates.filter(g=>g.bonus!==null)).toHaveLength(1)
 expect(gradationView(next,'a').mine).toBeNull()
})
test('awards no streak across a tied gate; rotations, timeout fallback and replay are deterministic',()=>{
 const play=()=>{let s=start(['a','b','c','d']);s=tick(s)
 expect(gradationView(s).current.gates).toHaveLength(1)
 s=finishRound(s)
 expect(gradationView(s).allocators).toEqual(['c','d'])
 expect(gradationLock(s,'a',up,null,s.deadline!-1)).toBeNull()
 return gradationView(s)}
 expect(play()).toEqual(play())
 const n=finishRound(lockPair(start(),[2,4,3,5,7,1,6],up))
 expect(gradationView(n).history[0].gates.every(g=>g.bonus===null)).toBe(true)
})
test('five rounds; a tied match gets exactly one extra round then draw, or a winner',()=>{
 for(const upset of [false,true]){
  let s=start()
  for(let r=1;r<=6;r++){expect(s.round).toBe(r);s=finishRound(lockPair(s,r===6&&upset?shift:up,up))}
  expect(gradationView(s)).toMatchObject({phase:'done',winner:upset?0:null,round:6,history:Array(6).fill(expect.anything())})
  expect(tick(s)).toBe(s)
 }
 let s=start()
 for(let r=0;r<5;r++)s=finishRound(lockPair(s,shift,up))
 expect(gradationView(s)).toMatchObject({phase:'done',winner:0,round:5,totals:[35,5]})
})
test('bots derive a legal repeatable strategy from their own projection in each mode',()=>{
 for(const marked of [true,false])for(const level of ['easy','normal','hard'] as const){
  let s=finishRound(lockPair(start(['a','b'],marked),up,shift,marked?[0,2]:[null,null]))
  const mine=gradationView(s,'a')
  const bot=gradationBot(mine,'a',42,level)!
  expect(gradationBot(mine,'a',42,level)).toEqual(bot)
  s=gradationLock(s,'a',bot.order,bot.target,s.deadline!-1)!
  expect(gradationView(s,'a').mine).toEqual(bot)
  expect(gradationBot(gradationView(s,'a'),'a',42,level)).toBeNull()
 }
})
test('each side can earn its own streak; projected gate receipts are copies, not backdoors into the host',()=>{
 const s=finishRound(lockPair(start(),[2,3,6,1,4,5,7],up))
 const v=gradationView(s,'b')
 expect(v.history[0].points).toEqual([4,4])
 expect(v.history[0].gates.map(g=>g.bonus)).toEqual([null,null,0,null,null,1,null])
 v.history[0].gates[0].values[0]=77
 v.history[0].points[0]=77
 expect(gradationView(s,'b').history[0]).toMatchObject({points:[4,4],gates:[{values:[2,1]},...Array(6).fill(expect.anything())]})
})
