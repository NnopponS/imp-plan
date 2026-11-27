import {useId,useState} from 'react'
import './player-wardrobe.css'

import {appearanceCount,appearancePreset,cloaks,clasps,dyes,extras,lookToOutfit,masks,outfitToLook,type Clasp,type Cloak,type Dye,type Extra,type Mask,type Outfit} from './wardrobe-look'

const storage='imp-plan-player-wardrobe-v1'
let unsavedLook:number|null|undefined

export function getPlayerLook():number|null{
 if(unsavedLook!==undefined)return unsavedLook
 try{
  const raw:unknown=JSON.parse(localStorage.getItem(storage)??'null')
  return appearancePreset(raw)??null
 }catch{return null}
}
function saveLook(look:number|null){
 unsavedLook=look
 try{
  if(look===null)localStorage.removeItem(storage)
  else localStorage.setItem(storage,JSON.stringify(look))
  unsavedLook=undefined
  return true
 }catch{return false /* A denied/full store does not stop the current session's outfit. */}
}
const name=(choices:readonly (readonly [string,string])[],id:string)=>choices.find(([key])=>key===id)?.[1]??''

const dyeColors={
 peacock:['#375b60','#263f4c','#4f7880','#a6b9a3','#547988','#c5c294','#253239'],
 aubergine:['#58405d','#3b2a48','#7d5e82','#bf9eb1','#6b4a72','#d0a691','#2e2339'],
 cobalt:['#384e75','#283650','#526c98','#a7b6c8','#496391','#c2bbab','#222c42'],
 saffron:['#82643d','#58462e','#ac8646','#d3b675','#977440','#e2c088','#413422'],
 ash:['#62615c','#424542','#8c8a83','#c1bdaf','#70726f','#d1bc98','#323739'],
} as const satisfies Record<Exclude<Dye,'original'>,readonly string[]>
function CloakArt({kind,dye='original'}:{kind:Cloak;dye?:Dye}){
 const dyePaint=(fallback:string,shade:number)=>dye==='original'?fallback:dyeColors[dye][shade]
 return <g data-wardrobe-piece={kind} data-wardrobe-dye={dye} strokeLinejoin="round" strokeLinecap="round">
  {kind==='garnet'?<>
   <path d="M13 207q6-33 30-49l22-14Q39 121 40 91q-1-35 24-53 26-19 51-4 24 13 27 48 3 32-21 62l21 13q23 18 27 50Z" fill={dyePaint("#6e3a3b",0)} stroke="#22171b" strokeWidth="3.2"/>
   <path d="M20 207q9-36 41-56l18 5 18 40 20-47q33 13 47 58Z" fill={dyePaint("#513038",1)}/>
   <path d="M43 97q-1-43 27-59 23-13 43 0 25 14 25 53l-9 26q4-51-14-67-28-24-49 1-12 19-9 64Z" fill={dyePaint("#8d4f4a",2)}/>
   <path d="M51 93q-1-38 28-51 17-10 34 8m19 8q12 30 1 55M31 195q14-32 44-45m-31 48 13-26m58-22q29 15 42 47m-26-30 7 21" fill="none" stroke={dyePaint("#c08267",3)} strokeWidth="1.6"/>
   <path d="M44 113q21 7 45 31l6 28-32-17-23-25Zm91-2q-16 8-42 33l2 28 34-17 13-28Z" fill={dyePaint("#854648",4)} stroke="#391f29" strokeWidth="2"/>
   <path d="m47 121 18 16 30 22 32-27m6-10-17 17m-32 22 5 39m20-40-6 40" fill="none" stroke={dyePaint("#d19a76",5)} strokeWidth="1.35"/>
   <path d="M33 201l7-15m9 18 9-14m0 14 8-15m59 0 6 15m-2-20 8 18m-1-24 11 24" fill="none" stroke={dyePaint("#291f28",6)} strokeWidth="1.1"/>
  </>:kind==='forest'?<>
   <path d="M12 207q6-36 40-51l14-12-26-18 6-44 2-30 43-27 42 22 10 29-4 43-19 24 19 13q26 16 31 51Z" fill={dyePaint("#3e584c",0)} stroke="#232025" strokeWidth="3.1"/>
   <path d="m22 203 29-43 32-10 11 28 20-29 35 21 13 35Z" fill={dyePaint("#303f3d",1)}/>
   <path d="M43 123q0-43 11-63l38-27 35 21 12 23-5 43-13-2q10-47-1-52L91 46 66 66q-8 16-13 59Z" fill={dyePaint("#52705a",2)}/>
   <path d="m49 122 4-48 11-17 28-18 31 21 10 19m-80-6-8 36m91-22-4 34M24 192q13-25 35-32m70 0q21 13 28 30" fill="none" stroke={dyePaint("#98a578",3)} strokeWidth="1.7"/>
   <path d="m44 121 31 11 22 22-15 28-26-19-21-26Zm88-1-23 10-13 24 17 28 30-37Z" fill={dyePaint("#53674f",4)} stroke="#282830" strokeWidth="2"/>
   <path d="m44 128 27 12 19 20m39-30-16 9-12 22m-60-25 13 17m75-5 12-15" fill="none" stroke={dyePaint("#b8a571",5)} strokeWidth="1.3"/>
   <path d="M58 171q-12 10-20 29m12-13q-5-8-10-3m4 10q8-2 9-8m5-8q5 6 8-2m59-6q12 10 21 28m-15-14q8-6 11-2m-1 9q-8 0-11-7m-5-7q-4 6-8 0" fill="none" stroke={dyePaint("#b18a59",5)} strokeWidth="1.25"/>
   <path d="m20 207 18-9h104l22 9" fill="none" stroke={dyePaint("#22282a",6)} strokeWidth="1.6"/>
  </>:<>
   <path d="M14 207q9-32 32-48l22-15-22-13-8-39q-1-37 26-56 28-19 50-3 27 15 29 48l-10 45-15 20 21 12q24 15 30 49Z" fill={dyePaint("#3d4558",0)} stroke="#201c24" strokeWidth="3.2"/>
   <path d="M23 205q17-35 42-48l32 16 21-22q27 9 46 54Z" fill={dyePaint("#303645",1)}/>
   <path d="M45 121q-9-43 7-66 21-26 44-19 27 8 36 36l-1 39-10 8q9-45-9-59-22-21-43-3-16 9-15 58Z" fill={dyePaint("#535a70",2)}/>
   <path d="M49 97q-4-39 24-53 13-9 27-6m17 13 11 12 5 26M38 196q14-28 39-40m49 6q24 15 31 37m-96-27-12 21" fill="none" stroke={dyePaint("#9e97a4",3)} strokeWidth="1.45"/>
   <path d="m45 122 36 13 33 40-15 17-40-31-24-24Zm89-3-19 14-24 32 1 22 42-33 9-21Z" fill={dyePaint("#5d6274",4)} stroke="#2c2936" strokeWidth="2"/>
   <path d="m43 132 32 12 30 35m29-51-13 11-21 30m-7 17 14-10m-35-37 11 10m42-7 8-8" fill="none" stroke={dyePaint("#c0a67f",5)} strokeWidth="1.15"/>
   <path d="M25 202l11-11m-1 14 10-11m-1 13 11-14m74-18 6 10m1-5 7 12m2-7 8 15" fill="none" stroke={dyePaint("#202332",6)} strokeWidth="1.05"/>
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
  </>:kind==='ram'?<>
   <path d="M67 71C39 93 27 67 44 49q12-15 31-6-16 1-18 15-3 10 9 9Zm44 0c28 20 45-5 29-23q-12-15-31-6 17 2 18 16 2 10-9 9Z" fill="#a87b56" stroke="#362729" strokeWidth="2.15"/>
   <path d="M63 66q-10 8-17 0-6-8 3-18l10-4m58 22q10 9 17-1 5-8-1-15l-10-6M46 52l6 5m-9 2 8 4m20 3-9 8m72-22-7 5m11 3-9 6m-19 1 9 8" fill="none" stroke="#e1b480" strokeWidth="1.25"/>
   <path d="M58 74q7-21 23-24l17-2q21 4 26 25l-6 23-12 11-4 15-13 16-15-13-4-20-10-9Z" fill="#af7554" stroke="#3a252a" strokeWidth="2.2"/>
   <path d="M64 72q11-21 29-21l20 8-13 7-6 18-23 13-7-10Z" fill="#cc9466"/>
   <path d="m96 65-9 18-4 20 5 26 13-24 16-14-1-21Z" fill="#8d5b46"/>
   <path d="M64 80q11-10 22-4-4 11-17 12Zm31-5q8-10 21-8-4 12-16 13Z" fill="#3b252e"/>
   <path d="m72 81 6-2m24-7 6-2m-21 37-9 8 11 13 10-15-2-10m-29-8 7 6m41-18-9 10m-30-33 9 2 9-4" fill="none" stroke="#edbc86" strokeWidth="1.3"/>
   <path d="m75 69 2-5m17 1 5-5m11 27 3-4m-33 13 4-4m10 30 6-7" fill="none" stroke="#694235" strokeWidth="1.05"/>
  </>:kind==='moth'?<>
   <path d="M88 56Q78 47 76 34L60 24m36 33q18-10 19-25l14-9M61 24l-5 5m74-6 4 6" fill="none" stroke="#d0a37a" strokeWidth="1.9"/>
   <path d="M91 129c-11-11-37-13-39-37l-15-31q10-14 27-9l28 11 23-11q25-5 30 8l-13 30q-1 24-27 31l-12 11Z" fill="#a88b99" stroke="#321f2c" strokeWidth="2.7"/>
   <path d="M92 67q-34-28-48-7l12 26 23 11-10 10 22 19 20-17-9-12 24-11 13-25q-11-22-47 6Z" fill="#cfaca7"/>
   <path d="M55 72q13-8 30 10-17 3-26-3Zm75 0q-12-9-30 8 17 6 28-3Z" fill="#412b3b"/>
   <path d="M92 73v34m-8-13 8 15 8-15m-38-32 14 7m47-7-15 6m-45 23 14 7m43-8-14 7" fill="none" stroke="#7d5b71" strokeWidth="1.25"/>
   <path d="m85 68 8-5 7 5-7 5Z" fill="#c38573" stroke="#efd9b0" strokeWidth="1"/>
  </>:kind==='owl'?<>
   <path d="M52 75q-3-23 11-32l21 10 11 14 12-17 21-9q13 18 10 38l-6 33-18 18-20 9-20-11-16-19Z" fill="#8c6c59" stroke="#2b2025" strokeWidth="2.6"/>
   <path d="M57 69q19-21 37 2 22-26 40-6l-2 20q-4 29-32 35l-7 14-7-14q-28-5-29-34Z" fill="#dfc19c"/>
   <path d="M61 83q0-13 15-14 12 0 15 14-7 10-17 10-9-2-13-10Zm38-2q6-14 18-13 12 1 13 12-7 11-18 10-9-2-13-9Z" fill="#78584b" stroke="#b39370" strokeWidth="1.25"/>
   <path d="m64 81 22 1q-11 11-22-1Zm39 0 23-2q-9 13-23 2Z" fill="#30222b"/>
   <path d="m94 81-7 20 6 12 9-13Z" fill="#a8794d" stroke="#563729" strokeWidth="1.65"/>
   <path d="m61 55 8 5m48-2 10-7M62 95l8 8m-4 0 8 7m45-17-8 10m12-6-7 14m-30 8 6 9 7-8" fill="none" stroke="#a47a5d" strokeWidth="1.25"/>
   <path d="m68 82 6 1m35-2 7-1" stroke="#f3d4a5" strokeWidth="1.1"/>
  </>:<>
   <path d="m52 80 1-42 27 19 13 0 13-3 25-18 3 39-7 17-10 23-20 16-8-1-18-18-10-17Z" fill="#ab6153" stroke="#33202a" strokeWidth="2.5"/>
   <path d="m58 48 15 13-14 5Zm66 0-13 12 14 5ZM57 79l18 11 13-5 6-17 9 17 12 2 15-11-15 29-20 24-16-17-12-18Z" fill="#e8be97"/>
   <path d="M63 77q11-4 23 4-13 7-21 1Zm38 4q9-9 23-8l-3 6q-10 4-20 2Z" fill="#3f2c2e"/>
   <path d="m94 83-5 21 7 5 6-5-6-21M78 103l10 8m23-9-9 10m-12-45 5-6 5 5" fill="none" stroke="#98644e" strokeWidth="1.4"/>
   <path d="m89 108 13-1-6 6Zm-14 7 8 3m28-4-7 3" fill="#513233" stroke="#513233" strokeWidth="1"/>
   <path d="m58 48 1 14m64-12 1 12m-56 21 7 1m32-4 8-2" stroke="#f1d7a2" strokeWidth="1.1"/>

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

function ExtraArt({kind}:{kind:Extra}){
 return <g data-wardrobe-piece={kind} strokeLinecap="round" strokeLinejoin="round">
  {kind==='chain'?<>
   <path d="M41 157q25 28 60 29 20-3 33-32" fill="none" stroke="#261f26" strokeWidth="4"/>
   <path d="M41 157q25 28 60 29 20-3 33-32" fill="none" stroke="#d4af72" strokeWidth="2.4" strokeDasharray="2.8 2"/>
   <path d="m100 181 6 5-6 7-5-7ZM41 153l4 5-4 4-4-4Zm94-4 4 5-5 5-4-5Z" fill="#dfbc7e" stroke="#4e3834" strokeWidth="1.05"/>
  </>:kind==='rose'?<>
   <path d="M53 166q2 14-12 26m11-17q-10 2-11-5 7-5 12 2m-5 10q9 6 14-6-8-1-13 4" fill="#6e866c" stroke="#2e3b38" strokeWidth="1.5"/>
   <path d="M41 158q5-5 9-1 3-9 9-5 8 0 8 6 4 3 1 8-1 6-9 6-7 7-13 1-6-1-5-7-5-3 0-8Z" fill="#a75960" stroke="#52363b" strokeWidth="1.45"/>
   <path d="M45 162q5-4 8 3-4 4 3 4 6-2 6-8-3-4-8 1 1-6-2-7m7 15 5-4" fill="none" stroke="#e5b6a5" strokeWidth="1.25"/>
  </>:kind==='shoulder'?<>
   <path d="m110 151 20-7 24 18 4 18-22 3-18-12Z" fill="#a07855" stroke="#332832" strokeWidth="2"/>
   <path d="m114 153 14-4 19 15 5 11-14 1-16-11Zm24 23-4-13m-9-9 4 5m15 9 3 3" fill="none" stroke="#e5bc86" strokeWidth="1.45"/>
   <circle cx="128" cy="155" r="1.8" fill="#ede1ae"/><circle cx="147" cy="172" r="1.8" fill="#ede1ae"/>
  </>:kind==='sash'?<>
   <path d="m127 147 14 7-34 24-46 29H37l16-11 41-30Z" fill="#af7660" stroke="#3f2e30" strokeWidth="1.8"/>
   <path d="m132 152-34 22-45 30m80-48-35 23-34 21m-1-5 9-9m12-3 10-9" fill="none" stroke="#e9c393" strokeWidth="1.3"/>
  </>:null}
 </g>
}

export function PlayerPortrait({look,label='Your avatar',className,decorative=false}:{look:number,label?:string,className?:string,decorative?:boolean}){
 const hatch=useId()+'-wardrobe-hatch'
 const outfit=lookToOutfit(look)
 const description=[name(masks,outfit.mask),name(cloaks,outfit.cloak),name(clasps,outfit.clasp),outfit.dye==='original'?'':name(dyes,outfit.dye),outfit.extra==='none'?'':name(extras,outfit.extra)].filter(Boolean).join(', ')
 return <svg className={className?'wardrobe-portrait '+className:'wardrobe-portrait'} viewBox="0 0 180 220"
  role={decorative?undefined:'img'} aria-hidden={decorative||undefined} aria-label={decorative?undefined:label+': '+description}
  data-player-look={appearancePreset(look)??0} focusable="false">
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
  <CloakArt kind={outfit.cloak} dye={outfit.dye}/><ExtraArt kind={outfit.extra}/><MaskArt kind={outfit.mask}/><ClaspArt kind={outfit.clasp}/>
  <path d="M10 205h160v9H10Z" fill="#392923" stroke="#a77d55" strokeWidth="1.05"/>
  <path d="M19 209h60m22 0h60m-71 3 4-3-4-3-4 3Z" fill="none" stroke="#c79b68" strokeWidth=".9"/>
 </svg>
}

const drawers=[
 ['mask','Mask','Masks',masks],['cloak','Cloak','Cloak cuts',cloaks],['dye','Dye','Fabric dyes',dyes],
 ['clasp','Pin','Clasps',clasps],['extra','Extra','Accessories',extras],
] as const
type Drawer=typeof drawers[number]
type Piece=Drawer[3][number][0]

function DrawerSeal({kind}:{kind:keyof Outfit}){
 const marks={
  mask:'M3 5l7 1 7-1-1 7-6 5-6-5Zm2 4 3 1m4 0 3-1',
  cloak:'M5 4l5 2 5-2 3 12-8 2-8-2Zm5 2v12',
  dye:'M10 2c1 4 6 7 6 11a6 6 0 0 1-12 0c0-4 5-7 6-11Zm-3 10q0 2 2 3',
  clasp:'m10 2 7 8-7 8-7-8Zm0 4 4 4-4 4-4-4Z',
  extra:'M3 7q7 12 14 0M3 7V5m14 2V5m-7 8 3 3-3 2-3-2Z',
 }
 return <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false"><path d={marks[kind]}/></svg>
}

function Swatch({kind,piece,outfit}:{kind:keyof Outfit;piece:Piece;outfit:Outfit}){
 const view=kind==='mask'?'28 22 128 125':kind==='cloak'||kind==='dye'?'12 27 156 181':kind==='clasp'?'79 139 34 34':
  piece==='rose'?'30 145 50 51':piece==='shoulder'?'107 141 54 47':piece==='sash'?'32 143 114 68':'36 143 105 53'
 return <svg viewBox={view} aria-hidden="true" focusable="false">
  {kind==='mask'?<MaskArt kind={piece as Mask}/>:kind==='cloak'?<CloakArt kind={piece as Cloak} dye={outfit.dye}/>:kind==='clasp'?<ClaspArt kind={piece as Clasp}/>:kind==='dye'?<CloakArt kind={outfit.cloak} dye={piece as Dye}/>:piece==='none'?<path d="M80 154a14 14 0 1 1 0 28 14 14 0 0 1 0-28Zm-10 24 20-20" fill="none" stroke="#c8a579" strokeWidth="2.6" strokeLinecap="round"/>:<ExtraArt kind={piece as Extra}/>}
 </svg>
}

function OutfitChoices({drawer,outfit,choose}:{drawer:Drawer;outfit:Outfit;choose:(kind:keyof Outfit,value:Piece)=>void}){
 const id=useId()
 const [kind,,legend,choices]=drawer
 return <fieldset className="wardrobe-choices">
  <legend>{legend} <span>{choices.length} options</span></legend><div className="wardrobe-options">
   {choices.map(([piece,label])=><label key={piece} title={label}>
    <input className="sr" type="radio" name={id} value={piece} checked={piece===outfit[kind]} onClick={()=>{if(piece===outfit[kind])choose(kind,piece)}} onChange={()=>choose(kind,piece)}/>
    <Swatch kind={kind} piece={piece} outfit={outfit}/>
    <span className="sr">{label}</span>
   </label>)}
  </div>
  <p className="wardrobe-selection" aria-live="polite">{name(choices,outfit[kind])}</p>
 </fieldset>
}

export function PlayerWardrobe(){
 const [selected,setSelected]=useState(getPlayerLook)
 const [durable,setDurable]=useState(()=>unsavedLook===undefined)
 const [preview,setPreview]=useState(0)
 const [current,setCurrent]=useState<keyof Outfit>('mask')
 const title=useId(),categoryId=useId()
 const look=selected??preview,outfit=lookToOutfit(look)
 const drawer=drawers.find(item=>item[0]===current)??drawers[0]
 function choose(kind:keyof Outfit,value:Piece){
  const next=outfitToLook({...outfit,[kind]:value})
  setSelected(next)
  setDurable(saveLook(next))
 }
 function surprise(){
  const next=(look+1+Math.floor(Math.random()*(appearanceCount-1)))%appearanceCount
  setSelected(next)
  setDurable(saveLook(next))
 }
 function autoDeal(){
  setPreview(look)
  setSelected(null)
  setDurable(saveLook(null))
 }
 return <section className="player-wardrobe" aria-labelledby={title}>
  <header className="wardrobe-title"><h2 id={title}>Player wardrobe</h2><span>Optional</span></header>
  <div className="wardrobe-categories" role="group" aria-label="Outfit categories">
   {drawers.map(([key,label])=><button key={key} type="button" aria-pressed={key===current} aria-controls={categoryId} onClick={()=>setCurrent(key)}>
    <DrawerSeal kind={key}/><span>{label}</span>
   </button>)}
  </div>
  <div className="wardrobe-body">
   <div className="wardrobe-frame"><PlayerPortrait look={look}/><span role="status">{selected===null?'Room picks for you':durable?'Your outfit · saved':'Your outfit · this visit'}</span></div>
   <div className="wardrobe-controls" id={categoryId}>
    <OutfitChoices drawer={drawer} outfit={outfit} choose={choose}/>
   </div>
  </div>
  <footer className="wardrobe-foot">
   <button type="button" onClick={surprise} aria-label="Shuffle outfit">
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false"><path d="m4 6 6-3 6 3v8l-6 3-6-3Zm0 0 6 3 6-3m-6 3v8"/><path d="m7 11 .01 0m.99 2 .01 0m4-2 .01 0m1.99 1 .01 0"/></svg>Shuffle
   </button>
   <button type="button" onClick={autoDeal} aria-pressed={selected===null}>Auto-deal</button>
   <a href="#play">Skip outfit <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false"><path d="M3 10h13m-5-5 5 5-5 5"/></svg></a>
  </footer>
 </section>
}
