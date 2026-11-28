import {test,expect,type Page} from '@playwright/test'
import {startMatch} from './start-match'
import {chooseGame} from '../lobby-controls'
import {piggyLoopbackStun} from './piggy-bank-loopback'

test.use({launchOptions:{args:['--no-sandbox','--disable-dev-shm-usage','--allow-loopback-in-peer-connection','--disable-features=WebRtcHideLocalIpsWithMdns']}})

declare global {interface Window {piggyTestConnections:RTCPeerConnection[]}}

const table=(page:Page)=>page.getByRole('region',{name:'Piggy Bank table',exact:true})
test('320px touch: gallery, same live objects, five swipe lessons, local bots and the result',async({browser,baseURL},info)=>{
 test.setTimeout(120_000)
 const ctx=await browser.newContext({viewport:{width:320,height:700},isMobile:true,hasTouch:true,reducedMotion:'reduce'})
 try{
  const page=await ctx.newPage()
  page.setDefaultTimeout(8500)
  const errors:string[]=[]
  page.on('pageerror',e=>errors.push(e.message))
  await page.goto(baseURL!+'season/3/')
  const cover=page.locator('[data-preview-game="piggyBank"] img[data-arena-art]')
  await cover.scrollIntoViewIfNeeded()
  await expect.poll(()=>cover.evaluate((img:HTMLImageElement)=>img.complete&&img.naturalWidth>0)).toBe(true)
  await page.clock.install()
  await page.getByRole('button',{name:'Practice Piggy Bank',exact:true}).tap()
  await page.getByRole('button',{name:'Preview the table',exact:true}).tap()
  const preview=page.locator('[data-real-table-preview="piggyBank"]')
  await expect(preview.locator('[data-piggy-rack] .piggy-figure')).toHaveCount(4)
  const pigPath=await preview.locator('.piggy-ceramic').first().getAttribute('d')
  await page.screenshot({path:info.outputPath('piggy-preview-mobile.png')})
  await page.getByRole('button',{name:'Close details'}).tap()
  await page.getByRole('button',{name:'Start match',exact:true}).tap()
  const brief=page.getByRole('dialog')
  const guide=brief.getByRole('region',{name:'How to play'})
  const lesson=guide.locator('[data-piggy-lesson]')
  await expect(lesson).toHaveAttribute('data-piggy-lesson','0')
  await expect(brief.getByRole('timer')).toHaveCount(0)
  await expect(brief.getByText('Timers start only after you enter.')).toBeVisible()
  await expect(brief).toHaveAttribute('data-motion-off','true')
  await expect(brief.getByRole('button',{name:/^(back|next)$/i})).toHaveCount(0)
  await guide.press('ArrowRight')
  await expect(lesson).toHaveAttribute('data-piggy-lesson','1')
  await expect(lesson.locator('.piggy-lesson-mark svg').first()).toHaveCSS('animation-name','none')
  const cdp=await ctx.newCDPSession(page)
  const bounds=(await lesson.boundingBox())!,x=bounds.x+bounds.width/4,y=bounds.y+bounds.height/2
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]})
  await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+65,y}]})
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]})
  await cdp.detach()
  await expect(lesson).toHaveAttribute('data-piggy-lesson','2')
  await page.screenshot({path:info.outputPath('piggy-lesson-mobile.png')})
  await guide.press('End')
  await expect(lesson).toHaveAttribute('data-piggy-lesson','4')
  await brief.getByRole('button',{name:'Enter match',exact:true}).tap()
  const board=table(page)
  await expect(board).toHaveAttribute('data-piggy-phase','deposit')
  await expect(board.locator('.piggy-ceramic').first()).toHaveAttribute('d',pigPath!)
  const add=board.getByRole('button',{name:'Add black coin'})
  await add.tap()
  await board.getByRole('button',{name:'Add white coin'}).tap()
  await board.getByRole('button',{name:'Undo coin'}).tap()
  await expect(board.locator('.piggy-added')).toContainText('1/5')
  await board.locator('button.piggy-shelf').first().tap()
  await expect(board.locator('button.piggy-shelf').first()).toHaveCSS('background-image',/linear-gradient/)
  await expect(board.locator('.piggy-signal p')).toHaveCSS('color','rgb(244, 219, 184)')
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(320)
  await page.screenshot({path:info.outputPath('piggy-live-mobile.png')})
  await board.getByRole('button',{name:'Pass to Bot 1',exact:true}).tap()
  for(let i=0;i<240;i++){
   const phase=await board.getAttribute('data-piggy-phase')
   if(phase==='done')break
   if(phase==='deposit'&&await add.count()){
    await add.tap()
    await board.locator('button.piggy-shelf').first().tap()
    await board.getByRole('button',{name:'Pass to Bot 1',exact:true}).tap()
   }else if(phase==='claim'&&await board.locator('.piggy-count input').count()){
    await board.locator('.piggy-count input').fill('0')
    await board.getByRole('button',{name:'Claim count',exact:true}).tap()
   }else if(phase==='doubt'&&await board.getByRole('button',{name:'Let it pass',exact:true}).count()){
    await board.getByRole('button',{name:'Let it pass',exact:true}).tap()
   }else if(phase==='challenge'&&await board.getByRole('button',{name:'Skip challenge',exact:true}).count()){
    await board.getByRole('button',{name:'Skip challenge',exact:true}).tap()
   }else await page.clock.fastForward(6000)
  }
  await expect(board).toHaveAttribute('data-piggy-phase','done')
  await expect(page.getByRole('button',{name:'Rematch',exact:true})).toBeVisible()
  await page.screenshot({path:info.outputPath('piggy-result-mobile.png')})
  expect(errors).toEqual([])
 }finally{await ctx.close()}
})

test('three browser clients: sealed coin selection, first-doubt reveal, and result at five',async({browser,baseURL},info)=>{
 test.setTimeout(95_000)
 const names=['Slate','Copper','Ash']
 const stun=process.env.REAL_WEBRTC==='1'?await piggyLoopbackStun():null
 const ctx=await Promise.all(names.map(()=>browser.newContext({viewport:{width:750,height:820},reducedMotion:'reduce'})))
 try{
  if(stun)for(const context of ctx){
   await context.addInitScript(()=>{
    window.piggyTestConnections=[]
    const Native=window.RTCPeerConnection
    window.RTCPeerConnection=class extends Native{
     constructor(config?:RTCConfiguration){super(config);window.piggyTestConnections.push(this)}
    }
   })
   await context.route('**/*',route=>new URL(route.request().url()).hostname==='127.0.0.1'?route.continue():route.abort())
  }
  const pages=await Promise.all(ctx.map(c=>c.newPage())),[host]=pages
  for(const page of pages)page.setDefaultTimeout(8500)
  await host.goto(baseURL!)
  await stun?.configure(host)
  await host.getByLabel('Nickname').fill(names[0])
  await host.getByRole('button',{name:'Create party'}).click()
  const code=await host.getByTestId('room-code').innerText()
  await chooseGame(host,'piggyBank')
  for(let i=1;i<pages.length;i++){
   await pages[i].goto(baseURL!+'#/join?room='+code)
   await stun?.configure(pages[i])
   await pages[i].getByLabel('Nickname').fill(names[i])
   await pages[i].getByRole('button',{name:'Join party'}).click()
   await pages[i].getByRole('button',{name:'Ready up',exact:true}).click()
  }
  if(stun)for(const page of pages)await expect.poll(()=>page.evaluate(()=>window.piggyTestConnections.some(pc=>pc.connectionState==='connected'&&pc.sctp?.transport?.state==='connected'))).toBe(true)
  await startMatch(host)
  const boards=pages.map(table)
  const caller=boards[2]
  for(let i=0;i<5;i++){
   for(const board of boards)await expect(board).toHaveAttribute('data-piggy-phase','deposit')
   const deposit=await Promise.all(boards.map(b=>b.getByRole('button',{name:'Add black coin',exact:true}).count()))
   const actor=deposit.indexOf(1),to=actor===0?1:0
   expect(actor).toBeGreaterThanOrEqual(0)
   const source=boards[actor],receiver=boards[to]
   await source.getByRole('button',{name:'Add black coin',exact:true}).click()
   await expect(source.locator('.piggy-added')).toContainText('1/5')
   await expect(receiver.locator('.piggy-added')).toHaveCount(0)
   await expect(receiver).not.toContainText('Last public deposit')
   await source.locator('button.piggy-shelf').filter({hasText:names[to]}).click()
   await source.getByRole('button',{name:'Pass to '+names[to],exact:true}).click()
   await expect(receiver).toHaveAttribute('data-piggy-phase','claim')
   await expect(receiver).toContainText('Last public deposit')
   await receiver.locator('.piggy-count input').fill('0')
   await receiver.getByRole('button',{name:'Claim count',exact:true}).click()
   await expect(caller).toHaveAttribute('data-piggy-phase','doubt')
   await caller.getByRole('button',{name:'Doubt claim',exact:true}).click()
   await expect(receiver).toHaveAttribute('data-piggy-phase','review')
   await expect(receiver).toContainText('Doubt upheld')
   await expect(boards[0]).toContainText('BANK OPENED')
   if(i===0)await pages[to].screenshot({path:info.outputPath('piggy-native-opened.png')})
  }
  for(const board of boards){
   await expect(board).toHaveAttribute('data-piggy-phase','done')
   await expect(board.getByRole('heading',{name:'Ash wins',exact:true})).toBeVisible()
   await expect(board.getByText('Five-point goal reached.')).toBeVisible()
  }
  await pages[2].screenshot({path:info.outputPath('piggy-native-result.png')})
 }finally{await Promise.allSettled(ctx.map(c=>c.close()));stun?.close()}
})
