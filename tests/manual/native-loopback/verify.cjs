'use strict';
// Optional workstation QA. No production module imports this runner.
const assert = require('node:assert/strict');
const {once} = require('node:events');
const udp = require('node:dgram');
const http = require('node:http');
const {mkdtemp, rm} = require('node:fs/promises');
const {tmpdir} = require('node:os');
const {resolve} = require('node:path');
const {PeerServer} = require('peer');
const {chromium, expect} = require('@playwright/test');

const ip = '127.0.0.1';
let browser, vite, httpd, cache, stun, signal, stage = 'starting local fixtures', bindings = 0;

// Only an IPv4 STUN Binding Success response for this local fixture's actual client.
// No TURN, forwarding, authentication, persistent state, logging or external listener.
async function startStun() {
  stun = udp.createSocket('udp4');
  stun.on('message', (m, r) => {
    if (r.address !== ip || m.length < 20 || m.readUInt16BE(0) !== 1 ||
        m.readUInt32BE(4) !== 0x2112a442 || m.readUInt16BE(2) !== m.length - 20) return;
    const out = Buffer.alloc(32);           // 20-byte header + XOR-MAPPED-ADDRESS
    out.writeUInt16BE(0x0101, 0); out.writeUInt16BE(12, 2);
    m.copy(out, 4, 4, 20);                 // magic cookie, transaction ID
    out.writeUInt16BE(0x0020, 20); out.writeUInt16BE(8, 22);
    out[25] = 1; out.writeUInt16BE(r.port ^ 0x2112, 26);
    r.address.split('.').forEach((octet, i) => { out[28 + i] = Number(octet) ^ out[4 + i]; });
    stun.send(out, r.port, r.address); bindings++;
  });
  const listening = once(stun, 'listening'); stun.bind(0, ip); await listening;
  return 'stun:' + ip + ':' + stun.address().port;
}
async function useStun(page, url) {
  await page.getByText('Connection options', {exact:true}).click();
  await page.getByLabel('Custom STUN URLs (optional)').fill(url);
}
async function connected(page) {
  return page.evaluate(() => window.__qaPCs.some(pc =>
    pc.connectionState === 'connected' &&
    ['connected','completed'].includes(pc.iceConnectionState) &&
    pc.sctp?.transport?.state === 'connected'));
}
async function main() {
  const stunUrl = await startStun();
  signal = await new Promise(r => PeerServer({host:ip, port:0, path:'/peer'}, r));
  process.env.VITE_TEST_SIGNAL = '1'; // native PeerJS, *not* the WebSocket mock
  process.env.VITE_TEST_SIGNAL_PORT = String(signal.address().port);
  process.env.PAGES_BASE = '/imp-plan/';
  const {createServer} = await import('vite');
  // HTTP and Vite HMR share our single loopback socket. Avoid fixed Vite dev ports.
  httpd = http.createServer(); cache = await mkdtemp(resolve(tmpdir(),'imp-native-qa-'));
  vite = await createServer({root:process.cwd(), configFile:resolve('vite.config.ts'), cacheDir:cache,
    server:{host:ip, middlewareMode:true, hmr:{server:httpd}}, logLevel:'silent'});
  httpd.on('request', vite.middlewares);
  const ready = once(httpd, 'listening'); httpd.listen(0, ip); await ready;
  const base = 'http://' + ip + ':' + httpd.address().port + '/imp-plan/';
  stage = 'opening two isolated browsers';
  browser = await chromium.launch({args:['--disable-dev-shm-usage','--allow-loopback-in-peer-connection',
    '--disable-features=WebRtcHideLocalIpsWithMdns']});
  const hc = await browser.newContext({viewport:{width:1440,height:900}, permissions:['clipboard-read','clipboard-write']});
  const gc = await browser.newContext({viewport:{width:320,height:710}, isMobile:true, hasTouch:true});
  const errors = [];
  for (const ctx of [hc,gc]) {
    // Instrument the native constructor only; signaling, data and all its methods stay native.
    await ctx.addInitScript(() => {
      window.__qaPCs = []; const Original = window.RTCPeerConnection;
      window.RTCPeerConnection = class extends Original {
        constructor(...args) { super(...args); window.__qaPCs.push(this); }
      };
    });
    await ctx.route('**/*', route => {
      const u = new URL(route.request().url());
      return u.hostname === '127.0.0.1' ? route.continue() : route.abort();
    });
  }
  const host = await hc.newPage(), guest = await gc.newPage();
  for (const p of [host,guest]) p.on('pageerror', () => errors.push(true));
  const button = (p, name) => p.getByRole('button', {name,exact:true});
  const board = p => p.getByRole('region', {name:'Wall Go territory board'});
  const activeTable = p => p.getByRole('region', {name:'Current table'});
  stage = 'creating and joining a private synthetic match';
  await host.goto(base); await useStun(host, stunUrl);
  await host.getByLabel('Nickname').fill('Copper Finch'); await button(host,'Create party').click();
  await expect(host.getByTestId('room-code')).toHaveText(/^[A-Z2-9]{6}$/);
  await button(host,'Copy invite').click();
  const link = await host.evaluate(() => navigator.clipboard.readText());
  assert.ok(link.startsWith(base + '#/join?room='));
  await guest.goto(link); await useStun(guest, stunUrl);
  await guest.getByLabel('Nickname').fill('Amber Fox'); await button(guest,'Join party').tap();
  await expect(activeTable(guest)).toContainText('Blind Gomoku', {timeout:19000});
  for (const p of [host,guest]) await expect.poll(() => connected(p)).toBe(true);
  assert.ok(bindings > 0);
  console.log('PASS: native peer, ICE and DTLS connected on both clients using a loopback STUN binding.');
  stage = 'checking guest game selection and preview';
  async function pick(title) {
    await button(host,'Choose game').click();
    const shelf = host.getByRole('dialog',{name:'Choose a game'});
    await shelf.getByRole('searchbox').fill(title);
    await shelf.getByRole('button',{name:new RegExp('^' + title)}).click();
    await expect(shelf).toHaveCount(0);
    await expect(activeTable(guest)).toContainText(title);
  }
  if(process.argv.includes('--gradation')){
    stage='checking native Gradation allocation privacy';
    await require('./gradation.cjs')(host,guest,pick,button,connected);
    assert.equal(errors.length,0);
    return;
  }
  await pick('Balance Mancala'); await button(guest,'Details').tap();
  const details = guest.getByRole('dialog',{name:'Balance Mancala'});
  await expect(details.locator('[data-game-preview="mancala"]')).toBeVisible();
  await button(guest,'Back to lobby').tap();
  console.log('PASS: selected gallery card and matching guest rules on separate clients.');
  stage = 'checking native Wall Go turn replication';
  await pick('Wall Go'); await host.getByRole('radiogroup',{name:'Seconds per turn',exact:true}).getByRole('radio',{name:'45 seconds',exact:true}).press('Enter');
  await button(guest,'Ready up').tap(); await button(host,'Start match').click();
  await button(host,'Enter match').click();
  await board(host).getByRole('button',{name:/^B2\b/}).click();
  await expect(board(guest).locator('[data-wall-go="choice"]')).toHaveCount(0);
  await button(board(host),'South edge B2 to B3').click();
  await expect(board(guest).locator('[data-wall-go="placed"]')).toHaveCount(1);
  await board(guest).getByRole('button',{name:/^F6\b/}).tap();
  await button(board(guest),'North edge F6 to F5').tap();
  for (const p of [host,guest]) {
    await expect(board(p)).toContainText('Turns 2 / 40');
    await expect(board(p).locator('[data-wall-go="placed"]')).toHaveCount(2);
    assert.equal(await connected(p), true);
    assert.equal(await p.evaluate(() => document.documentElement.scrollWidth), p.viewportSize().width);
  }
  assert.equal(errors.length,0);
  console.log('PASS: two on-board wall placements replicated, at 1440px/320px. Same machine only.');
}
let stopping = false;
async function finish(code) {
  if (stopping) return;
  stopping = true;
  const force = setTimeout(() => process.exit(code || 1), 3500);
  try {
    await browser?.close(); await vite?.close();
    if (httpd?.listening) await new Promise(r => httpd.close(r));
    if (cache) await rm(cache, {recursive:true,force:true});
    if (signal?.listening) await new Promise(r => signal.close(r));
    if (stun) await new Promise(r => stun.close(r));
  } finally {clearTimeout(force); process.exit(code);}
}
for (const s of ['SIGINT','SIGTERM']) process.once(s, () => finish(1));
const watchdog = setTimeout(() => {console.error('TIMEOUT: ' + stage); finish(1);}, 90_000);
main().then(() => {clearTimeout(watchdog); return finish(0);}, err => {
  clearTimeout(watchdog);
  // Never log a real-time invite, clipboard value, SDP or candidate address.
  console.error('FAIL at ' + stage + ' (' + (err?.name || 'Error') + '). See the fixture README.');
  return finish(1);
});
