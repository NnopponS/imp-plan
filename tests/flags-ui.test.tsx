import {renderToStaticMarkup} from 'react-dom/server'
import {describe,it,expect} from 'vitest'
import type {FlagsView} from '../src/flags'
import {FlagsBoard,FlagsLesson} from '../src/flags-ui'
const study=Array.from({length:12},(_,i)=>({code:'c'+i,description:'Sample pattern '+i,symbol:'Star '+i,name:'Study label '+i}))
const options=Array.from({length:20},(_,i)=>({code:'g'+i,description:'Pick pattern '+i,symbol:'Star '+i}))
const base:FlagsView={phase:'study',mode:'recall',deadline:50000,study,options:[],names:[],ownChoices:null,submitted:0,players:3,leaders:[],results:null,solutions:null}
const markup=(patch:Partial<FlagsView>={},active=true)=>renderToStaticMarkup(<FlagsBoard view={{...base,...patch}} you="s1" names={{s1:'Ari',s2:'Bo'}} hostNow={10000} active={active} send={()=>{}}/>)
describe('Flags field atlas',()=>{
 it('shows twelve named accessible specimens, never an answer rack during study',()=>{
  const html=markup()
  expect((html.match(/data-fa-study=/g)??[]).length).toBe(12)
  expect(html).toContain('Study label 11');expect(html).toContain('Sample pattern 4');expect(html).toContain('Star 11')
  expect(html).not.toContain('data-fa-option=');expect(html).not.toContain('data-fa-seal=')
 })
 it('closes the timed exhibit locally before the host delivers a new snapshot',()=>{
  const html=markup({deadline:10000})
  expect(html).toContain('Waiting for host');expect(html).not.toContain('data-fa-study=');expect(html).not.toContain('Study label');expect(html).not.toContain('Sample pattern');expect(html).not.toContain('src=');expect(html).not.toContain('data-fa-option=')
 })
 it('shows twenty unnamed options without exposing a previous exhibit or winner during recall',()=>{
  const html=markup({phase:'answer',options})
  expect((html.match(/data-fa-option=/g)??[]).length).toBe(20)
  expect(html).toContain('Pick pattern 19');expect(html).not.toContain('Study label');expect(html).not.toContain('Correct')
  expect(html).toContain('Seal answer');expect(html).toContain('data-fa-option="0"')
 })
 it('provides a labelled name station and twenty selectable flags in matching mode',()=>{
  const html=markup({phase:'answer',mode:'names',options,names:study.map(c=>c.name)})
  expect((html.match(/data-fa-name=/g)??[]).length).toBe(12)
  expect(html).toContain('Study label 7');expect(html).toContain('Assign a flag');expect(html).toContain('Pick pattern 19')
 })
 it('keeps a host-accepted selection sealed and unavailable for editing',()=>{
  const html=markup({phase:'answer',options,ownChoices:[2,7],submitted:1})
  expect(html).toContain('Answer sealed');expect(html).not.toContain('data-fa-seal=');expect((html.match(/data-picked="true"/g)??[]).length).toBe(2)
 })
 it('does not allow disconnected or inactive viewers to submit',()=>{
  const html=markup({phase:'answer',options},false)
  expect(html).not.toContain('data-fa-seal=');expect((html.match(/<button[^>]*disabled=""[^>]*data-fa-option=/g)??[]).length).toBe(20)
 })
 it('shows points, wrong picks, times, shared top names and a post-match key',()=>{
  const html=markup({phase:'done',options,leaders:['s1','s2'],deadline:null,solutions:[4,7],results:[{seat:'s1',hits:2,misses:1,points:1,elapsed:23500},{seat:'s2',hits:1,misses:0,points:1,elapsed:24000}]})
  expect(html).toContain('Ari');expect(html).toContain('Bo');expect(html).toContain('Shared');expect(html).toContain('23.5s');expect(html).toContain('1 wrong');expect((html.match(/data-correct="true"/g)??[]).length).toBe(2)
 })
 it('teaches with four different inline drawings',()=>{
  const outputs=[0,1,2,3].map(step=>renderToStaticMarkup(<FlagsLesson step={step}/>))
  expect(new Set(outputs.map(v=>v.split('<figcaption')[0])).size).toBe(4);expect(outputs.join('')).not.toContain('<button')
 })
})
