const {test,expect}=require('@playwright/test');
test.use({serviceWorkers:'block',viewport:{width:390,height:844}});
const url='http://127.0.0.1:4173/';
async function ready(page){
  await page.goto(url,{waitUntil:'load'});
  await page.waitForFunction(()=>window.TracoSimple?.version==='1.0.0');
  await expect(page.locator('.perf-home .simple-home')).toBeVisible();
}
test('one-tap navigation and V-Shape program stay local and preserve data',async({page})=>{
  await ready(page);
  await expect(page.locator('.simple-bottom-nav .nav-btn')).toHaveCount(3);
  await page.evaluate(()=>localStorage.setItem('traco_untouched_sentinel','keep'));
  await page.locator('.simple-home [data-simple-action="program"]').click();
  await expect(page.locator('#simpleProgramSheet')).toBeVisible();
  await page.getByRole('button',{name:'Começar meu programa hoje'}).click();
  await expect(page.locator('.simple-program')).toContainText('Semana 1 de 12');
  await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('traco_vshape_90_v1'))?.start)).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  await page.locator('.simple-bottom-nav [data-nav="progress"]').click();
  console.log('Traço progress route:',await page.evaluate(()=>({page:state.page,main:document.querySelector('#app .main-card')?.className,hasProgress:!!document.querySelector('.progress-page'),hasSimple:!!document.querySelector('.simple-progress')})));
  await expect(page.locator('.simple-progress')).toBeVisible();
  await expect(page.locator('.simple-progress')).toContainText('Programa V-Shape');
  expect(await page.locator('#app').evaluate(el=>el.scrollWidth<=window.innerWidth+8)).toBeTruthy();
  await page.reload({waitUntil:'load'});
  await expect(page.locator('.simple-home .simple-program')).toContainText('Semana 1 de 12');
  expect(await page.evaluate(()=>localStorage.getItem('traco_untouched_sentinel'))).toBe('keep');
});
test('gym session keeps native set recorder and clean target guidance',async({page})=>{
  await ready(page);
  await page.locator('#startToday').click();
  await expect(page.locator('.perf-session')).toBeVisible();
  await expect(page.locator('.perf-session .simple-target')).toBeVisible();
  await expect(page.locator('#repsInput')).toHaveCount(1);
  await expect(page.locator('#completeSet')).toHaveCount(1);
  await page.locator('#repsInput').fill('10');
  await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('v60_draft'))?.exercises?.some(e=>(e.sets||[]).some(s=>String(s.reps)==='10')))).toBe(true);
  expect(await page.locator('#app').evaluate(el=>el.scrollWidth<=window.innerWidth+8)).toBeTruthy();
});