import {expect,test} from '@playwright/test'
import {startMatch} from '../e2e/start-match'

test('Triple Dice artwork and accountless practice survive a fresh production offline tab',async({page,context,baseURL})=>{
 await page.goto(baseURL!)
 await expect(page.getByText('Ready for offline practice.',{exact:true})).toBeVisible({timeout:15000})
 await context.setOffline(true)
 try{
  const offline=await context.newPage()
  await offline.goto(baseURL!+'season/2/')
  await offline.getByRole('button',{name:'Practice Triple Dice',exact:true}).click()
  await expect(offline.getByRole('textbox',{name:'Nickname'})).toHaveCount(0)
  const art=offline.locator('[data-party-game="tripleDice"] img[data-arena-art]')
  await expect.poll(()=>art.evaluate((img:HTMLImageElement)=>img.complete&&img.naturalWidth>0)).toBe(true)
  await startMatch(offline)
  const table=offline.getByRole('region',{name:'Triple Dice table'})
  await expect(table).toContainText('Round 1 / 8')
  for(const i of [0,1,3])await table.locator('[data-dice-slot="'+i+'"]').click()
  await table.getByRole('button',{name:'Seal three dice',exact:true}).click()
  await expect(table.getByRole('list',{name:'Round settlement'})).toBeVisible()
 }finally{await context.setOffline(false)}
})
