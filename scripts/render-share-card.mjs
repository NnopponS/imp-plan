// Optional artwork authoring step. Builds use the checked-in raster card.
// If the design changes, bump the raster filename here and in render-pages.mjs.
import {readFile} from 'node:fs/promises'
import {fileURLToPath} from 'node:url'
import {chromium} from '@playwright/test'

const art=new URL('../public/art/',import.meta.url)
const paint=async name=>'data:image/svg+xml;base64,'+(await readFile(new URL(name,art))).toString('base64')
const [keeper,seal]=await Promise.all([paint('landing-hero.svg'),paint('imp-plan-mark.svg')])
const output=fileURLToPath(new URL('imp-plan-social-v1.jpg',art))
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage']})
try{
 const page=await browser.newPage({viewport:{width:1200,height:630},deviceScaleFactor:1})
 await page.setContent(`<!doctype html><html lang="en"><meta charset="utf-8"><title>Imp Plan share artwork</title>
 <style>
  *{box-sizing:border-box}html,body{width:1200px;height:630px;margin:0;overflow:hidden;background:#1b1315}
  .art{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center 45%}
  .wash{position:absolute;inset:0;background:
   linear-gradient(0deg,#1a1013 0%,#211519e8 16%,#21161992 37%,#2217133b 56%,transparent 78%),
   linear-gradient(90deg,#1a1114ba 0%,#1d1417a1 25%,#2117202d 55%,transparent 74%),
   linear-gradient(180deg,#29191893,transparent 38%)}
  .frame{position:absolute;inset:0;width:100%;height:100%}
  .stamp{position:absolute;top:133px;left:460px;width:150px;height:150px;display:grid;place-items:center;border-radius:50%;
   border:2px solid #e7bc7d;background:radial-gradient(ellipse at 36% 32%,#744435,#3f2321 80%);
   box-shadow:0 0 0 7px #2d1c1c,0 0 0 9px #aa784e,0 9px 34px #110b0bd4}
  .stamp img{display:block;width:105px;height:105px;filter:drop-shadow(0 4px 2px #1c1211)}
  .copy{position:absolute;top:94px;inset-inline:300px;text-align:center;color:#ffedce}
  h1{font:normal 120px/.97 Georgia,'Times New Roman',serif;letter-spacing:-.055em;margin:217px 0 11px 0;text-shadow:0 4px 19px #170d0d,1px 2px 0 #351d1d}
  .kicker,.credit{margin:0;font:700 16px system-ui,sans-serif;letter-spacing:.28em;text-transform:uppercase}
  .kicker{color:#f0c78b;text-shadow:0 2px 6px #150d0d}
  .kicker span{display:inline-block;vertical-align:.2em;width:7px;height:7px;margin:0 12px;border:1px solid #dba972;transform:rotate(45deg)}
  .credit{color:#ffe5ba;font-size:13px;letter-spacing:.24em;display:inline-flex;align-items:center;white-space:nowrap;gap:12px;padding:9px 15px;
   background:#372520;border:1px solid #997051;box-shadow:0 0 0 3px #241a19}
  .credit::before,.credit::after{content:'';width:5px;height:5px;background:#d6a571;transform:rotate(45deg)}
 </style>
 <img class="art" src="${keeper}" alt=""><div class="wash"></div>
 <svg class="frame" viewBox="0 0 1200 630" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M38 44Q319 3 600 45 881 3 1162 44L1174 562Q1174 579 1155 579Q882 549 600 614Q318 549 45 579Q26 579 26 562Z" stroke="#dbad72" stroke-width="2"/>
  <path d="M48 56Q319 17 600 57 881 17 1152 56L1164 548Q1164 566 1148 566Q881 536 600 604Q319 536 52 566Q36 566 36 548Z" stroke="#ae8659" stroke-width="1"/>
  <path d="M26 557L25 575Q25 593 47 590Q317 560 600 619Q883 560 1153 590Q1175 593 1175 575L1174 557M56 66Q320 28 600 68Q880 28 1144 66" stroke="#d6a875" stroke-width="1" stroke-opacity=".72"/>
  <path d="M76 87l10-10m-14 26 27-25m1020 9-10-10m14 26-27-25M74 520l18 18m-22 2 11 10m1045-30-18 18m22 2-11 10" stroke="#d9a66b" stroke-width="1"/>
  <path d="M481 496h238m-150 5h62m-31-10 5 5-5 5-5-5Z" stroke="#b68b60" stroke-width="1.15"/>
 </svg>
 <div class="stamp"><img src="${seal}" alt=""></div>
 <div class="copy"><p class="kicker"><span></span>The Strategy Chambers<span></span></p><h1>Imp Plan</h1>
 <p class="credit">Unofficial fan project</p></div>
 </html>`)
 await page.evaluate(async()=>{await Promise.all([...document.images].map(image=>image.decode()));await document.fonts.ready})
 await page.screenshot({path:output,type:'jpeg',quality:90})
}finally{await browser.close()}
console.log('Wrote '+output)
