import {useId} from 'react'
import {islandArrows,islandCellName,islandStart,islandTerrain,type ArrowShape,type Direction} from './treasure-island'

const vectors=[[0,-1],[1,0],[0,1],[-1,0]]
const dirs=[0,1,2,3] as const
const origin=34, pitch=28
const xy=(cell:number)=>[origin+(cell%9+.5)*pitch,origin+(Math.floor(cell/9)+.5)*pitch]
const coordinates=[...Array(9).keys()]
export function ArrowTile({shape,turn=0}:{shape:ArrowShape;turn?:Direction}){
 const points=[[0,0]]
 const pattern=islandArrows[shape].directions
 for(const d of pattern){
  const [x,y]=points.at(-1)!,[dx,dy]=vectors[(d+turn)%4]
  points.push([x+dx,y+dy])
 }
 const cx=(Math.min(...points.map(p=>p[0]))+Math.max(...points.map(p=>p[0])))/2
 const cy=(Math.min(...points.map(p=>p[1]))+Math.max(...points.map(p=>p[1])))/2
 const [lastX,lastY]=points.at(-1)!
 const [dx,dy]=vectors[(pattern.at(-1)!+turn)%4]
 const point=([x,y]:number[])=>[24+(x-cx)*8,24+(y-cy)*8].join(' ')
 return <svg viewBox="0 0 48 48" className="island-arrow" aria-hidden="true" fill="none">
  <path d="M9 3h30l6 6v30l-6 6H9l-6-6V9Z" fill="#c9a56f" stroke="#795331"/>
  <path d="M11 6h26l5 5v26l-5 5H11l-5-5V11Z" fill="#ead5a9" stroke="#977047"/>
  <path d="M10 10h3m-3 0v3m28-3h-3m3 0v3M10 38h3m-3 0v-3m28 3h-3m3 0v-3" stroke="#aa8654"/>
  <path d={'M'+points.map(point).join('L')} stroke="#4d3624" strokeWidth="2.7" strokeLinecap="round" strokeLinejoin="round"/>
  <path d={'M'+point([lastX-.6*dx+.43*dy,lastY-.6*dy-.43*dx])+'L'+point([lastX,lastY])+'L'+point([lastX-.6*dx-.43*dy,lastY-.6*dy+.43*dx])} stroke="#4d3624" strokeWidth="2.7" strokeLinecap="round" strokeLinejoin="round"/>
  <circle cx={24-cx*8} cy={24-cy*8} r="2" fill="#874d31"/>
 </svg>
}
function Cache({cx,cy,gold=false}:{cx:number;cy:number;gold?:boolean}){
 return <g transform={`translate(${cx} ${cy})`} stroke={gold?'#503514':'#4e3422'} strokeWidth="1.25">
  <path d="m-9 6-1-8 3-4H5l4 4-1 8Z" fill={gold?'#e9bc59':'#d0a271'}/>
  <path d="M-9-1H9m-15-5 1 12M5-6 4 6" fill="none"/>
  <path d="M-2-2h4v5h-4z" fill="#f6e7b7"/>
 </g>
}

export function IslandMap({route=[],digs=[],treasure=null,example=false}:{route?:readonly number[];digs?:readonly {endpoint:number|null;kind:string}[];treasure?:number|null;example?:boolean}){
 const raw=useId(),id='island-'+raw.replace(/[^\w-]/g,'')
 const destination=route.length>1?route.at(-1):null
 const [sx,sy]=xy(islandStart)
 const title=example?'Illustrated nine by nine example map':'Island chart'
 const description='Start at E5. Open land is pale; patterned water and crossed reefs block routes.'+(destination==null?'':' Current route ends at '+islandCellName(destination)+'.')+(treasure===null?'':' Treasure at '+islandCellName(treasure)+'.')
 return <svg className="island-map" data-island-map="" viewBox="0 0 320 336" role="img" aria-label={title+'. '+description}>
  <defs>
   <linearGradient id={id+'-paper'} x2="100%" y2="100%"><stop stopColor="#e3c99a"/><stop offset=".46" stopColor="#eedfba"/><stop offset="1" stopColor="#c3a572"/></linearGradient>
   <pattern id={id+'-sea'} width="23" height="9" patternUnits="userSpaceOnUse"><rect width="23" height="9" fill="#4c7265"/><path d="M2 3q2-2 4.5 0t4.5 0m3.5 4q2-2 4 0t4 0" fill="none" stroke="#91a28a" strokeWidth=".65" opacity=".75"/></pattern>
   <pattern id={id+'-land'} width="14" height="12" patternUnits="userSpaceOnUse"><rect width="14" height="12" fill="#dac28a"/><path d="M3 8h2m5-5h1" stroke="#9d7e4f" strokeWidth=".56" opacity=".72"/></pattern>
  </defs>
  <rect x="1" y="1" width="318" height="334" rx="4" fill={`url(#${id}-paper)`} stroke="#97724c" strokeWidth="2"/>
  <path d="M7 28V7h21m264 0h21v21m0 280v21h-21M28 329H7v-21M31 27h258M31 293h258" stroke="#97754b" opacity=".75" fill="none"/>
  <text x="160" y="20" textAnchor="middle" className="island-chart-title">THE BRASS TIDE CHART</text>
  <g>
   {islandTerrain.map((tile,cell)=>{
    const [x,y]=xy(cell)
    return <g key={cell} data-island-tile={tile}>
     <rect x={x-pitch/2} y={y-pitch/2} width={pitch} height={pitch} fill={tile==='water'?`url(#${id}-sea)`:tile==='reef'?'#94784f':`url(#${id}-land)`} stroke="#786b52" strokeWidth=".53"/>
     {tile==='reef'&&<g stroke="#4b3b2b" strokeWidth="1.6" fill="#b6a077"><path d={`M${x-11} ${y+7}l5-11 5 4 4-9 9 16Z`}/><path d={`M${x-7} ${y-8}l14 16m-14 0 14-16`} fill="none" strokeWidth=".8"/></g>}
     {tile==='land'&&dirs.map((d,i)=>{
      const [dx,dy]=vectors[d],nx=cell%9+dx,ny=Math.floor(cell/9)+dy
      if(nx>=0&&nx<9&&ny>=0&&ny<9&&islandTerrain[ny*9+nx]!=='water')return null
      const a=dy===0?[x+13*dx,y-14,x+13*dx,y+14]:[x-14,y+13*dy,x+14,y+13*dy]
      return <line key={i} x1={a[0]} y1={a[1]} x2={a[2]} y2={a[3]} stroke="#ede0a5" strokeWidth="2.1" opacity=".85"/>
     })}
    </g>
   })}
   <rect x="34" y="34" width="252" height="252" fill="none" stroke="#7a6a50" strokeWidth="1.4"/>
   {coordinates.map(i=><g key={i} className="island-coordinate"><text x={origin+(i+.5)*pitch} y="31" textAnchor="middle">{'ABCDEFGHI'[i]}</text><text x="24" y={origin+(i+.5)*pitch+3} textAnchor="middle">{i+1}</text></g>)}
  </g>
  <g opacity=".85" aria-hidden="true" stroke="#513b26" strokeWidth=".9" fill="none">
   <circle cx="299" cy="302" r="9"/><path d="m299 289 2.5 10.5 9.5 2.5-9.5 2.5-2.5 10.5-2.5-10.5-9.5-2.5 9.5-2.5Z" fill="#ecd197"/><path d="m299 289 2.5 10.5-2.5 2.5-2.5-2.5Z" fill="#8f4d36"/>
  </g>
  <text x="160" y="315" textAnchor="middle" className="island-coordinate">E5 · LANDING POINT</text>
  {digs.map(({endpoint,kind},i)=>{
   if(endpoint===null||endpoint===treasure||digs.findIndex(d=>d.endpoint===endpoint)!==i)return null
   const [x,y]=xy(endpoint)
   return kind==='clue'?<Cache key={i} cx={x} cy={y}/>:<path key={i} d={`M${x-4} ${y-4}l8 8m-8 0 8-8`} stroke="#713e31" strokeWidth="1.5"/>
  })}
  {route.length>1&&<g fill="none" strokeLinecap="round" strokeLinejoin="round">
   <path d={'M'+route.map(c=>xy(c).join(' ')).join('L')} stroke="#f8eac2" strokeWidth="5"/>
   <path d={'M'+route.map(c=>xy(c).join(' ')).join('L')} stroke="#913f2e" strokeWidth="2.4" strokeDasharray="4 3"/>
   {destination!=null&&<circle cx={xy(destination)[0]} cy={xy(destination)[1]} r="10" stroke="#913f2e" strokeWidth="1.8"/>}
  </g>}
  <circle cx={sx} cy={sy} r="9.5" fill="#faf0ce" stroke="#513a23"/>
  <path d={`M${sx-4} ${sy+6}v-12l10 1-1 6-9 1`} fill="#8e482f" stroke="#5b4126"/>
  {treasure!==null&&<Cache cx={xy(treasure)[0]} cy={xy(treasure)[1]} gold/>}
 </svg>
}
