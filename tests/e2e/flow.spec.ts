import {startMatch} from './start-match'
import {chooseGame} from '../lobby-controls'
import {test,expect} from '@playwright/test'
test('two isolated browser contexts play a duel, resume, and rematch',async({browser,baseURL})=>{
 const first=await browser.newContext(),second=await browser.newContext({viewport:{width:390,height:844},hasTouch:true})
 const h=await first.newPage(),g=await second.newPage()

 await h.goto(baseURL!)
 await h.getByLabel('Nickname').fill('Host')
 await h.getByRole('button',{name:'Create party'}).click()
 const code=(await h.getByTestId('room-code').textContent())!
 expect(code).toMatch(/^[A-Z2-9]{6}$/)
 await g.goto(baseURL!+'#/join?room='+code)
 await g.getByLabel('Nickname').fill('Guest')
 await g.getByRole('button',{name:'Join party'}).click()
 await expect(g.getByRole('button',{name:'Ready up'})).toBeVisible({timeout:12000}).catch(async e=>{console.log('Guest room:',await g.locator('main').innerText());throw e});await g.getByRole('button',{name:'Ready up'}).click()
 await expect(h.getByText('Guest', {exact:true})).toBeVisible()
 await startMatch(h)
 await expect(h.getByText('Your turn')).toBeVisible()
 for(let i=1;i<=4;i++){
  await h.getByRole('button',{name:'Row 1, column '+i+', open',exact:true}).click()
  await g.getByRole('button',{name:'Row 2, column '+i+', open',exact:true}).click()
 }
 await g.reload()
 await expect(g.getByText('FAN MODE · Round 1 of 1')).toBeVisible()
 await h.getByRole('button',{name:'Row 1, column 5, open',exact:true}).click()
 await expect(g.getByText('Host wins')).toBeVisible()
 await h.getByRole('button',{name:'Rematch'}).click()
 await expect(g.getByText('Your turn')).toBeVisible()
 h.once('dialog',d=>d.accept())
 await h.getByRole('button',{name:'Return to lobby'}).click()
 await expect(g.getByRole('button',{name:'Ready up'})).toBeVisible()
 await h.getByRole('button',{name:'Leave room'}).click()
 await expect(g.getByText('The host ended this room.')).toBeVisible()
 await first.close();await second.close()
})
test('mobile keyboard flow and two playable offline engines',async({page})=>{
 await page.setViewportSize({width:390,height:844})
 await page.goto('./')
 await page.getByRole('button',{name:'Solo practice'}).press('Enter')
 await chooseGame(page,'morris')
 await startMatch(page)
 await expect(page.getByRole('button',{name:'Point 1, open',exact:true})).toHaveAttribute('aria-disabled','false')
 const p=page.getByRole('button',{name:'Point 1, open',exact:true});await p.focus();await page.keyboard.press('Enter')
 await expect(page.getByRole('button',{name:'Point 1, Player',exact:true})).toBeVisible()
 page.once('dialog',d=>d.accept());await page.getByRole('button',{name:'Return to lobby'}).click()
 await chooseGame(page,'auction')
 await startMatch(page)
 for(let i=1;i<=8;i++){
  await expect(page.getByText('Sealed round '+i+' / 8')).toBeVisible()
  await page.getByRole('button',{name:'Pass'}).click()
 }
 await expect(page.getByText('Bot 1 wins')).toBeVisible()
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(390)
})
