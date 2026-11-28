import {expect,test} from '@playwright/test'
import {startMatch} from '../e2e/start-match'
test('offline Season 3 visit opens the local cabinet, accepts a tray, and plays against a bot',async({page,context,baseURL})=>{
 await page.goto(baseURL!)
 await expect(page.getByText('Ready for offline practice.',{exact:true})).toBeVisible({timeout:20000})
 await context.setOffline(true)
 try{
  const replay=await context.newPage()
  await replay.goto(baseURL!+'season/3/')
  const cover=replay.locator('[data-preview-game="gradation"] img[data-arena-art]')
  await expect(cover).toHaveAttribute('src',/seasonal-gradation\.svg$/)
  await replay.getByRole('button',{name:'Practice Gradation',exact:true}).click()
  await startMatch(replay)
  await replay.getByRole('button',{name:'Fill in ascending order'}).click()
  await replay.getByRole('button',{name:'Seal my tray',exact:true}).click()
  await expect(replay.locator('[data-grad-phase]')).toHaveAttribute('data-grad-phase','reveal')
  const art=await replay.evaluate(async()=>{const r=await fetch('/imp-plan/art/seasonal-gradation.svg');return r.ok&&(await r.text()).includes('The tide cabinet')})
  expect(art).toBe(true)
 }finally{await context.setOffline(false)}
})
