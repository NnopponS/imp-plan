import {pieceFootprint,pieceSide,type PieceFit,type PieceLayout} from '../src/piece'

export function solvePiece(layout:PieceLayout):PieceFit[]|null{
 const target=layout.target.reduce((mask,on,i)=>on?mask|(1n<<BigInt(i)):mask,0n)
 const n=pieceSide**2
 const fits=layout.pieces.map((_,id)=>{
  const seen=new Set<bigint>()
  return Array.from({length:n},(_,anchor)=>[0,1,2,3].flatMap(rotation=>{
   const cells=pieceFootprint(layout,id,rotation,anchor)
   if(!cells.length||!cells.every(i=>layout.target[i]))return []
   const mask=cells.reduce((a,i)=>a|(1n<<BigInt(i)),0n)
   if(seen.has(mask))return []
   seen.add(mask);return [{id,rotation,anchor,mask,cells}]
  })).flat()
 })
 const byCell=Array.from({length:n},(_,i)=>fits.flat().filter(f=>f.cells.includes(i)))
 const result:PieceFit[]=[]
 function search(occupied:bigint,used:number):boolean{
  if(occupied===target)return true
  const allowed=(f:{id:number,mask:bigint})=>!(used&(1<<f.id))&&!(occupied&f.mask)
  let candidates:typeof fits[number]|null=null
  for(let i=0;i<n;i++)if(layout.target[i]&&!(occupied&(1n<<BigInt(i)))){
   const available=byCell[i].filter(allowed)
   if(!candidates||available.length<candidates.length)candidates=available
   if(!available.length)return false
  }
  for(const fit of candidates??[]){
   result[fit.id]={anchor:fit.anchor,rotation:fit.rotation}
   if(search(occupied|fit.mask,used|(1<<fit.id)))return true
  }
  return false
 }
 return search(0n,0)?result:null
}
