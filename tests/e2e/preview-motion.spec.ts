import {expect,test,type Page} from '@playwright/test'

const cover=(page:Page,game:string)=>page.locator(`[data-preview-game="${game}"]`)
const actor=(page:Page,game:string)=>cover(page,game).locator('[data-character-cue]')
const meet=(page:Page,game:string)=>cover(page,game).evaluate(node=>node.scrollIntoView({block:'center',behavior:'instant'}))
const gamePreview=(page:Page)=>page.locator('[data-game-preview],.arena-preview-scene:not(.arena-preview-still)')

test('home gallery plays character motion once without showing game mechanics',async({page})=>{
 await page.setViewportSize({width:911,height:660})
 await page.goto('./')
 await expect(page.locator('.featured .card')).toHaveCount(29)
 await expect(page.locator('[data-preview-game]')).toHaveCount(29)
 await expect(page.locator('.arena-preview [data-character-cue]')).toHaveCount(0)
 await expect(cover(page,'blind').locator('img[data-arena-art]')).toBeAttached()
 await meet(page,'blind')
 await expect(actor(page,'blind')).toBeVisible()
 const head=actor(page,'blind').locator('.keeper-head')
 expect(await head.evaluate(node=>node.getAnimations().some(a=>a.playState==='running'))).toBe(true)
 await expect(actor(page,'blind').locator('.keeper-eyes')).toHaveCount(1)
 await expect(gamePreview(page)).toHaveCount(0)
 await expect(page.getByRole('button',{name:'Practice Blind Gomoku',exact:true})).toBeVisible()
 await expect(actor(page,'blind')).toHaveCount(0,{timeout:3000})
 await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}))
 await expect(cover(page,'blind')).not.toBeInViewport()
 await meet(page,'blind')
 await expect(cover(page,'blind')).toHaveAttribute('data-preview-state','played')
 await expect(actor(page,'blind')).toHaveCount(0)
})

test('season card character cues vary and are cancelled offscreen',async({page})=>{
 // Isolate adjacent folio rows so their once-per-view cues cannot overlap.
 await page.setViewportSize({width:390,height:340})
 await page.goto('./season/3/')
 await meet(page,'memoryPoker')
 await expect(actor(page,'memoryPoker')).toHaveAttribute('data-character-cue','glance')
 await expect(cover(page,'heavy13')).not.toBeInViewport({ratio:.5})
 await meet(page,'heavy13')
 await expect(actor(page,'memoryPoker')).toHaveCount(0)
 await expect(actor(page,'heavy13')).toHaveAttribute('data-character-cue','signal')
 expect(await actor(page,'heavy13').locator('.keeper-hand').evaluate(n=>n.getAnimations().some(a=>a.playState==='running'))).toBe(true)
 await expect(gamePreview(page)).toHaveCount(0)
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
  await expect(page.locator('.arena-preview [data-character-cue]')).toHaveCount(0)
  await expect(gamePreview(page)).toHaveCount(0)
 })
}
