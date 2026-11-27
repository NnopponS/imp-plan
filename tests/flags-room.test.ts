import {expect,test} from 'vitest'
import {decode,Host,type Command} from '../src/room'

function table(solo=false, mode:'recall'|'names'='recall', players=3){
 let now=1000,nonce=0
 const host=new Host('Mapmaker',()=>now,solo)
 const tell=(who:string,cmd:Command,rev=host.rev)=>host.command(who,'dispatch-'+(++nonce),rev,cmd)
 expect(tell('host',{kind:'config',settings:{...host.settings,game:'flags',flagsMode:mode,capacity:players}})).toBeNull()
 const joins=new Map()
 if(!solo)for(let i=1;i<players;i++){
  const key='g'+i
  const joined=host.join(key,'Reader '+i)
  expect(joined).not.toBeNull()
  joins.set(key,joined!)
  expect(tell(key,{kind:'ready'})).toBeNull()
 }
 expect(tell('host',{kind:'start'})).toBeNull()
 const snap=(key='host')=>host.snapshot(key)!
 const v=(key='host')=>snap(key).game!.flags!
 const lock=(key:string,choices:number[],rev=host.rev)=>tell(key,{kind:'flags-lock',match:host.match,choices},rev)
 function tickAt(n:number){now=n;return host.tick()}
 function advanceWithoutTick(n:number){now=n}
 return {host,tell,joins,snap,v,lock,tickAt,advanceWithoutTick}
}

test('three authenticated seats study the same cards, but only see their own sealed answer before reveal',()=>{
 const {host,snap,v,lock,tickAt,tell}=table()
 const cards=v().study.map(c=>c.code)
 expect(v('g1').study.map(c=>c.code)).toEqual(cards)
 expect(cards).toHaveLength(12)
 expect(v().options).toEqual([])
 expect(lock('host',[0])).not.toBeNull()
 expect(tickAt(v().deadline!)).toBe(true)
 const key=v().options.flatMap((c,i)=>cards.includes(c.code)?[i]:[])
 expect(v().options).toHaveLength(20)
 expect(v().study).toEqual([])
 expect(v().solutions).toBeNull()
 expect(v().results).toBeNull()
 expect(key).toHaveLength(12)
 const rev=host.rev
 expect(lock('host',[key[0],key[0]])).not.toBeNull()
 expect(tell('host',{kind:'flags-lock',match:'0'.repeat(32),choices:key})).not.toBeNull()
 expect(lock('host',key)).toBeNull()
 expect(host.rev).toBe(rev)
 expect(v().ownChoices).toEqual(key)
 expect(v('g1').ownChoices).toBeNull()
 expect(v('g1').solutions).toBeNull()
 expect(v('g1').results).toBeNull()
 expect(lock('g1',[key[0]],rev)).toBeNull()
 expect(lock('g2',[key[1]],rev)).toBeNull()
 expect(host.rev).toBeGreaterThan(rev)
 expect(v().phase).toBe('done')
 expect(v().leaders).toEqual([snap().you])
 expect(v().results?.find(r=>r.seat===snap().you)).toMatchObject({points:12,hits:12,misses:0})
 expect(snap().game!.scores).toEqual([12,1,1])
})
test('a disconnect cannot stall a 16-seat room, and a deadline locks all unsubmitted scores',()=>{
 const {host,snap,v,lock,tickAt}=table(false,'recall',16)
 expect(v().players).toBe(16)
 host.disconnect('g15')
 expect(tickAt(v().deadline!+200)).toBe(true)
 expect(v().phase).toBe('answer')
 expect(v().deadline).toBe(101200)
 const end=v().deadline!
 expect(tickAt(end)).toBe(true)
 expect(v().phase).toBe('done')
 expect(v().results).toHaveLength(16)
 expect(v().results?.every(r=>r.points===0&&r.elapsed===null)).toBe(true)
 expect(lock('host',[0])).not.toBeNull()
 expect(snap().seriesDone).toBe(true)
})
test('solo name matching preserves the private mode, prohibits bots, and rejects malformed wire commands',()=>{
 const {host,snap,v,lock,tickAt}=table(true,'names',1)
 const names=new Map(v().study.map(c=>[c.name,c.code]))
 expect(snap().seats).toHaveLength(1)
 expect(v().mode).toBe('names')
 expect(tickAt(v().deadline!)).toBe(true)
 const key=v().names.map(name=>v().options.findIndex(c=>c.code===names.get(name)))
 expect(key.every(i=>i>=0)).toBe(true)
 expect(lock('host',[0])).not.toBeNull()
 const packet=(choices:unknown,extra={})=>JSON.stringify({version:1,type:'command',epoch:host.epoch,match:host.match,seq:1,request:host.epoch,rev:host.rev,command:{kind:'flags-lock',match:host.match,choices,...extra}})
 expect(decode(packet(key))).not.toBeNull()
 for(const bad of [[],Array(13).fill(0),[20],[-2],['1'],[0.5]])expect(decode(packet(bad))).toBeNull()
 expect(decode(packet([0],{seat:host.owner}))).toBeNull()
 expect(lock('host',key)).toBeNull()
 expect(v().results?.[0]).toMatchObject({points:12,hits:12,misses:0})
 expect(snap().seriesDone).toBe(true)
})

test('reconnecting through a stale host never projects named study cards beyond the deadline',()=>{
 const {host,v,advanceWithoutTick,tickAt}=table(false,'names',2)
 const cut=v().deadline!
 advanceWithoutTick(cut+5_000)
 expect(v('g1')).toMatchObject({phase:'study',study:[],options:[]})
 expect(tickAt(cut+5_000)).toBe(true)
 expect(v('g1')).toMatchObject({phase:'answer',deadline:cut+65_000})
 expect(host.snapshot('g1')!.game!.flags!.options).toHaveLength(20)
})
