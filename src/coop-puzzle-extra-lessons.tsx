import {useId} from 'react'
import './coop-puzzle-lesson.css'

const frames=[
 {title:'Read the frame',caption:'Fill the rectangle. Each tray piece covers three to five squares.'},
 {title:'Fit one piece',caption:'Turn the elbow and place it inside the frame. Mirroring is optional in setup.'},
 {title:'Pass the turn',caption:'A placement or undo passes control. Anyone can suggest a fit; each seat gets 20 seconds.'},
 {title:'Close the mosaic',caption:'Each square scores one. Fill them all before five minutes or 20 + 3 turns per seat.'},
] as const
const colours=['#418475','#a46150','#a88948','#687f9a','#8b6e89','#648054']
const a='M0 0h24v12H12v12H0z',b='M24 0h12v24H12V12h12z'
export function RelayLesson({step}:{step:number}){
 const uid=useId().replace(/:/g,''),idx=Math.min(3,Math.max(0,step))
 return <figure className="relay-film" data-relay-frame={idx}><svg viewBox="0 0 300 115" role="img" aria-label={frames[idx].title}>
 <defs><pattern id={uid+'grid'} width="12" height="12" patternUnits="userSpaceOnUse"><rect width="12" height="12" fill="#e2cfaa" stroke="#877559" strokeWidth=".75"/><circle cx="6" cy="6" r=".7" fill="#a38c68"/></pattern></defs>
 <rect x=".5" y=".5" width="299" height="114" rx="6" fill="#eaddc5" stroke="#ac906b"/>
 <path d="M14 13h43m186 0h43M14 101h43m186 0h43" stroke="#ad9061" strokeWidth=".8"/>
 <g transform="translate(164 21)"><rect x="-5" y="-5" width="82" height="82" fill="#80644a" stroke="#584837"/><rect width="72" height="72" fill={'url(#'+uid+'grid)'}/>
 {idx>0&&<path d={a} className={idx===1?'relay-film-place':''} fill={colours[0]} stroke="#2d5145"/>}
 {idx===2&&<path d={b} fill="none" stroke="#74374c" strokeDasharray="3 2" className="relay-film-marker"/>}
 {idx===3&&Array.from({length:12},(_,i)=>i===0?null:<g key={i} transform={'translate('+(Math.floor(i/2)%2*36)+' '+(Math.floor(i/4)*24)+')'}><path d={i%2?b:a} fill={colours[(i+Math.floor(i/4))%6]} stroke="#554a36" className={i===11?'relay-film-close':''}/></g>)}
 </g>
 {idx===0?<g transform="translate(49 39)" stroke="#3b4b39"><path d={a} fill={colours[0]}/><g transform="translate(36 7)"><path d={b} fill={colours[1]}/></g></g>:
 idx===1?<><g transform="translate(78 48)"><path d={a} className="relay-film-turn" fill={colours[0]} stroke="#36503d"/></g><path d="M104 51q19-12 37-10m-7-4 7 4-6 6" fill="none" stroke="#976c3b" strokeWidth="1.8"/></>:
 idx===2?<g><circle cx="63" cy="48" r="12" fill="#397568"/><circle cx="118" cy="48" r="12" fill="#965842"/><g fill="white" textAnchor="middle" fontSize="12"><text x="63" y="52">1</text><text x="118" y="52">2</text></g><path d="M75 52q15 14 30 0m-6 1 6-1-1 6" stroke="#584938" fill="none"/><path d="m58 68 5-6 5 6z" className="relay-film-baton" fill="#8e653a"/></g>:
 <g fill="#3b594c" textAnchor="middle"><path d="m72 53 11 10 23-26" fill="none" stroke="#457c62" strokeWidth="5"/><text x="88" y="85" fontSize="12">36 / 36</text></g>}
 </svg></figure>
}
export const extraLessons={coopPuzzle:{frames,render:(step:number)=><RelayLesson step={step}/>}}
