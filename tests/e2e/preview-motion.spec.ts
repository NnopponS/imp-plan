import {expect,test,type Page} from '@playwright/test'

const cover=(page:Page,game:string)=>page.locator(`[data-preview-game="${game}"]`)
const scene=(page:Page,game:string)=>cover(page,game).locator('.arena-preview-scene')
const meet=(page:Page,game:string)=>cover(page,game).evaluate(node=>node.scrollIntoView({block:'center',behavior:'instant'}))

test('gallery plays a real move in view once without holding back the original art',async({page})=>{
 await page.setViewportSize({width:911,height:660})
 await page.goto('./')
 await expect(page.locator('.featured .card')).toHaveCount(29)
 await expect(page.locator('[data-preview-game]')).toHaveCount(29)
 await expect(page.locator('.arena-preview-scene')).toHaveCount(0)
 await expect(cover(page,'blind').locator('img[data-arena-art]')).toBeAttached()
 await meet(page,'blind')
 await expect(scene(page,'blind')).toBeVisible()
 await expect(scene(page,'blind').locator('.ap-cover-turn .ap-stone')).toHaveCount(5)
 expect(await scene(page,'blind').locator('.ap-drop').first().evaluate(node=>node.getAnimations().some(a=>a.playState==='running'))).toBe(true)
 await expect(page.getByRole('button',{name:'Practice Blind Gomoku',exact:true})).toBeVisible()
 await expect(scene(page,'blind')).toHaveCount(0,{timeout:4000})
 await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}))
 await expect(cover(page,'blind')).not.toBeInViewport()
 await meet(page,'blind')
 await expect(cover(page,'blind')).toHaveAttribute('data-preview-state','played')
 await expect(scene(page,'blind')).toHaveCount(0)
})

test('a season preview plays card flips instead of board stones and cancels offscreen',async({page})=>{
 await page.setViewportSize({width:390,height:480})
 await page.goto('./season/3/')
 await meet(page,'memoryPoker')
 await expect(scene(page,'memoryPoker')).toBeVisible()
 await expect(scene(page,'memoryPoker').locator('.ap-card-flip')).toHaveCount(5)
 await expect(scene(page,'memoryPoker').locator('.ap-stone')).toHaveCount(0)
 await meet(page,'heavy13')
 await expect(scene(page,'memoryPoker')).toHaveCount(0)
 await expect(scene(page,'heavy13').locator('.ap-stack-pickup')).toBeVisible()
})

for(const setting of ['system reduction','saved Motion off','no observer']){
 test(`uses only the poster with ${setting}`,async({page})=>{
  if(setting==='system reduction')await page.emulateMedia({reducedMotion:'reduce'})
  if(setting==='saved Motion off')await page.addInitScript(()=>localStorage.setItem('imp-plan-feedback-v1','{"sound":false,"motion":"off"}'))
  if(setting==='no observer')await page.addInitScript(()=>{Object.defineProperty(window,'IntersectionObserver',{value:undefined})})
  await page.goto('./season/1/')
  await meet(page,'blind')
  await expect(cover(page,'blind').locator('img[data-arena-art]')).toBeInViewport()
  await expect(page.getByRole('button',{name:'Practice Blind Gomoku',exact:true})).toBeVisible()
  await expect(cover(page,'blind')).toHaveAttribute('data-preview-state','idle')
  await expect(page.locator('.arena-preview-scene')).toHaveCount(0)
 })
}
