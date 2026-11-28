import {expect,test} from 'vitest'
import {renderToPipeableStream,renderToStaticMarkup} from 'react-dom/server'
import type {ReactNode} from 'react'
import {PassThrough} from 'node:stream'
import type {Game} from '../src/engine'
import {lessonFor,type Variant} from '../src/lesson-book'
import catalog from '../src/catalog.json'
import {FlagsLesson} from '../src/flags-ui'
import {ColorLinkLesson} from '../src/color-link-ui'
import {MontageLesson} from '../src/montage-ui'
import {SymmetryPuzzleLesson} from '../src/symmetry-ui'
import {ThreeRowLesson} from '../src/three-row-ui'
import {Heavy13Lesson} from '../src/heavy-13-ui'
import {MemoryDuelLesson} from '../src/memory-duel-ui'

const variants:Partial<Record<Game,Variant>>=Object.fromEntries(Object.entries({
 flags:FlagsLesson,colorLink:ColorLinkLesson,montage:MontageLesson,symmetry:SymmetryPuzzleLesson,threeRow:ThreeRowLesson,heavy13:Heavy13Lesson,
}).map(([game,Component])=>[game,{label:'Fan table',rules:'',demo:(step:number)=><Component step={step}/>}]))
const playable=catalog.filter(g=>g.game).map(g=>g.game as Game)
function renderLesson(node:ReactNode):Promise<string>{
 return new Promise((resolve,reject)=>{
  const output=new PassThrough()
  let html=''
  output.on('data',part=>{html+=String(part)})
  output.on('end',()=>resolve(html))
  const render=renderToPipeableStream(node,{onAllReady:()=>render.pipe(output),onError:reject})
 })
}
test('every playable catalog title has a multi-step worked example, not the rules-only fallback',async()=>{
 expect(playable.length).toBeGreaterThanOrEqual(37)
 expect(new Set(playable).size).toBe(playable.length)
 for(const game of playable){
  const l=lessonFor(game,variants[game])
  expect(l,game).toBeDefined()
  expect(l!.frames.length,game).toBeGreaterThanOrEqual(2)
  const visuals=await Promise.all(l!.frames.map((_,i)=>renderLesson(l!.render(i))))
  expect(visuals.every(html=>html.length>80),game).toBe(true)
  expect(new Set(visuals).size,game).toBeGreaterThanOrEqual(2)
 }
})
test('the two optional episode-style variants render their own visual walkthroughs',()=>{
 const hold=lessonFor('auction',undefined,true)!
 const duel=lessonFor('memoryPoker',{label:'Episode duel',rules:'',demo:step=><MemoryDuelLesson step={step}/>})!
 expect(hold.frames).toHaveLength(4)
 expect(duel.frames).toHaveLength(4)
 expect(renderToStaticMarkup(hold.render(3))).toContain('+1 TOKEN')
 expect(renderToStaticMarkup(duel.render(2))).toMatch(/two|lock|pick|position/i)
})
