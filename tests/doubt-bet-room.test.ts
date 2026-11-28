import {expect,test} from 'vitest'
import type {DoubtAction} from '../src/doubt-bet'
import {decode,Host,seatRules,type Command} from '../src/room'

function setup(){
 let now=2000,i=0
 const h=new Host('Ada',()=>now)
 const tell=(conn:string,action:Command,request='req-'+ ++i)=>h.command(conn,request,h.rev,action)
 expect(tell('host',{kind:'config',settings:{...h.settings,game:'doubtBet',capacity:10}})).toBeNull()
 expect(h.join('guest','Bo')).not.toBeNull()
 expect(tell('guest',{kind:'ready'})).toBeNull()
 expect(tell('host',{kind:'start'})).toBeNull()
 const snap=(conn='host')=>h.snapshot(conn)!
 const v=(conn='host')=>snap(conn).game!.doubtBet!
 const act=(conn:string,action:DoubtAction,step=v(conn).step,match=h.match,request?:string)=>tell(conn,{kind:'doubt-bet',action,step,match},request)
 const tick=(ms:number)=>{now+=ms;return h.tick()}
 const opener=()=>v().turn===snap().you?'host':'guest'
 return {h,tell,snap,v,act,tick,opener}
}
test('live room sends only one own hand before calling and rejects other turns, stale steps and foreign matches',()=>{
 const {h,tell,snap,v,act,opener}=setup()
 expect(seatRules(h.settings)).toEqual({min:2,max:10})
 for(const role of ['host','guest']){
  expect(v(role).mine?.hand).toHaveLength(5)
  expect(Object.keys(v(role).table[0])).toEqual(['seat','points','slots','active'])
  expect(JSON.stringify(v(role)).match(/"hand":/g)).toHaveLength(1)
  expect(JSON.stringify(snap(role))).not.toMatch(/"deals"|"seed"/)
 }
 const first=opener(),second=first==='host'?'guest':'host'
 const claim={kind:'bid',color:'blue',count:2,points:1,slots:1} as const
 expect(act(second,claim)).toMatch(/not available/)
 expect(act(first,claim,0,'f'.repeat(32))).toMatch(/ended/)
 expect(tell(first,{kind:'move',action:1})).not.toBeNull()
 expect(act(first,claim,0,h.match,'repeat')).toBeNull()
 expect(act(first,claim,0,h.match,'repeat')).toBeNull()
 expect(v().step).toBe(1)
 expect(act(second,{kind:'doubt',points:2,slots:0},0)).toMatch(/ended/)
 expect(act(second,{kind:'doubt',points:2,slots:0})).toBeNull()
 const result=v().latest
 expect(result?.cards?.flatMap(row=>row.hand)).toHaveLength(10)
 expect(v('guest').latest).toEqual(result)
 expect(act('guest',{kind:'next'})).toMatch(/Only the host/)
 expect(act('host',{kind:'next'})).toBeNull()
 expect(v().round).toBe(2)
 expect(v('guest').latest).toBeNull()
 expect(v('guest').table.every(r=>!Object.hasOwn(r,'hand'))).toBe(true)
})
test('wire accepts only turn intent, not card sets, wild claims, actor IDs or malformed wagers',()=>{
 const {h}=setup()
 const action={kind:'bid',color:'green',count:2,points:2,slots:1}
 const cmd={kind:'doubt-bet',match:h.match,step:0,action}
 const wire=(command:unknown)=>JSON.stringify({version:1,type:'command',epoch:h.epoch,match:h.match,seq:1,request:h.epoch,rev:h.rev,command})
 expect(decode(wire(cmd))).not.toBeNull()
 for(const bad of [
  {...cmd,seat:h.owner},{...cmd,step:129},{...cmd,action:{...action,hand:['green']}},{...cmd,action:{...action,color:'wild'}},
  {...cmd,action:{...action,slots:-1}},{...cmd,action:{...action,points:1.5}},{...cmd,action:{...action,count:21}}
 ])expect(decode(wire(bad))).toBeNull()
})
test('a disconnected challenged player times out by folding without revealing any opponent cards',()=>{
 const {h,v,act,tick,opener}=setup()
 const first=opener(),second=first==='host'?'guest':'host'
 expect(act(first,{kind:'bid',color:'red',count:2,points:1,slots:0})).toBeNull()
 expect(act(second,{kind:'doubt',points:2,slots:0})).toBeNull()
 if(first==='guest')h.disconnect('guest')
 expect(tick(45000)).toBe(true)
 expect(v().latest).toMatchObject({reason:'fold',cards:null,counted:null})
 expect(JSON.stringify(v())).not.toMatch(/"deals"|"seed"|"cards":\[/)
})
