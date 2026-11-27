import {defineConfig} from '@playwright/test'

const native=process.env.REAL_WEBRTC==='1'
const httpPort=Number(process.env.E2E_HTTP_PORT??4173)
const signalPort=Number(process.env.E2E_SIGNAL_PORT??(native?9001:9002))
export default defineConfig({
 // Multi-seat cases use several browser processes and independent clocks.
 // Serial by default keeps release runs deterministic on small CI runners.
 testDir:'tests/e2e',timeout:45000,workers:1,
 use:{baseURL:'http://127.0.0.1:'+httpPort+'/imp-plan/',headless:true,launchOptions:{args:['--no-sandbox','--disable-dev-shm-usage','--disable-features=WebRtcHideLocalIpsWithMdns']}},
 webServer:[
  {command:native?'node tests/local-signal.cjs':'node tests/mock-transport.cjs',port:signalPort,env:{E2E_SIGNAL_PORT:String(signalPort)},reuseExistingServer:false},
  {command:'npm run dev -- --host 127.0.0.1 --port '+httpPort+' --strictPort',port:httpPort,env:{VITE_TEST_SIGNAL:native?'1':'mock',VITE_TEST_SIGNAL_PORT:String(signalPort)},reuseExistingServer:false}
 ]
})
