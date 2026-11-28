import {expect,test,type Locator,type Page} from '@playwright/test'

async function finger(page:Page,target:Locator){
 await target.scrollIntoViewIfNeeded()
 const {x,y,width,height}=(await target.boundingBox())!
 const point={x:Math.round(x+width/2),y:Math.round(y+height/2)}
 const session=await page.context().newCDPSession(page)
 await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[point]})
 return {end:async()=>{await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await session.detach()},
  scroll:async()=>{await session.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:point.x,y:point.y-85}]})}}
}

test.describe('card controls in a phone viewport',()=>{
 test.use({viewport:{width:390,height:844},isMobile:true,hasTouch:true})
 test.beforeEach(async({page})=>{await page.emulateMedia({reducedMotion:'reduce'})})
 test('hold a cover for the game view; dragging across it does not launch anything',async({page},info)=>{
  await page.goto('./season/2/')
  const cover=page.getByRole('button',{name:'Open Time Auction',exact:true})
  const title=page.getByRole('heading',{name:'Time Auction',exact:true})
  await expect(title).toBeInViewport({timeout:2500})
  await expect(cover).toBeVisible({timeout:2500})
  const swipe=await finger(page,cover)
  await swipe.scroll()
  await page.waitForTimeout(560)
  await swipe.end()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await cover.scrollIntoViewIfNeeded()
  await page.screenshot({path:info.outputPath('cover-library.png')})
  const hold=await finger(page,cover)
  const sheet=page.getByRole('dialog',{name:'Time Auction',exact:true})
  await expect(sheet).toBeVisible({timeout:2500})
  await hold.end()
  await expect(sheet.locator('[data-real-table-preview="auction"] [data-rendered-table="auction"]')).toBeVisible()
  await expect(sheet.getByText('Rules',{exact:true})).not.toBeVisible()
  await sheet.screenshot({path:info.outputPath('cover-sheet.png')})
  await sheet.getByLabel('Rules',{exact:true}).tap()
  await expect(sheet.getByRole('heading',{name:'Rules',exact:true})).toBeVisible()
  await sheet.getByRole('button',{name:'Practice Time Auction',exact:true}).tap()
  await expect(page.getByRole('heading',{name:'Practice lobby'})).toBeVisible()
 })

 test('hold a party card to inspect without changing the current table',async({page})=>{
  await page.goto('./')
  await page.getByLabel('Nickname').fill('Card tester')
  await page.getByRole('button',{name:'Create party',exact:true}).tap()
  await page.getByRole('button',{name:'Choose game',exact:true}).tap()
  const picker=page.getByRole('dialog',{name:'Choose a game'})
  await picker.getByRole('searchbox').fill('Time Auction')
  const card=picker.locator('[data-game-choice="auction"]')
  const hold=await finger(page,card)
  const sheet=page.getByRole('dialog',{name:'Time Auction',exact:true})
  await expect(sheet).toBeVisible({timeout:2500})
  await hold.end()
  await expect(page.locator('[data-party-game]')).toHaveAttribute('data-party-game','blind')
  await sheet.getByRole('button',{name:'Choose Time Auction',exact:true}).tap()
  await expect(picker).toHaveCount(0)
  await expect(page.locator('[data-party-game]')).toHaveAttribute('data-party-game','auction')
 })
})
