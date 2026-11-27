import {describe,expect,it} from 'vitest'
import {Host,decode,id,type Command} from '../src/room'

const cmd=(h:Host,who:string,command:Command,rev=h.rev)=>h.command(who,id(),rev,command)
const configure=(h:Host,auctionMode?:'sealed'|'hold')=>cmd(h,'host',{kind:'config',settings:{...h.settings,game:'auction',auctionMode}})
const setup=()=>{
 let now=1000
 const h=new Host('House',()=>now)
 expect(configure(h,'hold')).toBeNull()
 const guest=h.join('guest','Guest')!
 const observer=h.join('observer','Observer')!
 return {h,guest,observer,at:(n:number)=>{now=n},begin:()=>{
  expect(configure(h,'hold')).toBeNull()
  expect(cmd(h,'guest',{kind:'ready'})).toBeNull()
  expect(cmd(h,'observer',{kind:'ready'})).toBeNull()
  expect(cmd(h,'host',{kind:'start'})).toBeNull()
  return h.snapshot('host')!.game!.timeHold!.bidAt
 }}
}
const action=(h:Host,who:string,action:'hold'|'pulse'|'release',round=1,rev=h.rev)=>cmd(h,who,{kind:'time-hold',round,action},rev)
const game=(h:Host,who:string)=>h.snapshot(who)!.game!.timeHold!

describe('Time Auction room mode',()=>{
 it('keeps solo with bots and the default sealed eight-round engine',()=>{
  let now=0
  const h=new Host('Solo',()=>now,true)
  expect(configure(h,'hold')).toMatch(/connected human/i)
  expect(configure(h)).toBeNull()
  expect(cmd(h,'host',{kind:'start'})).toBeNull()
  expect(h.snapshot('host')?.game?.timeHold).toBeNull()
  expect(h.snapshot('host')?.game?.credits).toEqual([60_000,60_000])
  expect(action(h,'host','hold')).not.toBeNull()
  expect(cmd(h,'host',{kind:'move',round:1,action:1000})).toBeNull()
  for(let i=0;i<8;i++){now+=25_000;expect(h.tick()).toBe(true)}
  expect(h.snapshot('host')?.game).toMatchObject({done:true,round:8})
 })
 it('allows a host to prepare hold mode before guests arrive but never starts it with bots or offline seats',()=>{
  const h=new Host('House',()=>0)
  expect(cmd(h,'host',{kind:'bot'})).toBeNull()
  expect(configure(h,'hold')).toMatch(/remove.*bot/i)
  expect(cmd(h,'host',{kind:'kick',seat:h.snapshot('host')!.seats[1].id})).toBeNull()
  expect(configure(h,'hold')).toBeNull()
  expect(cmd(h,'host',{kind:'bot'})).toMatch(/human/i)
  expect(cmd(h,'host',{kind:'start'})).toMatch(/connected.*ready/i)
  expect(h.join('new','Guest')).not.toBeNull()
  expect(cmd(h,'new',{kind:'ready'})).toBeNull()
  h.disconnect('new')
  expect(cmd(h,'host',{kind:'start'})).toMatch(/connected.*ready/i)
 })
 it('strictly parses round/action only, and rejects fan bids, wrong rounds, or future revisions',()=>{
  const {h,begin}=setup()
  begin()
  const command={kind:'time-hold',round:1,action:'hold'}
  const raw=(c:object)=>JSON.stringify({version:1,type:'command',epoch:h.epoch,match:h.match,seq:1,request:id(),rev:h.rev,command:c})
  expect(decode(raw(command))).toMatchObject({command})
  for(const invalid of [{...command,hostNow:10},{...command,seat:h.owner},{...command,elapsed:50},{...command,round:20}])expect(decode(raw(invalid))).toBeNull()
  expect(action(h,'guest','hold',2)).not.toBeNull()
  expect(action(h,'guest','hold',1,h.rev+1)).not.toBeNull()
  expect(cmd(h,'guest',{kind:'move',round:1,action:5000})).not.toBeNull()
  expect(action(h,'guest','hold',1,h.rev-1)).toBeNull()
 })
 it('does not change public revision or another snapshot for privately armed, pulsed or released bids',()=>{
  const {h,at,begin,guest}=setup()
  const bidAt=begin()
  at(bidAt-10)
  const before=h.snapshot('observer')
  expect(action(h,'guest','hold')).toBeNull()
  expect(game(h,'guest').mine?.status).toBe('holding')
  expect(h.snapshot('observer')).toEqual(before)
  expect(action(h,'host','hold')).toBeNull()
  expect(h.snapshot('observer')).toEqual(before)
  at(bidAt);expect(h.tick()).toBe(true)
  for(let i=1;i<6;i++){
   at(bidAt+i*1000)
   const before=h.snapshot('observer')
   expect(action(h,'guest','pulse')).toBeNull()
   expect(action(h,'host','pulse')).toBeNull()
   expect(h.snapshot('observer')).toEqual(before)
   expect(h.tick()).toBe(false)
  }
  at(bidAt+5300)
  const live=h.snapshot('observer')!
  expect(action(h,'host','release')).toBeNull()
  expect(h.snapshot('observer')).toEqual(live)
  at(bidAt+5500)
  const rev=h.rev
  expect(cmd(h,'observer',{kind:'chat',text:'Still sealed'})).toBeNull()
  expect(action(h,'guest','release',1,rev)).toBeNull()
  expect(game(h,'observer')).toMatchObject({phase:'live',history:[]})
  expect(h.tick()).toBe(true)
  expect(h.tick()).toBe(false)
  expect(game(h,'observer')).toMatchObject({phase:'review',last:{winner:guest.id,elapsedTenths:55}})
  const projection=h.snapshot('observer')!.game!
  expect(projection).toMatchObject({mine:null,submitted:0,credits:[],last:null})
  expect(JSON.stringify(projection)).not.toMatch(/leaseUntil|lastHostAt|"slots"|"reserve"/)
 })
 it('forfeits an interrupted hold on immediate token replacement and routes private expiry only to that seat',()=>{
  const {h,at,begin,guest}=setup()
  const bidAt=begin()
  at(bidAt-10)
  for(const who of ['guest','host','observer'])expect(action(h,who,'hold')).toBeNull()
  at(bidAt);expect(h.tick()).toBe(true)
  for(let i=1;i<=5;i++){
   at(bidAt+i*1000)
   for(const who of ['guest','host',...(i<=3?['observer']:[])])expect(action(h,who,'pulse')).toBeNull()
  }
  at(bidAt+6000)
  expect(action(h,'host','pulse')).toBeNull()
  expect(h.join('reconnected','Guest',guest.token)?.old).toBe('guest')
  h.disconnect('guest')
  expect(game(h,'reconnected').mine?.status).toBe('closed')
  expect(action(h,'reconnected','hold')).not.toBeNull()
  expect(action(h,'reconnected','release')).not.toBeNull()
  at(bidAt+6500)
  const rev=h.rev
  expect(h.tick()).toBe(false)
  expect(h.rev).toBe(rev)
  expect(h.takeTimeHoldUpdates()).toEqual(['observer'])
  expect(game(h,'observer').mine?.status).toBe('closed')
  at(bidAt+6600)
  expect(action(h,'host','release')).toBeNull()
  expect(h.tick()).toBe(true)
  expect(game(h,'observer').last).toEqual({round:1,winner:h.owner,elapsedTenths:66})
  at(game(h,'observer').nextAt!);expect(h.tick()).toBe(true)
  expect(action(h,'reconnected','hold',2)).toBeNull()
  expect(action(h,'observer','hold',2)).toBeNull()
  at(game(h,'observer').bidAt);expect(h.tick()).toBe(true)
  expect(game(h,'reconnected').mine?.remainingTenths).toBe(5940)
  expect(game(h,'observer').mine?.remainingTenths).toBe(5935)
 })
 it('never skips a public review when the host wakes after the last release',()=>{
  const {h,at,begin,guest}=setup()
  const bidAt=begin()
  at(bidAt-10);expect(action(h,'guest','hold')).toBeNull()
  at(bidAt);expect(h.tick()).toBe(true)
  for(let i=1;i<=5;i++){at(bidAt+i*1000);expect(action(h,'guest','pulse')).toBeNull()}
  at(bidAt+5200);expect(action(h,'guest','release')).toBeNull()
  expect(game(h,'observer').phase).toBe('live')
  at(bidAt+60_000);expect(h.tick()).toBe(true)
  expect(game(h,'observer')).toMatchObject({phase:'review',round:1,nextAt:bidAt+63_500,last:{winner:guest.id,elapsedTenths:52}})
  at(bidAt+63_499);expect(h.tick()).toBe(false)
  at(bidAt+63_500);expect(h.tick()).toBe(true)
  expect(game(h,'observer')).toMatchObject({phase:'arming',round:2})
 })
 it('settles all nineteen quiet rounds without network activity and rematches with a new match id and empty score',()=>{
  const {h,at,begin}=setup()
  begin()
  const match=h.match
  for(let round=1;round<=19;round++){
   expect(game(h,'host')).toMatchObject({phase:'arming',round})
   at(game(h,'host').bidAt+5000);expect(h.tick()).toBe(true)
   expect(game(h,'host').last).toEqual({round,winner:null,elapsedTenths:0})
   at(game(h,'host').nextAt!);expect(h.tick()).toBe(true)
  }
  expect(h.snapshot('host')).toMatchObject({seriesDone:true,game:{done:true,winner:null,timeHold:{phase:'finished',ranks:[[h.owner,h.snapshot('guest')!.you,h.snapshot('observer')!.you]]}}})
  expect(cmd(h,'host',{kind:'next'})).toBeNull()
  expect(h.match).not.toBe(match)
  expect(game(h,'host')).toMatchObject({phase:'arming',round:1,history:[]})
 })
})
