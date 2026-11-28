import {startMatch} from './start-match'
import {chooseGame} from '../lobby-controls'
import {test,expect} from '@playwright/test'

test('Equation Lights keeps equations private and gives the guest a final response on mobile',async({browser,baseURL},info)=>{
 const hctx=await browser.newContext(),vctx=await browser.newContext({viewport:{width:360,height:780},hasTouch:true})
 try{
  const h=await hctx.newPage(),v=await vctx.newPage()
  await h.goto(baseURL!+'season/3/')
  await h.getByLabel('Nickname').fill('Setter')
  await h.getByRole('button',{name:'Create party'}).click()
  const invite=(await h.getByTestId('room-code').textContent())!
  await chooseGame(h,'equations')
  await v.goto(baseURL!+'#/join?room='+invite)
  await v.getByLabel('Nickname').fill('Challenger')
  await v.getByRole('button',{name:'Join party'}).click()
  await v.getByRole('button',{name:'Ready up'}).click()
  await startMatch(h)
  await expect(v.getByText('Waiting for the other player to lock an equation.')).toBeVisible()
  await h.getByLabel('Secret equation').fill('12+13=26')
  await expect(h.getByRole('button',{name:'Lock equation'})).toBeDisabled()
  await h.getByLabel('Secret equation').fill('12+13=25')
  await h.getByLabel('Secret equation').press('Enter')
  await v.getByLabel('Secret equation').fill('20+30=50')
  await expect(v.getByText('12+13=25',{exact:true})).toHaveCount(0)
  await v.getByRole('button',{name:'Lock equation'}).click()
  await h.getByLabel('Your guess').fill('20+30=50')
  await h.getByRole('button',{name:'Submit guess'}).click()
  const feedback=h.getByRole('list',{name:'Guess 1'}).getByRole('listitem').filter({hasText:'Exact'})
  await expect(feedback).toHaveCount(8)
  await expect(feedback.locator('svg.equation-lamp')).toHaveCount(8)
  await h.locator('.equations').screenshot({path:info.outputPath('equation-lights-feedback.png')})
  await expect(v.getByText('Final reply: match all eight symbols to tie.')).toBeVisible()
  await expect(v.getByRole('list',{name:'Guess 1'})).toHaveCount(0)
  await v.getByLabel('Your guess').fill('1213=25')
  await v.getByLabel('Your guess').press('Home')
  await v.getByLabel('Your guess').press('ArrowRight')
  await v.getByLabel('Your guess').press('ArrowRight')
  await v.getByRole('button',{name:'Plus',exact:true}).tap()
  await expect(v.getByLabel('Your guess')).toHaveValue('12+13=25')
  await v.getByLabel('Your guess').press('Enter')
  await expect(v.getByRole('heading',{name:'Shared result'})).toBeVisible()
  expect(await v.evaluate(()=>document.documentElement.scrollWidth)).toBe(360)
 }finally{await hctx.close();await vctx.close()}
})

test('Equation Lights practice adds a bot that locks and takes a legal turn',async({page})=>{
 await page.goto('./season/3/')
 await page.getByLabel('Nickname').fill('Solver')
 await page.getByRole('button',{name:/Practice Equation Lights/}).click()
 await startMatch(page)
 await page.getByLabel('Secret equation').fill('12+13=25')
 await page.getByRole('button',{name:'Lock equation'}).click()
 await page.getByLabel('Your guess').fill('20+30=50')
 await page.getByRole('button',{name:'Submit guess'}).click()
 await expect(page.getByText('Bot 1 · 1/8 guesses',{exact:true})).toBeVisible()
})

test('Equation Lights gives its short mobile table readable ink and an inline lock',async({page},info)=>{
 await page.setViewportSize({width:320,height:640})
 await page.emulateMedia({reducedMotion:'reduce'})
 await page.goto('./season/3/')
 await page.getByRole('button',{name:'Practice Equation Lights',exact:true}).click()
 await startMatch(page)
 const input=page.getByLabel('Secret equation')
 await expect(input).toBeEnabled()
 await page.evaluate(()=>window.scrollTo(0,0))
 const table=page.locator('.equations')
 const ink=await table.evaluate(board=>{
  const colors=(s:string)=>Array.from(s.matchAll(/\d+\.?\d*/g),part=>Number(part[0]))
  function lightness(rgb:number[]){
   return rgb.slice(0,3).map(v=>v/255).map(v=>v<=0.04045?v/12.92:((v+0.055)/1.055)**2.4)
    .reduce((sum,value,i)=>sum+value*[0.2126,0.7152,0.0722][i],0)
  }
  return ['[role=status]','.equation-form label','#equation-hint'].map(selector=>{
   const text=board.querySelector(selector)!
   let surface:Element|null=text,bg:number[]=[]
   while(surface){
    bg=colors(getComputedStyle(surface).backgroundColor)
    if(bg.length===3||bg[3]===1)break
    surface=surface.parentElement
   }
   const l=[lightness(colors(getComputedStyle(text).color)),lightness(bg)].sort((a,b)=>b-a)
   return (l[0]+.05)/(l[1]+.05)
  })
 })
 expect(Math.min(...ink)).toBeGreaterThanOrEqual(4.5)
 const [field,lock]=await Promise.all([input.boundingBox(),table.getByRole('button',{name:'Lock equation'}).boundingBox()])
 expect(Math.abs((field!.y+field!.height)-(lock!.y+lock!.height))).toBeLessThan(2)
 expect(lock!.y+lock!.height).toBeLessThan(420)
 const keys=table.getByRole('group',{name:'Equation operators'})
 await expect(keys).toBeInViewport({ratio:1})
 const lamps=await table.getByRole('list',{name:'Feedback legend'}).locator('.equation-lamp-rim').evaluateAll(paths=>paths.map(path=>path.getAttribute('d')))
 expect(new Set(lamps).size).toBe(3)
 const operators=await keys.locator('.equation-key-face .equation-key-glyph').evaluateAll(paths=>paths.map(path=>path.getAttribute('d')))
 expect(operators).toHaveLength(5)
 expect(new Set(operators).size).toBe(5)
 await page.screenshot({path:info.outputPath('equation-lights-320.png')})
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(320)
})
