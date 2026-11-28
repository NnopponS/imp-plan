import {expect,test} from '@playwright/test'
import {startMatch} from '../e2e/start-match'

test('the hidden-word boot shell, cover, stage and actual play load from a fresh offline tab',async({page,context,baseURL})=>{
 await page.goto(baseURL!)
 await expect(page.getByText('Ready for offline practice.',{exact:true})).toBeVisible({timeout:25000})
 await context.setOffline(true)
 try{
  const offline=await context.newPage()
  await offline.clock.install()
  await offline.goto(baseURL!+'season/3/')
  await offline.getByRole('button',{name:'Practice Hidden Word',exact:true}).click()
  await expect(offline.getByRole('textbox',{name:'Nickname'})).toHaveCount(0)
  const art=offline.locator('[data-party-game="hiddenWord"] img[data-arena-art]')
  await expect.poll(()=>art.evaluate((img:HTMLImageElement)=>img.complete&&img.naturalWidth>0)).toBe(true)
  await startMatch(offline)
  const table=offline.getByRole('region',{name:'Hidden Word table'})
  await expect(table).toHaveAttribute('data-word-phase','choose')
  await expect.poll(()=>table.locator('img[src$="hidden-word-stage.svg"]').evaluate((img:HTMLImageElement)=>img.complete&&img.naturalWidth>0)).toBe(true)
  await table.getByRole('group',{name:'Private envelope'}).getByRole('button').first().click()
  await offline.clock.fastForward(950)
  await expect(table).toHaveAttribute('data-word-phase','clue')
  const clues=table.getByRole('group',{name:'Private clue options'})
  if(await clues.count())await clues.getByRole('button').first().click()
  else await offline.clock.fastForward(950)
  await expect(table).toHaveAttribute('data-word-phase','guess')
  await expect(table).toContainText('95%')
 }finally{await context.setOffline(false)}
})
