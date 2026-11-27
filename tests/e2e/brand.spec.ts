import {expect,test} from '@playwright/test'

test('the decorative home seal loads from the same Pages asset as the favicon',async({page})=>{
 await page.setViewportSize({width:320,height:760})
 await page.goto('./')
 const brand=page.getByRole('banner').getByRole('link',{name:'Imp Plan Unofficial fan project',exact:true})
 await expect(brand).toHaveAttribute('href','/imp-plan/')
 const icon=page.locator('link[rel="icon"]')
 const favicon=await icon.getAttribute('href')
 expect(favicon).toMatch(/^\/imp-plan\/.+\.svg$/)
 for(const container of [brand,page.getByRole('contentinfo')]){
  const seal=container.locator('img')
  await expect(seal).toHaveAttribute('src',favicon!)
  await expect(seal).toHaveAttribute('alt','')
  await expect.poll(()=>seal.evaluate(img=>(img as HTMLImageElement).naturalWidth)).toBeGreaterThan(0)
  const size=await seal.boundingBox()
  expect(size?.width).toBeGreaterThanOrEqual(20)
 }
 const row=await brand.boundingBox()
 const badge=await page.getByText('Playable alpha',{exact:true}).boundingBox()
 expect(row!.x+row!.width).toBeLessThanOrEqual(badge!.x)
})
