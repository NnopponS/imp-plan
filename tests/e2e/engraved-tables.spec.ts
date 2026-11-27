import {expect,test} from '@playwright/test'
import {startMatch} from './start-match'

test.describe('engraved in-game art',()=>{
 for(const [game,title,material,width,height] of [
  ['blind','Blind Gomoku','lacquer',320,710],['scale','Scale Game','brass',390,844],['memoryPoker','Memory Poker','felt',1440,900],
  ['piece','Piece Puzzle','oak',844,390],['colorLink','Color Link','ink',768,1024],['montage','Montage','vellum',390,844],
 ] as const){
  test(`${title} uses its own original engraving on the ${material} table without horizontal spill`,async({page})=>{
   await page.setViewportSize({width,height})
   await page.emulateMedia({reducedMotion:'reduce'})
   await page.goto('./')
   await page.getByRole('button',{name:'Practice '+title,exact:true}).click()
   await startMatch(page)
   const table=page.locator('.room[data-live-match] .match')
   await expect(table).toHaveAttribute('data-table-material',material,{timeout:4500})
   const engraving=table.locator('.table-makers-mark')
   await expect(engraving).toHaveAttribute('data-table-game',game)
   await expect(engraving.locator('[data-token-engraving] path').first()).toBeAttached()
   await expect(engraving).toHaveAttribute('aria-hidden','true')
   await expect(engraving).toBeVisible()
   expect(await table.evaluate(el=>getComputedStyle(el,'::before').pointerEvents)).toBe('none')
   expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(width)
   await expect(table.getByText('Opening the table…',{exact:true})).toHaveCount(0)
   // Check the real reading surface, not just the presence of an asset.
   const contrast=await table.evaluate(el=>{
    const title=el.querySelector(':scope > h2')
    if(!title)return null
    const bright=(value:string)=>value.match(/[0-9.]+/g)!.slice(0,3).map(Number).map(c=>c/255).map(c=>c<=.04045?c/12.92:((c+.055)/1.055)**2.4).reduce((s,c,i)=>s+c*[.2126,.7152,.0722][i],0)
    const pair=[bright(getComputedStyle(el).backgroundColor),bright(getComputedStyle(title).color)].sort((a,b)=>a-b)
    return (pair[1]+.05)/(pair[0]+.05)
   })
   if(contrast!==null)expect(contrast).toBeGreaterThan(4.5)
   if(process.env.CAPTURE_ENGRAVED==='1')await page.screenshot({path:`/tmp/imp-engraved-${game}.png`,animations:'disabled'})
   await page.getByRole('button',{name:'Board focus',exact:true}).click()
   await expect(engraving).not.toBeVisible()
   await page.getByRole('button',{name:'Exit focus',exact:true}).click()
   await expect(engraving).toBeVisible()
  })
 }
 test('each playable game gets a corresponding actual table mark',async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'})
  await page.goto('./')
  const ids=await page.locator('button[id^="practice-gallery-"]').evaluateAll(nodes=>nodes.map(node=>node.id.replace('practice-gallery-','')))
  expect(ids.length).toBeGreaterThanOrEqual(30)
  for(const game of ids){
   await page.locator('#practice-gallery-'+game).click()
   await startMatch(page)
   await expect(page.locator('.match .table-makers-mark')).toHaveAttribute('data-table-game',game)
   await page.getByRole('button',{name:'Leave room',exact:true}).click()
  }
 })
})
