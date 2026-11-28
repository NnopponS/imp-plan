import {describe,expect,it} from 'vitest'
import {unknownStart,unknownAct,unknownView,unknownChoices,unknownTick,unknownBot,rollCube,type UnknownState} from '../src/unknown'
import {tutorials,move,start,timeout,view,playUnknown} from '../src/engine'
import {Host,seatRules,type Command} from '../src/room'

const now=1_500
const strict=()=>0
const fresh=(count=2)=>unknownStart(Array.from({length:count},(_,i)=>String(i)),17,now,20_000,strict)
const newInfo=(s:UnknownState,patch:Partial<UnknownState>)=>({...s,...patch})
const sets=(s:UnknownState,values: Record<number,UnknownState['board'][number]>)=>s.board.map((f,i)=>values[i]??f)
describe('Unknown fan cube race',()=>{
 it('integrates supported seats and prevents ordinary board action bypasses',()=>{
  expect(tutorials.unknown).toContain('cube')
  expect(seatRules({game:'unknown'})).toEqual({min:2,max:12})
  expect(()=>start('unknown',['solo'],5000,now)).toThrow('Invalid seats')
  expect(start('unknown',Array.from({length:12},(_,i)=>''+i),5000,now).unknown?.cubes).toHaveLength(12)
  const g=start('unknown',['a','b'],5000,now)
  expect(view(g,'b',now).unknown?.allowed).toEqual([])
  expect(playUnknown(g,'b','north',now)).toBeNull()
  expect(move(g,'a',0,now)).toBeNull()
  expect(timeout(g,now+5000).round).toBe(1)
 })
 it('physically rolls the same cube, with opposite movements undoing each other',()=>{
  const face=fresh().cubes[0].faces
  expect(rollCube(face,'east')[0]).toBe(face[5])
  expect(rollCube(rollCube(face,'east'),'west')).toEqual(face)
  expect(rollCube(rollCube(face,'north'),'south')).toEqual(face)
  expect(new Set(face).size).toBe(6)
 })
 it('deals distinct reachable starts and deterministic board for every allowed count',()=>{
  for(let n=2;n<=12;n++){
   const s=fresh(n)
   expect(s).toEqual(fresh(n))
   expect(new Set(s.cubes.map(c=>c.cell)).size).toBe(n)
   expect(s.cubes.every(c=>s.board[c.cell]==='start')).toBe(true)
   expect(s.cubes.slice(1).every(c=>unknownChoices(s,c.seat).length===0)).toBe(true)
   expect(unknownChoices(s,s.seats[0])).toContain('south')
  }
 })
 it('keeps unrevealed laws out of player and spectator views and shows observations only',()=>{
  const s=fresh()
  const different=unknownStart(s.seats,17,now,20_000,upper=>upper-1)
  expect(s.laws).not.toEqual(different.laws)
  expect(unknownView(s,'0')).toEqual(unknownView(different,'0'))
  expect(unknownView(s,'spectator').allowed).toEqual([])
  expect(unknownView(s,'0').revealed).toEqual([])
  const next=unknownAct(s,'0','south',now)!
  expect(next).not.toBeNull()
  expect(unknownView(next,'0').trace.at(-1)?.to).toBe(9)
  expect(unknownView(next,'0')).not.toHaveProperty('laws')
 })
 it('pressures a neighbor legally and does not push a chain',()=>{
  const s=fresh(3)
  const board=sets(s,{16:'red',17:'blue',18:'green'})
  const cubes=s.cubes.map((c,i)=>({...c,cell:[16,17,41][i]}))
  const unblocked=newInfo(s,{cubes,board})
  const next=unknownAct(unblocked,'0','east',now)!
  expect(next.trace.at(-1)).toMatchObject({pushed:{seat:'1',to:18}})
  const blocked=newInfo(s,{cubes:cubes.map((c,i)=>i===2?{...c,cell:18}:c),board})
  expect(unknownAct(blocked,'0','east',now)).toBeNull()
 })
 it('ending at the center outranks others and reveals the laws',()=>{
  const s=fresh()
  const ready=newInfo(s,{cubes:s.cubes.map((c,i)=>i===0?{...c,cell:23}:c)})
  const done=unknownAct(ready,'0','east',now)!
  expect(done.end).toBe('center')
  expect(done.winner).toBe('0')
  expect(unknownView(done,'1').revealed).toEqual(s.laws)
  expect(unknownAct(done,'1','north',now)).toBeNull()
 })
 it('legal bot play and clock advances terminate from all room sizes',()=>{
  for(let n=2;n<=12;n++){
   let s=fresh(n)
   for(let i=0;i<300&&!s.end;i++){
    const seat=s.seats[s.turn]
    const projection=unknownView(s,seat)
    const action=unknownBot(projection)
    expect(projection.allowed).toContain(action)
    s=i%3===0?unknownTick(s,s.deadline):unknownAct(s,seat,action,s.deadline-1)!
   }
   expect(s.end).not.toBeNull()
   expect(s.scores).toHaveLength(n)
   expect(s.scores.every(Number.isFinite)).toBe(true)
   expect(new Set(s.cubes.map(c=>c.cell)).size).toBe(n)
  }
 })
})

it('binds same-match roll commands to their active seat and advances a room to results',()=>{
 let clock=1500,req=0
 const host=new Host('Keeper',()=>clock,false)
 const send=(who:string,command:Command)=>host.command(who,'unknown-request-'+(++req),host.rev,command)
 expect(send('host',{kind:'config',settings:{...host.settings,game:'unknown'}})).toBeNull()
 expect(host.join('peer','Guest')).not.toBeNull()
 expect(send('peer',{kind:'ready'})).toBeNull()
 expect(send('host',{kind:'start'})).toBeNull()
 const snapshot=(who:string)=>host.snapshot(who)!.game!.unknown!
 expect(snapshot('host').revealed).toEqual([])
 expect(snapshot('peer').revealed).toEqual([])
 const c={kind:'unknown-roll' as const,match:host.match,step:0,action:'south' as const}
 expect(send('peer',c)).toMatch(/unavailable/)
 expect(send('host',{...c,match:'0'.repeat(32)})).toMatch(/closed/)
 expect(send('host',c)).toBeNull()
 expect(send('host',c)).toMatch(/closed/)
 expect(snapshot('peer').trace).toEqual(snapshot('host').trace)
 expect(snapshot('peer')).not.toHaveProperty('laws')
 for(let i=0;i<35&&!snapshot('host').end;i++){clock=snapshot('host').deadline;expect(host.tick()).toBe(true)}
 expect(snapshot('host').end).toBe('limit')
 expect(snapshot('peer').revealed).toHaveLength(3)
 expect(host.snapshot('peer')!.game!.done).toBe(true)
})

it('echoes only once, and then opens one seal after two full circuits',()=>{
 const s=fresh()
 const ready=newInfo(s,{
  cubes:s.cubes.map((c,i)=>i===0?{...c,cell:16}:c),
  board:sets(s,{15:'violet',16:'violet',17:'red',18:'green'}),
 })
 const echo=unknownAct(ready,'0','east',now)!
 expect(echo.turn).toBe(0)
 expect(echo.bonus).toBe(true)
 expect(echo.trace.at(-1)).toMatchObject({echo:true,exiled:false})
 const handover=unknownAct(echo,'0','east',now)!
 expect(handover.turn).toBe(1)
 expect(handover.bonus).toBe(false)
 const next=unknownTick(handover,handover.deadline)
 expect(unknownView(next,'0').revealed).toEqual([])
 const secondCircuit=unknownTick(next,next.deadline)
 const two=unknownTick(secondCircuit,secondCircuit.deadline)
 expect(unknownView(two,'0').revealed).toEqual(['whiteFace'])
})

it('reads relative cube faces before an exile, and shifts to an available non-ivory figure without duplicating faces',()=>{
 const s=fresh()
 const exile=newInfo(s,{
  cubes:s.cubes.map((c,i)=>i===0?{...c,cell:16,faces:['red','violet','gold','blue','green','white']}:c),
  board:sets(s,{17:'blue'}),
 })
 const ret=unknownAct(exile,'0','east',now)!
 expect(ret.cubes[0].cell).toBe(ret.cubes[0].home)
 expect(ret.cubes[0].faces[0]).toBe('white')
 expect(ret.trace.at(-1)).toMatchObject({exiled:true,echo:false,shifted:false})
 const shift=newInfo(s,{
  cubes:s.cubes.map((c,i)=>i===0?{...c,cell:16}:c),
  board:sets(s,{9:'gold',10:'gold',11:'gold',16:'gold',17:'gold',18:'gold',23:'gold',25:'gold'}),
 })
 const turn=unknownAct(shift,'0','east',now)!
 expect(turn.trace.at(-1)).toMatchObject({top:'violet',after:'gold',shifted:true,exiled:false})
 expect(new Set(turn.cubes[0].faces).size).toBe(6)
})

it('awards the center to a legally pushed rival rather than the mover',()=>{
 const s=fresh()
 const ready=newInfo(s,{cubes:s.cubes.map((c,i)=>({...c,cell:i===0?22:23}))})
 const next=unknownAct(ready,'0','east',now)!
 expect(next.winner).toBe('1')
 expect(next.cubes.map(c=>c.cell)).toEqual([23,24])
 expect(next.trace.at(-1)).toMatchObject({pushed:{seat:'1',stop:24,exiled:false}})
})
