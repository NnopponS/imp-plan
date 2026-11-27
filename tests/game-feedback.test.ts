import {describe,expect,it,vi} from 'vitest'
import {createGameAudio,feedbackCue,parseFeedbackPreferences,type GameFeedbackState} from '../src/game-feedback'
import {Host} from '../src/room'
import type {Command} from '../src/room'

describe('preferences',()=>{
 it('does not opt in unless a stored boolean says so, and defaults to OS motion choice',()=>{
  expect(parseFeedbackPreferences(null)).toEqual({sound:false,motion:'system'})
  expect(parseFeedbackPreferences('bogus')).toEqual({sound:false,motion:'system'})
  expect(parseFeedbackPreferences('{"sound":"1","motion":"on"}')).toEqual({sound:false,motion:'system'})
  expect(parseFeedbackPreferences('{"sound":true,"motion":"off"}')).toEqual({sound:true,motion:'off'})
 })
})
describe('confirmed game feedback',()=>{
 const fixture=()=>{
  const host=new Host('Auditor',()=>1)
  let req=0
  function command(c:Command,connection='host'){return host.command(connection,String(++req),host.rev,c)}
  function state(phase:GameFeedbackState['phase']='online',error=''):GameFeedbackState{
   return {phase,snapshot:host.snapshot('host'),error}
  }
  return {host,command,state}
 }
 it('sounds on a confirmed placement, never on a rejected action, chat, replay, or reconnect',()=>{
  const {command,state}=fixture()
  expect(command({kind:'bot'})).toBeNull()
  expect(command({kind:'start'})).toBeNull()
  const before=state()
  expect(feedbackCue(null,before)).toBeNull()
  expect(command({kind:'move',action:112})).toBeNull()
  const after=state()
  expect(feedbackCue(before,after)).toBe('piece')
  expect(feedbackCue(after,after)).toBeNull()
  expect(feedbackCue(after,before)).toBeNull()
  expect(feedbackCue({...before,phase:'offline'},after)).toBeNull()
  expect(feedbackCue(before,{...after,error:'Connection lost'})).toBeNull()
  expect(command({kind:'move',action:112})).not.toBeNull()
  expect(feedbackCue(after,state())).toBeNull()
  expect(command({kind:'chat',text:'Nice move'})).toBeNull()
  expect(feedbackCue(after,state())).toBeNull()
 })
 it('detects a real hidden card reveal and chooses score feedback on final completion',()=>{
  const {host,command,state}=fixture()
  expect(command({kind:'config',settings:{...host.settings,game:'remove'}})).toBeNull()
  expect(host.join('first','First guest')).not.toBeNull()
  expect(host.join('second','Second guest')).not.toBeNull()
  expect(command({kind:'ready'},'first')).toBeNull()
  expect(command({kind:'ready'},'second')).toBeNull()
  expect(command({kind:'start'})).toBeNull()
  let before=state()
  expect(command({kind:'move',action:0,round:1})).toBeNull()
  expect(feedbackCue(before,state())).toBeNull()
  expect(command({kind:'move',action:0,round:1},'first')).toBeNull()
  expect(feedbackCue(before,state())).toBeNull()
  before=state()
  expect(command({kind:'move',action:0,round:1},'second')).toBeNull()
  expect(state().snapshot!.game!.reveal?.round).toBe(1)
  expect(feedbackCue(before,state())).toBe('flip')
  for(let round=2;round<=11;round++){
   expect(command({kind:'move',action:0,round})).toBeNull()
   expect(command({kind:'move',action:0,round},'first')).toBeNull()
   before=state()
   expect(command({kind:'move',action:0,round},'second')).toBeNull()
   const result=state()
   expect(feedbackCue(before,result)).toBe(result.snapshot?.game?.done?'score':'flip')
   if(result.snapshot?.game?.done)break
  }
  expect(state().snapshot?.game?.done).toBe(true)
 })
})
describe('audio gesture and quietness gates',()=>{
 function device(status=()=>'running'){
  const nodes=Array.from({length:5},()=>({
   stop:vi.fn(),start:vi.fn(),connect:vi.fn(),disconnect:vi.fn(),addEventListener:vi.fn(),
   type:'sine',frequency:{setValueAtTime:vi.fn()}
  }))
  const gain={connect:vi.fn(),disconnect:vi.fn(),gain:{setValueAtTime:vi.fn(),exponentialRampToValueAtTime:vi.fn()}}
  const context={
   get state(){return status()},currentTime:1,destination:{},createGain:vi.fn(()=>gain),
   resume:vi.fn(async()=>{}),close:vi.fn(async()=>{}),createOscillator:vi.fn(()=>nodes.shift())
  }
  const playing=nodes.slice()
  const create=vi.fn(()=>context as unknown as AudioContext)
  return {context,create,playing}
 }
 it('creates no device at mount or on a background or muted cue; unlock must be explicit',async()=>{
  const {create,context}=device()
  let visible=true
  const audio=createGameAudio({createContext:create,isVisible:()=>visible})
  audio.setEnabled(true)
  expect(audio.play('piece')).toBe(false)
  expect(create).not.toHaveBeenCalled()
  visible=false
  await audio.unlock()
  expect(create).not.toHaveBeenCalled()
  visible=true
  await audio.unlock()
  expect(create).toHaveBeenCalledTimes(1)
  expect(audio.play('piece')).toBe(true)
  expect(context.createOscillator).toHaveBeenCalledTimes(2)
  visible=false
  expect(audio.play('score')).toBe(false)
  audio.setEnabled(false)
  visible=true
  expect(audio.play('score')).toBe(false)
 })
 it('uses a bounded envelope and cuts scheduled audio on mute',async()=>{
  const {create,playing}=device()
  const audio=createGameAudio({createContext:create,isVisible:()=>true})
  audio.setEnabled(true)
  await audio.unlock()
  expect(audio.play('score')).toBe(true)
  expect(playing[0].start).toHaveBeenCalledWith(1)
  expect(playing[0].stop).toHaveBeenCalledWith(expect.any(Number))
  expect(audio.play('piece')).toBe(false)
  audio.setEnabled(false)
  expect(playing[0].disconnect).toHaveBeenCalledTimes(1)
  audio.dispose()
 })
 it('fails safely if browser disallows creating the context',async()=>{
  const audio=createGameAudio({createContext:()=>{throw new Error('not available')},isVisible:()=>true})
  audio.setEnabled(true)
  await expect(audio.unlock()).resolves.toBe(false)
  expect(audio.play('piece')).toBe(false)
  expect(()=>audio.dispose()).not.toThrow()
 })
})
