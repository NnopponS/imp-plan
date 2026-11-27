import {expect,test,type Page} from '@playwright/test'

const turn=(page:Page)=>page.locator('[data-page-turn]')
const entry=(page:Page)=>page.getByRole('heading',{name:'Imp Plan',exact:true})
const season=(page:Page,n:number)=>page.getByRole('link',{name:'Season '+n,exact:true})
const turnLog=(page:Page)=>page.evaluate(()=>(window as Window&{__pageTurnLog?:string[]}).__pageTurnLog)

async function recordTurns(page:Page){
 await page.addInitScript(()=>{
  const seen=new WeakSet(), turns:string[]=[]
  Object.defineProperty(window,'__pageTurnLog',{value:turns})
  new MutationObserver(()=>{
   for(const cover of document.querySelectorAll<HTMLElement>('[data-page-turn]')){
    if(seen.has(cover))continue
    seen.add(cover)
    turns.push(cover.dataset.pageTurn!)
   }
  }).observe(document,{childList:true,subtree:true})
 })
}

test('native chapter links and Back turn the page without re-opening Home intro',async({page})=>{
 await recordTurns(page)
 await page.goto('./season/1/')
 await expect(page.getByRole('heading',{name:'The First Plan',exact:true,level:1})).toBeVisible()
 await season(page,3).click()
 await expect(page).toHaveURL(/\/season\/3\/$/)
 await expect(page.getByRole('heading',{name:'Dead Again',exact:true,level:1})).toBeVisible()
 await expect.poll(()=>turnLog(page)).toContain('season-3')
 await page.goBack()
 await expect(page.getByRole('heading',{name:'The First Plan',exact:true,level:1})).toBeVisible()
 await expect.poll(()=>turnLog(page)).toContain('season-1')
 await page.locator('.brand').click()
 await expect(entry(page)).toBeVisible()
 await expect.poll(()=>turnLog(page)).toContain('home')
 await expect(page.locator('.codex-entry')).toHaveCount(0)
 await expect(page.getByRole('link',{name:'Browse games',exact:true})).toBeInViewport()
})

test('the engraved page turn completes its full cinematic beat without blocking the page',async({page})=>{
 await page.addInitScript(()=>{
  const log:{phase:string;ms:number}[]=[]
  Object.defineProperty(window,'__pageTurnTiming',{value:log})
  for(const phase of ['animationstart','animationend']){
   document.addEventListener(phase,event=>{
    const animation=event as AnimationEvent
    if(animation.animationName==='turn-leaf')log.push({phase,ms:Math.round(animation.elapsedTime*1000)})
   },true)
  }
 })
 await page.goto('./season/1/')
 await season(page,3).click()
 await expect(page.getByRole('heading',{name:'Dead Again',exact:true,level:1})).toBeVisible()
 const timings=()=>page.evaluate(()=>(window as Window&{__pageTurnTiming?:{phase:string;ms:number}[]}).__pageTurnTiming)
 await expect.poll(timings).toEqual([
  {phase:'animationstart',ms:0},
  {phase:'animationend',ms:780},
 ])
 await expect(turn(page)).toHaveCount(0)
})

test('large visible leaf yields to the first tap, preserves anchors and practice focus',async({page})=>{
 await page.setViewportSize({width:390,height:844})
 await recordTurns(page)
 await page.goto('./season/3/')
 await page.getByRole('link',{name:'Create or join a room'}).click()
 await expect(page).toHaveURL(/#room-entry$/)
 expect(await turnLog(page)).toEqual([])
 const game=page.getByRole('button',{name:'Practice Color Link'})
 await game.click()
 const lobby=page.getByRole('heading',{name:'Practice lobby',exact:true})
 await expect(lobby).toBeFocused()
 const leaf=turn(page)
 await expect(leaf).toHaveCSS('pointer-events','none')
 expect(await leaf.evaluate(el=>Math.round(el.getBoundingClientRect().width))).toBe(390)
 const frames=await leaf.locator('svg').evaluate(el=>{
  const effect=el.getAnimations()[0]
  if(!effect)return null
  effect.pause();effect.currentTime=0
  const first=getComputedStyle(el).transform
  effect.currentTime=180
  return [first,getComputedStyle(el).transform]
 })
 expect(frames).not.toBeNull()
 expect(frames?.[0]).not.toBe(frames?.[1])
 await page.getByRole('button',{name:'Start match',exact:true}).click()
 await expect(leaf).toHaveCount(0)
 await page.getByRole('button',{name:'Enter match'}).press('Enter')
 await expect(page.getByRole('region',{name:'Color Link board'})).toBeVisible()
 await expect.poll(()=>turnLog(page)).toEqual(['practice','match'])
 await page.getByRole('button',{name:'Leave room'}).click()
 await expect(game).toBeFocused()
 await expect.poll(()=>turnLog(page)).toEqual(['practice','match','season-3'])
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(390)
})

test('same-document invite navigation animates without changing room or typing behavior',async({page})=>{
 await recordTurns(page)
 await page.goto('./?qa=page-turn')
 await page.evaluate(()=>{location.hash='/join?room=ABC234'})
 await expect(page.getByRole('heading',{name:'Join a game',exact:true})).toBeVisible()
 await expect(page.getByLabel('Invite code')).toHaveValue('ABC234')
 await expect.poll(()=>turnLog(page)).toEqual(['invite'])
 await page.getByLabel('Nickname').fill('Fern')
 await expect(page.getByLabel('Nickname')).toBeFocused()
 await expect(page.getByLabel('Nickname')).toHaveValue('Fern')
})

for(const mode of ['system','saved'] as const)test('chapter and practice transitions honor '+mode+' reduced motion',async({page})=>{
 await recordTurns(page)
 if(mode==='system')await page.emulateMedia({reducedMotion:'reduce'})
 else await page.addInitScript(()=>localStorage.setItem('imp-plan-feedback-v1','{"sound":false,"motion":"off"}'))
 await page.goto('./season/1/')
 await season(page,3).click()
 await expect(page.getByRole('heading',{name:'Dead Again',exact:true,level:1})).toBeVisible()
 await page.getByRole('button',{name:'Practice Color Link'}).click()
 await expect(page.getByRole('heading',{name:'Practice lobby',exact:true})).toBeFocused()
 expect(await turnLog(page)).toEqual([])
})
