import {describe,expect,it} from 'vitest'
import {doubtBot,doubtRounds,doubtStart,doubtStep,doubtTick,doubtView,type DoubtAction,type DoubtState} from '../src/doubt-bet'
const deck=Array.from({length:60},(_,i)=>i)
const deals=Array.from({length:doubtRounds},()=>deck)
const seats=['ada','ben','cy']
const start=()=>doubtStart(seats,0,0,20000,deals)
const bid=(count:number,points=1,slots=0):DoubtAction=>({kind:'bid',color:'red',count,points,slots})
const play=(s:DoubtState,seat:string,action:DoubtAction,now=1)=>doubtStep(s,seat,action,now)!
const claim=(count=2,points=1,slots=0)=>play(start(),'ada',bid(count,points,slots))
describe('Doubt and Bet',()=>{
 it('deals five private cards per player and caps matches at ten real seats',()=>{
  const s=start()
  expect(doubtView(s,'ada').mine?.hand).toEqual(['red','red','red','red','red'])
  expect(doubtView(s,'cy').mine?.hand).toEqual(['yellow','yellow','yellow','yellow','yellow'])
  const guest=doubtView(s,'unknown')
  expect(guest.mine).toBeNull()
  expect(guest.table.map(r=>r.slots)).toEqual([5,5,5])
  expect(JSON.stringify(guest)).not.toMatch(/"hand"|"deals"|"seed"|"counted"/)
  expect(()=>doubtStart(Array.from({length:11},(_,i)=>String(i)),0,0,20000,deals)).toThrow()
 })
 it('accepts a change of color only with a strict count increase and entirely returns the old wager',()=>{
  const s=claim(2,0,1)
  expect(doubtStep(s,'cy',bid(5),1)).toBeNull()
  expect(doubtStep(s,'ben',bid(2),1)).toBeNull()
  expect(doubtStep(s,'ben',bid(16),1)).toBeNull()
  expect(doubtStep(s,'ben',bid(3,0,0),1)).toBeNull()
  const next=play(s,'ben',{kind:'bid',color:'yellow',count:3,points:2,slots:0})
  expect(doubtView(next).claim).toEqual({seat:'ben',color:'yellow',count:3})
  expect(doubtView(next).table).toEqual([{seat:'ada',slots:5,points:6,active:true},{seat:'ben',slots:5,points:6,active:true},{seat:'cy',slots:5,points:6,active:true}])
  expect(doubtView(next).wagers).toEqual([{seat:'ben',points:2,slots:0}])
  expect(doubtStep(next,'cy',{...bid(4),color:'wild'} as unknown as DoubtAction,20001)).toBeNull()
 })
 it('matches opposing stakes before revealing, counts wilds and equality, and pays only contested points',()=>{
  const mixed=[...deck.slice(0,9),50,...deck.slice(9,50),...deck.slice(51)]
  const state=doubtStart(seats,0,0,20000,Array.from({length:doubtRounds},()=>mixed))
  const claimed=play(state,'ada',bid(11,1,1))
  expect(doubtStep(claimed,'ben',{kind:'doubt',points:1,slots:0},1)).toBeNull()
  const over=play(claimed,'ben',{kind:'doubt',points:2,slots:0})
  const fresh=doubtView(over)
  expect(fresh.latest?.winner).toBe('ada')
  expect(fresh.latest?.counted).toBe(11)
  expect(fresh.latest?.cards?.flatMap(x=>x.hand).filter(x=>x==='wild')).toHaveLength(1)
  expect(fresh.table[0]).toMatchObject({points:8,slots:5})
  expect(fresh.table[1]).toMatchObject({points:4,slots:5})
 })
 it('allows counter-raises and never reveals hands to other seats when the bettor folds',()=>{
  let s=play(claim(8),'ben',{kind:'doubt',points:2,slots:0})
  expect(doubtView(s).turn).toBe('ada')
  expect(doubtStep(s,'cy',{kind:'counter',points:3,slots:0},1)).toBeNull()
  expect(doubtStep(s,'ada',{kind:'counter',points:0,slots:0},1)).toBeNull()
  s=play(s,'ada',{kind:'counter',points:2,slots:1})
  expect(doubtView(s).turn).toBe('ben')
  s=play(s,'ben',{kind:'fold'})
  const v=doubtView(s,'cy')
  expect(v.latest).toMatchObject({winner:'ada',loser:'ben',reason:'fold',counted:null,cards:null})
  expect(v.mine?.hand.every(c=>c==='yellow')).toBe(true)
  expect(JSON.stringify(v.latest)).not.toContain('"red","red"')
  expect(v.table[0]).toMatchObject({points:8,slots:5})
  expect(v.table[1]).toMatchObject({points:4,slots:5})
 })
 it('removes a losing slot only from the next deal and never takes the last slot',()=>{
  let s=play(claim(11,0,2),'ben',{kind:'doubt',points:2,slots:0})
  expect(doubtView(s).latest?.winner).toBe('ben')
  expect(doubtView(s,'ada').mine?.hand).toHaveLength(5)
  expect(doubtView(s).table[0]).toMatchObject({slots:3,points:6})
  s=play(s,'ada',{kind:'next'})
  expect(doubtView(s,'ada').mine?.hand).toHaveLength(3)
  expect(doubtStep(s,'ada',bid(3,0,3),2)).toBeNull()
  s=play(s,'ada',bid(11,0,2),2)
  s=play(s,'ben',{kind:'doubt',points:2,slots:0},2)
  s=play(s,'ada',{kind:'next'},3)
  expect(doubtView(s,'ada').mine?.hand).toHaveLength(1)
  expect(doubtStep(s,'ada',bid(3,0,1),4)).toBeNull()
 })
 it('runs all four rounds without input and settles timeout challenges without hidden data',()=>{
  let s=start(),time=0
  expect(doubtTick(s,100)).toBe(s)
  expect(doubtStep(s,'ada',bid(2),20000)).toBeNull()
  for(let i=0;i<60&&s.stage.phase!=='done';i++){
   time=s.stage.deadline!
   s=doubtTick(s,time)
  }
  expect(s.stage.phase).toBe('done')
  const v=doubtView(s)
  expect(v.round).toBe(doubtRounds)
  expect(v.table.reduce((t,row)=>t+row.points+row.slots,0)).toBe(seats.length*11)
  expect(v.leaders.length).toBeGreaterThan(0)
 })
 it.each(Array.from({length:9},(_,i)=>i+2))('plays three finite results with legal bots at %d seats without creating chips',count=>{
  const names=Array.from({length:count},(_,i)=>'seat-'+i)
  for(const [level,seed] of [['easy',11],['normal',32],['hard',738]] as const){
   let state=doubtStart(names,seed,0,20000)
   let now=0
   for(let i=0;i<128&&state.stage.phase!=='done';i++){
    const v=doubtView(state),turn=v.turn
    if(turn){
     const action=doubtBot(doubtView(state,turn),level,17)
     expect(action).not.toBeNull()
     state=play(state,turn,action!,++now)
    }else state=doubtTick(state,now=state.stage.deadline!)
    const table=doubtView(state).table
    expect(table.reduce((t,row)=>t+row.points+row.slots,0)).toBe(count*11)
    expect(table.every(r=>r.points>=0&&r.slots>=1&&r.slots<=5)).toBe(true)
   }
   expect(doubtView(state).phase).toBe('done')
  }
 })
})
