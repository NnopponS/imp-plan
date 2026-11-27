import {useRef,useState,type ReactNode} from 'react'
import {seasons,seasonHref} from './brand'
import {titles,type Game} from './engine'
import {GameToken,GameVenue} from './game-identity'
import {gameSearchKey} from './game-search'
import {getGameVenue,type GameVenueKind} from './game-venues'
import './folio-controls.css'

type Mark='search'|'folio'|'stacks'|'venue'|'play'|'archive'|'main'|'prize'|'prison'|'secret'|'exile'|'final'|'other'|'name'|'create'|'invite'|'join'|'settings'|'arrow'
const engraving:Record<Mark,string>={
 search:'M12.8 12.8l5.1 5.1M4 9.2a5.2 5.2 0 1 0 10.4 0 5.2 5.2 0 0 0-10.4 0Z',
 folio:'M3 4h5.5l1.5 2 1.5-2H17v12h-5.5L10 18l-1.5-2H3z M10 7v8M5 8h2.6M12.4 8H15',
 stacks:'M3 8l7-4 7 4-7 4z M3 11l7 4 7-4m-14 3 7 4 7-4',
 venue:'M3 5h14M3 10h14M3 15h14M6 3v4m7 1v4m-5 1v4',
 play:'M4 4h12v12H4zM8 7l5 3-5 3z',
 archive:'M5 3h8l3 3v11H5zm8 0v4h3M7.5 11h6m-6 2.5h5',
 main:'M10 3l7 7-7 7-7-7z M10 7l3 3-3 3-3-3z',
 prize:'M6 4h8v4a4 4 0 0 1-8 0zm0 2H3v1a4 4 0 0 0 3 3m8-4h3v1a4 4 0 0 1-3 3m-4 2v4m-3 0h6',
 prison:'M4 4h12v12H4zM8 4v12m4-12v12',
 secret:'M4 17V9a6 6 0 0 1 12 0v8z M10 12v2m0-5h.01',
 exile:'M3 14l7-10 7 10zm2 3h10m-5-9v3m0 2h.01',
 final:'M10 3l2.2 4.3 4.8.6-3.5 3.5.8 4.9-4.3-2.5-4.3 2.5.8-4.9L3 7.9l4.8-.6z',
 other:'M10 3.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13Zm-3 6.5h.01m3 0h.01m3 0h.01',
 name:'M3 5h14v10H3zM6 12c.2-2.1 3.8-2.1 4 0M8 8.2h.01M12.5 8.5H15m-2.5 3H15',
 create:'M4 17V9a6 6 0 0 1 12 0v8M2 17h16m-8-4v-5m-2.5 2.5h5',
 invite:'M3 7v6l3 3h11V4H6z M6.5 10h.01M10 4v12m3-9h2m-2 3h2m-2 3h2',
 join:'M10 4h6v12h-6m-6-6h9m-3-3 3 3-3 3',
 settings:'M10 4v2m0 8v2M4 10h2m8 0h2M5.7 5.7l1.4 1.4m5.8 5.8 1.4 1.4m0-8.6-1.4 1.4m-5.8 5.8-1.4 1.4M10 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z',
 arrow:'M4 10h11m-4-4 4 4-4 4',
}
export function FolioMark({kind}:{kind:Mark}){
 return <svg className="folio-mark" viewBox="0 0 20 20" width="20" height="20" fill="none" aria-hidden="true" focusable="false"><path d={engraving[kind]} stroke="currentColor" strokeWidth="1.45" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
function ChapterSeal({season}:{season:number}){
 const bars=season===1?'M12 8v10':season===2?'M10 8v10m4-10v10':'M8 8v10m4-10v10m4-10v10'
 return <svg className="chapter-seal" viewBox="0 0 24 30" width="24" height="30" fill="none" aria-hidden="true" focusable="false">
  <path className="chapter-metal" d="M1 2h22v26l-11-5-11 5z"/>
  <path d="M4 5h16v19l-8-4-8 4z" stroke="currentColor" opacity=".45"/>
  <path d={bars} stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
 </svg>
}
export function ChapterBookmarks({selected}:{selected?:number}){
 return <nav className="topright season-nav chapter-bookmarks" aria-label="Seasons">{seasons.map(chapter=><a className="chapter-bookmark" href={seasonHref(chapter.id)} key={chapter.id} aria-label={'Season '+chapter.id} aria-current={selected===chapter.id?'page':undefined} data-chapter={chapter.id}><ChapterSeal season={chapter.id}/><span>{chapter.title}</span></a>)}</nav>
}

const venueBins:{id:Mark;name:string;groups:GameVenueKind[]}[]=[
 {id:'main',name:'Main',groups:['main','mini']},
 {id:'prize',name:'Prize',groups:['prize']},
 {id:'prison',name:'Prison',groups:['prison']},
 {id:'secret',name:'Hidden',groups:['secret']},
 {id:'exile',name:'Exile',groups:['exile']},
 {id:'final',name:'Final',groups:['final']},
 {id:'other',name:'Other',groups:['side','unconfirmed','unaired']},
]
type Scope='all'|'playable'|'archive'
type ArchiveEntry=Parameters<typeof getGameVenue>[0]&{title:string;genre:string;game:string|null}
export function useFolioFilters(){
 const [season,setSeason]=useState(0)
 const [query,setQuery]=useState('')
 const [shelf,setShelf]=useState<Scope>('all')
 const [venueId,setVenueId]=useState<string>()
 return {season,setSeason,query,setQuery,shelf,setShelf,venueId,setVenueId}
}
type ArchiveProps={entries:ArchiveEntry[];selected?:number;onPractice:(game:Game,launcher:string)=>void;filters:ReturnType<typeof useFolioFilters>}
export function ChallengeFolio({entries,selected,onPractice,filters}:ArchiveProps){
 const {season,setSeason,query,setQuery,shelf,setShelf,venueId,setVenueId}=filters
 const searchField=useRef<HTMLInputElement>(null)
 const chapter=selected??season
 const source=entries.filter(entry=>!selected||entry.season===selected)
 const needle=gameSearchKey(query)
 const venue=venueBins.find(bin=>bin.id===venueId)
 const rows=source.filter(entry=>{
  if((chapter&&entry.season!==chapter)||(shelf==='playable'&&!entry.game)||(shelf==='archive'&&entry.game))return false
  const context=getGameVenue(entry)
  return (!venue||venue.groups.includes(context.kind))&&gameSearchKey([entry.title,entry.genre,entry.category,entry.id,context.label,context.caption].join(' ')).includes(needle)
 })
 function reset(){setSeason(0);setQuery('');setShelf('all');setVenueId(undefined);searchField.current?.focus()}
 return <details id="catalog" className="index library-index challenge-folio">
  <summary><span><FolioMark kind="folio"/>Challenge index</span><small>{source.length} entries</small><span className="index-toggle" aria-hidden="true"/></summary>
  <div className="challenge-controls">
   <label className="archive-search"><span className="sr">Search challenge index</span><FolioMark kind="search"/><input ref={searchField} type="search" value={query} onChange={event=>setQuery(event.target.value)} placeholder="Find a game or mechanic"/></label>
   <div className="archive-shelves" role="group" aria-label="Challenge type">
    <button type="button" aria-pressed={shelf==='all'} onClick={()=>setShelf('all')}><FolioMark kind="stacks"/> All</button>
    <button type="button" aria-label="Playable only" aria-pressed={shelf==='playable'} onClick={()=>setShelf('playable')}><FolioMark kind="play"/> Playable</button>
    <button type="button" aria-label="Archive only" aria-pressed={shelf==='archive'} onClick={()=>setShelf('archive')}><FolioMark kind="archive"/> Archive</button>
   </div>
   {!selected&&<div className="archive-chapters" role="group" aria-label="Season filters">
    <button type="button" aria-label="All seasons" aria-pressed={season===0} onClick={()=>setSeason(0)}><FolioMark kind="folio"/> All</button>
    {seasons.map(chapter=><button type="button" key={chapter.id} aria-label={'Season '+chapter.id} aria-pressed={season===chapter.id} onClick={()=>setSeason(chapter.id)} data-chapter={chapter.id}><ChapterSeal season={chapter.id}/></button>)}
   </div>}
   <details className="archive-venue-controls">
    <summary><span><FolioMark kind="venue"/> {venue?venue.name+' venue':'Filter by venue'}</span></summary>
    <div className="archive-venues" role="group" aria-label="Venue filters">
     {venueBins.map(bin=><button type="button" key={bin.id} data-bin={bin.id} aria-pressed={venueId===bin.id} onClick={()=>setVenueId(venueId===bin.id?undefined:bin.id)}><FolioMark kind={bin.id}/>{bin.name}</button>)}
    </div>
   </details>
  </div>
  <div className="archive-results"><span aria-live="polite">{rows.length} {rows.length===1?'entry':'entries'}</span>{(shelf!=='all'||season!==0||venueId||query)&&<button type="button" className="archive-reset" onClick={reset}>Clear filters</button>}</div>
  <div className="directory folio-register">{rows.map(entry=>{
   const game=entry.game&&Object.hasOwn(titles,entry.game)?entry.game as Game:undefined
   const id='practice-index-'+entry.id
   return <article key={entry.id} data-shelf={game?'playable':'archive'}>
    <div className="register-seal">{game?<GameToken game={game}/>:<FolioMark kind="archive"/>}<span className="mono">{entry.id}</span></div>
    <div className="register-copy"><strong>{entry.title}</strong><GameVenue entry={entry}/><small className="register-genre">{entry.genre}</small></div>
    {game?<button type="button" className="catalog-practice" id={id} onClick={()=>onPractice(game,id)}><FolioMark kind="play"/>Practice <span className="sr">{titles[game]}</span></button>:<small className="catalog-unavailable">Not playable</small>}
   </article>
  })}</div>
  {!rows.length&&<p className="index-note">No matching challenges.</p>}
 </details>
}

export function EntryNameplate({children}:{children:ReactNode}){
 return <div className="entry-identity entry-nameplate"><FolioMark kind="name"/>{children}</div>
}
export function EntryInviteTag({children}:{children:ReactNode}){
 return <div className="entry-invite-tag"><FolioMark kind="invite"/>{children}</div>
}
