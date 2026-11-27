import {expect,test,type Page} from '@playwright/test'
import {startMatch} from './start-match'

const board=(p:Page)=>p.getByLabel('Blind Gomoku board',{exact:true})
const stage=(p:Page)=>p.getByRole('region',{name:'Engraved Blind Gomoku table',exact:true})
const cell=(p:Page,row:number,column:number,state='open')=>board(p).getByRole('button',{name:'Row '+row+', column '+column+', '+state,exact:true})
const overflow=(p:Page)=>p.evaluate(()=>document.documentElement.scrollWidth)
const capture=async(p:Page,key:string)=>{if(process.env.CAPTURE_BLIND_STAGE==='1')await stage(p).screenshot({path:'../Imp-Plan-Engraved-'+key+'.png',animations:'disabled'})}

test('engraved table completes a live private duel and only marks the winning line after reveal',async({browser,baseURL})=>{
 const desktop=await browser.newContext({viewport:{width:1440,height:980},reducedMotion:'reduce'})
 const mobile=await browser.newContext({viewport:{width:390,height:840},hasTouch:true,reducedMotion:'reduce'})
 try{
  const host=await desktop.newPage(),guest=await mobile.newPage()
  await host.goto(baseURL!)
  await host.getByLabel('Nickname').fill('Archivist')
  await host.getByRole('button',{name:'Create party'}).click()
  const code=(await host.getByTestId('room-code').textContent())!
  await guest.goto(baseURL!+'#/join?room='+code)
  await guest.getByLabel('Nickname').fill('Challenger')
  await guest.getByRole('button',{name:'Join party'}).click()
  await guest.getByRole('button',{name:'Ready up'}).click()
  await startMatch(host)
  await expect(stage(host).getByRole('heading',{name:'Your turn'})).toBeVisible()
  await expect(stage(guest).getByRole('heading',{name:'Archivist’s turn'})).toBeVisible()
  await expect(stage(host).getByRole('group',{name:'Stone covers'})).toBeVisible()
  const shelf=(p:Page)=>stage(p).getByLabel('Keeper’s shelf')
  expect((await shelf(host).boundingBox())!.x).toBeGreaterThan((await board(host).boundingBox())!.x)
  expect((await shelf(guest).boundingBox())!.y).toBeGreaterThan((await board(guest).boundingBox())!.y)
  await stage(host).getByRole('button',{name:'Jade cover'}).press('Enter')
  await cell(host,7,5).focus()
  await cell(host,7,5).press('ArrowRight')
  await expect(cell(host,7,6)).toBeFocused()
  await cell(host,7,6).press('Enter')
  await expect(cell(guest,7,6,'veiled')).toHaveAttribute('aria-description','Jade cover. Side hidden.')
  await expect(board(host).locator('[data-side], [data-winning]')).toHaveCount(0)
  await expect(board(guest).locator('[data-side], [data-winning]')).toHaveCount(0)
  await stage(guest).getByRole('button',{name:'Amber cover'}).tap()
  await cell(guest,8,6).tap()
  await capture(host,'live-1440')
  await capture(guest,'live-390')
  for(let column=7;column<=9;column++){
   await cell(host,7,column).press('Enter')
   await cell(guest,8,column).tap()
  }
  await cell(host,7,10).press('Enter')
  for(const p of [host,guest]){
   await expect(stage(p).getByRole('heading',{name:'Archivist wins'})).toBeVisible()
   await expect(stage(p).getByText('Five in a row',{exact:true})).toBeVisible()
   await expect(board(p).locator('[data-winning]')).toHaveCount(5)
   await expect(board(p).locator('[data-side]')).toHaveCount(9)
   await expect(cell(p,7,6,'Archivist')).toHaveAttribute('aria-description','Winning line. Side I.')
   await expect(board(p).locator('button[aria-disabled=false]')).toHaveCount(0)
   await expect(stage(p).getByRole('group',{name:'Stone covers'})).toHaveCount(0)
   expect(await stage(p).evaluate(el=>el.getAnimations({subtree:true}).filter(a=>a.playState==='running').length)).toBe(0)
  }
  expect(await overflow(guest)).toBe(390)
  expect(await overflow(host)).toBe(1440)
  await capture(host,'result-1440')
  await capture(guest,'result-390')
  if(process.env.CAPTURE_BLIND_STAGE==='1'){
   await host.setViewportSize({width:390,height:840})
   await capture(host,'result-host-390')
   await host.setViewportSize({width:1440,height:980})
   await guest.setViewportSize({width:320,height:690})
   await capture(guest,'result-320')
   await guest.setViewportSize({width:390,height:840})
  }
  await stage(host).getByRole('button',{name:'Rematch'}).click()
  await expect(stage(guest).getByRole('heading',{name:'Your turn'})).toBeVisible()
  await expect(board(guest).locator('[data-winning], [data-side]')).toHaveCount(0)
 }finally{await Promise.allSettled([desktop.close(),mobile.close()])}
})

test('the engraved compact table is full-width and coordinate placement remains usable at 320px',async({browser,baseURL})=>{
 const context=await browser.newContext({viewport:{width:320,height:690},hasTouch:true,reducedMotion:'reduce'})
 try{
  const page=await context.newPage()
  await page.goto(baseURL!)
  await page.getByLabel('Nickname').fill('Visitor')
  await page.getByRole('button',{name:'Practice Blind Gomoku',exact:true}).click()
  await startMatch(page)
  await expect(stage(page)).toBeVisible()
  const box=(await board(page).boundingBox())!
  expect(box.width).toBeGreaterThan(244)
  expect(box.height).toBeCloseTo(box.width,0)
  expect(await overflow(page)).toBe(320)
  await stage(page).getByRole('button',{name:'Pearl cover'}).tap()
  await stage(page).getByText('Place by coordinates',{exact:true}).tap()
  await stage(page).getByRole('combobox',{name:'Row',exact:true}).selectOption({label:'8'})
  await stage(page).getByRole('combobox',{name:'Column',exact:true}).selectOption({label:'8'})
  await stage(page).getByRole('button',{name:'Place stone',exact:true}).tap()
  await expect(cell(page,8,8,'veiled')).toHaveAttribute('aria-description','Pearl cover. Side hidden.')
  await capture(page,'live-320')
 }finally{await context.close()}
})
