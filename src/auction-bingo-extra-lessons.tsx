import {lazy,Suspense} from 'react'
import {loadTable,TableLoadBoundary} from './lazy-table'

const AuctionBingoLesson=lazy(()=>loadTable(()=>import('./auction-bingo-ui')).then(m=>({default:m.AuctionBingoLesson})))
export const extraLessons={
 auctionBingo:{
  frames:[
   {title:'Choose a shape',caption:'Slip a ticket into one lot. The table opens all tickets together.'},
   {title:'Seal whole coins',caption:'Choose coins from your own pouch. Every positive bid is paid, even if you lose.'},
   {title:'Read the price ledger',caption:'Five shape tickets and two equal high bids award two shapes each; one is discarded. The most expensive lot’s price stays sealed.'},
   {title:'Complete a line',caption:'After seven rounds, the dealer fits your shapes for the most lines. Filled cells and coins left break ties.'},
  ],
  render:(step:number)=><TableLoadBoundary title="Auction Bingo"><Suspense fallback={<span data-lesson-pending role="status">Opening the lot ledger…</span>}><AuctionBingoLesson step={step}/></Suspense></TableLoadBoundary>
 },
}
