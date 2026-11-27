import {expect,test,type Page} from '@playwright/test'
import {countRectangles} from '../../src/puzzles'
import {chooseGame} from '../lobby-controls'

const stage=(page:Page,phase:string)=>page.locator('[data-folio-stage="'+phase+'"]')
// Record natural short-lived DOM commits without making the normal effect unskippable.
async function track(page:Page){
 await page.addInitScript(()=>{
  const seen:Array<{phase:string|undefined;game:string|undefined;cover:string|null|undefined;venue:string|undefined}>=[]
  const logged=new WeakSet()
  Object.defineProperty(window,'__folioQA',{value:seen})
  new MutationObserver(()=>{
   document.querySelectorAll<HTMLElement>('[data-folio-stage]').forEach(el=>{
    if(logged.has(el))return
    logged.add(el)
    seen.push({phase:el.dataset.folioStage,game:el.dataset.folioGame,cover:el.querySelector('img')?.getAttribute('src'),venue:el.dataset.folioVenue})
   })
  }).observe(document,{childList:true,subtree:true})
 })
}
const seen=(page:Page)=>page.evaluate(()=>(window as Window&{__folioQA?:unknown[]}).__folioQA)

test('Home, direct chapters and hash invites reveal live content without changing routing',async({page})=>{
 await track(page)
 await page.goto('./',{waitUntil:'domcontentloaded'})
 await expect(page.getByRole('heading',{name:'Imp Plan',exact:true})).toBeVisible()
 await expect.poll(()=>seen(page)).toContainEqual(expect.objectContaining({phase:'home',cover:expect.stringContaining('landing-hero.svg')}))
 await page.goto('./season/3/',{waitUntil:'domcontentloaded'})
 await expect(page.getByRole('heading',{name:'Dead Again',exact:true})).toBeVisible()
 await expect(page.locator('.codex-entry')).toHaveCount(0)
 await expect.poll(()=>seen(page)).toContainEqual(expect.objectContaining({phase:'season',cover:expect.stringContaining('landing-season-3.svg')}))
 await page.goto('./#/join?room=ABC234',{waitUntil:'domcontentloaded'})
 await expect(page.getByLabel('Invite code')).toHaveValue('ABC234')
 await expect(page.locator('.codex-entry')).toHaveCount(0)
 await page.getByLabel('Nickname').pressSequentially('Sora')
 await expect(page.getByLabel('Nickname')).toBeFocused()
 await expect(page.getByLabel('Nickname')).toHaveValue('Sora')
 await expect.poll(()=>seen(page)).toContainEqual(expect.objectContaining({phase:'invite'}))
 await expect(stage(page,'invite')).toHaveCount(0)
})

test('Practice and briefing use the selected painting, enter by key immediately, and stamp a real result',async({page})=>{
 await page.setViewportSize({width:390,height:844})
 await track(page)
 await page.goto('./season/3/',{waitUntil:'domcontentloaded'})
 await page.getByRole('button',{name:'Practice Count the Cubes'}).click()
 await expect(page.getByRole('heading',{name:'Practice lobby'})).toBeFocused()
 const cue={phase:'practice',game:'cubes',cover:expect.stringContaining('seasonal-cubes.svg')}
 await expect.poll(()=>seen(page)).toContainEqual(expect.objectContaining(cue))
 await page.getByRole('button',{name:'Start match',exact:true}).click()
 const briefing=page.getByRole('dialog',{name:'Count the Cubes'})
 await expect(briefing).toHaveCSS('animation-name','none')
 await expect(briefing.getByRole('button',{name:'Enter match'})).toBeEnabled()
 await expect(page.getByRole('button',{name:'Lock answer',includeHidden:true})).toHaveCount(0)
 await expect.poll(()=>seen(page)).toContainEqual(expect.objectContaining({...cue,phase:'brief'}))
 await page.keyboard.press('Escape')
 await expect(briefing).toHaveCount(0)
 await expect(page.getByRole('button',{name:'Start match',exact:true})).toBeFocused()
 await page.getByRole('button',{name:'Leave room'}).click()

 await page.getByRole('button',{name:'Practice Count the Rectangles'}).click()
 await page.getByRole('button',{name:'Start match',exact:true}).click()
 await page.getByRole('button',{name:'Enter match'}).press('Enter')
 await expect(page.getByRole('heading',{name:'Count the Rectangles',exact:true,level:1})).toBeFocused()
 await expect.poll(()=>seen(page)).toContainEqual(expect.objectContaining({phase:'match',game:'rectangles',cover:expect.stringContaining('seasonal-rectangles.svg')}))
 for(let n=1;n<=4;n++){
  await expect(page.getByText('Grid '+n+' / 4')).toBeVisible()
  const tiles=page.getByRole('group',{name:'Rectangle grid'}).getByRole('button')
  const value=Number(await page.locator('.puzzle-target strong').textContent())
  await page.getByLabel('Rectangle count').fill(String(countRectangles((await tiles.allTextContents()).map(Number),3+n,Math.max(5,3+n),value)))
  await page.getByRole('button',{name:'Lock answer'}).click()
 }
 await expect(page.getByRole('region',{name:'Match record'}).getByRole('button',{name:'Export result'})).toBeEnabled()
 await expect.poll(()=>seen(page)).toContainEqual(expect.objectContaining({phase:'result',game:'rectangles'}))
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(390)
})

test('an arriving party guest keeps their direct invite and sees the host’s chosen folio',async({browser,baseURL})=>{
 const h=await browser.newContext(),g=await browser.newContext({viewport:{width:390,height:844}})
 try{
  const host=await h.newPage(),guest=await g.newPage()
  await track(host);await track(guest)
  await host.goto(baseURL!,{waitUntil:'domcontentloaded'})
  await host.getByLabel('Nickname').fill('Lark')
  await host.getByRole('button',{name:'Create party'}).click()
  const room=await host.getByTestId('room-code').textContent()
  expect(room).toMatch(/^[A-Z2-9]{6}$/)
  await chooseGame(host,'morris')
  await expect.poll(()=>seen(host)).toContainEqual(expect.objectContaining({phase:'party',game:'morris',cover:expect.stringContaining('seasonal-morris.svg')}))
  await guest.goto(baseURL!+'#/join?room='+room,{waitUntil:'domcontentloaded'})
  await expect(guest.getByLabel('Invite code')).toHaveValue(room!)
  await guest.getByLabel('Nickname').fill('Fern')
  await guest.getByRole('button',{name:'Join party'}).click()
  await expect(guest.getByRole('button',{name:'Ready up'})).toBeEnabled()
  await expect.poll(()=>seen(guest)).toContainEqual(expect.objectContaining({phase:'party',game:'morris'}))
  await expect(guest.getByRole('heading',{name:'Nine Men’s Morris'})).toBeVisible()
  expect(await guest.evaluate(()=>[innerWidth,document.documentElement.scrollWidth])).toEqual([390,390])
 }finally{await Promise.allSettled([h.close(),g.close()])}
})

for(const setting of ['system','saved'] as const)test('never starts a stage cue when reduced via '+setting,async({page})=>{
 await track(page)
 if(setting==='system')await page.emulateMedia({reducedMotion:'reduce'})
 else await page.addInitScript(()=>localStorage.setItem('imp-plan-feedback-v1','{"sound":false,"motion":"off"}'))
 await page.goto('./season/3/',{waitUntil:'domcontentloaded'})
 await page.getByRole('button',{name:'Practice Count the Cubes'}).click()
 await page.getByRole('button',{name:'Start match',exact:true}).click()
 await page.getByRole('button',{name:'Enter match'}).press('Enter')
 await expect(page.getByRole('button',{name:'Lock answer'})).toBeVisible()
 expect(await seen(page)).toEqual([])
})
