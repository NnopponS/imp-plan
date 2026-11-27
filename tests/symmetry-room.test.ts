import {expect,test} from 'vitest'
import {createElement} from 'react'
import {renderToStaticMarkup} from 'react-dom/server'
import {MatchRecord} from '../src/match-record'
import {Host,decode,seatRules,type Settings,type Command} from '../src/room'
import {packSymmetry,symmetryCanPlace,symmetryTime,type SymmetryView} from '../src/symmetry'

const symmetry=(config:Settings)=>({...config,game:'symmetry'} as Settings)
function firstPlacement(board:SymmetryView,id=0){
 for(let rotation=0;rotation<4;rotation++)for(let anchor=0;anchor<49;anchor++){
  if(symmetryCanPlace(board,id,{anchor,rotation}))return packSymmetry(id,rotation,anchor)
 }
 throw Error('Expected a legal tile')
}
const move=(action:number):Command=>({kind:'move',round:1,action})
test('solo start is bot-free, has a fixed four-minute window, and supports a fresh rematch',()=>{
 let now=1200
 const host=new Host('Player',()=>now,true)
 const send=(command:Command)=>host.command('host',crypto.randomUUID(),host.rev,command)
 expect(send({kind:'bot'})).toBeNull()
 expect(seatRules(symmetry(host.settings),true)).toMatchObject({min:1,max:1})
 expect(send({kind:'config',settings:symmetry(host.settings)})).toBeNull()
 expect(host.snapshot('host')?.seats).toHaveLength(1)
 expect(host.snapshot('host')?.settings.seconds).toBe(240)
 expect(send({kind:'start'})).toBeNull()
 const live=host.snapshot('host')!, mine=live.game!.symmetry!.board!
 expect(live.game!.deadline).toBe(now+symmetryTime)
 expect(mine.placements.every(v=>v===null)).toBe(true)
 expect(send(move(firstPlacement(mine)))).toBeNull()
 expect(host.snapshot('host')?.game?.symmetry?.board?.score.placed).toBe(1)
 now+=symmetryTime
 expect(send(move(firstPlacement(mine,1)))).not.toBeNull()
 expect(host.tick()).toBe(true)
 expect(host.snapshot('host')?.game?.symmetry).toMatchObject({submitted:1,results:[{seat:host.owner,score:{solved:false,placed:1}}]})
 expect(send({kind:'next'})).toBeNull()
 const rematch=host.snapshot('host')!
 expect(rematch.match).not.toBe(live.match)
 expect(rematch.game!.symmetry?.board?.score.placed).toBe(0)
})
test('same seeded trays are private; concurrent play and exact elapsed ranking are host-authoritative',()=>{
 let now=5000
 const host=new Host('Host',()=>now)
 const send=(from:string,command:Command,rev=host.rev)=>host.command(from,crypto.randomUUID(),rev,command)
 const config={...symmetry(host.settings),capacity:16,symmetryAxis:'diagonal' as const}
 expect(send('host',{kind:'config',settings:config})).toBeNull()
 const guest=host.join('guest','Guest')!
 expect(send('guest',{kind:'ready'})).toBeNull()
 expect(send('host',{kind:'start'})).toBeNull()
 const a=host.snapshot('host')!, b=host.snapshot('guest')!
 expect(b.game!.symmetry).toEqual(a.game!.symmetry)
 expect(a.game!.symmetry!.board!.axis).toBe('diagonal')
 expect(JSON.stringify(a.game)).not.toContain('"solution"')
 expect(a.game!.symmetry?.results).toBeNull()
 const proof=host.game!.symmetry![host.owner].solution
 const other=host.game!.symmetry![guest.id].solution
 const [first]=proof
 expect(send('host',move(packSymmetry(0,first.rotation,first.anchor)),a.rev)).toBeNull()
 expect(host.snapshot('guest')!.game!.symmetry!.board!.placements.every(p=>p===null)).toBe(true)
 expect(host.snapshot('guest')!.game!.scores).toEqual([0,0])
 expect(send('guest',move(packSymmetry(0,first.rotation,first.anchor)),b.rev)).toBeNull()
 expect(send('host',move(packSymmetry(0,first.rotation,first.anchor)))).not.toBeNull()
 expect(send('host',move(NaN))).not.toBeNull()
 now+=701
 for(const [i,fit] of proof.entries())if(i>0)expect(send('host',move(packSymmetry(i,fit.rotation,fit.anchor)))).toBeNull()
 expect(host.snapshot('host')?.game?.done).toBe(false)
 expect(host.snapshot('guest')?.game?.symmetry?.results).toBeNull()
 now+=121
 for(const [i,fit] of other.entries())if(i>0)expect(send('guest',move(packSymmetry(i,fit.rotation,fit.anchor)))).toBeNull()
 const final=host.snapshot('guest')!.game!
 expect(final.done).toBe(true)
 expect(final.winner).toBe(host.owner)
 expect(final.symmetry?.results?.map(r=>[r.seat,r.score.elapsedMs])).toEqual([[host.owner,701],[guest.id,822]])
 expect(JSON.stringify(final)).not.toContain('"solution"')
 const standings=renderToStaticMarkup(createElement(MatchRecord,{
  snap:host.snapshot('guest')!,name:id=>id===guest.id?'Guest':'Host',active:true,onExport:()=>{}
 }))
 expect(standings).toContain('0.701 s')
 expect(standings).toContain('0.822 s')
})
test('a sixteen-seat lobby validates the game setting and completes at the deadline after a disconnect',()=>{
 let now=50
 const host=new Host('Host',()=>now)
 const config={...symmetry(host.settings),capacity:16}
 const envelope={version:1,type:'command',epoch:host.epoch,match:'',seq:1,request:host.epoch,rev:host.rev}
 expect(decode(JSON.stringify({...envelope,command:{kind:'config',settings:config}}))).not.toBeNull()
 expect(decode(JSON.stringify({...envelope,command:{kind:'config',settings:{...config,symmetryAxis:'off-board'}}}))).toBeNull()
 expect(host.command('host','config',host.rev,{kind:'config',settings:config})).toBeNull()
 for(let i=1;i<16;i++){
  expect(host.join('guest-'+i,'Player '+i)).not.toBeNull()
  expect(host.command('guest-'+i,'ready',host.rev,{kind:'ready'})).toBeNull()
 }
 expect(host.join('overflow','Overflow')).toBeNull()
 expect(host.command('host','start',host.rev,{kind:'start'})).toBeNull()
 host.disconnect('guest-6')
 now+=symmetryTime
 expect(host.tick()).toBe(true)
 expect(host.snapshot('host')?.game?.symmetry?.results).toHaveLength(16)
 expect(host.snapshot('host')?.game?.winner).toBeNull()
})
