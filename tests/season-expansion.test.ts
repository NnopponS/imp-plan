import {test,expect} from 'vitest'
import {baghActions,baghInit,baghStep} from '../src/bagh'
import {contactAction,guessAction,clue} from '../src/secret'
import {start,view,move,timeout,botAction} from '../src/engine'
test('Bagh Chal protects goat placement and tracks straight-line jumps',()=>{
 let b=baghInit()
 expect(baghActions(b,0)).not.toContainEqual({from:6,to:7})
 b=baghStep(b,0,6)!
 b=baghStep(b,1,{from:0,to:12})!
 expect(b.board[6]).toBe(0)
 expect(b.captured).toBe(1)
 expect(b.banked).toBe(19)
 expect(baghStep(b,1,{from:12,to:24})).toBeNull()
})
test('Secret Number checks mutual consent, one pair contact per round, and private clue projection',()=>{
 const a=['a','b','c']
 let g=start('secret',a,90000,1,{seed:52})
 const s=g.secret!
 expect(new Set(s.values).size).toBe(3)
 expect(view(g,'a').secret!.reveal).toBeNull()
 expect(view(g,'a').secret).not.toHaveProperty('values')
 g=move(g,'a',contactAction(0,1,0),2)!
 expect(move(g,'c',contactAction(1,0,0),3)).toBeNull()
 g=move(g,'b',contactAction(1,0,0),4)!
 expect(g.secret!.tickets.slice(0,2).map(t=>t[0])).toEqual([1,1])
 expect(view(g,'c').secret!.clues).toEqual([])
 expect(view(g,'a').secret!.clues[0].result).toBe(s.values[0]+s.values[1])
 expect(move(g,'a',contactAction(0,1,1),5)).toBeNull()
 expect(clue(2,2,99)).toBe(49)
 for(let i=0;i<4;i++)g=timeout(g,g.deadline)
 expect(g.secret!.phase).toBe('guess')
 g=move(g,'a',guessAction(s.values[0],[1,s.values[1]],[2,s.values[2]===100?99:100]),g.opened+1)!
 expect(view(g,'b').scores).toEqual([0,0,0])
 expect(view(g,'b').secret!.reveal).toBeNull()
 g=timeout(g,g.deadline)
 expect(view(g,'a').scores).toEqual([5,0,0])
 expect(view(g,'a').secret!.reveal).toEqual(s.values)
 expect(g.winner).toBe('a')
})
test('Bagh Chal reaches terminal results against both bot styles without losing pieces',()=>{
 for(const flip of [false,true]){
  const seats=flip?['t','g']:['g','t']
  let g=start('bagh',seats,25000,0)
  for(let i=0;!g.done&&i<101;i++){
   const seat=seats[g.turn]
   const action=botAction(view(g,seat),seat)
   expect(action).toBeDefined()
   g=move(g,seat,action!,i+1)!
   expect(g.bagh!.board.filter(x=>x===2)).toHaveLength(4)
   expect(g.bagh!.board.filter(x=>x===1).length+g.bagh!.banked+g.bagh!.captured).toBe(20)
  }
  expect(g.done).toBe(true)
 }
})
