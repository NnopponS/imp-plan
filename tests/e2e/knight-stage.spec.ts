import {expect,test,type Page} from '@playwright/test'
import {chooseSetting,tableSwitch} from '../lobby-controls'
import {startMatch} from './start-match'

const stage=(page:Page)=>page.getByRole('region',{name:'Knight’s Tour table'})
const board=(page:Page)=>stage(page).getByRole('group',{name:'Knight’s Tour board'})
const position=(i:number,size:number)=>String.fromCharCode(65+i%size)+(Math.floor(i/size)+1)
const square=(page:Page,name:string)=>board(page).getByRole('button',{name:new RegExp('^'+name+'(?:,|$)')})
const progress=(page:Page)=>stage(page).getByRole('progressbar',{name:'Tour progress'})
async function practice(page:Page,base:string){
 await page.goto(base+'season/2/',{waitUntil:'domcontentloaded'})
 await page.getByRole('button',{name:'Practice Knight’s Tour',exact:true}).click()
}
function landings(path:number[]){
 const last=path.at(-1)!, x=last%5,y=Math.floor(last/5)
 return [[1,2],[1,-2],[-1,2],[-1,-2],[2,1],[2,-1],[-2,1],[-2,-1]].flatMap(([dx,dy])=>{
  const nx=x+dx,ny=y+dy,next=ny*5+nx
  return nx>=0&&nx<5&&ny>=0&&ny<5&&!path.includes(next)?[next]:[]
 })
}
function solve(path:number[]):number[]|null{
 if(path.length===25)return path
 const options=landings(path).sort((a,b)=>landings([...path,a]).length-landings([...path,b]).length)
 for(const next of options){
  const result=solve([...path,next])
  if(result)return result
 }
 return null
}

test('320px practice traces a full 5×5 route by touch, with genuine undo and end-of-match rematch',async({browser,baseURL})=>{
 const phone=await browser.newContext({viewport:{width:320,height:620},hasTouch:true,reducedMotion:'reduce'})
 try{
  const page=await phone.newPage()
  await practice(page,baseURL!)
  await startMatch(page)
  await expect(stage(page).getByText('5 × 5 · Open tour',{exact:true})).toBeVisible()
  await expect(stage(page).getByRole('timer',{name:'Time remaining'})).toBeVisible()
  await expect(progress(page)).toHaveAttribute('aria-valuenow','1')
  const here=board(page).getByRole('button',{name:/, knight/})
  const coordinate=(await here.getAttribute('aria-label'))!.split(',')[0]
  const start=(Number(coordinate.slice(1))-1)*5+coordinate.charCodeAt(0)-65
  const route=solve([start])!
  expect(route).toHaveLength(25)
  await expect(here.locator('svg')).toBeVisible()
  const undo=stage(page).getByRole('button',{name:'Undo step'})
  await expect(undo).toBeDisabled()
  const first=square(page,position(route[1],5))
  const target=await first.boundingBox()
  expect(target!.width).toBeGreaterThanOrEqual(44)
  expect(target!.height).toBeGreaterThanOrEqual(44)
  await expect(first).toHaveAccessibleName(/legal move/)
  await first.tap()
  await expect(progress(page)).toHaveAttribute('aria-valuenow','2')
  await expect(square(page,coordinate)).toHaveAccessibleName(/visited 1/)
  await expect(board(page).locator('[data-path-jumps="1"]')).toBeVisible()
  await undo.tap()
  await expect(progress(page)).toHaveAttribute('aria-valuenow','1')
  await expect(stage(page).getByText('2 visited (best)',{exact:true})).toBeVisible()
  await expect(undo).toBeDisabled()
  await expect(page.getByRole('button',{name:'Rematch',exact:true})).toHaveCount(0)
  for(let i=1;i<route.length;i++){
   const next=square(page,position(route[i],5))
   await expect(next).toHaveAccessibleName(/legal move/)
   await next.tap()
   await expect(progress(page)).toHaveAttribute('aria-valuenow',String(i+1))
   if(i===6)await board(page).screenshot({path:test.info().outputPath('knight-320-route.png')})
  }
  await expect(stage(page).getByRole('status')).toHaveText('Tour complete.')
  await expect(board(page).locator('[data-path-jumps="24"]')).toBeVisible()
  await expect(board(page).getByRole('button',{name:/legal move/})).toHaveCount(0)
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(320)
  await page.getByRole('button',{name:'Rematch',exact:true}).tap()
  await expect(progress(page)).toHaveAttribute('aria-valuenow','1')
 }finally{await phone.close()}
})

test('390px closed tour is navigable by arrow/Home/End, with explicit legal and visited states',async({page,baseURL})=>{
 await page.setViewportSize({width:390,height:844})
 await page.emulateMedia({reducedMotion:'reduce'})
 await practice(page,baseURL!)
 await chooseSetting(page,'Board size','6')
 await tableSwitch(page,'Closed tour').click()
 await startMatch(page)
 await expect(stage(page).getByText('6 × 6 · Closed tour',{exact:true})).toBeVisible()
 await expect(board(page).getByRole('button')).toHaveCount(36)
 await expect(board(page).locator('button[tabindex="0"]')).toHaveCount(1)
 await square(page,'A1').focus()
 await page.keyboard.press('ArrowLeft')
 await expect(square(page,'A1')).toBeFocused()
 await page.keyboard.press('End')
 await expect(square(page,'F1')).toBeFocused()
 await page.keyboard.press('ArrowRight')
 await expect(square(page,'F1')).toBeFocused()
 await page.keyboard.press('ArrowDown')
 await expect(square(page,'F2')).toBeFocused()
 await page.keyboard.press('Home')
 await expect(square(page,'A2')).toBeFocused()
 await board(page).getByRole('button',{name:/legal move/}).first().press('Space')
 await expect(progress(page)).toHaveAttribute('aria-valuenow','2')
 const visited=board(page).getByRole('button',{name:/visited 1/})
 await expect(visited).toHaveAttribute('aria-disabled','true')
 await visited.press('Enter')
 await expect(progress(page)).toHaveAttribute('aria-valuenow','2')
 await stage(page).getByRole('button',{name:'Undo step'}).press('Enter')
 await expect(progress(page)).toHaveAttribute('aria-valuenow','1')
 await expect(board(page).locator('[data-path-jumps]')).toHaveCount(0)
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(390)
})
