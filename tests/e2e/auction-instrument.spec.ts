import {expect,test} from '@playwright/test'
import {startMatch} from './start-match'

test('Time Auction’s private bank meter and quick bids are visible and do not lock a draft',async({page})=>{
 await page.setViewportSize({width:320,height:650})
 await page.emulateMedia({reducedMotion:'reduce'})
 await page.goto('./season/2/')
 await page.getByRole('button',{name:'Practice Time Auction',exact:true}).click()
 await startMatch(page)
 const instrument=page.getByRole('meter',{name:'Your time bank'})
 await expect(instrument).toBeInViewport({ratio:1})
 await expect(instrument).toHaveAttribute('aria-valuenow','60')
 await page.getByRole('button',{name:'Set bid to 5 seconds',exact:true}).click()
 await expect(page.getByRole('spinbutton',{name:'Bid (seconds)'})).toHaveValue('5')
 await expect(instrument).toHaveAttribute('aria-valuenow','60')
 await expect(page.getByText('Sealed round 1 / 8',{exact:true})).toBeVisible()
 await page.getByRole('button',{name:'Lock bid',exact:true}).click()
 await expect(page.getByText('Sealed round 2 / 8',{exact:true})).toBeVisible()
 await expect(instrument).toHaveAttribute('aria-valuenow','55')
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(320)
})
