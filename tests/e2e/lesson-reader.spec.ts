import {expect,test,type Page} from '@playwright/test'
import catalog from '../../src/catalog.json' with {type:'json'}
import type {Game} from '../../src/engine'

async function open(page:Page,game:Game,navigate=true){
 const season=catalog.find(row=>row.game===game)!.season
 if(navigate)await page.goto('./season/'+season+'/',{waitUntil:'domcontentloaded'})
 await page.locator('#practice-gallery-'+game).click()
 await page.getByRole('button',{name:'Start match',exact:true}).click()
 return page.getByRole('dialog')
}
test('touch pages both ways without turning an ordinary vertical gesture into a page change',async({browser,baseURL},info)=>{
 const ctx=await browser.newContext({baseURL,hasTouch:true,isMobile:true,viewport:{width:390,height:844},reducedMotion:'reduce'})
 try{
  const page=await ctx.newPage()
  const dialog=await open(page,'bagh')
  const region=dialog.getByRole('region',{name:'How to play'})
  const box=await dialog.locator('.brief-page').boundingBox()
  const x=Math.round(box!.x+box!.width*.45),y=Math.round(box!.y+box!.height*.55)
  const cdp=await ctx.newCDPSession(page)
  async function drag(dx:number,dy:number){
   await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]})
   for(let i=1;i<=5;i++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+i*dx/5,y:y+i*dy/5}]})
   await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]})
  }
  await expect(dialog.getByRole('heading',{name:'Four corners'})).toBeVisible()
  await expect(region.getByRole('button',{name:/^(Back|Next|Previous)( step)?$/i})).toHaveCount(0)
  await expect(dialog.locator('.brief-cue')).toHaveCSS('opacity','1')
  await expect(dialog.locator('details')).not.toHaveAttribute('open','')
  await expect(dialog.getByRole('list',{name:'Rules'})).toHaveCount(0)
  await drag(95,4)
  await expect(dialog.getByRole('heading',{name:'Place a goat'})).toBeVisible()
  await drag(-95,4)
  await expect(dialog.getByRole('heading',{name:'Four corners'})).toBeVisible()
  await drag(3,-78)
  await expect(dialog.getByRole('heading',{name:'Four corners'})).toBeVisible()
  await region.getByRole('button',{name:/^Go to lesson page 4:/}).tap()
  await expect(dialog.getByRole('heading',{name:'Jump to capture'})).toBeVisible()
  await expect(dialog.getByRole('button',{name:'Enter match'})).toBeInViewport({ratio:1})
  await dialog.screenshot({path:info.outputPath('bagh-mobile.png')})
  await expect(dialog.getByRole('timer')).toHaveCount(0)
  await dialog.locator('summary').tap()
  await expect(dialog.getByText(/A traditional Nepali duel/)).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('button',{name:'Start match',exact:true})).toBeFocused()
 }finally{await ctx.close()}
})

test('keyboard navigation preserves boundaries, retains a rule reference, and does not delay entry',async({page},info)=>{
 await page.setViewportSize({width:1366,height:768})
 const dialog=await open(page,'equations')
 const region=dialog.getByRole('region',{name:'How to play'})
 await region.press('ArrowLeft')
 await expect(region.getByRole('button',{name:/^Go to lesson page 1:/})).toHaveAttribute('aria-current','step')
 const rect=await region.locator('.brief-scene-object').boundingBox()
 const x=rect!.x+rect!.width*.36,y=rect!.y+rect!.height*.50
 await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x+100,y+5,{steps:5});await page.mouse.up()
 await expect(region.getByRole('heading',{name:'Read the lights'})).toBeVisible()
 await expect(region.locator('.brief-cue')).toHaveAttribute('data-ready','true')
 await expect(region.locator('.brief-cue-hand')).toHaveCSS('animation-name','brief-swipe-hand')
 await dialog.screenshot({path:info.outputPath('equation-desktop.png')})
 await region.press('End')
 await expect(region.getByRole('button',{name:/^Go to lesson page 3:/})).toHaveAttribute('aria-current','step')
 await expect(region.locator('.brief-cue')).toContainText('Enter match')
 await region.press('Home')
 await expect(region.getByRole('heading',{name:'Hide an equation'})).toBeVisible()
 await dialog.getByRole('button',{name:'Enter match'}).press('Enter')
 await expect(dialog).toHaveCount(0)
 await expect(page.getByRole('heading',{name:'Equation Lights',level:1})).toBeFocused()
})

// Exercise the user-facing integration, including every lazy variant actually selected by the lobby.
for(const season of [1,2,3]){
 test('season '+season+' practice tables all page through a changing worked example',async({page})=>{
  test.setTimeout(220_000)
  await page.setViewportSize({width:390,height:844})
  await page.emulateMedia({reducedMotion:'reduce'})
  const keys=[...new Set(catalog.filter(r=>r.season===season&&r.game).map(r=>r.game as Game))]
  await page.goto('./season/'+season+'/',{waitUntil:'domcontentloaded'})
  for(const key of keys){
   const dialog=await open(page,key,false)
   const region=dialog.getByRole('region',{name:'How to play'})
   await expect(region,key).toHaveAttribute('data-lesson-kind','worked-example')
   const pic=region.locator('.brief-scene-object')
   await expect(pic.locator('svg:visible,table:visible,.duel-preview-board:visible,.montage-lesson:visible,.rule-demo-bank:visible').first(),key).toBeVisible()
   const firstArt=await pic.innerHTML(),firstTitle=await region.getByRole('heading',{level:3}).innerText()
   await region.press('ArrowRight')
   await expect(region.getByRole('heading',{level:3})).not.toHaveText(firstTitle)
   expect(await pic.innerHTML(),key+' illustration must change').not.toBe(firstArt)
   await region.press('End')
   await expect(region.getByRole('group',{name:'Lesson pages'}).getByRole('button').last()).toHaveAttribute('aria-current','step')
   await expect(dialog.getByRole('timer')).toHaveCount(0)
   await expect(dialog.getByRole('button',{name:'Enter match'})).toBeInViewport({ratio:1})
   await page.keyboard.press('Escape')
   await page.getByRole('button',{name:'Leave room',exact:true}).click()
  }
 })
}
