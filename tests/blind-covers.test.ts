import {expect,it} from 'vitest'
import {blindCoverAction,blindCoverIds,botAction,move,start,view} from '../src/engine'
import {Host,decode,defaults} from '../src/room'

it('accepts seven covers without publishing the underlying owner and retains them after reveal',()=>{
 let g=start('blind',['a','b'],25000,0,{seed:42})
 expect(blindCoverIds).toEqual([0,1,2,3,4,5,6])
 expect(view(g,'a').blindCovers).toEqual(Array(225).fill(null))
 // Each owner may use the same color, or switch between any two colors.
 const turns=[['a',0,6],['b',15,6],['a',1,0],['b',16,1],['a',2,2],['b',17,3],['a',3,4],['b',18,5]] as const
 for(const [seat,cell,cover] of turns){
  g=move(g,seat,blindCoverAction(cell,cover),1)!
  for(const viewer of ['a','b','spectator']){
   const v=view(g,viewer)
   expect(v.board[cell]).toBe('?')
   expect(v.blindCovers?.[cell]).toBe(cover)
   expect(v.blindCovers?.filter(x=>x!==null)).toHaveLength(g.plies)
   expect(v).not.toHaveProperty('publicMoves')
  }
 }
 // Legacy coordinates continue to play and choose a valid cover automatically.
 g=move(g,'a',4,1)!
 expect(g.done).toBe(true)
 const result=view(g,'b')
 expect(result.winner).toBe('a')
 expect(result.board[0]).toBe('a')
 expect(result.board[15]).toBe('b')
 expect(result.blindCovers?.[0]).toBe(6)
 expect(result.blindCovers?.[15]).toBe(6)
 expect(blindCoverIds).toContain(result.blindCovers?.[4])
})

it('rejects reserved codes outside the exact cell/cover range and in other games',()=>{
 const g=start('blind',['a','b'],25000,0)
 const hi=blindCoverAction(224,6)
 expect(move(g,'a',hi,1)).not.toBeNull()
 expect(move(g,'a',hi+1,1)).toBeNull()
 expect(move(g,'a',hi-0.5,1)).toBeNull()
 expect(move(g,'a',blindCoverAction(0,0)-1,1)).toBeNull()
 expect(move(g,'b',hi,1)).toBeNull()
 expect(move(move(g,'a',hi,1)!,'b',blindCoverAction(224,0),1)).toBeNull()
 const point=start('point',['a','b'],25000,0)
 expect(view(point,'a').blindCovers).toBeNull()
 expect(move(point,'a',blindCoverAction(0,0),1)).toBeNull()
 expect(move(start('secret',['a','b','c'],25000,0),'a',hi,1)).toBeNull()
 expect(()=>blindCoverAction(225,0)).toThrow(RangeError)
 expect(()=>blindCoverAction(-1,0)).toThrow(RangeError)
 expect(()=>blindCoverAction(0.1,0)).toThrow(RangeError)
})

it('echoes the human cover in solo without changing the selected bot move',()=>{
 let now=100
 const h=new Host('Contestant',()=>now,true)
 expect(h.command('host','config',h.rev,{kind:'config',settings:{...defaults,botLevel:'hard'}})).toBeNull()
 expect(h.command('host','start',h.rev,{kind:'start'})).toBeNull()
 for(const [ply,cover] of [6,3,0].entries()){
  const seat=h.owner
  const v=h.snapshot('host')!.game!
  expect(v.turn).toBe(seat)
  const cell=v.legal[0] as number
  const a=blindCoverAction(cell,cover as 6|3|0)
  const received=decode(JSON.stringify({version:1,type:'command',epoch:h.epoch,match:h.match,seq:ply+1,request:seat,rev:h.rev,command:{kind:'move',action:a}}))
  expect(received?.type).toBe('command')
  expect(h.command('host',String(ply),h.rev,{kind:'move',action:a})).toBeNull()
  const bot=h.game!.seats[1]
  const expected=botAction(view(h.game!,bot),bot,h.game!.publicMoves,0,'hard')
  now+=800
  expect(h.tick()).toBe(true)
  expect(h.game!.publicMoves.at(-1)).toBe(expected)
  expect(view(h.game!,seat).blindCovers?.[expected as number]).toBe(cover)
 }
})

it('allows independent automatic covers on identical online board setups',()=>{
 const g=start('blind',['a','b'],25000,0,{seed:88})
 const flipped=start('blind',['b','a'],25000,0,{seed:88})
 const a=move(g,'a',112,0)!
 const b=move(flipped,'b',112,0)!
 expect(view(a,'spectator').blindCovers).toEqual(view(b,'spectator').blindCovers)
})
