import {expect,test} from '@playwright/test'

for(const width of [320,390,1440]){
 test(`entry ticket keeps a clear, aligned form at ${width}px`,async({page})=>{
  await page.setViewportSize({width,height:width===1440?960:844})
  await page.goto('./#room-entry')
  const ticket=page.locator('form#room-entry')
  const name=ticket.getByRole('textbox',{name:'Nickname'})
  const code=ticket.getByRole('textbox',{name:'Invite code'})
  const create=ticket.getByRole('button',{name:'Create party'})
  const join=ticket.getByRole('button',{name:'Join party'})
  await expect(name).toBeVisible()
  const positions=await ticket.evaluate(root=>{
   const box=(selector:string)=>{
    const r=root.querySelector(selector)!.getBoundingClientRect()
    return {left:r.left,right:r.right,bottom:r.bottom,height:r.height}
   }
   return {name:box('#nickname'),code:box('#invite'),create:box('.entry-create'),join:box('.entry-join'),
    practice:box('#practice-entry'),connection:box('.entry-connection summary'),form:root.getBoundingClientRect().toJSON(),
    fold:getComputedStyle(root,'::after').borderImageSource,
    texture:getComputedStyle(root.querySelector('#nickname')!).backgroundImage}
  })
  expect(positions.fold).toBe('none')
  expect(positions.texture).toBe('none')
  const close=(a:number,b:number)=>expect(Math.abs(a-b)).toBeLessThanOrEqual(1)
  close(positions.name.left,positions.code.left)
  close(positions.name.right,positions.code.right)
  close(positions.name.bottom,positions.create.bottom)
  close(positions.code.bottom,positions.join.bottom)
  close(positions.create.left,positions.join.left)
  close(positions.create.right,positions.join.right)
  close(positions.practice.bottom,positions.connection.bottom)
  expect(positions.practice.right).toBeLessThan(positions.connection.left)
  for(const control of [positions.name,positions.code,positions.create,positions.join,positions.practice,positions.connection]){
   expect(control.height).toBeGreaterThanOrEqual(44)
   expect(control.left).toBeGreaterThan(positions.form.left)
   expect(control.right).toBeLessThan(positions.form.right)
  }
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(width)
  await name.fill('Ash')
  await code.fill('abc234')
  await expect(code).toHaveValue('ABC234')
  await ticket.getByText('Connection options',{exact:true}).click()
  const stun=ticket.getByRole('textbox',{name:'Custom STUN URLs (optional)'})
  await expect(stun).toBeVisible()
  await stun.fill('stun:example.net:3478')
  await expect(stun).toHaveValue('stun:example.net:3478')
  await expect(create).toBeEnabled()
  await expect(join).toBeEnabled()
 })
}

test('a direct invite has no redundant Create button, still fills the code and accepts a nickname',async({page})=>{
 await page.setViewportSize({width:390,height:844})
 await page.goto('./#/join?room=ABC234')
 const ticket=page.locator('form#room-entry')
 await expect(ticket.getByRole('heading',{name:'Join a party'})).toBeVisible()
 await expect(ticket.getByRole('textbox',{name:'Invite code'})).toHaveValue('ABC234')
 await expect(ticket.getByRole('button',{name:'Create party'})).toHaveCount(0)
 await ticket.getByRole('textbox',{name:'Nickname'}).fill('Sora')
 await expect(ticket.getByRole('textbox',{name:'Nickname'})).toHaveValue('Sora')
 await expect(ticket.getByRole('button',{name:'Join party'})).toBeEnabled()
})
