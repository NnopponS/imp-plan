import {describe,expect,it} from 'vitest'
import {equationValid,equationMarks,equationPool} from '../src/equations'
import {botAction,move,start,view} from '../src/engine'
import {decode,id,protocolVersion} from '../src/room'

describe('Equation Lights',()=>{
 it('accepts exactly eight ASCII characters, precedence and exact division only',()=>{
  for(const s of ['12+13=25','2+3*4=14','48/4+=13','16/4*2=8','11-11=00','12/5*5=12','12+(1)=13','12+3=015','12+13=26','１２+13=25','01+12=13','100/4=25']) {
   expect(equationValid(s),s).toBe(['12+13=25','2+3*4=14','16/4*2=8','100/4=25'].includes(s))
  }
  expect(equationValid('3/2*4=06')).toBe(false)
  expect(equationValid('3/2*24=36')).toBe(false)
  expect(equationValid('3/2*6=09')).toBe(false)
  expect(equationValid('3/2*16=24')).toBe(false)
  expect(equationValid('3/2*10=15')).toBe(false)
  expect(equationValid('3/2*8=12')).toBe(false)
  expect(equationValid('2-5+4=01')).toBe(false)
 })
 it('consumes remaining letters once, preserving exact matches first',()=>{
  expect(equationMarks('12+13=25','11+11=22')).toEqual(['exact','absent','exact','exact','absent','exact','exact','present'])
  expect(equationMarks('12+13=25','12+13=25')).toEqual(Array(8).fill('exact'))
 })
 it('keeps choices and guess history private, enforces turns, and allows an equal-turn tie',()=>{
  let s=start('equations',['a','b'],5000,0)
  const play=(seat:string,e:string)=>move(s,seat,e,1)!
  expect(play('b','20+30=50')).toBeNull()
  s=play('a','12+13=25')
  expect(JSON.stringify(view(s,'b'))).not.toContain('12+13=25')
  expect(view(s,'a').equations?.own).toBe('12+13=25')
  expect(play('a','12+13=25')).toBeNull()
  s=play('b','20+30=50')
  expect(play('b','12+13=25')).toBeNull()
  expect(play('a','20+30=51')).toBeNull()
  s=play('a','20+30=50')
  expect(s.done).toBe(false)
  expect(JSON.stringify(view(s,'b'))).not.toContain('12+13=25')
  expect(view(s,'b').equations?.rows).toEqual([])
  expect(view(s,'other').equations?.own).toBeNull()
  expect(view(s,'other').equations?.rows).toEqual([])
  s=play('b','12+13=25')
  expect(s.done).toBe(true)
  expect(s.winner).toBeNull()
 })
 it('ends at eight guesses each, then uses best exact count and earliest achievement',()=>{
  let s=start('equations',['a','b'],10,0)
  const play=(seat:string,e:string)=>{const next=move(s,seat,e,10_000);expect(next,seat+' '+e).not.toBeNull();s=next!}
  play('a','12+13=25');play('b','20+30=50')
  const misses=equationPool().filter(e=>e!== '20+30=50'&&e!=='12+13=25'&&e!=='20+31=51'&&equationMarks('12+13=25',e).filter(m=>m==='exact').length<6).slice(0,8)
  expect(misses).toHaveLength(8)
  for(let n=0;n<8;n++){
   play('a',n===0?'20+31=51':misses[n])
   expect(s.done).toBe(false)
   play('b',misses[n])
  }
  expect(s.done).toBe(true)
  expect(s.winner).toBe('a')
 })
 it('accepts bounded equation move packets only, and bots can play legal guesses without opponent secrets',()=>{
  const movePacket=(action:string)=>JSON.stringify({version:protocolVersion,type:'command',epoch:id(),match:id(),seq:1,request:id(),rev:0,command:{kind:'move',action}})
  expect(decode(movePacket('12+13=25'))?.type).toBe('command')
  expect(decode(movePacket('12+(1)=13'))).toBeNull()
  const pool=equationPool()
  expect(pool.length).toBeGreaterThan(200)
  expect(pool.every(equationValid)).toBe(true)
  const run=(secret:string)=>{
   let s=start('equations',['h','b'],20000,0)
   s=move(s,'h',secret,1)!
   const setup=botAction(view(s,'b'),'b',[],8128)!
   s=move(s,'b',setup,1)!
   s=move(s,'h','11+20=31',1)!
   const guess=botAction(view(s,'b'),'b',[],8128)!
   expect(move(s,'b',guess,1)).not.toBeNull()
   return [setup,guess]
  }
  expect(run('12+13=25')).toEqual(run('20+30=50'))
 })
})
