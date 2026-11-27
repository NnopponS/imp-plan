import {expect,test} from '@playwright/test'

test('at 320 pixels the optional portrait comes before the room form, without widening the page',async({page})=>{
 await page.setViewportSize({width:320,height:690})
 await page.goto('./')
 const warmup=page.getByRole('region',{name:'Player wardrobe'})
 const form=page.locator('#room-entry')
 const [board,entry]=await Promise.all([warmup.boundingBox(),form.boundingBox()])
 expect(board).not.toBeNull()
 expect(entry).not.toBeNull()
 expect(board!.y+board!.height).toBeLessThanOrEqual(entry!.y)
 await expect(warmup.getByRole('img',{name:/Your avatar/})).toBeVisible()
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(320)
})

test('narrow ivory briefing keeps its action visible and its rules readable on hover',async({page})=>{
 await page.setViewportSize({width:320,height:690})
 await page.emulateMedia({reducedMotion:'reduce'})
 await page.goto('./')
 await page.getByLabel('Nickname').fill('Knight')
 await page.getByRole('button',{name:'Practice Blind Gomoku',exact:true}).click()
 await page.getByRole('button',{name:'Start match',exact:true}).click()
 const modal=page.getByRole('dialog',{name:'Blind Gomoku'})
 await expect(modal.getByRole('button',{name:'Enter match',exact:true})).toBeInViewport({ratio:1})
 const steps=modal.locator('.brief-theater-rules button')
 for(const i of [0,1]){
  const step=steps.nth(i)
  await step.hover()
  const contrast=await step.evaluate(button=>{
   const css=getComputedStyle(button)
   const luminance=(value:string)=>value.match(/[\d.]+/g)!.slice(0,3).map(Number).reduce((sum,raw,i)=>{
    const c=raw/255
    const linear=c<=0.04045?c/12.92:((c+0.055)/1.055)**2.4
    return sum+linear*[0.2126,0.7152,0.0722][i]
   },0)
   const ink=luminance(css.color),surface=luminance(css.backgroundColor)
   return (Math.max(ink,surface)+0.05)/(Math.min(ink,surface)+0.05)
  })
  expect(contrast,'briefing rule '+(i+1)+' contrast on hover').toBeGreaterThanOrEqual(4.5)
 }
 await expect(modal.getByRole('button',{name:'Enter match',exact:true})).toBeInViewport({ratio:1})
})
