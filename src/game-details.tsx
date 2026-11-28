import {Fragment,lazy,Suspense,useEffect,useId,useLayoutEffect,useRef,useState,type ReactNode} from 'react'
import {createPortal} from 'react-dom'
import {ArenaGamePreview,gamePreviewPlaybackTime,previewDialogIsActive,watchPreview,watchPreviewDialogs} from './arena-preview'
import {titles,tutorials,type Game} from './engine'
import {GameToken} from './game-identity'
import {loadTable,TableLoadBoundary} from './lazy-table'
import {episodePokerRules,holdAuctionRules,isHoldAuction,type Settings} from './room'
import './game-details.css'

const RealTablePreview=lazy(()=>loadTable(()=>import('./real-table-preview')).then(m=>({default:m.RealTablePreview})))

export function GameRulePreview({game,motionOff,illustration}:{game:Game;motionOff?:boolean;illustration?:ReactNode}){
 const art=useRef<HTMLDivElement>(null)
 const [cycle,setCycle]=useState(0)
 const [playing,setPlaying]=useState(false)
 // Built-in diagrams get their full authored sequence, then a short hold
 // before resetting. Custom lobby diagrams have at most 1.5 s of motion.
 const period=(illustration?1500:gamePreviewPlaybackTime(game))+650
 useEffect(()=>{
  const target=art.current
  if(!target||motionOff||typeof IntersectionObserver!=='function'){setPlaying(false);return}
  const media=window.matchMedia?.('(prefers-reduced-motion: reduce)')
  let ratio=0,remaining=period,timer:number|undefined
  let start=0
  function replay(){
   start=performance.now()
   timer=window.setTimeout(()=>{
    setCycle(c=>c+1)
    remaining=period
    replay()
   },remaining)
  }
  function changed(){
   const active=ratio>=.25&&!document.hidden&&!media?.matches&&previewDialogIsActive(target!)&&
    document.documentElement.dataset.gameMotion!=='off'
   if(active&&timer===undefined)replay()
   else if(!active&&timer!==undefined){
    window.clearTimeout(timer)
    remaining=Math.max(1,remaining-(performance.now()-start))
    timer=undefined
   }
   setPlaying(active)
  }
  const release=watchPreview(target,entry=>{ratio=entry.isIntersecting?entry.intersectionRatio:0;changed()})
  const releaseDialogs=watchPreviewDialogs(changed)
  document.addEventListener('visibilitychange',changed)
  media?.addEventListener?.('change',changed)
  return ()=>{
   release()
   releaseDialogs()
   window.clearTimeout(timer)
   document.removeEventListener('visibilitychange',changed)
   media?.removeEventListener?.('change',changed)
  }
 },[period,game,motionOff])
 return <figure className="game-rule-preview" data-preview-motion={motionOff?'off':undefined} data-preview-loop={playing?'playing':'paused'} data-preview-cycle={cycle}>
  <figcaption>Worked rules example</figcaption>
  <div ref={art} className="game-rule-illustration"><Fragment key={cycle}>{illustration??<ArenaGamePreview game={game} motionOff={motionOff}/>}</Fragment></div>
 </figure>
}

export function GameDetailsDialog({game,motionOff,source,context,close,restore,compact,action,settings,illustration}:{game:Game;settings?:Settings;illustration?:ReactNode;motionOff?:boolean;source?:string;context?:ReactNode;close:()=>void;restore:()=>void;compact?:boolean;action?:{verb:'Practice'|'Choose';run:()=>void}}){
 const node=useRef<HTMLDialogElement>(null)
 const closeButton=useRef<HTMLButtonElement>(null)
 const returnTo=useRef(restore)
 const title=useId()
 const [illustrated,setIllustrated]=useState(false)
 const rule=game==='auction'&&settings&&isHoldAuction(settings)?holdAuctionRules:game==='memoryPoker'&&settings?.memoryPokerMode==='episode'?episodePokerRules:tutorials[game]
 useLayoutEffect(()=>{
  const dialog=node.current
  dialog?.showModal()
  closeButton.current?.focus({preventScroll:true})
  return ()=>{dialog?.close();returnTo.current()}
 },[])
 return createPortal(<dialog className="game-details-modal" data-cover-sheet={compact||undefined} ref={node} aria-labelledby={title} onCancel={e=>{e.stopPropagation();e.preventDefault();close()}}>
  <header className="game-details-head">
   <GameToken game={game}/>
   <div>{!compact&&<p className="eyebrow">Game details</p>}<h2 id={title}>{titles[game]}</h2></div>
   <button type="button" ref={closeButton} onClick={close} aria-label="Close details">{compact?<CardMark kind="close"/>:"Close"}</button>
  </header>
  <TableLoadBoundary key={game} title={titles[game]}>
   <Suspense fallback={<p className="game-details-pending" role="status">Opening the table preview…</p>}>
    <RealTablePreview game={game} motionOff={motionOff} settings={settings}/>
   </Suspense>
  </TableLoadBoundary>
  {action&&<footer className="game-details-action"><button type="button" className="primary" aria-label={action.verb+' '+titles[game]} onClick={action.run}><CardMark kind={action.verb==='Practice'?'play':'choose'}/>{action.verb}</button></footer>}
  {compact?<details className="game-details-rules"><summary aria-label="Rules"><CardMark kind="rules"/> How to play</summary><RuleCopy rule={rule} context={context} source={source}/></details>:
   <section className="game-details-rules"><RuleCopy rule={rule} context={context} source={source}/></section>}
  <details className="example-rules" onToggle={event=>setIllustrated(event.currentTarget.open)}>
   <summary><CardMark kind="rules"/> Illustrated rules</summary>
   {illustrated&&<GameRulePreview game={game} motionOff={motionOff} illustration={illustration}/>}
  </details>
 </dialog>,document.body)
}

function RuleCopy({rule,context,source}:{rule:string;context?:ReactNode;source?:string}){
 return <>{context&&<div className="game-details-context">{context}</div>}
  <h3>Rules</h3><p>{rule}</p>
  {source&&<a className="game-context-source" href={source} target="_blank" rel="noreferrer">Show context reference</a>}</>
}

export function CardMark({kind}:{kind:'play'|'inspect'|'close'|'choose'|'rules'}){
 const paths={play:'M8 5 19 12 8 19Z M4 4v16',inspect:'M3 12s4-6 9-6 9 6 9 6-4 6-9 6-9-6-9-6Z M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z',
  close:'m6 6 12 12M18 6 6 18',choose:'m5 12 4.5 4.5L19 7',rules:'M12 6v14m0-14C9 3 5 4 3 5v13c3-1 6-1 9 2 3-3 6-3 9-2V5c-2-1-6-2-9 1Z'}
 return <svg className="card-mark" viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d={paths[kind]}/></svg>
}
