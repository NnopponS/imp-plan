import {chromium,expect,test,type Page} from '@playwright/test'
import {createSocket} from 'node:dgram'
import {once} from 'node:events'
import {chooseGame} from '../lobby-controls'
import {startMatch} from './start-match'

const board=(p:Page)=>p.getByRole('region',{name:'Hidden Word table'})
const envelope=(p:Page)=>board(p).getByRole('group',{name:'Private envelope'}).getByRole('button')
const cues=(p:Page)=>board(p).getByRole('group',{name:'Private clue options'}).getByRole('button')
const inputs=(p:Page)=>board(p).getByRole('textbox',{name:'Your answer',exact:true})
const chooseButton=async(p:Page)=>envelope(p).first().press('Enter')

async function loopbackStun(){
 const ip='127.0.0.1',cookie=0x2112a442,socket=createSocket('udp4')
 socket.on('message',(request,peer)=>{
  if(peer.address!==ip||request.length<20||request.readUInt16BE(0)!==1||request.readUInt32BE(4)!==cookie||request.readUInt16BE(2)!==request.length-20)return
  const reply=Buffer.alloc(32)
  reply.writeUInt16BE(0x0101,0);reply.writeUInt16BE(12,2);request.copy(reply,4,4,20)
  reply.writeUInt16BE(0x0020,20);reply.writeUInt16BE(8,22);reply[25]=1
  reply.writeUInt16BE(peer.port^(cookie>>>16),26)
  ip.split('.').forEach((part,i)=>reply[28+i]=Number(part)^reply[4+i])
  socket.send(reply,peer.port,ip)
 })
 const bound=once(socket,'listening');socket.bind(0,ip);await bound
 return {url:'stun:'+ip+':'+socket.address().port,close:()=>socket.close()}
}
async function setStun(page:Page,url:string){
 await page.getByText('Connection options',{exact:true}).click()
 await page.getByLabel('Custom STUN URLs (optional)').fill(url)
}
type ProbedWindow=Window&typeof globalThis&{hiddenRtc:RTCPeerConnection[]}
const connectedCount=(p:Page)=>p.evaluate(()=>((window as ProbedWindow).hiddenRtc??[]).filter(pc=>
 pc.connectionState==='connected'&&['connected','completed'].includes(pc.iceConnectionState)&&pc.sctp?.transport.state==='connected').length)

test('320px accountless practice reads the six-frame lesson and finishes both rotations',async({browser,baseURL})=>{
 test.setTimeout(90000)
 const context=await browser.newContext({viewport:{width:320,height:830},hasTouch:true,isMobile:true,reducedMotion:'reduce'})
 try {
  const page=await context.newPage(),errors:string[]=[]
  page.on('pageerror',error=>errors.push(error.message))
  await page.clock.install()
  await page.goto(baseURL!+'season/3/')
  const practice=page.getByRole('button',{name:'Practice Hidden Word',exact:true})
  await expect(practice).toBeVisible({timeout:10000})
  await practice.scrollIntoViewIfNeeded()
  const cover=page.locator('[data-preview-game="hiddenWord"]').filter({visible:true}).first()
  await expect.poll(()=>cover.locator('img[data-arena-art]').evaluate((img:HTMLImageElement)=>img.complete&&img.naturalWidth>0)).toBe(true)
  await practice.tap()
  await expect(page.getByRole('textbox',{name:'Nickname'})).toHaveCount(0)
  await expect(page.getByRole('button',{name:'Remove Bot 2 from seat 3'})).toBeVisible()
  await page.getByRole('button',{name:'Start match',exact:true}).tap()
  const briefing=page.getByRole('dialog'), lesson=briefing.getByRole('region',{name:'How to play'})
  const illustrated=[
   /Pear is chosen/,/six possible nouns/,/bonus seal/,/Setter plus one point/,/Pear is correct/,/round two double points/,
  ]
  for(const [i,label] of illustrated.entries()){
   const picture=briefing.getByRole('img',{name:label})
   await expect(picture).toBeVisible()
   await expect(picture).toHaveAttribute('data-hidden-example',String(i))
   await expect.poll(()=>picture.locator('.hw-film-rise').first().evaluate(e=>getComputedStyle(e).animationName)).toBe('none')
   if(i<illustrated.length-1)await lesson.press('ArrowRight')
  }
  await briefing.getByRole('button',{name:'Enter match',exact:true}).tap()
  const table=board(page)
  await expect(table).toHaveAttribute('data-word-phase','choose')
  await expect.poll(()=>table.locator('img[src$="hidden-word-stage.svg"]').evaluate((img:HTMLImageElement)=>img.complete&&img.naturalWidth>0)).toBe(true)
  await expect(envelope(page)).toHaveCount(5)
  let submitted=false
  for(let i=0;i<75;i++){
   const phase=await table.getAttribute('data-word-phase')
   if(phase==='done')break
   if(phase==='choose'){
    if(await envelope(page).count()){
     const round=await table.getAttribute('data-word-round')
     await expect(envelope(page)).toHaveCount(round==='1'?5:4)
     await chooseButton(page)
    }
    await page.clock.fastForward(950)
   }else if(phase==='clue'){
    if(await cues(page).count())await cues(page).first().tap()
    else await page.clock.fastForward(950)
   }else if(phase==='guess'){
    if(await inputs(page).count()){
     if(!submitted){
      await table.getByText(/Browse word bank/).tap()
      const answer=table.getByRole('group',{name:'Main answer suggestions'}).getByRole('button').first()
      await answer.tap()
      await table.getByRole('button',{name:'Seal answer',exact:true}).press('Enter')
      submitted=true
     }else await table.getByRole('button',{name:'Pass',exact:true}).tap()
    }
    await page.clock.fastForward(950)
   }else if(phase==='review')await page.clock.fastForward(4750)
  }
  expect(submitted).toBe(true)
  await expect(table).toHaveAttribute('data-word-phase','done')
  await expect(table.getByRole('complementary',{name:'Hidden Word standings'}).getByRole('listitem')).toHaveCount(3)
  await expect(table.getByText('6 words opened',{exact:true})).toBeVisible()
  await expect(table.getByText('Word history · 6',{exact:true})).toBeVisible()
  await expect(page.getByRole('region',{name:'Match record'})).toBeVisible()
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(320)
  expect(errors).toEqual([])
 }finally{await context.close()}
})

test('three browsers protect selections and bonus guesses until the joint reveal',async({browser,baseURL})=>{
 test.setTimeout(95000)
 const stun=process.env.REAL_WEBRTC==='1'?await loopbackStun():null
 const native=stun?await chromium.launch({args:['--no-sandbox','--disable-dev-shm-usage','--allow-loopback-in-peer-connection','--disable-features=WebRtcHideLocalIpsWithMdns']}):null
 const runner=native??browser
 const contexts=await Promise.all([runner.newContext({reducedMotion:'reduce'}),runner.newContext({viewport:{width:390,height:815},hasTouch:true,reducedMotion:'reduce'}),runner.newContext({reducedMotion:'reduce'})])
 try{
  if(native)for(const context of contexts)await context.addInitScript(()=>{
   const w=window as ProbedWindow
   w.hiddenRtc=[]
   const Original=w.RTCPeerConnection
   w.RTCPeerConnection=class extends Original{
    constructor(config?:RTCConfiguration){super(config);w.hiddenRtc.push(this)}
   }
  })
  const peers=await Promise.all(contexts.map(c=>c.newPage())), [host,...guests]=peers
  for(const page of peers)page.setDefaultTimeout(18000)
  const names=['Atlas','Clover','Rune']
  await host.goto(baseURL!)
  if(stun)await setStun(host,stun.url)
  await host.getByLabel('Nickname').fill(names[0])
  await host.getByRole('button',{name:'Create party'}).click()
  await expect(host.getByTestId('room-code')).toHaveText(/^[A-Z2-9]{6}$/, {timeout:12000})
  const code=(await host.getByTestId('room-code').textContent())!
  await chooseGame(host,'hiddenWord')
  for(const [i,p] of guests.entries()){
   await p.goto(baseURL!+'#/join?room='+code)
   if(stun)await setStun(p,stun.url)
   await p.getByLabel('Nickname').fill(names[i+1])
   await p.getByRole('button',{name:'Join party'}).click()
   const ready=p.getByRole('button',{name:'Ready up',exact:true})
   await expect(ready).toBeVisible({timeout:14000})
   await ready.click()
  }
  if(native)for(const [i,p] of peers.entries())await expect.poll(()=>connectedCount(p)).toBe(i===0?2:1)
  await startMatch(host)
  await Promise.all(peers.map(p=>expect(envelope(p)).toHaveCount(5)))
  const privateOptions=await Promise.all(peers.map(p=>envelope(p).allTextContents()))
  expect(new Set(privateOptions.flat().map(v=>v.slice(7))).size).toBe(15)
  const selected=await Promise.all(peers.map(p=>envelope(p).first().evaluate(b=>b.lastChild?.textContent??'')))
  await chooseButton(guests[0])
  await expect(board(guests[0]).getByText('Private envelope sealed')).toBeVisible()
  await expect(board(guests[1]).getByText('Private envelope sealed')).toHaveCount(0)
  await expect(board(host).locator('.hw-work')).not.toContainText(selected[1])
  await chooseButton(host)
  await chooseButton(guests[1])
  await Promise.all(peers.map(p=>expect(board(p)).toHaveAttribute('data-word-phase','clue')))
  const setHint=await Promise.all(peers.map(p=>cues(p).count()))
  const setter=peers[setHint.findIndex(n=>n>0)], setterNoun=selected[peers.indexOf(setter)]
  expect(setHint.filter(n=>n>0)).toEqual([2])
  const readers=peers.filter(p=>p!==setter)
  await cues(setter).first().press('Enter')
  await Promise.all(peers.map(p=>expect(board(p)).toHaveAttribute('data-word-phase','guess')))
  const clue=(p:Page)=>board(p).locator('.hw-clues')
  expect(await clue(readers[0]).innerText()).toEqual(await clue(readers[1]).innerText())
  await expect(clue(readers[0])).toContainText('95%')
  await inputs(readers[0]).fill(setterNoun.toUpperCase())
  await board(readers[0]).getByRole('button',{name:'Use a bonus seal'}).click()
  await board(readers[0]).getByRole('textbox',{name:'Bonus answer',exact:true}).fill(setterNoun)
  await expect(board(readers[0]).getByRole('button',{name:'Seal two answers'})).toBeDisabled()
  await board(readers[0]).getByText(/Browse word bank/).click()
  await board(readers[0]).getByRole('textbox',{name:'Bonus answer',exact:true}).fill('')
  const bonus=board(readers[0]).getByRole('group',{name:'Bonus answer suggestions'}).getByRole('button').filter({hasNotText:new RegExp('^'+setterNoun+'$')}).first()
  const second=(await bonus.textContent())!
  await bonus.click()
  await board(readers[0]).getByRole('button',{name:'Seal two answers'}).press('Enter')
  await expect(board(readers[0]).getByText('Your answer is sealed')).toBeVisible()
  await expect(board(readers[0]).getByText('1 bonus seal left')).toBeVisible()
  await expect(inputs(readers[1])).toHaveValue('')
  await expect(board(readers[1]).getByText('Your answer is sealed')).toHaveCount(0)
  await expect(board(readers[1]).getByRole('list',{name:'Simultaneous answers'})).toHaveCount(0)
  await expect(board(readers[1]).getByText('2 bonus seals left')).toBeVisible()
  await board(readers[1]).getByRole('button',{name:'Pass',exact:true}).click()
  const open=(p:Page)=>board(p).getByRole('list',{name:'Simultaneous answers'})
  await Promise.all(peers.map(p=>expect(open(p)).toContainText(setterNoun+' / '+second)))
  await Promise.all(peers.map(p=>expect(open(p)).toContainText('Correct')))
  expect((await open(readers[0]).innerText()).replace(' (you)','')).toEqual((await open(setter).innerText()).replace(' (you)',''))
  expect(await guests[0].evaluate(()=>document.documentElement.scrollWidth)).toBe(390)
  await Promise.all([host.screenshot({path:test.info().outputPath('hidden-word-desktop.png')}),
   guests[0].screenshot({path:test.info().outputPath('hidden-word-mobile.png')})])
 }finally{
  await Promise.allSettled(contexts.map(c=>c.close()))
  await native?.close()
  stun?.close()
 }
})

test('the cover motion and the narrowing lesson are distinct and respect reduced motion',async({page,baseURL})=>{
 await page.setViewportSize({width:1280,height:850})
 await page.goto(baseURL!+'season/3/')
 const cover=page.locator('[data-preview-game="hiddenWord"]').filter({visible:true}).first()
 await cover.evaluate(e=>e.scrollIntoView({block:'center',behavior:'instant'}))
 const art=cover.locator('img[data-cover-motion]')
 await expect(art).toHaveAttribute('data-cover-ready','true')
 await expect(art).toHaveAttribute('data-cover-original',/seasonal-hiddenWord\.svg$/)
 await page.getByRole('button',{name:'Practice Hidden Word',exact:true}).click()
 await page.getByRole('button',{name:'Start match',exact:true}).click()
 const brief=page.getByRole('dialog')
 const reader=brief.getByRole('region',{name:'How to play'})
 for(let i=0;i<4;i++)await reader.press('ArrowRight')
 const lane=brief.getByRole('img',{name:/Pear is correct/})
 await expect(lane).toBeVisible()
 const narrowing=lane.locator('.hw-film-outsider')
 await expect(narrowing).toHaveCount(4)
 await expect.poll(()=>narrowing.first().evaluate(e=>getComputedStyle(e).animationName)).toBe('hw-film-outsider')
 await page.emulateMedia({reducedMotion:'reduce'})
 await expect.poll(()=>narrowing.first().evaluate(e=>getComputedStyle(e).animationName)).toBe('none')
})
