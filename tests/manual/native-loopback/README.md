# Native WebRTC on one computer (optional QA)

Run this from the repository root, with the lockfile's dependencies and Playwright Chromium installed:

```sh
npm ci
npx playwright install chromium
node tests/manual/native-loopback/verify.cjs
```

An existing matching browser installation works too; set `PLAYWRIGHT_BROWSERS_PATH` to its browser-cache directory. The Node runner also works from PowerShell without inline environment assignments.

The runner starts Vite, real PeerJS signaling and a tiny IPv4 STUN Binding responder on loopback, all on ephemeral ports. Both clients enter the local STUN address through the site's **Connection options**. The responder only reports the request's source address to the same loopback client; it does not relay game traffic. Nothing starts in production. No outside service, TURN relay, microphone, camera or live user is used. The script prints stage summaries, not invite codes, nicknames, ICE candidates or SDP.

**Pass means:** a 1440px host and a separate 320px guest browser context opened a native WebRTC data channel (peer/ICE/DTLS connected), shared an illustrated game selection and guest rules, then applied two Wall Go moves with direct board-edge controls. The probe checks both visible boards, not just a signaling-server response. Neither this run nor a mocked transport proves public signaling, NAT traversal, two physical devices, or cross-network play.

**Why a fixture?** Some loopback-only runners emit no usable ICE candidates with an empty ICE server list. A local STUN binding supplies a usable loopback candidate without sending any data off the machine. If the verification fails before the guest reaches the table, check that local TCP and UDP sockets and a compatible Chromium binary are available. This is a single focused integration check, not a replacement for the normal test suite.
