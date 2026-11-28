import {expect,test} from '@playwright/test'
import {startMatch} from '../e2e/start-match'

test('Wall Go II opens from cached mobile art and plays an accountless three-seat practice',async({page,context,baseURL},testInfo)=>{
 await page.goto(baseURL!)
 await expect(page.getByText('Ready for offline practice.',{exact:true})).toBeVisible({timeout:15000})
 await context.setOffline(true)
 try{
  const offline=await context.newPage()
  await offline.setViewportSize({width:360,height:790})
  await offline.goto(baseURL!+'season/3/')
  const card=offline.locator('article').filter({has:offline.getByRole('heading',{name:'Wall Go II',exact:true})})
  await card.scrollIntoViewIfNeeded()
  await expect.poll(()=>card.locator('img[data-arena-art]').evaluate((img:HTMLImageElement)=>img.complete&&img.naturalWidth>0&&img.currentSrc.endsWith('wall-go2-chamber-mobile.svg'))).toBe(true)
  await card.getByRole('button',{name:'Practice Wall Go II',exact:true}).click()
  await expect(offline.getByRole('textbox',{name:'Nickname'})).toHaveCount(0)
  await offline.getByRole('button',{name:'Add bot'}).click()
  await startMatch(offline)
  const table=offline.getByRole('region',{name:'Wall Go II territory board'})
  await expect(table.getByText('Breach ready')).toHaveCount(3)
  await table.getByRole('button',{name:'○ Round',exact:true}).click()
  await table.locator('[data-cell="0"]').click()
  await expect(table).toHaveAttribute('data-step','5',{timeout:12000})
  await table.locator('[data-draft]').first().click()
  await expect(table).toHaveAttribute('data-step','6')
  await table.locator('[data-source]').first().click()
  await table.locator('[data-destination]').first().click()
  await table.locator('.w2-board-frame').screenshot({path:testInfo.outputPath('mobile-board.png')})
  await table.getByRole('group',{name:'Wall edges'}).getByRole('button').first().click()
  await expect(table.locator('.w2-wall').first()).toBeVisible()
  expect(await offline.evaluate(()=>document.documentElement.scrollWidth)).toBe(360)
 }finally{await context.setOffline(false)}
})
