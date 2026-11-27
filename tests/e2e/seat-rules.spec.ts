import {expect,test} from '@playwright/test'
import {chooseGame} from '../lobby-controls'

test('a two-player room moves to minimum three for Remove One and Secret Number without dropping guests',async({browser,baseURL})=>{
 const hostContext=await browser.newContext({reducedMotion:'reduce'})
 const guestContext=await browser.newContext({viewport:{width:320,height:568},hasTouch:true,isMobile:true,reducedMotion:'reduce'})
 try{
  const host=await hostContext.newPage(), guest=await guestContext.newPage()
  await host.goto(baseURL!)
  await host.getByLabel('Nickname').fill('Host')
  await host.getByRole('button',{name:'Create party',exact:true}).click()
  await chooseGame(host,'morris')
  const form=host.getByRole('region',{name:'Seat limit',exact:true})
  await expect(form.getByLabel('2 seats allowed')).toBeVisible()
  await expect(form.getByRole('button',{name:'Duel',exact:true})).toHaveAttribute('aria-pressed','true')
  const code=await host.getByTestId('room-code').innerText()
  await guest.goto(baseURL!+'#/join?room='+code)
  await guest.getByLabel('Nickname').fill('Guest')
  await guest.getByRole('button',{name:'Join party',exact:true}).tap()
  await guest.getByRole('button',{name:'Ready up',exact:true}).tap()
  await expect(host.getByRole('button',{name:'Start match',exact:true})).toBeEnabled()
  await form.getByRole('button',{name:'Tournament',exact:true}).click()
  await expect(form.getByText('2 on each board · up to 6 legs', {exact:true})).toBeVisible()
  await form.getByRole('button',{name:'Duel',exact:true}).click()
  for(const game of ['remove','secret'] as const){
   await chooseGame(host,game)
   const down=form.getByRole('button',{name:'Decrease seat limit'})
   for(let count=16;count>3;count--)await down.click()
   await expect(form.getByLabel('3 seats allowed')).toBeVisible()
   await expect(down).toBeDisabled()
   await expect(guest.getByRole('region',{name:'Seat limit',exact:true}).getByLabel('3 seats allowed')).toBeVisible()
   await expect(host.getByRole('button',{name:'Start match',exact:true})).toBeDisabled()
   await expect(host.getByText('Add 1 more player.',{exact:true})).toBeVisible()
  }
  await host.getByRole('button',{name:'Add bot',exact:true}).click()
  await expect(host.getByRole('button',{name:'Start match',exact:true})).toBeEnabled()
 }finally{await Promise.all([hostContext.close(),guestContext.close()])}
})
