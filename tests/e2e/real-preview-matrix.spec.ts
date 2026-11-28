import {expect,test} from '@playwright/test'
import catalog from '../../src/catalog.json' with {type:'json'}
import {startMatch} from './start-match'

test.use({launchOptions:{args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu','--renderer-process-limit=2']}})
const tableObjects:Record<string,string>={
 treasureIsland:'[data-island-map]',hitStay:'[data-hit-card=face]',piggyBank:'.piggy-rack .piggy-figure',equationTower:'[data-equation-block="0"]',doubtBet:'.db-card-art',unknown:'[data-unknown-mosaic]',coopPuzzle:'.relay-grid',fragments:'.gallery-scene svg',secret:'[data-pact=secret]',tower:'.tower-game',
 scale:'.scale-stage',grass1:'.grass-grid',montage:'.montage-board',equationHighLow:'.eh-rack',threeRow:'.tr-bench',
 blind:'.chamber-grid',morris:'.morris-surface',hex:'.hex-instrument',remove:'.remove-one',
 auction:'.sealed-dial',tripleDice:'.td-board',mancala:'[data-mancala-bowl]',wallGo:'.wall-go',
 pyramid:'.pyramid-game',bigSmall:'.bs-card-face',bagh:'.bagh-stage',knight:'.knight-board',
 cubes:'.puzzle-visual',rectangles:'.rect-chart',grass3:'.grass-grid',memoryPoker:'.memory-cabinet',
 auctionBingo:'.ab-card',hiddenWord:'.hw-board',heavy13:'.h13-stands',wallGo2:'.wall-go2',gradation:'.grad-board',
 piece:'.piece-workshop',spot:'.spot-game',codeLock:'.code-palette',fence:'.fence-game',symmetry:'.mirror-bench',
 flags:'.fa-atlas',exile:'.rect-chart',divine:'.divine',point:'.board.gomoku',colorLink:'.color-link',equations:'.equation-operators',
}

for(const season of [1,2,3]){
 test('Season '+season+' previews the same painted game objects used at its live tables',async({page},info)=>{
  test.setTimeout(175_000)
  await page.setViewportSize({width:390,height:844})
  await page.emulateMedia({reducedMotion:'reduce'})
  const games=catalog.filter(r=>r.season===season&&r.game)
  for(const row of games)await test.step(row.title,async()=>{
   const game=row.game!,object=tableObjects[game]
   expect(object).toBeTruthy()
   await page.goto('./season/'+season+'/')
   const card=page.locator('#practice-gallery-'+game).locator('xpath=ancestor::article')
   await card.locator('.game-cover-hit').click()
   const preview=page.locator('[data-real-table-preview="'+game+'"]')
   const sample=preview.locator('[data-rendered-table="'+game+'"]')
   const piece=sample.locator(object).first()
   await expect(piece).toBeVisible()
   expect(await sample.evaluate(node=>!!node.closest('[inert]'))).toBeTruthy()
   expect(await page.locator('.room[data-playing]:not([inert])').count()).toBe(0)
   const appearance=await piece.evaluate(el=>{
    const css=getComputedStyle(el)
    return [el.localName,css.color,css.backgroundColor,...(el instanceof SVGElement?[el.getAttribute('viewBox')]:[])]
   })
   if(['mancala','codeLock','coopPuzzle'].includes(game))await preview.screenshot({path:info.outputPath(game+'-preview.png')})
   await page.getByRole('dialog').getByRole('button',{name:/^Practice /}).click()
   await startMatch(page)
   const live=page.locator('.room[data-playing]:not([inert]) [data-rendered-table="'+game+'"]').locator(object).first()
   await expect(live).toBeVisible()
   const actualAppearance=await live.evaluate(el=>{
    const css=getComputedStyle(el)
    return [el.localName,css.color,css.backgroundColor,...(el instanceof SVGElement?[el.getAttribute('viewBox')]:[])]
   })
   expect(actualAppearance,game+' must have the same painted object and ink').toEqual(appearance)
   if(['mancala','codeLock','coopPuzzle'].includes(game))await live.screenshot({path:info.outputPath(game+'-played.png')})
   expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(390)
  })
 })
}
