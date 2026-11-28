import {expect,test,type Page} from '@playwright/test'
import {chooseGame,tableRadio} from '../lobby-controls'
import {startMatch} from './start-match'

const cabinet=(page:Page)=>page.locator('[data-tr-phase]')
const cell=(page:Page,i:number)=>cabinet(page).locator(`[data-tr-cell="${i}"]`)

test('a host and two browser peers place a line, see only their ballot, and reach shared results',async({browser,baseURL})=>{
 const contexts=await Promise.all([browser.newContext({viewport:{width:1280,height:820},reducedMotion:'reduce'}),browser.newContext({viewport:{width:360,height:800},hasTouch:true,isMobile:true,reducedMotion:'reduce'}),browser.newContext({viewport:{width:1024,height:800},reducedMotion:'reduce'})])
 try{
  const pages=await Promise.all(contexts.map(c=>c.newPage()))
  const host=pages[0]
  await host.goto(baseURL!)
  await host.getByLabel('Nickname').fill('Print host')
  await host.getByRole('button',{name:'Create party'}).click()
  const code=(await host.getByTestId('room-code').textContent())!
  await chooseGame(host,'threeRow')
  for(const [i,page] of pages.entries())if(i){
   await page.goto(baseURL!+'#/join?room='+code)
   await page.getByLabel('Nickname').fill('Print guest '+i)
   await page.getByRole('button',{name:'Join party'}).click()
   await page.getByRole('button',{name:'Ready up',exact:true}).click()
  }
  await startMatch(host)
  for(const page of pages){
   await expect(cabinet(page)).toHaveAttribute('data-tr-phase','place')
   await expect(page.locator('[data-tr-private]')).toHaveCount(1)
   await expect(page.locator('[data-tr-reveal]')).toHaveCount(0)
  }
  for(let i=0;i<3;i++){
   await expect.poll(async()=>await Promise.all(pages.map(async (p,index)=>(await cell(p,i).getAttribute('aria-disabled'))==='false'?index:-1)),{message:'only the active seat gains a placement'}).not.toEqual([-1,-1,-1])
   const enabled=(await Promise.all(pages.map(async(p)=>(await cell(p,i).getAttribute('aria-disabled'))==='false'))).findIndex(Boolean)
   expect(enabled).toBeGreaterThanOrEqual(0)
   await cabinet(pages[enabled]).locator('[data-tr-mark="A"]').click()
   if(enabled===1)await cell(pages[enabled],i).tap()
   else await cell(pages[enabled],i).press('Enter')
  }
  for(const page of pages)await expect(cabinet(page)).toHaveAttribute('data-tr-phase','vote')
  await host.locator('[data-tr-suspect]').first().click()
  await expect(host.locator('[data-tr-sealed]')).toBeVisible()
  await expect(pages[1].locator('[data-tr-sealed]')).toHaveCount(0)
  await expect(pages[1].locator('[data-tr-reveal]')).toHaveCount(0)
  await pages[1].locator('[data-tr-suspect]').first().tap()
  await pages[2].locator('[data-tr-suspect]').first().click()
  for(const page of pages){
   await expect(cabinet(page)).toHaveAttribute('data-tr-phase','done')
   await expect(page.locator('[data-tr-reveal]')).toHaveCount(3)
   await expect(page.getByRole('region',{name:'Match record'})).toContainText('Allies win')
  }
  expect(await pages[1].evaluate(()=>document.documentElement.scrollWidth)).toBe(360)
 }finally{await Promise.all(contexts.map(c=>c.close()))}
})

test('narrow practice opens without a nickname and offers bot difficulty',async({browser,baseURL})=>{
 const ctx=await browser.newContext({viewport:{width:360,height:760},isMobile:true,hasTouch:true,reducedMotion:'reduce'})
 try{
  const page=await ctx.newPage()
  await page.goto(baseURL!+'season/1/')
  await page.getByRole('button',{name:'Practice Four-Player Three in a Row',exact:true}).tap()
  await expect(page.getByRole('textbox',{name:'Nickname'})).toHaveCount(0)
  await tableRadio(page,'Bot difficulty','Hard').tap()
  await expect(tableRadio(page,'Bot difficulty','Hard')).toBeChecked()
  await page.getByRole('button',{name:'Start match',exact:true}).tap()
  const briefing=page.getByRole('dialog')
  await briefing.getByRole('button',{name:/^Go to lesson page 2:/}).tap()
  await expect(briefing.locator('[data-tr-example="1"]')).toContainText('Both sides')
  await briefing.getByRole('button',{name:/^Go to lesson page 3:/}).tap()
  await expect(briefing.locator('[data-tr-example="2"]')).toContainText('Seal a private ballot')
  await briefing.getByRole('button',{name:'Enter match',exact:true}).tap()
  await expect(cabinet(page)).toHaveAttribute('data-tr-phase','place')
  await expect(page.locator('[data-tr-cell]')).toHaveCount(25)
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(360)
 }finally{await ctx.close()}
})
