import {test,expect} from '@playwright/test'
import {chooseGame} from '../lobby-controls'
import {startMatch} from './start-match'
import {pieceSide,type PieceCell} from '../../src/piece'
import {solvePiece} from '../piece-solver'

test('two players rotate and fit the visible Piece Puzzle, alternating keyboard and touch',async({browser,baseURL})=>{
 const desktop=await browser.newContext(),mobile=await browser.newContext({viewport:{width:360,height:780},hasTouch:true,reducedMotion:'reduce'})
 try{
  const host=await desktop.newPage(),guest=await mobile.newPage()
  await host.goto(baseURL!+'season/3/')
  await host.getByLabel('Nickname').fill('Ari')
  await host.getByRole('button',{name:'Create party'}).click()
  await chooseGame(host,'piece')
  const code=(await host.getByTestId('room-code').textContent())!
  await guest.goto(baseURL!+'#/join?room='+code)
  await guest.getByLabel('Nickname').fill('Bee')
  await guest.getByRole('button',{name:'Join party'}).click()
  await guest.getByRole('button',{name:'Ready up'}).click()
  await startMatch(host)
  const board=(page:typeof host)=>page.getByRole('region',{name:'Piece Puzzle workshop'})
  const play=board(host)
  await expect(play.getByLabel('Time remaining')).toHaveText(/^(4:00|3:59)$/)
  const target=await play.getByRole('group',{name:'Piece silhouette'}).getByRole('button').evaluateAll(buttons=>buttons.map(b=>b.getAttribute('data-target')==='true'))
  const pieces=await play.getByRole('group',{name:'Piece tray'}).getByRole('button').evaluateAll(buttons=>buttons.map(b=>JSON.parse(b.getAttribute('data-shape')!))) as PieceCell[][]
  const solution=solvePiece({target,pieces})!
  expect(solution).not.toBeNull()
  await play.getByRole('button',{name:'Use clue (−20 s)',exact:true}).click()
  await expect(board(guest).getByLabel('Time remaining')).toHaveText(/^[23]:/)
  await expect(board(guest).getByText(/Clue: try piece 1/)).toBeVisible()
  for(const [i,fit] of solution.entries()){
   const page=i%2?host:guest,other=page===host?guest:host
   const panel=board(page)
   await expect(panel.getByRole('status')).toContainText('Your turn')
   await expect(board(other).getByRole('button',{name:'Pass turn'})).toBeDisabled()
   const p=panel.getByRole('button',{name:new RegExp('^Piece '+(i+1)+',')})
   if(page===guest)await p.tap()
   else await p.press('Enter')
   const rotate=panel.getByRole('button',{name:'Rotate clockwise'})
   for(let r=0;r<fit.rotation;r++)await rotate.click()
   const row=Math.floor(fit.anchor/pieceSide)+1,col=fit.anchor%pieceSide+1
   const cell=panel.getByRole('button',{name:new RegExp('^Row '+row+', column '+col+',')})
   if(page===guest)await cell.tap()
   else await cell.press('Enter')
  }
  for(const page of [host,guest]){
   await expect(page.getByRole('heading',{name:'Silhouette complete'})).toBeVisible()
   await expect(board(page).getByRole('status')).toContainText('Rated time:')
  }
  expect(await guest.evaluate(()=>document.documentElement.scrollWidth)).toBe(360)
 }finally{await desktop.close();await mobile.close()}
})
