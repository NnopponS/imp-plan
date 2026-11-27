import {test,expect,type Page} from '@playwright/test'
import {baghActions,baghInit,baghStep,type BaghAction} from '../../src/bagh'
import {chooseGame} from '../lobby-controls'
import {startMatch} from './start-match'

const leap=(move:BaghAction):move is Exclude<BaghAction,number>=>typeof move==='object'&&
 Math.max(Math.abs(move.from%5-move.to%5),Math.abs(Math.floor(move.from/5)-Math.floor(move.to/5)))===2
const slate=(p:Page)=>p.getByRole('group',{name:'Bagh Chal board',exact:true})
const node=(p:Page,i:number)=>slate(p).getByRole('button',{name:new RegExp('^Row '+(1+Math.floor(i/5))+', column '+(1+i%5)+',')})
test('Bagh Chal carved board: touch places, mouse captures, and next leg swaps sides',async({browser,baseURL})=>{
 const phone=await browser.newContext({viewport:{width:320,height:690},hasTouch:true,reducedMotion:'reduce'})
 const desktop=await browser.newContext({viewport:{width:1440,height:950},reducedMotion:'reduce'})
 try{
  const host=await phone.newPage(),guest=await desktop.newPage()
  await host.goto(baseURL!)
  await host.getByLabel('Nickname').fill('Keeper')
  await host.getByRole('button',{name:'Create party',exact:true}).tap()
  const code=(await host.getByTestId('room-code').textContent())!
  await chooseGame(host,'bagh')
  await guest.goto(baseURL!+'#/join?room='+code)
  await guest.getByLabel('Nickname').fill('Ranger')
  await guest.getByRole('button',{name:'Join party'}).click()
  await guest.getByRole('button',{name:'Ready up'}).click()
  await startMatch(host)
  await expect(host.getByText('You play goats.',{exact:true})).toBeVisible()
  await expect(guest.getByText('You play tigers.',{exact:true})).toBeVisible()
  await expect(slate(host).locator('[data-piece=tiger] .bagh-carving')).toHaveCount(4)
  await expect(slate(host).getByRole('button')).toHaveCount(25)
  await expect(slate(host).locator('[data-bagh-hint=place]')).toHaveCount(21)
  await expect(slate(guest).locator('[data-bagh-hint]')).toHaveCount(0)
  await expect(slate(host).locator('image')).toHaveCount(1)
  const size=await node(host,6).boundingBox()
  expect(size!.width).toBeGreaterThanOrEqual(44)
  expect(size!.height).toBeGreaterThanOrEqual(44)
  let game=baghInit()
  for(let turn=0;turn<5;turn++){
   const placements=baghActions(game,0).filter((i):i is number=>typeof i==='number')
   const place=placements.find(i=>baghActions(baghStep(game,0,i)!,1).some(leap))!
   game=baghStep(game,0,place)!
   const capture=baghActions(game,1).find(leap)!
   await expect(node(host,place)).toHaveAttribute('data-bagh-hint','place')
   await node(host,place).tap()
   await expect(node(guest,place)).toHaveAttribute('data-piece','goat')
   await expect(host.locator('[data-register=goat] [data-filled=true]')).toHaveCount(19-turn)
   await expect(slate(host).locator('[data-bagh-hint]')).toHaveCount(0)
   await node(guest,capture.from).click()
   await expect(node(guest,capture.to)).toHaveAttribute('data-bagh-hint','leap')
   await expect(node(guest,capture.to)).toHaveAccessibleDescription('Capture landing')
   await expect(node(guest,place)).toHaveAttribute('data-capturable','true')
   await expect(slate(host).locator('[data-capturable]')).toHaveCount(0)
   if(turn===0){
    await host.screenshot({path:test.info().outputPath('bagh-carved-320.png')})
    await guest.screenshot({path:test.info().outputPath('bagh-carved-leap-1440.png')})
   }
   await node(guest,capture.to).click()
   await expect(node(host,place)).not.toHaveAttribute('data-piece','goat')
   await expect(node(host,capture.to)).toHaveAttribute('data-piece','tiger')
   await expect(guest.locator('[data-register=tiger] [data-filled=true]')).toHaveCount(turn+1)
   game=baghStep(game,1,capture)!
  }
  await expect(host.getByRole('heading',{name:'Ranger wins',exact:true})).toBeVisible()
  expect(await host.evaluate(()=>document.documentElement.scrollWidth)).toBe(320)
  await host.getByRole('button',{name:'Next leg',exact:true}).tap()
  await expect(host.getByText('You play tigers.',{exact:true})).toBeVisible()
  await expect(guest.getByText('You play goats.',{exact:true})).toBeVisible()
  await expect(guest.locator('[data-register=goat] [data-filled=true]')).toHaveCount(20)
 }finally{await Promise.allSettled([desktop.close(),phone.close()])}
})
