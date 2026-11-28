import {describe,expect,it} from 'vitest'
import {
 wallGo2Start,wallGo2Play,wallGo2View,wallGo2Score,wallGo2Bot,wallGo2Fallback,wallGo2Edges,
 wallGo2Draft,wallGo2Move,type WallGo2
} from '../src/wall-go2'

const edge=(a:number,b:number)=>wallGo2Edges.findIndex(([x,y])=>Math.min(a,b)===x&&Math.max(a,b)===y)
function table(seats:string[],drafts:number[]){
 return drafts.reduce((g,code)=>wallGo2Play(g,g.seats[g.turn],code)!,wallGo2Start(seats))
}
const square=(c:number)=>wallGo2Draft('square',c),round=(c:number)=>wallGo2Draft('round',c)
const duel=()=>table(['A','B'],[square(24),square(35),square(48),square(0)])
const triad=()=>table(['A','B','C'],[square(24),round(20),square(30),round(41),square(46),round(3)])

describe('Wall Go II',()=>{
 it('uses fixed round pieces in duels and a shape-selecting snake draft in triads',()=>{
  const two=wallGo2Start(['A','B'])
  expect(two.pieces.map(p=>p.cell)).toEqual([8,40,12,36])
  expect(wallGo2Play(two,'A',round(0))).toBeNull()
  expect(wallGo2Play(two,'A',square(8))).toBeNull()
  const a=wallGo2Play(two,'A',square(24))!
  const b=wallGo2Play(a,'B',square(10))!
  expect(b.seats[b.turn]).toBe('B')
  const three=wallGo2Start(['A','B','C'])
  expect(three.pieces).toEqual([])
  expect(triad().pieces.map(p=>p.side)).toEqual([0,1,2,2,1,0])
  expect(triad().pieces.filter(p=>p.side===0).map(p=>p.shape)).toEqual(['square','round'])
  expect(triad().turn).toBe(0)
  expect(()=>wallGo2Start(['A'])).toThrow()
 })
 it('requires a move, enforces shape rules, and requires a fresh arrival-side wall',()=>{
  const g=duel(),r=8,s=24
  expect(wallGo2Play(g,'A',wallGo2Move(s,25,26,edge(26,27)))).not.toBeNull()
  expect(wallGo2Play(g,'A',wallGo2Move(s,25,32,edge(32,33)))).toBeNull()
  expect(wallGo2Play(g,'A',wallGo2Move(r,9,10,edge(10,11)))).toBeNull()
  expect(wallGo2Play(g,'A',wallGo2Move(r,9,16,edge(16,17)))).not.toBeNull()
  expect(wallGo2Play(g,'A',wallGo2Move(s,null,s,edge(s,25)))).toBeNull()
  expect(wallGo2Play(g,'B',wallGo2Move(s,null,25,edge(25,26)))).toBeNull()
  expect(wallGo2Play(g,'A',wallGo2Move(s,null,25,edge(0,1)))).toBeNull()
  expect(wallGo2Play(g,'A',Infinity)).toBeNull()
 })
 it('rejects paths through other pieces, never breaks in a duel, and spends the triad breach once',()=>{
  const g=triad(),wall=edge(25,26),code=wallGo2Move(24,25,26,edge(26,27))
  const closed={...g,walls:[wall]}
  const next=wallGo2Play(closed,'A',code)!
  expect(next.walls).toEqual([edge(26,27)])
  expect(next.breaches).toEqual([false,true,true])
  expect(next.last).toMatchObject({breach:wall})
  expect(wallGo2Play({...closed,breaches:[false,true,true]},'A',code)).toBeNull()
  expect(wallGo2Play({...duel(),walls:[wall]},'A',code)).toBeNull()
  expect(wallGo2Play({...closed,walls:[edge(24,25),wall]},'A',code)).toBeNull()
  const occupied={...g,pieces:g.pieces.map(p=>p.cell===20?{...p,cell:25}:p)}
  expect(wallGo2Play(occupied,'A',code)).toBeNull()
 })
 it('counts exclusive rooms once, leaves vacant and shared spaces neutral, and exposes largest room',()=>{
  const walls=Array.from({length:7},(_,r)=>[edge(r*7+1,r*7+2),edge(r*7+3,r*7+4)]).flat()
  const pieces:WallGo2['pieces']=[{side:0,shape:'square',cell:0},{side:0,shape:'round',cell:7},{side:1,shape:'round',cell:4}]
  expect(wallGo2Score({...duel(),walls,pieces})).toMatchObject({totals:[14,21],largest:[14,21],shared:0,neutral:14})
  expect(wallGo2Score({...duel(),walls:[walls[0]],pieces})).toMatchObject({totals:[0,0],shared:1,neutral:49})
 })
 it('closes with separate rooms and resolves tied totals by the largest single room',()=>{
  const active=wallGo2Start(['A','B'])
  const borders=[0,1,3,4,5].flatMap(c=>Array.from({length:7},(_,r)=>edge(r*7+c,r*7+c+1)))
  const gap=edge(1,2)
  const g:WallGo2={...active,opening:4,pieces:[
   {side:0,shape:'square',cell:2},{side:0,shape:'round',cell:6},{side:1,shape:'square',cell:23}
  ],walls:borders.filter(w=>w!==gap)}
  const separated=wallGo2Play(g,'A',wallGo2Move(2,null,1,gap))!
  expect(wallGo2Score(separated)).toMatchObject({totals:[14,14],largest:[7,14]})
  expect(separated.result).toEqual({reason:'separated',winners:['B']})
 })
 it('keeps a diagonal legal through the other corner and does not spend an unnecessary breach on timeout',()=>{
  const g=triad(),breach=edge(3,4)
  const v=wallGo2View({...g,walls:[breach]},'A')
  const routes=v.legal.filter(c=>'from' in c&&c.from===3&&c.to===11)
  expect(routes).toEqual(expect.arrayContaining([
   expect.objectContaining({via:4,breach}),expect.objectContaining({via:10,breach:null}),
  ]))
  const code=wallGo2Fallback(v,7)
  expect(v.legal.find(c=>c.code===code)).toMatchObject({breach:null})
 })
 it('skips a blocked seat and closes a mixed room when no safe move remains',()=>{
  const opening=wallGo2Start(['A','B'])
  const mouths=new Set([edge(0,1),edge(1,2),edge(8,9)])
  const pieces:WallGo2['pieces']=[
   {side:0,shape:'square',cell:0},{side:1,shape:'round',cell:2},{side:0,shape:'square',cell:8}
  ]
  const g={...opening,opening:4,pieces,walls:wallGo2Edges.map((_,i)=>i).filter(i=>!mouths.has(i))}
  const first=wallGo2Play(g,'A',wallGo2Move(0,null,1,edge(0,1)))!
  expect(first.skipped).toEqual([1])
  expect(first.turn).toBe(0)
  expect(first.result).toBeNull()
  const last=wallGo2Play(first,'A',wallGo2Move(8,null,9,edge(8,9)))!
  expect(last.result).toEqual({reason:'blocked',winners:['A']})
  expect(wallGo2Score(last)).toMatchObject({totals:[1,0],shared:1,neutral:48})
 })
 it.each([2,3])('completes a legal %i-seat bot match and never publishes an observer action',count=>{
  let g=wallGo2Start(['A','B','C'].slice(0,count))
  for(let i=0;!g.result&&i<100;i++){
   const seat=g.seats[g.turn],v=wallGo2View(g,seat)
   expect(wallGo2View(g,'observer').legal).toEqual([])
   const action=wallGo2Bot(v,seat,15,'normal')??wallGo2Fallback(v,15)
   const updated=wallGo2Play(g,seat,action)
   expect(updated).not.toBeNull()
   g=updated!
  }
  expect(g.result).not.toBeNull()
  expect(g.result!.winners.length).toBeGreaterThan(0)
  const score=wallGo2Score(g)
  expect(score.totals.reduce((a,b)=>a+b,0)+score.neutral).toBe(49)
 })
})
