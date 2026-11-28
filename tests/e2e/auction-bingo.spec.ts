import {expect,test,type Page} from '@playwright/test'
import {chooseGame} from '../lobby-controls'
import {startMatch} from './start-match'

const table=(page:Page)=>page.getByRole('region',{name:'Auction Bingo table'})
const phase=(p:Page,name:string)=>expect(table(p)).toHaveAttribute('data-bingo-phase',name)
const select=async(p:Page,name:string)=>{
 await table(p).getByRole('button',{name,exact:true}).press('Enter')
 await table(p).getByRole('button',{name:'Seal shape'}).press('Enter')
}
const bid=async(p:Page,i:number)=>{
 await table(p).locator('[data-coin-index="'+i+'"]').press('Enter')
 await table(p).getByRole('button',{name:/^Seal bid/}).press('Enter')
}

test('plays all seven practice rounds from the Season III gallery at 320 px',async({browser,baseURL})=>{
 const context=await browser.newContext({viewport:{width:320,height:760},hasTouch:true,isMobile:true,reducedMotion:'reduce'})
 try{
  const page=await context.newPage(),errors:string[]=[]
  page.on('pageerror',e=>errors.push(e.message))
  await page.clock.install()
  await page.goto(baseURL!+'season/3/')
  const practice=page.getByRole('button',{name:'Practice Auction Bingo',exact:true})
  await practice.scrollIntoViewIfNeeded()
  const poster=page.locator('[data-preview-game="auctionBingo"]:visible img[data-arena-art]').first()
  await expect.poll(()=>poster.evaluate((img:HTMLImageElement)=>img.complete&&img.naturalWidth>0)).toBe(true)
  await practice.tap()
  await expect(page.getByRole('textbox',{name:'Nickname'})).toHaveCount(0)
  await expect(page.getByRole('button',{name:'Remove Bot 1 from seat 2'})).toBeVisible()
  await page.getByRole('button',{name:'Start match',exact:true}).tap()
  const dialog=page.getByRole('dialog')
  await expect(dialog.getByRole('img',{name:/shape tickets/i})).toBeVisible()
  const lesson=dialog.getByRole('region',{name:'How to play'})
  for(let i=0;i<3;i++)await lesson.press('ArrowRight')
  await expect(dialog.getByRole('img',{name:/complete one line/i})).toBeVisible()
  await dialog.getByRole('button',{name:'Enter match',exact:true}).tap()
  for(let round=1;round<=7;round++){
   await phase(page,'select')
   await expect(table(page)).toContainText('Round '+round+' / 7')
   await select(page,['Triangle','Circle','Star'][(round-1)%3])
   await page.clock.fastForward(800)
   await phase(page,'bid')
   await expect(table(page).getByRole('button',{name:'Seal bid',exact:true})).toBeDisabled()
   await bid(page,round-1)
   await page.clock.fastForward(800)
   await phase(page,'review')
   await expect(table(page).getByRole('list',{name:'Round clearing prices'})).toBeVisible()
   await expect(table(page).getByRole('list',{name:'Final standings'})).toHaveCount(0)
   await page.clock.fastForward(4200)
  }
  await phase(page,'done')
  const standings=table(page).getByRole('list',{name:'Final standings'})
  await expect(standings.getByRole('listitem')).toHaveCount(2)
  await expect(table(page).getByRole('list',{name:'Collected shapes'})).toBeVisible()
  await expect(page.getByRole('region',{name:'Match record'})).toBeVisible()
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(320)
  expect(errors).toEqual([])
 }finally{await context.close()}
})
test('two distinct browsers get private acknowledgments and the same ordered reveal',async({browser,baseURL})=>{
 const c1=await browser.newContext({viewport:{width:1280,height:810},reducedMotion:'reduce'})
 const c2=await browser.newContext({viewport:{width:390,height:780},hasTouch:true,isMobile:true,reducedMotion:'reduce'})
 try{
  const host=await c1.newPage(),guest=await c2.newPage()
  await host.goto(baseURL!)
  await host.getByLabel('Nickname').fill('Keeper')
  await host.getByRole('button',{name:'Create party'}).click()
  const code=(await host.getByTestId('room-code').textContent())!
  await chooseGame(host,'auctionBingo')
  await guest.goto(baseURL!+'#/join?room='+code)
  await guest.getByLabel('Nickname').fill('Guest Seal')
  await guest.getByRole('button',{name:'Join party'}).tap()
  await guest.getByRole('button',{name:'Ready up',exact:true}).tap()
  await startMatch(host)
  await phase(guest,'select')
  await select(guest,'Star')
  await expect(table(guest)).toContainText('Your shape ticket is sealed.')
  await expect(table(host)).not.toContainText('Your shape ticket is sealed.')
  await expect(table(host).getByRole('list',{name:'Open shape tickets'})).toHaveCount(0)
  await select(host,'Triangle')
  await phase(host,'bid')
  await phase(guest,'bid')
  const open=(p:Page)=>table(p).getByRole('list',{name:'Open shape tickets'})
  expect(await open(guest).innerText()).toBe(await open(host).innerText())
  await bid(guest,9)
  await expect(table(guest)).toContainText('Your bid is sealed.')
  await expect(table(host)).not.toContainText('Your bid is sealed.')
  await expect(table(host).getByRole('list',{name:'Round clearing prices'})).toHaveCount(0)
  await expect(table(host)).not.toContainText('10 coins')
  await bid(host,0)
  const prices=(p:Page)=>table(p).getByRole('list',{name:'Round clearing prices'})
  await expect(prices(host)).toContainText('Price sealed')
  await expect(prices(guest)).toContainText('1 coin')
  expect(await prices(guest).innerText()).toBe(await prices(host).innerText())
  await expect(table(guest)).not.toContainText('Guest Seal won')
  expect(await guest.evaluate(()=>document.documentElement.scrollWidth)).toBe(390)
 }finally{await Promise.all([c1.close(),c2.close()])}
})
test('the cover keeps the original still and can pause its gavel, wax seal and coin animation',async({page})=>{
 await page.setViewportSize({width:390,height:780})
 await page.goto('./season/3/')
 const cover=page.locator('[data-preview-game="auctionBingo"]:visible').first()
 await cover.evaluate(node=>node.scrollIntoView({block:'center',behavior:'instant'}))
 const moving=cover.locator('img[data-cover-motion]')
 await expect(moving).toHaveAttribute('data-cover-ready','true')
 const loops=await moving.evaluate(async(img:HTMLImageElement)=>{
  const doc=new DOMParser().parseFromString(await(await fetch(img.src)).text(),'image/svg+xml')
  return doc.querySelectorAll('animateTransform[repeatCount="indefinite"]').length
 })
 expect(loops).toBe(3)
 await page.getByRole('button',{name:'Pause previews',exact:true}).click()
 await expect(moving).toHaveCount(0)
 await expect(cover.locator('img[data-arena-art]')).toBeAttached()
})
