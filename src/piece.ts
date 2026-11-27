export const pieceSide=7
export const pieceTime=240000
export const pieceHintCost=20000
export const piecePass=-1
export const pieceClue=2000
export const pieceRemove=(id:number)=>1000+id
export type PieceCell=readonly [number,number]
export type PieceFit={anchor:number;rotation:number}
export type PieceLayout={target:boolean[];pieces:PieceCell[][]}
type PieceHint={kind:'place';piece:number;fit:PieceFit}|{kind:'remove';piece:number}
export type Piece=PieceLayout&{
 placements:(PieceFit|null)[]
 solution:PieceFit[]
 hints:number
 hint:PieceHint|null
 adjustedMs:number|null
}
const area=pieceSide**2
const maps=[
 ['..EEE..','.GGGEH.','CCGGEHH','CCDDDBH','FFFFDBB','.FFAAB.','..AAA..'],
 ['..DEB..','.DDEBB.','GDDEEH.','GGACCHH','.GACFFH','.GACFF.','..AAF..'],
 ['..FF...','.DFFF..','DDACCE.','DAACCEE','.GGCCEE','..GBBE.','...BB..'],
 ['...E...','..EEE..','.GEFFFF','GGCDDDF','CCCDAA.','.BBBAA.','...B...'],
 ['.DDDD..','.HHHDE.','AAHHEEE','AABBBCC','AABGGCC','.FFGGC.','..FFFF.'],
 ['.FFB...','CCFBB..','.CCDDD.','..DDEGG','..EEEGG','..AAEGG','..AAA..'],
 ['..GF...','.GGFF..','.GGFDD.','CCFFDDD','.CCCAAA','..CEAB.','..EEBB.'],
 ['..GGG..','..GGGD.','.CCEEDD','BBCEDDD','BBFEAA.','.BFFA..','..FFA..'],
]
const random=(seed:number)=>{
 let x=seed|0
 return (n:number)=>{
  x=(x+0x6d2b79f5)|0
  let y=Math.imul(x^(x>>>15),1|x)
  y^=y+Math.imul(y^(y>>>7),61|y)
  return Math.floor(((y^(y>>>14))>>>0)/4294967296*n)
 }
}
const rotate=([x,y]:PieceCell):PieceCell=>[-y,x]
const order=(a:PieceCell,b:PieceCell)=>a[1]-b[1]||a[0]-b[0]
const bounds=(cells:PieceCell[])=>[Math.min(...cells.map(c=>c[0])),Math.min(...cells.map(c=>c[1]))] as const
const normalize=(cells:PieceCell[])=>{
 const [x0,y0]=bounds(cells)
 return cells.map(([x,y]):PieceCell=>[x-x0,y-y0]).sort(order)
}
export function pieceRotation(cells:PieceCell[],rotation:number){
 for(let i=0;i<rotation;i++)cells=cells.map(rotate)
 return normalize(cells)
}
export function pieceStart(seed:number):Piece{
 const next=random(seed)
 const map=maps[next(maps.length)],turn=next(4),mirror=next(2)===1
 const groups=new Map<string,PieceCell[]>()
 const target=Array<boolean>(area).fill(false)
 for(const [row,line] of map.entries())for(const [col,symbol] of [...line].entries()){
  if(symbol==='.')continue
  let x=mirror?pieceSide-1-col:col,y=row
  for(let i=0;i<turn;i++)[x,y]=[pieceSide-1-y,x]
  target[y*pieceSide+x]=true
  groups.set(symbol,[...(groups.get(symbol)??[]),[x,y]])
 }
 const tray=[...groups.values()]
 for(let i=tray.length-1;i>0;i--){const j=next(i+1);[tray[i],tray[j]]=[tray[j],tray[i]]}
 const solution:PieceFit[]=[]
 const pieces=tray.map(cells=>{
  const shift=next(4)
  const [x,y]=bounds(cells)
  solution.push({anchor:y*pieceSide+x,rotation:(4-shift)%4})
  return pieceRotation(cells,shift)
 })
 return {target,pieces,solution,placements:pieces.map(()=>null),hints:0,hint:null,adjustedMs:null}
}
export function pieceFootprint(board:PieceLayout,id:number,rotation:number,anchor:number){
 const shape=board.pieces[id]
 if(!shape||!Number.isInteger(rotation)||rotation<0||rotation>3||!Number.isInteger(anchor)||anchor<0||anchor>=area)return []
 const x=anchor%pieceSide,y=Math.floor(anchor/pieceSide)
 const cells=pieceRotation(shape,rotation).map(([dx,dy])=>x+dx>=pieceSide||y+dy>=pieceSide?-1:(y+dy)*pieceSide+x+dx)
 return cells.includes(-1)?[]:cells
}
const footprint=(board:PieceLayout,id:number,fit:PieceFit)=>pieceFootprint(board,id,fit.rotation,fit.anchor)
export function pieceOccupancy(board:PieceLayout&{placements:(PieceFit|null)[]}){
 const cells=Array<number>(area).fill(-1)
 for(const [id,p] of board.placements.entries())if(p)for(const c of footprint(board,id,p))cells[c]=id
 return cells
}
export function pieceCanPlace(board:PieceLayout&{placements:(PieceFit|null)[]},id:number,fit:PieceFit){
 const cells=footprint(board,id,fit)
 const occupancy=pieceOccupancy(board)
 return cells.length>0&&cells.every(c=>board.target[c]&&(occupancy[c]===-1||occupancy[c]===id))
}
// Keep placement codes separate from removal, pass, and clue actions.
const piecePlaceBase=10000
export const packPiece=(id:number,rotation:number,anchor:number)=>piecePlaceBase+id*4*area+rotation*area+anchor
const same=(board:PieceLayout,id:number,a:PieceFit,b:PieceFit)=>footprint(board,id,a).join()===footprint(board,id,b).join()
export function pieceStep(board:Piece,a:number):Piece|null{
 if(!Number.isInteger(a))return null
 if(a===piecePass)return board
 if(a===pieceClue){
  if(board.hint)return null
  const i=board.placements.findIndex((p,k)=>p!==null&&!same(board,k,p,board.solution[k]))
  const j=board.placements.indexOf(null)
  const hint:PieceHint|null=i>=0?{kind:'remove',piece:i}:j>=0?{kind:'place',piece:j,fit:board.solution[j]}:null
  return hint?{...board,hints:board.hints+1,hint}:null
 }
 if(a>=1000&&a<1000+board.pieces.length){
  const id=a-1000
  return board.placements[id]?{...board,hint:null,placements:board.placements.map((p,i)=>i===id?null:p)}:null
 }
 const code=a-piecePlaceBase
 if(code<0||code>=board.pieces.length*4*area)return null
 const id=Math.floor(code/(4*area)),fit={rotation:Math.floor(code/area)%4,anchor:code%area},previous=board.placements[id]
 if(!pieceCanPlace(board,id,fit)||(previous&&same(board,id,previous,fit)))return null
 return {...board,hint:null,placements:board.placements.map((p,i)=>i===id?fit:p)}
}
export function pieceResult(board:Piece){
 return {filled:pieceOccupancy(board).filter(x=>x>=0).length,total:board.target.filter(Boolean).length,adjustedMs:board.adjustedMs}
}
export function pieceView(board:Piece){
 return {target:board.target,pieces:board.pieces,placements:board.placements,hints:board.hints,hint:board.hint,score:pieceResult(board)}
}
