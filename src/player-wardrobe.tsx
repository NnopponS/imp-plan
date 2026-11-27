import {useId,useState} from 'react'
import './player-wardrobe.css'

const masks=[['ivory','Ivory mask'],['raven','Raven mask'],['ram','Ram mask']] as const
const cloaks=[['garnet','Garnet cloak'],['forest','Forest cloak'],['midnight','Midnight cloak']] as const
const clasps=[['sun','Sun clasp'],['moon','Moon clasp'],['key','Key clasp']] as const
type Mask=typeof masks[number][0]
type Cloak=typeof cloaks[number][0]
type Clasp=typeof clasps[number][0]
type Outfit={mask:Mask,cloak:Cloak,clasp:Clasp}
const storage='imp-plan-player-wardrobe-v1'
let unsavedLook:number|null|undefined

function isLook(v:unknown):v is number{
 return typeof v==='number'&&Number.isInteger(v)&&v>=0&&v<27
}
export function getPlayerLook():number|null{
 if(unsavedLook!==undefined)return unsavedLook
 try{
  const raw:unknown=JSON.parse(localStorage.getItem(storage)??'null')
  return isLook(raw)?raw:null
 }catch{return null}
}
function saveLook(look:number|null){
 unsavedLook=look
 try{
  if(look===null)localStorage.removeItem(storage)
  else localStorage.setItem(storage,JSON.stringify(look))
  unsavedLook=undefined
 }catch{/* A denied or full store doesn't stop the current session's outfit. */}
}
function lookToOutfit(look:number):Outfit{
 const n=isLook(look)?look:0
 return {mask:masks[Math.floor(n/9)][0],cloak:cloaks[Math.floor(n/3)%3][0],clasp:clasps[n%3][0]}
}
function outfitToLook({mask,cloak,clasp}:Outfit):number{
 return masks.findIndex(x=>x[0]===mask)*9+cloaks.findIndex(x=>x[0]===cloak)*3+clasps.findIndex(x=>x[0]===clasp)
}
const name=(choices:readonly (readonly [string,string])[],id:string)=>choices.find(([key])=>key===id)?.[1]??''

function CloakArt({kind}:{kind:Cloak}){
 return <g data-wardrobe-piece={kind} strokeLinejoin="round" strokeLinecap="round">
  {kind==='garnet'?<>
   <path d="M13 207q6-33 30-49l22-14Q39 121 40 91q-1-35 24-53 26-19 51-4 24 13 27 48 3 32-21 62l21 13q23 18 27 50Z" fill="#6e3a3b" stroke="#22171b" strokeWidth="3.2"/>
   <path d="M20 207q9-36 41-56l18 5 18 40 20-47q33 13 47 58Z" fill="#513038"/>
   <path d="M43 97q-1-43 27-59 23-13 43 0 25 14 25 53l-9 26q4-51-14-67-28-24-49 1-12 19-9 64Z" fill="#8d4f4a"/>
   <path d="M51 93q-1-38 28-51 17-10 34 8m19 8q12 30 1 55M31 195q14-32 44-45m-31 48 13-26m58-22q29 15 42 47m-26-30 7 21" fill="none" stroke="#c08267" strokeWidth="1.6"/>
   <path d="M44 113q21 7 45 31l6 28-32-17-23-25Zm91-2q-16 8-42 33l2 28 34-17 13-28Z" fill="#854648" stroke="#391f29" strokeWidth="2"/>
   <path d="m47 121 18 16 30 22 32-27m6-10-17 17m-32 22 5 39m20-40-6 40" fill="none" stroke="#d19a76" strokeWidth="1.35"/>
   <path d="M33 201l7-15m9 18 9-14m0 14 8-15m59 0 6 15m-2-20 8 18m-1-24 11 24" fill="none" stroke="#291f28" strokeWidth="1.1"/>
  </>:kind==='forest'?<>
   <path d="M12 207q6-36 40-51l14-12-26-18 6-44 2-30 43-27 42 22 10 29-4 43-19 24 19 13q26 16 31 51Z" fill="#3e584c" stroke="#232025" strokeWidth="3.1"/>
   <path d="m22 203 29-43 32-10 11 28 20-29 35 21 13 35Z" fill="#303f3d"/>
   <path d="M43 123q0-43 11-63l38-27 35 21 12 23-5 43-13-2q10-47-1-52L91 46 66 66q-8 16-13 59Z" fill="#52705a"/>
   <path d="m49 122 4-48 11-17 28-18 31 21 10 19m-80-6-8 36m91-22-4 34M24 192q13-25 35-32m70 0q21 13 28 30" fill="none" stroke="#98a578" strokeWidth="1.7"/>
   <path d="m44 121 31 11 22 22-15 28-26-19-21-26Zm88-1-23 10-13 24 17 28 30-37Z" fill="#53674f" stroke="#282830" strokeWidth="2"/>
   <path d="m44 128 27 12 19 20m39-30-16 9-12 22m-60-25 13 17m75-5 12-15" fill="none" stroke="#b8a571" strokeWidth="1.3"/>
   <path d="M58 171q-12 10-20 29m12-13q-5-8-10-3m4 10q8-2 9-8m5-8q5 6 8-2m59-6q12 10 21 28m-15-14q8-6 11-2m-1 9q-8 0-11-7m-5-7q-4 6-8 0" fill="none" stroke="#b18a59" strokeWidth="1.25"/>
   <path d="m20 207 18-9h104l22 9" fill="none" stroke="#22282a" strokeWidth="1.6"/>
  </>:<>
   <path d="M14 207q9-32 32-48l22-15-22-13-8-39q-1-37 26-56 28-19 50-3 27 15 29 48l-10 45-15 20 21 12q24 15 30 49Z" fill="#3d4558" stroke="#201c24" strokeWidth="3.2"/>
   <path d="M23 205q17-35 42-48l32 16 21-22q27 9 46 54Z" fill="#303645"/>
   <path d="M45 121q-9-43 7-66 21-26 44-19 27 8 36 36l-1 39-10 8q9-45-9-59-22-21-43-3-16 9-15 58Z" fill="#535a70"/>
   <path d="M49 97q-4-39 24-53 13-9 27-6m17 13 11 12 5 26M38 196q14-28 39-40m49 6q24 15 31 37m-96-27-12 21" fill="none" stroke="#9e97a4" strokeWidth="1.45"/>
   <path d="m45 122 36 13 33 40-15 17-40-31-24-24Zm89-3-19 14-24 32 1 22 42-33 9-21Z" fill="#5d6274" stroke="#2c2936" strokeWidth="2"/>
   <path d="m43 132 32 12 30 35m29-51-13 11-21 30m-7 17 14-10m-35-37 11 10m42-7 8-8" fill="none" stroke="#c0a67f" strokeWidth="1.15"/>
   <path d="M25 202l11-11m-1 14 10-11m-1 13 11-14m74-18 6 10m1-5 7 12m2-7 8 15" fill="none" stroke="#202332" strokeWidth="1.05"/>
  </>}
  <path d="M62 111q-5 20 10 33 20 15 40-4 14-13 10-33-23-31-60 4Z" fill="#241d23" stroke="#2b1c22" strokeWidth="1.5"/>
 </g>
}

function MaskArt({kind}:{kind:Mask}){
 return <g data-wardrobe-piece={kind} strokeLinejoin="round" strokeLinecap="round">
  {kind==='ivory'?<>
   <path d="M56 77q0-16 15-27 18-11 36-2l11 9 6 20-3 21-5 6-2 19-18 14-18-9-7-10-1-10-11-10 5-11Z" fill="#d8b47f" stroke="#36232a" strokeWidth="2.3"/>
   <path d="M57 79q3-19 19-27 17-10 37 2l-15 5-9 14-2 16-14 9-12-3 2-10Z" fill="#e7c997"/>
   <path d="M105 56q17 12 12 38l-15 17 1 13-9 10 18-11 3-19 5-6q6-32-15-42Z" fill="#ae815d"/>
   <path d="M72 60q17-10 29-7m-37 22 12-9 12-2m18 4 7-2m-21 15-7 10 8 2 5 8m-18 12 10 3 14-4m-13 10 5 1 7-3" fill="none" stroke="#875e47" strokeWidth="1.25"/>
   <path d="M63 78q8-7 17-3-4 9-14 10Zm25-3q9-13 23-12-3 13-19 17Z" fill="#38282c"/>
   <path d="M68 79l5-1m23-5 6-2m2 31 4-4m-35 7 3 9m34-25 3-6" fill="none" stroke="#f8dfab" strokeWidth="1.25"/>
   <path d="m61 70 4-7m1 5 8-9m25 66 6-3m-27-8 4 3m23-9 6-6" fill="none" stroke="#9a7254" strokeWidth=".75"/>
  </>:kind==='raven'?<>
   <path d="M49 78q2-20 21-31 23-14 44 2l11 13-2 23 16 15q-5 13-29 21l-10 15-20-16-5-14-15-12Z" fill="#474650" stroke="#1e1a21" strokeWidth="2.8"/>
   <path d="M50 80q9-15 29-22 19-9 34-8l7 10-20 5-9 17-19 8-16-1Z" fill="#66636a"/>
   <path d="M96 77q14-2 25 7l17 16q-16 16-39 22l-6-17Z" fill="#34343f" stroke="#23212b" strokeWidth="1.65"/>
   <path d="M95 106q23-8 36-8m-37 12 16-1 17-8M98 82l12-1 9 6m-27-13-4 20-11 8m21 13 4 10" fill="none" stroke="#979095" strokeWidth="1.25"/>
   <path d="M56 76q8-8 22-7-4 12-18 14Zm36-6q10-8 23-7-8 11-20 13Z" fill="#211b23"/>
   <path d="M63 77l7-2m29-5 7-2m-45 3 6-5m14-12q14-6 25-5m-48 44 11 7m35 22 11-8" fill="none" stroke="#c9ab84" strokeWidth="1.15"/>
   <path d="M82 108l2 7m3-6 2 10m12-17 5-2m-44-10 9 4" fill="none" stroke="#25232c" strokeWidth="1"/>
   <g fill="#c89665" stroke="#292330" strokeWidth=".75"><circle cx="53" cy="83" r="2.4"/><circle cx="82" cy="54" r="2.7"/><circle cx="114" cy="82" r="2.15"/><circle cx="90" cy="110" r="2.15"/><circle cx="128" cy="99" r="1.8"/></g>
  </>:<>
   <path d="M67 71C39 93 27 67 44 49q12-15 31-6-16 1-18 15-3 10 9 9Zm44 0c28 20 45-5 29-23q-12-15-31-6 17 2 18 16 2 10-9 9Z" fill="#a87b56" stroke="#362729" strokeWidth="2.15"/>
   <path d="M63 66q-10 8-17 0-6-8 3-18l10-4m58 22q10 9 17-1 5-8-1-15l-10-6M46 52l6 5m-9 2 8 4m20 3-9 8m72-22-7 5m11 3-9 6m-19 1 9 8" fill="none" stroke="#e1b480" strokeWidth="1.25"/>
   <path d="M58 74q7-21 23-24l17-2q21 4 26 25l-6 23-12 11-4 15-13 16-15-13-4-20-10-9Z" fill="#af7554" stroke="#3a252a" strokeWidth="2.2"/>
   <path d="M64 72q11-21 29-21l20 8-13 7-6 18-23 13-7-10Z" fill="#cc9466"/>
   <path d="m96 65-9 18-4 20 5 26 13-24 16-14-1-21Z" fill="#8d5b46"/>
   <path d="M64 80q11-10 22-4-4 11-17 12Zm31-5q8-10 21-8-4 12-16 13Z" fill="#3b252e"/>
   <path d="m72 81 6-2m24-7 6-2m-21 37-9 8 11 13 10-15-2-10m-29-8 7 6m41-18-9 10m-30-33 9 2 9-4" fill="none" stroke="#edbc86" strokeWidth="1.3"/>
   <path d="m75 69 2-5m17 1 5-5m11 27 3-4m-33 13 4-4m10 30 6-7" fill="none" stroke="#694235" strokeWidth="1.05"/>
  </>}
 </g>
}

function ClaspArt({kind}:{kind:Clasp}){
 return <g data-wardrobe-piece={kind} strokeLinecap="round" strokeLinejoin="round">
  {kind==='sun'?<>
   <path d="m96 143 3 5 5-2 1 5 6 2-3 4 2 5-5 1-2 5-4-2-4 4-3-5-5 1-1-5-5-2 3-4-1-5 5-1 2-5 4 2Z" fill="#d0a270" stroke="#50363a" strokeWidth="1.35"/>
   <circle cx="96" cy="156" r="7" fill="#9c633d" stroke="#f1d299" strokeWidth="1.35"/>
   <path d="M96 152v8m-4-4h8m-7-3 6 6m0-6-6 6" stroke="#f2cf91" strokeWidth=".85"/>
  </>:kind==='moon'?<>
   <path d="M96 143q13 0 13 13t-13 13q-13 0-13-13t13-13Z" fill="#94919b" stroke="#42313c" strokeWidth="1.55"/>
   <circle cx="96" cy="156" r="9.4" fill="#51495c" stroke="#c3abb4" strokeWidth="1.05"/>
   <path d="M96 149q-7 7 5 11-6 5-10-1-3-5 5-10Z" fill="#efccac"/>
   <path d="M101 151v4m-2-2h4" stroke="#f2d2a4" strokeWidth=".95"/>
  </>:<>
   <path d="m96 142 13 14-13 14-13-14Z" fill="#c3a277" stroke="#593e37" strokeWidth="1.5"/>
   <path d="m96 146 9 10-9 10-9-10Z" fill="#79523b" stroke="#e6c592" strokeWidth="1.1"/>
   <circle cx="94" cy="154" r="2.15" fill="none" stroke="#f3d4a5" strokeWidth="1.15"/>
   <path d="m96 155 5 5m-2-2 1-2m1 4 1-2" fill="none" stroke="#f3d4a5" strokeWidth="1.15"/>
  </>}
 </g>
}

export function PlayerPortrait({look,label='Your avatar',className,decorative=false}:{look:number,label?:string,className?:string,decorative?:boolean}){
 const hatch=useId()+'-wardrobe-hatch'
 const outfit=lookToOutfit(look)
 const description=label+': '+name(masks,outfit.mask)+', '+name(cloaks,outfit.cloak)+', '+name(clasps,outfit.clasp)
 return <svg className={className?'wardrobe-portrait '+className:'wardrobe-portrait'} viewBox="0 0 180 220"
  role={decorative?undefined:'img'} aria-hidden={decorative||undefined} aria-label={decorative?undefined:description}
  data-player-look={isLook(look)?look:0} focusable="false">
  <defs><pattern id={hatch} width="4" height="4" patternUnits="userSpaceOnUse">
   <path d="M-1 2 2-1m-1 6 4-4m-1 6 4-4" stroke="#c9a37d" strokeWidth=".33" opacity=".38"/>
  </pattern></defs>
  <path d="M2 2h176v216H2Z" fill="#2d2426" stroke="#a77d56" strokeWidth="2"/>
  <path d="M6 6h168v208H6Z" fill="none" stroke="#765742"/>
  <path d="M16 192V78q0-47 74-62 72 16 74 62v114Z" fill="#594234" stroke="#a58055" strokeWidth="2"/>
  <path d="M21 193V80q1-43 69-58 66 16 69 58v113Z" fill="#302929" stroke="#382c2b" strokeWidth="1.3"/>
  <path d="M25 179V83q1-36 65-53 63 16 65 53v96Z" fill="#3b302c" stroke="#886146" strokeWidth="1.05"/>
  <path d="M29 175V90q2-36 61-54 61 19 61 54v85Z" fill={`url(#${hatch})`}/>
  <path d="M26 79h126m-122 22h123m-123 22h123M52 52v26m72-27v28M40 80v19m99-20v20" fill="none" stroke="#9a7353" strokeWidth=".65" opacity=".58"/>
  <path d="M90 14v9m-8-7 8 4 8-4M8 24v-9l6-6h7m138 0h7l6 6v9M8 196v9l6 6h7m138 0h7l6-6v-9" fill="none" stroke="#c49b6e" strokeWidth="1.15"/>
  <path d="M23 119v26m-3-3h6m-4-23 1-6 2 6Zm134 0v26m-3-3h6m-4-23 1-6 2 6Z" fill="none" stroke="#a17c59" strokeWidth="1.05" opacity=".64"/>
  <CloakArt kind={outfit.cloak}/><MaskArt kind={outfit.mask}/><ClaspArt kind={outfit.clasp}/>
  <path d="M10 205h160v9H10Z" fill="#392923" stroke="#a77d55" strokeWidth="1.05"/>
  <path d="M19 209h60m22 0h60m-71 3 4-3-4-3-4 3Z" fill="none" stroke="#c79b68" strokeWidth=".9"/>
 </svg>
}

function OutfitChoices<K extends string>({legend,choices,value,choose,kind}:{legend:string,choices:readonly (readonly [K,string])[],value:K,choose:(next:K)=>void,kind:keyof Outfit}){
 const id=useId()
 const view=kind==='mask'?'33 38 112 105':kind==='cloak'?'12 31 156 181':'79 140 34 34'
 return <fieldset className="wardrobe-choices">
  <legend>{legend}</legend><div className="wardrobe-options">
   {choices.map(([piece,label])=><label key={piece} title={label}>
    <input className="sr" type="radio" name={id} value={piece} checked={piece===value} onClick={()=>{if(piece===value)choose(piece)}} onChange={()=>choose(piece)}/>
    <svg viewBox={view} aria-hidden="true" focusable="false">{kind==='mask'?<MaskArt kind={piece as Mask}/>:kind==='cloak'?<CloakArt kind={piece as Cloak}/>:<ClaspArt kind={piece as Clasp}/>}</svg>
    <span className="sr">{label}</span>
   </label>)}
  </div>
 </fieldset>
}

export function PlayerWardrobe(){
 const [selected,setSelected]=useState(getPlayerLook)
 const [preview,setPreview]=useState(0)
 const title=useId()
 const look=selected??preview,outfit=lookToOutfit(look)
 function choose<K extends keyof Outfit>(kind:K,value:Outfit[K]){
  const next=outfitToLook({...outfit,[kind]:value})
  setSelected(next)
  saveLook(next)
 }
 function surprise(){
  setPreview((look+1+Math.floor(Math.random()*26))%27)
  setSelected(null)
  saveLook(null)
 }
 return <section className="player-wardrobe" aria-labelledby={title}>
  <header className="wardrobe-title"><h2 id={title}>Player wardrobe</h2><span>Optional</span></header>
  <div className="wardrobe-body">
   <div className="wardrobe-frame"><PlayerPortrait look={look}/><span>{selected===null?'Room picks for you':'Your outfit'}</span></div>
   <div className="wardrobe-controls">
    <OutfitChoices kind="mask" legend="Mask" choices={masks} value={outfit.mask} choose={value=>choose('mask',value)}/>
    <OutfitChoices kind="cloak" legend="Cloak" choices={cloaks} value={outfit.cloak} choose={value=>choose('cloak',value)}/>
    <OutfitChoices kind="clasp" legend="Clasp" choices={clasps} value={outfit.clasp} choose={value=>choose('clasp',value)}/>
   </div>
  </div>
  <footer className="wardrobe-foot">
   <button type="button" onClick={surprise}>
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false"><path d="m4 6 6-3 6 3v8l-6 3-6-3Zm0 0 6 3 6-3m-6 3v8"/><path d="m7 11 .01 0m.99 2 .01 0m4-2 .01 0m1.99 1 .01 0"/></svg>Surprise me
   </button>
   <a href="#play">Skip outfit <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false"><path d="M3 10h13m-5-5 5 5-5 5"/></svg></a>
  </footer>
 </section>
}
