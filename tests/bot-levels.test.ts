import {expect,it} from 'vitest'
import {botAction,move,start,titles,view,type BotLevel,type Game} from '../src/engine'
import {Host,decode,defaults,humanOnly} from '../src/room'

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
 expect(games).toHaveLength(11)
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
