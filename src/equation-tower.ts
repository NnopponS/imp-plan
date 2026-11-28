type Operator='+'|'-'|'*'|'/'
type Rational=readonly [numerator:number,denominator:number]
export type EquationBlock={operator:Operator|null,value:number}
export const towerBlocks=[
 {operator:null,value:7},{operator:null,value:5},{operator:'*',value:2},{operator:'+',value:2},
 {operator:'+',value:5},{operator:'-',value:4},{operator:'*',value:3},{operator:'/',value:3},
] as const satisfies readonly EquationBlock[]

export type TowerStacks=readonly (readonly number[])[]
export type TowerShift={from:number,to:number,count:number,flip:boolean}
export type TowerTarget={height:number,value:number}
export const equationTowerModes=['quick','standard'] as const
export type EquationTowerMode=(typeof equationTowerModes)[number]
export const equationTowerRules={practiceRounds:3,partyRounds:12,goal:7,budget:10,practiceBudget:18,reviewMs:4500}
const timings={quick:{call:25000,challenge:12000,build:60000},standard:{call:45000,challenge:20000,build:90000}}

function reduce(num:number,den:number):Rational{
 let a=Math.abs(num),b=den
 while(b)[a,b]=[b,a%b]
 return [num/a,den/a]
}

export function readTower(stack:readonly number[]):Rational|null{
 const top=towerBlocks[stack.at(-1)??-1]
 if(!top||top.operator!==null||new Set(stack).size!==stack.length)return null
 let sum:Rational=[0,1],term:Rational=[top.value,1]
 const add=():Rational=>reduce(sum[0]*term[1]+term[0]*sum[1],sum[1]*term[1])
 for(let i=stack.length-2;i>=0;i--){
  const b=towerBlocks[stack[i]]
  if(!b||b.operator===null)return null
  if(b.operator==='*')term=reduce(term[0]*b.value,term[1])
  else if(b.operator==='/')term=reduce(term[0],term[1]*b.value)
  else {sum=add();term=[b.operator==='-'?-b.value:b.value,1]}
 }
 return add()
}

export function shiftTower(stacks:TowerStacks,{from,to,count,flip}:TowerShift):TowerStacks|null{
 if(!Number.isInteger(from)||!Number.isInteger(to)||!Number.isInteger(count)||typeof flip!=='boolean'||!stacks[from]||!stacks[to]||count<1||count>stacks[from].length||from===to&&(!flip||count<2))return null
 const rest=stacks[from].slice(0,-count),bundle=stacks[from].slice(-count)
 if(flip)bundle.reverse()
 return stacks.map((stack,i)=>i===to?[...(to===from?rest:stack),...bundle]:i===from?rest:stack)
}

export function matchedTower(stacks:TowerStacks,target:TowerTarget){
 const match=stacks.findIndex(stack=>{
  if(stack.length!==target.height)return false
  const value=readTower(stack)
  return !!value&&value[0]===target.value*value[1]
 })
 return match<0?null:match
}

function* moves(stacks:TowerStacks):Generator<TowerShift>{
 for(let from=0;from<4;from++)for(let count=1;count<=stacks[from].length;count++)for(let to=0;to<4;to++){
  if(from!==to)yield {from,to,count,flip:false}
  if(count>1)yield {from,to,count,flip:true}
 }
}

function* nearby(stacks:TowerStacks):Generator<{stacks:TowerStacks,path:TowerShift[]}>{
 const hash=(board:TowerStacks)=>board.map(s=>s.join('')).join('|')
 const queue=[{stacks,path:[] as TowerShift[]}],seen=new Set([hash(stacks)])
 for(const pos of queue){
  if(pos.path.length===2)continue
  for(const m of moves(pos.stacks)){
   const next=shiftTower(pos.stacks,m)!,key=hash(next)
   if(seen.has(key))continue
   seen.add(key)
   const node={stacks:next,path:[...pos.path,m]}
   queue.push(node);yield node
  }
 }
}

function* arrangements(height:number,partial:number[]=[]):Generator<number[]>{
 if(partial.length===height){yield partial;return}
 for(let id=0;id<towerBlocks.length;id++){
  if(partial.includes(id)||(partial.length===0)!==(towerBlocks[id].operator===null))continue
  yield* arrangements(height,[...partial,id])
 }
}

// Any sequence can be built on an empty pedestal. Clear its old contents, then
// for each required block move the cover away and lift that block onto the base.
function construct(stacks:TowerStacks,desired:number[]):TowerShift[]{
 let work=stacks
 const path:TowerShift[]=[]
 const step=(from:number,to:number,count:number)=>{
  const m={from,to,count,flip:false}
  work=shiftTower(work,m)!;path.push(m)
 }
 if(work[0].length)step(0,1,work[0].length)
 for(const id of desired.slice().reverse()){
  const pile=work.findIndex(s=>s.includes(id)),covers=work[pile].length-work[pile].indexOf(id)-1
  if(covers)step(pile,pile===1?2:1,covers)
  step(pile,0,1)
 }
 return path
}

export function findTowerPath(stacks:TowerStacks,target:TowerTarget):TowerShift[]|null{
 if(matchedTower(stacks,target)!==null)return []
 for(const node of nearby(stacks))if(matchedTower(node.stacks,target)!==null)return node.path
 for(const desired of arrangements(target.height)){
  const value=readTower(desired.slice().reverse())
  if(value&&value[0]===target.value*value[1])return construct(stacks,desired)
 }
 return null
}

function nextRandom(seed:number){
 let v=seed>>>0
 v^=v<<13;v^=v>>>17;v^=v<<5
 return v>>>0
}

function initialStacks(seed:number):TowerStacks{
 const bag=towerBlocks.map((_,i)=>i)
 let random=seed||12030
 for(let i=bag.length-1;i>0;i--){
  random=nextRandom(random)
  const j=random%(i+1);[bag[i],bag[j]]=[bag[j],bag[i]]
 }
 return [bag.slice(0,3),bag.slice(3,5),bag.slice(5,7),bag.slice(7)]
}

function targetFor(stacks:TowerStacks,seed:number,round:number,previous:TowerTarget):TowerTarget{
 const fresh=(target:TowerTarget)=>(target.height!==previous.height||target.value!==previous.value)&&matchedTower(stacks,target)===null
 const sample=new Map<string,TowerTarget>()
 for(const node of nearby(stacks)){
  if(node.path.length!==2)continue
  for(const stack of node.stacks){
   if(stack.length<3||stack.length>5)continue
   const value=readTower(stack)
   if(!value||value[1]!==1||value[0]<1||value[0]>100)continue
   const t={height:stack.length,value:value[0]}
   if(fresh(t))sample.set(t.height+':'+t.value,t)
  }
 }
 if(sample.size){const list=Array.from(sample.values());return list[nextRandom(seed^Math.imul(round,2654435761))%list.length]}
 for(const arrangement of arrangements(3)){
  const value=readTower(arrangement.slice().reverse())
  if(value&&value[0]>0&&value[1]===1){
   const t={height:3,value:value[0]}
   if(fresh(t))return t
  }
 }
 throw new Error('No valid target for the block inventory')
}

export type TowerCommand={kind:'call',moves:number}|{kind:'pass'}|{kind:'shift'}&TowerShift|{kind:'restart'}|{kind:'advance'}
type Attempt={seat:string,moves:number,points:1|2}
type Outcome={builder:string|null,success:boolean,points:number,used:number,reason:'solved'|'budget'|'clock'|'skipped',tower:number|null}
export type EquationTower={
 seats:readonly string[],scores:readonly number[],stacks:TowerStacks,target:TowerTarget,round:number,step:number,
 phase:'call'|'challenge'|'build'|'review'|'done',mode:EquationTowerMode,deadline:number|null,opened:number,used:number,
 declared:readonly Attempt[],passed:readonly string[],builder:string|null,budget:number,last:Outcome|null,
 start:TowerStacks,seed:number,
}
export type EquationTowerView=Omit<EquationTower,'seed'|'start'>&{leaders:readonly string[],maxRounds:number,canRestart:boolean}
const roundCount=(g:EquationTower)=>g.seats.length===1?equationTowerRules.practiceRounds:equationTowerRules.partyRounds
const leaders=(g:EquationTower)=>g.seats.filter((_,i)=>g.scores[i]===Math.max(...g.scores))

function begin(g:EquationTower,now:number):EquationTower{
 const solo=g.seats.length===1
 return {...g,start:g.stacks,target:targetFor(g.stacks,g.seed,g.round,g.target),opened:now,
  phase:solo?'build':'call',deadline:solo?null:now+timings[g.mode].call,declared:[],passed:[],builder:solo?g.seats[0]:null,
  budget:solo?equationTowerRules.practiceBudget:0,used:0,last:null}
}
export function equationTowerStart(seats:readonly string[],seed:number,now:number,mode:EquationTowerMode='standard'):EquationTower{
 if(seats.length<1||seats.length>8||new Set(seats).size!==seats.length)throw new Error('Tower of Equations needs 1–8 distinct seats')
 const stacks=initialStacks(seed)
 return begin({seats,scores:seats.map(()=>0),stacks,target:{height:3,value:0},round:1,step:1,phase:'call',mode,
  deadline:null,opened:now,used:0,declared:[],passed:[],builder:null,budget:0,last:null,start:stacks,seed},now)
}
function resolve(g:EquationTower,reason:Outcome['reason'],now:number,tower:number|null=null):EquationTower{
 const attempt=g.declared.at(-1),solo=g.seats.length===1,success=reason==='solved'
 const points=reason==='skipped'?0:success?(attempt?.points??1):-(attempt?.points??0)
 const scores=g.scores.map((value,i)=>g.seats[i]===g.builder?value+points:value)
 return {...g,scores,step:g.step+1,opened:now,deadline:solo?null:now+equationTowerRules.reviewMs,phase:'review',
  last:{reason,builder:g.builder,success,points,used:g.used,tower}}
}
function build(g:EquationTower,now:number):EquationTower{
 return {...g,phase:'build',step:g.step+1,opened:now,deadline:now+timings[g.mode].build}
}
function nextRound(g:EquationTower,now:number):EquationTower{
 if(g.round>=roundCount(g)||g.scores.some(s=>s>=equationTowerRules.goal))return {...g,step:g.step+1,phase:'done',deadline:null}
 return begin({...g,step:g.step+1,round:g.round+1},now)
}

export function equationTowerTick(g:EquationTower,now:number):EquationTower{
 if(g.deadline===null||now<g.deadline)return g
 if(g.phase==='call')return resolve(g,'skipped',now)
 if(g.phase==='challenge')return build(g,now)
 if(g.phase==='build')return resolve(g,'clock',now)
 if(g.phase==='review')return nextRound(g,now)
 return g
}
export function equationTowerApply(g:EquationTower,seat:string,action:TowerCommand,now:number):EquationTower|null{
 if(!g.seats.includes(seat)||g.deadline!==null&&now>=g.deadline)return null
 const solo=g.seats.length===1
 const awaiting=(g.phase==='call'||g.phase==='challenge')&&!g.passed.includes(seat)&&!g.declared.some(b=>b.seat===seat)
 if(action.kind==='pass'&&awaiting){
  const passed=[...g.passed,seat],next={...g,passed,step:g.step+1}
  if(passed.length+g.declared.length<g.seats.length)return next
  return g.phase==='call'?resolve(next,'skipped',now):build(next,now)
 }
 if(action.kind==='call'&&awaiting&&Number.isInteger(action.moves)&&action.moves>=1&&action.moves<=equationTowerRules.budget){
  if(g.phase==='challenge'&&action.moves>=g.budget)return null
  const first=g.phase==='call'
  const declared:Attempt[]=[...g.declared,{seat,moves:action.moves,points:first?1:2}]
  const next:EquationTower={...g,phase:'challenge',deadline:first?now+timings[g.mode].challenge:g.deadline,
   opened:first?now:g.opened,builder:seat,budget:action.moves,declared,step:g.step+1}
  return next.passed.length+declared.length===g.seats.length?build(next,now):next
 }
 if(action.kind==='advance'&&solo&&g.phase==='review')return nextRound(g,now)
 if(g.phase!=='build'||g.builder!==seat)return null
 if(action.kind==='restart'&&solo&&g.used>0)return {...g,stacks:g.start,used:0,step:g.step+1}
 if(action.kind!=='shift'||g.used>=g.budget)return null
 const stacks=shiftTower(g.stacks,action)
 if(!stacks)return null
 const next={...g,stacks,used:g.used+1,step:g.step+1}
 const tower=matchedTower(stacks,g.target)
 if(tower!==null&&(solo||next.used===g.budget))return resolve(next,'solved',now,tower)
 if(next.used===g.budget)return resolve(next,'budget',now)
 return next
}
export function equationTowerView(g:EquationTower,seat?:string|null):EquationTowerView{
 const {seed:_,start:__,...visible}=g
 return {...visible,leaders:g.phase==='done'?leaders(g):[],maxRounds:roundCount(g),
  canRestart:g.phase==='build'&&g.seats.length===1&&g.builder===seat&&g.used>0}
}

export function equationTowerBot(g:EquationTowerView,seat:string,level:'easy'|'normal'|'hard'):TowerCommand|null{
 if(g.phase==='call'||g.phase==='challenge'){
  if(g.declared.some(a=>a.seat===seat)||g.passed.includes(seat))return null
  const solution=findTowerPath(g.stacks,g.target)
  if(!solution?.length)return {kind:'pass'}
  const moves=solution.length+(level==='easy'?2:level==='normal'?1:0)
  return moves>equationTowerRules.budget||g.phase==='challenge'&&moves>=g.budget?{kind:'pass'}:{kind:'call',moves}
 }
 if(g.phase!=='build'||g.builder!==seat)return null
 const path=findTowerPath(g.stacks,g.target),left=g.budget-g.used
 if(!path||path.length>left)return null
 if(path.length)return {kind:'shift',...path[0]}
 // After solving early, spend the extra budget on a different pedestal.
 const match=matchedTower(g.stacks,g.target)
 const spare=Array.from(moves(g.stacks)).find(m=>m.from!==match&&m.to!==match)
 return spare?{kind:'shift',...spare}:null
}
