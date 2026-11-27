import {expect,test} from '@playwright/test'

test('an unopened game does not download its board code on the gallery route',async({page})=>{
 const boardRequests:string[]=[]
 page.on('request',request=>{
  const path=new URL(request.url()).pathname
  if(/(?:scale-ui|tower-ui)\.(?:tsx|js)$|\/(?:scale-ui|tower-ui)-[^/]+\.js$/.test(path))boardRequests.push(path)
 })
 await page.goto('./')
 await expect(page.getByRole('button',{name:'Practice Scale Game',exact:true})).toBeVisible()
 expect(boardRequests).toEqual([])
 await page.getByRole('button',{name:'Practice Scale Game',exact:true}).click()
 await expect.poll(()=>boardRequests.some(path=>path.includes('scale-ui'))).toBe(true)
 expect(boardRequests.every(path=>path.includes('scale-ui'))).toBe(true)
 await page.getByRole('button',{name:'Start match',exact:true}).click()
 await page.getByRole('button',{name:'Enter match',exact:true}).click()
 await page.getByRole('button',{name:'Add Brass to Left pan',exact:true}).click()
 await page.getByRole('button',{name:/Right pan, 0 of 6 placed/}).click()
 await page.getByRole('button',{name:'Add Jade to Right pan',exact:true}).click()
 await page.getByRole('button',{name:'Weigh minerals',exact:true}).click()
 await expect(page.getByText('1 / 12 weighings', {exact:true})).toBeVisible()
})
