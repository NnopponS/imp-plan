import {test,expect,type Page} from '@playwright/test'
import {chooseGame,selectedGame,tableSwitch} from '../lobby-controls'
import {startMatch} from './start-match'

const table=(page:Page)=>page.getByRole('region',{name:'Memory Poker table'})
const cards=(page:Page)=>table(page).getByRole('group',{name:'Card layout'}).getByRole('button')
const roundResults=(page:Page,round:number)=>table(page).getByRole('region',{name:'Round '+round+' hands'})
// Keep both browser clocks moving in small steps so the guest's app heartbeat
// can reach the host before its virtual 30-second connection timeout.
const advanceRoom=async(host:Page,guest:Page,ms:number)=>{
 for(let remaining=ms;remaining>0;){
  const step=Math.min(4_000,remaining)
  await guest.clock.fastForward(step)
  await host.clock.fastForward(step)
  remaining-=step
 }
 await Promise.all([host.clock.runFor(240),guest.clock.runFor(240)])
}
const timeAdvance=async(host:Page,ms:number)=>{await host.clock.fastForward(ms);await host.clock.runFor(240)}

test('two players play four hands, keep locks and assistance private, then review an exact final score',async({browser,baseURL})=>{
 test.setTimeout(90_000)
 const desktop=await browser.newContext({reducedMotion:'reduce'}),mobile=await browser.newContext({viewport:{width:360,height:780},hasTouch:true,reducedMotion:'reduce'})
 try{
  const host=await desktop.newPage(),guest=await mobile.newPage()
  host.setDefaultTimeout(8_000);guest.setDefaultTimeout(8_000)
  await Promise.all([host.clock.install(),guest.clock.install()])
  await host.goto(baseURL!+'season/3/')
  await host.getByLabel('Nickname').fill('Ari')
  await host.getByRole('button',{name:'Create party'}).click()
  await chooseGame(host,'memoryPoker')
  await tableSwitch(host,'Allow one-card peek (−1 point)').click()
  const code=(await host.getByTestId('room-code').textContent())!
  await guest.goto(baseURL!+'#/join?room='+code)
  await guest.getByLabel('Nickname').fill('Bee')
  await guest.getByRole('button',{name:'Join party'}).click()
  await expect(tableSwitch(guest,'Allow one-card peek (−1 point)')).toBeChecked()
  await guest.getByRole('button',{name:'Ready up'}).click()
  await startMatch(host)

  for(let round=1;round<=4;round++){
   for(const page of [host,guest]){
    await expect(table(page).getByText('Round '+round+' / 4',{exact:true})).toBeVisible()
    await expect(table(page).getByRole('heading',{name:'Study the cards'})).toBeVisible()
    await expect(cards(page)).toHaveCount(20)
   }
   const visible=await cards(host).evaluateAll(els=>els.map(el=>el.getAttribute('aria-label')!))
   expect(visible.every(x=>x.includes(' of '))).toBe(true)
   expect(await cards(guest).evaluateAll(els=>els.map(el=>el.getAttribute('aria-label')))).toEqual(visible)
   await advanceRoom(host,guest,25_600)
   for(const page of [host,guest]){
    await expect(table(page).getByRole('heading',{name:'Choose five cards'})).toBeVisible()
    await expect(table(page).getByRole('button',{name:'Position 1: face down',exact:true})).toBeVisible()
    await expect(table(page).getByRole('button',{name:/ of /})).toHaveCount(0)
   }
   if(round===1){
    await table(host).getByRole('button',{name:'Peek at one card (−1 point)'}).click()
    await cards(host).first().press('Enter')
    await expect(cards(host).first()).toHaveAccessibleName(visible[0])
    await expect(cards(guest).first()).toHaveAccessibleName('Position 1: face down')
   }

   await cards(host).first().focus()
   await host.keyboard.press('ArrowRight')
   await expect(cards(host).nth(1)).toBeFocused()
   for(let i=0;i<5;i++)await cards(host).nth(i).press('Enter')
   await table(host).getByRole('button',{name:'Lock hand'}).click()
   await expect(table(host).getByText('Hand locked. Waiting for the reveal.',{exact:true})).toBeVisible()
   await expect(table(guest).getByText('1 / 2 hands locked',{exact:true})).toBeVisible()
   await expect(table(guest).getByRole('button',{pressed:true})).toHaveCount(0)
   await expect(roundResults(guest,round)).toHaveCount(0)

   for(let i=0;i<5;i++)await cards(guest).nth(i).tap()
   await table(guest).getByRole('button',{name:'Lock hand'}).tap()
   for(const page of [host,guest]){
    const revealed=roundResults(page,round)
    await expect(revealed).toBeVisible()
    await expect(revealed.getByText('Ari',{exact:true})).toBeVisible()
    await expect(revealed.getByText('Bee',{exact:true})).toBeVisible()
    const ranks=visible.slice(0,5).map(x=>x.replace(/^Position \d+: /,''))
    const turned=await revealed.getByRole('img').evaluateAll(els=>els.map(el=>el.getAttribute('aria-label')))
    expect(turned).toEqual([...ranks,...ranks])
    if(round===1)await expect(revealed.getByText('−0.5 pts',{exact:true})).toBeVisible()
    else await expect(revealed.getByText('0.5 pts',{exact:true})).toHaveCount(2)
   }
   await advanceRoom(host,guest,6_250)
  }
  await expect(host.getByRole('heading',{name:'Bee wins'})).toBeVisible()
  await expect(guest.getByRole('heading',{name:'Bee wins'})).toBeVisible()
  await expect(table(guest).getByRole('list',{name:'Final scores'})).toHaveText(/Bee2 pts.*Ari1 pt/s)
  await expect(guest.getByRole('button',{name:'Export result'})).toBeVisible()
  expect(await guest.evaluate(()=>document.documentElement.scrollWidth)).toBe(360)
  await host.getByRole('button',{name:'Rematch'}).click()
  await expect(table(guest).getByRole('heading',{name:'Study the cards'})).toBeVisible()
  await expect(table(host).getByText('Round 1 / 4',{exact:true})).toBeVisible()
  await expect(roundResults(host,1)).toHaveCount(0)
 }finally{await desktop.close();await mobile.close()}
})

test('unnamed mobile solo entry stays offline, starts with no bots and records a hand',async({browser,baseURL})=>{
 const mobile=await browser.newContext({viewport:{width:320,height:760},hasTouch:true,reducedMotion:'reduce'})
 try{
  const page=await mobile.newPage()
  await page.clock.install()
  await page.goto(baseURL!+'season/3/')
  await page.getByRole('button',{name:'Practice Memory Poker',exact:true}).tap()
  await expect(page.getByRole('heading',{name:'Practice lobby'})).toBeVisible()
  await expect(selectedGame(page,'memoryPoker')).toBeVisible()
  await expect(tableSwitch(page,'Allow one-card peek (−1 point)')).not.toBeChecked()
  await expect(page.getByRole('button',{name:'Add bot'})).toBeDisabled()
  await startMatch(page)
  await expect(table(page).getByRole('heading',{name:'Study the cards'})).toBeVisible()
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(320)
  await timeAdvance(page,25_600)
  await expect(table(page).getByRole('heading',{name:'Choose five cards'})).toBeVisible()
  await expect(table(page).getByRole('button',{name:/Peek at one card/})).toHaveCount(0)
  for(let i=0;i<5;i++)await cards(page).nth(i).tap()
  await table(page).getByRole('button',{name:'Lock hand'}).tap()
  const hand=roundResults(page,1)
  await expect(hand.getByRole('listitem')).toHaveCount(1)
  await expect(hand.getByText('Player',{exact:true})).toBeVisible()
  await expect(hand.getByRole('img')).toHaveCount(5)
 }finally{await mobile.close()}
})
