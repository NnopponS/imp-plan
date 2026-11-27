import {expect,test} from '@playwright/test'

const description="The Devil's Plan Fan Games"
const image='https://nnoppons.github.io/imp-plan/art/imp-plan-social-v1.jpg'

function metadata(html:string,attr:'name'|'property',name:string){
 const tag=[...html.matchAll(/<meta\b[^>]*>/g)].find(([node])=>node.includes(`${attr}="${name}"`))
 return tag?.[0].match(/\bcontent="([^"]*)"/)?.[1]
}

test('an invite hash and Home have the same safe, static share metadata',async({request})=>{
 const [home,invite]=await Promise.all([request.get('./'),request.get('./#/join?room=ABC234')])
 expect(home.ok()).toBe(true)
 expect(invite.ok()).toBe(true)
 const html=await home.text()
 expect(await invite.text()).toBe(html)
 expect(html).not.toContain('ABC234')
 expect(html).not.toContain('#/join')
 expect(metadata(html,'property','og:title')).toBe('Imp Plan')
 expect(metadata(html,'name','twitter:title')).toBe('Imp Plan')
 expect(metadata(html,'property','og:url')).toBe('https://nnoppons.github.io/imp-plan/')
 expect(metadata(html,'property','og:description')).toBe(description)
 expect(metadata(html,'name','twitter:description')).toBe(description)
})

test('every share card advertises and serves the current real 1200 × 630 JPEG',async({request,page})=>{
 for(const path of ['./','./season/1/','./season/2/','./season/3/']){
  const response=await request.get(path)
  expect(response.ok()).toBe(true)
  const html=await response.text()
  expect(metadata(html,'property','og:image')).toBe(image)
  expect(metadata(html,'name','twitter:image')).toBe(image)
  expect(metadata(html,'property','og:image:type')).toBe('image/jpeg')
  expect(metadata(html,'property','og:image:width')).toBe('1200')
  expect(metadata(html,'property','og:image:height')).toBe('630')
  const alt=metadata(html,'property','og:image:alt')
  expect(alt).toMatch(/masked keeper.*game table.*book seal/)
  expect(metadata(html,'name','twitter:image:alt')).toBe(alt)
  expect(metadata(html,'name','twitter:card')).toBe('summary_large_image')
  expect(metadata(html,'property','og:description')).toBe(description)
  expect(metadata(html,'name','twitter:description')).toBe(description)
 }
 const res=await request.get('./art/imp-plan-social-v1.jpg')
 expect(res.ok()).toBe(true)
 expect(res.headers()['content-type']).toMatch(/^image\/jpeg/)
 const bytes=await res.body()
 expect(bytes.subarray(0,3)).toEqual(Buffer.from([255,216,255]))
 const jpeg=await page.goto('./art/imp-plan-social-v1.jpg')
 expect(jpeg?.ok()).toBe(true)
 const dimensions=await page.locator('img').evaluate(async(img:HTMLImageElement)=>{
  await img.decode()
  return [img.naturalWidth,img.naturalHeight]
 })
 expect(dimensions).toEqual([1200,630])
})
