import {expect,it} from 'vitest'
import {botAction,move,start,titles,view,type BotLevel,type Game} from '../src/engine'
import {Host,decode,defaults,humanOnly} from '../src/room'
import {buyer,contactAction,guessAction} from "../src/secret"

const levels:BotLevel[]=['easy','normal','hard']
it('validates the difficulty on the wire, allows legacy configs and keeps the host in control',()=>{
 const h=new Host('Host',()=>1000)
 h.join('guest','Guest')
 expect(defaults.botLevel).toBe('normal')
 const packet=(level?:unknown)=>JSON.stringify({version:1,type:'command',epoch:h.epoch,match:'',seq:1,request:h.owner,rev:h.rev,
  command:{kind:'config',settings:{game:'blind',seconds:25,capacity:16,locked:false,...(level===undefined?{}:{botLevel:level})}}})
 for(const level of levels)expect(decode(packet(level))).not.toBeNull()
 expect(decode(packet())).not.toBeNull()
 expect(decode(packet('unbeatable'))).toBeNull()
 const config={kind:'config' as const,settings:{...defaults,botLevel:'hard' as const}}
 expect(h.command('guest','config',h.rev,config)).toMatch(/host/i)
 expect(h.command('host','config',h.rev,config)).toBeNull()
 expect(h.snapshot('guest')?.settings.botLevel).toBe('hard')
 expect(h.command('host','ready',h.rev,{kind:'bot'})).toBeNull()
 expect(h.command('guest','ready',h.rev,{kind:'ready'})).toBeNull()
 expect(h.command('host','start',h.rev,{kind:'start'})).toBeNull()
 expect(h.command('host','locked',h.rev,{kind:'config',settings:{...defaults,botLevel:'easy'}})).toMatch(/locked/i)
})

it('hard Blind Gomoku reconstructs a threat from public moves rather than reading the veiled board',()=>{
 let g=start('blind',['a','b'],25000,0,{seed:19})
 for(const [i,at] of [0,112,1,127,2,19,3].entries())g=move(g,i%2?'b':'a',at,i)!
 const v=view(g,'b')
 expect(v.board[3]).toBe('?')
 expect(botAction(v,'b',g.publicMoves,711,'hard')).toBe(4)
 expect(botAction(v,'b',g.publicMoves,711,'normal')).not.toBe(4)
 expect(g.board[4]).toBe('')
})

it('the selected level actually changes host-driven auction bids, not only the label',()=>{
 const host=(botLevel:BotLevel)=>{
  let time=1000
  const h=new Host('Host',()=>time,true)
  expect(h.command('host','config',h.rev,{kind:'config',settings:{...defaults,game:'auction',botLevel}})).toBeNull()
  expect(h.snapshot('host')?.seats.filter(seat=>seat.bot)).toHaveLength(1)
  expect(h.command('host','start',h.rev,{kind:'start'})).toBeNull()
  time+=800
  expect(h.tick()).toBe(true)
  return Object.values(h.game!.bids)[0]
 }
 expect(host('normal')).toBe(2500)
 expect(host('easy')).toBeLessThan(2500)
 expect(host('hard')).toBeGreaterThan(2500)
})

it('changing difficulty preserves the complete practice roster but swapping games reseats it',()=>{
 const h=new Host('Host',()=>0,true)
 expect(h.command('host','auction',h.rev,{kind:'config',settings:{...defaults,game:'auction'}})).toBeNull()
 for(let i=0;i<3;i++)expect(h.command('host','add'+i,h.rev,{kind:'bot'})).toBeNull()
 const seatIds=h.snapshot('host')!.seats.map(s=>s.id)
 expect(seatIds).toHaveLength(5)
 expect(h.command('host','difficulty',h.rev,{kind:'config',settings:{...h.settings,botLevel:'hard'}})).toBeNull()
 expect(h.snapshot('host')!.seats.map(s=>s.id)).toEqual(seatIds)
 expect(h.command('host','new-game',h.rev,{kind:'config',settings:{...h.settings,game:'fence'}})).toBeNull()
 expect(h.snapshot('host')!.seats.map(s=>s.id)).toEqual([h.owner])
})

it('every game offering AI has legal deterministic opening choices at all three levels',()=>{
 const games=(Object.keys(titles) as Game[]).filter(game=>!humanOnly(game))
 expect(games).toHaveLength(12)
 for(const game of games){
  const seats=(game==='remove'||game==='secret')?['a','b','c']:['a','b']
  const g=start(game,seats,25000,0,{seed:733})
  for(const level of levels){
   const v=view(g,'a')
   const a=botAction(v,'a',g.publicMoves,19,level)
   expect(a,game+' '+level).toBeDefined()
   expect(move(g,'a',a!,1),game+' '+level).not.toBeNull()
   expect(botAction(v,'a',g.publicMoves,19,level),game+' '+level).toEqual(a)
  }
 }
})

it('hard Equation Lights uses its own feedback and never replays a guess',()=>{
 const g0=start('equations',['a','b'],25000,0)
 let g=move(g0,'a','12+13=25',1)!
 g=move(g,'b','12+19=31',2)!
 g=move(g,'a','10+17=27',3)!
 g=move(g,'b','19+17=36',4)!
 g=move(g,'a','10+18=28',5)!
 const legalGuess=botAction(view(g,'b'),'b',[],77,'hard')
 expect(typeof legalGuess).toBe('string')
 expect(legalGuess).not.toBe('19+17=36')
 expect(move(g,'b',legalGuess!,6)).not.toBeNull()
})

it('Secret Number retries other visible contacts after blocked intents without jumping a tick',()=>{
 let time=1000
 const h=new Host('A',()=>time)
 expect(h.command('host','config',h.rev,{kind:'config',settings:{...defaults,game:'secret'}})).toBeNull()
 expect(h.join('b','B')).not.toBeNull()
 expect(h.command('host','add-c',h.rev,{kind:'bot'})).toBeNull()
 for(const guest of ['d','e','f'])expect(h.join(guest,guest)).not.toBeNull()
 for(const guest of ['b','d','e','f'])expect(h.command(guest,'ready',h.rev,{kind:'ready'})).toBeNull()
 expect(h.command('host','start',h.rev,{kind:'start'})).toBeNull()
 expect(h.command('host','sum-a',h.rev,{kind:'move',action:contactAction(0,1,0)})).toBeNull()
 expect(h.command('b','sum-b',h.rev,{kind:'move',action:contactAction(1,0,0)})).toBeNull()
 const revision=h.rev
 time+=650
 expect(h.tick()).toBe(false) // Bot C's offer to A has been rejected.
 expect(h.rev).toBe(revision)
 time+=200
 expect(h.tick()).toBe(false) // B also ran out of this ticket.
 expect(h.rev).toBe(revision)
 time+=200
 expect(h.tick()).toBe(true)
 expect(h.game!.secret!.offers).toContainEqual({from:2,to:3,ticket:0})
 expect(h.command('host','refill',h.rev,{kind:'move',action:buyer})).toBeNull()
 expect(h.command('host','invite-c',h.rev,{kind:'move',action:contactAction(0,2,0)})).toBeNull()
 time+=200
 expect(h.tick()).toBe(true) // The numeric action matches the rejected offer, but this is now an acceptance.
 expect(h.game!.secret!.clues[2]).toEqual(expect.arrayContaining([expect.objectContaining({other:0,ticket:0})]))
})

it('does not retry acceptance of an unchanged offer whose sender spent their last ticket',()=>{
 let time=1000
 const h=new Host('A',()=>time)
 expect(h.command('host','config',h.rev,{kind:'config',settings:{...defaults,game:'secret'}})).toBeNull()
 expect(h.join('b','B')).not.toBeNull()
 expect(h.command('host','add-c',h.rev,{kind:'bot'})).toBeNull()
 for(const guest of ['d','e','f'])expect(h.join(guest,guest)).not.toBeNull()
 for(const guest of ['b','d','e','f'])expect(h.command(guest,'ready',h.rev,{kind:'ready'})).toBeNull()
 expect(h.command('host','start',h.rev,{kind:'start'})).toBeNull()
 expect(h.command('host','pending',h.rev,{kind:'move',action:contactAction(0,2,0)})).toBeNull()
 expect(h.command('host','sum-a',h.rev,{kind:'move',action:contactAction(0,1,0)})).toBeNull()
 expect(h.command('b','sum-b',h.rev,{kind:'move',action:contactAction(1,0,0)})).toBeNull()
 time+=650;expect(h.tick()).toBe(false)
 time+=200;expect(h.tick()).toBe(false)
 time+=200;expect(h.tick()).toBe(true)
 expect(h.game!.secret!.offers).toContainEqual({from:2,to:3,ticket:0})
})

it('runs all Secret Number phases with a full room of humans and bots',()=>{
 let time=1000
 const h=new Host('Host',()=>time,true)
 expect(h.command('host','config',h.rev,{kind:'config',settings:{...defaults,game:'secret',botLevel:'hard'}})).toBeNull()
 for(let i=0;i<13;i++)expect(h.command('host','add'+i,h.rev,{kind:'bot'})).toBeNull()
 expect(h.snapshot('host')!.seats).toHaveLength(16)
 expect(h.command('host','start',h.rev,{kind:'start'})).toBeNull()
 for(let round=1;round<=4;round++){
  for(let i=0;i<90;i++){time+=200;h.tick()}
  expect(h.game!.secret!.tickets.flat().every(n=>n>=0)).toBe(true)
  time=h.game!.deadline
  expect(h.tick()).toBe(true)
 }
 expect(h.game!.secret!.clues.slice(1).every(clues=>clues.length>=2)).toBe(true)
 expect(h.game!.secret!.phase).toBe('guess')
 time+=800;expect(h.tick()).toBe(true)
 expect(h.game!.secret!.guesses.slice(1).filter(Boolean)).toHaveLength(15)
 expect(h.command('host','guess',h.rev,{kind:'move',action:guessAction(42,null,null)})).toBeNull()
 expect(h.game!.done).toBe(true)
})

it('practice switches from a full 16-seat auction to Mancala and returns to 16-seat capacity',()=>{
 const h=new Host('Host',()=>0,true)
 expect(h.command('host','auction',h.rev,{kind:'config',settings:{...defaults,game:'auction'}})).toBeNull()
 for(let i=0;i<14;i++)expect(h.command('host','add'+i,h.rev,{kind:'bot'})).toBeNull()
 expect(h.snapshot('host')!.seats).toHaveLength(16)
 expect(h.command('host','mancala',h.rev,{kind:'config',settings:{...h.settings,game:'mancala'}})).toBeNull()
 expect(h.snapshot('host')!.seats).toHaveLength(2)
 expect(h.settings.capacity).toBe(8)
 expect(h.command('host','auction-again',h.rev,{kind:'config',settings:{...h.settings,game:'auction'}})).toBeNull()
 expect(h.settings.capacity).toBe(16)
 expect(h.snapshot('host')!.seats).toHaveLength(2)
 for(let i=0;i<14;i++)expect(h.command('host','new-add'+i,h.rev,{kind:'bot'})).toBeNull()
 const roster=h.snapshot('host')!.seats
 expect(h.command('host','hard',h.rev,{kind:'config',settings:{...h.settings,botLevel:'hard'}})).toBeNull()
 expect(h.snapshot('host')!.seats).toEqual(roster)
})

it('uses post-reset headcount in practice only, never discarding online room guests',()=>{
 const h=new Host('Host',()=>0,false)
 for(let i=1;i<10;i++)expect(h.join('c'+i,'Guest '+i)).not.toBeNull()
 const old=h.snapshot('host')!.seats
 expect(h.command('host','mancala',h.rev,{kind:'config',settings:{...defaults,game:'mancala'}})).toMatch(/eight/i)
 expect(h.snapshot('host')!.seats).toEqual(old)
})

it('hard auction bots do not all commit the same amount at a 16-seat table',()=>{
 const seats=Array.from({length:16},(_,i)=>'p'+i)
 const g=start('auction',seats,25000,0)
 const bids=seats.map(s=>botAction(view(g,s),s,[],733,'hard'))
 expect(new Set(bids).size).toBe(16)
 for(const [i,bid] of bids.entries())expect(move(g,seats[i],bid!,1)).not.toBeNull()
 let match=g,unequal=0
 for(let round=1;round<=8;round++){
  const roundBids=seats.map(s=>botAction(view(match,s),s,[],733,'hard')!)
  unequal+=Number(new Set(roundBids).size>1)
  for(const [i,bid] of roundBids.entries()){
   const next=move(match,seats[i],bid,round)
   expect(next).not.toBeNull()
   match=next!
  }
 }
 expect(unequal).toBeGreaterThan(1)
 expect(match.done).toBe(true)
})

it('easy Point and Morris do not repeatedly select the same legal-action ordinal',()=>{
 for(const game of ['point','morris'] as const){
  let g=start(game,['a','b'],25000,0)
  const indexes=new Set<number>()
  for(let ply=0;ply<12&&!g.done;ply++){
   const seat=g.seats[g.turn],v=view(g,seat)
   const a=botAction(v,seat,[],233,'easy')!
   if(seat==='a')indexes.add(v.legal.findIndex(l=>l===a))
   const next=move(g,seat,a,ply)
   expect(next).not.toBeNull()
   g=next!
  }
  expect(indexes.size,game).toBeGreaterThan(2)
 }
})
