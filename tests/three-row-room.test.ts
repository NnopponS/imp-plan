import {expect,test} from 'vitest'
import {Host,decode,type Command} from '../src/room'

function table(solo=false){
 let now=1000,nonce=0
 const h=new Host('Ada',()=>now,solo)
 const send=(who:string,command:Command,rev=h.rev)=>h.command(who,'rows-'+(++nonce),rev,command)
 expect(send('host',{kind:'config',settings:{...h.settings,game:'threeRow',capacity:4,seconds:15}})).toBeNull()
 if(!solo)for(const name of ['one','two']){
  expect(h.join(name,name)).not.toBeNull()
  expect(send(name,{kind:'ready'})).toBeNull()
 }
 expect(send('host',{kind:'start'})).toBeNull()
 const v=(who='host')=>h.snapshot(who)!.game!.threeRow!
 const place=(who:string,cell:number,turns=v().turns)=>send(who,{kind:'three-row',match:h.match,turns,action:{kind:'threeRowPlace',cell,mark:'A'}})
 const vote=(who:string,suspect:string,rev=h.rev)=>send(who,{kind:'three-row',match:h.match,turns:v().turns,action:{kind:'threeRowVote',suspect}},rev)
 return {h,v,place,vote,send,clock:(n:number)=>{now=n}}
}

test('sealed ballots stay actor-private until complete; placements are match and slot bound',()=>{
 const {h,v,place,vote,send}=table()
 const keys=['host','one','two']
 const keyOf=(id:string|null)=>keys.find(key=>h.snapshot(key)!.you===id)!
 expect(keys.map(k=>v(k).role).filter(r=>r==='saboteur')).toHaveLength(1)
 expect(place(keys.find(k=>k!==keyOf(v().turn))!,0)).not.toBeNull()
 expect(send('host',{kind:'three-row',match:'0'.repeat(32),turns:0,action:{kind:'threeRowPlace',cell:0,mark:'A'}})).not.toBeNull()
 expect(place(keyOf(v().turn),0)).toBeNull()
 expect(place(keyOf(v().turn),1,0)).not.toBeNull()
 expect(place(keyOf(v().turn),0)).not.toBeNull()
 expect(place(keyOf(v().turn),1)).toBeNull()
 expect(place(keyOf(v().turn),2)).toBeNull()
 expect(v().phase).toBe('vote')
 const bad=h.snapshot(keys.find(k=>v(k).role==='saboteur')!)!.you
 const rev=h.rev, observer=v('two')
 expect(vote('host',h.owner)).not.toBeNull()
 expect(vote('host',h.owner===bad?h.snapshot('one')!.you:bad)).toBeNull()
 expect(h.rev).toBe(rev)
 expect(v('two')).toEqual(observer)
 expect(v('two').roleReveal).toBeNull()
 expect(v('host').vote).not.toBeNull()
 expect(vote('one',h.snapshot('one')!.you===bad?h.owner:bad,rev)).toBeNull()
 const finalVote=h.snapshot('two')!.you===bad?h.owner:bad
 expect(vote('two',finalVote,rev)).toBeNull()
 expect(v()).toMatchObject({phase:'done',alliesIdentified:true,roleReveal:{[bad]:'saboteur'}})
 expect(v().scores?.[bad]).toBe(0)
})

test('validates exact packet fields, and a disconnected player cannot stall a placement clock',()=>{
 const {h,v,clock}=table()
 const pkt=(command:unknown)=>JSON.stringify({version:1,type:'command',epoch:h.epoch,match:h.match,seq:1,request:h.epoch,rev:h.rev,command})
 const base={kind:'three-row',match:h.match,turns:0,action:{kind:'threeRowPlace',cell:0,mark:'B'}}
 expect(decode(pkt(base))).not.toBeNull()
 for(const action of [{...base.action,cell:-1},{...base.action,cell:25},{...base.action,role:'ally'},{kind:'threeRowVote',suspect:'x'}])expect(decode(pkt({...base,action}))).toBeNull()
 const key=['one','two'].find(k=>h.snapshot(k)!.you===v().turn)??'one'
 h.disconnect(key)
 clock(v().deadline)
 expect(h.tick()).toBe(true)
 expect(v()).toMatchObject({phase:'place',turns:1})
})

test('solo seeds two bots and can reach a score with deterministic clock advances',()=>{
 const {h,v,clock,place,vote}=table(true)
 expect(h.snapshot('host')!.seats.filter(s=>s.bot)).toHaveLength(2)
 for(let i=0;i<65&&v().phase!=='done';i++){
  if(v().phase==='place'&&v().turn===h.owner)expect(place('host',v().board.indexOf(null))).toBeNull()
  if(v().phase==='vote'&&!v().vote)expect(vote('host',h.snapshot('host')!.seats.find(s=>s.bot)!.id)).toBeNull()
  clock(1000+(i+1)*1200);h.tick()
 }
 expect(v().phase).toBe('done')
})
