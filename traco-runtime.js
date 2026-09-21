/*
 * Traço Runtime 1.0
 * Bootstrap final: garante módulos visíveis, recuperação de treino e atualização do PWA.
 */
(function(){
  'use strict';

  const VERSION='1.4.0';
  const BUILD='render-wrapper-cleanup-v311';
  const BUILD_NUMBER='311';
  let reloading=false;

  const qs=s=>document.querySelector(s);
  const esc=v=>String(v==null?'':v).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[ch]));
  function localDateKey(value=Date.now()){
    const d=value instanceof Date?value:new Date(Number(value)||value);
    return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
  }
  function todaySessions(){
    const key=localDateKey();
    return sessions().filter(s=>s.finishedAt&&localDateKey(s.startedAt)===key).sort((a,b)=>b.startedAt-a.startedAt);
  }
  function activeDraft(){
    const d=load(K.draft,null);
    return d&&!d.finishedAt?d:null;
  }
  function draftToday(){
    const d=activeDraft();
    return d&&localDateKey(d.startedAt)===localDateKey()?d:null;
  }
  function completion(draft){
    const sets=(draft?.exercises||[]).flatMap(ex=>ex.sets||[]);
    if(!sets.length)return {done:0,total:0,pct:0,complete:false};
    const done=sets.filter(s=>s.done).length;
    return {done,total:sets.length,pct:Math.round(done/sets.length*100),complete:done===sets.length};
  }
  function hasDuplicate(draft){
    const key=localDateKey(draft.startedAt);
    return sessions().some(s=>s.finishedAt&&s.workoutId===draft.workoutId&&localDateKey(s.startedAt)===key);
  }

  function recoverCompletedDraft(){
    const draft=draftToday();if(!draft)return false;
    const progress=completion(draft);if(!progress.complete)return false;
    if(hasDuplicate(draft)){
      localStorage.removeItem(K.draft);
      return true;
    }
    if(sessionStorage.getItem('traco_runtime_recovered_'+draft.id)==='1')return false;
    sessionStorage.setItem('traco_runtime_recovered_'+draft.id,'1');
    state.activeSession=typeof hydrateDraft==='function'?hydrateDraft(draft):draft;
    try{
      finishSession();
      return true;
    }catch(e){
      state.activeSession=null;
      return false;
    }
  }

  function todayStatusMarkup(){
    const finished=todaySessions(),draft=activeDraft();
    if(finished.length){
      const s=finished[0],mins=Math.max(1,Math.round(Number(s.duration||0)/60));
      const volume=typeof volumeOfSession==='function'?volumeOfSession(s):0;
      return '<section class="runtime-today-status is-done" id="runtimeTodayStatus"><div><span>HOJE · REGISTRADO</span><h3>'+esc(s.wName||s.name||'treino concluído')+'</h3><small>'+mins+' min'+(volume?' · '+formatLoad(volume):'')+'</small></div><b>✓</b></section>';
    }
    if(draft){
      const p=completion(draft);
      return '<section class="runtime-today-status is-draft" id="runtimeTodayStatus"><div><span>'+(localDateKey(draft.startedAt)===localDateKey()?'HOJE · EM ANDAMENTO':'TREINO PENDENTE')+'</span><h3>'+esc(draft.wName||'treino atual')+'</h3><small>'+p.done+'/'+p.total+' séries · '+p.pct+'%</small></div><button id="runtimeResumeToday">continuar</button></section>';
    }
    return '';
  }

  function fallbackFoodMarkup(){
    if(qs('#tracoDailyHome'))return '';
    const g=window.TracoBodyCoach?.guidance?.();
    if(!g)return '';
    return '<section class="runtime-food-home" id="runtimeFoodHome"><span>EVITE / LIMITE HOJE</span><h3>'+g.limit.map(esc).join(' · ')+'</h3><p>'+esc(g.note||'')+'</p><button id="runtimeFoodOpen">ver alimentação</button></section>';
  }

  async function photoMiniMarkup(){
    const mount=qs('#runtimePhotoMount');if(!mount)return;
    try{
      const req=indexedDB.open('traco_photo_checkins_v1',1);
      const db=await new Promise((resolve,reject)=>{req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);req.onupgradeneeded=()=>{};});
      const rows=await new Promise((resolve,reject)=>{
        const tx=db.transaction('checkins','readonly'),r=tx.objectStore('checkins').getAll();
        r.onsuccess=()=>resolve(r.result||[]);r.onerror=()=>reject(r.error);
      });
      const valid=rows.filter(r=>r.front&&r.side&&r.back).sort((a,b)=>String(a.date||'').localeCompare(String(b.date||'')));
      let title='faça seu primeiro check-in',sub='frente · perfil · costas';
      if(valid.length){
        const latest=valid[valid.length-1],due=new Date(latest.date+'T12:00:00');due.setDate(due.getDate()+14);
        const now=new Date();now.setHours(12,0,0,0);
        const days=Math.ceil((due-now)/86400000);
        if(days<=0){title='hoje é dia das fotos';sub='check-in quinzenal vencido';}
        else if(days===1){title='fotos amanhã';sub='mantenha luz, distância e pose';}
        else{title='fotos em '+days+' dias';sub='próxima referência · '+due.toLocaleDateString('pt-BR');}
      }
      mount.innerHTML='<section class="runtime-photo-home"><div><span>CHECK-IN QUINZENAL</span><h3>'+esc(title)+'</h3><small>'+esc(sub)+'</small></div><button id="runtimePhotoOpen">abrir</button></section>';
      qs('#runtimePhotoOpen').onclick=()=>{state.page='photos';render();};
    }catch{
      mount.innerHTML='<section class="runtime-photo-home"><div><span>CHECK-IN QUINZENAL</span><h3>a cada 14 dias</h3><small>frente · perfil · costas</small></div><button id="runtimePhotoOpen">abrir</button></section>';
      qs('#runtimePhotoOpen').onclick=()=>{state.page='photos';render();};
    }
  }

  function decorateHome(){
    const main=qs('.home-card');if(!main)return;
    qs('#runtimeTodayStatus')?.remove();
    qs('#runtimeFoodHome')?.remove();
    qs('#runtimePhotoMount')?.remove();

    const today=main.querySelector('.perf-workout-hero, .today-card');
    const status=todayStatusMarkup();
    if(today&&status)today.insertAdjacentHTML('afterend',status);

    const bodyDaily=qs('#tracoDailyHome');
    if(bodyDaily){
      bodyDaily.insertAdjacentHTML('afterend','<div id="runtimePhotoMount"></div>');
    }else{
      const food=fallbackFoodMarkup();
      const anchorBase=today||main.querySelector('.perf-greeting')||main.firstElementChild;
      if(food&&anchorBase)anchorBase.insertAdjacentHTML('afterend',food);
      const anchor=qs('#runtimeFoodHome')||qs('#runtimeTodayStatus')||anchorBase;
      if(anchor)anchor.insertAdjacentHTML('afterend','<div id="runtimePhotoMount"></div>');
      else main.insertAdjacentHTML('beforeend','<div id="runtimePhotoMount"></div>');
    }

    const resume=qs('#runtimeResumeToday');
    if(resume)resume.onclick=()=>{
      const d=activeDraft();if(!d)return;
      state.activeSession=typeof hydrateDraft==='function'?hydrateDraft(d):d;
      state.page='session';
      state.currentExercise=Math.max(0,(state.activeSession.exercises||[]).findIndex(ex=>(ex.sets||[]).some(s=>!s.done)));
      renderSession();
    };
    const foodOpen=qs('#runtimeFoodOpen');
    if(foodOpen)foodOpen.onclick=()=>{state.page='food';render();};
    photoMiniMarkup();
  }

  function decorateSettings(){
    const about=qs('.traco-about-card');if(about){
      const img=about.querySelector('img');if(img)img.src='./assets/icon.svg?v='+BUILD_NUMBER;
      const small=about.querySelector('small');if(small)small.textContent='treino · evolução · constância · versão 2.5.4';
    }
    const main=qs('.settings-page');
    if(main&&!qs('#runtimeBuildCard')){
      main.insertAdjacentHTML('beforeend','<section class="runtime-build-card" id="runtimeBuildCard"><span>APP ATUALIZADO</span><h3>build '+BUILD_NUMBER+'</h3><p>alimentação · fotos quinzenais · treino de hoje · descanso em background</p><button id="runtimeRefreshApp">verificar atualização</button></section>');
      qs('#runtimeRefreshApp').onclick=()=>refreshPwa(true);
    }
  }

  function decorateBody(){
    const main=qs('.body-page');if(!main)return;
    if(!qs('.traco-food-limits')&&window.TracoBodyCoach?.guidance){
      const g=window.TracoBodyCoach.guidance();
      const html='<section class="runtime-food-body"><span>EVITE / LIMITE HOJE</span><h3>'+g.limit.map(esc).join(' · ')+'</h3><p>'+esc(g.note||'')+'</p></section>';
      main.insertAdjacentHTML('afterbegin',html);
    }
  }

  // Runtime decoration is applied by one guarded observer instead of
  // monkey-patching core render functions. This avoids wrapper stacking with
  // Gym UX / UX Polish while keeping the module backwards-compatible.
  let decorateScheduled=false;
  function decorateCurrentPage(){
    if(state.page==='home')decorateHome();
    else if(state.page==='settings')decorateSettings();
    else if(state.page==='body')decorateBody();
  }
  function scheduleDecoration(){
    if(decorateScheduled)return;
    decorateScheduled=true;
    requestAnimationFrame(()=>{decorateScheduled=false;decorateCurrentPage();});
  }
  const runtimeApp=qs('#app');
  if(runtimeApp)new MutationObserver(scheduleDecoration).observe(runtimeApp,{childList:true,subtree:false});

  async function refreshPwa(manual=false){
    if(!('serviceWorker' in navigator))return;
    try{
      const reg=await navigator.serviceWorker.getRegistration();
      if(reg)await reg.update();
      const res=await fetch('./version.json?ts='+Date.now(),{cache:'no-store'});
      if(!res.ok)return;
      const remote=await res.json();
      const remoteBuild=String(remote.build||'');
      if(remoteBuild&&remoteBuild!==BUILD&&!reloading){
        reloading=true;
        const key='traco_runtime_reload_'+remoteBuild;
        if(sessionStorage.getItem(key)!=='1'){
          sessionStorage.setItem(key,'1');
          location.replace('./?update='+Date.now());
          return;
        }
      }
      if(manual)toast('Traço está no build '+BUILD_NUMBER);
    }catch{
      if(manual)toast('não consegui verificar agora');
    }
  }

  let controllerReloaded=false;
  navigator.serviceWorker?.addEventListener?.('controllerchange',()=>{
    if(controllerReloaded)return;
    controllerReloaded=true;
    location.reload();
  });

  function boot(){
    const recovered=recoverCompletedDraft();
    if(!recovered){
      try{render();}catch{}
    }
    setTimeout(()=>{
      if(state.page==='home')decorateHome();
      if(state.page==='settings')decorateSettings();
      if(state.page==='body')decorateBody();
    },60);
    refreshPwa(false);
  }

  window.TracoRuntime={version:VERSION,build:BUILD_NUMBER,recoverCompletedDraft,refreshPwa};
  document.documentElement.dataset.tracoRuntime=VERSION;
  setTimeout(boot,25);
})();