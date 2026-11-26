import {expect,test} from 'vitest'
import {towerStart,towerEdit,towerCheck,packTower,towerView,towerPacks,towerVersion} from '../src/tower'
import {start,move,timeout,view} from '../src/engine'
test('themes have a versioned dictionary and seeded deals conserve unique physical tiles',()=>{
 expect(towerVersion).toBe('en-1')
 for(let seed=0;seed<96;seed++){
  const t=towerStart(seed,1+seed%16)
  expect(t).toEqual(towerStart(seed,1+seed%16))
  expect(t.tiles.slice().sort().join('')).toBe(t.deal.join('').split('').sort().join(''))
  expect(new Set(t.deal).size).toBe(t.columns.length)
  expect(t.deal.every(w=>(towerPacks[t.theme] as readonly string[]).includes(w))).toBe(true)
  expect(towerView(t).example).toBeNull()
  expect(towerView(t)).not.toHaveProperty('deal')
 }
})
const fixture=()=>({...towerStart(0,1),theme:'Music' as const,deal:['TONE','BASS','DRUM'],tiles:[...'TONEBASSDRUM'],columns:[[],[],[]] as number[][]})
test('distinct alternate words count; duplicates and invalid words cannot clear the tower',()=>{
 const t=fixture()
 const alt={...t,columns:[[2,1,0,3],[4,5,6,7],[8,9,10,11]]}
 expect(towerCheck(alt)).toEqual({valid:3,used:12,passed:true}) // NOTE rather than TONE.
 expect(towerCheck({...alt,columns:[[1,2,0,3],[4,5,6,7],[8,9,10,11]]}).passed).toBe(false)
 const duplicate={...t,tiles:[...'TONETONEDRUM'],columns:[[0,1,2,3],[4,5,6,7],[8,9,10,11]]}
 expect(towerCheck(duplicate).valid).toBe(2)
})
test('two-edit batches are atomic and preserve tile identity through swaps, removals and additions',()=>{
 const t=fixture()
 const a={tile:0,dest:1},b={tile:1,dest:1}
 let g=towerEdit(t,packTower([a,b]))!
 expect(g.columns).toEqual([[0,1],[],[]])
 expect(towerEdit(g,packTower([{tile:2,dest:2},{tile:45,dest:1}]))).toBeNull()
 expect(g.columns).toEqual([[0,1],[],[]])
 g=towerEdit(g,packTower([{tile:0,dest:7+3},{tile:1,dest:0}]))!
 expect(g.columns).toEqual([[3],[],[]])
 expect(towerEdit(g,packTower([{tile:3,dest:7+3}]))).toBeNull()
 expect(towerEdit(g,packTower([{tile:0,dest:1},{tile:1,dest:1},{tile:2,dest:1}]))).toBeNull()
})
test('host enforces turn owner and deadline; turn cap ends a stalled team with partial score',()=>{
 let g=start('tower',['a','b'],5000,100)
 expect(g.deadline).toBe(240100)
 expect(move(g,'b',packTower([{tile:0,dest:1}]),105)).toBeNull()
 g=move(g,'a',packTower([{tile:0,dest:1}]),110)!
 expect(g.turn).toBe(1)
 expect(view(g,'b').tower?.columns[0]).toEqual([0])
 expect(move(g,'b',0,240100)).toBeNull()
 for(let i=1;i<24;i++)g=move(g,g.seats[g.turn],0,110+i)!
 expect(g.done).toBe(true)
 expect(view(g,'a').tower?.score.used).toBe(1)
 expect(timeout(start('tower',['a'],5000,100),240100).done).toBe(true)
})
