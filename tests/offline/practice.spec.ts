import {expect,test} from '@playwright/test'
import {chooseSetting} from '../lobby-controls'
import {startMatch} from '../e2e/start-match'
import {preview} from 'vite'

test('a fresh Pages visit saves unvisited games and can be reopened offline',async({page,context})=>{
 await page.setViewportSize({width:390,height:844})
 await page.goto('./robots.txt')
 await page.evaluate(async()=>{
  // Simulate another repository and a prior Imp Plan version on the shared Pages origin.
  await Promise.all([
   caches.open('other-project-cache'),
   caches.open('imp-plan-static:'+location.origin+'/sibling/:'+('0'.repeat(64))),
   caches.open('imp-plan-static:'+location.origin+'/imp-plan/:'+('0'.repeat(64)))
  ])
 })
 await page.goto('./')
 await expect(page.getByText('Ready for offline practice.',{exact:true})).toBeVisible({timeout:10000})
 const scope=new URL('./',page.url()).href
 const cachePrefix='imp-plan-static:'+scope+':'
 const cacheNames=await page.evaluate(()=>caches.keys())
 expect(cacheNames).toContain('other-project-cache')
 expect(cacheNames).toContain('imp-plan-static:'+new URL('../sibling/',scope).href+':'+('0'.repeat(64)))
 const appCaches=cacheNames.filter(name=>name.startsWith(cachePrefix))
 expect(appCaches).toHaveLength(1)
 expect(appCaches[0]).not.toBe(cachePrefix+'0'.repeat(64))
 // Even a successful same-origin GET that isn't a runtime asset must not be cached or intercepted.
 const unmanaged=await Promise.all([
  page.waitForResponse(r=>r.url()===scope+'robots.txt'),
  page.evaluate(()=>fetch('robots.txt').then(r=>r.status))
 ])
 expect(unmanaged[0].fromServiceWorker()).toBe(false)
 expect(unmanaged[1]).toBe(200)
 const assets=await page.evaluate(async name=>(await (await caches.open(name)).keys()).map(request=>request.url),appCaches[0])
 expect(assets.every(url=>url.startsWith(scope)&&!new URL(url).search)).toBe(true)
 expect(assets).not.toContain(scope+'robots.txt')
 expect(assets.filter(url=>/\/art\/montage\/p\d\d\.svg$/.test(url))).toHaveLength(32)
 expect(assets).toContain(scope+'season/3/index.html')
 expect(assets.some(url=>/\/assets\/heavy-13-ui-[^/]+\.js$/.test(url))).toBe(true)

 await context.setOffline(true)
 const reopened=await context.newPage()
 await page.close()
 await reopened.clock.install()
 const home=await reopened.goto('./')
 expect(home?.fromServiceWorker()).toBe(true)
 await expect(reopened.getByText('Ready for offline practice.',{exact:true})).toBeVisible()
 const season1=await Promise.all([
  reopened.waitForResponse(r=>r.url()===scope+'season/1/'),
  reopened.getByRole('navigation',{name:'Seasons'}).getByRole('link',{name:'Season 1',exact:true}).click()
 ])
 expect(season1[0].fromServiceWorker()).toBe(true)
 await expect(reopened.getByLabel('Nickname')).toHaveValue('')
 await reopened.getByRole('button',{name:'Practice Montage'}).click()
 await expect(reopened.getByText('Player',{exact:true})).toBeVisible()
 await startMatch(reopened)
 const gallery=reopened.getByRole('region',{name:'Montage portrait gallery'})
 await gallery.getByRole('button',{name:'Start round 1'}).click()
 await reopened.clock.runFor(2300)
 const portrait=gallery.getByRole('img',{name:/^Portrait with /})
 await expect.poll(()=>portrait.evaluate((img:HTMLImageElement)=>img.complete&&img.naturalWidth>0)).toBe(true)
 await reopened.getByRole('button',{name:'Leave room',exact:true}).click()
 const season3=await reopened.goto('./season/3/')
 expect(season3?.fromServiceWorker()).toBe(true)
 await expect(reopened.getByLabel('Nickname')).toHaveValue('')
 await reopened.getByRole('button',{name:'Practice Heavy 13'}).click()
 await expect(reopened.getByText('Player',{exact:true})).toBeVisible()
 await chooseSetting(reopened,'Bot difficulty','hard')
 await startMatch(reopened)
 const board=reopened.getByRole('region',{name:'Heavy 13 table'})
 await expect(board).toBeVisible()
 for(const name of ['Number 6','Rainbow, 1 left','Lock pair privately','Place on Green']){
  await board.getByRole('button',{name,exact:true}).press('Enter')
 }
 await expect(board.getByText('Round 2 / 14',{exact:true})).toBeVisible()
 const invite=await reopened.goto('./#/join?room=ABC234')
 expect(invite?.fromServiceWorker()).toBe(true)
 await expect(reopened.getByLabel('Invite code')).toHaveValue('ABC234')
 await expect(reopened.getByLabel('Nickname')).toHaveValue('')
})

test('offline before saving games gives an in-place explanation if a lazy table cannot load',async({browser,baseURL})=>{
 const context=await browser.newContext({baseURL,serviceWorkers:'block'})
 try{
  const page=await context.newPage()
  await page.goto('./')
  await expect(page.getByText('Ready for offline practice.',{exact:true})).toHaveCount(0)
  await context.setOffline(true)
  await page.getByRole('button',{name:'Practice Heavy 13'}).click()
  await page.getByRole('button',{name:'Start match',exact:true}).click()
  const briefing=page.getByRole('dialog')
  await expect(briefing.getByRole('alert')).toContainText('Heavy 13 files aren’t available.')
  await briefing.getByRole('button',{name:'Enter match'}).click()
  await expect(page.getByRole('alert')).toContainText('Heavy 13 files aren’t available.')
  await page.getByRole('button',{name:'Leave room',exact:true}).click()
  await expect(page.getByRole('heading',{name:'Imp Plan',exact:true})).toBeVisible()
 }finally{await context.close()}
})

test('a corrupted portrait prevents readiness until a complete release can be saved',async({page})=>{
 let broken=true
 let intercepted=0
 const server=await preview({
  preview:{host:'127.0.0.1',port:0},
  plugins:[{name:'missing-offline-asset',configurePreviewServer(server){
   server.middlewares.use((request,response,next)=>{
    if(!broken||request.url!=='/imp-plan/art/montage/p31.svg')return next()
    intercepted++
    response.writeHead(200,{'Content-Type':'image/svg+xml'}).end('<svg xmlns="http://www.w3.org/2000/svg"/>')
   })
  }}]
 })
 try{
  const address=server.httpServer.address()
  if(!address||typeof address==='string')throw new Error('No preview port')
  await page.goto('http://127.0.0.1:'+address.port+'/imp-plan/')
  await expect(page.getByText('Offline files aren’t saved.',{exact:false})).toBeVisible({timeout:10000})
  await expect(page.getByText('Ready for offline practice.',{exact:true})).toHaveCount(0)
  expect(intercepted).toBeGreaterThan(0)
  expect(await page.evaluate(()=>navigator.serviceWorker.controller)).toBeNull()
  expect(await page.evaluate(()=>caches.keys())).toEqual([])
  broken=false
  await page.reload()
  await expect(page.getByText('Ready for offline practice.',{exact:true})).toBeVisible({timeout:10000})
 }finally{await server.close()}
})

test('an active worker detects an evicted runtime asset offline and repairs its cache after reconnecting',async({page,context})=>{
 await page.goto('./')
 const ready=page.getByText('Ready for offline practice.',{exact:true})
 await expect(ready).toBeVisible({timeout:10000})
 await page.evaluate(async()=>{
  const name=(await caches.keys()).find(key=>key.startsWith('imp-plan-static:'))!
  const cache=await caches.open(name)
  if(!await cache.delete(new URL('art/montage/p31.svg',location.href).href))throw new Error('Expected portrait to exist')
 })
 await context.setOffline(true)
 await page.reload()
 await expect(page.getByText('Offline files aren’t saved.',{exact:false})).toBeVisible()
 await expect(ready).toHaveCount(0)
 await context.setOffline(false)
 await expect(ready).toBeVisible({timeout:10000})
})
