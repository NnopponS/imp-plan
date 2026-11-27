import {startMatch} from './start-match'
import {chooseSetting} from '../lobby-controls'
import {test,expect} from '@playwright/test'

test('Fragments of Memory recalls the hidden gallery through all 24 questions',async({browser,baseURL})=>{
 const ctx=await browser.newContext({viewport:{width:360,height:780},hasTouch:true})
 try{
  const page=await ctx.newPage()
  await page.clock.install()
  await page.goto(baseURL!+'season/1/')
  await page.getByLabel('Nickname').fill('Curator')
  await page.getByRole('button',{name:/Practice Fragments of Memory/}).click()
  await chooseSetting(page,'Questions','24')
  await startMatch(page)
  const scene=page.getByRole('figure',{name:'Study exhibit'})
  await scene.getByText('Text version of exhibit').click()
  const truth=(await scene.locator('details p').textContent())!.match(/^Label: (\w+)\. Clock: ([\d:]+)\.$/)!
  const data=(await scene.locator('details li').allTextContents()).flatMap(t=>t.split(': ')[1].slice(0,-1).split(', ')).map(t=>{
   const [color,item]=t.split(' ')
   return {color,item:item[0].toUpperCase()+item.slice(1)}
  })
  expect(data).toHaveLength(9)
  // Pause the real-time Playwright clock pump while shifting the study interval.
  // Resume before tap() so its browser animation-frame stability check can run.
  await page.clock.pauseAt(await page.evaluate(()=>Date.now()+500))
  await page.clock.fastForward(45500)
  await page.clock.resume()
  await expect(scene).toHaveCount(0)
  for(let n=1;n<=24;n++){
   await expect(page.getByText(`Question ${n} / 24`,{exact:true})).toBeVisible()
   const region=page.getByRole('region',{name:'Recall question'})
   const q=(await region.getByRole('heading').textContent())!
   const item=q.match(/the (\w+)\?$/)?.[1]
   let answer:string
   if(q.startsWith('What is the clock'))answer=truth[2]
   else if(q.startsWith('Which word'))answer=truth[1]
   else if(q.startsWith('What color'))answer=data.find(o=>o.item.toLowerCase()===item)!.color
   else if(q.includes('right of'))answer=data[data.findIndex(o=>o.item.toLowerCase()===item)+1].item
   else if(q.includes('center'))answer=data[1+3*['top','middle','bottom'].indexOf(q.split(' ').at(-2)!)].item
   else answer=String(data.filter(o=>o.color.toLowerCase()===q.split(' ')[2]).length)
   const choice=region.getByRole('button',{name:answer,exact:true})
   await expect(choice).toBeEnabled({timeout:2500})
   if(n%2)await choice.press('Enter',{timeout:2500});else await choice.tap({timeout:2500})
  }
  await expect(page.getByRole('heading',{name:'Exhibit cleared'})).toBeVisible()
  await expect(page.getByText('24 / 24',{exact:true})).toBeVisible()
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(360)
 }finally{await ctx.close()}
})
