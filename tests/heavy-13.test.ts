import fc from 'fast-check'
import {expect,test} from 'vitest'
import {
 heavy13Action,heavy13Bot,heavy13Lock,heavy13Pass,heavy13Place,heavy13Start,heavy13Tick,heavy13View,
 type Heavy13,type Heavy13Color
} from '../src/heavy-13'

const open=(seats=['a','b'])=>heavy13Start(seats,0,{lockMs:100,actionMs:50})
const act=(s:Heavy13,seat:string,code:number,now=s.openedAt+1)=>{
 const next=heavy13Action(s,seat,code,now)
 expect(next).not.toBeNull()
 return next!
}
const lock=(s:Heavy13,picks:[number,Heavy13Color][])=>picks.reduce((a,[n,c],i)=>act(a,a.seats[i],heavy13Lock(n,c)),s)

test('start gives two to seven independent inventories of one 0–6, two of each color, and one rainbow',()=>{
 for(let count=2;count<=7;count++){
  const seats=Array.from({length:count},(_,i)=>String(i))
  const s=open(seats)
  const first=heavy13View(s,seats[0])
  expect(first.mine!.hand).toEqual({values:[0,1,2,3,4,5,6],colors:{red:2,green:2,blue:2,rainbow:1}})
  expect(first.legal).toHaveLength(28)
  expect(first).toMatchObject({phase:'select',round:1,cycle:1,marker:seats[0],currentSeat:null,deadline:100,
   stands:{red:{cubes:[],sum:0},green:{cubes:[],sum:0},blue:{cubes:[],sum:0}}})
 }
 for(const bad of [[],['a'],['a','a'],[' ','b'],Array.from({length:8},(_,i)=>String(i))]){
  expect(()=>open(bad)).toThrow()
 }
 expect(()=>heavy13Start(['a','b'],0,{marker:2})).toThrow()
 expect(()=>heavy13Start(['a','b'],0,{lockMs:0})).toThrow()
})

test('a hidden lock consumes its own private pair but reveals nothing in other or observer projections',()=>{
 const s=open(['a','b','c'])
 const b=heavy13View(s,'b'),outside=heavy13View(s,'spectator')
 const a=act(s,'a',heavy13Lock(0,'rainbow'))
 expect(heavy13View(a,'b')).toEqual(b)
 expect(heavy13View(a,'spectator')).toEqual(outside)
 expect(outside.mine).toBeNull()
 expect(outside.legal).toEqual([])
 const av=heavy13View(a,'a')
 expect(av).toMatchObject({reveal:null,order:[],mine:{locked:{value:0,color:'rainbow'},
  hand:{values:[1,2,3,4,5,6],colors:{red:2,green:2,blue:2,rainbow:0}}},legal:[]})
 av.mine!.locked!.value=6;av.mine!.hand.values.length=0;av.stands.red.cubes.push(42);av.seats[0]='forged'
 expect(heavy13View(a,'a')).toMatchObject({seats:['a','b','c'],stands:{red:{cubes:[]}},
  mine:{locked:{value:0},hand:{values:[1,2,3,4,5,6]}}})
 expect(heavy13Action(a,'a',heavy13Lock(1,'red'),2)).toBeNull()
})

test('rainbows sort first, including within their bracket; equal numbers use clockwise marker distance',()=>{
 const s=lock(heavy13Start(['a','b','c','d','e','f','g'],0,{marker:3}),[
  [6,'red'],[1,'rainbow'],[6,'blue'],[6,'green'],[6,'rainbow'],[0,'red'],[6,'red'],
 ])
 const v=heavy13View(s,'observer')
 expect(v.order).toEqual(['e','b','d','g','a','c','f'])
 expect(v).toMatchObject({phase:'resolve',marker:'d',currentSeat:'e',passed:[],returning:false})
 expect(v.reveal).toEqual([
  {seat:'a',value:6,color:'red'},{seat:'b',value:1,color:'rainbow'},{seat:'c',value:6,color:'blue'},
  {seat:'d',value:6,color:'green'},{seat:'e',value:6,color:'rainbow'},{seat:'f',value:0,color:'red'},{seat:'g',value:6,color:'red'},
 ])
 expect(heavy13View(s,'e').legal).toEqual([heavy13Place('red'),heavy13Place('green'),heavy13Place('blue'),heavy13Pass])
 expect(v.legal).toEqual([])
})

test('passes resolve last-in first-out, without letting the last normal actor or returning actors pass',()=>{
 let s=lock(open(['a','b','c','d']),[[4,'red'],[3,'rainbow'],[2,'green'],[1,'blue']])
 s=act(s,'b',heavy13Pass)
 s=act(s,'a',heavy13Pass)
 expect(heavy13View(s,'observer')).toMatchObject({currentSeat:'c',passed:['b','a'],returning:false})
 expect(heavy13Action(s,'d',heavy13Place('blue'),s.openedAt+1)).toBeNull()
 expect(heavy13Action(s,'c',heavy13Place('red'),s.openedAt+1)).toBeNull()
 s=act(s,'c',heavy13Place('green'))
 expect(heavy13View(s,'d').legal).toEqual([heavy13Place('blue')])
 expect(heavy13Action(s,'d',heavy13Pass,s.openedAt+1)).toBeNull()
 s=act(s,'d',heavy13Place('blue'))
 expect(heavy13View(s,'a')).toMatchObject({currentSeat:'a',passed:['b','a'],returning:true,legal:[heavy13Place('red')]})
 expect(heavy13Action(s,'a',heavy13Pass,s.openedAt+1)).toBeNull()
 s=act(s,'a',heavy13Place('red'))
 s=act(s,'b',heavy13Place('blue'))
 expect(heavy13View(s,'a')).toMatchObject({phase:'select',round:2,reveal:null,order:[],passed:[],
  marker:'a',stands:{red:{cubes:[4]},green:{cubes:[2]},blue:{cubes:[1,3]}}})
})

test('exactly 13 scores every existing cube including zero while leaving the trigger and other stands untouched',()=>{
 const base=open()
 const piles={red:[0,6,6],green:[3],blue:[1]}
 let s=lock({...base,stands:piles},[[1,'red'],[0,'blue']])
 s=act(s,'a',heavy13Place('red'))
 let v=heavy13View(s,'a')
 expect(v.stands).toEqual({red:{cubes:[1],sum:1},green:{cubes:[3],sum:3},blue:{cubes:[1],sum:1}})
 expect(v.scores).toEqual([{seat:'a',penalty:3,lastPenalty:1},{seat:'b',penalty:0,lastPenalty:null}])
 expect(v.last).toMatchObject({kind:'place',seat:'a',removed:[0,6,6],value:1,penalty:3})
 expect(piles.red).toEqual([0,6,6])
 s=act(s,'b',heavy13Place('blue'))
 v=heavy13View(s,'b')
 expect(v.marker).toBe('a')
 expect(v.stands.blue).toEqual({cubes:[1,0],sum:1})
 expect(heavy13Action(s,'a',heavy13Lock(1,'green'),s.openedAt+1)).toBeNull()
})

test('the last player penalized in a round owns the next marker; no-penalty round retains it',()=>{
 let s=lock({...open(),stands:{red:[6,6],green:[5,5],blue:[]}},[[3,'red'],[3,'green']])
 s=act(s,'a',heavy13Place('red'))
 s=act(s,'b',heavy13Place('green'))
 expect(heavy13View(s,'a')).toMatchObject({marker:'b',scores:[{lastPenalty:1},{lastPenalty:2}]})
 s=lock(s,[[0,'blue'],[0,'blue']])
 expect(heavy13View(s,'a').order).toEqual(['b','a'])
 s=act(s,'b',heavy13Place('blue'))
 s=act(s,'a',heavy13Place('blue'))
 expect(heavy13View(s,'a').marker).toBe('b')
})

test('equal penalties favor the earlier latest penalty; all zero co-leaders share the result',()=>{
 for(const [penalties,penaltyAt,winner,leaders] of [
  [[2,2],[19,18],'b',['b']],[[1,2],[19,18],'a',['a']],[[0,0],[null,null],null,['a','b']],
 ] as const){
  let s=lock({...open(),round:14,placed:26,penalties:[...penalties],penaltyAt:[...penaltyAt]},[[0,'red'],[0,'blue']])
  s=act(s,'a',heavy13Place('red'))
  s=act(s,'b',heavy13Place('blue'))
  expect(heavy13View(s,'observer')).toMatchObject({phase:'finished',round:14,cycle:2,winner,leaders,deadline:null,currentSeat:null,legal:[]})
  expect(heavy13Action(s,'a',0,s.openedAt+1)).toBeNull()
  expect(heavy13Tick(s,10_000)).toBe(s)
 }
})

test('deadline fills only unsubmitted picks, and a missed placement consumes exactly one slot',()=>{
 const s=act(open(), 'a',heavy13Lock(5,'rainbow'),99)
 expect(heavy13Action(s,'b',heavy13Lock(1,'blue'),100)).toBeNull()
 expect(heavy13Tick(s,99)).toBe(s)
 let next=heavy13Tick(s,100)
 expect(heavy13View(next,'observer')).toMatchObject({phase:'resolve',currentSeat:'a',deadline:150,
  reveal:[{seat:'a',value:5,color:'rainbow'},{seat:'b',value:0,color:'red'}]})
 expect(heavy13Action(next,'a',heavy13Place('red'),150)).toBeNull()
 next=heavy13Tick(next,900)
 expect(heavy13View(next,'observer')).toMatchObject({phase:'resolve',currentSeat:'b',deadline:950,
  last:{kind:'place',seat:'a',value:5,automatic:true}})
 expect(heavy13Tick(next,900)).toBe(next)
 next=heavy13Tick(next,950)
 expect(heavy13View(next,'observer')).toMatchObject({phase:'select',round:2,deadline:1050})
})

test('invalid values, impossible phases and unavailable actors never alter the state',()=>{
 const s=open()
 for(const bad of [-1,32,0.5,NaN,Infinity,'0',{},null,undefined,heavy13Place('blue'),heavy13Pass]){
  expect(heavy13Action(s,'a',bad,1)).toBeNull()
 }
 expect(heavy13Action(s,'watcher',0,1)).toBeNull()
 expect(heavy13Action(s,'a',0,-1)).toBeNull()
 expect(heavy13Action(s,'a',0,NaN)).toBeNull()
 expect(heavy13Lock(7,'red')).toBe(-1)
 expect(heavy13Lock(-1,'red')).toBe(-1)
 expect(heavy13Place('yellow')).toBe(-1)
 expect(heavy13View(s,'b').mine!.hand.values).toEqual([0,1,2,3,4,5,6])
})

test('all bot levels choose deterministically from reader-bound legal actions, in both phases',()=>{
 const s=open()
 for(const level of ['easy','normal','hard'] as const){
  const a=heavy13View(s,'a')
  const code=heavy13Bot(a,19,level)!
  expect(a.legal).toContain(code)
  expect(heavy13Bot(a,19,level)).toBe(code)
  const locked=act(s,'b',heavy13Lock(4,'blue'))
  expect(heavy13Bot(heavy13View(locked,'a'),19,level)).toBe(code)
  expect(heavy13Bot(heavy13View(locked,'b'),19,level)).toBeUndefined()
  const revealed=act(locked,'a',code)
  const current=heavy13View(revealed,'observer').currentSeat!
  const v=heavy13View(revealed,current)
  expect(v.legal).toContain(heavy13Bot(v,19,level))
  expect(heavy13Bot(heavy13View(revealed,'observer'),19,level)).toBeUndefined()
 }
})

test('random complete games consume exact inventories per cycle, keep stands/scores and finish after 14 rounds',()=>{
 fc.assert(fc.property(fc.integer({min:2,max:7}),fc.array(fc.nat({max:10000}),{minLength:12,maxLength:40}), (count,picks)=>{
  const seats=Array.from({length:count},(_,i)=>'s'+i)
  const initial=open(seats)
  let s=initial, cursor=0
  for(let round=1;round<=14;round++){
   const lastStands=heavy13View(s,'observer').stands
   expect(heavy13View(s,'observer')).toMatchObject({round,cycle:round<8?1:2,phase:'select'})
   if(round===8)for(const seat of seats){
    expect(heavy13View(s,seat).mine!.hand.values).toEqual([0,1,2,3,4,5,6])
    expect(heavy13View(s,seat).mine!.hand.colors).toEqual({red:2,green:2,blue:2,rainbow:1})
   }
   for(const seat of seats){
    const own=heavy13View(s,seat),legal=own.legal
    expect(own.mine!.hand.values).toHaveLength(7-(round-1)%7)
    s=act(s,seat,legal[picks[cursor++%picks.length]%legal.length])
   }
   expect(heavy13View(s,'observer').stands).toEqual(lastStands)
   const revealed=heavy13View(s,'observer').reveal!
   for(const {seat,value,color} of revealed){
    expect(heavy13View(s,seat).mine!.hand.values).not.toContain(value)
    if(round%7===0)expect(heavy13View(s,seat).mine!.hand.colors[color]).toBe(0)
   }
   const placements=new Set<string>()
   while(heavy13View(s,'observer').phase==='resolve'){
    const before=heavy13View(s,'observer'),seat=before.currentSeat!
    const choices=heavy13View(s,seat).legal
    s=act(s,seat,choices[picks[cursor++%picks.length]%choices.length])
    const after=heavy13View(s,'observer'),event=after.last!
    if(event.kind==='place'){
     expect(placements.has(seat)).toBe(false)
     placements.add(seat)
     const exposed=before.stands[event.stand]
     const clears=exposed.sum+event.value>=13
     expect(after.stands[event.stand].cubes).toEqual(clears?[event.value]:[...exposed.cubes,event.value])
     expect(after.scores.find(x=>x.seat===seat)!.penalty-before.scores.find(x=>x.seat===seat)!.penalty).toBe(clears?exposed.cubes.length:0)
    }
    for(const board of Object.values(after.stands))expect(board.sum).toBeLessThan(13)
   }
   expect(placements.size).toBe(count)
  }
  expect(heavy13View(s,'observer')).toMatchObject({phase:'finished',round:14,cycle:2})
  expect(s.placed).toBe(14*count)
 }),{seed:20261127,numRuns:36})
})
