import {expect,test} from '@playwright/test'
import {startMatch} from './start-match'
import {chooseGame} from '../lobby-controls'

test.describe('Point Gomoku carved table',()=>{
 test.use({viewport:{width:320,height:640},isMobile:true,hasTouch:true,contextOptions:{reducedMotion:'reduce'}})

 test('read-only sample shows all intersections without live instructions or zoom chrome',async({page})=>{
  await page.goto('./season/3/')
  const card=page.locator('#practice-gallery-point').locator('xpath=ancestor::article')
  await card.locator('.game-cover-hit').tap()
  const sample=page.locator('[data-real-table-preview=point]')
  const table=sample.locator('[data-rendered-table=point]')
  await expect(table.locator('.point-etched-stone')).toHaveCount(4)
  await expect(table.getByText('Your turn',{exact:true})).toHaveCount(0)
  await expect(table.getByText(/Enter to play|Place by coordinates/)).toHaveCount(0)
  await expect(table.locator('.board-camera')).toHaveCount(0)
  await expect(sample.locator('[inert]')).toHaveCount(1)
  await expect(table.locator('.point-bowl')).toHaveCount(2)
  await expect(table.locator('.point-grid-ink')).toBeVisible()
  const window=await sample.locator('.real-table-window').boundingBox()
  const board=await table.locator('.board').boundingBox()
  expect(board!.y).toBeGreaterThanOrEqual(window!.y)
  expect(board!.y+board!.height).toBeLessThanOrEqual(window!.y+window!.height)
  const ruler=await table.locator('.point-score-ruler').boundingBox()
  expect(ruler!.y+ruler!.height).toBeLessThanOrEqual(window!.y+window!.height)
  await expect(table.locator('.board .cell')).toHaveCount(169)
  await expect(table.locator('.board .cell[aria-disabled=true]')).toHaveCount(169)
 })

 test('empty live plate preserves tap geometry, zoom, keyboard and coordinate placement',async({page})=>{
  await page.goto('./season/3/')
  await page.getByRole('button',{name:'Practice Point Gomoku',exact:true}).tap()
  await startMatch(page)
  const table=page.locator('[data-rendered-table=point]')
  await expect(table.locator('.point-bowl')).toHaveCount(2)
  await expect(table.locator('.point-etched-stone')).toHaveCount(0)
  const cells=table.locator('.board .cell')
  await expect(cells).toHaveCount(169)
  const measure=async()=>await cells.first().boundingBox()
  const initial=await measure()
  expect(initial!.width).toBeGreaterThanOrEqual(21.9)
  expect(initial!.height).toBeGreaterThanOrEqual(21.9)
  const face=table.locator('.point-plate')
  await expect(face).toHaveCSS('pointer-events','none')
  // Pixel alignment: the two edge intersections and center agree with real HTML hit centers.
  const off=await table.evaluate(element=>{
   const face=element.querySelector<SVGSVGElement>('.point-plate')!
   return [0,84,168].map(i=>{
    const target=element.querySelectorAll('.board .cell')[i].getBoundingClientRect()
    const p=new DOMPoint(20+(i%13)*40,20+Math.floor(i/13)*40).matrixTransform(face.getScreenCTM()!)
    return Math.max(Math.abs(p.x-target.x-target.width/2),Math.abs(p.y-target.y-target.height/2))
   })
  })
  expect(Math.max(...off)).toBeLessThan(.2)

  await page.getByRole('button',{name:'Board focus',exact:true}).tap()
  await expect(table.locator('.point-grid-ink')).toBeVisible()
  expect((await measure())!.width).toBeGreaterThanOrEqual(initial!.width)
  await table.getByRole('button',{name:'Zoom in'}).tap()
  await expect(table.getByText('125%',{exact:true})).toBeVisible()
  expect((await measure())!.width).toBeGreaterThan(initial!.width*1.2)
  await table.getByRole('button',{name:'Fit board'}).press('Enter')
  await expect(table.getByRole('button',{name:'Zoom in'})).toBeFocused()

  await cells.first().focus()
  await page.keyboard.press('ArrowRight')
  await expect(cells.nth(1)).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(cells.nth(1)).toHaveAttribute('aria-label','Row 1, column 2, Player')
  await expect(cells.nth(1).locator('.placed-piece')).toHaveCSS('animation-name','none')
  await expect(table.getByRole('heading',{name:'Your turn'})).toBeVisible()
  await table.getByText('Place by coordinates',{exact:true}).tap()
  await table.getByLabel('Row',{exact:true}).selectOption({label:'13'})
  await table.getByLabel('Column',{exact:true}).selectOption({label:'13'})
  await table.getByRole('button',{name:'Place stone'}).tap()
  await expect(cells.last()).toHaveAttribute('aria-label','Row 13, column 13, Player')
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(320)
 })
})


test('both room seats paint the same real position and respect the host turn',async({browser,baseURL})=>{
 const hostContext=await browser.newContext({viewport:{width:1280,height:900},reducedMotion:'reduce'})
 const guestContext=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true,reducedMotion:'reduce'})
 try {
  const host=await hostContext.newPage(),guest=await guestContext.newPage()
  await host.goto(baseURL!)
  await host.getByLabel('Nickname').fill('Amber')
  await host.getByRole('button',{name:'Create party'}).click()
  const code=await host.getByTestId('room-code').textContent()
  await chooseGame(host,'point')
  await guest.goto(baseURL!+'#/join?room='+code)
  await guest.getByLabel('Nickname').fill('Ochre')
  await guest.getByRole('button',{name:'Join party'}).tap()
  await guest.getByRole('button',{name:'Ready up'}).tap()
  await startMatch(host)
  const table=(p:typeof host)=>p.locator('[data-rendered-table=point]')
  const cell=(p:typeof host,row:number,col:number)=>table(p).locator('.board .cell').nth((row-1)*13+col-1)
  for(const p of [host,guest]){
   await expect(table(p).locator('.point-grid-ink')).toBeVisible()
   await expect(table(p).locator('.point-etched-stone')).toHaveCount(0)
  }
  await expect(cell(guest,7,7)).toHaveAttribute('aria-disabled','true')
  await cell(host,7,7).click()
  await expect(cell(guest,7,7)).toHaveAttribute('aria-label','Row 7, column 7, Amber')
  await expect(cell(guest,7,8)).toHaveAttribute('aria-disabled','false')
  await cell(guest,7,8).tap()
  for(const p of [host,guest]){
   await expect(cell(p,7,8)).toHaveAttribute('aria-label','Row 7, column 8, Ochre')
   await expect(table(p).locator('.point-etched-stone')).toHaveCount(2)
  }
  // Table crops contain example names and board state, not room link or transport identity.
  await table(host).screenshot({path:test.info().outputPath('point-room-desktop.png'),animations:'disabled'})
  await table(guest).screenshot({path:test.info().outputPath('point-room-mobile.png'),animations:'disabled'})
 }finally{await Promise.allSettled([hostContext.close(),guestContext.close()])}
})
