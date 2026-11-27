import {expect,test} from 'vitest'
import {decode,Host,type Command} from '../src/room'

test('Color Link caps the table at two and protects actions against stale position or match replay',()=>{
 let now=1
 const h=new Host('Host',()=>now)
 expect(h.command('host','larger-blind-table',h.rev,{kind:'config',settings:{...h.settings,capacity:4}})).toBeNull()
 const guest=h.join('guest','Guest')!
 const spare=h.join('spare','Spare')!
 const send=(from:string,c:Command,rev=h.rev)=>h.command(from,crypto.randomUUID(),rev,c)
 const settings={...h.settings,game:'colorLink'} as const
 expect(send('host',{kind:'config',settings})).toMatch(/seats 2 players/i)
 expect(send('host',{kind:'kick',seat:spare.id})).toBeNull()
 expect(send('host',{kind:'config',settings})).toBeNull()
 expect(h.snapshot('host')?.settings.capacity).toBe(2)
 expect(h.join('other','Other')).toBeNull()
 expect(send('guest',{kind:'ready'})).toBeNull()
 expect(send('host',{kind:'start'})).toBeNull()
 expect(h.snapshot('host')?.count).toBe(1)
 const action:Extract<Command,{kind:'color-link'}>['action']={type:'place',cells:[0,1]}
 const initial=h.snapshot('host')!
 const placement={kind:'color-link',match:initial.match,step:0,action} as const
 expect(send('guest',placement)).not.toBeNull()
 expect(send('host',{...placement,match:h.epoch})).not.toBeNull()
 expect(send('host',placement)).toBeNull()
 const response={kind:'color-link',match:initial.match,step:1,action:{type:'accept'}} as const
 expect(send('guest',{...response,step:0})).not.toBeNull()
 expect(send('guest',response,initial.rev)).toBeNull() // same position; unrelated revisions need not invalidate it
 expect(h.snapshot('guest')?.game?.colorLink).toMatchObject({actor:guest.id,phase:'place'})
 expect(h.snapshot('guest')?.game?.colorLink).not.toHaveProperty('blocker')
 h.disconnect('guest')
 now=1+h.settings.seconds*1000
 expect(h.tick()).toBe(true)
 expect(h.snapshot('host')?.game?.colorLink?.review).toMatchObject({reason:'place-timeout',winner:h.owner})
})

test('the wire rejects wrong board coordinates, oversized proofs, and extra fields',()=>{
 const h=new Host('Host',()=>0)
 const wire=(action:unknown)=>JSON.stringify({version:1,type:'command',epoch:h.epoch,match:h.epoch,seq:1,request:h.epoch,rev:0,command:{kind:'color-link',match:h.epoch,step:0,action}})
 expect(decode(wire({type:'place',cells:[0,35]}))).not.toBeNull()
 expect(decode(wire({type:'place',cells:[0,36]}))).toBeNull()
 expect(decode(wire({type:'accept',paths:[]}))).toBeNull()
 expect(decode(wire({type:'proof',paths:[Array(37).fill(0)]}))).toBeNull()
 expect(decode(wire({type:'proof',paths:Array(7).fill([0,1])}))).toBeNull()
})

test('practice adds exactly one bot and its response passes through the same host action',()=>{
 for(const level of ['easy','normal','hard'] as const){
  let now=0
  const h=new Host('Host',()=>now,true)
  expect(h.command('host','config',h.rev,{kind:'config',settings:{...h.settings,game:'colorLink',botLevel:level}})).toBeNull()
  expect(h.snapshot('host')?.seats.filter(s=>s.bot)).toHaveLength(1)
  expect(h.command('host','start',h.rev,{kind:'start'})).toBeNull()
  const snap=h.snapshot('host')!
  expect(h.command('host','place',h.rev,{kind:'color-link',match:snap.match,step:0,action:{type:'place',cells:[0,1]}})).toBeNull()
  now=700
  expect(h.tick()).toBe(true)
  expect(h.snapshot('host')?.game?.colorLink).toMatchObject({phase:'place',step:2})
  now=1400
  expect(h.tick()).toBe(true)
  expect(h.snapshot('host')?.game?.colorLink).toMatchObject({phase:'respond',step:3,actor:h.owner})
 }
})
