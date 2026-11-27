import {expect,test,type Page} from '@playwright/test'
import {startMatch} from './start-match'

const table=(p:Page)=>p.getByRole('region',{name:'Remove One table'})
const own=(p:Page)=>table(p).locator('.remove-hand')
const pub=(p:Page)=>table(p).locator('.remove-seats')

test('the etched table keeps live choices sealed and reveals the same public cards on both screens',async({browser,baseURL})=>{
 const desktop=await browser.newContext(),phone=await browser.newContext({viewport:{width:320,height:690},hasTouch:true,isMobile:true,reducedMotion:'reduce'})
 try{
  const host=await desktop.newPage(),guest=await phone.newPage()
  await host.goto(baseURL!+'season/2/')
  await host.getByLabel('Nickname').fill('Ada')
  await host.getByRole('button',{name:'Create party'}).click()
  const code=(await host.getByTestId('room-code').textContent())!
  await host.getByRole('button',{name:'Choose game'}).click()
  await host.getByRole('searchbox',{name:'Find a game'}).fill('Remove One')
  await host.getByRole('button',{name:/^Remove One/}).click()
  await host.getByRole('button',{name:'Add bot'}).click()
  await guest.goto(baseURL!+'#/join?room='+code)
  await guest.getByLabel('Nickname').fill('Mina')
  await guest.getByRole('button',{name:'Join party'}).tap()
  await guest.getByRole('button',{name:'Ready up'}).tap()
  await startMatch(host)
  const discardFirst=(p:Page)=>own(p).getByRole('button',{name:/Discard \d+, card 1/})
  for(const p of [host,guest]){
   await expect(table(p).locator('img.remove-table-art')).toHaveAttribute('src',/remove-live-chamber\.svg$/)
   await expect(own(p).locator('[data-private-value]')).toHaveCount(2)
   await expect(pub(p).locator('[data-face="back"]')).toHaveCount(3)
   await expect(pub(p).locator('[data-public-value]')).toHaveCount(0)
  }
  await discardFirst(host).press('Enter')
  await expect(own(host)).toHaveAttribute('data-sealed','true')
  await expect(table(host).getByText('Discard sealed',{exact:true})).toBeFocused()
  await expect(own(host).locator('[data-private-value]')).toHaveCount(0)
  await expect(own(host).locator('[data-face="back"]')).toHaveCount(2)
  await expect(own(guest).locator('[data-private-value]')).toHaveCount(2)
  await expect(pub(guest).locator('[data-public-value]')).toHaveCount(0)
  await expect(pub(guest).locator('[data-face="back"]')).toHaveCount(3)
  await expect(discardFirst(guest)).toBeInViewport()
  expect((await discardFirst(guest).boundingBox())!.width).toBeGreaterThanOrEqual(44)
  await discardFirst(guest).tap()
  const values=async(p:Page)=>pub(p).locator('[data-public-value]').evaluateAll(nodes=>nodes.map(node=>Number(node.getAttribute('data-public-value'))))
  for(const p of [host,guest]){
   await expect(table(p).getByText('Round 2 / 8',{exact:true})).toBeVisible()
   await expect(pub(p).locator('[data-public-value]')).toHaveCount(3)
   await expect(own(p).locator('[data-private-value]')).toHaveCount(2)
  }
  await expect(discardFirst(host)).toBeFocused()
  expect(await values(host)).toEqual(await values(guest))
  const publicValues=await values(host)
  const unique=publicValues.filter(n=>publicValues.filter(x=>x===n).length===1)
  expect(await table(host).getByRole('status').innerText()).toMatch(unique.length?/wins 2 chips/:/no unique card/)
  expect(await pub(guest).locator('[data-public-value]').first().evaluate(n=>n.getAnimations({subtree:true}).length)).toBe(0)
  expect(await guest.evaluate(()=>document.documentElement.scrollWidth)).toBe(320)
 }finally{
  await Promise.all([desktop.close(),phone.close()])
 }
})
