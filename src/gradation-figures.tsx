const surface={
 copper:{face:'#deb37a',rim:'#704428',bright:'#fbe1a5',shadow:'#a76946',ink:'#382918'},
 jade:{face:'#a9cbb0',rim:'#365747',bright:'#e4f1c9',shadow:'#709680',ink:'#18362e'},
} as const
type Metal=keyof typeof surface

export function GradationWeight({value,small=false,metal='copper'}:{value:number;small?:boolean;metal?:Metal}){
 const p=surface[metal],shoulder=19-(value-1)*.45,foot=8-(value-1)*.42
 return <svg aria-hidden="true" data-grad-art="weight" className={'grad-weight'+(small?' small':'')} viewBox="0 0 44 57">
  <path d={`M17 ${shoulder+1}V10q-1-6 5-6t5 6v${shoulder-9}`} fill="none" stroke={p.rim} strokeWidth="5" strokeLinecap="round"/>
  <path d="M17.5 11q-1-6 4.5-6 4 0 4.5 5" fill="none" stroke={p.bright} strokeWidth="1.4" strokeLinecap="round"/>
  <path d={`M${foot} 24q2-8 10-${24-shoulder}h11l${13-foot} 7 3.8 22-5.5 7-29-1L${foot-2} 48Z`} fill={p.face} stroke={p.rim} strokeWidth="1.45" strokeLinejoin="round"/>
  <path d={`M${foot} 24l9 3 20-5 4 25-5 6-25-1 2-7-4-21Z`} fill={p.shadow} opacity=".65"/>
  <path d={`M${foot+1} 24q4-6 8-${24-shoulder-4}m3 5 18-3m3 22 2 8-4 4m-19-1 3-4m-6-10 1-6m20-5 2 5`} fill="none" stroke={p.bright} strokeWidth="1.05" strokeLinecap="round" opacity=".84"/>
  <path d="m16 31 13-.5 4 4v9l-4 4-13-.5-3.5-4v-8z" fill={p.face} stroke={p.rim} strokeWidth=".8" opacity=".95"/>
  <text x="22.8" y="44" textAnchor="middle" fill={p.ink} fontFamily="Georgia,serif" fontSize="18" fontWeight="bold">{value}</text>
 </svg>
}

export function GradationSluice({gate,closed=false}:{gate:number;closed?:boolean}){
 return <svg className="grad-sluice" data-grad-art="sluice" viewBox="0 0 72 58" aria-hidden="true">
  <path d="M3 55V30C3 16 12 6 35 2c20 4 34 13 34 26v27Z" fill="#675139" stroke="#e7c880" strokeWidth="1.15" strokeLinejoin="round"/>
  <path d="M8 52V30C8 19 17 9 35 6c18 3 29 13 29 23v23Z" fill="#152f2a" stroke="#98774d" strokeWidth=".9"/>
  <path d="M11 51V31c0-10 9-19 24-21 16 2 25 11 25 20v21Z" fill={closed?'#6f7957':'#31574d'} stroke="#63846d" strokeWidth=".7"/>
  {closed?<path d="M12 27h46m-47 4h49m-49 5h49m-49 4h49m-49 6h49m-49 5h49M35 21v28" fill="none" stroke="#2b4a3c" strokeWidth="1.3"/>:
   <path d="M15 34c7-4 10-4 17-2m5 4c6 2 13 2 19-2M15 41c8-4 14-2 18 0m7 3c5 1 12-1 17-2M15 47c5-2 11-2 19 0" fill="none" stroke="#8fa385" strokeWidth=".7" opacity=".74" strokeLinecap="round"/>}
  <path d="M4 53h63M8 34v11m56-11v11M12 18l3-4m39 0 3 4M12 22l3-1m41 0 3 1" fill="none" stroke="#efce89" strokeWidth=".85" opacity=".7" strokeLinecap="round"/>
  <path d="m27 3 17 .2 3 4-3 7-16 .1-3-6z" fill="#b38952" stroke="#edcd90" strokeWidth=".85"/>
  <text x="35.8" y="11.2" textAnchor="middle" fontFamily="ui-monospace,monospace" fontSize="7.3" fontWeight="700" fill="#211e19">G{gate}</text>
  <g fill="#c4a56b" stroke="#3b4835" strokeWidth=".55"><circle cx="8" cy="29" r="1.8"/><circle cx="63" cy="29" r="1.8"/><circle cx="8" cy="50" r="1.8"/><circle cx="63" cy="50" r="1.8"/></g>
  {closed&&<path d="m35 27 6 4v7l-6 4-6-4v-7z" fill="#b08754" stroke="#e7c47e"/>}
 </svg>
}

export function GradationGauge(){
 return <svg className="grad-gauge" viewBox="0 0 40 40" aria-hidden="true">
  <path d="m13 2 17 1 8 9-1 17-9 9H12l-9-9V12Z" fill="#795b3c" stroke="#e4c786"/>
  <circle cx="20" cy="20" r="13.6" fill="#1b413a" stroke="#c4a779"/>
  <path d="M20 8v3m8 1-2 2m6 6h-3m-1 8 2 2m-10 2v-3M9 20h3m0-8 2 2" fill="none" stroke="#c4a779" strokeLinecap="round"/>
  <path d="m16 24 9-12-2 13-7 1z" fill="#e5c381"/>
  <circle cx="20" cy="20" r="2.3" fill="#bc8e56" stroke="#e8d6a4"/>
 </svg>
}
