import {expect,test} from '@playwright/test'

const seasons=[
 {number:1,title:'The First Plan',firstGame:'Blind Gomoku'},
 {number:2,title:'Death Room',firstGame:'Time Auction'},
 {number:3,title:'Dead Again',firstGame:'Point Gomoku'},
] as const

for(const [width,height] of [[320,640],[768,820],[1440,900]]){
 test(`a playable card leads each season at ${width}px`,async({page})=>{
  await page.setViewportSize({width,height})
  await page.emulateMedia({reducedMotion:'reduce'})
  await page.goto('./')
  for(const season of seasons){
   const nav=page.getByRole('navigation',{name:'Seasons'}).getByRole('link',{name:'Season '+season.number,exact:true})
   await nav.focus()
   await page.keyboard.press('Enter')
   await expect(nav).toHaveAttribute('aria-current','page')
   await expect(page.getByRole('heading',{name:season.title,exact:true})).toBeInViewport()
   await expect(page.getByRole('button',{name:'Practice '+season.firstGame,exact:true})).toBeInViewport({ratio:1,timeout:3000})
   expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(width)
  }
 })
}

test('a season room shortcut reaches the room form by keyboard',async({page})=>{
 await page.setViewportSize({width:320,height:640})
 await page.goto('./season/2/')
 const entry=page.getByRole('link',{name:'Create or join a room',exact:true})
 await entry.focus()
 await page.keyboard.press('Enter')
 await page.keyboard.press('Tab')
 await expect(page.getByLabel('Nickname')).toBeFocused()
 await expect(page.getByLabel('Nickname')).toBeInViewport()
})

test('challenge index opens from the gallery and only playable search results can launch',async({page})=>{
 await page.setViewportSize({width:320,height:640})
 await page.goto('./season/1/')
 const catalog=page.locator('#catalog')
 const search=catalog.getByLabel('Search challenge index')
 await expect(search).toBeHidden()
 await page.getByRole('link',{name:'Challenge index',exact:true}).click({timeout:3000})
 await expect(search).toBeInViewport({timeout:3000})
 await search.fill('The Virus Game')
 const planned=catalog.getByRole('article').filter({hasText:'The Virus Game'})
 await expect(planned.getByText('Not playable', {exact:true})).toBeVisible()
 await expect(planned.getByRole('button')).toHaveCount(0)
 await search.fill('Fragments of Memory')
 const live=catalog.getByRole('button',{name:'Practice Fragments of Memory',exact:true})
 await live.focus()
 await page.keyboard.press('Enter')
 const name=page.getByLabel('Nickname')
 await expect(name).toBeFocused()
 await name.fill('Contestant')
 await name.press('Enter')
 await expect(page.getByRole('heading',{name:'Practice lobby'})).toBeVisible()
 await expect(page.getByRole('combobox',{name:'Game',exact:true})).toHaveValue('fragments')
})

test('another season game starts with the nickname already entered',async({page})=>{
 await page.goto('./season/3/')
 await page.getByRole('button',{name:'Practice Point Gomoku',exact:true}).click()
 const name=page.getByLabel('Nickname')
 await expect(name).toBeFocused()
 await name.fill('Contestant')
 await name.press('Enter')
 await expect(page.getByRole('combobox',{name:'Game',exact:true})).toHaveValue('point')
 await page.getByRole('button',{name:'Leave room',exact:true}).click()
 await page.getByRole('button',{name:'Practice Memory Poker',exact:true}).click()
 await expect(page.getByRole('combobox',{name:'Game',exact:true})).toHaveValue('memoryPoker')
 await expect(name).toHaveCount(0)
})
