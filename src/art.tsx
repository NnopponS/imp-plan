import {base} from './brand'
import type {Game} from './engine'
import {ArenaPreview} from './arena-preview'
export function Crest(){return <svg className="crest" width="33" height="33" viewBox="0 0 40 40" fill="none" aria-hidden="true"><path d="M20 1.5 38.5 20 20 38.5 1.5 20Z" fill="#63452e"/><path d="M20 6 34 20 20 34 6 20Z" stroke="#d9b97b"/><path d="m20 9 8 14-8 7-8-7Z" fill="#ab7a4c" stroke="#f2d5a1"/><path d="m20 9 3 14-3 7-3-7Z" fill="#eee0c0"/><path d="M12 23h16" stroke="#f2d5a1"/></svg>}
const chamberCovers={
 heavy13:{stem:'heavy13',className:'heavy13-cover',width:1180,height:640},
 montage:{stem:'montage',className:'montage-cover',width:1120,height:610},
 wallGo:{stem:'wall-go',className:'wall-go-cover',width:1200,height:620},
} as const
export function gameArtSources(mode:Game):{src:string;mobile?:string;width:number;height:number;className:string}{
 if(mode==='colorLink')return {src:base+'art/color-link-board.svg',width:960,height:540,className:'color-link-cover'}
 if(hasIllustratedGame(mode))return {src:illustratedSource(mode),width:960,height:540,className:'engraved-game '+mode}
 if(mode==='heavy13'||mode==='montage'||mode==='wallGo'){
  const {stem,width,height,className}=chamberCovers[mode]
  return {src:base+'art/'+stem+'-chamber.svg',mobile:base+'art/'+stem+'-chamber-mobile.svg',width,height,className}
 }
 return {src:base+'art/'+(mode==='blind'?'secret-chamber.svg':mode+'.webp'),width:650,height:430,className:mode}
}
export function GameArt({mode,motionOff}:{mode:Game;motionOff?:boolean}){
 const cover=gameArtSources(mode)
 const image=<img data-arena-art src={cover.src} width={cover.width} height={cover.height} loading="lazy" decoding="async" alt=""/>
 return <ArenaPreview game={mode} motionOff={motionOff} posterClass={cover.className}>
  {cover.mobile?<picture><source media="(max-width:640px)" srcSet={cover.mobile}/>{image}</picture>:image}
 </ArenaPreview>
}

// Only entries with a finished, checked illustration use this new art family.
const illustratedGameKeys=new Set<string>(['morris','grass1','hex','remove','knight','auction','codeLock','piece','fence','memoryPoker','exile','cubes','fragments','tower','scale','mancala','bagh','pyramid','equations','rectangles','grass3','spot','secret','divine','point','symmetry'])
export const hasIllustratedGame=(game:string)=>illustratedGameKeys.has(game)
const illustratedSource=(game:string)=>base+'art/seasonal-'+game+'.svg'
export function IllustratedGame({game,className,loading='lazy'}:{game:string;className?:string;loading?:'lazy'|'eager'}){
 return <img className={className} data-arena-art src={illustratedSource(game)} width={960} height={540} alt="" loading={loading} decoding="async"/>
}
