import {useEffect,useState} from 'react'

type Availability='saving'|'ready'|'updating'|'unavailable'

export function useOfflinePractice(){
 const [availability,setAvailability]=useState<Availability>('saving')
 useEffect(()=>{
  if(!import.meta.env.PROD)return
  if(!('serviceWorker' in navigator)){setAvailability('unavailable');return}
  const worker=navigator.serviceWorker
  const script=new URL(import.meta.env.BASE_URL+'sw.js',location.href).href
  const entry=document.querySelector<HTMLScriptElement>('script[type="module"][src]')?.src
  const release=document.querySelector<HTMLMetaElement>('meta[name="imp-plan-release"]')?.content
  let stopped=false
  let port:MessagePort|undefined
  let deadline:number|undefined
  const show=(value:Availability)=>{if(!stopped)setAvailability(value)}
  const check=()=>{
   const controller=worker.controller
   if(!controller||controller.scriptURL!==script||!entry)return
   port?.close()
   const channel=new MessageChannel()
   port=channel.port1
   channel.port1.onmessage=event=>{
    window.clearTimeout(deadline)
    show(event.data===true?'ready':event.data==='different-release'?'updating':'unavailable')
    channel.port1.close()
   }
   controller.postMessage({type:'IMP_PLAN_OFFLINE_CHECK',entry,release,online:navigator.onLine},[channel.port2])
  }
  const prepare=async()=>{
   window.clearTimeout(deadline)
   deadline=window.setTimeout(()=>show('unavailable'),30000)
   check()
   if(!navigator.onLine){if(!worker.controller)show('unavailable');return}
   try{
    const registration=await worker.register(script,{updateViaCache:'none'})
    if(stopped)return
    const pending=registration.installing
    if(pending&&!worker.controller)pending.addEventListener('statechange',()=>{
     if(pending.state==='redundant'&&!worker.controller)show('unavailable')
    })
    check()
   }catch{if(!worker.controller)show('unavailable')}
  }
  worker.addEventListener('controllerchange',check)
  window.addEventListener('online',prepare)
  void prepare()
  return ()=>{
   stopped=true
   port?.close()
   window.clearTimeout(deadline)
   worker.removeEventListener('controllerchange',check)
   window.removeEventListener('online',prepare)
  }
 },[])
 return import.meta.env.PROD?availability:undefined
}
