import {useEffect,useRef,useState} from 'react'
import {base} from './brand'
import type {Snapshot} from './room'
import './remove-one.css'

function Card({value,visibility,selected=false}:{value?:number;visibility:'private'|'public'|'sealed'|'empty';selected?:boolean}){
 const face=visibility==='sealed'?'back':visibility==='empty'?'empty':'front'
 return <span className="remove-card" data-face={face} data-selected={selected||undefined}
  data-private-value={visibility==='private'?value:undefined} data-public-value={visibility==='public'?value:undefined} aria-hidden="true">
  <span className="remove-card-print">
   {face!=='empty'&&<img className="deck-print" alt="" draggable="false" src={base+'art/decks/masked-letter-'+(face==='back'?'back':'face')+'.svg'}/>}
   {face==='front'?<><small className="remove-corner">{value}</small><span className="remove-value">{value}</span><small className="remove-corner opposite">{value}</small></>:
    face==='back'?null:<span className="remove-card-empty">·</span>}
  </span>
 </span>
}
function RoundClock({snap}:{snap:Snapshot}){
 const game=snap.game!
 const [clock,setClock]=useState(()=>({now:Date.now(),offset:snap.hostNow-Date.now()}))
 useEffect(()=>{
  setClock({now:Date.now(),offset:snap.hostNow-Date.now()})
 },[snap.hostNow])
 useEffect(()=>{
  if(game.done)return
  const timer=window.setInterval(()=>setClock(old=>({...old,now:Date.now()})),200)
  return ()=>window.clearInterval(timer)
 },[game.done])
 const seconds=Math.max(0,Math.ceil(((game.deadline??clock.now)-clock.now-clock.offset)/1000))
 return <span className="remove-clock" aria-label="Time remaining">{game.done?'Finished':Math.floor(seconds/60)+':'+String(seconds%60).padStart(2,'0')}</span>
}

export function RemoveOneBoard({snap,active,submit,name}:{snap:Snapshot;active:boolean;submit:(n:number)=>void;name:(s:string)=>string}){
 const game=snap.game!,sealed=game.mine!==null
 // Never reanimate data already visible when opening or resuming a table.
 const joined=useRef({reveal:game.reveal?.round??0,round:game.round,sealed})
 const pendingFocus=useRef<{round:number;acknowledged:boolean}|null>(null)
 const heading=useRef<HTMLParagraphElement>(null)
 const firstChoice=useRef<HTMLButtonElement>(null)
 useEffect(()=>{
  const pending=pendingFocus.current
  if(!pending)return
  if(!game.done&&game.round===pending.round){
   if(sealed&&!pending.acknowledged){
    pending.acknowledged=true
    heading.current?.focus({preventScroll:true})
   }
   return
  }
  pendingFocus.current=null
  if(!pending.acknowledged||document.activeElement===heading.current){
   (game.done?heading.current:firstChoice.current)?.focus({preventScroll:true})
  }
 },[sealed,game.done,game.round])
 const reveal=game.reveal
 const flip=!!reveal&&reveal.round>joined.current.reveal
 const seal=sealed&&(game.round>joined.current.round||!joined.current.sealed)
 const last=reveal?game.last:null
 const selectable=active&&!game.done&&!sealed
 const turnLabel=game.done?'Final chips':sealed?'Discard sealed':game.hand.length?'Choose one to discard':'Watching this hand'
 const privateLabel=sealed?'Your cards are face down until the reveal.':game.hand.length?'Only you can see these cards.':'Waiting for the table.'
 return <section className="remove-one" aria-label="Remove One table">
  <header className="remove-register">
   <strong>Round {game.round} {game.round>8?'· Tiebreak':'/ 8'}</strong>
   <div>{!game.done&&<span>{game.submitted}/{game.seats.length} sealed</span>}<RoundClock snap={snap}/></div>
  </header>
  <div className="remove-workbench">
   <div className="remove-shared" data-reveal={reveal?.round}>
    <img className="remove-table-art" src={base+'art/remove-live-chamber.svg'} width="1200" height="640" alt=""/>
    <div className="remove-public-label">{reveal?'Round '+reveal.round+' reveal':'Sealed table'}</div>
    <ul className="remove-seats" aria-label={reveal?'Public reveal, round '+reveal.round:'Sealed public table'} key={reveal?.round??0}>
     {game.seats.map((id,i)=>{
      const value=last?.[i]??0,won=id===reveal?.winner
      return <li key={id} className="remove-seat" data-winner={won||undefined} data-reveal-motion={flip&&value>0||undefined}>
       <Card value={value||undefined} visibility={reveal?(value?'public':'empty'):'sealed'}/>
       <span className="sr">{reveal?(value?'Kept '+value+'.':'No submission.'):'Face down.'}</span>
       <strong className="remove-seat-name" title={name(id)}>{name(id)}</strong>
       <span className="remove-chip-count"><i aria-hidden="true"/>{game.scores[i]} chips</span>
      </li>
     })}
    </ul>
   </div>
   <div className="remove-player">
    <p className="remove-player-title" ref={heading} tabIndex={-1}>{turnLabel}</p>
    {!game.done&&<><p className="remove-private-label" id="remove-private-label" aria-live="polite">{privateLabel}</p>
     <div className="remove-hand" data-sealed={sealed||undefined} data-seal-motion={seal||undefined} role="group" aria-label="Your private hand" aria-describedby="remove-private-label">
      {sealed?([0,1] as const).map(i=><Card key={i} visibility="sealed" selected={game.mine===i}/>):
       game.hand.map((card,i)=><button type="button" className="remove-choice" key={card.id} ref={i===0?firstChoice:undefined} disabled={!selectable||!game.legal.includes(i)} onClick={e=>{if(e.detail===0)pendingFocus.current={round:game.round,acknowledged:false};submit(i)}} aria-label={`Discard ${card.value}, card ${i+1}`}>
        <Card value={card.value} visibility="private"/>
       </button>)}
     </div>
    </>}
    {reveal&&<p role="status" className="remove-result">Round {reveal.round}: {reveal.winner?name(reveal.winner)+' wins 2 chips':'no unique card'}.</p>}
   </div>
  </div>
 </section>
}
