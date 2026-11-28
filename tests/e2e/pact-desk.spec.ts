import {expect,test,type Browser,type Page} from '@playwright/test'
import {chooseGame} from '../lobby-controls'
import type {Game} from '../../src/engine'
import {startMatch} from './start-match'

async function setup(browser:Browser,base:string,game:Game,names:string[]){
 const contexts=await Promise.all(names.map((_,i)=>browser.newContext(i?{viewport:{width:320,height:720},isMobile:true,hasTouch:true,reducedMotion:'reduce'}:{viewport:{width:1280,height:900},reducedMotion:'reduce'})))
 const close=()=>Promise.all(contexts.map(c=>c.close()))
 try{
  const pages=await Promise.all(contexts.map(c=>c.newPage()))
  const [host,...guests]=pages
  await host.goto(base)
  await host.getByLabel('Nickname').fill(names[0])
  await host.getByRole('button',{name:'Create party'}).click()
  const code=await host.getByTestId('room-code').textContent()
  await chooseGame(host,game)
  for(const [i,guest] of guests.entries()){
   await guest.goto(base+'#/join?room='+code)
   await guest.getByLabel('Nickname').fill(names[i+1])
   await guest.getByRole('button',{name:'Join party'}).tap()
   await guest.getByRole('button',{name:'Ready up',exact:true}).tap()
  }
  await startMatch(host)
  return {pages,close}
 }catch(error){await close();throw error}
}

const choice=(page:Page,group:string,label:string|RegExp)=>page.getByRole('radiogroup',{name:group,exact:true}).getByRole('radio',{name:label,exact:typeof label==='string'})

test('Secret Number exchanges an illustrated ticket only after the invited seat agrees',async({browser,baseURL})=>{
 const {pages:[host,guest,observer],close}=await setup(browser,baseURL!,'secret',['Ari','Bee','Cam'])
 try{
  const desk=host.getByRole('region',{name:'Contact desk'})
  await expect(desk.locator('select')).toHaveCount(0)
  const partner=choice(host,'Contact player','Bee')
  await expect(partner.locator('svg')).toBeVisible()
  expect((await partner.boundingBox())!.height).toBeGreaterThanOrEqual(44)
  await partner.focus()
  await host.keyboard.press('Space')
  const sum=choice(host,'Ticket',/^Sum, 2 available$/)
  await expect(sum).toBeChecked()
  await expect(sum.locator('svg')).toBeVisible()
  await sum.press('ArrowRight')
  await expect(choice(host,'Ticket',/^Product last digit, 2 available$/)).toBeChecked()
  await sum.press('Home')
  await desk.getByRole('button',{name:'Offer contact',exact:true}).click()
  const accept=guest.getByRole('button',{name:'Accept Sum from Ari',exact:true})
  await expect(accept).toBeVisible()
  await expect(observer.getByRole('button',{name:/^Accept Sum/})).toHaveCount(0)
  await accept.tap()
  const notebooks=[host,guest].map(page=>page.getByRole('region',{name:'Private notebook'}).getByRole('listitem'))
  await expect(notebooks[0]).toHaveText(/Round 1 · Bee · Sum = \d+/)
  await expect(notebooks[1]).toHaveText(/Round 1 · Ari · Sum = \d+/)
  expect((await notebooks[0].innerText()).split('=')[1]).toBe((await notebooks[1].innerText()).split('=')[1])
  await expect(observer.getByRole('region',{name:'Private notebook'}).getByRole('listitem')).toHaveCount(0)
  await expect(choice(host,'Ticket',/^Sum, 1 available$/)).toBeChecked()
  await expect(partner).toBeDisabled()
  await host.clock.install()
  for(let round=2;round<=5;round++){
   // Exercise the host's periodic timer as well as the actual phase transition.
   await host.clock.runFor(91_000)
   if(round===5)await expect(host.getByRole('region',{name:'Final guesses'})).toBeVisible()
   else await expect(host.getByText('Contact '+round+' / 4',{exact:true})).toBeVisible()
  }
  const guess=host.getByRole('region',{name:'Final guesses'})
  await expect(guess.locator('select')).toHaveCount(0)
  await guess.getByLabel('Your number').fill('30')
  await guess.getByText('First optional guess',{exact:true}).click()
  await choice(host,'First optional player','Bee').press('Space')
  await guess.getByLabel('First guess').fill('34')
  await guess.getByText('Second optional guess',{exact:true}).click()
  await expect(choice(host,'Second optional player','Bee')).toBeDisabled()
  await choice(host,'Second optional player','Cam').press('Space')
  await guess.getByLabel('Second guess').fill('52')
  await guess.getByRole('button',{name:'Lock guesses',exact:true}).click()
  await expect(host.getByRole('status').filter({hasText:'Guesses locked'})).toContainText('1/3')
  await expect(observer.getByRole('region',{name:'Final guesses'}).getByLabel('Your number')).toHaveValue('')
  expect(await guest.evaluate(()=>document.documentElement.scrollWidth)).toBe(320)
 }finally{await close()}
})

test('Lay the Grass uses distinct pact tokens and swaps real draft seats by agreement',async({browser,baseURL})=>{
 const {pages:[host,guest],close}=await setup(browser,baseURL!,'grass3',['Ari','Bee'])
 try{
  const trade=host.getByRole('group',{name:'Optional trade'})
  await expect(trade).toBeHidden()
  await host.getByText('Swap draft spot',{exact:true}).click()
  await expect(trade.locator('select')).toHaveCount(0)
  const partner=choice(host,'Trade with','Bee')
  await expect(partner.locator('svg')).toBeVisible()
  await expect(choice(host,'Points offered','1 point')).toBeDisabled()
  await expect(choice(host,'Points offered','0 points')).toBeChecked()
  await partner.press('Enter')
  await trade.getByRole('button',{name:'Offer swap',exact:true}).click()
  await expect(guest.getByRole('button',{name:'Accept swap',exact:true})).toBeVisible()
  await expect(host.getByRole('button',{name:'Accept swap',exact:true})).toHaveCount(0)
  await guest.getByRole('button',{name:'Accept swap',exact:true}).tap()
  for(const page of [host,guest]){
   await page.getByText('Standings and order',{exact:true}).click()
   await expect(page.getByText('Draft order: Bee → Ari', {exact:true})).toBeVisible()
   await expect(page.getByRole('button',{name:'Offer swap',exact:true})).toHaveCount(0)
  }
  await host.getByRole('button',{name:'Ready to draft',exact:true}).click()
  await guest.getByRole('button',{name:'Ready to draft',exact:true}).tap()
  await expect(guest.getByText(/Bee drafts next/)).toBeVisible()
  const coordinates=guest.getByText('Place by coordinates',{exact:true})
  await expect(coordinates).toBeVisible()
  await expect(guest.getByRole('combobox',{name:'Row'})).toBeHidden()
  expect(await guest.evaluate(()=>document.documentElement.scrollWidth)).toBe(320)
 }finally{await close()}
})
