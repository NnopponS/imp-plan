import {expect,test} from 'vitest'
import {piggyApply,piggyBot,piggyCountMax,piggyRules,piggyStart,piggyTick,piggyView,type PiggyBank,type PiggyCommand} from '../src/piggy-bank'

const seats=['a','b','c','d']
const pass={kind:'pass-bank',black:2,white:1,to:1} as const
const go=(g:PiggyBank,who:string,action:PiggyCommand)=>piggyApply(g,who,action,g.opened+1)!
const advance=(g:PiggyBank)=>piggyTick(g,g.deadline!)

test('seat limits, deterministic draw and physical movement; no counts in projections',()=>{
 expect(()=>piggyStart(['x','x','x'],0,0)).toThrow()
 expect(()=>piggyStart(seats.slice(0,2),0,0)).toThrow()
 for(let n=3;n<=8;n++){
  const ids=Array.from({length:n},(_,i)=>String(i))
  const start=piggyStart(ids,7,0)
  expect(start).toEqual(piggyStart(ids,7,0))
  expect(start.banks).toHaveLength(n+1)
 }
 const start=piggyStart(seats,0,10)
 const claim=go(start,'a',pass)
 expect(claim.banks[0]).toEqual({id:1,black:3,white:2})
 expect(claim.bottom).toEqual([5,2,3,4])
 expect(claim.top).toBe(1)
 expect(piggyView(claim,'b')).toMatchObject({actor:1,phase:'claim',top:1,color:'black',lastPass:{black:2,white:1}})
 for(const seat of [...seats,'lurker']){
  const view=piggyView(claim,seat)
  expect(view).not.toHaveProperty('banks')
  expect(view).not.toHaveProperty('salt')
  expect(view.verdict).toBeNull()
 }
 expect(piggyView(claim).canReset).toBe(false)
 expect(start.banks[0]).toEqual({id:1,black:1,white:1})
})

test('rejects ownership, shape, stock and deadline violations; accepts are private and close the window',()=>{
 const g=piggyStart(seats,0,10)
 for(const bad of [{...pass,to:0},{...pass,to:4},{...pass,black:6},{...pass,white:-1},{...pass,black:0,white:0},{...pass,black:1.2}]){
  expect(go(g,'a',bad)).toBeNull()
 }
 expect(go(g,'b',pass)).toBeNull()
 expect(go(g,'x',pass)).toBeNull()
 expect(piggyApply(g,'a',pass,g.deadline!)).toBeNull()
 let state=go(g,'a',pass)
 expect(go(state,'b',{kind:'claim',count:piggyCountMax+1})).toBeNull()
 expect(go(state,'a',{kind:'claim',count:3})).toBeNull()
 state=go(state,'b',{kind:'claim',count:3})
 expect(go(state,'b',{kind:'doubt'})).toBeNull()
 const before=piggyView(state,'d')
 state=go(state,'a',{kind:'accept'})
 expect(piggyView(state,'d')).toEqual(before)
 expect(piggyView(state,'a').canDoubt).toBe(false)
 expect(go(state,'a',{kind:'doubt'})).toBeNull()
 state=go(go(state,'c',{kind:'accept'}),'d',{kind:'accept'})
 expect(piggyView(state)).toMatchObject({phase:'deposit',actor:1,color:'white',scores:[0,0,0,0],verdict:null})
})

test('first doubt gives the right scoring, reveals one bank, and restarts at the point loser',()=>{
 for(const [claim,loser,scores] of [[2,1,[0,-1,1,0]],[3,2,[0,0,-1,0]]] as const){
  const g=piggyStart(seats,0,10)
  const review=go(go(go(g,'a',pass),'b',{kind:'claim',count:claim}),'c',{kind:'doubt'})
  expect(go(review,'d',{kind:'doubt'})).toBeNull()
  expect(piggyView(review,'b')).toMatchObject({scores,phase:'review',verdict:{kind:'doubt',bank:{id:1,black:3,white:2},correct:loser===1}})
  const fresh=advance(review)
  expect(piggyView(fresh)).toMatchObject({phase:'deposit',actor:loser,top:6,bankIds:[2,3,4,5,6],color:'white'})
  expect(fresh.banks.at(-1)).toEqual({id:6,black:1,white:1})
  expect(new Set([...fresh.bottom,fresh.top]).size).toBe(5)
 }
})

test('reset quorum leaves one holder; correct and wrong sealed totals score once',()=>{
 for(const [allCorrect,score] of [[false,-2],[true,3]] as const){
  const g=piggyStart(seats,0,10)
  const claim=go(g,'a',pass)
  const vote=go(claim,'a',{kind:'reset'})
  expect(go(vote,'a',{kind:'reset'})).toBeNull()
  expect(piggyView(vote,'c')).not.toHaveProperty('resetVotes')
  expect(piggyView(vote,'a').resetUsed).toBe(true)
  const challenge=go(go(vote,'c',{kind:'reset'}),'b',{kind:'reset'})
  expect(piggyView(challenge,'b')).toMatchObject({phase:'challenge',actor:3})
  const counts=challenge.banks.map(({black,white})=>({black,white}))
  if(!allCorrect)counts[0].black++
  expect(go(challenge,'c',{kind:'challenge',counts})).toBeNull()
  expect(go(challenge,'d',{kind:'challenge',counts:counts.slice(1)})).toBeNull()
  const review=go(challenge,'d',{kind:'challenge',counts})
  expect(piggyView(review,'a')).toMatchObject({phase:'review',scores:[0,0,0,score],verdict:{kind:'challenge',correct:allCorrect}})
  expect(JSON.stringify(piggyView(review,'a'))).not.toContain('counts')
  expect(advance(review)).toMatchObject({stage:{kind:'deposit',actor:0},resets:1,resetVotes:[],nextBank:6})
 }
})

test('clock fallback, score goal, bounded exchanges, tie, and practice pacing',()=>{
 const original=piggyStart(seats,0,0)
 expect(piggyTick(original,original.deadline!-1)).toBe(original)
 const missed=advance(advance(original))
 expect(piggyView(missed)).toMatchObject({phase:'doubt',actor:1,claim:{count:null}})
 expect(piggyView(advance(missed))).toMatchObject({phase:'deposit',actor:1,color:'white'})
 let solved=original
 for(let i=0;i<5;i++){
  const stage=solved.stage
  if(stage.kind!=='deposit')throw Error('Expected deposit')
  const to=stage.actor===1?0:1
  solved=advance(go(go(go(solved,seats[stage.actor],{...pass,to}),seats[to],{kind:'claim',count:0}),'d',{kind:'doubt'}))
 }
 expect(piggyView(solved)).toMatchObject({phase:'done',reason:'goal',leaders:['d']})
 let state=original
 for(let i=0;i<piggyRules.exchanges;i++)state=advance(advance(advance(state)))
 expect(piggyView(state)).toMatchObject({phase:'done',reason:'limit',leaders:seats})
 const practice=piggyStart(seats,1,0,true)
 expect(practice).toMatchObject({stage:{actor:0},deadline:null})
 const passed=go(practice,'a',pass)
 expect(piggyBot(passed,'b','easy')).toEqual(piggyBot(passed,'b','easy'))
 expect(go(passed,'b',piggyBot(passed,'b','normal')!)).not.toBeNull()
})

test('minimum and maximum tables preserve shelf ownership and finish on a legal bot replay',()=>{
 for(const size of [piggyRules.min,piggyRules.max])for(const seed of [0,333,888]){
  const seats=Array.from({length:size},(_,i)=>'bot-'+i)
  let g=piggyStart(seats,seed,0)
  for(let n=0;n<200&&g.stage.kind!=='done';n++){
   expect([...g.bottom,g.top].sort((a,b)=>a!-b!)).toEqual(g.banks.map(b=>b.id))
   let next=g
   for(const seat of seats){
    const action=piggyBot(next,seat,'normal')
    if(!action)continue
    const applied=go(next,seat,action)
    expect(applied).not.toBeNull()
    if(action.kind==='pass-bank'){
     const total=(x:PiggyBank)=>x.banks.reduce((sum,b)=>sum+b.black+b.white,0)
     expect(total(applied)-total(next)).toBe(action.black+action.white)
    }
    next=applied
    if(next.step!==g.step)break
   }
   g=next===g?advance(g):next
  }
  expect(g.stage.kind).toBe('done')
  expect(g.exchange).toBeLessThanOrEqual(piggyRules.exchanges)
  expect(piggyView(g).leaders.length).toBeGreaterThan(0)
 }
})
