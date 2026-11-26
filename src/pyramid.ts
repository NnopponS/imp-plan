type Fraction={n:number,d:number}
type Pairing={values:number[],target:Fraction,witness:number}
export const pyramidOps=['+','−','×','÷'] as const
export const pyramidRounds=8
export const pyramidChoices=Array.from({length:4},(_,row)=>Array.from({length:row+1},(_,col)=>{
 const root=row*(row+1)/2+col
 return [root,root+row+1,root+row+2]
})).flat()
const gcd=(a:number,b:number):number=>b?gcd(b,a%b):Math.abs(a)
function apply(a:Fraction,b:Fraction,op:number):Fraction|null{
 let n:number,d:number
 switch(op){
  case 0:n=a.n*b.d+b.n*a.d;d=a.d*b.d;break
  case 1:n=a.n*b.d-b.n*a.d;d=a.d*b.d;break
  case 2:n=a.n*b.n;d=a.d*b.d;break
  case 3:n=a.n*b.d;d=a.d*b.n;break
  default:return null
 }
 if(!d)return null
 const g=gcd(n,d)*Math.sign(d)
 return {n:n/g||0,d:d/g}
}
export function pyramidFraction(values:number[],op1:number,op2:number,right:boolean){
 if(values.length!==3||values.some(v=>!Number.isInteger(v)||v<1||v>12))return null
 const [a,b,c]=values.map(n=>({n,d:1}))
 const inner=right?apply(b,c,op2):apply(a,b,op1)
 return inner?(right?apply(a,inner,op1):apply(inner,c,op2)):null
}
export function packPyramid(order:number[],op1:number,op2:number,right:boolean):number|null{
 if(order.length!==3||new Set(order).size!==3||!pyramidChoices.some(t=>t.every(i=>order.includes(i)))||
  ![op1,op2].every(n=>Number.isInteger(n)&&n>=0&&n<4))return null
 return ((order[0]*225+order[1]*15+order[2])*16+op1*4+op2)*2+Number(right)
}
function unpack(code:number){
 if(!Number.isInteger(code)||code<0||code>=108000)return null
 const packed=Math.floor(code/32)
 const trio=[Math.floor(packed/225),Math.floor(packed/15)%15,packed%15]
 const op1=Math.floor(code/8)%4,op2=Math.floor(code/2)%4,right=code%2===1
 return packPyramid(trio,op1,op2,right)===null?null:{trio,op1,op2,right}
}
export function pyramidCheck(p:Pairing,code:number):boolean|null{
 const action=unpack(code)
 if(!action)return null
 const {trio,op1,op2,right}=action
 const v=pyramidFraction(trio.map(i=>p.values[i]),op1,op2,right)
 return !!v&&v.n===p.target.n&&v.d===p.target.d
}
export const pyramidValid=(p:Pairing,code:number)=>pyramidCheck(p,code)===true
export const fractionLabel=(x:Fraction)=>x.d===1?String(x.n):x.n+'/'+x.d
export function pyramidDeal(seed:number,round:number):Pairing{
 let x=(seed^Math.imul(round,0x9e3779b9))||1
 const rand=(n:number)=>{x^=x<<13;x^=x>>>17;x^=x<<5;return (x>>>0)%n}
 const values=Array.from({length:15},()=>1+rand(12))
 const triangle=pyramidChoices[rand(pyramidChoices.length)]
 const offset=rand(3),order=[triangle[offset],triangle[(offset+1+rand(2))%3],0]
 order[2]=triangle.find(i=>!order.slice(0,2).includes(i))!
 const options:{target:Fraction,witness:number}[]=[]
 for(let op1=0;op1<4;op1++)for(let op2=0;op2<4;op2++)for(const right of [false,true]){
  const target=pyramidFraction(order.map(i=>values[i]),op1,op2,right)
  if(target&&target.n>0&&target.n<=48*target.d&&target.d<=4&&(op1>=2||op2>=2))options.push({target,witness:packPyramid(order,op1,op2,right)!})
 }
 if(options.length)return {values,...options[rand(options.length)]}
 return {values,target:{n:order.reduce((sum,i)=>sum+values[i],0),d:1},witness:packPyramid(order,0,0,false)!}
}
export type Pyramid={deal:Pairing,answers:Record<string,{points:number,elapsed:number}>}
export const pyramidStart=(seed:number,round:number):Pyramid=>({deal:pyramidDeal(seed,round),answers:{}})
export function pyramidAnswer(p:Pyramid,seat:string,code:number,elapsed:number):Pyramid|null{
 if(Object.hasOwn(p.answers,seat))return null
 const correct=pyramidCheck(p.deal,code)
 if(correct===null)return null
 const points=correct?(Object.values(p.answers).some(a=>a.points>0)?1:2):0
 return {...p,answers:{...p.answers,[seat]:{points,elapsed:points?elapsed:0}}}
}
export const pyramidView=(p:Pyramid,seat:string)=>({values:p.deal.values,target:p.deal.target,locked:Object.hasOwn(p.answers,seat)})
