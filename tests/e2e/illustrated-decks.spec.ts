import {expect,test,type Locator} from '@playwright/test'
import {startMatch} from './start-match'
import {chooseGame,chooseSetting} from '../lobby-controls'

async function art(card:Locator) {
 const images=card.locator('img.deck-print')
 await expect(images.first()).toBeVisible()
 await expect.poll(()=>images.evaluateAll(nodes=>nodes.every(node=>(node as HTMLImageElement).complete&&(node as HTMLImageElement).naturalWidth>0))).toBe(true)
 return images.evaluateAll(nodes=>nodes.map(node=>(node as HTMLImageElement).getAttribute('src')!))
}

for(const [title,key,width] of [['Remove One','remove',320],['Remove One','remove',1280],['Memory Poker','memoryPoker',1280],['Memory Poker','memoryPoker',320]] as const){
 test(title+' prints the same illustrated deck in preview and play at '+width+'px',async({page},info)=>{
  await page.setViewportSize({width,height:width===320?700:820})
  await page.emulateMedia({reducedMotion:'reduce'})
  await page.goto('./season/'+(key==='remove'?2:3)+'/')
  const gallery=page.getByRole('button',{name:'Open '+title,exact:true})
  await gallery.click()
  const preview=page.locator('[data-real-table-preview="'+key+'"]')
  const object=key==='remove'?'.remove-card[data-face=back]':'.memory-face'
  const proof=async(zone:Locator)=>{
   const sources=await art(zone.locator(object))
   if(key==='remove'){
    expect(new Set(sources).size).toBe(1)
    expect(sources[0]).toContain('masked-letter-back')
    expect(await art(zone.locator('.remove-hand'))).toEqual(Array(2).fill(sources[0].replace('back','face')))
   }else{
    const labels=await zone.locator('.memory-card').evaluateAll(cards=>cards.map(card=>card.getAttribute('aria-label')!))
    expect(sources).toHaveLength(20)
    const prefix=sources[0].split('/herbarium-')[0]
    for(let i=0;i<labels.length;i++){
     const suit=labels[i].match(/ of (Clubs|Diamonds|Hearts|Spades)$/)?.[1]
     expect(suit).toBeDefined()
     expect(sources[i]).toBe(prefix+'/herbarium-'+suit!.slice(0,-1).toLowerCase()+'.svg')
    }
    return [prefix]
   }
   return [...new Set(sources)].sort()
  }
  const previewDeck=await proof(preview)
  await preview.screenshot({path:info.outputPath('preview.png')})
  await page.getByRole('dialog').getByRole('button',{name:'Practice '+title,exact:true}).click()
  await startMatch(page)
  const live=page.locator('[data-playing]:not([inert]) [data-rendered-table="'+key+'"]')
  expect(await proof(live)).toEqual(previewDeck)
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(width)
  await live.screenshot({path:info.outputPath('play.png')})
  if(key==='remove'){
   await live.getByRole('button',{name:/Discard .*card 1/}).press('Enter')
   await expect(live.getByText('Round 2 / 8',{exact:true})).toBeVisible()
   expect(await art(live.locator('.remove-seats [data-public-value]'))).toContain(previewDeck[0].replace('back','face'))
  }
 })
}

test('the lobby preview of the two-human duel opens the same engraved sixteen-card layout',async({browser,baseURL},info)=>{
 const hostContext=await browser.newContext({reducedMotion:'reduce'})
 const guestContext=await browser.newContext({isMobile:true,hasTouch:true,viewport:{width:320,height:700},reducedMotion:'reduce'})
 try{
  const [host,guest]=await Promise.all([hostContext.newPage(),guestContext.newPage()])
  await host.goto(baseURL!)
  await host.getByLabel('Nickname').fill('Archivist')
  await host.getByRole('button',{name:'Create party',exact:true}).click()
  const code=await host.getByTestId('room-code').textContent()
  await guest.goto(baseURL!+'#/join?room='+code)
  await guest.getByLabel('Nickname').fill('Keeper')
  await guest.getByRole('button',{name:'Join party',exact:true}).tap()
  await chooseGame(host,'memoryPoker')
  await chooseSetting(host,'Memory Poker mode','episode')
  await expect(guest.getByRole('region',{name:'Current table'})).toContainText('Episode-style duel')
  await guest.getByRole('button',{name:'Preview the table',exact:true}).tap()
  const sample=guest.locator('[data-real-table-preview][data-sample-variant="episode"]')
  expect(await art(sample.locator('.memory-card'))).toHaveLength(16)
  await sample.screenshot({path:info.outputPath('preview.png')})
  await guest.getByRole('button',{name:'Close details',exact:true}).tap()
  await guest.getByRole('button',{name:'Ready up',exact:true}).tap()
  await startMatch(host)
  const live=guest.getByRole('region',{name:'Episode-style Memory Poker duel'})
  expect(await art(live.locator('.memory-card'))).toHaveLength(16)
  await live.screenshot({path:info.outputPath('play.png')})
  expect(await guest.evaluate(()=>document.documentElement.scrollWidth)).toBe(320)
 }finally{await Promise.all([hostContext.close(),guestContext.close()])}
})
