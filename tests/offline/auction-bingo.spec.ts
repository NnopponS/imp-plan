import {expect,test} from '@playwright/test'
import {startMatch} from '../e2e/start-match'

test('cached artwork, lesson and bid controls run from a fresh production offline tab',async({page,context,baseURL})=>{
 await page.goto(baseURL!)
 await expect(page.getByText('Ready for offline practice.',{exact:true})).toBeVisible({timeout:20000})
 await context.setOffline(true)
 try{
  const offline=await context.newPage()
  await offline.goto(baseURL!+'season/3/')
  await offline.getByRole('button',{name:'Practice Auction Bingo',exact:true}).click()
  const art=offline.locator('[data-party-game="auctionBingo"] img[data-arena-art]')
  await expect.poll(()=>art.evaluate((img:HTMLImageElement)=>img.complete&&img.naturalWidth>0)).toBe(true)
  await startMatch(offline)
  const table=offline.getByRole('region',{name:'Auction Bingo table'})
  await expect(table.getByRole('timer')).toHaveAccessibleName(/Shape tickets/)
  await table.getByRole('button',{name:'Triangle',exact:true}).click()
  await table.getByRole('button',{name:'Seal shape'}).click()
  await expect(table).toHaveAttribute('data-bingo-phase','bid')
  await table.locator('[data-coin-index="4"]').click()
  await table.getByRole('button',{name:/^Seal bid/}).click()
  await expect(table.getByRole('list',{name:'Round clearing prices'})).toBeVisible()
 }finally{await context.setOffline(false)}
})
