import {useEffect,useState,type CSSProperties} from 'react'
import {bingoCard,bingoCoinFaces,bingoCoinValue,bingoLines,bingoRounds,bingoShapes,type BingoAction,type BingoShape,type BingoView} from './auction-bingo'
import {base} from './brand'
import './auction-bingo.css'

const label:Record<BingoShape,string>={triangle:'Triangle',circle:'Circle',star:'Star'}
const keys:Record<BingoShape,string>={
 triangle:'M12 3 22 21H2Z',
 circle:'M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18Z',
 star:'m12 2 2.9 6.3 6.9.8-5.1 4.9 1.3 6.8-6-3.3-6 3.3 1.3-6.8-5.1-4.9 6.9-.8Z',
}
function Shape({shape}:{shape:BingoShape}){
 return <svg className="ab-shape" viewBox="0 0 24 24" data-ab-shape={shape} aria-hidden="true"><path d={keys[shape]}/></svg>
}
function Card({mask}:{mask:number|null}){
 const cellLength=(i:number)=>[i%3*100+50,Math.floor(i/3)*100+50]
 return <div className="ab-card-frame"><ol className="ab-card" role="list" aria-label="Bingo card">{bingoCard.map((shape,i)=>{
  const filled=mask!==null&&!!(mask&(1<<i))
  return <li key={i} aria-label={'Cell '+(i+1)+', '+label[shape]+(mask===null?'':filled?', filled':', empty')} data-filled={filled||undefined}><Shape shape={shape}/></li>
 })}</ol>{mask!==null&&<svg className="ab-card-lines" viewBox="0 0 300 300" aria-hidden="true">
  {bingoLines.filter(line=>line.every(i=>mask&(1<<i))).map(line=><path key={line.join(':')} d={'M'+cellLength(line[0]).join(' ')+'L'+cellLength(line[2]).join(' ')}/>)}
 </svg>}</div>
}

type Props={view:BingoView;you:string;name:(seat:string)=>string;hostNow:number;active:boolean;send:(action:BingoAction)=>void}
export function AuctionBingoBoard({view:v,you,name,hostNow,active,send}:Props){
 const [draft,setDraft]=useState<BingoShape|null>(null)
 const [selectedCoins,setCoins]=useState(0)
 const [resultSeat,setResult]=useState(you)
 const [seconds,setSeconds]=useState(0)
 useEffect(()=>{
  if(v.deadline===null)return
  const receivedAt=performance.now(),duration=v.deadline-hostNow
  const draw=()=>setSeconds(Math.ceil(Math.max(0,duration-(performance.now()-receivedAt))/1000))
  draw()
  const timer=window.setInterval(draw,150)
  return ()=>window.clearInterval(timer)
 },[v.deadline,hostNow,v.phase])
 const mine=v.mine
 const writable=active&&seconds>0
 const canSelect=writable&&!!mine&&!mine.choice
 const canBid=writable&&!!mine?.choice&&mine.bid===null
 const submitted=v.phase==='select'?mine?.choice!==null:mine?.bid!==null
 const cardResult=v.results?.find(row=>row.seat===resultSeat)??v.results?.[0]
 const focusShape=mine?.choice??draft
 const priceRows=v.phase==='done'?null:v.prices
 const stageLabel={select:'Shape tickets',bid:'Closed bids',review:'Clearing prices',done:'Final ledger'}[v.phase]
 return <section className="ab-board" aria-label="Auction Bingo table" data-bingo-phase={v.phase}>
  <header className="ab-banner">
   <div><p>Lot exchange / private auction</p><strong>Round {v.round} / {bingoRounds}</strong></div>
   <div className="ab-round-stamps" aria-hidden="true">{Array.from({length:bingoRounds},(_,i)=><i key={i} data-round={i+1<v.round?'passed':i+1===v.round?'current':undefined}/>)}</div>
   {v.deadline!==null&&<span className="ab-time" role="timer" aria-label={stageLabel+": "+seconds+" seconds left"}>{seconds}<small>s</small></span>}
  </header>
  <div className="ab-work">
   <div className="ab-desk" style={{backgroundImage:"url("+base+"art/auction-bingo-desk.svg)"}}>
    <p className="ab-overline">{v.phase==='done'&&cardResult?name(cardResult.seat):'Your reference card'}</p>
    <Card mask={cardResult?.mask??null}/>
    {cardResult?<ul className="ab-shape-counts" role="list" aria-label="Collected shapes">{bingoShapes.map((shape,i)=><li key={shape} aria-label={label[shape]+': '+cardResult.shapes[i]}><Shape shape={shape}/>{cardResult.shapes[i]}</li>)}</ul>:
     <p className="ab-card-note">Won shapes stay hidden until the final ledger.</p>}
   </div>
   <div className="ab-controls">
    <h3>{stageLabel}</h3>
    {v.phase==='select'&&<>
     <p>Put one ticket into a lot. Choices open together.</p>
     <div className="ab-lots" aria-label="Choose a shape">{bingoShapes.map(shape=><button key={shape} type="button" disabled={!canSelect} aria-pressed={focusShape===shape} onClick={()=>setDraft(shape)}><Shape shape={shape}/><span>{label[shape]}</span></button>)}</div>
     {mine&&!mine.choice&&<button type="button" className="ab-primary" disabled={!canSelect||!draft} onClick={()=>{if(draft)send({kind:'select',shape:draft})}}>Seal shape</button>}
    </>}
    {(v.phase==='bid'||priceRows)&&<ul className="ab-market" role="list" aria-label={priceRows?'Round clearing prices':'Open shape tickets'}>{bingoShapes.map((shape,i)=>{
     const bidders=v.seats.filter((_,index)=>v.choices?.[index]===shape)
     const price=priceRows?.[i]
     return <li key={shape}><strong><Shape shape={shape}/>{label[shape]}</strong><span>{priceRows?(price==='sealed'?'Price sealed':price===null?'No sale':price+(price===1?' coin':' coins')):bidders.length?bidders.map(name).join(', '):'No tickets'}</span></li>
    })}</ul>}
    {v.phase==='bid'&&canBid&&mine&&<>
     <div className="ab-purse-head"><p>Private purse</p><strong>{bingoCoinValue(mine.coins)} coins</strong></div>
     <ul className="ab-coins" role="list" aria-label="Your whole coins">{bingoCoinFaces.map((value,i)=>{
      const bit=1<<i
      return <li key={i}>{(mine.coins&bit)!==0?<button type="button" data-coin-index={i} aria-label={value+' coin, token '+(i+1)} aria-pressed={!!(selectedCoins&bit)} onClick={()=>setCoins(selectedCoins^bit)}>{value}</button>:<span aria-hidden="true">·</span>}</li>
     })}</ul>
     <div className="ab-actions">
      <button type="button" className="ab-primary" disabled={!selectedCoins} onClick={()=>send({kind:'bid',coins:selectedCoins})}>Seal bid{selectedCoins?' · '+bingoCoinValue(selectedCoins):''}</button>
      <button type="button" onClick={()=>send({kind:'bid',coins:0})}>Pass this round</button>
     </div>
     <p className="ab-footnote">Win or lose, every bid is spent. Pass to spend nothing.</p>
    </>}
    {v.phase!=='done'&&<p className="ab-status" role="status">{!active?'Connection paused. The room clock is still running.':
     v.phase==='review'?'Only clearing prices are shown. Winners stay private.':
     !mine?'Watching the exchange.':v.phase==='select'?(submitted?'Your shape ticket is sealed.':'Choose a shape, then seal the ticket.'):
     !mine.choice?'No shape submitted. Wait for the next round.':submitted?(mine.bid?'Your bid is sealed.':'You passed this round.'):'Only you can see your purse and bid.'}</p>}
    {v.results&&<><p>Ranked by lines, then filled cells, then coins left. Select a seat to inspect its card.</p>
     <ol className="ab-standings" role="list" aria-label="Final standings">{v.results.map(row=><li key={row.seat}><button type="button" aria-pressed={row.seat===cardResult?.seat} onClick={()=>setResult(row.seat)}>
      <span><b>#{row.rank}</b> {name(row.seat)}{row.seat===you?' (you)':''}</span><span>{row.lines} {row.lines===1?'line':'lines'} · {row.cells} filled · {row.bank} coins</span>
     </button></li>)}</ol></>}
   </div>
  </div>
  <p className="ab-no-stakes">Table coins are fictional. No payments or prizes.</p>
 </section>
}

const exampleLabels=['Three lots accept shape tickets','Coins drop into a bid envelope before a wax seal hides it','A tied lot divides five star tokens two, two and one discarded','Three filled shapes complete one line']
export function AuctionBingoLesson({step}:{step:number}){
 const glyph=(shape:BingoShape,x:number,y:number)=> <path transform={'translate('+x+' '+y+')'} d={keys[shape]} data-ab-shape={shape} className="ab-demo-glyph"/>
 return <svg className="ab-demo" data-bingo-example={step} viewBox="0 0 360 178" role="img" aria-label={exampleLabels[step]}>
  <image href={base+'art/auction-bingo-desk.svg'} width="360" height="178" preserveAspectRatio="xMidYMid slice"/>
  <g key={step} className="ab-demo-motion">
   {[0,1,2].map(i=><rect key={i} x={49+i*91} y={53} width="78" height="68" rx="6" fill="#ddc194" stroke="#a4674a" strokeWidth="2"/>)}
   {step===0&&<>{bingoShapes.map((shape,i)=><g key={shape}>{glyph(shape,76+i*91,62)}<path d={'M'+(68+i*91)+' 100h40'} stroke="#4e382f" strokeWidth="4"/></g>)}<path className="ab-ticket-fall" d="M144 31h64v38h-64zM152 41h48m-48 9h32" fill="#f8ebce" stroke="#775b43" strokeWidth="2"/></>}
   {step===1&&<>
    {[0,1,2].map(i=><g key={i} transform={'translate('+(55+i*91)+' 66)'}>
     <path d="M0 0h66v43H0z M0 0l33 25L66 0" fill="#f2dec0" stroke="#79513a"/>
     {i===1&&[21,33,45].map((x,j)=><g key={x} transform={'translate('+x+' 14)'}>
      <g className="ab-coin-drop" style={{animationDelay:(j*100)+'ms'}}><circle r="6" fill="#d7a556" stroke="#6d4a2d"/><path d="m-1-3 3 1-3 4" fill="none" stroke="#6d4a2d"/></g>
     </g>)}
     <g className={i===1?'ab-wax-stamp':undefined}><circle cx="33" cy="25" r="10" fill="#8b3b35"/><path d="m29 25 3 3 5-6" fill="none" stroke="#f1cca1" strokeWidth="2"/></g>
    </g>)}
    <text x="180" y="148" textAnchor="middle" fill="#f1dcaa" fontFamily="system-ui" fontSize="12">PRIVATE BID · EVERY COIN IS SPENT</text>
   </>}
   {step===2&&<>
    {['—','SEALED','2'].map((price,i)=><g key={i}>{glyph(bingoShapes[i],76+i*91,59)}<text x={88+i*91} y="106" textAnchor="middle" fill="#432e28" fontSize={i===1?14:22} fontWeight="bold">{price}</text></g>)}
    <g className="ab-split" fill="#f1dcaa" fontFamily="system-ui" fontSize="11" textAnchor="middle">
     <text x="100" y="160">TIED HIGH 1</text><text x="180" y="160">TIED HIGH 2</text><text x="260" y="160">DISCARDED</text>
     {[88,112,168,192,260].map((x,i)=><g key={x} transform={'translate('+x+' 137)'}>
      <g className="ab-split-chip" data-discarded={i===4||undefined} style={{'--ab-from-x':(270-x)+'px',animationDelay:[120,170,360,410,620][i]+'ms'} as CSSProperties}>
       <g transform="scale(.55)"><path className="ab-demo-glyph" transform="translate(-12 -12)" d={keys.star} data-ab-shape="star"/>{i===4&&<path d="m-12-12 24 24m-24 0 24-24" stroke="#f1dcaa" strokeWidth="2"/>}</g>
      </g>
     </g>)}
    </g>
   </>}
   {step===3&&<>{bingoShapes.map((shape,i)=><g key={shape}>{glyph(shape,76+i*91,73)}</g>)}<path className="ab-demo-line" d="M62 112h234" stroke="#325f4b" strokeWidth="5" strokeLinecap="round" pathLength="1"/><text textAnchor="middle" x="180" y="145" fill="#f1dcaa" fontFamily="Georgia" fontSize="17">ONE COMPLETE LINE</text></>}
  </g>
 </svg>
}
