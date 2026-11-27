import {useEffect,useRef,useState} from 'react'
import {createRoot} from 'react-dom/client'
import {TimeHoldBoard} from '../../src/time-hold-ui'
import {timeHoldStart,timeHoldAdvance,timeHoldView,timeHoldAction,timeHoldDisconnect,type TimeHoldAction} from '../../src/time-hold'

const seats=['guest','house']
const seatNames={guest:'Guest with a long display name',house:'House'}
function Fixture(){
 const host=useRef(timeHoldStart(seats,performance.now()))
 const [snapshot,setSnapshot]=useState(()=>({view:timeHoldView(host.current,'guest',host.current.lastHostAt),sample:host.current.lastHostAt}))
 const spectator=useRef(false)
 const [active,setActive]=useState(true)
 const [key,setKey]=useState(0)
 const actions=useRef<TimeHoldAction[]>([])
 // The capture exposes the fixture's own command log, not data a shipped match would expose.
 ;(window as Window&{timeHoldTestActions?:TimeHoldAction[]}).timeHoldTestActions=actions.current
 function publish(now:number){
  setSnapshot({view:timeHoldView(host.current,spectator.current?null:'guest',now),sample:now})
 }
 function submit(action:TimeHoldAction){
  const now=performance.now()
  actions.current.push(action)
  const next=timeHoldAction(host.current,'guest',action,now)
  if(!next)return false
  host.current=next
  publish(now)
  return true
 }
 useEffect(()=>{
  const id=setInterval(()=>{
   const now=performance.now()
   const next=timeHoldAdvance(host.current,now)
   if(next!==host.current){
    host.current=next
    publish(now)
   }
  },50)
  return ()=>clearInterval(id)
 },[])
 return <>
  <TimeHoldBoard view={snapshot.view} active={active} matchKey={String(key)} submit={submit} seatNames={seatNames}
   clockSample={{hostNow:snapshot.sample,receivedAt:snapshot.sample}}/>
  <footer aria-label="Fixture controls">
   <button onClick={()=>{
    const now=performance.now()
    host.current=timeHoldStart(seats,now)
    actions.current.length=0
    spectator.current=false
    setKey(x=>x+1);setActive(true);publish(now)
   }}>Restart fixture</button>
   <button onClick={()=>{spectator.current=!spectator.current;publish(performance.now())}}>Toggle spectator</button>
   <button onClick={()=>{const now=performance.now();host.current=timeHoldDisconnect(host.current,'guest',now);setActive(false);publish(now)}}>Disconnect fixture</button>
  </footer>
 </>
}
createRoot(document.querySelector('#root')!).render(<Fixture/>)
