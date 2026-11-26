export const fenceSide=5
export const fenceTime=240_000
type Clue=number|null
type Mark=0|1|2
function geometry(){
 const n=fenceSide,w=n+1,horizontal=n*w
 const h=(r:number,c:number)=>r*n+c,v=(r:number,c:number)=>horizontal+r*w+c
 const edges:[number,number][]=[]
 for(let r=0;r<=n;r++)for(let c=0;c<n;c++)edges.push([r*w+c,r*w+c+1])
 for(let r=0;r<n;r++)for(let c=0;c<=n;c++)edges.push([r*w+c,(r+1)*w+c])
 const vertices=Array.from({length:w*w},()=>[] as number[])
 edges.forEach(([a,b],i)=>{vertices[a].push(i);vertices[b].push(i)})
 const cells=Array.from({length:n*n},(_,i)=>{
  const r=Math.floor(i/n),c=i%n
  return [h(r,c),h(r+1,c),v(r,c),v(r,c+1)]
 })
 return {edges,vertices,cells,w,horizontal}
}
export const fenceGeometry=geometry()
export function fenceCheck(marks:number[],clues:Clue[]){
 const {edges,vertices,cells}=fenceGeometry
 const on=(i:number)=>marks[i]===1
 const sum=(positions:number[])=>positions.reduce((k,e)=>k+Number(on(e)),0)
 const degree=vertices.map(sum)
 const bad=degree.filter(n=>n!==0&&n!==2).length
 const count=marks.filter(n=>n===1).length
 const satisfied=cells.reduce((k,e,i)=>k+Number(clues[i]!==null&&sum(e)===clues[i]),0)
 const total=clues.filter(v=>v!==null).length
 const score=count===0?0:Math.max(0,satisfied-bad)
 if(bad||count<4||satisfied!==total)return {valid:false,bad,count,satisfied,total,score}
 const first=degree.findIndex(n=>n>0),seen=new Set([first]),pending=[first]
 for(let i=0;i<pending.length;i++){
  const u=pending[i]
  for(const edge of vertices[u])if(on(edge)){
   const [a,b]=edges[edge],other=a===u?b:a
   if(!seen.has(other)){seen.add(other);pending.push(other)}
  }
 }
 return {valid:seen.size===count,bad,count,satisfied,total,score}
}
export function shapeEdges(rows:string[]){
 const {edges,cells}=fenceGeometry
 const states=edges.map(()=>0)
 for(let i=0;i<cells.length;i++)if(rows[Math.floor(i/5)][i%5]==='#')for(const e of cells[i])states[e]^=1
 return states
}
export function clueCounts(solution:number[]){return fenceGeometry.cells.map(cell=>cell.reduce((n,e)=>n+solution[e],0))}
// Enumerate exact assignments with local clue/degree propagation; an explicit budget
// means a truncated search cannot be mistaken for a uniqueness proof.
export function solveFence(clues:Clue[],limit=120_000){
 const {edges,cells,vertices}=fenceGeometry
 const constraints=[...cells.flatMap((es,i)=>clues[i]===null?[]:[{es,allowed:[clues[i] as number]}]),...vertices.map(es=>({es,allowed:[0,2]}))]
 const weights=edges.map((_,i)=>constraints.reduce((n,c)=>n+(c.es.includes(i)?(c.allowed.length===1?3:1):0),0))
 const solutions:number[][]=[]
 let nodes=0,exhausted=false
 function visit(values:number[]){
  if(solutions.length>=2||exhausted)return
  if(++nodes>limit){exhausted=true;return}
  let changed=true
  while(changed){
   changed=false
   for(const {es,allowed} of constraints){
    let yes=0;const unset:number[]=[]
    for(const e of es){if(values[e]===1)yes++;else if(values[e]===-1)unset.push(e)}
    const possible=allowed.filter(n=>n>=yes&&n<=yes+unset.length)
    if(!possible.length)return
    if(unset.length&&possible.length===1&&(possible[0]===yes||possible[0]===yes+unset.length)){
     const set=Number(possible[0]!==yes)
     for(const e of unset)values[e]=set
     changed=true
    }
   }
  }
  let edge=-1
  for(let i=0;i<values.length;i++)if(values[i]===-1&&(edge===-1||weights[i]>weights[edge]))edge=i
  if(edge===-1){if(fenceCheck(values,clues).valid)solutions.push(values);return}
  const off=values.slice();off[edge]=0;visit(off);values[edge]=1;visit(values)
 }
 visit(edges.map(()=>-1))
 return {solutions,exhausted,nodes}
}
const bank=[
 {rows:['.##..','###..','..###','...##','.....'],omit:[0,24,6,18,4,20,7,17]},
 {rows:['##...','####.','.#.#.','...##','.....'],omit:[0,24,6,18,4,20,7,17]},
 {rows:['..##.','...#.','.###.','.##..','##...'],omit:[0,24,6,18,4,20,17,9]},
] as const
export function fenceDeal(seed:number){
 const mixed=Math.imul(seed^0x4e9a21,0x9e3779b9)>>>0
 const entry=bank[mixed%bank.length],transform=(mixed>>>16)%8
 function index(r:number,c:number){
  if(transform&4)c=4-c
  for(let i=0;i<(transform&3);i++)[r,c]=[4-c,r]
  return 5*r+c
 }
 const flat=Array<string>(25),hidden=new Set<number>()
 for(let i=0;i<25;i++){
  const r=Math.floor(i/5),c=i%5,j=index(r,c)
  flat[j]=entry.rows[r][c]
  if((entry.omit as readonly number[]).includes(i))hidden.add(j)
 }
 const solution=shapeEdges(Array.from({length:5},(_,r)=>flat.slice(r*5,r*5+5).join('')))
 const clues=clueCounts(solution).map((v,i)=>hidden.has(i)?null:v)
 return {clues,solution}
}
type Progress={marks:Mark[],solvedAt:number|null}
export type Fence={deal:ReturnType<typeof fenceDeal>,players:Record<string,Progress>}
export function fenceStart(seed:number,seats:string[]):Fence{
 return {deal:fenceDeal(seed),players:Object.fromEntries(seats.map(id=>[id,{marks:fenceGeometry.edges.map(()=>0),solvedAt:null}]))}
}
export const fenceScores=(s:Fence)=>Object.entries(s.players).map(([id,p])=>({id,elapsed:p.solvedAt,points:fenceCheck(p.marks,s.deal.clues).score}))
export function fencePlay(s:Fence,id:string,a:number,elapsed:number):Fence|null{
 const i=Math.floor(a/3),val=a%3 as Mark,p=s.players[id]
 if(!p||p.solvedAt!==null||!Number.isInteger(a)||a<0||i>=p.marks.length||p.marks[i]===val)return null
 const marks=p.marks.slice();marks[i]=val
 const solvedAt=fenceCheck(marks,s.deal.clues).valid?elapsed:null
 return {...s,players:{...s.players,[id]:{marks,solvedAt}}}
}
export function fenceView(s:Fence,id:string,done:boolean){
 const p=s.players[id]
 return {clues:s.deal.clues,marks:p?.marks??fenceGeometry.edges.map(()=>0),solved:!!p&&p.solvedAt!==null,
  solution:done?s.deal.solution:null,results:done?fenceScores(s):null}
}
