import {describe,expect,test} from 'vitest'
import {bigSmallBot,bigSmallStart,bigSmallStep,bigSmallView,type BigSmallAction,type BigSmallState} from '../src/big-small'

const seats=['Ada','Bram']
const start=(seed=42)=>bigSmallStart(seats,seed)
const act=(s:BigSmallState,seat:string,action:BigSmallAction)=>{
 const next=bigSmallStep(s,seat,action)
 expect(next).not.toBeNull()
 return next!
}
const direction=(card:number,reference:number)=>card>reference?'big':'small'
function settle(s:BigSmallState,card:number,call:'big'|'small',prediction:'big'|'small',stake=1){
 const v=bigSmallView(s)
 return act(act(s,v.duelist!,{kind:'seal',card,call}),v.bettor!,{kind:'predict',prediction,stake})
}
function round(s:BigSmallState,card:number,call:'big'|'small',prediction:'big'|'small',stake=1){
 const next=settle(s,card,call,prediction,stake)
 return next.stage.phase==='reveal'?act(next,'Ada',{kind:'advance'}):next
}

describe('Big Small fan duel',()=>{
 test('starts only with two uniquely named seats and seeded independent reference stacks',()=>{
  expect(()=>bigSmallStart(['Ada'],0)).toThrow()
  expect(()=>bigSmallStart(['Ada','Ada'],0)).toThrow()
  expect(()=>bigSmallStart(['Ada','Bram','Cora'],0)).toThrow()
  expect(()=>bigSmallStart(seats,Infinity)).toThrow()
  expect(start()).toEqual(start())
  expect(start(43)).not.toEqual(start())
  expect(bigSmallView(start())).toMatchObject({phase:'seal',round:1,totalRounds:18,duelist:'Ada',bettor:'Bram',chips:[10,10],ownCards:[]})
 })
 test('sealed card+call stay private; settlement scores the two roles independently',()=>{
  const s=start(),v=bigSmallView(s,'Ada')
  const call=direction(10,v.reference!)
  expect(bigSmallStep(s,'Bram',{kind:'seal',card:10,call})).toBeNull()
  expect(bigSmallStep(s,'Ada',{kind:'seal',card:11,call})).toBeNull()
  const hidden=act(s,'Ada',{kind:'seal',card:10,call})
  expect(bigSmallView(hidden,'Ada').ownSeal).toEqual({card:10,call})
  for(const seat of ['Bram','observer',undefined]){
   const opponent=bigSmallView(hidden,seat)
   expect(opponent).toMatchObject({phase:'predict',sealed:true,ownSeal:null,latest:null,history:[]})
   expect(Object.keys(opponent)).not.toContain('seed')
   expect(Object.keys(opponent)).not.toContain('decks')
  }
  expect(bigSmallView(hidden,'observer').ownCards).toEqual([])
  expect(bigSmallStep(hidden,'Ada',{kind:'predict',prediction:'big',stake:3})).toBeNull()
  expect(bigSmallStep(hidden,'Bram',{kind:'predict',prediction:'big',stake:4})).toBeNull()
  expect(bigSmallStep(hidden,'Bram',{kind:'predict',prediction:'big',stake:0})).toBeNull()
  expect(bigSmallStep(hidden,'Bram',{kind:'predict',prediction:'big',stake:1.5})).toBeNull()
  const result=act(hidden,'Bram',{kind:'predict',prediction:'small',stake:3})
  expect(bigSmallView(result,'Bram')).toMatchObject({phase:'reveal',chips:[20-v.reference!,7],latest:{card:10,call,relation:'big',duelistDelta:10-v.reference!,bettorDelta:-3}})
  expect(bigSmallStep(result,'observer',{kind:'advance'})).toBeNull()
  expect(bigSmallView(act(result,'Bram',{kind:'advance'}))).toMatchObject({phase:'seal',round:2,duelist:'Bram',bettor:'Ada'})
 })
 test('equal refunds the stake and incorrect duelist calls add nothing',()=>{
  const s=start(),reference=bigSmallView(s).reference!
  expect(bigSmallView(settle(s,reference,'big','small',3))).toMatchObject({chips:[10,10],latest:{relation:'equal',duelistDelta:0,bettorDelta:0}})
  expect(bigSmallView(settle(s,0,'big','small',3))).toMatchObject({chips:[10,13],latest:{relation:'small',duelistDelta:0,bettorDelta:3}})
 })
 test('rejects a used card and finishes at exactly zero chips',()=>{
  const opposite=(side:'big'|'small')=>side==='big'?'small':'big'
  let s=round(start(),10,'big','small',3)
  s=round(s,0,'big','small')
  expect(bigSmallStep(s,'Ada',{kind:'seal',card:10,call:'big'})).toBeNull()
  for(let i=0;i<2;i++){
   for(const seat of seats){
    const v=bigSmallView(s,seat)
    const card=v.ownCards.find(n=>n!==v.reference)!
    const side=direction(card,v.reference!)
    s=seat==='Ada'?round(s,card,side,opposite(side),3):round(s,card,opposite(side),side)
   }
  }
  const v=bigSmallView(s,'Ada')
  expect(v.chips[1]).toBe(1)
  const card=v.ownCards.find(n=>n!==v.reference)!
  const side=direction(card,v.reference!)
  const sealed=act(s,'Ada',{kind:'seal',card,call:side})
  expect(bigSmallView(sealed,'Bram').maxStake).toBe(1)
  expect(bigSmallStep(sealed,'Bram',{kind:'predict',prediction:opposite(side),stake:2})).toBeNull()
  const end=act(sealed,'Bram',{kind:'predict',prediction:opposite(side),stake:1})
  expect(bigSmallView(end)).toMatchObject({phase:'finished',winner:'Ada',end:'stack-empty',chips:[expect.any(Number),0]})
 })
 test('18 alternating unique references and equal cards run into a complete swapped-start tiebreak',()=>{
  let s=start()
  for(let i=0;i<18;i++){
   const v=bigSmallView(s)
   expect(v.duelist).toBe(seats[i%2])
   const next=settle(s,v.reference!,'big','small')
   s=i===17?next:act(next,'Ada',{kind:'advance'})
  }
  const review=bigSmallView(s)
  expect(review).toMatchObject({phase:'reveal',round:18,tiePending:true,chips:[10,10]})
  for(const seat of seats){
   expect(review.history.filter(r=>r.duelist===seat).map(r=>r.reference).sort()).toEqual([1,2,3,4,5,6,7,8,9])
  }
  s=act(s,'Bram',{kind:'advance'})
  expect(bigSmallView(s)).toMatchObject({phase:'seal',set:'tiebreak',round:1,totalRounds:2,duelist:'Bram',chips:[10,10]})
  s=round(s,10,'big','small')
  expect(bigSmallView(s)).toMatchObject({round:2,duelist:'Ada'})
  const ref=bigSmallView(s).reference!
  s=settle(s,ref,'small','small')
  expect(bigSmallView(s)).toMatchObject({phase:'finished',end:'tiebreak',winner:'Bram'})
  expect(bigSmallView(s).history).toHaveLength(20)
 })
 test('a second exact tie records a draw; a non-tied regular game stops without an extra set',()=>{
  let tied=start(),won=start()
  for(let i=1;i<=18;i++){
   tied=round(tied,bigSmallView(tied).reference!,'big','small')
   won=round(won,i===1?10:bigSmallView(won).reference!,'big',i===1?'small':'big')
  }
  expect(bigSmallView(won)).toMatchObject({phase:'finished',end:'round-limit',winner:'Ada',round:18})
  for(let i=1;i<=2;i++)tied=round(tied,bigSmallView(tied).reference!,'big','small')
  expect(bigSmallView(tied)).toMatchObject({phase:'finished',end:'draw',winner:null,round:2})
 })
 test('bot predicts from public information, not the other seat’s sealed value',()=>{
  const s=start()
  const a=act(s,'Ada',{kind:'seal',card:0,call:'small'})
  const b=act(s,'Ada',{kind:'seal',card:10,call:'big'})
  expect(bigSmallView(a,'Bram')).toEqual(bigSmallView(b,'Bram'))
  for(const level of ['easy','normal','hard'] as const){
   const action=bigSmallBot(bigSmallView(a,'Bram'),'Bram',73,level)
   expect(action).toEqual(bigSmallBot(bigSmallView(b,'Bram'),'Bram',73,level))
   expect(bigSmallStep(a,'Bram',action!)).not.toBeNull()
  }
 })
})
