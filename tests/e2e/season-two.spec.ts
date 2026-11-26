import {startMatch} from './start-match'
import {test,expect} from '@playwright/test'
test('Remove One solo discards, reveals and ends against two bots',async({page})=>{
 await page.goto('./season/2/')
 await page.getByLabel('Nickname').fill('Player')
 await page.getByRole('button',{name:/Practice Remove One/}).click()
 await expect(page.getByText('Bot 2',{exact:true})).toBeVisible()
 await startMatch(page)
 for(let round=1;round<=11;round++){
  if(await page.getByRole('button',{name:'Rematch'}).isVisible())break
  const label=round>8?`Round ${round} · Tiebreak`:`Round ${round} / 8`
  await expect(page.getByText(label,{exact:true}).or(page.getByRole('button',{name:'Rematch'}))).toBeVisible()
  if(await page.getByRole('button',{name:'Rematch'}).isVisible())break
  await page.getByRole('button',{name:/Discard \d+, card 1/}).click()
 }
 await expect(page.getByRole('button',{name:'Rematch'})).toBeVisible()
 await expect(page.getByText(/wins 2 chips|no unique card/)).toBeVisible()
})
test('Knight’s Tour solo uses no bots, supports keyboard moves and undo',async({page})=>{
 await page.setViewportSize({width:390,height:844})
 await page.goto('./season/2/')
 await page.getByLabel('Nickname').fill('Player')
 await page.getByRole('button',{name:/Practice Knight/}).click()
 await expect(page.getByText('Bot 1',{exact:true})).toHaveCount(0)
 await page.getByLabel('Board size').selectOption('6')
 await page.getByLabel('Closed tour').check()
 await startMatch(page)
 await expect(page.getByText('6 × 6 · Closed tour')).toBeVisible()
 const move=page.getByRole('button',{name:/legal move/}).first()
 await move.focus();await page.keyboard.press('Enter')
 await expect(page.getByText(/2 \/ 36 visited/)).toBeVisible()
 await page.getByRole('button',{name:'Undo step'}).click()
 await expect(page.getByText(/1 \/ 36 visited/)).toBeVisible()
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(390)
})
