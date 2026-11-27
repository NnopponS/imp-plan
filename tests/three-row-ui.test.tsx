import {renderToStaticMarkup} from 'react-dom/server'
import {describe,expect,it} from 'vitest'
import type {ThreeRowView} from '../src/three-row'
import {ThreeRowBoard,ThreeRowLesson} from '../src/three-row-ui'

const names={s1:'Ari',s2:'Bo',s3:'Cam'}
const initial:ThreeRowView={phase:'place',board:Array(25).fill(null),turn:'s1',turns:0,deadline:40000,line:[],role:'ally',bluffs:2,vote:null,roleReveal:null,alliesIdentified:null,scores:null}
function render(p:Partial<ThreeRowView>={},you='s1',active=true){return renderToStaticMarkup(<ThreeRowBoard view={{...initial,...p}} you={you} active={active} names={names} hostNow={10000} submit={()=>{}}/>)}
describe('Three in a Row table',()=>{
 it('renders all 25 named intersections, mark tools and only the viewer’s private role',()=>{
  const html=render();expect((html.match(/data-tr-cell=/g)??[]).length).toBe(25)
  expect(html).toContain('aria-label="A1: empty"');expect(html).toContain('aria-label="E5: empty"')
  expect(html.replace(/<[^>]+>/g,'')).toContain('Your role: Ally');expect(html).toContain('A · Laurel');expect(html).toContain('B · Thorn')
  expect(html).not.toContain('data-tr-reveal=')
 })
 it('suspends actions on a disconnected client while preserving the player’s private view',()=>{
  const html=render({},'s1',false); expect(html).not.toContain('data-tr-move=');expect(html).toContain('Waiting to reconnect.');expect(html).toContain('data-tr-private=')
 })
 it('does not offer a role, marking tool or ballot to a spectator',()=>{
  for(const phase of ['place','vote'] as const){const html=render({phase,role:null,bluffs:null},'observer');expect(html).not.toContain('Your role:');expect(html).not.toContain('data-tr-mark=');expect(html).not.toContain('data-tr-suspect=');expect(html).toContain('Spectating')}
 })
 it('offers a private ballot against other seats only and does not expose anyone else’s ballot',()=>{
  const html=render({phase:'vote',turn:null}); expect(html).toContain('data-tr-suspect="s2"')
  expect(html).toContain('data-tr-suspect="s3"');expect(html).not.toContain('data-tr-suspect="s1"')
  const sealed=render({phase:'vote',turn:null,vote:'s3'});expect(sealed).toContain('Your ballot is sealed');expect(sealed).not.toContain('data-tr-suspect=')
 })
 it('reveals roles, board winner and ballot verdict separately after the game',()=>{
  const board=[...initial.board];board[0]=board[1]=board[2]='A'
  const html=render({phase:'done',turn:null,board,line:[0,1,2],roleReveal:{s1:'ally',s2:'saboteur',s3:'ally'},scores:{s1:5,s2:0,s3:5},alliesIdentified:true})
  expect(html).toContain('Laurel line');expect(html).toContain('Saboteur identified');expect(html).toContain('data-tr-reveal="s2"');expect(html).toContain('5 points')
 })
 it('switches its worked diagram between stages without introducing dummy action buttons',()=>{
  const diagrams=[0,1,2,3].map(step=>renderToStaticMarkup(<ThreeRowLesson step={step}/>))
  expect(new Set(diagrams).size).toBeGreaterThan(2);expect(diagrams.join('')).not.toContain('<button')
 })
})
