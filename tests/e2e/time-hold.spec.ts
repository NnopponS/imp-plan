import {test,expect,type Page,type Locator} from '@playwright/test'
import {chooseGame,chooseSetting,settingChoice,tableSetting} from '../lobby-controls'
import type {Snapshot} from '../../src/room'

const plunger=(p:Page)=>p.getByRole('button',{name:'Hold to bid'})
const board=(p:Page)=>p.locator('.time-hold')
const sync=(page:Page,ms:number)=>page.clock.runFor(ms)
const click=(locator:Locator)=>locator.evaluate((el:HTMLElement)=>el.click())

test('optional hold/release is sealed on the wire in both directions until the shared review',async({browser,baseURL})=>{
 const contexts=await Promise.all([{},{viewport:{width:390,height:840},hasTouch:true},{}].map(options=>browser.newContext(options)))
 const [host,guest,observer]=await Promise.all(contexts.map(c=>c.newPage()))
 try{
  // Run all three page clocks together so the guests' private leases use the same
  // time budget as the host. No testing clock or relay is included in the build.
  const advance=async(ms:number)=>{
   while(ms>0){
    const step=Math.min(ms,500)
    await Promise.all([host,guest,observer].map(p=>sync(p,step)))
    ms-=step
   }
  }
  for(const p of [host,guest,observer]){
   p.setDefaultTimeout(8_000)
   const current=new Date('2026-01-12T10:00:00Z')
   await p.clock.install({time:current})
   await p.clock.pauseAt(new Date(current.getTime()+500))
  }
  const frames:Snapshot[]=[]
  observer.on('websocket',ws=>ws.on('framereceived',({payload})=>{
   if(typeof payload!=='string')return
   const relay=JSON.parse(payload)
   const msg=relay.kind==='data'?JSON.parse(relay.data):null
   if(msg?.type==='snapshot')frames.push(msg.state)
  }))
  await host.goto(baseURL!)
  await host.getByLabel('Nickname').fill('Ari')
  await click(host.getByRole('button',{name:'Create party'}))
  await chooseGame(host,'auction')
  await expect(settingChoice(host,'Time Auction mode','sealed')).toBeChecked()
  await expect(tableSetting(host,'Seconds to submit')).toBeVisible()
  const code=await host.getByTestId('room-code').textContent()
  for(const [p,name] of [[guest,'Bee'],[observer,'Cam']] as const){
   await p.goto(baseURL!+'#/join?room='+code)
   await p.getByLabel('Nickname').fill(name)
   await click(p.getByRole('button',{name:'Join party'}))
   await click(p.getByRole('button',{name:'Ready up'}))
  }
  await chooseSetting(host,'Time Auction mode','hold')
  await expect(settingChoice(observer,'Time Auction mode','hold')).toBeChecked()
  await expect(tableSetting(host,'Seconds to submit')).toHaveCount(0)
  await expect(host.getByRole('button',{name:'Add bot'})).toBeDisabled()
  await click(host.getByRole('button',{name:'Start match'}))
  const brief=host.getByRole('dialog')
  await expect(brief.getByRole('img',{name:'The timekeepers’ cabinet'})).toBeVisible()
  await advance(9_000)
  await expect(board(observer)).toHaveCount(0)
  await click(brief.getByRole('button',{name:'Enter match'}))
  // Let all three pages receive the first match snapshot before ticking Suspense's
  // first-reveal delay. The host clock still leaves ample time in the arming phase.
  for(const p of [host,guest,observer])await expect(p.getByRole('heading',{level:1,name:'Time Auction'})).toBeVisible()
  await advance(400)
  await expect(plunger(observer)).toBeVisible()
  await expect(board(guest).getByText('Bidding opens in')).toBeVisible()
  const traceArming=frames.length
  await plunger(host).focus()
  await host.keyboard.down('Space')
  await expect(board(host).getByText('Release the button to finish your hold.')).toBeVisible()
  // Real touch pointer events on Chromium; key hold is exercised separately.
  const touch=await guest.context().newCDPSession(guest)
  await plunger(guest).evaluate(e=>e.scrollIntoView({block:'center'}))
  const button=await plunger(guest).boundingBox()
  if(!button)throw new Error('Missing guest plunger')
  await touch.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:button.x+button.width/2,y:button.y+button.height/2}]})
  await expect(board(guest).getByText('Release the button to finish your hold.')).toBeVisible()
  await advance(1_300)
  expect(frames).toHaveLength(traceArming)

  await advance(1_600)
  await expect(board(observer).getByText('Bids are private')).toBeVisible()
  const traceLive=frames.length
  await advance(5_000)
  await expect(board(guest).getByText('Your held time')).toBeVisible()
  expect(frames).toHaveLength(traceLive)
  await host.keyboard.up('Space')
  await expect(board(host).getByText('Your turn is closed.',{exact:false})).toBeVisible()
  expect(frames).toHaveLength(traceLive)
  await advance(400)
  await touch.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]})
  await expect(board(guest).getByText('Your turn is closed.',{exact:false})).toBeVisible()
  expect(frames).toHaveLength(traceLive)
  await advance(250)
  await expect(board(observer).getByText('Bee won the token')).toBeVisible()
  if(process.env.REAL_WEBRTC!=='1'){
   expect(frames).toHaveLength(traceLive+1)
   expect(frames.at(-1)?.game).toMatchObject({timeHold:{phase:'review',mine:{status:'closed',remainingTenths:null}},credits:[],submitted:0,mine:null,last:null})
   expect(JSON.stringify(frames)).not.toMatch(/leaseUntil|lastHostAt|"slots"|"reserve"/)
  }
  expect(await guest.evaluate(()=>document.documentElement.scrollWidth)).toBe(390)
 }finally{
  await Promise.allSettled(contexts.map(c=>c.close()))
 }
})
