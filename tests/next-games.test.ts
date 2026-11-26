import {expect,test} from 'vitest'
import {start,move,view,botAction} from '../src/engine'
import {sow,makeMancala} from '../src/mancala'
test('mancala sow travels clockwise, wraps, preserves tokens, and credits the last token owner',()=>{
 const g=makeMancala(2)
 g.pits[7]=[0,1];g.pits[0]=[0]
 g.placements=8
 const out=sow(g,7,0)!
 expect(out.pits[8]).toEqual([0])
 expect(out.pits[0]).toEqual([0,1])
 expect(out.points).toEqual([[0,0,0],[2,0,0]])
 expect(out.pits.flat()).toHaveLength(3)
})
test('mancala reaches results with legal setup and actions for two through eight seats',()=>{
 for(let n=2;n<=8;n++){
  const list=Array.from({length:n},(_,i)=>'seat'+i)
  let g=start('mancala',list,25000,0)
  expect(move(g,list[1],0,0)).toBeNull()
  for(let j=0;j<n*16;j++){
   expect(g.done).toBe(false)
   const seat=list[g.turn],action=botAction(view(g,seat),seat)!
   g=move(g,seat,action,j)!
   const setup=(j+1)<n*4
   expect(g.mancala!.pits.flat()).toHaveLength(setup?j+1:n*4)
   expect(g.mancala!.points.flat().every(x=>x>=0)).toBe(true)
  }
  expect(g.done).toBe(true)
 }
})
test('cube challenge contains supported stacks and no exposed numeric solution',()=>{
 for(let seed=0;seed<20;seed++){
  let g=start('cubes',['a'],25000,0,{seed})
  for(let i=0;i<5;i++){
   const p=view(g,'a').puzzle!
   expect(p.values).toHaveLength(p.rows*p.cols)
   expect(p.values.every(h=>Number.isInteger(h)&&h>=0&&h<=4)).toBe(true)
   const count=p.values.reduce((a,b)=>a+b,0)
   expect(count).toBeGreaterThan(0)
   expect(p.target).toBeNull()
   expect(move(g,'a',65,1)).toBeNull()
   g=move(g,'a',count,i+1)!
  }
  expect(g.done).toBe(true)
  expect(view(g,'a').scores).toEqual([5])
 }
})
