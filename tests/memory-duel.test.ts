import {describe, expect, it} from 'vitest'
import {
 memoryDuelAction,memoryDuelDeal,memoryDuelGrid,memoryDuelPack,memoryDuelRedeal,
 memoryDuelSelect,memoryDuelStart,memoryDuelStudy,memoryDuelTick,memoryDuelView,
 type MemoryDuelDeal,
} from '../src/memory-duel'

const seats=['ari','bee'] as const
const startAt=100
const selectAt=startAt+20_000
const endAt=selectAt+60_000

function makeDeal(boardHead:readonly number[]=[],community:MemoryDuelDeal['community']=[26,28,44]):MemoryDuelDeal{
 const rest=Array.from({length:52},(_,card)=>card).filter(card=>!community.includes(card)&&!boardHead.includes(card))
 return {board:[...boardHead,...rest].slice(0,16),community}
}
const deal=makeDeal([0,13,1,14])
const begin=(cards=deal)=>memoryDuelStart(seats,cards,startAt)
const pack=(a:number,b:number)=>memoryDuelPack([a,b])!
function lockBoth(a:[number,number],b:[number,number],cards=deal){
 const s=memoryDuelAction(begin(cards),'ari',1,pack(...a),selectAt)!
 return memoryDuelAction(s,'bee',1,pack(...b),selectAt+1)!
}

describe('S3 Memory Poker duel',()=>{
 it('has a 4×4 timed study window and no early shared cards',()=>{
  const s=begin()
  expect(memoryDuelGrid).toEqual({rows:4,columns:4})
  expect(memoryDuelStudy).toBe(20_000)
  expect(memoryDuelSelect).toBe(60_000)
  expect(memoryDuelView(s,'ari',selectAt-1)).toMatchObject({
   phase:'study',deadline:selectAt,cards:deal.board,community:[],ownPicks:null,result:null,
  })
  expect(memoryDuelView(s,'spectator',selectAt-1).cards).toEqual(Array(16).fill(null))
  expect(memoryDuelAction(s,'ari',1,pack(0,1),selectAt-1)).toBeNull()
 })

 it('at the study deadline hides every face and reveals three disjoint shared cards even if the host has not ticked',()=>{
  const s=begin()
  const v=memoryDuelView(s,'ari',selectAt)
  expect(v).toMatchObject({phase:'select',deadline:endAt,cards:Array(16).fill(null),community:deal.community})
  expect(memoryDuelView(s,undefined,selectAt).community).toEqual(deal.community)
  expect(memoryDuelView(s,'ari',selectAt)).not.toHaveProperty('seed')
  expect(memoryDuelView(s,'ari',selectAt)).not.toHaveProperty('board')
  expect(memoryDuelView(s,'ari',selectAt)).not.toHaveProperty('deal')
  expect(new Set([...deal.board,...v.community]).size).toBe(19)
 })

 it('requires unique valid seats and deal with 19 unique in-deck cards',()=>{
  expect(()=>memoryDuelStart(['ari','ari'],deal,startAt)).toThrow()
  expect(()=>memoryDuelStart(['ari',''],deal,startAt)).toThrow()
  expect(()=>memoryDuelStart(['ari'] as unknown as typeof seats,deal,startAt)).toThrow()
  expect(()=>memoryDuelStart(seats,deal,NaN)).toThrow()
  expect(()=>begin({...deal,board:deal.board.slice(1)})).toThrow()
  expect(()=>begin({...deal,community:[deal.board[0],28,44]})).toThrow()
  expect(()=>begin({...deal,community:[26,28,52]})).toThrow()
  expect(()=>begin({...deal,board:Array(16) as number[]})).toThrow()
 })

 it('draws 19 unique cards from one 52-card deck and checks randomness input bounds',()=>{
  const requests:number[]=[]
  const cards=memoryDuelDeal(max=>{requests.push(max);return max-1})
  expect(requests).toEqual(Array.from({length:19},(_,n)=>52-n))
  expect(new Set([...cards.board,...cards.community]).size).toBe(19)
  expect(cards.board).toHaveLength(16)
  expect(cards.community).toHaveLength(3)
  expect([...cards.board,...cards.community].every(card=>Number.isInteger(card)&&card>=0&&card<52)).toBe(true)
  expect(memoryDuelDeal(max=>max-1)).toEqual(cards)
  expect(()=>memoryDuelDeal(max=>max)).toThrow()
  expect(()=>memoryDuelDeal(()=>NaN)).toThrow()
 })

 it('packs only two distinct legal positions and normalizes order',()=>{
  expect(memoryDuelPack([15,0])).toBe(memoryDuelPack([0,15]))
  for(const positions of [[0,0],[-1,1],[0,16],[0,1,2],[1],['2',3],[0,NaN],Array(2)]){
   expect(memoryDuelPack(positions)).toBeNull()
  }
  expect(memoryDuelPack(null)).toBeNull()
 })

 it('holds a submitted pair private and rejects malformed, duplicate, stale and spectator locks',()=>{
  const s=begin()
  for(const code of [0,16,17,-1,256,Infinity,NaN,1.25,'1',[0,1],null]){
   expect(memoryDuelAction(s,'ari',1,code,selectAt)).toBeNull()
  }
  expect(memoryDuelAction(s,'spectator',1,pack(0,1),selectAt)).toBeNull()
  expect(memoryDuelAction(s,'ari',0,pack(0,1),selectAt)).toBeNull()
  const p=memoryDuelAction(s,'ari',1,pack(1,0),selectAt)!
  expect(memoryDuelView(p,'ari',selectAt)).toMatchObject({ownPicks:[0,1],lockedCount:1,cards:Array(16).fill(null)})
  expect(memoryDuelView(p,'bee',selectAt)).toMatchObject({ownPicks:null,lockedCount:1,result:null})
  expect(memoryDuelView(p,undefined,selectAt)).toMatchObject({ownPicks:null,lockedCount:1,result:null})
  expect(memoryDuelAction(p,'ari',1,pack(2,3),selectAt+1)).toBeNull()
  expect(memoryDuelAction(p,'bee',1,pack(2,3),selectAt-1)).toBeNull()
  expect(memoryDuelAction(p,'bee',1,pack(2,3),NaN)).toBeNull()
 })

 it('reveals only the selected cards, resolves four-of-a-kind against a full house',()=>{
  // The community has two twos and a four; ari supplies the last two twos.
  const cards=makeDeal([0,13,2,15],[26,39,28])
  const s=lockBoth([0,1],[2,3],cards)
  const v=memoryDuelView(s,undefined,selectAt+1)
  expect(v).toMatchObject({phase:'finished',deadline:null,cards:Array(16).fill(null),community:[26,39,28],result:{
   kind:'win',winner:'ari',hands:[
    {seat:'ari',picks:[{position:0,card:0},{position:1,card:13}],rank:{name:'Four of a kind',strength:[7,2,4]}},
    {seat:'bee',picks:[{position:2,card:2},{position:3,card:15}],rank:{name:'Full house',strength:[6,4,2]}},
   ],
  }})
 })

 it('permits both players to choose the same positions and requires a fresh study deal for an exact tie',()=>{
  const tied=lockBoth([0,1],[0,1])
  expect(memoryDuelView(tied,undefined,selectAt+1)).toMatchObject({phase:'tie',deadline:null,result:{kind:'tie',winner:null}})
  expect(memoryDuelAction(tied,'ari',1,pack(2,3),selectAt+2)).toBeNull()
  expect(memoryDuelRedeal(begin(),makeDeal([51,50]),selectAt+2)).toBeNull()
  expect(memoryDuelRedeal(tied,makeDeal([51,50]),selectAt-1)).toBeNull()
  const next=memoryDuelRedeal(tied,makeDeal([51,50]),selectAt+2)!
  expect(memoryDuelView(next,'ari',selectAt+2)).toMatchObject({
   phase:'study',dealNumber:2,deadline:selectAt+2+20_000,cards:makeDeal([51,50]).board,
   community:[],ownPicks:null,lockedCount:0,result:null,
  })
  expect(memoryDuelAction(next,'ari',1,pack(0,1),selectAt+2+20_000)).toBeNull()
  expect(memoryDuelAction(next,'ari',2,pack(0,1),selectAt+2+20_000)).not.toBeNull()
 })

 it('uses the second kicker where necessary; equal ranked hands with different suits redeal',()=>{
  const community=[26,38,40] as const // 2, A, 3
  const t=lockBoth([0,1],[2,3],makeDeal([0,8,13,21],community))
  expect(memoryDuelView(t,'ari',selectAt+1).result).toMatchObject({kind:'tie',winner:null})
  const w=lockBoth([0,1],[2,3],makeDeal([0,7,13,21],community))
  expect(memoryDuelView(w,'ari',selectAt+1).result).toMatchObject({kind:'win',winner:'bee'})
  const secondKicker=lockBoth([0,1],[0,2],makeDeal([0,7,8],[26,38,27]))
  expect(memoryDuelView(secondKicker,'ari',selectAt+1).result).toMatchObject({kind:'win',winner:'bee'})
 })

 it('accepts a wheel straight but a six-high straight beats it',()=>{
  // Shared ranks 3, 4, 5; picks A–2 (wheel) versus 2–6.
  const valid=lockBoth([0,1],[2,3],makeDeal([12,0,13,4],[27,15,42]))
  expect(memoryDuelView(valid,undefined,selectAt+1).result).toMatchObject({
   kind:'win',winner:'bee',hands:[{rank:{name:'Straight',strength:[4,5]}},{rank:{name:'Straight',strength:[4,6]}}],
  })
 })

 it('does not extend the pick deadline when host ticking sleeps, and rejects locks at the deadline',()=>{
  const s=begin()
  const one=memoryDuelAction(s,'ari',1,pack(0,1),endAt-1)!
  expect(memoryDuelAction(one,'bee',1,pack(2,3),endAt)).toBeNull()
  const late=memoryDuelTick(one,endAt+9_000)
  expect(memoryDuelView(late,undefined,endAt+9_000)).toMatchObject({
   phase:'finished',deadline:null,result:{kind:'forfeit',winner:'ari',hands:[null,null]},
  })
  expect(memoryDuelTick(late,endAt+10_000)).toBe(late)
  expect(memoryDuelView(s,undefined,endAt+9_000)).toMatchObject({
   phase:'finished',deadline:null,result:{kind:'void',winner:null,hands:[null,null]},
  })
 })

 it('copies private inputs and returns isolated, filtered projections',()=>{
  const mutableInput={board:[...deal.board],community:[...deal.community] as [number,number,number]}
  const s=begin(mutableInput)
  mutableInput.board[0]=51
  mutableInput.community[0]=51
  const study=memoryDuelView(s,'ari',startAt)
  study.cards[0]=50
  expect(memoryDuelView(s,'ari',startAt).cards[0]).toBe(deal.board[0])
  const one=memoryDuelAction(s,'ari',1,pack(1,0),selectAt)!
  const my=memoryDuelView(one,'ari',selectAt)
  my.ownPicks!.splice(0)
  my.community[0]=51
  expect(memoryDuelView(one,'ari',selectAt)).toMatchObject({ownPicks:[0,1],community:deal.community})
  const end=memoryDuelAction(one,'bee',1,pack(2,3),selectAt)!
  const exposed=memoryDuelView(end,undefined,selectAt)
  exposed.result!.hands[0]!.picks[0].card=51
  expect(memoryDuelView(end,undefined,selectAt).result!.hands[0]!.picks[0].card).toBe(deal.board[0])
 })
})
