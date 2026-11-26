import routes from './tour-routes.json'
export type Card={id:number,value:number}
export type TourSize=5|6|8
export function deal(count:number,seed:number):Card[][] {
 const cards=Array.from({length:Math.max(8,count+2)*4},(_,id)=>({id,value:Math.floor(id/4)+1}))
 let x=seed>>>0
 for(let i=cards.length-1;i>0;i--){
  x=(Math.imul(x,1664525)+1013904223)>>>0
  const pos=Math.floor(x/4294967296*(i+1))
  ;[cards[pos],cards[i]]=[cards[i],cards[pos]]
 }
 return Array.from({length:count},(_,i)=>cards.slice(i*2,i*2+2))
}
export function lowestUnique(values:number[]):number {
 const tally=new Map<number,number>()
 for(const v of values)if(v>0)tally.set(v,(tally.get(v)??0)+1)
 return [...tally.keys()].filter(v=>tally.get(v)===1).sort((a,b)=>a-b)[0]??0
}
export function knightStep(from:number,to:number,size:number):boolean{
 if(!Number.isInteger(to)||to<0||to>=size*size)return false
 const x=Math.abs(from%size-to%size),y=Math.abs(Math.floor(from/size)-Math.floor(to/size))
 return x*y===2&&x+y===3
}
export function tourRoute(size:TourSize,closed:boolean,seed:number):number[]{
 if(closed&&size===5)throw Error('A closed 5×5 tour is not possible.')
 const route=routes[(String(size)+(closed?'c':'o')) as keyof typeof routes]
 const bits=seed>>>0
 return route.map(i=>{
  let x=i%size,y=Math.floor(i/size)
  if(bits&1)x=size-1-x
  if(bits&2)y=size-1-y
  if(bits&4)[x,y]=[y,x]
  return y*size+x
 })
}
export function tourLegal(path:number[],size:TourSize,closed:boolean):number[]{
 if(!path.length||path.length===size*size)return []
 const from=path.at(-1)!
 return Array.from({length:size*size},(_,i)=>i).filter(i=>!path.includes(i)&&knightStep(from,i,size)&&(path.length<size*size-1||!closed||knightStep(i,path[0],size)))
}
