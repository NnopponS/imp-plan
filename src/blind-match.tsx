import {BoardViewport} from './board-viewport'
import {useRef,useState,type ReactNode} from 'react'
import {blindCoverAction,tutorials,type BlindCover,type GameView} from './engine'
import {ChamberScene,CoverTray,InlaidStone,coverNames} from './blind-chamber'
import './blind-match.css'

const side=15
const coordinates=Array.from({length:side},(_,i)=>i+1)
const stars=new Set([48,56,112,168,176])

const glyphs={
 exit:'M6 2h8v16H6zM3 10h7m-4-3-3 3 3 3m5-5v2',
 lobby:'M2 10h16m-13 7h10m-9 0v-7m8 7v-7M4 8l6-5 6 5',
 next:'M15 6a6 6 0 1 0 1 6M15 2v5h-5m-2 3 2-2 2 2-2 2z',
 record:'M4 2h9l3 3v13H4zM12 2v4h4M7 10h6m-6 3h4',
 rules:'M2 5c3-1 6-1 8 1 2-2 5-2 8-1v11c-3-1-6-1-8 1-2-2-5-2-8-1zM10 6v11m-6-8 4 1m4 0 4-1',
} as const
export function ChamberGlyph({icon}:{icon:keyof typeof glyphs}){
 return <svg className="chamber-glyph" viewBox="0 0 20 20" aria-hidden="true"><path d={glyphs[icon]}/></svg>
}
function Seal({revealed}:{revealed:boolean}){
 return <svg className="duel-seal" viewBox="0 0 58 58" aria-hidden="true">
  <path d="M29 2 56 29 29 56 2 29Z" className="duel-seal-field"/>
  <path d="m29 7 22 22-22 22L7 29Z" className="duel-seal-thread"/>
  {revealed?<path d="m13 31 9 9 20-21m-29 9 8 8 20-21" className="duel-seal-cut"/>:
   <path d="M13 31c7-9 24-12 32-2-7 9-24 12-32 2Zm16-8 6 6-6 6-6-6zM14 38l30-17" className="duel-seal-cut"/>}
 </svg>
}
function Corner({at}:{at:'nw'|'ne'|'sw'|'se'}){
 return <svg className="chamber-carving" data-corner={at} viewBox="0 0 48 48" aria-hidden="true">
  <path d="M43 4H4v39M32 9H9v23M14 14c.5 11 7.5 19 17 20-3-9-9-14-17-20Zm0 0c11 .5 19 7.5 20 17-9-3-14-9-20-17Z"/>
  <path d="m12 12 4 4m-2 18-3 3-3-3 3-3zm24-23-3 3-3-3 3-3z"/>
 </svg>
}
function winningCells(g:GameView){
 const cells=new Set<number>()
 if(!g.done||!g.winner)return cells
 for(let r=0;r<side;r++)for(let c=0;c<side;c++){
  if(g.board[r*side+c]!==g.winner)continue
  for(const [dr,dc] of [[0,1],[1,0],[1,1],[1,-1]]){
   const priorRow=r-dr,priorCol=c-dc
   if(priorRow>=0&&priorRow<side&&priorCol>=0&&priorCol<side&&g.board[priorRow*side+priorCol]===g.winner)continue
   const line:number[]=[]
   for(let y=r,x=c;y>=0&&y<side&&x>=0&&x<side&&g.board[y*side+x]===g.winner;y+=dr,x+=dc)line.push(y*side+x)
   if(line.length>=5)for(const index of line)cells.add(index)
  }
 }
 return cells
}
const nextCell=(i:number,key:string)=>{
 const r=Math.floor(i/side),c=i%side
 if(key==='ArrowLeft')return r*side+Math.max(0,c-1)
 if(key==='ArrowRight')return r*side+Math.min(side-1,c+1)
 if(key==='ArrowUp')return Math.max(0,r-1)*side+c
 if(key==='ArrowDown')return Math.min(side-1,r+1)*side+c
 if(key==='Home')return r*side
 if(key==='End')return r*side+side-1
 return null
}

type Props={
 game:GameView
 you:string
 name:(id:string)=>string
 active:boolean
 practice:boolean
 leg:number
 legs:number
 submit:(action:number)=>void
 onReturn?:()=>void
 onExport?:()=>void
 next?:{label:string,run:()=>void}
 extra?:ReactNode
 resultFolio?:ReactNode
}
export function BlindMatchStage({game:g,you,name,active,practice,leg,legs,submit,onReturn,onExport,next,extra,resultFolio}:Props){
 const [cover,setCover]=useState<BlindCover|null>(null)
 const [focus,setFocus]=useState(112)
 const [row,setRow]=useState(0),[column,setColumn]=useState(0)
 const refs=useRef<Array<HTMLButtonElement|null>>([])
 const playable=active&&!g.done&&g.turn===you
 const legal=new Set(playable?g.legal:[])
 const marks=winningCells(g)
 const moves=g.board.filter(Boolean).length
 const title=g.done?g.winner?name(g.winner)+' wins':'Shared result':!g.seats.includes(you)?'Watching this leg':g.turn===you?'Your turn':name(g.turn)+'’s turn'
 const place=(i:number)=>{
  if(legal.has(i))submit(cover===null?i:blindCoverAction(i,cover))
 }
 const resultDetail=g.winner&&marks.size?'Five in a row':g.winner?'Table complete':'No winning line'
 return <section className="panel match engraved-match" aria-label="Engraved Blind Gomoku table" data-result={g.done||undefined}>
  <header className="duel-plaque">
   <div className="duel-inscription">
    <Seal revealed={g.done}/>
    <div className="duel-signature">
     <p className="duel-kicker">FAN MODE · Round {leg} of {legs}{resultFolio}</p>
     <div role="status" aria-atomic="true"><h2>{title}</h2></div>
     <p className="duel-kind">{g.done?resultDetail:!active?'Table connection interrupted':'Secret Chamber'}</p>
    </div>
   </div>
   <div className="duel-seats" aria-label="The two sides">
    {g.seats.map((seat,i)=><div className="duel-seat" data-second={i===1||undefined}
     data-current={!g.done&&g.turn===seat||undefined} data-winner={g.done&&g.winner===seat||undefined} key={seat}>
     <span className="duel-seat-token" aria-hidden="true">{i===0?'Ⅰ':'Ⅱ'}</span>
     <div><strong>{name(seat)}</strong><small>{g.done?(g.winner===seat?'Winner':'Revealed'):seat===g.turn?'To move':seat===you?'You':'At the table'}</small></div>
    </div>)}
   </div>
  </header>
  <div className="duel-layout">
   <div className="duel-board-column">
    <BoardViewport label="Blind Gomoku board"><div className="chamber-table">
     {(['nw','ne','sw','se'] as const).map(at=><Corner key={at} at={at}/>)}
     <div className="board gomoku chamber-grid" aria-label="Blind Gomoku board" role="group">
      {g.board.map((value,i)=>{
       const tile=g.blindCovers?.[i],win=marks.has(i),revealed=g.done&&value&&value!=='?'
       const desc=value==='?'&&typeof tile==='number'?coverNames[tile]+' cover. Side hidden.':win?'Winning line. Side '+(value===g.seats[0]?'I.':'II.'):undefined
       return <button className={'cell'+(legal.has(i)?' legal':'')} type="button" key={i} ref={el=>{refs.current[i]=el}}
        tabIndex={focus===i?0:-1} aria-label={'Row '+(Math.floor(i/side)+1)+', column '+(i%side+1)+', '+(!value?'open':value==='?'?'veiled':name(value))}
        aria-description={desc} aria-disabled={!legal.has(i)} data-winning={win||undefined} data-star={stars.has(i)||undefined}
        onFocus={()=>setFocus(i)} onClick={()=>place(i)} onKeyDown={e=>{const x=nextCell(i,e.key);if(x!==null){e.preventDefault();refs.current[x]?.focus()}}}>
        {stars.has(i)&&<span className="chamber-star" aria-hidden="true"/>}
        {typeof tile==='number'&&<InlaidStone key={value} cover={tile} side={revealed?(value===g.seats[0]?0:1):undefined}/>}
       </button>
      })}
     </div>
    </div></BoardViewport>
    <div className="duel-board-caption"><span>15 × 15 <i aria-hidden="true">◆</i> {g.done?'Sides revealed':'Sides concealed'}</span><span>{moves} {moves===1?'stone':'stones'} laid</span></div>
   </div>
   <aside className="duel-workbench" aria-label="Keeper’s shelf">
    {!g.done?<CoverTray choice={cover} setChoice={setCover} disabled={!legal.size}/>:<div className="duel-verdict">
     <strong>Chamber record</strong>
     <p>{marks.size?'Gold rings trace the winning line.':'The final positions are shown on the table.'}</p>
    </div>}
    <ChamberScene game={g} practice={practice}/>
    {!g.done&&<details className="duel-coordinates"><summary>Place by coordinates</summary><div className="duel-coordinate-controls">
     <label>Row<select value={row} onChange={e=>setRow(Number(e.target.value))}>{coordinates.map(n=><option key={n} value={n-1}>{n}</option>)}</select></label>
     <label>Column<select value={column} onChange={e=>setColumn(Number(e.target.value))}>{coordinates.map(n=><option key={n} value={n-1}>{n}</option>)}</select></label>
     <button type="button" disabled={!legal.has(row*side+column)} onClick={()=>place(row*side+column)}>Place stone</button>
    </div></details>}
   </aside>
  </div>
  {extra}
  <footer className="duel-actions">
   <details className="duel-rules"><summary><ChamberGlyph icon="rules"/>How to play</summary><p>{tutorials.blind}</p></details>
   <div className="duel-action-rail">
    {onReturn&&<button type="button" onClick={onReturn} disabled={!active}><ChamberGlyph icon="lobby"/>Return to lobby</button>}
    {onExport&&<button type="button" onClick={onExport}><ChamberGlyph icon="record"/>Export result</button>}
    {next&&<button className="primary" type="button" onClick={next.run} disabled={!active}><ChamberGlyph icon="next"/>{next.label}</button>}
   </div>
  </footer>
 </section>
}
