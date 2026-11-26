import {defineConfig} from '@playwright/test'
export default defineConfig({
 testDir:'tests/e2e',timeout:45000,
 use:{baseURL:'http://127.0.0.1:4173/imp-plan/',headless:true,launchOptions:{args:['--no-sandbox','--disable-dev-shm-usage','--disable-features=WebRtcHideLocalIpsWithMdns']}},
 webServer:[
  process.env.REAL_WEBRTC==='1'?{command:'node tests/local-signal.cjs',port:9001,reuseExistingServer:false}:{command:'node tests/mock-transport.cjs',port:9002,reuseExistingServer:false},
  {command:'VITE_TEST_SIGNAL='+(process.env.REAL_WEBRTC==='1'?'1':'mock')+' npm run dev -- --host 127.0.0.1 --port 4173 --strictPort',port:4173,reuseExistingServer:false}
 ]
})
