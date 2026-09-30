const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
const version = JSON.parse(fs.readFileSync(path.join(__dirname, '../version.json'),'utf8'));
const buildSuffix=String(version.build).match(/-v(\d+)$/)?.[1];
if(!buildSuffix)throw new Error('Traço version metadata missing asset suffix');

test.use({ serviceWorkers:'allow' });

test('planned muscle focus survives offline PWA reload with existing sessions', async ({context}) => {
  // The SW may reload the first document on controllerchange. Install it on
  // a disposable page, then start the assertions on a *fresh controlled* tab.
  const installer=await context.newPage();
  await installer.goto('http://127.0.0.1:4173/', {waitUntil:'load'});
  await installer.evaluate(async () => { await navigator.serviceWorker.ready; });
  await installer.waitForFunction(() => !!navigator.serviceWorker.controller, null, {timeout:20000});
  await installer.close();
  const page=await context.newPage();
  const errors=[];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('http://127.0.0.1:4173/', {waitUntil:'load'});
  await page.waitForFunction(expected => window.TracoRuntime?.build === expected,buildSuffix);
  await page.waitForTimeout(250); // Allow gym and smart-workout enhancement layers to settle.
  await page.evaluate(() => {
    const at=Date.now()-3600000;
    localStorage.setItem('v60_sessions',JSON.stringify([{
      id:'fictional-offline-test',workoutId:'seg',wName:'Treino A',startedAt:at,
      finishedAt:at+1800000,exercises:[],prs:[],
    }]));
    state.page='workouts';
    render();
  });
  // A real selection sets the smart-sequence manual-selection flag.
  await page.locator('.workout-select[data-workout="seg"]').click();
  await expect(page.locator('.traco-muscle-focus')).toContainText('peito');
  await expect(page.locator('.traco-muscle-recent')).toContainText('1 sessão registrada');
  await context.setOffline(true);
  await page.reload({waitUntil:'load'});
  await page.waitForFunction(expected => window.TracoRuntime?.build === expected,buildSuffix);
  await page.waitForTimeout(250);
  await page.evaluate(() => {
    state.page='workouts';
    render();
  });
  // A real selection sets the smart-sequence manual-selection flag.
  await page.locator('.workout-select[data-workout="seg"]').click();
  await expect(page.locator('.traco-muscle-focus')).toContainText('peito');
  await expect(page.locator('.traco-muscle-recent')).toContainText('1 sessão registrada');
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('v60_sessions'))[0].id))
    .toBe('fictional-offline-test');
  expect(errors).toEqual([]);
});
