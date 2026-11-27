import {expect,test} from 'vitest'
import {renderToStaticMarkup} from 'react-dom/server'
import {RuleDemo,hasRuleDemo} from '../src/rule-demo'
import {move,reward,start,view} from '../src/engine'
import {pieceCanPlace,pieceFootprint,pieceRotation} from '../src/piece'
import {blindDemoMoves,pieceDemo} from '../src/rule-demo'

test('Blind Gomoku uses the real 15 by 15 board and reveals a legal five-stone win',()=>{
 let g=start('blind',['a','b'],25000,0)
 const place=(n:number)=>blindDemoMoves[n][1]*15+blindDemoMoves[n][0]
 for(let i=0;i<blindDemoMoves.length-1;i++)g=move(g,g.seats[g.turn],place(i),i+1)!
 expect(g.done).toBe(false)
 expect(view(g,'a').board.filter(cell=>cell==='?')).toHaveLength(8)
 g=move(g,g.seats[g.turn],place(8),9)!
 expect(g.done).toBe(true)
 expect(g.winner).toBe('a')
 const visible=renderToStaticMarkup(<RuleDemo game="blind" step={0}/>)
 expect(visible).toContain('15 × 15 board')
 expect((visible.match(/<line /g)??[]).length).toBe(32)
 const hidden=renderToStaticMarkup(<RuleDemo game="blind" step={1}/>)
 expect((hidden.match(/data-stone="veiled"/g)??[]).length).toBe(8)
 expect(hidden).not.toContain('data-stone="diamond"')
 const end=renderToStaticMarkup(<RuleDemo game="blind" step={2}/>)
 expect(end).toContain('Five in a row')
 expect((end.match(/data-stone="circle"/g)??[]).length).toBe(5)
 expect((end.match(/data-stone="diamond"/g)??[]).length).toBe(4)
})
test('Time Auction represents time banks, sealed bids, and an engine-consistent reward',()=>{
 const art=(step:number)=>renderToStaticMarkup(<RuleDemo game="auction" step={step}/>)
 expect(art(0)).toMatch(/60\s*s/)
 expect(art(1)).toMatch(/15 seconds/)
 expect(art(1)).not.toContain('data-reveal')
 expect(art(2)).toContain('data-reveal')
 let s=start('auction',['a','b','c'],25000,0)
 for(const [i,bid] of [9000,5000,8000].entries())s=move(s,s.seats[i],bid,i+1)!
 expect(s.credits).toEqual([51000,55000,52000])
 expect(art(2)).toContain('51 s')
 expect(art(2)).toContain('55 s')
 expect(art(2)).toContain('52 s')
 expect(view(s,'a').scores[0]).toBe(reward(1))
 expect(art(3)).toContain('18 s wins the tie')
})
test('Piece Puzzle shows a real irregular rotation and a legal fit, not a sample answer',()=>{
 const {layout,fit}=pieceDemo
 expect(pieceCanPlace({...layout,placements:[null]},0,fit)).toBe(true)
 expect(pieceRotation(layout.pieces[0],fit.rotation)).not.toEqual(layout.pieces[0])
 expect(pieceFootprint(layout,0,fit.rotation,fit.anchor)).toHaveLength(4)
 const art=(step:number)=>renderToStaticMarkup(<RuleDemo game="piece" step={step}/>)
 expect(art(0)).toContain('data-grid-size="7"')
 expect(art(1)).toContain('Rotate 90° and fit')
 expect(art(2)).toContain('3:40')
 expect(art(3)).toContain('next seat')
})
test('unsupported games stay text-only; authored steps are safe outside the normal range',()=>{
 expect(hasRuleDemo('blind')).toBe(true)
 expect(hasRuleDemo('auction')).toBe(true)
 expect(hasRuleDemo('piece')).toBe(true)
 expect(hasRuleDemo('secret')).toBe(false)
 expect(renderToStaticMarkup(<RuleDemo game="secret" step={0}/>)).toBe('')
 expect(renderToStaticMarkup(<RuleDemo game="blind" step={99}/>)).toContain('Five in a row')
 expect(renderToStaticMarkup(<RuleDemo game="blind" step={-1}/>)).toContain('15 × 15 board')
})
