import {expect,test} from '@playwright/test'

test('the first offline Home can show and dismiss its cached book opening',async({page,context})=>{
 await page.goto('./')
 await expect(page.getByText('Ready for offline practice.',{exact:true})).toBeVisible({timeout:10000})
 // A fresh browser profile could have a cached release but no intro preference.
 await page.evaluate(()=>localStorage.removeItem('imp-plan-sixteen-seats-v1'))
 await context.setOffline(true)
 const reopened=await context.newPage()
 const response=await reopened.goto('./')
 expect(response?.fromServiceWorker()).toBe(true)
 const intro=reopened.locator('.codex-entry')
 await expect(intro).toBeVisible()
 await intro.locator('img').evaluate((image:HTMLImageElement)=>image.decode())
 await reopened.getByRole('button',{name:'Skip intro'}).click()
 await expect(intro).toHaveCount(0)
 await expect(reopened.getByRole('heading',{name:'Imp Plan',exact:true})).toBeVisible()
 await reopened.reload()
 await expect(intro).toHaveCount(0)
 await reopened.getByRole('button',{name:'Solo practice',exact:true}).click()
 await expect(reopened.getByRole('heading',{name:'Practice lobby',exact:true})).toBeVisible()
})
