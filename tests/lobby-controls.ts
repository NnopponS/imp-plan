import {expect,type Page} from '@playwright/test'
import type {Game} from '../src/engine'

export const selectedGame=(page:Page,game:Game)=>page.getByRole('region',{name:'Current table'}).and(page.locator('[data-party-game="'+game+'"]')).locator('.party-ident').getByRole('heading',{level:2})
export const tableSetting=(page:Page,name:string)=>page.getByRole('radiogroup',{name,exact:true})
export const tableRadio=(page:Page,name:string,option:string)=>tableSetting(page,name).getByRole('radio',{name:option,exact:true})
export const tableSwitch=(page:Page,name:string)=>page.getByRole('switch',{name,exact:true})

const valueLabels:Record<string,Record<string,string>>={
 'Memory Poker mode':{fan:'Fan table',episode:'Episode-style duel'},
 'Time Auction mode':{sealed:'Sealed bids',hold:'Hold & release (episode-inspired)'},
 'Bot difficulty':{easy:'Easy',normal:'Standard',hard:'Hard'},
}
export const settingChoice=(page:Page,field:string,value:string)=>tableRadio(page,field,valueLabels[field]?.[value]??
 (field==='Square size'||field==='Board size'?value+' × '+value:
 field==='Time limit'?Number(value)/60+' minutes':
 field==='Questions'?value+' questions':value+' seconds'))

export async function chooseGame(page:Page,game:Game){
 const trigger=page.getByRole('button',{name:'Choose game',exact:true})
 await expect(trigger).toBeEnabled()
 await trigger.press('Enter')
 const shelf=page.getByRole('dialog',{name:'Choose a game'})
 const card=shelf.getByRole('button').and(shelf.locator('[data-game-choice="'+game+'"]'))
 await expect(card).toBeEnabled()
 await card.press('Enter')
 await expect(shelf).not.toBeVisible()
 await expect(selectedGame(page,game)).toBeVisible()
}

export async function chooseSetting(page:Page,name:string,value:string){
 const radio=settingChoice(page,name,value)
 await expect(radio).toBeEnabled()
 await radio.press('Enter')
 await expect(radio).toBeChecked()
}
