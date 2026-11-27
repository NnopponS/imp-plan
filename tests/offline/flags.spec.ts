import {expect,test} from '@playwright/test'
import {startMatch} from '../e2e/start-match'

test('local flag images survive a new fully offline practice visit',async({page,context,baseURL})=>{
 await page.goto(baseURL!)
 await expect(page.getByText('Ready for offline practice.',{exact:true})).toBeVisible({timeout:15000})
 await context.setOffline(true)
 try{
  const replay=await context.newPage()
  await replay.goto(baseURL!+'season/3/')
  await replay.getByRole('button',{name:'Practice Flags Around the World',exact:true}).click()
  await startMatch(replay)
  const study=replay.locator('[data-fa-study] img')
  await expect(study).toHaveCount(12)
  const urls=await study.evaluateAll(images=>images.map(image=>(image as HTMLImageElement).src))
  expect(new Set(urls).size).toBe(12)
  const loaded=await replay.evaluate(async urls=>await Promise.all(urls.map(async url=>{
   const response=await fetch(url)
   return response.ok&&(await response.text()).includes('<svg')
  })),urls)
  expect(loaded).toEqual(Array(12).fill(true))
 }finally{await context.setOffline(false)}
})
