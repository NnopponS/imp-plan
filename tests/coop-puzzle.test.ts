import {expect,test} from 'vitest'
import {footprint,fits,orient,relayFilled,relayLayout,relayStart,relayStep,relayTick,relayTime,relayTurn,type RelayAction} from '../src/coop-puzzle'
import {Host,decode,type Command} from '../src/room'
import {solveRelay} from './relay-solver'

test('all roster sizes generate connected 3–5-cell pieces and a verified exact rectangle',()=>{
 for(let n=1;n<=16;n++)for(let seed=0;seed<12;seed++){
  const {width,height,pieces,witness}=relayLayout(n,seed)
  expect(Math.min(width,height)).toBeGreaterThanOrEqual(6);expect(Math.max(width,height)).toBeLessThanOrEqual(10)
  expect(pieces.reduce((n,p)=>n+p.length,0)).toBe(width*height)
  for(const p of pieces){
   expect([3,4,5]).toContain(p.length)
   const reached=new Set([p[0].join()])
   for(const _ of p)for(const [x,y] of p)if([[x-1,y],[x+1,y],[x,y-1],[x,y+1]].some(c=>reached.has(c.join())))reached.add([x,y].join())
   expect(reached.size).toBe(p.length)
  }
  expect(new Set(witness.flatMap(f=>footprint({width,height,pieces,reflect:false},f))).size).toBe(width*height)
 }
 const p=relayStart(['a'],14,100)
 const solution=solveRelay(p.width,p.height,p.pieces)!
 expect(solution.length).toBe(p.pieces.length)
 let state=p
 for(const f of solution)state=relayStep(state,'a',{kind:'place',...f},125)!
 expect(state).toMatchObject({reason:'tiled',elapsed:25})
 expect(relayFilled(state)).toBe(p.width*p.height)
 expect(relayStep(state,'a',{kind:'undo',piece:0},126)).toBeNull()
 expect(JSON.stringify(p)).not.toMatch(/seed|witness|solution/)
})

test('rotations, optional mirror, out-of-bounds, overlaps, undo and turn cap',()=>{
 const base=relayStart(['a','b'],42,0)
 expect(orient([[0,0],[1,0],[2,0],[0,1]],1)).toEqual([[0,0],[1,0],[1,1],[1,2]])
 expect(orient([[0,0],[1,0],[2,0],[0,1]],4)).toEqual([[0,0],[1,0],[2,0],[2,1]])
 const fit=relayLayout(2,42).witness[0]
 expect(fits(base,{piece:0,orientation:4,anchor:0})).toBe(false)
 expect(fits({...base,reflect:true},{piece:0,orientation:4,anchor:0})).toBe(true)
 for(const invalid of [{...fit,piece:-1},{...fit,anchor:100},{...fit,orientation:-1},{...fit,anchor:35}])expect(fits(base,invalid)).toBe(false)
 let g=relayStep(base,'a',{kind:'place',...fit},1)!
 expect(fits(g,fit)).toBe(false)
 const overlapping={...g,pieces:[...g.pieces,g.pieces[0]],fits:[...g.fits,null]}
 expect(fits(overlapping,{...fit,piece:g.pieces.length})).toBe(false)
 for(let i=1;i<base.limit;i++)g=relayStep(g,i%2?'b':'a',i%2?{kind:'undo',piece:fit.piece}:{kind:'place',...fit},i+1)!
 expect(g).toMatchObject({reason:'turns',turns:26,elapsed:26})
 expect(relayFilled(g)).toBe(0)
})
test('host accepts one action per turn and a nonbinding suggestion from any seat',()=>{
 let n=0,now=1
 const h=new Host('Cutter',()=>now),tell=(who:string,cmd:Command,rev=h.rev)=>h.command(who,'r'+(++n),rev,cmd)
 expect(tell('host',{kind:'config',settings:{...h.settings,game:'coopPuzzle',coopReflect:true,capacity:2}})).toBeNull()
 expect(tell('host',{kind:'bot'})).not.toBeNull()
 const guest=h.join('g','Setter')!
 expect(tell('g',{kind:'ready'})).toBeNull();expect(tell('host',{kind:'start'})).toBeNull()
 const p=()=>h.snapshot('host')!.game!.coopPuzzle!,first={piece:0,orientation:0,anchor:0}
 const act=(who:string,action:RelayAction,turn=p().turns,match=h.match,rev=h.rev)=>tell(who,{kind:'relay',turn,match,action},rev)
 const rev=h.rev
 expect(act('g',{kind:'place',...first})).not.toBeNull()
 expect(act('g',{kind:'mark',...first})).toBeNull()
 expect(p().marks[guest.id]).toEqual(first);expect(relayFilled(p())).toBe(0);expect(p().turns).toBe(0)
 expect(act('host',{kind:'place',...first},0,h.match,rev)).toBeNull()
 expect(h.snapshot('g')!.game!.turn).toBe(guest.id)
 expect(p().marks).toEqual({});expect(relayFilled(p())).toBe(p().pieces[0].length)
 expect(act('g',{kind:'undo',piece:0},0)).not.toBeNull()
 expect(act('g',{kind:'undo',piece:0},1,'0'.repeat(32))).not.toBeNull()
 expect(act('g',{kind:'undo',piece:0})).toBeNull()
 now+=relayTurn;expect(act('host',{kind:'place',...first})).not.toBeNull()
 expect(h.tick()).toBe(true);expect(h.snapshot('g')!.game!.turn).toBe(guest.id)
 h.disconnect('g');now+=relayTurn;expect(h.tick()).toBe(true);expect(h.snapshot('host')!.game!.turn).toBe(h.owner)
 now=1+relayTime+2000;expect(h.tick()).toBe(true);expect(p()).toMatchObject({reason:'clock',elapsed:relayTime})
 expect(h.snapshot('host')!.seriesDone).toBe(true)
 const wire=(action:unknown)=>JSON.stringify({version:1,type:'command',epoch:h.epoch,match:h.match,seq:1,request:h.epoch,rev:h.rev,command:{kind:'relay',turn:0,match:h.match,action}})
 expect(decode(wire({kind:'place',...first}))).not.toBeNull()
 for(const bad of [{kind:'place',...first,seat:h.owner},{kind:'mark',...first,anchor:100},{kind:'undo',piece:-1}])expect(decode(wire(bad))).toBeNull()
})
test('global clock is not extended by early handoffs or delayed ticks',()=>{
 const p=relayStart(['a','b'],5,1234)
 const late=relayTick(p,p.ends+1_000_000);expect(late.reason).toBe('clock');expect(late.elapsed).toBe(relayTime)
 expect(relayTick(late,late.ends+100)).toBe(late)
 expect(relayStep(p,'a',{kind:'place',piece:0,anchor:0,orientation:0},p.deadline)).toBeNull()
})
