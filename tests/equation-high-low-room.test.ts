import {expect,test} from 'vitest'
import {equationBot,type EquationAction} from '../src/equation-high-low'
import {decode,Host,seatRules,type Command} from '../src/room'

function table(solo=false){
 let now=2000
 const h=new Host('Ada',()=>now,solo)
 let counter=0
 const tell=(conn:string,c:Command)=>h.command(conn,'request-'+ ++counter,h.rev,c)
 expect(tell('host',{kind:'config',settings:{...h.settings,game:'equationHighLow',capacity:8}})).toBeNull()
 if(!solo){
  expect(h.join('guest','Bo')).not.toBeNull()
  expect(tell('guest',{kind:'ready'})).toBeNull()
 }
 expect(tell('host',{kind:'start'})).toBeNull()
 const snap=(conn='host')=>h.snapshot(conn)!
 const view=(conn='host')=>snap(conn).game!.equationHighLow!
 const run=(conn:string,action:EquationAction,step=view(conn).step,match=h.match)=>tell(conn,{kind:'equation-high-low',action,step,match})
 const tick=(ms=1000)=>{now+=ms;return h.tick()}
 return {h,tell,snap,view,run,tick}
}
test('the host sends only dealt faces and exactly one own hand, then publishes completed commitments together',()=>{
 const {h,tell,snap,view,run}=table()
 expect(seatRules(h.settings)).toEqual({min:2,max:8})
 expect(snap().game!.hand).toEqual([])
 for(const conn of ['host','guest']){
  const v=view(conn)
  expect(v.mine?.hand).toHaveLength(3)
  expect(JSON.stringify(snap(conn))).not.toMatch(/"(?:decks|seed|pending|sealed)"/)
  expect(v.table.every(r=>r.open.length===2)).toBe(true)
  expect(v.table.some(r=>r.open.includes(v.mine!.hand[0]))).toBe(false)
 }
 expect(run('guest',{kind:'raise',to:1})).toMatch(/not available/)
 expect(tell('host',{kind:'move',action:1})).not.toBeNull()
 expect(run('host',{kind:'call'},0,'0'.repeat(32))).toMatch(/ended/)
 expect(run('host',{kind:'raise',to:1})).toBeNull()
 expect(run('guest',{kind:'call'},0)).toMatch(/ended/)
 expect(run('guest',{kind:'call'})).toBeNull()
 for(const conn of ['host','guest'])expect(run(conn,{kind:'call'})).toBeNull()
 const declaration=(conn:string)=>equationBot(view(conn),snap(conn).you,4,'normal')!
 const before=snap('guest')
 expect(run('host',declaration('host'))).toBeNull()
 expect(view('host').mine?.locked).toBe(true)
 expect(snap('guest')).toEqual(before)
 expect(run('host',{kind:'fold'})).toMatch(/not available/)
 expect(run('guest',declaration('guest'))).toBeNull()
 expect(view('guest').latest).toEqual(view('host').latest)
 expect(view('guest').latest?.rows.every(r=>r.entries.length===1&&r.hand?.length===4)).toBe(true)
})

test('wire decoder rejects spoofed/private fields, impossible operator orders and invalid wagers',()=>{
 const {h}=table()
 const cmd={kind:'equation-high-low',match:h.match,step:0,action:{kind:'seal',low:{order:[0,1,2,3],ops:0},high:null}}
 const wire=(command:unknown)=>JSON.stringify({version:1,type:'command',epoch:h.epoch,match:h.match,seq:1,request:h.epoch,rev:h.rev,command})
 expect(decode(wire(cmd))).not.toBeNull()
 for(const bad of [
  {...cmd,step:-1},{...cmd,step:261},{...cmd,seat:h.owner},
  {...cmd,action:{...cmd.action,low:{order:[1,1,2,3],ops:0}}},
  {...cmd,action:{...cmd.action,low:{order:[0,1,2,4],ops:0}}},
  {...cmd,action:{...cmd.action,low:{order:[0,1,2,3],ops:6}}},
  {...cmd,action:{...cmd.action,low:{order:[0,1,2,3],ops:0,value:1}}},
  {...cmd,action:{kind:'raise',to:4}},
 ])expect(decode(wire(bad))).toBeNull()
})

test('practice bot can act at each wager and complete a private showdown',()=>{
 const {snap,view,run,tick}=table(true)
 expect(snap().seats.map(s=>s.bot)).toEqual([false,true])
 for(let i=0;i<20&&['opening','closing'].includes(view().phase);i++){
  if(view().turn===snap().you)expect(run('host',{kind:'call'})).toBeNull()
  else tick()
 }
 expect(view().phase).toBe('seal')
 expect(run('host',equationBot(view(),snap().you,44,'normal')!)).toBeNull()
 tick()
 expect(view().phase).toBe('review')
 expect(view().latest?.rows).toHaveLength(2)
})

test('an expired wager keeps an unreached fourth card private even in the result',()=>{
 const {h,view,run,tick}=table()
 expect(run('host',{kind:'raise',to:1})).toBeNull()
 h.disconnect('guest')
 expect(tick(50_000)).toBe(true)
 expect(view()).toMatchObject({phase:'review',latest:{uncontested:h.owner,pot:3}})
 expect(view().mine?.hand).toHaveLength(3)
 expect(view().table.every(r=>r.open.length===2)).toBe(true)
 expect(view().latest?.rows.every(r=>r.hand===null)).toBe(true)
})
