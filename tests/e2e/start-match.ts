import type {Page} from '@playwright/test'
export async function startMatch(page:Page){
 await page.getByRole('button',{name:'Start match',exact:true}).click()
 await page.getByRole('dialog').getByRole('button',{name:'Enter match',exact:true}).click()
}
