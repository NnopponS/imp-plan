import type {GameView} from './engine'
import {knightStep,type TourSize} from './season-two'

export type KnightPrint={size:TourSize;closed:boolean;path:number[];visited:number;complete:boolean;elapsed:string|null}
export const knightPrintWidth=460
export const knightPrintHeight=684

/** Render only the viewer-authorized path and elapsed duration, never the roster or the seed. */
export function knightPrintData(view:GameView):KnightPrint|null{
 const {size,closed}=view
 // Older hosts may not send a separately recorded result trail.
 const path=view.knightResultPath??view.path
 if(view.game!=='knight'||!view.done||(size!==5&&size!==6&&size!==8)||typeof closed!=='boolean'||!Array.isArray(path)||!path.length||path.length>size*size||
  new Set(path).size!==path.length||path.some((p,i)=>!Number.isInteger(p)||p<0||p>=size*size||i>0&&!knightStep(path[i-1],p,size)))return null
 const complete=path.length===size*size
 if(complete&&closed&&!knightStep(path[path.length-1],path[0],size))return null
 const ms=view.knightElapsedMs
 const seconds=complete&&typeof ms==='number'&&Number.isFinite(ms)&&ms>=0&&ms<=3_600_000?Math.floor(ms/1000):null
 const elapsed=seconds===null?null:[Math.floor(seconds/60),seconds%60].map(v=>String(v).padStart(2,'0')).join(':')
 return {size,closed,path:path.slice(),visited:path.length,complete,elapsed}
}

function horseStamp(){
 return '<path d="M3 44h38l-2-4H5zm3-6c2-5 7-9 14-11l1-7-5 5-5-1-5 1-3-3 3-5 9-6 3-7 5 4 5-2 3 6c8 7 9 15 5 26zm13-27 4 3-3 2-2-2zm8 7c6 8 8 12 5 18m-5-13c0 6-2 10-8 13" fill="none" stroke="#542f20" stroke-width="1.45" stroke-linecap="round" stroke-linejoin="round"/><path d="m9 33 4 4m-2-6 6 6m-4-8 8 8m-4-9 7 7m4-17 5 3m-5 1 7 3m-8 1 9 4m-10-1 10 4" fill="none" stroke="#704633" stroke-width=".65" opacity=".7"/>'
}

/** Original self-contained vector print. Only typed numbers, fixed labels, and our own engraving enter the source. */
export function knightRecordSvg(result:KnightPrint){
 const {size,closed,path,visited,complete,elapsed}=result
 const board=350,x=55,y=239,step=board/size
 const at=(cell:number)=>[x+(cell%size+.5)*step,y+(Math.floor(cell/size)+.5)*step]
 const route=path.map(cell=>at(cell).join(',')).join(' ')
 const cells=Array.from({length:size*size},(_,i)=>`<rect x="${x+i%size*step}" y="${y+Math.floor(i/size)*step}" width="${step}" height="${step}" fill="${(i+Math.floor(i/size)*(size%2===0?1:0))%2?'#bc9a72':'#e5c99e'}"/>`).join('')
 const stones=path.map((cell,i)=>{
  const [cx,cy]=at(cell),end=i===path.length-1,start=i===0
  return `<g data-visit="${i+1}" data-cell="${cell}"><circle cx="${cx}" cy="${cy}" r="${step*.261}" fill="${end?'#613427':start?'#72492f':'#f1dcaf'}" stroke="${end?'#6d4831':'#956a44'}" stroke-width="${end?2:1}"/><text x="${cx}" y="${cy+step*.104}" text-anchor="middle" fill="${end||start?'#fff1d2':'#472c1f'}" font-size="${step*.292}" font-weight="700">${i+1}</text></g>`
 }).join('')
 const loop=closed&&complete?`<path d="M${at(path.at(-1)!).join(' ')}L${at(path[0]).join(' ')}" stroke="#78432e" stroke-width="2" stroke-dasharray="5 5"/>`:''
 const duration=elapsed?`<text x="360" y="187" fill="#472c1f" font-size="27">${elapsed}</text><text x="360" y="206" class="small">FINISH TIME</text>`:''
 return `<svg xmlns="http://www.w3.org/2000/svg" width="${knightPrintWidth}" height="${knightPrintHeight}" viewBox="0 0 460 684" font-family="Georgia, serif">
 <defs>
  <radialGradient id="paper" cx="45%" cy="34%" r="73%"><stop stop-color="#faeac9"/><stop offset=".78" stop-color="#ebd0a6"/><stop offset="1" stop-color="#cfaa7a"/></radialGradient>
  <pattern id="grain" width="19" height="23" patternUnits="userSpaceOnUse"><path d="M1 4l3-1m8 3 2 1m-8 6 1-.6m8 6 .9-1.3M3 20l2-.7" fill="none" stroke="#7b5030" stroke-width=".55" opacity=".32"/></pattern>
  <style>.small{font:700 10px sans-serif;letter-spacing:1.3px;fill:#623e2b}</style>
 </defs>
 <rect width="460" height="684" fill="url(#paper)"/><rect width="460" height="684" fill="url(#grain)" opacity=".46"/>
 <path d="M12 28l16-15h404l16 15v628l-16 15H28l-16-15z" fill="none" stroke="#74472e" stroke-width="2.7"/>
 <path d="M20 30l11-10h398l11 10v623l-11 10H31l-11-10z" fill="none" stroke="#986848" stroke-width=".8"/>
 <path d="M31 54V34h22m354 0h22v20M31 628v20h22m354 0h22v-20" fill="none" stroke="#704633"/>
 <g text-anchor="middle">
  <path d="M58 60h65m214 0h65M72 62h36m245 0h31" fill="none" stroke="#926348" stroke-width=".85"/>
  <text x="230" y="64" class="small">IMP PLAN · CHAMBER RECORD</text>
  <text x="230" y="111" font-size="49" fill="#472b1d">Knight’s Tour</text>
  <text x="230" y="135" class="small">${size} × ${size} BOARD · ${closed?'CLOSED TOUR':'OPEN TOUR'}</text>
  <path d="M56 218h348m-348 4h348" fill="none" stroke="#865237" stroke-width=".8"/>
  <text x="${elapsed?100:230}" y="187" fill="#793c2a" font-size="27">${visited} / ${size*size}</text><text x="${elapsed?100:230}" y="206" class="small">SQUARES VISITED</text>
  ${duration}
  ${elapsed?`<path d="M188 177h84m-78 22h72" fill="none" stroke="#9b6848" stroke-width=".8"/><text x="230" y="190" class="small">TOUR COMPLETE</text>`:`<text x="230" y="157" class="small">${complete?'TOUR COMPLETE':'TOUR RECORDED'}</text>`}
 </g>
 <rect x="51" y="235" width="358" height="358" fill="#916645" stroke="#613a29" stroke-width="2"/>
 ${cells}<rect x="${x}" y="${y}" width="${board}" height="${board}" fill="url(#grain)"/>
 <polyline points="${route}" fill="none" stroke="#f9e2b4" stroke-opacity=".9" stroke-width="5.1" stroke-linecap="round" stroke-linejoin="round"/>
 <polyline points="${route}" fill="none" stroke="#864931" stroke-width="2.15" stroke-linecap="round" stroke-linejoin="round"/>
 ${loop}${stones}
 <path d="M54 619h350m-350 3h350" fill="none" stroke="#95684a" stroke-width=".7"/>
 <g transform="translate(55 623) scale(.81)">${horseStamp()}</g>
 <text x="103" y="640" fill="#533422" font-size="14">Your route · Fan adaptation</text>
 <text x="103" y="654" class="small">NUMBERED IN MOVE ORDER</text>
 <path d="M385 629l8 9-8 9-8-9zm0 3v12m-4-6h8" fill="none" stroke="#82573c"/>
 </svg>`
}
