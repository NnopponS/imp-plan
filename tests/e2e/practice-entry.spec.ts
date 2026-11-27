import {expect,test} from '@playwright/test'

test('a fresh player can open the selected practice game without a nickname',async({page})=>{
 await page.setViewportSize({width:390,height:844})
 await page.goto('./')
 await page.getByRole('button',{name:'Practice Nine Men’s Morris'}).click()
 await expect(page.getByRole('heading',{name:'Practice lobby'})).toBeVisible({timeout:3000})
 await expect(page.getByRole('combobox',{name:'Game',exact:true})).toHaveValue('morris')
 await expect(page.getByLabel('Nickname')).toHaveCount(0)
 await expect(page.getByTestId('room-code')).toHaveCount(0)
 await expect(page.getByText('Player',{exact:true})).toBeVisible()
})

test('the warm-up opens full practice without using the online nickname or connection options',async({page})=>{
 await page.goto('./')
 const name=page.getByLabel('Nickname')
 await name.fill('Online handle')
 await page.getByText('Connection options',{exact:true}).click()
 await page.getByLabel('Custom STUN URLs (optional)').fill('not a STUN URL')
 await page.getByRole('region',{name:'One-move warm-up'}).getByRole('button',{name:'Full Blind Gomoku'}).press('Enter')
 await expect(page.getByRole('heading',{name:'Practice lobby'})).toBeVisible({timeout:3000})
 await expect(page.getByRole('combobox',{name:'Game',exact:true})).toHaveValue('blind')
 await expect(page.getByText('Player',{exact:true})).toBeVisible()
 await expect(page.getByText('Online handle',{exact:true})).toHaveCount(0)
 await page.getByRole('button',{name:'Leave room',exact:true}).click()
 await expect(name).toHaveValue('Online handle')
})

test('only online creation and invite joining require a nickname',async({browser,baseURL})=>{
 const h=await browser.newPage(),g=await browser.newPage()
 try{
  await h.goto(baseURL!)
  await h.getByRole('button',{name:'Create party'}).click()
  const hostName=h.getByLabel('Nickname')
  await expect(hostName).toBeFocused()
  await expect(h.getByRole('heading',{name:'Party room'})).toHaveCount(0)
  await expect(h.getByTestId('room-code')).toHaveCount(0)
  await hostName.fill('Host')
  await h.getByRole('button',{name:'Create party'}).click()
  const code=await h.getByTestId('room-code').innerText()

  await g.goto(baseURL!+'#/join?room='+code)
  const guestName=g.getByLabel('Nickname')
  await g.getByRole('button',{name:'Join party'}).click()
  await expect(guestName).toBeFocused()
  await expect(g.getByLabel('Invite code')).toHaveValue(code)
  await expect(g.getByRole('heading',{name:'Party room'})).toHaveCount(0)
  await guestName.fill('Guest')
  await guestName.press('Enter')
  await expect(g.getByRole('button',{name:'Ready up'})).toBeVisible({timeout:6000})
  await expect(h.getByText('Guest',{exact:true})).toBeVisible()
 }finally{await h.close();await g.close()}
})

test('a failed online join can switch to local practice without reusing or clearing the online nickname',async({page})=>{
 await page.goto('./#/join?room=ABC234')
 await page.getByLabel('Nickname').fill('Online handle')
 await page.getByRole('button',{name:'Join party'}).click()
 await expect(page.getByRole('alert')).toContainText(/Room not found/i,{timeout:9000})
 await page.getByRole('button',{name:'Solo practice'}).click()
 await expect(page.getByRole('heading',{name:'Practice lobby'})).toBeVisible()
 await expect(page.getByText('Player',{exact:true})).toBeVisible()
 await expect(page.getByText('Online handle',{exact:true})).toHaveCount(0)
 await expect(page.getByTestId('room-code')).toHaveCount(0)
 await page.getByRole('button',{name:'Leave room',exact:true}).click()
 await expect(page.getByLabel('Nickname')).toHaveValue('Online handle')
})

test('dense seat markers do not intersect or clip at narrow widths',async({page})=>{
 await page.setViewportSize({width:320,height:690})
 await page.emulateMedia({reducedMotion:'reduce'})
 await page.goto('./')
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
