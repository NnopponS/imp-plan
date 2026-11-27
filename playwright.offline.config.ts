import {defineConfig} from '@playwright/test'

const port=Number(process.env.OFFLINE_E2E_PORT??4183)
const origin='http://127.0.0.1:'+port
export default defineConfig({
 testDir:'tests/offline',timeout:45000,workers:1,
 use:{baseURL:origin+'/imp-plan/',headless:true,launchOptions:{args:['--no-sandbox','--disable-dev-shm-usage']}},
 webServer:{command:'npm run preview -- --host 127.0.0.1 --port '+port+' --strictPort',url:origin+'/imp-plan/',reuseExistingServer:false}
})
