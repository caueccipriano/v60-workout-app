/*
 * Traço 2.3 — Gym UX Pass
 * Final UX layer: gym-first, fast touch targets, achievement color, clearer copy.
 * Internal v60_* storage keys remain for backwards compatibility.
 */
const TRACO_GYM_UX_VERSION='2.3.0';
const TRACO_ACHIEVEMENT='#F4C542';
const TRACO_LAST_LEVEL_KEY='traco_last_level_v1';

function tracoGymEsc(v){return String(v??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[ch]));}
function tracoGymCalendar(){
  return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M8 3v4M16 3v4M3 10h18"/><path d="m9 15 2 2 4-5"/></svg>';
}
function tracoGymShuffle(){
  return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M16 3h5v5"/><path d="m4 20 17-17"/><path d="M21 16v5h-5"/><path d="m15 15 6 6"/><path d="M4 4l5 5"/></svg>';
}
function tracoGymLastWorkout(id){
  const row=sessions().filter(s=>s.finishedAt&&s.workoutId===id).sort((a,b)=>b.startedAt-a.startedAt)[0];
  if(!row)return 'ainda não feito';
  const then=new Date(row.startedAt),now=new Date(); then.setHours(0,0,0,0); now.setHours(0,0,0,0);
  const days=Math.max(0,Math.round((now-then)/86400000));
  if(days===0)return 'feito hoje';
  if(days===1)return 'feito ontem';
  return `feito há ${days} dias`;
}
function tracoGymExerciseHistoryCount(){
  const ids=new Set();
  sessions().filter(s=>s.finishedAt).forEach(s=>(s.exercises||[]).forEach(ex=>{
    if((ex.sets||[]).some(set=>set.done&&Number(set.weight)>0))ids.add(ex.id);
  }));
  return ids.size;
}
function tracoGymClearAll(){
  if(!confirm('apagar treinos, medidas, XP, preferências e histórico deste aparelho?'))return;
  if(!confirm('tem certeza? exporte um backup antes se quiser guardar seus dados.'))return;
  const keep=new Set(['traco_theme','traco_performance_console_v1']);
  Object.keys(localStorage).forEach(k=>{
    if((k.startsWith('v60_')||k.startsWith('traco_'))&&!keep.has(k))localStorage.removeItem(k);
  });
  toast('dados apagados deste aparelho'); haptic();
  setTimeout(()=>location.reload(),450);
}
function tracoGymExecutionButton(ex){
  const hasVideo=typeof v60VideoFor==='function'&&Boolean(v60VideoFor(ex));
  const offline=navigator.onLine===false;
  return `<button class="traco-execution-trigger" id="openExerciseGuide" type="button" aria-label="ver execução de ${tracoGymEsc(ex.name)}">
    <span class="traco-execution-play">${iconSvg('play')}</span>
    <span><b>ver execução</b><small>${offline?'guia técnico disponível offline':hasVideo?'vídeo 1:1 + guia técnico':'guia técnico do movimento'}</small></span>
    <i>↗</i>
  </button>`;
}

/* HOME */
const tracoGymBaseHome=renderHome;
renderHome=function(){
  tracoGymBaseHome();
  const main=document.querySelector('.perf-home'); if(!main)return;
  const xp=xpStats();

  const metricCards=[...main.querySelectorAll('.perf-metrics article')];
  if(metricCards[0])metricCards[0].classList.add('traco-achievement-card');
  const target=main.querySelector('.perf-target');
  if(target){target.classList.remove('perf-target');target.classList.add('traco-target-icon');target.innerHTML=tracoGymCalendar();}

  const cta=main.querySelector('.perf-start-cta');
  if(cta)cta.classList.add('traco-start-cta');

  if(!main.querySelector('.traco-home-xp')){
    const metrics=main.querySelector('.perf-metrics');
    metrics?.insertAdjacentHTML('afterend',`<section class="traco-home-xp">
      <div><span>nível ${xp.level}</span><b>${xp.current}/100 XP</b></div>
      <div class="traco-home-xp-track"><i style="width:${xp.pct}%"></i></div>
      <small>${xp.current===0&&xp.total>0?'novo nível começou':`${100-xp.current} XP pro próximo nível`}</small>
    </section>`);
  }
};

/* ACTIVE WORKOUT */
const tracoGymBaseSession=renderSession;
renderSession=function(){
  tracoGymBaseSession();
  const main=document.querySelector('.perf-session'); if(!main||!state.activeSession)return;
  const ex=state.activeSession.exercises[state.currentExercise];

  const media=main.querySelector('.perf-media-block');
  if(media){
    media.innerHTML=`<div class="perf-media-heading"><span>execução</span><b>sem distração no treino</b></div>${tracoGymExecutionButton(ex)}`;
    $('#openExerciseGuide').onclick=()=>v60ShowGuide(ex);
  }

  const back=$('#sessionBack'),close=$('#cancelSession');
  if(back){back.classList.add('traco-session-nav');back.setAttribute('aria-label','voltar um exercício');back.insertAdjacentHTML('beforeend','<small>anterior</small>');}
  if(close){close.classList.add('traco-session-nav');close.setAttribute('aria-label','sair e cancelar treino');close.insertAdjacentHTML('beforeend','<small>sair</small>');}

  $$('.perf-value-panel button').forEach(btn=>btn.classList.add('traco-gym-stepper'));
  const progress=main.querySelector('.perf-session-progress'); if(progress)progress.classList.add('traco-progress-visible');
};

const tracoGymBaseCompleteSet=completeCurrentSet;
completeCurrentSet=function(){
  const s=state.activeSession,ex=s?.exercises?.[state.currentExercise],si=ex?currentSetIndex(ex):-1,set=si>=0?ex.sets[si]:null;
  if(!set||!set.weight||!set.reps){tracoGymBaseCompleteSet();return;}
  const btn=$('#completeSet'),dot=$$('.perf-set-track span')[si];
  if(btn){btn.disabled=true;btn.classList.add('traco-saved');btn.innerHTML='<span>série salva</span><b>✓</b>';}
  if(dot){dot.classList.add('done','traco-flash');const b=dot.querySelector('b');if(b)b.textContent='✓';}
  haptic();
  setTimeout(()=>tracoGymBaseCompleteSet(),160);
};

/* WORKOUT LIBRARY */
const tracoGymBaseWorkouts=renderWorkouts;
renderWorkouts=function(){
  tracoGymBaseWorkouts();
  const main=document.querySelector('.perf-workouts'); if(!main)return;

  const count=main.querySelector('.page-count');
  if(count){count.textContent='ordem A–E';count.classList.add('traco-order-badge');}

  const note=main.querySelector('.v60-sequence-note');
  if(note&&!note.querySelector('.traco-flex-icon')){
    note.classList.add('traco-flex-note');
    note.insertAdjacentHTML('afterbegin',`<span class="traco-flex-icon">${tracoGymShuffle()}</span>`);
    const small=note.querySelector('small');if(small)small.textContent='sequência flexível: siga a recomendação ou escolha outro treino.';
  }

  $$('.workout-select[data-workout]').forEach(card=>{
    const small=card.querySelector('small'),id=card.dataset.workout;
    if(small&&!small.querySelector?.('.x')&&!small.textContent.includes('feito ')){
      small.textContent=small.textContent.replace(/ · sequência/g,'')+` · ${tracoGymLastWorkout(id)}`;
    }
  });
};

/* PROGRESS */
const tracoGymBaseProgress=renderProgress;
renderProgress=function(){
  tracoGymBaseProgress();
  const main=document.querySelector('.perf-progress'); if(!main)return;

  const filter=main.querySelector('.select-wrap label');
  if(filter)filter.textContent='ver evolução de:';

  const level=main.querySelector('.level-chip');if(level)level.classList.add('traco-achievement-chip');
  const xpBar=main.querySelector('.xp-track i');if(xpBar)xpBar.classList.add('traco-achievement-fill');

  const baseline=main.querySelector('.baseline-chart');
  if(baseline){
    baseline.innerHTML='<div class="traco-baseline-next"><i></i><b>baseline salvo</b><small>mais um treino com carga libera a tendência.</small></div>';
  }

  const kpis=[...main.querySelectorAll('.xp-grid>div')];
  if(kpis[1]){
    const label=kpis[1].querySelector('span'),value=kpis[1].querySelector('b');
    if(label)label.textContent='exercícios com histórico';
    if(value)value.textContent=String(tracoGymExerciseHistoryCount());
  }
};

/* BODY */
const tracoGymBaseBody=renderBody;
renderBody=function(){
  tracoGymBaseBody();
  const main=document.querySelector('.perf-body'); if(!main)return;

  const head=main.querySelector('.page-head');
  if(head&&!main.querySelector('.traco-body-intro')){
    head.insertAdjacentHTML('afterend','<p class="traco-body-intro">peso e medidas mostram sua evolução fora da balança de carga. registra quando fizer sentido — sem precisar preencher tudo.</p>');
  }
  const entries=body().length;
  const chip=main.querySelector('.page-head .level-chip');
  if(chip)chip.textContent=`${entries} ${entries===1?'registro':'registros'}`;

  const status=main.querySelector('.body-blue-title small');
  if(status&&!entries){status.textContent='sem registro';status.classList.add('traco-status-badge');}
  main.querySelector('.body-empty-copy')?.remove();
};

/* SETTINGS */
const tracoGymBaseSettings=renderSettings;
renderSettings=function(){
  tracoGymBaseSettings();
  const main=document.querySelector('.perf-settings'); if(!main)return;

  const goal=$('#v60WeeklyGoal');
  if(goal){
    goal.addEventListener('input',()=>{
      if(Number(goal.value)>7){goal.value=7;toast('uma semana só tem 7 dias 😅');haptic();}
      if(goal.value!==''&&Number(goal.value)<1){goal.value=1;toast('a meta mínima é 1 dia');}
    });
  }

  if(!main.querySelector('.traco-data-support')){
    main.insertAdjacentHTML('beforeend',`<section class="form-card light compact-card traco-data-support">
      <h3>dados e suporte</h3>
      <a class="settings-row traco-settings-link" href="./privacy.html">privacidade <span>→</span></a>
      <a class="settings-row traco-settings-link" href="./terms.html">termos de uso <span>→</span></a>
      <a class="settings-row traco-settings-link" href="./support.html">suporte <span>→</span></a>
      <button class="settings-row danger" id="tracoClearAll">apagar todos os dados <span>×</span></button>
      <small class="v60-profile-note">seus dados ficam neste aparelho. exporte um backup antes de apagar ou trocar de celular.</small>
    </section>`);
    $('#tracoClearAll').onclick=tracoGymClearAll;
  }
};

/* FINISH / ACHIEVEMENTS */
const tracoGymBaseFinish=renderFinish;
renderFinish=function(){
  tracoGymBaseFinish();
  const shellEl=document.querySelector('.finish-shell');if(!shellEl)return;
  const xp=xpStats(),previous=Number(localStorage.getItem(TRACO_LAST_LEVEL_KEY)||xp.level);
  const hasPR=Boolean(state.finishSummary?.prs?.length);

  if(hasPR){shellEl.classList.add('traco-has-achievement');navigator.vibrate?.([18,28,18]);}
  if(xp.level>previous){
    shellEl.insertAdjacentHTML('afterbegin',`<div class="traco-level-up"><span>nível novo</span><b>${xp.level}</b><small>continua assim.</small></div>`);
    navigator.vibrate?.([18,35,28,35,18]);
  }
  localStorage.setItem(TRACO_LAST_LEVEL_KEY,String(xp.level));
};

render();
