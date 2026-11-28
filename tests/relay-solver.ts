// Independent exact cover: use only tray coordinates and frame dimensions a participant can see.
type Cell=readonly [number,number]
type Row={piece:number;anchor:number;orientation:number;mask:bigint}
export function solveRelay(width:number,height:number,pieces:Cell[][]){
 const area=width*height,count=area+pieces.length,columns:Row[][]=Array.from({length:count},()=>[])
 for(let i=0;i<pieces.length;i++){
  let shape=pieces[i]
  const tried=new Set<string>()
  for(let orientation=0;orientation<4;orientation++){
   const ox=Math.min(...shape.map(c=>c[0])),oy=Math.min(...shape.map(c=>c[1]))
   const normalized=shape.map(([x,y])=>[x-ox,y-oy]).sort((a,b)=>a[1]-b[1]||a[0]-b[0])
   shape=shape.map(([x,y])=>[-y,x])
   const key=JSON.stringify(normalized)
   if(tried.has(key))continue
   tried.add(key)
   for(let y=0;y+Math.max(...normalized.map(p=>p[1]))<height;y++)for(let x=0;x+Math.max(...normalized.map(p=>p[0]))<width;x++){
    const cells=[area+i,...normalized.map(([dx,dy])=>(y+dy)*width+x+dx)]
    const row={piece:i,anchor:y*width+x,orientation,mask:cells.reduce((m,c)=>m|(1n<<BigInt(c)),0n)}
    for(const c of cells)columns[c].push(row)
   }
  }
 }
 function search(mask:bigint,path:Row[]):Row[]|null{
  if(path.length===pieces.length)return path
  let best:Row[]|undefined
  for(let c=0;c<count;c++)if(!(mask&(1n<<BigInt(c)))){
   const opts=columns[c].filter(row=>!(mask&row.mask))
   if(!opts.length)return null
   if(!best||opts.length<best.length)best=opts
  }
  for(const r of best??[]){const done=search(mask|r.mask,[...path,r]);if(done)return done}
  return null
 }
 return search(0n,[])?.map(({piece,anchor,orientation})=>({piece,anchor,orientation}))??null
}
