import {expect,test,type Locator,type Page} from '@playwright/test'
import {startMatch} from './start-match'

const games = [
 {id:'spot',plate:'.spot-picture',hits:'.spot-area',count:24},
 {id:'symmetry',plate:'.mb-slab',hits:'.mb-hit button',count:49},
] as const

async function expectInkAboveHitLayer(page:Page,stage:Locator,game:typeof games[number]) {
 const hits=stage.locator(game.hits),plate=stage.locator(game.plate).first()
 await expect(hits).toHaveCount(game.count)
 // Compare this position to its own original rendering without hitboxes. No
 // fixed seed, font, screenshot baseline or private room data is required.
 const before=await plate.screenshot({animations:'disabled'})
 const override=await page.addStyleTag({content:
  '[data-rendered-table="'+game.id+'"] '+game.hits+'{visibility:hidden!important}'})
 let underlying:Buffer
 try{underlying=await plate.screenshot({animations:'disabled'})}
 finally{await override.evaluate(s=>s.parentNode?.removeChild(s))}
 const changed=await page.evaluate(async ([a,b])=>{
  async function decode(src:string){
   const img=new Image(); img.src='data:image/png;base64,'+src; await img.decode()
   const canvas=document.createElement('canvas');canvas.width=img.width;canvas.height=img.height
   const ctx=canvas.getContext('2d')!;ctx.drawImage(img,0,0)
   return ctx.getImageData(0,0,canvas.width,canvas.height).data
  }
  const [one,two]=await Promise.all([decode(a),decode(b)])
  if(one.length!==two.length)return 1
  let changed=0
  for(let i=0;i<one.length;i+=4){
   if(Math.max(Math.abs(one[i]-two[i]),Math.abs(one[i+1]-two[i+1]),Math.abs(one[i+2]-two[i+2]))>15)changed++
  }
  return changed/(one.length/4)
 },[before.toString('base64'),underlying.toString('base64')])
 // An intentional focus ring or hover outline may add a few painted pixels.
 expect(changed,'hit targets must not conceal the actual specimens or mirror inlay').toBeLessThan(.06)
}

for(const width of [320,1280])for(const game of games){
 test(game.id+' ink stays visible in Preview and after playing a move at '+width+'px',async({browser,baseURL})=>{
  const ctx=await browser.newContext({viewport:{width,height:width===320?640:850},hasTouch:true,isMobile:width===320,reducedMotion:width===320?'reduce':'no-preference'})
  try{
   const page=await ctx.newPage()
   await page.goto(baseURL!+'season/3/')
   await page.locator('#practice-gallery-'+game.id).locator('xpath=ancestor::article').locator('.game-cover-hit').click()
   const preview=page.locator('[data-real-table-preview] [data-rendered-table="'+game.id+'"]')
   await expectInkAboveHitLayer(page,preview,game)
   await page.getByRole('dialog').getByRole('button',{name:/^Practice /}).click()
   await startMatch(page)
   const live=page.locator('.room[data-playing]:not([inert]) [data-rendered-table="'+game.id+'"]')
   if(game.id==='spot'){
    // Use the game's own public non-color descriptions to find a genuine move.
    const correct=await live.locator('.spot-list>div').evaluateAll(rows=>rows.find(row=>{
     const [a,b]=row.querySelectorAll('span')
     return a.textContent?.replace(/^Tray I: /,'')!==b.textContent?.replace(/^Tray II: /,'')
    })?.querySelector('strong')?.textContent)
    expect(correct).toBeTruthy()
    await live.locator('.spot-tray').first().locator('[data-region="'+correct+'"]').tap()
    await expect(live.getByText(/^1 \/ \d+ found$/)).toBeVisible()
   }else{
    await live.getByRole('button',{name:/^Moth, .*in tray$/}).tap()
    await live.locator('button[data-spot="0"]').press('Enter')
    await expect(live.getByLabel(/^1 of \d+ pieces placed$/)).toBeAttached()
    await expect(live.locator('button[data-spot="0"]')).toBeFocused()
   }
   if(width===1280){
    const hit=live.locator(game.hits).and(page.locator('button:not(:disabled):not([aria-disabled=true])')).first()
    await hit.hover()
    const alpha=await hit.evaluate(node=>{
     const ctx=document.createElement('canvas').getContext('2d')!
     ctx.fillStyle=getComputedStyle(node).backgroundColor;ctx.fillRect(0,0,1,1)
     return ctx.getImageData(0,0,1,1).data[3]
    })
    expect(alpha,'pointing must not cover the specimen being inspected').toBeLessThan(100)
   }
   await expectInkAboveHitLayer(page,live,game)
  }finally{await ctx.close()}
 })
}
