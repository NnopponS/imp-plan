import {expect,test} from 'vitest'
import {Host,decode,id,seatRules,type Command} from '../src/room'

test('host starts four local seats without a pre-match clock, rejects stale and forged actions',()=>{
 let now=1000
 const room=new Host('Slate',()=>now,true)
 const send=(c:Command)=>room.command('host',id(),room.rev,c)
 expect(send({kind:'config',settings:{...room.settings,game:'piggyBank'}})).toBeNull()
 const lobby=room.snapshot('host')!
 expect(lobby.seats).toHaveLength(4)
 expect(lobby.seats.filter(s=>s.bot)).toHaveLength(3)
 expect(lobby.game).toBeNull()
 expect(room.tick()).toBe(false)
 expect(seatRules({game:'piggyBank'},true)).toEqual({min:4,max:4})
 expect(seatRules({game:'piggyBank'})).toEqual({min:3,max:8})
 expect(send({kind:'start'})).toBeNull()
 const snapshot=room.snapshot('host')!
 const valid={kind:'piggy-bank',match:snapshot.match,step:snapshot.game!.piggyBank!.step,action:{kind:'pass-bank',black:2,white:0,to:1}} as const
 expect(send({...valid,match:id()})).toMatch(/phase/)
 expect(send({...valid,step:valid.step+1})).toMatch(/phase/)
 expect(send({kind:'move',action:0})).not.toBeNull()
 expect(send(valid)).toBeNull()
 expect(send(valid)).toMatch(/phase/)
 now+=2000
 expect(room.tick()).toBe(true)
 expect(room.snapshot('host')!.game!.piggyBank).toMatchObject({phase:'doubt',actor:1})
 const wire=(command:unknown)=>JSON.stringify({version:1,type:'command',epoch:room.epoch,match:room.match,seq:1,request:id(),rev:room.rev,command})
 expect(decode(wire(valid))).not.toBeNull()
 for(const command of [{...valid,seat:'faked'},{...valid,action:{...valid.action,black:1.3}},{...valid,action:{...valid.action,to:8}},
  {...valid,action:{kind:'challenge',counts:[{black:1,white:1}]}},{...valid,action:{kind:'claim',count:122}}])expect(decode(wire(command))).toBeNull()
})

test('another connection cannot see which rivals accepted, reset voter identities or any bank balances',()=>{
 const room=new Host('Slate',()=>1000)
 const send=(c:Command,connection='host')=>room.command(connection,id(),room.rev,c)
 expect(send({kind:'config',settings:{...room.settings,game:'piggyBank'}})).toBeNull()
 room.join('a','Copper');room.join('b','Ash')
 expect(send({kind:'ready'},'a')).toBeNull()
 expect(send({kind:'ready'},'b')).toBeNull()
 expect(send({kind:'start'})).toBeNull()
 const cs=['host','a','b']
 const live=(i=0)=>room.snapshot(cs[i])!.game!.piggyBank!
 const first=live().actor!,to=(first+1)%3,other=(first+2)%3
 const dispatch=(action:Extract<Command,{kind:'piggy-bank'}>['action'],i:number)=>send({kind:'piggy-bank',step:live().step,match:room.match,action},cs[i])
 expect(dispatch({kind:'pass-bank',black:1,white:3,to},to)).not.toBeNull()
 expect(dispatch({kind:'pass-bank',black:1,white:3,to},first)).toBeNull()
 expect(dispatch({kind:'claim',count:2},to)).toBeNull()
 const before=live(other)
 expect(dispatch({kind:'accept'},first)).toBeNull()
 expect(live(other)).toEqual(before)
 expect(dispatch({kind:'reset'},first)).toBeNull()
 expect(live(other).resetCount).toBe(1)
 expect(live(other).resetUsed).toBe(false)
 expect(live(other)).not.toHaveProperty('banks')
 expect(live(other)).not.toHaveProperty('resetVotes')
 expect(dispatch({kind:'doubt'},other)).toBeNull()
 expect(live(first).verdict).toMatchObject({kind:'doubt',bank:{black:2,white:4},correct:false})
})
