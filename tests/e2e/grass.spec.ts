import {startMatch} from './start-match'
import {test,expect} from '@playwright/test'
for(const [season,title,width,height] of [[1,'Laying Grass',390,844],[3,'Lay the Grass',320,640]] as const){
 test(title+' shows the live board and its main action together, then places a tile on mobile',async({browser,baseURL},info)=>{
  const context=await browser.newContext({baseURL,viewport:{width,height},hasTouch:true,isMobile:true,reducedMotion:'reduce'})
  try{
   const page=await context.newPage()
   await page.goto('./season/'+season+'/')
   await page.getByRole('button',{name:'Practice '+title,exact:true}).tap()
   await startMatch(page)
   const grid=page.getByRole('group',{name:'Territory board'})
   const place=page.getByRole('button',{name:'Place tile',exact:true})
   const main=season===3?page.getByRole('button',{name:'Ready to draft',exact:true}):place
   await expect(grid).toBeVisible()
   const numberOfPlots=await grid.getByRole('button').count()
   await expect(grid.locator('[data-field-print="plot"]')).toHaveCount(numberOfPlots)
   const playerCells=grid.getByRole('button',{name:/Player/})
   const originalParcels=await playerCells.count()
   await expect(playerCells.locator('[data-field-print="parcel"]')).toHaveCount(originalParcels)
   const open=await grid.boundingBox(), action=await main.boundingBox()
   await page.screenshot({path:info.outputPath('opening.png')})
   console.log(title, 'opening board', open, 'phase action', action)
   await expect(grid).toBeInViewport({ratio:.85})
   await expect(main).toBeInViewport({ratio:1})
   if(season===3){
    await expect(page.getByRole('group',{name:'Optional trade'})).toBeHidden()
    await expect(page.getByRole('button',{name:'Offer swap',exact:true})).toBeHidden()
    await expect(page.getByRole('group',{name:'Available tiles'})).toBeHidden()
    await main.tap()
   }
   await expect(page.getByText(/Player drafts next/)).toBeVisible()
   const tray=page.getByRole('group',{name:'Available tiles'})
   await expect(tray.getByRole('button',{pressed:true}).locator('[data-field-print="piece"] path').first()).toHaveAttribute('d',/M/)
   await expect(place).toBeInViewport({ratio:1})
   const label=(await grid.getByRole('button',{name:/Player/}).getAttribute('aria-label'))!
   const [row,col]=label.match(/\d+/g)!.map(Number)
   const square=(r:number,c:number)=>grid.getByRole('button',{name:new RegExp('^Row '+r+', column '+c+'(?:,|$)')})
   const seed=square(row,col)
   await seed.focus()
   await page.keyboard.press('ArrowDown')
   await expect(square(row+1,col)).toBeFocused()
   for(const [r,c] of [[row+1,col],[row+1,col-1],[row,col+1],[row-1,col],[row-1,col-1]]){
    await square(r,c).tap()
    if(await place.isEnabled())break
   }
   await expect(place).toBeEnabled()
   await expect(grid.locator('[data-preview="valid"] [data-field-print="trial"]').first()).toBeVisible()
   await page.screenshot({path:info.outputPath('placement.png')})
   await place.tap()
   await expect.poll(()=>playerCells.locator('[data-field-print="parcel"]').count()).toBeGreaterThan(originalParcels)
   await page.screenshot({path:info.outputPath('planted.png')})
   expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(width)
  }finally{await context.close()}
 })
}
