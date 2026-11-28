import {describe,expect,test} from 'vitest'
import {compareDice,diceBand,diceBot,diceDeal,diceLock,diceRounds,diceStart,diceTick,diceView,rankDice,type DiceHand,type Die} from '../src/triple-dice'

const seats=['Ada','Bo','Cy']
const hand=(...faces:DiceHand)=>faces
const ranks=(...faces:[Die,Die,Die])=>rankDice(faces)
const fixture=diceDeal(3,()=>1).map(()=>[
 hand(4,4,4,1),hand(4,4,4,2),hand(1,2,3,6)
])

describe('Triple Dice table',()=>{
 test('ranks triple, straight and double above distinct and applies face/kicker ordering',()=>{
  expect(compareDice(ranks(1,1,1),ranks(4,5,6))).toBeGreaterThan(0)
  expect(compareDice(ranks(5,6,4),ranks(6,6,5))).toBeGreaterThan(0)
  expect(compareDice(ranks(1,2,2),ranks(1,2,6))).toBeGreaterThan(0)
  expect(ranks(1,6,5).name).toBe('High dice')
  expect(compareDice(ranks(4,5,6),ranks(1,2,3))).toBeGreaterThan(0)
  expect(compareDice(ranks(6,1,1),ranks(2,2,1))).toBeLessThan(0)
  expect(compareDice(ranks(6,2,2),ranks(5,2,2))).toBeGreaterThan(0)
  expect(compareDice(ranks(6,3,1),ranks(5,4,2))).toBeGreaterThan(0)
 })
 test('averages occupied tie ranks exactly and forecasts base before adjustments, with zero floor',()=>{
  let s=diceStart(seats,10,100,undefined,fixture)
  s=diceLock(s,'Ada',[0,1,2],'low',12)!
  s=diceLock(s,'Bo',[2,0,1],'mid',13)!
  s=diceLock(s,'Cy',[0,1,2],'high',14)!
  const v=diceView(s,'Cy')
  expect(v.phase).toBe('review')
  expect(v.reveal).toEqual([
   expect.objectContaining({seat:'Ada',rank:1.5,base:1.5,actual:'low',prediction:'low',points:4.5}),
   expect.objectContaining({seat:'Bo',rank:1.5,base:1.5,actual:'low',prediction:'mid',points:0.5}),
   expect.objectContaining({seat:'Cy',rank:3,base:0,actual:'low',prediction:'high',points:0}),
  ])
  expect([3.5,4,6.5,7].map(diceBand)).toEqual(['low','mid','mid','high'])
 })
 test('a sole first-place hand at eight seats can forecast High for ten points',()=>{
  const names=Array.from({length:8},(_,i)=>'Seat '+i)
  const bank=diceDeal(8,()=>1).map(()=>names.map((_,i)=>i===0?hand(6,6,6,1):hand(1,2,3,4)))
  const s=names.reduce((next,seat,i)=>diceLock(next,seat,[0,1,2],i===0?'high':'low',12)!,diceStart(names,10,100,1,bank))
  const reveal=diceView(s).reveal!
  expect(reveal[0]).toMatchObject({rank:1,base:7,actual:'high',points:10})
  expect(reveal[1]).toMatchObject({rank:5,base:3,actual:'low',points:6})
 })
 test('commits faces before locking and never projects the seed, rival dice or rival lock before reveal',()=>{
  const s=diceStart(seats,10,100,112,fixture)
  const cy=diceView(s,'Cy'), watcher=diceView(s)
  expect(cy.mine?.dice).toEqual([1,2,3,null])
  expect(cy.table[0].publicDice).toEqual([4,4])
  expect(watcher.mine).toBeNull()
  expect(watcher).not.toHaveProperty('seed')
  expect(watcher).not.toHaveProperty('deal')
  const after=diceLock(s,'Ada',[0,1,3],'low',15)!
  expect(diceView(after,'Cy')).toEqual(cy)
  expect(diceView(after)).toEqual(watcher)
  expect(diceView(after,'Ada').mine?.choice).toEqual({positions:[0,1,3],prediction:'low'})
  const revealed=diceView(diceTick(after,110),'Cy')
  expect(revealed.reveal?.[0]?.dice).toEqual([4,4,1])
  expect(revealed.reveal?.[1]).toMatchObject({seat:'Bo',dice:null,points:0,rank:null})
  expect(revealed.mine?.dice[3]).toBeNull()
  expect(diceView(s,'Ada').mine?.choice).toBeNull()
 })
 test('rejects outsiders, repeated locks, invalid triplets and late actions',()=>{
  const s=diceStart(seats,10,100,112,fixture)
  for(const positions of [[0,0,1],[-1,0,1],[0,1,4],[0,1],[0,1,2,3],[0,1,2.5],Array(3)])expect(diceLock(s,'Ada',positions,'low',50)).toBeNull()
  expect(diceLock(s,'outsider',[0,1,2],'low',50)).toBeNull()
  expect(diceLock(s,'Ada',[0,1,2],'bad',50)).toBeNull()
  expect(diceLock(s,'Ada',[0,1,2],'low',110)).toBeNull()
  expect(diceLock(s,'Ada',[0,1,2],'low',9)).toBeNull()
  expect(diceLock(diceLock(s,'Ada',[0,1,2],'low',50)!,'Ada',[0,1,2],'low',51)).toBeNull()
 })
 test('times out into a complete review, advances one round, rotates priority, and ends after eight rounds',()=>{
  let s=diceStart(seats,10,100,112,fixture)
  for(let round=1;round<=diceRounds;round++){
   const a=diceView(s,'Ada')
   expect(a.round).toBe(round)
   expect(a.table[0].seat).toBe(seats[(round-1)%seats.length])
   expect(diceTick(s,a.deadline!-1)).toBe(s)
   const delayed=a.deadline!+30000
   s=diceTick(s,delayed)
   const review=diceView(s)
   expect(review.phase).toBe(round===8?'done':'review')
   if(round<8){
    expect(review.deadline).toBeGreaterThan(delayed)
    s=diceTick(s,review.deadline!)
   }
  }
  expect(diceView(s).leaders).toEqual(seats)
  expect(diceTick(s,999999)).toBe(s)
 })
 test('fully seeded replay is deterministic and dice stay in the d6 range',()=>{
  const a=diceStart(seats,0,100,137),b=diceStart(seats,0,100,137)
  expect(a).toEqual(b)
  expect(diceStart(seats,0,100,139)).not.toEqual(a)
  for(const round of a.deal)for(const tray of round)for(const face of tray)expect(face).toBeGreaterThanOrEqual(1),expect(face).toBeLessThanOrEqual(6)
 })
 test('bot uses only its projected dice and submits a legal three-die forecast',()=>{
  const s=diceStart(seats,10,100,112,fixture)
  const v=diceView(s,'Ada')
  const action=diceBot(v,19,'hard','Ada')!
  expect(action).toEqual({positions:[0,1,2],prediction:'low'})
  expect(diceLock(s,'Ada',action.positions,action.prediction,12)).not.toBeNull()
  expect(diceBot(diceView(s),19,'hard','watcher')).toBeNull()
 })
})
