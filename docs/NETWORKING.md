# Networking
[PeerJS](https://peerjs.com/docs/) handles public signaling. The default STUN service is Google STUN; a user can substitute up to four STUN URLs. No built-in TURN credentials. Poor NAT compatibility, blocked UDP, corporate filtering or an unavailable signaling service can prevent play. Retry, change network, or use practice. Host must stay alive and foregrounding it helps. Active browser sessions freeze on host loss and guest connections try to resume. Reloading the host destroys the room. A reload of a joined guest tab attempts reconnection using the tab capability. If a network loss interrupts a token rollover the user may need the host to remove the seat and restart from the lobby. Test PeerServer runs locally only in Playwright and is never deployed.

Use `npm run test:e2e` for deterministic browser-level protocol coverage through the loopback mock, or `REAL_WEBRTC=1 npm run test:e2e` to exercise the PeerJS and browser stack with private loopback signaling. Vite dead-code eliminates the mock test transport from the production build. Neither test proves cross-network play.

On a first join, the guest sees separate states for reaching signaling, opening the direct connection and receiving room state from the host. A channel that opens without a first state times out with a Retry option. If the browser blocks clipboard writes, Copy invite offers a selectable link.

Run the isolated clipboard → new guest → Memory duel → guest reload check with the loopback test transport:
```sh
E2E_HTTP_PORT=4287 E2E_SIGNAL_PORT=9187 npm run test:e2e -- --workers=1 tests/e2e/invite-flow.spec.ts
```
The test uses separate browser contexts, not separate Internet networks. The native local check is the same command with `REAL_WEBRTC=1` and another free pair of ports.
