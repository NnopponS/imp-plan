import {test,expect,type Page} from '@playwright/test'
import {chooseGame,chooseSetting,settingChoice,tableSwitch} from '../lobby-controls'
import {rankPokerHand} from '../../src/memory-poker'

const table=(page:Page)=>page.getByRole('region',{name:'Episode-style Memory Poker duel'})
const cards=(page:Page)=>table(page).getByRole('group',{name:'Duel card layout'}).getByRole('button')
const time=async(page:Page,ms:number)=>{await page.clock.fastForward(ms);await page.clock.runFor(240)}
const wholeGrid=async(page:Page)=>{const bounds=await cards(page).evaluateAll(els=>els.map(el=>{const r=el.getBoundingClientRect();return {top:r.top,bottom:r.bottom,height:r.height,viewport:innerHeight}})); expect(bounds).toHaveLength(16); expect(bounds.every(r=>r.top>=0&&r.bottom<=r.viewport&&r.height>=44)).toBe(true)}
const labels=(page:Page)=>cards(page).evaluateAll(els=>els.map(el=>el.getAttribute('data-card')))
const choose=async(page:Page,positions:readonly number[],touch=false)=>{
 for(const index of positions){if(touch)await cards(page).nth(index).tap();else await cards(page).nth(index).press('Enter')}
 await table(page).getByRole('button',{name:'Lock two cards'}).click()
}
function extremes(board:number[],shared:number[]){
 const options:{pair:[number,number];rank:number[]}[]=[]
 for(let i=0;i<board.length;i++)for(let j=i+1;j<board.length;j++){
  options.push({pair:[i,j],rank:rankPokerHand([...shared,board[i],board[j]])!.strength})
 }
 options.sort((a,b)=>a.rank.reduce((prev,n,i)=>prev||n-b.rank[i],0))
 expect(options[0].rank).not.toEqual(options.at(-1)!.rank)
 return [options[0].pair,options.at(-1)!.pair] as const
}

test('episode-style two-human duel waits for Enter, seals picks, redeals a tie and reaches an exact result',async({browser,baseURL})=>{
 test.setTimeout(90_000)
 const desktop=await browser.newContext({reducedMotion:'reduce'}),mobile=await browser.newContext({viewport:{width:360,height:780},hasTouch:true,reducedMotion:'reduce'})
 try{
  const host=await desktop.newPage(),guest=await mobile.newPage()
  host.setDefaultTimeout(7_000);guest.setDefaultTimeout(7_000)
  await host.clock.install()
  await host.goto(baseURL!)
  await host.getByLabel('Nickname').fill('Ari')
  await host.getByRole('button',{name:'Create party'}).click()
  await chooseGame(host,'memoryPoker')
  await expect(settingChoice(host,'Memory Poker mode','fan')).toBeChecked()
  await expect(settingChoice(host,'Memory Poker mode','episode')).toBeDisabled()
  const code=(await host.getByTestId('room-code').textContent())!
  const guestWire:string[]=[]
  guest.on('websocket',ws=>ws.on('framereceived',({payload})=>{if(typeof payload==='string'&&payload.includes('snapshot'))guestWire.push(payload)}))
  await guest.goto(baseURL!+'#/join?room='+code)
  await guest.getByLabel('Nickname').fill('Bee')
  await guest.getByRole('button',{name:'Join party'}).click()
  await expect(settingChoice(host,'Memory Poker mode','episode')).toBeEnabled()
  await chooseSetting(host,'Memory Poker mode','episode')
  await expect(settingChoice(guest,'Memory Poker mode','episode')).toBeChecked()
  await expect(tableSwitch(host,'Allow one-card peek (−1 point)')).toHaveCount(0)
  await guest.getByRole('button',{name:'Ready up'}).click()
  await host.getByRole('button',{name:'Start match',exact:true}).click()
  const briefing=host.getByRole('dialog')
  await expect(briefing.getByText('Episode-style duel',{exact:false}).first()).toBeVisible()
  await expect(briefing.getByText(/twenty seconds/i).first()).toBeVisible()
  await time(host,25_000)
  await expect(host.getByRole('timer')).toHaveCount(0)
  await expect(guest.getByRole('timer')).toHaveCount(0)
  await guest.getByLabel('Message',{exact:true}).fill('Ready for the cards.')
  await guest.getByRole('button',{name:'Send',exact:true}).click()
  await expect(host.locator('.messages')).toContainText('Ready for the cards.')
  await briefing.getByRole('button',{name:'Enter match',exact:true}).click()

  await expect(cards(host)).toHaveCount(16)
  await expect(cards(guest)).toHaveCount(16)
  await wholeGrid(host);await wholeGrid(guest)
  await expect(table(guest).getByRole('timer')).toBeInViewport({ratio:1})
  const first=await labels(host)
  expect(first.every(x=>x!==null)).toBe(true)
  expect(await labels(guest)).toEqual(first)
  await expect(table(guest).getByRole('region',{name:'Shared cards'})).toHaveCount(0)
  await time(host,20_100)
  await expect(table(guest).getByRole('heading',{name:'Choose two cards'})).toBeVisible()
  await expect(table(guest).getByRole('region',{name:'Shared cards'}).getByRole('img')).toHaveCount(3)
  expect(await labels(guest)).toEqual(Array(16).fill(null))
  await wholeGrid(guest)
  await cards(host).first().focus()
  await host.keyboard.press('ArrowDown')
  await expect(cards(host).nth(4)).toBeFocused()
  const messagesBeforeLock=guestWire.length
  await choose(host,[0,1])
  await expect(table(host).getByText('Pair locked. Waiting for the reveal.')).toBeVisible()
  await expect(table(guest).getByText('0 / 2 selected')).toBeVisible()
  await expect(table(guest).getByRole('region',{name:'Revealed hands'})).toHaveCount(0)
  expect(guestWire.length).toBe(messagesBeforeLock)
  await choose(guest,[0,1],true)
  for(const page of [host,guest]){
   await expect(table(page).getByRole('heading',{name:'Exact tie'})).toBeVisible()
   await expect(table(page).getByRole('region',{name:'Revealed hands'}).getByRole('img')).toHaveCount(4)
  }
  await time(host,3_600)
  await expect(table(guest).getByText('Deal 2',{exact:true})).toBeVisible()
  await expect(table(host).getByRole('heading',{name:'Memorize the grid'})).toBeVisible()
  const second=(await labels(host)).map(Number)
  expect(second.map(String)).not.toEqual(first)
  await time(host,20_100)
  await expect(table(host).getByRole('heading',{name:'Choose two cards'})).toBeVisible()
  const community=await table(host).getByRole('region',{name:'Shared cards'}).getByRole('img').evaluateAll(els=>els.map(el=>Number(el.getAttribute('data-card'))))
  expect(new Set([...second,...community]).size).toBe(19)
  const [low,high]=extremes(second,community)
  await choose(guest,low,true)
  await expect(table(host).getByText('0 / 2 selected')).toBeVisible()
  await choose(host,high)
  for(const page of [host,guest]){
   await expect(page.getByRole('heading',{name:'Ari wins',exact:true})).toBeVisible()
   await expect(table(page).getByRole('region',{name:'Revealed hands'}).getByRole('img')).toHaveCount(4)
   await expect(table(page).getByRole('group',{name:'Duel card layout'})).toHaveCount(0)
  }
  expect(await guest.evaluate(()=>document.documentElement.scrollWidth)).toBe(360)
  await host.getByRole('button',{name:'Return to lobby'}).click()
  await expect(settingChoice(host,'Memory Poker mode','episode')).toBeChecked()
  await chooseSetting(host,'Memory Poker mode','fan')
  await expect(tableSwitch(host,'Allow one-card peek (−1 point)')).toBeVisible()
 }finally{await desktop.close();await mobile.close()}
})
