const {test,expect}=require('@playwright/test');
test.use({serviceWorkers:'block',viewport:{width:390,height:844}});
const url='http://127.0.0.1:4173/';
async function ready(page){
  await page.goto(url,{waitUntil:'load'});
  await page.waitForFunction(()=>window.TracoSimple?.version==='1.6.0');
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
  await expect(page.locator('.traco-about-card small')).toContainText('2.35.0');
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
  await expect(page.locator('.perf-session .simple-next-goal')).toBeVisible();
  await expect(page.locator('.simple-next-goal')).toContainText('Pode considerar subir a carga');
  await expect(page.locator('.simple-next-goal')).toContainText('24 kg');
  await expect(page.locator('.simple-next-goal')).toContainText('12/12/12');
  expect(await page.evaluate(()=>localStorage.getItem('v60_sessions'))).toBe(before.serialized);
  const sets=await page.evaluate(()=>state.activeSession.exercises[0].sets);
  expect(sets.length).toBe(3);
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
  await page.waitForFunction(()=>window.TracoSimple?.version==='1.6.0');
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
