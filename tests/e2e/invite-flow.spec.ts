import {test,expect,type Browser,type Page} from '@playwright/test'
import {rankPokerHand} from '../../src/memory-poker'
import {startMatch} from './start-match'

const testSocket=/^ws:\/\/127\.0\.0\.1:\d+\/\?id=/
const native=process.env.REAL_WEBRTC==='1'
const table=(p:Page)=>p.getByRole('region',{name:'Episode-style Memory Poker duel'})
const cards=(p:Page)=>table(p).getByRole('group',{name:'Duel card layout'}).getByRole('button')
const lock=async(p:Page,pair:number[],touch=false)=>{
 for(const i of pair){
  const card=cards(p).nth(i)
  if(touch)await card.tap();else await card.press('Enter')
  await expect(card).toHaveAttribute('aria-pressed','true')
 }
 const confirm=table(p).getByRole('button',{name:'Lock two cards'})
 await expect(confirm).toBeEnabled()
 if(touch)await confirm.tap()
 else await confirm.press('Enter')
}
const openParty=async(page:Page,url:string)=>{
 await page.goto(url)
 await page.getByLabel('Nickname').fill('Ari')
 await page.getByRole('button',{name:'Create party'}).click()
 const room=page.getByTestId('room-code')
 await expect(room).toHaveText(/^[A-Z2-9]{6}$/)
 return (await room.textContent())!
}
const enter=async(page:Page,url:string)=>{
 await page.goto(url)
 await expect(page.getByLabel('Nickname')).toHaveValue('')
 await page.getByLabel('Nickname').fill('Bee')
 await page.getByRole('button',{name:'Join party'}).click()
}
async function copiedInvite(browser:Browser,url:string){
 const context=await browser.newContext({permissions:['clipboard-read','clipboard-write'],reducedMotion:'reduce'})
 try{
  const host=await context.newPage()
  // Host time is accelerated only after both peers are online.
  await host.clock.install()
  const code=await openParty(host,url)
  await host.getByRole('button',{name:'Copy invite'}).click()
  await expect(host.getByText('Invite copied.',{exact:true})).toBeVisible()
  const invite=await host.evaluate(()=>navigator.clipboard.readText())
  expect(invite).toBe(url+'#/join?room='+code)
  return {context,host,invite,code}
 }catch(error){await context.close();throw error}
}

test('actual copied invite opens a clean guest, finishes a Memory duel, and restores the guest on reload',async({browser,baseURL})=>{
 const {context,host,invite,code}=await copiedInvite(browser,baseURL!)
 const phone=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,reducedMotion:'reduce'})
 try{
  const guest=await phone.newPage()
  await guest.goto(invite)
  await expect(guest.getByLabel('Invite code')).toHaveValue(code)
  await expect(guest.getByLabel('Nickname')).toHaveValue('')
  expect(await guest.evaluate(()=>Object.keys(sessionStorage))).toEqual([])
  await guest.getByLabel('Nickname').fill('Bee')
  await guest.getByRole('button',{name:'Join party'}).click()
  await expect(guest.getByRole('button',{name:'Ready up'})).toBeVisible({timeout:19_000}).catch(async error=>{
   const reason=await guest.getByRole('alert').first().textContent({timeout:250}).catch(()=>null)
   if(reason)throw new Error('Guest did not reach the lobby: '+reason,{cause:error})
   throw error
  })
  await host.getByLabel('Game').selectOption('memoryPoker')
  await host.getByLabel('Memory Poker mode').selectOption('episode')
  await expect(guest.getByLabel('Memory Poker mode')).toHaveValue('episode')
  await guest.getByRole('button',{name:'Ready up'}).click()
  await startMatch(host)

  await expect(cards(guest)).toHaveCount(16)
  const board=await cards(host).evaluateAll(els=>els.map(el=>Number(el.getAttribute('data-card'))))
  expect(new Set(board).size).toBe(16)
  await host.clock.fastForward(20_100);await host.clock.runFor(240)
  for(const p of [host,guest])await expect(table(p).getByRole('heading',{name:'Choose two cards'})).toBeVisible()
  const sharedCards=table(host).getByRole('region',{name:'Shared cards'}).getByRole('img')
  await expect(sharedCards).toHaveCount(3)
  const shared=await sharedCards.evaluateAll(els=>els.map(el=>Number(el.getAttribute('data-card'))))
  // Pick distinct strengths so this one-deal transport test cannot randomly tie.
  const choices=board.flatMap((a,i)=>board.slice(i+1).map((b,j)=>({pair:[i,i+j+1],score:rankPokerHand([...shared,a,b])!.strength})))
  choices.sort((a,b)=>a.score.reduce((d,x,i)=>d||x-b.score[i],0))
  const low=choices[0],high=choices.at(-1)!
  expect(low.score).not.toEqual(high.score)
  await lock(guest,low.pair,true)
  await expect(table(guest).getByRole('status')).toHaveText('Pair locked. Waiting for the reveal.')
  await guest.reload({waitUntil:'domcontentloaded'})
  await expect(table(guest).getByRole('status')).toHaveText('Pair locked. Waiting for the reveal.')
  await lock(host,high.pair)
  for(const p of [host,guest]){
   await expect(p.getByRole('heading',{name:'Ari wins',exact:true})).toBeVisible()
   await expect(table(p).getByRole('region',{name:'Revealed hands'}).getByRole('img')).toHaveCount(4)
  }
  await guest.reload({waitUntil:'domcontentloaded'})
  await expect(guest.getByRole('heading',{name:'Ari wins',exact:true})).toBeVisible()
  await expect(table(guest).getByRole('region',{name:'Revealed hands'}).getByRole('img')).toHaveCount(4)
 }finally{await phone.close();await context.close()}
})

for(const clipboard of ['missing','denied'] as const)test('Copy invite provides a selectable URL when clipboard is '+clipboard,async({page,baseURL})=>{
 await page.addInitScript(mode=>{
  Object.defineProperty(navigator,'clipboard',{value:mode==='missing'?undefined:{writeText:()=>Promise.reject(new DOMException('Denied','NotAllowedError'))}})
 },clipboard)
 const code=await openParty(page,baseURL!)
 await page.getByRole('button',{name:'Copy invite'}).click()
 const input=page.getByRole('textbox',{name:'Invite link'})
 await expect(input).toHaveValue(baseURL!+'#/join?room='+code)
 await expect(input).toHaveAttribute('readonly','')
 await expect(input).toBeFocused()
 expect(await input.evaluate((el:HTMLInputElement)=>[el.selectionStart,el.selectionEnd])).toEqual([0,(baseURL!+'#/join?room='+code).length])
})

test.describe('controlled loopback join failures',()=>{
 test.skip(native,'Fault injection uses the WebSocket loopback test transport only.')
 test('signaling registration stalls before a direct connection is attempted',async({page,baseURL})=>{
  await page.clock.install()
  let intercepted=false
  await page.routeWebSocket(testSocket,()=>{intercepted=true})
  await enter(page,baseURL!+'#/join?room=ABC234')
  await expect.poll(()=>intercepted).toBe(true)
  await expect(page.getByRole('status')).toContainText(/contacting signaling/i)
  await page.clock.fastForward(8500)
  await expect(page.getByRole('alert')).toContainText(/couldn.t reach (the )?signaling/i)
  await expect(page.getByRole('button',{name:'Retry'})).toBeVisible()
 })
 test('room not found is distinct from failure to open a direct channel',async({page,baseURL})=>{
  await enter(page,baseURL!+'#/join?room=ABC234')
  await expect(page.getByRole('alert')).toContainText(/room not found/i)
 })
 test('a registered guest never gets a direct channel',async({page,baseURL})=>{
  await page.clock.install()
  let dialed=false
  await page.routeWebSocket(testSocket,ws=>{
   const server=ws.connectToServer()
   ws.onMessage(raw=>{if(JSON.parse(String(raw)).kind==='dial')dialed=true;else server.send(raw)})
  })
  await enter(page,baseURL!+'#/join?room=ABC234')
  await expect.poll(()=>dialed).toBe(true)
  await expect(page.getByRole('status')).toContainText(/opening a direct connection/i)
  await page.clock.fastForward(9500)
  await expect(page.getByRole('alert')).toContainText(/direct connection (didn.t|couldn.t) open/i)
  await expect(page.getByRole('button',{name:'Retry'})).toBeVisible()
 })
 test('an accepted guest gets a bounded first-room-state error and can retry',async({browser,page,baseURL})=>{
  const context=await browser.newContext()
  try{
   const host=await context.newPage()
   const code=await openParty(host,baseURL!)
   await page.clock.install()
   let accepted=false
   let discard=true
   await page.routeWebSocket(testSocket,ws=>{
    const server=ws.connectToServer()
    server.onMessage(raw=>{
     const frame=JSON.parse(String(raw))
     const kind=frame.kind==='data'?JSON.parse(frame.data).type:null
     if(kind==='accepted')accepted=true
     if(kind!=='snapshot'||!discard)ws.send(raw)
    })
   })
   await enter(page,baseURL!+'#/join?room='+code)
   await expect.poll(()=>accepted).toBe(true)
   await expect(page.getByRole('status')).toContainText(/waiting for the host.s room state/i)
   await expect.poll(()=>page.evaluate(k=>sessionStorage.getItem(k)!,'arena-resume-'+code)).toContain('"name":"Bee"')
   await page.clock.fastForward(9500)
   await expect(page.getByRole('alert')).toContainText(/host didn.t send the room state/i)
   discard=false
   await page.getByRole('button',{name:'Retry'}).click()
   await expect(page.getByRole('button',{name:'Ready up'})).toBeVisible()
   await expect(host.getByText('Bee',{exact:true})).toHaveCount(1)
  }finally{await context.close()}
 })
})
