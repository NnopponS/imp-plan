/** S3-22: original fan memory table based on the owner's handoff, not a verified broadcast reproduction. */
export const flagsStudyWindow=40_000
export const flagsWindow=60_000

export type FlagsMode='recall'|'names'
export type FlagsClue={code:string;description:string;symbol:string}
export type FlagsStudyClue=FlagsClue&{name:string}
export type FlagsResult={seat:string;hits:number;misses:number;points:number;elapsed:number|null}
type FlagsPhase='study'|'answer'|'done'
export type FlagsView={
 phase:FlagsPhase;mode:FlagsMode;deadline:number|null;study:FlagsStudyClue[];options:FlagsClue[];names:string[];
 ownChoices:number[]|null;submitted:number;players:number;leaders:string[];results:FlagsResult[]|null;solutions:number[]|null
}
type Lock={choices:readonly number[];elapsed:number}
export type FlagsState=Readonly<{
 phase:FlagsPhase;mode:FlagsMode;deadline:number|null;opened:number;seats:readonly string[];
 study:readonly FlagsStudyClue[];options:readonly FlagsClue[];names:readonly string[];solutions:readonly number[];
 locked:Readonly<Record<string,Lock>>;leaders:readonly string[];results:readonly FlagsResult[]|null
}>

// Asset IDs f01–f24 follow this stable table order; do not put country codes in a projected clue.
const flags=[
 ['th','Thailand','Five horizontal stripes: red and white outside a double-width navy middle stripe.'],
 ['kr','South Korea','White field with a red and blue two-part centre disc and four groups of black bars.'],
 ['jp','Japan','A plain white field with a single red disc at its centre.'],
 ['id','Indonesia','Two equal horizontal bands, red above white, without an additional emblem.'],
 ['pl','Poland','Two equal horizontal bands, white above red, without an additional emblem.'],
 ['np','Nepal','Two stacked crimson triangular pennants edged in blue, with a white moon above a white sun.'],
 ['sg','Singapore','Red above white, with a white crescent and five stars in the upper hoist corner.'],
 ['my','Malaysia','Alternating red and white horizontal stripes, with a yellow crescent and star in a blue canton.'],
 ['vn','Vietnam','A plain red field with a large yellow five-pointed star at its centre.'],
 ['ph','Philippines','Blue above red with a white hoist triangle containing a gold sun and three stars.'],
 ['ca','Canada','A red maple leaf on a white centre panel between broad red vertical edges.'],
 ['gb','United Kingdom','A blue field crossed by layered red and white upright and diagonal crosses.'],
 ['fr','France','Three vertical bands, blue at the hoist, white in the middle and red on the fly.'],
 ['de','Germany','Three horizontal bands, black above red above gold.'],
 ['it','Italy','Three vertical bands, green at the hoist, white in the middle and red on the fly.'],
 ['br','Brazil','A yellow diamond on green holds a starry blue disc crossed by a white band.'],
 ['ar','Argentina','Two sky-blue bands flank a white middle band with a gold sun in the centre.'],
 ['za','South Africa','A green sideways Y edged in white and yellow divides red and blue bands and a black hoist triangle.'],
 ['ch','Switzerland','A centred white upright cross with equal arms on a plain red field.'],
 ['se','Sweden','A yellow upright cross with its vertical arm near the hoist on a blue field.'],
 ['fi','Finland','A blue upright cross with its vertical arm near the hoist on a white field.'],
 ['no','Norway','A navy cross outlined in white is offset toward the hoist of a red field.'],
 ['dk','Denmark','A white upright cross with its vertical arm near the hoist on a red field.'],
 ['gr','Greece','Alternating blue and white stripes with a white cross inside a blue canton.'],
] as const
const studyCount=12,optionCount=20

function seededPicker(seed:number){
 let state=seed|0
 return (size:number)=>{
  state=(state+0x6d2b79f5)|0
  let x=Math.imul(state^(state>>>15),1|state)
  x^=x+Math.imul(x^(x>>>7),61|x)
  return Math.floor(((x^(x>>>14))>>>0)/4294967296*size)
 }
}
function shuffled<T>(values:readonly T[],pick:(n:number)=>number):T[]{
 const out=values.slice()
 for(let i=out.length-1;i>0;i--){
  const j=pick(i+1)
  ;[out[i],out[j]]=[out[j],out[i]]
 }
 return out
}
const clockOK=(now:number)=>Number.isFinite(now)&&Math.abs(now)<=Number.MAX_SAFE_INTEGER-flagsWindow
const cardIndex=(n:unknown):n is number=>Number.isInteger(n)&&Number(n)>=0&&Number(n)<optionCount

export function flagsStart(seats:string[],seed:number,now:number,mode:FlagsMode='recall'):FlagsState{
 if(seats.length<1||seats.length>16||seats.some(s=>typeof s!=='string'||!s.trim())||new Set(seats).size!==seats.length)throw new TypeError('Expected 1–16 different flag-table seats.')
 if(!Number.isSafeInteger(seed)||!clockOK(now)||(mode!=='recall'&&mode!=='names'))throw new TypeError('Invalid flag-table settings.')
 const pick=seededPicker(seed)
 const serials=shuffled(Array.from({length:optionCount},(_,i)=>String(i+1).padStart(2,'0')),pick)
 const catalog=flags.map(([,name,description],i)=>({code:'f'+String(i+1).padStart(2,'0'),name,description}))
 const drawn=shuffled(catalog,pick).slice(0,optionCount).map((flag,i)=>({...flag,symbol:serials[i]}))
 const study=drawn.slice(0,studyCount)
 const options=shuffled(drawn,pick).map(({code,description,symbol})=>({code,description,symbol}))
 const names=mode==='names'?shuffled(study,pick).map(f=>f.name):[]
 const seen=new Set(study.map(f=>f.code))
 const solutions=mode==='names'?names.map(name=>options.findIndex(c=>c.code===study.find(f=>f.name===name)!.code)):
  options.flatMap((f,i)=>seen.has(f.code)?[i]:[])
 return {phase:'study',mode,opened:now,deadline:now+flagsStudyWindow,seats:[...seats],study,options,names,solutions,locked:{},leaders:[],results:null}
}

const owns=(state:FlagsState,seat:string)=>Object.hasOwn(state.locked,seat)

function outcome(state:FlagsState):FlagsState{
 const expected=new Set(state.solutions)
 const results=state.seats.map(seat=>{
  if(!owns(state,seat))return {seat,hits:0,misses:0,points:0,elapsed:null}
  const {choices,elapsed}=state.locked[seat]
  let hits=0,misses=0
  for(const [i,choice] of choices.entries()){
   if(choice===-1)continue
   if(state.mode==='recall'?expected.has(choice):state.solutions[i]===choice)hits++
   else misses++
  }
  return {seat,hits,misses,points:Math.max(0,hits-misses),elapsed}
 }).sort((a,b)=>b.points-a.points||(a.elapsed??Infinity)-(b.elapsed??Infinity)||0)
 const best=results[0]
 const leaders=results.filter(r=>r.points===best.points&&r.elapsed===best.elapsed).map(r=>r.seat)
 return {...state,phase:'done',deadline:null,results,leaders}
}

function validChoices(mode:FlagsMode,choices:readonly number[]):boolean{
 if(!Array.isArray(choices)||choices.length<1||choices.length>studyCount||(mode==='names'&&choices.length!==studyCount))return false
 const picked=new Set<number>()
 for(const choice of choices){
  if(choice===-1&&mode==='names')continue
  if(!cardIndex(choice)||picked.has(choice))return false
  picked.add(choice)
 }
 return picked.size>0
}

/** A lock is atomic and private until all seats lock or the host closes the timer. */
export function flagsStep(state:FlagsState,seat:string,choices:readonly number[],now:number):FlagsState|null{
 if(state.phase!=='answer'||state.deadline===null||!clockOK(now)||now<state.opened||now>=state.deadline||
    !state.seats.includes(seat)||owns(state,seat)||!validChoices(state.mode,choices))return null
 const next:FlagsState={...state,locked:{...state.locked,[seat]:{choices:[...choices],elapsed:now-state.opened}}}
 return Object.keys(next.locked).length===state.seats.length?outcome(next):next
}

/** A delayed study tick starts a full answer window rather than skipping the activity. */
export function flagsTick(state:FlagsState,now:number):FlagsState{
 if(state.deadline===null||!clockOK(now)||now<state.deadline)return state
 return state.phase==='study'?{...state,phase:'answer',opened:now,deadline:now+flagsWindow}:outcome(state)
}

export function flagsView(state:FlagsState,seat?:string):FlagsView{
 const done=state.phase==='done',studying=state.phase==='study'
 return {phase:state.phase,mode:state.mode,deadline:state.deadline,
  study:studying?state.study.map(flag=>({...flag})):[],
  options:studying?[]:state.options.map(flag=>({...flag})),
  names:studying?[]:[...state.names],
  ownChoices:seat!==undefined&&owns(state,seat)?[...state.locked[seat].choices]:null,
  submitted:Object.keys(state.locked).length,players:state.seats.length,
  leaders:done?[...state.leaders]:[],results:done?state.results!.map(row=>({...row})):null,
  solutions:done?[...state.solutions]:null}
}
