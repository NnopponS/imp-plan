import {expect,test} from '@playwright/test'

test('nickname Enter continues the game picked on a fresh visit without creating an online host',async({page})=>{
 await page.setViewportSize({width:390,height:844})
 await page.goto('./')
 await page.getByRole('button',{name:'Practice Nine Men’s Morris'}).click()
 await expect(page.getByLabel('Nickname')).toBeFocused()
 await page.getByLabel('Nickname').fill('Aiko')
 await page.keyboard.press('Enter')
 await expect(page.getByRole('heading',{name:'Practice lobby'})).toBeVisible({timeout:1500})
 await expect(page.getByRole('combobox',{name:'Game',exact:true})).toHaveValue('morris')
 await expect(page.getByTestId('room-code')).toHaveCount(0)
})

test('explicit Create party still overrides a pending practice and invite nickname Enter joins',async({browser,baseURL})=>{
 const h=await browser.newPage(),g=await browser.newPage()
 await h.goto(baseURL!)
 await h.getByRole('button',{name:'Practice Time Auction'}).click()
 await h.getByLabel('Nickname').fill('Host')
 await h.getByRole('button',{name:'Create party'}).click()
 const code=await h.getByTestId('room-code').innerText()
 await g.goto(baseURL!+'#/join?room='+code)
 await g.getByLabel('Nickname').fill('Guest')
 await g.getByLabel('Nickname').press('Enter')
 await expect(g.getByRole('button',{name:'Ready up'})).toBeVisible({timeout:3000})
 await expect(h.getByText('Guest',{exact:true})).toBeVisible()
 await h.close();await g.close()
})

test('dense seat markers do not intersect or clip at narrow widths',async({page})=>{
 await page.setViewportSize({width:320,height:690})
 await page.emulateMedia({reducedMotion:'reduce'})
 await page.goto('./')
 await page.getByLabel('Nickname').fill('Host')
 await page.getByRole('button',{name:'Practice Time Auction'}).click()
 for(let n=2;n<16;n++)await page.getByRole('button',{name:'Add bot',exact:true}).click()
 await page.getByRole('button',{name:'Start match',exact:true}).click()
 for(const w of [320,360,390,601,820,1280]){
  await page.setViewportSize({width:w,height:740})
  const geometry=await page.locator('.brief-seat-ring').evaluate(ring=>{
   const stage=ring.getBoundingClientRect(),nodes=Array.from(ring.querySelectorAll('[data-brief-seat]'))
   const boxes=nodes.map(node=>node.getBoundingClientRect())
   const overlaps=boxes.flatMap((a,i)=>boxes.slice(i+1).flatMap((b,j)=>a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top?[[i+1,i+j+2]]:[]))
   const clipped=boxes.some(b=>b.top<stage.top||b.left<stage.left||b.bottom>stage.bottom||b.right>stage.right)
   return {count:nodes.length,overlaps,clipped}
  })
  expect(geometry,'seat layout at '+w+'px').toEqual({count:16,overlaps:[],clipped:false})
 }
})
