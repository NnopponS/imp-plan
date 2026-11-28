import {expect,test,type Page} from '@playwright/test'
import {wallGo2Bot,wallGo2Play,wallGo2Start,wallGo2View,wallGo2Draft} from '../../src/wall-go2'
import {chooseGame,selectedGame} from '../lobby-controls'

const board=(page:Page)=>page.getByRole('region',{name:'Wall Go II territory board'})
const cell=(page:Page,index:number)=>board(page).locator(`[data-cell="${index}"]`)
const coord=(i:number)=>String.fromCharCode(65+i%7)+(1+Math.floor(i/7))

test('Wall Go II reaches the same result across a desktop host and a phone guest',async({browser,baseURL})=>{
 test.setTimeout(105000)
 const hostContext=await browser.newContext({viewport:{width:1160,height:890},reducedMotion:'reduce'})
 const guestContext=await browser.newContext({viewport:{width:360,height:790},hasTouch:true,reducedMotion:'reduce'})
 try{
  const host=await hostContext.newPage(),guest=await guestContext.newPage()
  await host.goto(baseURL!+'season/3/')
  const card=host.locator('article').filter({has:host.getByRole('heading',{name:'Wall Go II',exact:true})})
  await expect(card.getByRole('button',{name:'Practice Wall Go II',exact:true})).toBeVisible()
  await expect.poll(()=>card.locator('img[data-arena-art]').evaluate((n:HTMLImageElement)=>n.complete&&n.naturalWidth>0)).toBe(true)
  await host.getByLabel('Nickname').fill('Ada')
  await host.getByRole('button',{name:'Create party'}).click()
  const code=(await host.getByTestId('room-code').textContent())!
  await chooseGame(host,'wallGo2')
  await expect(selectedGame(host,'wallGo2')).toBeVisible()
  await guest.goto(baseURL!+'#/join?room='+code)
  await guest.getByLabel('Nickname').fill('Mina')
  await guest.getByRole('button',{name:'Join party'}).click()
  await guest.getByRole('button',{name:'Ready up'}).click()

  await host.getByRole('button',{name:'Start match',exact:true}).click()
  const dialog=host.getByRole('dialog')
  await expect(dialog.getByRole('img',{name:'Seats place pieces in the order 1, 2, 3, 3, 2, 1'})).toBeVisible()
  await dialog.getByRole('button',{name:'Go to lesson page 3: Round bends the route'}).click()
  await expect(dialog.getByRole('img',{name:'A round stone moves east then south and builds to the east'})).toBeVisible()
  await expect(dialog.locator('[data-wall2-lesson="2"] .w2-lesson-turn')).toHaveCSS('animation-name','none')
  await dialog.getByRole('button',{name:'Enter match',exact:true}).click()
  await expect(board(host).getByRole('timer',{name:'Turn time remaining'})).toBeVisible()
  await cell(host,0).focus()
  await host.keyboard.press('ArrowRight')
  await expect(cell(host,1)).toBeFocused()
  await expect(cell(host,1)).toHaveAccessibleName('B1 · available draft tile')

  const seats=['Ada','Mina'],pages=[host,guest]
  let g=wallGo2Start(seats)
  const opening=[24,25,30,18]
  let sawCommittedRoute=false
  for(let step=0;step<93&&!g.result;step++){
   const page=pages[g.turn],other=pages[1-g.turn],seat=seats[g.turn]
   const v=wallGo2View(g,seat)
   const action=step<4?wallGo2Draft('square',opening[step]):wallGo2Bot(v,seat,31,'hard')!
   const c=v.legal.find(p=>p.code===action)!
   await expect(board(page)).toHaveAttribute('data-step',String(step))
   if('shape' in c){
    if(page===guest)await cell(page,c.cell).tap()
    else await cell(page,c.cell).click()
   }else{
    if(page===guest)await cell(page,c.from).tap()
    else await cell(page,c.from).click()
    if(page===guest)await cell(page,c.to).tap()
    else await cell(page,c.to).click()
    const choice=board(page).getByRole('button',{name:'Via '+coord(c.via??c.to),exact:true})
    if(await choice.count())await choice.click()
    if(!sawCommittedRoute){
     await expect(board(other).locator('.w2-socket')).toHaveCount(0)
     await expect(board(other).locator('.w2-wall')).toHaveCount(0)
     sawCommittedRoute=true
    }
    const commit=board(page).locator(`[data-wall-choice="${c.wall}"]`)
    if(page===guest)await commit.tap()
    else await commit.click()
   }
   g=wallGo2Play(g,seat,action)!
  }
  expect(g.result).not.toBeNull()
  const outcomes=[]
  for(const p of pages){
   const result=board(p).getByTestId('wall-go2-result')
   await expect(result).toContainText(g.result!.winners[0])
   await expect(board(p).locator('[data-owned]')).toHaveCount(wallGo2View(g,'-').score.totals.reduce((n,s)=>n+s,0))
   outcomes.push(await result.textContent())
  }
  expect(outcomes[0]).toBe(outcomes[1])
  expect(await guest.evaluate(()=>document.documentElement.scrollWidth)).toBe(360)
 }finally{await Promise.allSettled([hostContext.close(),guestContext.close()])}
})
