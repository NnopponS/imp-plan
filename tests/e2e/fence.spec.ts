import {startMatch} from './start-match'
import {expect,test} from '@playwright/test'
import {solveFence} from '../../src/fence'

test('Loop Fence solves a private 5×5 board via mobile touch and keyboard',async({browser,baseURL})=>{
 const ctx=await browser.newContext({viewport:{width:360,height:760},hasTouch:true})
 try{
  const page=await ctx.newPage()
  await page.goto(baseURL!+'season/3/')
  await page.getByLabel('Nickname').fill('Surveyor')
  await page.getByRole('button',{name:/Practice Loop Fence Puzzle/}).click()
  await startMatch(page)
  const board=page.getByRole('region',{name:'Loop Fence board'})
  await board.getByText('Read clues as text').click()
  const rows=await board.locator('details li').allTextContents()
  const clues=rows.flatMap(r=>Array.from(r.matchAll(/Column \d (blank|\d)/g),([_,v])=>v==='blank'?null:Number(v)))
  expect(clues).toHaveLength(25)
  const {solutions,exhausted}=solveFence(clues)
  expect(exhausted).toBe(false)
  expect(solutions).toHaveLength(1)
  const [solution]=solutions
  const edge=(i:number)=>board.locator(`button[data-edge="${i}"]`)
  await expect(board.getByRole('button',{name:'Show solution'})).toHaveCount(0)
  const empty=solution.indexOf(0)
  await board.getByRole('button',{name:'Cross out'}).tap()
  await edge(empty).tap()
  await expect(edge(empty)).toHaveAttribute('data-mark','2')
  await edge(empty).press('Space')
  await expect(edge(empty)).toHaveAttribute('data-mark','0')
  await board.getByRole('button',{name:'Draw line'}).tap()
  for(let i=0;i<solution.length;i++)if(solution[i]){
   if(i%2)await edge(i).press('Enter');else await edge(i).tap()
   await expect(edge(i)).toHaveAttribute('data-mark','1')
  }
  await expect(page.getByRole('heading',{name:'Practice complete'})).toBeVisible()
  await expect(board.getByText(/s · solved/)).toBeVisible()
  await board.getByRole('button',{name:'Show solution'}).click()
  await expect(board.getByRole('status')).toHaveText('Showing the solution.')
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(360)
 }finally{await ctx.close()}
})
