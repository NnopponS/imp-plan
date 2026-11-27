import {expect,test,type Locator,type Page} from '@playwright/test'

const cover=(page:Page,game:string)=>page.locator(`[data-preview-game="${game}"]`)
const moving=(page:Page,game:string)=>cover(page,game).locator('img[data-cover-motion]')
const meet=(page:Page,game:string)=>cover(page,game).evaluate(node=>node.scrollIntoView({block:'center',behavior:'instant'}))
const gamePreview=(page:Page)=>page.locator('[data-game-preview],.arena-preview-scene:not(.arena-preview-still)')
async function motions(copy:Locator){
 return copy.evaluate(async image=>{
  const text=await (await fetch((image as HTMLImageElement).src)).text()
  const svg=new DOMParser().parseFromString(text,'image/svg+xml')
  return Array.from(svg.querySelectorAll('[data-cover-at]')).map(element=>[
   element.localName,element.getAttribute('attributeName'),element.getAttribute('type'),element.getAttribute('begin'),element.getAttribute('values'),
  ])
 })
}

test('the painting itself loops; rules remain behind Details',async({page})=>{
 await page.setViewportSize({width:911,height:660})
 await page.goto('./')
 await expect(page.locator('.featured .card')).toHaveCount(31)
 await expect(page.locator('[data-preview-game]')).toHaveCount(31)
 await expect(page.locator('.arena-preview [data-character-cue]')).toHaveCount(0)
 const poster=cover(page,'blind').locator('img[data-arena-art]')
 await expect(poster).toBeAttached()
 await meet(page,'blind')
 const copy=moving(page,'blind')
 await expect(copy).toHaveAttribute('data-cover-ready','true')
 const original=await poster.evaluate(node=>(node as HTMLImageElement).currentSrc)
 await expect(copy).toHaveAttribute('data-cover-original',original)
 expect(await motions(copy)).not.toHaveLength(0)
 await expect(gamePreview(page)).toHaveCount(0)
 await expect(page.getByRole('button',{name:'Practice Blind Gomoku',exact:true})).toBeVisible()
 const token=await copy.getAttribute('src')
 const rules=await copy.evaluate(async image=>{
  const svg=new DOMParser().parseFromString(await(await fetch((image as HTMLImageElement).src)).text(),'image/svg+xml')
  return Array.from(svg.querySelectorAll('[data-cover-at]')).map(cue=>[cue.getAttribute('dur'),cue.getAttribute('repeatCount')])
 })
 expect(rules.length).toBeGreaterThan(0)
 expect(rules.every(([duration,repeat])=>duration==='2.2s'&&repeat==='indefinite')).toBe(true)
 // Inspect rendered art after the previous one-shot would have stopped. A
 // stable blob plus different pixels proves native repeat, not image refresh.
 await page.waitForTimeout(2400)
 const frame=await copy.screenshot()
 await expect.poll(async()=>!(await copy.screenshot()).equals(frame),{timeout:2800,intervals:[170,235,310]}).toBe(true)
 await expect(copy).toHaveAttribute('src',token!)
 await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}))
 await expect(cover(page,'blind')).not.toBeInViewport()
 await expect(copy).toHaveCount(0)
 await meet(page,'blind')
 await expect(copy).toHaveAttribute('data-cover-ready','true')
})

test('two covers move different original subjects, respect the mobile artwork and cancel offscreen',async({page})=>{
 await page.setViewportSize({width:390,height:340})
 await page.goto('./season/3/')
 await meet(page,'memoryPoker')
 await expect(moving(page,'memoryPoker')).toHaveAttribute('data-cover-ready','true')
 const cardCues=await motions(moving(page,'memoryPoker'))
 await expect(cover(page,'heavy13')).not.toBeInViewport({ratio:.5})
 await meet(page,'heavy13')
 await expect(moving(page,'memoryPoker')).toHaveCount(0)
 const cube=moving(page,'heavy13')
 await expect(cube).toHaveAttribute('data-cover-ready','true')
 await expect(cube).toHaveAttribute('data-cover-original',/heavy13-chamber-mobile\.svg$/)
 const cubeCues=await motions(cube)
 expect(cardCues.length).toBeGreaterThan(0)
 expect(cubeCues.length).toBeGreaterThan(0)
 expect(cubeCues).not.toEqual(cardCues)
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
  await expect(page.locator('.arena-preview [data-cover-motion]')).toHaveCount(0)
  await expect(gamePreview(page)).toHaveCount(0)
 })
}

test('all 31 original covers and the three mobile crops have dormant authored motion',async({page})=>{
 await page.goto('./')
 const coverSources=await page.locator('.featured .arena-preview').evaluateAll(covers=>covers.flatMap(card=>
  Array.from(card.querySelectorAll('img[data-arena-art],picture>source')).map(asset=>asset.getAttribute('src')||asset.getAttribute('srcset')!)
 ))
 expect(new Set(coverSources).size).toBe(34)
 await page.evaluate(async sources=>{
  const signatures=new Set<string>()
  for(const src of sources){
   const response=await fetch(src)
   if(!response.ok)throw new Error('Original painting not found: '+src)
   const svg=new DOMParser().parseFromString(await response.text(),'image/svg+xml')
   const cues=Array.from(svg.querySelectorAll('[data-cover-at]'))
   if(cues.length===0||cues.some(cue=>cue.getAttribute('begin')!=='indefinite'||cue.getAttribute('fill')!=='remove'))throw new Error('Missing or already-running motion: '+src)
   const signature=cues.map(cue=>['animateMotion','animateTransform'].includes(cue.localName)?
    [cue.localName,cue.getAttribute('type'),cue.getAttribute('values'),cue.getAttribute('path')].join(':'):
    [cue.getAttribute('attributeName'),cue.getAttribute('values')].join(':')).join('/')
   if(!src.endsWith('-mobile.svg'))signatures.add(signature)
  }
  if(signatures.size<30)throw new Error('Some paintings share too many cues: '+signatures.size)
 },coverSources)
})

test('gallery gives a mobile visitor a persistent way to pause looping covers',async({page})=>{
 await page.setViewportSize({width:390,height:844})
 await page.goto('./#play')
 const art=page.locator('[data-preview-game="blind"]')
 await art.scrollIntoViewIfNeeded()
 await expect(art).toHaveAttribute('data-preview-state','playing')
 await page.getByRole('button',{name:'Pause previews',exact:true}).click()
 await expect(art).toHaveAttribute('data-preview-state','idle')
 await page.reload()
 await expect(page.getByRole('button',{name:'Play previews',exact:true})).toBeVisible()
 await expect(art).toHaveAttribute('data-preview-state','idle')
 await page.getByRole('button',{name:'Play previews',exact:true}).click()
 await art.scrollIntoViewIfNeeded()
 await expect(art).toHaveAttribute('data-preview-state','playing')
})
