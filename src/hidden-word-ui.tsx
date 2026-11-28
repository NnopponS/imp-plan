import {useEffect,useId,useRef,useState} from 'react'
import {base} from './brand'
import {hiddenNouns,type HiddenAction,type HiddenView} from './hidden-word'
import './hidden-word.css'

type Props={view:HiddenView;you:string;name:(seat:string)=>string;active:boolean;hostNow:number;receivedAt?:number;send:(action:HiddenAction)=>void}
const norm=(value:string)=>value.trim().toLowerCase()
const index=(n:number)=>String(n).padStart(2,'0')
const phases={choose:'Choose a private noun',clue:'Publish a clue',guess:'Seal an answer',review:'Open the guesses',done:'Final standings'} as const

function useSeconds(deadline:number|null,hostNow:number,receivedAt?:number){
 const [local,setLocal]=useState(()=>performance.now())
 useEffect(()=>{
  if(deadline===null)return
  const update=()=>setLocal(performance.now())
  update()
  const interval=window.setInterval(update,250)
  document.addEventListener('visibilitychange',update)
  return ()=>{clearInterval(interval);document.removeEventListener('visibilitychange',update)}
 },[deadline,hostNow,receivedAt])
 if(deadline===null)return null
 return Math.max(0,Math.ceil((deadline-hostNow-Math.max(0,local-(receivedAt??local)))/1000))
}

function GuessDesk({view:v,enabled,submit}:{view:HiddenView;enabled:boolean;submit:(a:HiddenAction)=>void}){
 const [answer,setAnswer]=useState('')
 const [second,setSecond]=useState('')
 const [bonus,setBonus]=useState(false)
 const [field,setField]=useState<'first'|'second'>('first')
 const description=useId()
 const mine=v.mine!
 const first=norm(answer), extra=norm(second)
 const excluded=new Set([...mine.envelope,...v.misses,...v.history.map(r=>r.answer)])
 const usable=hiddenNouns.filter(noun=>!excluded.has(noun))
 const signing=usable.includes(first)&&(!bonus||(usable.includes(extra)&&first!==extra))
 const focus=bonus&&field==='second'?extra:first
 const options=focus?usable.filter(noun=>noun.startsWith(focus)):usable
 const select=(noun:string)=>bonus&&field==='second'?setSecond(noun):setAnswer(noun)
 return <form className="hw-guess" onSubmit={event=>{
  event.preventDefault()
  if(enabled&&signing)submit({kind:'guess',words:bonus?[first,extra]:[first]})
 }}>
  <h4>Write your answer</h4>
  <p id={description} className="hw-note">Only your seat reads your draft or sealed answer. Previously ruled-out nouns are not in this word bank.</p>
  <div className="hw-drafts">
   <label>Your answer<input name="hidden-guess" type="text" value={answer} spellCheck={false} autoComplete="off" aria-describedby={description}
    maxLength={40} onFocus={()=>setField('first')} onChange={e=>{setField('first');setAnswer(e.target.value)}} disabled={!enabled}/></label>
   {bonus&&<label>Bonus answer<input name="hidden-bonus" type="text" value={second} spellCheck={false} autoComplete="off" aria-describedby={description}
    maxLength={40} onFocus={()=>setField('second')} onChange={e=>{setField('second');setSecond(e.target.value)}} disabled={!enabled}/></label>}
  </div>
  <details className="hw-bank">
   <summary>Browse word bank · {options.length} {options.length===1?'noun':'nouns'}</summary>
   <div className="hw-bank-options" role="group" aria-label={(bonus&&field==='second'?'Bonus':'Main')+' answer suggestions'}>
    {options.length?options.map(noun=><button key={noun} type="button" disabled={!enabled} onClick={()=>select(noun)}>{noun}</button>)
     :<p className="hw-note">No matching nouns. Try a different spelling or clear the input.</p>}
   </div>
  </details>
  <div className="hw-actions">
   {mine.bonusAvailable?<button type="button" className="hw-quiet" disabled={!enabled} aria-pressed={bonus}
    onClick={()=>{setBonus(!bonus);setField(bonus?'first':'second')}}>{bonus?'Remove bonus answer':'Use a bonus seal'}</button>:
    <span className="hw-note">{mine.seals?'Bonus already used for this word.':'No bonus seals left.'}</span>}
   <button type="button" className="hw-quiet" disabled={!enabled} onClick={()=>submit({kind:'guess',words:[]})}>Pass</button>
   <button type="submit" className="hw-primary" disabled={!signing||!enabled}>Seal {bonus?'two answers':'answer'}</button>
  </div>
 </form>
}

function FolioDesk({v,you,name,enabled,send}:{v:HiddenView;you:string;name:Props['name'];enabled:boolean;send:Props['send']}){
 const [posting,setPosting]=useState(false)
 const timer=useRef<ReturnType<typeof setTimeout>|undefined>(undefined)
 useEffect(()=>()=>clearTimeout(timer.current),[])
 const submit=(action:HiddenAction)=>{
  if(!enabled||timer.current!==undefined)return
  setPosting(true)
  timer.current=setTimeout(()=>{timer.current=undefined;setPosting(false)},1500)
  send(action)
 }
 const mine=v.mine
 const active=enabled&&!posting
 if(v.phase==='done')return <div className="hw-done" role="status">
  <span className="hw-index">{v.history.length} words opened</span>
  <h4>{v.standings.filter(p=>p.rank===1).length>1?'Shared lead':name(v.standings[0].seat)+' wins'}</h4>
  <p className="hw-note">Both setter rotations are complete. Open the word history to review the answers.</p>
 </div>
 if(!mine)return <p className="hw-note">Watching this table.</p>
 if(v.phase==='choose')return mine.locked?<div className="hw-sealed" role="status">
  <span className="hw-index">Private envelope sealed</span><h4>{mine.chosen}</h4><p className="hw-note">Waiting for the other seats.</p>
 </div>:<div>
  <h4>Open your envelope</h4><p className="hw-note">Choose one noun to defend this round. This hand is visible only to your seat.</p>
  <div className="hw-nouns" role="group" aria-label="Private envelope">
   {mine.envelope.map((word,i)=><button key={word} type="button" className="hw-paper" disabled={!active} onClick={()=>submit({kind:'choose',word})}><small aria-hidden="true">FILE {index(i+1)}</small>{word}</button>)}
  </div>
 </div>
 if(v.phase==='clue')return mine.isSetter?<div>
  <h4>Clue for <b>{mine.chosen}</b></h4><p className="hw-note">{v.stage===1?'Lead with a broad link.':v.stage===2?'Choose an association shared by just two nouns.':'Reveal the most specific association.'} The clue and its rating become public.</p>
  <div className="hw-nouns" role="group" aria-label="Private clue options">{mine.clues.map(c=><button key={c.word} type="button" className="hw-paper" disabled={!active}
   onClick={()=>submit({kind:'clue',word:c.word})}><small>{c.score}% association</small>{c.word}</button>)}</div>
 </div>:<div className="hw-sealed" role="status"><span className="hw-index">Waiting for a clue</span><h4>{name(v.setter!)} is setting</h4><p className="hw-note">Read the public clues before submitting. Your own word is still concealed.</p></div>
 if(v.phase==='guess'){
  if(mine.isSetter)return <div className="hw-sealed" role="status"><span className="hw-index">Defending · private noun</span><h4>{mine.chosen}</h4><p className="hw-note">Answers open together. You get {v.stage*v.round} {v.stage*v.round===1?'point':'points'} if no one solves this stage.</p></div>
  if(mine.guess!==null)return <div className="hw-sealed" role="status"><span className="hw-index">{mine.guess.length?'Your answer is sealed':'You passed'}</span>
   {mine.guess.length>0&&<h4>{mine.guess.join(' / ')}</h4>}<p className="hw-note">Waiting for the joint reveal.</p></div>
  return <GuessDesk view={v} enabled={active} submit={submit}/>
 }
 const result=v.review!
 return <div className="hw-review" aria-live="polite">
  <span className="hw-index">{result.answer?'Word opened':'Word still hidden'}</span>
  <h4>{result.answer??'No correct answer'}</h4>
  <p className="hw-note">{result.correct.length?'+ '+result.guessPoints+' '+(result.guessPoints===1?'point':'points')+' per correct reader.':
   name(v.setter!)+' earns '+result.setterPoints+' '+(result.setterPoints===1?'point':'points')+(result.answer?'.':' and posts a narrower clue next.')}</p>
  <ul className="hw-open-guesses" role="list" aria-label="Simultaneous answers">
   {result.guesses.map(({seat,words})=><li key={seat} data-correct={result.correct.includes(seat)||undefined}>
    <span>{name(seat)}{seat===you?' (you)':''}</span><strong>{words.join(' / ')||'Pass'}</strong>
    {result.correct.includes(seat)&&<small>Correct</small>}
   </li>)}
  </ul>
 </div>
}

export function HiddenWordBoard({view:v,you,name,active,hostNow,receivedAt,send}:Props){
 const seconds=useSeconds(v.deadline,hostNow,receivedAt)
 const hasCase=v.phase!=='choose'&&v.phase!=='done'
 return <section className="hw-board" aria-label="Hidden Word table" data-word-phase={v.phase} data-word-round={v.round} data-word-stage={v.stage}>
  <header className="hw-header">
   <img src={base+'art/hidden-word-stage.svg'} alt="" decoding="async" width={1200} height={390}/>
   <div className="hw-header-copy"><span className="hw-index">Lexical observatory <i> / </i> {hasCase?'Case '+index((v.round-1)*v.order.length+v.slot+1):'Hidden Word'}</span>
    <h3>{phases[v.phase]}</h3>
    <span>Round {v.round} / 2{v.round===2?' · Double points':''}{hasCase?' · Stage '+v.stage+' / 3':''}</span>
   </div>
   {seconds!==null&&<span className="hw-countdown" role="timer" aria-label={(v.phase==='review'?'Review ends in ':'Stage clock ends in ')+seconds+' seconds'}>{seconds}<small>s</small></span>}
  </header>
  <div className="hw-layout">
   <div className="hw-work">
    {hasCase&&<div className="hw-public">
     <div><span className="hw-index">Public clue register</span><p className="hw-note">Setter: <b>{v.setter===you?'You':name(v.setter!)}</b></p></div>
     {v.clues.length?<ol className="hw-clues" aria-label="Public clues">{v.clues.map((c,i)=><li key={c.word}>
      <span>{index(i+1)}</span><strong>{c.word}</strong><b>{c.score}%</b></li>)}</ol>:<p className="hw-note">The first clue has not opened.</p>}
     {v.phase!=='review'&&v.misses.length>0&&<p className="hw-note">Ruled out: {[...new Set(v.misses)].join(', ')}.</p>}
    </div>}
    {!active&&v.phase!=='done'&&<p className="hw-note" role="status">Controls paused.</p>}
    {seconds===0&&v.phase!=='review'&&<p className="hw-note" role="status">Waiting for the host clock.</p>}
    <FolioDesk key={v.step} v={v} you={you} name={name} enabled={active&&seconds!==null&&seconds>0} send={send}/>
   </div>
   <aside className="hw-ledger" aria-label="Hidden Word standings">
    <span className="hw-index">Public register</span><h4>Standings</h4>
    <ol>{v.standings.map(r=><li key={r.seat} data-current={r.seat===v.setter||undefined}>
     <span className="hw-rank" aria-label={'Rank '+r.rank}>{index(r.rank)}</span><span>{name(r.seat)}{r.seat===you?' (you)':''}</span>
     <strong>{r.points}<small> pts</small></strong>
    </li>)}</ol>
    {v.mine&&<p className="hw-seals"><span aria-hidden="true">◇</span> {v.mine.seals} {v.mine.seals===1?'bonus seal':'bonus seals'} left<span className="sr"> for your seat</span></p>}
    {v.history.length>0&&<details className="hw-history">
     <summary>Word history · {v.history.length}</summary>
     <ol>{v.history.map(c=><li key={c.round+':'+c.setter}><span className="hw-rank">R{c.round}</span><span><b>{c.answer}</b><small>{name(c.setter)}</small></span><strong>{c.scored}<small> set pts</small></strong></li>)}</ol>
    </details>}
   </aside>
  </div>
  <footer className="hw-foot"><span>English association deck · 96 nouns</span><span>Bonus seals have no real value</span></footer>
 </section>
}
