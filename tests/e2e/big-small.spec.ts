import {expect,test,type Page} from '@playwright/test'
import {chooseGame} from '../lobby-controls'
import {startMatch} from './start-match'

const board=(page:Page)=>page.getByRole('region',{name:'Big Small table'})
const button=(page:Page,name:string)=>board(page).getByRole('button',{name,exact:true})
const opposite=(side:string)=>side==='Big'?'Small':'Big'
async function prepareSeal(page:Page,correct=true){
 const field=board(page)
 const ref=Number(await field.locator('[data-bs-reference]').getAttribute('data-bs-reference'))
 const available=await field.locator('[data-bs-card]').evaluateAll(cards=>cards.map(el=>Number(el.getAttribute('data-bs-card'))))
 const value=available.find(n=>n!==ref)!
 const side=value>ref?'Big':'Small'
 await button(page,'Card '+value).press('Enter')
 await button(page,correct?side:opposite(side)).press('Enter')
 await button(page,'Seal card').press('Enter')
 return {side,value}
}
async function predict(page:Page,side:string,stake:number){
 await button(page,stake+' '+(stake===1?'chip':'chips')).click()
 await button(page,side).click()
 await button(page,'Reveal comparison').click()
}

test('two connected browsers play through hidden steps, alternation, bankruptcy and final match record',async({browser,baseURL})=>{
 test.setTimeout(75_000)
 const desktop=await browser.newContext({viewport:{width:1280,height:850},reducedMotion:'reduce'})
 const mobile=await browser.newContext({viewport:{width:320,height:740},hasTouch:true,isMobile:true,reducedMotion:'reduce'})
 try{
  const host=await desktop.newPage(),guest=await mobile.newPage()
  await host.goto(baseURL!)
  await host.getByLabel('Nickname').fill('Ada')
  await host.getByRole('button',{name:'Create party'}).click()
  const code=(await host.getByTestId('room-code').textContent())!
  await chooseGame(host,'bigSmall')
  await guest.goto(baseURL!+'#/join?room='+code)
  await guest.getByLabel('Nickname').fill('Bram')
  await guest.getByRole('button',{name:'Join party'}).tap()
  await guest.getByRole('button',{name:'Ready up',exact:true}).tap()
  await startMatch(host)
  for(let i=0;i<7;i++){
   const [duelist,bettor]=i%2?[guest,host]:[host,guest]
   await expect(board(duelist)).toHaveAttribute('data-bs-phase','seal')
   const {side,value}=await prepareSeal(duelist,i%2===0)
   await expect(board(bettor)).toHaveAttribute('data-bs-phase','predict')
   await expect(board(bettor).getByText('Face down',{exact:true})).toBeVisible()
   await expect(board(bettor).locator('[data-bs-own-seal]')).toHaveCount(0)
   await expect(board(duelist).locator('[data-bs-own-seal]')).toContainText(String(value))
   await predict(bettor,i%2?side:opposite(side),i%2?1:i===6?1:3)
   for(const page of [host,guest]){
    await expect(board(page)).toHaveAttribute('data-bs-phase',i===6?'finished':'reveal')
    await expect(board(page).locator('[data-bs-revealed]')).toHaveAttribute('data-bs-revealed',String(value))
   }
   if(i<6)await button(host,'Next round').click()
  }
  for(const page of [host,guest]){
   await expect(page.getByRole('heading',{name:'Ada wins',exact:true})).toBeVisible()
   await expect(page.getByRole('region',{name:'Match record'})).toContainText('Victory · Ada')
   await expect(board(page).locator('[data-bs-stack]').nth(1)).toContainText('0 chips')
  }
  expect(await guest.evaluate(()=>document.documentElement.scrollWidth)).toBe(320)
 }finally{await Promise.all([desktop.close(),mobile.close()])}
})

test('Season 2 practice has drawn artwork and the accountless bot completes both roles',async({page,baseURL})=>{
 await page.setViewportSize({width:390,height:800})
 await page.goto(baseURL!+'season/2/')
 const card=page.getByRole('article').filter({has:page.getByRole('heading',{name:'Big Small',exact:true})})
 await expect(card.locator('[data-venue="final"]')).toHaveText('Final Match')
 await expect(card.locator('img[data-arena-art]')).toHaveAttribute('src',/seasonal-bigSmall.svg$/)
 await page.getByRole('button',{name:'Practice Big Small',exact:true}).click()
 await expect(page.getByLabel('Nickname')).toHaveCount(0)
 await page.getByRole('button',{name:'Start match',exact:true}).click()
 const briefing=page.getByRole('dialog')
 await expect(briefing.locator('[data-bs-example]')).toBeVisible()
 await briefing.getByRole('button',{name:'Enter match',exact:true}).click()
 await expect(board(page)).toContainText('Bot 1')
 await prepareSeal(page)
 await expect(board(page)).toHaveAttribute('data-bs-phase','reveal')
 await button(page,'Next round').click()
 await expect(board(page)).toHaveAttribute('data-bs-phase','predict')
 await predict(page,'Big',1)
 await expect(board(page)).toHaveAttribute('data-bs-phase','reveal')
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(390)
})
