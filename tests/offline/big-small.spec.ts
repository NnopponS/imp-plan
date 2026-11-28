import {expect,test} from '@playwright/test'
import {startMatch} from '../e2e/start-match'

test('Big Small season cover and bot practice remain playable from a saved offline build',async({page,context,baseURL})=>{
 await page.goto(baseURL!)
 await expect(page.getByText('Ready for offline practice.',{exact:true})).toBeVisible({timeout:15000})
 await context.setOffline(true)
 try{
  const replay=await context.newPage()
  await replay.goto(baseURL!+'season/2/')
  const card=replay.getByRole('article').filter({has:replay.getByRole('heading',{name:'Big Small',exact:true})})
  const art=card.locator('img[data-arena-art]')
  await art.scrollIntoViewIfNeeded()
  await expect.poll(()=>art.evaluate((node:HTMLImageElement)=>node.complete&&node.naturalWidth>0)).toBe(true)
  await replay.getByRole('button',{name:'Practice Big Small',exact:true}).click()
  await startMatch(replay)
  const board=replay.getByRole('region',{name:'Big Small table'})
  await board.getByRole('button',{name:'Card 10',exact:true}).click()
  await board.getByRole('button',{name:'Big',exact:true}).click()
  await board.getByRole('button',{name:'Seal card',exact:true}).click()
  await expect(board).toHaveAttribute('data-bs-phase','reveal')
  await expect(board.locator('[data-bs-revealed]')).toHaveAttribute('data-bs-revealed','10')
 }finally{await context.setOffline(false)}
})
