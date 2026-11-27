/** First 27 IDs are the original three-by-three-by-three outfits, unchanged. */
export const legacyAppearanceCount=27
export const wardrobeVersion=2
export const masks=[['ivory','Ivory mask'],['raven','Raven mask'],['ram','Ram mask'],['moth','Moth mask'],['owl','Owl mask'],['fox','Fox mask']] as const
export const cloaks=[['garnet','Garnet cloak'],['forest','Forest cloak'],['midnight','Midnight cloak']] as const
export const clasps=[['sun','Sun clasp'],['moon','Moon clasp'],['key','Key clasp']] as const
export const dyes=[['original','Original fabric'],['peacock','Peacock dye'],['aubergine','Aubergine dye'],['cobalt','Cobalt dye'],['saffron','Saffron dye'],['ash','Ash dye']] as const
export const extras=[['none','No accessory'],['chain','Chain accessory'],['rose','Rose accessory'],['shoulder','Shoulder guard'],['sash','Sash accessory']] as const
export type Mask=typeof masks[number][0]
export type Cloak=typeof cloaks[number][0]
export type Clasp=typeof clasps[number][0]
export type Dye=typeof dyes[number][0]
export type Extra=typeof extras[number][0]
export type Outfit={mask:Mask,cloak:Cloak,clasp:Clasp,dye:Dye,extra:Extra}
export const appearanceCount=masks.length*cloaks.length*clasps.length*dyes.length*extras.length
export const appearancePreset=(value:unknown):number|undefined=>
 typeof value==='number'&&Number.isInteger(value)&&value>=0&&value<appearanceCount?value:undefined
export const legacyAppearance=(look:number)=>look%legacyAppearanceCount

export function lookToOutfit(look:number):Outfit{
 const n=appearancePreset(look)??0
 const base=legacyAppearance(n),layers=Math.floor(n/legacyAppearanceCount)
 return {
  mask:masks[Math.floor(base/9)+3*(layers%2)][0],
  cloak:cloaks[Math.floor(base/3)%3][0],clasp:clasps[base%3][0],
  dye:dyes[Math.floor(layers/2)%dyes.length][0],
  extra:extras[Math.floor(layers/(2*dyes.length))][0]
 }
}

export function outfitToLook({mask,cloak,clasp,dye,extra}:Outfit):number{
 const shape=masks.findIndex(x=>x[0]===mask)
 const layers=(shape>=3?1:0)+2*(dyes.findIndex(x=>x[0]===dye)+dyes.length*extras.findIndex(x=>x[0]===extra))
 return legacyAppearanceCount*layers+shape%3*9+cloaks.findIndex(x=>x[0]===cloak)*3+clasps.findIndex(x=>x[0]===clasp)
}
