import {test,expect,type Page} from '@playwright/test'

async function lobby(page:Page){
 await page.goto('./')
 await page.getByLabel('Nickname').fill('Visitor')
 await page.getByRole('button',{name:'Practice Blind Gomoku',exact:true}).click()
 await expect(page.getByRole('heading',{name:'Practice lobby'})).toBeVisible()
}
async function open(page:Page){
 await page.getByRole('button',{name:'Start match',exact:true}).click()
 const story=page.getByRole('dialog')
 await expect(story).toHaveCount(1)
 return story
}

test('Secret Chamber controls do not wait on an animated entrance',async({page})=>{
 await page.setViewportSize({width:390,height:844})
 await lobby(page)
 const story=await open(page)
 const skip=story.getByRole('button',{name:/skip/i})
 await expect(skip).toBeAttached()
 expect(await skip.isEnabled()).toBe(true)
 await expect(page.getByLabel('Blind Gomoku board')).toHaveCount(0)
 await page.keyboard.press('Escape')
 await expect(story).toHaveCount(0)
 await expect(page.getByRole('button',{name:'Start match',exact:true})).toBeFocused()
 await expect(page.getByLabel('Blind Gomoku board')).toHaveCount(0)
 await open(page)
 await skip.press('Enter')
 await expect(story.getByRole('region',{name:'Secret Chamber'})).toHaveCount(0)
 await expect(page.getByLabel('Blind Gomoku board')).toHaveCount(0)
 await expect(story.getByRole('button',{name:'Enter match',exact:true})).toBeInViewport({ratio:1})
 await story.getByRole('button',{name:'Enter match',exact:true}).click()
 await expect(story).toHaveCount(0)
 await expect(page.getByRole('button',{name:'Row 8, column 8, open',exact:true})).toBeVisible()
 await expect(page.getByText('Your turn',{exact:true})).toBeVisible()
})

for(const width of [320,390]){
 test('Secret Chamber has no overflow and remains playable with reduced motion at '+width+'px',async({browser})=>{
  const context=await browser.newContext({viewport:{width,height:720},hasTouch:true,reducedMotion:'reduce'})
  const page=await context.newPage()
  try{
   await lobby(page)
   const story=await open(page)
   const skip=story.getByRole('button',{name:/skip/i})
   await expect(skip).toBeInViewport({ratio:1})
   const activeStoryAnimations=await story.evaluate(dialog=>dialog.getAnimations({subtree:true}).filter(x=>x.playState==='running').length)
   expect(activeStoryAnimations).toBe(0)
   expect(await story.evaluate(dialog=>dialog.scrollWidth)).toBe(await story.evaluate(dialog=>dialog.clientWidth))
   await skip.tap()
   await expect(story.getByRole('region',{name:'Secret Chamber'})).toHaveCount(0)
   await story.getByRole('button',{name:'Enter match',exact:true}).tap()
   const board=page.getByLabel('Blind Gomoku board')
   await expect(board.getByRole('button')).toHaveCount(225)
   const tray=page.getByRole('group',{name:'Stone covers'})
   await expect(tray.getByRole('button')).toHaveCount(8)
   for(const button of await tray.getByRole('button').all()){
    const box=await button.boundingBox()
    expect(box?.width).toBeGreaterThanOrEqual(24)
    expect(box?.height).toBeGreaterThanOrEqual(24)
   }
   await expect(tray.getByRole('button',{pressed:true})).toHaveCount(1)
   const jade=tray.getByRole('button',{name:'Jade cover',exact:true})
   await jade.tap()
   await expect(jade).toHaveAttribute('aria-pressed','true')
   const boardBox=await board.boundingBox()
   expect(boardBox!.width).toBeLessThanOrEqual(width)
   expect(boardBox!.height/boardBox!.width).toBeGreaterThan(.90)
   const coords=page.getByText('Place by coordinates',{exact:true})
   await coords.tap()
   await page.getByRole('combobox',{name:'Row',exact:true}).selectOption({label:'8'})
   await page.getByRole('combobox',{name:'Column',exact:true}).selectOption({label:'8'})
   await page.getByRole('button',{name:'Place stone',exact:true}).tap()
   const placed=board.getByRole('button',{name:'Row 8, column 8, veiled',exact:true})
   await expect(placed).toHaveAttribute('aria-description','Jade cover. Side hidden.')
   await page.getByText('Chamber artwork',{exact:true}).tap()
   const scene=page.locator('.chamber-scene')
   await scene.scrollIntoViewIfNeeded()
   const art=scene.locator('img[src$="secret-chamber.svg"]')
   await expect.poll(()=>art.evaluate((img:HTMLImageElement)=>img.complete&&img.naturalWidth>0)).toBe(true)
   expect(await scene.evaluate(fig=>fig.getAnimations({subtree:true}).filter(x=>x.playState==='running').length)).toBe(0)
   expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(width)
  }finally{await context.close()}
 })
}
