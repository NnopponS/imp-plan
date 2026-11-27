export type GameVenueKind='main'|'prize'|'prison'|'secret'|'final'|'exile'|'mini'|'side'|'unconfirmed'|'unaired'
export type GameVenue={kind:GameVenueKind;label:string;caption:string}
type VenueEntry={id:string;season:number;category:string;original?:string}
type VenueDetail={kind:GameVenueKind;label:string;detail:string}

// Stable catalog IDs distinguish repeat games and deviations from the usual round labels.
// See docs/GAME_VENUES.md for provenance. Venue is separate from fan-rule fidelity.
const details:Readonly<Record<string,VenueDetail>>={
 'S1-13':{kind:'secret',label:'Secret Chamber',detail:'Hidden inside prison'},
 'S1-17':{kind:'side',label:'Side Challenge',detail:'Prison clues'},
 'S1-18':{kind:'side',label:'Side Challenge',detail:'Secret Chamber unlock'},
 'S2-16':{kind:'secret',label:'Secret Chamber',detail:'Living quarters'},
 'S2-17':{kind:'secret',label:'Secret Chamber',detail:'Hidden inside prison'},
 'S3-02':{kind:'mini',label:'Main Match',detail:'Either Or mini-game 1'},
 'S3-03':{kind:'mini',label:'Main Match',detail:'Either Or mini-game 2'},
 'S3-04':{kind:'mini',label:'Main Match',detail:'Either Or mini-game 3'},
 'S3-05':{kind:'mini',label:'Main Match',detail:'Either Or mini-game 4'},
 'S3-23':{kind:'exile',label:'Exile Match',detail:'Exile Zone match 7'},
 'S3-24':{kind:'secret',label:'Hidden Stage',detail:'Exile Zone'},
 'S3-25':{kind:'secret',label:'Hidden Stage',detail:'Living quarters'},
 'S3-26':{kind:'exile',label:'Exile Showdown',detail:'Exile Zone finale'},
 'S3-28':{kind:'final',label:'Final Match',detail:'Final game 2'},
 'S3-29':{kind:'final',label:'Final Match',detail:'Final game 3'},
}

const numbered={
 Main:{kind:'main',label:'Main Match'},
 Prize:{kind:'prize',label:'Prize Match'},
 Prison:{kind:'prison',label:'Prison Match'},
 Final:{kind:'final',label:'Final Match'},
} as const

export function getGameVenue(entry:VenueEntry):GameVenue{
 const caption=(detail:string)=>'Season '+entry.season+' · '+detail
 if(entry.original==='unaired'||entry.category==='Unplayed final slot'){
  return {kind:'unaired',label:entry.category==='Unplayed final slot'?'Unplayed final slot':'Unaired',caption:caption('Not played on air')}
 }
 const override=details[entry.id]
 if(override)return {kind:override.kind,label:override.label,caption:caption(override.detail)}
 const day=/^(Main|Prize|Prison|Final) D([1-7])$/.exec(entry.category)
 if(day)return {...numbered[day[1] as keyof typeof numbered],caption:caption('Day '+day[2])}
 if(entry.category==='Exile')return {kind:'exile',label:'Exile Match',caption:caption('Exile Zone')}
 return {kind:'unconfirmed',label:'Setting unconfirmed',caption:caption('Show setting not verified')}
}
