import type {KeyboardEvent,ReactNode} from 'react'

type ChoiceValue=string|number|boolean
type Choice<T extends ChoiceValue>={value:T;label:string;face:ReactNode;className?:string}

export function InstrumentPicker<T extends ChoiceValue>({label,options,value,select,disabled=false,className}:{label:string;options:readonly Choice<T>[];value:T;select:(value:T)=>void;disabled?:boolean;className:string}){
 function position(e:KeyboardEvent<HTMLButtonElement>,i:number){
  let next=i
  if(e.key==='ArrowUp'||e.key==='ArrowLeft')next=(i+options.length-1)%options.length
  else if(e.key==='ArrowDown'||e.key==='ArrowRight')next=(i+1)%options.length
  else if(e.key==='Home')next=0
  else if(e.key==='End')next=options.length-1
  else return
  e.preventDefault()
  const button=e.currentTarget.parentElement?.children.item(next)
  if(button instanceof HTMLButtonElement)button.focus()
  select(options[next].value)
 }
 const selectedIndex=options.findIndex(choice=>Object.is(value,choice.value))
 return <div className={className} role="radiogroup" aria-label={label}>
  {options.map((choice,i)=>{
   const selected=Object.is(value,choice.value)
   return <button key={String(choice.value)} type="button" className={choice.className} role="radio" aria-label={choice.label} aria-checked={selected} disabled={disabled}
    tabIndex={!disabled&&i===Math.max(0,selectedIndex)?0:-1} onKeyDown={e=>position(e,i)} onClick={()=>select(choice.value)}>{choice.face}</button>
  })}
 </div>
}
