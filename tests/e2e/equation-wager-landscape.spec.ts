import {expect,test} from '@playwright/test'
import {startMatch} from './start-match'

test('Equation High-Low keeps the hand and wagers together on a short landscape phone',async({browser,baseURL},info)=>{
 const context=await browser.newContext({viewport:{width:844,height:390},isMobile:true,hasTouch:true,reducedMotion:'reduce'})
 try{
  const page=await context.newPage()
  await page.goto(baseURL!+'season/1/')
  await page.getByRole('button',{name:'Practice Equation High-Low',exact:true}).tap()
  await startMatch(page)
  const table=page.getByRole('region',{name:'Equation High-Low table'})
  await expect(table).toHaveAttribute('data-eh-phase','opening')
  const cards=table.locator('[aria-label="Your number cards"]')
  const bets=table.getByRole('group',{name:'Wager actions'})
  const check=bets.getByRole('button',{name:'Check',exact:true})
  for(const [mode,toggle] of [['table',false],['focus',true]] as const){
   if(toggle)await page.getByRole('button',{name:'Board focus',exact:true}).tap()
   await page.evaluate(()=>window.scrollTo(0,0))
   await page.screenshot({path:info.outputPath(mode+'.png')})
   console.info(mode,JSON.stringify({cards:await cards.boundingBox(),bets:await bets.boundingBox()}))
   await expect(cards).toBeInViewport({ratio:1})
   await expect(bets).toBeInViewport({ratio:1})
   expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(844)
  }
  await expect(check).toBeEnabled()
  await bets.getByRole('button',{name:'Raise to 3',exact:true}).tap()
  await expect(table).toHaveAttribute('data-eh-phase','closing')
  await expect(cards.getByRole('img')).toHaveCount(4)
  await expect(bets).toBeInViewport({ratio:1})
 }finally{await context.close()}
})
