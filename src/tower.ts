export const towerVersion='en-1'
export const towerTime=240_000
export const towerHeight=8
export const towerPacks={
 Music:['TONE','NOTE','BASS','DRUM','CHORD','OBOE','PIANO','CELLO','VIOLA','FLUTE','HARP','BRASS','TEMPO','RHYTHM','MELODY','ORGAN'],
 Garden:['ROSE','MINT','IRIS','LILY','DAHLIA','FERN','IVY','TULIP','VIOLET','ORCHID','CROCUS','POPPY','ASTER','AZALEA','THYME','PANSY'],
 Weather:['RAIN','HAIL','SNOW','FROST','STORM','THUNDER','FOG','MIST','CLOUD','WIND','BREEZE','SLEET','DRIZZLE','GUST','DROUGHT','HUMID'],
 Kitchen:['FORK','SPOON','PLATE','BOWL','KNIFE','LADLE','WHISK','SIEVE','TONGS','GRATER','KETTLE','BLENDER','SKILLET','SPATULA','POT','CUP'],
} as const
type Theme=keyof typeof towerPacks
export type Tower={theme:Theme,tiles:string[],columns:number[][],deal:string[],limit:number}
export type TowerEdit={tile:number,dest:number}
const alphabet=Object.keys(towerPacks) as Theme[]
export function towerStart(seed:number,seats:number):Tower{
 let x=Math.imul(seed^0x5b3e941,0x9e3779b9)>>>0
 const rand=(len:number)=>{
  x=(Math.imul(x,1664525)+1013904223)>>>0
  return Math.floor(x/4294967296*len)
 }
 const shuffle=<T,>(src:readonly T[])=>{
  const arr=src.slice()
  for(let i=arr.length-1;i>0;i--){const j=rand(i+1);[arr[i],arr[j]]=[arr[j],arr[i]]}
  return arr
 }
 const theme=alphabet[rand(alphabet.length)]
 const n=Math.min(6,3+Math.floor(seats/4))
 const deal=shuffle<string>(towerPacks[theme]).slice(0,n)
 return {theme,deal,tiles:shuffle([...deal.join('')]),columns:Array.from({length:n},()=>[]),limit:3*seats+18}
}
const radix=4096, stride=56
const encode=({tile,dest}:TowerEdit)=>Number.isInteger(tile)&&tile>=0&&tile<48&&Number.isInteger(dest)&&dest>=0&&dest<55?1+tile*stride+dest:0
export function packTower(edits:TowerEdit[]){
 if(edits.length>2)return -1
 const numbers=edits.map(encode)
 return numbers.some(n=>!n)?-1:(numbers[0]??0)+radix*(numbers[1]??0)
}
export function applyTowerStep(t:Pick<Tower,'tiles'|'columns'>,{tile,dest}:TowerEdit):number[][]|null{
 if(!encode({tile,dest})||tile>=t.tiles.length)return null
 const where=(id:number)=>t.columns.findIndex(c=>c.includes(id))
 const source=where(tile)
 const columns=t.columns.map(c=>c.slice())
 if(dest===0){
  if(source<0)return null
  columns[source].splice(columns[source].indexOf(tile),1)
 }else if(dest<=6){
  const target=dest-1
  if(target>=columns.length||source===target||columns[target].length>=towerHeight)return null
  if(source>=0)columns[source].splice(columns[source].indexOf(tile),1)
  columns[target].push(tile)
 }else{
  const other=dest-7
  if(other>=t.tiles.length||other===tile)return null
  const target=where(other)
  if(source<0&&target<0)return null
  const a=source<0?-1:columns[source].indexOf(tile)
  const b=target<0?-1:columns[target].indexOf(other)
  if(a>=0)columns[source][a]=other
  if(b>=0)columns[target][b]=tile
 }
 return columns
}
export function towerEdit(t:Tower,a:number):Tower|null{
 if(!Number.isSafeInteger(a)||a<0||a>=radix*radix)return null
 if(a===0)return t // an intentional pass
 if(a%radix===0)return null
 let draft=t
 for(let n=a;n>0;n=Math.floor(n/radix)){
  const code=n%radix-1
  const columns=applyTowerStep(draft,{tile:Math.floor(code/stride),dest:code%stride})
  if(!columns)return null
  draft={...draft,columns}
 }
 return draft
}
export function towerCheck(t:Tower){
 const words=t.columns.map(col=>col.map(id=>t.tiles[id]).join(''))
 const accepted=new Set<string>(towerPacks[t.theme])
 const valid=new Set(words.filter(word=>accepted.has(word))).size
 const used=t.columns.flat().length
 return {valid,used,passed:valid===t.columns.length&&used===t.tiles.length}
}
export function towerView(t:Tower,done=false){
 return {theme:t.theme,tiles:t.tiles,columns:t.columns,limit:t.limit,score:towerCheck(t),version:towerVersion,example:done?t.deal:null}
}
