import {test,expect} from '@playwright/test'
import {startMatch} from './start-match'
import {hexLines} from '../../src/puzzles'

for(const viewport of [{width:320,height:568},{width:844,height:390},{width:1440,height:900}]){
 test(`illustrated Hexagon chamber keeps real tiles and the lock in reach at ${viewport.width} × ${viewport.height}`,async({browser,baseURL})=>{
  const context=await browser.newContext({viewport,hasTouch:viewport.width<900,reducedMotion:'reduce'})
  try{
   const page=await context.newPage()
   await page.clock.install()
   await page.goto(baseURL!)
   await page.getByRole('button',{name:'Practice Hexagon',exact:true}).click()
   await startMatch(page)
   await page.evaluate(()=>window.scrollTo(0,0))
   const bench=page.getByRole('region',{name:'Hexagon instrument'})
   const stage=bench.locator('.hex-stage')
   const art=stage.locator('.hex-chamber-art')
   await expect(art).toBeVisible()
   await expect(art).toHaveAttribute('alt','')
   await expect.poll(()=>art.evaluate((image:HTMLImageElement)=>image.complete&&image.naturalWidth>0)).toBe(true)
   const tiles=stage.getByRole('group',{name:'Hexagon tiles'}).getByRole('button')
   await expect(tiles).toHaveCount(19)
   const values=(await tiles.allTextContents()).map(Number)
   expect(values.every(n=>n>=1&&n<=20)).toBe(true)
   await expect(stage.getByRole('timer',{name:'Time remaining'})).toBeInViewport({ratio:1})
   await expect(stage.getByText('Target sum',{exact:true})).toHaveCount(0)
   if(process.env.HEX_SCENE_PROOF)await page.screenshot({path:`${process.env.HEX_SCENE_PROOF}/hex-${viewport.width}-study.png`})
   const hitAreas=await tiles.evaluateAll(nodes=>nodes.map(tile=>{
    const r=tile.getBoundingClientRect()
    return {width:r.width,height:r.height,inView:r.top>=0&&r.left>=0&&r.right<=innerWidth&&r.bottom<=innerHeight}
   }))
   for(const area of hitAreas){
    expect(area.inView).toBe(true)
    expect(area.height).toBeGreaterThanOrEqual(44)
    expect(area.width).toBeGreaterThanOrEqual(44)
   }
   await page.clock.fastForward(30_500)
   const target=stage.locator('.puzzle-target strong')
   const lock=stage.getByRole('button',{name:'Lock answer'})
   await expect(target).toBeInViewport({ratio:1})
   await expect(lock).toBeInViewport({ratio:1})
   expect(await tiles.allTextContents()).toEqual(Array.from('ABCDEFGHIJKLMNOPQRS'))
   await expect(stage.getByRole('button',{name:/value \d+/})).toHaveCount(0)
   const sum=Number(await target.textContent())
   const indices=hexLines().find(line=>line.reduce((total,i)=>total+values[i],0)===sum)!
   for(const i of indices){
    if(viewport.width===320)await tiles.nth(i).tap()
    else await tiles.nth(i).press('Enter')
   }
   await expect(stage.getByRole('button',{pressed:true})).toHaveCount(3)
   await expect(lock).toBeEnabled()
   if(process.env.HEX_SCENE_PROOF)await page.screenshot({path:`${process.env.HEX_SCENE_PROOF}/hex-${viewport.width}-selected.png`})
   await lock.press('Enter')
   await expect(bench.getByText('1 correct',{exact:true})).toBeVisible()
   expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(viewport.width)
  }finally{await context.close()}
 })
}
