import {existsSync,readFileSync} from 'node:fs'

export const escapeHtml=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;')
export const firstPaintStyle=readFileSync(new URL('./first-paint.css',import.meta.url),'utf8')

const artDirectory=new URL('../public/art/',import.meta.url)
// Vite rewrites public media paths to the configured deployment base.
const artUrl='/art/'
const featured=['blind','morris','auction','point','remove','knight','hex','rectangles','cubes','exile']
const customCovers={
 blind:'secret-chamber.svg',colorLink:'color-link-board.svg',wallGo:'wall-go-chamber.svg',wallGo2:'wall-go2-chamber.svg',
 flags:'season-three-flags.svg',threeRow:'season-one-three-row.svg',montage:'montage-chamber.svg',heavy13:'heavy13-chamber.svg',
}
const venueCopy={
 'S1-13':['Secret Chamber','secret'],'S2-16':['Secret Chamber','secret'],'S2-17':['Secret Chamber','secret'],
 'S3-02':['Main Match','main'],'S3-03':['Main Match','main'],'S3-04':['Main Match','main'],'S3-05':['Main Match','main'],
 'S3-24':['Hidden Stage','secret'],'S3-25':['Hidden Stage','secret'],'S3-26':['Exile Showdown','exile'],
}
const year={1:2023,2:2025,3:2026}
const tones=['copper','jade','gold']
const numeral=['I','II','III']
const priority=game=>featured.includes(game)?featured.indexOf(game):featured.length
const href=n=>'%BASE_URL%season/'+n+'/'
const button=(url,label)=>'<a class="boot-button" href="'+url+'">'+escapeHtml(label)+'</a>'
const cover=entry=>{
 const illustration='seasonal-'+entry.game+'.svg'
 const asset=customCovers[entry.game]??(existsSync(new URL(illustration,artDirectory))?illustration:entry.game+'.webp')
 if(!existsSync(new URL(asset,artDirectory)))throw Error('Missing first-paint cover for '+entry.game+': '+asset)
 return artUrl+asset
}
function venue(entry){
 const override=venueCopy[entry.id]
 if(override)return override
 const type=entry.category.split(' ')[0]
 return {
  Main:['Main Match','main'],Prize:['Prize Match','prize'],Prison:['Prison Match','prison'],
  Final:['Final Match','final'],Exile:['Exile Match','exile'],Hidden:['Hidden Stage','secret'],Secret:['Secret Chamber','secret'],
 }[type]??[entry.category,'other']
}
export function firstPaint({data,description,season,seasons,entries}){
 const cards=data.filter(x=>x.game).sort((a,b)=>priority(a.game)-priority(b.game))
 const nav=seasons.map(([title,n],i)=>'<a class="boot-tab boot-'+tones[i]+'" href="'+href(n)+'"'+(season===n?' aria-current="page"':'')+'><span aria-hidden="true">'+numeral[i]+'</span>'+escapeHtml(title)+'</a>').join('')
 const hero=season
  ?'<section class="boot-season boot-rule"><p class="boot-kicker">Season '+season+' · '+year[season]+'</p><h1>'+escapeHtml(seasons[season-1][0])+'</h1>'+button('#room-entry','Create or join a room')+'</section>'
  :'<section class="boot-hero"><picture><source media="(max-width:685px)" srcset="'+artUrl+'landing-hero-mobile.svg"><img src="'+artUrl+'landing-hero.svg" width="1200" height="660" alt="" fetchpriority="high"></picture><div><p class="boot-kicker">The Strategy Chambers</p><h1>Imp Plan</h1><p>'+escapeHtml(description)+'</p>'+button('#play','Browse games')+'</div></section>'
 const chapters=season?'':'<section class="boot-chapters" aria-label="Browse by season">'+seasons.map(([title,n],i)=>{
  const total=entries.filter(g=>g.season===n), playable=total.filter(g=>g.game).length
  return '<a href="'+href(n)+'" class="boot-chapter boot-'+tones[i]+'"><img src="'+artUrl+'landing-season-'+n+'.svg" width="640" height="390" alt="" loading="lazy"><span><small>Season '+n+' · '+playable+' playable</small><strong>'+escapeHtml(title)+'</strong></span></a>'
 }).join('')+'</section>'
 const gallery=cards.map((entry,index)=>{
  const [label,style]=venue(entry)
  return '<li class="boot-card"><article><div class="boot-cover"><img src="'+cover(entry)+'" width="960" height="540" alt=""'+(index>=4?' loading="lazy"':'')+' decoding="async"><span class="boot-venue boot-venue-'+style+'">'+escapeHtml(label)+'</span></div><h3>'+escapeHtml(entry.title)+'</h3></article></li>'
 }).join('')
 const challengeIndex=data.map(g=>'<li>'+escapeHtml(g.title)+'</li>').join('')
 return '<div class="boot-shell" data-first-paint><header class="boot-header"><div class="boot-wrap"><div class="boot-mast"><a class="boot-brand" href="%BASE_URL%"><img src="'+artUrl+'imp-plan-mark.svg" width="34" height="34" alt=""><span><strong>Imp Plan</strong><small>Unofficial fan project</small></span></a><span class="boot-alpha">Playable alpha</span></div><nav aria-label="Seasons">'+nav+'</nav></div></header>'
  +'<main class="boot-wrap">'+hero+chapters+'<section id="play"><div class="boot-gallery-head boot-rule"><h2>'+(season?'Play this season':'Pick a game')+'</h2><span>'+cards.length+' playable</span></div>'
  +'<div class="boot-tools"><a href="#room-entry">Game controls</a><a href="#catalog">Challenge index</a></div><ul class="boot-cards">'+gallery+'</ul></section>'
  +'<section class="boot-entry boot-rule" id="room-entry"><h2>Open the game controls</h2><p>If the game controls haven’t appeared, reload the full experience.</p>'+button('?view=full','Reload game controls')+'<p>Turn on JavaScript to play. You can still browse every season.</p></section>'
  +'<section class="boot-index" id="catalog"><h2>Challenge index</h2><p>'+cards.length+' of '+data.length+' indexed challenges are playable.</p><ul>'+challengeIndex+'</ul></section></main>'
  +'<footer class="boot-wrap boot-footer">Imp Plan is fan-made, not affiliated with Netflix. No real stakes.</footer></div>'
}


// This tiny inline helper must run even if the main module never arrives.
export const firstPaintRecovery = `(() => {
 const shell = document.querySelector('[data-first-paint]');
 const retry = shell.querySelector('a[href="?view=full"]');
 const syncRetry = () => {
  const target = new URL(location.href);
  target.searchParams.set('view', 'full');
  retry.href = target.href;
 };
 syncRetry();
 shell.addEventListener('focusin', syncRetry);
 shell.addEventListener('pointerdown', syncRetry);
 shell.addEventListener('click', (event) => {
  const link = event.target.closest('a');
  if (!link || !shell.contains(link)) return;
  if (event.button || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  if (link === retry) {
   syncRetry();
   // A link to the same URL with a fragment need not request a new document.
   if (retry.href === location.href) {
    event.preventDefault();
    location.reload();
   }
   return;
  }
  if (!location.hash.slice(1).startsWith('/join?')) return;
  const href = link.getAttribute('href');
  if (!['#play', '#catalog', '#room-entry'].includes(href)) return;
  const section = document.getElementById(href.slice(1));
  if (!section) return;
  event.preventDefault();
  section.tabIndex = -1;
  section.focus({preventScroll: true});
  section.scrollIntoView();
 });
})();`
