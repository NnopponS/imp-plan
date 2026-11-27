import {describe,expect,it} from 'vitest'
import {
 memoryPokerAction,memoryPokerDeal,memoryPokerPeekAction,memoryPokerStart,memoryPokerTick,memoryPokerView,
 packMemoryPoker,rankPokerHand,
} from '../src/memory-poker'

const face=(rank:number,suit=0)=>suit*13+rank-2
const hand=(ranks:number[],suits=[0,1,2,3,0])=>ranks.map((rank,i)=>face(rank,suits[i]))
const pick=(positions:number[])=>packMemoryPoker(positions)!
const start=120_000

describe('standard five-card poker',()=>{
 it.each([
  ['Straight flush',[14,13,12,11,10],[2,2,2,2,2],[8,14]],
  ['Four of a kind',[4,4,4,4,14],[0,1,2,3,0],[7,4,14]],
  ['Full house',[6,6,6,8,8],[0,1,2,0,1],[6,6,8]],
  ['Flush',[14,11,8,4,2],[1,1,1,1,1],[5,14,11,8,4,2]],
  ['Straight',[14,5,4,3,2],[0,1,2,3,0],[4,5]],
  ['Three of a kind',[8,8,8,14,2],[0,1,2,0,1],[3,8,14,2]],
  ['Two pair',[7,7,6,6,14],[0,1,2,3,0],[2,7,6,14]],
  ['One pair',[5,5,10,7,3],[0,1,2,3,0],[1,5,10,7,3]],
  ['High card',[14,12,10,7,3],[0,1,2,3,0],[0,14,12,10,7,3]],
 ] as const)('ranks %s, including its tiebreak order',(name,ranks,suits,strength)=>{
  expect(rankPokerHand(hand([...ranks],[...suits]))).toEqual({name,strength:[...strength]})
 })
 it('rejects malformed hands instead of awarding ranks',()=>{
  expect(rankPokerHand([0,0,1,2,3])).toBeNull()
  expect(rankPokerHand([0,1,2,3,52])).toBeNull()
  expect(rankPokerHand([0,1,2,3,4.5])).toBeNull()
  expect(rankPokerHand([0,1,2,3])).toBeNull()
 })
})

describe('Memory Poker fan game',()=>{
 it('uses reproducible 20-card layouts with unique faces and a fresh layout each round',()=>{
  for(const seed of [0,1,3000,0xffffffff]){
   const rounds=Array.from({length:4},(_,i)=>memoryPokerDeal(seed,i+1))
   for(const deal of rounds){
    expect(new Set(deal).size).toBe(20)
    expect(deal.every(card=>Number.isInteger(card)&&card>=0&&card<52)).toBe(true)
   }
   expect(new Set(rounds.map(cards=>cards.join(','))).size).toBe(4)
   expect(rounds[1]).toEqual(memoryPokerDeal(seed,2))
  }
 })
 it('requires one to sixteen unique occupied seats',()=>{
  expect(()=>memoryPokerStart(2,[],start)).toThrow()
  expect(()=>memoryPokerStart(2,['x','x'],start)).toThrow()
  expect(()=>memoryPokerStart(2,Array.from({length:17},(_,i)=>String(i)),start)).toThrow()
  expect(memoryPokerStart(2,Array.from({length:16},(_,i)=>String(i)),start).phase).toBe('study')
 })
 it('shows study faces until the 25s boundary, then never sends unselected faces or seed',()=>{
  const g=memoryPokerStart(5,['left','right'],start)
  const before=memoryPokerTick(g,start+24_999)
  expect(before).toBe(g)
  expect(memoryPokerView(before,'left').cards.every(card=>card!==null)).toBe(true)
  expect(memoryPokerView(before,'outsider').cards).toEqual(Array(20).fill(null))
  const after=memoryPokerTick(g,start+25_000)
  expect(after.phase).toBe('select')
  const view=memoryPokerView(after,'left')
  expect(view.cards).toEqual(Array(20).fill(null))
  expect(view).not.toHaveProperty('seed')
  expect(view).not.toHaveProperty('layout')
  expect(view).not.toHaveProperty('picks')
  expect(memoryPokerAction(g,'left',pick([0,1,2,3,4]),start+24_999)).toBeNull()
  expect(memoryPokerAction(g,'left',pick([0,1,2,3,4]),start+55_000)).toBeNull()
 })
 it('locks exactly five distinct in-range positions once; other seats may choose the same cards',()=>{
  const g=memoryPokerTick(memoryPokerStart(19,['a','b'],start),start+25_000)
  for(const bad of [[0,1,2,3],[0,0,1,2,3],[0,1,2,3,20],[0,1,2,3,-1],[0,1,2,3,4.5]])
   expect(packMemoryPoker(bad)).toBeNull()
  expect(memoryPokerAction(g,'a',0,start+25_001)).toBeNull()
  expect(memoryPokerAction(g,'outsider',pick([0,1,2,3,4]),start+25_001)).toBeNull()
  const a=memoryPokerAction(g,'a',pick([11,2,1,19,16]),start+25_010)!
  const other=memoryPokerView(a,'b')
  expect(other.mine).toBeNull()
  expect(other.cards).toEqual(Array(20).fill(null))
  expect(other.submitted).toBe(1)
  expect(other.results).toEqual([])
  expect(memoryPokerView(a,'a').mine).toEqual([1,2,11,16,19])
  expect(memoryPokerAction(a,'a',pick([0,1,2,3,4]),start+25_020)).toBeNull()
  const b=memoryPokerAction(a,'b',pick([1,2,11,16,19]),start+25_030)!
  expect(b.phase).toBe('reveal')
  expect(b.scores).toEqual([360_360,360_360])
  const revealed=memoryPokerView(b,'b')
  expect(revealed.cards).toEqual(Array(20).fill(null))
  expect(revealed.results[0].entries.map(row=>row.cards.map(c=>c.position))).toEqual([[1,2,11,16,19],[1,2,11,16,19]])
  expect(revealed.results[0].entries[0].cards[0].card).toBe(memoryPokerDeal(19,1)[1])
 })
 it('shares rank credit across a three-way tie and does not reward a missing hand',()=>{
  let g=memoryPokerTick(memoryPokerStart(19,['a','b','c','d'],start),start+25_000)
  for(const seat of ['a','b','c'])g=memoryPokerAction(g,seat,pick([1,2,11,16,19]),start+26_000)!
  g=memoryPokerTick(g,start+55_000)
  expect(g.phase).toBe('reveal')
  expect(g.scores).toEqual([1_441_440,1_441_440,1_441_440,0])
  expect(memoryPokerView(g,'d').results[0].entries[3]).toMatchObject({hand:null,cards:[],points:0})
 })
 it('uses kicker strength rather than seat order when assigning rank points',()=>{
  const selection=[0,1,2,3,4]
  const g=memoryPokerTick(memoryPokerStart(3,['weaker','stronger'],start),start+25_000)
  const dealt=[...hand([5,5,14,9,2]),...hand([5,5,14,10,2],[2,3,1,1,1])]
  const layout=[...dealt,...Array.from({length:52},(_,i)=>i).filter(card=>!dealt.includes(card)).slice(0,10)]
  const left=memoryPokerAction({...g,layout},'weaker',pick(selection),start+26_000)!
  const done=memoryPokerAction(left,'stronger',pick(selection.map(n=>n+5)),start+26_001)!
  expect(done.scores).toEqual([0,720_720])
 })
 it('peek is off by default, at most one card privately when enabled, and charged once at reveal',()=>{
  const action=memoryPokerPeekAction(4)!
  const a=memoryPokerTick(memoryPokerStart(9,['a','b'],start),start+25_000)
  expect(memoryPokerAction(a,'a',action,start+26_000)).toBeNull()
  let g=memoryPokerTick(memoryPokerStart(9,['a','b'],start,true),start+25_000)
  g=memoryPokerAction(g,'a',action,start+26_000)!
  const own=memoryPokerView(g,'a')
  expect(own.cards.filter(c=>c!==null)).toEqual([memoryPokerDeal(9,1)[4]])
  expect(own.cards[4]).not.toBeNull()
  expect(memoryPokerView(g,'b').cards).toEqual(Array(20).fill(null))
  expect(memoryPokerAction(g,'a',memoryPokerPeekAction(5)!,start+26_001)).toBeNull()
  expect(g.scores).toEqual([0,0])
  g=memoryPokerAction(g,'a',pick([0,1,2,3,4]),start+26_002)!
  expect(memoryPokerView(g,'a').cards).toEqual(Array(20).fill(null))
  expect(memoryPokerAction(g,'a',action,start+26_003)).toBeNull()
  g=memoryPokerAction(g,'b',pick([0,1,2,3,4]),start+26_004)!
  expect(g.scores).toEqual([-360_360,360_360])
  expect(memoryPokerView(g,'b').results[0].entries[0]).toMatchObject({peeked:true,points:-0.5})
  for(const bad of [-1,20,4.5,Infinity])expect(memoryPokerPeekAction(bad)).toBeNull()
 })
 it('advances reveal and all four rounds on the host clock, including after an inactive tab',()=>{
  const g=memoryPokerStart(15,['a','b'],start)
  const d=memoryPokerTick(g,start+4*61_000-1)
  expect(d.phase).toBe('reveal')
  expect(d.round).toBe(4)
  expect(d.results).toHaveLength(4)
  const last=memoryPokerTick(d,start+4*61_000)
  expect(last.phase).toBe('finished')
  expect(last.winner).toBeNull()
  expect(last.scores).toEqual([0,0])
  expect(memoryPokerTick(last,start+900_000)).toBe(last)
 })
 it('records meaningful solo hand points and no fictitious opponent over four completed rounds',()=>{
  let g=memoryPokerStart(4,['only'],start)
  for(let round=1;round<=4;round++){
   g=memoryPokerTick(g,g.deadline)
   g=memoryPokerAction(g,'only',pick([0,1,2,3,4]),g.deadline-1)!
   const v=memoryPokerView(g,'only')
   expect(v.results[round-1].entries).toHaveLength(1)
   expect(v.results[round-1].entries[0].hand).not.toBeNull()
   expect(v.results[round-1].entries[0].points).toBeGreaterThan(0)
   g=memoryPokerTick(g,g.deadline)
  }
  expect(g.phase).toBe('finished')
  expect(g.winner).toBeNull()
  expect(g.scores[0]).toBeGreaterThanOrEqual(4*720_720)
 })
 it('selects the unique cumulative winner, not seating order, after the fourth round',()=>{
  let g=memoryPokerStart(3,['never','finishes'],start)
  for(let round=1;round<=4;round++){
   g=memoryPokerTick(g,g.deadline)
   g=memoryPokerAction(g,'finishes',pick([0,1,2,3,4]),g.deadline-1)!
   g=memoryPokerTick(g,g.deadline)
   g=memoryPokerTick(g,g.deadline)
  }
  expect(g.phase).toBe('finished')
  expect(g.winner).toBe('finishes')
  expect(g.scores).toEqual([0,2_882_880])
 })
})
