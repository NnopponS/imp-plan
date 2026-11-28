'use strict';
const {expect}=require('@playwright/test');
const assert=require('node:assert/strict');
module.exports=async function gradationDuel(host,guest,pick,button,connected){
 await pick('Gradation');
 await host.getByRole('switch',{name:'Secret double-point gate'}).click();
 await button(guest,'Ready up').tap();
 await button(host,'Start match').click();
 await button(host,'Enter match').click();
 for(const p of [host,guest]){
  await button(p,'Fill in ascending order').click();
  await expect(button(p,'Seal my tray')).toBeDisabled();
  await p.getByLabel('My double-point gate').selectOption(p===host?'0':'4');
 }
 await button(host,'Seal my tray').click();
 await expect(host.locator('[data-grad-receipt]')).toBeVisible();
 await expect(guest.locator('[data-grad-receipt],[data-grad-shown-targets]')).toHaveCount(0);
 await button(guest,'Seal my tray').tap();
 for(const p of [host,guest]){
  await expect(p.locator('[data-grad-phase]')).toHaveAttribute('data-grad-phase','reveal');
  await expect(p.locator('[data-grad-shown-targets]')).toContainText('Copper 1 · Jade 5');
  await expect(p.locator('[data-grad-gate="0"]')).toContainText('Tie');
  assert.equal(await connected(p),true);
  assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth),p.viewportSize().width);
 }
 console.log('PASS: native Gradation sealed allocations, marked gates and matching reveal at 1440px/320px. Same machine only.');
};
