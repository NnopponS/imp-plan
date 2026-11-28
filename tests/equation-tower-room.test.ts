import {expect,test} from 'vitest'
import {Host,decode,seatRules,type Command} from '../src/room'
import {equationTowerRules,findTowerPath,type TowerCommand} from '../src/equation-tower'

function room(solo=false,withBot=false){
 let clock=0,request=0
 const host=new Host('Moss',()=>clock,solo)
 const send=(who:string,c:Command)=>host.command(who,'request-'+(++request),host.rev,c)
 expect(send('host',{kind:'config',settings:{...host.settings,game:'equationTower',equationTowerMode:'quick'}})).toBeNull()
 if(withBot)expect(send('host',{kind:'bot'})).toBeNull()
 if(!solo&&!withBot){expect(host.join('guest','Ash')).toBeTruthy(); expect(send('guest',{kind:'ready'})).toBeNull()}
 expect(send('host',{kind:'start'})).toBeNull()
 const view=(who='host')=>host.snapshot(who)!.game!.equationTower!
 const action=(who:string,value:TowerCommand,step=view().step)=>send(who,{kind:'equation-tower',match:host.match,step,action:value})
 const time=(advance:number)=>{clock+=advance;return host.tick()}
 const deadline=()=>{clock=view().deadline!;return host.tick()}
 return {host,view,action,deadline,time}
}

test('the online table respects match/phase ownership and exposes only public proof state',()=>{
 const {host,view,action}=room()
 const start=view(),path=findTowerPath(start.stacks,start.target)!
 expect(start.mode).toBe('quick')
 expect(start.deadline).toBe(25000)
 expect(action('host',{kind:'call',moves:path.length})).toBeNull()
 expect(action('guest',{kind:'pass'},start.step)).toMatch(/changed/)
 expect(action('guest',{kind:'pass'})).toBeNull()
 expect(view('guest').phase).toBe('build')
 expect(action('guest',{kind:'shift',...path[0]})).toMatch(/no longer/)
 expect(view().stacks).toEqual(start.stacks)
 for(const m of path)expect(action('host',{kind:'shift',...m})).toBeNull()
 expect(view('guest').last).toMatchObject({success:true,builder:host.owner,points:1})
 const wire=JSON.stringify(host.snapshot('guest'))
 expect(wire).not.toContain('"seed"')
 expect(wire).not.toContain('"start"')
 expect(wire).not.toContain('"scratch"')
})

test('typed commands cannot attach another seat, move outside the four stands, or bypass an old match',()=>{
 const {host}=room()
 const c={kind:'equation-tower',match:host.match,step:1,action:{kind:'shift',from:0,to:1,count:1,flip:true}}
 const wire=(command:unknown)=>JSON.stringify({version:1,type:'command',epoch:host.epoch,match:host.match,seq:1,request:host.epoch,rev:host.rev,command})
 expect(decode(wire(c))).toBeTruthy()
 for(const bad of [{...c,match:''},{...c,step:0},{...c,seat:'someone'},{...c,action:{...c.action,to:4}},{...c,action:{...c.action,count:0}},{...c,action:{kind:'call',moves:equationTowerRules.budget+1}}])expect(decode(wire(bad))).toBeNull()
 expect(seatRules({game:'equationTower'})).toEqual({min:2,max:8})
 expect(seatRules({game:'equationTower'},true)).toEqual({min:1,max:1})
})

test('a party bot waits, calls from the public board and finishes its exact proof while a disconnected seat cannot stall',()=>{
 const {host,view,time,deadline}=room(false,true)
 expect(time(3000)).toBe(false)
 expect(time(7001)).toBe(true)
 expect(view().phase).toBe('challenge')
 expect(view().budget).toBeGreaterThan(0)
 host.disconnect('host')
 expect(deadline()).toBe(true)
 expect(view().phase).toBe('build')
 for(let i=0;i<equationTowerRules.budget&&view().phase==='build';i++)expect(time(651)).toBe(true)
 expect(view().last).toMatchObject({success:true,points:1})
})
