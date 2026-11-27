import catalog from '../../src/catalog.json' with {type:'json'}

// The index covers these three complete seasons. Keep this separate from the
// evolving playable count so deleting an entry cannot silently lower the bar.
export const catalogScope=[[1,18],[2,17],[3,29]] as const
export const scopedCatalogIds=catalogScope.flatMap(([season,size])=>
 Array.from({length:size},(_,index)=>'S'+season+'-'+String(index+1).padStart(2,'0'))
)

export function expectedCatalog(season?:number){
 const entries=season===undefined?catalog:catalog.filter(entry=>entry.season===season)
 const playable=entries.flatMap(entry=>entry.game===null?[]:[{key:entry.game,title:entry.title}])
 return {
  ids:entries.map(entry=>entry.id),
  titles:entries.map(entry=>entry.title),
  playableKeys:playable.map(entry=>entry.key).sort(),
  playableTitles:playable.map(entry=>entry.title).sort(),
 }
}
