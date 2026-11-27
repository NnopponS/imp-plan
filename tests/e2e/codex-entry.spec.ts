import {expect,test} from '@playwright/test'

test('first Home shows its opening over already available content and Escape dismisses',async({page})=>{
 await page.setViewportSize({width:911,height:892})
 await page.goto('./')
 const intro=page.locator('.codex-entry')
 await expect(intro).toBeVisible()
 await expect(intro.locator('.codex-entry-leaf')).toHaveCount(2)
 expect(await intro.locator('.codex-entry-leaf').first().evaluate(node=>node.getAnimations().length)).toBeGreaterThan(0)
 await expect(page.getByRole('heading',{name:'Imp Plan',exact:true})).toBeVisible()
 await page.keyboard.press('Escape')
 await expect(intro).toHaveCount(0)
 await page.reload()
 await expect(page.getByRole('heading',{name:'Imp Plan',exact:true})).toBeVisible()
 await expect(intro).toHaveCount(0)
})

test('opening leaves never swallow the first interaction on the actual Home',async({page})=>{
 await page.setViewportSize({width:911,height:892})
 await page.goto('./')
 await expect(page.getByRole('button',{name:'Skip intro'})).toBeInViewport()
 await page.getByRole('link',{name:'Browse games',exact:true}).click()
 await expect(page.locator('.codex-entry')).toHaveCount(0)
 await expect(page.getByRole('searchbox',{name:'Find playable games'})).toBeInViewport()
})

test('sixteen players make four different plays before the 30 second story ends',async({page,context})=>{
 await page.clock.install()
 await page.clock.pauseAt(new Date(Date.now()+1000))
 await page.goto('./')
 const intro=page.locator('.codex-entry')
 await expect(intro).toHaveAttribute('data-story-duration','30000')
 const cast=intro.locator('[data-story-player]')
 await expect(cast).toHaveCount(16)
 expect(new Set(await cast.evaluateAll(nodes=>nodes.map(node=>node.getAttribute('data-story-player')))).size).toBe(16)
 let elapsed=0
 for(const [at,scene,move] of [[4000,'mill','close-the-mill'],[9100,'auction','reveal-bids'],[14200,'fence','place-last-fence'],[19300,'color','complete-route']] as const){
  await page.clock.fastForward(at-elapsed)
  elapsed=at
  await expect(intro).toHaveAttribute('data-story-chapter',scene)
  await expect(cast).toHaveCount(4)
  const prop=intro.locator('[data-story-move="'+move+'"]')
  await expect(prop).toHaveCount(1)
  expect(await prop.evaluate(node=>node.getAnimations({subtree:true}).length)).toBeGreaterThan(0)
 }
 await page.clock.fastForward(28000-elapsed)
 await expect(intro).toHaveAttribute('data-story-chapter','seal')
 await expect(cast).toHaveCount(16)
 await expect(intro.locator('[data-story-door="open"]')).toHaveCount(1)
 await page.clock.fastForward(2400)
 await expect(intro).toHaveCount(0)
 await expect(page.getByRole('link',{name:'Browse games',exact:true})).toBeInViewport()
 const anotherTab=await context.newPage()
 await anotherTab.goto('./')
 await expect(anotherTab.getByRole('searchbox',{name:'Find playable games'})).toBeAttached()
 await expect(anotherTab.locator('.codex-entry')).toHaveCount(0)
})

test.describe('touch skip',()=>{
 test.use({viewport:{width:320,height:690},isMobile:true,hasTouch:true})
 test('the first phone viewport exposes the Skip button',async({page})=>{
  await page.goto('./')
  const skip=page.getByRole('button',{name:'Skip intro'})
  await expect(skip).toBeInViewport({ratio:1})
  expect((await skip.boundingBox())?.height).toBeGreaterThanOrEqual(44)
  await skip.tap()
  await expect(skip).toHaveCount(0)
  await expect(page.getByRole('link',{name:'Browse games',exact:true})).toBeInViewport()
 })
})
for(const direct of ['./#play','./#room-entry','./#/join?room=ABC234','./season/2/']){
 test('never shows an opening on a direct entry: '+direct,async({page})=>{
  await page.goto(direct)
  await expect(page.locator('main')).toBeVisible()
  await expect(page.locator('.codex-entry')).toHaveCount(0)
  if(direct.includes('/join'))await expect(page.getByRole('textbox',{name:'Invite code'})).toHaveValue('ABC234')
 })
}
for(const setting of ['OS reduced motion','saved Motion off']){
 test('opens immediately with '+setting,async({page})=>{
  if(setting==='OS reduced motion')await page.emulateMedia({reducedMotion:'reduce'})
  else await page.addInitScript(()=>localStorage.setItem('imp-plan-feedback-v1','{"sound":false,"motion":"off"}'))
  await page.goto('./')
  await expect(page.getByRole('heading',{name:'Imp Plan',exact:true})).toBeVisible()
  await expect(page.locator('.codex-entry')).toHaveCount(0)
 })
}

test('keyboard skip restores focus to the Home navigation',async({page})=>{
 await page.goto('./')
 const skip=page.getByRole('button',{name:'Skip intro'})
 await page.keyboard.press('Tab')
 await expect(skip).toBeFocused()
 await page.keyboard.press('Enter')
 await expect(skip).toHaveCount(0)
 await expect(page.locator('.landing-bar .brand')).toBeFocused()
})

test('blocked session storage fails open to the real Home',async({page})=>{
 await page.addInitScript(()=>{Object.defineProperty(window,'sessionStorage',{get(){throw new Error('storage denied')}})})
 await page.goto('./')
 await expect(page.locator('.codex-entry')).toHaveCount(0)
 await expect(page.getByRole('heading',{name:'Imp Plan',exact:true})).toBeVisible()
 await page.getByRole('button',{name:'Solo practice',exact:true}).click()
 await expect(page.getByRole('heading',{name:'Practice lobby',exact:true})).toBeVisible()
})

test('opening brings in the keeper character before the covers part',async({page})=>{
 await page.goto('./')
 const actor=page.locator('.codex-entry [data-character-cue="signal"]')
 await expect(actor).toBeVisible()
 const frames=await actor.locator('.keeper-head').evaluate(async element=>{
  const [turn]=element.getAnimations()
  if(!turn)return null
  turn.pause()
  turn.currentTime=0
  await turn.ready
  const from=getComputedStyle(element).transform
  turn.currentTime=225
  return [from,getComputedStyle(element).transform]
 })
 expect(frames).not.toBeNull()
 expect(frames?.[0]).not.toBe(frames?.[1])
 await page.getByRole('button',{name:'Skip intro'}).click()
 await expect(actor).toHaveCount(0)
})
