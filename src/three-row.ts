// S1-12 is the owner's placement-and-vote fan adaptation, not the broadcast's stacking game.
export type ThreeRowMark = 'A' | 'B'
export type ThreeRowRole = 'ally' | 'saboteur'
export type ThreeRowAction =
  | { kind: 'threeRowPlace'; cell: number; mark: ThreeRowMark }
  | { kind: 'threeRowVote'; suspect: string }

export type ThreeRowView = {
  phase: 'place' | 'vote' | 'done'
  board: readonly (ThreeRowMark | null)[]
  turn: string | null
  turns: number
  deadline: number
  line: readonly number[]
  role: ThreeRowRole | null
  bluffs: number | null
  vote: string | null
  roleReveal: Readonly<Record<string, ThreeRowRole>> | null
  alliesIdentified: boolean | null
  scores: Readonly<Record<string, number>> | null
}

export type ThreeRowState = {
  readonly seats: readonly string[]
  readonly saboteur: number
  readonly phase: ThreeRowView['phase']
  readonly board: ThreeRowView['board']
  readonly turns: number
  readonly deadline: number
  readonly line: readonly number[]
  readonly bluffs: readonly number[]
  readonly votes: readonly (string | null)[]
  readonly stepMs: number
  readonly lastAt: number
}

const side = 5
const area = side * side
const turnLimit = 12
const bluffLimit = 2
const directions = [[1, 0], [0, 1], [1, 1], [-1, 1]]
const inside = (n: number) => n >= 0 && n < side
const validCell = (cell: number) => Number.isInteger(cell) && cell >= 0 && cell < area
const validMark = (mark: string): mark is ThreeRowMark => mark === 'A' || mark === 'B'
const turnSeat = ({seats, turns}: ThreeRowState) => seats[turns % seats.length]
const roleAt = (state: ThreeRowState, i: number): ThreeRowRole => i === state.saboteur ? 'saboteur' : 'ally'

const lines = Array.from({ length: area }, (_, at) => directions.flatMap(([dx, dy]) => {
  const x = at % side, y = Math.floor(at / side)
  if (!inside(x + 2 * dx) || !inside(y + 2 * dy)) return []
  const delta = dy * side + dx
  return [[at, at + delta, at + 2 * delta]]
})).flat()
const through = Array.from({ length: area }, (_, cell) => lines.filter(line => line.includes(cell)))
const resultingLine = (board: ThreeRowView['board'], cell: number, mark: ThreeRowMark) =>
  through[cell].find(line => line.every(at => at === cell || board[at] === mark))

// Same seed always assigns the same redacted role, without coupling it to the first turn.
function roleIndex(seed: number, count: number) {
  const z = (seed + 0x6d2b79f5) | 0
  let n = Math.imul(z ^ (z >>> 15), 1 | z)
  n ^= n + Math.imul(n ^ (n >>> 7), 61 | n)
  return Math.floor(((n ^ (n >>> 14)) >>> 0) / 4294967296 * count)
}

export function createThreeRow(seats: readonly string[], now: number, seed: number, stepMs: number): ThreeRowState {
  if (seats.length < 3 || seats.length > 4 || seats.some(seat => typeof seat !== 'string' || !seat) ||
      new Set(seats).size !== seats.length) throw new RangeError('Three in a Row needs three or four distinct seats')
  if (!Number.isFinite(now) || !Number.isFinite(stepMs) || stepMs < 1 ||
      !Number.isFinite(now + stepMs * (turnLimit + 1)) || now + stepMs <= now) throw new RangeError('Invalid table clock')
  const saboteur = roleIndex(seed, seats.length)
  return {
    seats: [...seats], saboteur, phase:'place', board:Array<null>(area).fill(null), turns:0,
    deadline:now + stepMs, line:[], bluffs:seats.map(() => bluffLimit), votes:seats.map(() => null), stepMs, lastAt:now,
  }
}

function advanceAfterSlot(state: ThreeRowState, at: number, line: readonly number[] = []): ThreeRowState {
  const turns = state.turns + 1
  const vote = line.length > 0 || turns >= turnLimit
  return {
    ...state, phase:vote ? 'vote' : 'place', turns, deadline:at + state.stepMs,
    line, lastAt:at,
  }
}

function tally(state: ThreeRowState) {
  const suspect = state.seats[state.saboteur]
  const votesForSaboteur = state.votes.filter((vote, seat) => seat !== state.saboteur && vote === suspect).length
  const alliesIdentified = votesForSaboteur * 2 > state.seats.length - 1
  const alliesWonBoard = state.line.length > 0 && state.board[state.line[0]] === 'A'
  const allyScore = (alliesWonBoard ? 3 : 0) + (alliesIdentified ? 2 : 0)
  const saboteurScore = (alliesWonBoard ? 0 : 3) + (alliesIdentified ? 0 : 2)
  return {
    alliesIdentified,
    scores:Object.fromEntries(state.seats.map((seat, i) => [seat, i === state.saboteur ? saboteurScore : allyScore])),
  }
}

export function threeRowView(state: ThreeRowState, seat?: string): ThreeRowView {
  const index = seat === undefined ? -1 : state.seats.indexOf(seat)
  const done = state.phase === 'done'
  const role = index < 0 ? null : roleAt(state, index)
  const result = done ? tally(state) : null
  return {
    phase:state.phase, board:[...state.board], turn:state.phase === 'place' ? turnSeat(state) : null, turns:state.turns,
    deadline:state.deadline, line:[...state.line], role, bluffs:role === 'ally' && !done ? state.bluffs[index] : null,
    vote:index >= 0 && state.phase === 'vote' ? state.votes[index] : null,
    roleReveal:done ? Object.fromEntries(state.seats.map((id, i) => [id, roleAt(state, i)])) : null,
    alliesIdentified:result?.alliesIdentified ?? null, scores:result?.scores ?? null,
  }
}

export function applyThreeRow(state: ThreeRowState, actor: string, action: ThreeRowAction, now: number): ThreeRowState | null {
  if (!action || !Number.isFinite(now) || now < state.lastAt || now >= state.deadline) return null
  const seat = state.seats.indexOf(actor)
  if (seat < 0) return null
  if (state.phase === 'vote' && action.kind === 'threeRowVote') {
    if (state.votes[seat] !== null || action.suspect === actor || !state.seats.includes(action.suspect)) return null
    const votes = state.votes.map((vote, i) => i === seat ? action.suspect : vote)
    // No private vote, participation flag or receipt timestamp may change another seat's projection.
    return { ...state, votes, lastAt:now, phase:votes.every(vote => vote !== null) ? 'done' : 'vote' }
  }
  if (state.phase !== 'place' || action.kind !== 'threeRowPlace' || actor !== turnSeat(state)) return null
  const { cell, mark } = action
  if (!validCell(cell) || !validMark(mark) || state.board[cell] !== null) return null
  const spendsBluff = mark === 'B' && seat !== state.saboteur
  if (spendsBluff && state.bluffs[seat] === 0) return null
  const line = resultingLine(state.board, cell, mark)
  const board = state.board.map((old, i) => i === cell ? mark : old)
  const bluffs = spendsBluff ? state.bluffs.map((old,i) => i === seat ? old - 1 : old) : state.bluffs
  return advanceAfterSlot({ ...state, board, bluffs }, now, line)
}

export function tickThreeRow(state: ThreeRowState, now: number): ThreeRowState | null {
  if (state.phase === 'done' || !Number.isFinite(now) || now < state.deadline) return null
  let next = state
  // Handle browser throttling without granting new time; loop bounded by the twelve total slots.
  while (next.phase === 'place' && now >= next.deadline) next = advanceAfterSlot(next, next.deadline)
  return next.phase === 'vote' && now >= next.deadline ? { ...next, phase:'done', lastAt:next.deadline } : next
}

function sample<T>(values: readonly T[], rng: () => number): T | undefined {
  if (values.length === 0) return undefined
  const draw = rng()
  return values[Number.isFinite(draw) ? Math.min(values.length - 1, Math.max(0, Math.floor(draw * values.length))) : 0]
}

export function botThreeRow(
  view: ThreeRowView, actor: string, seats: readonly string[], level: 'easy' | 'normal' | 'hard', rng: () => number,
): ThreeRowAction | null {
  if (!view.role || !seats.includes(actor)) return null
  if (view.phase === 'vote' && view.vote === null) {
    // The mark history has no seat attribution in the projection; a bot has no private evidence to inspect.
    const suspect = sample(seats.filter(seat => seat !== actor), rng)
    return suspect === undefined ? null : { kind:'threeRowVote', suspect }
  }
  if (view.phase !== 'place' || view.turn !== actor) return null
  const aim = view.role === 'ally' ? 'A' : 'B'
  const opponent = aim === 'A' ? 'B' : 'A'
  const empties = view.board.flatMap((mark, cell) => mark === null ? [cell] : [])
  if (!empties.length) return null
  const mayBluff = view.role === 'saboteur' || (view.bluffs ?? 0) > 0
  const pick = (cell: number, mark: ThreeRowMark = aim): ThreeRowAction => ({kind:'threeRowPlace',cell,mark})
  if (level === 'easy') {
    const mark = mayBluff && rng() < 0.15 ? opponent : aim
    return pick(sample(empties,rng)!,mark)
  }
  const win = empties.find(cell => resultingLine(view.board, cell, aim))
  if (win !== undefined) return pick(win)
  const danger = empties.filter(cell => resultingLine(view.board, cell, opponent))
  if (danger.length) return pick(sample(danger,rng)!)
  if (level === 'normal') {
    const eligible = mayBluff && rng() < 0.1 ? empties.filter(cell => !resultingLine(view.board,cell,opponent)) : []
    const bluff = sample(eligible,rng)
    return bluff === undefined ? pick(sample(empties,rng)!) : pick(bluff,opponent)
  }
  // Develop positions that belong to several unblocked lines, favoring lines with an existing mark.
  const potential = (cell: number) => through[cell].reduce((total,line) =>
    line.some(at => view.board[at] === opponent) ? total : total + 1 + 2 * line.filter(at => view.board[at] === aim).length,0)
  const max = Math.max(...empties.map(potential))
  return pick(sample(empties.filter(cell => potential(cell) === max),rng)!)
}
