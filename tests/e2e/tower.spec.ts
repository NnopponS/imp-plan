import {startMatch} from './start-match'
import {test,expect} from '@playwright/test'
import {towerPacks} from '../../src/tower'
const signature=(s:string)=>s.split('').sort().join('')
function solve(pack:readonly string[],letters:string,n:number,i=0,chosen:string[]=[]):string[]|null{
 if(chosen.length===n)return signature(chosen.join(''))===signature(letters)?chosen:null
 for(let j=i;j<=pack.length-(n-chosen.length);j++){
  const found=solve(pack,letters,n,j+1,[...chosen,pack[j]])
  if(found)return found
 }
 return null
}
test('Word Tower passes control between two browsers and clears a complete tower',async({browser,baseURL})=>{
 const desktop=await browser.newContext(),mobile=await browser.newContext({viewport:{width:360,height:780},hasTouch:true})
 try{
  const host=await desktop.newPage(),guest=await mobile.newPage()
  await host.goto(baseURL!+'season/1/')
  await host.getByLabel('Nickname').fill('Ari')
  await host.getByRole('button',{name:'Create party'}).click()
  const code=(await host.getByTestId('room-code').textContent())!
  await host.getByLabel('Game').selectOption('tower')
  await guest.goto(baseURL!+'#/join?room='+code)
  await guest.getByLabel('Nickname').fill('Bee')
  await guest.getByRole('button',{name:'Join party'}).click()
  await guest.getByRole('button',{name:'Ready up'}).click()
  await startMatch(host)
  const board=(page:typeof host)=>page.getByRole('region',{name:'Word Tower workshop'})
  const tray=(page:typeof host)=>board(page).getByLabel('Letter tray')
  const theme=(await board(host).getByText(/3 words · /).innerText()).split(' · ')[1] as keyof typeof towerPacks
  const letters=(await tray(host).getByRole('button').allTextContents()).join('').replace(/\s/g,'')
  expect(await solve(towerPacks[theme],letters,3)).not.toBeNull()
  const words=solve(towerPacks[theme],letters,3)!
  const plan=words.flatMap((word,col)=>[...word].map(letter=>({col:col+1,letter})))
  await expect(board(host).getByText('One possible solution')).toHaveCount(0)
  for(let i=0;i<plan.length;i+=2){
   const page=(i/2)%2?guest:host,idle=page===host?guest:host
   await expect(board(page).getByRole('status')).toContainText('Your turn')
   await expect(board(idle).getByRole('button',{name:'Pass turn'})).toBeDisabled()
   for(const {col,letter} of plan.slice(i,i+2)){
    const tile=tray(page).locator(`[data-letter="${letter}"]`).first()
    const target=board(page).getByRole('button',{name:'Add to column '+col,exact:true})
    if(page===guest){await tile.tap();await target.tap()}else{await tile.press('Enter');await target.press('Enter')}
   }
   await board(page).getByRole('button',{name:'Commit turn'}).click()
  }
  for(const page of [host,guest]){
   await expect(page.getByRole('heading',{name:'Tower cleared'})).toBeVisible()
   await expect(board(page).getByRole('status')).toContainText('3 / 3 words')
   await expect(board(page).getByText('One possible solution')).toBeVisible()
  }
  expect(await guest.evaluate(()=>document.documentElement.scrollWidth)).toBe(360)
 }finally{await desktop.close();await mobile.close()}
})
