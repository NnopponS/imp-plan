import fc from 'fast-check'
import {expect,test} from 'vitest'
import {
 wallGoBot,wallGoDecode,wallGoEdges,wallGoEncode,wallGoFallback,wallGoPlay,
 wallGoStart,wallGoTerritory,wallGoView,type WallGo
} from '../src/wall-go'

const edge=(a:number,b:number)=>wallGoEdges.findIndex(([x,y])=>x===Math.min(a,b)&&y===Math.max(a,b))
const action=(p:number,a:number,b:number)=>wallGoEncode(p,edge(a,b))
const start=()=>wallGoStart(['gold','red'])

test('serves two opposite corners, with the first seat configurable for a rematch',()=>{
 const opening=wallGoView(start())
 expect(opening.pawns).toEqual([0,48])
 expect(opening.turn).toBe('gold')
 expect(opening.walls).toEqual([])
 expect(opening.legal).toHaveLength(18)
 expect(wallGoView(wallGoStart(['gold','red'],1)).turn).toBe('red')
 for(const seats of [[],['gold'],['gold','gold'],['gold',''],['gold','red','jade']]){
  expect(()=>wallGoStart(seats)).toThrow()
 }
})

test('geometry has one unit wall per orthogonally neighboring pair and never wraps rows',()=>{
 expect(wallGoEdges).toHaveLength(84)
 expect(new Set(wallGoEdges.map(e=>e.join(','))).size).toBe(84)
 expect(edge(6,7)).toBe(-1)
 expect(wallGoEdges[0]).toEqual([0,1])
 expect(wallGoEdges[41]).toEqual([47,48])
 expect(wallGoEdges[42]).toEqual([0,7])
 expect(wallGoEdges[83]).toEqual([41,48])
 for(let i=0;i<49;i++){
  for(let j=i+1;j<49;j++){
   const d=Math.abs(i%7-j%7)+Math.abs(Math.floor(i/7)-Math.floor(j/7))
   expect(edge(i,j)>=0).toBe(d===1)
  }
 }
})

test('decodes only whole safe numeric turn actions',()=>{
 expect(wallGoDecode(wallGoEncode(48,83))).toEqual({destination:48,edge:83})
 expect(wallGoDecode(0)).toEqual({destination:0,edge:0})
 for(const bad of [-1,0.5,4116,NaN,Infinity,2**53,'42',null,{},[0],undefined])expect(wallGoDecode(bad)).toBeNull()
 expect(wallGoDecode(wallGoEncode(1,84))).toBeNull()
 expect(wallGoDecode(wallGoEncode(1,-1))).toBeNull()
})

test('moves and walls are atomic, alternated, and validated against the current position',()=>{
 const initial=start()
 const valid=action(8,8,9)
 expect(wallGoPlay(initial,'red',valid)).toBeNull()
 expect(wallGoPlay(initial,'spectator',valid)).toBeNull()
 expect(wallGoPlay(initial,'gold',action(3,3,4))).toBeNull() // three steps
 expect(wallGoPlay(initial,'gold',action(7,0,1))).toBeNull() // not adjacent to destination
 expect(wallGoPlay(initial,'gold',{destination:8,edge:7})).toBeNull()
 const placed=wallGoPlay(initial,'gold',valid)!
 expect(wallGoView(placed)).toMatchObject({
  pawns:[8,48],walls:[edge(8,9)],turn:'red',turns:1,
  lastMove:{seat:'gold',destination:8,edge:edge(8,9)},end:null
 })
 expect(wallGoView(initial)).toMatchObject({pawns:[0,48],walls:[],turn:'gold',turns:0,lastMove:null})
 expect(wallGoPlay(placed,'gold',valid)).toBeNull()
})

test('closed edges block movement, but an available two-step alternate route is legal',()=>{
 const board:WallGo={...start(),walls:[edge(0,1)]}
 expect(wallGoPlay(board,'gold',action(1,1,2))).toBeNull()
 expect(wallGoPlay(board,'gold',action(0,0,1))).toBeNull()
 expect(wallGoPlay(board,'gold',action(8,8,9))).not.toBeNull()
 expect(wallGoPlay(board,'gold',action(0,0,7))).not.toBeNull()
})

test('an occupied cell cannot be entered or used as a shortcut',()=>{
 const board:WallGo={...start(),pawns:[0,1]}
 expect(wallGoPlay(board,'gold',action(1,1,2))).toBeNull()
 expect(wallGoPlay(board,'gold',action(2,2,3))).toBeNull()
 expect(wallGoPlay(board,'gold',action(8,8,9))).not.toBeNull()
 expect(wallGoPlay(board,'gold',action(0,0,1))).not.toBeNull() // wall does not occupy their cell
})

test('territory leaves shared and empty components neutral',()=>{
 expect(wallGoTerritory([0,48],[])).toEqual({owners:Array(49).fill(null),scores:[0,0],neutral:49})
 const split=[...Array.from({length:7},(_,r)=>edge(7*r+2,7*r+3)),edge(6,5),edge(6,13)]
 const territory=wallGoTerritory([0,48],split)
 expect(territory.scores).toEqual([21,27])
 expect(territory.neutral).toBe(1)
 expect(territory.owners[6]).toBeNull()
 expect(territory.owners[0]).toBe(0)
 expect(territory.owners[48]).toBe(1)
})

test('the turn that separates the pawns finishes immediately and awards the larger region',()=>{
 let board=wallGoPlay(start(),'gold',action(0,0,1))!
 board=wallGoPlay(board,'red',action(48,47,48))!
 board=wallGoPlay(board,'gold',action(0,0,7))!
 const view=wallGoView(board)
 expect(view).toMatchObject({turn:null,turns:3,end:'separated',winner:'red',territory:{scores:[1,48],neutral:0},legal:[]})
 expect(wallGoPlay(board,'red',action(48,41,48))).toBeNull()
 expect(wallGoFallback(view)).toBeUndefined()
 expect(wallGoBot(view,'red')).toBeUndefined()
})

test('an exact split with unclaimed cells is a draw, not a first-seat win',()=>{
 const label=(i:number)=>{
  const r=Math.floor(i/7),c=i%7
  return c<3||c===3&&r<3?0:c>3||c===3&&r>3?1:2
 }
 const finalEdge=edge(3,4)
 const walls=wallGoEdges.flatMap(([a,b],id)=>label(a)!==label(b)&&id!==finalEdge?[id]:[])
 const board:WallGo={...start(),pawns:[3,48],walls,turns:walls.length}
 const final=wallGoPlay(board,'gold',wallGoEncode(3,finalEdge))!
 expect(wallGoView(final)).toMatchObject({end:'separated',winner:null,territory:{scores:[24,24],neutral:1}})
})

test('turn 40 ends even if pawns are still in the same region, without a tiebreak advantage',()=>{
 const board:WallGo={...start(),turns:39}
 const final=wallGoPlay(board,'gold',action(0,0,1))!
 expect(wallGoView(final)).toMatchObject({turn:null,turns:40,end:'turn-limit',winner:null,territory:{scores:[0,0],neutral:49},legal:[]})
})

test('the guest view contains public board fields only and is a detached snapshot',()=>{
 const board=wallGoPlay(start(),'gold',action(0,0,1))!
 const live=wallGoView(board)
 expect(JSON.parse(JSON.stringify(live))).toEqual(live)
 expect(Object.keys(live).sort()).toEqual(['end','lastMove','legal','pawns','seats','territory','turn','turns','walls','winner'])
 live.pawns[0]=30
 live.walls.length=0
 live.seats[0]='fake'
 live.lastMove!.edge=83
 expect(wallGoView(board)).toMatchObject({pawns:[0,48],walls:[0],seats:['gold','red'],lastMove:{edge:0}})
})

test('timed-out turns use a legal stay-and-wall fallback with mirror fairness at the opening',()=>{
 const a=wallGoView(start()),b=wallGoView(wallGoStart(['gold','red'],1))
 const left=wallGoDecode(wallGoFallback(a))!,right=wallGoDecode(wallGoFallback(b))!
 expect(a.legal).toContain(wallGoFallback(a))
 expect(b.legal).toContain(wallGoFallback(b))
 expect(left.destination).toBe(0)
 expect(right.destination).toBe(48)
 expect(wallGoEdges[right.edge]).toEqual([...wallGoEdges[left.edge]].reverse().map(p=>48-p))
})

test('bot policies are deterministic, can avoid rejected moves, and never control another seat',()=>{
 const v=wallGoView(start())
 for(const level of ['easy','normal','hard'] as const){
  const first=wallGoBot(v,'gold',24,level)!
  expect(v.legal).toContain(first)
  expect(wallGoBot(v,'gold',24,level)).toBe(first)
  const next=wallGoBot(v,'gold',24,level,new Set([first]))
  expect(v.legal).toContain(next)
  expect(next).not.toBe(first)
  expect(wallGoBot(v,'gold',24,level,new Set(v.legal))).toBeUndefined()
  expect(wallGoBot(v,'red',24,level)).toBeUndefined()
 }
})

test('normal and hard recognize an immediate winning separation instead of walling themselves in',()=>{
 const split=[...Array.from({length:7},(_,r)=>edge(7*r+2,7*r+3)).slice(1),edge(6,5)]
 const board:WallGo={...start(),pawns:[4,0],walls:split}
 const v=wallGoView(board)
 for(const level of ['normal','hard'] as const){
  const best=wallGoBot(v,'gold',21,level)!
  const result=wallGoView(wallGoPlay(board,'gold',best)!)
  expect(result).toMatchObject({end:'separated',winner:'gold',territory:{scores:[28,21]}})
 }
})

// A row/column oracle that does not use engine edge lookup, reachability or generation.
// It blocks every tested wall and searches an independent 7x7 coordinate neighborhood.
function oracle(view:ReturnType<typeof wallGoView>){
 const wallPairs=new Set(view.walls.map(i=>{
  const [a,b]=wallGoEdges[i]
  return a*49+b
 }))
 const open=(u:number,v:number)=>!wallPairs.has(Math.min(u,v)*49+Math.max(u,v))
 const near=(p:number)=>[
  ...(p%7>0?[p-1]:[]),...(p%7<6?[p+1]:[]),...(p>=7?[p-7]:[]),...(p<42?[p+7]:[]),
 ]
 const expand=(seeds:number[],limit:number,exclude?:number)=>{
  const seen=new Set(seeds)
  let layer=seeds
  for(let n=0;n<limit&&layer.length;n++){
   layer=layer.flatMap(p=>near(p).filter(q=>{
    if(q===exclude||seen.has(q)||!open(p,q))return false
    seen.add(q)
    return true
   }))
  }
  return seen
 }
 const blue=expand([view.pawns[0]],49),red=expand([view.pawns[1]],49)
 const scores:[number,number]=blue.has(view.pawns[1])?[0,0]:[blue.size,red.size]
 const at=view.turn===null?-1:view.seats.indexOf(view.turn)
 const moves=new Set<number>()
 if(at>=0){
  const reachable=expand([view.pawns[at]],2,view.pawns[1-at])
  for(const p of reachable)for(const q of near(p))if(open(p,q))moves.add(action(p,p,q))
 }
 return {scores,moves}
}

test('generated legal turns agree with an independent board oracle across random replays',()=>{
 fc.assert(fc.property(
  fc.boolean(),fc.array(fc.nat({max:5000}),{minLength:40,maxLength:40}),
  (second,choices)=>{
   let board=wallGoStart(['gold','red'],+second)
   for(let turn=0;turn<=choices.length;turn++){
    const v=wallGoView(board)
    const independent=oracle(v)
    expect(v.territory.scores).toEqual(independent.scores)
    expect(v.territory.neutral+v.territory.scores[0]+v.territory.scores[1]).toBe(49)
    expect(v.legal.length).toBe(independent.moves.size)
    expect(new Set(v.legal)).toEqual(independent.moves)
    if(!v.turn){expect(v.end).not.toBeNull();break}
    expect(turn).toBeLessThan(40)
    const code=v.legal[choices[turn]%v.legal.length]
    const parsed=wallGoDecode(code)!
    const next=wallGoPlay(board,v.turn,code)!
    expect(next.walls.length).toBe(v.walls.length+1)
    expect(next.walls).toContain(parsed.edge)
    expect(next.pawns).not.toEqual([parsed.destination,parsed.destination])
    expect(v.walls).not.toContain(parsed.edge)
    board=next
   }
  }
 ),{seed:20261127,numRuns:45})
})
