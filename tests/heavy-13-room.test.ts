import {expect,test} from 'vitest'
import {Host,decode,type Command} from '../src/room'
import {heavy13Lock,heavy13Pass,heavy13Place} from '../src/heavy-13'

function table(count=2,solo=false){
 let now=1000,nonce=0
 const h=new Host('Ada',()=>now,solo)
 const send=(who:string,command:Command,rev=h.rev)=>h.command(who,'req-'+(++nonce),rev,command)
 const config=(cap:number)=>send('host',{kind:'config',settings:{...h.settings,game:'heavy13',capacity:cap}})
 expect(config(downCap(count))).toBeNull()
 if(!solo)for(let i=1;i<count;i++){expect(h.join('g'+i,'Guest '+i)).not.toBeNull();expect(send('g'+i,{kind:'ready'})).toBeNull()}
 expect(send('host',{kind:'start'})).toBeNull()
 const hv=(who='host')=>h.snapshot(who)!.game!.heavy13!
 const lock=(who:string,value:number,color:string,round=hv().round)=>send(who,{kind:'heavy-lock',match:h.match,round,action:heavy13Lock(value,color)})
 const action=(who:string,a:number,slot=hv().slot!)=>send(who,{kind:'heavy-act',match:h.match,round:hv().round,slot,action:a})
 return {h,send,hv,lock,action,clock:(t:number)=>{now=t}}
}
const downCap=(n:number)=>Math.min(7,n)

test('only the locking connection sees a partial lock and simultaneous locks share a public revision',()=>{
 const {h,hv,lock,send}=table(3)
 const before=h.snapshot('g1'),rev=h.rev
 expect(lock('host',6,'red')).toBeNull()
 expect(h.rev).toBe(rev)
 expect(h.snapshot('g1')).toEqual(before)
 expect(hv().mine?.locked).toEqual({value:6,color:'red'})
 expect(lock('g1',0,'rainbow')).toBeNull()
 expect(h.rev).toBe(rev)
 expect(hv('g2').reveal).toBeNull()
 expect(send('g2',{kind:'heavy-lock',match:h.match,round:1,action:heavy13Lock(5,'blue')},rev)).toBeNull()
 expect(h.rev).toBe(rev+1)
 expect(hv('g1')).toMatchObject({phase:'resolve',slot:0,order:[h.snapshot('g1')!.you,h.owner,h.snapshot('g2')!.you]})
 expect(hv('host').reveal).toEqual(hv('g1').reveal)
})

test('exact match, round and slot guards reject replay, outsiders and generic move shortcuts',()=>{
 const {h,hv,lock,action,send}=table(2)
 const stale={kind:'heavy-lock' as const,match:'0'.repeat(32),round:1,action:0}
 expect(send('host',stale)).toMatch(/current/)
 expect(lock('host',6,'red',2)).toMatch(/phase|round/i)
 expect(send('host',{kind:'move',action:0})).toBe('That move is not available.')
 expect(lock('host',6,'red')).toBeNull()
 expect(lock('g1',5,'blue')).toBeNull()
 expect(action('g1',heavy13Place('blue'))).not.toBeNull()
 expect(action('host',heavy13Pass)).toBeNull()
 const slot=hv().slot!
 expect(slot).toBe(1)
 expect(action('g1',heavy13Place('blue'),0)).toMatch(/slot/i)
 expect(action('g1',heavy13Place('blue'))).toBeNull()
 expect(hv().slot).toBe(3)
 expect(action('host',heavy13Place('red'))).toBeNull()
 expect(hv()).toMatchObject({round:2,slot:null,phase:'select'})
 expect(send('g1',{kind:'heavy-act',match:h.match,round:1,slot,action:heavy13Place('blue')})).toMatch(/phase|round/i)
})

test('bots can privately lock without a public revision, then auto-play their revealed turn',()=>{
 const {h,hv,lock,clock}=table(2,true)
 const rev=h.rev
 clock(1700)
 expect(h.tick()).toBe(false)
 expect(h.rev).toBe(rev)
 expect(hv()).toMatchObject({phase:'select',reveal:null})
 expect(lock('host',0,'red')).toBeNull()
 expect(hv()).toMatchObject({phase:'resolve',slot:0})
 const startsWithBot=hv().currentSeat!==h.owner
 if(!startsWithBot)return
 clock(2400)
 expect(h.tick()).toBe(true)
 expect(hv().slot).toBeGreaterThan(0)
})

test('sets 2–7 native limits, refuses preexisting oversized rooms, and clock resolves disconnected seats',()=>{
 for(let n=2;n<=7;n++)expect(table(n).hv().seats).toHaveLength(n)
 const h=new Host('Ada',()=>1000)
 for(let i=0;i<7;i++)expect(h.join('g'+i,'Guest '+i)).not.toBeNull()
 expect(h.command('host','large',h.rev,{kind:'config',settings:{...h.settings,game:'heavy13'}})).toMatch(/seven/i)
 const game=table(2)
 expect(game.lock('host',6,'rainbow')).toBeNull()
 game.h.disconnect('g1')
 game.clock(game.hv().deadline!)
 expect(game.h.tick()).toBe(true)
 expect(game.hv()).toMatchObject({phase:'resolve',slot:0})
 game.clock(game.hv().deadline!)
 expect(game.h.tick()).toBe(true)
 expect(game.hv().last).toMatchObject({automatic:true})
})

test('Heavy packets restrict codes and reject unknown fields',()=>{
 const {h}=table()
 const pack=(command:unknown)=>JSON.stringify({version:1,type:'command',epoch:h.epoch,match:h.match,seq:1,request:h.epoch,rev:h.rev,command})
 expect(decode(pack({kind:'heavy-lock',match:h.match,round:14,action:27}))).not.toBeNull()
 expect(decode(pack({kind:'heavy-act',match:h.match,round:14,slot:11,action:31}))).not.toBeNull()
 for(const command of [
  {kind:'heavy-lock',match:h.match,round:1,action:28},
  {kind:'heavy-lock',match:h.match,round:15,action:0},
  {kind:'heavy-act',match:h.match,round:1,slot:0,action:27},
  {kind:'heavy-act',match:h.match,round:1,action:31},
  {kind:'heavy-act',match:h.match,round:1,slot:0,action:31,value:3},
 ])expect(decode(pack(command))).toBeNull()
})
