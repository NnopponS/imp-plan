export const ticketNames=['Sum','Product last digit','Integer quotient','Difference'] as const
type Offer={from:number,to:number,ticket:number}
export type Clue={other:number,ticket:number,result:number,round:number}
type Pick=[number,number]
type Guess={own:number,others:Pick[]}
export type Secret={phase:'contact'|'guess',values:number[],tickets:number[][],chips:number[],offers:Offer[],used:string[],clues:Clue[][],guesses:(Guess|null)[]}
export const buyer=1
const guessMin=5000, radix=1701
export const contactAction=(from:number,to:number,ticket:number)=>2+from*64+to*4+ticket
const pack=(guess:Pick|null)=>guess?guess[0]*100+guess[1]:0
export const guessAction=(own:number,a:Pick|null,b:Pick|null)=>guessMin+((own*radix+pack(a))*radix+pack(b))
const decompose=(n:number):Pick=>[Math.floor((n-1)/100),(n-1)%100+1]
export function clue(ticket:number,a:number,b:number){
 return ticket===0?a+b:ticket===1?a*b%10:ticket===2?Math.floor(Math.max(a,b)/Math.min(a,b)):Math.abs(a-b)
}
export function initSecret(n:number,seed:number):Secret{
 const deck=Array.from({length:100},(_,i)=>i+1)
 for(let i=99;i>0;i--){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const j=Math.floor(seed*(i+1)/4294967296);[deck[i],deck[j]]=[deck[j],deck[i]]}
 return {phase:'contact',values:deck.slice(0,n),tickets:Array.from({length:n},()=>Array(4).fill(n<=5?2:1)),chips:Array(n).fill(4),offers:[],used:[],clues:Array.from({length:n},()=>[]),guesses:Array(n).fill(null)}
}
const pair=(a:number,b:number)=>Math.min(a,b)+':'+Math.max(a,b)
export function secretStep(s:Secret,i:number,code:number,round:number):Secret|null{
 if(!Number.isInteger(code))return null
 const n=s.values.length
 if(s.phase==='guess'){
  if(code<guessMin||s.guesses[i])return null
  const digit=code-guessMin,own=Math.floor(digit/radix**2)
  const others=[Math.floor(digit/radix)%radix,digit%radix].filter(v=>v!==0).map(decompose)
  if(own<1||own>100||others.some(([j])=>j===i||j>=n)||new Set(others.map(p=>p[0])).size!==others.length)return null
  return {...s,guesses:s.guesses.map((g,j)=>j===i?{own,others}:g)}
 }
 if(code===buyer){
  if(s.chips[i]<2)return null
  return {...s,tickets:s.tickets.map((t,j)=>i===j?t.map(v=>v+1):t),chips:s.chips.map((c,j)=>i===j?c-2:c)}
 }
 const from=Math.floor((code-2)/64), to=Math.floor((code-2)%64/4), ticket=(code-2)%4
 if(from!==i||to<0||to>=n||to===i||!s.tickets[i][ticket]||!s.tickets[to][ticket]||s.used.includes(pair(i,to)))return null
 const matched=s.offers.find(o=>o.from===to&&o.to===i&&o.ticket===ticket)
 if(!matched){
  if(s.offers.some(o=>o.from===i&&o.to===to&&o.ticket===ticket))return null
  return {...s,offers:[...s.offers.filter(o=>o.from!==i||o.to!==to),{from:i,to,ticket}]}
 }
 const result=clue(ticket,s.values[i],s.values[to])
 return {...s,used:[...s.used,pair(i,to)],offers:s.offers.filter(o=>pair(o.from,o.to)!==pair(i,to)),tickets:s.tickets.map((t,j)=>j===i||j===to?t.map((v,k)=>k===ticket?v-1:v):t),clues:s.clues.map((c,j)=>j===i||j===to?[...c,{other:j===i?to:i,ticket,result,round}]:c)}
}
export function secretView(s:Secret,i:number,done:boolean){
 return {phase:s.phase,offers:s.offers.filter(o=>o.from===i||o.to===i),clues:s.clues[i]??[],chips:s.chips[i]??0,tickets:s.tickets[i]??[],locked:!!s.guesses[i],submitted:s.guesses.filter(Boolean).length,reveal:done?s.values:null,used:s.used.flatMap(p=>{const [a,b]=p.split(':').map(Number);return a===i?[b]:b===i?[a]:[]})}
}
export function secretScore(s:Secret,i:number){
 const g=s.guesses[i]
 return g?(g.own===s.values[i]?4:0)+g.others.reduce((v,[j,n])=>v+(s.values[j]===n?2:-1),0):0
}
export function candidates(clues:Clue[]){
 const grouped=new Map<number,Clue[]>()
 for(const c of clues)grouped.set(c.other,[...(grouped.get(c.other)??[]),c])
 const numbers=Array.from({length:100},(_,i)=>i+1)
 return numbers.filter(a=>[...grouped.values()].every(group=>numbers.some(b=>a!==b&&group.every(c=>clue(c.ticket,a,b)===c.result))))
}
