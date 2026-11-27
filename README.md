<div align="center">

# Imp Plan

**A browser-based strategy game night inspired by *The Devil’s Plan*.**

[**Play on GitHub Pages**](https://nnoppons.github.io/imp-plan/) · [Season 1](https://nnoppons.github.io/imp-plan/season/1/) · [Season 2](https://nnoppons.github.io/imp-plan/season/2/) · [Season 3](https://nnoppons.github.io/imp-plan/season/3/)

[![Verify](https://github.com/NnopponS/imp-plan/actions/workflows/ci.yml/badge.svg)](https://github.com/NnopponS/imp-plan/actions/workflows/ci.yml)
[![GitHub Pages](https://github.com/NnopponS/imp-plan/actions/workflows/pages.yml/badge.svg)](https://github.com/NnopponS/imp-plan/actions/workflows/pages.yml)

</div>

Imp Plan is a free, unofficial fan project with original artwork. Open a private room and share a six-character code, or practice solo without signing up or setting a nickname. There are no payments, real prizes, ads, or accounts.

## Start playing

**The Sixteen Seats** is an optional 30-second illustrated prologue on your first Home visit. Sixteen contenders play four tables before a sealed door opens. Choose **Skip intro** or press Escape to enter immediately. Direct invites and reduced-motion settings bypass it.

| I want to… | What to do |
| --- | --- |
| Try a game alone | Open a season, pick **Practice** under a game, then **Start match**. Games with bots offer **Easy**, **Standard**, and **Hard**. |
| Host a private party | Pick an online nickname, choose **Create party**, and share the invite link or code. Use the illustrated game picker to choose a table. Guests see the same selected-game preview. Start when the required seats are ready. |
| Join friends | Open the invite link or enter the code, choose a nickname, and select **Join party**. Use **Preview rules** if you want an explanation before readying up. |
| Play without internet | Open the site online once and wait for **Ready for offline practice**. Reopen it later in the same browser. If its storage is cleared or evicted, repeat the first online visit. |
| Loading or scripts blocked | Home and all three seasons ship with illustrated HTML that you can browse before the game loads. Playing needs JavaScript. If the controls never arrive, use **Game controls → Reload game controls**. If you opened an invite, the retry keeps the room code. |

The optional **Player wardrobe** on the homepage lets you combine 6 masks, 3 cloak cuts, 6 dyes, 3 clasps and 5 accessory choices (1,620 possible outfits). Your chosen outfit stays in this browser; Auto-deal picks a distinct room look. Peers on older versions see a compatible outfit. Blind Gomoku is still available from the game gallery. Where supported, a rules briefing uses the actual roster and explains the opening move before the clock starts. The active match shows the current table’s players and their portraits above the board. **Board focus** hides the portrait rail and side information without interrupting the game. Audio and motion options are in the in-game settings menu. Room limits follow the selected game; two-seat boards offer an explicit short tournament where supported. See the [player count table](docs/PLAYER_COUNTS.md).

Game cards show an original insignia and their setting in the show, such as a Main Match, Prison Match, or Secret Chamber. A badge identifies the setting, not broadcast-rule accuracy. The original object in each painting loops while its card is in view and pauses when you scroll away or switch tabs. Choose **Details** to see the mechanic and full rules. Use **Pause previews** or your reduced-motion setting to stop the motion. In Wall Go, select a destination and then a marked board edge to take the turn; there is no separate Confirm wall button. Hexagon shows an actual worked example before the match, with the painted keeper returning behind the live, interactive tiles. Morris, Loop Fence, Knight’s Tour and Bagh Chal use original drawn pieces and legal-move signals on their live boards. Knight’s Tour can save or share a PNG record of your actual route. [Visual implementation review](docs/PLAY_VISUALS.md).

## Playable catalog

**Playable alpha: 30 fan adaptations out of 64 indexed entries.** The index includes main, prize, prison, exile, final, and unaired entries. An indexed entry is not necessarily playable. Rules marked as fan adaptations are not verified broadcast reproductions.

| Season | Playable / indexed | Playable entries |
| --- | ---: | --- |
| [1 · The First Plan](https://nnoppons.github.io/imp-plan/season/1/) | 9 / 18 | Fragments of Memory, Secret Number, Word Tower, Scale Game, Laying Grass, Montage, Blind Gomoku, Nine Men’s Morris, Hexagon |
| [2 · Death Room](https://nnoppons.github.io/imp-plan/season/2/) | 7 / 17 | Remove One, Time Auction, Balance Mancala, Wall Go, Equation Pyramid, Bagh Chal, Knight’s Tour |
| [3 · Dead Again](https://nnoppons.github.io/imp-plan/season/3/) | 14 / 29 | Count the Cubes, Count the Rectangles, Lay the Grass, Memory Poker, Heavy 13, Piece Puzzle, Spot the Difference, Secret Code, Loop Fence Puzzle, Exile Rectangle Counting, Divine Test, Point Gomoku, Color Link, Equation Lights |

For a first game, try **Blind Gomoku** for a hidden-board duel, **Count the Cubes** for a solo spatial puzzle, or **Heavy 13** for private choices and shared stacks. Time Auction and Memory Poker also have separately labeled episode-inspired modes with their own conditions. Seat counts and eligible bots depend on the game. Some duels use rotated fixtures for larger parties rather than putting everyone on one board.

Read the [rule audit](docs/RULE_VERIFICATION.md), [broadcast gaps](docs/BROADCAST_GAPS.md), or [per-game rule notes](docs/rules) for sources, assumptions and known differences.

## Connections, privacy and traffic

- **Private rooms:** GitHub Pages serves the application. Public PeerJS handles signaling; WebRTC carries room data between browsers. Direct links can fail on some networks. Stay in the host tab while playing, share codes only with trusted friends, and read [network troubleshooting](docs/NETWORKING.md) for retries and custom STUN options.
- **Trust model:** No hosted game database or website analytics. A nickname is a label, not an account. A room code is not strong authentication. A peer connection can reveal network information, and the host browser runs the game. Read the [security boundaries](docs/SECURITY.md).
- **Repository traffic:** Maintainers can open [Insights → Traffic](https://github.com/NnopponS/imp-plan/graphs/traffic) for 14 days of repository views, unique visitors, and clones. GitHub refreshes the views and clones hourly. These are GitHub repository statistics, not visits or live concurrent players on GitHub Pages. There is no public real-time visitor counter. See the [GitHub traffic documentation](https://docs.github.com/en/repositories/viewing-activity-and-data-for-your-repository/viewing-traffic-to-a-repository).

## Develop locally

Use Node.js 24, the version pinned in CI.

```sh
npm ci
npm run dev             # Open the /imp-plan/ path
npm test                # Engine, room and property tests
npm run build           # Static production output and offline manifest
npm run preview         # Serve the production build
npx playwright install chromium
npm run test:e2e        # Browser flows over a test loopback transport
npm run test:e2e:offline # Production service-worker checks; build first
```

The browser suite covers game flows, compact viewports and keyboard/touch input. The default online-flow tests use a controlled loopback transport; they do not prove direct connections between different networks. `REAL_WEBRTC=1 npm run test:e2e` attempts native WebRTC with a local signaling server. The documented cloud run did not establish a direct data channel. See [progress and test evidence](docs/PROGRESS.md).

**Start in the source:** [engine](src/engine.ts) · [room and session rules](src/room.ts) · [game catalog](src/catalog.json) · [art assets](public/art) · [test suites](tests)

[Product](docs/PRODUCT.md) · [Architecture](docs/ARCHITECTURE.md) · [Design](docs/DESIGN.md) · [Decisions](docs/DECISIONS.md) · [Report an issue](https://github.com/NnopponS/imp-plan/issues)

Game covers and illustrations are original. To rebuild the Blender artwork, run `blender -b -t 8 --python-exit-code 1 -P scripts/render-art.py`, then `python scripts/export-art.py` with Pillow installed.

---

Imp Plan is independent and is not endorsed by or affiliated with Netflix. It does not use the show's logos, clips or artwork. Game scores, Pieces and time banks have no monetary value.
