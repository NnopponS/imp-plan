import {expect,test,type Page} from '@playwright/test'
import {startMatch} from './start-match'
import {chooseGame,chooseSetting,settingChoice} from '../lobby-controls'

const board=(page:Page)=>page.getByRole('region',{name:'Color Link board'})
const cell=(page:Page,name:string)=>board(page).getByRole('button',{name:new RegExp('^'+name+'\\b')})
const control=(page:Page,name:string)=>board(page).getByRole('button',{name,exact:true})
const routes=(page:Page)=>board(page).getByRole('radiogroup',{name:'Choose a route'})
const radio=(page:Page,letter:string)=>routes(page).getByRole('radio',{name:new RegExp('^Route '+letter+'\\b')})

test('Color Link private duel hides drafts, races on six pairs and completes a rematch-ready series',async({browser,baseURL})=>{
 const desktop=await browser.newContext(),phone=await browser.newContext({hasTouch:true,viewport:{width:320,height:780}})
 try{
  const host=await desktop.newPage(),guest=await phone.newPage()
  await host.goto(baseURL!+'season/3/',{waitUntil:'domcontentloaded'})
  const card=host.getByRole('article').filter({has:host.getByRole('heading',{name:'Color Link',exact:true})})
  await expect(card.getByRole('button',{name:'Practice Color Link'})).toBeVisible()
  const poster=card.locator('img[data-arena-art]')
  await poster.scrollIntoViewIfNeeded()
  await expect.poll(()=>poster.evaluate((img:HTMLImageElement)=>img.complete&&img.naturalWidth>0)).toBe(true)
  await host.getByLabel('Nickname').fill('Ada')
  await host.getByRole('button',{name:'Create party'}).click()
  const code=(await host.getByTestId('room-code').textContent())!
  await chooseGame(host,'colorLink')
  await expect(host.getByRole('button',{name:'Increase seat limit'})).toBeDisabled()
  await expect(host.getByRole('group',{name:'Table format'})).toHaveCount(0)
  await expect(settingChoice(host,'Seconds to place or respond','45')).toBeChecked()
  await chooseSetting(host,'Seconds to place or respond','60')
  await guest.goto(baseURL!+'#/join?room='+code,{waitUntil:'domcontentloaded'})
  await guest.getByLabel('Nickname').fill('Mina')
  await guest.getByRole('button',{name:'Join party'}).click()
  await expect(guest.getByRole('button',{name:'Ready up'})).toBeVisible({timeout:19_000}).catch(async error=>{
   const reason=await guest.getByRole('alert').first().textContent({timeout:250}).catch(()=>null)
   if(reason)throw new Error('Guest did not reach the lobby: '+reason,{cause:error})
   throw error
  })
  await expect(guest.getByRole('region',{name:'Current table'}).locator('.party-game-meta')).toHaveText('Spatial feasibility · 2 players')
  await guest.getByRole('button',{name:'Details',exact:true}).click()
  await expect(guest.getByRole('dialog').getByRole('img',{name:'Color Link rule example'})).toBeVisible()
  await guest.getByRole('button',{name:'Back to lobby'}).click()
  await guest.getByRole('button',{name:'Ready up'}).click()
  await startMatch(host)
  await expect(board(guest).getByRole('timer')).toBeVisible()
  expect(await cell(guest,'A1').evaluate(e=>getComputedStyle(e).backgroundColor)).toBe('rgba(0, 0, 0, 0)')
  expect((await cell(guest,'A1').boundingBox())!.width).toBeGreaterThanOrEqual(44)
  await cell(host,'A1').focus()
  await host.keyboard.press('Enter')
  await host.keyboard.press('ArrowRight')
  await expect(cell(host,'B1')).toBeFocused()
  await host.keyboard.press('Enter')
  await expect(cell(guest,'A1')).toHaveAccessibleName('A1 · Open')
  await control(host,'Place pair A').press('Enter')
  await expect(cell(guest,'A1')).toHaveAccessibleName('A1 · Pair A endpoint')
  await control(guest,'Accept').tap()
  for(let row=2;row<=6;row++){
   const placer=row%2===0?guest:host
   const reviewer=row%2===0?host:guest
   await expect(cell(placer,'A'+row)).toHaveAttribute('aria-disabled','false')
   await cell(placer,'A'+row).click()
   await cell(placer,'B'+row).click()
   await control(placer,'Place pair '+'ABCDEF'[row-1]).click()
   await control(reviewer,'Accept').click()
  }
  await expect(board(guest)).toHaveAttribute('data-phase','race')
  await expect(board(host)).toHaveAttribute('data-phase','race')
  await cell(host,'A1').click()
  await cell(host,'A2').click() // another terminal cannot be used to extend A
  await expect(cell(host,'A2')).toHaveAccessibleName('A2 · Pair B endpoint')
  await expect(routes(guest).getByRole('radio')).toHaveCount(6)
  expect(await radio(guest,'A').evaluate((el:HTMLButtonElement)=>el.tabIndex)).toBe(0)
  expect((await radio(guest,'A').boundingBox())!.width).toBeGreaterThanOrEqual(44)
  await radio(guest,'F').tap()
  await expect(radio(guest,'F')).toBeChecked()
  await radio(host,'B').press('ArrowLeft')
  await expect(radio(host,'A')).toBeChecked()
  await expect(radio(host,'A')).toBeFocused()
  await expect(radio(host,'A').locator('svg[data-link-route-glyph]')).toBeVisible()
  await cell(host,'B1').click()
  await expect(cell(guest,'B1')).toHaveAccessibleName('B1 · Pair A endpoint')
  await expect(board(host).locator('[data-link-trace]')).toHaveCount(1)
  await expect(board(guest).locator('[data-link-trace]')).toHaveCount(0)
  for(let row=2;row<=6;row++){
   await cell(host,'A'+row).click();await cell(host,'B'+row).click()
  }
  await control(host,'Submit proof').click()
  await expect(board(guest).getByRole('status')).toContainText('Ada submitted all six routes')
  await expect(board(guest).locator('[data-link-trace]')).toHaveCount(6)
  await expect(board(guest)).toHaveAttribute('data-round','2')
  await cell(guest,'A1').tap();await cell(guest,'B1').tap()
  await control(guest,'Place pair A').tap()
  await control(host,'Accept').click()
  await cell(host,'A2').click();await cell(host,'B2').click()
  await control(host,'Place pair B').click()
  await control(guest,'Challenge').tap()
  for(const p of [host,guest]){
   await expect(p.getByRole('heading',{name:'Ada wins'})).toBeVisible()
   await expect(board(p).getByRole('status')).toContainText('Ada wins the challenge')
   await expect(board(p).locator('[data-link-trace]')).toHaveCount(2)
  }
  expect(await guest.evaluate(()=>document.documentElement.scrollWidth)).toBe(320)
  await host.getByRole('button',{name:'Rematch'}).click()
  await expect(board(guest).getByRole('status')).toContainText('Your turn')
 }finally{await Promise.allSettled([desktop.close(),phone.close()])}
})

test('Color Link season practice works on mobile without a room',async({page,baseURL})=>{
 await page.setViewportSize({width:390,height:844})
 await page.goto(baseURL!+'season/3/',{waitUntil:'domcontentloaded'})
 await page.getByRole('button',{name:'Practice Color Link'}).click()
 await chooseSetting(page,'Bot difficulty','hard')
 await startMatch(page)
 await expect(board(page).getByText('Bot 1',{exact:true})).toBeVisible()
 await cell(page,'A1').click();await cell(page,'B1').click()
 await control(page,'Place pair A').click()
 await expect(board(page).getByRole('status')).toContainText('Your call')
 await expect(board(page).locator('[data-link-terminal="B"]')).toHaveCount(2)
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(390)
})

test('static shells index Color Link and the actual playable counts without client JavaScript',async({request})=>{
 for(const [route,count] of [['./','30 of 64'],['./season/3/','14 of 29']]){
  const response=await request.get(route)
  expect(response.ok()).toBe(true)
  const markup=await response.text()
  expect(markup).toContain('<li>Color Link</li>')
  expect(markup).toContain(count+' indexed challenges are playable.')
 }
})

test('Color Link loops its own painted traces, shows its final venue, and keeps rules behind Details',async({page,baseURL})=>{
 await page.setViewportSize({width:390,height:420})
 await page.goto(baseURL!+'season/3/',{waitUntil:'domcontentloaded'})
 const cover=page.locator('[data-preview-game="colorLink"]')
 const card=page.getByRole('article').filter({has:page.getByRole('heading',{name:'Color Link',exact:true})})
 await expect(card.locator('[data-venue=final]')).toHaveText('Final Match')
 await cover.evaluate(node=>node.scrollIntoView({block:'center',behavior:'instant'}))
 const copy=cover.locator('img[data-cover-motion]')
 await expect(copy).toHaveAttribute('data-cover-ready','true')
 await expect(copy).toHaveAttribute('data-cover-original',/color-link-board\.svg$/)
 const cue=await copy.evaluate(async (el:HTMLImageElement)=>{
  const doc=new DOMParser().parseFromString(await (await fetch(el.src)).text(),'image/svg+xml')
  return Array.from(doc.querySelectorAll('[data-cover-at]')).map(n=>[n.parentElement!.localName,n.getAttribute('attributeName'),n.getAttribute('begin')])
 })
 expect(cue).toEqual([
  ...Array(3).fill(['polyline','stroke-dashoffset','0.12s']),
  ...Array(3).fill(['polyline','stroke-dashoffset','0.37s']),
 ])
 await expect(page.locator('[data-game-preview="colorLink"]')).toHaveCount(0)
 await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}))
 await expect(copy).toHaveCount(0)
 await cover.evaluate(node=>node.scrollIntoView({block:'center',behavior:'instant'}))
 await expect(copy).toHaveAttribute('data-cover-ready','true')
 await card.getByRole('button',{name:'Details for Color Link'}).click()
 const details=page.getByRole('dialog',{name:'Color Link'})
 await expect(details.locator('[data-game-preview="colorLink"]')).toBeVisible()
 await expect(details.getByText('Season 3 · Final game 2')).toBeVisible()
})
