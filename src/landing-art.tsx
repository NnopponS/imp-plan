import {base} from './brand'

type Mark='door'|'table'|'book'|'lantern'|'search'|'arrow'
export function LandingMark({mark,className}:{mark:Mark;className?:string}){
 return <svg aria-hidden="true" className={className} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round">
  {mark==='door'?<><path d="M5 28h22M8 27V11a8 8 0 0 1 16 0v16M12 26V11a4 4 0 0 1 8 0v15M12 27l8 2V10"/><path d="M17.6 19h.4M3.5 11h2M26.5 11h2M4 19h2M26 19h2"/></>:
   mark==='table'?<><path d="m16 4 12 8-12 9-12-9 12-8Zm-9 11v9m18-9v9m-9-2v6m-7-17 12 8m-5-13 11 8m-5-6L10 16M5 22l11 7 11-7"/><circle cx="16" cy="12" r="2"/></>:
   mark==='book'?<><path d="M16 8C10 4 6 5 4 6v18c4-1 8 0 12 3 4-3 8-4 12-3V6c-2-1-6-2-12 2Zm0 0v19M8 10l4 1m-4 4 4 1m8-5 4-1m-4 6 4-1"/></>:
   mark==='lantern'?<><path d="M12 7V5a4 4 0 0 1 8 0v2M8 9h16l-3 3H11L8 9Zm3 3-2 11 3 4h8l3-4-2-11m-10 11h10m-5-2c-5 0-1-5 1-7 0 3 3 7-1 7Z"/><path d="m2 13 3 1m-3 5 3-1m22-4 3-1m-3 5 3 1"/></>:
   mark==='search'?<><circle cx="13.5" cy="13.5" r="7"/><path d="m19 19 7 7M9 14a5 5 0 0 1 5-5"/></>:<path d="M7 23 23 7m-11 0h11v11"/>}
 </svg>
}
export function LandingPainting(){
 return <picture className="landing-painting" aria-hidden="true">
  <source media="(max-width:685px)" srcSet={base+'art/landing-hero-mobile.svg'}/>
  <img src={base+'art/landing-hero.svg'} width={1200} height={660} alt="" loading="eager" decoding="async" fetchPriority="high"/>
 </picture>
}
export function ChapterArt({season}:{season:number}){
 return <img className="chapter-painting" src={base+'art/landing-season-'+season+'.svg'} width={640} height={390} alt="" loading="lazy" decoding="async"/>
}
