import {expect,test} from 'vitest'
import {hiddenBot,hiddenClues,hiddenNouns,hiddenReviewMs,hiddenScore,hiddenStart,hiddenStep,hiddenTick,hiddenView,type HiddenAction,type HiddenState} from '../src/hidden-word'

const seats=['Ada','Beck','Cleo']
const start=()=>hiddenStart(seats,22,100,15000)
const act=(s:HiddenState,seat:string,action:HiddenAction)=>hiddenStep(s,seat,action,s.deadline-1)!
const guess=(s:HiddenState,seat:string,...words:string[])=>act(s,seat,{kind:'guess',words})
const tick=(s:HiddenState)=>hiddenTick(s,s.deadline)
const expose=()=>tick(tick(start()))

test('five-noun envelopes have no overlaps at the maximum roster and the fixture deal is reproducible',()=>{
 const ids=Array.from({length:16},(_,i)=>'seat-'+i)
 const initial=hiddenStart(ids,22,100,15000)
 expect(hiddenStart(ids,22,100,15000)).toEqual(initial)
 expect(initial.envelopes.every(e=>e.length===5)).toBe(true)
 expect(new Set(initial.envelopes.flat()).size).toBe(80)
 expect(new Set(initial.order).size).toBe(16)
})

test('every option is valid and transcript stages narrow the written associations from six to two to one',()=>{
 expect(hiddenNouns).toHaveLength(96)
 expect(new Set(hiddenNouns).size).toBe(96)
 const seen=new Map<string,number>()
 for(const noun of hiddenNouns)for(const stage of [1,2,3] as const){
  const cues=hiddenClues(noun,stage)
  expect(cues.length).toBe(stage===3?1:2)
  for(const {word,score} of cues){
   expect(hiddenNouns).not.toContain(word)
   expect(hiddenScore(noun,word)).toBe(score)
   const group=hiddenNouns.filter(candidate=>hiddenScore(candidate,word)===score)
   expect(group).toContain(noun)
   expect(group).toHaveLength([6,2,1][stage-1])
   expect(seen.get(word)??stage).toBe(stage)
   seen.set(word,stage)
  }
 }
})

test('each role and deadline is checked, with no word or guess payload visible to other seats before opening',()=>{
 const initial=start(), [setter,reader,onlooker]=initial.order
 const noun=hiddenView(initial,setter).mine!.envelope[0]
 const before=hiddenView(initial,reader)
 const first=act(initial,setter,{kind:'choose',word:noun})
 expect(hiddenView(first,reader)).toEqual(before)
 expect(hiddenView(first,setter).mine).toMatchObject({chosen:noun,locked:true})
 expect(hiddenStep(first,setter,{kind:'choose',word:noun},first.deadline-1)).toBeNull()
 expect(hiddenStep(initial,setter,{kind:'choose',word:noun},initial.deadline)).toBeNull()
 const clue=tick(first)
 expect(hiddenStep(clue,reader,{kind:'clue',word:'night air'},clue.deadline-1)).toBeNull()
 expect(hiddenView(clue,onlooker).mine?.clues).toEqual([])
 const reading=tick(clue)
 expect(hiddenView(reading,reader).mine?.chosen).not.toBe(noun)
 const readingBefore=hiddenView(reading,onlooker)
 const sealed=guess(reading,reader,noun)
 expect(hiddenView(sealed,onlooker)).toEqual(readingBefore)
 expect(hiddenView(sealed,setter).mine?.guess).toBeNull()
 expect(hiddenView(sealed,reader).mine?.guess).toEqual([noun])
 const open=guess(sealed,onlooker)
 expect(hiddenView(open,onlooker).review?.answer).toBe(noun)
 expect(hiddenView(open,onlooker).review?.correct).toEqual([reader])
 expect(open.deadline).toBe(reading.deadline-1+hiddenReviewMs)
})

test('a miss awards the current stage, opens misses without the answer, and one bonus guess costs one private seal',()=>{
 const reading=expose(),[setter,reader,onlooker]=reading.order
 const noun=hiddenView(reading,setter).mine!.chosen!
 const wrong=hiddenNouns.find(w=>w!==noun)!
 expect(hiddenStep(reading,reader,{kind:'guess',words:[wrong,wrong]},reading.deadline-1)).toBeNull()
 const first=guess(guess(reading,reader,wrong),onlooker)
 const review=hiddenView(first,reader).review!
 expect(review.guesses).toEqual([{seat:reader,words:[wrong]},{seat:onlooker,words:[]}])
 expect(review.answer).toBeNull()
 expect(review.setterPoints).toBe(1)
 const second=tick(tick(first))
 expect(hiddenStep(second,reader,{kind:'guess',words:[wrong]},second.deadline-1)).toBeNull()
 const misses=hiddenNouns.filter(w=>w!==noun&&w!==wrong)
 const sealed=guess(second,reader,...misses.slice(0,2))
 expect(hiddenView(sealed,reader).mine).toMatchObject({seals:1,bonusAvailable:false})
 const stage3=tick(tick(guess(sealed,onlooker)))
 expect(hiddenStep(stage3,reader,{kind:'guess',words:misses.slice(2,4)},stage3.deadline-1)).toBeNull()
 const done=guess(guess(stage3,reader,noun),onlooker,noun)
 expect(hiddenView(done,reader).review).toMatchObject({answer:noun,correct:[reader,onlooker],setterPoints:0})
 expect(hiddenView(done,reader).standings.map(x=>[x.seat,x.points])).toEqual([[setter,3],[reader,1],[onlooker,1]])
})

test('timeouts finish both rotations, double all round-two points, and share an exact tie',()=>{
 let s=start()
 for(let i=0;i<14;i++)s=tick(s)
 const previous=hiddenView(s,seats[0]).history[0]
 expect(previous).toMatchObject({round:1,stages:3,scored:6})
 while(s.round===1)s=tick(s)
 for(const who of seats){
  const before=hiddenView(start(),who).mine!.envelope
  const retired=hiddenView(s,who).history.find(c=>c.setter===who)!.answer
  expect(hiddenView(s,who).mine!.envelope).toEqual(before.filter(w=>w!==retired))
  expect(hiddenStep(s,who,{kind:'choose',word:retired},s.deadline-1)).toBeNull()
 }
 // Both guessers can win doubled points; use an exact answer on the first setter.
 let r=tick(tick(s))
 const [setter,...all]=r.order
 for(const p of all)r=guess(r,p,hiddenView(r,setter).mine!.chosen!)
 expect(r.scores).toEqual(seats.map(p=>p===setter?6:8))
 while(s.phase!=='done')s=tick(s)
 expect(hiddenView(s,seats[0]).history).toHaveLength(6)
 expect(hiddenView(s,seats[0]).history.filter(c=>c.round===2).map(c=>c.scored)).toEqual([12,12,12])
 expect(hiddenView(s,seats[0]).standings.map(x=>[x.points,x.rank])).toEqual([[18,1],[18,1],[18,1]])
 expect(hiddenTick(s,Number.MAX_SAFE_INTEGER)).toBe(s)
})

test('hard practice reads only the public clue and its own envelope, and can act on every role',()=>{
 const initial=start(),[setter,reader]=initial.order
 const choose=hiddenBot(hiddenView(initial,setter),19,'hard')
 expect(choose?.kind).toBe('choose')
 expect(hiddenView(initial,setter).mine!.envelope).toContain((choose as {word:string}).word)
 const c=tick(initial)
 expect(hiddenBot(hiddenView(c,setter),19,'hard')?.kind).toBe('clue')
 const g=tick(c),projection=hiddenView(g,reader)
 const response=hiddenBot(projection,9,'hard')
 expect(response?.kind).toBe('guess')
 expect(response).toEqual(hiddenBot(projection,9,'hard'))
 const co=projection.clues.at(-1)!
 expect(response&&'words' in response&&response.words.every(x=>!projection.mine!.envelope.includes(x)&&hiddenScore(x,co.word)===co.score)).toBe(true)
})
