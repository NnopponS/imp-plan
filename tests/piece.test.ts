import {expect,test} from 'vitest'
import {move,start,timeout,view} from '../src/engine'
import {Host,defaults,humanOnly} from '../src/room'
import {packPiece,pieceClue,pieceHintCost,piecePass,pieceRemove,pieceSide,pieceStart,pieceStep,pieceFootprint,pieceResult,pieceTime,pieceView} from '../src/piece'
import {solvePiece} from './piece-solver'
test('seeded irregular piece partitions have exact covers, visible shapes but no answer',()=>{
 const silhouettes=new Set<string>()
 for(let seed=0;seed<64;seed++){
  const b=pieceStart(seed)
  expect(pieceStart(seed)).toEqual(b)
  expect(b.pieces.length).toBeGreaterThanOrEqual(6)
  expect(b.pieces.length).toBeLessThanOrEqual(12)
  for(const shape of b.pieces){
   const visited=new Set([shape[0]])
   for(const [x,y] of visited)for(const next of shape)if(Math.abs(x-next[0])+Math.abs(y-next[1])===1)visited.add(next)
   expect(visited.size).toBe(shape.length)
   expect(new Set(shape.map(c=>c[0])).size).toBeGreaterThan(1)
   expect(new Set(shape.map(c=>c[1])).size).toBeGreaterThan(1)
  }
  const projection=pieceView(b)
  expect(projection).not.toHaveProperty('solution')
  const fits=solvePiece(projection)!
  expect(fits).not.toBeNull()
  const covered=fits.flatMap((f,i)=>pieceFootprint(b,i,f.rotation,f.anchor))
  expect(new Set(covered).size).toBe(covered.length)
  expect(covered.sort((a,b)=>a-b)).toEqual(b.target.flatMap((inside,i)=>inside?[i]:[]))
  silhouettes.add(b.target.join())
 }
 expect(silhouettes.size).toBeGreaterThan(12)
})
test('validates clipping, silhouette boundaries, overlap, duplicates, and independent repositioning',()=>{
 const b=pieceStart(12)
 const f=b.solution[0]
 const a=packPiece(0,f.rotation,f.anchor)
 expect(pieceStep(b,packPiece(0,f.rotation,pieceSide*pieceSide-1))).toBeNull()
 expect(pieceStep(b,packPiece(0,f.rotation,0))).toBeNull() // all silhouettes omit a corner
 expect(pieceStep(b,5.8)).toBeNull()
 expect(pieceStep(b,100000)).toBeNull()
 const p=pieceStep(b,a)!
 expect(pieceStep(p,a)).toBeNull()
 const collisions=Array.from({length:pieceSide**2},(_,i)=>i).flatMap(anchor=>[0,1,2,3].map(rotation=>({anchor,rotation}))).filter(({anchor,rotation})=>{
  const c=pieceFootprint(b,1,rotation,anchor)
  return c.length>0&&c.every(i=>b.target[i])&&c.some(i=>pieceFootprint(b,0,f.rotation,f.anchor).includes(i))
 })
 expect(collisions.length).toBeGreaterThan(0)
 for(const {anchor,rotation} of collisions)expect(pieceStep(p,packPiece(1,rotation,anchor))).toBeNull()
 expect(pieceStep(p,pieceRemove(0))?.placements).toEqual(b.placements)
 expect(pieceStep(b,pieceRemove(0))).toBeNull()
 expect(b.placements.every(p=>p===null)).toBe(true)
})
test('solo and up to sixteen cooperative seats rotate, solve exactly, and track adjusted time',()=>{
 for(let n=1;n<=16;n++){
  const seats=Array.from({length:n},(_,i)=>String(i))
  let g=start('piece',seats,1,1000,{seed:n})
  expect(g.deadline).toBe(1000+pieceTime)
  expect(humanOnly('piece')).toBe(true)
  if(n>1)expect(move(g,'1',piecePass,1001)).toBeNull()
  g=move(g,'0',pieceClue,1010)!
  expect(g.deadline).toBe(1000+pieceTime-pieceHintCost)
  expect(g.turn).toBe(1%n)
  expect(view(g,seats[0]).piece?.hint?.kind).toBe('place')
  expect(move(g,seats[g.turn],pieceClue,1011)).toBeNull()
  const solution=solvePiece(view(g,seats[0]).piece!)!
  for(const [i,f] of solution.entries()){
   const player=seats[g.turn]
   g=move(g,player,packPiece(i,f.rotation,f.anchor),1200+i)!
  }
  expect(g.done).toBe(true)
  expect(g.winner).toBeNull()
  expect(view(g,seats[0]).piece?.score).toEqual({filled:g.piece!.target.filter(Boolean).length,total:g.piece!.target.filter(Boolean).length,adjustedMs:pieceHintCost+1200+solution.length-1-1000})
  expect(move(g,seats[g.turn],piecePass,1250)).toBeNull()
 }
})
test('a dead-end clue recommends clearing a misplaced piece; timeout keeps partial coverage',()=>{
 let g=start('piece',['a'],1,0,{seed:19})
 const b=g.piece!
 const f=b.solution[0]
 const choices=Array.from({length:pieceSide**2},(_,i)=>i).flatMap(anchor=>[0,1,2,3].map(r=>packPiece(0,r,anchor))).filter(a=>pieceStep(b,a))
 const alternate=choices.find(a=>pieceFootprint(pieceStep(b,a)!,0,pieceStep(b,a)!.placements[0]!.rotation,pieceStep(b,a)!.placements[0]!.anchor).join()!==pieceFootprint(b,0,f.rotation,f.anchor).join())!
 expect(alternate).toBeDefined()
 g=move(g,'a',alternate,10)!
 const occupied=pieceResult(g.piece!).filled
 expect(occupied).toBeGreaterThan(0)
 g=move(g,'a',pieceClue,pieceTime-pieceHintCost+1)!
 expect(g.done).toBe(true)
 expect(view(g,'a').piece?.hint).toEqual({kind:'remove',piece:0})
 expect(view(g,'a').piece?.score).toMatchObject({filled:occupied,adjustedMs:null})
 expect(move(g,'a',piecePass,pieceTime+1)).toBeNull()
 expect(timeout(start('piece',['a'],1,0),pieceTime).done).toBe(true)
})
test('room treats piece placements as revision-bound turns, not simultaneous bids',()=>{
 const host=new Host('Host',()=>1000,true)
 const snapshot=()=>host.snapshot('host')!
 expect(host.command('host','a',snapshot().rev,{kind:'config',settings:{...defaults,game:'piece'}})).toBeNull()
 expect(snapshot().seats).toHaveLength(1)
 expect(host.command('host','b',snapshot().rev,{kind:'start'})).toBeNull()
 const rev=snapshot().rev
 expect(host.command('host','c',rev,{kind:'move',action:piecePass})).toBeNull()
 expect(host.command('host','d',rev,{kind:'move',action:piecePass,round:snapshot().game!.round})).not.toBeNull()
})
test('a departing participant does not freeze the shared timer or block the remaining seats',()=>{
 const host=new Host('Host',()=>1000,false)
 const snap=()=>host.snapshot('host')!
 const guest=host.join('peer','Guest')!
 expect(host.command('host','config',snap().rev,{kind:'config',settings:{...defaults,game:'piece'}})).toBeNull()
 expect(host.command('peer','ready',snap().rev,{kind:'ready'})).toBeNull()
 expect(host.command('host','start',snap().rev,{kind:'start'})).toBeNull()
 expect(host.command('host','move',snap().rev,{kind:'move',action:piecePass})).toBeNull()
 expect(snap().game!.turn).toBe(guest.id)
 host.disconnect('peer')
 expect(host.tick()).toBe(true)
 expect(snap().game!.turn).toBe(snap().you)
 expect(snap().game!.deadline).toBe(1000+pieceTime)
})
