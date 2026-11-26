export type DivineSide=3|5|7
export const divineSymbols=['✦','△','◯','◇','□','✚','☾','⊙','⬡','♢'] as const
export const magicTarget=(side:DivineSide)=>side*(side*side+1)/2
export function magicSolution(side:DivineSide,seed:number){
 const base=Array<number>(side*side).fill(0)
 let row=0,col=Math.floor(side/2)
 for(let v=1;v<=base.length;v++){
  base[row*side+col]=v
  const r=(row+side-1)%side,c=(col+1)%side
  if(base[r*side+c])row=(row+1)%side
  else{row=r;col=c}
 }
 return base.map((_,i)=>{
  let x=i%side,y=Math.floor(i/side)
  if(seed&1)x=side-1-x
  if(seed&2)y=side-1-y
  if(seed&4)[x,y]=[y,x]
  const v=base[y*side+x]
  return seed&8?base.length+1-v:v
 })
}
export function magicCheck(cells:number[],side:DivineSide){
 const n=side*side
 if(cells.length!==n||cells.some(v=>!Number.isInteger(v)||v<1||v>n)||new Set(cells).size!==n)return false
 const target=magicTarget(side)
 let a=0,b=0
 for(let i=0;i<side;i++){
  let row=0,col=0
  for(let j=0;j<side;j++){row+=cells[i*side+j];col+=cells[j*side+i]}
  if(row!==target||col!==target)return false
  a+=cells[i*(side+1)];b+=cells[(i+1)*(side-1)]
 }
 return a===target&&b===target
}
export type Divine={side:DivineSide,fixed:number,clue:number,hard:boolean,digits:number[],tileOrder:number[],entries:Record<string,number[]>}
export function divineInit(side:DivineSide,seed:number,hard:boolean,seats:string[]):Divine{
 const solution=magicSolution(side,seed),fixed=(seed>>>16)%solution.length
 const digits=Array.from({length:10},(_,i)=>i)
 let s=seed>>>0
 for(let i=digits.length-1;i>0;i--){
  s=(Math.imul(s,1664525)+1013904223)>>>0
  const j=s%(i+1);[digits[i],digits[j]]=[digits[j],digits[i]]
 }
 const tileOrder=Array.from({length:solution.length+1},(_,i)=>i)
 if(hard)for(let i=tileOrder.length-1;i>1;i--){
  s=(Math.imul(s,1664525)+1013904223)>>>0
  const j=1+s%i;[tileOrder[i],tileOrder[j]]=[tileOrder[j],tileOrder[i]]
 }
 const clue=solution[fixed],cells=solution.map((_,i)=>i===fixed?clue:0)
 return {side,fixed,clue,hard,digits,tileOrder,entries:Object.fromEntries(seats.map(id=>[id,cells]))}
}
export function divineView(p:Divine,seat:string){
 const {side,fixed,digits,hard}=p
 // Hard-mode equations form a chain from zero, so the mapping is unique.
 const clues=digits.map((glyph,n)=>({glyph,previous:n?digits[n-1]:null}))
   .sort((a,b)=>a.glyph-b.glyph)
 return {side,fixed,target:magicTarget(side),hard,legend:hard?null:digits,clues:hard?clues:null,
  cells:p.entries[seat]?.map(v=>p.tileOrder.indexOf(v))??[],tileGlyphs:p.tileOrder.map(v=>String(v).split('').map(d=>digits[Number(d)]))}
}
export function divinePlay(p:Divine,seat:string,code:number):Divine|null{
 const cells=p.entries[seat],index=Math.floor(code/50),value=p.tileOrder[code%50]
 if(!cells||!Number.isInteger(code)||code<0||index>=cells.length||index===p.fixed||value===undefined||value===p.clue||value===cells[index])return null
 const old=value?cells.indexOf(value):-1
 const next=cells.slice()
 if(old>=0)next[old]=next[index]
 next[index]=value
 return {...p,entries:{...p.entries,[seat]:next}}
}
