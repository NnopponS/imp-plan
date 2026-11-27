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

it('automatically deals different appearances to all 16 seats and hides private seat fields',()=>{
 const room=new Host('Host',()=>10)
 for(let i=1;i<16;i++)expect(room.join('p'+i,'Player '+i)).not.toBeNull()
 const publicSeats=room.snapshot('p15')!.seats
 const appearances=publicSeats.map(s=>s.appearance)
 expect(new Set(appearances).size).toBe(16)
 expect(appearances.every(n=>Number.isInteger(n)&&n!>=0&&n!<27)).toBe(true)
 expect(room.snapshot('host')!.seats).toEqual(publicSeats)
 for(const seat of publicSeats){expect(seat).not.toHaveProperty('token');expect(seat).not.toHaveProperty('connection')}
})

it('honors explicit presets, avoids their collisions on automatic assignment and never redresses a resumed seat',()=>{
 const room=new Host('Host',()=>10,false,0)
 const manual=room.join('manual','Manual',undefined,0)!
 const fresh=room.join('fresh','Fresh')!
 const appearance=(id:string)=>room.snapshot('host')!.seats.find(seat=>seat.id===id)?.appearance
 expect(appearance(room.owner)).toBe(0)
 expect(appearance(manual.id)).toBe(0)
 const before=appearance(fresh.id)!
 expect(before).not.toBe(0)
 room.disconnect('fresh')
 expect(room.join('resumed','Fresh',fresh.token,(before+1)%27)?.id).toBe(fresh.id)
 expect(appearance(fresh.id)).toBe(before)
 expect(room.command('host','remove',room.rev,{kind:'kick',seat:fresh.id})).toBeNull()
 expect(room.join('try-again','Fresh',fresh.token)).toBeNull()
 expect(room.join('next','Next')).not.toBeNull()
 expect(room.snapshot('host')!.seats.at(-1)?.appearance).not.toBe(before)
})

it('reuses only currently vacant looks even after all 27 presets have been dealt',()=>{
 const room=new Host('Host',()=>10,false,26)
 const persistent=room.join('persistent','Persistent')!
 const issued=new Set<number>(room.snapshot('host')!.seats.map(seat=>seat.appearance!))
 for(let i=0;i<40;i++){
  const fresh=room.join('p'+i,'Guest')!
  const seats=room.snapshot('host')!.seats
  expect(new Set(seats.map(seat=>seat.appearance)).size).toBe(3)
  if(i<25)expect(issued.has(seats.at(-1)!.appearance!)).toBe(false)
  issued.add(seats.at(-1)!.appearance!)
  expect(room.command('host','kick'+i,room.rev,{kind:'kick',seat:fresh.id})).toBeNull()
 }
 expect(issued.size).toBe(27)
 expect(room.snapshot('persistent')!.you).toBe(persistent.id)
 expect(room.command('host','bot',room.rev,{kind:'bot'})).toBeNull()
 expect(new Set(room.snapshot('host')!.seats.map(seat=>seat.appearance)).size).toBe(3)
})

it('accepts the legacy hello and sanitizes only the additive preset field',()=>{
 const hello={version:1,type:'hello',name:'Guest'}
 expect(decode(JSON.stringify(hello))).toEqual(hello)
 for(const appearance of [0,26])expect(decode(JSON.stringify({...hello,appearance}))).toEqual({...hello,appearance})
 for(const appearance of [-1,27,6.25,[],{},'12',null,false]){
  expect(decode(JSON.stringify({...hello,appearance}))).toMatchObject(hello)
  const parsed=decode(JSON.stringify({...hello,appearance}))
  expect(parsed?.type==='hello'?parsed.appearance:NaN).toBeUndefined()
 }
 expect(decode(JSON.stringify({...hello,appearance:4,host:true}))).toBeNull()
})
