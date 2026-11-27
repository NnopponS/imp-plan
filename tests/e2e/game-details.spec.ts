import {expect,test} from '@playwright/test'

test('the home keyboard Details button alone opens Blind Gomoku mechanics and rules',async({page})=>{
 await page.emulateMedia({reducedMotion:'no-preference'})
 await page.goto('./')
 const card=page.locator('.card').filter({has:page.getByRole('heading',{name:'Blind Gomoku',exact:true})})
 const details=card.getByRole('button',{name:'Details for Blind Gomoku',exact:true})
 await expect(card.getByRole('button',{name:'Practice Blind Gomoku',exact:true})).toBeVisible()
 await expect(page.locator('[data-game-preview]')).toHaveCount(0)
 await expect(details).toBeVisible()
 await details.focus()
 await page.keyboard.press('Enter')
 const dialog=page.getByRole('dialog',{name:'Blind Gomoku',exact:true})
 const preview=dialog.locator('[data-game-preview="blind"]')
 await expect(preview).toBeVisible()
 expect(await preview.evaluate(node=>node.getAnimations({subtree:true}).some(animation=>animation.playState==='running'))).toBe(true)
 await expect(dialog.getByRole('heading',{name:'Rules',exact:true})).toBeVisible()
 await expect(dialog.getByText(/Choose any cover/)).toBeVisible()
 await page.keyboard.press('Escape')
 await expect(dialog).toHaveCount(0)
 await expect(details).toBeFocused()
})

test('a 320px season visitor taps Details and gets a static mechanic under reduced motion',async({browser})=>{
 const context=await browser.newContext({viewport:{width:320,height:720},hasTouch:true,isMobile:true,reducedMotion:'reduce'})
 try{
  const page=await context.newPage()
  await page.goto('./season/2/')
  await page.getByRole('button',{name:'Details for Wall Go',exact:true}).tap()
  const dialog=page.getByRole('dialog',{name:'Wall Go',exact:true})
  const scene=dialog.locator('[data-game-preview="wallGo"]')
  await expect(scene).toBeVisible()
  expect(await scene.evaluate(node=>node.getAnimations({subtree:true}).every(animation=>animation.playState!=='running'))).toBe(true)
  expect(await dialog.evaluate(node=>node.scrollWidth<=node.clientWidth)).toBe(true)
  await expect(dialog.getByText(/Pick a square, then a marked edge/)).toBeVisible()
  await dialog.getByRole('button',{name:'Close details',exact:true}).tap()
  await expect(dialog).toHaveCount(0)
  await expect(page.getByRole('button',{name:'Practice Wall Go',exact:true})).toBeVisible()
 }finally{await context.close()}
})

test('the playable catalog also finds original-name aliases and either apostrophe style',async({page})=>{
 await page.goto('./')
 const search=page.getByRole('searchbox',{name:'Find playable games'})
 for(const [alias,title] of [['Trial of God','Divine Test'],['Equation Traffic Light','Equation Lights'],["Knight's Tour",'Knight’s Tour']]){
  await search.fill(alias)
  await expect(page.locator('.featured').getByRole('heading',{name:title,exact:true})).toBeVisible()
  await expect(page.locator('.featured .card')).toHaveCount(1)
 }
})
