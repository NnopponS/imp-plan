import {expect,test} from 'vitest'
import {Host,decode,type Command} from '../src/room'
const up=[1,2,3,4,5,6,7],down=[7,6,5,4,3,2,1]
function table(n=2,solo=false){
 let now=10_000,id=0
 const h=new Host('Copper',()=>now,solo)
 const send=(who:string,c:Command,rev=h.rev)=>h.command(who,'gr'+(++id),rev,c)
 expect(send('host',{kind:'config',settings:{...h.settings,game:'gradation',capacity:16,seconds:30}})).toBeNull()
 for(let i=1;i<n;i++){h.join('c'+i,'C'+i);send('c'+i,{kind:'ready'})}
 expect(send('host',{kind:'start'})).toBeNull()
 const snap=(who='host')=>h.snapshot(who)!
 const v=(who='host')=>snap(who).game!.gradation!
 const cmd=(order:number[],round=v().round):Command=>({kind:'gradation-lock',match:h.match,round,order,target:null})
 const at=(t:number)=>{now=t;return h.tick()}
 return {h,send,snap,v,cmd,at}
}
test('match/round bound, private unicast receipts; teammates cannot impersonate allocators',()=>{
 const {h,v,send,cmd,at}=table(4)
 const base=h.rev,other=v('c1'),watching=v('c2'),wire=(command:unknown)=>JSON.stringify({version:1,type:'command',epoch:h.epoch,match:h.match,seq:1,request:h.epoch,rev:base,command})
 expect(decode(wire(cmd(up)))).not.toBeNull()
 for(const c of [{...cmd(up),seat:h.owner},{...cmd(up),round:7},{...cmd(up),order:[1]},{...cmd(up),target:8}])expect(decode(wire(c))).toBeNull()
 expect(send('c2',cmd(up))).not.toBeNull()
 expect(send('host',{...cmd(up),match:'0'.repeat(32)} as Command)).not.toBeNull()
 expect(send('host',cmd(up,2))).not.toBeNull()
 expect(send('host',{kind:'move',action:2})).not.toBeNull()
 expect(send('host',cmd(up))).toBeNull()
 expect(h.rev).toBe(base)
 expect(v('host').mine?.order).toEqual(up)
 expect(v('c1')).toEqual(other)
 expect(v('c2')).toEqual(watching)
 expect(send('c1',cmd(down),base)).toBeNull()
 expect(h.rev).toBeGreaterThan(base)
 expect(v('c2').current.gates.map(g=>g.values)).toEqual([[1,7]])
 while(v().phase==='reveal')at(v().deadline!)
 expect(v().round).toBe(2)
 expect(send('c2',cmd(up,1))).not.toBeNull()
 expect(send('host',cmd(up))).not.toBeNull()
 expect(send('c2',cmd(up))).toBeNull()
 h.disconnect('c3')
 at(v().deadline!)
 expect(v().phase).toBe('reveal')
})
test('one human practice opponent acts; a sixteen-seat team table finishes without waiting on a disconnection',()=>{
 const p=table(1,true)
 expect(p.snap().seats.filter(s=>s.bot)).toHaveLength(1)
 expect(p.at(10800)).toBe(false)
 expect(p.send('host',p.cmd(up))).toBeNull()
 expect(p.v().phase).toBe('reveal')
 const big=table(16)
 expect(big.v().teams.map(t=>t.length)).toEqual([8,8])
 big.h.disconnect('c1')
 for(let i=0;i<50&&big.v().phase!=='done';i++)big.at(big.v().deadline!)
 expect(big.v().phase).toBe('done')
 expect(big.snap().seriesDone).toBe(true)
 expect(new Set(big.snap().game!.scores).size).toBeLessThanOrEqual(2)
})
