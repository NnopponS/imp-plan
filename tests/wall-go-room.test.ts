import {expect,test} from 'vitest'
import {botAction,move,start,timeout,view} from '../src/engine'
import {Host,decode,type Command} from '../src/room'
import {wallGoEncode,wallGoFallback} from '../src/wall-go'

test('wall go uses its own explicit turn clock, rejects late input, and consumes just one turn on timeout',()=>{
 const game=start('wallGo',['gold','red'],15000,1000)
 const v=view(game,'gold')
 expect(v.wallGo).toMatchObject({turn:'gold',turns:0,walls:[]})
 expect(v.deadline).toBe(16000)
 expect(timeout(game,15999)).toBe(game)
 expect(move(game,'gold',0,16000)).toBeNull()
 const next=timeout(game,16000)
 expect(next.publicMoves).toEqual([wallGoFallback(v.wallGo!)])
 expect(next.wallGo).toMatchObject({pawns:[0,48],turns:1})
 expect(view(next,'red')).toMatchObject({turn:'red',deadline:31000})
 expect(timeout(next,16000)).toBe(next)
})

test('solo fills one rival and every bot difficulty responds from its public projection',()=>{
 for(const level of ['easy','normal','hard'] as const){
  let now=0
  const h=new Host('Ari',()=>now,true)
  expect(h.command('host','config',h.rev,{kind:'config',settings:{...h.settings,game:'wallGo',botLevel:level}})).toBeNull()
  expect(h.snapshot('host')!.seats.filter(s=>s.bot)).toHaveLength(1)
  expect(h.command('host','start',h.rev,{kind:'start'})).toBeNull()
  expect(h.command('host','move',h.rev,{kind:'move',action:0})).toBeNull()
  const v=h.snapshot('host')!.game!
  const turn=v.wallGo!.turn!
  expect(v.wallGo!.legal).toContain(botAction(v,turn,[],0,level))
  expect(botAction(v,h.owner,[],0,level)).toBeUndefined()
  now=700
  expect(h.tick()).toBe(true)
  expect(h.snapshot('host')!.game!.wallGo).toMatchObject({turn:h.owner,turns:2})
 }
})

test('a three-player party schedules six legs, alternates sides, and protects watching seats and stale turns',()=>{
 const h=new Host('Ari',()=>1000)
 expect(h.command('host','three',h.rev,{kind:'config',settings:{...h.settings,game:'wallGo',capacity:3}})).toBeNull()
 const a=h.join('a','Bee')!.id,b=h.join('b','Cee')!.id
 const send=(who:string,request:string,command:Command,rev=h.rev)=>h.command(who,request,rev,command)
 expect(send('host','config',{kind:'config',settings:{...h.settings,game:'wallGo'}})).toBeNull()
 expect(send('a','ready1',{kind:'ready'})).toBeNull()
 expect(send('b','ready2',{kind:'ready'})).toBeNull()
 expect(send('host','start',{kind:'start'})).toBeNull()
 const initial=h.snapshot('host')!
 expect(initial.count).toBe(6)
 expect(initial.fixtures.slice(3).map(f=>f.sides)).toEqual(initial.fixtures.slice(0,3).map(f=>[...f.sides].reverse()))
 expect(new Set(initial.fixtures.flatMap(f=>f.sides))).toEqual(new Set([h.owner,a,b]))
 const con=(id:string)=>id===h.owner?'host':id===a?'a':'b'
 const [left,right]=initial.game!.seats,leftCon=con(left),rightCon=con(right)
 const observer=con([h.owner,a,b].find(id=>id!==left&&id!==right)!)
 expect(send(observer,'observe',{kind:'move',action:0})).toBe('That move is not available.')
 expect(send(leftCon,'l1',{kind:'move',action:0})).toBeNull()
 expect(send(rightCon,'r1',{kind:'move',action:wallGoEncode(48,41)},initial.rev)).toBe('The room updated. Try again.')
 expect(send(rightCon,'r2',{kind:'move',action:wallGoEncode(48,41)})).toBeNull()
 expect(send(leftCon,'l2',{kind:'move',action:42})).toBeNull()
 const result=h.snapshot(observer)!
 expect(result.game!.wallGo).toMatchObject({end:'separated',winner:right,territory:{scores:[1,48]}})
 expect(result.game).toMatchObject({done:true,winner:right,scores:[1,48]})
 expect(result.fixtures[0].winner).toBe(right)
 expect(send('host','next',{kind:'next'})).toBeNull()
 expect(h.snapshot('host')).toMatchObject({fixture:1,game:{wallGo:{pawns:[0,48],walls:[],turns:0}}})
})

test('wall go room mode decodes as a normal game and uses existing revision guards without a 24-round cap',()=>{
 const h=new Host('Ari',()=>0)
 const p={version:1,type:'command',epoch:h.epoch,match:'',seq:1,request:h.epoch,rev:0,command:{kind:'config',settings:{...h.settings,game:'wallGo'}}}
 expect(decode(JSON.stringify(p))).toEqual(p)
})

test('a disconnected duelist cannot stop the Wall Go turn clock or strand observers',()=>{
 let now=2000
 const h=new Host('Ari',()=>now)
 h.join('guest','Bee')
 const send=(who:string,request:string,command:Command)=>h.command(who,request,h.rev,command)
 expect(send('host','config',{kind:'config',settings:{...h.settings,game:'wallGo'}})).toBeNull()
 expect(send('guest','ready',{kind:'ready'})).toBeNull()
 expect(send('host','start',{kind:'start'})).toBeNull()
 expect(send('host','first',{kind:'move',action:0})).toBeNull()
 h.disconnect('guest')
 now+=25000
 expect(h.tick()).toBe(true)
 expect(h.snapshot('host')?.game?.wallGo).toMatchObject({pawns:[0,48],turns:2,turn:h.owner})
})
