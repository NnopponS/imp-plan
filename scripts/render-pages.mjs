import {readFileSync,writeFileSync,mkdirSync} from 'node:fs'
import {escapeHtml as e,firstPaint,firstPaintStyle} from './first-paint.mjs'
const entries=JSON.parse(readFileSync(new URL('../src/catalog.json',import.meta.url),'utf8'))
const name='Imp Plan'
const canonical='https://nnoppons.github.io/imp-plan/'
const shareDescription="The Devil's Plan Fan Games"
const shareImage=canonical+'art/imp-plan-social-v1.jpg'
const shareImageAlt='A masked keeper at a candlelit game table, beside the Imp Plan book seal and the label Unofficial Fan Project.'
const seasons=[['The First Plan',1],['Death Room',2],['Dead Again',3]]
const pages=[
 {title:name+' | Unofficial Fan Games',path:'',heading:name,description:'Play The Devil’s Plan-inspired strategy games. Browse Seasons 1–3, try solo practice, or make a private room with a nickname.'},
 ...seasons.map(([subtitle,n])=>({title:'Season '+n+': '+subtitle+' | '+name,path:'season/'+n+'/',heading:'Season '+n+': '+subtitle,description:'Explore '+name+' Season '+n+' challenges, playable fan games, and the rule index.',season:n}))
]
for(const {title,path,season,description} of pages){
 const data=season?entries.filter(g=>g.season===season):entries
 const content=firstPaint({data,description,season,seasons,entries})
 const location=canonical+path
 const shareTitle=season?title:name
 const html=`<!doctype html>
<html lang="en"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${e(title)}</title><meta name="description" content="${e(description)}"><meta name="theme-color" content="#f5eee2">
<link rel="icon" href="/art/imp-plan-mark.svg" type="image/svg+xml">
<link rel="canonical" href="${location}">
<meta property="og:type" content="website"><meta property="og:site_name" content="${e(name)}">
<meta property="og:title" content="${e(shareTitle)}"><meta property="og:description" content="${e(shareDescription)}">
<meta property="og:url" content="${location}"><meta property="og:image" content="${shareImage}">
<meta property="og:image:type" content="image/jpeg">
<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${e(shareImageAlt)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${e(shareTitle)}"><meta name="twitter:description" content="${e(shareDescription)}">
<meta name="twitter:image" content="${shareImage}"><meta name="twitter:image:alt" content="${e(shareImageAlt)}">
<style id="imp-first-paint">
${firstPaintStyle}</style>
</head><body><div id="root">${content}</div><script type="module" src="/src/main.tsx"></script></body></html>
`
 const dir=new URL('../'+path,import.meta.url)
 mkdirSync(dir,{recursive:true});writeFileSync(new URL('index.html',dir),html)
}
writeFileSync(new URL('../public/sitemap.xml',import.meta.url),'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+pages.map(p=>'  <url><loc>'+canonical+p.path+'</loc></url>').join('\n')+'\n</urlset>\n')
