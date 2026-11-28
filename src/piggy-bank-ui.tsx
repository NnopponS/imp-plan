import {useEffect,useState,type FormEvent} from 'react'
import {piggyCountMax,piggyRules,type PiggyCoins,type PiggyColor,type PiggyCommand,type PiggyView} from './piggy-bank'
import {PiggyCoin,PiggyFigure,PiggyShelf} from './piggy-bank-art'
import './piggy-bank.css'

const capitalize=(s:string)=>s[0].toUpperCase()+s.slice(1)

export function PiggyBankBoard({view:g,you,name,active,preview=false,hostNow,receivedAt,send}:{
 view:PiggyView;you:string;name:(id:string)=>string;active:boolean;preview?:boolean;hostNow:number;receivedAt?:number;send:(action:PiggyCommand)=>void
}){
 const [clock,setClock]=useState(0)
 useEffect(()=>{
  if(preview||g.deadline===null||g.phase==='done')return
  const update=()=>setClock(performance.now())
  update()
  const timer=window.setInterval(update,150)
  return ()=>window.clearInterval(timer)
 },[g.deadline,g.phase,preview])
 const left=g.deadline===null?null:Math.max(0,Math.ceil((g.deadline-hostNow-(preview?0:Math.max(0,clock-(receivedAt??clock))))/1000))
 return <PiggyPosition key={g.step} g={g} you={you} name={name} preview={preview} left={left} active={active&&!preview&&(left===null||left>0)} send={send}/>
}

function PiggyPosition({g,you,name,active,preview,left,send}:{
 g:PiggyView;you:string;name:(id:string)=>string;active:boolean;preview:boolean;left:number|null;send:(action:PiggyCommand)=>void
}){
 const [coins,setCoins]=useState<PiggyColor[]>([])
 const [to,setTo]=useState<number|null>(null)
 const [count,setCount]=useState('')
 const [challenge,setChallenge]=useState<Record<number,Partial<Record<PiggyColor,string>>>>({})
 const seat=g.seats.indexOf(you),myTurn=g.actor===seat,actor=g.actor
 const who=(i:number)=>g.seats[i]===you?'You':name(g.seats[i])
 const about=g.phase==='deposit'?(myTurn?'Feed your lower bank':who(actor!)+' is adding coins'):
  g.phase==='claim'?(myTurn?'Name the '+g.color+' count':who(actor!)+' counts '+g.color):
  g.phase==='doubt'?(myTurn?'Your claim is public':g.canDoubt?'Believe the count?':'Doubt window'):
  g.phase==='challenge'?(myTurn?'Name every bank’s contents':who(actor!)+' can challenge the reset'):
  g.phase==='review'?'The bank register':g.leaders.length===1?name(g.leaders[0])+' wins':'Shared lead'
 const submit=(e:FormEvent,cmd:PiggyCommand)=>{e.preventDefault();if(active)send(cmd)}
 const add=(color:PiggyColor)=>setCoins(cs=>cs.length<piggyRules.maxCoins?[...cs,color]:cs)
 const total=(color:PiggyColor)=>coins.filter(v=>v===color).length
 const selectRecipient=active&&myTurn&&g.phase==='deposit'
 const canClaim=active&&myTurn&&g.phase==='claim'
 const canChallenge=active&&myTurn&&g.phase==='challenge'
 const verdict=g.verdict
 const valid=(s:string|undefined)=>s!==undefined&&/^\d{1,3}$/.test(s)&&+s<=piggyCountMax
 const validChallenge=g.bankIds.every(id=>valid(challenge[id]?.black)&&valid(challenge[id]?.white))
 const ordered=g.seats.map((_,i)=>i)
 // Keep each seat stable as the upper pig moves.
 return <section className="piggy-game" data-piggy-phase={g.phase} aria-label="Piggy Bank table">
  <header className="piggy-header"><div><p>THE COIN ROOM</p><h2>{about}</h2></div><div className="piggy-meters">
   <span>Exchange <b>{g.exchange}/{piggyRules.exchanges}</b></span>
   {!preview&&left!==null&&g.phase!=='done'&&<span role="timer" aria-label="Seconds left">{left}s</span>}
  </div></header>
  <div className="piggy-focus">
   <div>
    <p className="piggy-overline">{verdict?.kind==='doubt'?'BANK OPENED':g.phase==='deposit'?'LOWER SHELF':'UPPER SHELF'}</p>
    <div className="piggy-hero" data-piggy-hero><PiggyFigure bank={verdict?.kind==='doubt'?verdict.bank.id:g.phase==='deposit'&&actor!==null?g.bottom[actor]:g.top??1} open={verdict?.kind==='doubt'}/></div>
    {g.phase==='deposit'&&g.top!==null&&<div className="piggy-reserve"><PiggyFigure bank={g.top}/><span>Upper · Bank {g.top}</span></div>}
   </div>
   <div className="piggy-signal" aria-live="polite">
    {verdict?.kind==='doubt'?<><strong>{verdict.correct?'Doubt upheld':'The count was exact'}</strong>
     <p><PiggyCoin color="black"/>{verdict.bank.black} black <PiggyCoin color="white"/>{verdict.bank.white} white</p>
     <small>{verdict.correct?who(verdict.caller)+' +1 · '+who(verdict.answerer)+' −1':who(verdict.caller)+' −1'}</small></>:
     verdict?.kind==='challenge'?<><strong>{verdict.correct?'Every count is right':'A count did not match'}</strong><p>{who(verdict.challenger)} {verdict.correct?'+3':'−2'}</p></>:
     verdict?.kind==='reset'?<strong>Fresh banks, 1 of each color.</strong>:
     g.claim?<><strong>{who(g.actor!)}: {g.claim.count===null?'No claim':g.claim.count+' '+g.claim.color}</strong><small>Only a doubt opens this bank.</small></>:
     g.lastPass?<><strong>{who(g.lastPass.from)} → {who(g.lastPass.to)}</strong><p><PiggyCoin color="black"/> +{g.lastPass.black} <PiggyCoin color="white"/> +{g.lastPass.white}</p><small>Last public deposit · Bank {g.lastPass.bank}</small></>:
     <><strong>One black. One white.</strong><p>That’s the start of every bank.</p><small>No totals visible after deposits.</small></>}
   </div>
  </div>
  <div className="piggy-rack" aria-label="Lower banks and points" data-piggy-rack data-seats={g.seats.length}>
   {ordered.map(i=><PiggyShelf key={g.seats[i]} label={who(i)} bank={g.bottom[i]} selected={selectRecipient?to===i:actor===i}
    detail={'Bank '+g.bottom[i]+' · '+g.scores[i]+' pt'+(g.scores[i]===1?'':'s')}
    choose={selectRecipient&&i!==seat?()=>setTo(i):undefined}/>)}
  </div>
  {g.phase==='deposit'&&myTurn&&<form className="piggy-controls" onSubmit={e=>{if(to!==null&&coins.length)submit(e,{kind:'pass-bank',black:total('black'),white:total('white'),to});else e.preventDefault()}}>
   <div className="piggy-actions" aria-label="Coin tray">
    <button type="button" className="piggy-coin-button" onClick={()=>add('black')} disabled={!active||coins.length>=piggyRules.maxCoins} aria-label="Add black coin"><PiggyCoin color="black"/><span>Black</span></button>
    <button type="button" className="piggy-coin-button" onClick={()=>add('white')} disabled={!active||coins.length>=piggyRules.maxCoins} aria-label="Add white coin"><PiggyCoin color="white"/><span>White</span></button>
    <span className="piggy-added" aria-label={total('black')+' black, '+total('white')+' white selected'}>{coins.map((c,i)=><PiggyCoin key={i} color={c}/>)}<b>{coins.length}/5</b></span>
    <button type="button" onClick={()=>setCoins(cs=>cs.slice(0,-1))} disabled={!active||!coins.length}>Undo coin</button>
   </div>
   <div className="piggy-actions"><span className="piggy-hint">Tap a rival’s bank to pass to them.</span><button className="primary" type="submit" disabled={!active||!coins.length||to===null}>{to===null?'Pass bank':'Pass to '+who(to)}</button></div>
  </form>}
  {g.phase==='claim'&&myTurn&&<form className="piggy-controls piggy-actions" onSubmit={e=>{if(valid(count))submit(e,{kind:'claim',count:+count});else e.preventDefault()}}>
   <label className="piggy-count"><PiggyCoin color={g.color}/><span>{capitalize(g.color)} coins</span><input inputMode="numeric" type="text" pattern="[0-9]{1,3}" maxLength={3} value={count} onChange={e=>setCount(e.target.value)} disabled={!canClaim}/></label>
   <button className="primary" type="submit" disabled={!canClaim||!valid(count)}>Claim count</button>
  </form>}
  {g.phase==='doubt'&&g.canDoubt&&<div className="piggy-controls piggy-actions"><button className="primary" type="button" onClick={()=>send({kind:'doubt'})} disabled={!active}>Doubt claim</button><button type="button" onClick={()=>send({kind:'accept'})} disabled={!active}>Let it pass</button></div>}
  {g.phase==='challenge'&&myTurn&&<form className="piggy-controls" onSubmit={e=>{
   if(validChallenge)submit(e,{kind:'challenge',counts:g.bankIds.map(id=>({black:+challenge[id].black!,white:+challenge[id].white!}) as PiggyCoins)})
   else e.preventDefault()
  }}>
   <div className="piggy-challenge">{g.bankIds.map(bank=><fieldset key={bank}><legend>Bank {bank}</legend>{(['black','white'] as const).map(color=><label key={color}><PiggyCoin color={color}/><span className="sr">{capitalize(color)} coins in bank {bank}</span><input type="text" inputMode="numeric" pattern="[0-9]{1,3}" maxLength={3} value={challenge[bank]?.[color]??''} onChange={e=>{const n=e.target.value;setChallenge(c=>({...c,[bank]:{...c[bank],[color]:n}}))}} disabled={!canChallenge}/></label>)}</fieldset>)}</div>
   <div className="piggy-actions"><button className="primary" type="submit" disabled={!canChallenge||!validChallenge}>Seal all counts</button><button type="button" disabled={!canChallenge} onClick={()=>send({kind:'skip'})}>Skip challenge</button></div>
  </form>}
  {g.phase==='done'?<p className="piggy-hint">{g.reason==='goal'?'Five-point goal reached.':'24 exchanges complete.'}</p>:
   g.phase!=='review'&&g.phase!=='challenge'&&g.resets<piggyRules.resets&&<div className="piggy-reset">
    <span>Reset votes {g.resetCount}/{g.seats.length-1}</span>
    {g.canReset?<button type="button" onClick={()=>send({kind:'reset'})} disabled={!active}>Request reset</button>:g.resetUsed?<small>Vote sealed</small>:null}
   </div>}
 </section>
}
