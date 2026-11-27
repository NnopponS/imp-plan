import {GameToken} from './game-identity'
import type {Game} from './engine'
import './engraved-tables.css'

type Material='lacquer'|'brass'|'felt'|'oak'|'ink'|'vellum'
export const tableMaterial={
 blind:'lacquer',point:'lacquer',morris:'lacquer',bagh:'lacquer',mancala:'lacquer',wallGo:'lacquer',
 scale:'brass',auction:'brass',codeLock:'brass',heavy13:'brass',fence:'brass',
 memoryPoker:'felt',remove:'felt',secret:'felt',
 grass1:'oak',grass3:'oak',piece:'oak',tower:'oak',pyramid:'oak',
 colorLink:'ink',hex:'ink',knight:'ink',cubes:'ink',rectangles:'ink',exile:'ink',equations:'ink',
 montage:'vellum',divine:'vellum',fragments:'vellum',spot:'vellum',
} as const satisfies Record<Game,Material>

export function TableMakersMark({game}:{game:Game}){
 return <div className="table-makers-mark" data-table-game={game} aria-hidden="true">
  <svg className="table-mark-tail" viewBox="0 0 70 21" fill="none" aria-hidden="true">
   <path d="M1 11c9 0 15-7 25-6 9 1 12 9 21 9 5 0 7-4 11-5l11 1M7 13c7 1 13-4 19-4 7 0 10 7 16 7M19 5 23 2l6 2m9 10 1 4 6 2M50 12l5 5 6-3" />
   <path d="m10 11 3-3m5 1 3-3m8 2 2-3m8 10 3-3m5 4 3-3m11-3 2-2" />
  </svg>
  <GameToken game={game}/>
 </div>
}

const instrumentPaths={
 rotate:'M17.3 8.2A6.4 6.4 0 1 0 17 14m.4-10.4v4.8h-5.1M6 15.5l2 1.5m2.5 1 2-.2',
 return:'M3 7.5h9a5.3 5.3 0 0 1 5.5 5.2c0 2.3-1.2 4.3-3.6 5.4M3 7.5 7.5 3M3 7.5l4.7 4.2m4.5 3.5 1.4 3',
 clue:'M3 8.5 8 4l10.6 10.7-4.3 4.2L3 8.5Zm2.5 1.7 4-3.6m2 4.9 4-3.8m-1.4 7.2 3.2-2.9M3 17l2-2m-3-1 2.3-.4',
 weigh:'M10 2.5v14m-4.5 1h9M3.2 6.8l13.6-1.3m-12 1.2-2.9 5.7h5.8L4.8 6.7Zm10.4-1-2.9 5.7h5.8l-2.9-5.7ZM8.5 4.5h3',
 proof:'M3 3.5h10l3.7 3.2v10l-3 1.7H3zM13 3.5v3.7h3.2M5.5 10h5m-5 3h2.2m2.3.9 2.2 2.1 4-4.5',
} as const

export function TableToolMark({mark}:{mark:keyof typeof instrumentPaths}){
 return <svg className="table-tool-mark" viewBox="0 0 20 20" width="18" height="18" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"><path d={instrumentPaths[mark]}/></svg>
}

export function PointStone({side}:{side:number}){
 return <svg className="point-etched-stone" viewBox="0 0 24 24" width="24" height="24" role="presentation" focusable="false" data-side={side}>
  <path className="point-stone-edge" d="M11.8 1.7c5.7-.2 10.4 4.3 10.4 10 0 5.9-3.8 10.2-10.2 10.5C6 22.2 1.7 18 1.8 12 1.9 6.1 6.2 2 11.8 1.7Z"/>
  <path className="point-stone-rim" d="M11.8 4.1c4.5-.1 7.9 3.1 8 7.7-.1 4.5-3.1 8-7.7 8-4.8-.1-8-3.3-8-7.8.2-4.5 3.4-7.8 7.7-7.9Zm-5 3.1 1.1-.7m-2.6 3 1-.9m11.5 6.8-1.2 1.4"/>
  <path className="point-stone-insignia" d={side===0?'m12 7.3 4 4.5-4 4.9-4.2-4.9 4.2-4.5Zm0 2.7v3.6':'M8.1 8.7 16 15.4m0-6.7-7.8 6.8m1.6-3.6 2.3-2.2 2.1 2.2-2.2 2.2z'}/>
 </svg>
}
