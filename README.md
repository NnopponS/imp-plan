<div align="center">

# Imp Plan

**A browser-based strategy game night inspired by *The Devil’s Plan*.**

[**Play on GitHub Pages**](https://nnoppons.github.io/imp-plan/) · [Season 1](https://nnoppons.github.io/imp-plan/season/1/) · [Season 2](https://nnoppons.github.io/imp-plan/season/2/) · [Season 3](https://nnoppons.github.io/imp-plan/season/3/)

[![Verify](https://github.com/NnopponS/imp-plan/actions/workflows/ci.yml/badge.svg)](https://github.com/NnopponS/imp-plan/actions/workflows/ci.yml)
[![GitHub Pages](https://github.com/NnopponS/imp-plan/actions/workflows/pages.yml/badge.svg)](https://github.com/NnopponS/imp-plan/actions/workflows/pages.yml)

</div>

Imp Plan is a free, unofficial fan project with original artwork. Open a private room and share a six-character code, or practice solo without signing up or setting a nickname. There are no payments, real prizes, ads, or accounts.

## Start playing

| I want to… | What to do |
| --- | --- |
| Try a game alone | Open a season, pick **Practice** under a game, then **Start match**. Games with bots offer **Easy**, **Standard**, and **Hard**. |
| Host a private party | Pick an online nickname, choose **Create party**, and share the invite link or code. Select a game and settings, then start when the required seats are ready. |
| Join friends | Open the invite link or enter the code, choose a nickname, and select **Join party**. Use **Preview rules** if you want an explanation before readying up. |
| Play without internet | Open the site online once and wait for **Ready for offline practice**. Reopen it later in the same browser. If its storage is cleared or evicted, repeat the first online visit. |

A one-move Blind Gomoku warm-up on the homepage is playable immediately. Where supported, a rules briefing uses the actual roster and explains the opening move before the clock starts. Audio and motion options are in the in-game settings menu.

## Playable catalog

**Playable alpha: 29 fan adaptations out of 64 indexed entries.** The index includes main, prize, prison, exile, final, and unaired entries. An indexed entry is not necessarily playable. Rules marked as fan adaptations are not verified broadcast reproductions.

| Season | Playable / indexed | Playable entries |
| --- | ---: | --- |
| [1 · The First Plan](https://nnoppons.github.io/imp-plan/season/1/) | 9 / 18 | Fragments of Memory, Secret Number, Word Tower, Scale Game, Laying Grass, Montage, Blind Gomoku, Nine Men’s Morris, Hexagon |
| [2 · Death Room](https://nnoppons.github.io/imp-plan/season/2/) | 7 / 17 | Remove One, Time Auction, Balance Mancala, Wall Go, Equation Pyramid, Bagh Chal, Knight’s Tour |
| [3 · Dead Again](https://nnoppons.github.io/imp-plan/season/3/) | 13 / 29 | Count the Cubes, Count the Rectangles, Lay the Grass, Memory Poker, Heavy 13, Piece Puzzle, Spot the Difference, Secret Code, Loop Fence Puzzle, Exile Rectangle Counting, Divine Test, Point Gomoku, Equation Lights |

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
