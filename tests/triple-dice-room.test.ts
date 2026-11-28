import {expect,test} from 'vitest'
import {Host,decode,seatRules,type Command} from '../src/room'
import {diceRounds,type DiceBand} from '../src/triple-dice'

function room(count=3,solo=false){
 let now=1_000,req=0
 const host=new Host('Ada',()=>now,solo)
 const send=(who:string,command:Command,rev=host.rev)=>host.command(who,'request-'+(++req),rev,command)
 expect(send('host',{kind:'config',settings:{...host.settings,game:'tripleDice',capacity:8}})).toBeNull()
 if(!solo)for(let i=1;i<count;i++){
  expect(host.join('p'+i,'Guest '+i)).not.toBeNull()
  expect(send('p'+i,{kind:'ready'})).toBeNull()
 }
 expect(send('host',{kind:'start'})).toBeNull()
 const state=(who='host')=>host.snapshot(who)!.game!.tripleDice!
 const lock=(who:string,round=state().round,positions=[0,1,3] as [number,number,number],prediction:DiceBand='low',rev=host.rev)=>send(who,{kind:'dice-lock',match:host.match,round,positions,prediction},rev)
 return {host,state,send,lock,now:(v:number)=>{now=v}}
}

test('a concurrent lock privately acknowledges only its owner and does not increment public revision until reveal',()=>{
 const {host,state,lock}=room()
 const rev=host.rev,p1=host.snapshot('p1'),p2=host.snapshot('p2')
 expect(lock('host')).toBeNull()
 expect(state().mine?.choice).toEqual({positions:[0,1,3],prediction:'low'})
 expect(host.rev).toBe(rev)
 expect(host.snapshot('p1')).toEqual(p1)
 expect(lock('p1',1,[1,2,3],'mid',rev)).toBeNull()
 expect(host.snapshot('p2')).toEqual(p2)
 expect(lock('p2',1,[0,1,2],'low',rev)).toBeNull()
 expect(host.rev).toBe(rev+1)
 expect(state('p1').reveal).toEqual(state().reveal)
})

test('guard locks to the current match and round; expired or replayed actions cannot alter results',()=>{
 const {host,state,lock,send,now}=room(2)
 expect(send('host',{kind:'dice-lock',match:'1'.repeat(32),round:1,positions:[0,1,2],prediction:'low'})).toMatch(/current/i)
 expect(send('host',{kind:'move',action:0})).not.toBeNull()
 expect(lock('host',2)).not.toBeNull()
 expect(lock('host',1,[0,0,1])).not.toBeNull()
 expect(lock('host')).toBeNull()
 expect(lock('host')).not.toBeNull()
 host.disconnect('p1')
 now(state().deadline!)
 expect(host.tick()).toBe(true)
 expect(state().reveal?.[1]).toMatchObject({points:0,dice:null})
 now(state().deadline!)
 expect(host.tick()).toBe(true)
 expect(lock('host',1)).not.toBeNull()
 expect(state()).toMatchObject({phase:'select',round:2})
})

test('accountless practice completes every round with one bot and a named result',()=>{
 const {host,state,lock,now}=room(2,true)
 expect(host.snapshot('host')!.seats.map(s=>s.bot)).toEqual([false,true])
 for(let r=1;r<=diceRounds;r++){
  const deadline=state().deadline!
  const rev=host.rev
  now(deadline-host.settings.seconds*1000+700)
  expect(host.tick()).toBe(false)
  expect(host.rev).toBe(rev)
  expect(lock('host')).toBeNull()
  expect(state().phase).toBe(r===8?'done':'review')
  if(r<8){now(state().deadline!);expect(host.tick()).toBe(true)}
 }
 const end=host.snapshot('host')!
 expect(end.game!.done).toBe(true)
 expect(end.seriesDone).toBe(true)
 expect(end.game!.scores.reduce((a,b)=>a+b,0)).toBe(56)
})

test('seat limits and wire parser accept only the Triple Dice contract',()=>{
 expect(seatRules({game:'tripleDice'})).toEqual({min:2,max:8})
 const {host,state}=room(8)
 expect(state().table).toHaveLength(8)
 expect(host.join('extra','Extra')).toBeNull()
 const command={kind:'dice-lock',match:host.match,round:1,positions:[0,1,2],prediction:'low'}
 const pack=(c:unknown)=>JSON.stringify({version:1,type:'command',epoch:host.epoch,match:host.match,seq:1,request:host.epoch,rev:host.rev,command:c})
 expect(decode(pack(command))).not.toBeNull()
 for(const c of [{...command,round:9},{...command,positions:[0,1,4]},{...command,positions:[0,1]},{...command,positions:[0,0,1]},{...command,prediction:1},{...command,hidden:6}])expect(decode(pack(c))).toBeNull()
})
