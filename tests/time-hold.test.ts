import {describe,expect,it} from 'vitest'
import {timeHoldStart,timeHoldAdvance,timeHoldAction,timeHoldDisconnect,timeHoldView,timeHoldRules,type TimeHold} from '../src/time-hold'

const ms=1000
const start=()=>timeHoldStart(['A','B','C'],0)
const as=(s:TimeHold,seat:string,kind:'hold'|'pulse'|'release',at:number)=>timeHoldAction(s,seat,{kind,round:s.round},at)
const go=(s:TimeHold,seat:string,kind:'hold'|'pulse'|'release',at:number)=>{
 const next=as(s,seat,kind,at)
 if(!next)throw new Error(`rejected ${s.phase} r${s.round} ${seat} ${kind} at ${at}`)
 return next
}
const begin=(s:TimeHold,participants:string[])=>{
 for(const id of participants)s=go(s,id,'hold',s.bidAt-500)
 return timeHoldAdvance(s,s.bidAt)
}
const pulses=(s:TimeHold,participants:string[],from:number,to:number)=>{
 for(let t=from;t<=to;t+=ms)for(const id of participants)s=go(s,id,'pulse',s.bidAt+t)
 return s
}
const nextRound=(s:TimeHold)=>{
 expect(s.phase).toBe('review')
 return timeHoldAdvance(s,s.nextAt!)
}
describe('hold/release phase rules',()=>{
 it('begins with 19 rounds and 600 s, and grants a free opt-out until the 5s boundary',()=>{
  expect(timeHoldRules).toMatchObject({rounds:19,reserveTenths:6000,graceMs:5000,tenthMs:100})
  expect(()=>timeHoldStart(['A','A'],0)).toThrow()
  expect(()=>timeHoldStart(['A'],0)).toThrow()
  expect(()=>timeHoldStart(Array.from({length:17},(_,i)=>String(i)),0)).toThrow()
  let s=begin(start(),['A'])
  const t=s.bidAt
  expect(timeHoldView(s,'A',t).mine?.remainingTenths).toBe(6000)
  s=pulses(s,['A'],ms,4*ms)
  s=go(s,'A','release',t+4999)
  expect(s.phase).toBe('live')
  expect(as(s,'A','hold',t+4999)).toBeNull()
  s=timeHoldAdvance(s,t+5000)
  expect(timeHoldView(s,null,t+5000).last).toEqual({round:1,winner:null,elapsedTenths:0})
  s=begin(nextRound(s),['A'])
  expect(timeHoldView(s,'A',s.bidAt).mine?.remainingTenths).toBe(6000)
  s=pulses(s,['A'],ms,4*ms)
  s=go(s,'A','release',s.bidAt+5000)
  expect(timeHoldView(s,null,s.bidAt+5000).last).toEqual({round:2,winner:'A',elapsedTenths:50})
 })
 it('charges every bidder; only unique highest earns a token, at 0.1s display resolution',()=>{
  let s=pulses(begin(start(),['A','B']),['A','B'],ms,6*ms)
  s=go(s,'A','release',s.bidAt+6049)
  s=go(s,'B','release',s.bidAt+6050)
  expect(timeHoldView(s,null,s.bidAt+6050).last).toEqual({round:1,winner:'B',elapsedTenths:61})
  expect(timeHoldView(s,null,s.bidAt+6050).tokens).toEqual([{seat:'A',tokens:0},{seat:'B',tokens:1},{seat:'C',tokens:0}])
  s=begin(nextRound(s),['A','B'])
  expect(timeHoldView(s,'A',s.bidAt).mine?.remainingTenths).toBe(5940)
  expect(timeHoldView(s,'B',s.bidAt).mine?.remainingTenths).toBe(5939)
  s=pulses(s,['A','B'],ms,5*ms)
  s=go(s,'A','release',s.bidAt+5010)
  s=go(s,'B','release',s.bidAt+5040)
  expect(timeHoldView(s,null,s.bidAt+5040).last).toEqual({round:2,winner:null,elapsedTenths:50})
  expect(timeHoldView(s,null,s.bidAt+5040).tokens.map(c=>c.tokens)).toEqual([0,1,0])
 })
 it('never exposes other activity, balances or bids before or after review',()=>{
  const a=start(), arm=a.bidAt-500
  let b=go(a,'B','hold',arm)
  expect(timeHoldView(a,'C',arm)).toEqual(timeHoldView(b,'C',arm))
  expect(timeHoldView(a,null,arm)).toEqual(timeHoldView(b,null,arm))
  b=begin(b,['A','C'])
  b=pulses(b,['A','B','C'],ms,5*ms)
  const before=timeHoldView(b,'C',b.bidAt+5100)
  b=go(b,'A','release',b.bidAt+5100)
  expect(timeHoldView(b,'C',b.bidAt+5100)).toEqual(before)
  b=go(b,'B','release',b.bidAt+5600)
  b=go(b,'C','release',b.bidAt+5800)
  const result=timeHoldView(b,null,b.bidAt+5800)
  expect(result.last).toEqual({round:1,winner:'C',elapsedTenths:58})
  expect(result.history).toEqual([{round:1,winner:'C',elapsedTenths:58}])
  expect(result.mine).toBeNull()
  expect(timeHoldView(b,'B',b.bidAt+5800).mine?.remainingTenths).toBeNull()
  const serialized=JSON.stringify(result)
  for(const term of ['balance','reserve','spent','players','bidTenths','leaseUntil','51','56'])expect(serialized).not.toContain(term)
 })
})
describe('bounded failure and game completion',()=>{
 it('charges a disconnected or expired post-grace hold but never awards that seat a token',()=>{
  let s=pulses(begin(start(),['A','B','C']),['A','B','C'],ms,5*ms)
  const t=s.bidAt
  s=go(s,'A','release',t+5200)
  s=timeHoldDisconnect(s,'B',t+6050)
  expect(as(s,'B','pulse',t+6100)).toBeNull()
  s=timeHoldAdvance(s,t+5*ms+timeHoldRules.leaseMs)
  expect(timeHoldView(s,null,t+8500).last).toEqual({round:1,winner:'A',elapsedTenths:52})
  s=begin(nextRound(s),['A','B','C'])
  expect(timeHoldView(s,'A',s.bidAt).mine?.remainingTenths).toBe(5948)
  expect(timeHoldView(s,'B',s.bidAt).mine?.remainingTenths).toBe(5939)
  expect(timeHoldView(s,'C',s.bidAt).mine?.remainingTenths).toBe(5915)
 })
 it('times out a dead gesture before grace for free and rejects stale round commands',()=>{
  let s=begin(start(),['A'])
  s=timeHoldAdvance(s,s.bidAt+timeHoldRules.graceMs)
  expect(timeHoldView(s,null,s.bidAt+5000).last?.winner).toBeNull()
  s=nextRound(s)
  expect(timeHoldAction(s,'A',{kind:'hold',round:1},s.bidAt-500)).toBeNull()
  expect(as(s,'ghost','hold',s.bidAt-500)).toBeNull()
  s=begin(s,['A'])
  expect(timeHoldView(s,'A',s.bidAt).mine?.remainingTenths).toBe(6000)
  expect(as(s,'A','pulse',NaN)).toBeNull()
 })
 it('naturally locks and charges all reserve at exhaustion, allowing the exhausted bid to win',()=>{
  let s=begin(start(),['A'])
  s=pulses(s,['A'],ms,599*ms)
  s=timeHoldAdvance(s,s.bidAt+600*ms)
  expect(timeHoldView(s,null,s.bidAt+600*ms).last).toEqual({round:1,winner:'A',elapsedTenths:6000})
  s=nextRound(s)
  expect(as(s,'A','hold',s.bidAt-500)).toBeNull()
 })
 it('ends after 19 rounds; equal tokens use remaining time and exact ties share rank',()=>{
  function finish(secondTime:number){
   let s=begin(start(),['A'])
   s=pulses(s,['A'],ms,6*ms)
   s=go(s,'A','release',s.bidAt+6000)
   s=begin(nextRound(s),['B'])
   s=pulses(s,['B'],ms,Math.floor(secondTime/ms)*ms)
   s=go(s,'B','release',s.bidAt+secondTime)
   for(let round=3;round<=19;round++){
    s=nextRound(s)
    s=timeHoldAdvance(s,s.bidAt+5000)
   }
   s=timeHoldAdvance(s,s.nextAt!)
   expect(s.round).toBe(19)
   const result=timeHoldView(s,null,1000000)
   expect(result.phase).toBe('finished')
   expect(result.history).toHaveLength(19)
   expect(result.ranks).not.toBeNull()
   return result
  }
  expect(finish(7000)).toMatchObject({winner:'A',ranks:[['A'],['B'],['C']]})
  expect(finish(6000)).toMatchObject({winner:null,ranks:[['A','B'],['C']]})
 })
})
