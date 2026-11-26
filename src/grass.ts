export type GrassGame='grass1'|'grass3'
export const isGrass=(g:string):g is GrassGame=>g==='grass1'||g==='grass3'
type Cell=readonly [number,number]
const forms:Cell[][]=[
 [[0,0],[1,0]],[[0,0],[1,0],[2,0]],[[0,0],[1,0],[0,1]],
 [[0,0],[1,0],[0,1],[1,1]],[[0,0],[1,0],[2,0],[1,1]],
 [[0,0],[0,1],[0,2],[1,2]],[[0,0],[1,0],[1,1],[2,1]],
 [[1,0],[0,1],[1,1],[2,1],[1,2]],[[0,0],[1,0],[2,0],[2,1],[2,2]],
 [[0,0],[1,0],[0,1],[1,1],[0,2]]
]
export function orient(shape:number,transform:number):Cell[]{
 let cells=forms[shape].map(([x,y]):Cell=>[transform>=4?-x:x,y])
 for(let i=0;i<transform%4;i++)cells=cells.map(([x,y]):Cell=>[-y,x])
 const loX=Math.min(...cells.map(c=>c[0])),loY=Math.min(...cells.map(c=>c[1]))
 return cells.map(([x,y])=>[x-loX,y-loY])
}
type Tile={shape:number,bonus:number,taken:boolean}
type Trade={from:number,to:number,points:number}
export type Grass={mode:GrassGame,width:number,board:number[],markers:boolean[],tiles:Tile[],bonus:number[],coupons:boolean[],order:number[],position:number,round:number,phase:'trade'|'draft',passed:number[],traded:number[],offer:Trade|null,placed:number,done:boolean}
const random=(seed:number)=>{let x=seed>>>0;return (n:number)=>{x=(Math.imul(1664525,x)+1013904223)>>>0;return Math.floor(x/4294967296*n)}}
const makeTile=(next:(n:number)=>number,mode:GrassGame):Tile=>({shape:next(forms.length),bonus:mode==='grass3'?next(3):0,taken:false})
const tray=(mode:GrassGame,n:number,seed:number)=>{const next=random(seed);return Array.from({length:n+2},()=>makeTile(next,mode))}
const orderFor=(n:number,round:number)=>Array.from({length:n},(_,i)=>(i+round-1)%n)
export function grassStart(mode:GrassGame,n:number,seed:number):Grass{
 const width=mode==='grass1'?Math.max(12,Math.min(30,Math.ceil(Math.sqrt(n*55)))):Math.max(12,Math.min(26,Math.ceil(Math.sqrt(n*40))))
 const columns=Math.ceil(Math.sqrt(n)),rows=Math.ceil(n/columns),board=Array<number>(width*width).fill(-1),next=random(seed^0x77caef)
 const markers=board.map(()=>mode==='grass3'&&next(8)===0)
 for(let i=0;i<n;i++){
  const x=Math.floor((i%columns+.5)*width/columns),y=Math.floor((Math.floor(i/columns)+.5)*width/rows)
  board[y*width+x]=i;markers[y*width+x]=false
 }
 return {mode,width,board,markers,tiles:tray(mode,n,seed),bonus:board.slice(0,n).map(()=>0),coupons:Array<boolean>(n).fill(mode==='grass1'),order:orderFor(n,1),position:0,round:1,phase:mode==='grass1'?'draft':'trade',passed:[],traded:[],offer:null,placed:0,done:false}
}
const adjacent=(i:number,w:number)=>[i%w>0?i-1:-1,i%w<w-1?i+1:-1,i>=w?i-w:-1,i+w<w*w?i+w:-1].filter(x=>x>=0)
export function footprint(s:Grass,tile:number,transform:number,anchor:number){
 const t=s.tiles[tile]
 if(!t||t.taken||!Number.isInteger(anchor)||anchor<0||anchor>=s.board.length||transform<0||transform>7)return []
 const ax=anchor%s.width,ay=Math.floor(anchor/s.width)
 const cells=orient(t.shape,transform).map(([x,y])=>ax+x>=s.width||ay+y>=s.width?-1:(ay+y)*s.width+ax+x)
 return cells.includes(-1)?[]:cells
}
export const canPlace=(s:Grass,seat:number,cells:number[])=>cells.length>0&&cells.every(i=>s.board[i]===-1)&&cells.some(i=>adjacent(i,s.width).some(j=>s.board[j]===seat))
export const placeCode=(tile:number,transform:number,anchor:number)=>tile*8000+transform*1000+anchor
export const tradeCode=(target:number,points:number)=>200100+target*3+points
export const tradeDone=200000, tradeAccept=200001, tradeDecline=200002, redraw=210000
function best(s:Grass,seat:number){
 // A legal anchor must cover an empty cell bordering this seat's territory.
 const borders=[...new Set(s.board.flatMap((v,i)=>v===seat?adjacent(i,s.width).filter(j=>s.board[j]===-1):[]))]
 let value=-1,choice:number|undefined
 for(const [k,tile] of s.tiles.entries())if(!tile.taken)
  for(let t=0;t<8;t++){
   const offsets=orient(tile.shape,t)
   for(const cell of borders)for(const [x,y] of offsets){
    if(cell%s.width<x)continue
    const anchor=cell-y*s.width-x,cells=footprint(s,k,t,anchor)
    if(!canPlace(s,seat,cells))continue
    const score=10*cells.length+(cells.some(i=>s.markers[i])?tile.bonus*9:0)
    if(score>value){value=score;choice=placeCode(k,t,anchor)}
    if(value===68)return choice
   }
  }
 return choice
}
export function grassBot(s:Grass,seat:number){
 if(s.done)return
 if(s.phase==='trade')return s.passed.includes(seat)?undefined:s.offer?.to===seat?tradeDecline:tradeDone
 if(s.order[s.position]!==seat)return
 return best(s,seat)??(s.coupons[seat]&&s.tiles.some(t=>!t.taken)?redraw+s.tiles.findIndex(t=>!t.taken):-1)
}
export function square(board:number[],w:number,seat:number){
 const dp=new Uint8Array(board.length);let max=0
 for(let i=0;i<board.length;i++)if(board[i]===seat){
  dp[i]=1+(i%w&&i>=w?Math.min(dp[i-1],dp[i-w],dp[i-w-1]):0)
  max=Math.max(max,dp[i])
 }
 return max
}
export function grassRank(s:Grass,seat:number){
 const area=s.board.filter(i=>i===seat).length, side=square(s.board,s.width,seat)
 return s.mode==='grass1'?[side,area]:[area+s.bonus[seat],side]
}
function nextSeat(s:Grass,seed:number):Grass{
 if(s.position+1<s.order.length)return {...s,position:s.position+1}
 if(s.round===(s.mode==='grass1'?9:4)||!s.placed)return {...s,done:true}
 const round=s.round+1,n=s.order.length
 return {...s,round,position:0,tiles:tray(s.mode,n,seed^Math.imul(round,197123)),phase:s.mode==='grass3'?'trade':'draft',order:orderFor(n,round),offer:null,passed:[],traded:[],placed:0}
}
export function grassStep(s:Grass,seat:number,a:number,seed:number):Grass|null{
 if(s.done||seat<0||seat>=s.order.length||!Number.isInteger(a))return null
 if(s.phase==='trade'){
  if(s.passed.includes(seat))return null
  const offer=s.offer
  if(a===tradeDone){
   const passed=[...s.passed,seat]
   return {...s,passed,offer:offer&&(offer.to===seat||offer.from===seat)?null:offer,phase:passed.length===s.order.length?'draft':'trade'}
  }
  if((a===tradeAccept||a===tradeDecline)&&offer?.to===seat){
   if(a===tradeDecline)return {...s,offer:null}
   const {from,to,points}=offer
   if(s.bonus[from]<points||s.traded.includes(from)||s.traded.includes(to))return null
   return {...s,offer:null,bonus:s.bonus.map((p,i)=>p+(i===to?points:i===from?-points:0)),order:s.order.map(i=>i===from?to:i===to?from:i),traded:[...s.traded,from,to]}
  }
  const x=a-200100,target=Math.floor(x/3),points=x%3
  if(x>=0&&target<s.order.length&&target!==seat&&!offer&&!s.traded.includes(seat)&&!s.traded.includes(target)&&!s.passed.includes(target)&&s.bonus[seat]>=points)return {...s,offer:{from:seat,to:target,points}}
  return null
 }
 if(seat!==s.order[s.position])return null
 if(a===-1)return best(s,seat)===undefined?nextSeat(s,seed):null
 if(a>=redraw){
  const k=a-redraw,t=s.tiles[k]
  if(!s.coupons[seat]||!t||t.taken)return null
  const replacement=makeTile(random(seed^Math.imul(s.round*18+seat+1,31337)),s.mode)
  if(replacement.shape===t.shape)replacement.shape=(replacement.shape+1)%forms.length
  return {...s,coupons:s.coupons.map((v,i)=>i===seat?false:v),tiles:s.tiles.map((v,i)=>i===k?replacement:v)}
 }
 if(a<0||a>=200000)return null
 const k=Math.floor(a/8000),transform=Math.floor(a%8000/1000),cells=footprint(s,k,transform,a%1000)
 if(!canPlace(s,seat,cells))return null
 const hit=cells.some(i=>s.markers[i])
 return nextSeat({...s,board:s.board.map((v,i)=>cells.includes(i)?seat:v),markers:s.markers.map((v,i)=>v&&!cells.includes(i)),bonus:s.bonus.map((v,i)=>i===seat&&hit?v+s.tiles[k].bonus:v),tiles:s.tiles.map((v,i)=>i===k?{...v,taken:true}:v),placed:s.placed+1},seed)
}
