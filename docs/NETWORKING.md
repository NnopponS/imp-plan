# Networking
[PeerJS](https://peerjs.com/docs/) handles public signaling. The default STUN service is Google STUN; a user can substitute up to four STUN URLs. No built-in TURN credentials. Poor NAT compatibility, blocked UDP, corporate filtering or an unavailable signaling service can prevent play. Retry, change network, or use practice. Host must stay alive and foregrounding it helps. Active browser sessions freeze on host loss and guest connections try to resume. Reloading the host destroys the room. A reload of a joined guest tab attempts reconnection using the tab capability. If a network loss interrupts a token rollover the user may need the host to remove the seat and restart from the lobby. Test PeerServer runs locally only in Playwright and is never deployed.

Use `npm run test:e2e` for deterministic browser-level protocol coverage through the loopback mock, or `REAL_WEBRTC=1 npm run test:e2e` to exercise the PeerJS and browser stack with private loopback signaling. Vite dead-code eliminates the mock test transport from the production build. Neither test proves cross-network play.

On a first join, the guest sees separate states for reaching signaling, opening the direct connection and receiving room state from the host. A channel that opens without a first state times out with a Retry option. If the browser blocks clipboard writes, Copy invite offers a selectable link.

Run the isolated clipboard → new guest → Memory duel → guest reload check with the loopback test transport:
```sh
E2E_HTTP_PORT=4287 E2E_SIGNAL_PORT=9187 npm run test:e2e -- --workers=1 tests/e2e/invite-flow.spec.ts
```
The test uses separate browser contexts, not separate Internet networks. The native local check is the same command with `REAL_WEBRTC=1` and another free pair of ports.

The project owner reported a successful live online trial on their own setup. This is separate from automated loopback coverage and does not establish compatibility across all browsers or network combinations.

For a reproducible native WebRTC check on one machine, see [the local STUN and PeerJS QA fixture](../tests/manual/native-loopback). It is a test helper only and is not deployed.

## Reopening after a release

On normal online visits to a known Imp Plan page, the service worker tries the current HTML from the same origin. If it is unavailable or stalls, the browser falls back to the installed release’s verified page. The offline worker does not handle query URLs or save room messages and invite codes.

An online page may update while earlier Imp Plan tabs are open. Those tabs keep their saved bundle; the site never forces a reload mid-match. The new page only reports **Ready for offline practice** when the active worker has verified that exact release. If a previously installed cache-first worker keeps showing an old version, finish any open matches, close the project's tabs, and reopen while online. This does not require clearing site data.
