const {test,expect}=require('@playwright/test');
test.use({serviceWorkers:'block',viewport:{width:390,height:844}});
const url='http://127.0.0.1:4173/';
async function ready(page){
  await page.goto(url,{waitUntil:'load'});
  await page.waitForFunction(()=>window.TracoSimple?.version==='1.3.0');
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
  await page.evaluate(()=>{state.selectedWorkout=JSON.parse(localStorage.getItem('v60_sessions')).at(-1).workoutId;state.page='workouts';render();});
  await page.locator('#startSelected').click();
  await expect(page.locator('.perf-session')).toBeVisible();
  // Older V60 versions prefilled last performance automatically. Clearing
  // the first set mimics a user who wants to explicitly reuse a reference.
  await page.evaluate(()=>{
    const ex=state.activeSession.exercises[0];ex.sets[0].weight='';ex.sets[0].reps='';
    save(K.draft,state.activeSession);renderSession();
  });
  await expect(page.locator('.simple-previous-load')).toBeVisible();
  await expect(page.locator('#weightInput')).toHaveValue('');
  await expect(page.locator('#repsInput')).toHaveValue('');
  await page.locator('.simple-previous-load').click();
  await expect(page.locator('#weightInput')).toHaveValue('32');
  await expect(page.locator('#repsInput')).toHaveValue('10');
  await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('v60_draft'))?.exercises?.some(ex=>ex.sets?.some(s=>String(s.weight)==='32'&&String(s.reps)==='10'&&!s.done)))).toBe(true);
  await expect(page.locator('.simple-previous-load')).toHaveCount(0);
});


test('A–E program has genuinely different V-Shape workouts and weekly phase progression',async({page})=>{
  await ready(page);
  const first=await page.evaluate(()=>workoutPlan.map(w=>({
    id:w.id,name:w.name,ids:w.exercises.map(e=>e.id),sets:w.exercises.map(e=>({id:e.id,sets:e.sets,min:e.min,max:e.max}))
  })));
  expect(first.map(x=>x.id)).toEqual(['qua','seg','ter','qui','sex']);
  expect(first[0].ids).toEqual(expect.arrayContaining(['puxada-aberta','remada-baixa','crucifixo-inverso']));
  expect(first[1].ids).toEqual(expect.arrayContaining(['supino-inclinado','elevacao-lateral']));
  expect(first[2].ids).toEqual(expect.arrayContaining(['agachamento-smith','leg-press','flexora','core-reverse-ter']));
  expect(first[3].ids).toEqual(expect.arrayContaining(['remada-unilateral','puxada-neutra','elevacao-lateral-2','core-pallof-qui']));
  expect(first[4].ids).toEqual(expect.arrayContaining(['rdl','elevacao-lateral-3','supino-reto']));
  const phases=await page.evaluate(()=>{
    const ex=()=>workoutPlan[0].exercises.find(x=>x.id==='puxada-aberta');
    const base={sets:ex().sets,min:ex().min,max:ex().max};
    const startWeeksAgo=n=>{const d=new Date();d.setDate(d.getDate()-7*n);const key=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');localStorage.setItem('traco_vshape_90_v1',JSON.stringify({start:key}));TracoSimple.applyVShapePhase();};
    startWeeksAgo(4);
    const second={sets:ex().sets,min:ex().min,max:ex().max};
    startWeeksAgo(9);
    const third={sets:ex().sets,min:ex().min,max:ex().max};
    return {base,second,third};
  });
  expect(phases.base.sets).toBe(3);
  expect(phases.second.sets).toBe(4);
  expect(phases.third.sets).toBe(4);
  expect(phases.third.min).toBe(6);
});

test('legacy in-progress workout is not rewritten after the new V-Shape plan is installed',async({page})=>{
  await ready(page);
  const result=await page.evaluate(()=>{
    const w=workoutPlan[0];
    const old={
      id:'old-stored-session',workoutId:w.id,wName:'antigo treino personalizado',
      startedAt:Date.now()-150000,
      exercises:[
        {id:'puxada-aberta',name:'minha puxada',equipment:'Máquina antiga',min:8,max:12,rest:70,sets:[{n:1,weight:27.5,reps:11,done:true},{n:2,weight:'',reps:'',done:false}]},
        {id:'old-accessory',name:'acessório antigo',equipment:'halteres',min:8,max:12,rest:70,sets:[{n:1,weight:8,reps:10,done:false}]}
      ]
    };
    localStorage.setItem('v60_draft',JSON.stringify(old));
    const started=startSession(w.id);
    const saved=JSON.parse(localStorage.getItem('v60_draft'));
    return {id:saved.id,workoutId:saved.workoutId,ids:saved.exercises.map(e=>e.id),load:saved.exercises[0].sets[0].weight,reps:saved.exercises[0].sets[0].reps,active:!!state.activeSession};
  });
  expect(result).toMatchObject({active:true,id:'old-stored-session',load:27.5,reps:11,ids:['puxada-aberta','old-accessory']});
});


test('three-tab navigation reaches all core routes with one coherent brand and both themes',async({page})=>{
  await ready(page);
  await expect(page.locator('.simple-bottom-nav .nav-btn')).toHaveCount(3);
  await expect(page.locator('.perf-workout-hero')).toBeVisible();
  await page.locator('.simple-bottom-nav [data-nav="workouts"]').click();
  await expect(page.locator('.perf-workouts .workout-select')).toHaveCount(5);
  await page.locator('.simple-bottom-nav [data-nav="progress"]').click();
  await expect(page.locator('.simple-progress')).toBeVisible();
  await page.locator('.simple-progress [data-simple-go="food"]').click();
  await expect(page.locator('.perf-food')).toBeVisible();
  await page.locator('.simple-bottom-nav [data-nav="progress"]').click();
  await page.locator('.simple-progress [data-simple-go="settings"]').click();
  await expect(page.locator('.perf-settings')).toBeVisible();
  await expect(page.locator('.traco-about-card small')).toContainText('2.32.1');
  await expect(page.locator('.traco-theme-copy small')).toContainText('verde-lima');
  await page.locator('[data-traco-theme="light"]').click();
  await expect(page.locator('html')).toHaveAttribute('data-theme','light');
  await page.locator('.simple-bottom-nav [data-nav="home"]').click();
  await expect(page.locator('.simple-home')).toBeVisible();
  const light=await page.evaluate(()=>({
    background:getComputedStyle(document.body).backgroundColor,
    card:getComputedStyle(document.querySelector('.simple-program')).backgroundColor,
    nav:getComputedStyle(document.querySelector('.simple-bottom-nav')).backgroundColor
  }));
  expect(light.background).toBe('rgb(246, 248, 242)');
  expect(light.card).toBe('rgb(233, 239, 230)');
  expect(light.nav).toBe('rgb(240, 244, 237)');
  await page.locator('.simple-bottom-nav [data-nav="progress"]').click();
  await page.locator('.simple-progress [data-simple-go="settings"]').click();
  await page.locator('[data-traco-theme="dark"]').click();
  await page.locator('.simple-bottom-nav [data-nav="home"]').click();
  await expect(page.locator('html')).toHaveAttribute('data-theme','dark');
  const dark=await page.evaluate(()=>getComputedStyle(document.body).backgroundColor);
  expect(dark).toBe('rgb(9, 11, 11)');
});
