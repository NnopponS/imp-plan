import {useEffect,useRef,type ButtonHTMLAttributes} from 'react'

export function useCardPress(onTap:()=>void,onHold:()=>void=onTap):ButtonHTMLAttributes<HTMLButtonElement>{
 const press=useRef<{id:number;x:number;y:number;timer:number}|null>(null)
 const suppressClick=useRef(false)
 const pointerType=useRef("")
 const cancel=()=>{
  if(press.current)window.clearTimeout(press.current.timer)
  press.current=null
 }
 useEffect(()=>cancel,[])
 return {
  onPointerDown:e=>{
   if(!e.isPrimary||e.button!==0)return
   const button=e.currentTarget
   cancel()
   suppressClick.current=false
   pointerType.current=e.pointerType
   const timer=window.setTimeout(()=>{
    press.current=null
    suppressClick.current=true
    if(button.isConnected&&!button.disabled)onHold()
   },460)
   press.current={id:e.pointerId,x:e.clientX,y:e.clientY,timer}
  },
  onPointerMove:e=>{
   const current=press.current
   if(current?.id===e.pointerId&&Math.hypot(e.clientX-current.x,e.clientY-current.y)>12){
    suppressClick.current=true
    cancel()
   }
  },
  onPointerUp:e=>{if(press.current?.id===e.pointerId)cancel()},
  onPointerCancel:e=>{if(press.current?.id===e.pointerId){suppressClick.current=true;cancel()}},
  onPointerLeave:e=>{if(e.pointerType==='mouse'&&press.current?.id===e.pointerId){suppressClick.current=true;cancel()}},
  onContextMenu:e=>{if(pointerType.current==="touch"||pointerType.current==="pen")e.preventDefault()},
  onClick:e=>{
   if(e.detail!==0&&suppressClick.current){e.preventDefault();return}
   onTap()
  },
 }
}
