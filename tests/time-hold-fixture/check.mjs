import assert from 'node:assert/strict'
import {mkdir} from 'node:fs/promises'
import {resolve} from 'node:path'
import {chromium} from '@playwright/test'

const origin=process.env.TIME_HOLD_FIXTURE_URL||'http://127.0.0.1:4189/imp-plan/tests/time-hold-fixture/'
const screenshots=resolve(process.env.TIME_HOLD_SCREENSHOTS||'test-results/time-hold')
await mkdir(screenshots,{recursive:true})
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage']})
const go=async(page)=>{await page.goto(origin);await page.getByRole('heading',{name:'Round 01 / 19'}).waitFor()}
const actions=page=>page.evaluate(()=>window.timeHoldTestActions)
const assertUnpressed=async(page,kind='release')=>{
 await page.waitForFunction(()=>!document.querySelector('.time-hold-plunger')?.hasAttribute('data-held'))
 assert.equal((await actions(page)).filter(a=>a.kind===kind).length,1)
}
try{
 for(const [width,height] of [[320,680],[390,844],[768,1024],[1440,900]]){
  const page=await browser.newPage({viewport:{width,height}})
  let pageError
  page.on('pageerror', e=>{pageError=e})
  await go(page)
  const button=page.getByRole('button',{name:'Hold to bid'})
  const dimensions=await page.evaluate(()=>({
   scroll:document.documentElement.scrollWidth,viewport:innerWidth,
   control:document.querySelector('.time-hold-plunger').getBoundingClientRect().bottom
  }))
  assert.equal(dimensions.scroll,dimensions.viewport, `${width}px horizontal overflow`)
  assert.ok(dimensions.control<height, `${width}px primary control below first fold`)
  assert.ok(await button.isEnabled())
  await page.screenshot({path:resolve(screenshots,`arming-${width}.png`),fullPage:true})
  assert.equal(pageError,undefined)
  await page.close()
 }
 const keyboard=await browser.newPage({viewport:{width:1440,height:900},reducedMotion:'reduce'})
 await go(keyboard)
 const button=keyboard.getByRole('button',{name:'Hold to bid'})
 assert.equal(await keyboard.locator('.time-hold-dial-pointer').evaluate(el=>getComputedStyle(el).display),'none')
 assert.equal(await button.evaluate(el=>getComputedStyle(el).transitionDuration),'0s')
 await keyboard.keyboard.press('Tab')
 assert.equal(await button.evaluate(el=>document.activeElement===el),true)
 await keyboard.keyboard.down('Space')
 await keyboard.keyboard.down('Space')
 await keyboard.waitForFunction(()=>document.querySelector('.time-hold-reserve'))
 await keyboard.waitForFunction(()=>document.querySelector('.time-hold-grace')?.textContent.includes('using its time bank'))
 await keyboard.keyboard.up('Space')
 await keyboard.getByRole('status').filter({hasText:'won the token'}).waitFor()
 assert.equal((await actions(keyboard)).filter(a=>a.kind==='hold').length,1)
 await assertUnpressed(keyboard)
 assert.equal(await keyboard.locator('.time-hold-reserve').count(),0)
 await keyboard.screenshot({path:resolve(screenshots,'result-1440.png'),fullPage:true})

 await keyboard.getByRole('button',{name:'Restart fixture'}).click()
 await button.focus()
 await keyboard.keyboard.down('Space')
 await keyboard.keyboard.press('Tab') // focus loss cancels without waiting for keyup
 await keyboard.keyboard.up('Space')
 await assertUnpressed(keyboard,'cancel')
 await keyboard.getByRole('button',{name:'Toggle spectator'}).click()
 assert.equal(await button.count(),0)
 assert.equal(await keyboard.locator('.time-hold-reserve').count(),0)
 await keyboard.getByRole('status').filter({hasText:'Spectating'}).waitFor()
 await keyboard.close()

 const mobile=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true})
 await go(mobile)
 const control=mobile.getByRole('button',{name:'Hold to bid'})
 const cd=await mobile.context().newCDPSession(mobile)
 async function startTouch(){
  const {x,y,width,height}=await control.boundingBox()
  await cd.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:x+width/2,y:y+height/2}]})
 }
 await startTouch()
 await mobile.locator('.time-hold-reserve').waitFor()
 await mobile.screenshot({path:resolve(screenshots,'held-390.png'),fullPage:true})
 await cd.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]})
 await assertUnpressed(mobile)
 await mobile.getByRole('button',{name:'Restart fixture'}).tap()
 await startTouch()
 await cd.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]})
 await assertUnpressed(mobile,'cancel')

 await mobile.getByRole('button',{name:'Restart fixture'}).tap()
 await startTouch()
 await mobile.evaluate(()=>{
  // Deterministically simulate tab backgrounding without depending on Chromium's focus policy.
  Object.defineProperty(document,'visibilityState',{configurable:true,value:'hidden'})
  document.dispatchEvent(new Event('visibilitychange'))
 })
 await assertUnpressed(mobile,'cancel')
 await cd.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]})
 assert.equal((await actions(mobile)).filter(a=>a.kind==='cancel').length,1)
 await mobile.close()
 console.log('Verified real Chromium: 320/390/768/1440 widths, keyboard hold + release and blur, touch hold + cancel, visibility cancellation, own reserve and result, spectator privacy, reduced motion.')
}finally{await browser.close()}
