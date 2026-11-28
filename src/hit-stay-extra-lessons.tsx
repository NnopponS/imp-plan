import type {LessonMap} from './lesson-book'
import {hitApply,hitStart,hitView,type HitCard} from './hit-stay'
import {HitCards,HitChip,HitFelt} from './hit-stay-art'

const deck=[8,7,7,10,5,...Array(47).fill(2)].map((rank,i):HitCard=>({rank,suit:i%2===0?'heart':'spade'}))
const deal=hitStart(['You','Rival'],4,0,20_000,[deck])
const hit=hitApply(deal,'You','hit',1)!
const choice=hitApply(hit,'Rival','stay',2)!
const shown=[deal,hit,choice,hitApply(choice,'You','stay',3)!].map(state=>hitView(state,'You'))
const frames=[
 {title:'Read your own cards',caption:'Everyone spends 2 fictional chips and receives two private cards. Start here with 15. The limit is 21.'},
 {title:'Hit to draw',caption:'Draw one card in private, then pass the turn. This 5 takes you to 20. Going above 21 busts.'},
 {title:'Stay to lock',caption:'Your rival has locked their hand. On your turn, stay at 20. No one can change a locked hand.'},
 {title:'Reveal and settle',caption:'Your 20 beats 17. Ties share the pot; all bust returns the antes. Highest stack after eight hands wins.'},
]
export const extraLessons:LessonMap={hitStay:{frames,render:step=>{
 const v=shown[step]
 const yours=v.mine??v.reveal?.rows[0]
 return <div className="hit-guide" data-hit-example={step}><HitFelt>
  <div className="hit-guide-pair"><HitCards cards={yours?.cards}/><div className="hit-total"><small>Your total</small><strong>{yours?.total}</strong></div></div>
  {v.reveal?<div className="hit-guide-payout"><HitChip/> +{v.reveal.paid} chips · rival 17</div>:<div className="hit-guide-payout">{step===0?<><HitChip/> 4 in pot</>:step===1?'Hit · one more card':'Stay · lock 20'}</div>}
 </HitFelt></div>
}}}
