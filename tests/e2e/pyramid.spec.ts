import {test,expect} from '@playwright/test'
import {pyramidChoices,pyramidFraction,fractionLabel} from '../../src/pyramid'

function solve(values:number[],target:string){
 for(const [a,b,c] of pyramidChoices)for(const order of [[a,b,c],[a,c,b],[b,a,c],[b,c,a],[c,a,b],[c,b,a]]){
  for(let op1=0;op1<4;op1++)for(let op2=0;op2<4;op2++)for(const right of [false,true]){
   const v=pyramidFraction(order.map(i=>values[i]),op1,op2,right)
   if(v&&fractionLabel(v)===target)return {order,op1,op2,right}
  }
 }
 throw Error('No expression for visible target')
}
test('Equation Pyramid completes all eight rounds with keyboard and touch',async({browser,baseURL})=>{
 const ctx=await browser.newContext({viewport:{width:360,height:780},hasTouch:true})
 try{
  const page=await ctx.newPage()
  await page.goto(baseURL!+'season/2/')
  await page.getByLabel('Nickname').fill('Builder')
  await page.getByRole('button',{name:/Practice Equation Pyramid/}).click()
  await page.getByRole('button',{name:'Start match'}).click()
  for(let j=1;j<=8;j++){
   await expect(page.getByText(`Puzzle ${j} / 8`,{exact:true})).toBeVisible()
   const tiles=page.getByRole('group',{name:'Pyramid tiles'}).getByRole('button')
   await expect(tiles).toHaveCount(15)
   const target=(await page.locator('[data-target]').textContent())!
   const values=await tiles.evaluateAll(nodes=>nodes.map(n=>Number(n.getAttribute('data-value'))))
   const {order,op1,op2,right}=solve(values,target)
   for(const i of order){const tile=tiles.nth(i);if(j===1)await tile.press('Enter');else await tile.tap()}
   await page.getByLabel('First operator').selectOption(String(op1))
   await page.getByLabel('Second operator').selectOption(String(op2))
   await page.getByLabel('Grouping').selectOption(right?'right':'left')
   await page.getByRole('button',{name:'Lock answer'}).tap()
  }
  await expect(page.getByRole('heading',{name:'Practice complete'})).toBeVisible()
  await expect(page.getByText('Builder: 16 pts')).toBeVisible()
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(360)
 }finally{await ctx.close()}
})
