import {expect,test} from 'vitest'
import {hitStart,hitTotal,hitApply,hitTick,hitView,hitRules,hitDeck,type HitCard,type HitState} from '../src/hit-stay'
const card=(rank:number,suit:HitCard['suit']='spade'):HitCard=>({rank,suit})
const shoe=(...ranks:number[])=>[...ranks.map(r=>card(r)),...Array.from({length:52-ranks.length},()=>card(2))]
const setup=(...ranks:number[])=>hitStart(['a','b'],31,100,15_000,[shoe(...ranks)],0)
const command=(g:HitState,action:'hit'|'stay',now=101)=>hitApply(g,hitView(g).turn!,action,now)!
const chipCount=(g:HitState)=>hitView(g).seats.reduce((n,s)=>n+s.chips,0)+hitView(g).pot

test('soft aces degrade to avoid busting, and faces are worth ten',()=>{
 expect(hitTotal([card(1),card(1),card(9)])).toEqual(21)
 expect(hitTotal([card(1),card(13),card(12),card(1)])).toEqual(22)
 expect(hitTotal([card(1),card(13),card(1)])).toEqual(12)
})
test('only your own hand has values while playing; all dealt hands flip for the review',()=>{
 const g=setup(8,1,10,13,5)
 const av=hitView(g,'a'),bv=hitView(g,'b')
 expect(av.mine?.cards.map(c=>c.rank)).toEqual([8,10])
 expect(bv.mine?.cards.map(c=>c.rank)).toEqual([1,13])
 expect(av.seats).toEqual(bv.seats)
 expect(av.seats.every(s=>s.count===2&&!Object.hasOwn(s,'cards')&&!Object.hasOwn(s,'total'))).toBe(true)
 expect(av.reveal).toBeNull()
 expect(hitView(g).mine).toBeNull()
 expect(chipCount(g)).toBe(40)
 const next=command(g,'hit')
 expect(hitView(next,'b').seats[0]).toMatchObject({status:'bust',count:3})
 const review=command(next,'stay')
 expect(hitView(review).reveal).toMatchObject({winners:['b'],paid:4,rows:[{total:23},{total:21}]})
 expect(chipCount(review)).toBe(40)
})
test('ties divide the pot, everybody busting returns the ante, and remainders follow the opener',()=>{
 let g=setup(8,8,10,10)
 for(const _ of [0,1])g=command(g,'stay')
 expect(hitView(g).seats.map(s=>s.chips)).toEqual([20,20])
 expect(hitView(g).reveal?.winners).toEqual(['a','b'])
 let refund=setup(10,10,10,10,10,10)
 for(const _ of [0,1])refund=command(refund,'hit')
 expect(hitView(refund).reveal).toMatchObject({winners:[],paid:4})
 expect(hitView(refund).seats.map(s=>s.chips)).toEqual([20,20])
 let odd=hitStart(['a','b','c'],13,100,15_000,[shoe(10,10,10,8,8,8)],1)
 for(const _ of [0,1,2])odd=command(odd,'stay')
 expect(hitView(odd).reveal?.winners).toEqual(['b','c','a'])
 let remainder=hitStart(['a','b','c','d'],9,100,15_000,[shoe(10,10,10,10,8,8,8,7)],1)
 for(const _ of [0,1,2,3])remainder=command(remainder,'stay')
 expect(hitView(remainder).seats.map(s=>s.chips)).toEqual([18,21,21,20])
})
test('rotates through undecided seats, rejects wrong, late and invalid intent, locks the seventh card',()=>{
 let g=setup(...Array(12).fill(2))
 expect(hitApply(g,'b','hit',101)).toBeNull()
 expect(hitApply(g,'a','fold',101)).toBeNull()
 expect(hitApply(g,'a','hit',15100)).toBeNull()
 g=command(g,'hit')
 expect(hitView(g).turn).toBe('b')
 g=command(g,'stay')
 expect(hitView(g).turn).toBe('a')
 for(const _ of [0,1,2,3])g=command(g,'hit')
 expect(hitView(g).phase).toBe('review')
 expect(hitView(g).reveal?.rows[0]).toMatchObject({status:'stayed',count:7,total:14})
 const next=hitApply(g,'a','deal',101)!
 expect(hitView(next).turn).toBe('b')
 const timed=hitTick(next,15101)
 expect(hitView(timed).turn).toBe('a')
 expect(hitView(timed).seats[1].status).toBe('stayed')
 expect(hitTick(timed,15101)).toBe(timed)
})
test('eight seats can draw the maximum without reshuffling mid-hand and seeded matches are replayable',()=>{
 expect(hitDeck(7,n=>n-1)).toHaveLength(52)
 const deck=hitDeck(8,n=>n-1)
 expect(deck).toHaveLength(104)
 expect(deck.filter(c=>c.suit==='spade'&&c.rank===1)).toHaveLength(2)
 expect(()=>hitStart(['one'],91,100,15_000)).toThrow()
 const seats=['a','b','c','d','e','f','g','h']
 const run=()=>{
  let g=hitStart(seats,91,100,15_000)
  for(let i=0;hitView(g).phase!=='finished';i++){
   if(i>8*(8*6+1))throw Error('Match did not terminate')
   g=hitView(g).phase==='review'?hitApply(g,'a','deal',200+i)!:command(g,'hit',200+i)
   expect(chipCount(g)).toBe(160)
   expect(hitView(g).seats.every(s=>s.count<=7)).toBe(true)
  }
  expect(hitView(g).round).toBe(hitRules.rounds)
  expect(hitView(g).leaders.length).toBeGreaterThan(0)
  return g
 }
 expect(run()).toEqual(run())
})

test('the largest roster takes 56 private cards, then shuffles only once for the next hand',()=>{
 const ids=['a','b','c','d','e','f','g','h']
 let g=hitStart(ids,13,100,15_000,[Array.from({length:104},()=>card(2)),Array.from({length:104},()=>card(4))],0)
 for(let i=0;i<40;i++)g=command(g,'hit',101+i)
 expect(hitView(g).phase).toBe('review')
 expect(hitView(g).reveal?.rows.flatMap(r=>r.cards)).toHaveLength(56)
 expect(hitView(g).reveal?.rows.every(r=>r.total===14)).toBe(true)
 expect(hitTick(g,hitRules.reviewMs+139)).toBe(g)
 g=hitTick(g,hitRules.reviewMs+140)
 expect(hitView(g,'a').mine?.total).toBe(8)
 expect(hitView(g).turn).toBe('b')
 expect(hitView(g).reveal).toBeNull()
})
