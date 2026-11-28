import {expect,test} from 'vitest'
import {islandAccept,islandBot,islandOpen,islandRoute,islandRoutes,islandStart,islandTerrain,islandTick,islandView,type IslandAction,type IslandState,type IslandPiece} from '../src/treasure-island'
import {decode,Host,seatRules,type Command} from '../src/room'

const passLot={kind:'bid',amount:0} as const
const passDig={kind:'sail',route:[]} satisfies IslandAction
const dig=(...route:IslandPiece[]):IslandAction=>({kind:'sail',route})
const north=dig({arrow:0,turn:0}),south=dig({arrow:0,turn:2})
const open=(seats=['ada','bo'],seed=2026)=>islandOpen(seats,seed,1000,10000)
const put=(s:IslandState,who:string,action:IslandAction)=>islandAccept(s,who,action,1001)!
function pastAuction(s:IslandState,amount=0){
 while(s.phase.kind==='auction'){
  for(const p of s.players)s=put(s,p.id,{kind:'bid',amount:Math.min(amount,p.chips)})
 }
 return s
}

test('terrain is connected, ten unique caches are reachable with the solo kit, and public lots cannot disclose the secret draw',()=>{
 const visited=new Set([islandStart]), frontier=[islandStart]
 while(frontier.length){
  const i=frontier.shift()!,c=i%9,r=Math.floor(i/9)
  for(const [x,y] of [[c+1,r],[c-1,r],[c,r+1],[c,r-1]]){
   const next=y*9+x
   if(x>=0&&x<9&&y>=0&&y<9&&islandTerrain[next]==='land'&&!visited.has(next)){visited.add(next);frontier.push(next)}
  }
 }
 expect(visited.size).toBe(islandTerrain.filter(t=>t==='land').length)
 for(let seed=0;seed<60;seed++){
  const s=islandOpen(['ada'],seed,1000,10000,()=>0)
  expect(new Set(s.chests).size).toBe(10)
  const routes=islandRoutes([{id:0,shape:'step'},...s.market])
  expect(s.chests.filter(c=>!routes.has(c))).toEqual([])
  const t=islandOpen(['ada'],seed,1000,10000,()=>5)
  expect(islandView(s,'ada')).toEqual(islandView(t,'ada'))
  expect(s.treasure).not.toBe(t.treasure)
 }
})

test('private bids debit the winner only, rotate ties and never overdraw; unclaimed lots move on',()=>{
 let s=open()
 expect(islandAccept(s,'ada',{kind:'bid',amount:16},1001)).toBeNull()
 expect(islandAccept(s,'ada',{kind:'bid',amount:1.2},1001)).toBeNull()
 expect(islandAccept(s,'unknown',passLot,1001)).toBeNull()
 expect(islandAccept(s,'ada',passLot,s.deadline!)).toBeNull()
 expect(islandAccept(s,'ada',north,1001)).toBeNull()
 s=put(s,'ada',{kind:'bid',amount:5})
 expect(islandView(s,'ada').mine?.bid).toBe(5)
 expect(islandView(s,'bo').mine?.bid).toBeNull()
 expect(islandAccept(s,'ada',passLot,1001)).toBeNull()
 s=put(s,'bo',{kind:'bid',amount:5})
 expect(s.lastLot).toMatchObject({winner:'ada',price:5,tied:true})
 expect(s.players.map(r=>r.chips)).toEqual([10,15])
 expect(islandView(s,'bo').priority).toBe('bo')
 expect(islandAccept(s,'ada',{kind:'bid',amount:11},1001)).toBeNull()
 s=put(put(s,'ada',{kind:'bid',amount:4}),'bo',{kind:'bid',amount:4})
 expect(s.lastLot).toMatchObject({winner:'bo',price:4,tied:true})
 s=islandTick(s,s.deadline!)
 expect(s.lastLot).toMatchObject({winner:null,price:0,tied:false})
 expect(s.players.flatMap(p=>p.arrows).map(a=>a.id)).toEqual([0,1,0,2])
})

test('arrows rotate, cannot be reused, cross reefs, splash through water, leave grid or loop',()=>{
 const arrows=[{id:0,shape:'step'},{id:1,shape:'long'},{id:2,shape:'bend'},{id:3,shape:'reach'},{id:4,shape:'reach'}] as const
 expect(islandRoute(arrows,[{arrow:1,turn:1},{arrow:0,turn:0}])).toEqual([40,41,42,33])
 expect(islandRoute(arrows,[{arrow:2,turn:0}])).toEqual([40,31,32])
 expect(islandRoute(arrows,[{arrow:1,turn:0},{arrow:0,turn:3}])).toBeNull() // D3 reef
 expect(islandRoute(arrows,[{arrow:3,turn:0},{arrow:4,turn:1}])).toBeNull() // H2 is water
 expect(islandRoute(arrows,[{arrow:3,turn:2},{arrow:4,turn:2}])).toBeNull()
 expect(islandRoute(arrows,[{arrow:1,turn:1},{arrow:0,turn:3}])).toBeNull()
 expect(islandRoute(arrows,[{arrow:0,turn:0},{arrow:0,turn:1}])).toBeNull()
 expect(islandRoute(arrows,[{arrow:5,turn:0}])).toBeNull()
})

test('routes and clues stay private, coordinates remain hidden, and passing never digs',()=>{
 let s=pastAuction(open())
 expect(islandView(s,'spectator').mine).toBeNull()
 s=put(s,'ada',north)
 expect(islandView(s,'ada').mine?.route).toEqual([40,31])
 expect(islandView(s,'bo').mine?.route).toBeNull()
 expect(islandView(s,'bo').table).toContainEqual({id:'ada',sealed:true})
 expect(islandAccept(s,'ada',south,1001)).toBeNull()
 s=put(s,'bo',passDig)
 expect(islandView(s,'ada').mine?.digs[0]).toMatchObject({endpoint:31,kind:'clue',clue:{distance:expect.any(Number),rowParity:expect.stringMatching(/even|odd/)}})
 expect(islandView(s,'bo').mine?.digs).toEqual([{round:1,endpoint:null,kind:'pass'}])
 expect(islandView(s,'bo').result).toBeNull()
 expect(JSON.stringify(islandView(s,'ada'))).not.toMatch(/"treasure"|"chests"|"secret"|"seed"|"market"/)
})

test('two finders in the same expedition share first and receive ten points each',()=>{
 let s=open(['ada','bo','cy'])
 s.players[0].arrows.push({id:43,shape:'long'})
 s.players[1].arrows.push({id:44,shape:'long'})
 s={...s,treasure:42,chests:[42,...s.chests.filter(c=>c!==42).slice(0,9)]}
 s=pastAuction(s)
 s=put(s,'ada',dig({arrow:43,turn:1}))
 expect(s.phase.kind).toBe('explore')
 s=put(s,'bo',dig({arrow:44,turn:1}))
 expect(s.phase.kind).toBe('explore')
 s=put(s,'cy',passDig)
 expect(islandView(s,'cy').result).toMatchObject({round:1,reason:'treasure',treasure:42,
  standings:[{seat:'ada',rank:1,bonus:10},{seat:'bo',rank:1,bonus:10},{seat:'cy',rank:3,bonus:0}]})
 expect(s.deadline).toBeNull()
 expect(islandTick(s,1e9)).toBe(s)
})

test('round limit uses distinct caches then closest dig; remaining ties are shared; bots stay within their seat view',()=>{
 let s=pastAuction(open(['ada','bo','cy','dee']))
 s={...s,treasure:22}
 for(let i=0;i<5;i++){
  s=put(s,'ada',north)
  s=put(s,'bo',south)
  s=put(s,'cy',south)
  s=islandTick(s,s.deadline!)
 }
 expect(islandView(s,'ada').result).toMatchObject({reason:'expeditions',round:5,
  standings:[{seat:'ada',rank:1,clues:1,distance:1},{seat:'bo',rank:2,clues:1,distance:3},{seat:'cy',rank:2,clues:1,distance:3},{seat:'dee',rank:4,clues:0,distance:null}]})
 let race=open(['ada','bo','cy','dee'])
 while(race.phase.kind!=='finished'){
  for(const p of race.players){
   const intent=islandBot(islandView(race,p.id),p.id,42)
   expect(intent).not.toBeNull()
   race=put(race,p.id,intent!)
  }
 }
 expect(race.step).toBeGreaterThan(8)
})

function room(){
 let now=2000,i=0
 const h=new Host('Ada',()=>now)
 const cmd=(conn:string,action:Command,request='req-'+ ++i)=>h.command(conn,request,h.rev,action)
 expect(cmd('host',{kind:'config',settings:{...h.settings,game:'treasureIsland',capacity:16}})).toBeNull()
 expect(h.join('guest','Bo')).not.toBeNull()
 expect(cmd('guest',{kind:'ready'})).toBeNull()
 expect(h.snapshot('host')?.game).toBeNull()
 expect(cmd('host',{kind:'start'})).toBeNull()
 const projection=(conn='host')=>h.snapshot(conn)!.game!.treasureIsland!
 const lock=(conn:string,action:IslandAction,step=projection().step,match=h.match,request?:string)=>cmd(conn,{kind:'treasure-island',match,step,action},request)
 return {h,cmd,lock,projection,tick:(ms:number)=>{now+=ms;return h.tick()}}
}

test('host enforces private projection, exact step, match, idempotency and timeout for a disconnected seat',()=>{
 const {h,cmd,lock,projection,tick}=room()
 expect(seatRules(h.settings)).toEqual({min:2,max:16})
 expect(seatRules(h.settings,true)).toEqual({min:1,max:4})
 expect(lock('host',passLot,0,'f'.repeat(32))).toMatch(/ended/)
 expect(cmd('host',{kind:'move',action:1})).not.toBeNull()
 expect(lock('host',{kind:'bid',amount:3},0,h.match,'retry')).toBeNull()
 expect(lock('host',{kind:'bid',amount:3},0,h.match,'retry')).toBeNull()
 expect(projection().mine?.bid).toBe(3)
 expect(projection('guest').mine?.bid).toBeNull()
 expect(JSON.stringify(h.snapshot('guest'))).not.toMatch(/"seed"|"market"|"treasure"|"chests"/)
 h.disconnect('guest')
 expect(tick(44999)).toBe(false)
 expect(tick(1)).toBe(true)
 expect(projection().lastLot?.price).toBe(3)
 expect(lock('host',passLot,0)).toMatch(/ended/)
 expect(lock('host',passLot,1)).toBeNull()
})

test('wire accepts only typed intent and rejects extra fields, invalid rotations and duplicate physical arrows',()=>{
 const {h}=room()
 const cmd={kind:'treasure-island',match:h.match,step:0,action:{kind:'sail',route:[{arrow:0,turn:3}]}}
 const wire=(command:unknown)=>JSON.stringify({version:1,type:'command',epoch:h.epoch,match:h.match,seq:1,request:h.epoch,rev:h.rev,command})
 expect(decode(wire(cmd))).not.toBeNull()
 for(const bad of [
  {...cmd,seat:h.owner},{...cmd,match:'fake'},{...cmd,step:40},{...cmd,action:{kind:'bid',amount:-1}},{...cmd,action:{kind:'bid',amount:16}},
  {...cmd,action:{kind:'sail',route:[{arrow:0,turn:4}]}},{...cmd,action:{kind:'sail',route:[{arrow:999,turn:0}]}},
  {...cmd,action:{kind:'sail',route:[{arrow:0,turn:0},{arrow:0,turn:1}]}},{...cmd,action:{...cmd.action,endpoint:41}},
  {...cmd,action:{kind:'sail',route:[{arrow:0,turn:1,endpoint:41}]}},
 ])expect(decode(wire(bad))).toBeNull()
})
