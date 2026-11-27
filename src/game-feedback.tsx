import {useCallback,useEffect,useRef,useState} from 'react'
import type {GameView} from './engine'
import type {SessionState} from './session'
import './game-feedback.css'

export type GameCue='piece'|'flip'|'score'
export type GameFeedbackState=Pick<SessionState,'phase'|'snapshot'|'error'>
export type FeedbackPreferences={sound:boolean;motion:'system'|'off'}
const storageKey='imp-plan-feedback-v1'
const initialPrefs:FeedbackPreferences={sound:false,motion:'system'}

export function parseFeedbackPreferences(raw:string|null):FeedbackPreferences{
 try{
  const p=JSON.parse(raw??'null') as Partial<FeedbackPreferences>|null
  return {sound:p?.sound===true,motion:p?.motion==='off'?'off':'system'}
 }catch{return {...initialPrefs}}
}
function loadPreferences():FeedbackPreferences{
 try{return parseFeedbackPreferences(window.localStorage.getItem(storageKey))}
 catch{return {...initialPrefs}}
}
function savePreferences(p:FeedbackPreferences){
 try{window.localStorage.setItem(storageKey,JSON.stringify(p))}catch{/* private or unavailable storage */}
}

function different<T>(a:readonly T[]|undefined,b:readonly T[]|undefined){
 return !!a&&!!b&&(a.length!==b.length||a.some((v,i)=>v!==b[i]))
}
type Fits=Pick<NonNullable<GameView['piece']>,'placements'>
function fitsChanged(a:Fits|null|undefined,b:Fits|null|undefined){
 return !!a&&!!b&&b.placements.some((p,i)=>a.placements[i]?.anchor!==p?.anchor||a.placements[i]?.rotation!==p?.rotation)
}
function towerChanged(a:GameView['tower'],b:GameView['tower']){
 return !!a&&!!b&&a.columns.some((column,i)=>different(column,b.columns[i]))
}

/** Compare accepted, viewer-authorized snapshots; never play on button press, chat, stale state or reconnect. */
export function feedbackCue(previous:GameFeedbackState|null,current:GameFeedbackState):GameCue|null{
 if(previous?.phase!=='online'||current.phase!=='online'||current.error)return null
 const a=previous.snapshot,b=current.snapshot
 if(!a?.game||!b?.game||a.epoch!==b.epoch||!b.match||a.match!==b.match||a.you!==b.you||b.rev<=a.rev)return null
 const x=a.game,y=b.game
 if(x.game!==y.game||x.done)return null
 if(y.done)return 'score'
 if(y.reveal&&x.reveal?.round!==y.reveal.round)return 'flip'
 if(different(x.scores,y.scores))return 'score'
 if(different(x.board,y.board)||different(x.bagh?.board,y.bagh?.board)||
  different(x.grass?.board,y.grass?.board)||different(x.path,y.path)||
  different(x.fence?.marks,y.fence?.marks)||fitsChanged(x.piece,y.piece)||fitsChanged(x.symmetry?.board,y.symmetry?.board)||towerChanged(x.tower,y.tower)||
  x.mancala?.placements!==y.mancala?.placements||x.mancala?.sows!==y.mancala?.sows||
  x.scale?.log.length!==y.scale?.log.length)return 'piece'
 return null
}

type Tone=[hz:number,offset:number,length:number,peak:number,wave:OscillatorType]
// Short, original cues. Quiet peaks and a decay envelope avoid hard clicks and looping audio.
const tones:Record<GameCue,Tone[]>={
 piece:[[185,0,.052,.035,'triangle'],[465,.004,.039,.009,'sine']],
 flip:[[720,0,.048,.022,'triangle'],[445,.028,.068,.028,'triangle']],
 score:[[392,0,.105,.024,'sine'],[494,.048,.125,.026,'sine'],[587,.105,.165,.024,'sine']]
}
type AudioOptions={createContext?:()=>AudioContext;isVisible?:()=>boolean}
function browserContext():AudioContext{
 const win=window as Window&{webkitAudioContext?:typeof AudioContext}
 const Audio=typeof AudioContext==='undefined'?win.webkitAudioContext:AudioContext
 if(!Audio)throw new Error('Web Audio not available')
 return new Audio()
}

export function createGameAudio({createContext=browserContext,isVisible=()=>typeof document!=='undefined'&&document.visibilityState==='visible'}:AudioOptions={}){
 let context:AudioContext|null=null
 let enabled=false,lastAt=-Infinity
 let resuming:Promise<void>|null=null
 const voices=new Set<()=>void>()
 function silence(){
  for(const stop of voices)stop()
  lastAt=-Infinity
 }
 return {
  setEnabled(next:boolean){enabled=next;if(!next)silence()},
  /** Call only in a trusted browser click or key event. */
  async unlock(){
   if(!enabled||!isVisible())return false
   try{
    const ctx=context??(context=createContext())
    if(ctx.state==='closed'){context=null;return false}
    if(ctx.state!=='running'){
     resuming??=ctx.resume().finally(()=>{resuming=null})
     await resuming
    }
    return enabled&&context===ctx&&ctx.state==='running'&&isVisible()
   }catch{return false}
  },
  play(cue:GameCue){
   const ctx=context
   if(!enabled||!isVisible()||ctx?.state!=='running')return false
   const now=ctx.currentTime
   if(cue==='piece'&&now-lastAt<.085)return false
   // Prefer intelligibility to blending a rush of opponent actions into noise.
   silence()
   lastAt=now
   try{
    for(const [hz,offset,duration,peak,wave] of tones[cue]){
     const gain=ctx.createGain(), osc=ctx.createOscillator()
     const t=now+offset
     function remove(stop=false){
      if(!voices.delete(cancel))return
      if(stop)try{osc.stop()}catch{/* already ended */}
      osc.disconnect()
      gain.disconnect()
     }
     const cancel=()=>remove(true)
     voices.add(cancel)
     osc.addEventListener('ended',()=>remove(),{once:true})
     osc.type=wave
     osc.frequency.setValueAtTime(hz,t)
     gain.gain.setValueAtTime(.0001,t)
     gain.gain.exponentialRampToValueAtTime(peak,t+.004)
     gain.gain.exponentialRampToValueAtTime(.0001,t+duration)
     osc.connect(gain);gain.connect(ctx.destination)
     osc.start(t);osc.stop(t+duration+.01)
    }
    return true
   }catch{silence();return false}
  },
  silence,
  dispose(){
   silence()
   const ctx=context
   context=null;resuming=null
   if(ctx&&ctx.state!=='closed')void ctx.close().catch(()=>{})
  }
 }
}

/**
 * Add once at the app root: const feedback = useGameFeedback(state).
 * Basic cues follow the authoritative session; playConfirmed is for an additional confirmed event
 * the observer cannot distinguish yet. It cannot unlock audio or override mute/background.
 */
export function useGameFeedback(state:GameFeedbackState){
 const [prefs,setPrefs]=useState(loadPreferences)
 const latest=useRef(prefs)
 const audio=useRef<ReturnType<typeof createGameAudio>|null>(null)
 const previous=useRef<GameFeedbackState|null>(null)
 const getAudio=useCallback(()=>{
  if(!audio.current){audio.current=createGameAudio();audio.current.setEnabled(latest.current.sound)}
  return audio.current
 },[])
 const update=useCallback((next:FeedbackPreferences)=>{
  latest.current=next
  setPrefs(next)
  savePreferences(next)
 },[])
 const toggleSound=useCallback(()=>{
  const sound=!latest.current.sound
  update({...latest.current,sound})
  const device=getAudio()
  device.setEnabled(sound)
  if(sound)void device.unlock()
 },[getAudio,update])
 const toggleMotion=useCallback(()=>update({...latest.current,motion:latest.current.motion==='off'?'system':'off'}),[update])
 const playConfirmed=useCallback((cue:GameCue)=>getAudio().play(cue),[getAudio])
 useEffect(()=>{
  const activate=(event:Event)=>{
   if(!latest.current.sound||!event.isTrusted||event instanceof KeyboardEvent&&(event.repeat||event.key==='Escape'||event.key==='Tab'))return
   void getAudio().unlock()
  }
  const stop=()=>{if(document.visibilityState!=='visible')audio.current?.silence()}
  const pageHide=()=>audio.current?.silence()
  document.addEventListener('click',activate,true)
  document.addEventListener('keydown',activate,true)
  document.addEventListener('visibilitychange',stop)
  window.addEventListener('pagehide',pageHide)
  return ()=>{
   document.removeEventListener('click',activate,true)
   document.removeEventListener('keydown',activate,true)
   document.removeEventListener('visibilitychange',stop)
   window.removeEventListener('pagehide',pageHide)
   audio.current?.dispose()
   audio.current=null
  }
 },[getAudio])
 useEffect(()=>{
  if(prefs.motion==='off')document.documentElement.dataset.gameMotion='off'
  else delete document.documentElement.dataset.gameMotion
  return ()=>{delete document.documentElement.dataset.gameMotion}
 },[prefs.motion])
 useEffect(()=>{
  const prior=previous.current
  previous.current=state
  const cue=feedbackCue(prior,state)
  if(cue)playConfirmed(cue)
  else if(state.phase!=='online'||prior?.snapshot?.match!==state.snapshot?.match)audio.current?.silence()
 },[state,playConfirmed])
 return {prefs,toggleSound,toggleMotion,playConfirmed}
}

export function GameFeedbackControls({feedback}:{feedback:ReturnType<typeof useGameFeedback>}){
 const {prefs,toggleSound,toggleMotion}=feedback
 const menu=useRef<HTMLDetailsElement>(null)
 const toggle=useRef<HTMLElement>(null)
 const [full,setFull]=useState(false)
 const [expanded,setExpanded]=useState(false)
 const [fullscreenError,setFullscreenError]=useState(false)
 useEffect(()=>{
  const update=()=>setFull(!!document.fullscreenElement)
  const outside=(e:PointerEvent)=>{if(menu.current?.open&&e.target instanceof Node&&!menu.current.contains(e.target))menu.current.open=false}
  document.addEventListener('fullscreenchange',update)
  document.addEventListener('pointerdown',outside)
  update()
  return ()=>{document.removeEventListener('fullscreenchange',update);document.removeEventListener('pointerdown',outside)}
 },[])
 const changeFullscreen=async()=>{
  setFullscreenError(false)
  try{
   if(document.fullscreenElement)await document.exitFullscreen()
   else await document.documentElement.requestFullscreen()
   if(menu.current)menu.current.open=false
   toggle.current?.focus()
  }catch{setFullscreenError(true)}
 }
 return <details className="game-settings" ref={menu} onToggle={e=>setExpanded(e.currentTarget.open)} onKeyDown={e=>{
  if(e.key==='Escape'&&menu.current?.open){e.preventDefault();menu.current.open=false;toggle.current?.focus()}
 }}>
  <summary className="settings-gear" role="button" aria-label="Audio and display settings" aria-expanded={expanded} aria-controls="game-settings-panel" title="Audio and display settings" ref={e=>{toggle.current=e}}>
   <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m10 3-.4 2.3-1.8.9-2-.9-1.4 1.7 1.1 2-.5 2-2.2 1v2.1l2.2.8.6 1.9-1.2 2 1.5 1.6 2.1-.9 1.7.8.5 2h2.1l.6-2 1.9-.8 2 .9 1.4-1.6-1.1-2 .6-1.9 2.1-.8V12l-2.1-1-.6-2 1.1-2-1.4-1.7-2.1.9-1.7-.9-.5-2.3z"/><circle cx="11.25" cy="12.6" r="3.3"/></svg>
  </summary>
  <div id="game-settings-panel" className="settings-popover" role="group" aria-label="Sound, motion and display">
   <button type="button" className="feedback-control" aria-label="Sound" aria-pressed={prefs.sound} onClick={toggleSound}>
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z"/>{prefs.sound?<path d="M16 8a6 6 0 0 1 0 8m2-10a9 9 0 0 1 0 12"/>:<path d="M16 10l5 5m0-5-5 5"/>}</svg>
    <span>Sound</span><b aria-hidden="true">{prefs.sound?'On':'Off'}</b>
   </button>
   <button type="button" className="feedback-control" aria-label="Reduce motion (follows system when off)" aria-pressed={prefs.motion==='off'} onClick={toggleMotion}>
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 7h9m-6 5h10m-4-7 4 2-4 2m-9 9h9m-2-8 4 2-4 2"/></svg>
    <span>Motion</span><b aria-hidden="true">{prefs.motion==='off'?'Reduced':'System'}</b>
   </button>
   {document.fullscreenEnabled&&<button type="button" className="feedback-control" onClick={()=>void changeFullscreen()}>
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9V4h5m6 0h5v5m0 6v5h-5m-6 0H4v-5"/></svg>
    <span>{full?'Exit full screen':'Full screen'}</span>
   </button>}
   {fullscreenError&&<p className="error" role="status">Full screen isn’t available in this browser.</p>}
  </div>
 </details>
}
