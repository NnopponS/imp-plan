import {useId} from 'react'
import {base} from './brand'
import './intro-story.css'

export const storyLength=30000
export const storyBeats=[
 {at:0,id:'gather',no:'00 / THE INVITATION',title:'The Sixteen Seats',line:'Sixteen strangers. Four tables. One sealed door.'},
 {at:3900,id:'mill',no:'01 / THE FIRST TABLE',title:'Close the Mill',line:'Three stones in a line. The first seal is theirs.'},
 {at:9000,id:'auction',no:'02 / THE SECOND TABLE',title:'Bid Against the Clock',line:'Four hands commit. The highest bid claims the seal.'},
 {at:14100,id:'fence',no:'03 / THE THIRD TABLE',title:'Find the Way Through',line:'One fence redirects the race. An open route must remain.'},
 {at:19200,id:'color',no:'04 / THE FOURTH TABLE',title:'Join the Colors',line:'Two colors. Two routes. Neither may cross the other.'},
 {at:24400,id:'summon',no:'05 / THE SEALED DOOR',title:'Bring the Seals Together',line:'Four wins were not the prize. They were the key.'},
 {at:27800,id:'seal',no:'06 / THE OPEN DOOR',title:'The next seat is yours.',line:'Enter the Strategy Chambers.'},
] as const

type TableKind='mill'|'auction'|'fence'|'color'
const tables=[
 {id:'mill',roman:'I',ink:'#ab5b49',colors:['#925548','#6f6351','#aa704b','#5b4f63']},
 {id:'auction',roman:'II',ink:'#559083',colors:['#466b61','#716f4b','#925f43','#627490']},
 {id:'fence',roman:'III',ink:'#bc965d',colors:['#96744c','#56636c','#80626d','#5d6247']},
 {id:'color',roman:'IV',ink:'#777c9b',colors:['#58566c','#786d50','#59665d','#875d51']},
] as const
const nodes=[[0,0],[196,0],[0,130],[196,130]] as const
const seats=[[-158,-57],[158,-57],[-158,63],[158,63]] as const
type Table=(typeof tables)[number]

function Puppet({number,color,mirror,active,assetId}:{number:number;color:string;mirror:boolean;active:boolean;assetId:string}){
 const clip=assetId+'-face'
 return <g data-story-player={number} data-reaching={active||undefined}>
  <ellipse cx="0" cy="47" rx="31" ry="8" fill="#100d0b" opacity=".78"/>
  <g transform={mirror?'scale(-1 1)':undefined}>
   <g className="intro-puppet"><g className="intro-puppet-gesture">
    <path d="M-24 43l3-20 17-6 6 27m-2 0 6-27 14 6 4 21" fill="#342821" stroke="#130f0c" strokeWidth="2"/>
    <path d="M-26 41q8-7 18-4l5 7v4h-26zm29 3 4-7q11-3 19 4l3 7H3Z" fill="#211815" stroke="#17110e" strokeWidth="2"/>
    <path d="M-32 3q4-17 23-21h19q20 5 23 21l-4 24-13-1-3-10 4 19q-19 8-35 0l3-19-3 11-12-1Z" fill={color} stroke="#1e1512" strokeWidth="2.2"/>
    <path d="M-23-1q11 1 15-10l8 11 8-11q4 12 17 11M0 5v27m-13-4 7 2m16-1 6-3m-35 6q21 5 38-1" fill="none" stroke="#edcc89" opacity=".64" strokeWidth="1.15"/>
    <path d="m0 7 3 4-3 4-3-4Zm0 15 2 2-2 2-2-2Z" fill="#dcbb83"/>
    <defs><clipPath id={clip}><path d="M-24-41q2-22 24-23 21 1 24 22l-6 21-10 12h-16l-10-12Z"/></clipPath></defs>
    <g className="intro-puppet-head">
     <path d="M-24-42q1-22 24-24 22 1 25 23l-6 23-11 11h-16l-12-12Z" fill="#bb8f68" stroke="#1a110f" strokeWidth="2"/>
     <g clipPath={`url(#${clip})`}><image href={base+'art/montage/p'+String(number-1).padStart(2,'0')+'.svg'} width="75" height="90" x="-37.5" y="-72"/></g>
    </g>
    <g className="intro-puppet-arm">
     <path d="M21-2q9-2 15 9l7 12 11-5 3 8-16 11q-5 2-9-3L21 16" fill={color} stroke="#221614" strokeWidth="2" strokeLinejoin="round"/>
     <path d="m51 15 4-4 3 1 5-1 4 5-5 5-6 2Z" fill="#ca9c77" stroke="#493028" strokeWidth="1.5"/>
     <path d="m44 24 4-3m11-5 4-2" stroke="#f5d0a0" strokeWidth="1" opacity=".7"/>
    </g>
   </g></g>
  </g>
 </g>
}

function Mill(){
 const stones=[[0,16],[18,16],[8,-3],[-36,-16],[-18,-16],[36,16],[-36,0],[-18,8]]
 return <>
  <path d="M-62-37H62V37H-62Z" fill="#c69a64" stroke="#573620" strokeWidth="2"/>
  <path d="M-49-30H49V30H-49ZM-36-23H36V23H-36ZM-21-15H21V15H-21ZM0-30V-15M0 15V30M-49 0h28m42 0h28" fill="none" stroke="#633c26" strokeWidth="1.2"/>
  {stones.map(([x,y],i)=><ellipse key={i} cx={x} cy={y} rx="5" ry="3.7" fill={i<3?'#4a2c28':'#dfc795'} stroke="#704b2e" strokeWidth=".75"/>)}
  <path className="intro-completion" d="M-21-15H21" stroke="#ffe5a2" strokeWidth="4" strokeLinecap="round"/>
  <ellipse cx="0" cy="-15" rx="5" ry="3.7" fill="#9f3f34" stroke="#efb583"/>
  <ellipse cx="21" cy="-15" rx="5" ry="3.7" fill="#9f3f34" stroke="#efb583"/>
  <ellipse className="intro-stone" data-story-move="close-the-mill" cx="-21" cy="-15" rx="6" ry="4.8" fill="#9f3f34" stroke="#efb583" strokeWidth="1.2"/>
 </>
}
function Auction(){
 return <>
  <path d="M0-32q25 1 25 22 0 17-25 18-25-1-25-18 0-20 25-22Z" fill="#b28650" stroke="#f2c37b" strokeWidth="1.4"/>
  <circle cy="-12" r="16" fill="#4f3a2a" stroke="#e2b86c"/><path className="intro-clock-needle" d="M0-12v-11m0 11 7 5" stroke="#f3d399" strokeWidth="2" strokeLinecap="round"/>
  <g className="intro-bids" data-story-move="reveal-bids">
   {[[-53,-3,'12'],[-22,23,'8'],[22,23,'11'],[53,-3,'14']].map(([x,y,bid],i)=><g className={i===3?'intro-winning-bid':undefined} key={i} transform={`translate(${x} ${y})`}>
    <path d="M-12-10H12L15 0 12 10h-24L-15 0Z" fill={i===3?'#efca83':'#d7b18b'} stroke="#5d3a28" strokeWidth="1.4"/>
    <text textAnchor="middle" y="4" fill="#37231a" fontSize="11" fontWeight="700">{bid}</text>
   </g>)}
  </g>
 </>
}
function Fence(){
 return <>
  <path d="M-58-35H58V35H-58Z" fill="#b5a169" stroke="#593e2b" strokeWidth="2"/>
  <path d="M-39-29v58m19-58v58M0-29v58m20-58v58m19-58v58m-92-45H53M-53 0H53m-106 16H53" fill="none" stroke="#725939"/>
  <path d="M-38 16h37m20-32H55M-20-30v30" stroke="#573932" strokeWidth="4"/>
  <path className="intro-route intro-dash-route" pathLength="1" d="M-48 25V8h37v-16H8v-16h39" fill="none" stroke="#f8e5a1" strokeWidth="3.4"/>
  <path className="intro-fence" data-story-move="place-last-fence" d="M19 0h36" fill="none" stroke="#762f27" strokeWidth="6" strokeLinecap="round"/>
  <g fill="#ebd7a0" stroke="#60402c" strokeWidth="1.4"><path d="M-53 28l4-7 5 7Zm91-46 7-9 7 9Z"/></g>
 </>
}
function ColorLink(){
 return <>
  <path d="M-61-35H61V35H-61Z" fill="#3e4547" stroke="#b38b61" strokeWidth="2"/>
  <path d="M-40-32v64m20-64v64M0-32v64m20-64v64m20-64v64m-98-46H58M-58 0H58m-116 14H58" fill="none" stroke="#818680" opacity=".66"/>
  <g className="intro-route" data-story-move="complete-route" fill="none" strokeLinecap="round" strokeLinejoin="round">
   <path pathLength="1" d="M-49 22h38V6H29v16h20" stroke="#efb860" strokeWidth="5"/>
   <path pathLength="1" d="M-49-22h19v14h61v-14h18" stroke="#85bdaf" strokeWidth="5"/>
  </g>
  <path d="m-52 22 3-3 3 3-3 3Zm98 0 3-3 3 3-3 3Z" fill="#fff0c3"/>
  <circle cx="-49" cy="-22" r="2.4" fill="#ddfff2"/><circle cx="49" cy="-22" r="2.4" fill="#ddfff2"/>
 </>
}
const games:Record<TableKind,()=>React.JSX.Element>={mill:Mill,auction:Auction,fence:Fence,color:ColorLink}
function GameTable({table,index,full,id}:{table:Table;index:number;full:boolean;id:string}){
 const Game=games[table.id]
 return <>
  <path d="M-106 23l20 16 7 20h10l2-14h134l3 14h10l8-22 18-14Z" fill="#38271e" stroke="#17100d" strokeWidth="2"/>
  <ellipse cy="8" rx="115" ry="53" fill="#35271d" stroke="#201511" strokeWidth="5"/>
  <ellipse rx="112" ry="48" fill={`url(#${id}-table)`} stroke="#b4915c" strokeWidth="2"/>
  <ellipse rx="101" ry="40" fill="none" stroke="#9b784b" strokeDasharray="1.7 5" strokeWidth="1.6"/>
  <path d="M-99 9q17-20 18-28m180 28q-17-20-18-28" fill="none" stroke="#aa8964" strokeWidth="1.2"/>
  {full?<Game/>:<g><ellipse rx="32" ry="22" fill={table.ink} stroke="#cca86f" strokeWidth="1.5"/><path d="m-15 0 15-11L15 0 0 11Z" fill="none" stroke="#e2c093"/><text y="4" textAnchor="middle" fill="#fff0c8" fontSize="11">{table.roman}</text></g>}
  {seats.map(([x,y],i)=><g key={i} transform={`translate(${x} ${y})`} style={{'--actor-delay':`${i*.11}s`} as React.CSSProperties}>
   <Puppet number={index*4+i+1} color={table.colors[i]} mirror={i%2===1} active={full&&(table.id==='auction'||i===2)} assetId={id+'-'+(index*4+i)}/>
  </g>)}
 </>
}

export function IntroStory({beat}:{beat:(typeof storyBeats)[number]}){
 const id=useId()
 const focus=tables.findIndex(table=>table.id===beat.id)
 const glow=focus<0?'#805c3c':tables[focus].ink
 const ending=beat.id==='summon'||beat.id==='seal'
 return <div className="intro-story" data-act={beat.id}>
  <div className="intro-story-frame">
   <div className="intro-engraving">
    <svg viewBox="0 0 760 570" role="img" aria-label={focus>=0?'Four illustrated contenders play at the table':'Sixteen illustrated contenders at four tables'} className="intro-stage">
     <defs>
      <radialGradient id={id+'-light'} cy=".42"><stop stopColor={glow}/><stop offset=".53" stopColor="#3b2c25"/><stop offset="1" stopColor="#161616"/></radialGradient>
      <linearGradient id={id+'-table'} x2=".72" y2="1"><stop stopColor="#715239"/><stop offset=".6" stopColor="#483323"/><stop offset="1" stopColor="#231a17"/></linearGradient>
      <pattern id={id+'-hatch'} width="8" height="8" patternUnits="userSpaceOnUse"><path d="M-1 1 1-1M0 8l8-8m-1 9 2-2" stroke="#e4b679" strokeOpacity=".14" strokeWidth=".6"/></pattern>
     </defs>
     <rect width="760" height="570" fill={`url(#${id}-light)`}/>
     <path d="M33 570V221Q54 40 380 30q326 10 347 191v349M48 570V224Q80 57 380 48q300 9 332 176v346M66 570V227Q98 78 380 67q282 11 314 160v343" fill="none" stroke="#ac8255" strokeWidth="1.3" opacity=".62"/>
     <path d="M0 570l380-181 380 181M0 534l380-155 380 155M0 494l380-124 380 124m-579 76 199-183 195 183m-258 0 63-187 64 187" fill="none" stroke="#a98055" strokeOpacity=".26"/>
     <rect width="760" height="570" fill={`url(#${id}-hatch)`}/>
     <g className="intro-set-drawing" fill="none" stroke={focus<0?'#ad8658':tables[focus].ink} strokeWidth="1.7" opacity=".65">
      {beat.id==='mill'&&<path d="M244 153h272v350H244Zm31 30h210v290H275Zm32 32h146v227H307ZM380 153v63m0 225v62M244 328h64m145 0h63"/>}
      {beat.id==='auction'&&<path d="M286 149h188m-188 333h188M305 154c0 105 56 112 75 162-19 45-75 63-75 162m150-324c0 105-56 112-75 162 19 45 75 63 75 162m-95-243 20 40 20-40m-45 164 25-31 25 31"/>}
      {beat.id==='fence'&&<path d="M218 163h325v323H218Zm28 25h267v266H246Zm44 49h181v185H290Zm42 45h104v106H332ZM350 163v74m57 185v64m65-177h71m-325 55h72"/>}
      {beat.id==='color'&&<><path d="M230 429l82-231 67 88 76-105 77 259m-318-72 63-108 67 147 60-201 75 167 57-67"/>{[[230,429],[312,198],[379,286],[455,181],[532,440],[279,260],[344,407],[404,206],[479,373]].map(([x,y],i)=><circle key={i} cx={x} cy={y} r="5" fill="#bbbdac"/>)}</>}
     </g>
     {[92,668].map(x=><g key={x} transform={`translate(${x} 138)`}><path d="M-20 28h40m-16 0V-6m0-3q-7-8 1-22 8 14-1 22Z" fill="#f2c577" stroke="#c79c63" strokeWidth="1.5"/><path d="M-15 29q12 17 29 0" fill="#6b492f" stroke="#bf935d"/><circle className="intro-candle" cx="3" cy="-19" r="29" fill="#f5b56b" opacity=".18"/></g>)}
     {ending&&<g transform="translate(380 310)" data-story-door={beat.id==='seal'?'open':'locked'}>
      <path d="M-62 79V-33a62 62 0 0 1 124 0V79Z" fill="#221913" stroke="#c3935d" strokeWidth="2"/>
      <path d="M-54 77V-32a54 54 0 0 1 108 0V77Z" fill={beat.id==='seal'?'#e6b979':'#100e0e'} stroke="#80603b"/>
      {beat.id==='seal'&&<path className="intro-door-light" d="M-13 58h26l91 130h-208Z" fill="#e8b36c"/>}
      <g className="intro-door-leaf intro-door-left"><path d="M-53 76V-33q1-50 53-54V76Z" fill="#463026" stroke="#bc904f"/><path d="M-43 69V-35q4-34 33-42V68ZM-42-44l31 19m-31 10 31 19m-31 10 31 19m-31 10 31 19" fill="none" stroke="#966b49"/></g>
      <g className="intro-door-leaf intro-door-right"><path d="M53 76V-33q-1-50-53-54V76Z" fill="#463026" stroke="#bc904f"/><path d="M43 69V-35q-4-34-33-42V68ZM42-44 11-25m31 10L11 4m31 10L11 33m31 10L11 62" fill="none" stroke="#966b49"/></g>
     </g>}
     <g className="intro-table-shot" key={beat.id}>
      {focus<0?tables.map((table,i)=><g key={table.id} transform={`translate(${190+nodes[i][0]*1.94} ${199+nodes[i][1]*1.63}) scale(.86)`}>
       <GameTable table={table} index={i} full={false} id={id}/>
      </g>):<g transform="translate(380 311) scale(1.73)">
       <GameTable table={tables[focus]} index={focus} full id={id}/>
      </g>}
      {ending&&<g className="intro-seals" transform="translate(380 309)">
       {[[-71,0],[0,-54],[71,0],[0,54]].map(([x,y],i)=><g key={i} className="intro-seal" transform={`translate(${x} ${y})`}>
        <path d="M0-21 22 0 0 21-22 0Z" fill={tables[i].ink} stroke="#ffdc8e" strokeWidth="2"/>
        <text textAnchor="middle" y="4" fill="#fff2c0" fontSize="12">{tables[i].roman}</text>
       </g>)}
       <circle className="intro-ring" r="29" fill="#201714" stroke="#ffd990" strokeWidth="2"/>
       <path d="M0-17 14-8 14 9 0 18-14 9-14-8ZM0-17V18M-14-8 14 9m0-17L-14 9" fill="none" stroke="#ffda93" strokeWidth="1.4"/>
      </g>}
     </g>
     <path d="M15 62V15h47m636 0h47v47m0 446v47h-47m-636 0H15v-47" fill="none" stroke="#edbe7c" strokeWidth="2"/>
    </svg>
   </div>
   <div className="intro-story-copy" key={beat.id}>
    <p>{beat.no}</p>
    <strong>{beat.title}</strong>
    <span>{beat.line}</span>
   </div>
  </div>
 </div>
}
