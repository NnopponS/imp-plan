import {describe,expect,it} from 'vitest'
import {montageAdvance,montageBuzz,montageOpenRound,montageStart,montageView,type Montage} from '../src/montage'

const time=100_000
const fresh=(seed=27)=>montageStart(['a','b'],seed,time)
const begin=(s=fresh(),at=time)=>montageAdvance(montageOpenRound(s,at),at+2_000)
function frame(s:Montage){
 const {round,frame,nextAt}=montageView(s)
 if(!frame||nextAt===null)throw new Error('Expected a live frame')
 return {key:{round,frame:frame.index},portrait:frame.portraitId,nextAt}
}

// Play from the public reveal only; the helper never uses the host's hidden deck.
function intoRepeat(s:Montage,earlier:readonly number[]=[]){
 const seen=new Set(earlier)
 const order=[...earlier]
 for(let i=0;i<32;i++){
  const current=frame(s)
  order.push(current.portrait)
  if(seen.has(current.portrait))return {state:s,order}
  seen.add(current.portrait)
  s=montageAdvance(s,current.nextAt)
 }
 throw new Error('Expected a repeated portrait by the end of the deck')
}

describe('Montage',()=>{
 it('enforces the cooperative roster and a separate single-seat practice mode',()=>{
  expect(()=>montageStart(['solo'],1,time)).toThrow()
  expect(()=>montageStart(['x','x'],1,time)).toThrow()
  expect(()=>montageStart(['','b'],1,time)).toThrow()
  expect(()=>montageStart([' ','b'],1,time)).toThrow()
  expect(()=>montageStart(Array.from({length:17},(_,i)=>String(i)),1,time)).toThrow()
  expect(()=>montageStart(['a','b'],1,time,'practice')).toThrow()
  expect(()=>montageStart(['a','b'],1,Infinity)).toThrow()
  expect(()=>montageStart(['a','b'],NaN,time)).toThrow()
  expect(montageView(montageStart(Array.from({length:16},(_,i)=>String(i)),1,time)).pieces).toHaveLength(16)
  expect(montageView(montageStart(['only'],0,time,'practice'))).toMatchObject({mode:'practice',totalRounds:1})
 })

 it('projects only the currently revealed portrait and follows fixed three-second windows',()=>{
  const ready=fresh()
  expect(montageView(ready,'a')).toMatchObject({phase:'ready',frame:null,nextAt:null,canBuzz:false})
  expect(montageAdvance(ready,time+100_000)).toBe(ready)
  const countdown=montageOpenRound(ready,time)
  expect(montageView(countdown,'a')).toMatchObject({phase:'countdown',frame:null,nextAt:time+2_000,canBuzz:false})
  expect(montageOpenRound(countdown,time+500)).toBe(countdown)
  expect(montageAdvance(countdown,time+1_999)).toBe(countdown)
  const s=montageAdvance(countdown,time+2_000)
  expect(montageView(s,'a')).toStrictEqual({
   mode:'match',phase:'live',round:1,totalRounds:5,clearedRounds:0,
   frame:{index:1,portraitId:expect.any(Number)},nextAt:time+5_000,errors:0,errorLimit:10,
   pieces:[{seat:'a',pieces:0},{seat:'b',pieces:0}],lastBuzz:null,history:[],outcome:null,canBuzz:true
  })
  expect(montageView(s,'spectator').canBuzz).toBe(false)
  expect(montageAdvance(s,time+4_999)).toBe(s)
  const next=montageAdvance(s,time+5_600)
  expect(frame(next)).toMatchObject({key:{round:1,frame:2},nextAt:time+8_000})
  expect(frame(next).portrait).not.toBe(frame(s).portrait)
 })

 it('replays the same seeded portrait order without cross-frame clues or out-of-range IDs',()=>{
  const first=intoRepeat(begin(fresh(17))).order
  expect(intoRepeat(begin(fresh(17))).order).toEqual(first)
  expect(new Set(first.slice(0,-1)).size).toBe(first.length-1)
  expect(first.slice(0,-1)).toContain(first.at(-1))
  expect(first.every(id=>Number.isInteger(id)&&id>=0&&id<32)).toBe(true)
  expect(new Set(Array.from({length:8},(_,i)=>intoRepeat(begin(fresh(i))).order.join(','))).size).toBeGreaterThan(1)
  // The response still contains only a live portrait at the repeat, not a 'duplicate' flag or answer.
  const repeated=montageView(intoRepeat(begin(fresh(17))).state,'a')
  expect(repeated).toMatchObject({phase:'live',canBuzz:true,history:[],lastBuzz:null})
  expect(Object.keys(repeated.frame!).sort()).toEqual(['index','portraitId'])
 })

 it('charges a false buzz but leaves the portrait clock running and only blocks the same seat for that frame',()=>{
  const s=begin()
  const {key,nextAt}=frame(s)
  const b=montageBuzz(s,'a',key,nextAt-2_900)
  expect(b.result).toBe('incorrect')
  expect(montageView(b.state,'a')).toMatchObject({errors:1,nextAt,canBuzz:false,lastBuzz:{seat:'a',round:1,frame:1,correct:false}})
  expect(montageView(b.state,'b').canBuzz).toBe(true)
  expect(montageView(s,'a').errors).toBe(0)
  expect(montageBuzz(b.state,'a',key,nextAt-2_899)).toStrictEqual({state:b.state,result:'already-buzzed'})
  const two=montageBuzz(b.state,'b',key,nextAt-2_898).state
  expect(montageView(two).errors).toBe(2)
  expect(montageView(montageAdvance(two,nextAt),'a').canBuzz).toBe(true)
 })

 it('does not let expired, future, non-seated, or wrong-round buzzer messages score',()=>{
  const s=begin()
  const {key,nextAt}=frame(s)
  expect(montageBuzz(s,'intruder',key,nextAt-1)).toStrictEqual({state:s,result:'invalid-seat'})
  expect(montageBuzz(s,'a',{round:2,frame:1},nextAt-1)).toStrictEqual({state:s,result:'stale-frame'})
  expect(montageBuzz(s,'a',key,Infinity)).toStrictEqual({state:s,result:'invalid-time'})
  const expired=montageBuzz(s,'a',key,nextAt)
  expect(expired.result).toBe('stale-frame')
  expect(montageView(expired.state)).toMatchObject({frame:{index:2},errors:0})
  const guessed=montageBuzz(s,'a',{round:1,frame:2},nextAt)
  expect(guessed.result).toBe('stale-frame')
  expect(montageView(guessed.state)).toMatchObject({frame:{index:2},errors:0})
  const countdown=montageOpenRound(fresh(),time)
  const unopened=montageBuzz(countdown,'a',key,time+2_000)
  expect(unopened.result).toBe('not-live')
  expect(montageView(unopened.state)).toMatchObject({frame:{index:1},errors:0})
 })

 it('awards exactly one fictional Piece to the first accepted buzz on a repeated portrait',()=>{
  const s=intoRepeat(begin()).state
  const {key,nextAt}=frame(s)
  const b=montageBuzz(s,'b',key,nextAt-1)
  expect(b.result).toBe('correct')
  expect(montageView(b.state,'a')).toMatchObject({
   phase:'between',round:1,clearedRounds:1,canBuzz:false,frame:null,nextAt:null,
   pieces:[{seat:'a',pieces:0},{seat:'b',pieces:1}],
   history:[{round:1,seat:'b'}],lastBuzz:{seat:'b',round:1,frame:key.frame,correct:true},outcome:null
  })
  expect(montageBuzz(b.state,'a',key,nextAt-1)).toStrictEqual({state:b.state,result:'not-live'})
  // Changing arrival order on the same authoritative tick changes the winner, not adding a tie.
  expect(montageView(montageBuzz(s,'a',key,nextAt-1).state).history).toEqual([{round:1,seat:'a'}])
  expect(montageAdvance(b.state,nextAt+100_000)).toBe(b.state)
 })

 it('ends at the missed repeat deadline before a new nonrepeat can be exposed or scored',()=>{
  const s=intoRepeat(begin()).state
  const {key,nextAt}=frame(s)
  expect(montageAdvance(s,nextAt-1)).toBe(s)
  expect(montageView(montageAdvance(s,nextAt))).toMatchObject({phase:'finished',outcome:'missed-repeat',frame:null,nextAt:null,clearedRounds:0,errors:0})
  const caughtLate=montageBuzz(s,'a',key,nextAt)
  expect(caughtLate.result).toBe('stale-frame')
  expect(caughtLate.state).toEqual(montageAdvance(s,nextAt))
  expect(montageView(montageAdvance(begin(),time+100_000)).outcome).toBe('missed-repeat')
 })

 it('carries wrong answers between rounds, permits ten in total, and fails on the eleventh',()=>{
  let s=begin()
  let n=0
  const remembered:number[]=[]
  for(let i=0;i<5;i++){
   const {key,nextAt,portrait}=frame(s)
   remembered.push(portrait)
   for(const who of ['a','b']){
    const b=montageBuzz(s,who,key,nextAt-1)
    expect(b.result).toBe('incorrect')
    s=b.state
    expect(montageView(s)).toMatchObject({errors:++n,phase:'live'})
   }
   s=montageAdvance(s,nextAt)
  }
  s=intoRepeat(s,remembered).state
  const repeated=frame(s)
  s=montageBuzz(s,'b',repeated.key,repeated.nextAt-1).state
  expect(montageView(s)).toMatchObject({errors:10,phase:'between',clearedRounds:1})
  s=begin(s,repeated.nextAt)
  const newer=frame(s)
  expect(newer.key.round).toBe(2)
  const fail=montageBuzz(s,'a',newer.key,newer.nextAt-1)
  expect(fail.result).toBe('incorrect')
  expect(montageView(fail.state)).toMatchObject({errors:11,phase:'finished',outcome:'error-limit',frame:null,nextAt:null})
 })

 it('clears the cooperative match only after five successful rounds',()=>{
  let s=fresh()
  let at=time
  for(let round=1;round<=5;round++){
   s=intoRepeat(begin(s,at)).state
   const {key,nextAt}=frame(s)
   expect(key.round).toBe(round)
   at=nextAt
   const b=montageBuzz(s,round%2?'a':'b',key,nextAt-1)
   expect(b.result).toBe('correct')
   s=b.state
   expect(montageView(s)).toMatchObject({clearedRounds:round,phase:round<5?'between':'finished',outcome:round<5?null:'cleared'})
  }
  expect(montageView(s).pieces).toEqual([{seat:'a',pieces:3},{seat:'b',pieces:2}])
  expect(montageOpenRound(s,at)).toBe(s)
 })

 it('runs slower practice with no fictional Piece award even when cleared',()=>{
  const practice=begin(montageStart(['solo'],1,time,'practice'))
  expect(frame(practice).nextAt-time).toBe(6_500)
  const repeated=intoRepeat(practice).state
  const {key,nextAt}=frame(repeated)
  const won=montageBuzz(repeated,'solo',key,nextAt-1)
  expect(won.result).toBe('correct')
  expect(montageView(won.state)).toMatchObject({phase:'finished',outcome:'cleared',clearedRounds:1,pieces:[{seat:'solo',pieces:0}]})
 })
})
