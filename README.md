# Imp Plan
Private strategy game nights in your browser. Pick a nickname, open a room, and invite friends with a six-character code. Practice solo or play against heuristic bots in supported games.

**Status: playable alpha.** The challenge index tracks 64 entries across *The Devil’s Plan* Seasons 1–3 (including minigames and unaired slots). Playable fan adaptations: Blind Gomoku, Nine Men’s Morris, Time Auction (sealed bids), Point Gomoku, Remove One, Knight’s Tour, Hexagon, Count the Rectangles, Balance Mancala, Count the Cubes, Bagh Chal, Secret Number, Laying Grass, Lay the Grass, Exile Rectangle Counting, Divine Test, Equation Lights, Secret Code, Equation Pyramid, Fragments of Memory, Spot the Difference, Scale Game, Loop Fence Puzzle, and Word Tower. The rest are tracked, not playable. No original broadcast mode is verified yet.

## Run
```sh
npm ci
npm run dev
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```
Vite serves under `/imp-plan/` by default. Practice has no network requirement once the page assets are loaded. Default browser tests exercise the application protocol through a loopback test transport. The optional REAL_WEBRTC=1 run attempts local PeerServer signaling and native WebRTC; this environment did not open a data channel. The deployed product uses public PeerJS signaling and a public STUN service for network discovery; neither is operated by the owner. Direct connectivity varies by network.

[Product](docs/PRODUCT.md) · [Architecture](docs/ARCHITECTURE.md) · [Security](docs/SECURITY.md) · [Networking](docs/NETWORKING.md) · [Rule audit](docs/RULE_VERIFICATION.md) · [Progress](docs/PROGRESS.md)

This is an independent, unofficial fan project, not endorsed by or affiliated with Netflix. It includes no clips, costumes, logos, copied game code or third-party gameplay artwork. Game scores and time banks have no monetary value.

## Visual assets
The hero, twenty-four playable-game renders, and 3-second motion vignette are original Blender scenes, not artwork from the show. Build the artwork with `blender -b -t 8 --python-exit-code 1 -P scripts/render-art.py` and `python scripts/export-art.py` (Pillow). For motion, repeat the Blender command with `ARENA_MOTION=1` and run:
```sh
ffmpeg -framerate 12 -i art-source-renders/motion/%04d.png -vf hqdn3d=2:1.5:4:3 -c:v libvpx-vp9 -crf 32 -b:v 0 -pix_fmt yuv420p -an public/art/arena-motion.webm
```
The committed web assets mean Blender is **not** required to run or build the site. Three static season URLs are generated during `npm run build`, each with its own title, canonical link, and sitemap entry.

## Choosing a table
Each season has its own playable gallery and its own index of upcoming challenges. Before starting, the host gets a rules briefing with an animated diagram and one numbered token per occupied seat; bots use brass markers. The timer doesn't run during the briefing. Reduced-motion settings disable the entrance and diagram animations. Games that support bots offer Easy, Standard and Hard strategies, all evaluated offline. Human-only puzzles do not show a bot setting.
