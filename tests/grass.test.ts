import {expect,test} from 'vitest'
import * as E from '../src/engine'
test('grass modes have different seat bounds and deterministic public trays',()=>{
 const ids=Array.from({length:16},(_,i)=>String(i))
 const a=E.start('grass3',ids,20000,0)
 expect(a).toEqual(E.start('grass3',ids,20000,0))
 expect(()=>E.start('grass1',ids,20000,0)).toThrow('Invalid seats')
 expect(E.view(a,'0')).not.toHaveProperty('seed')
 expect(E.view(a,'0').turn).toBe('0')
})

import {canPlace,footprint,grassRank,grassStart,grassStep,orient,placeCode,square,tradeAccept,tradeCode,tradeDone} from '../src/grass'

test('rotations fit within bounds, and territory requires contact without overlap',()=>{
 const s=grassStart('grass1',2,42)
 s.tiles[0]={shape:0,bonus:0,taken:false}
 const base=s.board.indexOf(0),w=s.width
 expect(orient(0,1)).toEqual([[0,0],[0,1]])
 expect(footprint(s,0,0,w-1)).toEqual([])
 expect(canPlace(s,0,footprint(s,0,0,0))).toBe(false)
 expect(grassStep(s,1,placeCode(0,0,base+1),42)).toBeNull()
 expect(grassStep(s,0,placeCode(0,0,base),42)).toBeNull()
 const next=grassStep(s,0,placeCode(0,0,base+1),42)!
 expect(next.board.slice(base,base+3)).toEqual([0,0,0])
 expect(next.order[next.position]).toBe(1)
 expect(square([0,0,0,-1],2,0)).toBe(1)
 expect(square([0,0,0,0],2,0)).toBe(2)
})

test('an accepted trade swaps order and conserves points; placement consumes markers',()=>{
 const s=grassStart('grass3',2,42)
 s.bonus=[2,0]
 s.tiles[0]={shape:0,bonus:2,taken:false}
 expect(grassStep(s,0,tradeCode(1,3),42)).toBeNull()
 const offered=grassStep(s,0,tradeCode(1,2),42)!
 expect(grassStep(offered,0,tradeAccept,42)).toBeNull()
 const deal=grassStep(offered,1,tradeAccept,42)!
 expect(deal.order).toEqual([1,0])
 expect(deal.bonus).toEqual([0,2])
 const draft=grassStep(grassStep(deal,1,tradeDone,42)!,0,tradeDone,42)!
 const anchor=draft.board.indexOf(1)+1
 draft.markers[anchor]=true
 const done=grassStep(draft,1,placeCode(0,0,anchor),42)!
 expect(done.markers[anchor]).toBe(false)
 expect(grassRank(done,1)[0]).toBe(7)
})

test('both engines reach results with legal bot actions at minimum and maximum seats',()=>{
 for(const [game,n] of [['grass1',2],['grass1',12],['grass3',2],['grass3',16]] as const){
  const ids=Array.from({length:n},(_,i)=>String(i))
  let g=E.start(game,ids,10000,0,{seed:1234})
  for(let step=0;step<300&&!g.done;step++){
   const seat=g.grass!.phase==='trade'?ids.find((_,i)=>!g.grass!.passed.includes(i))!:ids[g.turn]
   const a=E.botAction(E.view(g,seat),seat)
   expect(a).not.toBeUndefined()
   const next=E.move(g,seat,a!,step)
   expect(next).not.toBeNull()
   g=next!
  }
  expect(g.done).toBe(true)
  expect(g.round).toBe(game==='grass1'?9:4)
  expect(g.scores.every(Number.isFinite)).toBe(true)
 }
})
