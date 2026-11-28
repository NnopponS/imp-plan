// The partition witness is checked during generation and never retained by the room.
export type Cell=readonly [number,number]
export type Fit={piece:number;anchor:number;orientation:number}
export type RelayAction=({kind:'place'|'mark'}&Fit)|{kind:'undo';piece:number}
export type Relay={
 width:number;height:number;pieces:Cell[][];fits:(Fit|null)[];reflect:boolean;seats:string[]
 turns:number;limit:number;started:number;ends:number;deadline:number;marks:Record<string,Fit>
 reason:'tiled'|'clock'|'turns'|null;elapsed:number|null
}
export const relayTurn=20_000,relayTime=300_000
type Layout=Pick<Relay,'width'|'height'|'pieces'|'reflect'>
const norm=(p:Cell[])=>{
 const x=Math.min(...p.map(c=>c[0])),y=Math.min(...p.map(c=>c[1]))
 return p.map(([a,b]):Cell=>[a-x,b-y]).sort((a,b)=>a[1]-b[1]||a[0]-b[0])
}
export function orient(p:Cell[],code:number){
 let cells=code>=4?p.map(([x,y]):Cell=>[-x,y]):p
 for(let i=0;i<code%4;i++)cells=cells.map(([x,y]):Cell=>[-y,x])
 return norm(cells)
}
export function footprint(g:Layout,f:Fit){
 const {piece,anchor,orientation}=f
 if(!Number.isInteger(piece)||!g.pieces[piece]||!Number.isInteger(anchor)||anchor<0||anchor>=g.width*g.height||
  !Number.isInteger(orientation)||orientation<0||orientation>(g.reflect?7:3))return []
 const ox=anchor%g.width,oy=Math.floor(anchor/g.width)
 const cells=orient(g.pieces[piece],orientation).map(([x,y])=>x+ox>=g.width||y+oy>=g.height?-1:(y+oy)*g.width+x+ox)
 return cells.includes(-1)?[]:cells
}
export function owners(g:Layout&Pick<Relay,'fits'>){
 const a:number[]=Array(g.width*g.height).fill(-1)
 for(const f of g.fits)if(f)for(const c of footprint(g,f))a[c]=f.piece
 return a
}
export function fits(g:Layout&Pick<Relay,'fits'>,f:Fit){
 if(g.fits[f.piece])return false
 const cells=footprint(g,f),taken=owners(g)
 return !!cells.length&&cells.every(c=>taken[c]===-1)
}
function generator(seed:number){
 let s=seed|0
 return (n:number)=>{s=(s+0x6d2b79f5)|0;let z=Math.imul(s^s>>>15,1|s);z^=z+Math.imul(z^z>>>7,61|z);return Math.floor(((z^z>>>14)>>>0)/4294967296*n)}
}
export function relayLayout(n:number,seed:number){
 let width=6,height=6,best=Infinity
 for(let h=6;h<=10;h++)for(let w=h;w<=10;w++){
  const cost=Math.abs(w*h-(12+4*n))*10+w-h
  if(cost<best){best=cost;width=w;height=h}
 }
 const rand=generator(seed),area=width*height
 let path=Array.from({length:area},(_,i)=>{const y=Math.floor(i/width);return y*width+(y%2?width-1-i%width:i%width)})
 // Backbite moves preserve a single orthogonal path through every board cell.
 for(let i=0;i<area*3;i++){
  if(rand(2))path.reverse()
  const head=path[0],x=head%width,y=Math.floor(head/width)
  const neighbors=[x>0?head-1:-1,x+1<width?head+1:-1,y>0?head-width:-1,y+1<height?head+width:-1].filter(c=>c>=0&&c!==path[1])
  if(neighbors.length){const j=path.indexOf(neighbors[rand(neighbors.length)]);path=path.slice(0,j).reverse().concat(path.slice(j))}
 }
 const items:{cells:Cell[];anchor:number;orientation:number}[]=[]
 for(let pos=0;pos<area;){
  const lengths=[3,4,5].filter(k=>area-pos===k||area-pos-k>=3)
  const len=lengths[rand(lengths.length)],part=path.slice(pos,pos+len)
  const coords=part.map((c):Cell=>[c%width,Math.floor(c/width)])
  const twist=rand(4)
  items.push({cells:orient(coords,twist),anchor:Math.min(...coords.map(c=>c[1]))*width+Math.min(...coords.map(c=>c[0])),orientation:(4-twist)%4})
  pos+=len
 }
 for(let i=items.length-1;i>0;i--){const j=rand(i+1);[items[i],items[j]]=[items[j],items[i]]}
 const pieces=items.map(p=>p.cells)
 const witness=items.map(({orientation,anchor},piece)=>({piece,orientation,anchor}))
 const covered=witness.flatMap(f=>footprint({width,height,pieces,reflect:false},f))
 if(covered.length!==area||new Set(covered).size!==area)throw Error('Unsolvable relay partition.')
 return {width,height,pieces,witness}
}
export function relayStart(seats:string[],seed:number,now:number,reflect=false):Relay{
 if(!seats.length||seats.length>16||new Set(seats).size!==seats.length)throw Error('Invalid relay roster.')
 const {width,height,pieces}=relayLayout(seats.length,seed)
 return {width,height,pieces,seats:[...seats],reflect,fits:pieces.map(()=>null),turns:0,limit:3*seats.length+20,
  started:now,ends:now+relayTime,deadline:now+relayTurn,marks:{},reason:null,elapsed:null}
}
const finish=(g:Relay,reason:NonNullable<Relay['reason']>,now:number):Relay=>({...g,reason,marks:{},elapsed:now-g.started})
function handoff(g:Relay,now:number):Relay{
 const next={...g,turns:g.turns+1,deadline:Math.min(g.ends,now+relayTurn),marks:{}}
 if(next.fits.every(f=>f!==null))return finish(next,'tiled',now)
 return next.turns>=next.limit?finish(next,'turns',now):next
}
export function relayTick(g:Relay,now:number):Relay{
 while(!g.reason&&now>=g.deadline){
  if(g.deadline===g.ends)return finish(g,'clock',g.ends)
  g=handoff(g,g.deadline)
 }
 return g
}
export function relayStep(g:Relay,seat:string,a:RelayAction,now:number):Relay|null{
 if(g.reason||!Number.isFinite(now)||now<g.started||now>=g.deadline||!g.seats.includes(seat))return null
 if(a.kind!=='mark'&&seat!==g.seats[g.turns%g.seats.length])return null
 if(a.kind==='undo'){
  if(!Number.isInteger(a.piece)||!g.fits[a.piece])return null
  return handoff({...g,fits:g.fits.map((f,i)=>i===a.piece?null:f)},now)
 }
 const f:Fit={piece:a.piece,anchor:a.anchor,orientation:a.orientation}
 if(!fits(g,f))return null
 if(a.kind==='mark')return {...g,marks:{...g.marks,[seat]:f}}
 return handoff({...g,fits:g.fits.map((p,i)=>i===f.piece?f:p)},now)
}
export const relayFilled=(g:Relay)=>g.fits.reduce((n,f)=>n+(f?g.pieces[f.piece].length:0),0)
