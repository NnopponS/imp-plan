import {chromium,expect,test,type Page} from '@playwright/test'
import {createSocket} from 'node:dgram'
import {once} from 'node:events'
import {chooseGame} from '../lobby-controls'
import {startMatch} from './start-match'
const board=(p:Page)=>p.getByRole('region',{name:'Doubt and Bet table'})
const move=(p:Page,n:string)=>board(p).getByRole('button',{name:n,exact:true})

test('original cards are the same in the mobile preview, motion lesson and playable table',async({browser,baseURL},info)=>{
 const context=await browser.newContext({viewport:{width:320,height:680},hasTouch:true,isMobile:true})
 try{
  const p=await context.newPage()
  await p.goto(baseURL!+'season/2/')
  const card=p.getByRole('article').filter({has:p.getByRole('heading',{name:'Doubt and Bet',exact:true})})
  const cover=card.locator('img[data-arena-art]')
  await cover.scrollIntoViewIfNeeded()
  await expect(cover).toHaveAttribute('src',/seasonal-doubtBet\.svg$/)
  await expect.poll(()=>cover.evaluate((el:HTMLImageElement)=>el.complete&&el.naturalWidth>0)).toBe(true)
  await card.getByRole('button',{name:'Open Doubt and Bet',exact:true}).tap()
  const dialog=p.getByRole('dialog',{name:'Doubt and Bet',exact:true})
  const preview=dialog.locator('[data-real-table-preview] .db-private .db-card-art').first()
  await expect(preview).toBeVisible()
  expect(await preview.evaluate(el=>el.closest('[inert]')!==null)).toBe(true)
  const artwork=await preview.evaluate(el=>[el.localName,el.getAttribute('viewBox'),getComputedStyle(el).color])
  await dialog.screenshot({path:info.outputPath('doubt-bet-mobile-preview.png')})
  await dialog.getByRole('button',{name:'Practice Doubt and Bet',exact:true}).tap()
  await p.getByRole('button',{name:'Start match',exact:true}).tap()
  const lesson=p.getByRole('region',{name:'How to play'})
  await expect(lesson).toHaveAttribute('data-lesson-kind','worked-example')
  await expect(lesson.locator('[data-doubt-bet-example="0"] .db-card-art')).toHaveCount(5)
  await expect(lesson.locator('.brief-cue')).toHaveAttribute('data-ready','true')
  const page=lesson.locator('.brief-page')
  const b=await page.boundingBox()
  expect(b).not.toBeNull()
  const session=await context.newCDPSession(p)
  const x=b!.x+b!.width*.26,y=b!.y+Math.min(28,b!.height*.2)
  await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]})
  await session.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+74,y}]})
  await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]})
  await session.detach()
  await expect(lesson.locator('[data-doubt-bet-example="1"]')).toBeVisible()
  await lesson.press('ArrowRight')
  await expect(lesson.locator('[data-doubt-bet-example="2"]')).toBeVisible()
  await lesson.press('End')
  await expect(lesson.locator('[data-db-hit]')).toHaveCount(3)
  await expect(lesson.locator('.brief-cue')).toHaveAttribute('data-ready','true')
  await expect(lesson.getByRole('button',{name:/^(Back|Next)$/})).toHaveCount(0)
  await p.screenshot({path:info.outputPath('doubt-bet-mobile-lesson.png')})
  await p.getByRole('dialog').getByRole('button',{name:'Enter match',exact:true}).tap()
  await expect(board(p).locator('header')).toContainText('Deal 1 / 4')
  expect(await board(p).locator('.db-private .db-card-art').first().evaluate(el=>[el.localName,el.getAttribute('viewBox'),getComputedStyle(el).color])).toEqual(artwork)
  expect(await p.evaluate(()=>document.documentElement.scrollWidth)).toBe(320)
  await expect(p.locator('[data-page-turn="match"]')).toHaveCount(0)
  await expect(board(p).getByLabel('Claim count')).toBeVisible()
  expect((await move(p,'Declare claim').boundingBox())!.height).toBeGreaterThanOrEqual(44)
  await p.screenshot({path:info.outputPath('doubt-bet-mobile-table.png')})
 }finally{await context.close()}
})

test('person and practice bot finish a full match on mobile',async({browser,baseURL},info)=>{
 test.setTimeout(85000)
 const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true,reducedMotion:'reduce'})
 try{
  const p=await context.newPage()
  await p.goto(baseURL!+'season/2/')
  await p.getByRole('button',{name:'Practice Doubt and Bet',exact:true}).tap()
  await startMatch(p)
  await expect(board(p).locator('.db-roster')).toContainText('Bot 1')
  for(let n=1;n<=4;n++){
   await expect(board(p).locator('header')).toContainText('Deal '+n+' / 4')
   for(const t of [0,1,2,3,4]){
    const phase=await board(p).getAttribute('data-db-phase')
    if(phase==='review'||phase==='done')break
    await expect.poll(async()=>await board(p).locator('.db-round').textContent(),{timeout:8000}).toMatch(/Your turn|Deal review|Final score/)
    const current=await board(p).getAttribute('data-db-phase')
    if(current==='review'||current==='done')break
    if(current==='open'){await move(p,'Declare claim').tap();continue}
    if(current==='reply'&&await move(p,'Doubt').isVisible())await move(p,'Doubt').tap()
    await move(p,'Call & reveal').tap()
    if(t===4)throw new Error('Could not finish deal '+n)
   }
   if(n<4)await move(p,'Next deal').tap()
  }
  await expect(board(p)).toHaveAttribute('data-db-phase','done')
  await expect(p.getByRole('region',{name:'Match record'})).toBeVisible()
  expect(await p.evaluate(()=>document.documentElement.scrollWidth)).toBe(390)
  await p.screenshot({path:info.outputPath('doubt-bet-mobile-results.png'),fullPage:true})
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
async function stunOption(p:Page,url:string){
 await p.getByText('Connection options',{exact:true}).click()
 await p.getByLabel('Custom STUN URLs (optional)').fill(url)
}
test('two seated browsers see no other hands before a call and finish four deals',async({browser,baseURL})=>{
 test.setTimeout(120000)
 const native=process.env.REAL_WEBRTC==='1'
 const stun=native?await localStun():null
 const rtc=native?await chromium.launch({args:['--no-sandbox','--disable-dev-shm-usage','--allow-loopback-in-peer-connection','--disable-features=WebRtcHideLocalIpsWithMdns']}):null
 const chosen=rtc??browser
 const contexts=await Promise.all([
  chosen.newContext({viewport:{width:1250,height:830},reducedMotion:'reduce'}),
  chosen.newContext({viewport:{width:320,height:670},reducedMotion:'reduce',hasTouch:true,isMobile:true})
 ])
 try{
  if(rtc)for(const c of contexts)await c.addInitScript(()=>{
   const Native=window.RTCPeerConnection
   window.RTCPeerConnection=class extends Native{
    constructor(...args:ConstructorParameters<typeof Native>){
     super(...args)
     this.addEventListener('connectionstatechange',()=>{document.documentElement.dataset.doubtRtc=this.connectionState})
    }
   }
  })
  const [host,guest]=await Promise.all(contexts.map(c=>c.newPage()))
  await host.goto(baseURL!)
  if(stun)await stunOption(host,stun.url)
  await host.getByLabel('Nickname').fill('Ada')
  await host.getByRole('button',{name:'Create party'}).click()
  const code=(await host.getByTestId('room-code').textContent())!
  await chooseGame(host,'doubtBet')
  await guest.goto(baseURL!+'#/join?room='+code)
  if(stun)await stunOption(guest,stun.url)
  await guest.getByLabel('Nickname').fill('Bo')
  await guest.getByRole('button',{name:'Join party'}).tap()
  await guest.getByRole('button',{name:'Ready up',exact:true}).tap()
  if(rtc)for(const p of [host,guest])await expect(p.locator('html')).toHaveAttribute('data-doubt-rtc','connected')
  await startMatch(host)
  for(let n=1;n<=4;n++){
   for(const p of [host,guest]){
    await expect(board(p)).toHaveAttribute('data-db-phase','open')
    await expect(board(p).locator('.db-private .db-card-art')).toHaveCount(5)
    await expect(board(p).getByRole('region',{name:'Revealed hands'})).toHaveCount(0)
   }
   const first=await move(host,'Declare claim').isVisible()?host:guest
   const second=first===host?guest:host
   await board(first).getByLabel('Claim count').selectOption('2')
   await move(first,'Declare claim').click()
   await expect(board(second).locator('.db-claim')).toContainText('2 × Red')
   await expect(board(second).getByRole('region',{name:'Revealed hands'})).toHaveCount(0)
   await move(second,'Doubt').click()
   await move(second,'Call & reveal').click()
   for(const p of [host,guest]){
    await expect(board(p)).toHaveAttribute('data-db-phase',n===4?'done':'review')
    await expect(board(p).getByRole('region',{name:'Revealed hands'}).locator('.db-card-art')).toHaveCount(10)
   }
   if(n<4){
    await expect(move(guest,'Next deal')).toHaveCount(0)
    await move(host,'Next deal').click()
   }
  }
  await expect(guest.getByRole('region',{name:'Match record'})).toBeVisible()
 }finally{
  await Promise.allSettled(contexts.map(c=>c.close()))
  await rtc?.close();stun?.close()
 }
})
