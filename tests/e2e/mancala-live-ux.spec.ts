import {expect,test} from '@playwright/test'
import {startMatch} from './start-match'

test('carved Mancala pits fit a 320px phone and touch/keyboard keep the move separate from its preview',async({browser,baseURL},info)=>{
 const phone=await browser.newContext({viewport:{width:320,height:740},hasTouch:true,isMobile:true,reducedMotion:'reduce'})
 try{
  const page=await phone.newPage()
  await page.goto(baseURL!+'season/2/')
  await page.getByRole('button',{name:'Practice Balance Mancala',exact:true}).tap()
  await startMatch(page)
  const table=page.getByRole('region',{name:'Balance Mancala table'})
  const pits=table.getByRole('group',{name:'Mancala pits'})
  await expect(pits.getByRole('button')).toHaveCount(9)
  const first=pits.getByRole('button',{name:'Pit 1, Red, 0 stones',exact:true})
  const bonus=pits.getByRole('button',{name:/Pit 8, Bonus/})
  const penalty=pits.getByRole('button',{name:/Pit 9, Penalty/})
  await expect(first.locator('svg[data-mancala-bowl]')).toBeVisible()
  await expect(bonus.locator('[data-mancala-mark]')).not.toHaveAttribute('d',await penalty.locator('[data-mancala-mark]').getAttribute('d')??'')
  const board=await pits.boundingBox(),pit=await first.boundingBox()
  expect(pit!.height).toBeGreaterThanOrEqual(44)
  expect(board!.height).toBeLessThan(265)
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(320)
  const contrast=await table.evaluate(el=>{
   const luminance=(v:string)=>v.match(/[\d.]+/g)!.slice(0,3).map(x=>Number(x)/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4).reduce((s,x,i)=>s+x*[.2126,.7152,.0722][i],0)
   const bg=luminance(getComputedStyle(el).backgroundColor)
   const lines=[...el.querySelectorAll('.mancala-live-hud small,.mancala-score-data strong,.mancala-score-data small')]
   return lines.map(n=>{const fg=luminance(getComputedStyle(n).color);return (Math.max(fg,bg)+.05)/(Math.min(fg,bg)+.05)})
  })
  expect(contrast.length).toBeGreaterThanOrEqual(3)
  expect(Math.min(...contrast)).toBeGreaterThan(4.5)
  const countContrast=await first.locator('.mancala-pit-count').evaluate(el=>{
   const l=(v:string)=>v.match(/[\d.]+/g)!.slice(0,3).map(x=>Number(x)/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4).reduce((s,x,i)=>s+x*[.2126,.7152,.0722][i],0)
   const fg=l(getComputedStyle(el).color),bg=l(getComputedStyle(el.parentElement!).backgroundColor)
   return (Math.max(fg,bg)+.05)/(Math.min(fg,bg)+.05)
  })
  expect(countContrast).toBeGreaterThan(4.5)
  await first.tap()
  await expect(first).toHaveAttribute('aria-pressed','true')
  await expect(pits.locator('[data-mancala-stone]')).toHaveCount(0)
  await table.getByRole('button',{name:'Place stone',exact:true}).tap()
  await expect(pits.locator('[data-mancala-stone]').first()).toBeVisible()
  await expect(pits.getByRole('button',{name:/Pit 1, Red, [12] stones/})).toBeVisible()
  for(let i=1;i<4;i++){
   await pits.locator('button:enabled').first().press('Enter')
   await table.getByRole('button',{name:'Place stone',exact:true}).press('Enter')
  }
  await expect(table.getByText('Sowing round 1 / 12', {exact:true})).toBeVisible()
  const sow=pits.locator('button:enabled').first()
  await sow.press('Enter')
  await expect(sow).toHaveAttribute('aria-pressed','true')
  await expect(pits.locator('[data-mancala-landing]')).toHaveCount(1)
  await expect(table.getByText(/Last stone:.*pit/)).toBeVisible()
  await page.evaluate(()=>scrollTo(0,0))
  await page.screenshot({path:info.outputPath('mancala-320.png')})
  await table.getByRole('button',{name:'Sow selected pit',exact:true}).press('Enter')
  await expect(table.getByText(/Last landing: pit/)).toBeVisible()
 }finally{await phone.close()}
})
