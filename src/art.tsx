import {base} from './brand'
export function Crest(){return <svg className="crest" width="33" height="33" viewBox="0 0 40 40" fill="none" aria-hidden="true"><path d="M20 1.5 38.5 20 20 38.5 1.5 20Z" fill="#63452e"/><path d="M20 6 34 20 20 34 6 20Z" stroke="#d9b97b"/><path d="m20 9 8 14-8 7-8-7Z" fill="#ab7a4c" stroke="#f2d5a1"/><path d="m20 9 3 14-3 7-3-7Z" fill="#eee0c0"/><path d="M12 23h16" stroke="#f2d5a1"/></svg>}
export function GameArt({mode}:{mode:string}){if(hasIllustratedGame(mode))return <div className={'game-art engraved-game '+mode}><IllustratedGame game={mode}/></div>;if(mode==='montage')return <div className="game-art montage-cover"><picture><source media="(max-width:640px)" srcSet={base+'art/montage-chamber-mobile.svg'}/><img data-arena-art src={base+'art/montage-chamber.svg'} width={1120} height={610} loading="lazy" decoding="async" alt=""/></picture></div>;if(mode==='wallGo')return <div className="game-art wall-go-cover"><picture><source media="(max-width:640px)" srcSet={base+'art/wall-go-chamber-mobile.svg'}/><img data-arena-art src={base+'art/wall-go-chamber.svg'} width={1200} height={620} loading="lazy" decoding="async" alt=""/></picture></div>;return <div className={'game-art '+mode}><img data-arena-art src={base+'art/'+(mode==='blind'?'secret-chamber.svg':mode+'.webp')} width={650} height={430} loading="lazy" decoding="async" alt=""/></div>}

// Only entries with a finished, checked illustration use this new art family.
const illustratedGameKeys=new Set<string>(['morris','grass1','hex','remove','knight','auction','codeLock','piece','fence','memoryPoker','exile','cubes'])
export const hasIllustratedGame=(game:string)=>illustratedGameKeys.has(game)
export function IllustratedGame({game,className,loading='lazy'}:{game:string;className?:string;loading?:'lazy'|'eager'}){
 return <img className={className} data-arena-art src={base+'art/seasonal-'+game+'.svg'} width={960} height={540} alt="" loading={loading} decoding="async"/>
}
