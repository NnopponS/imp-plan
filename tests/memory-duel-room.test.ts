import {expect,it} from 'vitest'
import {Host} from '../src/room'
import {memoryDuelPack} from '../src/memory-duel'
let configCount=0
const config=(h:Host,episode=true)=>h.command('host','config-'+ ++configCount,h.rev,{kind:'config',settings:{...h.settings,game:'memoryPoker',memoryPokerMode:episode?'episode':'fan'}})
const send=(h:Host,who:string,request:string,action:number,deal=1)=>h.command(who,request,h.rev,{kind:'memory-lock',deal,action})

it('keeps fan mode available; only exactly two connected humans may enter the episode-style duel',()=>{
 const solo=new Host('Solo',()=>0,true)
 expect(config(solo)).toMatch(/two connected human/i)
 expect(config(solo,false)).toBeNull()
 expect(solo.command('host','solo-start',solo.rev,{kind:'start'})).toBeNull()
 expect(solo.snapshot('host')?.game?.memoryPoker).not.toBeNull()
 const h=new Host('Ari fourth',()=>0)
 expect(config(h,false)).toBeNull()
 expect(config(h)).toMatch(/two connected human/i)
 h.join('a','Bee');h.join('b','Cee')
 expect(config(h)).toMatch(/two connected human/i)
 h.command('host','remove',h.rev,{kind:'kick',seat:h.snapshot('b')!.you})
 expect(config(h)).toBeNull()
 expect(h.join('late','Cee')).toBeNull()
 h.disconnect('a')
 expect(h.command('host','start',h.rev,{kind:'start'})).toMatch(/two connected human/i)
 expect(config(h,false)).toBeNull()
 expect(h.join('late','Cee')).not.toBeNull()
})

it('keeps the first pick from other snapshots including shared revision, and redeals after a visible tie',()=>{
 let now=1000
 const h=new Host('Ari',()=>now)
 h.join('guest','Bee')
 expect(config(h)).toBeNull()
 expect(h.command('guest','ready',h.rev,{kind:'ready'})).toBeNull()
 now+=70_000
 expect(h.tick()).toBe(false)
 expect(h.snapshot('host')?.game).toBeNull()
 expect(h.command('host','enter',h.rev,{kind:'start'})).toBeNull()
 const study=h.snapshot('guest')!.game!.memoryDuel!
 expect(study.deadline).toBe(now+20_000)
 expect(study.cards.filter(x=>x!==null)).toHaveLength(16)
 expect(study.community).toEqual([])
 now+=20_000
 expect(h.tick()).toBe(true)
 const publicBefore=h.snapshot('guest')!
 expect(publicBefore.game!.memoryDuel!.cards).toEqual(Array(16).fill(null))
 expect(publicBefore.game!.memoryDuel!.community).toHaveLength(3)
 expect(send(h,'host','first',memoryDuelPack([0,1])!)).toBeNull()
 expect(h.rev).toBe(publicBefore.rev)
 expect(h.snapshot('guest')).toEqual(publicBefore)
 expect(h.snapshot('host')?.game?.memoryDuel?.ownPicks).toEqual([0,1])
 expect(send(h,'guest','second',memoryDuelPack([0,1])!)).toBeNull()
 expect(h.snapshot('guest')?.game?.memoryDuel).toMatchObject({phase:'tie',result:{kind:'tie',winner:null}})
 now+=3_600
 expect(h.tick()).toBe(true)
 expect(h.snapshot('guest')?.game?.memoryDuel).toMatchObject({phase:'study',dealNumber:2,deadline:now+20_000,ownPicks:null,result:null})
 expect(h.snapshot('guest')?.game?.memoryDuel?.cards).not.toEqual(study.cards)
 now+=20_000
 expect(send(h,'guest','stale',memoryDuelPack([0,2])!,1)).toMatch(/deal/i)
 expect(h.command('host','generic',h.rev,{kind:'move',round:2,action:memoryDuelPack([0,2])!})).not.toBeNull()
 expect(h.tick()).toBe(true)
 expect(send(h,'guest','valid',memoryDuelPack([0,2])!,2)).toBeNull()
 now+=60_000
 expect(h.tick()).toBe(true)
 expect(h.snapshot('guest')?.game?.memoryDuel?.result).toMatchObject({kind:'forfeit',hands:[null,null]})
})

for (const first of ['host','guest']) it('whole opponent room snapshot invariant at first lock ('+first+'), resume owns only its seat and timers respect exact boundaries',()=>{
 let now=1000; const h=new Host('Owner',()=>now);const g=h.join('guest','Player')!
 h.command('host','cfg',h.rev,{kind:'config',settings:{...h.settings,game:'memoryPoker',memoryPokerMode:'episode'}})
 h.command('guest','ready',h.rev,{kind:'ready'}); h.command('host','begin',h.rev,{kind:'start'})
 const opp=first==='host'?'guest':'host'
 now+=19_999; expect(h.tick()).toBe(false);expect(h.snapshot(opp)?.game?.memoryDuel?.cards.filter(c=>c!==null)).toHaveLength(16)
 now++;expect(h.snapshot(opp)?.game?.memoryDuel?.cards).toEqual(Array(16).fill(null));expect(h.tick()).toBe(true)
 const before=h.snapshot(opp),v=h.rev
 expect(h.command(first,'first',v,{kind:'memory-lock',deal:1,action:memoryDuelPack([4,11])!})).toBeNull()
 expect(h.rev).toBe(v);expect(h.snapshot(opp)).toStrictEqual(before);expect(h.snapshot(first)?.game?.memoryDuel?.ownPicks).toEqual([4,11])
 h.disconnect('guest');expect(h.snapshot('guest')).toBeNull();expect(h.join('noToken','Player')).toBeNull()
 const resumed=h.join('again','Player',g.token)!;expect(resumed.id).toBe(g.id);expect(resumed.token).not.toBe(g.token)
 expect(h.snapshot('again')?.game?.memoryDuel?.ownPicks).toEqual(first==='guest'?[4,11]:null)
 expect(h.snapshot('host')?.game?.memoryDuel?.ownPicks).toEqual(first==='host'?[4,11]:null)
 expect(h.command(opp==='guest'?'again':opp,'last',h.rev,{kind:'memory-lock',deal:1,action:memoryDuelPack([4,11])!})).toBeNull()
 const tie=h.snapshot('host')!; expect(tie.game?.memoryDuel?.result?.kind).toBe('tie')
 now+=3499;expect(h.tick()).toBe(false);now++;expect(h.tick()).toBe(true);const next=h.snapshot('host')!
 expect(next.game?.memoryDuel).toMatchObject({phase:'study',dealNumber:2,result:null,community:[],ownPicks:null,deadline:now+20_000})
 now+=80_000;expect(h.snapshot('again')?.game?.memoryDuel?.result).toMatchObject({kind:'void',winner:null,hands:[null,null]});expect(h.tick()).toBe(true);expect(h.snapshot('again')?.seriesDone).toBe(true)
})

for(const seat of ['host','guest'])it('commits the public select phase before sealing the first pair at the deadline: '+seat,()=>{
 let now=1000;const h=new Host('Ari',()=>now)
 h.join('guest','Bee')
 expect(config(h)).toBeNull()
 expect(h.command('guest','ready',h.rev,{kind:'ready'})).toBeNull()
 expect(h.command('host','start',h.rev,{kind:'start'})).toBeNull()
 const other=seat==='host'?'guest':'host',pair=memoryDuelPack([0,1])!
 now+=19_999
 expect(send(h,seat,'early',pair)).toBe('Wait for the selection phase.')
 now++
 const before=h.snapshot(other)!
 expect(h.game?.memoryDuel?.phase).toBe('study')
 expect(before.game?.memoryDuel).toMatchObject({phase:'select',ownPicks:null,cards:Array(16).fill(null)})
 expect(send(h,seat,'at-deadline',pair)).toBeNull()
 expect(h.game?.memoryDuel?.phase).toBe('select')
 expect(h.rev).toBe(before.rev+1)
 expect(h.snapshot(other)).toEqual({...before,rev:before.rev+1})
 expect(h.snapshot(seat)?.game?.memoryDuel?.ownPicks).toEqual([0,1])
 expect(h.command(seat,'at-deadline',before.rev,{kind:'memory-lock',deal:1,action:pair})).toBeNull()
 expect(h.rev).toBe(before.rev+1)
 expect(h.tick()).toBe(false)
})

it('publishes an expired duel even when the first lock is rejected',()=>{
 let now=0;const h=new Host('Ari',()=>now)
 h.join('guest','Bee')
 expect(config(h)).toBeNull()
 expect(h.command('guest','ready',h.rev,{kind:'ready'})).toBeNull()
 expect(h.command('host','start',h.rev,{kind:'start'})).toBeNull()
 now=80_000
 const rev=h.rev
 expect(send(h,'guest','late',memoryDuelPack([0,1])!)).toBe('Wait for the selection phase.')
 expect(h.rev).toBe(rev+1)
 expect(h.game?.memoryDuel?.result?.kind).toBe('void')
 expect(h.snapshot('host')?.game?.memoryDuel).toMatchObject({phase:'finished',ownPicks:null,result:{kind:'void',hands:[null,null]}})
 expect(h.tick()).toBe(false)
})
