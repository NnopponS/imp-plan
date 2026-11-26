export const codeColors=['Teal','Amber','Plum'] as const
export const codeSymbols=['◆','▲','●'] as const
const rank=(card:number)=>card%4+1
const color=(card:number)=>Math.floor(card/4)
export const codeCard=(card:number)=>codeColors[color(card)]+' '+rank(card)
type Code=readonly number[]
type Clue=
 |{kind:'sum',slots:number[],value:number}
 |{kind:'exclude',slot:number,card:number}
 |{kind:'count',axis:'rank'|'color',value:number,count:number}
 |{kind:'order',a:number,b:number,relation:-1|0|1}
 |{kind:'adjacent',a:number,b:number,next:boolean}
type Challenge={answer:Code,clues:Clue[]}
export const packCode=(cards:Code)=>cards.length===4&&new Set(cards).size===4&&cards.every(n=>Number.isInteger(n)&&n>=0&&n<12)?cards.reduce((a,b)=>a*12+b,0):null
export function unpackCode(value:number):Code|null{
 if(!Number.isInteger(value)||value<0||value>=12**4)return null
 const cards=[Math.floor(value/1728),Math.floor(value/144)%12,Math.floor(value/12)%12,value%12]
 return packCode(cards)===null?null:cards
}
let universe:Code[]|undefined
function allCodes(){
 if(universe)return universe
 const pool:Code[]=[]
 for(let a=0;a<12;a++)for(let b=0;b<12;b++)if(b!==a)for(let c=0;c<12;c++)if(c!==a&&c!==b)for(let d=0;d<12;d++)if(d!==a&&d!==b&&d!==c)pool.push([a,b,c,d])
 return universe=pool
}
export function clueMatches(c:Clue,a:Code):boolean{
 switch(c.kind){
  case 'sum':return c.slots.reduce((n,i)=>n+rank(a[i]),0)===c.value
  case 'exclude':return a[c.slot]!==c.card
  case 'count':return a.reduce((n,k)=>n+Number((c.axis==='rank'?rank(k):color(k))===c.value),0)===c.count
  case 'order':return Math.sign(rank(a[c.a])-rank(a[c.b]))===c.relation
  case 'adjacent':{const i=a.indexOf(c.a),j=a.indexOf(c.b);return i>=0&&j>=0&&(Math.abs(i-j)===1)===c.next}
 }
}
export const solveCode=(clues:Clue[])=>allCodes().filter(a=>clues.every(c=>clueMatches(c,a)))
export function codeChallenge(seed:number):Challenge{
 const all=allCodes()
 const answer=all[(seed>>>0)%all.length]
 const clues:Clue[]=[],pool:Clue[]=[]
 for(let i=0;i<4;i++)for(let j=0;j<12;j++)if(j!==answer[i])pool.push({kind:'exclude',slot:i,card:j})
 for(const axis of ['rank','color'] as const){
  for(let v=axis==='rank'?1:0;v<(axis==='rank'?5:3);v++)pool.push({kind:'count',axis,value:v,count:answer.filter(x=>(axis==='rank'?rank(x):color(x))===v).length})
 }
 pool.push({kind:'sum',slots:[0,1,2,3],value:answer.reduce((n,c)=>n+rank(c),0)})
 for(let i=0;i<4;i++)for(let j=i+1;j<4;j++){
  pool.push({kind:'sum',slots:[i,j],value:rank(answer[i])+rank(answer[j])})
  pool.push({kind:'order',a:i,b:j,relation:Math.sign(rank(answer[i])-rank(answer[j])) as -1|0|1})
  pool.push({kind:'adjacent',a:answer[i],b:answer[j],next:j-i===1})
 }
 let candidates=all
 function best(kind?:Clue['kind']){
  let min=Infinity,winner=-1
  const offset=seed>>>0
  for(let t=0;t<pool.length;t++){
   const i=(t+offset)%pool.length,c=pool[i]
   if(kind&&c.kind!==kind)continue
   let count=0
   for(const a of candidates)if(clueMatches(c,a))count++
   if(count<min){min=count;winner=i}
  }
  if(winner<0)return
  const clue=pool.splice(winner,1)[0]
  clues.push(clue);candidates=candidates.filter(a=>clueMatches(clue,a))
 }
 for(const kind of ['sum','count','order','adjacent','exclude'] as const)best(kind)
 while((candidates.length>1||clues.length<6)&&clues.length<12)best()
 if(candidates.length!==1){
  // Bounded proof fallback: three consecutive neighbor pairs give a single path up to reversal.
  const forced:Clue[]=[0,1,2].map(i=>({kind:'adjacent',a:answer[i],b:answer[i+1],next:true}))
  const a=answer[0],b=answer[3]
  forced.push({kind:'exclude',slot:0,card:b},{kind:'sum',slots:[0,1,2,3],value:answer.reduce((n,c)=>n+rank(c),0)},
   {kind:'order',a:0,b:3,relation:Math.sign(rank(a)-rank(b)) as -1|0|1},{kind:'count',axis:'color',value:color(a),count:answer.filter(x=>color(x)===color(a)).length})
  return {clues:forced,answer}
 }
 return {answer,clues}
}
export function clueText(c:Clue):string{
 switch(c.kind){
  case 'sum':return 'Ranks in '+(c.slots.length===4?'all four slots':'slots '+c.slots.map(s=>s+1).join(' and '))+' add to '+c.value+'.'
  case 'exclude':return 'Slot '+(c.slot+1)+' is not '+codeCard(c.card)+'.'
  case 'count':return 'There '+(c.count===1?'is':'are')+' exactly '+c.count+' '+(c.axis==='rank'?'rank '+c.value:codeColors[c.value])+' '+(c.count===1?'card.':'cards.')
  case 'order':return 'The rank in slot '+(c.a+1)+' is '+(c.relation===0?'equal to':c.relation===1?'higher than':'lower than')+' the rank in slot '+(c.b+1)+'.'
  case 'adjacent':return codeCard(c.a)+' and '+codeCard(c.b)+' are both used and '+(c.next?'are':'are not')+' neighbors.'
 }
}

type Attempt={cards:Code,correct:number}
export type CodeLock={challenge:Challenge,logs:Attempt[][],solo:boolean}
export const codeStart=(seats:number,seed:number,solo:boolean):CodeLock=>({challenge:codeChallenge(seed),logs:Array.from({length:seats},()=>[]),solo})
export const codePenalty=(s:CodeLock,i:number)=>s.solo?0:(s.logs[i]?.filter(a=>a.correct<4).length??0)*15000
export const codeClosed=(s:CodeLock,i:number,now:number,deadline:number)=>!s.logs[i]||s.logs[i].at(-1)?.correct===4||(!s.solo&&s.logs[i].length>=3)||now>=deadline-codePenalty(s,i)
export function codeMove(s:CodeLock,i:number,value:number,now:number,deadline:number):CodeLock|null{
 const cards=unpackCode(value)
 if(!cards||codeClosed(s,i,now,deadline))return null
 const correct=cards.filter((v,j)=>v===s.challenge.answer[j]).length
 const logs=s.logs.map((log,j)=>i===j?[...(s.solo?log.slice(-11):log),{cards,correct}]:log)
 return {...s,logs}
}
export function codeView(s:CodeLock,i:number,finished:boolean){
 const attempts=s.logs[i]??[]
 return {clues:s.challenge.clues,solo:s.solo,attempts:attempts.map(a=>({cards:a.cards,correct:s.solo||finished?a.correct:null})),
  penalty:codePenalty(s,i),answer:finished?s.challenge.answer:null}
}
export function codeScores(s:CodeLock){return s.logs.map(a=>Math.max(0,...a.map(r=>r.correct)))}
