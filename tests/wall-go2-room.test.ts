import {expect,test} from 'vitest'
import {move,start,timeout,view} from '../src/engine'
import {decode,Host,seatRules,type Command} from '../src/room'
import {wallGo2Bot,wallGo2Draft,wallGo2Fallback,wallGo2Step} from '../src/wall-go2'

test('sets up native three-seat play, checks match and action slot, and exposes only committed state',()=>{
 const h=new Host('Ada',()=>0)
 const act=(conn:string,command:Command)=>h.command(conn,String(h.rev)+JSON.stringify(command),h.rev,command)
 expect(act('host',{kind:'config',settings:{...h.settings,game:'wallGo2',capacity:3}})).toBeNull()
 expect(seatRules(h.settings)).toEqual({min:2,max:3})
 const bee=h.join('bee','Bee')!.id
 const cee=h.join('cee','Cee')!.id
 expect(h.join('dee','Dee')).toBeNull()
 expect(act('bee',{kind:'ready'})).toBeNull()
 expect(act('cee',{kind:'ready'})).toBeNull()
 expect(act('host',{kind:'start'})).toBeNull()
 const snap=h.snapshot('host')!
 expect(snap.count).toBe(1)
 expect(snap.game?.seats).toEqual([h.owner,bee,cee])
 expect(snap.game?.deadline).toBe(90000)
 expect(h.snapshot('bee')?.game?.wallGo2?.legal).toHaveLength(0)
 expect(h.snapshot('cee')?.game?.wallGo2?.pieces).toHaveLength(0)
 const cmd={kind:'wall-go2',match:snap.match,step:0,action:wallGo2Draft('square',0)} as const
 const packet={version:1,type:'command',epoch:h.epoch,match:h.match,seq:1,request:h.epoch,rev:h.rev,command:cmd}
 expect(decode(JSON.stringify(packet))).toEqual(packet)
 expect(decode(JSON.stringify({...packet,command:{...cmd,action:1e8}}))).toBeNull()
 expect(act('bee',cmd)).toContain('not available')
 expect(act('host',{...cmd,match:'0'.repeat(32)})).toContain('has ended')
 expect(act('host',{kind:'move',action:cmd.action})).toContain('Use the Wall Go II action')
 expect(act('host',cmd)).toBeNull()
 expect(act('bee',cmd)).toContain('has ended')
 expect(h.snapshot('cee')?.game?.wallGo2?.pieces).toEqual([{cell:0,side:0,shape:'square'}])
 for(let i=0;i<100&&!h.game?.done;i++){
  const g=h.game!, w=g.wallGo2!, seat=g.seats[g.turn], conn=seat===bee?'bee':seat===cee?'cee':'host'
  const action=wallGo2Bot(h.snapshot(conn)!.game!.wallGo2!,seat,18,'hard')
  expect(action).toBeDefined()
  expect(act(conn,{kind:'wall-go2',match:snap.match,step:wallGo2Step(w),action:action!})).toBeNull()
 }
 expect(h.game?.done).toBe(true)
 const final=h.snapshot('host')?.game
 expect(h.snapshot('bee')?.game?.wallGo2?.result).toEqual(final?.wallGo2?.result)
 expect(h.snapshot('cee')?.game?.scores).toEqual(final?.wallGo2?.score.totals)
 expect(final?.deadline).toBeNull()
})

test('timeout spends one legal action and a disconnected seat cannot stall the clock',()=>{
 const g=start('wallGo2',['A','B'],90000,1200)
 const expected=wallGo2Fallback(view(g,'A').wallGo2!,g.seed)!
 expect(move(g,'A',expected,91200)).toBeNull()
 expect(timeout(g,91199)).toBe(g)
 const next=timeout(g,91200)
 expect(next.publicMoves).toEqual([expected])
 expect(next.wallGo2?.opening).toBe(1)
 expect(next.deadline).toBe(181200)

 let now=0
 const host=new Host('A',()=>now)
 const command=(who:string,action:Command)=>host.command(who,String(host.rev)+JSON.stringify(action),host.rev,action)
 expect(command('host',{kind:'config',settings:{...host.settings,game:'wallGo2'}})).toBeNull()
 expect(host.join('guest','B')).not.toBeNull()
 expect(command('guest',{kind:'ready'})).toBeNull()
 expect(command('host',{kind:'start'})).toBeNull()
 expect(command('host',{kind:'wall-go2',match:host.match,step:0,action:wallGo2Draft('square',0)})).toBeNull()
 host.disconnect('guest')
 now=90000
 expect(host.tick()).toBe(true)
 expect(host.snapshot('host')?.game?.wallGo2?.opening).toBe(2)
})

test('solo fills a bot and leaves an optional third seat for practice',()=>{
 const h=new Host('Ada',()=>0,true)
 const send=(command:Command)=>h.command('host',String(h.rev),h.rev,command)
 expect(send({kind:'config',settings:{...h.settings,game:'wallGo2'}})).toBeNull()
 expect(h.snapshot('host')?.seats.filter(s=>s.bot)).toHaveLength(1)
 expect(send({kind:'bot'})).toBeNull()
 expect(h.snapshot('host')?.seats.filter(s=>s.bot)).toHaveLength(2)
 expect(send({kind:'start'})).toBeNull()
 expect(h.game?.wallGo2?.breaches).toEqual([true,true,true])
})
