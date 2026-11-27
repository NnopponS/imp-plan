import {expect,test,type Page} from '@playwright/test'

const cover=(page:Page,game:string)=>page.locator('[data-preview-game="'+game+'"]')
const overlay=(page:Page)=>page.locator('.arena-preview .arena-cover-motion')
const motion=(page:Page,game:string)=>cover(page,game).locator('[data-cover-motion][data-cover-ready="true"]')

test('both columns and both visible rows play together on a phone',async({page})=>{
 await page.setViewportSize({width:390,height:844})
 await page.goto('./#play')
 const games=['blind','morris','auction','point']
 await cover(page,'blind').evaluate(node=>node.scrollIntoView({block:'start',behavior:'instant'}))
 for(const game of games)await expect(cover(page,game)).toBeInViewport({ratio:.5})
 await expect.poll(()=>overlay(page).evaluateAll(nodes=>nodes.filter(node=>node.getAttribute('data-cover-ready')==='true')
  .map(node=>node.closest('[data-preview-game]')?.getAttribute('data-preview-game')))).toEqual(expect.arrayContaining(games))
 const positions=await Promise.all(games.map(game=>cover(page,game).boundingBox()))
 expect(new Set(positions.map(rect=>Math.round(rect!.x))).size).toBe(2)
 expect(new Set(positions.map(rect=>Math.round(rect!.y))).size).toBe(2)
 await expect(motion(page,'colorLink')).toHaveCount(0)
 await expect(page.locator('[data-game-preview]')).toHaveCount(0)
 await expect(page.getByRole('button',{name:'Practice Blind Gomoku',exact:true})).toBeVisible()
})

test('offscreen and hidden-tab covers return to the original still, then restart on return',async({page})=>{
 await page.setViewportSize({width:390,height:600})
 await page.goto('./#play')
 const first=cover(page,'blind')
 await first.evaluate(node=>node.scrollIntoView({block:'center',behavior:'instant'}))
 await expect(motion(page,'blind')).toBeVisible()
 await cover(page,'heavy13').evaluate(node=>node.scrollIntoView({block:'center',behavior:'instant'}))
 await expect(first.locator('[data-cover-motion]')).toHaveCount(0)
 await expect(first).toHaveAttribute('data-preview-state','idle')
 await expect(motion(page,'heavy13')).toBeVisible()
 await page.evaluate(()=>{
  Object.defineProperty(document,'hidden',{value:true,configurable:true})
  document.dispatchEvent(new Event('visibilitychange'))
 })
 await expect(overlay(page)).toHaveCount(0)
 await page.evaluate(()=>{
  Reflect.deleteProperty(document,'hidden')
  document.dispatchEvent(new Event('visibilitychange'))
 })
 await expect(motion(page,'heavy13')).toBeVisible()
 await first.evaluate(node=>node.scrollIntoView({block:'center',behavior:'instant'}))
 await expect(motion(page,'blind')).toBeVisible()
})
