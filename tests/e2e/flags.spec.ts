import {expect,test,type Page} from '@playwright/test'
import {startMatch} from './start-match'
import {chooseGame,tableRadio} from '../lobby-controls'

const board=(p:Page)=>p.locator('[data-fa-phase]')
const study=(p:Page)=>p.locator('[data-fa-study] img')
const option=(p:Page,i:number)=>p.locator('[data-fa-option="'+i+'"]')
const seal=(p:Page)=>p.getByRole('button',{name:'Seal answer',exact:true})

// Large jumps on an advancing Playwright clock can race an in-flight real-time
// tick and send the mock monotonic clock backward. The real match clock cannot
// do this. Wait for the real UI and transport startup, then pause before
// advancing the long study window.
async function endStudy(...pages:Page[]){
 await Promise.all(pages.map(async p=>p.clock.pauseAt(await p.evaluate(()=>Date.now()+500))))
 // Interleave host and guest heartbeats rather than jumping past their deadlines.
 for(let i=0;i<9;i++)await Promise.all(pages.map(p=>p.clock.runFor(4500)))
 for(const p of pages){
  await expect(board(p)).toHaveAttribute('data-fa-phase','answer')
  await expect(board(p).getByRole('timer')).toHaveAccessibleName(/^(?:[1-5]\d|60) seconds remaining$/)
 }
}

test('320px practice studies named flags, then keyboard seals a correct recall and can focus the board',async({browser,baseURL})=>{
 const ctx=await browser.newContext({viewport:{width:320,height:760},isMobile:true,hasTouch:true,reducedMotion:'reduce'})
 try{
  const page=await ctx.newPage()
  await page.clock.install()
  await page.goto(baseURL!+'season/3/')
  await page.getByRole('button',{name:'Practice Flags Around the World',exact:true}).tap()
  await expect(page.getByRole('textbox',{name:'Nickname'})).toHaveCount(0)
  await page.getByRole('button',{name:'Start match',exact:true}).tap()
  const briefing=page.getByRole('dialog')
  await briefing.getByRole('button',{name:/^Go to lesson page 3:/}).tap()
  await expect(briefing.locator('[data-fa-example="2"]')).toContainText('match each name')
  await briefing.getByRole('button',{name:'Enter match',exact:true}).tap()
  await expect(board(page)).toHaveAttribute('data-fa-phase','study')
  await expect(study(page)).toHaveCount(12)
  const studied=await study(page).evaluateAll(imgs=>imgs.map(i=>i.getAttribute('src')))
  expect(new Set(studied).size).toBe(12)
  const symbols=page.getByRole('button',{name:'Use symbols only',exact:true})
  await symbols.tap()
  await expect(study(page)).toHaveCount(0)
  await expect(page.locator('[data-fa-study]')).toHaveCount(12)
  await symbols.tap()
  await expect(study(page)).toHaveCount(12)
  await endStudy(page)
  await expect(page.locator('[data-fa-option]')).toHaveCount(20)
  await expect(study(page)).toHaveCount(0)
  const choices=await page.locator('[data-fa-option] img').evaluateAll(imgs=>imgs.map(i=>i.getAttribute('src')))
  const i=choices.findIndex(src=>studied.includes(src))
  expect(i).toBeGreaterThanOrEqual(0)
  expect(choices.every(src=>/\/art\/flags\/f\d{2}\.svg$/.test(src??''))).toBe(true)
  await page.getByRole('button',{name:'Board focus',exact:true}).tap()
  await option(page,i).press('Enter')
  await page.getByRole('button',{name:'Exit focus',exact:true}).tap()
  await expect(option(page,i)).toHaveAttribute('aria-pressed','true')
  await seal(page).press('Enter')
  await expect(page.getByRole('alert')).toHaveCount(0)
  await expect(board(page)).toHaveAttribute('data-fa-phase','done')
  await expect(board(page)).toContainText('1 point')
  await expect(page.locator('[data-correct="true"]')).toHaveCount(12)
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(320)
 }finally{await ctx.close()}
})

test('room peers receive the same named archive and private lock receipts before results',async({browser,baseURL})=>{
 const contexts=await Promise.all([browser.newContext({viewport:{width:1280,height:760},reducedMotion:'reduce'}),browser.newContext({viewport:{width:390,height:800},hasTouch:true,isMobile:true,reducedMotion:'reduce'})])
 try{
  const [host,guest]=await Promise.all(contexts.map(c=>c.newPage()))
  await Promise.all([host.clock.install(),guest.clock.install()])
  await host.goto(baseURL!)
  await host.getByLabel('Nickname').fill('Archive host')
  await host.getByRole('button',{name:'Create party'}).click()
  const code=(await host.getByTestId('room-code').textContent())!
  await chooseGame(host,'flags')
  await tableRadio(host,'Flag challenge','Match flags to names').click()
  await expect(tableRadio(host,'Flag challenge','Match flags to names')).toBeChecked()
  await guest.goto(baseURL!+'#/join?room='+code)
  await guest.getByLabel('Nickname').fill('Archive reader')
  await guest.getByRole('button',{name:'Join party'}).tap()
  await guest.getByRole('button',{name:'Ready up',exact:true}).tap()
  await startMatch(host)
  for(const page of [host,guest])await expect(study(page)).toHaveCount(12)
  const images=(p:Page)=>study(p).evaluateAll(imgs=>imgs.map(i=>i.getAttribute('src')))
  expect(await images(host)).toEqual(await images(guest))
  await endStudy(host,guest)
  for(const page of [host,guest]){
   await expect(page.locator('[data-fa-name]')).toHaveCount(12)
   await expect(page.locator('[data-correct="true"]')).toHaveCount(0)
  }
  await host.locator('[data-fa-name="0"]').click()
  await option(host,0).click()
  await seal(host).click()
  await expect(host.locator('h3').filter({hasText:/^Answer sealed$/})).toBeVisible()
  await expect(guest.locator('h3').filter({hasText:/^Answer sealed$/})).toHaveCount(0)
  await guest.locator('[data-fa-name="0"]').tap()
  await option(guest,1).tap()
  await seal(guest).tap()
  for(const page of [host,guest]){
   await expect(board(page)).toHaveAttribute('data-fa-phase','done')
   await expect(page.locator('[data-correct="true"]')).toHaveCount(12)
  }
  expect(await guest.evaluate(()=>document.documentElement.scrollWidth)).toBe(390)
 }finally{await Promise.all(contexts.map(c=>c.close()))}
})

test('Flags cover animates original drawn objects; reduced motion preserves poster',async({page,baseURL})=>{
 await page.setViewportSize({width:390,height:780})
 await page.goto(baseURL!+'season/3/')
 const cover=page.locator('[data-preview-game="flags"]')
 await cover.evaluate(node=>node.scrollIntoView({block:'center',behavior:'instant'}))
 const moving=cover.locator('img[data-cover-motion]')
 await expect(moving).toHaveAttribute('data-cover-ready','true')
 await expect(moving).toHaveAttribute('data-cover-original',/season-three-flags\.svg$/)
 const cues=await moving.evaluate(async (image:HTMLImageElement)=>{
  const svg=new DOMParser().parseFromString(await(await fetch(image.src)).text(),'image/svg+xml')
  return [...svg.querySelectorAll('[data-cover-at]')].filter(n=>n.getAttribute('repeatCount')==='indefinite').map(n=>n.getAttribute('type')??n.getAttribute('attributeName'))
 })
 expect(cues).toHaveLength(7)
 expect(cues).toContain('rotate')
 await page.getByRole('button',{name:'Pause previews'}).click()
 await expect(moving).toHaveCount(0)
 await expect(cover.locator('img[data-arena-art]')).toBeAttached()
})
