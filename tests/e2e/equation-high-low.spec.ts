import {chromium,expect,test,type Page} from '@playwright/test'
import {createSocket} from 'node:dgram'
import {once} from 'node:events'
import {chooseGame} from '../lobby-controls'
import {startMatch} from './start-match'

const table=(page:Page)=>page.getByRole('region',{name:'Equation High-Low table'})
async function wager(page:Page,action:string){
 await table(page).getByRole('button',{name:action,exact:true}).click()
}
async function sealEquation(page:Page,lane:'Low'|'High'){
 const board=table(page)
 await expect(board).toHaveAttribute('data-eh-phase','seal')
 await board.getByRole('button',{name:new RegExp(lane+' Closest to')}).click()
 const picks=board.locator('[data-eh-pick]')
 const labels=await picks.evaluateAll(nodes=>nodes.map(node=>node.getAttribute('aria-label')))
 const divisor=labels.findIndex(label=>!label?.includes(': 0 '))
 for(const i of labels.map((_,i)=>i).filter(i=>i!==divisor).concat(divisor))await picks.nth(i).click()
 await board.getByRole('button',{name:'Seal '+lane+' equation',exact:true}).click()
}

async function localStun(){
 const ip='127.0.0.1',magic=0x2112a442,socket=createSocket('udp4')
 socket.on('message',(data,peer)=>{
  if(peer.address!==ip||data.length<20||data.readUInt16BE(0)!==1||data.readUInt32BE(4)!==magic||data.readUInt16BE(2)!==data.length-20)return
  const reply=Buffer.alloc(32)
  reply.writeUInt16BE(0x0101,0);reply.writeUInt16BE(12,2);data.copy(reply,4,4,20)
  reply.writeUInt16BE(0x0020,20);reply.writeUInt16BE(8,22);reply[25]=1
  reply.writeUInt16BE(peer.port^(magic>>>16),26)
  ip.split('.').forEach((part,i)=>reply[28+i]=Number(part)^reply[4+i])
  socket.send(reply,peer.port,ip)
 })
 const listening=once(socket,'listening');socket.bind(0,ip);await listening
 return {url:'stun:'+ip+':'+socket.address().port,close:()=>socket.close()}
}
async function chooseLocalStun(page:Page,url:string){
 await page.getByText('Connection options',{exact:true}).click()
 await page.getByLabel('Custom STUN URLs (optional)').fill(url)
}

test('two real browsers wager, privately declare, and play four rounds to a match record',async({browser,baseURL},info)=>{
 test.setTimeout(100000)
 const native=process.env.REAL_WEBRTC==='1'
 const stun=native?await localStun():null
 const rtc=native?await chromium.launch({args:['--no-sandbox','--disable-dev-shm-usage','--allow-loopback-in-peer-connection','--disable-features=WebRtcHideLocalIpsWithMdns']}):null
 const testBrowser=rtc??browser
 const contexts=await Promise.all([
  testBrowser.newContext({viewport:{width:1280,height:850},reducedMotion:'reduce'}),
  testBrowser.newContext({viewport:{width:320,height:740},hasTouch:true,isMobile:true,reducedMotion:'reduce'}),
 ])
 try{
  if(rtc)for(const context of contexts)await context.addInitScript(()=>{
   const Native=window.RTCPeerConnection
   window.RTCPeerConnection=class extends Native{
    constructor(...args:ConstructorParameters<typeof Native>){
     super(...args)
     this.addEventListener('connectionstatechange',()=>{
      document.documentElement.dataset.equationRtc=this.connectionState
     })
    }
   }
  })
  const [ada,bo]=await Promise.all(contexts.map(context=>context.newPage()))
  for(const page of [ada,bo])page.setDefaultTimeout(15000)
  await ada.goto(baseURL!)
  if(stun)await chooseLocalStun(ada,stun.url)
  await ada.getByLabel('Nickname').fill('Ada')
  await ada.getByRole('button',{name:'Create party'}).click()
  await expect(ada.getByTestId('room-code')).toBeVisible({timeout:15000})
  const code=(await ada.getByTestId('room-code').textContent())!
  await chooseGame(ada,'equationHighLow')
  await bo.goto(baseURL!+'#/join?room='+code)
  if(stun)await chooseLocalStun(bo,stun.url)
  await bo.getByLabel('Nickname').fill('Bo')
  await bo.getByRole('button',{name:'Join party'}).tap()
  await bo.getByRole('button',{name:'Ready up',exact:true}).tap()
  if(rtc)for(const page of [ada,bo])await expect(page.locator('html')).toHaveAttribute('data-equation-rtc','connected')
  await startMatch(ada)
  for(let i=0;i<4;i++){
   const [first,second]=i%2===0?[ada,bo]:[bo,ada]
   for(const page of [ada,bo]){
    await expect(table(page)).toHaveAttribute('data-eh-phase','opening')
    await expect(table(page).getByRole('img',{name:/, Private$/})).toHaveCount(1)
   }
   if(i===0){
    await wager(first,'Raise to 1')
    await wager(second,'Call 1')
    await wager(first,'Check')
    await wager(second,'Raise to 1')
    await wager(first,'Call 1')
    await expect(table(first)).toContainText('6 chips in pot')
   }else{
    for(let pass=0;pass<2;pass++){
     await wager(first,'Check')
     await wager(second,'Check')
    }
   }
   await sealEquation(ada,'Low')
   await expect(table(ada).getByText('Your equation is sealed')).toBeVisible()
   await expect(table(bo).getByText('Your equation is sealed')).toHaveCount(0)
   await expect(table(bo).getByRole('list',{name:'Showdown equations'})).toHaveCount(0)
   await sealEquation(bo,'High')
   for(const page of [ada,bo]){
    await expect(table(page)).toHaveAttribute('data-eh-phase',i===3?'finished':'review')
    await expect(table(page).getByRole('list',{name:'Showdown equations'}).getByRole('listitem')).toHaveCount(2)
    await expect(table(page).locator('[data-lane=low]')).toContainText('Ada')
    await expect(table(page).locator('[data-lane=high]')).toContainText('Bo')
   }
   if(i<3)await wager(ada,'Next deal')
  }
  await expect(table(ada).getByText('Shared lead: Ada, Bo')).toHaveCSS('color','rgb(255, 216, 176)')
  await expect(bo.getByRole('region',{name:'Match record'})).toContainText('Shared lead')
  expect(await bo.evaluate(()=>document.documentElement.scrollWidth)).toBe(320)
  await bo.screenshot({path:info.outputPath('equation-high-low-mobile-result.png'),fullPage:true})
 }finally{
  await Promise.allSettled(contexts.map(context=>context.close()))
  await rtc?.close()
  stun?.close()
 }
})

test('illustrated Season 1 cover and five animated lesson cues load before practice',async({page,baseURL},info)=>{
 await page.setViewportSize({width:375,height:810})
 await page.goto(baseURL!+'season/1/')
 const card=page.getByRole('article').filter({has:page.getByRole('heading',{name:'Equation High-Low',exact:true})})
 await expect(card.locator('[data-venue="main"]')).toHaveText('Main Match')
 const art=card.locator('img[data-arena-art]')
 await art.scrollIntoViewIfNeeded()
 await expect(art).toHaveAttribute('src',/seasonal-equationHighLow.svg$/)
 await expect.poll(()=>art.evaluate((node:HTMLImageElement)=>node.complete&&node.naturalWidth>0)).toBe(true)
 await page.getByRole('button',{name:'Practice Equation High-Low',exact:true}).click()
 await page.getByRole('button',{name:'Start match',exact:true}).click()
 const dialog=page.getByRole('dialog')
 const region=dialog.getByRole('region',{name:'How to play'})
 for(let i=0;i<5;i++){
  await expect(region.locator('[data-equation-high-low-example]')).toHaveAttribute('data-equation-high-low-example',String(i))
  await expect(region.locator('.brief-cue')).toHaveAttribute('data-ready','true')
  if(i===2)await page.screenshot({path:info.outputPath('equation-high-low-mobile-lesson.png')})
  if(i<4)await region.press('ArrowRight')
 }
 await expect(region.locator('.brief-cue')).toContainText('Enter match')
 await dialog.getByRole('button',{name:'Enter match',exact:true}).click()
 await expect(table(page)).toContainText('Bot 1')
})
