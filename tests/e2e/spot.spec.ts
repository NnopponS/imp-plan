import {startMatch} from './start-match'
import {test,expect} from '@playwright/test'
test('spots differences by touch and keyboard across zoom and rotation',async({browser,baseURL})=>{
 const ctx=await browser.newContext({viewport:{width:360,height:780},hasTouch:true,isMobile:true})
 try{
  const page=await ctx.newPage()
  await page.clock.install()
  await page.goto(baseURL!+'season/3/')
  await page.getByLabel('Nickname').fill('Inspector')
  await page.getByRole('button',{name:/Practice Spot the Difference/}).click()
  await startMatch(page)
  const game=page.getByRole('region',{name:'Spot the Difference'})
  await game.getByText('Compare by region (text and keyboard)').click()
  const rows=await game.locator('.spot-list>div').all()
  expect(rows).toHaveLength(12)
  const correct:string[]=[]
  let miss=''
  for(const row of rows){
   const [a,b]=await row.locator('span').allTextContents()
   const name=(await row.locator('strong').textContent())!
   if(a.slice(8)!==b.slice(9))correct.push(name)
   else miss=name
  }
  expect(correct.length).toBeGreaterThanOrEqual(5)
  const timer=game.getByLabel('Time remaining')
  await game.getByRole('button',{name:'Mark '+miss,exact:true}).press('Enter')
  await expect(game.getByText('Penalty: +5 s')).toBeVisible()
  expect(parseInt((await timer.textContent())!,10)).toBeLessThanOrEqual(85)
  await game.locator(`.spot-tray:first-child [data-region="${correct[0]}"]`).tap()
  await expect(game.getByText('1 / '+correct.length+' found')).toBeVisible()
  const marked=game.getByRole('button',{name:'Found '+correct[0],exact:true})
  await expect(marked).toBeDisabled()
  await page.setViewportSize({width:780,height:360})
  await game.getByRole('button',{name:'Zoom trays'}).click()
  await expect(game.locator(`.spot-tray:last-child [data-region="${correct[0]}"]`)).toBeDisabled()
  await game.locator(`.spot-tray:last-child [data-region="${correct[1]}"]`).tap()
  await expect(game.getByText('2 / '+correct.length+' found')).toBeVisible()
  await page.setViewportSize({width:360,height:780})
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(360)
  for(const label of correct.slice(2))await game.getByRole('button',{name:'Mark '+label,exact:true}).press('Enter')
  await expect(page.getByRole('heading',{name:'Practice complete'})).toBeVisible()
  await expect(game.getByText('Solution shown on both trays.')).toBeVisible()
 }finally{await ctx.close()}
})
