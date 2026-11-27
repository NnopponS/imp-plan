import {expect,test} from '@playwright/test'

for(const [width,height] of [[320,690],[768,940],[1440,970]]){
 test('illustrated home assets and controls work at '+width+'px',async({page})=>{
  await page.setViewportSize({width,height})
  await page.emulateMedia({reducedMotion:'reduce'})
  await page.goto('./')
  const home=page.locator('.illustrated-landing')
  await expect(home).toBeVisible()
  const hero=home.locator('.landing-painting img')
  await expect.poll(()=>hero.evaluate((img:HTMLImageElement)=>img.complete&&img.naturalWidth>0)).toBe(true)
  expect(await hero.evaluate((img:HTMLImageElement)=>img.currentSrc)).toContain(width<=685?'landing-hero-mobile.svg':'landing-hero.svg')
  await expect(home.getByRole('link',{name:'Browse games'})).toBeVisible()
  await expect(home.getByRole('link',{name:'Create or join a room'})).toBeVisible()
  await expect(home.getByRole('region',{name:'One-move warm-up'}).getByRole('button',{name:'Row 8, column 9, empty'})).toBeInViewport()
  for(const art of await home.locator('.chapter-painting').all()){
   await art.scrollIntoViewIfNeeded()
   await expect.poll(()=>art.evaluate((img:HTMLImageElement)=>img.complete&&img.naturalWidth>0)).toBe(true)
  }
  await expect(home.locator('.chapter-painting')).toHaveCount(3)
  if(process.env.CAPTURE_LANDING==='1'){
   await home.getByRole('heading',{name:'Browse by season'}).scrollIntoViewIfNeeded()
   await page.screenshot({path:'../Imp-Plan-Seasons-'+width+'.png'})
   await page.evaluate(()=>window.scrollTo(0,0))
   await page.screenshot({path:'../Imp-Plan-Home-'+width+'.png'})
  }
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(width)
  await home.getByRole('link',{name:'Browse games'}).click()
  await expect(page.getByRole('searchbox',{name:'Find playable games'})).toBeVisible()
  await home.getByRole('link',{name:'Create or join a room'}).click()
  await expect(home.getByRole('textbox',{name:'Nickname'})).toBeVisible()
 })
}

test('engraved walkthrough illustrates each step without starting the game',async({page})=>{
 await page.setViewportSize({width:390,height:800})
 await page.goto('./season/2/')
 await page.getByLabel('Nickname').fill('Archivist')
 await page.getByRole('button',{name:'Practice Remove One',exact:true}).click()
 await page.getByRole('button',{name:'Start match',exact:true}).click()
 const dialog=page.getByRole('dialog',{name:'Remove One'})
 await expect(dialog.getByRole('img',{name:/Keep one of your two cards/})).toBeVisible()
 await dialog.getByRole('button',{name:/After the reveal/}).click()
 await expect(dialog.getByRole('img',{name:/two players kept 2/})).toBeVisible()
 await expect(page.getByRole('button',{name:'Enter match',exact:true})).toBeInViewport()
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(390)
})
