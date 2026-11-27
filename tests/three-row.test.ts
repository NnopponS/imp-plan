import { describe, expect, it } from 'vitest'
import { applyThreeRow, botThreeRow, createThreeRow, threeRowView, tickThreeRow } from '../src/three-row'
import type { ThreeRowAction, ThreeRowMark, ThreeRowState } from '../src/three-row'

const seats = ['p1', 'p2', 'p3', 'p4']
const started = () => createThreeRow(seats, 1000, 2026, 2000)
const place = (state: ThreeRowState, cell: number, mark: ThreeRowMark, now: number) =>
  applyThreeRow(state, threeRowView(state).turn!, { kind: 'threeRowPlace', cell, mark }, now)!
const allyLine = () => [0, 1, 2].reduce((state, cell) => place(state, cell, 'A', 1100 + cell), started())
const vote = (state: ThreeRowState, actor: string, suspect: string, now = 1150) =>
  applyThreeRow(state, actor, { kind: 'threeRowVote', suspect }, now)
const hiddenSaboteur = (state: ThreeRowState, keys: readonly string[] = seats) =>
  keys.find(key => threeRowView(state, key).role === 'saboteur')!

describe('S1-12 Three in a Row fan rules', () => {
  it('requires distinct 3–4 seat ids, starts at the first seat, and seeds exactly one private saboteur', () => {
    expect(() => createThreeRow(['p1', 'p2'], 1000, 1, 2000)).toThrow()
    expect(() => createThreeRow([...seats, 'p5'], 1000, 1, 2000)).toThrow()
    expect(() => createThreeRow(['p1', 'p1', 'p3'], 1000, 1, 2000)).toThrow()
    const choices = new Set()
    for (let seed = 0; seed < 20; seed++) {
      const table = createThreeRow(seats, 1000, seed, 2000)
      const roles = seats.map(seat => threeRowView(table, seat).role)
      expect(roles.filter(role => role === 'saboteur')).toHaveLength(1)
      expect(roles.filter(role => role === 'ally')).toHaveLength(3)
      expect(createThreeRow(seats, 1000, seed, 2000)).toEqual(table)
      expect(threeRowView(table)).toEqual({
        phase: 'place', board: Array(25).fill(null), turn: 'p1', turns: 0, deadline: 3000, line: [],
        role: null, bluffs: null, vote: null, roleReveal: null, alliesIdentified: null, scores: null,
      })
      choices.add(roles.indexOf('saboteur'))
    }
    expect(choices.size).toBe(4)
  })

  it('rejects strangers, wrong turn, invalid position or symbol, duplicate and late placement', () => {
    const state = started()
    const valid: ThreeRowAction = { kind: 'threeRowPlace', cell: 0, mark: 'A' }
    for (const actor of ['nobody', 'p2']) expect(applyThreeRow(state, actor, valid, 1100)).toBeNull()
    for (const cell of [-1, 25, 1.5, NaN]) expect(applyThreeRow(state, 'p1', {...valid, cell}, 1100)).toBeNull()
    expect(applyThreeRow(state, 'p1', {...valid, mark:'C'} as unknown as ThreeRowAction, 1100)).toBeNull()
    for (const badTime of [999, 3000, NaN, Infinity]) expect(applyThreeRow(state, 'p1', valid, badTime)).toBeNull()
    const next = place(state, 0, 'A', 1100)
    expect(threeRowView(next)).toMatchObject({ turn: 'p2', turns: 1, deadline: 3100 })
    expect(threeRowView(state).board[0]).toBe(null)
    expect(threeRowView(next).board[0]).toBe('A')
    expect(applyThreeRow(next, 'p2', valid, 1150)).toBeNull()
  })

  it('charges two bluffs to an ally only and leaves the saboteur unrestricted', () => {
    const table = createThreeRow(seats, 1000, 0, 2000)
    const ally = seats.find(seat => threeRowView(table, seat).role === 'ally')!
    const saboteur = hiddenSaboteur(table)
    for (const seat of [ally, saboteur]) {
      let state = table
      const contested = [0, 7, 14]
      let count = 0
      while (threeRowView(state).phase === 'place') {
        const view = threeRowView(state)
        if (view.turn === seat) {
          const attempt = applyThreeRow(state, seat, {kind:'threeRowPlace', cell:contested[count], mark:'B'}, view.deadline-1)
          if (count === 2) {
            if (seat === ally) expect(attempt).toBeNull()
            else expect(threeRowView(attempt!).board[14]).toBe('B')
            break
          }
          state = attempt!
          count++
        } else {
          state = tickThreeRow(state,view.deadline)!
        }
      }
      expect(count).toBe(2)
      expect(threeRowView(state, seat).bluffs).toBe(seat === ally ? 0 : null)
      expect(threeRowView(state, seats.find(id=>id!==seat&&id!==saboteur)).bluffs).toBe(2)
      expect(threeRowView(state).bluffs).toBeNull()
    }
  })

  it.each([[0,1,2],[2,7,12],[0,6,12],[4,8,12]])('recognizes a contiguous line and opens voting: %j', (...cells) => {
    const table = cells.reduce((state, cell) => place(state, cell, 'A', 1100 + cell), started())
    expect(threeRowView(table)).toMatchObject({ phase:'vote', board: expect.any(Array), turn:null, turns:3, line:cells, roleReveal:null })
  })

  it('does not count horizontally wrapped runs or disconnected symbols', () => {
    const table = [3,4,5,7].reduce((state, cell) => place(state, cell, 'A', 1100 + cell), started())
    expect(threeRowView(table)).toMatchObject({phase:'place',turns:4,line:[]})
  })

  it('keeps all accepted ballots private and reveals only roles, verdict and scores at the end', () => {
    const state = allyLine(), saboteur = hiddenSaboteur(state)
    const [ally, ally2, ally3] = seats.filter(seat=>seat!==saboteur)
    for (const actor of ['nobody', ally]) {
      expect(vote(state, actor, actor)).toBeNull()
      expect(vote(state, actor, 'nobody')).toBeNull()
    }
    const first=vote(state, ally, saboteur)!
    expect(vote(first, ally, saboteur)).toBeNull()
    expect(threeRowView(first, ally).vote).toBe(saboteur)
    for(const observer of [undefined, ally2, ally3, saboteur, 'spectator']) {
      expect(threeRowView(first, observer)).toEqual(threeRowView(state, observer))
    }
    let next=vote(first, saboteur, ally)!
    next=vote(next, ally2, saboteur)!
    expect(threeRowView(next).phase).toBe('vote')
    next=vote(next, ally3, ally)!
    const result=threeRowView(next)
    expect(result).toMatchObject({phase:'done', roleReveal:{[ally]:'ally',[ally2]:'ally',[ally3]:'ally',[saboteur]:'saboteur'},alliesIdentified:true,
      scores:{[ally]:5,[ally2]:5,[ally3]:5,[saboteur]:0}})
    expect(result.vote).toBeNull()
    for (const seat of [ally, ally2, ally3, saboteur]) expect(threeRowView(next,seat).vote).toBeNull()
    expect(vote(next, ally, saboteur)).toBeNull()
  })

  it('gives the saboteur board points for a B line and allied detection points only on a strict majority', () => {
    const state = [0, 1, 2].reduce((table, cell) => place(table, cell, 'B', 1100 + cell), started())
    const saboteur=hiddenSaboteur(state), allies=seats.filter(seat=>seat!==saboteur)
    let next=vote(state,saboteur,allies[0])!
    next=vote(next,allies[0],saboteur)!
    next=vote(next,allies[1],allies[0])!
    const result=threeRowView(tickThreeRow(next,3102)!)
    expect(result).toMatchObject({phase:'done',alliesIdentified:false,scores:{[saboteur]:5,[allies[0]]:0,[allies[1]]:0,[allies[2]]:0}})
  })

  it('scores a successful deduction even if a B line stopped the board', () => {
    const state = [0, 1, 2].reduce((table, cell) => place(table, cell, 'B', 1100 + cell), started())
    const saboteur=hiddenSaboteur(state), allies=seats.filter(seat=>seat!==saboteur)
    let next=vote(state,allies[0],saboteur)!
    next=vote(next,allies[1],saboteur)!
    const result=threeRowView(tickThreeRow(next,3102)!)
    expect(result).toMatchObject({phase:'done',alliesIdentified:true,scores:{[saboteur]:3,[allies[0]]:2,[allies[1]]:2,[allies[2]]:2}})
  })

  it('treats a 3-seat split ballot as incorrect even if the decoy also selected its own faction target', () => {
    const three=['p1','p2','p3']
    let state=createThreeRow(three,1000,3,2000)
    state=[0,1,2].reduce((table,cell)=>place(table,cell,'A',1100+cell),state)
    const saboteur=hiddenSaboteur(state,three), allies=three.filter(seat=>seat!==saboteur)
    state=vote(state,saboteur,allies[0])!
    state=vote(state,allies[0],saboteur)!
    state=vote(state,allies[1],allies[0])!
    expect(threeRowView(state)).toMatchObject({phase:'done',alliesIdentified:false,scores:{[saboteur]:2,[allies[0]]:3,[allies[1]]:3}})
  })

  it('advances through elapsed turns and the vote without inventing moves or re-opening expired time', () => {
    const state = started()
    expect(tickThreeRow(state, 2999)).toBeNull()
    const late=tickThreeRow(state,7000)!
    expect(threeRowView(late)).toMatchObject({phase:'place',turn:'p4',turns:3,deadline:9000,board:Array(25).fill(null)})
    const votePhase=tickThreeRow(late,25000)!
    expect(threeRowView(votePhase)).toMatchObject({phase:'vote',turn:null,turns:12,deadline:27000,line:[]})
    expect(vote(votePhase,'p1','p2',27000)).toBeNull()
    const done=tickThreeRow(state,27000)!
    expect(threeRowView(done)).toMatchObject({phase:'done',turns:12,alliesIdentified:false,scores:{[hiddenSaboteur(state)]:5}})
    expect(tickThreeRow(done,35000)).toBeNull()
  })

  it('keeps returned mutable JSON containers independent of authoritative state, even for reserved object keys', () => {
    const keys=['__proto__','constructor','toString']
    const state=createThreeRow(keys,1000,7,2000)
    const initial=threeRowView(state)
    ;(initial.board as (ThreeRowMark|null)[])[0]='B'
    expect(threeRowView(state).board[0]).toBeNull()
    expect(threeRowView(state,'hasOwnProperty').role).toBeNull()
    const done=tickThreeRow(state,27000)!
    const result=threeRowView(done)
    expect(Object.keys(result.roleReveal!).sort()).toEqual([...keys].sort())
    expect(JSON.parse(JSON.stringify(result.scores))[hiddenSaboteur(state,keys)]).toBe(5)
  })

  it('obtains legal bot actions through public/seat view alone and finishes for every seat count and difficulty', () => {
    for (const size of [3,4]) for (const level of ['easy','normal','hard'] as const) for(let seed=0;seed<12;seed++){
      const keys=seats.slice(0,size)
      let state = createThreeRow(keys,1000,seed,2000)
      const rng=(()=>{ let a=seed; return () => ((a=Math.imul(a+1,48271)>>>0)/4294967296) })()
      expect(botThreeRow(threeRowView(state),'spectator',keys,level,rng)).toBeNull()
      let step=0
      while(threeRowView(state).phase!=='done' && step<20){
        const pub=threeRowView(state)
        const actor=pub.turn??keys.find(id=>!threeRowView(state,id).vote)!
        const action=botThreeRow(threeRowView(state,actor),actor,keys,level,rng)
        expect(action).not.toBeNull()
        const next=applyThreeRow(state,actor,action!,1100+step++)
        expect(next).not.toBeNull()
        state=next!
      }
      expect(step).toBeLessThanOrEqual(12+size)
      expect(threeRowView(state).phase).toBe('done')
    }
  })

  it('makes the hard bot recognize wins and urgent blocks without secret role maps', () => {
    let state = place(place(started(), 0, 'A', 1100), 1, 'A', 1101)
    const actor=threeRowView(state).turn!
    const role=threeRowView(state,actor).role
    const action=botThreeRow(threeRowView(state,actor),actor,seats,'hard',()=>0)
    expect(action).toMatchObject({kind:'threeRowPlace',cell:2,mark:role==='ally'?'A':'B'})
    state=applyThreeRow(state,actor,action!,1102)!
    expect(threeRowView(state).phase).toBe(role==='ally'?'vote':'place')
  })
})
