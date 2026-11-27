import {test,expect,type Page} from '@playwright/test'
const table=(p:Page)=>p.getByRole('region',{name:'Episode-style Memory Poker duel'})
const cards=(p:Page)=>table(p).getByRole('group',{name:'Duel card layout'}).getByRole('button')
const waitTime=async(p:Page,mini:number)=>{await p.clock.fastForward(mini);await p.clock.runFor(220)}
const geo=async(p:Page)=>cards(p).evaluateAll(els=>({w:innerWidth,h:innerHeight,scroll:scrollY,docWidth:document.documentElement.scrollWidth,rects:els.map(el=>{const {x,y,width,height,bottom,right}=el.getBoundingClientRect();return{x,y,width,height,bottom,right}})}))
const validateGeom=async(p:Page,phase:string)=>{
 await p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));const a=await geo(p),rs=a.rects
 expect.soft(a.docWidth,phase+' width').toEqual(a.w)
 expect.soft(rs.every(r=>r.width>=44&&r.height>=44&&r.x>=0&&r.right<=a.w),phase+' touch and horizontal fit').toBe(true)
 expect.soft(rs[0].right<=rs[1].x,phase+' no overlap').toBe(true)
 expect.soft(rs.every(r=>r.y>=0&&r.bottom<=a.h),phase+' all faces visible in viewport').toBe(true)
}
const lockTouch=async(p:Page,a=0,b=1)=>{
 await cards(p).nth(a).tap();await cards(p).nth(b).tap()
 const lock=table(p).getByRole('button',{name:'Lock two cards'});await expect(lock).toBeEnabled();await lock.scrollIntoViewIfNeeded();await lock.tap()
}
const names=(p:Page)=>cards(p).evaluateAll(els=>els.map(el=>el.getAttribute('aria-label')))
const lockKeyboard=async(p:Page)=>{
 const c=cards(p);await c.first().focus()
 await p.keyboard.press('ArrowDown');await expect(c.nth(4)).toBeFocused()
 await p.keyboard.press('End');await expect(c.nth(7)).toBeFocused()
 await p.keyboard.press('Home');await expect(c.nth(4)).toBeFocused()
 await p.keyboard.press('ArrowUp');await expect(c.first()).toBeFocused()
 await p.keyboard.press('Space');await expect(c.first()).toHaveAttribute('aria-pressed','true')
 await p.keyboard.press('ArrowRight');await expect(c.nth(1)).toBeFocused()
 await p.keyboard.press('Enter');await expect(c.nth(1)).toHaveAttribute('aria-pressed','true')
 await p.keyboard.press('ArrowDown');await p.keyboard.press('ArrowDown');await p.keyboard.press('ArrowDown');await p.keyboard.press('End');await expect(c.last()).toBeFocused()
 await p.keyboard.press('Tab');const l=table(p).getByRole('button',{name:'Lock two cards'});await expect(l).toBeFocused();await p.keyboard.press('Enter')
}
for(const [width,height] of [[320,568],[390,844]])test('Memory duel at '+width+'px: restored seat, sealed picks, keyboard play and fitting grid',async({browser,baseURL})=>{
 const desk=await browser.newContext({viewport:{width:1280,height:800},reducedMotion:'reduce'}),phone=await browser.newContext({viewport:{width,height},hasTouch:true,reducedMotion:'reduce'})
 try{
 const h=await desk.newPage(),g=await phone.newPage()
 h.setDefaultTimeout(6000);g.setDefaultTimeout(6000)
 await h.clock.install()
 await h.goto(baseURL!);await h.getByLabel('Nickname').fill('H');await h.getByRole('button',{name:'Create party'}).click();await h.getByLabel('Game').selectOption('memoryPoker')
 const code=await h.getByTestId('room-code').innerText()
 await g.goto(baseURL!+'#/join?room='+code);await g.getByLabel('Nickname').fill('G');await g.getByRole('button',{name:'Join party'}).click()
 await expect(h.getByRole('option',{name:'Episode-style duel'})).not.toHaveAttribute('disabled','')
 await h.getByLabel('Memory Poker mode').selectOption('episode');await expect(g.getByLabel('Memory Poker mode')).toHaveValue('episode');await g.getByRole('button',{name:'Ready up'}).tap();await h.getByRole('button',{name:'Start match',exact:true}).click();await h.getByRole('button',{name:'Enter match',exact:true}).click()
 await expect(cards(g)).toHaveCount(16)
 await validateGeom(g,'study');const first=await names(g)
 await g.reload();await expect(cards(g)).toHaveCount(16);expect(await names(g)).toEqual(first);await validateGeom(g,'resumed study')
 await waitTime(h,20_030);await expect(table(g).getByRole('heading',{name:'Choose two cards'})).toBeVisible()
 await validateGeom(g,'select')
 expect((await names(g)).every(n=>n?.includes('face down'))).toBe(true)
 await lockTouch(g);await expect(table(g).getByRole('status')).toHaveText('Pair locked. Waiting for the reveal.')
 await expect(table(h).getByRole('status')).toHaveText('0 / 2 selected')
 await expect(table(h).locator('[aria-pressed=true]')).toHaveCount(0)
 const tokenKey='arena-resume-'+code
 const seatedToken=await g.evaluate(k=>JSON.parse(sessionStorage.getItem(k)!).token,tokenKey)
 await g.reload();await expect(table(g).getByRole('status')).toHaveText('Pair locked. Waiting for the reveal.')
 expect(await g.evaluate(k=>JSON.parse(sessionStorage.getItem(k)!).token,tokenKey)).not.toBe(seatedToken)
 await expect(table(g).locator('[aria-pressed=true]')).toHaveCount(2);await expect(table(h).locator('[aria-pressed=true]')).toHaveCount(0)
 expect((await names(g)).every(n=>n?.includes('face down'))).toBe(true)
 await lockKeyboard(h);await expect(table(g).getByRole('heading',{name:'Exact tie'})).toBeVisible()
 await waitTime(h,3650);await expect(table(g).getByRole('heading',{name:'Memorize the grid'})).toBeVisible()
 expect(await names(g)).not.toEqual(first);await expect(table(g)).toContainText('Deal 2');await expect(table(g).getByRole('region',{name:'Shared cards'})).toHaveCount(0)
 await waitTime(h,20_050);await expect(table(g).getByRole('heading',{name:'Choose two cards'})).toBeVisible();await lockKeyboard(h)
 await expect(table(g).locator('[aria-pressed=true]')).toHaveCount(0)
 await g.reload();await expect(table(g).getByRole('status')).toHaveText('0 / 2 selected')
 await expect(table(g).locator('[aria-pressed=true]')).toHaveCount(0);await expect(table(g).getByRole('region',{name:'Revealed hands'})).toHaveCount(0)
 await waitTime(h,60_050);await expect(table(h)).toContainText('Only one player locked in time. Neither pair is revealed.')
 await expect(h.getByRole('heading',{name:'H wins',exact:true})).toBeVisible()
 await expect(table(h).getByRole('region',{name:'Revealed hands'})).toHaveCount(0)
 // Reload when finished also restores the same outcome even if the fast-forward evicted heartbeat.
 await g.reload();await expect(table(g)).toContainText('Only one player locked in time. Neither pair is revealed.')
 }finally{await phone.close();await desk.close()}
})
