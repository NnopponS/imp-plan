import {expect,test} from 'vitest'
import {Host,decode,type Command} from '../src/room'

const setup=(practice=false)=>{
 let t=100_000
 const host=new Host('Ada',()=>t,practice)
 const send=(who:string,command:Command,rev=host.rev,request:string=crypto.randomUUID())=>host.command(who,request,rev,command)
 const config=()=>send('host',{kind:'config',settings:{...host.settings,game:'montage'}})
 const step=(delta:number)=>{t+=delta;return host.tick()}
 const jump=(time:number)=>{t=time}
 const snapshot=(who='host')=>host.snapshot(who)!
 const open=(round=1,who='host')=>send(who,{kind:'montage-open',match:host.match,round})
 return {host,send,config,step,jump,snapshot,open}
}
const attach=(s:ReturnType<typeof setup>,who='guest',name='Mina')=>{
 const seat=s.host.join(who,name)!
 expect(s.send(who,{kind:'ready'})).toBeNull()
 return seat
}
const frame=(s:ReturnType<typeof setup>,who='host')=>{
 const v=s.snapshot(who).game!.montage!
 return {kind:'montage-buzz' as const,match:s.host.match,round:v.round,frame:v.frame!.index}
}

test('Montage requires two human seats online but allows a separate, bot-free solo lobby',()=>{
 const s=setup()
 expect(s.config()).toBeNull()
 expect(s.send('host',{kind:'start'})).toBe('More connected, ready seats are needed.')
 expect(s.send('host',{kind:'bot'})).not.toBeNull()
 attach(s)
 expect(s.send('host',{kind:'start'})).toBeNull()
 expect(s.snapshot().game?.montage).toMatchObject({mode:'match',phase:'ready',frame:null,totalRounds:5})
 const solo=setup(true)
 expect(solo.config()).toBeNull()
 expect(solo.snapshot().seats).toHaveLength(1)
 expect(solo.send('host',{kind:'start'})).toBeNull()
 expect(solo.snapshot().game?.montage).toMatchObject({mode:'practice',phase:'ready',frame:null,totalRounds:1})
})

test('only the host opens the current round; no frame is projected before the authoritative tick',()=>{
 const s=setup()
 expect(s.config()).toBeNull()
 attach(s)
 expect(s.send('host',{kind:'start'})).toBeNull()
 expect(s.open(1,'guest')).toBe('Only the host can open a Montage round.')
 expect(s.open(2)).not.toBeNull()
 expect(s.open()).toBeNull()
 const waiting=s.snapshot('guest')
 expect(waiting.game?.montage).toMatchObject({phase:'countdown',frame:null,nextAt:102_000})
 expect(waiting.game?.deadline).toBe(102_000)
 expect(s.step(1999)).toBe(false)
 s.jump(102_000)
 expect(s.snapshot('guest').game?.montage?.frame).toBeNull()
 expect(s.step(0)).toBe(true)
 expect(s.snapshot('guest').game?.montage?.frame).toStrictEqual(s.snapshot().game?.montage?.frame)
 const view=JSON.stringify(s.snapshot('guest').game)
 expect(view).not.toMatch(/roundDecks|seed|buzzed|isRepeat|duplicateId/)
 expect(s.send('guest',{kind:'move',action:1})).toBe('That move is not available.')
})

test('same-frame commands tolerate stale revision but late input is not charged to the next frame',()=>{
 const s=setup()
 expect(s.config()).toBeNull()
 attach(s)
 expect(s.send('host',{kind:'start'})).toBeNull()
 expect(s.open()).toBeNull()
 expect(s.step(2000)).toBe(true)
 const first=frame(s)
 const originalRevision=s.host.rev
 expect(s.send('host',first,originalRevision,'same')).toBeNull()
 expect(s.send('host',first,originalRevision,'same')).toBeNull()
 expect(s.snapshot().game?.montage?.errors).toBe(1)
 expect(s.send('guest',first,originalRevision)).toBeNull()
 expect(s.snapshot().game?.montage?.errors).toBe(2)
 expect(s.send('guest',first,originalRevision)).toBe('You already buzzed on this portrait.')
 s.jump(105_000)
 const before=s.host.rev
 expect(s.send('guest',first,originalRevision)).toBe('That portrait has already changed.')
 expect(s.host.rev).toBe(before+1)
 expect(s.snapshot('guest').game?.montage).toMatchObject({frame:{index:2},errors:2})
 expect(s.send('guest',{...frame(s),match:'c'.repeat(32)})).toBe('This action no longer matches the current game.')
})

test('first arriving repeat claim earns the only Piece and match clock continues past a disconnect',()=>{
 const s=setup()
 expect(s.config()).toBeNull()
 const guest=attach(s)
 expect(s.send('host',{kind:'start'})).toBeNull()
 expect(s.open()).toBeNull()
 expect(s.step(2000)).toBe(true)
 const seen=new Set<number>()
 for(;;){
  const p=s.snapshot().game!.montage!.frame!.portraitId
  if(seen.has(p))break
  seen.add(p)
  expect(s.step(3000)).toBe(true)
 }
 const command=frame(s)
 const rev=s.host.rev
 expect(s.send('guest',command,rev)).toBeNull()
 expect(s.send('host',command,rev)).toBe('The buzzer is closed.')
 expect(s.snapshot().game?.montage).toMatchObject({phase:'between',clearedRounds:1,pieces:[{seat:s.host.owner,pieces:0},{seat:guest.id,pieces:1}]})
 expect(s.open(2)).toBeNull()
 s.host.disconnect('guest')
 expect(s.step(2000)).toBe(true)
 expect(s.snapshot().game?.montage?.frame?.index).toBe(1)
 expect(s.step(100_000)).toBe(true)
 expect(s.snapshot().game).toMatchObject({done:true,winner:null,montage:{outcome:'missed-repeat',frame:null}})
})

test('the wire accepts only bounded position keys, not client time or an answer',()=>{
 const h=setup().host
 const match='a'.repeat(32)
 const command={kind:'montage-buzz',match,round:5,frame:25}
 const packet={version:1,type:'command',epoch:h.epoch,match,seq:1,request:h.epoch,rev:0}
 expect(decode(JSON.stringify({...packet,command}))).toEqual({...packet,command})
 for(const override of [{frame:0},{frame:33},{round:6},{frame:1.5},{match:''},{clientTime:123},{answer:0}]){
  expect(decode(JSON.stringify({...packet,command:{...command,...override}}))).toBeNull()
 }
})
