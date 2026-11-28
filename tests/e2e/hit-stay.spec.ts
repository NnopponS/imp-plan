import {chromium,expect,test,type Page} from '@playwright/test'
import {createSocket} from 'node:dgram'
import {once} from 'node:events'
import {chooseGame} from '../lobby-controls'
import {startMatch} from './start-match'

const board=(p:Page)=>p.getByRole('region',{name:'Hit, Stay table',exact:true})
const playing=(p:Page)=>board(p).getByRole('button',{name:'Stay',exact:true})
const canStay=(p:Page)=>p.locator('.room:not([inert]) .hit-controls button:last-child:not(:disabled)').count().then(n=>n===1)
const next=(p:Page)=>board(p).getByRole('button',{name:'Deal next hand',exact:true})
const gamePage='season/3/'
const own=(p:Page)=>board(p).getByRole('group',{name:'Your private hand',exact:true})
const revealed=(p:Page)=>board(p).getByRole('region',{name:'Revealed hands',exact:true})

test('mobile preview and guide share original cards with play; touch and keys do not start the clock',async({browser,baseURL},info)=>{
 const context=await browser.newContext({viewport:{width:320,height:680},hasTouch:true,isMobile:true,reducedMotion:'reduce'})
 try{
  const page=await context.newPage()
  await page.goto(baseURL!+gamePage)
  const card=page.getByRole('article').filter({has:page.getByRole('heading',{name:'Hit, Stay',exact:true})})
  const cover=card.locator('img[data-arena-art]')
  await cover.scrollIntoViewIfNeeded()
  await expect(cover).toHaveAttribute('src',/seasonal-hitStay\.svg$/)
  await expect.poll(()=>cover.evaluate((img:HTMLImageElement)=>img.complete&&img.naturalWidth>0)).toBe(true)
  await card.getByRole('button',{name:'Open Hit, Stay',exact:true}).tap()
  const dialog=page.getByRole('dialog',{name:'Hit, Stay'})
  const sample=dialog.locator('[data-real-table-preview] [data-hit-card]').first()
  await expect(sample).toBeVisible({timeout:12_000})
  await expect.poll(()=>sample.evaluate(el=>el.closest('[inert]')!==null)).toBe(true)
  await dialog.screenshot({path:info.outputPath('hit-stay-preview.png')})
  await dialog.getByRole('button',{name:'Practice Hit, Stay',exact:true}).tap()
  await page.getByRole('button',{name:'Start match',exact:true}).tap()
  const lesson=page.getByRole('region',{name:'How to play'})
  await expect(lesson).toHaveAttribute('data-lesson-kind','worked-example')
  await expect(page.locator('dialog[data-brief-game]')).toHaveAttribute('data-motion-off','true')
  await expect(lesson.locator('[data-hit-example="0"] [data-hit-card]')).toHaveCount(2)
  const area=(await lesson.locator('.brief-page').boundingBox())!
  const finger=await context.newCDPSession(page)
  const x=area.x+area.width*.25,y=area.y+24
  await finger.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]})
  await finger.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+80,y}]})
  await finger.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]})
  await finger.detach()
  await expect(lesson.locator('[data-hit-example="1"]')).toBeVisible()
  await lesson.press('ArrowRight')
  await expect(lesson.locator('[data-hit-example="2"]')).toBeVisible()
  await lesson.press('End')
  await expect(lesson.locator('[data-hit-example="3"]')).toBeVisible()
  await expect(lesson.getByRole('button',{name:/^(Back|Next)$/})).toHaveCount(0)
  await expect(page.getByRole('timer')).toHaveCount(0)
  await expect(page.getByText('Timers start only after you enter.')).toBeVisible()
  await page.screenshot({path:info.outputPath('hit-stay-guide.png')})
  await page.getByRole('dialog').getByRole('button',{name:'Enter match',exact:true}).tap()
  await expect(own(page).locator('[data-hit-card]')).toHaveCount(2)
  await expect(board(page).getByRole('timer')).toBeVisible()
  await expect(revealed(page)).toHaveCount(0)
  await expect(playing(page)).toBeEnabled()
  expect((await playing(page).boundingBox())!.height).toBeGreaterThanOrEqual(44)
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(320)
  await page.screenshot({path:info.outputPath('hit-stay-live.png')})
 }finally{await context.close()}
})

test('touch practice against a bot finishes eight legally played hands',async({browser,baseURL},info)=>{
 test.setTimeout(80000)
 const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true,reducedMotion:'reduce'})
 try{
  const page=await context.newPage()
  await page.goto(baseURL!+gamePage)
  await page.getByRole('button',{name:'Practice Hit, Stay',exact:true}).tap()
  await startMatch(page)
  await expect(board(page).getByText('Bot 1',{exact:true})).toBeVisible()
  for(let i=1;i<=8;i++){
   await expect(board(page)).toHaveAttribute('data-hit-round',String(i))
   if(i===1)await board(page).getByRole('button',{name:'Hit',exact:true}).tap()
   await expect.poll(async()=>await canStay(page)||await revealed(page).isVisible(),{timeout:15_000}).toBe(true)
   if(await canStay(page))await playing(page).tap()
   await expect(revealed(page)).toBeVisible()
   if(i<8)await next(page).tap()
  }
  await expect(board(page)).toHaveAttribute('data-hit-phase','finished')
  await expect(page.getByRole('region',{name:'Match record'})).toBeVisible()
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(390)
  await page.screenshot({path:info.outputPath('hit-stay-results.png'),fullPage:true})
 }finally{await context.close()}
})

async function localStun(){
 const server=createSocket('udp4'),magic=0x2112a442
 server.on('message',(data,peer)=>{
  if(peer.address!=='127.0.0.1'||data.length<20||data.readUInt16BE(0)!==1||data.readUInt32BE(4)!==magic||data.readUInt16BE(2)!==data.length-20)return
  const reply=Buffer.alloc(32)
  reply.writeUInt16BE(0x0101,0);reply.writeUInt16BE(12,2);data.copy(reply,4,4,20)
  reply.writeUInt16BE(0x0020,20);reply.writeUInt16BE(8,22);reply[25]=1
  reply.writeUInt16BE(peer.port^(magic>>>16),26)
  ;[127,0,0,1].forEach((part,i)=>reply[28+i]=part^reply[4+i])
  server.send(reply,peer.port,peer.address)
 })
 const listening=once(server,'listening');server.bind(0,'127.0.0.1');await listening
 return {url:'stun:127.0.0.1:'+server.address().port,close:()=>server.close()}
}
async function stunOption(page:Page,url:string){
 await page.getByText('Connection options',{exact:true}).click()
 await page.getByLabel('Custom STUN URLs (optional)').fill(url)
}

test('desktop host and mobile guest keep hands private and finish a complete native loopback match',async({browser,baseURL},info)=>{
 test.setTimeout(110000)
 const stun=process.env.REAL_WEBRTC==='1'?await localStun():null
 const native=stun?await chromium.launch({args:['--no-sandbox','--disable-dev-shm-usage','--allow-loopback-in-peer-connection','--disable-features=WebRtcHideLocalIpsWithMdns']}):null
 const contexts=await Promise.all([
  (native??browser).newContext({viewport:{width:1280,height:850},reducedMotion:'reduce'}),
  (native??browser).newContext({viewport:{width:360,height:780},reducedMotion:'reduce',hasTouch:true,isMobile:true}),
 ])
 try{
  if(native)for(const c of contexts)await c.addInitScript(()=>{
   const RTC=window.RTCPeerConnection
   window.RTCPeerConnection=class extends RTC{
    constructor(...args:ConstructorParameters<typeof RTC>){super(...args);this.addEventListener('connectionstatechange',()=>document.documentElement.dataset.hitRtc=this.connectionState)}
   }
  })
  const [host,guest]=await Promise.all(contexts.map(c=>c.newPage()))
  await host.goto(baseURL!)
  if(stun)await stunOption(host,stun.url)
  await host.getByLabel('Nickname').fill('Ada')
  await host.getByRole('button',{name:'Create party'}).click()
  const code=(await host.getByTestId('room-code').textContent())!
  await chooseGame(host,'hitStay')
  await guest.goto(baseURL!+'#/join?room='+code)
  if(stun)await stunOption(guest,stun.url)
  await guest.getByLabel('Nickname').fill('Bo')
  await guest.getByRole('button',{name:'Join party'}).tap()
  await guest.getByRole('button',{name:'Ready up',exact:true}).tap()
  if(native)for(const p of [host,guest])await expect(p.locator('html')).toHaveAttribute('data-hit-rtc','connected')
  await startMatch(host)
  for(let i=1;i<=8;i++){
   await Promise.all([host,guest].map(async p=>{
    await expect(board(p)).toHaveAttribute('data-hit-round',String(i))
    await expect(own(p).locator('[data-hit-card]')).toHaveCount(2)
    await expect(board(p).locator('[data-hit-card=face]')).toHaveCount(2)
    await expect(revealed(p)).toHaveCount(0)
   }))
   await expect.poll(async()=>await canStay(host)||await canStay(guest),{timeout:15_000}).toBe(true)
   const first=await canStay(host)?host:guest,second=first===host?guest:host
   if(i===1){
    await board(first).getByRole('button',{name:'Hit',exact:true}).click()
    await expect(own(first).locator('[data-hit-card]')).toHaveCount(3)
    await expect(board(second).locator('[data-hit-card=face]')).toHaveCount(2)
   }else await playing(first).click()
   await playing(second).click()
   if(i===1){
    await expect.poll(async()=>await canStay(first)||await revealed(first).isVisible(),{timeout:15_000}).toBe(true)
    if(await canStay(first))await playing(first).click()
   }
   await Promise.all([host,guest].map(p=>expect(revealed(p).locator('[data-hit-card=face]')).toHaveCount(i===1?5:4)))
   if(i<8){await expect(next(guest)).toHaveCount(0);await next(host).click()}
  }
  await expect(guest.getByRole('region',{name:'Match record'})).toBeVisible()
  await guest.screenshot({path:info.outputPath('hit-stay-loopback-results.png'),fullPage:true})
 }finally{
  await Promise.allSettled(contexts.map(c=>c.close()))
  await native?.close();stun?.close()
 }
})
