import {startMatch} from './start-match'
import {test,expect} from '@playwright/test'
test('Balance Mancala starts with a bot, completes setup and supports previewing and sowing a pit',async({page})=>{
 await page.goto('./season/2/')
 await page.getByLabel('Nickname').fill('Sower')
 await page.getByRole('button',{name:/Practice Balance Mancala/}).click()
 await expect(page.getByText('Bot 1',{exact:true})).toBeVisible()
 await startMatch(page)
 const pits=page.getByRole('group',{name:'Mancala pits'})
 await expect(pits.getByRole('button')).toHaveCount(9)
 for(let i=0;i<4;i++){
  await pits.locator('button:enabled').first().click()
  await page.getByRole('button',{name:'Place stone'}).click()
 }
 await expect(page.getByText('Sowing round 1 / 12')).toBeVisible()
 await pits.locator('button:enabled').first().click()
 await expect(page.getByText(/Last stone:.*pit/)).toBeVisible()
 await page.getByRole('button',{name:'Sow selected pit'}).click()
 await expect(page.getByText(/Last landing: pit/)).toBeVisible()
})
test('Count the Cubes uses three angles and inspectable layers, accepts five answers on a phone',async({page})=>{
 await page.setViewportSize({width:390,height:844})
 await page.goto('./season/3/')
 await page.getByLabel('Nickname').fill('Counter')
 await page.getByRole('button',{name:/Practice Count the Cubes/}).click()
 await startMatch(page)
 for(let i=1;i<=5;i++){
  await expect(page.getByText('Stack '+i+' / 5')).toBeVisible()
  await page.getByRole('button',{name:'Back',exact:true}).click()
  await expect(page.getByRole('img',{name:/Isometric cube/})).toBeVisible()
  await page.getByRole('button',{name:'Layers',exact:true}).click()
  let count=0
  for(const n of [1,2,3,4]){
   await page.getByLabel('Layer',{exact:true}).selectOption(String(n))
   count+=await page.getByRole('group',{name:'Layer '+n+' occupancy'}).getByRole('img',{name:/: occupied$/}).count()
  }
  await page.getByLabel('Cube count').fill(String(count))
  await page.getByRole('button',{name:'Lock answer'}).click()
 }
 await expect(page.getByText('5 correct')).toBeVisible()
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(390)
})
