import {describe,expect,it} from 'vitest'
import {towerBlocks,readTower,shiftTower,equationTowerStart,equationTowerApply,equationTowerTick,equationTowerView,findTowerPath,matchedTower,equationTowerRules} from '../src/equation-tower'

describe('Tower of Equations',()=>{
 it('reads the exact top-down expression with arithmetic precedence, fractions and no illegal neutral tiles',()=>{
  expect(readTower([2,3,0])).toEqual([11,1]) // 7 + 2 × 2
  expect(readTower([7,1])).toEqual([5,3]) // 5 ÷ 3
  expect(readTower([7,4,0])).toEqual([26,3]) // 7 + 5 ÷ 3
  expect(readTower([0,2,3])).toBeNull()
  expect(readTower([2,1,0])).toBeNull()
  expect(readTower([0,3,3])).toBeNull()
 })
 it('lifts only a top bundle, preserves all serials and can reverse that bundle in place',()=>{
  const stacks=[[4,2,0],[1,3],[5,6],[7]]
  expect(shiftTower(stacks,{from:0,to:1,count:2,flip:false})).toEqual([[4],[1,3,2,0],[5,6],[7]])
  expect(shiftTower(stacks,{from:0,to:0,count:2,flip:true})).toEqual([[4,0,2],[1,3],[5,6],[7]])
  expect(shiftTower(stacks,{from:0,to:0,count:1,flip:true})).toBeNull()
  expect(shiftTower(stacks,{from:0,to:2,count:4,flip:false})).toBeNull()
  expect(shiftTower(stacks,{from:4,to:1,count:1,flip:false})).toBeNull()
 })
 it('supplies distinct reachable, nontrivial targets while carrying all blocks across the workshop',()=>{
  for(const seed of [0,1,2,27,89203,2**32-1]){
   let game=equationTowerStart(['solo'],seed,1000,'standard')
   expect(game).toEqual(equationTowerStart(['solo'],seed,1000,'standard'))
   for(let n=0;n<equationTowerRules.practiceRounds;n++){
    expect(game.phase).toBe('build')
    expect(matchedTower(game.stacks,game.target)).toBeNull()
    const path=findTowerPath(game.stacks,game.target)!
    expect(path.length).toBeGreaterThan(0)
    for(const move of path)game=equationTowerApply(game,'solo',{kind:'shift',...move},1001+n)!
    expect(game.phase).toBe('review')
    expect(game.last?.success).toBe(true)
    const prior=game.stacks
    game=equationTowerApply(game,'solo',{kind:'advance'},1010+n)!
    expect(game.stacks).toEqual(prior)
    expect(game.stacks.flat().sort((a,b)=>a-b)).toEqual(towerBlocks.map((_,i)=>i))
   }
   expect(game.phase).toBe('done')
   expect(game.scores).toEqual([equationTowerRules.practiceRounds])
  }
 })
 it('allows one strictly lower challenge, and only its winner can prove their exact declaration',()=>{
  let game=equationTowerStart(['a','b','c'],77,0,'standard')
  const path=findTowerPath(game.stacks,game.target)!
  game=equationTowerApply(game,'a',{kind:'call',moves:path.length+1},100)!
  expect(game.phase).toBe('challenge')
  expect(equationTowerApply(game,'a',{kind:'call',moves:path.length},101)).toBeNull()
  expect(equationTowerApply(game,'c',{kind:'call',moves:path.length+1},102)).toBeNull()
  game=equationTowerApply(game,'b',{kind:'call',moves:path.length},103)!
  expect(game.builder).toBe('b')
  expect(equationTowerView(game,'c')).not.toHaveProperty('seed')
  expect(equationTowerView(game,'c')).not.toHaveProperty('start')
  game=equationTowerTick(game,game.deadline!)
  expect(game.phase).toBe('build')
  expect(equationTowerApply(game,'a',{kind:'shift',...path[0]},game.deadline!-1)).toBeNull()
  for(const move of path)game=equationTowerApply(game,'b',{kind:'shift',...move},game.deadline!-1)!
  expect(game.phase).toBe('review')
  expect(game.last).toMatchObject({builder:'b',success:true,points:2})
  expect(game.scores).toEqual([0,2,0])
 })
 it('scores a missed exact budget, then advances a pass-only match to an honest shared result',()=>{
  let game=equationTowerStart(['a','b'],100,0,'standard')
  const path=findTowerPath(game.stacks,game.target)!
  game=equationTowerApply(game,'a',{kind:'call',moves:path.length+1},100)!
  game=equationTowerTick(game,game.deadline!)
  for(const move of path)game=equationTowerApply(game,'a',{kind:'shift',...move},game.deadline!-1)!
  expect(game.phase).toBe('build')
  game=equationTowerTick(game,game.deadline!)
  expect(game.last).toMatchObject({builder:'a',success:false,points:-1})
  while(game.phase!=='done')game=equationTowerTick(game,game.deadline!)
  expect(game.scores).toEqual([-1,0])
  expect(equationTowerView(game,'a').leaders).toEqual(['b'])
 })
})
