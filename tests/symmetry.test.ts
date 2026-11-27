import {describe,expect,it} from 'vitest'
import {
 compareSymmetryScores,packSymmetry,symmetryAxes,symmetryCanPlace,symmetryFootprint,symmetryOccupancy,symmetryRemove,symmetryRotation,symmetrySide,
 symmetryStart,symmetryStep,symmetryTime,symmetryTimeout,symmetryView,type SymmetryAxis,type SymmetryBoard,type SymmetryFit,
} from '../src/symmetry'

const side=symmetrySide,start=123000
// Independent geometry: no engine rotation, footprint, occupancy, symmetry or connectivity routines.
const point=(i:number)=>[i%side,Math.trunc(i/side)] as const
const reflect=(i:number,axis:SymmetryAxis)=>{
 const [x,y]=point(i)
 return axis==='vertical'?y*side+(side-1-x):axis==='horizontal'?(side-1-y)*side+x:x*side+y
}
const cellsFor=(piece:readonly (readonly [number,number])[],fit:SymmetryFit)=>{
 const angle=fit.rotation*Math.PI/2,c=Math.round(Math.cos(angle)),s=Math.round(Math.sin(angle))
 const rot=piece.map(([x,y])=>[x*c-y*s,x*s+y*c] as const)
 const [a,b]=point(fit.anchor),minX=Math.min(...rot.map(([x])=>x)),minY=Math.min(...rot.map(([,y])=>y))
 return rot.map(([x,y])=>[a+x-minX,b+y-minY] as const)
}
const connected=(cells:Set<number>)=>{
 if(cells.size===0)return false
 const unseen=new Set(cells),queue=[...cells].slice(0,1)
 for(const at of queue){
  if(!unseen.delete(at))continue
  const [x,y]=point(at)
  for(const candidate of unseen){
   const [otherX,otherY]=point(candidate)
   if(Math.abs(x-otherX)+Math.abs(y-otherY)===1)queue.push(candidate)
  }
 }
 return unseen.size===0
}
const applyFits=(board:SymmetryBoard,fits:readonly SymmetryFit[],now=start+1000)=>{
 for(const [id,p] of fits.entries()){
  const next=symmetryStep(board,packSymmetry(id,p.rotation,p.anchor),now)
  expect(next).not.toBeNull()
  board=next!
 }
 return board
}

describe('S3-21 Symmetrical Puzzle fan variant',()=>{
 it('deterministically builds an independently valid witness for each axis, not just one fixed tray',()=>{
  const unique=new Set<string>()
  const pieceCounts=new Set<number>()
  for(const axis of symmetryAxes)for(let seed=-15;seed<105;seed++){
   const board=symmetryStart(seed,start,axis)
   expect(board).toEqual(symmetryStart(seed,start,axis))
   expect(board.axis).toBe(axis)
   expect(board.deadline).toBe(start+240000)
   expect(board.pieces.length).toBeGreaterThanOrEqual(6)
   expect(board.pieces.length).toBeLessThanOrEqual(10)
   expect(board.solution).toHaveLength(board.pieces.length)
   expect(board.placements).toEqual(board.pieces.map(()=>null))
   const occupied=new Set<number>()
   for(const [id,piece] of board.pieces.entries()){
    expect(piece.length).toBeGreaterThanOrEqual(2)
    expect(piece.length).toBeLessThanOrEqual(7)
    const cells=cellsFor(piece,board.solution[id])
    expect(cells.every(([x,y])=>x>=0&&x<side&&y>=0&&y<side)).toBe(true)
    const positions=cells.map(([x,y])=>y*side+x)
    expect(connected(new Set(positions))).toBe(true)
    for(const cell of positions){
     expect(occupied.has(cell)).toBe(false)
     occupied.add(cell)
    }
   }
   expect(connected(occupied)).toBe(true)
   expect([...occupied].every(cell=>occupied.has(reflect(cell,axis)))).toBe(true)
   expect(occupied.size).toBeGreaterThan(20)
   expect(occupied.size).toBeLessThan(37)
   unique.add(JSON.stringify(board.pieces))
   pieceCounts.add(board.pieces.length)
  }
  expect(unique.size).toBeGreaterThan(300)
  expect(pieceCounts).toEqual(new Set([6,7,8,9,10]))
  expect(new Set(Array.from({length:70},(_,i)=>symmetryStart(i,start).axis))).toEqual(new Set(symmetryAxes))
 })
 it('keeps the generator witness and timestamps internal and copies visible nested fields',()=>{
  const board=symmetryStart(29,start,'horizontal')
  const view=symmetryView(board)
  expect(Object.keys(view).sort()).toEqual(['axis','deadline','finished','pieces','placements','score'])
  expect(view.pieces).toEqual(board.pieces)
  expect(view.pieces).not.toBe(board.pieces)
  expect(view.pieces[0]).not.toBe(board.pieces[0])
  expect(view.pieces[0][0]).not.toBe(board.pieces[0][0])
  expect(view.placements).not.toBe(board.placements)
  expect(view.score).toEqual({solved:false,elapsedMs:null,placed:0,partial:0,connected:false,mirrored:false})
 })
 it('rotates around the bounding box and does not wrap at the right or bottom edge',()=>{
  const shape=[[0,0],[0,1],[1,1]] as const
  const layout={pieces:[shape.map(c=>c)]}
  expect(symmetryRotation(shape,1)).toEqual([[0,0],[1,0],[0,1]])
  expect(symmetryRotation(shape,2)).toEqual([[0,0],[1,0],[1,1]])
  expect(symmetryRotation(shape,3)).toEqual([[1,0],[0,1],[1,1]])
  expect(symmetryFootprint(layout,0,1,6)).toEqual([])
  expect(symmetryFootprint(layout,0,1,42)).toEqual([])
  expect(symmetryFootprint(layout,0,1,0)).toEqual([0,1,7])
  expect(symmetryFootprint(layout,0,9,0)).toEqual([])
  expect(symmetryFootprint(layout,0,0,.5)).toEqual([])
 })
 it('rejects overlaps, replay, malformed opcodes and removal of a missing piece without changing state',()=>{
  let board=symmetryStart(0,start)
  const fit:SymmetryFit={anchor:0,rotation:0}
  expect(symmetryCanPlace(board,0,fit)).toBe(true)
  const before=symmetryView(board)
  board=symmetryStep(board,packSymmetry(0,0,0),start+10)!
  expect(before.placements[0]).toBeNull()
  expect(symmetryOccupancy(board).includes(0)).toBe(true)
  expect(symmetryCanPlace(board,1,fit)).toBe(false)
  for(const code of [packSymmetry(1,0,0),packSymmetry(0,0,0),packSymmetry(0,4,0),packSymmetry(0,0,49),symmetryRemove(1),NaN,Infinity,1.5,0,-1,2000,Number.MAX_SAFE_INTEGER]){
   expect(symmetryStep(board,code,start+11)).toBeNull()
  }
  const moved=symmetryStep(board,packSymmetry(0,0,1),start+12)!
  expect(moved.placements[0]).toEqual({anchor:1,rotation:0})
  expect(symmetryOccupancy(moved).includes(0)).toBe(true)
  const removed=symmetryStep(moved,symmetryRemove(0),start+13)!
  expect(removed.placements[0]).toBeNull()
  expect(symmetryOccupancy(removed)).toEqual(Array(side**2).fill(-1))
 })
 it('accepts an alternate connected symmetric union rather than requiring the generator witness',()=>{
  const board=symmetryStart(17,start,'diagonal')
  const alternate=board.solution.map((fit,i)=>{
   const after=cellsFor(board.pieces[i],fit).map(([x,y])=>[side-1-x,side-1-y] as const)
   const x=Math.min(...after.map(([x])=>x)),y=Math.min(...after.map(([,y])=>y))
   return {anchor:y*side+x,rotation:(fit.rotation+2)%4}
  })
  expect(alternate).not.toEqual(board.solution)
  const solved=applyFits(board,alternate,start+2143)
  expect(symmetryView(solved)).toMatchObject({finished:true,score:{solved:true,elapsedMs:2143,placed:board.pieces.length,partial:board.pieces.length,mirrored:true,connected:true}})
  expect(symmetryStep(solved,symmetryRemove(0),start+2200)).toBeNull()
  expect(symmetryTimeout(solved,board.deadline)).toBe(solved)
 })
 it('awards no partial credit for a disconnected or asymmetric union, even if all pieces are placed',()=>{
  const original=symmetryStart(0,start,'vertical')
  const pieces=Array.from({length:6},()=>[[0,0],[1,0]] as const).map(p=>[...p])
  const board:SymmetryBoard={...original,pieces,placements:pieces.map(()=>null)}
  // All six vertical dominoes fit and reflect, but the two islands touch only their own kind.
  const areas=[0,6,7*2,7*2+6,7*4,7*4+6].map(anchor=>({anchor,rotation:1}))
  const disconnected=applyFits(board,areas)
  expect(symmetryView(disconnected)).toMatchObject({finished:false,score:{placed:6,solved:false,partial:0,connected:false,mirrored:true}})
  const asymmetric=applyFits(board,[0,2,4,7,9,11].map(anchor=>({anchor,rotation:0})))
  expect(symmetryView(asymmetric)).toMatchObject({finished:false,score:{placed:6,solved:false,partial:0,connected:true,mirrored:false}})
  const partial=applyFits(board,[{anchor:3,rotation:1}])
  expect(symmetryView(partial)).toMatchObject({score:{placed:1,solved:false,partial:1,connected:true,mirrored:true}})
 })
 it('enforces a strict host deadline and ranks complete finishes and partials consistently',()=>{
  const board=symmetryStart(4,start,'vertical')
  const cutoff=board.deadline
  const a=packSymmetry(0,board.solution[0].rotation,board.solution[0].anchor)
  expect(symmetryStep(board,a,start-1)).toBeNull()
  expect(symmetryStep(board,a,NaN)).toBeNull()
  expect(symmetryStep(board,a,cutoff)).toBeNull()
  expect(symmetryStep(board,a,cutoff-1)).not.toBeNull()
  expect(symmetryTimeout(board,cutoff-1)).toBe(board)
  expect(symmetryTimeout(board,NaN)).toBe(board)
  const frozen=symmetryTimeout(board,cutoff)
  const zero=symmetryView(frozen).score
  expect(frozen.finished).toBe(true)
  expect(zero.elapsedMs).toBeNull()
  expect(symmetryStep(frozen,a,cutoff-1)).toBeNull()
  const fast=symmetryView(applyFits(board,board.solution,start+1000)).score
  const slow=symmetryView(applyFits(board,board.solution,start+1001)).score
  const partial={...zero,partial:2,placed:2,connected:true,mirrored:true}
  expect(compareSymmetryScores(fast,slow)).toBeLessThan(0)
  expect(compareSymmetryScores(slow,partial)).toBeLessThan(0)
  expect(compareSymmetryScores(partial,zero)).toBeLessThan(0)
  expect(compareSymmetryScores(fast,{...fast})).toBe(0)
  expect(compareSymmetryScores(zero,{...zero,placed:4})).toBe(0)
  expect(cutoff-start).toBe(symmetryTime)
 })
 it('cross-checks the constructive layouts against an independent exact-cover search',()=>{
  const bit=(n:number)=>1n<<BigInt(n)
  for(const [index,axis] of symmetryAxes.entries()){
   const board=symmetryStart(63+index,start,axis)
   // The generator's witness supplies only the proof silhouette, not a move or a search ordering.
   const shape=new Set(board.solution.flatMap((fit,i)=>cellsFor(board.pieces[i],fit).map(([x,y])=>y*side+x)))
   const target=[...shape].reduce((mask,n)=>mask|bit(n),0n)
   const byCell=Array.from({length:side**2},()=>[] as {id:number;mask:bigint}[])
   for(const [id,piece] of board.pieces.entries()){
    const footprints=new Set<bigint>()
    for(let rotation=0;rotation<4;rotation++)for(let anchor=0;anchor<side**2;anchor++){
     const positions=cellsFor(piece,{rotation,anchor})
     if(positions.some(([x,y])=>x<0||x>=side||y<0||y>=side||!shape.has(y*side+x)))continue
     const indices=positions.map(([x,y])=>y*side+x),mask=indices.reduce((m,n)=>m|bit(n),0n)
     if(footprints.has(mask))continue
     footprints.add(mask)
     for(const cell of indices)byCell[cell].push({id,mask})
    }
   }
   let visited=0
   function solve(open:bigint,unused:number):boolean{
    if(++visited>25_000)return false
    if(open===0n)return unused===0
    let choices:typeof byCell[number]|null=null
    for(const cell of shape){
     if(!(open&bit(cell)))continue
     const possible=byCell[cell].filter(({id,mask})=>(unused&(1<<id))&&(mask&open)===mask)
     if(!possible.length)return false
     if(!choices||possible.length<choices.length)choices=possible
    }
    return choices?.some(({id,mask})=>solve(open^mask,unused^(1<<id)))??false
   }
   expect(solve(target,(1<<board.pieces.length)-1)).toBe(true)
   expect(visited).toBeLessThan(25_000)
  }
 })
})
