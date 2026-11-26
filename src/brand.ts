export const brand='Imp Plan'
export const base=import.meta.env.BASE_URL
export const seasons=[
 {id:1,roman:'I',title:'The First Plan',year:'2023',tone:'copper',art:'morris',copy:'Where it began. Play memory duels and classic board strategy, or explore the original season’s challenges.'},
 {id:2,roman:'II',title:'Death Room',year:'2025',tone:'jade',art:'auction',copy:'Limited time changes the game. Explore the prison matches, hidden trials and asymmetric strategy of season two.'},
 {id:3,roman:'III',title:'Dead Again',year:'2026',tone:'gold',art:'point',copy:'Comebacks, new puzzles and a different way to score a familiar board. Find the third-season challenges here.'},
] as const
export const seasonHref=(n:number)=>base+'season/'+n+'/'
export function currentSeason(){
 const m=location.pathname.slice(base.length).match(/^season\/([123])\/(?:index\.html)?$/)
 return seasons.find(s=>s.id===Number(m?.[1]))
}
