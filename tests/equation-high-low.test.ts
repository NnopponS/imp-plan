import {describe,expect,it} from 'vitest'
import {arrangeEquation,equationBot,equationStart,equationStep,equationTick,equationView,type EquationAction,type EquationState} from '../src/equation-high-low'

const orderedDeck=Array.from({length:44},(_,i)=>i)
function deal(...hands:number[][]){
 const top=hands.flat()
 return [...top,...orderedDeck.filter(card=>!top.includes(card))]
}
function start(hands?:number[][],seats=['Ada','Bo']){
 return equationStart(seats,42,0,10000,hands?Array.from({length:4},()=>deal(...hands)):undefined)
}
function act(s:EquationState,seat:string,a:EquationAction){
 const next=equationStep(s,seat,a,s.stage.deadline!-1)
 if(!next)throw Error('Illegal action: '+JSON.stringify({seat,a,phase:s.stage.phase}))
 return next
}
function checkAll(s:EquationState){
 while(s.stage.phase==='opening'||s.stage.phase==='closing')s=act(s,equationView(s).turn!,{kind:'call'})
 return s
}
const exact={order:[0,1,2,3] as [number,number,number,number],ops:0}
describe('Equation High-Low',()=>{
 it('evaluates all four cards with standard operator precedence and exact rationals',()=>{
  expect(arrangeEquation([40,4,36,4],exact)).toEqual({numerator:2,denominator:1}) // 10 + 1 − 9 ÷ 1
  expect(arrangeEquation([8,12,4,8],exact)).toEqual({numerator:9,denominator:2}) // 2 + 3 − 1 ÷ 2
  expect(arrangeEquation([40,4,36,0],exact)).toBeNull()
  expect(arrangeEquation([40,4,36,0],{order:[1,1,2,3],ops:0})).toBeNull()
  expect(arrangeEquation([40,4,36,4],{...exact,ops:6})).toBeNull()
 })
 it('deals 2–8 unique seats, keeps private and not-yet-dealt faces out of peer projections',()=>{
  const seats=Array.from({length:8},(_,i)=>'p'+i)
  const a=start(undefined,seats),b=start(undefined,seats)
  expect(a).toEqual(b)
  const watch=equationView(a),own=equationView(a,seats[2])
  expect(watch.mine).toBeNull()
  expect(watch.table.every(row=>row.open.length===2)).toBe(true)
  expect(own.mine?.hand).toHaveLength(3)
  expect(Object.keys(watch).sort()).not.toContain('decks')
  expect(checkAll(a).stage.phase).toBe('seal')
  expect(()=>start(undefined,seats.concat('p8'))).toThrow()
  expect(()=>start(undefined,['p0'])).toThrow()
  expect(()=>start(undefined,['p0','p0'])).toThrow()
 })
 it('allows a raise and response, but rejects an out-of-turn or over-cap wager',()=>{
  let s=start()
  expect(equationStep(s,'Bo',{kind:'call'},0)).toBeNull()
  expect(equationStep(s,'Ada',{kind:'raise',to:4},0)).toBeNull()
  s=act(s,'Ada',{kind:'raise',to:2})
  expect(equationView(s,'Bo')).toMatchObject({turn:'Bo',pot:4,toCall:2})
  s=act(s,'Bo',{kind:'raise',to:3})
  s=act(s,'Ada',{kind:'call'})
  expect(equationView(s,'Ada')).toMatchObject({phase:'closing',turn:'Ada',pot:8})
  expect(equationView(s,'Ada').mine?.hand).toHaveLength(4)
 })
 it('seals secretly and splits a real pot across the two lanes',()=>{
  let s=checkAll(start([[40,41,4,5],[8,17,20,21]]))
  const before=equationView(s,'Bo')
  s=act(s,'Ada',{kind:'seal',low:null,high:exact})
  expect(equationView(s,'Bo')).toEqual(before)
  expect(equationView(s,'Ada').mine?.locked).toBe(true)
  expect(equationStep(s,'Ada',{kind:'seal',low:null,high:exact},0)).toBeNull()
  s=act(s,'Bo',{kind:'seal',low:exact,high:null})
  const v=equationView(s)
  expect(v).toMatchObject({phase:'review',latest:{pot:2,low:'Bo',high:'Ada'}})
  expect(v.latest?.rows[0].entries[0].value).toEqual({numerator:19,denominator:1})
  expect(v.table.map(p=>p.stack)).toEqual([12,12])
 })
 it('gives the odd chip to High and preserves the folded hand',()=>{
  let s=start([[40,41,4,5],[8,17,20,21],[12,13,18,22]],['Ada','Bo','Cy'])
  s=act(s,'Ada',{kind:'call'})
  s=act(s,'Bo',{kind:'call'})
  s=act(s,'Cy',{kind:'fold'})
  s=checkAll(s)
  s=act(s,'Ada',{kind:'seal',low:exact,high:null})
  s=act(s,'Bo',{kind:'seal',low:null,high:exact})
  expect(equationView(s).latest).toMatchObject({pot:3,low:'Ada',high:'Bo',rows:[{award:1},{award:2},{award:0,hand:null}]})
 })
 it('returns the pot when all seats time out before declaring',()=>{
  const s=checkAll(start())
  const v=equationView(equationTick(s,s.stage.deadline!))
  expect(v.latest).toMatchObject({pot:2,refunded:true,rows:[{award:1,hand:null},{award:1,hand:null}]})
  expect(v.table.map(r=>r.stack)).toEqual([12,12])
 })
 it('breaks equal High values by the strongest physical card',()=>{
  let s=checkAll(start([[40,41,4,5],[42,43,6,7]]))
  for(const seat of ['Ada','Bo'])s=act(s,seat,{kind:'seal',low:null,high:exact})
  expect(equationView(s).latest).toMatchObject({low:null,high:'Bo',rows:[{award:0},{award:2}]})
 })
 it('withdraws a Swing that loses either lane and awards the full pot to the remaining lane',()=>{
  let s=checkAll(start([[40,4,24,8],[41,42,0,9]]))
  s=act(s,'Ada',{kind:'seal',low:{...exact,order:[2,1,0,3]},high:exact})
  s=act(s,'Bo',{kind:'seal',low:null,high:exact})
  expect(equationView(s).latest).toMatchObject({low:null,high:'Bo',rows:[{swingMiss:true,award:0},{award:2}]})
 })
 it('awards both lanes to a Swing that beats both opponents',()=>{
  let s=checkAll(start([[40,41,4,5],[8,17,20,21],[12,13,18,22]],['Ada','Bo','Cy']))
  s=act(s,'Ada',{kind:'seal',low:{...exact,order:[2,0,1,3]},high:exact})
  s=act(s,'Bo',{kind:'seal',low:exact,high:null})
  s=act(s,'Cy',{kind:'seal',low:null,high:exact})
  expect(equationView(s).latest).toMatchObject({low:'Ada',high:'Ada',rows:[{award:3},{award:0},{award:0}]})
 })
 it('settles disconnected timeouts and four bot-played rounds without losing chips',()=>{
  let s=start(),actions=0
  s=act(s,'Ada',{kind:'raise',to:1})
  s=equationTick(s,s.stage.deadline!)
  expect(equationView(s).latest).toMatchObject({uncontested:'Ada',pot:3})
  expect(equationView(s).latest?.rows.every(r=>r.entries.length===0)).toBe(true)
  while(s.stage.phase!=='finished'&&actions++<100){
   const next=s.seats.map(seat=>({seat,a:equationBot(equationView(s,seat),seat,131,'hard')})).find(x=>x.a)
   s=next?act(s,next.seat,next.a!):equationTick(s,s.stage.deadline!)
  }
  const final=equationView(s)
  expect(final).toMatchObject({phase:'finished',round:4})
  expect(final.leaders.length).toBeGreaterThan(0)
  expect(final.table.reduce((pot,row)=>pot+row.stack,0)).toBe(24)
 })
})
