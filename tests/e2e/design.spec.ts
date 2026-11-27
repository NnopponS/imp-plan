import {test,expect} from '@playwright/test'
import {selectedGame} from '../lobby-controls'
test('fan brand and original art are visible without motion or mobile overflow',async({page})=>{
 await page.setViewportSize({width:390,height:844})
 await page.emulateMedia({reducedMotion:'reduce'})
 await page.goto('./')
 await expect(page).toHaveTitle(/Imp Plan.*Unofficial/)
 await expect(page.getByRole('heading',{name:'Imp Plan',exact:true})).toBeVisible()
 await expect(page.getByRole('button',{name:'Create party'})).toBeVisible()
 await expect(page.getByText('Unofficial fan project', {exact:true})).toBeVisible()
 for(const asset of await page.locator('img[data-arena-art]').all()){
  await asset.scrollIntoViewIfNeeded()
  await expect.poll(async()=>asset.evaluate((n:HTMLImageElement)=>n.complete&&n.naturalWidth>0)).toBe(true)
 }
 await expect(page.locator('video, img[src*="arena-stage"]')).toHaveCount(0)
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(390)
 await page.getByRole('button',{name:'Solo practice'}).click()
 await expect(page.getByRole('heading',{name:'Practice lobby'})).toBeVisible()
})
test('each season has a distinct path, accurate index and playable cards',async({page})=>{
 await page.goto('./')
 for(const [n,count,games] of [[1,18,9],[2,17,7],[3,29,15]]){
  await page.getByRole('navigation',{name:'Seasons'}).getByRole('link',{name:'Season '+n,exact:true}).click()
  await expect(page).toHaveURL(new RegExp('/imp-plan/season/'+n+'/$'))
  await expect(page.locator('.directory article')).toHaveCount(count)
  await expect(page.locator('.featured .card')).toHaveCount(games)
  await expect(page.getByRole('navigation',{name:'Seasons'}).getByRole('link',{name:'Season '+n,exact:true})).toHaveAttribute('aria-current','page')
  await page.reload()
  await expect(page.locator('.directory article')).toHaveCount(count)
 }
 await page.getByRole('button',{name:/Practice Point Gomoku/}).click()
 await expect(page.getByLabel('Nickname')).toHaveCount(0)
 await expect(selectedGame(page,'point')).toBeVisible()
})
test('a wardrobe choice takes effect without requiring a nickname',async({page})=>{
 await page.goto('./')
 const wardrobe=page.getByRole('region',{name:'Player wardrobe'})
 await expect(wardrobe).toBeVisible()
 await wardrobe.getByRole('button',{name:'Cloak',exact:true}).click()
 await wardrobe.locator('label[title="Midnight cloak"]').click()
 await expect(wardrobe.getByRole('img',{name:/Midnight cloak/})).toBeVisible()
 await expect(page.getByLabel('Nickname')).toHaveValue('')
})
