import {expect,it} from 'vitest'
import {Host,decode,nickname} from '../src/room'
it('rejects malformed and spoofed messages; processes commands only once at a matching revision',()=>{
 const h=new Host('Host',()=>0)
 const a=h.join('connection','Ann')!
 expect(decode('{"type":"hello","name":"Ann","host":true}')).toBeNull()
 expect(h.command('stranger','a',h.rev,{kind:'start'})).toMatch(/seat/i)
 expect(h.command('connection','a',h.rev,{kind:'start'})).toMatch(/host/i)
 expect(h.command('connection','b',h.rev,{kind:'ready'})).toBeNull()
 const after=h.rev
 expect(h.command('connection','b',after-1,{kind:'ready'})).toBeNull()
 expect(h.rev).toBe(after)
 expect(h.command('connection','c',after-1,{kind:'ready'})).toMatch(/updated/i)
 expect(h.snapshot('connection')?.you).toBe(a.id)
})
it('a valid resume rotates the token and revokes the old connection',()=>{
 const h=new Host('Host',()=>0)
 const a=h.join('1','Ann')!
 expect(h.join('2','Ann','fake-resume-token')).toBeNull()
 expect(h.join('2','Not Ann',a.token)).toBeNull()
 const b=h.join('2','Ann',a.token)!
 expect(b.id).toBe(a.id)
 expect(b.token).not.toBe(a.token)
 expect(h.snapshot('1')).toBeNull()
 expect(h.snapshot('2')?.you).toBe(a.id)
 expect(h.join('3','Ann',a.token)).toBeNull()
})
it('normalizes guest names without allowing control characters',()=>{
 expect(nickname('  Ａnn  ')).toBe('Ann')
 expect(nickname('Ann\u000AHost')).toBeNull()
 expect(nickname('x'.repeat(25))).toBeNull()
})
it('fills 16 simulated human seats, rejects overflow, and finishes a sealed match',()=>{
 let time=1000
 const h=new Host('Host',()=>time)
 const settings={...h.settings,game:'auction' as const}
 expect(h.command('host','config',h.rev,{kind:'config',settings})).toBeNull()
 for(let i=1;i<16;i++){
  expect(h.join(String(i),'Guest '+i)).not.toBeNull()
  expect(h.command(String(i),'ready',h.rev,{kind:'ready'})).toBeNull()
 }
 expect(h.join('overflow','Late')).toBeNull()
 expect(h.command('host','start',h.rev,{kind:'start'})).toBeNull()
 expect(h.snapshot('15')?.game?.seats).toHaveLength(16)
 for(let round=1;round<=8;round++){
  expect(h.command('host','bid'+round,h.rev,{kind:'move',action:1000})).toBeNull()
  expect(h.snapshot('15')?.game?.mine).toBeNull()
  time+=26000;expect(h.tick()).toBe(true)
 }
 expect(h.snapshot('15')?.game?.winner).toBe(h.owner)
})
it('accepts concurrent bids against the same round without accepting a prior round',()=>{
 const h=new Host('Host',()=>1000)
 h.join('guest','Guest')
 h.command('guest','ready',h.rev,{kind:'ready'})
 h.command('host','config',h.rev,{kind:'config',settings:{...h.settings,game:'auction'}})
 h.command('host','start',h.rev,{kind:'start'})
 const simultaneous=h.rev
 expect(h.command('host','a',simultaneous,{kind:'move',action:1000,round:1})).toBeNull()
 expect(h.command('guest','b',simultaneous,{kind:'move',action:2000,round:1})).toBeNull()
 expect(h.command('guest','c',h.rev,{kind:'move',action:2000,round:1})).toMatch(/round/i)
 expect(h.snapshot('guest')?.game?.round).toBe(2)
})
