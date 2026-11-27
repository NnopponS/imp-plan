import {readFile} from 'node:fs/promises'
import {chooseGame} from '../lobby-controls'
import {expect,test,type Locator} from '@playwright/test'
import {countRectangles} from '../../src/puzzles'
import {startMatch} from './start-match'

async function hasTouchTarget(button:Locator){
 await expect(button).toBeVisible()
 await expect(button.locator('svg[aria-hidden="true"]')).toBeVisible()
 const bounds=await button.boundingBox()
 expect(bounds!.width).toBeGreaterThanOrEqual(44)
 expect(bounds!.height).toBeGreaterThanOrEqual(44)
}

test('320px puzzle earns four counted seals, exports the result by touch and rematches by key',async({browser,baseURL})=>{
 const phone=await browser.newContext({viewport:{width:320,height:650},hasTouch:true,reducedMotion:'reduce'})
 try{
  const page=await phone.newPage()
  await page.goto(baseURL!)
  await page.getByRole('button',{name:'Practice Count the Rectangles'}).tap()
  await startMatch(page)
  for(let n=1;n<=4;n++){
   await expect(page.getByText('Grid '+n+' / 4')).toBeVisible()
   const tiles=page.getByRole('group',{name:'Rectangle grid'}).getByRole('button')
   const values=(await tiles.allTextContents()).map(Number)
   const target=Number(await page.locator('.puzzle-target strong').textContent())
   await page.getByLabel('Rectangle count').fill(String(countRectangles(values,3+n,Math.max(5,3+n),target)))
   await page.getByRole('button',{name:'Lock answer'}).tap()
  }
  await expect(page.getByRole('heading',{name:'Practice complete'})).toBeVisible()
  const scores=page.getByRole('list',{name:'Score record'})
  await expect(scores.getByText('4 correct')).toBeVisible()
  await expect(scores.locator('[data-correct=true]')).toHaveCount(4)
  const record=page.getByRole('region',{name:'Match record'})
  await expect(record.locator('[data-match-seal=complete]')).toBeVisible()
  const exportButton=record.getByRole('button',{name:'Export result',exact:true})
  await hasTouchTarget(exportButton)
  const downloaded=page.waitForEvent('download')
  await exportButton.tap()
  const file=await downloaded
  expect(file.suggestedFilename()).toBe('mind-arena-result.json')
  expect(JSON.parse(await readFile((await file.path())!,'utf8')).scores).toEqual([{name:'Player',points:4}])
  const rematch=record.getByRole('button',{name:'Rematch',exact:true})
  await hasTouchTarget(rematch)
  await hasTouchTarget(record.getByRole('button',{name:'Return to lobby',exact:true}))
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(320)
  await record.scrollIntoViewIfNeeded()
  await page.screenshot({path:test.info().outputPath('record-puzzle-320.png')})
  await rematch.press('Enter')
  await expect(page.getByText('Grid 1 / 4')).toBeVisible()
 }finally{await phone.close()}
})

test('844×390 Point Gomoku marks live, winning, draw and paused states from actual two-seat play',async({browser,baseURL})=>{
 const desk=await browser.newContext({viewport:{width:1280,height:900},reducedMotion:'reduce'})
 const phone=await browser.newContext({viewport:{width:844,height:390},hasTouch:true,reducedMotion:'reduce'})
 try{
  const host=await desk.newPage(),guest=await phone.newPage()
  await host.goto(baseURL!)
  await host.getByLabel('Nickname').fill('Captain Amber')
  await host.getByRole('button',{name:'Create party'}).click()
  const code=(await host.getByTestId('room-code').textContent())!
  await chooseGame(host,'point')
  await guest.goto(baseURL!+'#/join?room='+code)
  await guest.getByLabel('Nickname').fill('Guest Ochre')
  await guest.getByRole('button',{name:'Join party'}).tap()
  await guest.getByRole('button',{name:'Ready up'}).tap()
  await startMatch(host)
  await expect(host.getByRole('heading',{name:'Your turn'}).locator('[data-round-mark=move]')).toBeVisible()
  await expect(guest.getByRole('heading',{name:'Captain Amber’s turn'}).locator('[data-round-mark=wait]')).toBeVisible()
  await guest.getByRole('list',{name:'Point Gomoku scores'}).screenshot({path:test.info().outputPath('point-scoreboard-844.png')})
  const place=(p:typeof host,r:number,c:number)=>p.getByRole('button',{name:`Row ${r}, column ${c}, open`,exact:true})
  for(let n=0;n<20;n++){
   const home=place(host,n<13?1:2,n<13?n+1:n-12)
   await expect(home).toHaveAttribute('aria-disabled','false')
   await home.click()
   const away=place(guest,5+Math.floor(n/5)*2,n%5*2+1)
   await expect(away).toHaveAttribute('aria-disabled','false')
   await away.tap()
  }
  for(const p of [host,guest]){
   await expect(p.getByRole('heading',{name:'Captain Amber wins'})).toBeVisible()
   const scoreboard=p.getByRole('list',{name:'Point Gomoku scores'})
   const rows=scoreboard.getByRole('listitem')
   await expect(rows.filter({hasText:'Captain Amber'})).toContainText('16 pts')
   await expect(rows.filter({hasText:'Guest Ochre'})).toContainText('0 pts')
   await expect(p.getByRole('region',{name:'Match record'}).locator('[data-match-seal=win]')).toBeVisible()
  }
  const guestResult=guest.getByRole('region',{name:'Match record'})
  await expect(guestResult.getByRole('button',{name:/rematch|return to lobby/i})).toHaveCount(0)
  await hasTouchTarget(guestResult.getByRole('button',{name:'Export result',exact:true}))
  expect(await guest.evaluate(()=>document.documentElement.scrollWidth)).toBe(844)
  await guestResult.scrollIntoViewIfNeeded()
  await guest.screenshot({path:test.info().outputPath('record-points-844.png')})
  await host.getByRole('region',{name:'Match record'}).getByRole('button',{name:'Return to lobby',exact:true}).press('Enter')
  await guest.getByRole('button',{name:'Ready up'}).tap()
  await startMatch(host)
  for(let n=0;n<20;n++){
   const row=1+Math.floor(n/5)*3,col=n%5*2+1
   const home=place(host,row,col),away=place(guest,row+1,col+1)
   await expect(home).toHaveAttribute('aria-disabled','false')
   await home.click()
   await expect(away).toHaveAttribute('aria-disabled','false')
   await away.tap()
  }
  for(const p of [host,guest]){
   const record=p.getByRole('region',{name:'Match record'})
   await expect(record.getByText('Draw',{exact:true})).toBeVisible()
   await expect(record.locator('[data-match-seal=draw]')).toBeVisible()
   await expect(p.getByRole('list',{name:'Point Gomoku scores'}).getByText('0 pts',{exact:true})).toHaveCount(2)
  }
  await host.getByRole('button',{name:'Rematch',exact:true}).press('Enter')
  await expect(guest.getByRole('heading',{name:'Your turn',exact:true})).toBeVisible()
  await host.getByRole('button',{name:'Leave room'}).click()
  await expect(guest.getByRole('heading',{name:'Controls paused'}).locator('[data-round-mark=paused]')).toBeVisible()
  await expect(guest.getByText('The host ended this room.')).toBeVisible()
 }finally{await Promise.allSettled([desk.close(),phone.close()])}
})
