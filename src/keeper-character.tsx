import {useId} from 'react'
import './keeper-character.css'

export type CharacterCue='glance'|'nod'|'signal'

/** Original paper-puppet keeper: each engraved layer can move independently. */
export function KeeperCharacter({cue}:{cue:CharacterCue}){
 const id=useId()
 return <svg className="keeper-character" data-character-cue={cue} viewBox="0 0 150 172" aria-hidden="true" focusable="false">
  <defs>
   <linearGradient id={id+'ivory'} x1="0" y1=".1" x2="1" y2=".85"><stop stopColor="#f7db9e"/><stop offset=".45" stopColor="#e9c68d"/><stop offset="1" stopColor="#a77954"/></linearGradient>
   <linearGradient id={id+'hood'} x1="0" y1=".1" x2=".92" y2=".88"><stop stopColor="#62413f"/><stop offset=".49" stopColor="#33292a"/><stop offset="1" stopColor="#2b2229"/></linearGradient>
   <linearGradient id={id+'cloak'} x1="0" y1="0" x2=".72" y2=".99"><stop stopColor="#9a6352"/><stop offset=".43" stopColor="#58404a"/><stop offset="1" stopColor="#2c2125"/></linearGradient>
   <radialGradient id={id+'glow'}><stop stopColor="#d4a778" stopOpacity=".32"/><stop offset="1" stopColor="#ba7854" stopOpacity="0"/></radialGradient>
  </defs>
  <ellipse className="keeper-halo" cx="79" cy="76" rx="70" ry="73" fill={`url(#${id}glow)`}/>
  <g className="keeper-body" strokeLinejoin="round">
   <path d="M20 169l6-25q5-19 27-29l14-9h25l13 7q22 6 31 29l7 27Z" fill={`url(#${id}cloak)`} stroke="#291b1a" strokeWidth="2.5"/>
   <path d="M29 154q15-20 35-27m-11 34 12-18m50-8 16 22" fill="none" stroke="#bc8a6b" strokeWidth="1.3" opacity=".55"/>
   <path d="M49 124q10-17 24-20h20q14 9 23 19l-32 14Z" fill="#6e3e33" stroke="#302023" strokeWidth="2"/>
   <path d="m58 120 26 8 23-9m-16 12-2 20" fill="none" stroke="#c58d62" strokeWidth="1.3" opacity=".8"/>
   <path d="m88 136 5 5-5 5-5-5Z" fill="#d6a268" stroke="#f0c287" strokeWidth=".85"/>
   <g className="keeper-head">
    <path d="M40 98Q29 80 31 60 30 31 54 14 77-1 102 13q24 13 28 43 4 25-10 52l-15 15-46-5Z" fill={`url(#${id}hood)`} stroke="#1e171a" strokeWidth="3"/>
    <path d="M41 66q-1-27 18-44 20-16 42 0 14 9 20 28m-77 46 8 8m62-9 7-11" fill="none" stroke="#d2a278" strokeWidth="1.4" opacity=".65"/>
    <path d="M46 58q3-19 14-30 17-11 35-5l11 10q10 14 6 35l-6 13-6 18-15 12-16-3-9-9-1-10-12-10 6-13Z" fill={`url(#${id}ivory)`} stroke="#422923" strokeWidth="2.4"/>
    <path d="M57 49q11-15 25-18l-12 10-13 19m39-24q11 12 6 31l-8 12-5 18-13 9m-22-27 13 2m5 14q9 3 16-4" fill="none" stroke="#a67850" strokeWidth="1.25" opacity=".65"/>
    <path d="M54 57q6-6 16-3m13-6q9-8 19-5" fill="none" stroke="#70503c" strokeWidth="1.42" strokeLinecap="round"/>
    <g className="keeper-eyes">
     <path d="M56 61q7-7 17-2-7 9-14 6Zm25-6q8-11 23-11-6 13-18 14Z" fill="#3d2929"/>
     <g className="keeper-pupils" fill="#f5d6a2"><ellipse cx="65" cy="61" rx="2.5" ry="1.6"/><ellipse cx="93" cy="52" rx="2.7" ry="1.55"/></g>
     <path d="m63 61 2-.5m26-8 3-1" stroke="#fff1c9" strokeWidth=".75" strokeLinecap="round"/>
    </g>
    <path d="M71 82q7 1 10-2l6 5m-15 9q5 .3 11-2" fill="none" stroke="#77553e" strokeWidth="1.05" strokeLinecap="round"/>
   </g>
   <g className="keeper-hand">
    <path d="M102 169 95 153 93 135l5-7 5-13 3-14 4-3 3 3-2 15 6-8 7-5 4 1 1 3-7 9 6-4 4 2v3l-10 12-6 14 4 25Z" fill="#a16b52" stroke="#2a1c1a" strokeWidth="2.3"/>
    <path d="m99 133 8-14m1 12 9-12m-8 17 9-8m-16 24 13-2" fill="none" stroke="#e1ab79" strokeWidth="1.2" strokeLinecap="round"/>
    <path d="m93 148 22 4 8 18H99Z" fill="#563b3d" stroke="#382324" strokeWidth="1.8"/>
    <path d="m96 151 21 6" stroke="#cd9e74" strokeWidth="1.4"/>
   </g>
  </g>
 </svg>
}
