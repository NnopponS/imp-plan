import {test,expect} from '@playwright/test'

test('Divine practice from a scrolled season card gives the lobby focus and restores the card on exit',async({browser,baseURL})=>{
 const context=await browser.newContext({viewport:{width:320,height:568},hasTouch:true})
 try{
  const page=await context.newPage()
  await page.goto(baseURL!+'season/3/')
  const launch=page.getByRole('button',{name:'Practice Divine Test',exact:true})
  await launch.evaluate(el=>el.scrollIntoView({block:'center'}))
  const initial=await page.evaluate(()=>window.scrollY)
  expect(initial).toBeGreaterThan(450)
  await expect(launch).toBeInViewport({ratio:1})
  await launch.tap()
  await expect(page.getByRole('heading',{name:'Practice lobby',exact:true})).toBeFocused({timeout:2500})
  expect(await page.evaluate(()=>window.scrollY)).toBe(0)
  await expect(page.getByLabel('Game')).toBeInViewport({ratio:1})
  await expect(page.getByLabel('Square size')).toBeInViewport({ratio:1})
  await page.getByRole('button',{name:'Leave room'}).tap()
  await expect(launch).toBeFocused()
  await expect(launch).toBeInViewport({ratio:1})
  expect(Math.abs(await page.evaluate(()=>window.scrollY)-initial)).toBeLessThan(4)
  await expect(page).toHaveURL(/\/season\/3\/$/)
 }finally{await context.close()}
})

test('Divine 7×7 exposes its last row and tile tools together in touch landscape',async({browser,baseURL})=>{
 const context=await browser.newContext({viewport:{width:844,height:390},hasTouch:true})
 try{
  const page=await context.newPage()
  await page.addInitScript(()=>document.addEventListener('pointerup',event=>{
   if(event.pointerType==='touch'){
    document.body.dataset.touchEvents=String(Number(document.body.dataset.touchEvents??0)+1)
   }
  }))
  await page.goto(baseURL!+'season/3/')
  await page.getByRole('button',{name:'Practice Divine Test',exact:true}).tap()
  await page.getByLabel('Square size').selectOption('7')
  await page.getByRole('button',{name:'Start match',exact:true}).tap()
  await page.getByRole('dialog').getByRole('button',{name:'Enter match',exact:true}).tap()
  const board=page.getByRole('region',{name:'Magic square grid'})
  const tray=page.getByRole('region',{name:'Tile tray'})
  const tile=tray.getByRole('button').first()
  const cell=board.getByRole('button',{name:/^Row 7, column \d+: empty$/}).first()
  await expect(board).toBeInViewport({ratio:1,timeout:2500})
  await expect(cell).toBeInViewport({ratio:1})
  await expect(tile).toBeInViewport({ratio:1})
  await expect(page.getByRole('button',{name:'Numeral legend'})).toBeInViewport({ratio:1})
  const b=(await board.boundingBox())!,t=(await tile.boundingBox())!,c=(await cell.boundingBox())!
  expect(t.x).toBeGreaterThan(b.x+b.width)
  expect(t.height).toBeGreaterThanOrEqual(44)
  expect(c.height).toBeGreaterThanOrEqual(24)
  const before=await page.locator('body').getAttribute('data-touch-events')
  const picked=(await tile.getAttribute('aria-label'))!.slice(5)
  const address=(await cell.getAttribute('aria-label'))!.split(': ')[0]
  await page.touchscreen.tap(t.x+t.width/2,t.y+t.height/2)
  await expect(page.getByRole('status').filter({hasText:'Selected '+picked})).toBeVisible()
  await page.touchscreen.tap(c.x+c.width/2,c.y+c.height/2)
  await expect(board.getByRole('button',{name:address+': '+picked,exact:true})).toBeVisible()
  expect(Number(await page.locator('body').getAttribute('data-touch-events'))-Number(before)).toBe(2)
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(844)
 }finally{await context.close()}
})
