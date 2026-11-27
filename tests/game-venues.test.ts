import {expect,it} from 'vitest'
import catalog from '../src/catalog.json'
import {getGameVenue} from '../src/game-venues'

const byId=(id:string)=>getGameVenue(catalog.find(entry=>entry.id===id)!)

it('distinguishes where featured matches were played instead of collapsing them into a generic category',()=>{
 expect(byId('S1-10')).toMatchObject({kind:'prize',label:'Prize Match',caption:'Season 1 · Day 5'})
 expect(byId('S1-13')).toMatchObject({kind:'secret',label:'Secret Chamber',caption:'Season 1 · Hidden inside prison'})
 expect(byId('S2-04')).toMatchObject({kind:'prison',label:'Prison Match',caption:'Season 2 · Day 2'})
 expect(byId('S2-16')).toMatchObject({kind:'secret',label:'Secret Chamber',caption:'Season 2 · Living quarters'})
 expect(byId('S3-05')).toMatchObject({kind:'mini',label:'Main Match',caption:'Season 3 · Either Or mini-game 4'})
 expect(byId('S3-23')).toMatchObject({kind:'exile',label:'Exile Match',caption:'Season 3 · Exile Zone match 7'})
 expect(byId('S3-24')).toMatchObject({kind:'secret',label:'Hidden Stage',caption:'Season 3 · Exile Zone'})
 expect(byId('S3-26')).toMatchObject({kind:'exile',label:'Exile Showdown',caption:'Season 3 · Exile Zone finale'})
 expect(byId('S3-28')).toMatchObject({kind:'final',label:'Final Match',caption:'Season 3 · Final game 2'})
 expect(byId('S3-29')).toMatchObject({kind:'final',label:'Final Match',caption:'Season 3 · Final game 3'})
})

it('does not imply unaired slots or unsupported settings were played',()=>{
 expect(byId('S1-16')).toMatchObject({kind:'unaired',label:'Unplayed final slot'})
 expect(getGameVenue({id:'S4-01',season:4,category:'New event'})).toMatchObject({kind:'unconfirmed',label:'Setting unconfirmed'})
})

it('labels all currently playable adaptations without assigning an unconfirmed or unaired venue',()=>{
 for(const item of catalog.filter(entry=>entry.game)){
  const venue=getGameVenue(item)
  expect(['unconfirmed','unaired']).not.toContain(venue.kind)
  expect(venue.caption).toMatch(new RegExp('^Season '+item.season+' · '))
 }
})
