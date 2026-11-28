import {HitCardArt,HitChip} from './hit-stay-art'
import {islandTerrain} from './treasure-island'
import {EquationBlockArt} from './equation-tower-figures'
import {useEffect,useRef,useState,type CSSProperties,type ReactNode} from 'react'
import {titles,type Game} from './engine'
import {UnknownWorkedScene} from './unknown-art'
import {base} from './brand'
import './arena-preview.css'

type EntryHandler=(entry:IntersectionObserverEntry)=>void
const watched=new Map<Element,EntryHandler>()
let observer:IntersectionObserver|undefined

const SVG_NS='http://www.w3.org/2000/svg'
const animationTags=['animate','animateTransform','animateMotion']
const coverCycle=2.2
type MotionCopy={url:string;source:string;objectFit:string;objectPosition:string}

function activateArtwork(contents:string){
 const parsed=new DOMParser().parseFromString(contents,'image/svg+xml')
 const svg=parsed.documentElement
 if(svg.namespaceURI!==SVG_NS||svg.localName!=='svg')return
 let activated=false
 for(const tag of animationTags){
  for(const cue of svg.getElementsByTagNameNS(SVG_NS,tag)){
   const at=cue.getAttribute('data-cover-at')
   const duration=cue.getAttribute('dur')
   const times=cue.getAttribute('keyTimes')?.split(';').map(Number)
   const valueAttr=tag==='animateMotion'?'keyPoints':'values'
   const values=cue.getAttribute(valueAttr)?.split(';')
   if(!at||!/^0\.\d{1,3}s$/.test(at)||cue.getAttribute('begin')!=='indefinite'||
    !duration||!/^\d+(?:\.\d+)?s$/.test(duration)||!times||!values||
    values.length!==times.length||times[0]!==0||times.at(-1)!==1||
    !times.every((time,i)=>Number.isFinite(time)&&time>=0&&time<=1&&(i===0||time>times[i-1])))continue
   const original=Number.parseFloat(duration)
   if(original<=0||original>=coverCycle)continue
   // Preserve all authored movements and their staggered starts. Extend each
   // layer's final still pose so native SMIL can repeat them on one shared beat.
   cue.setAttribute('keyTimes',[...times.map(time=>(time*original/coverCycle).toFixed(6)),'1'].join(';'))
   cue.setAttribute(valueAttr,[...values,values.at(-1)].join(';'))
   if(cue.getAttribute('calcMode')==='spline'){
    const splines=cue.getAttribute('keySplines')
    if(splines)cue.setAttribute('keySplines',splines+';0 0 1 1')
   }
   cue.setAttribute('begin',at)
   cue.setAttribute('dur',coverCycle+'s')
   cue.setAttribute('repeatCount','indefinite')
   activated=true
  }
 }
 // Assigned to an <img>, never imported into the app document or run as markup.
 if(activated)return new XMLSerializer().serializeToString(svg)
}

export function watchPreview(element:Element,handler:EntryHandler){
 if(!observer)observer=new IntersectionObserver(entries=>{
  for(const entry of entries)watched.get(entry.target)?.(entry)
 },{threshold:[0,.25,.5]})
 watched.set(element,handler)
 observer.observe(element)
 return ()=>{
  watched.delete(element)
  observer?.unobserve(element)
  if(!watched.size){observer?.disconnect();observer=undefined}
 }
}

const modalListeners=new Set<()=>void>()
let modalObserver:MutationObserver|undefined
export function watchPreviewDialogs(changed:()=>void){
 if(!modalObserver&&typeof MutationObserver==='function'){
  modalObserver=new MutationObserver(records=>{
   if(records.some(record=>record.target instanceof HTMLDialogElement))modalListeners.forEach(listener=>listener())
  })
  modalObserver.observe(document.body,{subtree:true,attributes:true,attributeFilter:['open']})
 }
 modalListeners.add(changed)
 return ()=>{
  modalListeners.delete(changed)
  if(!modalListeners.size){modalObserver?.disconnect();modalObserver=undefined}
 }
}
export function previewDialogIsActive(target:Element){
 const dialog=document.querySelectorAll('dialog[open]')
 return !dialog.length||dialog[dialog.length-1].contains(target)
}

export function ArenaPreview({game,posterClass,motionOff=false,children}:{game:Game;posterClass:string;motionOff?:boolean;children:ReactNode}){
 const node=useRef<HTMLDivElement>(null)
 const [copy,setCopy]=useState<MotionCopy|null>(null)
 const [ready,setReady]=useState(false)
 const loaded=useRef<(url:string)=>void>(()=>{})
 const failed=useRef<(url:string)=>void>(()=>{})
 useEffect(()=>{
  setCopy(null)
  setReady(false)
  const target=node.current
  const poster=target?.querySelector<HTMLImageElement>('img[data-arena-art]')
  if(!target||!poster||motionOff||typeof IntersectionObserver!=='function')return
  const motion=window.matchMedia?.('(prefers-reduced-motion: reduce)')
  let currentRatio=0
  let url:string|undefined
  let source=''
  let artwork:string|undefined
  let couldNotLoad=false
  let request:AbortController|undefined
  let deadline:number|undefined
  function visible(){
   return currentRatio>=.5&&!motion?.matches&&!document.hidden&&previewDialogIsActive(target!)&&
    document.documentElement.dataset.gameMotion!=='off'&&poster!.complete&&poster!.naturalWidth>0
  }
  function stopCopy(){
   if(!url)return
   window.clearTimeout(deadline)
   URL.revokeObjectURL(url)
   url=undefined
   setCopy(null)
   setReady(false)
  }
  function makeCopy(){
   const style=getComputedStyle(poster!)
   const created=URL.createObjectURL(new Blob([artwork!],{type:'image/svg+xml'}))
   url=created
   setCopy({url:created,source,objectFit:style.objectFit,objectPosition:style.objectPosition})
   deadline=window.setTimeout(()=>failed.current(created),2500) // A slow/failed decode leaves the still.
  }
  function changed(){
   if(!visible()){
    stopCopy()
    request?.abort()
    request=undefined
    return
   }
   const selected=new URL(poster!.currentSrc)
   if(selected.href!==source){
    stopCopy()
    request?.abort()
    request=undefined
    couldNotLoad=false
    artwork=undefined
    source=selected.href
   }
   if(url||request||couldNotLoad||selected.origin!==location.origin||
    !selected.pathname.startsWith(base+'art/')||!selected.pathname.endsWith('.svg'))return
   if(artwork){makeCopy();return}
   const pending=new AbortController()
   request=pending
   void fetch(source,{signal:pending.signal}).then(response=>{
    if(!response.ok)throw new Error('Cover unavailable')
    return response.text()
   }).then(svg=>{
    if(request!==pending)return
    request=undefined
    artwork=activateArtwork(svg)
    couldNotLoad=!artwork
    changed()
   }).catch(()=>{
    if(request!==pending)return
    request=undefined
    couldNotLoad=true
   })
  }
  loaded.current=(candidate)=>{
   if(candidate!==url)return
   window.clearTimeout(deadline)
   setReady(true)
  }
  failed.current=(candidate)=>{
   if(candidate!==url)return
   couldNotLoad=true
   stopCopy()
  }
  const release=watchPreview(target,entry=>{
   currentRatio=entry.isIntersecting?entry.intersectionRatio:0
   changed()
  })
  const releaseDialogs=watchPreviewDialogs(changed)
  poster.addEventListener('load',changed)
  document.addEventListener('visibilitychange',changed)
  motion?.addEventListener?.('change',changed)
  return ()=>{
   release()
   releaseDialogs()
   window.clearTimeout(deadline)
   request?.abort()
   request=undefined
   if(url)URL.revokeObjectURL(url)
   poster.removeEventListener('load',changed)
   document.removeEventListener('visibilitychange',changed)
   motion?.removeEventListener?.('change',changed)
  }
 },[game,motionOff])
 return <div ref={node} className={'game-art arena-preview '+posterClass} data-preview-game={game} data-preview-painted={ready||undefined} data-preview-state={copy?'playing':'idle'}>
  {children}
  {copy&&!motionOff&&<img className="arena-cover-motion" src={copy.url} alt="" aria-hidden="true" draggable={false}
   data-cover-motion data-cover-original={copy.source} data-cover-ready={ready}
   style={{objectFit:copy.objectFit as CSSProperties['objectFit'],objectPosition:copy.objectPosition}}
   onLoad={event=>loaded.current(event.currentTarget.src)} onError={event=>failed.current(event.currentTarget.src)}/>}
 </div>
}

/** Render only inside the player's deliberate Details/Preview action. */
export function ArenaGamePreview({game,replayKey,motionOff=false}:{game:Game;replayKey?:string|number;motionOff?:boolean}){
 const scene=previewScenes[game]
 return <svg key={replayKey} className="arena-preview-scene arena-game-preview" viewBox="14 29 172 72" role="img"
  data-game-preview={game} style={{'--ap-run':scene.ms+'ms'} as CSSProperties} data-preview-static={motionOff||undefined} aria-label={titles[game]+' gameplay preview'} focusable="false">
  <path className="ap-plate" d="M14 39 24 30h151l11 9v51l-10 10H24L14 90Z"/>
  <path className="ap-ruling" d="M20 42v-1l8-7h144l8 7v1M20 87v1l8 8h144l8-8v-1M24 65h5m142 0h5"/>
  {scene.draw()}
 </svg>
}

// The lobby needs a persistent, motion-free example rather than the transient gallery overlay.
export function ArenaStill({game}:{game:Game}){
 return <svg className="arena-preview-scene arena-preview-still" viewBox="33 35 134 60" role="img" aria-label={titles[game]+' example'}>
  {previewScenes[game].draw()}
 </svg>
}

export const gamePreviewPlaybackTime=(game:Game)=>previewScenes[game].ms

const time=(ms:number)=>({'--ap-wait':ms+'ms'} as CSSProperties)
const color=(key='')=>key?' ap-'+key:''
function Piece({x,y,kind='ivory',motion='',delay=0}:{x:number;y:number;kind?:string;motion?:string;delay?:number}){
 return <g transform={`translate(${x} ${y})`}><g style={time(delay)} className={'ap-stone'+color(kind)+color(motion)}><ellipse cy="1.5" rx="6.8" ry="4.5" className="ap-shadow"/><ellipse rx="6.8" ry="4.5"/><path d="M-4 0Q0-3 4 0" fill="none"/></g></g>
}
function Tile({x,y,label,kind='gold',motion='',delay=0}:{x:number;y:number;label:string;kind?:string;motion?:string;delay?:number}){
 return <g transform={`translate(${x} ${y})`}><g className={'ap-tile'+color(kind)+color(motion)} style={time(delay)}><path d="M-7-8H7L9-6V6L7 8H-7L-9 6V-6Z"/><text y="1">{label}</text></g></g>
}
function Cube({x,y,kind='gold',label,motion='',delay=0}:{x:number;y:number;kind?:string;label?:string;motion?:string;delay?:number}){
 return <g transform={`translate(${x} ${y})`}><g className={'ap-cube'+color(kind)+color(motion)} style={time(delay)}>
  <path className="ap-cube-front" d="M-10-7 3-3V9L-10 5Z"/><path className="ap-cube-side" d="M3-3 11-8V4L3 9Z"/><path className="ap-cube-top" d="M-10-7-2-12 11-8 3-3Z"/>{label&&<text x="-3" y="2">{label}</text>}
 </g></g>
}
function Card({x,y,label,kind='ivory',motion='',delay=0}:{x:number;y:number;label:string;kind?:string;motion?:string;delay?:number}){
 return <g transform={`translate(${x} ${y})`}><g className={`ap-card ap-${kind}${color(motion)}`} style={time(delay)}><rect x="-9" y="-13" width="18" height="26" rx="2"/><path d="M-6 7h12M-6-8h12" fill="none"/><text y="1">{label}</text><path className="ap-card-back" d="M-8-12H8v24H-8Z M0-7 5 0 0 7-5 0Z"/></g></g>
}
function Grid({x=59,y=46,cols=5,rows=3,cell=16}:{x?:number;y?:number;cols?:number;rows?:number;cell?:number}){
 return <path className="ap-grid" d={Array.from({length:cols+1},(_,i)=>`M${x+i*cell} ${y}v${rows*cell}`).concat(Array.from({length:rows+1},(_,i)=>`M${x} ${y+i*cell}h${cols*cell}`)).join('')}/>
}
function Caption({x=100,y=82,text,delay=500}:{x?:number;y?:number;text:string;delay?:number}){
 return <g transform={`translate(${x} ${y})`}><g className="ap-caption ap-pop" style={time(delay)}><rect x={text.length*-3.85-3} y="-8" width={text.length*7.7+6} height="16" rx="2"/><text y="1">{text}</text></g></g>
}
function Gomoku({point=false}:{point?:boolean}){
 const xs=[62,81,100,119,138]
 return <><Grid x={52} cols={6} rows={3} cell={16} y={44}/><path className="ap-gold-line ap-draw" style={time(605)} d={point?'M58 77h68':'M55 67h90'}/>
  {xs.slice(0,point?4:5).map((x,i)=><g key={x} transform={`translate(${x} ${point?77:67})`}><g className={point?'':'ap-cover-turn'} style={{...time(860),'--ap-turn-at':'860ms'} as CSSProperties}><Piece x={0} y={0} kind={point?'jade':i===1||i===3?'rose':'ivory'} motion={i>=2?'drop':''} delay={120+i*126}/></g></g>)}
  {!point&&<><Piece x={81} y={82} kind="rose"/><Piece x={119} y={53} kind="ivory"/></>}
  <Caption x={151} y={54} text={point?'+2':'FIVE'} delay={1020}/>
 </>
}
function Morris(){
 return <><path className="ap-grid" d="M64 42h70v48H64ZM76 49h46v34H76ZM88 56h22v20H88ZM99 42v14m0 20v14M64 66h24m22 0h24"/>
  <Piece x={64} y={42}/><Piece x={99} y={42}/><Piece x={134} y={42} delay={350} motion="drop"/><Piece x={76} y={83} kind="rose" delay={950} motion="take"/>
  <Piece x={110} y={76} kind="rose"/><path className="ap-gold-line ap-draw" style={time(620)} d="M61 42h77"/></>
}
function Auction(){
 return <><path className="ap-ink-line" d="M84 42h32m-32 46h32m-27-45c0 11 6 16 11 22-5 6-11 11-11 22m22-44c0 11-6 16-11 22 5 6 11 11 11 22"/>
  <path className="ap-hour-top ap-gold-fill" d="m91 48 18 0-9 13Z"/><path className="ap-hour-base ap-gold-fill" d="m91 83 18 0-9-12Z"/><path className="ap-draw ap-gold-line" style={time(150)} d="M100 61v18"/>
  <Caption x={58} y={71} text="06s" delay={300}/><Caption x={143} y={71} text="12s" delay={850}/><path d="M127 83h32" className="ap-draw ap-gold-line" style={time(1120)}/></>
}
function Remove(){
 return <><Card x={82} y={65} label="2" kind="rose" motion="discard" delay={610}/><Card x={115} y={65} label="7" motion="card-flip" delay={720}/><Caption x={147} y={70} text="KEEP" delay={1050}/><path className="ap-draw ap-gold-line" style={time(340)} d="M72 84H55m6-5-6 5 6 5"/></>
}
function Knight(){
 return <><Grid x={72} y={41} cols={4} rows={4} cell={13}/>
  <path className="ap-draw ap-gold-line" style={time(120)} d="m78.5 47.5 26 13-13 26 26-13"/>
  {[[78.5,47.5],[104.5,60.5],[91.5,86.5],[117.5,73.5]].map(([x,y],i)=><g key={i} className="ap-pop" style={time(i*270)}><circle cx={x} cy={y} r="4.8" className="ap-gold-fill"/><text x={x} y={y+.65} className="ap-dark-label">{i+1}</text></g>)}
  <path className="ap-ink-line ap-jump" style={time(800)} d="m134 83 11-1 3-5-3-10-5-4-4 1 2 4-5 6 2 3h5l-4 4Z"/></>
}
function Hexagon(){
 return <>{[56,78,100,122,144].map((x,i)=><g key={x} transform={`translate(${x} 63)`}>
  <path className="ap-grid" d="M-10 0-5-9H5l5 9-5 9H-5Z"/>
  {i>0&&i<4&&<path className="ap-pop ap-gold-fill" style={time(i*205)} d="M-10 0-5-9H5l5 9-5 9H-5Z"/>}
  <text y="1">{[6,3,7,2,9][i]}</text>
 </g>)}<Caption y={84} text="Σ 12" delay={970}/></>
}
function RectangleScene({zero=false}:{zero?:boolean}){
 const values=zero?['+2','−2','+1','−1']:['2','3','1','2']
 return <><Grid x={62} y={41} cols={5} rows={3} cell={15}/>
  {values.map((v,i)=><text key={i} x={84.5+(i%2)*15} y={64+Math.floor(i/2)*15} className={zero?'ap-fine-label':''}>{v}</text>)}
  <path className="ap-draw ap-gold-line" style={time(160)} d="M77 56h30v30H77Z"/>
  <path className="ap-draw ap-secondary-line" style={time(645)} d={zero?'M62 56h45v15H62Z':'M92 41h30v30H92Z'}/>
  <Caption x={145} y={79} text={zero?'Σ 0':'Σ 8'} delay={1080}/></>
}
function Cubes(){
 return <><path className="ap-grid" d="m58 79 36-16 45 11-35 18Z"/>
  <Cube x={94} y={75}/><Cube x={112} y={81} kind="rose"/><Cube x={75} y={81}/><Cube x={93} y={87} kind="jade"/>
  <Cube x={94} y={63} kind="jade" motion="drop" delay={350}/><Cube x={93} y={75} motion="drop" delay={540}/>
  <Cube x={94} y={51} kind="ivory" motion="drop" delay={740}/>
  <Caption x={144} y={58} text="7" delay={1100}/></>
}
function Mancala(){
 return <><rect className="ap-grid" x="44" y="44" width="112" height="43" rx="13"/>
  {[55,78,100,122,145].map((x,i)=><ellipse key={x} cx={x} cy={65} rx={i===0||i===4?8:10} ry="12" className="ap-grid"/>)}
  {[78,100,122].map((x,i)=><Piece key={x} x={x} y={65} kind={['ivory','jade','rose'][i]} delay={250+i*300} motion="sow"/>)}
  <path className="ap-gold-line ap-draw" style={time(240)} d="M60 54q37-23 75 0m-7 0h7v-6"/><Caption x={144} y={79} text="+1" delay={1180}/></>
}
function Bagh(){
 return <><Grid x={76} y={43} cols={4} rows={4} cell={11}/><path className="ap-grid" d="m76 43 44 44m0-44L76 87m0-22 22-22 22 22-22 22Z"/>
  <g transform="translate(76 65)"><g className="ap-bagh-jump" style={time(490)}><path className="ap-rose-fill" d="m-6-5 3-5 3 3 3-3 3 5 1 7-7 4-7-4Z"/><path className="ap-ink-line" d="M-3-2h1m4 0h1M-2 2h4"/></g></g>
  <Piece x={87} y={65} motion="take" delay={780}/><Piece x={109} y={54}/><Piece x={98} y={76}/><path className="ap-gold-line ap-draw" style={time(350)} d="M76 65h23m-5-4 5 4-5 4"/></>
}
function Secret(){
 return <><g transform="translate(68 55)"><g className="ap-merge-right" style={time(190)}><path className="ap-ticket" d="M-14-7h28v14h-28q5-7 0-14Z"/><text y="1">?</text></g></g>
  <g transform="translate(132 55)"><g className="ap-merge-left" style={time(190)}><path className="ap-ticket" d="M-14-7h28q-5 7 0 14h-28Z"/><text y="1">?</text></g></g>
  <Caption y={79} text="EVEN" delay={830}/></>
}
function Grass({bonus=false}:{bonus?:boolean}){
 return <><Grid x={70} y={42} cols={5} rows={4} cell={12}/>
  <path className="ap-jade-fill" d="M82 54h36v12H94v24H82Z"/>
  <g transform="translate(94 66)"><path className={bonus?'ap-gold-fill ap-fit-side':'ap-jade-fill ap-fit-side'} style={time(290)} d={bonus?'M0 0h12V-12h24V0H24v12H0Z':'M0 0h24v24H0Z'}/></g>
  {bonus?<><path className="ap-gold-line" d="M125 56v8m-4-4h8"/><Caption x={144} y={79} text="+1" delay={900}/></>:<path className="ap-gold-line ap-draw" style={time(810)} d="M82 54h36v36H82Z"/>}</>
}
function Divine(){
 const marks=['⋮','◆','○','◇','☼','∴','◈','+','×']
 return <>{marks.map((m,i)=><Tile key={i} x={77+i%3*18} y={49+Math.floor(i/3)*17} label={m} kind={i===4?'rose':'gold'} motion={i===3||i===5?'fit-side':''} delay={i*75}/>)}
  <path className="ap-gold-line ap-draw" style={time(790)} d="M69 66h55m-47 17 36-34"/><Caption x={144} y={66} text="Σ" delay={1050}/></>
}
function Equation(){
 return <>{Array.from('12+13=25').map((v,i)=><text x={57+i*12.5} y="54" key={i} className="ap-sigil">{v}</text>)}
  {[0,1,2,3,4,5,6,7].map(i=><g key={i} className="ap-pop" style={time(310+i*110)}>
   <circle className={i%3===0?'ap-jade-fill':i%3===1?'ap-gold-fill':'ap-rose-fill'} cx={57+i*12.5} cy="69" r="4.2"/>
   {i%3===1?<path className="ap-dark-line" d={`M${55+i*12.5} 71l4-4`}/>:i%3===2?<path className="ap-dark-line" d={`M${55+i*12.5} 67l4 4m0-4-4 4`}/>:null}
  </g>)}<path className="ap-ink-line" d="M48 81h104"/></>
}
function Code(){
 return <>{['2','4','1','3'].map((c,i)=><Tile key={i} x={64+24*i} y={62} label={c} kind={i%2?'jade':'ivory'} motion="code-roll" delay={190+i*160}/>)}
  <path className="ap-draw ap-gold-line" style={time(830)} d="M59 81h82m-35 5 4 4 10-10"/><path className="ap-grid" d="M52 76h96v-28H52Z"/></>
}
function Pyramid(){
 return <><path className="ap-draw ap-ink-line" style={time(710)} d="m100 49-19 27m19-27 19 27"/>
  <Tile x={100} y={47} label="7" motion="drop" delay={460}/><Tile x={81} y={75} label="3" kind="rose"/><Tile x={119} y={75} label="2" kind="jade"/>
  <text x="69" y="60">+</text><text x="131" y="60">+</text><Caption x={148} y={78} text="12" delay={1030}/></>
}
function Fragments(){
 return <><path className="ap-grid" d="M62 42h76v42H62Z"/>
  <path className="ap-jade-fill" d="M72 74q0-14 6-17v-5h9v5q7 3 7 17Z"/><circle className="ap-gold-fill" cx="107" cy="63" r="8"/>
  <path className="ap-rose-fill" d="m119 74 6-21 6 21Z"/>
  <path className="ap-shutter" style={time(590)} d="M62 42h76v42H62Z"/>
  <Caption y={65} text="?" delay={1050}/></>
}
function Spot(){
 return <>{[70,129].map((x,i)=><g key={x} transform={`translate(${x} 65)`}><rect className="ap-grid" x="-24" y="-19" width="48" height="38" rx="2"/><path className="ap-jade-fill" d="m-17 8 8-22 8 22Z"/><path className="ap-gold-fill" d="m0 4 7-7 8 8-8 7Z"/>{i?<path className="ap-rose-fill" d="m7-13 11 0-5 9Z"/>:<circle cx="13" cy="-10" r="5" className="ap-rose-fill"/>}</g>)}
  <g className="ap-scan" style={time(340)}><circle cx="142" cy="55" r="12" className="ap-gold-line"/><path className="ap-gold-line" d="m150 64 10 11"/></g></>
}
function Scale(){
 return <><path className="ap-ink-line" d="M100 50v37m-12 0h24l3 5H85Z"/>
  <g className="ap-scale-tilt" style={time(370)}><path className="ap-ink-line" d="M64 56h72m-72 1-9 20h18Zm72 0-9 20h18Zm-84 20q12 9 24 0m48 0q12 9 24 0"/>
   <path className="ap-jade-fill" d="m58 75 4-7 7 7Z"/><path className="ap-gold-fill" d="M130 70h12v6h-12Z"/>
  </g><circle className="ap-gold-fill" cx="100" cy="56" r="4"/></>
}
function Fence(){
 return <><Grid x={67} y={42} cols={5} rows={4} cell={13}/>
  {[[86,62,2],[99,75,1],[112,62,3],[112,48,2]].map(([x,y,n])=><text key={x+':'+y} x={x} y={y}>{n}</text>)}
  <path className="ap-gold-line ap-draw" style={time(175)} d="M80 55h26V42h13v26h-13v13H80Z"/></>
}
function Tower(){
 return <><path className="ap-ink-line" d="M78 90h44m-38-4h32V43H84Z"/>
  <Tile x={100} y={77} label="H"/><Tile x={100} y={61} label="S" kind="jade" motion="drop" delay={420}/><Tile x={100} y={45} label="A" kind="ivory" motion="drop" delay={680}/>
  <Caption x={144} y={70} text="ASH" delay={1050}/></>
}
function PieceFit(){
 return <><path className="ap-grid" d="M60 77 82 49h42l17 28-25 10H79Z"/>
  <path className="ap-jade-fill" d="m60 77 22-28v28l-3 10Z"/>
  <g transform="translate(103 64)"><path className="ap-fit-side ap-gold-fill" style={time(270)} d="m-21-15 42 0-13 28h-29Z"/></g>
  <g transform="translate(125 73)"><path className="ap-fit-other ap-rose-fill" style={time(585)} d="m-1-24 17 28-25 10h-37l3-10h29Z"/></g>
  <path className="ap-draw ap-gold-line" style={time(1120)} d="M60 77 82 49h42l17 28-25 10H79Z"/></>
}
function Poker(){
 return <>{['A','K','Q','J','10'].map((c,i)=><Card key={c} x={52+24*i} y={61} label={c} kind={i%2?'rose':'ivory'} motion="card-flip ap-hide-card" delay={310+i*118}/>)}
  <path className="ap-ink-line ap-draw" d="M43 85h114" style={time(950)}/></>
}
function WallGo(){
 return <><Grid x={64} y={42} cols={6} rows={4} cell={12}/>
  <g transform="translate(82 72)"><g className="ap-wg-move" style={time(270)}><Piece x={0} y={0} kind="jade"/></g></g>
  <Piece x={118} y={60} kind="rose"/><path className="ap-gold-line ap-draw" style={time(850)} d="M100 66v24"/><path className="ap-ink-line ap-draw" style={time(300)} d="M79 72h14m-5-4 5 4-5 4"/></>
}
function Montage(){
 return <><path className="ap-ink-line" d="M58 39h84v49H58Z M63 44h34v39H63Z M103 44h34v39h-34Z"/>
  <image href={base+'art/montage/p00.svg'} x="64" y="44" width="32" height="39"/>
  <image href={base+'art/montage/p05.svg'} x="104" y="44" width="32" height="39" className="ap-portrait-leave" style={time(460)}/>
  <image href={base+'art/montage/p00.svg'} x="104" y="44" width="32" height="39" className="ap-portrait-enter" style={time(520)}/>
  <path className="ap-gold-line ap-draw" style={time(1010)} d="M102 43h36v41h-36Z M66 92h68"/></>
}
function Heavy(){
 return <>{[66,100,134].map(x=><path className="ap-ink-line" key={x} d={`M${x-13} 78h26l-4 4h-18Zm13 4v7m-10 0h20`}/>)}
  <Cube x={65} y={68} kind="rose" label="4"/><Cube x={134} y={68} kind="gold" label="6"/>
  <g className="ap-stack-pickup" style={time(1120)}><Cube x={100} y={68} kind="jade" label="3"/><Cube x={100} y={56} kind="jade" label="5"/></g>
  <Cube x={100} y={44} kind="jade" label="5" motion="heavy-drop" delay={400}/><Caption x={145} y={48} text="13" delay={870}/></>
}

function ColorLink(){
 // Two pairs on cells of the same grid: A detours below B, leaving B an independent elbow.
 const tracks=[
  {letter:'A',d:'M77.5 41.5v18h27v-18',ends:[[77.5,41.5],[104.5,41.5]],tone:'gold',delay:290},
  {letter:'B',d:'M86.5 41.5v9h9',ends:[[86.5,41.5],[95.5,50.5]],tone:'jade',delay:785}
 ]
 return <><Grid x={73} y={37} cols={6} rows={6} cell={9}/>
  {tracks.map(({letter,d,ends,tone,delay})=><g key={letter}>
   <path d={d} className={'ap-draw '+(tone==='gold'?'ap-gold-line':'ap-secondary-line')} style={time(delay)} data-preview-link={letter}/>
   {ends.map(([x,y])=><g key={x} className="ap-pop" style={time(85)}>
    <circle className={'ap-'+tone+'-fill'} cx={x} cy={y} r="4"/>
    <text className="ap-dark-label" x={x} y={y+.5}>{letter}</text>
   </g>)}
  </g>)}</>
}

function Symmetry(){
 const half=[[0,0],[0,1],[1,1]]
 return <><Grid x={69} y={34} cols={7} rows={7} cell={9}/>
  <path d="M100.5 34v63" className="ap-gold-line" strokeDasharray="2 2"/>
  {half.map(([x,y],i)=><g key={i}>
   <rect x={78+x*9} y={53+y*9} width="8" height="8" rx="1" className="ap-jade-fill ap-pop" style={time(140+i*70)}/>
   <rect x={114-x*9} y={53+y*9} width="8" height="8" rx="1" className="ap-gold-fill ap-pop" style={time(720+i*70)}/>
  </g>)}
  <rect x="96.5" y="62" width="8" height="8" rx="1" className="ap-rose-fill ap-pop" style={time(1050)}/>
 </>
}

function ThreeRow(){
 return <><Grid x={75} y={39} cols={5} rows={5} cell={10}/>
  {[[80,84],[90,74],[100,64]].map(([x,y],i)=><g key={x} className="ap-pop" style={time(225+i*295)}><path className="ap-gold-line" d={`M${x-3} ${y+3}l6-6m-4 4v-3m2 1h3`}/></g>)}
  <path d="M107 56l6 6-6 6-6-6z" className="ap-rose-fill ap-pop" style={time(630)}/>
  <path d="M78 86l24-24" className="ap-gold-line ap-draw" style={time(1150)}/>
  <path d="M116 77h15v10h-15zM116 77l7.5 6 7.5-6" className="ap-secondary-line ap-pop" style={time(1480)}/>
 </>
}
function RelayPreview(){
 return <><Grid x={79} y={40} cols={6} rows={6} cell={8}/>
  <path className="ap-jade-fill ap-pop" d="M79 40h24v8H87v8h-8z" style={time(210)}/>
  <path className="ap-secondary-line ap-draw" d="M103 40h16v16h-8v-8h-8z" strokeDasharray="2 2" style={time(610)}/>
  <path className="ap-gold-fill ap-pop" d="M103 40h16v16h-8v-8h-8z" style={time(1130)}/>
  <path className="ap-gold-line ap-draw" d="M66 57q-6 22 8 28m-5-1 5 1-1-6" style={time(1430)}/></>
}
function Gradation(){
 return <>{[3,6,2,7,4,1,5].map((n,i)=><g transform={`translate(${64+10*i} 48)`} key={i}><path d="M0 36V0h8v36z" className="ap-secondary-line"/><path d={`M1 35v-${4*n}h6v${4*n}z`} className="ap-gold-fill ap-pop" style={time(160+i*180)}/></g>)}</>
}
function Flags(){
 return <>{[0,1,2].map(i=><g key={i} className="ap-pop" style={time(180+i*240)} transform={`translate(${72+i*20} 51)`}><path d="M0 0h16v23H0zM3 4h10v9H3zM3 17h10" className="ap-gold-line"/><path d={i===0?'M4 8h8':i===1?'M8 5v7':'M5 11l3-5 3 5'} className="ap-rose-fill"/></g>)}<path d="M88 84l7 7 13-13" className="ap-gold-line ap-draw" style={time(1000)}/></>
}
function BigSmall(){
 return <>
  <g transform="translate(60 37)"><g className="ap-pop" style={time(220)}><rect className="ap-gold-line" width="29" height="45" rx="3"/><path className="ap-gold-line" d="M17 32V14L8 27h13"/></g></g>
  <path className="ap-gold-line ap-draw" style={time(890)} d="M98 58h12m-12 5h12"/>
  <g transform="translate(120 37)"><g className="ap-pop" style={time(630)}><rect className="ap-rose-fill" width="29" height="45" rx="3"/><path className="ap-gold-line" d="M7 14h15L13 33"/></g></g>
  <path className="ap-gold-line ap-draw" style={time(1400)} d="M125 94c0-5 24-5 24 0s-24 5-24 0Zm0 0v5c0 5 24 5 24 0v-5"/>
 </>
}
function TripleDicePreview(){
 return <>
  <path d="m66 47 67 1 0 42-69-2Z" className="ap-secondary-line"/>
  {[4,4,4].map((_,i)=><g key={i} transform={'translate('+(70+i*19)+' 55)'}><g className="ap-pop" style={time(180+i*280)}>
   <path d="M2 0h12l2 2v13l-2 2H2l-2-2V2Z" className="ap-gold-line"/>
   <path d="M4 4h.1m7.9 0h.1m-8.1 9h.1m7.9 0h.1" className="ap-gold-line" strokeWidth="2.5" strokeLinecap="round"/>
  </g></g>)}
  <path d="M73 79h50m-29-1 5 6 9-9" className="ap-rose-fill ap-draw" style={time(1170)}/>
 </>
}
function WallGo2Preview(){
 return <><Grid x={69} y={33} cols={7} rows={7} cell={9}/>
  <path d="M82.5 73.5h18" className="ap-gold-line ap-draw" style={time(420)}/>
  <path d="M118.5 46.5v9h-9" className="ap-secondary-line ap-draw" style={time(680)}/>
  <rect x="97.5" y="70.5" width="6" height="6" rx="1" className="ap-gold-fill ap-pop" style={time(890)}/>
  <circle cx="109.5" cy="55.5" r="3.5" className="ap-jade-fill ap-pop" style={time(1140)}/>
  <path d="M105 51v9m0 9v9" className="ap-rose-fill ap-draw" strokeWidth="2" style={time(1320)}/>
 </>
}
function AuctionBingoPreview(){
 return <g>
  <path d="M78 42h48v48H78zM78 58h48M78 74h48M94 42v48m16-48v48" className="ap-secondary-line"/>
  <path d="m86 46 4 7h-8z" className="ap-rose-fill ap-pop" style={time(250)}/>
  <circle cx="102" cy="50" r="4" className="ap-gold-line ap-pop" style={time(530)}/>
  <path d="m118 45 1 3 4 1-3 2 1 4-3-2-3 2 1-4-3-2 4-1z" className="ap-gold-line ap-pop" style={time(810)}/>
  <path d="M81 55h43" className="ap-gold-line ap-draw" style={time(1200)}/>
  <path d="M132 66h19v12h-19z m0 0 9.5 7 9.5-7" className="ap-rose-fill ap-pop" style={time(400)}/>
 </g>
}
function EquationHighLowPreview(){
 return <>
  <circle cx="73" cy="62" r="15" className="ap-gold-line ap-pop" style={time(190)}/>
  <circle cx="131" cy="62" r="15" className="ap-gold-line ap-pop" style={time(430)}/>
  <path className="ap-gold-line ap-draw" style={time(650)} d="M70 59l3-3v12m-4 0h8m46-11h6v5h-6v5h6m4-10h6v10h-6z"/>
  <path className="ap-rose-fill ap-pop" style={time(950)} d="M94 50h16v24H94z"/>
  <path className="ap-gold-line ap-draw" style={time(1230)} d="M97 62h10m-5-5v10m-17 16h34m-18 0v8"/>
 </>
}
function HiddenWordPreview(){
 return <>
  <path d="M50 55h52v27H50zm0 1 26 16 26-16M51 81l16-13m35 13-17-12" className="ap-secondary-line"/>
  <path d="m76 67 6 5-6 5-6-5Z" className="ap-rose-fill ap-pop" style={time(290)}/>
  <path d="M119 48h17v40h-17m0-33h12m-12 9h12m-12 9h12" className="ap-gold-line ap-draw" style={time(500)}/>
  <path d="M98 61a13 13 0 1 1 26 0 13 13 0 0 1-26 0Zm3 12-8 12m18-32v16m-7-8h14" className="ap-gold-line ap-pop" style={time(925)}/>
 </>
}
function DoubtBetPreview(){return <g>
 <path className="ap-rose-fill ap-pop" d="m64 43 28 4-4 46-28-4z" style={time(250)}/>
 <path className="ap-gold-line ap-draw" d="m69 66 9-9 7 10-9 10zm33-17 24-5 9 41-25 5Zm6 15 15-3m-12 14 14-3" style={time(620)}/>
 <path className="ap-gold-line ap-pop" d="m142 65 8-8 8 8-8 8Zm-7 14 7-7 7 7-7 7Z" style={time(1120)}/>
 </g>}
function EquationTowerPreview(){
 return <g className="et-diagram">
  <path d="M38 80h39m3 0h39m4 0h39" stroke="#ba9260" strokeWidth="2"/>
  <g transform="translate(80 69) scale(.6)"><EquationBlockArt id={2}/></g>
  <g transform="translate(80 54)"><g className="et-diagram-lift"><g transform="scale(.6)"><EquationBlockArt id={3}/><g transform="translate(0 -24)"><EquationBlockArt id={0}/></g></g></g></g>
  <g transform="translate(123 69) scale(.6)"><EquationBlockArt id={4}/></g>
  <g transform="translate(123 54) scale(.6)"><EquationBlockArt id={1}/></g>
  <text x="100" y="94" fill="#e6c68c" textAnchor="middle" fontSize="8">7 + 2 × 2 = 11</text>
 </g>
}
function HitStayStill(){
 return <>
  <ellipse cx="100" cy="65" rx="63" ry="23" className="ap-gold-line"/>
  <g transform="translate(62 47)"><g className="ap-pop" style={time(200)}><g transform="scale(.42)"><HitCardArt card={{rank:8,suit:'heart'}}/></g></g></g>
  <g transform="translate(86 47)"><g className="ap-pop" style={time(350)}><g transform="scale(.42)"><HitCardArt card={{rank:7,suit:'spade'}}/></g></g></g>
  <g transform="translate(110 47)"><g className="ap-pop" style={time(700)}><g transform="scale(.42)"><HitCardArt card={{rank:5,suit:'diamond'}}/></g></g></g>
  <g transform="translate(133 67)"><HitChip/></g>
 </>
}
function TreasureIslandPreview(){
 return <g>
  <rect x="42" y="35" width="60" height="60" rx="1.5" fill="#dac28a" stroke="#a68658"/>
  {islandTerrain.map((tile,cell)=><rect key={cell} x={45+(cell%9)*6} y={38+Math.floor(cell/9)*6} width="6" height="6" fill={tile==='water'?'#597c6d':tile==='reef'?'#8d7556':'#d5bd86'} stroke="#9f8055" strokeWidth=".25"/>)}
  <path d="M72 65h12v-6" stroke="#783924" strokeWidth="1.2" strokeDasharray="2 1" fill="none"/>
  <circle cx="72" cy="65" r="1.8" fill="#8e482f" stroke="#f6e7be" strokeWidth=".6"/>
  <Tile x={120} y={65} label="↱"/><Tile x={146} y={65} label="↑"/>
 </g>
}
function PiggyBankPreview(){
 return <g>
  <path d="M37 83h126m-51-20h47" className="ap-secondary-line"/>
  <path d="M50 63q0-12 16-13l12 1 5-7 8 5v8l5 4h5v7h-7l-4 10h-8l-2-4H65l-3 4h-7v-6l-5-4m12-14h9m19 7h.1" className="ap-rose-fill ap-pop" style={time(180)}/>
  <path d="M108 70h36m-5-5 6 5-6 5" className="ap-gold-line ap-draw" style={time(800)}/>
  <circle cx="63" cy="43" r="3.5" className="ap-gold-line ap-pop" style={time(400)}/>
  <circle cx="75" cy="43" r="3.5" className="ap-rose-fill ap-pop" style={time(610)}/>
 </g>
}
const previewScenes={
 hitStay:{ms:1700,draw:HitStayStill},
 treasureIsland:{ms:2100,draw:TreasureIslandPreview},
 piggyBank:{ms:1800,draw:PiggyBankPreview},
 equationTower:{ms:1900,draw:EquationTowerPreview},
 doubtBet:{ms:2070,draw:DoubtBetPreview},
 equationHighLow:{ms:2110,draw:EquationHighLowPreview},
 bigSmall:{ms:2150,draw:BigSmall},wallGo2:{ms:2100,draw:WallGo2Preview},
 blind:{ms:2240,draw:()=> <Gomoku/>},morris:{ms:1920,draw:Morris},
 auction:{ms:2100,draw:Auction},point:{ms:2060,draw:()=> <Gomoku point/>},
 remove:{ms:1900,draw:Remove},knight:{ms:1920,draw:Knight},
 hex:{ms:1900,draw:Hexagon},rectangles:{ms:1940,draw:()=> <RectangleScene/>},
 cubes:{ms:2100,draw:Cubes},exile:{ms:2050,draw:()=> <RectangleScene zero/>},
 mancala:{ms:2280,draw:Mancala},bagh:{ms:2050,draw:Bagh},
 secret:{ms:1920,draw:Secret},grass1:{ms:2030,draw:()=> <Grass/>},grass3:{ms:2070,draw:()=> <Grass bonus/>},
 divine:{ms:2200,draw:Divine},equations:{ms:2200,draw:Equation},
 codeLock:{ms:1960,draw:Code},pyramid:{ms:1980,draw:Pyramid},
 fragments:{ms:2280,draw:Fragments},spot:{ms:1930,draw:Spot},scale:{ms:2190,draw:Scale},
 fence:{ms:1850,draw:Fence},tower:{ms:1990,draw:Tower},piece:{ms:2030,draw:PieceFit},
 memoryPoker:{ms:2050,draw:Poker},wallGo:{ms:2130,draw:WallGo},
 montage:{ms:2350,draw:Montage},heavy13:{ms:2360,draw:Heavy},colorLink:{ms:2040,draw:ColorLink},symmetry:{ms:2170,draw:Symmetry},gradation:{ms:2200,draw:Gradation},threeRow:{ms:2230,draw:ThreeRow},flags:{ms:2200,draw:Flags},coopPuzzle:{ms:2040,draw:RelayPreview},tripleDice:{ms:2080,draw:TripleDicePreview},auctionBingo:{ms:2100,draw:AuctionBingoPreview},unknown:{ms:1800,draw:UnknownWorkedScene},hiddenWord:{ms:1980,draw:HiddenWordPreview},
} satisfies Record<Game,{ms:number;draw:()=>ReactNode}>
