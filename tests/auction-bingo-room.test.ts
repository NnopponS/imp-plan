import {expect,test} from 'vitest'
import {Host,decode,seatRules,type Command} from '../src/room'
import {bingoRounds,type BingoAction} from '../src/auction-bingo'

function room(count=3,solo=false){
 let now=1000,seq=0
 const host=new Host('Keeper',()=>now,solo)
 const send=(who:string,command:Command,rev=host.rev)=>host.command(who,String(++seq),rev,command)
 const state=(who='host')=>host.snapshot(who)!.game!.auctionBingo!
 expect(send('host',{kind:'config',settings:{...host.settings,game:'auctionBingo',capacity:16}})).toBeNull()
 if(!solo)for(let i=1;i<count;i++){
  expect(host.join('p'+i,'Guest '+i)).not.toBeNull()
  expect(send('p'+i,{kind:'ready'})).toBeNull()
 }
 expect(send('host',{kind:'start'})).toBeNull()
 const lock=(who:string,action:BingoAction,round=state().round,rev=host.rev)=>send(who,{kind:'bingo-lock',match:host.match,round,action},rev)
 const tick=(offset=0)=>{now=state().deadline!+offset;return host.tick()}
 return {host,state,send,lock,tick,advance:(ms:number)=>{now+=ms;return host.tick()}}
}

test('private submissions do not change other recipients or public revisions; displays switch only once',()=>{
 const {host,state,lock}=room()
 const rev=host.rev,rival=host.snapshot('p1')
 expect(lock('host',{kind:'select',shape:'star'})).toBeNull()
 expect(host.snapshot('p1')).toEqual(rival)
 expect(host.rev).toBe(rev)
 expect(lock('p1',{kind:'select',shape:'star'})).toBeNull()
 expect(lock('p2',{kind:'select',shape:'circle'})).toBeNull()
 expect(host.rev).toBe(rev+1)
 const open=host.snapshot('p1')
 expect(lock('host',{kind:'bid',coins:512})).toBeNull()
 expect(host.snapshot('p1')).toEqual(open)
 expect(state().mine?.bid).toBe(10)
 expect(lock('p1',{kind:'bid',coins:1})).toBeNull()
 expect(lock('p2',{kind:'bid',coins:8})).toBeNull()
 expect(host.rev).toBe(rev+2)
 expect(state().prices).toEqual([null,2,'sealed'])
 expect(state('p1').results).toBeNull()
 expect(state('p1').mine?.coins).toBe(1022)
 expect(state()).not.toHaveProperty('awards')
})
test('readiness and capacity gate the match; disconnect cannot stall or replay a round',()=>{
 const {host,state,lock,tick,send}=room(2)
 expect(seatRules({game:'auctionBingo'})).toEqual({min:2,max:16})
 expect(send('host',{kind:'move',action:0})).not.toBeNull()
 expect(lock('host',{kind:'select',shape:'triangle'},2)).not.toBeNull()
 expect(lock('host',{kind:'select',shape:'triangle'})).toBeNull()
 expect(lock('host',{kind:'select',shape:'star'})).not.toBeNull()
 host.disconnect('p1')
 expect(tick()).toBe(true)
 expect(state().choices).toEqual(['triangle',null])
 expect(lock('host',{kind:'bid',coins:1})).toBeNull()
 expect(state().phase).toBe('review')
 expect(tick()).toBe(true)
 expect(state()).toMatchObject({phase:'select',round:2})
 expect(lock('host',{kind:'select',shape:'star'},1)).not.toBeNull()
 const other=new Host('Keeper')
 expect(other.command('host','1',other.rev,{kind:'config',settings:{...other.settings,game:'auctionBingo',capacity:2}})).toBeNull()
 expect(other.command('host','2',other.rev,{kind:'start'})).not.toBeNull()
 expect(other.join('p','Guest')).not.toBeNull()
 expect(other.command('host','3',other.rev,{kind:'start'})).not.toBeNull()
 expect(other.command('host','4',other.rev,{kind:'config',settings:{...other.settings,capacity:2}})).toBeNull()
 expect(other.join('extra','Too many')).toBeNull()
})
test('practice bots finish seven real auctions and pay whole coins',()=>{
 const {host,state,lock,advance,tick}=room(2,true)
 expect(host.snapshot('host')!.seats.map(s=>s.bot)).toEqual([false,true])
 for(let n=1;n<=bingoRounds;n++){
  expect(state().round).toBe(n)
  expect(lock('host',{kind:'select',shape:'triangle'})).toBeNull()
  expect(advance(700)).toBe(true)
  expect(lock('host',{kind:'bid',coins:1<<(n-1)})).toBeNull()
  expect(advance(700)).toBe(true)
  expect(state().phase).toBe('review')
  expect(tick()).toBe(true)
 }
 expect(host.snapshot('host')!.seriesDone).toBe(true)
 expect(state().results).toHaveLength(2)
 expect(state().results?.every(row=>row.bank<30&&row.cells>0)).toBe(true)
})
test('wire accepts only a bounded action with an exact match token and round',()=>{
 const {host}=room(2)
 const sample={kind:'bingo-lock',match:host.match,round:1,action:{kind:'bid',coins:1}}
 const pack=(command:unknown)=>JSON.stringify({version:1,type:'command',epoch:host.epoch,match:host.match,seq:1,request:host.epoch,rev:host.rev,command})
 expect(decode(pack(sample))).not.toBeNull()
 for(const c of [
  {...sample,round:8},{...sample,match:'none'},{...sample,action:{kind:'bid',coins:1024}},
  {...sample,action:{kind:'bid',coins:1.5}},{...sample,action:{kind:'select',shape:'diamond'}},
  {...sample,action:{kind:'bid',coins:17,value:500}},
 ])expect(decode(pack(c))).toBeNull()
})
