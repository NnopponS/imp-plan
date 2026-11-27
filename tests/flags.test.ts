import {describe,expect,it} from 'vitest'
import {flagsStart,flagsStep,flagsStudyWindow,flagsTick,flagsView,flagsWindow,type FlagsMode,type FlagsState} from '../src/flags'

const start=10_000, opens=50_000
const open=(seats=['a','b'],seed=47,mode:FlagsMode='recall')=>flagsStart(seats,seed,start,mode)
const transition=(state:FlagsState)=>flagsTick(state,state.deadline!)
function mapped(study:FlagsState,answer:FlagsState){
 const start=flagsView(study)
 const options=flagsView(answer).options
 return flagsView(answer).names.map(name=>options.findIndex(c=>c.code===start.study.find(flag=>flag.name===name)?.code))
}
function recall(study:FlagsState,answer:FlagsState){
 const seen=new Set(flagsView(study).study.map(c=>c.code))
 return flagsView(answer).options.flatMap((c,i)=>seen.has(c.code)?[i]:[])
}

describe('Flags Around the World fan recognition engine',()=>{
 it('starts with only twelve identified study flags and a fixed 40-second study window',()=>{
  const s=open()
  expect([flagsStudyWindow,flagsWindow]).toEqual([40_000,60_000])
  expect(flagsView(s,'a')).toEqual({phase:'study',mode:'recall',deadline:opens,study:expect.any(Array),options:[],names:[],ownChoices:null,submitted:0,players:2,leaders:[],results:null,solutions:null})
  const {study}=flagsView(s,'a')
  expect(new Set(study.map(c=>c.code)).size).toBe(12)
  expect(new Set(study.map(c=>c.name)).size).toBe(12)
  expect(new Set(study.map(c=>c.symbol)).size).toBe(12)
  for(const c of study){
   expect(c.code).toMatch(/^f(0[1-9]|1[0-9]|2[0-4])$/)
   expect(c.symbol).toMatch(/^(0[1-9]|1[0-9]|20)$/)
   expect(c.description.length).toBeGreaterThan(20)
  }
  expect(flagsTick(s,opens-1)).toBe(s)
  expect(flagsStep(s,'a',[0],opens-1)).toBeNull()
 })

 it('uses a reproducible, varied twenty-card deck containing twelve exact matches with stable randomly ordered serials',()=>{
  const decks=new Set<string>(), assets=new Set<string>(), named=new Map<string,string>()
  for(let seed=0;seed<40;seed++){
   const s=open(['a'],seed), a=transition(s)
   expect(s).toEqual(open(['a'],seed))
   const prior=flagsView(s).study,v=flagsView(a)
   expect(v).toMatchObject({phase:'answer',study:[],names:[],solutions:null,deadline:opens+flagsWindow})
   expect(new Set(v.options.map(c=>c.code)).size).toBe(20)
   expect(new Set(v.options.map(c=>c.symbol)).size).toBe(20)
   for(const c of v.options){
    expect(Object.keys(c).sort()).toEqual(['code','description','symbol'])
    assets.add(c.code)
   }
   for(const c of prior)named.set(c.name,c.code)
   const shown=new Map(prior.map(c=>[c.code,c.symbol]))
   const correct=v.options.filter(c=>shown.has(c.code))
   expect(correct).toHaveLength(12)
   for(const c of correct)expect(c.symbol).toBe(shown.get(c.code))
   expect(v.options.map(c=>c.symbol)).not.toEqual(v.options.map(c=>c.symbol).sort())
   decks.add(v.options.map(c=>c.code).join(','))
  }
  const opaque=Array.from({length:24},(_,i)=>'f'+String(i+1).padStart(2,'0'))
  expect(assets).toEqual(new Set(opaque))
  expect(named).toEqual(new Map(['Thailand','South Korea','Japan','Indonesia','Poland','Nepal','Singapore','Malaysia','Vietnam','Philippines','Canada','United Kingdom','France','Germany','Italy','Brazil','Argentina','South Africa','Switzerland','Sweden','Finland','Norway','Denmark','Greece'].map((name,i)=>[name,opaque[i]])))
  expect(decks.size).toBeGreaterThan(12)
 })

 it('keeps submitted picks and scoring private until all seats lock and never projects foreign picks',()=>{
  const study=open(), s=transition(study), correct=recall(study,s)
  const a=flagsStep(s,'a',[correct[0]],opens)!
  expect(flagsView(a,'a')).toMatchObject({submitted:1,ownChoices:[correct[0]],results:null,solutions:null})
  expect(flagsView(a,'b')).toStrictEqual(flagsView(a,'spectator'))
  expect(flagsView(a,'b')).toMatchObject({submitted:1,ownChoices:null,results:null,leaders:[],solutions:null})
  expect(Object.keys(flagsView(a,'b')).sort()).toEqual(['deadline','leaders','mode','names','options','ownChoices','phase','players','results','solutions','study','submitted'])
  const bad=flagsView(s).options.findIndex((_,i)=>!correct.includes(i))
  const b=flagsStep(a,'b',[bad],opens+500)!
  expect(flagsView(b,'b')).toMatchObject({phase:'done',submitted:2,ownChoices:[bad],solutions:correct,leaders:['a'],deadline:null})
  expect(flagsView(b,'spectator').ownChoices).toBeNull()
  expect(flagsView(b,'a').results).toEqual([
   {seat:'a',hits:1,misses:0,points:1,elapsed:0},
   {seat:'b',hits:0,misses:1,points:0,elapsed:500}
  ])
  expect(flagsView(a,'a').results).toBeNull()
 })

 it('rejects forged seat IDs, duplicate locks, duplicate cards, oversize arrays, and invalid indices or timestamps',()=>{
  const s=transition(open())
  for(const who of ['', 'constructor','__proto__','toString','c'])expect(flagsStep(s,who,[0],opens)).toBeNull()
  for(const invalid of [NaN,Infinity,-1,0.5,20,Number.MAX_SAFE_INTEGER])expect(flagsStep(s,'a',[invalid],opens)).toBeNull()
  for(const choices of [[],[0,0],Array.from({length:13},(_,i)=>i),Array(1)])expect(flagsStep(s,'a',choices,opens)).toBeNull()
  for(const time of [opens-1,s.deadline!,NaN,Infinity])expect(flagsStep(s,'a',[0],time)).toBeNull()
  const locked=flagsStep(s,'a',[0],s.deadline!-1)!
  expect(flagsStep(locked,'a',[1],s.deadline!-1)).toBeNull()
  expect(flagsView(locked,'a').ownChoices).toEqual([0])
  expect(flagsTick(s,NaN)).toBe(s)
  expect(flagsTick(s,opens-1)).toBe(s)
 })

 it('passes at the exact deadline and grants every player the full recall window after a delayed host tick',()=>{
  const study=open(), s=flagsTick(study,72_000), c=recall(study,s)
  expect(s).toMatchObject({phase:'answer',deadline:132_000})
  const a=flagsStep(s,'a',c,131_999)!
  expect(flagsTick(a,131_999)).toBe(a)
  expect(flagsStep(a,'b',c,132_000)).toBeNull()
  const resolved=flagsTick(a,132_000)
  expect(flagsView(resolved,'b')).toMatchObject({phase:'done',deadline:null,ownChoices:null,submitted:1,solutions:c,leaders:['a']})
  expect(flagsView(resolved,'a').results).toEqual([
   {seat:'a',hits:12,misses:0,points:12,elapsed:59_999},
   {seat:'b',hits:0,misses:0,points:0,elapsed:null}
  ])
 })

 it('uses score then shorter time, shares exact ties, and floors low scores at zero',()=>{
  const study=open(['a','b','c','d']), s=transition(study), c=recall(study,s)
  const wrong=flagsView(s).options.flatMap((_,i)=>c.includes(i)?[]:[i])
  const a=flagsStep(s,'a',c,opens+100)!
  const b=flagsStep(a,'b',c,opens+100)!
  const d=flagsStep(b,'c',c,opens+101)!
  const fin=flagsStep(d,'d',[c[0],wrong[0],wrong[1]],opens+120)!
  const v=flagsView(fin,'a')
  expect(v.leaders).toEqual(['a','b'])
  expect(v.results).toHaveLength(4)
  expect(v.results?.[3]).toEqual({seat:'d',hits:1,misses:2,points:0,elapsed:120})
  expect(flagsTick(fin,s.deadline!)).toBe(fin)
  expect(flagsStep(fin,'a',c,opens+121)).toBeNull()
 })

 it('accepts names as injective card mappings and scores only correctly matched or wrong nonblank slots',()=>{
  const s=open(['a','b'],23,'names'), a=transition(s)
  const v=flagsView(a,'b')
  expect(v.names).toHaveLength(12)
  expect(new Set(v.names)).toEqual(new Set(flagsView(s).study.map(f=>f.name)))
  expect(v.names).not.toEqual(flagsView(s).study.map(f=>f.name))
  expect(v).toMatchObject({mode:'names',study:[],solutions:null})
  const wire=JSON.parse(JSON.stringify(v)) as typeof v
  for(const clue of wire.options){
   expect(clue.code).toMatch(/^f(0[1-9]|1[0-9]|2[0-4])$/)
   expect(Object.keys(clue).sort()).toEqual(['code','description','symbol'])
  }
  const answers=mapped(s,a), bad=v.options.findIndex((_,i)=>!answers.includes(i))
  const forA=Array<number>(12).fill(-1)
  forA[0]=answers[0];forA[1]=answers[1];forA[2]=bad
  const forB=[...answers];[forB[0],forB[1]]=[forB[1],forB[0]]
  for(const ignored of [[...answers,0],answers.slice(0,-1),Array(12),Array(12).fill(-1),answers.map(()=>0),[-2,...answers.slice(1)],[20,...answers.slice(1)]])expect(flagsStep(a,'a',ignored,opens)).toBeNull()
  const sa=flagsStep(a,'a',forA,opens+200)!, b=flagsStep(sa,'b',forB,opens+100)!
  expect(flagsView(sa,'a').ownChoices).toEqual(forA)
  expect(flagsView(sa,'b').ownChoices).toBeNull()
  expect(flagsView(b,'b')).toMatchObject({solutions:answers,leaders:['b']})
  expect(flagsView(b,'b').results).toEqual([
   {seat:'b',hits:10,misses:2,points:8,elapsed:100},
   {seat:'a',hits:2,misses:1,points:1,elapsed:200}
  ])
 })

 it('supports every seat count from one to sixteen and completes even when all seats pass by silence',()=>{
  for(let size=1;size<=16;size++){
   const seats=Array.from({length:size},(_,i)=>'seat-'+i)
   const state=transition(transition(open(seats,9,size%2?'names':'recall')))
   const v=flagsView(state,seats[0])
   expect(v).toMatchObject({players:size,phase:'done',submitted:0,leaders:seats})
   expect(v.results).toEqual(seats.map(seat=>({seat,hits:0,misses:0,points:0,elapsed:null})))
  }
 })

 it('uses safe keyed storage even for special seat IDs and returns detached projections and lock arrays',()=>{
  const s=open(['__proto__','constructor']), a=transition(s)
  const answer=recall(s,a), submitted=answer.slice(0,3)
  const proto=flagsStep(a,'__proto__',submitted,opens+1)!
  submitted[0]=999
  const v=flagsView(proto,'__proto__')
  expect(v.ownChoices).toEqual(answer.slice(0,3))
  expect(flagsView(proto,'constructor').ownChoices).toBeNull()
  v.options[0].description='overwritten';v.ownChoices![0]=999
  expect(flagsView(proto,'__proto__').ownChoices).toEqual(answer.slice(0,3))
  expect(flagsView(proto,'__proto__').options[0].description).not.toBe('overwritten')
  const finished=flagsStep(proto,'constructor',answer,opens+2)!
  const result=flagsView(finished)
  result.results![0].hits=99;result.solutions![0]=99;result.leaders[0]='fake'
  expect(flagsView(finished)).toMatchObject({solutions:answer,leaders:['constructor'],results:[{hits:12},{hits:3}]})
 })

 it('rejects invalid initialization inputs explicitly',()=>{
  for(const seats of [[],[''],['   '],['x','x'],Array.from({length:17},(_,i)=>String(i))]){
   expect(()=>open(seats)).toThrow()
  }
  expect(()=>flagsStart(['a'],NaN,start)).toThrow()
  expect(()=>flagsStart(['a'],1,Infinity)).toThrow()
 })
})
