import {test,expect} from '@playwright/test'
const colors=['Teal','Amber','Plum']
const name=(n:number)=>colors[Math.floor(n/4)]+' '+(n%4+1)
function fits(clue:string,line:number[]){
 const ranks=line.map(n=>n%4+1),positions=line.map(name)
 let m:RegExpMatchArray|null
 if((m=clue.match(/^Ranks in (all four slots|slots (\d) and (\d)) add to (\d+)\.$/))){
  return (m[2]?ranks[+m[2]-1]+ranks[+m[3]-1]:ranks.reduce((a,b)=>a+b,0))===+m[4]
 }
 if((m=clue.match(/^Slot (\d) is not (.+)\.$/)))return positions[+m[1]-1]!==m[2]
 if((m=clue.match(/^There (?:is|are) exactly (\d+) (Teal|Amber|Plum|rank \d) cards?\.$/)))return line.filter(n=>m![2].startsWith('rank')?n%4+1===Number(m![2].slice(-1)):colors[Math.floor(n/4)]===m![2]).length===+m[1]
 if((m=clue.match(/^The rank in slot (\d) is (equal to|higher than|lower than) the rank in slot (\d)\.$/)))return Math.sign(ranks[+m[1]-1]-ranks[+m[3]-1])===(m[2]==='equal to'?0:m[2]==='higher than'?1:-1)
 if((m=clue.match(/^(.+) and (.+) are both used and are( not)? neighbors\.$/))){const a=positions.indexOf(m[1]),b=positions.indexOf(m[2]);return a>=0&&b>=0&&(Math.abs(a-b)===1)===!m[3]}
 throw Error('Unhandled visible clue: '+clue)
}
test('Secret Code room hides attempts, charges time, and accepts the unique mobile solution',async({browser,baseURL})=>{
 const large=await browser.newContext(),small=await browser.newContext({viewport:{width:360,height:780},hasTouch:true})
 try{
  const host=await large.newPage(),guest=await small.newPage()
  await host.goto(baseURL!+'season/3/')
  await host.getByLabel('Nickname').fill('Keeper')
  await host.getByRole('button',{name:'Create party'}).click()
  const code=(await host.getByTestId('room-code').textContent())!
  await host.getByLabel('Game').selectOption('codeLock')
  await guest.goto(baseURL!+'#/join?room='+code)
  await guest.getByLabel('Nickname').fill('Solver')
  await guest.getByRole('button',{name:'Join party'}).click()
  await guest.getByRole('button',{name:'Ready up'}).click()
  await host.getByRole('button',{name:'Start match'}).click()
  const clues=await guest.getByRole('region',{name:'Clue sheet'}).getByRole('listitem').allTextContents()
  expect(clues.length).toBeGreaterThanOrEqual(6)
  const found:number[][]=[]
  for(let a=0;a<12;a++)for(let b=0;b<12;b++)for(let c=0;c<12;c++)for(let d=0;d<12;d++){
   const row=[a,b,c,d]
   if(new Set(row).size===4&&clues.every(clue=>fits(clue,row)))found.push(row)
  }
  expect(found).toHaveLength(1)
  const answer=found[0],wrong=[answer[1],answer[0],answer[2],answer[3]]
  for(let slot=0;slot<4;slot++){
   const target=host.getByRole('button',{name:'Slot '+(slot+1)+': empty'})
   const card=host.getByRole('button',{name:name(wrong[slot]),exact:true})
   if(slot===0)await card.dragTo(target)
   else{await card.press('Enter');await target.press('Enter')}
  }
  await host.getByRole('button',{name:'Lock answer'}).click()
  await expect(host.getByRole('status').filter({hasText:'15 seconds deducted'})).toBeVisible()
  await expect(guest.getByText('Your attempts',{exact:true})).toHaveCount(0)
  await expect(guest.getByRole('heading',{name:'Solution'})).toHaveCount(0)
  for(let i=0;i<4;i++){
   await guest.getByRole('button',{name:name(answer[i]),exact:true}).tap()
   await guest.getByRole('button',{name:'Slot '+(i+1)+': empty'}).tap()
  }
  await guest.getByRole('button',{name:'Lock answer'}).tap()
  await expect(host.getByRole('heading',{name:'Solver wins'})).toBeVisible()
  await expect(guest.getByText('You cracked the code.')).toBeVisible()
  expect(await guest.evaluate(()=>document.documentElement.scrollWidth)).toBe(360)
 }finally{await large.close();await small.close()}
})
