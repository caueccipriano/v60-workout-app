/*
 * Traço 2.0 — Performance Console
 * Visual/interaction layer only. Existing storage, media audit, XP and workout logic stay intact.
 */
const TRACO_PERF_MIGRATION='traco_performance_console_v1';

function tracoPerfInit(){
  document.documentElement.dataset.design='performance';
  if(!localStorage.getItem(TRACO_PERF_MIGRATION)){
    localStorage.setItem(TRACO_THEME_KEY||'traco_theme','dark');
    localStorage.setItem(TRACO_PERF_MIGRATION,'1');
  }
  if(typeof tracoApplyTheme==='function')tracoApplyTheme(localStorage.getItem('traco_theme')==='light'?'light':'dark');
  else document.documentElement.dataset.theme=localStorage.getItem('traco_theme')==='light'?'light':'dark';
}
function tracoPerfEsc(v){return String(v??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[ch]));}
function tracoPerfDumbbell(){
  return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M7 8v8M4.5 9.5v5M17 8v8M19.5 9.5v5M7 12h10M2.5 11v2M21.5 11v2"/></svg>';
}
function tracoPerfPlate(){
  return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 11a7 7 0 0 0 14 0H5Z"/><path d="M8 7h8M10 4h4M4 20h16"/></svg>';
}

nav=function(){
  const items=[
    ['home','home','início'],
    ['progress','chart','evolução'],
    ['workouts','dumbbell','treino'],
    ['food','plate','cardápios'],
    ['settings','gear','mais']
  ];
  return `<nav class="bottom-nav perf-bottom-nav">${items.map(([p,i,l])=>{const active=state.page===p||(p==='food'&&state.page==='body')||(p==='progress'&&state.page==='photos');const icon=i==='dumbbell'?tracoPerfDumbbell():i==='plate'?tracoPerfPlate():iconSvg(i);return `<button class="nav-btn ${active?'active':''}" data-nav="${p}" aria-label="${l}"><span class="ico">${icon}</span><span>${l}</span></button>`}).join('')}</nav>`;
};

function tracoPerfSequence(){
  const rec=typeof v60RecommendedWorkout==='function'?v60RecommendedWorkout():todayWorkout();
  const current=typeof v60SequenceItem==='function'?v60SequenceItem(rec.id):null;
  const seq=typeof V60_SEQUENCE!=='undefined'?V60_SEQUENCE:workoutPlan.map((w,i)=>({letter:String.fromCharCode(65+i),workoutId:w.id}));
  const ws=weekSessions();
  return `<section class="perf-sequence"><div class="perf-section-label"><span>sequência de treinos</span><b>${current?.letter||'A'} agora</b></div><div class="perf-sequence-grid">${seq.map(item=>{
    const done=ws.some(s=>s.workoutId===item.workoutId);
    const active=item.workoutId===rec.id;
    return `<button class="perf-seq ${done?'done':''} ${active?'active':''}" data-perf-workout="${item.workoutId}"><b>${item.letter}</b><span>${done?'✓':active?'○':'·'}</span></button>`;
  }).join('')}</div></section>`;
}

renderHome=function(){
  const w=typeof v60RecommendedWorkout==='function'?v60RecommendedWorkout():todayWorkout();
  const item=typeof v60SequenceItem==='function'?v60SequenceItem(w.id):{letter:'A'};
  const ws=weekSessions();
  const streak=typeof v60TrainingStreak==='function'?v60TrainingStreak():calcStreak();
  const loads=recordedLoadCount(ws);
  const profile=typeof v60Profile==='function'?v60Profile():{name:'Cauê',weeklyGoal:5};
  const goal=Math.max(1,Number(profile.weeklyGoal)||5);
  const draft=load(K.draft,null),draftPct=sessionCompletion(draft);
  const xp=xpStats();
  shell(`
    <header class="perf-topbar">
      <div class="perf-wordmark"><i></i><strong>traço</strong></div>
      <div class="perf-top-actions"><span class="perf-level">LV ${xp.level}</span><button class="perf-avatar" data-nav="settings" aria-label="perfil">${tracoPerfEsc((profile.name||'C').trim().charAt(0).toUpperCase())}</button></div>
    </header>
    <section class="perf-greeting"><h1>e aí, ${tracoPerfEsc((profile.name||'Cauê').toLowerCase())}</h1><p>foco hoje. resultado amanhã.</p></section>
    ${draft?`<section class="perf-resume"><div><span>EM ANDAMENTO</span><b>${tracoPerfEsc(draft.wName)}</b><small>${draftPct}% concluído</small></div><button id="resumeWorkout">continuar →</button></section>`:''}
    <button class="perf-workout-hero" id="startToday" aria-label="começar treino ${item.letter}">
      <div class="perf-hero-grid"></div>
      <div class="perf-hero-top"><span>PRÓXIMO TREINO</span><b>TRC-${item.letter}</b></div>
      <div class="perf-hero-copy"><strong>Treino <em>${item.letter}</em></strong><p>${tracoPerfEsc(w.short)}</p><small>${w.exercises.length} exercícios <i>•</i> ~ 60 min</small></div>
      <div class="perf-start-cta"><span>${iconSvg('play')}</span><b>Começar</b><i>→</i></div>
    </button>
    ${tracoPerfSequence()}
    <section class="perf-metrics">
      <article><span class="perf-metric-icon">${iconSvg('flame')}</span><b>${streak}</b><strong>dias</strong><small>sequência</small></article>
      <article><span class="perf-metric-icon">${tracoPerfDumbbell()}</span><b>${loads}</b><strong>cargas</strong><small>registradas</small></article>
      <article><span class="perf-metric-icon perf-target">◎</span><b>${ws.length}/${goal}</b><strong>meta</strong><small>semanal</small></article>
    </section>
    <section class="perf-home-links">
      <button id="perfHistory">${iconSvg('history')}<span><b>histórico</b><small>ver sessões e editar registros</small></span><i>→</i></button>
      <button id="perfAllWorkouts">${tracoPerfDumbbell()}<span><b>todos os treinos</b><small>sequência A–E</small></span><i>→</i></button>
    </section>
  `,{classes:'home-card perf-home'});
  $('#startToday').onclick=()=>startSession(w.id);
  if($('#resumeWorkout'))$('#resumeWorkout').onclick=()=>startSession(draft.workoutId);
  $('#perfHistory').onclick=()=>{state.page='history';renderHistory();};
  $('#perfAllWorkouts').onclick=()=>{state.page='workouts';state.selectedWorkout=w.id;renderWorkouts();};
  $$('[data-perf-workout]').forEach(el=>el.onclick=()=>{state.page='workouts';state.selectedWorkout=el.dataset.perfWorkout;renderWorkouts();});
};

renderSession=function(){
  const s=state.activeSession;
  if(!s){state.page='home';render();return;}
  const ex=s.exercises[state.currentExercise],si=currentSetIndex(ex),set=ex.sets[si],usesLoad=typeof tracoExerciseUsesLoad==='function'?tracoExerciseUsesLoad(ex):true;
  const item=typeof v60SequenceItem==='function'?v60SequenceItem(s.workoutId):{letter:''};
  const progress=((state.currentExercise+(si/ex.sets.length))/s.exercises.length)*100;
  const guide=typeof v60GuidePreview==='function'?v60GuidePreview(ex):'';
  const extras=typeof v60ExtrasPanel==='function'?v60ExtrasPanel():'';
  shell(`
    <header class="perf-session-bar">
      <button class="plain-icon" id="sessionBack" aria-label="voltar">${iconSvg('back')}</button>
      <div><b>Treino ${item?.letter||''}</b><span>${tracoPerfEsc(s.wName)}</span></div>
      <button class="plain-icon" id="cancelSession" aria-label="cancelar">${iconSvg('close')}</button>
    </header>
    <div class="perf-session-progress"><span style="width:${progress}%"></span><small>${state.currentExercise+1}/${s.exercises.length} exercícios</small></div>
    <section class="perf-exercise-console">
      <div class="perf-exercise-top"><span class="perf-exercise-index">0${state.currentExercise+1}</span><div><small>${tracoPerfEsc(ex.equipment)}</small><h1>${tracoPerfEsc(ex.name)}</h1><p>série ${si+1} de ${ex.sets.length}</p>${ex.core?'<span class="perf-core-chip">CORE · CINTURA</span>':''}</div></div>
      <div class="perf-inputs ${usesLoad?'':'is-no-load'}">
        ${usesLoad?`<div class="perf-value-panel"><span>CARGA</span><div><button type="button" data-adjust="weight:-2.5">−</button><label><input id="weightInput" type="number" inputmode="decimal" step="0.5" value="${tracoPerfEsc(set.weight)}" placeholder="0"><small>kg</small></label><button type="button" data-adjust="weight:2.5">+</button></div></div>`:''}
        <div class="perf-value-panel"><span>REPETIÇÕES</span><div><button type="button" data-adjust="reps:-1">−</button><label><input id="repsInput" type="number" inputmode="numeric" value="${tracoPerfEsc(set.reps)}" placeholder="0"><small>reps</small></label><button type="button" data-adjust="reps:1">+</button></div></div>
      </div>
      <div class="perf-set-track">${ex.sets.map((x,i)=>`<span class="${x.done?'done':''} ${i===si?'current':''}"><b>${i+1}</b></span>`).join('')}</div>
      <button class="perf-complete-set" id="completeSet"><span>concluir série</span><b>→</b></button>
      <button class="perf-skip-exercise" id="skipExercise" type="button">pular exercício</button>
    </section>
    <section class="perf-native-exercise-list" id="perfNativeExerciseList">
      <header><div><small>TREINO EM ANDAMENTO</small><h2>lista de exercícios</h2><p>toque no exercício que você quer fazer agora</p></div></header>
      <div class="perf-native-exercise-rows">
        ${s.exercises.map((item,i)=>{const done=(item.sets||[]).filter(x=>x.done).length,total=(item.sets||[]).length,active=i===state.currentExercise;return `<button type="button" class="perf-native-exercise-row ${active?'is-current':''} ${done>=total&&total?'is-complete':''}" data-native-exercise-index="${i}" ${done>=total&&total?'disabled':''}><span class="perf-native-exercise-number">${String(i+1).padStart(2,'0')}</span><span><b>${tracoPerfEsc(item.name)}</b><small>${done}/${total} séries concluídas</small></span><i>${done>=total&&total?'✓':active?'●':'→'}</i></button>`;}).join('')}
      </div>
    </section>
    <section class="perf-media-block"><div class="perf-media-heading"><span>EXECUÇÃO</span><b>movimento auditado</b></div>${guide}</section>
    <section class="perf-last-performance">${iconSvg('trophy')}<div><span>última referência</span><b>${tracoPerfEsc(lastSetText(ex.id))}</b></div></section>
    ${extras}
    <footer class="perf-session-footer"><span id="sessionTime">${fmtClock(sessionElapsed())}</span><span>descanso ${ex.rest||settings().defaultRest||60}s</span><button id="finishEarly">encerrar treino</button></footer>
  `,{showNav:false,classes:'session-page perf-session'});

  $('#openExerciseGuide') && ($('#openExerciseGuide').onclick=()=>v60ShowGuide(ex));
  const weight=$('#weightInput'),reps=$('#repsInput');
  if(weight)weight.oninput=e=>{set.weight=e.target.value;save(K.draft,s);};
  reps.oninput=e=>{set.reps=e.target.value;save(K.draft,s);};
  $$('[data-adjust]').forEach(btn=>btn.onclick=()=>{
    const [kind,raw]=btn.dataset.adjust.split(':'),delta=Number(raw);
    const input=kind==='weight'?weight:reps;
    if(!input)return;
    const step=kind==='weight'?0.5:1;
    const current=Number(input.value||0);
    input.value=String(Math.max(0,Math.round((current+delta)/step)*step));
    input.dispatchEvent(new Event('input',{bubbles:true}));
  });
  document.querySelectorAll('[data-native-exercise-index]').forEach(btn=>btn.onclick=()=>{const next=Number(btn.dataset.nativeExerciseIndex);if(Number.isInteger(next)&&next>=0&&next<s.exercises.length){state.currentExercise=next;save(K.draft,s);renderSession();}});
    $('#completeSet').onclick=completeCurrentSet;
  if($('#skipExercise'))$('#skipExercise').onclick=()=>{if(confirm('pular este exercício?'))skipCurrentExercise();};
  $('#cancelSession').onclick=()=>{typeof v60CloseGuide==='function'&&v60CloseGuide();cancelSession();};
  $('#sessionBack').onclick=()=>{typeof v60CloseGuide==='function'&&v60CloseGuide();if(state.currentExercise>0){state.currentExercise--;renderSession();}else{state.page='home';render();}};
  $('#finishEarly').onclick=()=>{if(confirm('encerrar o treino agora?')){typeof v60CloseGuide==='function'&&v60CloseGuide();finishSession();}};
  if(typeof v60ExtrasPanel==='function'){
    const abs=$('#v60AddAbs'),cardio=$('#v60AddCardio'),clear=$('#v60ClearExtras');
    if(abs)abs.onclick=()=>v60OpenExtraModal('abs');
    if(cardio)cardio.onclick=()=>v60OpenExtraModal('cardio');
    if(clear)clear.onclick=()=>{state.activeSession.extras=[];save(K.draft,state.activeSession);renderSession();};
  }
  clearInterval(state.sessionClock);
  state.sessionClock=setInterval(()=>{const el=$('#sessionTime');if(el)el.textContent=fmtClock(sessionElapsed());},1000);
  if(state.restRemaining>0)showRestOverlay();
};

const tracoPerfBaseWorkouts=renderWorkouts;
renderWorkouts=function(){
  tracoPerfBaseWorkouts();
  const main=document.querySelector('.workouts-page');if(!main)return;
  main.classList.add('perf-page','perf-workouts');
  const head=main.querySelector('.page-head');
  if(head&&!main.querySelector('.perf-history-shortcut'))head.insertAdjacentHTML('afterend','<button class="perf-history-shortcut" id="perfWorkoutHistory">'+iconSvg('history')+'<span><b>histórico de treinos</b><small>editar sessões, cargas e reps</small></span><i>→</i></button>');
  const btn=$('#perfWorkoutHistory');if(btn)btn.onclick=()=>{state.page='history';renderHistory();};
};

const tracoPerfBaseHistory=renderHistory;
renderHistory=function(){
  tracoPerfBaseHistory();
  document.querySelector('.history-page')?.classList.add('perf-page','perf-history');
};

const tracoPerfBaseProgress=renderProgress;
renderProgress=function(){
  tracoPerfBaseProgress();
  const main=document.querySelector('.progress-page');if(!main)return;
  main.classList.add('perf-page','perf-progress');
  const h=main.querySelector('.page-head h2');if(h)h.textContent='evolução';
  const k=main.querySelector('.page-kicker');if(k)k.textContent='DADOS CONSTROEM RESULTADOS';
};

const tracoPerfBaseBody=renderBody;
renderBody=function(){
  tracoPerfBaseBody();
  const main=document.querySelector('.body-page');if(!main)return;
  main.classList.add('perf-page','perf-body');
  const h=main.querySelector('.page-head h2');if(h)h.textContent='meu corpo';
  const k=main.querySelector('.page-kicker');if(k)k.textContent='EVOLUÇÃO REAL';
};

const tracoPerfBaseSettings=renderSettings;
renderSettings=function(){
  tracoPerfBaseSettings();
  const main=document.querySelector('.settings-page');if(!main)return;
  main.classList.add('perf-page','perf-settings');
  const h=main.querySelector('.page-head h2');if(h)h.textContent='mais';
  const intro=main.querySelector('.settings-intro b');if(intro)intro.textContent='seu Traço, do seu jeito.';
};

const tracoPerfBaseFinish=renderFinish;
renderFinish=function(){
  tracoPerfBaseFinish();
  document.querySelector('.finish-shell')?.classList.add('perf-finish');
};

tracoPerfInit();
render();
