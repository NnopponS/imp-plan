import {startMatch} from './start-match'
import {chooseGame,chooseSetting} from '../lobby-controls'
import {test,expect,type Locator,type Page} from '@playwright/test'
import type {Snapshot} from '../../src/room'

test('Fragments of Memory recalls the hidden gallery through all 24 questions',async({browser,baseURL})=>{
 const ctx=await browser.newContext({viewport:{width:360,height:780},hasTouch:true})
 try{
  const page=await ctx.newPage()
  await page.clock.install()
  await page.goto(baseURL!+'season/1/')
  await page.getByLabel('Nickname').fill('Curator')
  await page.getByRole('button',{name:/Practice Fragments of Memory/}).click()
  await chooseSetting(page,'Questions','24')
  await startMatch(page)
  const scene=page.getByRole('figure',{name:'Study exhibit'})
  const instruction=page.getByText('Remember shelf positions', {exact:false})
  await expect(instruction).toBeInViewport()
  const contrast=await instruction.evaluate(el=>{
   const style=getComputedStyle(el)
   const lum=(rgb:string)=>{
    const channels=rgb.match(/[\d.]+/g)!.slice(0,3).map(x=>Number(x)/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4)
    return .2126*channels[0]+.7152*channels[1]+.0722*channels[2]
   }
   const plate=style.backgroundColor==='rgba(0, 0, 0, 0)'?getComputedStyle(el.closest('.match')!).backgroundColor:style.backgroundColor
   const light=lum(style.color),dark=lum(plate)
   return (Math.max(light,dark)+.05)/(Math.min(light,dark)+.05)
  })
  expect(contrast).toBeGreaterThanOrEqual(4.5)
  await scene.getByText('Text version of exhibit').click()
  const truth=await readExhibit(scene)
  expect(truth.objects).toHaveLength(9)
  // Pause the real-time Playwright clock pump while shifting the study interval.
  // Resume before tap() so its browser animation-frame stability check can run.
  await page.clock.pauseAt(await page.evaluate(()=>Date.now()+500))
  await page.clock.fastForward(45500)
  await page.clock.resume()
  await expect(scene).toHaveCount(0)
  for(let n=1;n<=24;n++){
   await expect(page.getByText(`Question ${n} / 24`,{exact:true})).toBeVisible()
   const region=page.getByRole('region',{name:'Recall question'})
   const question=(await region.getByRole('heading').textContent())!
   const choice=region.getByRole('button',{name:answerFrom(question,truth),exact:true})
   await expect(choice).toBeEnabled({timeout:2500})
   if(n%2)await choice.press('Enter',{timeout:2500});else await choice.tap({timeout:2500})
  }
  await expect(page.getByRole('heading',{name:'Exhibit cleared'})).toBeVisible()
  await expect(page.getByText('24 / 24',{exact:true})).toBeVisible()
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(360)
 }finally{await ctx.close()}
})

async function readExhibit(scene:Locator){
 const [,word,time]=(await scene.locator('details p').textContent())!.match(/^Label: (\w+)\. Clock: ([\d:]+)\.$/)!
 const objects=(await scene.locator('details li').allTextContents()).flatMap(t=>t.split(': ')[1].slice(0,-1).split(', ')).map(t=>{
  const [color,item]=t.split(' ')
  return {color,item:item[0].toUpperCase()+item.slice(1)}
 })
 return {word,time,objects}
}
function answerFrom(q:string,{word,time,objects}:Awaited<ReturnType<typeof readExhibit>>){
 const item=q.match(/the (\w+)\?$/)?.[1]
 if(q.startsWith('What is the clock'))return time
 if(q.startsWith('Which word'))return word
 if(q.startsWith('What color'))return objects.find(o=>o.item.toLowerCase()===item)!.color
 if(q.includes('right of'))return objects[objects.findIndex(o=>o.item.toLowerCase()===item)+1].item
 if(q.includes('center'))return objects[1+3*['top','middle','bottom'].indexOf(q.split(' ').at(-2)!)].item
 return String(objects.filter(o=>o.color.toLowerCase()===q.split(' ')[2]).length)
}

const cabinet=(stage:Locator)=>stage.locator('.gallery-scene')
const readShelf=(stage:Locator)=>cabinet(stage).locator('.cabinet-shelf').evaluateAll(shelves=>shelves.map(shelf=>
 [...shelf.querySelectorAll('.cabinet-plaque')].map(plaque=>[...plaque.querySelectorAll('text')].map(t=>t.textContent).join(' '))))

for(const width of [320,1280])test('the real cabinet has three legible shelves in Preview and live study at '+width+'px',async({browser,baseURL})=>{
 const ctx=await browser.newContext({viewport:{width,height:width===320?640:880},hasTouch:width===320,isMobile:width===320,reducedMotion:'reduce'})
 try{
  const page=await ctx.newPage()
  await page.goto(baseURL!+'season/1/')
  const card=page.locator('#practice-gallery-fragments').locator('xpath=ancestor::article')
  await card.locator('.game-cover-hit').click()
  const dialog=page.getByRole('dialog',{name:'Fragments of Memory'})
  const sample=dialog.locator('[data-real-table-preview="fragments"]')
  await expect(sample.locator('[inert]')).toHaveCount(1)
  const checkCabinet=async(stage:Locator)=>{
   await expect(cabinet(stage).locator('.cabinet-shelf')).toHaveCount(3)
   await expect(cabinet(stage).locator('.cabinet-plaque')).toHaveCount(9)
   const geometry=await cabinet(stage).locator('.cabinet-shelf').evaluateAll(shelves=>shelves.map(shelf=>
    [...shelf.querySelectorAll('.cabinet-plaque')].map(plaque=>{
     const {left,top}=plaque.getBoundingClientRect()
     const labels=[...plaque.querySelectorAll('text')].map(label=>{
      const rect=label.getBoundingClientRect()
      return {height:rect.height,width:rect.width}
     })
     return {left,top,labels}
    })))
   for(const [i,row] of geometry.entries()){
    expect(row.map(plaque=>plaque.top)).toEqual([row[0].top,row[0].top,row[0].top])
    expect(row[2].left).toBeGreaterThan(row[1].left)
    expect(row[1].left).toBeGreaterThan(row[0].left)
    if(i)expect(row[0].top).toBeGreaterThan(geometry[i-1][0].top)
    expect(row.flatMap(plaque=>plaque.labels).every(label=>label.height>=12&&label.width>14)).toBe(true)
   }
   return readShelf(stage)
  }
  const sampleRows=await checkCabinet(sample)
  expect(sampleRows.flat().map(row=>row.split(' ')[0]).sort()).toEqual(['Bell','Compass','Crown','Cup','Gem','Key','Lantern','Leaf','Vase'])
  const sampleArt=await cabinet(sample).locator('.cabinet-artifact').evaluateAll(nodes=>nodes.map(n=>n.innerHTML).sort())
  await dialog.getByRole('button',{name:'Practice Fragments of Memory',exact:true}).click()
  await startMatch(page)
  const live=page.locator('[data-rendered-table="fragments"]')
  const liveRows=await checkCabinet(live)
  expect(await cabinet(live).locator('.cabinet-artifact').evaluateAll(nodes=>nodes.map(n=>n.innerHTML).sort())).toEqual(sampleArt)
  await cabinet(live).getByText('Text version of exhibit').press('Enter')
  const rows=await cabinet(live).locator('details li').allTextContents()
  expect(rows.map(row=>row.split(': ')[1].slice(0,-1).split(', '))).toEqual(
   liveRows.map(row=>row.map(plaque=>{const [name,color]=plaque.split(' ');return color+' '+name.toLowerCase()})))
  const header=await cabinet(live).locator('.cabinet-word,.cabinet-time').allTextContents()
  await expect(cabinet(live).locator('details p')).toHaveText('Label: '+header[0]+'. Clock: '+header[1]+'.')
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(width)
 }finally{await ctx.close()}
})

async function observeSnapshots(guest:Page){
 const frames:Snapshot[]=[]
 function record(payload:string){
  const envelope=JSON.parse(payload)
  const msg=envelope.kind==='data'?JSON.parse(envelope.data):envelope
  if(msg?.type==='snapshot')frames.push(msg.state)
 }
 if(process.env.REAL_WEBRTC==='1'){
  await guest.exposeFunction('recordCabinetFrame',record)
  await guest.addInitScript(()=>{
   const capture=window as Window & {recordCabinetFrame?:(raw:string)=>Promise<void>}
   const create=RTCPeerConnection.prototype.createDataChannel
   RTCPeerConnection.prototype.createDataChannel=function(...args){
    const channel=create.apply(this,args)
    channel.addEventListener('message',({data})=>{
     if(typeof data==='string')void capture.recordCabinetFrame?.(data)
    })
    return channel
   }
  })
 }else guest.on('websocket',ws=>ws.on('framereceived',({payload})=>{if(typeof payload==='string')record(payload)}))
 return frames
}

test('desktop host and touch guest recall the same exhibit without a stale DOM or wire witness',async({browser,baseURL})=>{
 const ctxs=await Promise.all([
  browser.newContext({viewport:{width:1280,height:850},reducedMotion:'reduce'}),
  browser.newContext({viewport:{width:320,height:640},hasTouch:true,isMobile:true,reducedMotion:'reduce'}),
 ])
 try{
  const [host,guest]=await Promise.all(ctxs.map(c=>c.newPage()))
  const frames=await observeSnapshots(guest)
  await Promise.all([host,guest].map(p=>p.clock.install()))
  await host.goto(baseURL!)
  await host.getByLabel('Nickname').fill('Curator')
  await host.getByRole('button',{name:'Create party',exact:true}).click()
  const code=(await host.getByTestId('room-code').textContent())!
  await chooseGame(host,'fragments')
  await guest.goto(baseURL!+'#/join?room='+code)
  await guest.getByLabel('Nickname').fill('Reader')
  await guest.getByRole('button',{name:'Join party',exact:true}).tap()
  await guest.getByRole('button',{name:'Ready up',exact:true}).tap()
  await startMatch(host)
  const stage=(p:Page)=>p.locator('.room[data-playing]:not([inert]) [data-rendered-table="fragments"]')
  const question=(p:Page)=>stage(p).getByRole('region',{name:'Recall question'})
  for(const p of [host,guest])await expect(cabinet(stage(p)).locator('.cabinet-plaque')).toHaveCount(9)
  expect(await readShelf(stage(guest))).toEqual(await readShelf(stage(host)))
  await cabinet(stage(guest)).getByText('Text version of exhibit').tap()
  const truth=await readExhibit(cabinet(stage(guest)))
  await expect.poll(()=>frames.find(s=>s.game?.fragments?.scene)?.game?.fragments?.scene?.word).toBe(truth.word)
  const deadline=frames.find(s=>s.game?.fragments?.scene)!.game!.deadline!
  await Promise.all([host,guest].map(async p=>p.clock.pauseAt(await p.evaluate(()=>Date.now()+300))))
  for(let i=0;i<10;i++)await Promise.all([host,guest].map(p=>p.clock.runFor(4000)))
  // Let the guest's own clock reach the deadline before another host snapshot arrives.
  await guest.clock.runFor(6000)
  await expect(stage(guest).getByText('Exhibit closed',{exact:true})).toBeVisible()
  await expect(cabinet(stage(guest))).toHaveCount(0)
  await expect(question(guest)).toHaveCount(0)
  await host.clock.runFor(6000)
  await Promise.all([host,guest].map(p=>p.clock.resume()))
  for(let round=1;round<=2;round++){
   for(const p of [host,guest]){
    await expect(stage(p).getByText(`Question ${round} / 12`,{exact:true})).toBeVisible()
    await expect(cabinet(stage(p))).toHaveCount(0)
    await expect(stage(p).getByText('Text version of exhibit')).toHaveCount(0)
   }
   const asker=round===1?host:guest,observer=round===1?guest:host
   const prompt=(await question(asker).getByRole('heading').textContent())!
   const answer=question(asker).getByRole('button',{name:answerFrom(prompt,truth),exact:true})
   const packet=()=>frames.find(s=>s.game?.round===round&&s.game.fragments?.question)
   await expect.poll(()=>packet()?.game?.fragments?.question?.prompt).toBe(prompt)
   expect(packet()!.game!.fragments!.question!.options).toEqual(await question(guest).getByRole('button').allTextContents())
   await expect(question(observer).getByRole('button').first()).toBeDisabled()
   if(round===1)await answer.press('Enter');else await answer.tap()
   await expect(stage(observer).locator('.fragments-score strong')).toHaveText(round+' / 12')
  }
  const recall=frames.filter(s=>s.game?.fragments&&s.hostNow>=deadline)
  expect(recall.length).toBeGreaterThanOrEqual(2)
  for(const {game} of recall){
   const f=game!.fragments!
   expect(f.scene).toBeNull()
   expect(f).not.toHaveProperty('deal')
   expect(game).not.toHaveProperty('seed')
   if(f.question)expect(Object.keys(f.question).sort()).toEqual(['options','prompt'])
  }
 }finally{await Promise.all(ctxs.map(c=>c.close()))}
})
