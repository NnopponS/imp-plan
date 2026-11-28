import {expect,it} from 'vitest'
import {Host,decode,nickname,seatRules} from '../src/room'
import type {Game} from '../src/engine'
import {appearanceCount,appearancePreset,legacyAppearance,lookToOutfit,outfitToLook} from '../src/wardrobe-look'
it('rejects malformed and spoofed messages; processes commands only once at a matching revision',()=>{
 const h=new Host('Host',()=>0)
 const a=h.join('connection','Ann')!
 expect(decode('{"type":"hello","name":"Ann","host":true}')).toBeNull()
 expect(h.command('stranger','a',h.rev,{kind:'start'})).toMatch(/seat/i)
 expect(h.command('connection','a',h.rev,{kind:'start'})).toMatch(/host/i)
 expect(h.command('connection','b',h.rev,{kind:'ready'})).toBeNull()
 const after=h.rev
 expect(h.command('connection','b',after-1,{kind:'ready'})).toBeNull()
 expect(h.rev).toBe(after)
 expect(h.command('connection','c',after-1,{kind:'ready'})).toMatch(/updated/i)
 expect(h.snapshot('connection')?.you).toBe(a.id)
})
it('a valid resume rotates the token and revokes the old connection',()=>{
 const h=new Host('Host',()=>0)
 const a=h.join('1','Ann')!
 expect(h.join('2','Ann','fake-resume-token')).toBeNull()
 expect(h.join('2','Not Ann',a.token)).toBeNull()
 const b=h.join('2','Ann',a.token)!
 expect(b.id).toBe(a.id)
 expect(b.token).not.toBe(a.token)
 expect(h.snapshot('1')).toBeNull()
 expect(h.snapshot('2')?.you).toBe(a.id)
 expect(h.join('3','Ann',a.token)).toBeNull()
})
it('normalizes guest names without allowing control characters',()=>{
 expect(nickname('  Ａnn  ')).toBe('Ann')
 expect(nickname('Ann\u000AHost')).toBeNull()
 expect(nickname('x'.repeat(25))).toBeNull()
})
it('fills 16 simulated human seats, rejects overflow, and finishes a sealed match',()=>{
 let time=1000
 const h=new Host('Host',()=>time)
 const settings={...h.settings,game:'auction' as const}
 expect(h.command('host','config',h.rev,{kind:'config',settings})).toBeNull()
 for(let i=1;i<16;i++){
  expect(h.join(String(i),'Guest '+i)).not.toBeNull()
  expect(h.command(String(i),'ready',h.rev,{kind:'ready'})).toBeNull()
 }
 expect(h.join('overflow','Late')).toBeNull()
 expect(h.command('host','start',h.rev,{kind:'start'})).toBeNull()
 expect(h.snapshot('15')?.game?.seats).toHaveLength(16)
 for(let round=1;round<=8;round++){
  expect(h.command('host','bid'+round,h.rev,{kind:'move',action:1000})).toBeNull()
  expect(h.snapshot('15')?.game?.mine).toBeNull()
  time+=26000;expect(h.tick()).toBe(true)
 }
 expect(h.snapshot('15')?.game?.winner).toBe(h.owner)
})
it('accepts concurrent bids against the same round without accepting a prior round',()=>{
 const h=new Host('Host',()=>1000)
 h.join('guest','Guest')
 h.command('guest','ready',h.rev,{kind:'ready'})
 h.command('host','config',h.rev,{kind:'config',settings:{...h.settings,game:'auction'}})
 h.command('host','start',h.rev,{kind:'start'})
 const simultaneous=h.rev
 expect(h.command('host','a',simultaneous,{kind:'move',action:1000,round:1})).toBeNull()
 expect(h.command('guest','b',simultaneous,{kind:'move',action:2000,round:1})).toBeNull()
 expect(h.command('guest','c',h.rev,{kind:'move',action:2000,round:1})).toMatch(/round/i)
 expect(h.snapshot('guest')?.game?.round).toBe(2)
})

it('automatically deals different appearances to all 16 seats and hides private seat fields',()=>{
 const room=new Host('Host',()=>10)
 expect(room.command('host','auction',room.rev,{kind:'config',settings:{...room.settings,game:'auction'}})).toBeNull()
 for(let i=1;i<16;i++)expect(room.join('p'+i,'Player '+i)).not.toBeNull()
 const publicSeats=room.snapshot('p15')!.seats
 const appearances=publicSeats.map(s=>s.appearance)
 expect(new Set(appearances).size).toBe(16)
 expect(appearances.every(n=>Number.isInteger(n)&&n!>=0&&n!<27)).toBe(true)
 expect(room.snapshot('host')!.seats).toEqual(publicSeats)
 for(const seat of publicSeats){expect(seat).not.toHaveProperty('token');expect(seat).not.toHaveProperty('connection')}
})

it('honors explicit presets, avoids their collisions on automatic assignment and never redresses a resumed seat',()=>{
 const room=new Host('Host',()=>10,false,0)
 expect(room.command('host','set-three',room.rev,{kind:'config',settings:{...room.settings,capacity:3}})).toBeNull()
 const manual=room.join('manual','Manual',undefined,0)!
 const fresh=room.join('fresh','Fresh')!
 const appearance=(id:string)=>room.snapshot('host')!.seats.find(seat=>seat.id===id)?.appearance
 expect(appearance(room.owner)).toBe(0)
 expect(appearance(manual.id)).toBe(0)
 const before=appearance(fresh.id)!
 expect(before).not.toBe(0)
 room.disconnect('fresh')
 expect(room.join('resumed','Fresh',fresh.token,(before+1)%27)?.id).toBe(fresh.id)
 expect(appearance(fresh.id)).toBe(before)
 expect(room.command('host','remove',room.rev,{kind:'kick',seat:fresh.id})).toBeNull()
 expect(room.join('try-again','Fresh',fresh.token)).toBeNull()
 expect(room.join('next','Next')).not.toBeNull()
 expect(room.snapshot('host')!.seats.at(-1)?.appearance).not.toBe(before)
})

it('reuses only currently vacant looks even after all 27 presets have been dealt',()=>{
 const room=new Host('Host',()=>10,false,26)
 expect(room.command('host','set-three',room.rev,{kind:'config',settings:{...room.settings,capacity:3}})).toBeNull()
 const persistent=room.join('persistent','Persistent')!
 const issued=new Set<number>(room.snapshot('host')!.seats.map(seat=>seat.appearance!))
 for(let i=0;i<40;i++){
  const fresh=room.join('p'+i,'Guest')!
  const seats=room.snapshot('host')!.seats
  expect(new Set(seats.map(seat=>seat.appearance)).size).toBe(3)
  if(i<25)expect(issued.has(seats.at(-1)!.appearance!)).toBe(false)
  issued.add(seats.at(-1)!.appearance!)
  expect(room.command('host','kick'+i,room.rev,{kind:'kick',seat:fresh.id})).toBeNull()
 }
 expect(issued.size).toBe(27)
 expect(room.snapshot('persistent')!.you).toBe(persistent.id)
 expect(room.command('host','bot',room.rev,{kind:'bot'})).toBeNull()
 expect(new Set(room.snapshot('host')!.seats.map(seat=>seat.appearance)).size).toBe(3)
})

it('accepts the legacy hello and sanitizes only the additive preset field',()=>{
 const hello={version:1,type:'hello',name:'Guest'}
 expect(decode(JSON.stringify(hello))).toEqual(hello)
 for(const appearance of [0,26])expect(decode(JSON.stringify({...hello,appearance}))).toEqual({...hello,appearance})
 for(const appearance of [-1,27,6.25,[],{},'12',null,false]){
  expect(decode(JSON.stringify({...hello,appearance}))).toMatchObject(hello)
  const parsed=decode(JSON.stringify({...hello,appearance}))
  expect(parsed?.type==='hello'?parsed.appearance:NaN).toBeUndefined()
 }
 expect(decode(JSON.stringify({...hello,appearance:4,host:true}))).toBeNull()
})

it('matches audited table limits for all choices, rather than falling back to a generic room',()=>{
 const gameRules={
  blind:[2,4],morris:[2,4],point:[2,4],equations:[2,4],wallGo:[2,4],bagh:[2,2],
  auction:[2,16],remove:[3,16],knight:[2,16],hex:[2,16],rectangles:[2,16],cubes:[2,16],exile:[2,16],
  grass1:[2,12],grass3:[2,16],mancala:[2,8],secret:[3,16],divine:[2,16],codeLock:[2,16],pyramid:[2,16],
  fragments:[2,8],spot:[2,16],scale:[2,6],fence:[2,16],tower:[2,8],piece:[2,4],memoryPoker:[2,16],montage:[2,16],heavy13:[2,7],colorLink:[2,2],symmetry:[2,16],threeRow:[3,4],tripleDice:[2,8],flags:[2,16],coopPuzzle:[2,16],gradation:[2,16],bigSmall:[2,2]
 } as const satisfies Record<Game,readonly [number,number]>
 for(const game of Object.keys(gameRules) as Game[]){
  const [min,max]=gameRules[game]
  expect(seatRules({game})).toMatchObject({min,max})
  const room=new Host('Host')
  expect(room.command('host','configure',room.rev,{kind:'config',settings:{...room.settings,game,capacity:16}})).toBeNull()
  expect(room.settings.capacity).toBe(max)
  expect(room.command('host','not-enough',room.rev,{kind:'start'})).toMatch(/more connected/i)
  for(let i=1;i<max;i++){
   expect(room.join('g'+i,'Guest '+i)).not.toBeNull()
   expect(room.command('g'+i,'ready',room.rev,{kind:'ready'})).toBeNull()
  }
  expect(room.join('blocked','Extra guest')).toBeNull()
  expect(room.command('host','seat-bot',room.rev,{kind:'bot'})).toMatch(/full/i)
  expect(room.command('host','start',room.rev,{kind:'start'})).toBeNull()
  expect(room.snapshot('host')?.game?.seats).toHaveLength(seatRules({game}).fixtureSize??max)
 }
 expect(seatRules({game:'memoryPoker',memoryPokerMode:'episode'})).toMatchObject({min:2,max:2})
 expect(seatRules({game:'auction',auctionMode:'hold'})).toMatchObject({min:2,max:16})
 expect(seatRules({game:'gradation'},true)).toEqual({min:2,max:2})
})

it('leaves a too-large party and disconnected reservations intact until the host removes a seat',()=>{
 const room=new Host('Host')
 expect(room.settings.capacity).toBe(2)
 expect(room.command('host','four-player-league',room.rev,{kind:'config',settings:{...room.settings,capacity:4}})).toBeNull()
 const guests=[1,2,3].map(i=>room.join('g'+i,'Guest '+i)!)
 room.disconnect('g1')
 expect(room.command('host','smaller',room.rev,{kind:'config',settings:{...room.settings,game:'bagh'}})).toMatch(/2 players.*remove/i)
 expect(room.settings.game).toBe('blind')
 expect(room.snapshot('host')!.seats).toHaveLength(4)
 expect(room.join('new','New')).toBeNull()
 expect(room.join('resume','Guest 1',guests[0].token)?.id).toBe(guests[0].id)
 for(const guest of guests.slice(1))expect(room.command('host','kick'+guest.id,room.rev,{kind:'kick',seat:guest.id})).toBeNull()
 expect(room.command('host','bagh',room.rev,{kind:'config',settings:{...room.settings,game:'bagh'}})).toBeNull()
 expect(room.settings.capacity).toBe(2)
 expect(room.join('late','Late')).toBeNull()
})

it('does not inherit a small cap into a larger game and caps private puzzle practice at one',()=>{
 const room=new Host('Host')
 expect(room.settings.capacity).toBe(2)
 expect(room.command('host','larger',room.rev,{kind:'config',settings:{...room.settings,game:'heavy13'}})).toBeNull()
 expect(room.settings.capacity).toBe(7)
 expect(room.command('host','lower-explicit',room.rev,{kind:'config',settings:{...room.settings,capacity:2}})).toBeNull()
 expect(room.settings.capacity).toBe(2)
 expect(room.command('host','secret',room.rev,{kind:'config',settings:{...room.settings,game:'secret'}})).toBeNull()
 expect(room.settings.capacity).toBe(16)
 const solo=new Host('Player',()=>0,true)
 expect(solo.settings.capacity).toBe(2)
 expect(solo.command('host','hex',solo.rev,{kind:'config',settings:{...solo.settings,game:'hex'}})).toBeNull()
 expect(seatRules({game:'hex'},true)).toMatchObject({min:1,max:1})
 expect(solo.settings.capacity).toBe(1)
 expect(solo.snapshot('host')!.seats).toHaveLength(1)
 expect(solo.join('remote','Guest')).toBeNull()
 expect(solo.command('host','start',solo.rev,{kind:'start'})).toBeNull()
})

it('keeps legacy appearance IDs readable and only accepts a richer look with wardrobe negotiation',()=>{
 const base={version:1,type:'hello',name:'Ash'}
 expect(decode(JSON.stringify({...base,appearance:17}))).toMatchObject({appearance:17})
 const advanced=550
 expect(decode(JSON.stringify({...base,appearance:advanced}))).toMatchObject({appearance:undefined})
 expect(decode(JSON.stringify({...base,appearance:advanced,wardrobe:2}))).toMatchObject({appearance:advanced,wardrobe:2})
 expect(decode(JSON.stringify({...base,appearance:advanced,wardrobe:3}))).toBeNull()
 const room=new Host('Host',()=>0,false,advanced)
 expect(room.snapshot('host')!.seats[0].appearance).toBe(advanced)
 const guest=room.join('wardrobe','Guest',undefined,540)!
 room.disconnect('wardrobe')
 expect(room.join('return','Guest',guest.token,570)?.id).toBe(guest.id)
 expect(room.snapshot('return')!.seats.find(s=>s.id===guest.id)?.appearance).toBe(540)
})

it('round trips all wardrobe choices to compact unique IDs without changing the legacy presets',()=>{
 expect(appearanceCount).toBe(1620)
 expect(lookToOutfit(17)).toMatchObject({mask:'raven',cloak:'midnight',clasp:'key',dye:'original',extra:'none'})
 const names=new Set()
 for(let n=0;n<appearanceCount;n++){
  const outfit=lookToOutfit(n)
  expect(outfitToLook(outfit)).toBe(n)
  expect(legacyAppearance(n)).toBeGreaterThanOrEqual(0)
  expect(legacyAppearance(n)).toBeLessThan(27)
  names.add(JSON.stringify(outfit))
 }
 expect(names.size).toBe(appearanceCount)
 expect(appearancePreset(appearanceCount)).toBeUndefined()
 expect(appearancePreset(Number.POSITIVE_INFINITY)).toBeUndefined()
})
