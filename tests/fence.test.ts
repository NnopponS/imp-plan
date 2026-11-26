import {expect,test} from 'vitest'
import {fenceDeal,fenceCheck,fenceGeometry,solveFence,shapeEdges} from '../src/fence'
import {start,move,timeout,view} from '../src/engine'

test('every published clue pattern has exactly one connected solution and supports zero clues',()=>{
 const boards=new Map<string,ReturnType<typeof fenceDeal>>()
 for(let seed=0;seed<128;seed++){
  const deal=fenceDeal(seed)
  boards.set(deal.clues.join(','),deal)
  expect(deal.clues).toContain(0)
  expect(deal.clues).toContain(null)
  expect(deal.clues.every(v=>v===null||v>=0&&v<=3)).toBe(true)
 }
 expect(boards.size).toBe(24)
 for(const board of boards.values()){
  const proof=solveFence(board.clues)
  expect(proof.exhausted).toBe(false)
  expect(proof.solutions).toEqual([board.solution])
  expect(fenceCheck(board.solution,board.clues).valid).toBe(true)
 }
})
test('rejects disconnected cycles and numbers bordering the wrong edge count',()=>{
 const {edges}=fenceGeometry
 const disconnected=shapeEdges(['#....','.....','.....','.....','....#'])
 expect(fenceCheck(disconnected,Array(25).fill(null)).valid).toBe(false)
 const fork=edges.map((_,i)=>i===1||i===30||i===31?1:0)
 expect(fenceCheck(fork,Array(25).fill(null)).bad).toBeGreaterThan(0)
 const square=shapeEdges(['#....','.....','.....','.....','.....'])
 const incorrect=Array(25).fill(null);incorrect[0]=0
 expect(fenceCheck(square,incorrect).valid).toBe(false)
})
test('private marks persist, crosses never play as a line, exact solve stops seat and late inputs are ignored',()=>{
 let g=start('fence',['a','b'],10000,100,{seed:42})
 const sol=g.fence!.deal.solution
 const id=sol.indexOf(0)
 g=move(g,'a',id*3+2,105)!
 expect(view(g,'a').fence?.marks[id]).toBe(2)
 expect(view(g,'b').fence?.marks[id]).toBe(0)
 expect(view(g,'a').fence?.solution).toBeNull()
 for(let i=0;i<sol.length;i++)if(sol[i])g=move(g,'a',i*3+1,500)!
 expect(view(g,'a').fence?.solved).toBe(true)
 expect(g.done).toBe(false)
 expect(move(g,'a',id*3+1,600)).toBeNull()
 expect(move(g,'b',id*3+1,240100)).toBeNull()
 expect(move(g,'b',180,600)).toBeNull()
 g=timeout(g,240100)
 expect(g.winner).toBe('a')
 expect(view(g,'b').fence?.solution).toEqual(sol)
})
