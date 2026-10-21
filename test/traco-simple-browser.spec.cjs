const {test,expect}=require('@playwright/test');
test.use({serviceWorkers:'block',viewport:{width:390,height:844}});
const url='http://127.0.0.1:4173/';
async function ready(page){
  await page.goto(url,{waitUntil:'load'});
  await page.waitForFunction(()=>window.TracoSimple?.version==='1.9.0');
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
  await expect(page.locator('#simpleWorkoutMode')).toBeVisible();
  await page.locator('[data-simple-start-mode="full"]').click();
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
  await expect(page.locator('#simpleWorkoutMode')).toBeVisible();
  await page.locator('[data-simple-start-mode="full"]').click();
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
  await page.locator('[data-simple-start-mode="full"]').click();
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
  await expect(page.locator('.traco-about-card small')).toContainText('2.39.0');
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


test('visible A–E prescriptions match plan, core dose and phase targets',async({page})=>{
  await ready(page);
  await expect(page.locator('.perf-hero-copy small')).toContainText('45–60 min');
  await page.locator('.simple-bottom-nav [data-nav="workouts"]').click();
  await expect(page.locator('.perf-workouts .workout-select')).toHaveCount(5);
  await expect(page.locator('.v60-core-program-note')).toContainText('core em A, C e D · 6 séries por ciclo');
  const plan=await page.evaluate(()=>workoutPlan.map(w=>({
    id:w.id,name:w.name,exercises:w.exercises.map(ex=>({id:ex.id,name:ex.name,sets:ex.sets,min:ex.min,max:ex.max,rest:ex.rest}))
  })));
  expect(plan.map(w=>w.exercises.length)).toEqual([6,5,6,6,6]);
  expect(plan.map(w=>w.exercises.reduce((n,e)=>n+e.sets,0))).toEqual([15,12,16,15,15]);
  for(const w of plan){
    await page.locator('.workout-select[data-workout="'+w.id+'"]').click();
    await expect(page.locator('.selected-blue h3')).toContainText(w.name);
    await expect(page.locator('.selected-block .selected-blue p')).toContainText('45–60 min');
    const cards=page.locator('.selected-block .exercise-preview .preview-row');
    await expect(cards).toHaveCount(w.exercises.length);
    for(let i=0;i<w.exercises.length;i++){
      const exercise=w.exercises[i];
      const card=cards.nth(i);
      await expect(card).toContainText(exercise.name);
      await expect(card).toContainText(exercise.sets+' × '+exercise.min+'-'+exercise.max);
    }
  }
  await page.locator('.simple-bottom-nav [data-nav="home"]').click();
  await page.locator('.simple-home [data-simple-action="program"]').click();
  await expect(page.locator('#simpleProgramSheet .simple-split > div')).toHaveCount(5);
  await expect(page.locator('#simpleProgramSheet')).toContainText('45–60 min');
  await expect(page.locator('#simpleProgramSheet')).toContainText('Cardio é opcional e separado');
  await page.locator('#simpleProgramSheet [data-simple-close]').first().click();
});


test('double-progression advice respects reps, real set completion and exercise variation',async({page})=>{
  await ready(page);
  const result=await page.evaluate(()=>{
    const ex=workoutPlan[0].exercises[0],max=Number(ex.max),min=Number(ex.min);
    const sample=(reps,opts={})=>({
      id:'fake-'+String(reps)+'-'+(opts.label||'baseline'),workoutId:workoutPlan[0].id,
      startedAt:Date.now()-120000,finishedAt:Date.now()-100000,
      excludeFromVolume:opts.excluded||false,
      exercises:[{...ex,name:opts.name||ex.name,equipment:opts.equipment||ex.equipment,
        sets:reps.map((r,i)=>({n:i+1,weight:24,reps:r,done:opts.incomplete&&i===2?false:true,skipped:false,rir:opts.rir||''}))}]
    });
    const unchangedFixture=sample([max,max,max]);
    const before=JSON.stringify(unchangedFixture);
    const increase=TracoSimple.nextGoal(ex,[sample([max,max,max])]);
    const reps=TracoSimple.nextGoal(ex,[sample([max,max-1,max-2])]);
    const recover=TracoSimple.nextGoal(ex,[sample([min-1,min,min])]);
    const partial=TracoSimple.nextGoal(ex,[sample([max,max,max],{incomplete:true})]);
    const variant=TracoSimple.nextGoal(ex,[sample([max,max,max],{equipment:'outra máquina'})]);
    const reported=TracoSimple.nextGoal(ex,[sample([max,max,max],{excluded:true})]);
    const heavy=TracoSimple.nextGoal(ex,[sample([max,max,max],{rir:'heavy'})]);
    const noHistory=TracoSimple.nextGoal(ex,[]);
    const after=JSON.stringify(unchangedFixture);
    return {increase:increase?.kind,reps:reps?.kind,recover:recover?.kind,
      partial:partial?.kind,variant,reported,heavy:heavy?.kind,noHistory,
      unchanged:before===after};
  });
  expect(result).toMatchObject({
    increase:'increase',reps:'reps',recover:'recover',partial:'reps',
    variant:null,reported:null,heavy:'reps',noHistory:null,unchanged:true
  });
});
test('gym displays a short next goal without changing planned sets or completed history',async({page})=>{
  await ready(page);
  const before=await page.evaluate(()=>{
    const w=workoutPlan[0],ex=w.exercises[0];
    const past={id:'next-goal-fixture',workoutId:w.id,
      startedAt:Date.now()-600000,finishedAt:Date.now()-400000,
      exercises:[{...ex,sets:Array.from({length:3},(_,i)=>({n:i+1,weight:24,reps:ex.max,done:true,skipped:false}))}]};
    localStorage.setItem('v60_sessions',JSON.stringify([past]));
    return {serialized:JSON.stringify([past]),id:ex.id};
  });
  await page.locator('.simple-bottom-nav [data-nav="workouts"]').click();
  await page.locator('.workout-select[data-workout="qua"]').click();
  await expect(page.locator('.selected-blue h3')).toContainText('A ·');
  await page.locator('#startSelected').click();
  await page.locator('[data-simple-start-mode="full"]').click();
  await expect(page.locator('.perf-session .simple-next-goal')).toBeVisible();
  // The legacy evolution coach can add a working set to a full session.
  // Therefore 3/3 previous top-rep sets are not enough to recommend a
  // weight increase for the now 4-set prescription.
  await expect(page.locator('.simple-next-goal')).toContainText('Busque mais uma repetição');
  await expect(page.locator('.simple-next-goal')).toContainText('24 kg');
  await expect(page.locator('.simple-next-goal')).toContainText('12/12/12');
  expect(await page.evaluate(()=>localStorage.getItem('v60_sessions'))).toBe(before.serialized);
  const sets=await page.evaluate(()=>state.activeSession.exercises[0].sets);
  expect(sets.length).toBeGreaterThanOrEqual(3);
  expect(sets.length).toBeLessThanOrEqual(4); // Existing adaptive full-mode coach may add one set.
  expect(sets.every(x=>!x.done)).toBe(true);
  expect(await page.locator('.simple-next-goal button').count()).toBe(0);
});


test('weekly V-Shape signals compare only trustworthy same-variation working sets',async({page})=>{
  await ready(page);
  const result=await page.evaluate(()=>{
    const start=new Date(2026,9,18,18);
    const day=n=>new Date(2026,9,n,12).getTime();
    const get=id=>workoutPlan.flatMap(w=>w.exercises).find(ex=>ex.id===id);
    const make=(id,weight,reps,dayNumber,options={})=>{
      const ex=get(id);
      return {id:id+'-'+dayNumber+'-'+(options.tag||''),
        startedAt:day(dayNumber),finishedAt:day(dayNumber)+3600000,
        manualConfirmed:Boolean(options.manual),excludeFromVolume:Boolean(options.exclude),
        exercises:[{...ex,name:options.name||ex.name,equipment:options.equipment||ex.equipment,
          sets:[{n:1,weight,reps,done:true,skipped:false,reported:Boolean(options.reported)}]}]};
    };
    const entries=[
      make('puxada-aberta',30,10,8),
      make('puxada-aberta',30,12,15),
      make('elevacao-lateral',8,12,8),
      make('elevacao-lateral',8,12,14),
      make('supino-inclinado',40,10,8),
      make('supino-inclinado',40,8,16),
      make('puxada-aberta',200,20,15,{manual:true,tag:'manual'}),
      make('elevacao-lateral',30,20,14,{equipment:'variação diferente',tag:'swap',exclude:true})
    ];
    const before=JSON.stringify(entries);
    const value=TracoSimple.weeklyVshapeSummary(entries,start);
    const after=JSON.stringify(entries);
    const noHistory=TracoSimple.weeklyVshapeSummary([],start);
    const changedVariant=TracoSimple.weeklyVshapeSummary([
      make('puxada-aberta',30,10,8),make('puxada-aberta',32,12,15,{name:'puxada com outra pegada'})
    ],start);
    return {value,unmodified:before===after,noHistory,changedVariant};
  });
  const groups=result.value.groups;
  expect(groups.map(g=>g.name)).toEqual(['Dorsais','Ombros','Peito']);
  expect(groups.map(g=>g.sets)).toEqual([1,1,1]);
  expect(groups.map(g=>g.previousSets)).toEqual([1,1,1]);
  expect(groups[0]).toMatchObject({compared:1,improved:1,status:'Sinal de progresso'});
  expect(groups[1]).toMatchObject({compared:1,steady:1,status:'Referência estável'});
  expect(groups[2]).toMatchObject({compared:1,below:1,status:'Abaixo da referência'});
  expect(result.changedVariant.groups[0]).toMatchObject({compared:0,status:'Sem exercício comparável'});
  expect(result.noHistory.groups.every(g=>g.sets===0&&g.status==='Sem registro nesta semana')).toBe(true);
  expect(result.unmodified).toBe(true);
  expect(result.value.currentLabel).toContain('12');
});
test('Evolução shows three compact weekly regions without touching user history',async({page})=>{
  await ready(page);
  const before=await page.evaluate(()=>{
    const ex=workoutPlan[0].exercises.find(row=>row.id==='puxada-aberta');
    const monday=new Date();monday.setHours(0,0,0,0);monday.setDate(monday.getDate()-(monday.getDay()+6)%7);
    const lastWeek=new Date(monday);lastWeek.setDate(lastWeek.getDate()-7);
    const session=(id,date,reps)=>({id,workoutId:'qua',startedAt:date.getTime(),finishedAt:date.getTime()+1000,
      exercises:[{...ex,sets:[{n:1,weight:30,reps,done:true,skipped:false}]}]});
    const added=[session('weekly-previous',lastWeek,10),session('weekly-current',monday,12)];
    const data=JSON.stringify(added);
    localStorage.setItem('v60_sessions',data);
    return data;
  });
  await page.locator('.simple-bottom-nav [data-nav="progress"]').click();
  await expect(page.locator('.simple-weekly')).toBeVisible();
  await expect(page.locator('.simple-weekly .simple-muscle-card')).toHaveCount(3);
  await expect(page.locator('[data-muscle="dorsais"]')).toContainText('Sinal de progresso');
  await expect(page.locator('[data-muscle="ombros"]')).toContainText('Sem registro nesta semana');
  await expect(page.locator('.simple-weekly')).toContainText('Uma semana isolada não define tendência.');
  expect(await page.evaluate(()=>localStorage.getItem('v60_sessions'))).toBe(before);
  expect(await page.locator('#app').evaluate(el=>el.scrollWidth<=window.innerWidth+8)).toBe(true);
  await page.reload({waitUntil:'load'});
  await page.locator('.simple-bottom-nav [data-nav="progress"]').click();
  await expect(page.locator('[data-muscle="dorsais"]')).toContainText('Sinal de progresso');
  expect(await page.evaluate(()=>localStorage.getItem('v60_sessions'))).toBe(before);
});


test('recovery only changes future prescription during opt-in weeks 4 8 and 12',async({page})=>{
  await ready(page);
  const initial=await page.evaluate(()=>{
    const d=new Date();d.setDate(d.getDate()-21);
    const key=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
    localStorage.setItem('traco_vshape_90_v1',JSON.stringify({start:key,schema:1}));
    const w=workoutPlan[0],ex=w.exercises[0];
    const draft={id:'recovery-safe-draft',startedAt:Date.now()-3600000,
      workoutId:w.id,exercises:[{...ex,sets:[{n:1,done:true,weight:30,reps:10},{n:2,done:false,weight:'',reps:''}]}]};
    localStorage.setItem('v60_draft',JSON.stringify(draft));
    TracoSimple.applyVShapePhase();
    state.page='home';render();
    return JSON.stringify(draft);
  });
  expect(await page.evaluate(()=>TracoSimple.programStatus())).toMatchObject({
    week:4,recoveryDue:true,recoveryActive:false});
  await expect(page.locator('.simple-home .simple-program')).toContainText('Pausa opcional');
  await page.locator('.simple-home [data-simple-action="program"]').click();
  await expect(page.locator('[data-simple-recovery="on"]')).toBeVisible();
  await page.locator('[data-simple-recovery="on"]').click();
  await expect(page.locator('[data-simple-recovery="off"]')).toBeVisible();
  const active=await page.evaluate(()=>({
    due:TracoSimple.programStatus(),
    wide:workoutPlan[0].exercises.find(ex=>ex.id==='puxada-aberta').sets,
    curl:workoutPlan[0].exercises.find(ex=>ex.id==='rosca-martelo').sets,
    draft:localStorage.getItem('v60_draft')
  }));
  expect(active.due.recoveryActive).toBe(true);
  expect(active.wide).toBe(2);
  expect(active.curl).toBe(1);
  expect(active.draft).toBe(initial);
  await page.reload({waitUntil:'load'});
  await page.waitForFunction(()=>window.TracoSimple?.version==='1.9.0');
  expect(await page.evaluate(()=>workoutPlan[0].exercises.find(ex=>ex.id==='puxada-aberta').sets)).toBe(2);
  expect(await page.evaluate(()=>localStorage.getItem('v60_draft'))).toBe(initial);
  await page.locator('.simple-home [data-simple-action="program"]').click();
  await page.locator('[data-simple-recovery="off"]').click();
  expect(await page.evaluate(()=>TracoSimple.programStatus().recoveryActive)).toBe(false);
  expect(await page.evaluate(()=>workoutPlan[0].exercises.find(ex=>ex.id==='puxada-aberta').sets)).toBe(3);
  expect(await page.evaluate(()=>localStorage.getItem('v60_draft'))).toBe(initial);
});
test('six complete calendar weeks count trusted sets and flag only genuine comparable plateaus',async({page})=>{
  await ready(page);
  const result=await page.evaluate(()=>{
    const reference=new Date(2026,9,18,18);
    const monday=new Date(reference);monday.setHours(12,0,0,0);monday.setDate(monday.getDate()-6);
    const day=n=>{const d=new Date(monday);d.setDate(d.getDate()-7*n);return d.getTime();};
    const ex=workoutPlan[0].exercises.find(e=>e.id==='puxada-aberta');
    const make=(n,reps,overrides={})=>({id:'signal-'+n+'-'+(overrides.tag||'regular'),startedAt:day(n),finishedAt:day(n)+1000,
      manualConfirmed:Boolean(overrides.manual),excludeFromVolume:Boolean(overrides.exclude),
      exercises:[{...ex,name:overrides.name||ex.name,equipment:overrides.equipment||ex.equipment,
        sets:[{n:1,weight:30,reps,done:true,skipped:false,reported:Boolean(overrides.reported)}]}]});
    const history=[make(3,10),make(2,10),make(1,10),make(2,100,{manual:true,tag:'manual'}),make(1,100,{reported:true,tag:'reported'})];
    const before=JSON.stringify(history);
    const stable=TracoSimple.trainingSignals(history,reference);
    const improved=TracoSimple.trainingSignals([make(3,10),make(2,10),make(1,12)],reference);
    const variant=TracoSimple.trainingSignals([make(3,10),make(2,10),make(1,10,{equipment:'Outro equipamento'})],reference);
    const empty=TracoSimple.trainingSignals([],reference);
    return {stable,improved,variant,empty,unmodified:JSON.stringify(history)===before};
  });
  const wide=result.stable.groups[0];
  expect(wide.series).toEqual([0,0,0,1,1,1]);
  expect(wide.total).toBe(3);
  expect(result.stable.plateaus).toMatchObject([{id:'puxada-aberta',sessions:3,days:14}]);
  expect(result.improved.plateaus).toEqual([]);
  expect(result.variant.plateaus).toEqual([]);
  expect(result.empty.groups.every(g=>g.total===0)).toBe(true);
  expect(result.empty.plateaus).toEqual([]);
  expect(result.unmodified).toBe(true);
});
test('Evolução displays six-week volume without history mutations or horizontal scrolling',async({page})=>{
  await ready(page);
  const before=await page.evaluate(()=>{
    const ex=workoutPlan[0].exercises.find(e=>e.id==='puxada-aberta');
    const today=new Date();today.setHours(12,0,0,0);today.setDate(today.getDate()-(today.getDay()+6)%7-7);
    const data=JSON.stringify([{id:'volume-ui',startedAt:today.getTime(),
      finishedAt:today.getTime()+1000,workoutId:'qua',
      exercises:[{...ex,sets:[{n:1,weight:30,reps:10,done:true,skipped:false}]}]}]);
    localStorage.setItem('v60_sessions',data);
    return data;
  });
  await page.locator('.simple-bottom-nav [data-nav="progress"]').click();
  await expect(page.locator('.simple-volume')).toBeVisible();
  await expect(page.locator('.simple-volume-row')).toHaveCount(3);
  await expect(page.locator('.simple-volume-row').first()).toContainText('1 série');
  await expect(page.locator('.simple-volume-bars').first().locator('.simple-volume-bar')).toHaveCount(6);
  expect(await page.locator('#app').evaluate(el=>el.scrollWidth<=window.innerWidth+8)).toBe(true);
  expect(await page.evaluate(()=>localStorage.getItem('v60_sessions'))).toBe(before);
  await page.reload({waitUntil:'load'});
  await page.locator('.simple-bottom-nav [data-nav="progress"]').click();
  await expect(page.locator('.simple-volume-row').first()).toContainText('1 série');
  expect(await page.evaluate(()=>localStorage.getItem('v60_sessions'))).toBe(before);
});

test('new Traço lime icon is usable for iPhone launch and installed PWA',async({page})=>{
  await ready(page);
  const manifest=await (await page.request.get(url+'manifest.json?v=378')).json();
  expect(manifest.name).toContain('Traço');
  expect(manifest.icons.some(icon=>icon.src==='./assets/traco-icon-192-v3.png'&&icon.purpose==='any')).toBe(true);
  expect(manifest.icons.some(icon=>icon.src==='./assets/traco-icon-512-v3.png'&&icon.purpose==='any')).toBe(true);
  await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveAttribute('href','./assets/traco-icon-180-v3.png?v=381');
  await expect(page.locator('link[rel="icon"]')).toHaveAttribute('href','./assets/icon.svg?v=381');
  const svg=await (await page.request.get(url+'assets/icon.svg?v=381')).text();
  expect(svg).toContain('#CDFF4C');
  expect(svg).toContain('costas em V');
  expect(svg).not.toContain('#FF3B30');
  for(const size of [180,192,512]){
    const result=await page.request.get(url+'assets/traco-icon-'+size+'-v3.png');
    expect(result.ok()).toBe(true);
    expect(result.headers()['content-type']).toContain('image/png');
    const png=await result.body();
    expect(png.subarray(0,8).toString('hex')).toBe('89504e470d0a1a0a');
    expect(png.readUInt32BE(16)).toBe(size);
    expect(png.readUInt32BE(20)).toBe(size);
  }
});
test('quick-start help explains three steps and does not alter the saved workouts',async({page})=>{
  await ready(page);
  await page.evaluate(()=>localStorage.setItem('traco_help_sentinel','preserved'));
  await expect(page.locator('#startToday')).toBeVisible();
  await page.locator('[data-simple-action="help"]').click();
  const guide=page.locator('#simpleQuickGuide');
  await expect(guide).toBeVisible();
  await expect(guide.locator('.simple-guide-list li')).toHaveCount(3);
  await expect(guide).toContainText('Comece o treino');
  await expect(guide).toContainText('Registre cada série');
  await expect(guide).toContainText('Entenda sua evolução');
  await expect(guide).toContainText('exporte uma cópia regularmente');
  await guide.getByRole('button',{name:'Entendi, bora treinar!'}).click();
  await expect(guide).toHaveCount(0);
  expect(await page.evaluate(()=>localStorage.getItem('traco_help_sentinel'))).toBe('preserved');
  await expect(page.locator('#startToday')).toBeVisible();
  expect(await page.locator('#app').evaluate(el=>el.scrollWidth<=window.innerWidth+8)).toBe(true);
});

test('30-minute mode offers a clear opt-in choice, preserves the full plan and resumes its exact draft',async({page})=>{
  await ready(page);
  const before=await page.evaluate(()=>({
    plan:JSON.stringify(workoutPlan),
    sessions:localStorage.getItem('v60_sessions'),
    body:localStorage.getItem('v60_body')
  }));
  await page.locator('#startToday').click();
  const modal=page.locator('#simpleWorkoutMode');
  await expect(modal).toBeVisible();
  await expect(modal.locator('[data-simple-start-mode="quick30"]')).toContainText('Rápido · ~30 min');
  await expect(modal.locator('[data-simple-start-mode="full"]')).toContainText('Completo · 45–60 min');
  await expect(modal).toContainText('descansos permanecem adequados');
  await modal.locator('[data-simple-start-mode="quick30"]').click();
  await expect(modal).toHaveCount(0);
  await expect(page.locator('.perf-session')).toBeVisible();
  await expect(page.locator('.simple-quick-session')).toContainText('MODO RÁPIDO');
  const chosen=await page.evaluate(()=>({
    session:JSON.parse(localStorage.getItem('v60_draft')),
    live:state.activeSession,plan:JSON.stringify(workoutPlan),
    sessions:localStorage.getItem('v60_sessions'),
    body:localStorage.getItem('v60_body')
  }));
  expect(chosen.session.trainingMode).toBe('quick30');
  expect(chosen.session.targetMinutes).toBe(30);
  expect(chosen.session.exercises.length).toBe(4);
  const qty=chosen.session.exercises.reduce((n,e)=>n+e.sets.length,0);
  expect(qty).toBeGreaterThanOrEqual(7);
  expect(qty).toBeLessThanOrEqual(10);
  expect(chosen.plan).toBe(before.plan);
  expect(chosen.sessions).toBe(before.sessions);
  expect(chosen.body).toBe(before.body);
  const draft=JSON.stringify(chosen.session);
  await page.reload({waitUntil:'load'});
  await page.waitForFunction(()=>window.TracoSimple?.version==='1.9.0');
  await expect(page.locator('#resumeWorkout')).toBeVisible();
  await page.locator('#resumeWorkout').click();
  await expect(page.locator('.perf-session')).toBeVisible();
  await expect(page.locator('.simple-quick-session')).toBeVisible();
  expect(await page.evaluate(()=>JSON.stringify(JSON.parse(localStorage.getItem('v60_draft'))))).toBe(draft);
});
test('all five quick workouts select priorities with shorter volume, respecting existing phase and core',async({page})=>{
  await ready(page);
  const result=await page.evaluate(()=>{
    const baseline=JSON.stringify(workoutPlan);
    const rows=[];
    for(const w of workoutPlan){
      localStorage.removeItem('v60_draft'); // Test fixture only: isolate each mode.
      const expected=tracoQuick30Prescription(w);
      const opened=startSession(w.id,'quick30');
      rows.push({id:w.id,planCount:w.exercises.length,planSets:w.exercises.reduce((n,x)=>n+x.sets,0),
        ex:opened.exercises.map(e=>({id:e.id,sets:e.sets.length,rest:e.rest})),
        expect:expected?.map(e=>({id:e.id,sets:e.sets,rest:e.rest})),
        mode:opened.trainingMode,target:opened.targetMinutes,
        stored:JSON.parse(localStorage.getItem('v60_draft')).trainingMode});
    }
    localStorage.removeItem('v60_draft'); // Test fixture only.
    return {rows,unchanged:baseline===JSON.stringify(workoutPlan)};
  });
  expect(result.unchanged).toBe(true);
  expect(result.rows.map(r=>r.id)).toEqual(['qua','seg','ter','qui','sex']);
  for(const row of result.rows){
    expect(row.ex.length).toBe(4);
    expect(row.ex).toEqual(row.expect);
    expect(row.ex.every(x=>x.rest>=45)).toBe(true);
    expect(row.ex.reduce((a,e)=>a+e.sets,0)).toBeLessThan(row.planSets);
    expect(row.mode).toBe('quick30');
    expect(row.target).toBe(30);
    expect(row.stored).toBe('quick30');
  }
  expect(result.rows[2].ex.map(e=>e.id)).toContain('core-reverse-ter');
  expect(result.rows[3].ex.map(e=>e.id)).toContain('core-pallof-qui');
});
test('complete mode stays identical and closing choice never creates or replaces a draft',async({page})=>{
  await ready(page);
  const original=await page.evaluate(()=>JSON.stringify(workoutPlan));
  await page.locator('#startToday').click();
  await page.locator('[data-simple-close]').last().click();
  await expect(page.locator('#simpleWorkoutMode')).toHaveCount(0);
  expect(await page.evaluate(()=>localStorage.getItem('v60_draft'))).toBe(null);
  await page.locator('#startToday').click();
  await page.locator('[data-simple-start-mode="full"]').click();
  const result=await page.evaluate(()=>({
    saved:JSON.parse(localStorage.getItem('v60_draft')),
    plan:JSON.stringify(workoutPlan)
  }));
  const plan=JSON.parse(original).find(w=>w.id===result.saved.workoutId);
  expect(result.saved.trainingMode).toBeUndefined();
  expect(result.saved.exercises.map(e=>e.id)).toEqual(plan.exercises.map(e=>e.id));
  // Existing evolution coach may suggest one extra set, even in full mode.
  // The new quick selector must not remove or replace any planned exercise.
  const recorded=result.saved.exercises.map(e=>e.sets.length);
  const originals=plan.exercises.map(e=>e.sets);
  expect(recorded.every((n,i)=>n>=originals[i]&&n<=originals[i]+1)).toBe(true);
  expect(result.plan).toBe(original);
  await expect(page.locator('.simple-quick-session')).toHaveCount(0);
});
test('short sessions record real sets and survive phase changes without inflating history',async({page})=>{
  await ready(page);
  const snapshot=await page.evaluate(()=>{
    const ex=workoutPlan[0].exercises[0];
    const data=JSON.stringify([{id:'historic-long',workoutId:'qua',startedAt:Date.now()-10000000,
      finishedAt:Date.now()-9950000,exercises:[{...ex,sets:[{n:1,weight:28,reps:9,done:true}]}]}]);
    localStorage.setItem('v60_sessions',data);
    return data;
  });
  await page.locator('#startToday').click();
  await page.locator('[data-simple-start-mode="quick30"]').click();
  await page.locator('#weightInput').fill('30');
  await page.locator('#repsInput').fill('10');
  await page.locator('#completeSet').click();
  const selected=await page.evaluate(()=>{
    const current=JSON.parse(localStorage.getItem('v60_draft'));
    const saved=JSON.stringify(current),exercises=current.exercises.map(x=>({id:x.id,count:x.sets.length}));
    const d=new Date();d.setDate(d.getDate()-35);
    const key=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
    localStorage.setItem('traco_vshape_90_v1',JSON.stringify({start:key}));
    TracoSimple.applyVShapePhase();
    return {saved,exercises,currentPlan:workoutPlan[0].exercises.map(x=>x.sets),
      unchangedDraft:localStorage.getItem('v60_draft')===saved};
  });
  expect(selected.unchangedDraft).toBe(true);
  expect(selected.saved).toContain('"trainingMode":"quick30"');
  expect(JSON.parse(selected.saved).exercises.some(ex=>ex.sets.some(set=>set.done&&Number(set.weight)===30&&Number(set.reps)===10))).toBe(true);
  expect(await page.evaluate(()=>localStorage.getItem('v60_sessions'))).toBe(snapshot);
});


test('Pular por agora is compact, advances to another exercise, and keeps unsent sets after reload',async({page})=>{
  await ready(page);
  await page.locator('#startToday').click();
  await page.locator('[data-simple-start-mode="quick30"]').click();
  await expect(page.locator('.perf-session')).toBeVisible();
  await expect(page.locator('#skipExercise')).toHaveText('Pular por agora');
  await expect(page.locator('#exerciseMore')).toBeVisible();
  const geometry=await page.evaluate(()=>{
    const b=document.querySelector('#skipExercise').getBoundingClientRect();
    const n=document.querySelector('#exerciseMore').getBoundingClientRect();
    return {width:b.width,height:b.height,more:n.width,visible:getComputedStyle(document.querySelector('#exerciseMore')).display!=='none'};
  });
  expect(geometry.width).toBeLessThanOrEqual(245);
  expect(geometry.height).toBeGreaterThanOrEqual(40);
  expect(geometry.height).toBeLessThanOrEqual(48);
  expect(geometry.more).toBeGreaterThanOrEqual(44);
  expect(geometry.visible).toBe(true);
  await page.locator('#weightInput').fill('26');
  await page.locator('#repsInput').fill('11');
  const before=await page.evaluate(()=>{
    const draft=JSON.parse(localStorage.getItem('v60_draft'));
    return {id:draft.id,exId:draft.exercises[0].id,mode:draft.trainingMode,sets:draft.exercises[0].sets};
  });
  await page.locator('#skipExercise').click();
  await expect(page.locator('.perf-session')).toBeVisible();
  const moved=await page.evaluate(()=>{
    const d=JSON.parse(localStorage.getItem('v60_draft'));
    return {id:d.id,exerciseId:state.activeSession.exercises[state.currentExercise].id,
      queue:d.tracoSetQueue,first:d.exercises[0],mode:d.trainingMode};
  });
  expect(moved.id).toBe(before.id);
  expect(moved.exerciseId).not.toBe(before.exId);
  expect(moved.mode).toBe('quick30');
  expect(moved.first.sets[0]).toMatchObject({weight:'26',reps:'11',done:false});
  expect(moved.first.sets.every(x=>!x.skipped&&!x.done)).toBe(true);
  const pending=moved.queue.filter(token=>token.startsWith(before.exId+'::'));
  expect(moved.queue.slice(-pending.length)).toEqual(pending);
  await page.reload({waitUntil:'load'});
  await page.waitForFunction(()=>window.TracoSimple?.version==='1.9.0');
  await page.locator('#resumeWorkout').click();
  await expect(page.locator('.perf-session')).toBeVisible();
  expect(await page.evaluate(()=>state.activeSession.exercises[state.currentExercise].id)).toBe(moved.exerciseId);
  expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('v60_draft')).exercises[0].sets[0].weight)).toBe('26');
  expect(await page.locator('#app').evaluate(el=>el.scrollWidth<=window.innerWidth+8)).toBe(true);
});
test('three-dot options swap an occupied machine while preserving saved set values',async({page})=>{
  await ready(page);
  await page.evaluate(()=>{state.selectedWorkout='qua';state.page='workouts';render();});
  await page.locator('#startSelected').click();
  await page.locator('[data-simple-start-mode="full"]').click();
  await expect(page.locator('.perf-session')).toBeVisible();
  await page.locator('#weightInput').fill('31');
  await page.locator('#repsInput').fill('10');
  const original=await page.evaluate(()=>JSON.stringify(workoutPlan));
  await page.locator('#exerciseMore').click();
  await expect(page.locator('#tracoExerciseActions')).toBeVisible();
  await page.locator('#tracoActionSwap').click();
  await expect(page.locator('#tracoSmartSwap')).toBeVisible();
  await expect(page.locator('[data-smart-swap]')).toHaveCount(1);
  await page.locator('[data-smart-swap="0"]').click();
  await expect(page.locator('#tracoSmartSwap')).toHaveCount(0);
  await expect(page.locator('.perf-session')).toContainText('puxada neutra');
  const actual=await page.evaluate(()=>{
    const d=JSON.parse(localStorage.getItem('v60_draft'));
    return {ex:d.exercises[0],plan:JSON.stringify(workoutPlan)};
  });
  expect(actual.ex).toMatchObject({id:'puxada-aberta',name:'puxada neutra',performedVariation:'puxada neutra'});
  expect(actual.ex.sets[0]).toMatchObject({weight:'31',reps:'10',done:false});
  expect(actual.plan).toBe(original);
});
test('pular só hoje skips only unfinished sets, does not log false PRs or double-confirm',async({page})=>{
  await ready(page);
  await page.evaluate(()=>{state.selectedWorkout='qua';state.page='workouts';render();});
  await page.locator('#startSelected').click();
  await page.locator('[data-simple-start-mode="quick30"]').click();
  await page.locator('#weightInput').fill('34');
  await page.locator('#repsInput').fill('9');
  await page.locator('#completeSet').click();
  await page.evaluate(()=>{if(typeof stopRest==='function')stopRest();});
  await expect(page.locator('.perf-session')).toBeVisible();
  let confirmations=0;
  page.on('dialog',async dialog=>{confirmations++;await dialog.accept();});
  const before=await page.evaluate(()=>({
    plan:JSON.stringify(workoutPlan),
    history:localStorage.getItem('v60_sessions')
  }));
  await page.locator('#exerciseMore').click();
  await page.locator('#tracoActionSkip').click();
  await expect(page.locator('#tracoExerciseActions')).toHaveCount(0);
  expect(confirmations).toBe(1);
  const report=await page.evaluate(()=>{
    const d=JSON.parse(localStorage.getItem('v60_draft'));
    return {first:d.exercises[0],current:state.activeSession.exercises[state.currentExercise].id,
      plan:JSON.stringify(workoutPlan),history:localStorage.getItem('v60_sessions')};
  });
  expect(report.first.skippedToday).toBe(true);
  expect(report.first.sets[0]).toMatchObject({weight:'34',reps:'9',done:true,skipped:false});
  expect(report.first.sets.slice(1).every(set=>set.done&&set.skipped&&set.weight===''&&set.reps==='')).toBe(true);
  expect(report.current).not.toBe(report.first.id);
  expect(report.plan).toBe(before.plan);
  expect(report.history).toBe(before.history);
  await page.locator('#exerciseMore').click();
  await page.locator('#tracoActionLater').click();
  await expect(page.locator('.perf-session')).toBeVisible();
  await expect(page.locator('#tracoExerciseActions')).toHaveCount(0);
});
test('Pular por agora rejects unsafe storage failures without silently changing exercise',async({page})=>{
  await ready(page);
  await page.locator('#startToday').click();
  await page.locator('[data-simple-start-mode="quick30"]').click();
  await page.locator('#repsInput').fill('10');
  const result=await page.evaluate(()=>{
    const before=localStorage.getItem('v60_draft');
    const current=state.currentExercise;
    const queue=JSON.stringify(state.activeSession.tracoSetQueue||[]);
    const original=Storage.prototype.setItem;
    Storage.prototype.setItem=function(key,value){
      if(key==='v60_draft')throw new DOMException('Out of space','QuotaExceededError');
      return original.call(this,key,value);
    };
    try{
      document.querySelector('#skipExercise').click();
      return {before,after:localStorage.getItem('v60_draft'),
        cursor:state.currentExercise,oldCursor:current,
        oldQueue:queue,newQueue:JSON.stringify(state.activeSession.tracoSetQueue||[])};
    }finally{Storage.prototype.setItem=original;}
  });
  expect(result.after).toBe(result.before);
  expect(result.cursor).toBe(result.oldCursor);
  expect(result.newQueue).toBe(result.oldQueue);
});


test('legacy exercise picker and order sheet actually open with escaped labels and never delete draft',async({page})=>{
  await ready(page);
  await page.evaluate(()=>{state.selectedWorkout='qua';state.page='workouts';render();});
  await page.locator('#startSelected').click();
  await page.locator('[data-simple-start-mode="quick30"]').click();
  await expect(page.locator('.perf-session')).toBeVisible();
  const prior=await page.evaluate(()=>JSON.parse(localStorage.getItem('v60_draft')));
  await page.evaluate(()=>tracoGymOpenExercisePicker());
  await expect(page.locator('#tracoExercisePicker')).toBeVisible();
  await expect(page.locator('[data-pick-exercise]')).toHaveCount(4);
  const next=await page.locator('[data-pick-exercise]:not([disabled])').nth(1).getAttribute('data-pick-exercise');
  await page.locator('[data-pick-exercise="'+next+'"]').click();
  await expect(page.locator('#tracoExercisePicker')).toHaveCount(0);
  expect(await page.evaluate(()=>state.activeSession.exercises[state.currentExercise].id)).toBe(next);
  await page.evaluate(()=>tracoGymOpenExercisePicker());
  await page.locator('#tracoExercisePickerQueue').click();
  await expect(page.locator('#tracoOrderEditor')).toBeVisible();
  await page.locator('#tracoOrderEditor').getByRole('button',{name:/fechar|voltar/i}).first().click();
  await expect(page.locator('#tracoOrderEditor')).toHaveCount(0);
  const after=await page.evaluate(()=>JSON.parse(localStorage.getItem('v60_draft')));
  expect(after.id).toBe(prior.id);
  expect(after.trainingMode).toBe('quick30');
  expect(after.exercises.map(ex=>ex.id)).toEqual(prior.exercises.map(ex=>ex.id));
  expect(after.exercises.every(ex=>ex.sets.every(set=>!set.done&&!set.skipped))).toBe(true);
});
