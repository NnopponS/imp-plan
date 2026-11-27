import {expect,test} from '@playwright/test'
import catalog from '../../src/catalog.json' with {type:'json'}

const playable=new Set(catalog.filter(entry=>entry.game).map(entry=>entry.game)).size

test('all practice cards have distinct game emblems alongside readable show context',async({page})=>{
 await page.goto('./')
 const gallery=page.locator('#play')
 const cards=gallery.getByRole('article')
 await expect(cards).toHaveCount(playable)
 const emblems=gallery.locator('.game-token')
 await expect(emblems).toHaveCount(playable)
 const silhouettes=await emblems.locator('[data-token-engraving]').evaluateAll(nodes=>nodes.map(node=>node.innerHTML))
 expect(silhouettes.every(Boolean)).toBe(true)
 expect(new Set(silhouettes).size).toBe(playable)
 await expect(gallery.locator('.game-venue-badge')).toHaveCount(playable)
 await expect(cards.filter({has:page.getByRole('heading',{name:'Blind Gomoku',exact:true})})).toContainText('Secret Chamber')
 await expect(cards.filter({has:page.getByRole('heading',{name:'Time Auction',exact:true})})).toContainText('Prison Match')
 await expect(cards.filter({has:page.getByRole('heading',{name:'Secret Number',exact:true})})).toContainText('Main Match')
 const divine=cards.filter({has:page.getByRole('heading',{name:'Divine Test',exact:true})})
 await expect(divine.locator('.game-venue-badge')).toHaveText('Hidden Stage')
 await expect(divine.locator('.game-venue-place')).toHaveText('Season 3 · Exile Zone')
 const showdown=cards.filter({has:page.getByRole('heading',{name:'Point Gomoku',exact:true})})
 await expect(showdown.locator('.game-venue-badge')).toHaveText('Exile Showdown')
})
test('a narrow season page can find prison matches by venue without obstructing Practice',async({page})=>{
 await page.setViewportSize({width:320,height:760})
 await page.goto('season/2/')
 const gallery=page.locator('#play')
 await gallery.getByRole('searchbox').fill('prison match')
 await expect(gallery.getByRole('heading',{name:'Time Auction',exact:true})).toBeVisible()
 await expect(gallery.getByRole('heading',{name:'Balance Mancala',exact:true})).toHaveCount(0)
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(320)
 await gallery.getByRole('button',{name:'Practice Time Auction',exact:true}).click()
 await expect(page.getByRole('heading',{name:'Practice lobby'})).toBeVisible()
 await expect(page.getByRole('combobox',{name:'Game',exact:true})).toHaveValue('auction')
})
