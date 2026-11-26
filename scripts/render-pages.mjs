import {readFileSync,writeFileSync,mkdirSync} from 'node:fs'
const entries=JSON.parse(readFileSync(new URL('../src/catalog.json',import.meta.url),'utf8'))
const name='Imp Plan'
const canonical='https://nnoppons.github.io/imp-plan/'
const seasons=[['The First Plan',1],['Death Room',2],['Dead Again',3]]
const pages=[
 {title:name+' | Unofficial Fan Games',path:'',heading:name,description:'Play The Devil’s Plan-inspired strategy games. Browse Seasons 1–3, try solo practice, or make a private room with a nickname.'},
 ...seasons.map(([subtitle,n])=>({title:'Season '+n+': '+subtitle+' | '+name,path:'season/'+n+'/',heading:'Season '+n+': '+subtitle,description:'Explore '+name+' Season '+n+' challenges, playable fan games, and the rule index.',season:n}))
]
const e=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;')
for(const {title,path,heading,season,description} of pages){
 const data=season?entries.filter(g=>g.season===season):entries
 const nav=seasons.map(([subtitle,n])=>'<a href="%BASE_URL%season/'+n+'/">Season '+n+': '+e(subtitle)+'</a>').join(' · ')
 const content='<main><h1>'+e(heading)+'</h1><p>'+e(description)+'</p><nav aria-label="Seasons">'+nav+'</nav><h2>Playable fan games</h2><ul>'+data.filter(g=>g.game).map(g=>'<li>'+e(g.title)+'</li>').join('')+'</ul><p>'+data.length+' challenge entries. Unofficial fan project, not affiliated with Netflix. JavaScript is required to start a game.</p></main>'
 const location=canonical+path
 const html=`<!doctype html>
<html lang="en"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${e(title)}</title><meta name="description" content="${e(description)}"><meta name="theme-color" content="#f5eee2">
<link rel="icon" href="%BASE_URL%art/crest.svg" type="image/svg+xml">
<link rel="canonical" href="${location}">
<meta property="og:type" content="website"><meta property="og:site_name" content="${e(name)}">
<meta property="og:title" content="${e(title)}"><meta property="og:description" content="${e(description)}">
<meta property="og:url" content="${location}"><meta property="og:image" content="${canonical}art/social.jpg">
<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
<meta property="og:image:alt" content="A faceted game piece above an inlaid strategy table">
<meta name="twitter:card" content="summary_large_image">
</head><body><div id="root">${content}</div><script type="module" src="/src/main.tsx"></script></body></html>
`
 const dir=new URL('../'+path,import.meta.url)
 mkdirSync(dir,{recursive:true});writeFileSync(new URL('index.html',dir),html)
}
writeFileSync(new URL('../public/sitemap.xml',import.meta.url),'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+pages.map(p=>'  <url><loc>'+canonical+p.path+'</loc></url>').join('\n')+'\n</urlset>\n')
