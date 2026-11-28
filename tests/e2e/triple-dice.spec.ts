import {expect,test,type Page} from '@playwright/test'
import {chooseGame} from '../lobby-controls'
import {startMatch} from './start-match'

const board=(page:Page)=>page.getByRole('region',{name:'Triple Dice table'})
const phase=(page:Page)=>board(page).locator('[data-dice-phase]')
const tile=(page:Page,i:number)=>board(page).locator('[data-dice-slot="'+i+'"]')
const low=(page:Page)=>board(page).getByRole('button',{name:/^Low\b/i})
const lock=(page:Page)=>board(page).getByRole('button',{name:'Seal three dice',exact:true})

test('accountless 320px practice plays eight illustrated rounds to a real result',async({browser,baseURL})=>{
 const phone=await browser.newContext({viewport:{width:320,height:760},hasTouch:true,isMobile:true,reducedMotion:'reduce'})
 try{
  const page=await phone.newPage()
  const errors:string[]=[]
  page.on('pageerror',e=>errors.push(e.message))
  await page.clock.install()
  await page.goto(baseURL!+'season/2/')
  const practice=page.getByRole('button',{name:'Practice Triple Dice',exact:true})
  await practice.scrollIntoViewIfNeeded()
  const cover=page.locator('[data-preview-game="tripleDice"]').filter({visible:true}).first()
  await expect.poll(()=>cover.locator('img[data-arena-art]').evaluate((img:HTMLImageElement)=>img.complete&&img.naturalWidth>0)).toBe(true)
  await practice.tap()
  await expect(page.getByRole('textbox',{name:'Nickname'})).toHaveCount(0)
  await expect(page.getByRole('button',{name:'Remove Bot 1 from seat 2'})).toBeVisible()
  await page.getByRole('button',{name:'Start match',exact:true}).tap()
  const briefing=page.getByRole('dialog')
  await expect(briefing.getByRole('img',{name:/Four dice/})).toBeVisible()
  const lesson=briefing.getByRole('region',{name:'How to play'})
  await lesson.press('ArrowRight')
  await lesson.press('ArrowRight')
  await expect(briefing.getByRole('img',{name:/forecast/i})).toBeVisible()
  await briefing.getByRole('button',{name:'Enter match',exact:true}).tap()
  for(let round=1;round<=8;round++){
   await expect(board(page)).toContainText('Round '+round+' / 8')
   await expect(phase(page)).toHaveAttribute('data-dice-phase','select')
   await expect(tile(page,3)).toHaveAccessibleName(/blind.*unseen/i)
   await expect(lock(page)).toBeDisabled()
   await tile(page,0).press('Enter')
   await tile(page,1).tap()
   await tile(page,3).tap()
   await low(page).tap()
   await expect(lock(page)).toBeEnabled()
   await lock(page).press('Enter')
   if(round<8){
    await page.clock.fastForward(800)
    await expect(phase(page)).toHaveAttribute('data-dice-phase','review')
    await expect(board(page).getByRole('list',{name:'Round settlement'}).getByRole('listitem')).toHaveCount(2)
    await page.clock.fastForward(6200)
   }
  }
  await page.clock.fastForward(800)
  await expect(phase(page)).toHaveAttribute('data-dice-phase','done')
  await expect(board(page).getByRole('list',{name:'Final standings'}).getByRole('listitem')).toHaveCount(2)
  await expect(page.getByRole('region',{name:'Match record'})).toBeVisible()
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(320)
  expect(errors).toEqual([])
 }finally{await phone.close()}
})

test('private browsers share only open dice before lock and see the same round result',async({browser,baseURL})=>{
 const c1=await browser.newContext({viewport:{width:1280,height:810},reducedMotion:'reduce'})
 const c2=await browser.newContext({viewport:{width:390,height:780},hasTouch:true,isMobile:true,reducedMotion:'reduce'})
 try{
  const host=await c1.newPage(),guest=await c2.newPage()
  await host.goto(baseURL!)
  await host.getByLabel('Nickname').fill('Juniper')
  await host.getByRole('button',{name:'Create party'}).click()
  const code=(await host.getByTestId('room-code').textContent())!
  await chooseGame(host,'tripleDice')
  await guest.goto(baseURL!+'#/join?room='+code)
  await guest.getByLabel('Nickname').fill('Copper')
  await guest.getByRole('button',{name:'Join party'}).tap()
  await guest.getByRole('button',{name:'Ready up',exact:true}).tap()
  await startMatch(host)
  await expect(board(host).getByRole('list',{name:'Open faces at the table'})).toBeVisible()
  const open=(p:Page)=>board(p).getByRole('list',{name:'Open faces at the table'})
  const shared=(await open(host).innerText()).replace(/ \(you\)/g,'')
  expect((await open(guest).innerText()).replace(/ \(you\)/g,'')).toBe(shared)
  const choose=async(p:Page)=>{for(const i of [0,1,3])await tile(p,i).press('Enter');await low(p).press('Enter');await lock(p).press('Enter')}
  await choose(guest)
  await expect(board(guest)).toContainText('Your forecast is sealed')
  await expect(board(host)).not.toContainText('Your forecast is sealed')
  await expect(phase(host)).toHaveAttribute('data-dice-phase','select')
  await expect(board(host).getByRole('list',{name:'Round settlement'})).toHaveCount(0)
  await choose(host)
  const set=(p:Page)=>board(p).getByRole('list',{name:'Round settlement'})
  await expect(set(guest)).toBeVisible()
  expect(await set(host).innerText()).toEqual(await set(guest).innerText())
  expect(await guest.evaluate(()=>document.documentElement.scrollWidth)).toBe(390)
 }finally{await Promise.all([c1.close(),c2.close()])}
})

test('the authored cover loops three dice and leaves its still when paused',async({page})=>{
 await page.setViewportSize({width:390,height:780})
 await page.goto('./season/2/')
 const cover=page.locator('[data-preview-game="tripleDice"]').filter({visible:true}).first()
 await cover.evaluate(node=>node.scrollIntoView({block:'center',behavior:'instant'}))
 const animated=cover.locator('img[data-cover-motion]')
 await expect(animated).toHaveAttribute('data-cover-ready','true')
 await expect(animated).toHaveAttribute('data-cover-original',/seasonal-tripleDice\.svg$/)
 const animatedDice=await animated.evaluate(async(img:HTMLImageElement)=>{
  const doc=new DOMParser().parseFromString(await(await fetch(img.src)).text(),'image/svg+xml')
  return doc.querySelectorAll('animateTransform[repeatCount="indefinite"]').length
 })
 expect(animatedDice).toBe(3)
 await page.getByRole('button',{name:'Pause previews',exact:true}).click()
 await expect(animated).toHaveCount(0)
 await expect(cover.locator('img[data-arena-art]')).toBeAttached()
})
