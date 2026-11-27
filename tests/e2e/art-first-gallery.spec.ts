import {expect,test} from '@playwright/test'

for(const [width,height,columns] of [[320,568,1],[390,844,2],[1440,900,3]]){
 test(`gallery makes the game cover the largest element at ${width}px`,async({page})=>{
  await page.setViewportSize({width,height})
  await page.emulateMedia({reducedMotion:'reduce'})
  await page.goto('./season/2/')
  const cards=page.locator('.featured .card')
  const first=cards.first()
  const art=first.locator('.game-art')
  await expect(art.locator('img')).toBeInViewport()
  await expect(first.locator('.game-venue-badge')).toHaveText('Prison Match')
  await expect(first.locator('.game-venue-place')).toBeHidden()
  await expect(first.locator('p,summary')).toHaveCount(0)
  const [image,card]=await Promise.all([art.boundingBox(),first.boundingBox()])
  expect(image!.width/card!.width).toBeGreaterThan(.95)
  expect(image!.height/card!.height).toBeGreaterThan(.54)
  const practice=first.getByRole('button',{name:'Practice Time Auction',exact:true})
  const details=first.getByRole('button',{name:'Details for Time Auction',exact:true})
  await expect(practice).toBeInViewport({ratio:1})
  for(const action of [practice,details]){
   const box=await action.boundingBox()
   expect(box!.height).toBeGreaterThanOrEqual(44)
   expect(box!.width).toBeGreaterThanOrEqual(44)
  }
  expect(await cards.evaluateAll(nodes=>nodes.filter(node=>Math.abs(node.getBoundingClientRect().top-nodes[0].getBoundingClientRect().top)<1).length)).toBe(columns)
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(width)
 })
}

test('Details keeps the full venue breadcrumb, rule instructions and source link',async({page})=>{
 await page.goto('./season/3/')
 const card=page.locator('.featured .card').filter({has:page.getByRole('heading',{name:'Divine Test',exact:true})})
 await expect(card.locator('.game-venue-badge')).toHaveText('Hidden Stage')
 await card.getByRole('button',{name:'Details for Divine Test',exact:true}).click()
 const dialog=page.getByRole('dialog',{name:'Divine Test',exact:true})
 await expect(dialog.getByText('Season 3 · Exile Zone',{exact:true})).toBeVisible()
 await expect(dialog.getByText(/Arrange the symbolic tiles/)).toBeVisible()
 await expect(dialog.getByRole('link',{name:'Show context reference'})).toBeVisible()
})
