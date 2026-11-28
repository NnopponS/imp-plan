import {readTower,towerBlocks,type TowerStacks} from './equation-tower'
import './equation-tower.css'

const signs={'*':'×','/':'÷','-':'−','+':'+'}
export const standNames=['A','B','C','D'] as const
export function blockInscription(id:number){
 const block=towerBlocks[id]
 return (block.operator?signs[block.operator]:'')+block.value
}
export function inscription(stack:readonly number[]){
 const value=readTower(stack)
 return value?stack.slice().reverse().map(blockInscription).join(' ')+' = '+(value[1]===1?value[0]:value.join('/')):null
}
export function EquationBlockArt({id}:{id:number}){
 const block=towerBlocks[id],plain=block.operator===null
 return <svg viewBox="0 0 64 25" width="64" height="25" data-equation-block={id} data-metal={plain?'stone':block.operator==='*'||block.operator==='/'?'teal':'brass'} className="et-block" aria-hidden="true" focusable="false">
  <path className="et-block-edge" d="M3 7 9 2h46l6 5v14l-5 3H8l-5-3Z"/>
  <path className="et-block-face" d="M3 7h58v14l-5 3H8l-5-3Z"/>
  <path className="et-block-line" d="M3 7h58M7 10l4-.8h42l4 .8v9l-5 2H12l-5-2zM10 4h9m27 .5h8M9 17l4-3m-4 5 4-3m39 1 3-3m-3 5 3-3m-37 5h8m9 0h9"/>
  <path className="et-block-stud" d="M14 16l2-2 2 2-2 2zm32 0 2-2 2 2-2 2z"/>
  <text x="32" y="19.1" className="et-block-number" textAnchor="middle">{blockInscription(id)}</text>
 </svg>
}

export function TowerPedestals({stacks,bundle,matching,select,disabled=false}:{stacks:TowerStacks;bundle?:{from:number,count:number};matching?:number|null;select?:(index:number)=>void;disabled?:boolean}){
 return <div className="et-pedestals" data-equation-pedestals>
  {stacks.map((pile,i)=>{
   const pileName=standNames[i],raw=pile.map(blockInscription).reverse().join(', '),active=bundle?.from===i
   const contents=<><span className="et-stack">{pile.map((id,k)=><span className="et-block-wrap" key={id} data-lifted={active&&k>=pile.length-bundle.count||undefined}><EquationBlockArt id={id}/></span>)}
    {!pile.length&&<span className="et-empty" aria-hidden="true">·</span>}</span>
    <svg className="et-foot" viewBox="0 0 68 15" aria-hidden="true"><path d="m12 1 44 0 10 6v5l-5 2H7l-5-2V7Z"/><path d="M2 7h64m-54 4h14m16 0h14M16 2l-5 4m40-4 6 4"/></svg>
    <span className="et-letter"><span>{pileName}</span></span></>
   return select?<button key={i} type="button" className="et-stand" data-equation-stand={pileName} data-blocks={pile.join(',')} data-matching={matching===i||undefined}
    aria-label={bundle?(active?'Selected stand ':'Place on stand ')+pileName:'Lift from stand '+pileName+(raw?': '+raw:', empty')}
    disabled={disabled||bundle===undefined&&!pile.length||active} onClick={()=>select(i)}>{contents}</button>:
    <span key={i} className="et-stand" data-equation-stand={pileName} data-blocks={pile.join(',')} data-matching={matching===i||undefined}>{contents}</span>
  })}
 </div>
}
