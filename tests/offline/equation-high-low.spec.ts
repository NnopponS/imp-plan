import {expect,test} from '@playwright/test'
import {startMatch} from '../e2e/start-match'

test('saved offline build opens the cover and plays Equation High-Low against a bot through payout',async({page,context,baseURL})=>{
 await page.goto(baseURL!)
 await expect(page.getByText('Ready for offline practice.',{exact:true})).toBeVisible({timeout:15000})
 await context.setOffline(true)
 try{
  const replay=await context.newPage()
  await replay.goto(baseURL!+'season/1/')
  const card=replay.getByRole('article').filter({has:replay.getByRole('heading',{name:'Equation High-Low',exact:true})})
  const art=card.locator('img[data-arena-art]')
  await art.scrollIntoViewIfNeeded()
  await expect.poll(()=>art.evaluate((node:HTMLImageElement)=>node.complete&&node.naturalWidth>0)).toBe(true)
  await replay.getByRole('button',{name:'Practice Equation High-Low',exact:true}).click()
  await startMatch(replay)
  const board=replay.getByRole('region',{name:'Equation High-Low table'})
  for(let i=0;i<12;i++){
   const phase=await board.getAttribute('data-eh-phase')
   if(phase!=='opening'&&phase!=='closing')break
   await board.getByRole('group',{name:'Wager actions'}).getByRole('button',{name:/^(Check|Call \d+)$/}).click()
   await expect.poll(async()=>await board.getAttribute('data-eh-phase')!==phase||await board.getByRole('heading',{name:'Bot 1 to act'}).isVisible(),{timeout:5000}).toBe(true)
   await expect.poll(async()=>await board.getAttribute('data-eh-phase')!==phase||await board.getByRole('heading',{name:'Your wager'}).isVisible(),{timeout:5000}).toBe(true)
  }
  await expect(board).toHaveAttribute('data-eh-phase','seal')
  const picks=board.locator('[data-eh-pick]')
  const labels=await picks.evaluateAll(nodes=>nodes.map(node=>node.getAttribute('aria-label')))
  const divisor=labels.findIndex(label=>!label?.includes(': 0 '))
  for(const i of labels.map((_,i)=>i).filter(i=>i!==divisor).concat(divisor))await picks.nth(i).click()
  await board.getByRole('button',{name:'Seal Low equation',exact:true}).click()
  await expect(board).toHaveAttribute('data-eh-phase','review')
  await expect(board.getByRole('list',{name:'Showdown equations'})).toContainText('Bot 1')
 }finally{await context.setOffline(false)}
})
