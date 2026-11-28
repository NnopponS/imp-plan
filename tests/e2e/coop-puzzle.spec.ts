import {expect,test,type Page} from '@playwright/test'
import {solveRelay} from '../relay-solver'
import {startMatch} from './start-match'
import {chooseGame} from '../lobby-controls'

const board=(p:Page)=>p.getByRole('region',{name:'Mosaic relay'})
test('a 320px solo seat completes a generated frame from just the visible shapes',async({page,baseURL})=>{
 await page.setViewportSize({width:320,height:780});await page.emulateMedia({reducedMotion:'reduce'});await page.clock.install()
 await page.goto(baseURL!+'season/1/');await page.getByRole('button',{name:'Practice Cooperative Puzzle',exact:true}).click()
 await startMatch(page)
 await expect(board(page)).toHaveAttribute('data-relay-status','playing')
 const shapes=await board(page).locator('[data-piece]').evaluateAll(els=>els.map(e=>JSON.parse(e.getAttribute('data-shape')!)))
 const solution=solveRelay(6,6,shapes)!
 expect(solution).toHaveLength(shapes.length)
 for(const f of solution){
  await board(page).locator('[data-piece="'+f.piece+'"]').press('Enter')
  for(let i=0;i<f.orientation;i++)await board(page).getByRole('button',{name:'Rotate 90°'}).press('Enter')
  await board(page).locator('[data-cell="'+f.anchor+'"]').press('Enter')
  await board(page).getByRole('button',{name:'Place tile',exact:true}).press('Enter')
  await expect(board(page).locator('[data-piece="'+f.piece+'"]')).toHaveAttribute('data-fitted','yes')
 }
 await expect(board(page)).toHaveAttribute('data-relay-status','tiled')
 await expect(board(page)).toContainText('Team score: 36 of 36')
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(320)
})
test('two peers share a suggestion, commit, undo and expire together',async({browser,baseURL})=>{
 test.setTimeout(90_000)
 const a=await browser.newContext({reducedMotion:'reduce'}),b=await browser.newContext({viewport:{width:390,height:800},reducedMotion:'reduce'})
 try{
  const h=await a.newPage(),g=await b.newPage()
  await h.clock.install();await g.clock.install()
  await h.goto(baseURL!);await h.getByLabel('Nickname').fill('Cutter');await h.getByRole('button',{name:'Create party'}).click()
  await chooseGame(h,'coopPuzzle')
  const code=await h.getByTestId('room-code').textContent()
  await g.goto(baseURL!+'#/join?room='+code);await g.getByLabel('Nickname').fill('Setter');await g.getByRole('button',{name:'Join party'}).click()
  await g.getByRole('button',{name:'Ready up'}).click();await startMatch(h)
  await expect(h.getByRole('group',{name:'Teammates'})).toContainText('Setter')
  await board(g).locator('[data-cell="0"]').click()
  await expect(board(g).getByRole('button',{name:'Place tile',exact:true})).toBeDisabled()
  await board(g).getByRole('button',{name:'Suggest fit'}).click()
  await board(h).getByRole('button',{name:/Try Setter’s suggestion/}).click()
  await board(h).getByRole('button',{name:'Place tile',exact:true}).click()
  await expect(board(g)).toContainText('Your turn')
  await board(g).locator('[data-piece="0"]').click();await board(g).getByRole('button',{name:'Undo tile 1'}).click()
  await expect(board(h)).toContainText('0 / 36 squares')
  await h.clock.fastForward(301000)
  for(const p of [h,g]){await expect(board(p)).toHaveAttribute('data-relay-status','clock');await expect(board(p)).toContainText('Team score: 0 of 36')}
 }finally{await a.close();await b.close()}
})
