export const linkSide=6
export const linkCells=linkSide*linkSide
export const linkPairLimit=6
const searchBudget=80_000, raceMs=90_000, reviewMs=4_500

export type LinkPair=readonly [number,number]
export type LinkPaths=readonly (readonly number[])[]
export type LinkAction=
 |{type:'place';cells:LinkPair}
 |{type:'accept'|'challenge'}
 |{type:'proof';paths:LinkPaths}
export type LinkVerdict={status:'feasible';paths:LinkPaths}|{status:'impossible'|'unknown'}

export const linkCell=(n:unknown):n is number=>typeof n==='number'&&Number.isInteger(n)&&n>=0&&n<linkCells
const distance=(a:number,b:number)=>Math.abs(a%linkSide-b%linkSide)+Math.abs(Math.floor(a/linkSide)-Math.floor(b/linkSide))
export const linkAdjacent=(a:number,b:number)=>linkCell(a)&&linkCell(b)&&distance(a,b)===1
const cells=Array.from({length:linkCells},(_,i)=>i)
const near=cells.map(a=>cells.filter(b=>linkAdjacent(a,b)))
const toward=cells.map(target=>near.map(list=>[...list].sort((a,b)=>distance(a,target)-distance(b,target))))
const rim=[
 ...cells.slice(0,linkSide),...cells.filter(n=>n>=linkSide&&n%linkSide===linkSide-1),
 ...cells.slice(linkCells-linkSide,linkCells-1).reverse(),...cells.filter(n=>n>0&&n<linkCells-linkSide&&n%linkSide===0).reverse()
]
const rimIndex=cells.map(n=>rim.indexOf(n))
const validPairs=(pairs:readonly LinkPair[])=>{
 if(pairs.length>linkPairLimit)return false
 const endpoints=new Set<number>()
 for(const p of pairs){
  if(!p||p.length!==2||!linkCell(p[0])||!linkCell(p[1])||p[0]===p[1]||endpoints.has(p[0])||endpoints.has(p[1]))return false
  endpoints.add(p[0]);endpoints.add(p[1])
 }
 return true
}

export function colorLinkProof(pairs:readonly LinkPair[],paths:unknown):paths is LinkPaths{
 if(!validPairs(pairs)||!Array.isArray(paths)||paths.length!==pairs.length)return false
 const used=new Set<number>(), endpoints=new Set(pairs.flat())
 for(let i=0;i<paths.length;i++){
  const path=paths[i]
  if(!Array.isArray(path)||path.length<2||path.length>linkCells)return false
  const [a,b]=pairs[i], start=path[0], end=path.at(-1)
  if(!(start===a&&end===b)&&!(start===b&&end===a))return false
  for(let j=0;j<path.length;j++){
   const cell=path[j]
   if(!linkCell(cell)||used.has(cell)||(j!==0&&j!==path.length-1&&endpoints.has(cell))||(j>0&&!linkAdjacent(path[j-1],cell)))return false
   used.add(cell)
  }
 }
 return true
}

const decisive=new Map<string,LinkVerdict>()
const impossible=Object.freeze({status:'impossible'} as const)
const unknown=Object.freeze({status:'unknown'} as const)
const freezeProof=(paths:LinkPaths):LinkPaths=>Object.freeze(paths.map(path=>Object.freeze([...path])))

/** Enumerate all simple paths, backtracking through alternative routings, not just shortest paths.
 * A perimeter separation theorem and residual shortest-route lower bounds only prune impossible branches.
 * The fixed count of DFS node visits caps CPU even if no proof is found. */
export function colorLinkSolve(pairs:readonly LinkPair[],budget=searchBudget):LinkVerdict{
 if(!validPairs(pairs))return impossible
 let remaining=Number.isFinite(budget)?Math.min(searchBudget,Math.max(0,Math.floor(budget))):0
 if(remaining===0)return unknown
 const key=pairs.map(p=>p.join(',')).join(';')
 const useCache=remaining===searchBudget
 const prior=useCache?decisive.get(key):undefined
 if(prior)return prior
 function finish(result:LinkVerdict){
  if(useCache&&result.status!=='unknown'){
   if(decisive.size>=256)decisive.delete(decisive.keys().next().value!)
   decisive.set(key,Object.freeze(result))
  }
  return result
 }
 for(let i=0;i<pairs.length;i++){
  const [a,b]=pairs[i].map(n=>rimIndex[n]).sort((x,y)=>x-y)
  if(a<0)continue
  for(let j=0;j<i;j++){
   const [c,d]=pairs[j].map(n=>rimIndex[n])
   if(c>=0&&d>=0&&(a<c&&c<b)!==(a<d&&d<b))return finish(impossible)
  }
 }

 const occupied=new Uint8Array(linkCells)
 for(const n of pairs.flat())occupied[n]=1
 const answer:number[][]=[]
 const order=pairs.map((_,i)=>i).sort((i,j)=>distance(...pairs[j])-distance(...pairs[i]))
 const queue=new Uint8Array(linkCells), seen=new Uint32Array(linkCells), depth=new Uint8Array(linkCells)
 let search=0
 function shortest(start:number,end:number){
  search++
  queue[0]=start;depth[start]=0;seen[start]=search
  for(let from=0,to=1;from<to;from++){
   const a=queue[from]
   for(const b of near[a]){
    if(b===end)return depth[a]+1
    if(occupied[b]||seen[b]===search)continue
    queue[to++]=b;seen[b]=search;depth[b]=depth[a]+1
   }
  }
  return Infinity
 }
 function route(k:number,free:number):boolean{
  if(k===order.length)return true
  let minimum=0
  for(let j=k;j<order.length;j++){
   minimum+=shortest(...pairs[order[j]])-1
   if(minimum>free)return false
  }
  const i=order[k], [start,end]=pairs[i], path=[start]
  // While exploring this path, the other pairs need at least this many free cells.
  const reserve=minimum-(shortest(start,end)-1)
  function extend(at:number,left:number):boolean{
   if(remaining<=0)return false
   remaining--
   for(const next of toward[end][at]){
    if(next===end){
     answer[i]=[...path,end]
     if(route(k+1,left))return true
    }else if(!occupied[next]&&left>reserve&&distance(next,end)-1<=left-1-reserve){
     occupied[next]=1;path.push(next)
     if(extend(next,left-1))return true
     path.pop();occupied[next]=0
    }
    if(remaining<=0)break
   }
   return false
  }
  return extend(start,free)
 }
 const solved=route(0,linkCells-pairs.length*2)
 if(solved)return finish({status:'feasible',paths:freezeProof(answer)})
 return remaining<=0?unknown:finish(impossible)
}

type PairRecord={cells:LinkPair;owner:string}
type LinkPhase='place'|'respond'|'race'|'review'|'finished'
type ReviewReason='connected'|'impossible'|'accepted-impossible'|'race'|'place-timeout'|'race-timeout'|'inconclusive'
type Review={winner:string|null;reason:ReviewReason;paths:LinkPaths|null;automatic?:boolean}
export type ColorLink={
 seats:readonly [string,string];window:number;budget:number;phase:LinkPhase;round:number;step:number;actor:string|null;
 deadline:number|null;pairs:PairRecord[];score:readonly [number,number];retryAt:number|null;blocker:string|null;
 review:Review|null;winner:string|null
}
export type LinkView=Omit<ColorLink,'window'|'budget'|'blocker'|'retryAt'>&{retry:boolean}

export function colorLinkStart(seats:readonly string[],now:number,window:number,budget=searchBudget):ColorLink{
 if(seats.length!==2||!seats[0]||!seats[1]||seats[0]===seats[1]||!Number.isFinite(now)||!Number.isFinite(window)||window<=0)throw new RangeError('Invalid Color Link table')
 return {seats:[seats[0],seats[1]],window,budget,phase:'place',round:1,step:0,actor:seats[0],deadline:now+window,pairs:[],
  score:[0,0],retryAt:null,blocker:null,review:null,winner:null}
}
const other=(g:ColorLink,seat:string)=>g.seats[seat===g.seats[0]?1:0]
function review(g:ColorLink,now:number,result:Review):ColorLink{
 const score:[number,number]=[g.score[0]+Number(result.winner===g.seats[0]),g.score[1]+Number(result.winner===g.seats[1])]
 const done=g.round===3||score.some(n=>n===2)
 return {...g,phase:done?'finished':'review',step:g.step+1,actor:null,deadline:done?null:now+reviewMs,review:result,score,
  winner:done&&score[0]!==score[1]?g.seats[score[0]>score[1]?0:1]:null}
}
function respond(g:ColorLink,now:number,challenge:boolean,automatic=false):ColorLink{
 const placer=g.pairs.at(-1)!.owner, responder=other(g,placer)
 const latest=g.pairs.map(p=>p.cells)
 const result=g.blocker?impossible:colorLinkSolve(latest,g.budget)
 if(result.status==='unknown'){
  if(g.retryAt!==null)return review(g,now,{winner:null,reason:'inconclusive',paths:null})
  return {...g,step:g.step+1,phase:'place',actor:placer,deadline:now+g.window,pairs:g.pairs.slice(0,-1),retryAt:g.step+1}
 }
 if(challenge){
  return result.status==='feasible'?
   review(g,now,{winner:placer,reason:'connected',paths:result.paths,automatic}):
   review(g,now,{winner:responder,reason:'impossible',paths:null,automatic})
 }
 const blocker=g.blocker??(result.status==='impossible'?placer:null)
 if(g.pairs.length===linkPairLimit){
  if(blocker)return review(g,now,{winner:other(g,blocker),reason:'accepted-impossible',paths:null})
  return {...g,step:g.step+1,phase:'race',actor:null,deadline:now+raceMs}
 }
 return {...g,step:g.step+1,phase:'place',actor:responder,deadline:now+g.window,blocker}
}

export function colorLinkAct(g:ColorLink,seat:string,a:LinkAction,now:number):ColorLink|null{
 if(!g.seats.includes(seat)||g.deadline===null||!Number.isFinite(now)||now>=g.deadline)return null
 if(g.phase==='place'&&a.type==='place'&&g.actor===seat){
  const occupied=g.pairs.flatMap(p=>p.cells)
  if(!validPairs([a.cells])||a.cells.some(n=>occupied.includes(n))||g.pairs.length>=linkPairLimit)return null
  return {...g,step:g.step+1,phase:'respond',actor:other(g,seat),deadline:now+g.window,pairs:[...g.pairs,{owner:seat,cells:[...a.cells]}]}
 }
 if(g.phase==='respond'&&g.actor===seat&&(a.type==='accept'||a.type==='challenge'))return respond(g,now,a.type==='challenge')
 if(g.phase==='race'&&a.type==='proof'&&colorLinkProof(g.pairs.map(p=>p.cells),a.paths))return review(g,now,{winner:seat,reason:'race',paths:freezeProof(a.paths)})
 return null
}

export function colorLinkTick(g:ColorLink,now:number):ColorLink{
 if(!Number.isFinite(now)||g.deadline===null||now<g.deadline)return g
 if(g.phase==='place')return review(g,now,{winner:other(g,g.actor!),reason:'place-timeout',paths:null})
 if(g.phase==='respond')return respond(g,now,true,true)
 if(g.phase==='race')return review(g,now,{winner:null,reason:'race-timeout',paths:null})
 if(g.phase!=='review')return g
 return {...g,step:g.step+1,phase:'place',round:g.round+1,actor:g.seats[g.round%2],deadline:now+g.window,pairs:[],retryAt:null,blocker:null,review:null}
}

export function colorLinkView(g:ColorLink):LinkView{
 const {window:_,budget:__,blocker:___,retryAt,...view}=g
 return {...view,retry:retryAt===g.step}
}

type Level='easy'|'normal'|'hard'
export const colorLinkRaceBotDelay=(level:Level='normal')=>level==='easy'?62_000:level==='hard'?26_000:43_000

export function colorLinkBot(v:LinkView,seat:string,seed:number,level:Level):LinkAction|undefined{
 if(!v.seats.includes(seat)||(v.phase!=='race'&&v.actor!==seat))return
 const pairs=v.pairs.map(p=>p.cells)
 const result=colorLinkSolve(pairs)
 if(v.phase==='respond')return {type:result.status==='impossible'?'challenge':'accept'}
 if(v.phase==='race')return result.status==='feasible'?{type:'proof',paths:result.paths}:undefined
 if(v.phase!=='place')return
 // Prefer an open edge that preserves a witness for every pair already on the board.
 const anchors=new Set(pairs.flat()), open=cells.filter(n=>!anchors.has(n))
 const inWitness=new Set(result.status==='feasible'?result.paths.flat():[])
 const rank=(n:number)=>(Math.imul(n+1,0x9e3779b9)^seed^Math.imul(v.step+1,0x85ebca6b))>>>0
 const candidates:LinkPair[]=open.flatMap(a=>near[a].filter(b=>b>a&&!anchors.has(b)).map(b=>[a,b] as const))
 candidates.sort((p,q)=>{
  const edge=(n:number)=>near[n].length
  const score=(t:LinkPair)=>level==='hard'?edge(t[0])+edge(t[1]):0
  return score(q)-score(p)||rank(p[0]*linkCells+p[1])-rank(q[0]*linkCells+q[1])
 })
 const known=candidates.find(([a,b])=>result.status==='feasible'&&!inWitness.has(a)&&!inWitness.has(b))
 if(known)return {type:'place',cells:known}
 // A blocked board is still legal to play on; the opposing player owns the call.
 // Keep fallback work smaller than one full adjudication.
 const alternative=candidates.slice(0,4).find(p=>colorLinkSolve([...pairs,p],2000).status==='feasible')
 const fallback=alternative??candidates[0]??(open.length>=2?[open[0],open[1]] as const:undefined)
 if(fallback)return {type:'place',cells:fallback}
}
