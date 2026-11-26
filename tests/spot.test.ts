import {expect,test} from 'vitest'
import {start,move,timeout,view} from '../src/engine'
import {spotDeal,regionBox} from '../src/spot'
test('seeded exhibits differ at exactly 5–8 isolated, stable regions',()=>{
 for(let seed=0;seed<128;seed++){
  const deal=spotDeal(seed)
  expect(spotDeal(seed)).toEqual(deal)
  expect(deal.key).toHaveLength(new Set(deal.key).size)
  expect(deal.key.length).toBeGreaterThanOrEqual(5)
  expect(deal.key.length).toBeLessThanOrEqual(8)
  expect(deal.left.flatMap((v,i)=>JSON.stringify(v)===JSON.stringify(deal.right[i])?[]:[i])).toEqual(deal.key)
  const boxes=deal.left.map((_,i)=>regionBox(i))
  boxes.forEach(([x,y,w,h],i)=>boxes.slice(i+1).forEach(([X,Y,W,H])=>expect(x+w<=X||X+W<=x||y+h<=Y||Y+H<=y).toBe(true)))
 }
})
test('host adjudicates private marks, duplicates, penalty expiration and ranks by adjusted time',()=>{
 let g=start('spot',['a','b'],123,1000,{seed:99})
 const key=g.spot!.deal.key,wrong=g.spot!.deal.left.findIndex((_,i)=>!key.includes(i))
 expect(g.deadline).toBe(91000)
 expect(move(g,'spectator',wrong,2000)).toBeNull()
 expect(move(g,'a',12,2000)).toBeNull()
 g=move(g,'a',wrong,2000)!
 expect(view(g,'a').spot?.penalty).toBe(5000)
 expect(view(g,'b').spot?.marks).toEqual([])
 expect(view(g,'b').spot).not.toHaveProperty('key')
 expect(move(g,'a',wrong,3000)).toBeNull()
 expect(move(g,'a',key[0],86000)).toBeNull()
 for(const k of key){g=move(g,'a',k,4000)!;g=move(g,'b',k,6000)!}
 expect(g.done).toBe(true)
 expect(g.winner).toBe('b')
 expect(g.scores).toEqual([key.length*720720,key.length*720720])
 expect(view(g,'spectator').spot?.marks).toHaveLength(key.length)
})
test('sixteen independent seats rank by points, and exact ties share the result',()=>{
 const seats=Array.from({length:16},(_,i)=>'p'+i)
 let g=start('spot',seats,90000,0)
 for(const seat of seats.slice(0,2)) g=move(g,seat,g.spot!.deal.key[0],5000)!
 expect(timeout(g,89999).done).toBe(false)
 g=timeout(g,90000)
 expect(g.done).toBe(true)
 expect(g.winner).toBeNull()
 expect(g.scores.filter(n=>n===720720)).toHaveLength(2)
})
