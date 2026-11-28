import {BigSmallLesson} from './big-small-ui'

export const extraLessons={
 bigSmall:{
  frames:[
   {title:'Read the reference',caption:'The dealer opens a 4. Both seats see it; only the duelist chooses a card.'},
   {title:'Seal a card and call',caption:'The duelist locks a card and a direction. Neither is shown to the bettor.'},
   {title:'Predict with chips',caption:'The bettor predicts Big and puts up two fictional chips. The sealed card stays face down.'},
   {title:'Score the difference',caption:'The duelist reveals 7 and a Big call. They gain three chips; the bettor gains two. Roles then swap.'},
   {title:'Break an exact tie',caption:'Most chips wins after eighteen rounds. Equal stacks play two fresh rounds with the starting role swapped. If still equal, draw.'},
  ] as const,
  render:(step:number)=> <BigSmallLesson step={step}/>
 }
}
