import {expect,test} from 'vitest'
import {Host,decode,seatRules,type Command} from '../src/room'
import type {HitAction} from '../src/hit-stay'

function setup(solo=false){
 let now=2000,i=0
 const h=new Host('Ada',()=>now,solo)
 const tell=(conn:string,command:Command,request='hit-'+ ++i)=>h.command(conn,request,h.rev,command)
 expect(tell('host',{kind:'config',settings:{...h.settings,game:'hitStay',capacity:8,seconds:15}})).toBeNull()
 if(solo){expect(h.snapshot('host')?.seats.some(s=>s.bot)).toBe(true)}
 else{
  expect(h.join('guest','Bo')).not.toBeNull()
  expect(tell('guest',{kind:'ready'})).toBeNull()
 }
 expect(tell('host',{kind:'start'})).toBeNull()
 const snap=(conn='host')=>h.snapshot(conn)!
 const v=(conn='host')=>snap(conn).game!.hitStay!
 const act=(conn:string,action:HitAction,step=v().step,match=h.match,request?:string)=>tell(conn,{kind:'hit-stay',action,step,match},request)
 const tick=(ms:number)=>{now+=ms;return h.tick()}
 const opener=()=>v().turn===snap().you?'host':'guest'
 return {h,tell,snap,v,act,tick,opener}
}
test('room validates acting seat and match/step, ties idempotence to the request and opens only one private hand',()=>{
 const {h,tell,snap,v,act,opener}=setup()
 expect(seatRules(h.settings)).toEqual({min:2,max:8})
 expect(seatRules(h.settings,true)).toEqual({min:2,max:2})
 for(const role of ['host','guest']){
  expect(v(role).mine?.cards).toHaveLength(2)
  expect(JSON.stringify(snap(role)).match(/"cards":/g)).toHaveLength(1)
  expect(JSON.stringify(snap(role))).not.toMatch(/"shoe"|"shoes"|"seed"/)
 }
 const first=opener(), second=first==='host'?'guest':'host'
 expect(act(second,'hit')).not.toBeNull()
 expect(act(first,'stay',0,'f'.repeat(32))).not.toBeNull()
 expect(tell(first,{kind:'move',action:1})).not.toBeNull()
 expect(act(first,'stay',0,h.match,'one')).toBeNull()
 expect(act(first,'stay',0,h.match,'one')).toBeNull()
 expect(v().step).toBe(1)
 expect(act(second,'stay',0)).not.toBeNull()
 expect(act(second,'stay')).toBeNull()
 expect(v().reveal?.rows.flatMap(r=>r.cards)).toHaveLength(4)
 expect(v('guest').reveal).toEqual(v().reveal)
 expect(act('guest','deal')).toMatch(/host/i)
 expect(act('host','deal')).toBeNull()
 expect(v().reveal).toBeNull()
 expect(v().round).toBe(2)
})
test('late intent cannot set a hand; timeout progresses a disconnected acting seat',()=>{
 const {h,v,act,tick,opener}=setup()
 const first=opener()
 if(first==='guest')h.disconnect(first)
 expect(tick(15000)).toBe(true)
 expect(v().step).toBe(1)
 expect(act('host','stay',0)).not.toBeNull()
 expect(v().seats.find(s=>s.status==='stayed')).toBeDefined()
})
test('wire accepts intent, rejects forged data, and practice bots play from their seat',()=>{
 const {h,snap,v,act,tick}=setup(true)
 const cmd={kind:'hit-stay',match:h.match,step:0,action:'hit'}
 const wire=(command:unknown)=>JSON.stringify({version:1,type:'command',epoch:h.epoch,match:h.match,seq:1,request:h.epoch,rev:h.rev,command})
 expect(decode(wire(cmd))).not.toBeNull()
 for(const bad of [{...cmd,actor:h.owner},{...cmd,card:{rank:1,suit:'spade'}},{...cmd,action:'raise'},{...cmd,step:1000}])expect(decode(wire(bad))).toBeNull()
 if(v().turn===snap().you)expect(act('host','stay')).toBeNull()
 expect(tick(650)).toBe(true)
 expect(v().step).toBeGreaterThan(0)
})
