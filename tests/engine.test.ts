import {describe,it,expect} from 'vitest'
import fc from 'fast-check'
import {start,move,view,timeout,schedule,botAction} from '../src/engine'
import {knightPrintData,knightRecordSvg} from '../src/knight-result-art'
describe('alpha games',()=>{
 it('Blind Gomoku reveals a real line of five and not earlier ownership',()=>{
  let g=start('blind',['a','b'],100,0)
  for(const i of [0,1,2,3]){
   g=move(g,'a',i,0)!
   expect(view(g,'b').board?.[i]).toBe('?')
   g=move(g,'b',15+i,0)!
  }
  g=move(g,'a',4,0)!
  expect(g.winner).toBe('a')
  expect(view(g,'b').board?.[0]).toBe('a')
 })
 it('Morris requires capture after forming a mill',()=>{
  let g=start('morris',['a','b'],100,0)
  for(const [s,i] of [['a',0],['b',3],['a',1],['b',4],['a',2]] as const) g=move(g,s,i,0)!
  expect(g.capture).toBe(true)
  expect(move(g,'a',0,0)).toBeNull()
  g=move(g,'a',3,0)!
  expect(g.board[3]).toBe('')
  expect(g.turn).toBe(1)
 })
 it('sealed bids are private, late bids invalid, ties share the prize',()=>{
  let g=start('auction',['a','b'],10,100)
  g=move(g,'a',4,101)!
  expect(view(g,'b')).not.toHaveProperty('bids')
  expect(view(g,'b').mine).toBeNull()
  expect(move(g,'b',4,110)).toBeNull()
  g=move(g,'b',4,109)!
  expect(view(g,'b').scores).toEqual([0.5,0.5])
  expect(timeout(g,115).round).toBe(2)
 })
 it('schedule gives every pair two legs and balances who starts',()=>{
  fc.assert(fc.property(fc.integer({min:2,max:16}),n=>{
   const ids=Array.from({length:n},(_,i)=>String(i))
   const games=schedule(ids)
   expect(games).toHaveLength(n*(n-1))
   expect(new Set(games.map(x=>x.join(':'))).size).toBe(games.length)
   for(const s of ids) expect(games.filter(x=>x[0]===s)).toHaveLength(n-1)
  }))
 })
})
it('Point Gomoku scores a growing line once per threshold; five is not a knockout',()=>{
 let g=start('point',['a','b'],100,0)
 for(const [i,j] of [[0,13],[1,14],[2,15],[3,16],[4,17],[5,18]]){
  g=move(g,'a',i,0)!
  g=move(g,'b',j,0)!
 }
 expect(view(g,'a').scores).toEqual([8,8])
 expect(g.done).toBe(false)
})
it('each board engine reaches a terminal state in multiple legal bot-driven matches',()=>{
 for(const game of ['blind','morris','point'] as const)for(let first=0;first<6;first++){
  let g=start(game,first%2?['b','a']:['a','b'],100,0)
  for(let i=0;i<1200&&!g.done;i++){
   const seat=g.seats[g.turn],v=view(g,seat)
   const a=i===0?v.legal[first]:botAction(v,seat,g.publicMoves)
   expect(a).not.toBeUndefined()
   const n=move(g,seat,a!,i)
   expect(n).not.toBeNull()
   g=n!
  }
  expect(g.done).toBe(true)
 }
})

it('projects just one completed Knight route and its host-recorded elapsed time',()=>{
 let g=start('knight',['one','two'],180_000,7000,{size:5,seed:69})
 let at=7010
 g=move(g,'two',g.tour[1],at)!
 expect(view(g,'two').knightElapsedMs).toBeUndefined()
 for(const cell of g.tour.slice(1)){
  at+=741
  g=move(g,'one',cell,at)!
 }
 const first=view(g,'one',at+55_000)
 expect(first.knightElapsedMs).toBe(at-7000)
 expect(first.path).toEqual(g.tour)
 const other=view(g,'two',at+55_000)
 expect(other.knightElapsedMs).toBeUndefined()
 expect(other.path).toEqual(g.tour.slice(0,2))
 expect(view(g,'unseated').knightElapsedMs).toBeUndefined()
 const result=knightPrintData(first)!
 expect(result.visited).toBe(25)
 expect(result.complete).toBe(true)
 expect(result.elapsed).toBe('00:17')
 const art=knightRecordSvg(result)
 expect(art.match(/data-visit=/g)).toHaveLength(25)
 expect(art).toContain('data-visit="1" data-cell="'+g.tour[0]+'"')
 expect(art).not.toContain('unseated')
})

it('prints the actual path after undo, not the longest score, and omits timing on partial tours',()=>{
 let g=start('knight',['Player'],180_000,5000,{size:6,closed:true})
 for(const [i,cell] of g.tour.slice(1,4).entries())g=move(g,'Player',cell,6000+i)!
 g=move(g,'Player',-1,7000)!
 g=timeout(g,g.deadline)
 const result=knightPrintData(view(g,'Player',g.deadline+999))!
 expect(result.path).toEqual(g.tour.slice(0,3))
 expect(result.complete).toBe(false)
 expect(result.elapsed).toBeNull()
 expect(view(g,'Player').scores).toEqual([4])
 expect(knightRecordSvg(result)).not.toMatch(/\bbest\b|00:00/i)
 expect(knightPrintData({...view(g,'Player'),path:[0,0]})).toBeNull()
 expect(knightPrintData({...view(g,'Player'),path:[0,1]})).toBeNull()
})
