import {expect,test,type Page} from '@playwright/test'
import {startMatch} from './start-match'

const arena=(page:Page)=>page.getByRole('region',{name:'Wall Go territory board'})
const cell=(page:Page,coordinate:string)=>arena(page).getByRole('button',{name:new RegExp('^'+coordinate+'\\b')})
const edge=(page:Page,name:string)=>arena(page).locator('.wg-board').getByRole('button',{name,exact:true})
const choices=(page:Page)=>arena(page).locator('.wg-board').getByRole('group',{name:/Place a wall beside/})
const mode=(page:Page)=>arena(page).getByRole('status')
const walls=(page:Page)=>arena(page).locator('[data-wall-go="placed"]')

test('Wall Go commits on board edges by keyboard, touch and mouse without sharing a draft',async({browser,baseURL})=>{
 const desk=await browser.newContext({viewport:{width:1280,height:900},reducedMotion:'reduce'})
 const phone=await browser.newContext({viewport:{width:360,height:780},hasTouch:true,reducedMotion:'reduce'})
 try{
  const host=await desk.newPage(),guest=await phone.newPage()
  let guestMoves=0
  const outbound:{held?:()=>void}={}
  const relayTest=process.env.REAL_WEBRTC!=='1'
  if(relayTest)await guest.routeWebSocket(/^ws:\/\/127\.0\.0\.1:\d+\/\?id=/,ws=>{
   const hostRelay=ws.connectToServer()
   ws.onMessage(raw=>{
    const relay=JSON.parse(String(raw))
    if(relay.kind==='data'&&JSON.parse(relay.data).command?.kind==='move'&&++guestMoves===1){
     outbound.held=()=>hostRelay.send(raw)
     return
    }
    hostRelay.send(raw)
   })
  })
  await host.goto(baseURL!+'season/2/')
  const card=host.locator('article').filter({has:host.getByRole('heading',{name:'Wall Go',exact:true})})
  await expect(card.getByRole('button',{name:'Practice Wall Go'})).toBeVisible()
  await expect.poll(()=>card.locator('img').evaluate((n:HTMLImageElement)=>n.complete&&n.naturalWidth>0)).toBe(true)
  await host.getByLabel('Nickname').fill('Ada')
  await host.getByRole('button',{name:'Create party'}).click()
  const code=(await host.getByTestId('room-code').textContent())!
  await host.getByRole('combobox',{name:'Game',exact:true}).selectOption('wallGo')
  await expect(host.getByRole('combobox',{name:'Game',exact:true})).toHaveValue('wallGo')
  await host.getByRole('combobox',{name:'Seconds per turn'}).selectOption('45')
  await guest.goto(baseURL!+'#/join?room='+code)
  await guest.getByLabel('Nickname').fill('Mina')
  await guest.getByRole('button',{name:'Join party'}).click()
  await guest.getByRole('button',{name:'Details',exact:true}).click()
  const preview=guest.getByRole('dialog')
  await expect(preview.getByText('FAN RULES',{exact:false})).toBeVisible()
  await expect(preview.getByRole('img',{name:'Wall Go rule example'})).toBeVisible()
  await preview.getByRole('button',{name:'Back to lobby'}).click()
  await guest.getByRole('button',{name:'Ready up'}).click()
  await startMatch(host)

  await expect(arena(guest).getByRole('timer',{name:'Turn time remaining'})).toBeVisible()
  await expect(mode(guest)).toContainText('Ada’s turn')
  await expect(cell(guest,'A1')).toHaveAttribute('aria-disabled','true')
  await cell(host,'A1').focus()
  await host.keyboard.press('ArrowRight')
  await expect(cell(host,'B1')).toBeFocused()
  await host.keyboard.press('Enter')
  await expect(mode(host)).toContainText('Destination B1')
  await expect(choices(guest)).toHaveCount(0)
  await expect(walls(guest)).toHaveCount(0)
  await expect(arena(host).getByRole('button',{name:/confirm wall|clear preview/i})).toHaveCount(0)
  await host.keyboard.press('Tab')
  await expect(edge(host,'West edge B1 to A1')).toBeFocused()
  await host.keyboard.press('Escape')
  await expect(choices(host)).toHaveCount(0)
  await expect(cell(host,'B1')).toBeFocused()
  await host.keyboard.press('ArrowLeft')
  await host.keyboard.press('Enter')
  await expect(cell(host,'A1')).toHaveAttribute('aria-pressed','true')
  await expect(cell(host,'A1')).not.toHaveAccessibleName(/wall east to B1/i)
  await expect(cell(guest,'A1')).not.toHaveAccessibleName(/wall east to B1/i)
  await host.keyboard.press('Tab')
  await expect(edge(host,'East edge A1 to B1')).toBeFocused()
  await host.keyboard.press('Enter')
  await expect(walls(guest)).toHaveCount(1)
  await expect(cell(host,'A1')).toBeFocused()
  for(const p of [host,guest]){
   await expect(cell(p,'A1')).toHaveAccessibleName(/^A1 · Ada’s pawn · Wall east to B1$/)
   await expect(cell(p,'B1')).toHaveAccessibleName(/^B1 · Wall west to A1$/)
   await expect(cell(p,'A2')).not.toHaveAccessibleName(/wall/i)
  }

  await cell(guest,'G7').tap()
  await expect(choices(guest)).toBeVisible()
  await cell(guest,'G7').tap()
  await expect(choices(guest)).toHaveCount(0)
  await cell(guest,'F7').tap()
  await expect(choices(guest)).toHaveAccessibleName('Place a wall beside F7')
  await cell(guest,'G7').tap()
  await expect(choices(guest)).toHaveAccessibleName('Place a wall beside G7')
  await expect(choices(host)).toHaveCount(0)
  await expect(walls(host)).toHaveCount(1)
  const west=edge(guest,'West edge G7 to F7')
  await west.scrollIntoViewIfNeeded()
  const tap=await west.boundingBox()
  expect(tap).not.toBeNull()
  await west.tap()
  if(relayTest){
   // Hold the first command in transit so a real repeat tap happens pre-ack.
   await expect.poll(()=>!!outbound.held).toBe(true)
   await expect(mode(guest)).toContainText('Submitting your move')
   await expect(choices(guest)).toHaveCount(0)
   await guest.touchscreen.tap(tap!.x+tap!.width/2,tap!.y+tap!.height/2)
   expect(guestMoves).toBe(1)
   await expect(walls(host)).toHaveCount(1)
   outbound.held!()
  }
  await expect(walls(host)).toHaveCount(2)
  await expect(arena(host).getByText('Turns 2 / 40')).toBeVisible()
  if(relayTest)expect(guestMoves).toBe(1)

  await cell(host,'A1').click()
  await edge(host,'South edge A1 to A2').click()
  for(const p of [host,guest]){
   await expect(p.getByRole('heading',{name:'Mina wins'})).toBeVisible()
   await expect(mode(p)).toContainText('separated')
   await expect(arena(p).getByText('48 cells',{exact:true})).toBeVisible()
   await expect(walls(p)).toHaveCount(3)
   await expect(cell(p,'A1')).toHaveAccessibleName(/^A1 · Ada’s pawn · Ada territory · Walls east to B1, south to A2$/)
  }
  expect(await guest.evaluate(()=>document.documentElement.scrollWidth)).toBe(360)
  await host.getByRole('button',{name:'Rematch'}).click()
  await expect(mode(host)).toContainText('Mina’s turn')
  await expect(walls(host)).toHaveCount(0)
 }finally{await Promise.allSettled([desk.close(),phone.close()])}
})

for(const width of [320,390]) test('Wall Go practice at '+width+'px exposes four usable board edges and plays a hard bot reply',async({page,baseURL})=>{
 await page.setViewportSize({width,height:844})
 await page.goto(baseURL!+'season/2/')
 await page.getByRole('button',{name:'Practice Wall Go'}).click()
 await page.getByLabel('Bot difficulty').selectOption('hard')
 await startMatch(page)
 await cell(page,'B2').click()
 const edges=choices(page).getByRole('button')
 await expect(edges).toHaveCount(4)
 const info=await edges.evaluateAll(elements=>elements.map(el=>{
  const r=el.getBoundingClientRect(),board=el.closest('.wg-board')!.getBoundingClientRect()
  const center=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)
  return {w:r.width,h:r.height,onBoard:r.top>=board.top&&r.bottom<=board.bottom&&r.left>=board.left&&r.right<=board.right,hit:center===el||el.contains(center)}
 }))
 expect(info.every(p=>p.w>=24&&p.h>=24&&p.onBoard&&p.hit)).toBe(true)
 for(const position of ['B2','A2','B1','C2','B3']){
  const hit=await cell(page,position).evaluate(el=>{
   const r=el.getBoundingClientRect(),at=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)
   return at===el||el.contains(at)
  })
  expect(hit,position+' center remains unobscured').toBe(true)
 }
 await edge(page,'North edge B2 to B1').click()
 await expect(walls(page)).toHaveCount(2)
 await expect(mode(page)).toContainText('Your turn')
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(width)
})
