import {readFile} from 'node:fs/promises'
import {expect,test,type Page} from '@playwright/test'
import {startMatch} from './start-match'

const tourBoard=(page:Page)=>page.getByRole('group',{name:'Knight’s Tour board',exact:true})
const boardCell=(cell:number)=>String.fromCharCode(65+cell%5)+(Math.floor(cell/5)+1)
async function startTour(page:Page){
 await page.goto('./season/2/')
 await page.getByRole('button',{name:'Practice Knight’s Tour',exact:true}).click()
 await startMatch(page)
 const board=tourBoard(page)
 await expect(board).toBeVisible()
 const current=(await board.getByRole('button',{name:/, knight, step 1$/}).getAttribute('aria-label'))!.split(',')[0]
 const seeds=JSON.parse(await readFile(new URL('../../src/tour-routes.json',import.meta.url),'utf8')) as {'5o':number[]}
 const sample=seeds['5o']
 const routes=Array.from({length:8},(_,i)=>sample.map(cell=>{
  let x=cell%5,y=Math.floor(cell/5)
  if(i&1)x=4-x
  if(i&2)y=4-y
  if(i&4)[x,y]=[y,x]
  return y*5+x
 }))
 const route=routes.find(route=>boardCell(route[0])===current)!
 expect(route).toHaveLength(25)
 return route
}
const playCell=(page:Page,cell:number)=>tourBoard(page).getByRole('button',{name:boardCell(cell)+', legal move',exact:true}).click()

test('completed tour shares the actual numbered PNG and can rematch without publishing identities',async({page})=>{
 await page.setViewportSize({width:320,height:568})
 await page.addInitScript(()=>{
  const fixture:unknown[]=[]
  Object.assign(window,{knightShareFixture:fixture})
  Object.defineProperty(navigator,'canShare',{configurable:true,value:(data:ShareData)=>data.files?.length===1})
  Object.defineProperty(navigator,'share',{configurable:true,value:async(data:ShareData)=>{
   fixture.push({keys:Object.keys(data).sort(),file:data.files?.[0]?.name,mime:data.files?.[0]?.type,bytes:data.files?.[0]?.size})
  }})
 })
 const route=await startTour(page)
 for(const cell of route.slice(1))await playCell(page,cell)
 const record=page.getByRole('region',{name:'Match record',exact:true})
 const print=record.getByRole('img',{name:/25 of 25 squares visited.*Finish time/})
 await expect(print).toBeVisible()
 await expect(record.getByRole('figure',{name:'Knight’s Tour result'})).toBeFocused()
 const svg=decodeURIComponent((await print.getAttribute('src'))!.split(',')[1])
 for(const [i,cell] of route.entries())expect(svg).toContain(`data-visit="${i+1}" data-cell="${cell}"`)
 expect(svg).not.toMatch(/#\/join|nickname|<image/i)
 expect(await record.evaluate(el=>el.scrollWidth)).toBe(await record.evaluate(el=>el.clientWidth))
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(320)
 const share=record.getByRole('button',{name:'Share image',exact:true})
 await expect(share).toBeEnabled()
 await share.focus()
 await page.keyboard.press('Enter')
 await expect.poll(()=>page.evaluate(()=>Object.getOwnPropertyDescriptor(window,'knightShareFixture')?.value)).toEqual([{
  keys:['files','title'],file:'imp-plan-knights-tour-5x5.png',mime:'image/png',bytes:expect.any(Number)
 }])
 await expect(record.getByRole('button',{name:'Export result',exact:true})).toBeVisible()
 await record.getByRole('button',{name:'Rematch',exact:true}).click()
 await expect(record).toHaveCount(0)
})

test('partial tour saves the highest-scoring route after undo without inventing finish time',async({page})=>{
 await page.clock.install()
 await page.addInitScript(()=>Object.defineProperty(navigator,'canShare',{configurable:true,value:()=>false}))
 const route=await startTour(page)
 for(const cell of route.slice(1,5))await playCell(page,cell)
 const undo=page.getByRole('button',{name:'Undo step',exact:true})
 await undo.click()
 await expect(tourBoard(page).getByRole('button',{name:boardCell(route[3])+', knight, step 4',exact:true})).toBeVisible()
 await undo.click()
 await expect(tourBoard(page).getByRole('button',{name:boardCell(route[2])+', knight, step 3',exact:true})).toBeVisible()
 await page.clock.fastForward(190_000)
 const record=page.getByRole('region',{name:'Match record',exact:true})
 const print=record.getByRole('img',{name:/5 of 25 squares visited/})
 await expect(print).toBeVisible()
 await expect(print).not.toHaveAttribute('alt',/Finish time/)
 const svg=decodeURIComponent((await print.getAttribute('src'))!.split(',')[1])
 for(const [i,cell] of route.slice(0,5).entries())expect(svg).toContain(`data-visit="${i+1}" data-cell="${cell}"`)
 expect(svg).not.toContain('data-visit="6"')
 const download=page.waitForEvent('download')
 await record.getByRole('button',{name:'Save image',exact:true}).click()
 const result=await download
 expect(result.suggestedFilename()).toBe('imp-plan-knights-tour-5x5.png')
 const png=await readFile((await result.path())!)
 expect(png.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))).toBe(true)
 expect([png.readUInt32BE(16),png.readUInt32BE(20)]).toEqual([920,1368])
 await expect(record.getByRole('button',{name:'Return to lobby',exact:true})).toBeVisible()
})
