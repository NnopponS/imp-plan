import {describe,expect,it} from 'vitest'
import {createTimeHoldGesture,timeHoldClock, type TimeHoldInput} from '../src/time-hold-ui'
import {timeHoldAction,timeHoldAdvance,timeHoldStart,timeHoldView, type TimeHoldAction} from '../src/time-hold'

function setup(){
 let host=10000,active=true,matchKey='first',viewer:string|null='one'
 let game=timeHoldStart(['one','two'],host)
 const actions:TimeHoldAction[]=[]
 const held:boolean[]=[]
 const gesture=createTimeHoldGesture(()=>({
  active,matchKey,view:timeHoldView(game,viewer,host),
  submit(action){
   actions.push(action)
   const next=viewer&&timeHoldAction(game,viewer,action,host)
   if(!next)return false
   game=next
   return true
  }
 }), next=>held.push(next))
 return {
  gesture,actions,held,
  setHost(now:number){host=now;game=timeHoldAdvance(game,host)},
  view(){return timeHoldView(game,viewer,host)},
  opponent(action:TimeHoldAction){game=timeHoldAction(game,'two',action,host)??game},
  disconnect(){active=false;gesture.sync()},
  rematch(){matchKey='second';game=timeHoldStart(['one','two'],host);gesture.sync()},
  spectate(){viewer=null}
 }
}
const touch:TimeHoldInput={kind:'pointer',id:20}
const space:TimeHoldInput={kind:'key',id:'Space'}

describe('Time hold gesture',()=>{
 it('owns a press until the same input releases it, without stacked bids or extra releases',()=>{
  const p=setup()
  expect(p.gesture.press(touch)).toBe(true)
  expect(p.gesture.press(space)).toBe(false)
  expect(p.gesture.release(space)).toBe(false)
  expect(p.view().mine?.status).toBe('holding')
  expect(p.gesture.release(touch)).toBe(true)
  expect(p.gesture.release(touch)).toBe(false)
  expect(p.held).toEqual([true,false])
  expect(p.actions).toEqual([{kind:'hold',round:1},{kind:'release',round:1}])
 })
 it('pulses a real held bid, then involuntary cancellation ends it without a winning bid',()=>{
  const p=setup()
  p.gesture.press(space)
  for(const now of [12000,14000,16000,18000]){
   p.setHost(now)
   p.gesture.pulse()
  }
  p.setHost(18740)
  p.gesture.cancel()
  p.gesture.pulse()
  p.gesture.release(space)
  expect(p.view().last).toEqual({round:1,winner:null,elapsedTenths:0})
  expect(p.actions.map(a=>a.kind)).toEqual(['hold','pulse','pulse','pulse','pulse','cancel'])
 })
 it('does not send delayed actions across connection loss, match replacement, or spectator entry',()=>{
  const p=setup()
  p.gesture.press(space)
  p.disconnect()
  p.gesture.pulse()
  p.gesture.release(space)
  expect(p.actions.map(a=>a.kind)).toEqual(['hold'])
  expect(p.held).toEqual([true,false])
  const q=setup()
  q.gesture.press(space)
  q.rematch()
  q.gesture.release(space)
  expect(q.actions.map(a=>a.kind)).toEqual(['hold'])
  q.spectate()
  expect(q.gesture.press(space)).toBe(false)
  expect(q.actions).toHaveLength(1)
 })
 it('rejects late arming and wait states without proposing an action',()=>{
  const p=setup()
  p.setHost(13100)
  expect(p.gesture.press(space)).toBe(false)
  p.setHost(18100)
  expect(p.view().phase).toBe('review')
  expect(p.gesture.press(touch)).toBe(false)
  expect(p.actions).toEqual([])
 })
 it('ignores an unrelated delayed rejection but stops the matching pending press',()=>{
  const held:boolean[]=[],actions:TimeHoldAction[]=[]
  const view=setup().view()
  const g=createTimeHoldGesture(()=>({active:true,view,submit:a=>{actions.push(a);return 'current'}}),v=>held.push(v))
  expect(g.press(space)).toBe(true)
  g.reject('stale')
  g.pulse()
  g.reject('current')
  g.pulse()
  expect(actions.map(a=>a.kind)).toEqual(['hold','pulse'])
  expect(held).toEqual([true,false])
 })
 it('returns to unpressed when the transport rejects a press',()=>{
  const held:boolean[]=[]
  const view=setup().view()
  const g=createTimeHoldGesture(()=>({active:true,view,submit:()=>false}),v=>held.push(v))
  expect(g.press(space)).toBe(false)
  g.pulse(); g.cancel()
  expect(held.at(-1)??false).toBe(false)
 })
})

describe('Time hold display-only clock',()=>{
 it('never exposes a timer for another bidder or uses stale review data as a private reserve',()=>{
  const p=setup()
  p.opponent({kind:'hold',round:1})
  p.setHost(13200)
  expect(timeHoldClock(p.view(),{hostNow:13200,receivedAt:400},700)).toEqual({armTenths:null,heldTenths:null,reserveTenths:null})
 })
 it('interpolates only an acknowledged own hold and clamps extrapolation to the lease',()=>{
  const p=setup()
  p.gesture.press(space)
  p.setHost(12000)
  p.gesture.pulse()
  p.setHost(13260)
  expect(p.view().mine?.remainingTenths).toBe(5997)
  expect(timeHoldClock(p.view(),{hostNow:13260,receivedAt:400},700)).toEqual({armTenths:null,heldTenths:6,reserveTenths:5994,chargeable:false})
  expect(timeHoldClock(p.view(),{hostNow:13260,receivedAt:400},50000)).toEqual({armTenths:null,heldTenths:38,reserveTenths:5962,chargeable:false})
  expect(timeHoldClock(p.view(),null,50000)).toEqual({armTenths:null,heldTenths:null,reserveTenths:5997})
 })
 it('does not warn that a rounded 5.0-second display is chargeable before the exact boundary',()=>{
  const p=setup()
  p.gesture.press(space)
  for(const now of [12000,14000,16000,17980]){
   p.setHost(now)
   p.gesture.pulse()
  }
  expect(timeHoldClock(p.view(),{hostNow:17980,receivedAt:40},40).chargeable).toBe(false)
  expect(timeHoldClock(p.view(),{hostNow:17980,receivedAt:40},60).chargeable).toBe(true)
 })
 it('counts arming down without revealing private reserve or computing a result',()=>{
  const p=setup()
  expect(timeHoldClock(p.view(),{hostNow:10800,receivedAt:550},650)).toEqual({armTenths:21,heldTenths:null,reserveTenths:null})
  expect(timeHoldClock(p.view(),{hostNow:12950,receivedAt:550},726)).toEqual({armTenths:0,heldTenths:null,reserveTenths:null})
 })
})
