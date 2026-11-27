import {test,expect} from '@playwright/test'
import {createHash} from 'node:crypto'
import {readFileSync} from 'node:fs'
import {preview} from 'vite'

const dist=new URL('../../dist/',import.meta.url)
const scopePath='/imp-plan/'
const pages=['index.html',...[1,2,3].map(n=>'season/'+n+'/index.html')]
const releaseTag=/<meta name="imp-plan-release" content="[0-9a-f]{64}">/
const digest=(s:string)=>createHash('sha256').update(s)
const read=(asset:string)=>readFileSync(new URL(asset,dist),'utf8')
const releaseOf=(html:string)=>html.match(/<meta name="imp-plan-release" content="([0-9a-f]{64})">/)?.[1]

test('same-entry release update prefers fresh HTML, keeps old offline intact, and promotes after tab closure',async({page,context})=>{
 // Serve two releases through real HTTP. B intentionally changes HTML only
 // (same scripts and CSS), so comparing an entry filename alone cannot prove readiness.
 const aHTML=read('index.html')
 const bRelease=digest(aHTML+'updated test release').digest('hex')
 const newPages=new Map(pages.map(path=>[path,read(path).replace(releaseTag,'').replace('</head>',`<meta name="imp-plan-release" content="${bRelease}"></head>`)]))
 const aWorker=read('sw.js')
 const bVersion=digest(aWorker+'updated test worker').digest('hex')
 const bWorker=aWorker.replace(/^const VERSION=.*$/m,'const VERSION='+JSON.stringify(bVersion))
  .replace(/^const RELEASE=.*$/m,'const RELEASE='+JSON.stringify(bRelease))
  .replace(/^const ASSETS=(.*)$/m,(_,json:string)=>{
   const manifest=JSON.parse(json) as [string,string][]
   return 'const ASSETS='+JSON.stringify(manifest.map(([path,integrity])=>{
    const html=newPages.get(path)
    return [path,html?'sha256-'+digest(html).digest('base64'):integrity]
   }))
  })
 let b=false,stalled=false,disconnected=false
 const server=await preview({
  preview:{host:'127.0.0.1',port:0},
  plugins:[{name:'two-release-http',configurePreviewServer(server){
   server.middlewares.use((request,response,next)=>{
    const href=(request.url??'').split('?')[0]
    if(href==='/sibling/'){
     response.writeHead(200,{'Content-Type':'text/html'}).end('<!doctype html><title>Sibling project</title>')
     return
    }
    if(!b||!href.startsWith(scopePath))return next()
    const path=href.slice(scopePath.length)
    if(path==='sw.js'){
     response.writeHead(200,{'Content-Type':'text/javascript','Cache-Control':'no-store'}).end(bWorker)
     return
    }
    const html=newPages.get(!path||path.endsWith('/')?path+'index.html':path)
    if(!html)return next()
    if(disconnected){response.destroy();return}
    response.writeHead(200,{'Content-Type':'text/html','Cache-Control':'no-store'})
    if(stalled&&path==='season/1/'){
     response.write('<!doctype html><html>') // headers arrive, body does not
     response.flushHeaders()
     return
    }
    response.end(html)
   })
  }}]
 })
 try{
  const address=server.httpServer.address()
  if(!address||typeof address==='string')throw new Error('Missing preview port')
  const origin='http://127.0.0.1:'+address.port
  const scope=origin+scopePath, prefix='imp-plan-static:'+scope+':'
  const ready=(p:typeof page)=>p.getByText('Ready for offline practice.',{exact:true})
  const revision=(p:typeof page)=>p.locator('meta[name="imp-plan-release"]').getAttribute('content')
  const entry=(p:typeof page)=>p.locator('script[type="module"][src]').getAttribute('src')
  const sibling=await context.newPage()
  await sibling.goto(origin+'/sibling/')
  const siblingCache='imp-plan-static:'+origin+'/sibling/:'+('0'.repeat(64))
  await sibling.evaluate(name=>caches.open(name).then(cache=>cache.put('/sibling/test',new Response('keep me'))),siblingCache)
  await page.goto(scope)
  await expect(ready(page)).toBeVisible({timeout:10000})
  const originalCache=(await page.evaluate(()=>caches.keys())).find(name=>name.startsWith(prefix))!
  expect(originalCache).toBeTruthy()

  b=true
  const newTab=await context.newPage()
  await newTab.setViewportSize({width:320,height:720})
  const fresh=await newTab.goto(scope)
  // Source is the normal scoped URL with no rescue query/version parameter.
  expect(fresh?.fromServiceWorker()).toBe(true)
  await expect(newTab.locator('meta[name="imp-plan-release"]')).toHaveAttribute('content',bRelease)
  expect(await entry(newTab)).toBe(await entry(page))
  const queryTab=await context.newPage()
  expect((await queryTab.goto(scope+'?v='+bRelease))?.fromServiceWorker()).toBe(false)
  expect(await revision(queryTab)).toBe(bRelease)
  await queryTab.close()
  const aRelease=releaseOf(aHTML)
  expect(aRelease).not.toBe(bRelease)
  expect(await revision(page)).toBe(aRelease)
  const warning=newTab.locator('#room-entry').getByRole('status')
  await expect(warning).toHaveText('This release isn’t ready for offline play. Finish any open games, then close all Imp Plan tabs and reopen online.')
  const safe=await warning.evaluate(node=>{
   const paper=node.closest('form')!.getBoundingClientRect(),note=node.getBoundingClientRect()
   return note.left-paper.left>=14&&paper.right-note.right>=14&&paper.bottom-note.bottom>=14&&node.scrollWidth<=node.clientWidth
  })
  expect(safe).toBe(true)
  await expect(ready(newTab)).toHaveCount(0)
  await expect.poll(()=>newTab.evaluate(async()=> (await navigator.serviceWorker.getRegistration())?.waiting?.state),{timeout:10000}).toBe('installed')
  await expect(ready(page)).toBeVisible()
  expect(await newTab.evaluate(()=>caches.keys())).toEqual(expect.arrayContaining([originalCache,prefix+bVersion,siblingCache]))

  // Timeout from an incomplete HTML response should still get the entire old document.
  stalled=true
  const slowTab=await context.newPage()
  const recovered=await slowTab.goto(scope+'season/1/',{timeout:5500})
  expect(recovered?.fromServiceWorker()).toBe(true)
  expect(await revision(slowTab)).toBe(aRelease)
  await expect(slowTab.getByRole('heading',{name:'The First Plan'})).toBeVisible()
  stalled=false

  // Deny actual HTTP as well as marking the page offline: a worker's target
  // can otherwise retain network in Chromium's per-target emulation.
  disconnected=true
  await context.setOffline(true)
  const oldOffline=await context.newPage()
  expect((await oldOffline.goto(scope))?.fromServiceWorker()).toBe(true)
  expect(await revision(oldOffline)).toBe(aRelease)
  await expect(ready(oldOffline)).toBeVisible()
  await context.setOffline(false)
  disconnected=false
  await Promise.all([page.close(),newTab.close(),slowTab.close(),oldOffline.close()])

  // Clearing scope clients lets B promote through the ordinary worker lifecycle.
  await expect.poll(()=>sibling.evaluate(async(scope)=>{
   const registration=await navigator.serviceWorker.getRegistration(scope)
   return registration?.active?.state==='activated'&&!registration.waiting
  },scope),{timeout:10000}).toBe(true)
  disconnected=true
  await context.setOffline(true)
  const nextOffline=await context.newPage()
  expect((await nextOffline.goto(scope))?.fromServiceWorker()).toBe(true)
  expect(await revision(nextOffline)).toBe(bRelease)
  await expect(ready(nextOffline)).toBeVisible()
  const keys=await nextOffline.evaluate(()=>caches.keys())
  expect(keys.filter(name=>name.startsWith(prefix))).toEqual([prefix+bVersion])
  expect(await sibling.evaluate(async(name)=>{
   const saved=await (await caches.open(name)).match('/sibling/test')
   return saved?.text()
  },siblingCache)).toBe('keep me')
 }finally{await server.close()}
})
