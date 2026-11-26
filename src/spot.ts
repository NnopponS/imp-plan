export const spotWindow=90_000
const cost=5_000
const forms=['Sun','Moon','Diamond','Cross','Crown'] as const
const inks=['rust','jade','navy','purple'] as const
export type Specimen={shape:number,ink:number,shift:number,scale:number,shown:boolean}
export type Spot={deal:ReturnType<typeof spotDeal>,players:Record<string,Progress>}
type Mark={region:number,correct:boolean}
type Progress={marks:Mark[],penalty:number,last:number|null}
export function regionName(i:number){return 'ABC'[Math.floor(i/4)]+String(i%4+1)}
export function regionBox(i:number){return [8+(i%4)*72,8+Math.floor(i/4)*72,64,64] as const}
export function describeSpecimen(v:Specimen){
 return v.shown?`${forms[v.shape]}, ${inks[v.ink]}, ${['centered','left of center','right of center'][v.shift]}, ${['regular','small','large'][v.scale]}`:'Empty slot'
}
export function spotDeal(seed:number){
 let x=(seed^0x0ffab1e)|0
 const draw=(n:number)=>{
  x=(x+0x6d2b79f5)|0
  let t=Math.imul(x^(x>>>15),1|x)
  t=(t+Math.imul(t^(t>>>7),61|t))^t
  return ((t^(t>>>14))>>>0)%n
 }
 const count=5+draw(4)
 const regions=Array.from({length:12},(_,i)=>i)
 for(let i=regions.length-1;i>0;i--){const j=draw(i+1);[regions[i],regions[j]]=[regions[j],regions[i]]}
 const left=regions.map(()=>({shape:draw(5),ink:draw(4),shift:0,scale:0,shown:true}))
 const right=left.map(v=>({...v}))
 regions.slice(0,count).forEach((i,k)=>{
  const v=right[i]
  switch(k%5){
   case 0:v.shape=(v.shape+1+draw(4))%5;break
   case 1:v.ink=(v.ink+1+draw(3))%4;break
   case 2:v.shift=1+draw(2);break
   case 3:v.scale=1+draw(2);break
   case 4:v.shown=false;break
  }
 })
 return {left,right,key:regions.slice(0,count).sort((a,b)=>a-b)}
}
export function spotStart(seed:number,seats:string[]):Spot{
 return {deal:spotDeal(seed),players:Object.fromEntries(seats.map(id=>[id,{marks:[],penalty:0,last:null}]))}
}
export const found=(p:Progress)=>p.marks.filter(m=>m.correct).length
export const spotClosed=(s:Spot,id:string,elapsed:number)=>{
 const p=s.players[id]
 return !p||elapsed+p.penalty>=spotWindow||found(p)===s.deal.key.length
}
export function spotPlay(s:Spot,id:string,region:number,elapsed:number):Spot|null{
 const p=s.players[id]
 if(!Number.isInteger(region)||region<0||region>=s.deal.left.length||spotClosed(s,id,elapsed)||p.marks.some(m=>m.region===region))return null
 const correct=s.deal.key.includes(region)
 return {...s,players:{...s.players,[id]:{marks:[...p.marks,{region,correct}],penalty:p.penalty+(correct?0:cost),last:correct?elapsed:p.last}}}
}
export const spotScore=(p:Progress)=>[found(p),(p.last??spotWindow)+p.penalty] as const
export function spotView(s:Spot,id:string,done:boolean){
 const p=s.players[id]
 return {left:s.deal.left,right:s.deal.right,target:s.deal.key.length,marks:done?s.deal.key.map(region=>({region,correct:true})):p?.marks??[],penalty:p?.penalty??0,
  score:p?found(p):0,results:done?Object.fromEntries(Object.entries(s.players).map(([seat,progress])=>[seat,spotScore(progress)])):null}
}
