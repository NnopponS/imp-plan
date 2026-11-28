import {hiddenClues} from './hidden-word-lexicon'
import type {LessonMap} from './lesson-book'
import './hidden-word-lesson.css'

const frames=[
 {title:'Pick a hidden noun',caption:'Open your five-noun envelope. In this example you defend pear. In round 2 you choose one of the four unused nouns.'},
 {title:'Publish a broad clue',caption:'Start with a broad association. “Produce” fits several nouns, so its 95% rating does not point to just one answer.'},
 {title:'Seal your guesses',caption:'Readers submit in private. A fictional bonus seal buys a second guess once for this hidden word. Each reader has two seals for the match.'},
 {title:'Open together',caption:'Apple and grape both miss. The setter banks 1 point. If nobody solves stage 2 or 3, those stages add 2 and 3 more.'},
 {title:'Narrow the field',caption:'The next clue, “orchard harvest,” points to apple or pear. Apple was already ruled out. A correct guess gives the reader 1 point and ends the word.'},
 {title:'Double in round 2',caption:'Everyone sets once per round. All points in round 2 are doubled. Compare totals after both rounds; tied players share a rank.'},
] as const
const descriptions=[
 'Private envelope: apple, pear and three other slips. Pear is chosen.',
 'Public clue Produce, rated 95 percent, connects to six possible nouns.',
 'One reader seals apple and grape with a bonus seal. Another reader passes.',
 'Apple and grape are opened and miss. Setter plus one point.',
 'Orchard harvest at 97 percent. Apple eliminated. Pear is correct.',
 'Round one single points, round two double points. Highest total wins.',
]
const first=hiddenClues('pear',1)[0],next=hiddenClues('pear',2)[0]

function HiddenLesson({step}:{step:number}){
 return <svg className="hw-lesson" viewBox="0 0 420 190" role="img" aria-label={descriptions[step]} data-hidden-example={step} key={step}>
  <path d="M10 20 24 7h372l14 13v149l-14 14H24l-14-14Z" fill="#142d32" stroke="#a88b5f" strokeWidth="2"/>
  <path d="M22 29 31 19h358l9 10v132l-9 10H31l-9-10Z" fill="none" stroke="#785e44"/>
  <g className="hw-film-grid" stroke="#c9a574" strokeOpacity=".27" fill="none"><path d="M32 52h355m-357 91h358M210 22v147"/><circle cx="209" cy="97" r="51" strokeDasharray="1 5"/></g>
  <text className="hw-film-index" x="39" y="39">CASE STUDY / 01</text><text className="hw-film-index" x="381" y="39" textAnchor="end">0{step+1}</text>
  {step===0&&<>
   <g className="hw-film-rise"><path d="M80 74 220 74v53H80Z" className="hw-film-card"/><text x="104" y="107">apple</text></g>
   <g className="hw-film-rise hw-film-late"><path d="M187 63h145v58H187Z" className="hw-film-highlight"/><text x="211" y="98">pear</text><path d="m296 88 5 6 11-12" className="hw-film-check"/></g>
   <g className="hw-film-fade"><text x="210" y="153" textAnchor="middle" className="hw-film-index">PRIVATE / FIVE NOUNS</text></g>
  </>}
  {step===1&&<>
   <g className="hw-film-rise"><path d="M60 60h300v47H60Z" className="hw-film-card"/><text x="75" y="90">{first.word}</text><text x="342" y="90" textAnchor="end">{first.score}%</text></g>
   {[140,168,196,224,252,280].map(x=><circle key={x} cx={x} cy="126" r="5.5" className="hw-film-discovery"/>)}
   <text x="210" y="154" textAnchor="middle" className="hw-film-index">BROAD ASSOCIATION</text>
  </>}
  {step===2&&<>
   <g className="hw-film-rise"><path d="M60 66h140l-70 38Z" className="hw-film-card"/><path d="M60 66v57h140V66l-70 38Z" className="hw-film-card"/><path d="m130 93 10 10-10 10-10-10Z" className="hw-film-wax"/></g>
   <g className="hw-film-rise hw-film-late"><path d="M222 66h140l-70 38Z" className="hw-film-card"/><path d="M222 66v57h140V66l-70 38Z" className="hw-film-card"/><path d="m292 93 10 10-10 10-10-10Z" className="hw-film-wax"/></g>
   <text x="130" y="153" textAnchor="middle" className="hw-film-index">ANSWER SEALED</text>
   <text x="292" y="153" textAnchor="middle" className="hw-film-index">BONUS SEALED</text>
  </>}
  {step===3&&<>
   <g className="hw-film-rise"><path d="M64 59h170v29H64Z" className="hw-film-card"/><text x="76" y="80">apple</text><path d="m189 67 12 12m0-12-12 12" className="hw-film-cross"/></g>
   <g className="hw-film-rise hw-film-late"><path d="M64 98h170v29H64Z" className="hw-film-card"/><text x="76" y="119">grape</text><path d="m189 106 12 12m0-12-12 12" className="hw-film-cross"/></g>
   <g className="hw-film-fade"><circle cx="308" cy="95" r="33" className="hw-film-wax"/><text x="308" y="102" textAnchor="middle" className="hw-film-light">+1</text></g>
   <text x="308" y="153" textAnchor="middle" className="hw-film-index">SETTER POINT</text>
  </>}
  {step===4&&<>
   <g className="hw-film-rise"><path d="M62 57h296v35H62Z" className="hw-film-card"/><text x="74" y="81">{next.word}</text><text x="342" y="81" textAnchor="end">{next.score}%</text></g>
   <g><text x="152" y="121" textAnchor="middle" className="hw-film-light">apple</text><path d="M112 116h78" className="hw-film-cross"/></g>
   <g className="hw-film-rise hw-film-late"><path d="M225 100h107v32H225Z" className="hw-film-highlight"/><text x="234" y="120">pear</text><path d="m294 115 5 6 11-12" className="hw-film-check"/></g>
   {[78,98,118,138,158,178].map((x,i)=><g key={x} className={i<4?'hw-film-outsider':i===4?'hw-film-eliminated':'hw-film-keep'}>
    <circle cx={x} cy="150" r="4"/>
    {i===4&&<path d={`M${x-6} 155l12-10`} stroke="#f0b090" strokeWidth="1.5"/>}
   </g>)}
   <text x="277" y="153" textAnchor="middle" className="hw-film-index">+1 READER POINT</text>
  </>}
  {step===5&&<>
   <g className="hw-film-rise"><path d="M68 64h132v64H68Z" className="hw-film-card"/><text x="134" y="88" textAnchor="middle">Round 1</text><text x="134" y="113" textAnchor="middle" className="hw-film-points">×1</text></g>
   <g className="hw-film-rise hw-film-late"><path d="M220 64h132v64H220Z" className="hw-film-highlight"/><text x="286" y="88" textAnchor="middle">Round 2</text><text x="286" y="113" textAnchor="middle" className="hw-film-points">×2</text></g>
   <text x="210" y="153" textAnchor="middle" className="hw-film-index">HIGHEST TOTAL WINS</text>
  </>}
 </svg>
}

export const extraLessons:LessonMap={hiddenWord:{frames,render:step=><HiddenLesson step={step}/>}}
