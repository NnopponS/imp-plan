import {expect,test} from '@playwright/test'

for(const [width,height] of [[320,620],[390,844],[1440,900]]){
 test('a compact gear leaves room for the portrait and buzzer at '+width+'px',async({page})=>{
  await page.setViewportSize({width,height})
  await page.goto('./season/1/')
  await page.getByRole('button',{name:'Practice Montage',exact:true}).click()
  await expect(page.getByRole('heading',{name:'Practice lobby'})).toBeVisible()
  await expect(page.getByLabel('Nickname')).toHaveCount(0)
  await page.getByRole('button',{name:'Start match',exact:true}).click()
  await page.getByRole('button',{name:'Enter match',exact:true}).click()
  const main=page.locator('main.playing-arena')
  const gear=page.getByRole('button',{name:'Audio and display settings',exact:true})
  const sound=page.getByRole('button',{name:'Sound',exact:true})
  const motion=page.getByRole('button',{name:/Reduce motion/})
  await expect(gear).toBeVisible()
  await expect(sound).toHaveCount(0)
  expect((await gear.boundingBox())!.width).toBeLessThanOrEqual(44)
  await gear.press('Enter')
  await expect(sound).toBeVisible()
  await expect(motion).toBeVisible()
  const panel=page.getByRole('group',{name:'Sound, motion and display'})
  const pop=(await panel.boundingBox())!
  expect(pop.x).toBeGreaterThanOrEqual(0)
  expect(pop.x+pop.width).toBeLessThanOrEqual(width)
  await sound.click()
  await expect(sound).toHaveAttribute('aria-pressed','true')
  await motion.press('Escape')
  await expect(gear).toBeFocused()
  await expect(sound).toHaveCount(0)
  const actual=(await main.boundingBox())!.width
  if(width<800)expect(actual).toBeGreaterThanOrEqual(width-16)
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(width)
  const gallery=page.getByRole('region',{name:'Montage portrait gallery'})
  await gallery.getByRole('button',{name:'Start round 1',exact:true}).click()
  await expect(gallery.getByRole('button',{name:'Buzz: I saw this face'})).toBeInViewport()
  await expect(gallery.getByRole('img',{name:/^Portrait with /})).toBeVisible()
  expect(await gallery.locator('.montage-top strong').evaluate(e=>getComputedStyle(e).color)).toBe('rgb(255, 240, 217)')
  if(process.env.CAPTURE_LANDING==='1'){
   await page.evaluate(()=>window.scrollTo(0,0))
   await page.screenshot({path:'../Imp-Plan-Montage-Stage-'+width+'.png'})
  }
 })
}

for(const [width,height] of [[390,844],[844,390]]){
 test('Blind board zoom pans within the game at '+width+'×'+height,async({page})=>{
  await page.setViewportSize({width,height})
  await page.goto('./season/1/')
  await page.getByRole('button',{name:'Practice Blind Gomoku',exact:true}).click()
  await page.getByRole('button',{name:'Start match',exact:true}).click()
  await page.getByRole('button',{name:'Enter match',exact:true}).click()
  const zoom=page.getByRole('group',{name:'Board zoom'})
  const board=page.getByRole('group',{name:'Blind Gomoku board',exact:true})
  await expect(board).toBeVisible()
  if(width>height)expect((await board.boundingBox())!.y).toBeLessThan(186)
  if(width<height){
   const gear=page.getByRole('button',{name:'Audio and display settings'})
   await page.setViewportSize({width:320,height:620})
   await gear.click()
   const panel=(await page.getByRole('group',{name:'Sound, motion and display'}).boundingBox())!
   expect(panel.x).toBeGreaterThanOrEqual(0)
   expect(panel.x+panel.width).toBeLessThanOrEqual(320)
   await gear.press('Escape')
   await page.setViewportSize({width,height})
  }
  await expect(zoom.getByRole('button',{name:'Zoom out'})).toBeDisabled()
  await zoom.getByRole('button',{name:'Zoom in'}).click()
  await zoom.getByRole('button',{name:'Zoom in'}).click()
  await expect(zoom).toContainText('150%')
  const viewport=page.getByRole('region',{name:'Blind Gomoku board scroll view'})
  expect(await viewport.evaluate(el=>el.scrollWidth>el.clientWidth)).toBe(true)
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(width)
  await zoom.getByRole('button',{name:'Fit board'}).click()
  await expect(zoom).toContainText('100%')
  await board.getByRole('button',{name:'Row 8, column 8, open',exact:true}).click()
  await expect(board.getByRole('button',{name:'Row 8, column 8, veiled',exact:true})).toBeVisible()
 })
}
