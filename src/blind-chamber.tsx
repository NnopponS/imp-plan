import {useState} from 'react'
import type {GameView,BlindCover} from './engine'
import {blindCoverIds} from './engine'
import {base} from './brand'
import './blind-chamber.css'

export const coverNames=['Cinnabar','Amber','Jade','Indigo','Pearl','Violet','Smoke'] as const
const coverGlyphs=[
 'M1.5 3h9M1.5 6h9M1.5 9h9',
 'M6 1.5v9M1.5 6h9M2.8 2.8l6.4 6.4m0-6.4-6.4 6.4',
 'M1 8c2-5 3 3 5-2s3 3 5-2M2 10c2-5 3 3 5-2s3 2 4-1',
 'M2 2h8m-8 4h8m-8 4h8M4 1v10m4-10v10',
 'M2 4l4-2 4 2v4L6 10 2 8zM4 5l2-1 2 1v2L6 8 4 7z',
 'M1.4 9.5 4.1 3l2.3 5L8.7 4l2 5.5',
 'M1.5 10l9-9m-9 5 5-5m-1 9 5-5',
] as const

export function InlaidStone({cover,side}:{cover:BlindCover;side?:0|1}){
 return <span className="inlaid-stone" data-cover={coverNames[cover].toLowerCase()} data-side={side} aria-hidden="true">
  {side===undefined?<svg viewBox="0 0 12 12"><path d={coverGlyphs[cover]}/></svg>:<strong>{side===0?'I':'II'}</strong>}
 </span>
}

export function CoverTray({choice,setChoice,disabled}:{choice:BlindCover|null;setChoice:(v:BlindCover|null)=>void;disabled:boolean}){
 return <div className="stone-tray" role="group" aria-label="Stone covers">
  <div className="tray-label"><strong>Choose a cover</strong><span>Side stays hidden</span></div>
  <div className="tray-covers">
   {blindCoverIds.map(cover=><button key={cover} type="button" title={coverNames[cover]} aria-label={coverNames[cover]+' cover'} aria-pressed={choice===cover} disabled={disabled} onClick={()=>setChoice(cover)}><InlaidStone cover={cover}/></button>)}
   <button type="button" className="auto-cover" aria-label="Automatic cover" aria-pressed={choice===null} disabled={disabled} onClick={()=>setChoice(null)}>Auto</button>
  </div>
 </div>
}

function SceneArt({intro=false}:{intro?:boolean}){
 return <div className={'chamber-artwork'+(intro?' chamber-opening-art':'')}>
  <img src={base+'art/secret-chamber.svg'} alt="An illustrated keeper and challenger sit across a marked game board in a candlelit stone chamber." width={1200} height={660} loading={intro?'eager':'lazy'} decoding="async"/>
  <span className="chamber-shutter chamber-shutter-near" aria-hidden="true"/><span className="chamber-shutter chamber-shutter-far" aria-hidden="true"/>
 </div>
}
export function ChamberEntrance(){
 const [skip,setSkip]=useState(false)
 if(skip)return null
 return <section className="chamber-opening" aria-label="Secret Chamber">
  <SceneArt intro/>
  <div className="chamber-opening-label"><strong>Secret Chamber</strong><button type="button" onClick={e=>{e.currentTarget.closest('dialog')?.querySelector<HTMLButtonElement>('[data-chamber-next]')?.focus();setSkip(true)}}>Skip entrance</button></div>
 </section>
}
export function ChamberScene({game,practice=false}:{game:GameView;practice?:boolean}){
 return <figure className="chamber-scene" data-revealed={game.done||undefined}>
  <SceneArt/>
  <figcaption><span>{practice?'THE KEEPER':'SECRET CHAMBER'}</span><span>{game.done?'The stones have turned.':'Remember who placed each stone.'}</span></figcaption>
 </figure>
}
