import {test,expect} from '@playwright/test'
import {startMatch} from './start-match'
import {pieceFootprint,pieceSide,type PieceCell} from '../../src/piece'
import {solvePiece} from '../piece-solver'

for(const [width,height] of [[320,710],[844,390]] as const){
 test(`Piece Puzzle places a carved piece into its real 7 by 7 destinations at ${width}×${height}`,async({page},info)=>{
  await page.setViewportSize({width,height})
  await page.emulateMedia({reducedMotion:'reduce'})
  await page.addInitScript(()=>{
   const original=Crypto.prototype.getRandomValues
   Crypto.prototype.getRandomValues=function<T extends ArrayBufferView>(array:T):T{
    if(array instanceof Uint32Array&&array.length===2){array.set([42,1234]);return array}
    return original.call(this,array) as T
   }
  })
  await page.goto('./season/3/',{waitUntil:'domcontentloaded'})
  await page.getByRole('button',{name:'Practice Piece Puzzle',exact:true}).click()
  await startMatch(page)
  const workshop=page.getByRole('region',{name:'Piece Puzzle workshop'})
  const board=workshop.getByRole('group',{name:'Piece silhouette'})
  const tray=workshop.getByRole('group',{name:'Piece tray'})
  const cells=board.getByRole('button')
  await expect(cells).toHaveCount(49)
  if(process.env.CAPTURE_PIECE==='1')await workshop.screenshot({path:info.outputPath('piece-unfilled.png'),animations:'disabled'})
  const target=await cells.evaluateAll(nodes=>nodes.map(node=>node.getAttribute('data-target')==='true'))
  const pieces=await tray.getByRole('button').evaluateAll(nodes=>nodes.map(node=>JSON.parse(node.getAttribute('data-shape')!))) as PieceCell[][]
  const solution=solvePiece({target,pieces})!
  expect(solution).not.toBeNull()
  await expect(board.locator('button[data-target=true] svg[data-craft-slot]')).toHaveCount(target.filter(Boolean).length)
  await expect(board.locator('button[data-target=false] svg[data-craft-slot]')).toHaveCount(target.filter(x=>!x).length)
  await expect(tray.locator('svg[data-carved-piece]')).toHaveCount(pieces.length)
  await expect(board.locator('button[data-target=false]').first()).toHaveCSS('background-color','rgba(0, 0, 0, 0)')
  await expect(board.locator('button[data-target=true] svg .piece-slot-recess').first()).toHaveCSS('fill','rgb(200, 169, 137)')
  const id=solution.findIndex(fit=>fit.rotation>0)
  expect(id).toBeGreaterThanOrEqual(0)
  const fit=solution[id],piece=tray.getByRole('button',{name:new RegExp('^Piece '+(id+1)+',')})
  const rotate=workshop.getByRole('button',{name:'Rotate clockwise'})
  await piece.click()
  await expect(piece).toHaveAttribute('aria-pressed','true')
  const tileShapes=piece.locator('[data-carved-piece] [data-carved-cell]')
  const initial=await tileShapes.evaluateAll(nodes=>nodes.map(n=>n.getAttribute('transform')))
  for(let i=0;i<fit.rotation;i++)await rotate.click()
  expect(await tileShapes.evaluateAll(nodes=>nodes.map(n=>n.getAttribute('transform')))).not.toEqual(initial)
  const layout={target,pieces}
  const footprint=pieceFootprint(layout,id,fit.rotation,fit.anchor)
  const incorrect=target.findIndex((_,index)=>pieceFootprint(layout,id,fit.rotation,index).some(cell=>!target[cell]))
  expect(incorrect).toBeGreaterThanOrEqual(0)
  // Focusing the board from Rotate may scroll a different cell under the resting mouse.
  // Check the keyboard footprint before moving the pointer, then hand control to a real mouse move.
  await cells.nth(incorrect).focus()
  await expect(cells.nth(incorrect)).toBeFocused()
  const ghostCells=(kind:'collision'|'fit')=>cells.evaluateAll((nodes,k)=>nodes.flatMap((node,i)=>node.querySelector(`[data-craft-ghost=${k}]`)?[i]:[]),kind)
  await expect.poll(()=>ghostCells('collision')).toEqual(pieceFootprint(layout,id,fit.rotation,incorrect).sort((a,b)=>a-b))
  await cells.nth(fit.anchor).hover()
  await expect(cells.nth(incorrect)).toBeFocused()
  await expect.poll(()=>ghostCells('fit')).toEqual([...footprint].sort((a,b)=>a-b))
  await cells.nth(fit.anchor).focus()
  await expect(board.locator('button.fit svg[data-craft-ghost=fit]')).toHaveCount(footprint.length)
  await cells.nth(fit.anchor).press('Enter')
  await expect(board.locator('button[data-filled=true] svg[data-carved-piece]')).toHaveCount(footprint.length)
  for(const i of footprint)await expect(cells.nth(i)).toHaveAccessibleName(new RegExp('piece '+(id+1)+'$'))
  await expect(piece).toHaveAccessibleName(new RegExp('^Piece '+(id+1)+', on board'))
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(width)
  if(process.env.CAPTURE_PIECE==='1')await workshop.screenshot({path:info.outputPath('piece-fitted.png'),animations:'disabled'})
 })
}
