export type BaghAction=number|{from:number,to:number}
type Cell=0|1|2
export type Bagh={board:Cell[],banked:number,captured:number,turns:number}
const xy=(i:number)=>[i%5,Math.floor(i/5)]
export const baghInit=():Bagh=>({board:Array.from({length:25},(_,i)=>[0,4,20,24].includes(i)?2:0),banked:20,captured:0,turns:0})
const step=(a:number,b:number)=>{
 const [x,y]=xy(a),[u,v]=xy(b),dx=Math.abs(x-u),dy=Math.abs(y-v)
 return (dx+dy===1)||(dx===1&&dy===1&&(x+y)%2===0)
}
export const baghEdges=Array.from({length:25},(_,i)=>Array.from({length:25-i-1},(_,j)=>i+j+1).filter(j=>step(i,j)).map(j=>[i,j])).flat()
function jump(from:number,to:number){
 const [a,b]=xy(from),[x,y]=xy(to),dx=Math.abs(a-x),dy=Math.abs(b-y)
 if(!((dx+dy===2&&Math.max(dx,dy)===2)||(dx===2&&dy===2)))return -1
 const m=(from+to)/2
 return step(from,m)&&step(m,to)?m:-1
}
export function baghActions(g:Bagh,role:number):BaghAction[]{
 const open=g.board.flatMap((v,i)=>v===0?[i]:[])
 if(role===0&&g.banked>0)return open
 return g.board.flatMap((v,from)=>v!==role+1?[]:open.filter(to=>step(from,to)||(role===1&&g.board[jump(from,to)]===1)).map(to=>({from,to})))
}
export function baghStep(g:Bagh,role:number,a:BaghAction):Bagh|null{
 if(!baghActions(g,role).some(v=>typeof v==='number'?a===v:typeof a==='object'&&a.from===v.from&&a.to===v.to))return null
 const board=g.board.slice()
 if(typeof a==='number'){board[a]=1;return {...g,board,banked:g.banked-1,turns:g.turns+1}}
 board[a.from]=0
 board[a.to]=role===1?2:1
 const mid=jump(a.from,a.to),hit=role===1&&mid>=0
 if(hit)board[mid]=0
 return {...g,board,turns:g.turns+1,captured:g.captured+Number(hit)}
}
