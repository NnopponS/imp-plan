import {describe,expect,it} from 'vitest'
import fc from 'fast-check'
import {colorLinkSolve,colorLinkProof,colorLinkStart,colorLinkAct,colorLinkTick,colorLinkView,colorLinkBot,type LinkAction,type LinkPair,type ColorLink} from '../src/color-link'

const ok=(game:ColorLink,seat:string,action:LinkAction,now=1)=>{
 const next=colorLinkAct(game,seat,action,now)
 if(!next)throw new Error('Expected a legal Color Link action')
 return next
}
const pair=(a:number,b:number):LinkAction=>({type:'place',cells:[a,b]})

describe('bounded Color Link path reasoning',()=>{
 it('returns an exact witness, even where two individually shortest routes conflict',()=>{
  const pairs:LinkPair[]=[[0,2],[1,7]]
  const result=colorLinkSolve(pairs)
  expect(result.status).toBe('feasible')
  if(result.status==='feasible'){
   expect(result.paths[0].length).toBeGreaterThan(3)
   expect(result.paths[1]).toEqual([1,7])
   expect(colorLinkProof(pairs,result.paths)).toBe(true)
  }
 })
 it('distinguishes crossed boundary terminals from a budget-exhausted query',()=>{
  const pairs:LinkPair[]=[[0,35],[5,30]]
  expect(colorLinkSolve(pairs,0)).toEqual({status:'unknown'})
  expect(colorLinkSolve([[0,2],[1,7]],1)).toEqual({status:'unknown'})
  expect(colorLinkSolve(pairs).status).toBe('impossible')
  expect(colorLinkSolve([[0,1],[1,7]]).status).toBe('impossible')
 })
 it('rejects row wrapping, diagonals, revisits, shared cells, and foreign terminals',()=>{
  expect(colorLinkProof([[5,6]],[[5,6]])).toBe(false)
  expect(colorLinkProof([[0,7]],[[0,7]])).toBe(false)
  expect(colorLinkProof([[0,2]],[[0,1,0,1,2]])).toBe(false)
  expect(colorLinkProof([[0,2],[7,13]],[[0,6,7,8,2],[7,13]])).toBe(false)
  expect(colorLinkProof([[0,2],[12,14]],[[0,6,7,8,2],[12,13,7,8,14]])).toBe(false)
  expect(colorLinkProof([[0,2]],Array(1))).toBe(false)
  expect(colorLinkProof([[0,2]],[[2,1,0]])).toBe(true)
 })
 it('finds a legal witness for generated disjoint horizontal or vertical strip pairs',()=>{
  fc.assert(fc.property(fc.array(fc.integer({min:0,max:35}),{minLength:1,maxLength:6}),fc.boolean(),(cells,vertical)=>{
   const pairs:LinkPair[]=[]
   cells.forEach(n=>{
    const x=n%6,y=Math.floor(n/6)
    if(pairs.some(([a])=>vertical?a%6===x:Math.floor(a/6)===y))return
    pairs.push(vertical?[x,x+6*(y+1>5?5:y+1)]:[6*y,6*y+(x+1>5?5:x+1)])
   })
   const result=colorLinkSolve(pairs)
   if(result.status!=='feasible')return false
   const marked=new Set<number>()
   return result.paths.every((path,i)=>path[0]===pairs[i][0]&&path.at(-1)===pairs[i][1]&&path.every((cell,j)=>{
    if(marked.has(cell))return false
    marked.add(cell)
    if(!j)return true
    return Math.abs(cell%6-path[j-1]%6)+Math.abs(Math.floor(cell/6)-Math.floor(path[j-1]/6))===1
   }))
  }),{numRuns:100})
 })
})

describe('Color Link duel',()=>{
 it('assigns challenges to the last placement, alternates openings and ends at two wins',()=>{
  let g=colorLinkStart(['Ada','Ben'],0,1000)
  expect(colorLinkAct(g,'Ben',pair(0,35),1)).toBeNull()
  expect(colorLinkAct(g,'Ada',pair(0,0),1)).toBeNull()
  g=ok(g,'Ada',pair(0,35))
  expect(colorLinkAct(g,'Ada',{type:'accept'},2)).toBeNull()
  g=ok(g,'Ben',{type:'accept'},2)
  expect(colorLinkAct(g,'Ben',pair(0,1),3)).toBeNull()
  g=ok(g,'Ben',pair(5,30),3)
  g=ok(g,'Ada',{type:'challenge'},4)
  expect(colorLinkView(g).review).toMatchObject({winner:'Ada',reason:'impossible',paths:null})
  g=colorLinkTick(g,g.deadline!)
  expect(colorLinkView(g)).toMatchObject({round:2,actor:'Ben',pairs:[]})
  g=ok(g,'Ben',pair(0,1),g.deadline!-1)
  g=ok(g,'Ada',{type:'challenge'},g.deadline!-1)
  expect(colorLinkView(g).review).toMatchObject({winner:'Ben',reason:'connected',paths:[[0,1]]})
  g=colorLinkTick(g,g.deadline!)
  expect(colorLinkView(g)).toMatchObject({round:3,actor:'Ada'})
  g=ok(g,'Ada',pair(0,1),g.deadline!-1)
  g=ok(g,'Ben',{type:'challenge'},g.deadline!-1)
  expect(colorLinkView(g)).toMatchObject({phase:'finished',winner:'Ada',score:[2,1]})
 })
 it('ignores late moves, auto-challenges responses, and never converts an unknown into a win',()=>{
  let g=colorLinkStart(['Ada','Ben'],0,1000,0)
  expect(colorLinkAct(g,'Ada',pair(0,1),1000)).toBeNull()
  g=ok(g,'Ada',pair(0,1))
  g=colorLinkTick(g,g.deadline!)
  expect(colorLinkView(g)).toMatchObject({actor:'Ada',phase:'place',retry:true,pairs:[],score:[0,0]})
  g=ok(g,'Ada',pair(0,1),g.deadline!-1)
  g=colorLinkTick(g,g.deadline!)
  expect(colorLinkView(g)).toMatchObject({phase:'review',score:[0,0],review:{winner:null,reason:'inconclusive'}})
 })
 it('starts a private race at six feasible pairs, only a complete valid proof wins',()=>{
  let g=colorLinkStart(['Ada','Ben'],0,1000)
  for(let i=0;i<6;i++){
   g=ok(g,i%2?'Ben':'Ada',pair(i*6,i*6+1),2*i+1)
   g=ok(g,i%2?'Ada':'Ben',{type:'accept'},2*i+2)
  }
  expect(colorLinkView(g)).toMatchObject({phase:'race',actor:null,review:null})
  expect(colorLinkAct(g,'Watcher',{type:'proof',paths:[]},20)).toBeNull()
  expect(colorLinkAct(g,'Ada',{type:'proof',paths:[[0,1]]},20)).toBeNull()
  const proof=Array.from({length:6},(_,i)=>[i*6,i*6+1])
  const win=ok(g,'Ben',{type:'proof',paths:proof},20)
  expect(colorLinkView(win).review).toMatchObject({winner:'Ben',reason:'race',paths:proof})
  expect(colorLinkAct(win,'Ada',{type:'proof',paths:proof},20)).toBeNull()
  expect(colorLinkView(colorLinkTick(g,g.deadline!)).review).toMatchObject({winner:null,reason:'race-timeout'})
 })
 it('attributes accepted blockers to the first bad pair at the six-pair cap',()=>{
  let g=colorLinkStart(['Ada','Ben'],0,1000)
  const cells:LinkPair[]=[[0,35],[5,30],[1,2],[6,7],[12,13],[18,19]]
  for(let i=0;i<6;i++){
   g=ok(g,i%2?'Ben':'Ada',pair(...cells[i]),2*i+1)
   g=ok(g,i%2?'Ada':'Ben',{type:'accept'},2*i+2)
  }
  expect(colorLinkView(g).review).toMatchObject({winner:'Ada',reason:'accepted-impossible'})
 })
 it('a visible-state bot plays only legal actions and a bot duel terminates',()=>{
  let g=colorLinkStart(['Ada','Ben'],0,1000)
  for(let i=1;!colorLinkView(g).winner&&i<100;i++){
   const v=colorLinkView(g)
   if(v.phase==='finished')break
   if(v.phase==='review'){g=colorLinkTick(g,g.deadline!);continue}
   const actor=v.actor??'Ada'
   const action=colorLinkBot(v,actor,12,'hard')
   if(!action)throw new Error('Expected visible-state bot action')
   g=ok(g,actor,action,g.deadline!-1)
  }
  expect(colorLinkView(g).phase).toBe('finished')
 })
})
