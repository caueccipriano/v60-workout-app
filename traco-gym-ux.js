/*
 * Traço 2.3 — Gym UX Pass
 * Final UX layer: gym-first, fast touch targets, achievement color, clearer copy.
 * Internal v60_* storage keys remain for backwards compatibility.
 */
const TRACO_GYM_UX_VERSION='2.4.0';
const TRACO_ACHIEVEMENT='#F4C542';
const TRACO_LAST_LEVEL_KEY='traco_last_level_v1';
const TRACO_SET_ORDER_KEY='traco_set_order_v1';
const TRACO_LEGACY_WORKOUT_ORDER_KEY='traco_workout_order_v1';

function tracoGymRepairOverlayState(){
  const hasPre=Boolean(document.querySelector('#tracoPreStart'));
  const hasOrder=Boolean(document.querySelector('#tracoOrderEditor'));
  const hasPicker=Boolean(document.querySelector('#tracoExercisePicker'));
  const hasGuide=Boolean(document.querySelector('#v60GuideSheet')||document.querySelector('#v60GuideBackdrop'));
  const hasEditor=Boolean(document.querySelector('#tracoSessionEditor')||document.querySelector('#tracoBodyEditor'));
  document.body.classList.toggle('traco-prestart-open',hasPre);
  document.body.classList.toggle('traco-order-open',hasOrder);
  document.body.classList.toggle('traco-exercise-picker-open',hasPicker);
  if(!hasGuide)document.body.classList.remove('v60-guide-open');
  if(!hasEditor)document.body.classList.remove('traco-editor-open');
  if(!hasPre&&!hasOrder&&!hasPicker&&!hasGuide&&!hasEditor){
    document.body.style.overflow='';
    document.body.style.position='';
    document.body.style.height='';
    document.body.style.touchAction='';
    document.documentElement.style.overflow='';
    document.documentElement.style.height='';
    document.documentElement.style.touchAction='';
  }
}
function tracoGymClearTransientOverlays(){
  document.querySelector('#tracoPreStart')?.remove();
  document.querySelector('#tracoOrderEditor')?.remove();
  document.querySelector('#tracoExercisePicker')?.remove();
  document.body.classList.remove('traco-prestart-open','traco-order-open','traco-exercise-picker-open');
  if(!document.querySelector('#v60GuideSheet')&&!document.querySelector('#v60GuideBackdrop'))document.body.classList.remove('v60-guide-open');
  if(!document.querySelector('#tracoSessionEditor')&&!document.querySelector('#tracoBodyEditor'))document.body.classList.remove('traco-editor-open');
  for(const el of [document.documentElement,document.body]){
    el.style.removeProperty('overflow');
    el.style.removeProperty('overflow-y');
    el.style.removeProperty('position');
    el.style.removeProperty('height');
    el.style.removeProperty('touch-action');
  }
}
window.addEventListener('pageshow',()=>setTimeout(tracoGymRepairOverlayState,0));


function tracoGymQueueToken(exerciseId,setIndex){return `${exerciseId}::${setIndex}`;}
function tracoGymQueueParts(token){
  const cut=String(token).lastIndexOf('::');
  return {exerciseId:String(token).slice(0,cut),setIndex:Number(String(token).slice(cut+2))};
}
function tracoGymPlanQueue(workout){
  if(!workout)return [];
  return workout.exercises.flatMap(ex=>Array.from({length:Math.max(0,Number(ex.sets)||0)},(_,i)=>tracoGymQueueToken(ex.id,i)));
}
function tracoGymSessionQueue(session){
  if(!session)return [];
  return (session.exercises||[]).flatMap(ex=>(ex.sets||[]).map((_,i)=>tracoGymQueueToken(ex.id,i)));
}
function tracoGymSetOrders(){
  try{return JSON.parse(localStorage.getItem(TRACO_SET_ORDER_KEY)||'{}')||{};}catch{return {};}
}
function tracoGymNormalizeQueue(queue,canonical){
  const allowed=new Set(canonical),used=new Set(),next=[];
  (Array.isArray(queue)?queue:[]).forEach(token=>{
    if(allowed.has(token)&&!used.has(token)){used.add(token);next.push(token);}
  });
  canonical.forEach(token=>{if(!used.has(token))next.push(token);});
  return next;
}
function tracoGymMigrateLegacyExerciseOrder(){
  if(localStorage.getItem(TRACO_SET_ORDER_KEY))return;
  let legacy={};try{legacy=JSON.parse(localStorage.getItem(TRACO_LEGACY_WORKOUT_ORDER_KEY)||'{}')||{};}catch{}
  const migrated={};
  workoutPlan.forEach(workout=>{
    const ids=legacy[workout.id];
    if(!Array.isArray(ids)||!ids.length)return;
    const byId=new Map(workout.exercises.map(ex=>[ex.id,ex]));
    const ordered=[...ids.map(id=>byId.get(id)).filter(Boolean),...workout.exercises.filter(ex=>!ids.includes(ex.id))];
    migrated[workout.id]=ordered.flatMap(ex=>Array.from({length:Math.max(0,Number(ex.sets)||0)},(_,i)=>tracoGymQueueToken(ex.id,i)));
  });
  if(Object.keys(migrated).length)localStorage.setItem(TRACO_SET_ORDER_KEY,JSON.stringify(migrated));
}
function tracoGymPlanQueueFor(workoutId){
  const workout=workoutPlan.find(w=>w.id===workoutId);if(!workout)return [];
  const canonical=tracoGymPlanQueue(workout);
  return tracoGymNormalizeQueue(tracoGymSetOrders()[workoutId],canonical);
}
function tracoGymHasCustomSetOrder(workoutId){
  const workout=workoutPlan.find(w=>w.id===workoutId);if(!workout)return false;
  const canonical=tracoGymPlanQueue(workout);
  const saved=tracoGymSetOrders()[workoutId];
  return Array.isArray(saved)&&tracoGymNormalizeQueue(saved,canonical).join('|')!==canonical.join('|');
}
function tracoGymEnsureSessionQueue(session){
  if(!session)return [];
  const canonical=tracoGymSessionQueue(session);
  if(!Array.isArray(session.tracoSetQueue)||!session.tracoSetQueue.length){
    const planned=tracoGymPlanQueueFor(session.workoutId);
    session.tracoSetQueue=tracoGymNormalizeQueue(planned,canonical);
  }else{
    session.tracoSetQueue=tracoGymNormalizeQueue(session.tracoSetQueue,canonical);
  }
  return session.tracoSetQueue;
}
function tracoGymSetForToken(session,token){
  const {exerciseId,setIndex}=tracoGymQueueParts(token);
  const exerciseIndex=(session?.exercises||[]).findIndex(ex=>ex.id===exerciseId);
  const ex=exerciseIndex>=0?session.exercises[exerciseIndex]:null;
  const set=ex?.sets?.[setIndex];
  return {exerciseId,setIndex,exerciseIndex,ex,set};
}
function tracoGymNextQueueToken(session){
  const queue=tracoGymEnsureSessionQueue(session);
  return queue.find(token=>{
    const item=tracoGymSetForToken(session,token);
    return item.set&&!item.set.done;
  })||null;
}
function tracoGymSyncQueueCursor(session){
  if(!session)return null;
  const token=tracoGymNextQueueToken(session);
  if(!token)return null;
  const item=tracoGymSetForToken(session,token);
  if(item.exerciseIndex>=0)state.currentExercise=item.exerciseIndex;
  return {...item,token};
}
function tracoGymQueueProgress(session){
  const queue=tracoGymEnsureSessionQueue(session);
  const done=queue.filter(token=>Boolean(tracoGymSetForToken(session,token).set?.done)).length;
  return {done,total:queue.length,remaining:Math.max(0,queue.length-done)};
}
function tracoGymCloseOrderEditor(){
  document.querySelector('#tracoOrderEditor')?.remove();
  document.body.classList.remove('traco-order-open');
  tracoGymRepairOverlayState();
}
function tracoGymOrderRowMeta(source,token){
  const {exerciseId,setIndex}=tracoGymQueueParts(token);
  const ex=(source.exercises||[]).find(item=>item.id===exerciseId);
  const total=Array.isArray(ex?.sets)?ex.sets.length:Math.max(0,Number(ex?.sets)||0);
  return {ex,setIndex,total};
}
function tracoGymOpenSetOrderEditor(workoutId,{session=null}={}){
  const workout=workoutPlan.find(w=>w.id===workoutId);if(!workout)return;
  const source=session||workout;
  const canonical=session?tracoGymSessionQueue(session):tracoGymPlanQueue(workout);
  const activeQueue=session?tracoGymEnsureSessionQueue(session).slice():tracoGymPlanQueueFor(workoutId);
  const fixed=session?activeQueue.filter(token=>tracoGymSetForToken(session,token).set?.done):[];
  let ids=session?activeQueue.filter(token=>!tracoGymSetForToken(session,token).set?.done):activeQueue.slice();

  document.querySelector('#tracoOrderEditor')?.remove();
  document.body.classList.remove('traco-order-open');
  document.body.insertAdjacentHTML('beforeend',`<div class="traco-order-backdrop" id="tracoOrderEditor">
    <section class="traco-order-sheet" role="dialog" aria-modal="true" aria-label="organizar séries">
      <header class="traco-order-head">
        <div><span>${session?'fila deste treino':'ordem padrão'}</span><h3>organizar séries</h3><small>${tracoGymEsc(workout.short)}</small></div>
        <button type="button" id="tracoOrderClose" aria-label="fechar">×</button>
      </header>
      <p class="traco-order-help">${session?'as séries concluídas ficam preservadas. reorganize só o que ainda falta.':'cada linha é uma série. você pode alternar exercícios e montar superséries do seu jeito.'}</p>
      <div class="traco-order-guide"><span>↑ sobe</span><span>↓ desce</span><span>depois: salvar ordem</span></div>
      ${session&&fixed.length?`<div class="traco-order-done-note">✓ ${fixed.length} ${fixed.length===1?'série concluída':'séries concluídas'} · não entram na reorganização</div>`:''}
      <div class="traco-order-list" id="tracoOrderList"></div>
      <div class="traco-order-actions">
        <button type="button" class="traco-order-reset" id="tracoOrderReset">${session?'usar ordem salva':'restaurar original'}</button>
        <button type="button" class="cta-lime" id="tracoOrderSave">${session?'aplicar fila':'salvar ordem'}</button>
      </div>
    </section>
  </div>`);
  document.body.classList.add('traco-order-open');

  const renderRows=()=>{
    const list=$('#tracoOrderList');
    list.innerHTML=ids.map((token,i)=>{
      const {ex,setIndex,total}=tracoGymOrderRowMeta(source,token);if(!ex)return '';
      return `<article class="traco-order-row" data-order-token="${tracoGymEsc(token)}">
        <span class="traco-order-position">${String(i+1).padStart(2,'0')}</span>
        <span class="traco-order-exercise">
          <b>${tracoGymEsc(ex.name)}</b>
          <small>série ${setIndex+1} de ${total} · ${tracoGymEsc(ex.equipment||'')}</small>
        </span>
        <span class="traco-order-controls">
          <button type="button" data-order-up="${i}" aria-label="subir ${tracoGymEsc(ex.name)} série ${setIndex+1}" ${i===0?'disabled':''}>↑</button>
          <button type="button" data-order-down="${i}" aria-label="descer ${tracoGymEsc(ex.name)} série ${setIndex+1}" ${i===ids.length-1?'disabled':''}>↓</button>
        </span>
      </article>`;
    }).join('');
    $$('[data-order-up]').forEach(btn=>btn.onclick=()=>{
      const i=Number(btn.dataset.orderUp);if(i<=0)return;
      [ids[i-1],ids[i]]=[ids[i],ids[i-1]];haptic();renderRows();
    });
    $$('[data-order-down]').forEach(btn=>btn.onclick=()=>{
      const i=Number(btn.dataset.orderDown);if(i<0||i>=ids.length-1)return;
      [ids[i],ids[i+1]]=[ids[i+1],ids[i]];haptic();renderRows();
    });
  };
  renderRows();

  $('#tracoOrderClose').onclick=tracoGymCloseOrderEditor;
  $('#tracoOrderEditor').onclick=e=>{if(e.target.id==='tracoOrderEditor')tracoGymCloseOrderEditor();};
  $('#tracoOrderReset').onclick=()=>{
    if(session){
      const planned=tracoGymNormalizeQueue(tracoGymPlanQueueFor(workoutId),canonical);
      ids=planned.filter(token=>!tracoGymSetForToken(session,token).set?.done);
    }else{
      ids=canonical.slice();
    }
    haptic();renderRows();
  };
  $('#tracoOrderSave').onclick=()=>{
    if(session){
      session.tracoSetQueue=[...fixed,...ids];
      save(K.draft,session);
      tracoGymSyncQueueCursor(session);
      tracoGymCloseOrderEditor();
      toast('fila atualizada');
      haptic();
      renderSession();
      return;
    }
    const all=tracoGymSetOrders();
    if(ids.join('|')===canonical.join('|'))delete all[workoutId];else all[workoutId]=ids.slice();
    localStorage.setItem(TRACO_SET_ORDER_KEY,JSON.stringify(all));
    tracoGymCloseOrderEditor();
    toast('ordem das séries salva');
    haptic();
    if(tracoGymPreStartWorkoutId===workoutId)tracoGymOpenPreStart(workoutId);else renderWorkouts();
  };
}

tracoGymMigrateLegacyExerciseOrder();

const tracoGymBaseCurrentSetIndex=currentSetIndex;
currentSetIndex=function(ex){
  const session=state.activeSession;
  if(session?.tracoSetQueue){
    const token=tracoGymNextQueueToken(session);
    if(token){
      const item=tracoGymSetForToken(session,token);
      if(item.ex?.id===ex?.id&&Number.isInteger(item.setIndex)&&item.setIndex>=0&&item.setIndex<(ex.sets||[]).length)return item.setIndex;
    }
  }
  return tracoGymBaseCurrentSetIndex(ex);
};

let tracoGymStartBypass=false;
let tracoGymPreStartWorkoutId=null;
let tracoGymPreStartReturnPage='home';

function tracoGymPreStartQueue(workoutId){
  const workout=workoutPlan.find(w=>w.id===workoutId);if(!workout)return [];
  return tracoGymPlanQueueFor(workoutId);
}
function tracoGymPreStartRows(workoutId,limit=4){
  const workout=workoutPlan.find(w=>w.id===workoutId);if(!workout)return '';
  const queue=tracoGymPreStartQueue(workoutId);
  const source={exercises:workout.exercises};
  const visible=queue.slice(0,limit);
  const html=visible.map((token,i)=>{
    const {ex,setIndex,total}=tracoGymOrderRowMeta(source,token);
    if(!ex)return '';
    return `<div class="traco-prestart-row"><span>${String(i+1).padStart(2,'0')}</span><div><b>${tracoGymEsc(ex.name)}</b><small>série ${setIndex+1} de ${total}</small></div></div>`;
  }).join('');
  const rest=Math.max(0,queue.length-visible.length);
  return html+(rest?`<div class="traco-prestart-more">+${rest} séries depois</div>`:'');
}
function tracoGymRefreshPreStart(workoutId){
  const modal=$('#tracoPreStart');if(!modal)return;
  const list=modal.querySelector('#tracoPreStartList');
  const count=modal.querySelector('#tracoPreStartCount');
  if(list)list.innerHTML=tracoGymPreStartRows(workoutId);
  if(count){
    const workout=workoutPlan.find(w=>w.id===workoutId);
    count.textContent=`${tracoGymPreStartQueue(workoutId).length} séries · ${workout?.exercises?.length||0} exercícios`;
  }
  const badge=modal.querySelector('#tracoPreStartCustom');
  if(badge)badge.hidden=!tracoGymHasCustomSetOrder(workoutId);
}
function tracoGymClosePreStart(){
  tracoGymPreStartWorkoutId=null;
  state.page=tracoGymPreStartReturnPage||'home';
  render();
}
function tracoGymOpenPreStart(workoutId){
  const workout=workoutPlan.find(w=>w.id===workoutId);
  if(!workout)return;
  tracoGymClearTransientOverlays();
  tracoGymPreStartWorkoutId=workoutId;
  tracoGymPreStartReturnPage=state.page||'home';
  const item=typeof v60SequenceItem==='function'?v60SequenceItem(workoutId):null;
  const queueCount=tracoGymPreStartQueue(workoutId).length;
  const custom=tracoGymHasCustomSetOrder(workoutId);

  shell(`
    <section class="traco-prestart-page-inner">
      <header class="traco-prestart-head">
        <button type="button" class="traco-prestart-back" id="tracoPreStartClose" aria-label="voltar">←</button>
        <div><span>antes de começar</span><h3>Treino ${tracoGymEsc(item?.letter||'')} · ${tracoGymEsc(workout.short)}</h3><small id="tracoPreStartCount">${queueCount} séries · ${workout.exercises.length} exercícios</small></div>
      </header>
      <div class="traco-prestart-tip"><b>ordem de hoje</b><small>confere as primeiras séries. quer mudar? organiza agora — ou durante o treino em “fila do treino”.</small></div>
      <div class="traco-prestart-custom" id="tracoPreStartCustom" ${custom?'':'hidden'}>✓ ordem personalizada ativa</div>
      <div class="traco-prestart-list" id="tracoPreStartList">${tracoGymPreStartRows(workoutId)}</div>
      <button type="button" class="traco-prestart-organize" id="tracoPreStartOrganize">
        <span><b>ajustar ordem das séries</b><small>mover qualquer série antes de começar</small></span><i>↕</i>
      </button>
      <button type="button" class="cta-lime traco-prestart-go" id="tracoPreStartGo">começar assim</button>
    </section>
  `,{showNav:false,classes:'traco-prestart-page'});

  $('#tracoPreStartClose').onclick=tracoGymClosePreStart;
  $('#tracoPreStartOrganize').onclick=()=>tracoGymOpenSetOrderEditor(workoutId);
  $('#tracoPreStartGo').onclick=()=>{
    tracoGymDirectStart(workoutId);
  };
}

const tracoGymBaseStartSession=startSession;
function tracoGymDirectStart(workoutId){
  try{
    tracoGymClearTransientOverlays();
    tracoGymPreStartWorkoutId=null;
    return tracoGymBaseStartSession(workoutId);
  }catch(error){
    console.error('Traço workout start failed',error);
    // The base start can create/render the session before a secondary enhancement throws.
    // If the session is already active, keep it open and do not show a false start failure.
    if(state.activeSession&&state.activeSession.workoutId===workoutId){
      state.page='session';
      try{tracoGymRepairOverlayState();}catch(repairError){console.error('Traço overlay repair failed',repairError);}
      return state.activeSession;
    }
    toast('não consegui abrir o treino · tenta de novo');
    try{tracoGymRepairOverlayState();}catch(repairError){console.error('Traço overlay repair failed',repairError);}
    return null;
  }
}
// Keep workout entry deterministic on iPhone/PWA. The pre-start organizer remains
// available from the workout queue, but must never sit in front of session creation.
startSession=tracoGymDirectStart;

/* HOME */
const tracoGymBaseHome=renderHome;
renderHome=function(){
  tracoGymBaseHome();
  const main=document.querySelector('.perf-home'); if(!main)return;
  const xp=xpStats();
  const homeWorkout=typeof v60RecommendedWorkout==='function'?v60RecommendedWorkout():todayWorkout();
  const draft=load(K.draft,null);
  if($('#startToday'))$('#startToday').onclick=()=>startSession(homeWorkout.id);
  if($('#resumeWorkout')&&draft)$('#resumeWorkout').onclick=()=>tracoGymDirectStart(draft.workoutId);

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

function tracoGymExerciseStatus(session,ex){
  const done=(ex.sets||[]).filter(set=>set.done).length;
  const total=(ex.sets||[]).length;
  return {done,total,complete:total>0&&done>=total,remaining:Math.max(0,total-done)};
}
function tracoGymMoveExerciseNext(session,exerciseId){
  const queue=tracoGymEnsureSessionQueue(session).slice();
  const doneTokens=queue.filter(token=>tracoGymSetForToken(session,token).set?.done);
  const remaining=queue.filter(token=>!tracoGymSetForToken(session,token).set?.done);
  const chosen=remaining.filter(token=>tracoGymQueueParts(token).exerciseId===exerciseId);
  const other=remaining.filter(token=>tracoGymQueueParts(token).exerciseId!==exerciseId);
  if(!chosen.length)return false;
  session.tracoSetQueue=[...doneTokens,...chosen,...other];
  save(K.draft,session);
  tracoGymSyncQueueCursor(session);
  return true;
}
function tracoGymCloseExercisePicker(){
  $('#tracoExercisePicker')?.remove();
  document.body.classList.remove('traco-exercise-picker-open');
  tracoGymRepairOverlayState();
}
function tracoGymOpenExercisePicker(){
  const session=state.activeSession;if(!session)return;
  $('#tracoExercisePicker')?.remove();
  document.body.classList.add('traco-exercise-picker-open');
  const current=session.exercises[state.currentExercise];
  document.body.insertAdjacentHTML('beforeend',`<div class="traco-exercise-picker-backdrop" id="tracoExercisePicker">
    <section class="traco-exercise-picker-sheet" role="dialog" aria-modal="true" aria-label="treino de hoje">
      <header class="traco-exercise-picker-head">
        <div><span>treino em andamento</span><h3>treino de hoje</h3><small>toque no exercício que você quer fazer agora</small></div>
        <button type="button" id="tracoExercisePickerClose" aria-label="fechar">×</button>
      </header>
      <div class="traco-exercise-picker-list">
        ${session.exercises.map((ex,i)=>{
          const st=tracoGymExerciseStatus(session,ex);
          const active=ex.id===current?.id;
          return `<button type="button" class="traco-exercise-choice ${active?'is-current':''} ${st.complete?'is-complete':''}" data-pick-exercise="${tracoGymEsc(ex.id)}" ${st.complete?'disabled':''}>
            <span class="traco-exercise-choice-index">${String(i+1).padStart(2,'0')}</span>
            <span class="traco-exercise-choice-copy"><b>${tracoGymEsc(ex.name)}</b><small>${st.complete?'concluído':`${st.remaining} de ${st.total} séries restantes`}</small></span>
            <span class="traco-exercise-choice-state">${st.complete?'✓':active?'agora':'→'}</span>
          </button>`;
        }).join('')}
      </div>
      <button type="button" class="traco-exercise-picker-queue" id="tracoExercisePickerQueue">organizar fila completa ↕</button>
    </section>
  </div>`);
  $('#tracoExercisePickerClose').onclick=tracoGymCloseExercisePicker;
  $('#tracoExercisePicker').onclick=e=>{if(e.target.id==='tracoExercisePicker')tracoGymCloseExercisePicker();};
  $$('[data-pick-exercise]').forEach(btn=>btn.onclick=()=>{
    const id=btn.dataset.pickExercise;
    if(!tracoGymMoveExerciseNext(session,id))return toast('esse exercício já terminou');
    tracoGymCloseExercisePicker();
    toast('exercício selecionado');
    haptic();
    renderSession();
  });
  $('#tracoExercisePickerQueue').onclick=()=>{
    tracoGymCloseExercisePicker();
    tracoGymOpenSetOrderEditor(session.workoutId,{session});
  };
}

/* ACTIVE WORKOUT */
const tracoGymBaseSession=renderSession;
renderSession=function(){
  if(state.activeSession){
    try{
      tracoGymEnsureSessionQueue(state.activeSession);
      tracoGymSyncQueueCursor(state.activeSession);
      save(K.draft,state.activeSession);
    }catch(error){
      console.error('Traço session queue init failed',error);
      delete state.activeSession.tracoSetQueue;
    }
  }
  tracoGymBaseSession();
  const main=document.querySelector('.perf-session');if(!main||!state.activeSession)return;
  main.setAttribute('data-traco-gym-version','2.4.1');
  const session=state.activeSession;
  const ex=session.exercises[state.currentExercise];
  const media=main.querySelector('.perf-media-block');
  if(media){
    media.innerHTML=`<div class="perf-media-heading"><span>execução</span><b>sem distração no treino</b></div>${typeof v60GuidePreview==='function'?v60GuidePreview(ex):''}`;
    if($('#openExerciseGuide'))$('#openExerciseGuide').onclick=()=>v60ShowGuide(ex);
  }
  const back=$('#sessionBack'),close=$('#cancelSession');
  if(back){back.classList.add('traco-session-nav');back.setAttribute('aria-label','voltar um exercício');back.insertAdjacentHTML('beforeend','<small>anterior</small>');}
  if(close){close.classList.add('traco-session-nav');close.setAttribute('aria-label','sair e cancelar treino');close.insertAdjacentHTML('beforeend','<small>sair</small>');}
  document.querySelectorAll('.perf-value-panel button').forEach(btn=>btn.classList.add('traco-gym-stepper'));
  const activeSet=ex?.sets?.[currentSetIndex(ex)];
  document.querySelectorAll('.perf-value-panel [data-adjust]').forEach(btn=>btn.onclick=()=>{
    const [kind,raw]=String(btn.dataset.adjust||'').split(':'),delta=Number(raw);
    const input=kind==='weight'?$('#weightInput'):$('#repsInput');
    if(!input||!activeSet||!Number.isFinite(delta))return;
    const step=kind==='weight'?0.5:1,current=Number(input.value||0);
    const next=Math.max(0,Math.round((current+delta)/step)*step);
    input.value=kind==='weight'?String(Number(next.toFixed(1))):String(Math.round(next));
    activeSet[kind]=input.value;save(K.draft,session);
    input.dispatchEvent(new Event('input',{bubbles:true}));haptic();
  });

  const progress=main.querySelector('.perf-session-progress');
  const nativeList=main.querySelector('#perfNativeExerciseList');
  if(progress){
    const doneExercises=session.exercises.filter(item=>tracoGymExerciseStatus(session,item).complete).length;
    progress.classList.add('traco-progress-visible');
    const label=progress.querySelector('small');if(label)label.textContent=`${doneExercises} / ${session.exercises.length} exercícios`;
  }
  if(nativeList){
    nativeList.querySelectorAll('[data-native-exercise-index]').forEach(btn=>btn.onclick=()=>{
      const next=Number(btn.dataset.nativeExerciseIndex),item=session.exercises[next];
      if(!item||!tracoGymMoveExerciseNext(session,item.id))return;
      haptic();renderSession();
    });
    const header=nativeList.querySelector('header');
    if(header&&!nativeList.querySelector('#tracoV241EditOrder'))header.insertAdjacentHTML('beforeend','<button type="button" id="tracoV241EditOrder">editar ordem</button>');
    const edit=$('#tracoV241EditOrder');if(edit)edit.onclick=()=>tracoGymOpenSetOrderEditor(session.workoutId,{session});
  }
  tracoGymRepairOverlayState();
};

const tracoGymBaseCompleteSet=completeCurrentSet;
completeCurrentSet=function(){
  const s=state.activeSession,ex=s?.exercises?.[state.currentExercise],si=ex?currentSetIndex(ex):-1,set=si>=0?ex.sets[si]:null;
  const usesLoad=typeof tracoExerciseUsesLoad==='function'?tracoExerciseUsesLoad(ex):true;
  if(!set||!set.reps||(usesLoad&&!set.weight)){tracoGymBaseCompleteSet();return;}
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

  const selectedForStart=workoutPlan.find(w=>w.id===(state.selectedWorkout||(typeof v60RecommendedWorkout==='function'?v60RecommendedWorkout().id:todayWorkout().id)));
  if($('#startSelected')&&selectedForStart)$('#startSelected').onclick=()=>tracoGymDirectStart(selectedForStart.id);

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

  const selectedId=state.selectedWorkout||(typeof v60RecommendedWorkout==='function'?v60RecommendedWorkout().id:todayWorkout().id);
  const selected=workoutPlan.find(w=>w.id===selectedId);
  const block=main.querySelector('.selected-block');
  if(block&&selected&&!block.querySelector('.traco-organize-exercises')){
    const preview=block.querySelector('.exercise-preview');
    preview?.insertAdjacentHTML('beforebegin',`<button type="button" class="traco-organize-exercises" id="tracoOrganizeExercises">
      <span><b>editar ordem padrão</b><small>${tracoGymHasCustomSetOrder(selected.id)?'ordem personalizada ativa':'define como este treino abre por padrão'}</small></span>
      <i>↕</i>
    </button>`);
    $('#tracoOrganizeExercises').onclick=()=>tracoGymOpenSetOrderEditor(selected.id);
  }
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

tracoGymRepairOverlayState();
tracoGymClearTransientOverlays();
tracoGymClearTransientOverlays();
tracoGymRepairOverlayState();
render();
