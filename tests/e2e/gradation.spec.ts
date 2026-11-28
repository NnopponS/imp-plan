import {test,expect} from '@playwright/test'
import {chooseGame} from '../lobby-controls'
import {startMatch} from './start-match'
test('320px: enter through Season 3, distribute and swap weights, seal, watch every gate and complete the match',async({page,baseURL})=>{
 await page.setViewportSize({width:320,height:760})
 await page.emulateMedia({reducedMotion:'reduce'})
 await page.clock.install()
 await page.goto(baseURL!+'season/3/')
 await page.getByRole('button',{name:'Practice Gradation',exact:true}).click()
 await expect(page.getByLabel('Nickname')).toHaveCount(0)
 await page.getByRole('button',{name:'Start match',exact:true}).click()
 const brief=page.getByRole('dialog')
 const lesson=brief.getByRole('region',{name:'How to play'})
 await lesson.press('ArrowRight')
 await lesson.press('ArrowRight')
 await expect(brief.locator('[data-grad-lesson]')).toHaveAttribute('data-grad-lesson','2')
 await expect(brief).toContainText('Three Copper wins')
 await brief.getByRole('button',{name:'Enter match',exact:true}).click()
 const board=page.locator('[data-grad-phase]')
 await expect(board).toHaveAttribute('data-grad-phase','arrange')
 const seal=page.getByRole('button',{name:'Seal my tray',exact:true})
 await expect(seal).toBeDisabled()
 for(const n of [7,6,5,4,3,2,1])await page.getByRole('button',{name:'Place weight '+n,exact:true}).press('Enter')
 await page.getByRole('button',{name:'Gate 1, weight 7',exact:true}).press('Enter')
 await page.getByRole('button',{name:'Place weight 1',exact:true}).press('Enter')
 await expect(page.getByRole('button',{name:'Gate 7, weight 7',exact:true})).toBeAttached()
 await seal.press('Enter')
 await page.clock.runFor(1200)
 await expect(board).toHaveAttribute('data-grad-phase','reveal')
 await expect(page.locator('[data-grad-gate="0"]')).not.toContainText('Sealed')
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(320)
 for(let r=1;r<=6;r++){
  await page.clock.runFor(13000)
  if(await board.getAttribute('data-grad-phase')==='done')break
  await expect(board).toHaveAttribute('data-grad-phase','arrange')
  await page.getByRole('button',{name:'Fill in ascending order'}).click()
  await seal.click()
  await page.clock.runFor(1200)
 }
 await expect(board).toHaveAttribute('data-grad-phase','done')
 await expect(page.getByRole('button',{name:'Rematch',exact:true})).toBeVisible()
 await page.getByRole('button',{name:'Rematch',exact:true}).click()
 await expect(board).toHaveAttribute('data-grad-phase','arrange')
})
test('two isolated room peers cannot see each other’s sealed allocations or marked gates',async({browser,baseURL})=>{
 test.setTimeout(90_000)
 const ctx=await Promise.all([browser.newContext({viewport:{width:1150,height:820}}),browser.newContext({viewport:{width:390,height:780}})])
 try{
  const [host,guest]=await Promise.all(ctx.map(c=>c.newPage()))
  await host.goto(baseURL!)
  await host.getByLabel('Nickname').fill('Amber')
  await host.getByRole('button',{name:'Create party'}).click()
  const code=await host.getByTestId('room-code').innerText()
  await chooseGame(host,'gradation')
  await host.getByRole('switch',{name:'Secret double-point gate'}).click()
  await guest.goto(baseURL!+'#/join?room='+code)
  await guest.getByLabel('Nickname').fill('Reed')
  await guest.getByRole('button',{name:'Join party'}).click()
  await guest.getByRole('button',{name:'Ready up',exact:true}).click()
  await startMatch(host)
  for(const p of [host,guest]){
   await p.getByRole('button',{name:'Fill in ascending order'}).click()
   await expect(p.getByRole('button',{name:'Seal my tray',exact:true})).toBeDisabled()
   await p.getByLabel('My double-point gate').selectOption(p===host?'0':'4')
  }
  await host.getByRole('button',{name:'Seal my tray',exact:true}).click()
  await expect(host.locator('[data-grad-receipt]')).toBeVisible()
  await expect(guest.locator('[data-grad-receipt]')).toHaveCount(0)
  await expect(guest.locator('[data-grad-shown-targets]')).toHaveCount(0)
  await guest.getByRole('button',{name:'Seal my tray',exact:true}).click()
  for(const p of [host,guest]){
   await expect(p.locator('[data-grad-phase]')).toHaveAttribute('data-grad-phase','reveal')
   await expect(p.locator('[data-grad-shown-targets]')).toContainText('Copper 1 · Jade 5')
   await expect(p.locator('[data-grad-gate="0"]')).toContainText('Tie')
  }
 }finally{await Promise.allSettled(ctx.map(c=>c.close()))}
})

test('cabinet poster animates seven local engraved weights only when previews are enabled',async({page,baseURL})=>{
 await page.setViewportSize({width:390,height:780})
 await page.goto(baseURL!+'season/3/')
 const cover=page.locator('[data-preview-game="gradation"]')
 await cover.evaluate(n=>n.scrollIntoView({block:'center',behavior:'instant'}))
 const copy=cover.locator('img[data-cover-motion]')
 await expect(copy).toHaveAttribute('data-cover-ready','true')
 const cues=await copy.evaluate(async(img:HTMLImageElement)=>{
  const svg=new DOMParser().parseFromString(await(await fetch(img.src)).text(),'image/svg+xml')
  return svg.querySelectorAll('[data-cover-at][repeatCount="indefinite"]').length
 })
 expect(cues).toBe(7)
 await page.getByRole('button',{name:'Pause previews'}).click()
 await expect(copy).toHaveCount(0)
 await expect(cover.locator('img[data-arena-art]')).toHaveAttribute('src',/seasonal-gradation\.svg$/)
})
