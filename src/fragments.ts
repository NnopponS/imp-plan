export const fragmentColors=['Teal','Amber','Plum','Crimson'] as const
export const fragmentWords=['ORBIT','ATLAS','EMBER','TIDAL','CEDAR','QUARTZ'] as const
export const fragmentItems=['Vase','Key','Gem','Cup','Crown','Bell','Leaf','Compass','Lantern'] as const
export const fragmentCounts=[8,12,16,24] as const
export type FragmentCount=typeof fragmentCounts[number]
export type GalleryObject={item:typeof fragmentItems[number],tone:number}
export type Gallery={objects:GalleryObject[],time:string,hour:number,minute:number,word:string}
type Question={prompt:string,options:string[],answer:string}
export type Fragments={deal:{scene:Gallery,questions:Question[]},study:boolean,strict:boolean,correct:number,last:boolean|null,passed:boolean|null}
export const fragmentNeed=(strict:boolean,count:number)=>strict?count:Math.ceil(count*5/6)

export function fragmentDeal(seed:number,count:FragmentCount=12){
 let x=(seed|0)||0x6e832d37
 const rand=(n:number)=>{x^=x<<13;x^=x>>>17;x^=x<<5;return (x>>>0)%n}
 const shuffle=<T,>(source:readonly T[]):T[]=>{
  const arr=[...source]
  for(let i=arr.length-1;i>0;i--){const j=rand(i+1);[arr[i],arr[j]]=[arr[j],arr[i]]}
  return arr
 }
 const objects=shuffle(fragmentItems).map(item=>({item,tone:rand(fragmentColors.length)}))
 const hour=1+rand(12),minute=5*rand(12),word=fragmentWords[rand(fragmentWords.length)]
 const stamp=(h:number,m:number)=>h+':'+String(m).padStart(2,'0')
 const time=stamp(hour,minute)
 const make=(prompt:string,answer:string,choices:readonly string[]):Question=>({
  prompt,answer,options:shuffle([answer,...shuffle([...new Set(choices)].filter(x=>x!==answer)).slice(0,3)])
 })
 const forced=[
  make('What is the clock time?',time,[stamp(hour%12+1,minute),stamp(hour,(minute+5)%60),stamp((hour+10)%12+1,minute)]),
  make('Which word is printed on the exhibit label?',word,fragmentWords),
 ]
 const colors=objects.map(o=>make('What color was the '+o.item.toLowerCase()+'?',fragmentColors[o.tone],fragmentColors))
 const placements=objects.flatMap((o,i)=>i%3===2?[]:[make('Which object sat immediately to the right of the '+o.item.toLowerCase()+'?',objects[i+1].item,fragmentItems)])
 const counts=fragmentColors.map((name,i)=>make('How many '+name.toLowerCase()+' objects were on the shelves?',String(objects.filter(o=>o.tone===i).length),Array.from({length:10},(_,n)=>String(n))))
 const shelf=['top','middle','bottom'].map((r,i)=>make('Which object sat in the center of the '+r+' shelf?',objects[i*3+1].item,fragmentItems))
 const pools=[shuffle(colors),shuffle(placements),shuffle(counts),shuffle(shelf)]
 const varied=[...forced,...pools.map(p=>p.shift()!),...shuffle(pools.flat()).slice(0,count-6)]
 return {scene:{objects,time,hour,minute,word},questions:shuffle(varied)}
}
export const fragmentStart=(seed:number,strict:boolean,count:FragmentCount):Fragments=>({deal:fragmentDeal(seed,count),study:true,strict,correct:0,last:null,passed:null})
export function fragmentView(f:Fragments,round:number,done:boolean,expired:boolean){
 const question=f.study||done?null:f.deal.questions[round-1]
 return {scene:f.study&&!expired?f.deal.scene:null,question:question?{prompt:question.prompt,options:question.options}:null,
  strict:f.strict,correct:f.correct,last:f.last,passed:f.passed,total:f.deal.questions.length}
}
