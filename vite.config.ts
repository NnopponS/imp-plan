import {fileURLToPath} from 'node:url'
import {defineConfig} from 'vite'
const entry=(p:string)=>fileURLToPath(new URL(p,import.meta.url))
export default defineConfig({
 // Worktrees can share installed dependencies without sharing Vite's dev optimizer.
 cacheDir:'.vite-local-cache',
 base:process.env.PAGES_BASE || '/imp-plan/',
 build:{rollupOptions:{input:{
  home:entry('./index.html'),season1:entry('./season/1/index.html'),
  season2:entry('./season/2/index.html'),season3:entry('./season/3/index.html')
 }}}
})
