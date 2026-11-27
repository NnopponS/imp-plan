# Memory Poker: duel and tournament formats

Imp Plan’s optional **Episode-style duel** recreates the individual poker hand from *The Devil’s Plan* Season 3, Episode 2. Two players study 16 cards for 20 seconds, then have 60 seconds to select two hidden positions. Three shared cards complete each hand. Standard hand rankings and kickers decide the winner; suits do not break ties. An exact tie starts a fresh deal. The regular fan mode remains separate.

## What the episode adds

Memory Poker is the fourth and final mini-game of the Day 1 main match, Either Or. It uses the contestant rankings from the earlier rounds. The contestants first chose how many bottom-ranked players to eliminate, then voted between Ladder and Nomination. The ladder won the vote.

1. Rank 15 challenges the person immediately above them. A win swaps their ranks and the same challenger continues upward. A loss ends that challenger’s streak.
2. Rank 16 starts their turn after the first streak and challenges the then-current rank 15. A newly displaced player at rank 15 or 16 may start a streak if they have not already used their own. Losing as a defender does not itself spend that streak.
3. Resolve an ongoing streak before closing out the match, even if both elimination spots are already settled.

The unused nomination option would let a challenger choose a higher-ranked opponent they had not already challenged. A victory advances the challenger one rank and drops the defender one rank. The episode's rule explanation gives a Piece to a successful defender in that option. It does not show how overlapping rank swaps would be adjudicated.

## Implementation boundary

- The site plays the individual two-human duel, not the Day 1 ladder, qualification vote, Pieces economy or Exile routing. The game has no betting or real-money stakes.
- The episode shows a redeal after one exact tie. Imp Plan repeats that policy for subsequent exact ties. For submission timeouts, one lock wins by forfeit; zero locks end without a winner. These are clearly defined site rules, not verified episode outcomes.
- Sources: [S3E2 English transcript](https://www.subtitlecat.com/subs/1791/The.Devils.Plan.S03E02.1080p.NF.WEB-DL.Multi.DDP5.1.H.264-1918.html), [Korean episode coverage from iMBC](https://enews.imbc.com/News/RetrieveNewsInfo/525451), and [Korean Day 1 match reconstruction](https://www.namu.moe/w/%EB%8D%B0%EB%B8%94%EC%8A%A4%20%ED%94%8C%EB%9E%9C%3A%20%EB%8D%B0%EB%93%9C%20%EC%96%B4%EA%B2%8C%EC%9D%B8/1%EC%9D%BC%EC%B0%A8). The comparison is transcript-based, not direct footage verification.
