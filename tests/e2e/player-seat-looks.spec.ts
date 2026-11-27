import {expect,test} from '@playwright/test'

const looks=(page:import('@playwright/test').Page)=>page.locator('.party-seat[data-seat-look]')
 .evaluateAll(nodes=>Object.fromEntries(nodes.map(node=>[node.querySelector('strong')?.textContent,node.getAttribute('data-seat-look')])))

test('an untouched wardrobe assigns different portraits for each seat and preserves them on reload',async({browser,baseURL})=>{
 const first=await browser.newContext({reducedMotion:'reduce'})
 const second=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'})
 try{
  const host=await first.newPage(),guest=await second.newPage()
  await host.goto(baseURL!)
  await host.getByLabel('Nickname').fill('Copper')
  await host.getByRole('button',{name:'Create party',exact:true}).click()
  const code=(await host.getByTestId('room-code').textContent())!
  await guest.goto(baseURL!+'#/join?room='+code)
  await guest.getByLabel('Nickname').fill('Indigo')
  await guest.getByRole('button',{name:'Join party',exact:true}).click()
  await expect.poll(async()=>Object.keys(await looks(host)).length).toBe(2)
  const portraits=await looks(host)
  expect(portraits.Copper).not.toBe(portraits.Indigo)
  await expect.poll(()=>looks(guest)).toEqual(portraits)
  await guest.reload()
  await expect.poll(()=>looks(guest)).toEqual(portraits)
 }finally{await Promise.all([first.close(),second.close()])}
})
