import {startMatch} from './start-match'
import {chooseGame,selectedGame,chooseSetting,settingChoice} from '../lobby-controls'
import {test,expect} from '@playwright/test'
import {countRectangles} from '../../src/puzzles'
test('play four rectangle rounds on mobile and start a rematch',async({page})=>{
 await page.setViewportSize({width:360,height:760})
 await page.goto('./')
 await page.getByLabel('Nickname').fill('Puzzle fan')
 await page.getByRole('button',{name:/Practice Count the Rectangles/}).click()
 await expect(selectedGame(page,'rectangles')).toBeVisible()
 await startMatch(page)
 for(let n=1;n<=4;n++){
  await expect(page.getByText('Grid '+n+' / 4')).toBeVisible()
  const grid=page.getByRole('group',{name:'Rectangle grid'})
  const tiles=grid.getByRole('button')
  const values=(await tiles.allTextContents()).map(Number)
  const target=Number(await page.locator('.puzzle-target strong').textContent())
  await tiles.first().click()
  await expect(tiles.first()).toHaveAttribute('aria-pressed','true')
  await page.getByRole('button',{name:'Clear highlights'}).click()
  await expect(tiles.first()).toHaveAttribute('aria-pressed','false')
  const count=countRectangles(values,3+n,Math.max(5,3+n),target)
  await page.getByLabel('Rectangle count').fill(String(count))
  await page.getByRole('button',{name:'Lock answer'}).click()
 }
 await expect(page.getByText('4 correct')).toBeVisible()
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(360)
 await page.getByRole('button',{name:'Rematch'}).click()
 await expect(page.getByText('Grid 1 / 4')).toBeVisible()
})
test('hex launches into a 19-tile study phase without a visible target',async({page})=>{
 await page.goto('./')
 await page.getByLabel('Nickname').fill('Puzzle fan')
 await page.getByRole('button',{name:/Practice Hexagon/}).click()
 await expect(selectedGame(page,'hex')).toBeVisible()
 await startMatch(page)
 await expect(page.getByRole('button',{name:/^Tile \d+, value \d+$/})).toHaveCount(19)
 await expect(page.getByText(/Study the board/)).toBeVisible()
 await expect(page.getByText('Target sum')).toHaveCount(0)
 await expect(page.getByRole('button',{name:'Lock answer'})).toHaveCount(0)
})

test('two players complete the three Exile grids with private answers including mobile',async({browser,baseURL})=>{
 const hctx=await browser.newContext(),vctx=await browser.newContext({viewport:{width:320,height:568},hasTouch:true})
 try{
  const h=await hctx.newPage(),v=await vctx.newPage()
  await h.addInitScript(()=>{
   const getRandomValues=crypto.getRandomValues.bind(crypto)
   crypto.getRandomValues=array=>{
    if(array instanceof Uint32Array&&array.length===2){array[0]=7;array[1]=17;return array}
    return getRandomValues(array)
   }
  })
  await h.goto(baseURL!+'season/3/')
  await h.getByLabel('Nickname').fill('Counter')
  await h.getByRole('button',{name:'Create party'}).click()
  const invite=(await h.getByTestId('room-code').textContent())!
  await chooseGame(h,'exile')
  await v.goto(baseURL!+'#/join?room='+invite)
  await v.getByLabel('Nickname').fill('Guest')
  await v.getByRole('button',{name:'Join party'}).click()
  await v.getByRole('button',{name:'Ready up'}).click()
  await startMatch(h)
  for(let n=1;n<=3;n++){
   await expect(v.getByText('Grid '+n+' / 3')).toBeVisible()
   const tiles=v.getByRole('group',{name:'Rectangle grid'}).getByRole('button')
   const rows=n===1?6:8
   await expect(tiles).toHaveCount(rows*8)
   const values=(await tiles.allTextContents()).map(Number)
   await expect(v.locator('.puzzle-target strong')).toHaveText('0')
   await v.evaluate(()=>window.scrollTo(0,0))
   await expect(v.locator('.puzzle-target')).toBeInViewport({ratio:1})
   await expect(v.getByRole('button',{name:'Lock answer'})).toBeInViewport({ratio:.75})
   if(n===1){
    for(const sign of ['negative','zero','positive']){
     const tile=v.locator(`.rect-puzzle button[data-sign="${sign}"]`).first()
     const before=await tile.evaluate(el=>{
      const style=getComputedStyle(el)
      return {color:style.color,background:style.backgroundColor,shadow:style.boxShadow}
     })
     await tile.tap()
     await expect(tile).toHaveAttribute('aria-pressed','true')
     await expect(tile).toHaveCSS('background-color',before.background)
     await expect(tile).toHaveCSS('color',before.color)
     await expect(tile).not.toHaveCSS('box-shadow',before.shadow)
     expect(await tile.evaluate(el=>parseFloat(getComputedStyle(el,'::after').width))).toBeGreaterThanOrEqual(5)
    }
    await v.getByRole('button',{name:'Clear highlights'}).tap()
    await expect(v.locator('.rect-puzzle [aria-pressed=true]')).toHaveCount(0)
   }
   const count=countRectangles(values,rows,8,0)
   await h.getByLabel('Rectangle count').fill(String(count))
   await h.getByRole('button',{name:'Lock answer'}).click()
   await expect(h.getByText('Answer locked.',{exact:false})).toBeVisible()
   await expect(v.getByLabel('Rectangle count')).toHaveValue('')
   await expect(v.getByText(n-1+' correct',{exact:true})).toHaveCount(2)
   await v.getByLabel('Rectangle count').fill(String(count))
   await v.getByRole('button',{name:'Lock answer'}).click()
  }
  await expect(v.getByText('3 correct',{exact:true})).toHaveCount(2)
  await expect(v.getByRole('heading',{name:'Counter wins'})).toBeVisible()
  expect(await v.evaluate(()=>document.documentElement.scrollWidth)).toBe(320)
 }finally{await hctx.close();await vctx.close()}
})

test('Divine Test solves with keyboard at a phone viewport and keeps its fixed tile',async({page})=>{
 await page.setViewportSize({width:360,height:760})
 await page.goto('./season/3/')
 await page.getByLabel('Nickname').fill('Solver')
 await page.getByRole('button',{name:/Practice Divine Test/}).click()
 await expect(settingChoice(page,'Time limit','600')).toBeChecked()
 await chooseSetting(page,'Square size','3')
 await startMatch(page)
 await expect(page.getByText('Every line: 15')).toBeVisible()
 const grid=page.getByRole('region',{name:'Magic square grid'})
 const tiles=grid.getByRole('button')
 await expect(tiles).toHaveCount(9)
 const fixed=grid.getByRole('button',{name:/\(fixed\)$/})
 await expect(fixed).toBeDisabled()
 const fixedIndex=Number(await fixed.getAttribute('data-cell'))
 await page.getByRole('button',{name:'Numeral legend'}).click()
 const legend=(await page.locator('.divine-key li').allTextContents()).map(t=>t.split(' = ')[0])
 await page.getByRole('button',{name:'Numeral legend'}).click()
 const clue=legend.indexOf((await fixed.locator('.divine-glyph').textContent())!)
 expect(clue).toBeGreaterThan(0)
 const options=await import('../../src/divine')
 const solution=Array.from({length:16},(_,i)=>options.magicSolution(3,i)).find(s=>s[fixedIndex]===clue)!
 for(let i=0;i<9;i++)if(i!==fixedIndex){
  const symbol=legend[solution[i]]
  const pick=page.getByRole('button',{name:'Tile '+symbol+', value '+solution[i],exact:true})
  await pick.focus()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('status').filter({hasText:'Selected'})).toBeVisible()
  await tiles.nth(i).press('Enter')
  await expect(tiles.nth(i).locator('.divine-glyph')).toHaveText(symbol)
 }
 await expect(page.getByText('A valid square was completed.')).toBeVisible()
 await expect(page.getByRole('button',{name:'Rematch'})).toBeVisible()
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(360)
})

test('hex instrument veils values and only locks a contiguous three-tile line',async({page})=>{
 await page.clock.install()
 await page.setViewportSize({width:390,height:844})
 await page.goto('./')
 await page.getByRole('button',{name:'Practice Hexagon',exact:true}).click()
 await startMatch(page)
 const bench=page.getByRole('region',{name:'Hexagon instrument'})
 const tiles=bench.getByRole('group',{name:'Hexagon tiles'}).getByRole('button')
 await expect(tiles).toHaveCount(19)
 const values=(await tiles.allTextContents()).map(Number)
 expect(values.every(value=>Number.isInteger(value)&&value>=1&&value<=20)).toBe(true)
 await expect(bench.getByRole('timer',{name:'Time remaining'})).toBeVisible()
 await page.clock.fastForward(30_500)
 await expect(bench.getByText('Target sum',{exact:false})).toBeVisible()
 await expect(bench.getByRole('button',{name:/value \d+/})).toHaveCount(0)
 expect(await tiles.allTextContents()).toEqual(Array.from('ABCDEFGHIJKLMNOPQRS'))
 const lock=bench.getByRole('button',{name:'Lock answer'})
 for(const i of [0,1,3])await tiles.nth(i).press('Enter')
 await expect(lock).toBeDisabled()
 await expect(bench.getByRole('status')).toContainText('not a straight line')
 await bench.getByRole('button',{name:'Clear selection'}).click()
 const target=Number(await bench.locator('.puzzle-target strong').textContent())
 const {hexLines}=await import('../../src/puzzles')
 const line=hexLines().find(indices=>indices.reduce((sum,i)=>sum+values[i],0)===target)!
 for(const i of line)await tiles.nth(i).click()
 await expect(lock).toBeEnabled()
 await lock.press('Enter')
 await expect(bench.getByText('1 correct',{exact:true})).toBeVisible()
})

test('cube instrument keeps operating angles, layers and answer visible in landscape',async({page})=>{
 await page.setViewportSize({width:844,height:390})
 await page.emulateMedia({reducedMotion:'reduce'})
 await page.goto('./season/3/')
 await page.getByRole('button',{name:'Practice Count the Cubes',exact:true}).click()
 await startMatch(page)
 await page.evaluate(()=>window.scrollTo(0,0))
 const bench=page.getByRole('region',{name:'Cube workbench'})
 const views=bench.getByRole('group',{name:'Puzzle view'})
 const lock=bench.getByRole('button',{name:'Lock answer'})
 await expect(views).toBeInViewport({ratio:1})
 await expect(lock).toBeInViewport({ratio:1})
 const image=bench.getByRole('img',{name:/Isometric cube stack/})
 await expect(image).toBeVisible()
 await views.getByRole('button',{name:'Layers'}).press('Enter')
 await expect(bench.getByRole('group',{name:'Layer 1 occupancy'})).toBeVisible()
 const levels=bench.getByRole('radiogroup',{name:'Stack levels'})
 await expect(levels).toBeInViewport({ratio:1})
 expect(await levels.evaluate(el=>el.getAnimations({subtree:true}).length)).toBe(0)
 await expect(bench.locator('select')).toHaveCount(0)
 await levels.getByRole('radio',{name:'Layer 1',exact:true}).press('ArrowLeft')
 await expect(levels.getByRole('radio',{name:'Layer 4',exact:true})).toBeFocused()
 await expect(bench.getByRole('group',{name:'Layer 4 occupancy'})).toBeVisible()
 await views.getByRole('button',{name:'Quarter turn'}).press('Enter')
 await expect(views.getByRole('button',{name:'Quarter turn'})).toHaveAttribute('aria-pressed','true')
 for(let round=1;round<=3;round++){
  await expect(bench.getByText(`Stack ${round} / 5`,{exact:true})).toBeVisible()
  await views.getByRole('button',{name:'Layers'}).press('Enter')
  const side=round===3?4:3
  let answer=0
  for(let layer=1;layer<=4;layer++){
   const selector=levels.getByRole('radio',{name:`Layer ${layer}`,exact:true})
   await selector.press('Enter')
   await expect(selector).toBeChecked()
   await page.evaluate(()=>window.scrollTo(0,0))
   const occupancy=bench.getByRole('group',{name:`Layer ${layer} occupancy`})
   await expect(occupancy.getByRole('img')).toHaveCount(side*side)
   await expect(occupancy).toBeInViewport({ratio:1})
   const gridBox=(await occupancy.boundingBox())!
   expect(gridBox.y+gridBox.height).toBeLessThanOrEqual(360)
   const pickerBox=(await levels.boundingBox())!
   expect(pickerBox.x+pickerBox.width).toBeLessThanOrEqual(gridBox.x)
   await expect(levels).toBeInViewport({ratio:1})
   await expect(lock).toBeInViewport({ratio:1})
   const choiceBox=(await selector.boundingBox())!
   expect(choiceBox.width).toBeGreaterThanOrEqual(44)
   expect(choiceBox.height).toBeGreaterThanOrEqual(44)
   await expect(selector.locator('svg')).toBeVisible()
   for(const button of await views.getByRole('button').all()){
    expect((await button.boundingBox())!.height).toBeGreaterThanOrEqual(42)
   }
   answer+=await occupancy.getByRole('img',{name:/occupied$/}).count()
  }
  await bench.getByLabel('Cube count').fill(String(answer))
  await lock.press('Enter')
  await expect(bench.getByText(`${round} correct`,{exact:true})).toBeVisible()
 }
})
