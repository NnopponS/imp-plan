import {magicCheck,magicSolution} from '../src/divine'
import {expect,test} from 'vitest'
import {hexLines,countRectangles} from '../src/puzzles'
import {move,start,timeout,view} from '../src/engine'
test('hex uses contiguous distinct lines and conceals values before accepting moves',()=>{
 const initial=start('hex',['a','b'],20000,100,{seed:19})
 const memorizing=view(initial,'a').puzzle!
 expect(memorizing.values).toHaveLength(19)
 expect(memorizing.target).toBeNull()
 expect(move(initial,'a',0,101)).toBeNull()
 const g=timeout(initial,30100)
 const clue=view(g,'a').puzzle!
 expect(clue.values).toEqual([])
 const lines=hexLines()
 expect(lines.length).toBeGreaterThan(10)
 expect(lines.every(line=>new Set(line).size===3)).toBe(true)
 const i=lines.findIndex(line=>line.reduce((sum,n)=>sum+memorizing.values[n],0)===clue.target)
 expect(i).toBeGreaterThanOrEqual(0)
 const locked=move(g,'a',i,30101)!
 expect(view(locked,'b').mine).toBeNull()
 expect(move(locked,'a',i,30102)).toBeNull()
 expect(timeout(locked,50100).scores[0]).toBe(720720)
})
test('rectangle solver matches brute force for signed grids; every round has a solution',()=>{
 for(let seed=0;seed<24;seed++){
  let g=start('rectangles',['a'],45000,100,{seed})
  for(let r=1;r<=4;r++){
   const p=view(g,'a').puzzle!
   let n=0
   for(let y=0;y<p.rows;y++)for(let x=0;x<p.cols;x++)for(let y2=y;y2<p.rows;y2++)for(let x2=x;x2<p.cols;x2++){
    let s=0;for(let j=y;j<=y2;j++)for(let i=x;i<=x2;i++)s+=p.values[j*p.cols+i]
    if(s===p.target)n++
   }
   expect(n).toBeGreaterThan(0)
   expect(countRectangles(p.values,p.rows,p.cols,p.target!)).toBe(n)
   expect(p).not.toHaveProperty('answer')
   expect(move(g,'a',15000,101)).toBeNull()
   g=move(g,'a',n,100+r)!
  }
  expect(g.done).toBe(true)
  expect(view(g,'a').scores).toEqual([4])
 }
 expect(countRectangles([0,0,0,0],2,2,0)).toBe(9)
})
test('sixteen private answers resolve deterministically and do not leak in-flight scores',()=>{
 const seats=Array.from({length:16},(_,i)=>'p'+i)
 let g=start('rectangles',seats,45000,0,{seed:100})
 for(let r=1;r<=4;r++){
  const p=view(g,seats[0]).puzzle!
  const correct=countRectangles(p.values,p.rows,p.cols,p.target!)
  for(let i=0;i<16;i++){
   g=move(g,seats[i],i<2?correct:0,(r-1)*300+i+5)!
   if(i===0){
    expect(view(g,seats[1]).mine).toBeNull()
    expect(view(g,seats[1]).scores[0]).toBe(r-1)
   }
  }
 }
 expect(g.winner).toBe(seats[0])
 expect(view(g,seats[0]).scores.slice(0,3)).toEqual([4,4,0])
})

test('Exile is a separate 90-second zero-sum challenge that stops after three grids',()=>{
 let g=start('exile',['fast','slow'],90000,0,{seed:7})
 for(let round=1;round<=3;round++){
  const p=view(g,'fast').puzzle!
  expect([p.rows,p.cols,p.target]).toEqual([round===1?6:8,8,0])
  expect(g.deadline-g.opened).toBe(90000)
  expect(p.values.some(n=>n<0)).toBe(true)
  expect(p.values.some(n=>n>0)).toBe(true)
  const correct=countRectangles(p.values,p.rows,p.cols,0)
  expect(correct).toBeGreaterThan(0)
  const t=g.opened
  g=move(g,'fast',correct,t+50)!
  expect(view(g,'slow').mine).toBeNull()
  expect(view(g,'slow').scores[0]).toBe(round-1)
  expect(move(g,'slow',correct,t+90000)).toBeNull()
  g=move(g,'slow',correct,t+100)!
 }
 expect(g.done).toBe(true)
 expect(g.winner).toBe('fast')
 expect(view(g,'fast').scores).toEqual([3,3])
})

test('Divine Test isolates each grid and finishes only on a validated square',()=>{
 let g=start('divine',['solves','other'],600000,0,{seed:17})
 const p=view(g,'solves').divine!
 expect(p?.cells).toHaveLength(49)
 expect(p?.target).toBe(175)
 expect(p?.cells.filter(Boolean)).toHaveLength(1)
 expect(p).not.toHaveProperty('solution')
 expect(move(g,'solves',p.fixed*50,1)).toBeNull()
 const i=p.cells.findIndex((n:number)=>!n),v=p.cells[p.fixed]===1?2:1
 g=move(g,'solves',i*50+v,2)!
 expect(view(g,'other').divine!.cells[i]).toBe(0)
 expect(g.done).toBe(false)
 const solution=magicSolution(7,17)
 for(let k=0;k<49;k++)if(k!==p.fixed&&view(g,'solves').divine!.cells[k]!==solution[k]){
   g=move(g,'solves',k*50+solution[k],3+k)!
 }
 expect(g.done).toBe(true)
 expect(g.winner).toBe('solves')
 expect(g.scores[0]).toBe(720720)
})

test('magic squares honor both diagonals and the hard numeral key is uniquely deducible',()=>{
 for(const side of [3,5,7] as const)for(let x=0;x<16;x++){
  const solution=magicSolution(side,x)
  expect(magicCheck(solution,side)).toBe(true)
  const changed=solution.slice()
  changed[0]=changed[1]
  expect(magicCheck(changed,side)).toBe(false)
 }
 expect(magicCheck([1,5,9,6,7,2,8,3,4],3)).toBe(false)
 const g=start('divine',['a'],600000,500,{seed:930842,divineSide:5,divineHard:true})
 const p=view(g,'a').divine!
 expect(p.legend).toBeNull()
 expect(p.tileGlyphs).toHaveLength(26)
 const chain:number[]=[]
 let previous:null|number=null
 for(let digit=0;digit<10;digit++){
  const matches=p.clues!.filter(c=>c.previous===previous)
  expect(matches).toHaveLength(1)
  previous=matches[0].glyph
  chain.push(previous)
 }
 const decoded=p.tileGlyphs.map(glyphs=>Number(glyphs.map(mark=>chain.indexOf(mark)).join('')))
 expect([...decoded].sort((a,b)=>a-b)).toEqual(Array.from({length:26},(_,i)=>i))
 expect(decoded).not.toEqual(Array.from({length:26},(_,i)=>i))
 expect(move(g,'a',50+decoded.indexOf(2),600500)).toBeNull()
 expect(timeout(g,600499)).toBe(g)
 expect(timeout(g,600500).done).toBe(true)
 expect(timeout(g,600500).winner).toBeNull()
})
