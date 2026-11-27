import {expect,test,type Page} from '@playwright/test'
import {startMatch} from './start-match'

const storage='imp-plan-player-wardrobe-v1'
const wardrobe=(page:Page)=>page.getByRole('region',{name:'Player wardrobe'})
const portrait=(page:Page)=>wardrobe(page).getByRole('img',{name:/Your avatar/})

test('320×568 wardrobe gives every outfit piece a graphic touch target and only stores validated local choices',async({browser,baseURL})=>{
 const phone=await browser.newContext({viewport:{width:320,height:568},hasTouch:true,reducedMotion:'reduce'})
 try{
  const page=await phone.newPage()
  await page.addInitScript(key=>{
   if(!localStorage.getItem(key))localStorage.setItem(key,JSON.stringify({mask:'no-such-mask',cloak:'forest',clasp:'moon',identity:'discard this'}))
  },storage)
  await page.goto(baseURL!,{waitUntil:'domcontentloaded'})
  await expect(page.getByRole('region',{name:'One-move warm-up'})).toHaveCount(0)
  await expect(portrait(page)).toHaveAccessibleName('Your avatar: Ivory mask, Garnet cloak, Sun clasp')
  const targets=wardrobe(page).locator('label')
  for(const [drawer,count] of [['Mask',6],['Cloak',3],['Dye',6],['Pin',3],['Extra',5]] as const){
   await wardrobe(page).getByRole('button',{name:drawer,exact:true}).tap()
   await expect(targets).toHaveCount(count)
   for(const el of await targets.all()){
    const rect=await el.boundingBox()
    expect(rect!.width).toBeGreaterThanOrEqual(44)
    expect(rect!.height).toBeGreaterThanOrEqual(44)
    await expect(el.locator('svg')).toBeVisible()
   }
  }
  for(const [drawer,label,newArt] of [['Mask','Raven mask','raven'],['Cloak','Midnight cloak','midnight'],['Pin','Key clasp','key']] as const){
   await wardrobe(page).getByRole('button',{name:drawer,exact:true}).tap()
   const choice=targets.filter({has:page.getByRole('radio',{name:label,exact:true})})
   await choice.tap()
   await expect(choice.getByRole('radio')).toBeChecked()
   await expect(portrait(page).locator(`[data-wardrobe-piece="${newArt}"]`)).toBeVisible()
  }
  await expect(portrait(page)).toHaveAccessibleName('Your avatar: Raven mask, Midnight cloak, Key clasp')
  expect(await page.evaluate(key=>JSON.parse(localStorage.getItem(key)!),storage)).toBe(17)
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(320)
  await wardrobe(page).scrollIntoViewIfNeeded()
  await page.screenshot({path:test.info().outputPath('wardrobe-320.png')})
  await page.reload({waitUntil:'domcontentloaded'})
  await expect(portrait(page)).toHaveAccessibleName('Your avatar: Raven mask, Midnight cloak, Key clasp')
  const random=wardrobe(page).getByRole('button',{name:'Shuffle outfit'})
  await random.tap()
  await expect(portrait(page)).not.toHaveAttribute('data-player-look','17')
  expect(await page.evaluate(key=>JSON.parse(localStorage.getItem(key)!),storage)).toBe(Number(await portrait(page).getAttribute('data-player-look')))
  await wardrobe(page).getByRole('button',{name:'Auto-deal'}).tap()
  await expect(wardrobe(page).getByText('Room picks for you')).toBeVisible()
  expect(await page.evaluate(key=>localStorage.getItem(key),storage)).toBeNull()

  const fresh=await browser.newContext({viewport:{width:320,height:568},reducedMotion:'reduce'})
  try{
   const other=await fresh.newPage();await other.goto(baseURL!,{waitUntil:'domcontentloaded'})
   await expect(portrait(other)).toHaveAccessibleName('Your avatar: Ivory mask, Garnet cloak, Sun clasp')
   await expect(wardrobe(other).getByText('Room picks for you')).toBeVisible()
   expect(await other.evaluate(key=>localStorage.getItem(key),storage)).toBeNull()
  }finally{await fresh.close()}
 }finally{await phone.close()}
})

test('1440px keyboard can change real avatar geometry and skip directly to Blind Gomoku practice',async({page,baseURL})=>{
 await page.setViewportSize({width:1440,height:900})
 await page.emulateMedia({reducedMotion:'reduce'})
 await page.goto(baseURL!,{waitUntil:'domcontentloaded'})
 await expect(wardrobe(page)).toBeVisible()
 const radiomask=wardrobe(page).getByRole('radio',{name:'Ivory mask',exact:true})
 await radiomask.focus()
 const original=await portrait(page).locator('[data-wardrobe-piece="ivory"]').innerHTML()
 await page.keyboard.press('ArrowRight')
 await expect(wardrobe(page).getByRole('radio',{name:'Raven mask',exact:true})).toBeFocused()
 await expect(wardrobe(page).getByRole('radio',{name:'Raven mask',exact:true})).toBeChecked()
 expect(await portrait(page).locator('[data-wardrobe-piece="raven"]').innerHTML()).not.toBe(original)
 await page.keyboard.press('ArrowRight')
 await expect(wardrobe(page).getByRole('radio',{name:'Ram mask',exact:true})).toBeChecked()
 const link=wardrobe(page).getByRole('link',{name:'Skip outfit',exact:true})
 await wardrobe(page).scrollIntoViewIfNeeded()
 await page.screenshot({path:test.info().outputPath('wardrobe-1440.png')})
 await link.press('Enter')
 const practice=page.getByRole('button',{name:'Practice Blind Gomoku',exact:true})
 await expect(practice).toBeInViewport()
 await practice.press('Enter')
 await expect(page.getByRole('heading',{name:'Practice lobby'})).toBeVisible()
 await startMatch(page)
 await expect(page.getByRole('heading',{name:'Blind Gomoku',exact:true})).toBeVisible()
})

test('390×844 local storage denial does not block outfit previews or entering the private party form',async({browser,baseURL})=>{
 const phone=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,reducedMotion:'reduce'})
 try{
  const page=await phone.newPage()
  await page.addInitScript(()=>Object.defineProperty(window,'localStorage',{get(){throw new DOMException('Storage blocked','SecurityError')}}))
  await page.goto(baseURL!,{waitUntil:'domcontentloaded'})
  await wardrobe(page).getByRole('button',{name:'Cloak',exact:true}).tap()
  const arm=wardrobe(page).locator('label').filter({has:page.getByRole('radio',{name:'Forest cloak',exact:true})})
  await arm.tap()
  await expect(arm.getByRole('radio')).toBeChecked()
  await expect(portrait(page)).toHaveAccessibleName('Your avatar: Ivory mask, Forest cloak, Sun clasp')
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(390)
  await wardrobe(page).scrollIntoViewIfNeeded()
  await page.screenshot({path:test.info().outputPath('wardrobe-390.png')})
  await page.getByRole('link',{name:'Create or join a room',exact:true}).tap()
  await expect(page.getByRole('button',{name:'Create party',exact:true})).toBeInViewport()
 }finally{await phone.close()}
})

test('the expanded wardrobe shows independent dyes and accessories and carries the exact visual look to a second device',async({browser,baseURL})=>{
 const hostCtx=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,reducedMotion:'reduce'})
 const guestCtx=await browser.newContext({viewport:{width:320,height:720},hasTouch:true,reducedMotion:'reduce'})
 try{
  const host=await hostCtx.newPage(),guest=await guestCtx.newPage()
  await host.goto(baseURL!,{waitUntil:'domcontentloaded'})
  const controls=wardrobe(host)
  await controls.locator('label').filter({has:host.getByRole('radio',{name:'Owl mask',exact:true})}).tap()
  await controls.getByRole('button',{name:'Dye',exact:true}).tap()
  await controls.locator('label').filter({has:host.getByRole('radio',{name:'Peacock dye',exact:true})}).tap()
  await controls.getByRole('button',{name:'Extra',exact:true}).tap()
  await controls.locator('label').filter({has:host.getByRole('radio',{name:'Rose accessory',exact:true})}).tap()
  await expect(portrait(host)).toHaveAccessibleName(/Owl mask.*Peacock dye.*Rose accessory/)
  const look=(await portrait(host).getAttribute('data-player-look'))!
  expect(Number(look)).toBeGreaterThan(26)
  await host.getByLabel('Nickname').fill('Wardrobe Host')
  await host.getByRole('button',{name:'Create party'}).tap()
  const code=host.getByTestId('room-code')
  await expect(code).toHaveText(/^[A-Z2-9]{6}$/)
  await guest.goto(baseURL!+'#/join?room='+await code.textContent(),{waitUntil:'domcontentloaded'})
  await guest.getByLabel('Nickname').fill('Wardrobe Guest')
  await guest.getByRole('button',{name:'Join party'}).tap()
  const other=guest.getByRole('region',{name:'Seats'}).getByRole('listitem').filter({hasText:'Wardrobe Host'})
  await expect(other.locator('svg[data-player-look]')).toHaveAttribute('data-player-look',look)
  await expect(other.locator('[data-wardrobe-piece="rose"]')).toBeVisible()
  await host.getByRole('button',{name:'Leave room'}).tap()
  await expect(portrait(host)).toHaveAttribute('data-player-look',look)
 }finally{await Promise.all([hostCtx.close(),guestCtx.close()])}
})
