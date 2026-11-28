import {expect,test} from '@playwright/test'

test('swipe cue waits for a cold illustration and its actual ticket motion',async({page})=>{
 await page.emulateMedia({reducedMotion:'no-preference'})
 let release!:()=>void
 const pending=new Promise<void>(resolve=>{release=resolve})
 await page.route('**/auction-bingo-ui.tsx*',async route=>{
  await pending
  await route.continue()
 })
 try{
  await page.goto('./season/3/')
  await page.locator('#practice-gallery-auctionBingo').click()
  await page.getByRole('button',{name:'Start match',exact:true}).click()
  const dialog=page.getByRole('dialog')
  await expect(dialog.getByText('Opening the lot ledger…')).toBeVisible()
  const cue=dialog.locator('.brief-cue')
  // Hold past the cue's old discovery window to reproduce a cold first visit.
  await page.waitForTimeout(780)
  await expect(cue).not.toHaveAttribute('data-ready','true',{timeout:100})
  await dialog.evaluate(el=>{
   const observations={end:0,ready:0}
   Object.assign(window,{lessonTiming:observations})
   el.addEventListener('animationend',event=>{
    if((event as AnimationEvent).animationName==='ab-ticket-in')observations.end=performance.now()
   })
   new MutationObserver(()=>{
    if(el.querySelector('.brief-cue[data-ready="true"]'))observations.ready||=performance.now()
   }).observe(el,{subtree:true,attributes:true,attributeFilter:['data-ready']})
  })
  release()
  await expect(dialog.locator('.ab-demo')).toBeVisible()
  await expect(cue).toHaveAttribute('data-ready','true')
  const timing=await page.evaluate(()=>(window as Window&{lessonTiming?:{end:number;ready:number}}).lessonTiming)
  if(!timing)throw new Error('Lesson timing observer was not installed.')
  expect(timing.end).toBeGreaterThan(0)
  expect(timing.ready).toBeGreaterThanOrEqual(timing.end)
 }finally{release()}
})

test('reduced-motion readers get a static cue only when a lazy route diagram is available',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'})
 let release!:()=>void
 const pending=new Promise<void>(resolve=>{release=resolve})
 await page.route('**/color-link-ui.tsx*',async route=>{
  await pending
  await route.continue()
 })
 try{
  await page.goto('./season/3/')
  await page.locator('#practice-gallery-colorLink').click()
  await page.getByRole('button',{name:'Start match',exact:true}).click()
  const dialog=page.getByRole('dialog')
  await expect(dialog.getByText('Preparing route example…')).toBeVisible()
  const cue=dialog.locator('.brief-cue')
  await expect(cue).not.toHaveAttribute('data-ready','true')
  release()
  await expect(dialog.locator('.brief-scene-object svg').first()).toBeVisible()
  await expect(cue).toHaveAttribute('data-ready','true')
  await expect(cue).toHaveCSS('animation-name','none')
 }finally{release()}
})
