import {existsSync} from 'node:fs'
import {renderToStaticMarkup} from 'react-dom/server'
import {describe,expect,it} from 'vitest'
import {titles,type Game} from '../src/engine'
import {FolioTransition,folioArtwork,folioDuration,stageFolio} from '../src/stage-folio'
import {base} from '../src/brand'

describe('the stage-turn artwork contract',()=>{
 it('uses a distinct local painted cover and catalog venue for every playable game',()=>{
  const sources=new Set<string>()
  for(const game of Object.keys(titles) as Game[]){
   const art=folioArtwork({phase:'brief',game})
   if(!art.src)throw new Error('No authored cover for '+game)
   expect(art.src).toMatch(/\/art\/[^/]+\.svg$/)
   expect(existsSync('public/'+art.src.slice(base.length))).toBe(true)
   if(art.mobile)expect(existsSync('public/'+art.mobile.slice(base.length))).toBe(true)
   expect(['main','mini','prize','prison','secret','final','exile']).toContain(art.venue)
   sources.add(art.src)
  }
  expect(sources.size).toBe(Object.keys(titles).length)
  expect(folioArtwork({phase:'brief',game:'auction',hold:true}).src).toMatch(/\/time-auction-chamber\.svg$/)
  expect(folioArtwork({phase:'brief',game:'blind'}).venue).toBe('secret')
 })
 it('uses the chapter-specific painterly asset and not a room code or nickname in an invite',()=>{
  expect(new Set([1,2,3].map(season=>folioArtwork({phase:'season',season}).src)).size).toBe(3)
  expect(folioArtwork({phase:'home'}).src).toMatch(/landing-hero\.svg$/)
  expect(folioArtwork({phase:'invite'})).not.toHaveProperty('src')
  expect(folioArtwork({phase:'connecting'})).not.toHaveProperty('src')
 })
 it('keys only actual screen/game boundaries, not a snapshot update or invite data',()=>{
  expect(stageFolio({invite:false}).phase).toBe('home')
  expect(stageFolio({invite:false,season:2}).phase).toBe('season')
  expect(stageFolio({invite:true,season:2}).phase).toBe('invite')
  expect(stageFolio({invite:true,seat:'join'}).phase).toBe('connecting')
  expect(stageFolio({invite:false,seat:'solo',game:'hex'})).toMatchObject({phase:'practice',game:'hex'})
  expect(stageFolio({invite:false,seat:'host',game:'scale'})).toMatchObject({phase:'party',game:'scale'})
  const match={invite:true,seat:'join',game:'morris',match:'host-match'} as const
  expect(stageFolio(match)).toMatchObject({phase:'match',game:'morris'})
  expect(stageFolio({...match,finished:true}).phase).toBe('result')
  expect(stageFolio({...match,match:'next-match'}).key).not.toBe(stageFolio(match).key)
  expect(stageFolio({invite:true,seat:'join',game:'hex'}).key).toBe(stageFolio({invite:false,seat:'host',game:'hex'}).key)
 })
 it('renders only a short-lived, inert decoration and no media at all when off',()=>{
  const motion=renderToStaticMarkup(<FolioTransition scene={{phase:'brief',game:'cubes'}}/>)
  expect(motion).toContain('data-folio-stage="brief"')
  expect(motion).toContain('seasonal-cubes.svg')
  expect(motion).toContain('data-token-engraving')
  expect(motion).toContain('aria-hidden="true"')
  expect(motion).not.toMatch(/<button|tabindex|role="dialog"/i)
  expect(renderToStaticMarkup(<FolioTransition scene={{phase:'brief',game:'cubes'}} motionOff/>)).toBe('')
  expect(folioDuration).toBeLessThan(500)
 })
})
