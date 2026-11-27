import {useId,useRef,type CSSProperties,type KeyboardEvent,type ReactNode} from 'react'
import './pact-tokens.css'

export type PactChoice={value:string;label:string;face:string;art:ReactNode;disabled?:boolean;count?:number}

export function PactChoices({label,kind,choices,value,choose,disabled}:{label:string;kind:'seats'|'tickets'|'coins';choices:PactChoice[];value:string;choose:(value:string)=>void;disabled?:boolean}){
 const title=useId(),refs=useRef(new Map<string,HTMLButtonElement>())
 const enabled=choices.filter(c=>!c.disabled)
 const first=enabled.some(c=>c.value===value)?value:enabled[0]?.value
 const step=(e:KeyboardEvent<HTMLButtonElement>,at:string)=>{
  if(disabled||!enabled.length)return
  const key=e.key, d=key==='ArrowRight'||key==='ArrowDown'?1:key==='ArrowLeft'||key==='ArrowUp'?-1:0
  const i=enabled.findIndex(c=>c.value===at)
  const next=d?enabled[(i+d+enabled.length)%enabled.length]:key==='Home'?enabled[0]:key==='End'?enabled.at(-1):undefined
  if(!next)return
  e.preventDefault()
  choose(next.value)
  refs.current.get(next.value)?.focus()
 }
 return <section className="pact-choices" data-kind={kind} role="radiogroup" aria-labelledby={title} aria-disabled={disabled||undefined}>
  <span id={title} className="pact-label">{label}</span>
  <div className="pact-row">{choices.map(option=><button key={option.value} type="button" role="radio" className="pact-token"
   aria-label={option.label} aria-checked={option.value===value} disabled={disabled||option.disabled} tabIndex={!disabled&&!option.disabled&&first===option.value?0:-1}
   ref={el=>{if(el)refs.current.set(option.value,el);else refs.current.delete(option.value)}} onKeyDown={e=>step(e,option.value)}
   onClick={()=>{if(!disabled&&!option.disabled)choose(option.value)}}>
   {option.art}<span>{option.face}</span>{option.count!==undefined&&<small aria-hidden="true" className="pact-quantity">×{option.count}</small>}
  </button>)}</div>
 </section>
}

export function SeatMark({seat,color}:{seat:number;color?:string}){
 const letter=seat<0?'–':String.fromCharCode(65+seat)
 return <svg className="pact-seat-mark" viewBox="0 0 38 38" aria-hidden="true" focusable="false" style={{'--seat-fill':color} as CSSProperties}>
  <path d="M19 1.5 31.5 6.5 36.5 19 31.5 31.5 19 36.5 6.5 31.5 1.5 19 6.5 6.5Z" className="pact-seat-rim"/>
  <circle cx="19" cy="19" r="12.7" className="pact-seat-enamel"/>
  <text x="19" y="24.3">{letter}</text>
 </svg>
}

const signs=['+','×','÷','−']
export function TicketMark({ticket}:{ticket:number}){
 return <svg className="pact-ticket-mark" viewBox="0 0 52 32" aria-hidden="true" focusable="false" data-ticket={ticket}>
  <path d="M4 3h44v7c-6 0-6 12 0 12v7H4v-7c6 0 6-12 0-12Z" className="pact-ticket-stock"/>
  <path d="M12 6v20m28-20v20" strokeDasharray="2 2" className="pact-ticket-perf"/>
  <text x="26" y="23">{signs[ticket]}</text>
 </svg>
}

export function CoinMark({points}:{points:number}){
 return <svg className="pact-coin-mark" viewBox="0 0 46 32" aria-hidden="true" focusable="false">
  {points>0?Array.from({length:points},(_,i)=>{
   const cx=points===1?23:17+i*12
   return <g key={i}><circle cx={cx} cy="17" r="11"/><circle cx={cx} cy="16" r="8.5"/><path d={`M${cx} 11v10m-4-5h8`}/></g>
  }):<><ellipse cx="23" cy="17" rx="12" ry="9" className="pact-coin-empty"/><path d="M18 17h10" className="pact-coin-empty"/></>}
 </svg>
}
