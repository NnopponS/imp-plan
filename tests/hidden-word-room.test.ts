import {expect,test} from 'vitest'
import {Host,decode,seatRules,type Command} from '../src/room'
import {hiddenNouns,type HiddenAction} from '../src/hidden-word'
import {move,start} from '../src/engine'

function room(solo=false,count=3){
 let clock=1000,req=0
 const host=new Host('Editor',()=>clock,solo)
 const send=(who:string,c:Command,rev=host.rev)=>host.command(who,'request-'+(++req),rev,c)
 expect(send('host',{kind:'config',settings:{...host.settings,game:'hiddenWord'}})).toBeNull()
 if(!solo)for(let i=1;i<count;i++){
  expect(host.join('peer'+i,'Reader '+i)).not.toBeNull()
  expect(send('peer'+i,{kind:'ready'})).toBeNull()
 }
 expect(send('host',{kind:'start'})).toBeNull()
 const view=(who='host')=>host.snapshot(who)!.game!.hiddenWord!
 const act=(who:string,action:HiddenAction,step=view().step,rev=host.rev)=>send(who,{kind:'hidden-word',match:host.match,step,action},rev)
 const go=(by:number)=>{clock+=by;return host.tick()}
 const deadline=()=>{clock=view().deadline!;return host.tick()}
 return {host,send,view,act,go,deadline}
}

test('the room keeps envelope choices and in-flight guesses on their respective connections at one revision',()=>{
 const {host,view,act}=room()
 const peers=['host','peer1','peer2']
 const v0=host.snapshot('peer1')
 const rev=host.rev,step=view().step
 expect(act('host',{kind:'choose',word:view().mine!.envelope[0]})).toBeNull()
 expect(host.rev).toBe(rev)
 expect(host.snapshot('peer1')).toEqual(v0)
 expect(act('peer1',{kind:'choose',word:view('peer1').mine!.envelope[1]},step,rev)).toBeNull()
 expect(act('peer2',{kind:'choose',word:view('peer2').mine!.envelope[2]},step,rev)).toBeNull()
 expect(host.rev).toBe(rev+1)
 expect(act('host',{kind:'choose',word:view().mine!.envelope[4]},step)).toMatch(/closed/)
 const setter=peers.find(who=>view(who).mine!.isSetter)!
 const readers=peers.filter(who=>who!==setter)
 const noun=view(setter).mine!.chosen!
 expect(act(setter,{kind:'clue',word:view(setter).mine!.clues[0].word})).toBeNull()
 expect(act(setter,{kind:'guess',words:[noun]})).not.toBeNull()
 for(const who of readers)expect(view(who).mine!.chosen).not.toBe(noun)
 const before=host.snapshot(readers[1]),publicRev=host.rev,guessStep=view().step
 expect(act(readers[0],{kind:'guess',words:[noun]})).toBeNull()
 expect(host.snapshot(readers[1])).toEqual(before)
 expect(host.rev).toBe(publicRev)
 expect(act(readers[1],{kind:'guess',words:[noun]},guessStep,publicRev)).toBeNull()
 expect(view().review?.correct).toHaveLength(2)
 expect(view().review?.answer).toBe(noun)
 expect(host.rev).toBe(publicRev+1)
})

test('minimum, maximum, stale turns and malformed typed commands are enforced',()=>{
 expect(seatRules({game:'hiddenWord'})).toEqual({min:3,max:16})
 expect(()=>start('hiddenWord',['a','b'],10000,0)).toThrow('Invalid seats')
 expect(move(start('hiddenWord',['a','b','c'],10000,0),'a',0,1)).toBeNull()
 const {host,view,act,deadline}=room(false,16)
 expect(host.join('last','No seat')).toBeNull()
 expect(view().order).toHaveLength(16)
 const c={kind:'hidden-word',match:host.match,step:1,action:{kind:'guess',words:['grape','apple']}}
 const packet=(command:unknown)=>JSON.stringify({version:1,type:'command',epoch:host.epoch,match:host.match,seq:1,request:host.epoch,rev:host.rev,command})
 expect(decode(packet(c))).not.toBeNull()
 for(const invalid of [{...c,step:0},{...c,step:300},{...c,match:''},{...c,seed:1},{...c,action:{kind:'guess',words:['a','b','c']}},{...c,action:{kind:'guess',words:['a','A']}},{...c,action:{kind:'choose',word:'A<script>'}}])expect(decode(packet(invalid))).toBeNull()
 const secret=view().mine!.envelope[0]
 expect(act('host',{kind:'choose',word:secret},1,host.rev+1)).not.toBeNull()
 expect(deadline()).toBe(true)
 expect(act('host',{kind:'choose',word:secret},1)).not.toBeNull()
 expect(hiddenNouns).toContain(view().mine!.chosen)
})

test('solo starts with two practice bots, handles disconnected readers by time, and produces results',()=>{
 const {host,view,act,go,deadline}=room(true)
 expect(host.snapshot('host')!.seats.map(x=>x.bot)).toEqual([false,true,true])
 const rev=host.rev
 expect(go(700)).toBe(false)
 expect(host.rev).toBe(rev)
 expect(act('host',{kind:'choose',word:view().mine!.envelope[0]})).toBeNull()
 expect(view().phase).toBe('clue')
 for(let i=0;i<60&&view().phase!=='done';i++){
  const v=view()
  if(v.phase==='choose'&&!v.mine!.locked)expect(act('host',{kind:'choose',word:v.mine!.envelope[0]})).toBeNull()
  else if(v.phase==='clue'&&v.mine!.isSetter)expect(act('host',{kind:'clue',word:v.mine!.clues[0].word})).toBeNull()
  else if(v.phase==='guess'&&!v.mine!.isSetter&&v.mine!.guess===null)expect(act('host',{kind:'guess',words:[]})).toBeNull()
  else if(!go(700))deadline()
 }
 expect(view().history).toHaveLength(6)
 expect(host.snapshot('host')!.seriesDone).toBe(true)
 const match=room()
 const prev=match.view().step
 match.host.disconnect('peer2')
 expect(match.deadline()).toBe(true)
 expect(match.view().step).toBeGreaterThan(prev)
 expect(match.deadline()).toBe(true)
 expect(match.deadline()).toBe(true)
 expect(match.view().review?.guesses.every(g=>g.words.length===0)).toBe(true)
})
