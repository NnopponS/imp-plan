import {useId,type ReactNode} from 'react'
import './piggy-bank-art.css'

export function PiggyCoin({color}:{color:'black'|'white'}){
 return <svg viewBox="0 0 48 48" className="piggy-coin" data-coin={color} aria-hidden="true">
  <circle cx="24" cy="25.5" r="20"/><circle cx="24" cy="23" r="19"/><circle cx="24" cy="23" r="14"/>
  {color==='black'?<path d="m24 14 9 9-9 9-9-9Zm0 3v12m-6-6h12"/>:<path d="M24 14v18M15 23h18m-15-6 12 12m0-12L18 29"/>}
 </svg>
}

export function PiggyFigure({bank,open=false}:{bank:number,open?:boolean}){
 const id=useId()
 return <svg className="piggy-figure" data-bank={bank} data-open={open||undefined} viewBox="0 0 144 100" aria-hidden="true">
  <defs><linearGradient id={id} x2=".32" y2="1" gradientUnits="objectBoundingBox"><stop stopColor="#f3bc83"/><stop offset=".48" stopColor="#bf7c51"/><stop offset="1" stopColor="#8d492c"/></linearGradient></defs>
  <ellipse cx="73" cy="89" rx="61" ry="5" fill="#120d0a" opacity=".45"/>
  <path d="M23 47C9 52 8 40 15 39c9-2 9 11 2 15-6 4-11 0-11-3" fill="none" stroke="#dba26b" strokeWidth="3" strokeLinecap="round"/>
  <path d="M28 72 28 86h17l6-12m39 1 4 11h17l1-22" fill="#a06743" stroke="#593323" strokeWidth="2"/>
  <path className="piggy-ceramic" d="M17 55c0-19 19-35 47-37 11-1 23 0 32 5l2-13 20 11-1 14c7 5 12 11 14 17h8v14h-15c-10 13-28 17-49 17-31 0-58-8-58-28Z" fill={'url(#'+id+')'} stroke="#593323" strokeWidth="2"/>
  <path d="M27 49c9-17 34-25 55-21m21-10 10 6-2 5M27 64c7 8 15 10 28 11m19 2c17 0 27-4 38-10" fill="none" stroke="#ffe2a7" strokeOpacity=".66" strokeWidth="1.4" strokeLinecap="round"/>
  <path d="M49 24h25" stroke="#592e20" strokeWidth="3.5" strokeLinecap="round"/>
  <circle cx="113" cy="46" r="3" fill="#39241a"/><path d="M134 56v4" stroke="#74452e" strokeWidth="2" strokeLinecap="round"/>
  <circle cx="72" cy="56" r="15" fill="#683923" opacity=".86"/><circle cx="72" cy="56" r="12.5" fill="none" stroke="#ebad73" strokeWidth=".8"/>
  <text x="72" y="61" textAnchor="middle" fontFamily="Georgia,serif" fontSize="15" fill="#ffe0a1">{bank}</text>
  {open&&<path d="m75 26-9 13 13 3-6 9 12 11-5 17" fill="none" stroke="#ffe091" strokeWidth="2.4" className="piggy-crack"/>}
 </svg>
}

export function PiggyShelf({label,bank,detail,selected=false,choose}:{label:string,bank:number|null,detail?:ReactNode,selected?:boolean,choose?:()=>void}){
 const content=<><span className="piggy-shelf-label">{label}</span>{bank===null?<span className="piggy-empty">Empty</span>:<PiggyFigure bank={bank}/>}<span className="piggy-shelf-detail">{detail??(bank===null?'Clear':'Bank '+bank)}</span></>
 return choose?<button className="piggy-shelf" type="button" aria-pressed={selected} onClick={choose} data-piggy-shelf={bank}>{content}</button>:
  <div className="piggy-shelf" data-selected={selected||undefined} data-piggy-shelf={bank??'empty'}>{content}</div>
}
