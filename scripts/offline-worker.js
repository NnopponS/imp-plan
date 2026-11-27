const scope=self.registration.scope
// Pages projects on the same origin share CacheStorage. Only own this scope's namespace.
const prefix='imp-plan-static:'+scope+':'
const cacheName=prefix+VERSION
const url=path=>new URL(path,scope).href
const assets=new Map(ASSETS.map(([path,integrity])=>[url(path),integrity]))
const pages=new Map(PAGES.flatMap(path=>[[url(path),url(path)],[url(path.slice(0,-'index.html'.length)),url(path)]]))

// Cache.addAll is atomic. Integrity checks reject stale CDN files, redirects and fallback documents.
const save=(cache,keys)=>cache.addAll(keys.map(key=>
 new Request(key,{cache:'reload',credentials:'omit',redirect:'error',integrity:assets.get(key)})
))
async function install(){
 try{
  await save(await caches.open(cacheName),[...assets.keys()])
 }catch(error){
  await caches.delete(cacheName)
  throw error
 }
}

self.addEventListener('install',event=>event.waitUntil(install()))
// No skipWaiting: an earlier tab still needs its own matching JS/CSS and art.
self.addEventListener('activate',event=>event.waitUntil((async()=>{
 const keys=await caches.keys()
 await Promise.all(keys.filter(key=>key.startsWith(prefix)&&key!==cacheName&&/^[0-9a-f]{64}$/.test(key.slice(prefix.length))).map(key=>caches.delete(key)))
 await self.clients.claim()
})()))

async function cached(key){
 try{return await (await caches.open(cacheName)).match(key)}
 catch{/* If browser storage is unavailable, use the network normally. */}
}
async function navigate(target,key){
 const controller=new AbortController()
 // Include body delivery in the deadline, not just the response headers.
 const wait=setTimeout(()=>controller.abort(),1800)
 let rejectedResponse
 try{
  const response=await fetch(target,{mode:'same-origin',cache:'no-store',credentials:'omit',redirect:'error',signal:controller.signal})
  if(response.status===200&&/^text\/html(?:\s*;|$)/i.test(response.headers.get('Content-Type')??'')){
   if((await response.clone().arrayBuffer()).byteLength)return response
  }
  rejectedResponse=response
 }catch{/* Offline, aborted, or redirected: use the installed release. */}
 finally{clearTimeout(wait)}
 // Never store runtime HTML or mix it into the installed release.
 return await cached(key)??rejectedResponse??Response.error()
}
async function cachedOrNetwork(key,request){return await cached(key)??fetch(request)}
self.addEventListener('fetch',event=>{
 const request=event.request
 if(request.method!=='GET'||request.headers.has('range'))return
 // These are exact, same-origin build output URLs. No arbitrary navigation fallback,
 // query-string requests, room traffic, or writes from runtime requests.
 const target=new URL(request.url)
 if(target.search)return
 target.hash='' // invite codes and in-page anchors still use the same static shell
 if(request.mode==='navigate'){
  const key=pages.get(target.href)
  if(key)event.respondWith(navigate(target.href,key))
 }else if(assets.has(target.href))event.respondWith(cachedOrNetwork(target.href,request))
})

let repair
self.addEventListener('message',event=>{
 const port=event.ports[0]
 if(!port||event.data?.type!=='IMP_PLAN_OFFLINE_CHECK')return
 // The controlling worker may be from a different build during an update. Only
 // report ready only for the stamped document release and every exact asset.
 event.waitUntil((async()=>{
  try{
   if(event.data.release!==RELEASE)return port.postMessage('different-release')
   if(!assets.has(event.data.entry))return port.postMessage(false)
   const cache=await caches.open(cacheName)
   const cached=new Set((await cache.keys()).map(request=>request.url))
   const missing=[...assets.keys()].filter(key=>!cached.has(key))
   if(missing.length){
    if(event.data.online!==true)return port.postMessage(false)
    // Repair evicted files only from this exact release; never persist runtime responses.
    repair??=save(cache,missing).finally(()=>{repair=undefined})
    await repair
   }
   port.postMessage(true)
  }catch{port.postMessage(false)}
 })())
})
