import {startMatch} from './start-match'
import {chooseGame} from '../lobby-controls'
import {expect,test} from '@playwright/test'
import {calibration,scaleNames} from '../../src/scale'

test('two players solve the shared scale with ternary observations and rotating operator',async({browser,baseURL})=>{
 const desktop=await browser.newContext(),mobile=await browser.newContext({viewport:{width:360,height:780},hasTouch:true})
 try{
  const host=await desktop.newPage(),guest=await mobile.newPage()
  await host.goto(baseURL!+'season/1/')
  await host.getByLabel('Nickname').fill('Ada')
  await host.getByRole('button',{name:'Create party'}).click()
  const code=(await host.getByTestId('room-code').textContent())!
  await chooseGame(host,'scale')
  await guest.goto(baseURL!+'#/join?room='+code)
  await guest.getByLabel('Nickname').fill('Mina')
  await guest.getByRole('button',{name:'Join party'}).click()
  await guest.getByRole('button',{name:'Ready up'}).click()
  await startMatch(host)
  const bench=(p:typeof host)=>p.getByRole('region',{name:'Scale Game bench'})
  const ref=Number((await bench(host).getByText(/Brass: \d+ units/).innerText()).match(/\d+/)![0])
  const options=(await bench(host).getByText(/Possible weights:/).innerText()).split('Possible weights: ')[1].match(/\d+/g)!.map(Number)
  const answer=[ref]
  let turn=0
  for(const mineral of scaleNames.slice(1)){
   let pool=options.filter(v=>!answer.includes(v))
   while(pool.length>1){
    const pivot=pool[Math.floor(pool.length/2)], [q,b]=calibration(pivot,ref)!
    const player=turn%2?guest:host,other=turn%2?host:guest
    const current=bench(player),opponent=bench(other)
    await expect(opponent.getByRole('button',{name:/^Right pan,/})).toBeDisabled()
    const activate=(button:ReturnType<typeof current.getByRole>)=>turn%2?button.tap():button.click()
    await activate(current.getByRole('button',{name:/^Left pan,/}))
    for(let i=0;i<q;i++)await activate(current.getByRole('button',{name:'Add '+mineral+' to Left pan'}))
    await activate(current.getByRole('button',{name:/^Right pan,/}))
    for(let i=0;i<b;i++)await activate(current.getByRole('button',{name:'Add Brass to Right pan'}))
    await expect(current.locator('.scale-stage')).toHaveAttribute('data-reading','unweighed')
    await activate(current.getByRole('button',{name:'Weigh minerals'}))
    turn++
    await expect(bench(other).getByText(turn+' / 12 weighings')).toBeVisible()
    const reading=(await bench(other).getByRole('status').innerText()).split('.')[0]
    expect(['Left lighter','Balanced','Left heavier']).toContain(reading)
    const result=['Left lighter','Balanced','Left heavier'].indexOf(reading)-1
    for(const p of [current,opponent]){
     const instrument=p.locator('.scale-stage')
     await expect(instrument).toHaveAttribute('data-reading',['lighter','balanced','heavier'][result+1])
     await expect.poll(()=>instrument.locator('.scale-beam').evaluate(beam=>Math.sign(new DOMMatrix(getComputedStyle(beam).transform).b))).toBe(result===0?0:-result)
     await expect.poll(()=>instrument.locator('.scale-hanger').first().evaluate((hanger:SVGGElement)=>Math.abs(hanger.getScreenCTM()!.b))).toBeLessThan(.002)
    }
    pool=pool.filter(v=>Math.sign(v-pivot)===['Left lighter','Balanced','Left heavier'].indexOf(reading)-1)
   }
   expect(pool).toHaveLength(1)
   answer.push(pool[0])
  }
  expect(turn).toBeLessThanOrEqual(8)
  const operator=turn%2?guest:host
  await bench(operator).getByText('Lock one team answer').click()
  const waiting=operator===host?guest:host
 await bench(waiting).getByText('Lock one team answer').click()
 await expect(bench(waiting).getByRole('button',{name:'Assign Jade weight'})).toBeDisabled()
 await expect(bench(waiting).getByRole('button',{name:'Submit final weights'})).toBeDisabled()
 for(let i=1;i<5;i++){
  const mineral=scaleNames[i]
  await bench(operator).getByRole('button',{name:'Assign '+mineral+' weight'}).press('Enter')
  await bench(operator).getByRole('group',{name:'Weight tokens for '+mineral}).getByRole('button',{name:answer[i]+' units',exact:true}).press('Enter')
  await expect(bench(operator).getByRole('button',{name:'Assign '+mineral+' weight'})).toHaveAttribute('data-assigned',String(answer[i]))
 }
  await expect(bench(waiting).locator('[data-assigned]')).toHaveCount(0)
 await bench(operator).getByRole('button',{name:'Submit final weights'}).press('Enter')
  for(const p of [host,guest]){
   await expect(p.getByRole('heading',{name:'Weights solved'})).toBeVisible()
   await expect(bench(p).getByRole('status')).toHaveText('Team score: 5 / 5.')
  }
  expect(await guest.evaluate(()=>document.documentElement.scrollWidth)).toBe(360)
 }finally{await desktop.close();await mobile.close()}
})
