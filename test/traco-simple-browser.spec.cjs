const {test,expect}=require('@playwright/test');
test.use({serviceWorkers:'block',viewport:{width:390,height:844}});
const url='http://127.0.0.1:4173/';
async function ready(page){
  await page.goto(url,{waitUntil:'load'});
  await page.waitForFunction(()=>window.TracoSimple?.version==='1.1.0');
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
test('start action is visible immediately and a draft resumes without overwrite',async({page})=>{
  await ready(page);
  const coords=await page.locator('#startToday').evaluate(el=>{const b=el.getBoundingClientRect();return {top:b.top,bottom:b.bottom,height:b.height};});
  expect(coords.top).toBeGreaterThanOrEqual(0);
  expect(coords.top).toBeLessThan(590);
  expect(coords.height).toBeGreaterThan(110);
  await page.locator('#startToday').click();
  await expect(page.locator('.perf-session')).toBeVisible();
  const id=await page.evaluate(()=>JSON.parse(localStorage.getItem('v60_draft'))?.id);
  expect(id).toBeTruthy();
  await page.locator('#sessionBack').click();
  await expect(page.locator('.perf-resume')).toBeVisible();
  await expect(page.locator('#startToday')).toBeHidden();
  await page.locator('#resumeWorkout').click();
  await expect(page.locator('.perf-session')).toBeVisible();
  expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('v60_draft'))?.id)).toBe(id);
});
test('previous valid workout can prefill blank inputs only after explicit tap',async({page})=>{
  await ready(page);
  const fixture=await page.evaluate(()=>{
    const workout=v60RecommendedWorkout();
    const ex=workout.exercises[0];
    const fake={id:'simple-suggestion-test',workoutId:workout.id,startedAt:Date.now()-600000,finishedAt:Date.now()-300000,
      exercises:[{...ex,sets:[{n:1,weight:32,reps:10,done:true,skipped:false}]}]};
    localStorage.setItem('v60_sessions',JSON.stringify([...sessions(),fake]));
    return {id:ex.id};
  });
  await page.locator('#startToday').click();
  await expect(page.locator('.perf-session')).toBeVisible();
  await expect(page.locator('.simple-previous-load')).toBeVisible();
  await expect(page.locator('#weightInput')).toHaveValue('');
  await expect(page.locator('#repsInput')).toHaveValue('');
  await page.locator('.simple-previous-load').click();
  await expect(page.locator('#weightInput')).toHaveValue('32');
  await expect(page.locator('#repsInput')).toHaveValue('10');
  await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('v60_draft'))?.exercises?.some(ex=>ex.sets?.some(s=>String(s.weight)==='32'&&String(s.reps)==='10'&&!s.done)))).toBe(true);
  await expect(page.locator('.simple-previous-load')).toHaveCount(0);
});
