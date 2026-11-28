# Mobile UX audit: all three seasons

This records a mobile entry/first-screen audit of all 41 currently playable fan tables and separates 23 archive-only entries. It is not an accuracy audit of broadcast rules, a complete playthrough of each title, or an internet multiplayer reliability claim.

| Season | Playable | Archive only | Playwright Chromium table openings |
|---|---:|---:|---:|
| 1 | 12 | 6 | 36 at 320 × 710, 390 × 844 and 844 × 390 |
| 2 | 9 | 8 | 18 at 320 × 740 and 390 × 844 |
| 3 | 20 | 9 | 40 at 320 × 640 and 390 × 844 |

All 94 first-table checks rendered without document-level horizontal overflow. The shelf was also checked for all 41 covers at 320 × 660, 390 × 844, 844 × 390 and 1440 × 900 (164 checks). At 390 × 844 and 844 × 390, all 82 cover previews could open by keyboard, render a game-specific illustration, close, and restore focus. A true touch hold was exercised for every Season 2 and 3 cover, and at the Season 2 gallery and party entry points. The Linux Playwright WebKit check covered Time Auction tap, mouse hold, focus restoration and launch at 390 × 844 and 844 × 390; it does not stand in for a physical iPhone.

A tap on a party card chooses it directly; a hold previews before choosing. Gallery covers preview on tap or hold. A swipe that moves before the hold does not open the card. The icon controls remain keyboard accessible. During a match, long press acts only on cards where it is a useful alternative selection and never submits a hidden choice.

## Games checked

### Season 1

| ID | Game | Result or follow-up |
|---|---|---|
| S1-02 | Cooperative Puzzle | Placement tools moved next to the mosaic; compact portrait and height-aware landscape. |
| S1-04 | Fragments of Memory | Readable study instruction and recall prompts, without changing the parchment exhibit. |
| S1-05 | Secret Number | Tickets are readable; consider reducing notebook and form height on short screens. |
| S1-06 | Word Tower | Keep the rack and columns visible together; increase small targets where space permits. |
| S1-08 | Scale Game | Keep the visible cabinet and direct mineral controls. |
| S1-09 | Laying Grass | Board-first layout, visible tile controls, keyboard moves, collapsible standings. |
| S1-10 | Montage | Keep the portrait and buzzer together on short landscape in a later pass. |
| S1-11 | Equation High-Low | Press or tap to select number cards; numbered seals; rack and wager controls together on short landscape. |
| S1-12 | Four-Player Three in a Row | Size the landscape board to fit with the seal controls in a later pass. |
| S1-13 | Blind Gomoku | Keep coordinates, keyboard and pinch/zoom for crowded points. |
| S1-14 | Nine Men's Morris | Keep legal sockets, trackable pieces and full initial board. |
| S1-15 | Hexagon | Keep the drawn study tiles; verify landscape recall separately. |

Archive only at the time of this sweep: S1-01 The Virus Game; S1-03 Rules Race; S1-07 Zoo; S1-16 Dice Poker; S1-17 Prison puzzle; S1-18 Piece / Secret Chamber Unlock.

### Season 2

| ID | Game | Result or follow-up |
|---|---|---|
| S2-02 | Remove One | Artwork works; raise the private cards above repeated status and make a hold inspect rather than discard. |
| S2-04 | Time Auction | Sealed mode now shows a private wooden time-bank gauge and quick drafts; Lock bid stays explicit. |
| S2-08 | Triple Dice | Keep the die faces; compress the repeated masthead on phones. |
| S2-09 | Balance Mancala | Carved pits and stones, distinct count and ownership cues, stronger text contrast. |
| S2-10 | Wall Go | Keep the direct two-stage cell/edge target; improve contrast on its status strip next. |
| S2-12 | Equation Pyramid | The selection fits; shorten duplicated headers before reducing tile targets. |
| S2-13 | Big Small | Bring the private hand above the public-chip information on narrow displays. |
| S2-14 | Bagh Chal | Keep the carved goats/tigers and large legal sockets. |
| S2-16 | Knight's Tour | Keep the carved piece, marked L-path and undo. Alternate sizes not covered by this sweep. |

Archive only at the time of this sweep: S2-01 Crooked Cops / Corrupt Police; S2-03 Unknown; S2-05 Halloween Monster; S2-06 Sniper Hold'em; S2-07 Treasure Island; S2-11 Doubt and Bet; S2-15 Question and Truth; S2-17 Hidden Well / Secret Key Challenge.

### Season 3

| ID | Game | Result or follow-up |
|---|---|---|
| S3-02 | Count the Cubes | Keep angles and layer controls close to the illustrated model. |
| S3-03 | Count the Rectangles | Keep the live survey grid; distinguish local marks from submission. |
| S3-04 | Lay the Grass | Board and Ready are visible during trade; optional swap controls are separate. |
| S3-05 | Memory Poker | The study grid fits at 320px; preserve hidden information and explicit Lock hand. |
| S3-08 | Auction Bingo | Keep draft selection distinct from sealed bid or reveal; in-table hold not added in this pass. |
| S3-09 | Hidden Word | Prioritize the private clue and shorten repeating labels; do not auto-submit a hold. |
| S3-11 | Heavy 13 | Keep the numeric cube and marked stands; review the private tray at smaller sizes in a later pass. |
| S3-14 | Wall Go II | Retain zoom and move marks; move draft tools closer to the board on phones. |
| S3-16 | Gradation | Move weights and gates into the same short viewport in a later pass. |
| S3-17 | Piece Puzzle | Retain shape outlines, legal placement and keyboard staging. |
| S3-18 | Spot the Difference | Keep the two visual panels and explicit mark/zoom behavior. |
| S3-19 | Secret Code | Compact answer tray and cards; hold selects; complete clue sheet opens separately on phones. |
| S3-20 | Loop Fence Puzzle | Retain line/cross/clear modes and precise edge placement. |
| S3-21 | Symmetrical Puzzle | Keep reflected geometry and private draft distinct from submission. |
| S3-22 | Flags Around the World | Fit all 12 flags during timed study on the shortest phones in a later pass. |
| S3-23 | Exile Rectangle Counting | Retain sign labels as well as color for the number grid. |
| S3-24 | Trial of God / Divine Test | Keep engraved symbols, fixed anchors and explicit symbol key access. |
| S3-26 | Point Gomoku | Retain coordinate entry and zoom instead of shrinking 13×13 taps further. |
| S3-28 | Color Link | Keep route letters, keyed controls and private draft traces. |
| S3-29 | Equation Traffic Light / Equation Lights | Increase ink contrast and put the inline lock and operator row on the first screen. |

Archive only at the time of this sweep: S3-01 Either Or; S3-06 Mystery Stock Market; S3-07 Gem Black Market; S3-10 Hit, Stay; S3-12 Russian Roulette (virtual Hazard Deduction); S3-15 Tower of Equations; S3-25 Secret Vault; S3-27 Card Janggi.


## Follow-up table checks after the sweep

The collection has since added Treasure Island, Hit, Stay, and Piggy Bank. Each was exercised through a 320px or 390px table, not added to the historical counts above. Point Gomoku's read-only sample shows the full field, while the live table uses the same engraved board and retains its explicit zoom and coordinate controls. Fragments shows the illustrated cabinet through the study phase only; Equation Pyramid uses the same carved tiles in Preview and play.
