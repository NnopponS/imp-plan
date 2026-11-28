import {expect,test} from 'vitest'
import {decode,Host,seatRules,type Command} from '../src/room'
import type {BigSmallAction} from '../src/big-small'

function room(solo=false){
 let now=1_000,nonce=0
 const h=new Host('Ada',()=>now,solo)
 const tell=(conn:string,command:Command,rev=h.rev)=>h.command(conn,'req-'+(++nonce),rev,command)
 expect(tell('host',{kind:'config',settings:{...h.settings,game:'bigSmall',capacity:2}})).toBeNull()
 if(!solo){
  expect(h.join('peer','Bram')).not.toBeNull()
  expect(tell('peer',{kind:'ready'})).toBeNull()
  expect(h.join('third','Cora')).toBeNull()
 }
 expect(tell('host',{kind:'start'})).toBeNull()
 const snap=(conn='host')=>h.snapshot(conn)!
 const view=(conn='host')=>snap(conn).game!.bigSmall!
 const run=(conn:string,action:BigSmallAction,step=view(conn).step,match=h.match)=>tell(conn,{kind:'big-small',action,step,match})
 const tick=()=>{now+=1_000;return h.tick()}
 return {h,tell,snap,view,run,tick}
}

test('two-seat room projects a sealed card only to its owner; strict steps forbid replay and role impersonation',()=>{
 const {h,tell,snap,view,run}=room()
 expect(seatRules(h.settings)).toEqual({min:2,max:2,fixtureSize:2})
 expect(snap().count).toBe(1)
 expect(snap().game!.scores).toEqual([10,10])
 expect(snap().game!.deadline).toBeNull()
 expect(run('peer',{kind:'seal',card:10,call:'big'})).not.toBeNull()
 expect(run('host',{kind:'seal',card:10,call:'big'},0,'0'.repeat(32))).not.toBeNull()
 expect(run('host',{kind:'seal',card:10,call:'big'})).toBeNull()
 expect(view().ownSeal).toEqual({card:10,call:'big'})
 expect(view('peer')).toMatchObject({sealed:true,phase:'predict',latest:null,ownSeal:null,step:1})
 expect(snap('peer').game!.hand).toEqual([])
 expect(tell('host',{kind:'move',action:10})).not.toBeNull()
 expect(run('peer',{kind:'predict',prediction:'small',stake:3},0)).not.toBeNull()
 expect(run('peer',{kind:'predict',prediction:'small',stake:3})).toBeNull()
 expect(view('peer').latest).toEqual(view().latest)
 expect(snap('peer').game!.scores[1]).toBe(7)
 expect(run('peer',{kind:'advance'})).toBeNull()
 expect(view('peer').duelist).toBe(snap('peer').you)
})

test('command schema bounds chip/call/step and rejects packet-supplied identities',()=>{
 const {h}=room()
 const packet=(command:unknown)=>JSON.stringify({version:1,type:'command',epoch:h.epoch,match:h.match,seq:1,request:h.epoch,rev:h.rev,command})
 const cmd={kind:'big-small',match:h.match,step:0,action:{kind:'seal',card:0,call:'small'}}
 expect(decode(packet(cmd))).not.toBeNull()
 for(const bad of [{...cmd,step:-1},{...cmd,step:70},{...cmd,seat:h.owner},{...cmd,action:{...cmd.action,card:'0'}},
  {...cmd,action:{...cmd.action,call:'equal'}},{...cmd,action:{kind:'predict',prediction:'small',stake:4}}])expect(decode(packet(bad))).toBeNull()
})

test('solo practice automatically seats a bot, completes both hidden roles, and pauses on shared settlement',()=>{
 const {snap,run,view,tick}=room(true)
 expect(snap().seats.map(s=>s.bot)).toEqual([false,true])
 expect(run('host',{kind:'seal',card:10,call:'big'})).toBeNull()
 expect(tick()).toBe(true)
 expect(view().phase).toBe('reveal')
 expect(tick()).toBe(false)
 expect(run('host',{kind:'advance'})).toBeNull()
 expect(tick()).toBe(true)
 expect(view()).toMatchObject({phase:'predict',ownSeal:null,maxStake:3})
 expect(run('host',{kind:'predict',prediction:'small',stake:1})).toBeNull()
 expect(view().history).toHaveLength(2)
})
