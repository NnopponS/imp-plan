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
 return <div className="codex-scene" aria-hidden="true">
  <picture className="landing-painting">
   <source media="(max-width:685px)" srcSet={base+'art/landing-hero-mobile.svg'}/>
   <img src={base+'art/landing-hero.svg'} width={1200} height={660} alt="" loading="eager" decoding="async" fetchPriority="high"/>
  </picture>
  <svg className="codex-spread" viewBox="0 0 1000 380" preserveAspectRatio="none" aria-hidden="true" focusable="false">
   <defs>
    <clipPath id="codex-leaves" clipPathUnits="objectBoundingBox">
     <path transform="scale(.001 .002631578947)" d="M500 39C360 1 198 2 47 27Q33 30 30 46L18 295Q17 307 32 308C212 287 370 307 500 357C630 307 788 287 968 308Q983 307 982 295L970 46Q967 30 953 27C802 2 640 1 500 39Z"/>
    </clipPath>
    <linearGradient id="codex-metal" x1="0" x2="0" y1="0" y2="1">
     <stop stopColor="#dcc18c"/><stop offset=".52" stopColor="#9c764d"/><stop offset="1" stopColor="#cb9a64"/>
    </linearGradient>
    <linearGradient id="codex-gutter">
     <stop stopColor="#1a0d0e" stopOpacity="0"/><stop offset=".45" stopColor="#1a0d0e" stopOpacity=".45"/><stop offset=".5" stopColor="#b18b5c" stopOpacity=".5"/><stop offset=".56" stopColor="#28170f" stopOpacity=".36"/><stop offset="1" stopColor="#2a1913" stopOpacity="0"/>
    </linearGradient>
   </defs>
   <g fill="none" strokeLinejoin="round">
    <path className="codex-cover" d="M25 35 8 53 3 315Q3 332 26 333C211 312 364 327 495 374Q500 377 505 374C636 327 789 312 974 333Q997 332 997 315L992 53 975 35 968 295 500 350 32 295Z"/>
    <path className="codex-paper-edges" d="M30 41 16 52 10 310Q10 325 30 326C210 303 363 322 500 368C637 322 790 303 970 326Q990 325 990 310L984 52 970 41 961 290 500 350 39 290Z"/>
    <path className="codex-leaf-ruling" d="M10 313Q11 322 29 321C209 298 364 318 500 363C636 318 791 298 971 321Q989 322 990 313M12 308Q13 315 29 315C210 293 369 313 500 360C631 313 790 293 971 315Q987 315 988 308"/>
    <path className="codex-leaf-outline" d="M500 39C360 1 198 2 47 27Q33 30 30 46L18 295Q17 307 32 308C212 287 370 307 500 357C630 307 788 287 968 308Q983 307 982 295L970 46Q967 30 953 27C802 2 640 1 500 39Z"/>
    <path className="codex-leaf-ruling" d="M39 46Q42 39 55 37C213 13 360 18 493 49M507 49C640 18 787 13 945 37Q958 39 961 46M31 295C204 273 369 293 491 342M509 342C631 293 796 273 969 295"/>
    <path className="codex-gutter" d="M455 30 500 39 545 30V340L500 357 455 340Z"/>
    <path className="codex-seam" d="M498 46V348m4-302v302"/>
   </g>
  </svg>
 </div>
}
export function ChapterArt({season}:{season:number}){
 return <img className="chapter-painting" src={base+'art/landing-season-'+season+'.svg'} width={640} height={390} alt="" loading="lazy" decoding="async"/>
}
