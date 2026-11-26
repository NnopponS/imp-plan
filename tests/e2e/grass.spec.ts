import {startMatch} from './start-match'
import {test,expect} from '@playwright/test'
for(const [season,title] of [[1,'Laying Grass'],[3,'Lay the Grass']] as const){
 test(title+' opens its own draft and places a tile on mobile',async({page})=>{
  await page.setViewportSize({width:390,height:844})
  await page.goto('./season/'+season+'/')
  await page.getByLabel('Nickname').fill('Gardener')
  await page.getByRole('button',{name:'Practice '+title}).click()
  await startMatch(page)
  if(season===3)await page.getByRole('button',{name:'Ready to draft'}).click()
  await expect(page.getByText(/Gardener drafts next/)).toBeVisible()
  const grid=page.getByRole('group',{name:'Territory board'})
  const label=(await grid.getByRole('button',{name:/Gardener/}).getAttribute('aria-label'))!
  const [row,col]=label.match(/\d+/g)!.map(Number)
  const place=page.getByRole('button',{name:'Place tile'})
  for(const [r,c] of [[row+1,col],[row+1,col-1],[row,col+1],[row-1,col],[row-1,col-1]]){
   await grid.getByRole('button',{name:new RegExp('^Row '+r+', column '+c+'(?:,|$)')}).click()
   if(await place.isEnabled())break
  }
  await expect(place).toBeEnabled()
  await place.click()
  await expect.poll(()=>grid.getByRole('button',{name:/Gardener/}).count()).toBeGreaterThan(1)
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(390)
 })
}
