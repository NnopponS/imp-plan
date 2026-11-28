import {test,expect,type Locator,type Page} from '@playwright/test'
import {findTowerPath,type TowerShift} from '../../src/equation-tower'
import {startMatch} from './start-match'
import {chooseGame} from '../lobby-controls'

const stand=(loc:Locator,index:number)=>loc.locator('[data-equation-stand="'+('ABCD'[index])+'"]')
const table=(page:Page)=>page.getByRole('region',{name:'Tower of Equations table'})
async function state(board:Locator){
 const [height,value,serials]=await Promise.all([
  board.locator('[data-equation-height]').getAttribute('data-equation-height'),
  board.locator('[data-equation-target]').getAttribute('data-equation-target'),
  board.locator('[data-equation-stand]').evaluateAll(nodes=>nodes.map(n=>(n.getAttribute('data-blocks')??'').split(',').filter(Boolean).map(Number))),
 ])
 return {target:{height:Number(height),value:Number(value)},stacks:serials}
}
async function place(board:Locator,move:TowerShift,touch=false){
 const hit=(x:Locator)=>touch?x.tap():x.click()
 await hit(stand(board,move.from))
 for(let i=1;i<move.count;i++)await hit(board.getByRole('button',{name:'Lift one more block'}))
 if(move.flip)await hit(board.getByRole('button',{name:'Flip bundle',exact:true}))
 if(move.from===move.to)await hit(board.getByRole('button',{name:'Flip in place'}))
 else await hit(stand(board,move.to))
}
test('real 320px touch goes from the gallery through animated art and three solved towers to the result',async({browser,baseURL},info)=>{
 const ctx=await browser.newContext({viewport:{width:320,height:640},isMobile:true,hasTouch:true,reducedMotion:'reduce'})
 try{
  const page=await ctx.newPage()
  await page.goto(baseURL!+'season/3/')
  const cover=page.locator('[data-preview-game="equationTower"] img[data-arena-art]')
  await cover.scrollIntoViewIfNeeded()
  await expect.poll(()=>cover.evaluate((img:HTMLImageElement)=>img.complete&&img.naturalWidth>0)).toBe(true)
  await page.getByRole('button',{name:'Practice Tower of Equations',exact:true}).tap()
  await page.getByRole('button',{name:'Preview the table',exact:true}).tap()
  const preview=page.locator('[data-real-table-preview="equationTower"]')
  await expect(preview.locator('svg[data-equation-block]')).toHaveCount(8)
  const block=preview.locator('[data-equation-block="0"]')
  const ground=await stand(preview,0).evaluate(node=>getComputedStyle(node).backgroundColor)
  const ink=await block.locator('path.et-block-face').evaluate(node=>getComputedStyle(node).fill)
  await page.getByRole('button',{name:'Close details'}).tap()
  await page.getByRole('button',{name:'Start match',exact:true}).tap()
  const brief=page.getByRole('dialog')
  const lesson=brief.getByRole('region',{name:'How to play'})
  await expect(brief.locator('[data-equation-lesson]')).toHaveAttribute('data-equation-lesson','0')
  await lesson.press('ArrowRight')
  await expect(brief.locator('[data-equation-lesson]')).toHaveAttribute('data-equation-lesson','1')
  await lesson.press('ArrowRight')
  await expect(brief.locator('[data-equation-lesson]')).toHaveAttribute('data-equation-lesson','2')
  const lessonBounds=await brief.locator('[data-equation-lesson]').boundingBox()
  expect(lessonBounds).not.toBeNull()
  const cdp=await ctx.newCDPSession(page)
  const x=lessonBounds!.x+lessonBounds!.width/4,y=lessonBounds!.y+lessonBounds!.height/2
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]})
  await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+75,y}]})
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]})
  await expect(brief.locator('[data-equation-lesson]')).toHaveAttribute('data-equation-lesson','3')
  await expect(brief.locator('[data-equation-lesson]')).toContainText('7 + 2 × 2 = 11')
  await cdp.detach()
  await expect(brief.getByRole('button',{name:/^(back|next)$/i})).toHaveCount(0)
  await brief.getByRole('button',{name:'Enter match',exact:true}).tap()
  const board=table(page)
  await expect(board).toHaveAttribute('data-equation-pace','workshop')
  await expect(page.getByRole('alert')).toHaveCount(0)
  await expect(board.locator('svg[data-equation-block]')).toHaveCount(8)
  const traced=board.locator('[data-equation-block="0"]')
  await expect(traced).toHaveAttribute('viewBox','0 0 64 25')
  await expect(traced.locator('path.et-block-face')).toHaveCSS('fill',ink)
  await expect(stand(board,0)).toHaveCSS('background-color',ground)
  expect(ground).toBe('rgb(22, 34, 33)')
  await expect(board.locator('[data-equation-pedestals]')).toBeInViewport({ratio:1})
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(320)
  await page.screenshot({path:info.outputPath('tower-320.png')})
  for(let round=1;round<=3;round++){
   const puzzle=await state(board)
   const path=findTowerPath(puzzle.stacks,puzzle.target)!
   expect(path.length).toBeGreaterThan(0)
   for(const move of path)await place(board,move,true)
   await expect(board).toHaveAttribute('data-equation-tower','review')
   await expect(board).toContainText('Tower proved')
   await board.getByRole('button',{name:round===3?'See workshop results':'Open next target'}).tap()
  }
  await expect(board).toHaveAttribute('data-equation-tower','done')
  await expect(board.getByRole('list',{name:'Tower scores'}).getByRole('listitem')).toHaveText(/3/)
  await expect(page.getByRole('button',{name:'Rematch',exact:true})).toBeVisible()
 }finally{await ctx.close()}
})
test('two browser contexts: Quick preview matches the selected pace; private draft is invisible; the lower bidder proves',async({browser,baseURL})=>{
 test.setTimeout(80000)
 const contexts=await Promise.all([browser.newContext(),browser.newContext({viewport:{width:390,height:760}})])
 try{
  const [host,guest]=await Promise.all(contexts.map(c=>c.newPage()))
  await host.goto(baseURL!)
  await host.getByLabel('Nickname').fill('Slate')
  await host.getByRole('button',{name:'Create party'}).click()
  const invite=await host.getByTestId('room-code').innerText()
  await chooseGame(host,'equationTower')
  await host.getByRole('radio',{name:'Quick clock',exact:true}).click()
  await host.getByRole('button',{name:'Preview the table',exact:true}).click()
  const sample=host.locator('[data-real-table-preview="equationTower"]')
  await expect(sample).toHaveAttribute('data-sample-variant','quick')
  await expect(sample.locator('[data-equation-tower]')).toHaveAttribute('data-equation-pace','quick')
  await host.getByRole('button',{name:'Close details'}).click()
  await guest.goto(baseURL!+'#/join?room='+invite)
  await guest.getByLabel('Nickname').fill('Copper')
  await guest.getByRole('button',{name:'Join party'}).click()
  await guest.getByRole('button',{name:'Ready up',exact:true}).click()
  await startMatch(host)
  const a=table(host),b=table(guest)
  await expect(a).toHaveAttribute('data-equation-tower','call')
  await expect(b).toHaveAttribute('data-equation-tower','call')
  const opening=await state(b)
  const path=findTowerPath(opening.stacks,opening.target)!
  await place(a,path[0])
  await expect(a).toContainText('Draft · 1 move')
  expect(await state(b)).toEqual(opening)
  for(let i=1;i<=path.length;i++)await a.getByRole('button',{name:'Increase declared moves'}).click()
  await a.getByRole('button',{name:'Call '+(path.length+1)+' moves',exact:true}).click()
  await expect(b).toHaveAttribute('data-equation-tower','challenge')
  for(let i=1;i<path.length;i++)await b.getByRole('button',{name:'Increase declared moves'}).click()
  await b.getByRole('button',{name:'Call '+path.length+(path.length===1?' move':' moves'),exact:true}).click()
  await expect(a).toHaveAttribute('data-equation-tower','build')
  await expect(a).toContainText('Copper is building.')
  expect(await state(a)).toEqual(opening)
  await expect(a.getByRole('button',{name:/Lift from stand/})).toHaveCount(0)
  for(const move of path)await place(b,move)
  await expect(a).toHaveAttribute('data-equation-tower','review')
  await expect(a).toContainText('+2 points')
  await expect(b).toContainText('Tower proved')
 }finally{await Promise.allSettled(contexts.map(c=>c.close()))}
})

test('the party picker previews the 2-seat standard clock before choice and retains Quick for the current card',async({page})=>{
 await page.goto('./')
 await page.getByLabel('Nickname').fill('Bronze')
 await page.getByRole('button',{name:'Create party'}).click()
 const details=async()=>{
  await page.getByRole('button',{name:'Choose game'}).click()
  await page.getByRole('searchbox',{name:'Find a game'}).fill('Tower of Equations')
  await page.getByRole('button',{name:'Details for Tower of Equations',exact:true}).click()
  return page.locator('[data-real-table-preview="equationTower"]')
 }
 const first=await details()
 await expect(first).toHaveAttribute('data-sample-variant','standard')
 await expect(first.locator('[data-equation-tower]')).toHaveAttribute('data-equation-pace','standard')
 await page.getByRole('button',{name:'Choose Tower of Equations',exact:true}).click()
 await page.getByRole('radio',{name:'Quick clock',exact:true}).click()
 const current=await details()
 await expect(current).toHaveAttribute('data-sample-variant','quick')
 await expect(current.locator('[data-equation-tower]')).toHaveAttribute('data-equation-pace','quick')
})
