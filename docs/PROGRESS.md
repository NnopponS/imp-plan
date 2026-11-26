# Execution ledger
Date: 2026-11-26. Repository: feature branch locally. No remote repo or Pages deployment confirmed.

## M0 · complete locally
- Imported all 64 entries from the supplied rulebook, including 18 S1, 17 S2 and 29 S3.
- Added individual rule checklists, source leads and status-filtered catalog.
- Confirmed the connected GitHub identity is NnopponS. Repository lookup did not resolve the target; shell GitHub CLI has no session. No remote writes.

## M1 · playable alpha; public network gate open
- Four playable fan adaptations: S1-13 Blind Gomoku, S1-14 Nine Men's Morris, S2-04 Time Auction (sealed), S3-26 Point Gomoku. 60 entries are indexed only.
- Nickname, invite flow, lobby locks and readiness, 128-bit seat resume, public and player views, solo bots, per-leg result/rematch, 2–16 seat simulation, invite copying, basic result export.
- Passed: TypeScript checks, Vite production build, 11 unit/property cases, 2 Playwright tests. Browser scenarios cover invite/join/moves/resume/rematch/host close using a loopback mock transport, plus mobile keyboard and practice.
- Real two-context WebRTC with local PeerServer was attempted: registration, offer and answer worked, but Chromium gathered no ICE candidates in this environment; the data channel did not open. Public PeerJS and two distinct internet networks have not been verified. Repeat `REAL_WEBRTC=1 npm run test:e2e` on an authorized RTC-capable host, then verify production signaling on supported networks.
- Added manual Pages workflow and indexable HTML/canonical metadata/sitemap to source. This is not live and no Google indexing is claimed. Recheck intended owner and URL before publishing.
- Original Mode remains off. All 64 entries have source/rule action checklists; no television parity claim.

## Next work
- Implement Remove One with independent hands/projected outcomes; Knight's Tour with solvability proof and keyboard board; add separate simultaneous and puzzle engine contracts.
- Verify candidate broadcast rules against lawful primary materials. Research source conflicts; retain fan labels where exact rules can't be verified.
- Add specific test suites for each game, plus packet-load coverage, touch/reduced motion checks, user-supplied TURN, browser/network verification, game-specific player adaptations and tournaments.
- Do not publish as stable until the full agreed catalog, release QA and Pages checks pass. Confirm the exact target namespace is safe to create/use before any remote write.

## Visual/navigation update
Rebranded as The Devil's Plan Arena with prominent unofficial attribution. Added separate static Season 1, 2 and 3 URLs; preserved 64 indexed entries and four playable fan games. Original Blender renders, playable controls and reduced-motion defaults. Search markup is prepared in source only; the build remains unpublished.

## Imp Plan rebrand and Season 2 expansion
Latest destination is the public NnopponS/imp-plan project once available. Added playable fan editions of Remove One (3–16 seats, or solo with two bots), and Knight’s Tour (1–16 simultaneous private grids, open or closed starts). Six playable entries of 64. The website has dedicated Season 1 / 2 / 3 static paths under /imp-plan/. No repository or public Pages confirmed, and no real cross-network WebRTC pass.

## Independent puzzle expansion
Hexagon and Count the Rectangles are playable fan variants for 1–16 humans, with fixed study/answer timing, private submissions, and score/time ranking. The catalog now contains eight playable entries and 56 indexed-only entries. Dedicated Blender artwork and the season pages include both. Exact broadcast rules, bots for these puzzle modes, real cross-network multiplayer, and Pages remain unverified or unavailable.
Verification: TypeScript and Vite build passed; 18 unit/property cases and nine browser cases passed. Mobile rectangle practice reached a scored result and rematch. Hexagon study and engine-level hidden-answer transitions were verified. The two-browser room test uses a loopback transport, not production PeerJS.

## Main Match and spatial puzzle expansion
Playable catalog now includes 10 of 64 entries. Added Balance Mancala, the first standalone game sourced from a Main Match, and Count the Cubes, a standalone Either Or mini-game with three views and keyboard-accessible layer diagrams. Both are fan editions. Balance Mancala supports 2–8 seats on one board. Public Pages and real online cross-network play remain unverified.
Verification: TypeScript and production build passed; 21 unit/property and 11 Playwright tests passed. Browser tests include solo Mancala setup and sowing preview, and all five mobile cube boards with layers. Engine tests play to the end for 2–8 Mancala seats. Browser multiplayer still uses the loopback test transport.

## Season 1 Main Match and Season 2 final
12 of 64 entries playable. Added Secret Number (S1 Day 3 Main Match; three to sixteen seats, private mutual ticket exchange, deductions, and final scoring), and Bagh Chal (S2 final; two consecutive legs with reversed roles). Both are fan adaptations with new original Blender card art. The season split is 4 / 5 / 3. S3 Either Or remains a set of independently playable components, not the entire Main Match. GitHub Pages and cross-network validation remain open.
Verification: TypeScript and production build passed; 24 unit/property and 13 browser tests passed. Tests cover actual Bagh Chal inputs on mobile, private Secret Number contact with bots and ticket purchase, plus engine checks through results. The room browser test still uses a loopback transport.

## Shared tile-draft milestone
14 of 64 catalog entries playable: 5 in Season 1, 5 in Season 2, 4 in Season 3. Added the standalone Season 1 Main Match Laying Grass and Season 3 Either Or component Lay the Grass. Nine rounds and largest solid square in the former; four rounds, draft order swaps and tile bonuses in the latter. Original Blender art, browser board, fan rules, native multiplayer paths and solo bots are included. Tested mobile placement in both games and full rules progression with bots at minimum and maximum seat counts. TypeScript and Vite build passed; 28 unit/property and 15 browser tests passed. Tests do not establish real cross-network WebRTC, 13–16 seat wrappers for the Season 1 game, full Either Or, or verified broadcast rules. Public deployment remains blocked by repository access.

## Exile Rectangle Counting
15 of 64 entries playable (5 / 5 / 5). Season 3 Exile now has a separate fan-mode entry with signed 6×8 and 8×8 grids, three 90-second rounds, private answers and correct-answer time as tiebreak. It uses the existing rectangle-sum engine but is not the Either Or minigame and does not implement an exile tournament bracket. Original Blender card art. Typecheck/build, 29 unit/property tests and 16 browser tests passed. The new two-context browser test verifies mobile play, answer privacy before reveal and results via loopback, not cross-network WebRTC.

## Divine Test
16 of 64 entries playable (5 / 5 / 6). Added Season 3 S3-24 standalone fan magic-square race. It offers fixed-clue 3×3, 5×5 and 7×7 boards, configurable clock, private boards, and an optional uniquely deducible numeral key. Race ends on the first valid square or timeout. Season-level rewards/return eligibility and broadcast accuracy are not claimed. Typecheck and production build passed. 31 Vitest and 17 Playwright tests passed, including a 3×3 finish with keyboard interaction at 360px, hard clue validation, and 7×7 terminal validation.

### Milestone: Equation Lights
17 of 64 entries playable (5 / 5 / 7). S3-29 is playable as an original fan adaptation: host-validated eight-character exact arithmetic, duplicate-aware feedback, equal attempts, private row history, solo bot and responsive operator controls. A rotating two-leg league is available for larger parties using existing fixtures. Audited production build and 36 Vitest + 19 Playwright tests; new E2E covers a complete two-browser tie with the final reply entered via the mobile operator pad, and a legal bot response in practice. Tests use loopback signaling; cross-network WebRTC, original episode rules, and Pages publication remain unverified. GitHub returned 404 for the authorized repository.

### Milestone: Secret Code
18 of 64 catalog entries playable (5 / 5 / 8). S3-19 includes generated clue sheets, an exhaustive uniqueness solver, explicit three-minute rules, private guessing and clock penalties, plus offline practice. The production build passed; 39 Vitest and 20 Playwright tests passed. The new browser flow uses only visible clues to identify the unique answer, tests desktop drag and keyboard, and submits the winning answer by touch at 360px. It uses loopback signaling, not cross-network WebRTC. Exact repository lookup returned 404; nothing was deployed. Broadcast equivalence and season elimination/return mechanics are not implemented.

### Milestone: Equation Pyramid
19 of 64 entries playable (5 / 6 / 8). Season 2 S2-12 has eight generated board rounds with guaranteed reachable targets, exact rational grouping, one submission per seat, private in-flight attempts, and a first-correct bonus plus time tiebreak. Original numbered ceramic tile art. The build passed, with 43 Vitest and 21 Playwright tests. The new browser test solves all eight from visible board data using keyboard and touch at 360px; scoring, privacy and deadline behavior for multiple seats are unit-tested. Cross-network WebRTC and broadcast rules remain unverified. Exact GitHub repository lookup returned 404; no Pages deployment.

### Milestone: Fragments of Memory
20 of 64 entries playable (6 / 6 / 8). Season 1 S1-04 shows an original generated exhibit for 45 seconds with a text alternative, then removes it from projections before recall. Includes configurable 8–24 objective questions, rotating respondents, shared scoring, casual discussion and strict no-chat play. Build passed; 46 Vitest and 22 Playwright tests passed. The new test reads the visible exhibit, advances study time, checks scene removal, and completes all 24 questions with keyboard and touch on a 360px viewport. Seat rotation and strict deadline failure are engine-tested. The scene is honor-based after study, not tamper-proof. No broadcast or cross-network claim; exact repository check returned 404 and Pages is not deployed.

### M2: Spot the Difference
21 of 64 entries playable (6 / 6 / 9). S3-18 is a 90-second specimen-tray comparison with 5–8 generated differences. The host keeps marks and penalties private, rejects repeat marks, and ranks finds before adjusted time. Both trays use the same hit regions at every zoom; visual patterns and a text alternative supplement color. Original Blender card art was rendered and exported. The production build passed, as did 49 Vitest tests and 23 Playwright browser tests. The new browser test solves the whole puzzle using text, touch and keyboard through a 360px portrait viewport, landscape and synchronized zoom. The 16-seat result is engine-tested, not a physical or cross-network device test. Exact repository API returned 404; no push or Pages deployment.

### M2: Scale Game
22 of 64 entries playable (7 / 6 / 9). S1-08 has a shared balance, rotating operator, private weights and a single team answer. The published calibration menu ensures each hidden weight can be determined in at most two readings; the team needs at most eight of the twelve allowed readings. A five-minute timer, ternary history, result reveal, original SVG instrument and original Blender card are included. Build passed; 52 Vitest and 24 Playwright tests passed, including a two-player loopback solve on desktop and a 360px touch viewport. The broadcast rules and real internet room play remain unverified. Exact GitHub repository check returned 404; no push or Pages deployment.

### M2: Loop Fence Puzzle
23 of 64 catalog entries playable (7 / 6 / 10). S3-20 includes 24 certified unique 5×5 variants, 4-minute private race boards, touch and keyboard line/cross marks, exact single-cycle validation, solved times and scored partial attempts. Added original SVG board and Blender art. Production build passed, with 55 Vitest and 25 Playwright tests green. The new browser test solves a whole puzzle from the disclosed clue values on a 360px touch viewport, verifies the mark controls, and checks that the solution appears only after play. No broadcast rules or real internet rooms verified. Exact repo lookup returned 404; no push or Pages deployment.

Verification detail: the first full browser run passed 24/25; the existing Fragments of Memory clock test timed out at question two once. It then passed 12 isolated repeats and the full rerun passed all 25. A cause was not confirmed and no Fragment behavior was changed.

### M2: Word Tower
24 of 64 entries playable (8 / 6 / 10). S1-06 uses a shared letter inventory, an authored four-theme vocabulary pack and three to six vertical word columns. Up to two changes are staged privately and committed atomically per turn. Any full valid arrangement passes; the game scores partials when the four-minute or turn cap expires. Production build, 59 Vitest checks and 26 Playwright checks passed. The new browser test solves a complete puzzle from the observed tiles, alternating desktop keyboard and 360px touch clients over the local test transport. The new card is an original Blender render. No broadcast or actual cross-network verification; exact repo check still 404, so no push or Pages deployment.
