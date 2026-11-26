import {startMatch} from './start-match'
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
  await host.getByLabel('Game').selectOption('scale')
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
    await expect(bench(other).getByLabel('Right Brass quantity')).toBeDisabled()
    await bench(player).getByLabel('Left '+mineral+' quantity').selectOption(String(q))
    await bench(player).getByLabel('Right Brass quantity').selectOption(String(b))
    await bench(player).getByRole('button',{name:'Weigh minerals'}).click()
    turn++
    await expect(bench(other).getByText(turn+' / 12 weighings')).toBeVisible()
    const reading=(await bench(other).getByRole('status').innerText()).split('.')[0]
    expect(['Left lighter','Balanced','Left heavier']).toContain(reading)
    pool=pool.filter(v=>Math.sign(v-pivot)===['Left lighter','Balanced','Left heavier'].indexOf(reading)-1)
   }
   expect(pool).toHaveLength(1)
   answer.push(pool[0])
  }
  expect(turn).toBeLessThanOrEqual(8)
  const operator=turn%2?guest:host
  await bench(operator).getByText('Lock one team answer').click()
  for(let i=1;i<5;i++)await bench(operator).getByLabel(scaleNames[i]+' weight').selectOption(String(answer[i]))
  await bench(operator).getByRole('button',{name:'Submit final weights'}).press('Enter')
  for(const p of [host,guest]){
   await expect(p.getByRole('heading',{name:'Weights solved'})).toBeVisible()
   await expect(bench(p).getByRole('status')).toHaveText('Team score: 5 / 5.')
  }
  expect(await guest.evaluate(()=>document.documentElement.scrollWidth)).toBe(360)
 }finally{await desktop.close();await mobile.close()}
})
