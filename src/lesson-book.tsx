import type {ReactNode} from 'react'
import type {Game} from './engine'
import {RuleDemo,hasRuleDemo} from './rule-demo'
import {EngravedRule,hasEngravedRule} from './engraved-rule'
import {WallGoLesson} from './wall-go-ui'
import {HexLesson} from './hex-briefing'

export type LessonFrame={title:string;caption:string}
export type Lesson={frames:readonly LessonFrame[];render:(step:number)=>ReactNode}
export type LessonMap=Partial<Record<Game,Lesson>>
export type Variant={label:string;rules:string;demo:(step:number)=>ReactNode}
const frames=(values:readonly [string,string][])=>values.map(([title,caption])=>({title,caption}))

// The selected example frame bounds the pager, not the number of sentences in its rulebook.
const authored:Record<string,LessonFrame[]>={
 blind:frames([['Place a stone','Take turns on the 15 × 15 board.'],['Hide your side','Pick any cover. Its color never reveals who owns the stone.'],['Make five','Five stones of your side in a line reveal the board and win.']]),
 auction:frames([['Bank your time','Start with 60 seconds for eight rounds.'],['Seal a bid','Privately commit up to 15 seconds of your bank.'],['Reveal together','Everyone pays. The highest positive bid wins the reward; ties share it.'],['Break the tie','Most points wins. If tied, compare time left.']]),
 piece:frames([['Fill the silhouette','Choose a piece from the shared tray.'],['Rotate and fit','Keep every cell inside the shape without overlapping another piece.'],['Buy a clue','One clue spends 20 seconds of your four-minute clock.'],['Pass control','In a party, the next seat acts after every move.']]),
 morris:frames([['Place a stone','Take turns placing nine stones each on empty points.'],['Form a mill','Make a line of three, then remove an opposing stone.'],['Slide or fly','After setup, slide to a neighbour. With three stones left, fly to any open point.'],['Block your rival','A player with fewer than three stones or no legal move loses.']]),
 knight:frames([['Jump in an L','Jump two squares along one axis, then one across. Visit each square once.'],['Try a new route','Undo a move to explore another path.'],['Complete the tour','Finish the board. A closed tour must end one knight jump from the start.']]),
 remove:frames([['Keep one card','Discard the other card in secret.'],['Find the unique low','Here both 2s cancel; the unique 4 earns two chips.'],['Count your chips','Start with five chips. Compare totals after eight regular rounds.']]),
 fence:frames([['Close the loop','Draw one continuous fence that returns to its start.'],['Read a clue','The 2 needs exactly two of its four borders in the loop.'],['Rule out edges','Cross an edge to note that the fence cannot go there.']]),
 codeLock:frames([['Read the clues','Put four different cards in the order the clues describe.'],['Choose carefully','In a party, a wrong submission costs 15 seconds.'],['Try again','Solo practice lets you revise your answer.'],['Crack the code','An exact order wins. Otherwise, correct positions count.']]),
 wallGo:frames([['Move your pawn','Stay put or take up to two open steps without crossing the other pawn.'],['Build a wall','Place a wall on an adjacent open edge to finish your turn.'],['Divide the board','Once the pawns are separated, the larger connected territory wins.']]),
 hex:frames([['Memorize','Study the numbers. The real round gives you 30 seconds.'],['Remember positions','Letters replace the numbers and the target sum appears.'],['Choose a line','Pick three adjacent tiles in one straight line that add up to the target.']]),
 montage:frames([['Watch the faces','Remember each portrait as it passes.'],['Buzz on the repeat','Buzz before the repeated face disappears. A missed repeat ends the game.']]),
 colorLink:frames([['Place a pair','Choose two open cells for matching endpoints.'],['Accept or challenge','Accept the new pair, or challenge the whole layout.'],['Connect without crossing','Each path moves sideways or vertically, never through another path.'],['Race to route','After six accepted pairs, the first complete valid set of routes wins.']]),
 flags:frames([['Study the flags','Study 12 flags and their names for 40 seconds.'],['Recall the set','In Recall mode, mark only the flags you saw.'],['Match the names','In Name match mode, pair each study name with a flag.'],['Seal once','You have 60 seconds. Correct picks add one, mistakes subtract one.']]),
 threeRow:frames([['Make a Laurel line','Three Laurels in a line earn three points for the Allies.'],['Bluff with a Thorn','Either side can stamp a Thorn. A mark alone does not identify the Saboteur.'],['Seal a ballot','Privately choose another player as your suspect.'],['Count the votes','A strict majority of Allies must find the Saboteur for two points.']]),
 symmetry:frames([['Find the mirror','Match the outline on both sides of the marked axis.'],['Join the pieces','Keep tiles edge-connected. Do not overlap.'],['Match the outline','Use every tile to complete a symmetric shape.']]),
 heavy13:frames([['Lock a pair','Choose one number and one color. Rainbow acts first and can use any stand.'],['Cross thirteen','If the total reaches 13, collect the old cubes as penalties. Leave your new cube.']]),
 episode:frames([['Study the cards','Memorize 16 positions in 20 seconds.'],['See the shared cards','The grid turns over and three community cards appear.'],['Lock your pair','Privately choose two positions to complete your five-card hand.'],['Compare hands','An exact tie deals a fresh board. No betting.']]),
 hold:frames([['Enter the countdown','Start with ten minutes. Press and hold to enter the round.'],['Pass for free','Release before five seconds and spend nothing.'],['Qualify your hold','At five seconds or more, the whole hold comes out of your bank.'],['Win a token','The longest untied qualifying hold wins. After 19 rounds, compare tokens then time.']])
}
function HoldLesson({step}:{step:number}){
 const t=[0,3,8,8][step]
 return <svg role="img" aria-label={'Example hold: '+t+' seconds'+(step===3?', highest untied hold wins one token':'')} viewBox="0 0 300 145" className="brief-hold">
  <rect x="14" y="16" width="272" height="112" rx="5" fill="#31261e" stroke="#a78154"/><g textAnchor="middle"><text x="150" y="46" fill="#f5dbab" fontSize="17" fontFamily="Georgia">{['Press and hold','3 s · free pass','8 s · qualifying hold','8 s  ›  6 s  ›  5 s'][step]}</text>
  <path d="M43 81H257" stroke="#846b50" strokeWidth="4"/><path d={'M43 81h'+t*21.4} stroke="#efd18e" strokeWidth="5"/>
  <path d="M150 70V90" stroke="#d5b588" strokeWidth="2"/><circle cx={43+t*21.4} cy="81" r="7" fill="#fff0c8"/>
  <text x="150" y="113" fill="#ead0a4" fontSize="12">{step===3?'WINNER  +1 TOKEN':'5 s minimum'}</text></g>
 </svg>
}
const modules=import.meta.glob<{extraLessons:LessonMap}>(['./extra-lessons.tsx','./*-extra-lessons.tsx'],{eager:true})
const extras:LessonMap=Object.assign({},...Object.values(modules).map(m=>m.extraLessons))
const bagh=Object.values(import.meta.glob<{baghFrames:Lesson['frames'];BaghLesson:(p:{step:number})=>ReactNode}>('./bagh-lesson.tsx',{eager:true}))[0]
export function lessonFor(game:Game,variant?:Variant,hold=false):Lesson|undefined{
 if(game==='auction'&&hold)return {frames:authored.hold,render:s=><HoldLesson step={s}/>}
 if(game==='bagh'&&bagh)return {frames:bagh.baghFrames,render:s=><bagh.BaghLesson step={s}/>}
 if(game==='memoryPoker'&&variant)return {frames:authored.episode,render:variant.demo}
 if(extras[game])return extras[game]
 if(!authored[game])return
 if(variant)return {frames:authored[game],render:s=>variant.demo(game==='heavy13'&&s===1?5:game==='colorLink'&&s===3?4:s)}
 const render=game==='hex'?(s:number)=><HexLesson step={s}/>:game==='wallGo'?(s:number)=><WallGoLesson step={s}/>:hasRuleDemo(game)?(s:number)=><RuleDemo game={game} step={s}/>:hasEngravedRule(game)?(s:number)=><EngravedRule game={game} step={s}/>:undefined
 return render?{frames:authored[game],render}:undefined
}
