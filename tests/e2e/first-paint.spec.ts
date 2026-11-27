import {expect,test} from '@playwright/test'

test('a blocked module leaves the published mobile season fully illustrated', async ({page})=>{
 await page.setViewportSize({width:390,height:844})
 await page.route('**/src/main.tsx', request=>request.abort())
 await page.goto('./season/3/')
 const shell=page.locator('[data-first-paint]')
 await expect(shell.getByRole('heading',{name:'Dead Again',exact:true})).toBeVisible()
 await expect(shell.getByRole('navigation',{name:'Seasons'}).getByRole('link',{name:/Dead Again/})).toHaveAttribute('aria-current','page')
 await expect(shell.getByRole('heading',{name:'Point Gomoku'})).toBeVisible()
 await expect(shell.getByRole('heading',{name:'Count the Rectangles'})).toBeVisible()
 const cover=shell.locator('img[src$="seasonal-point.svg"]')
 await expect.poll(()=>cover.evaluate((img:HTMLImageElement)=>img.complete&&img.naturalWidth>0)).toBe(true)
 await expect(shell).toHaveCSS('background-color','rgb(37, 29, 23)')
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(390)
 await expect(shell.getByRole('link',{name:'Reload game controls'})).toHaveAttribute('href',/\/season\/3\/\?view=full$/)
})

test('the home page keeps painted navigation even with JavaScript disabled',async({browser,baseURL})=>{
 const context=await browser.newContext({javaScriptEnabled:false,viewport:{width:320,height:720}})
 try{
  const page=await context.newPage()
  await page.goto(baseURL!)
  const shell=page.locator('[data-first-paint]')
  const hero=shell.locator('picture img')
  await expect.poll(()=>hero.evaluate((img:HTMLImageElement)=>img.complete&&img.naturalWidth>0)).toBe(true)
  await expect(hero).toHaveJSProperty('currentSrc',new URL('art/landing-hero-mobile.svg',baseURL!).href)
  await expect(shell.getByText('Turn on JavaScript to play. You can still browse every season.')).toBeVisible()
  await shell.getByRole('navigation',{name:'Seasons'}).getByRole('link',{name:/Death Room/}).click()
  await expect(shell.getByRole('heading',{name:'Death Room',exact:true})).toBeVisible()
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(320)
 }finally{await context.close()}
})

test('the painted shell gives way to interactive controls without duplicates',async({page})=>{
 await page.goto('./')
 await expect(page.getByRole('button',{name:'Practice Color Link',exact:true})).toBeVisible()
 await expect(page.locator('[data-first-paint]')).toHaveCount(0)
 await expect(page.getByRole('heading',{name:'Imp Plan',exact:true})).toHaveCount(1)
})

test('a blocked invite keeps its room code through fallback browsing and retry', async ({page})=>{
 await page.setViewportSize({width:390,height:844})
 const main='**/src/main.tsx'
 await page.route(main, request=>request.abort())
 await page.goto('./?view=quick#/join?room=ABC234')
 const invite=/#\/join\?room=ABC234$/
 const shell=page.locator('[data-first-paint]')
 for(const label of ['Browse games','Challenge index','Game controls']){
  await shell.getByRole('link',{name:label,exact:true}).click()
  await expect(page).toHaveURL(invite)
 }
 await expect(shell.getByRole('heading',{name:'Open the game controls'})).toBeInViewport()
 await page.unroute(main)
 await shell.getByRole('link',{name:'Reload game controls'}).click()
 await expect(page).toHaveURL(/\?view=full#\/join\?room=ABC234$/)
 await expect(page.getByRole('textbox',{name:'Invite code'})).toHaveValue('ABC234')
})

test('retrying the same full-view invite reloads the document',async({page})=>{
 const main='**/src/main.tsx'
 await page.route(main, request=>request.abort())
 await page.goto('./?view=full#/join?room=ABC234')
 await page.unroute(main)
 await page.locator('[data-first-paint]').getByRole('link',{name:'Reload game controls'}).click()
 await expect(page.getByRole('textbox',{name:'Invite code'})).toHaveValue('ABC234')
})
