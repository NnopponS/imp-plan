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
 await expect(shell.getByRole('link',{name:'Reload game controls'})).toHaveAttribute('href','?view=full')
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
