import {test,expect,type Page} from '@playwright/test'
import {selectedGame} from '../lobby-controls'
import {catalogScope,expectedCatalog,scopedCatalogIds} from './catalog-expectations'

async function expectCatalogCards(page:Page,season?:number){
 const {ids,playableKeys}=expectedCatalog(season)
 const previewKeys=page.locator('#play .card [data-preview-game]')
 const cardButtons=page.locator('#play .card button[id^="practice-gallery-"]')
 await expect(previewKeys).toHaveCount(playableKeys.length)
 expect(await previewKeys.evaluateAll(nodes=>nodes.map(node=>node.getAttribute('data-preview-game')).sort())).toEqual(playableKeys)
 await expect(cardButtons).toHaveCount(playableKeys.length)
 expect(await cardButtons.evaluateAll(nodes=>nodes.map(node=>node.id.slice('practice-gallery-'.length)).sort())).toEqual(playableKeys)
 const index=page.locator('#catalog')
 await index.locator('summary').first().click()
 await expect(index.locator('.directory article .register-seal .mono')).toHaveText(ids)
}
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
 const allIds=expectedCatalog().ids
 expect([...allIds].sort()).toEqual(scopedCatalogIds)
 await page.goto('./')
 await expectCatalogCards(page)
 for(const [n] of catalogScope){
  expect([...expectedCatalog(n).ids].sort()).toEqual(scopedCatalogIds.filter(id=>id.startsWith('S'+n+'-')))
  await page.getByRole('navigation',{name:'Seasons'}).getByRole('link',{name:'Season '+n,exact:true}).click()
  await expect(page).toHaveURL(new RegExp('/imp-plan/season/'+n+'/$'))
  await expectCatalogCards(page,n)
  await expect(page.getByRole('navigation',{name:'Seasons'}).getByRole('link',{name:'Season '+n,exact:true})).toHaveAttribute('aria-current','page')
  await page.reload()
  await expectCatalogCards(page,n)
 }
 await page.locator('#play').getByRole('button',{name:'Practice Point Gomoku',exact:true}).click()
 await expect(page.getByLabel('Nickname')).toHaveCount(0)
 await expect(selectedGame(page,'point')).toBeVisible()
})
test.describe('without client JavaScript',()=>{
 test.use({javaScriptEnabled:false})
 test('static home and season catalogs match the source without hydration',async({page})=>{
  for(const [route,season] of [['./',undefined] as const,...catalogScope.map(([n])=>['./season/'+n+'/',n] as const)]){
   const response=await page.goto(route)
   expect(response?.ok()).toBe(true)
   const {titles,playableTitles}=expectedCatalog(season)
   const index=page.locator('#catalog')
   const gallery=page.locator('#play .boot-cards')
   await expect(index.getByRole('heading',{name:'Challenge index'})).toBeVisible()
   await expect(index.locator('> p')).toHaveText(playableTitles.length+' of '+titles.length+' indexed challenges are playable.')
   await expect(index.getByRole('listitem')).toHaveText(titles)
   const headings=gallery.getByRole('heading',{level:3})
   await expect(headings).toHaveCount(playableTitles.length)
   expect((await headings.allTextContents()).sort()).toEqual(playableTitles)
  }
 })
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
