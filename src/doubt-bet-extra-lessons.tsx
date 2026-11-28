import type {LessonMap} from './lesson-book'
import {DoubtCardArt,DoubtChip} from './doubt-bet-art'
import type {DoubtCard} from './doubt-bet'
import './doubt-bet.css'

const shown=[['red','wild','blue','green','purple'],['red',undefined,undefined,undefined,undefined],['blue',undefined,undefined,undefined,undefined],['blue','wild','yellow','blue','green']] satisfies (DoubtCard|undefined)[][]
const captions=['Only your hand opens','2 red · one point','3 blue · a higher claim','3 matches · two blue + one wild']
const frames=[
 {title:'Read your private cards',caption:'You only see your own cards. The wild can stand for any claimed color.'},
 {title:'Name a color and count',caption:'Claim at least two red cards across everyone’s hands. Stake a point or a removable slot.'},
 {title:'Raise the count or doubt',caption:'Accept with a higher count in any color, or doubt and match or counter the wager.'},
 {title:'Reveal on a call',caption:'Two blue cards and a wild make three, so the claim stands. A fold keeps cards hidden.'},
]
export const extraLessons:LessonMap={doubtBet:{frames,render:step=><div key={step} className="db-example" data-doubt-bet-example={step} aria-label={captions[step]}>
 <div className="db-hand">{shown[step].map((card,i)=><DoubtCardArt key={i} card={card} highlight={step===3&&(card==='blue'||card==='wild')}/>)}</div>
 <p>{step===1?<DoubtChip/>:step===2?<DoubtChip slot/>:null}{captions[step]}</p>
</div>}}
