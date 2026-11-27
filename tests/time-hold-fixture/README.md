# Time Auction board harness

This fixture uses the real hold reducer and React controller in one tab. It is not multiplayer verification or a production route; Vite's production entry points do not include it.

With dependencies and Chromium installed:

```sh
npm run dev -- --host 127.0.0.1 --port 4189 --strictPort
# In another terminal:
node tests/time-hold-fixture/check.mjs
```

Optional environment variables: `TIME_HOLD_FIXTURE_URL` (including the Pages base) and `TIME_HOLD_SCREENSHOTS` (default `test-results/time-hold`). The checker uses real Chromium keyboard and touch events; the visibility-state transition is dispatched deliberately for determinism. Test fixtures' restart/spectate/disconnect controls are outside the production component.
