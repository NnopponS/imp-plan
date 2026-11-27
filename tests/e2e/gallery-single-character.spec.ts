import {expect,test,type Page} from '@playwright/test'

const cover=(page:Page,game:string)=>page.locator('[data-preview-game="'+game+'"]')
const overlay=(page:Page)=>page.locator('.arena-preview .arena-cover-motion')
async function showCover(page:Page,game:string){
 await cover(page,game).evaluate(node=>node.scrollIntoView({block:'center',behavior:'instant'}))
}
async function watchOverlays(page:Page){
 await page.evaluate(()=>{
  const history:string[][]=[]
  Object.defineProperty(window,'__galleryCovers',{value:history})
  const collect=()=>history.push(Array.from(document.querySelectorAll('.arena-preview:has(.arena-cover-motion)')).map(node=>node.getAttribute('data-preview-game')!))
  new MutationObserver(collect).observe(document.body,{childList:true,subtree:true})
  collect()
 })
}
const recorded=(page:Page)=>page.evaluate(()=>(window as unknown as {__galleryCovers:string[][]}).__galleryCovers)

test.beforeEach(async({page})=>{
 await page.addInitScript(()=>sessionStorage.setItem('imp-plan-codex-opened-v1','1'))
 await page.setViewportSize({width:911,height:780})
 await page.goto('./')
 await cover(page,'blind').waitFor({state:'attached'})
 await watchOverlays(page)
})

test('only one illustrated gallery motion can play; visible covers take turns',async({page})=>{
 await showCover(page,'blind')
 const firstRow=['blind','morris','auction']
 await expect.poll(async()=>new Set((await recorded(page)).flat().filter(game=>firstRow.includes(game))).size,{timeout:11000}).toBe(3)
 const history=await recorded(page)
 expect(Math.max(...history.map(snapshot=>snapshot.length))).toBe(1)
 await expect(page.locator('[data-game-preview]')).toHaveCount(0)
 await expect(page.getByRole('button',{name:'Practice Blind Gomoku',exact:true})).toBeVisible()
})

test('leaving or hiding the gallery hands off without replaying a started cue',async({page})=>{
 await showCover(page,'blind')
 await expect(overlay(page).first()).toBeAttached()
 const start=await overlay(page).first().evaluate(node=>node.closest('[data-preview-game]')!.getAttribute('data-preview-game')!)
 await showCover(page,'heavy13')
 await expect(cover(page,start).locator('.arena-cover-motion')).toHaveCount(0)
 await expect.poll(async()=>{const history=(await recorded(page)).flat();return history.some(game=>!['blind','morris','auction','point','remove','knight'].includes(game))},{timeout:4000}).toBe(true)
 await page.evaluate(()=>{
  Object.defineProperty(document,'hidden',{value:true,configurable:true})
  document.dispatchEvent(new Event('visibilitychange'))
 })
 await expect(overlay(page)).toHaveCount(0)
 await expect(cover(page,start)).toHaveAttribute('data-preview-state','played')
 await page.evaluate(()=>{
  Reflect.deleteProperty(document,'hidden')
  document.dispatchEvent(new Event('visibilitychange'))
 })
 await expect(overlay(page).first()).toBeAttached()
 expect(Math.max(...(await recorded(page)).map(snapshot=>snapshot.length))).toBe(1)
})
