import {useEffect,useRef,useState} from 'react'
import {knightPrintHeight,knightPrintWidth,knightRecordSvg,type KnightPrint} from './knight-result-art'
import './knight-result.css'

export function KnightResultPrint({result}:{result:KnightPrint}){
 const src=printSource(result)
 const print=useRef<HTMLElement>(null)
 useEffect(()=>{
  const active=document.activeElement
  // Place keyboard users back in the result when their final board button disappears.
  // In a party, leave a player who is writing in chat alone.
  if(active===document.body||active?.closest('.knight-board'))print.current?.focus({preventScroll:true})
 },[])
 const distance=`${result.visited} of ${result.size*result.size} squares visited`
 return <figure ref={print} className="knight-result-print" tabIndex={-1} aria-label="Knight’s Tour result">
  <img src={src} width={knightPrintWidth} height={knightPrintHeight} decoding="async"
   alt={`Knight’s Tour chamber record: ${result.size} by ${result.size} ${result.closed?'closed':'open'} tour, ${distance}.${result.elapsed?' Finish time '+result.elapsed+'.':''}`}/>
  <figcaption className="sr">{'Your route in order: '+result.path.map(cell=>String.fromCharCode(65+cell%result.size)+(Math.floor(cell/result.size)+1)).join(', ')+'.'}</figcaption>
 </figure>
}

function printSource(result:KnightPrint){return 'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(knightRecordSvg(result))}
async function makePng(src:string){
 const image=new Image(knightPrintWidth,knightPrintHeight)
 await new Promise<void>((resolve,reject)=>{image.onload=()=>resolve();image.onerror=()=>reject(Error('Result could not be rendered.'));image.src=src})
 const canvas=document.createElement('canvas')
 canvas.width=knightPrintWidth*2;canvas.height=knightPrintHeight*2
 const ctx=canvas.getContext('2d')
 if(!ctx)throw Error('Image saving unavailable.')
 ctx.drawImage(image,0,0,canvas.width,canvas.height)
 return new Promise<Blob>((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(Error('PNG is unavailable.')),'image/png'))
}

function shareFileSupported(file:File|null){
 if(!file||typeof navigator.share!=='function'||typeof navigator.canShare!=='function')return false
 try{return navigator.canShare({files:[file]})}catch{return false}
}
function savePng(image:Blob,filename:string){
 const url=URL.createObjectURL(image)
 const link=document.createElement('a')
 link.href=url;link.download=filename
 document.body.append(link);link.click();link.remove()
 // Safari must have a chance to read the local file before revoking its URL.
 window.setTimeout(()=>URL.revokeObjectURL(url),2000)
}

export function KnightResultImageActions({result}:{result:KnightPrint}){
 const src=printSource(result)
 const filename=`imp-plan-knights-tour-${result.size}x${result.size}.png`
 const [image,setImage]=useState<{blob:Blob;file:File|null}|null>(null)
 const [status,setStatus]=useState('')
 const [attempt,setAttempt]=useState(0)
 const [running,setRunning]=useState(false)
 const [failed,setFailed]=useState(false)
 const [saveOnly,setSaveOnly]=useState(false)
 useEffect(()=>{
  let stale=false
  setImage(null);setFailed(false);setStatus('');setSaveOnly(false)
  // Prepare the image before the press, keeping navigator.share on its browser user gesture.
  makePng(src).then(blob=>{
   if(stale)return
   let file:File|null=null
   try{file=new File([blob],filename,{type:'image/png'})}catch{/* A local Blob download still works. */}
   setImage({blob,file})
  },()=>{if(!stale){setFailed(true);setStatus('Could not prepare an image. Try again or export the result.')}})
  return ()=>{stale=true}
 },[src,filename,attempt])
 const native=!saveOnly&&shareFileSupported(image?.file??null)
 async function deliver(){
  if(failed){setAttempt(i=>i+1);return}
  if(!image)return
  if(native&&image.file){
   setRunning(true)
   try{await navigator.share({files:[image.file],title:'Knight’s Tour · Imp Plan'});setStatus('Image sent to your share menu.')}
   catch(error){
    if(!(error instanceof Error)||error.name!=='AbortError'){
     setSaveOnly(true);setStatus('Sharing isn’t available here. Save the PNG instead.')
    }
   }
   finally{setRunning(false)}
  }else{
   savePng(image.blob,filename)
   setStatus('PNG download started.')
  }
 }
 return <>
  <button className="match-action knight-result-image" type="button" disabled={!image&&!failed||running} onClick={()=>void deliver()}>
   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {native?<path d="M5 13v7h14v-7M12 16V4m-4 4 4-4 4 4"/>:<path d="M5 13v7h14v-7M12 4v12m-4-4 4 4 4-4"/>}
   </svg>
   {failed?'Retry image':!image?'Preparing image…':native?'Share image':'Save image'}
  </button>
  <span className="knight-result-message" role="status">{status}</span>
 </>
}
