import {describe,expect,it} from 'vitest'
import {bingoAdvance,bingoApply,bingoBot,bingoCoinValue,bingoFit,bingoReviewMs,bingoRounds,bingoStart,bingoView} from '../src/auction-bingo'

describe('Auction Bingo',()=>{
 it('seals shape, bid, purse and awards until the appropriate reveal',()=>{
  const s=bingoStart(['a','b','c'],100,1000)
  const a=bingoApply(s,'a',{kind:'select',shape:'star'},200)!
  expect(bingoView(a,'b')).toEqual(bingoView(s,'b'))
  expect(bingoView(a,'a').mine?.choice).toBe('star')
  const b=bingoApply(a,'b',{kind:'select',shape:'star'},300)!
  const c=bingoApply(b,'c',{kind:'select',shape:'circle'},400)!
  expect(bingoView(c,'b').choices).toEqual(['star','star','circle'])
  const sealed=bingoApply(c,'a',{kind:'bid',coins:512},450)!
  expect(bingoView(sealed,'b')).toEqual(bingoView(c,'b'))
  expect(bingoView(sealed).mine).toBeNull()
  expect(bingoView(sealed,'a').mine?.bid).toBe(10)
  const next=bingoApply(bingoApply(sealed,'b',{kind:'bid',coins:1},500)!,'c',{kind:'bid',coins:1},550)!
  expect(bingoView(next,'b')).toMatchObject({phase:'review',prices:[null,1,'sealed'],mine:{coins:1022},results:null})
  expect(JSON.stringify(bingoView(next,'b'))).not.toMatch(/counts|awards|winners|leaders":\["a"/)
 })
 it('expires exact deadlines, rejects duplicates and invalid coins, and splits top ties fairly',()=>{
  let s=bingoStart(['a','b','c','d','e','f'],0,20)
  expect(bingoApply(s,'a',{kind:'select',shape:'star'},20)).toBeNull()
  for(const seat of ['a','b','c','d','e'])s=bingoApply(s,seat,{kind:'select',shape:'star'},1)!
  expect(bingoApply(s,'a',{kind:'select',shape:'circle'},2)).toBeNull()
  s=bingoAdvance(s,20)
  expect(bingoApply(s,'f',{kind:'bid',coins:1},21)).toBeNull()
  expect(bingoApply(s,'a',{kind:'bid',coins:1024},21)).toBeNull()
  for(const [seat,coins] of [['a',8],['b',16],['c',1],['d',0],['e',0]] as const)s=bingoApply(s,seat,{kind:'bid',coins},25)!
  expect(s.awards).toEqual([[0,0,2],[0,0,2],[0,0,0],[0,0,0],[0,0,0],[0,0,0]])
  expect(bingoCoinValue(bingoView(s,'a').mine!.coins)).toBe(28)
  expect(bingoCoinValue(bingoView(s,'c').mine!.coins)).toBe(29)
  s=bingoAdvance(s,s.deadline!)
  for(const seat of ['a','b','c','d','e','f'])s=bingoApply(s,seat,{kind:'select',shape:'star'},s.opened)!
  expect(bingoApply(s,'a',{kind:'bid',coins:8},s.opened)).toBeNull()
 })
 it('places shapes to maximize lines, including crossing lines, and caps excess shapes',()=>{
  expect(bingoFit([3,3,3])).toMatchObject({cells:9,lines:8})
  expect(bingoFit([50,0,0])).toMatchObject({cells:3,lines:1})
  expect(bingoFit([2,2,1]).lines).toBeGreaterThan(1)
  expect(bingoFit([0,0,0])).toEqual({mask:0,cells:0,lines:0})
 })
 it('finishes exactly seven rounds even if nobody acts, sharing exact ties',()=>{
  let s=bingoStart(['a','b'],0,100)
  for(let i=1;i<=bingoRounds;i++){
   expect(s.round).toBe(i)
   s=bingoAdvance(s,s.deadline!)
   expect(s.phase).toBe('review')
   expect(s.deadline).toBe(s.opened+bingoReviewMs)
   s=bingoAdvance(s,s.deadline!)
  }
  expect(bingoView(s)).toMatchObject({phase:'done',deadline:null,leaders:['a','b'],results:[{seat:'a',rank:1},{seat:'b',rank:1}]})
  expect(bingoAdvance(s,1e6)).toBe(s)
 })
 it('ranks lines over cells, cells over cash, and cash only after the board ties',()=>{
  const play=(a:number[],b:number[])=>{
   let s=bingoStart(['a','b'],0,100)
   for(let i=0;i<bingoRounds;i++){
    s=bingoApply(s,'a',{kind:'select',shape:'triangle'},s.opened)!
    s=bingoApply(s,'b',{kind:'select',shape:'star'},s.opened)!
    s=bingoApply(s,'a',{kind:'bid',coins:a[i]??0},s.opened)!
    s=bingoApply(s,'b',{kind:'bid',coins:b[i]??0},s.opened)!
    s=bingoAdvance(s,s.deadline!)
   }
   return bingoView(s).results!.map(({seat,lines,cells,bank})=>[seat,lines,cells,bank])
  }
  expect(play([2,4,512],[1,2])).toEqual([['a',1,3,18],['b',0,2,28]])
  expect(play([512],[])).toEqual([['a',0,1,20],['b',0,0,30]])
  expect(play([512],[1])).toEqual([['b',0,1,29],['a',0,1,20]])
 })
 it('supports the fan seat bounds and a real contest from filtered bot views',()=>{
  expect(()=>bingoStart(['a'],0,100)).toThrow()
  expect(()=>bingoStart(['a','a'],0,100)).toThrow()
  expect(()=>bingoStart(Array.from({length:17},(_,i)=>'s'+i),0,100)).toThrow()
  let s=bingoStart(Array.from({length:16},(_,i)=>'s'+i),0,100)
  while(s.phase!=='done'){
   if(s.phase==='review'){s=bingoAdvance(s,s.deadline!);continue}
   const phase=s.phase
   for(const [i,seat] of s.seats.entries()){
    const action=bingoBot(bingoView(s,seat),i*3721,'normal',seat)
    if(action)s=bingoApply(s,seat,action,s.opened)!
    if(s.phase!==phase)break
   }
  }
  const results=bingoView(s).results!
  expect(results).toHaveLength(16)
  expect(results[0].lines).toBeGreaterThan(0)
  expect(results.some(r=>r.bank<30)).toBe(true)
  expect(results.every(r=>r.bank>=0&&r.cells<=9)).toBe(true)
 })
})
