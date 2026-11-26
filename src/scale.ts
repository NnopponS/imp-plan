export const scaleNames=['Brass','Jade','Quartz','Onyx','Amber'] as const
export const scaleWindow=300_000
export const scaleLimit=12
const answerOffset=10_000_000
type Sign=-1|0|1
export type Weighing={left:number[],right:number[],sign:Sign}
export type Scale=ReturnType<typeof scaleDeal>&{log:Weighing[],score:number|null,answer:number[]|null}
export function calibration(value:number,reference:number):[number,number]|null{
 for(let a=1;a<=4;a++)for(let b=1;b<=4;b++)if(a*value===b*reference)return [a,b]
 return null
}
export function scaleDeal(seed:number){
 let x=Math.imul(seed^0x4b381f3e,0x9e3779b9)>>>0
 const pick=(n:number)=>{
  x=(Math.imul(x,1664525)+1013904223)>>>0
  return Math.floor(x/4294967296*n)
 }
 const references=[4,6,8,9,12]
 const reference=references[pick(references.length)]
 const all=Array.from({length:20},(_,i)=>i+1).filter(w=>w!==reference&&calibration(w,reference))
 // Narrow the public candidate list to seven so median comparison needs at most two readings per unknown.
 const sample=(source:number[],count:number)=>{
  const pool=source.slice()
  return Array.from({length:count},()=>pool.splice(pick(pool.length),1)[0])
 }
 const menu=sample(all,Math.min(7,all.length)).sort((a,b)=>a-b)
 const weights=[reference,...sample(menu,4)]
 const rank=1+weights.filter(w=>w<reference).length
 return {reference,rank,menu,weights}
}
export function scaleStart(seed:number):Scale{return {...scaleDeal(seed),log:[],score:null,answer:null}}
const integers=(v:number[],length:number,lo:number,hi:number)=>v.length===length&&v.every(n=>Number.isInteger(n)&&n>=lo&&n<=hi)
const pack=(v:number[],base:number)=>v.reduceRight((p,n)=>p*base+n,0)
function unpack(n:number,len:number,base:number){
 const out=Array.from({length:len},()=>{const v=n%base;n=Math.floor(n/base);return v})
 return n===0?out:null
}
export const packWeigh=(left:number[],right:number[])=>integers(left,5,0,4)&&integers(right,5,0,4)?pack([...left,...right],5):-1
export const packAnswer=(v:number[])=>integers(v,5,1,20)?answerOffset+pack(v,21):-1
const count=(v:number[])=>v.reduce((a,b)=>a+b,0)
export function scaleMove(s:Scale,a:number):Scale|null{
 if(!Number.isSafeInteger(a)||a<0||s.answer)return null
 if(a>=answerOffset){
  const answer=unpack(a-answerOffset,5,21)
  if(!answer||answer[0]!==s.reference||new Set(answer).size!==5||!answer.slice(1).every(w=>s.menu.includes(w)))return null
  return {...s,answer,score:s.weights.filter((v,i)=>v===answer[i]).length}
 }
 if(s.log.length>=scaleLimit)return null
 const q=unpack(a,10,5)
 if(!q)return null
 const left=q.slice(0,5),right=q.slice(5)
 if(![left,right].every(side=>count(side)>0&&count(side)<=6)||left.every((v,i)=>v===right[i]))return null
 const diff=s.weights.reduce((acc,w,i)=>acc+w*(left[i]-right[i]),0)
 return {...s,log:[...s.log,{left,right,sign:Math.sign(diff) as Sign}]}
}
export function scaleView(s:Scale,done:boolean){
 return {reference:s.reference,rank:s.rank,menu:s.menu,log:s.log,score:s.score,answer:done?s.answer:null,solution:done?s.weights:null}
}
