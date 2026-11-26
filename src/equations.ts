export type Mark='exact'|'present'|'absent'
type Row={guess:string,marks:Mark[]}
type Pair<T>=[T,T]
type Phase='choose'|'guess'|'done'
export type Equations={phase:Phase,turn:0|1,secrets:Pair<string|null>,rows:Pair<Row[]>,winner:0|1|null}
export const equationLimit=8
const form=/^(?:0|[1-9]\d*)(?:[+*/-](?:0|[1-9]\d*))+=(?:0|[1-9]\d*)$/

export function equationValid(value:string):boolean {
 if(value.length!==8||!form.test(value)||/[^0-9+*/=\-]/.test(value))return false
 const [left,right]=value.split('=')
 const parts=left.match(/\d+|[+*/-]/g)!
 let sum=0, term=Number(parts[0]), sign=1
 for(let i=1;i<parts.length;i+=2){
  const n=Number(parts[i+1]), op=parts[i]
  if(op==='*')term*=n
  else if(op==='/'){
   if(n===0||term%n!==0)return false
   term/=n
  }else{
   sum+=sign*term
   sign=op==='+'?1:-1
   term=n
  }
 }
 return sum+sign*term===Number(right)
}

export function equationMarks(secret:string,guess:string):Mark[] {
 const remaining=new Map<string,number>()
 const result:Mark[]=Array.from(guess,(char,i)=>{
  if(char===secret[i])return 'exact'
  remaining.set(secret[i],(remaining.get(secret[i])??0)+1)
  return 'absent'
 })
 return result.map((mark,i)=>{
  const n=remaining.get(guess[i])??0
  if(mark==='exact'||n===0)return mark
  remaining.set(guess[i],n-1)
  return 'present'
 })
}
export const equationStart=():Equations=>({phase:'choose',turn:0,secrets:[null,null],rows:[[],[]],winner:null})
const exactCount=(r:Row)=>r.marks.filter(m=>m==='exact').length

export function equationPlay(g:Equations,seat:number,guess:string):Equations|null{
 if(g.phase==='done'||g.turn!==seat||!equationValid(guess))return null
 if(g.phase==='choose'){
  const secrets:Pair<string|null>=[...g.secrets]
  secrets[seat]=guess
  return {...g,secrets,turn:seat===0?1:0,phase:seat===0?'choose':'guess'}
 }
 if(g.rows[seat].length>=equationLimit||g.rows[seat].some(row=>row.guess===guess))return null
 const other=seat===0?1:0
 const rows:Pair<Row[]>=[...g.rows]
 rows[seat]=[...rows[seat],{guess,marks:equationMarks(g.secrets[other]!,guess)}]
 const turn=other
 if(seat===0)return {...g,rows,turn}
 const best=rows.map(log=>Math.max(...log.map(exactCount)))
 if(best.some(n=>n===8)||rows[1].length===equationLimit){
  const earlier=rows.map((log,i)=>log.findIndex(r=>exactCount(r)===best[i]))
  const rank=best[0]-best[1]||earlier[1]-earlier[0]
  return {...g,rows,turn,phase:'done',winner:rank>0?0:rank<0?1:null}
 }
 return {...g,rows,turn}
}

export function equationView(g:Equations,seat:number){
 return {phase:g.phase,own:g.secrets[seat]??null,locked:g.secrets.map(Boolean),rows:g.rows[seat]??[],
  counts:g.rows.map(r=>r.length),responding:g.phase==='guess'&&g.turn===1&&g.rows[0].some(r=>exactCount(r)===8)}
}

/** Bounded practice corpus. Humans can enter valid equations outside it. */
let pool:readonly string[]|undefined
export function equationPool():readonly string[]{
 if(pool)return pool
 const values=new Set<string>()
 const add=(s:string)=>{if(equationValid(s))values.add(s)}
 for(let a=0;a<150;a++)for(let b=0;b<100;b++){
  add(a+'+'+b+'='+(a+b));add(a+'-'+b+'='+(a-b));add(a+'*'+b+'='+(a*b))
  if(b&&a%b===0)add(a+'/'+b+'='+(a/b))
 }
 for(let a=0;a<10;a++)for(let b=0;b<10;b++)for(let c=0;c<20;c++){
  add(a+'+'+b+'*'+c+'='+(a+b*c));add(a+'*'+b+'-'+c+'='+(a*b-c))
 }
 pool=Array.from(values)
 return pool
}
/** Uses only the bot's projection and its own host-supplied seed. */
export function equationBot(v:ReturnType<typeof equationView>,seed:number){
 const options=equationPool()
 const start=(seed>>>0)%options.length
 if(v.phase==='choose')return v.own===null?options[start]:undefined
 if(v.phase!=='guess')return
 const tried=new Set(v.rows.map(r=>r.guess))
 let fallback:string|undefined
 for(let n=0;n<options.length;n++){
  const candidate=options[(start+235+n)%options.length]
  if(tried.has(candidate))continue
  fallback??=candidate
  if(v.rows.every(r=>equationMarks(candidate,r.guess).every((mark,i)=>mark===r.marks[i])))return candidate
 }
 return fallback
}
