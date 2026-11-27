import {startMatch} from './start-match'
import {test,expect} from '@playwright/test'
import {towerPacks} from '../../src/tower'
const signature=(s:string)=>s.split('').sort().join('')
function solve(pack:readonly string[],letters:string,n:number,i=0,chosen:string[]=[]):string[]|null{
 if(chosen.length===n)return signature(chosen.join(''))===signature(letters)?chosen:null
 for(let j=i;j<=pack.length-(n-chosen.length);j++){
  const found=solve(pack,letters,n,j+1,[...chosen,pack[j]])
  if(found)return found
 }
 return null
}
test('Word Tower passes control between two browsers and clears a complete tower',async({browser,baseURL})=>{
 const desktop=await browser.newContext(),mobile=await browser.newContext({viewport:{width:360,height:780},hasTouch:true})
 try{
  const host=await desktop.newPage(),guest=await mobile.newPage()
  await host.goto(baseURL!+'season/1/')
  await host.getByLabel('Nickname').fill('Ari')
  await host.getByRole('button',{name:'Create party'}).click()
  const code=(await host.getByTestId('room-code').textContent())!
  await host.getByLabel('Game').selectOption('tower')
  await guest.goto(baseURL!+'#/join?room='+code)
  await guest.getByLabel('Nickname').fill('Bee')
  await guest.getByRole('button',{name:'Join party'}).click()
  await guest.getByRole('button',{name:'Ready up'}).click()
  await startMatch(host)
  const board=(page:typeof host)=>page.getByRole('region',{name:'Word Tower workshop'})
  const tray=(page:typeof host)=>board(page).getByLabel('Letter tray')
  const theme=(await board(host).getByText(/3 words · /).innerText()).split(' · ')[1] as keyof typeof towerPacks
  const letters=(await tray(host).getByRole('button').allTextContents()).join('').replace(/\s/g,'')
  expect(await solve(towerPacks[theme],letters,3)).not.toBeNull()
  const words=solve(towerPacks[theme],letters,3)!
  const plan=words.flatMap((word,col)=>[...word].map(letter=>({col:col+1,letter})))
  await expect(board(host).getByText('One possible solution')).toHaveCount(0)
  for(let i=0;i<plan.length;i+=2){
   const page=(i/2)%2?guest:host,idle=page===host?guest:host
   await expect(board(page).getByRole('status')).toContainText('Your turn')
   await expect(board(idle).getByRole('button',{name:'Pass turn'})).toBeDisabled()
   for(const {col,letter} of plan.slice(i,i+2)){
    const tile=tray(page).locator(`[data-letter="${letter}"]`).first()
    const target=board(page).getByRole('button',{name:'Add to column '+col,exact:true})
    const id=await tile.getAttribute('data-tile')
    if(page===guest){await tile.tap();await target.tap()}else{await tile.press('Enter');await target.press('Enter')}
    await expect(tray(idle).locator(`[data-tile="${id}"]`)).toBeVisible()
   }
   await board(page).getByRole('button',{name:'Commit turn'}).click()
  }
  for(const page of [host,guest]){
   await expect(page.getByRole('heading',{name:'Tower cleared'})).toBeVisible()
   await expect(board(page).getByRole('status')).toContainText('3 / 3 words')
   await expect(board(page).getByText('One possible solution')).toBeVisible()
   await expect(tray(page).getByText('Tray empty.')).toBeVisible()
  }
  expect(await guest.evaluate(()=>document.documentElement.scrollWidth)).toBe(360)
 }finally{await desktop.close();await mobile.close()}
})

test('Word Tower reflows its playable rack, columns, and compact help without losing a draft',async({page})=>{
 await page.setViewportSize({width:320,height:568})
 await page.goto('./season/1/')
 await page.getByLabel('Nickname').fill('Ari')
 await page.getByRole('button',{name:'Practice Word Tower'}).click()
 await startMatch(page)

 const board=page.getByRole('region',{name:'Word Tower workshop'})
 const tray=board.getByLabel('Letter tray')
 const first=tray.getByRole('button').first()
 const firstTile=await first.getAttribute('data-tile')
 const column=board.getByRole('region',{name:'Word column 1'})
 const add=board.getByRole('button',{name:'Add to column 1',exact:true})
 const help=board.getByText('How to play',{exact:true})
 await expect(board.getByRole('button',{name:'Pass turn'})).toBeInViewport({ratio:1})
 await expect(help).toBeVisible()
 await expect(board.getByText(/Read each word from top to bottom/)).not.toBeVisible()
 await help.press('Enter')
 await expect(board.getByText(/Read each word from top to bottom/)).toBeVisible()
 await help.press('Enter')
 await first.press('Enter')
 await add.press('Enter')
 await expect(column.locator('[data-tile="'+firstTile+'"]')).toBeVisible()
 await expect(board.getByRole('status')).toContainText('1 / 2 edits staged')

 for(const [width,height] of [[320,568],[390,844],[844,390],[1440,900]]){
  await page.setViewportSize({width,height})
  await page.evaluate(()=>window.scrollTo(0,0))
  const rackBox=(await tray.boundingBox())!,columnBox=(await column.boundingBox())!
  if(width<700)expect(rackBox.y+rackBox.height).toBeLessThan(columnBox.y)
  else {
   expect(rackBox.x+rackBox.width).toBeLessThan(columnBox.x)
   expect(rackBox.y).toBeLessThan(columnBox.y+columnBox.height)
   expect(rackBox.y+rackBox.height).toBeGreaterThan(columnBox.y)
  }
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(width)
  await expect(board.getByRole('button',{name:'Commit turn'})).toBeInViewport({ratio:1})
  if(width===844)await expect(add).toBeInViewport({ratio:1})
 }
 await board.getByRole('button',{name:'Clear edits'}).press('Enter')
 await expect(tray.locator('[data-tile="'+firstTile+'"]')).toBeVisible()
 await expect(board.getByRole('button',{name:'Pass turn'})).toBeEnabled()
})

test('Word Tower shows the committed board when time expires with edits pending',async({page})=>{
 await page.clock.install({time:new Date('2026-08-15T12:00:00Z')})
 await page.goto('./season/1/')
 await page.getByLabel('Nickname').fill('Ari')
 await page.getByRole('button',{name:'Practice Word Tower'}).click()
 await startMatch(page)
 const board=page.getByRole('region',{name:'Word Tower workshop'})
 const tray=board.getByLabel('Letter tray')
 const tile=tray.getByRole('button').first()
 const id=await tile.getAttribute('data-tile')
 await tile.click()
 await board.getByRole('button',{name:'Add to column 1',exact:true}).click()
 await expect(board.getByRole('status')).toContainText('1 / 2 edits staged')
 await expect(tray.locator(`[data-tile="${id}"]`)).toHaveCount(0)
 await page.clock.fastForward(240_500)
 await expect(board.getByRole('heading',{name:'Tower closed'})).toBeVisible()
 await expect(board.getByRole('status')).toContainText('0 / 3 words')
 await expect(tray.locator(`[data-tile="${id}"]`)).toBeVisible()
})

test('stacks do not push the Add buttons off a short landscape display',async({page})=>{
 await page.setViewportSize({width:844,height:390})
 await page.goto('./season/1/')
 await page.getByRole('button',{name:'Practice Word Tower'}).click()
 await startMatch(page)
 const stage=page.getByRole('region',{name:'Word Tower workshop'})
 const add=stage.getByRole('button',{name:'Add to column 1',exact:true})
 const tray=stage.getByLabel('Letter tray')
 const check=async()=>{
  await page.evaluate(()=>window.scrollTo(0,0))
  for(const action of await stage.getByRole('button',{name:/^Add to column/}).all())await expect(action).toBeInViewport({ratio:1})
 }
 for(let i=0;i<2;i++){await tray.getByRole('button').first().click();await add.click()}
 await expect(stage.getByRole('status')).toContainText('2 / 2 edits staged')
 await check()
 await stage.getByRole('button',{name:'Commit turn',exact:true}).click()
 await expect(stage.getByRole('status')).toContainText('Your turn.')
 await tray.getByRole('button').first().click()
 await add.click()
 const stack=stage.getByRole('region',{name:'Word column 1'}).locator('.tower-stack')
 expect(await stack.evaluate(el=>el.scrollHeight>el.clientHeight)).toBe(true)
 await check()
})
