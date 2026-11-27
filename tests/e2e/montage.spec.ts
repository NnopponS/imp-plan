import {expect,test,type Page} from '@playwright/test'
import {startMatch} from './start-match'

const stage=(page:Page)=>page.getByRole('region',{name:'Montage portrait gallery'})
const buzzer=(page:Page)=>stage(page).getByRole('button',{name:'Buzz: I saw this face'})
const portrait=(page:Page)=>stage(page).getByRole('img',{name:/^Portrait with /})
async function pause(page:Page){
 await page.clock.pauseAt(new Date(await page.evaluate(()=>Date.now())+500))
}
async function nextImage(page:Page){
 const face=portrait(page)
 await expect(face).toBeVisible()
 const label=(await face.getAttribute('alt'))!
 await expect(face).toHaveJSProperty('complete',true)
 return label
}

test('Montage opens host-paced rounds and accepts synchronized keyboard and mobile buzzes over loopback',async({browser,baseURL})=>{
 const desktop=await browser.newContext(),phone=await browser.newContext({viewport:{width:360,height:780},hasTouch:true,reducedMotion:'reduce'})
 try{
  const host=await desktop.newPage(),guest=await phone.newPage()
  await Promise.all([host.clock.install(),guest.clock.install()])
  await host.goto(baseURL!+'season/1/')
  const card=host.locator('article').filter({has:host.getByRole('heading',{name:'Montage',exact:true})})
  await expect(card.getByRole('button',{name:'Practice Montage'})).toBeVisible()
  await expect.poll(()=>card.locator('img').evaluate((img:HTMLImageElement)=>img.complete&&img.naturalWidth>0)).toBe(true)
  await host.getByLabel('Nickname').fill('Ada')
  await host.getByRole('button',{name:'Create party'}).click()
  const code=(await host.getByTestId('room-code').textContent())!
  await host.getByRole('combobox',{name:'Game',exact:true}).selectOption('montage')
  await expect(host.getByRole('button',{name:'Start match'})).toBeDisabled()
  await guest.goto(baseURL!+'#/join?room='+code)
  await guest.getByLabel('Nickname').fill('Mina')
  await guest.getByRole('button',{name:'Join party'}).click()
  await guest.getByRole('button',{name:'Preview rules'}).click()
  await expect(guest.getByRole('dialog').getByRole('group',{name:'Montage rule example'})).toBeVisible()
  await guest.getByRole('button',{name:'Back to lobby'}).click()
  await guest.getByRole('button',{name:'Ready up'}).click()
  await startMatch(host)
  await Promise.all([pause(host),pause(guest)])
  const tick=(ms:number)=>Promise.all([host.clock.runFor(ms),guest.clock.runFor(ms)])
  await expect(stage(guest).getByText('Waiting for the host to open round 1.')).toBeVisible()
  await expect(stage(guest).getByRole('button',{name:'Start round 1'})).toHaveCount(0)
  await expect(portrait(guest)).toHaveCount(0)
  await stage(host).getByRole('button',{name:'Start round 1'}).click()
  await expect(stage(guest).getByRole('timer',{name:'Portrait countdown'})).toBeVisible()
  await tick(2200)
  let current=await nextImage(host)
  await expect(portrait(guest)).toHaveAttribute('alt',current)
  await expect(stage(guest).getByRole('timer',{name:'Portrait time remaining'})).toBeVisible()
  await buzzer(host).focus()
  await buzzer(host).press('b')
  await expect(stage(guest).getByText('Team errors')).toBeVisible()
  await expect(stage(guest).getByText('1 / 10',{exact:true})).toBeVisible()
  await expect(buzzer(host)).toHaveAttribute('aria-disabled','true')
  const seen=new Set([current])
  for(let frame=2;frame<=32;frame++){
   await tick(3000)
   await expect(stage(host).locator('[data-montage-frame]')).toHaveAttribute('data-montage-frame',String(frame))
   current=await nextImage(host)
   await expect(portrait(guest)).toHaveAttribute('alt',current)
   if(seen.has(current))break
   seen.add(current)
  }
  await buzzer(guest).tap()
  await expect(stage(host).getByText('Mina found the repeat. Round 1 cleared.')).toBeVisible()
  await expect(stage(guest).getByText('Mina found the repeat. Round 1 cleared.')).toBeVisible()
  await expect(stage(guest).getByText('1 Piece',{exact:true})).toBeVisible()
  await expect(portrait(guest)).toHaveCount(0)
  expect(await guest.evaluate(()=>document.documentElement.scrollWidth)).toBe(360)
  await stage(host).getByRole('button',{name:'Start round 2'}).click()
  for(let i=0;i<16&&!await stage(host).getByText('The repeat passed without a buzz.').isVisible();i++)await tick(3000)
  await expect(stage(guest).getByText('The repeat passed without a buzz.')).toBeVisible()
  await expect(stage(host).getByText('1 / 5 rounds cleared',{exact:true})).toBeVisible()
 }finally{await Promise.allSettled([desktop.close(),phone.close()])}
})

test('Montage solo finishes a slower, unscored gallery at 320 pixels',async({page,baseURL})=>{
 await page.setViewportSize({width:320,height:720})
 await page.emulateMedia({reducedMotion:'reduce'})
 await page.clock.install()
 await page.goto(baseURL!+'season/1/')
 await page.getByLabel('Nickname').fill('Ada')
 const card=page.locator('article').filter({has:page.getByRole('heading',{name:'Montage',exact:true})})
 await card.getByRole('button',{name:'Practice Montage'}).click()
 await expect(page.getByText('One gallery round in solo practice.',{exact:false})).toBeVisible()
 await startMatch(page)
 await pause(page)
 await expect(stage(page).getByText('SOLO PRACTICE',{exact:false})).toBeVisible()
 await stage(page).getByRole('button',{name:'Start round 1'}).press('Enter')
 await page.clock.runFor(2200)
 const seen=new Set([await nextImage(page)])
 await page.clock.runFor(3100)
 await expect(stage(page).locator('[data-montage-frame]')).toHaveAttribute('data-montage-frame','1')
 await page.clock.runFor(1400)
 for(let i=2;i<=32;i++){
  await expect(stage(page).locator('[data-montage-frame]')).toHaveAttribute('data-montage-frame',String(i))
  const face=await nextImage(page)
  if(seen.has(face))break
  seen.add(face)
  await page.clock.runFor(4500)
 }
 await buzzer(page).press('Enter')
 await expect(stage(page).getByText('Practice complete: you found the repeat.')).toBeVisible()
 await expect(stage(page).getByText('1 / 1 rounds cleared')).toBeVisible()
 await expect(stage(page).getByText('0 Pieces')).toHaveCount(0)
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(320)
})
