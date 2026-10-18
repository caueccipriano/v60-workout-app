/*
 * Traço Simple / V-Shape 1.0
 * Presentation + read-only progress + opt-in 12-week program.
 * Preserves workoutPlan, all stored sessions, drafts, body stats and photo vault.
 */
(function(){
  'use strict';
  const KEY='traco_vshape_90_v1';
  const VERSION='1.0.0';
  const phases=[
    {label:'Base',range:'Semanas 1–4',detail:'Aprenda os movimentos, registre suas cargas e mantenha cerca de 2–3 repetições em reserva. Priorize constância e amplitude confortável.'},
    {label:'Progressão',range:'Semanas 5–8',detail:'Tente evoluir repetições ou carga aos poucos, sem sacrificar a técnica. Em geral, termine com 1–2 repetições em reserva.'},
    {label:'Consolidação',range:'Semanas 9–12',detail:'Sustente a força e a regularidade. Cardio moderado pode ajudar o condicionamento; a cintura muda com a composição corporal geral, não com perda localizada.'}
  ];
  const q=s=>document.querySelector(s);
  const esc=x=>String(x==null?'':x).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const isoLocal=(date=new Date())=>date.getFullYear()+'-'+String(date.getMonth()+1).padStart(2,'0')+'-'+String(date.getDate()).padStart(2,'0');
  const dayNumber=key=>{if(!/^\d{4}-\d{2}-\d{2}$/.test(String(key)))return null;const a=key.split('-').map(Number),d=new Date(a[0],a[1]-1,a[2]);return d.getFullYear()===a[0]&&d.getMonth()===a[1]-1&&d.getDate()===a[2]?Date.UTC(a[0],a[1]-1,a[2])/86400000:null;};
  function getProgram(){
    try {
      const p=JSON.parse(localStorage.getItem(KEY)||'null');
      return p&&dayNumber(p.start)!==null?{start:p.start}:null;
    }catch{return null;}
  }
  function programStatus(now=new Date()){
    const p=getProgram();
    if(!p)return {started:false,week:0,phase:0,pct:0,done:false};
    const diff=Math.floor(dayNumber(isoLocal(now))-dayNumber(p.start));
    const elapsed=Math.max(0,diff);
    const done=elapsed>=84;
    const week=Math.min(12,Math.floor(elapsed/7)+1);
    return {started:true,start:p.start,week,phase:Math.min(2,Math.floor((week-1)/4)),pct:Math.min(100,Math.round(elapsed/84*100)),done};
  }
  function setProgram(){
    try{
      localStorage.setItem(KEY,JSON.stringify({start:isoLocal(),createdAt:Date.now(),schema:1}));
      return true;
    }catch{
      if(typeof toast==='function')toast('não foi possível salvar o programa');
      return false;
    }
  }
  function go(page){
    if(typeof state==='undefined'||typeof render!=='function')return;
    state.page=page;
    render();
  }
  function recommendation(){
    try{return typeof v60RecommendedWorkout==='function'?v60RecommendedWorkout():todayWorkout();}
    catch{return typeof workoutPlan!=='undefined'?workoutPlan[0]:null;}
  }
  function latestMeasurements(){
    try{
      const rows=typeof body==='function'?body():[];
      return rows.filter(x=>x&&x.date).sort((a,b)=>String(b.date).localeCompare(String(a.date)))[0]||null;
    }catch{return null;}
  }
  function monthSessions(){
    try{
      const now=Date.now();
      return sessions().filter(s=>s&&s.finishedAt&&Number(s.startedAt)>now-28*86400000&&Number(s.startedAt)<=now).length;
    }catch{return 0;}
  }
  function programWorkoutCount(){
    try{
      const p=getProgram();
      if(!p)return 0;
      const a=dayNumber(p.start),b=dayNumber(isoLocal());
      return sessions().filter(s=>{
        if(!s||!s.finishedAt)return false;
        const n=dayNumber(isoLocal(new Date(Number(s.startedAt))));
        return n!==null&&n>=a&&n<=b;
      }).length;
    }catch{return 0;}
  }
  function stat(label,value){return '<article class="simple-stat"><b>'+esc(value)+'</b><span>'+esc(label)+'</span></article>';}
  function phaseCard(){
    const p=programStatus();
    if(!p.started){
      return '<section class="simple-program"><div class="simple-program-top"><strong>Seu V-Shape</strong><span>12 semanas</span></div><p>Uma jornada em três fases, usando seus treinos A–E. Comece quando quiser; seus registros atuais continuam intactos.</p><div class="simple-program-foot"><small>Sem contagem iniciada</small><button class="simple-quiet-button" data-simple-action="program">ver programa →</button></div></section>';
    }
    const ph=phases[p.phase];
    return '<section class="simple-program"><div class="simple-program-top"><strong>'+esc(p.done?'12 semanas completas':'Semana '+p.week+' de 12')+'</strong><span>'+esc(ph.label)+'</span></div><p>'+esc(p.done?'Você completou o período planejado. Continue treinando e compare sua evolução.':ph.detail)+'</p><div class="simple-program-meter" aria-label="'+p.pct+'% do período"><i style="width:'+p.pct+'%"></i></div><div class="simple-program-foot"><small>'+programWorkoutCount()+' sessões registradas no período</small><button class="simple-quiet-button" data-simple-action="program">ver fases →</button></div></section>';
  }
  function home(){
    const main=q('.perf-home');
    if(!main||main.querySelector('.simple-home'))return;
    main.classList.add('traco-simple-home');
    const w=recommendation();
    const profile=typeof v60Profile==='function'?v60Profile():null;
    const first=String(profile?.name||'').trim().split(/\s+/)[0];
    const name=first?' '+esc(first.toLowerCase()):'';
    const p=document.createElement('div');
    p.className='simple-home';
    p.innerHTML='<header class="simple-lead"><span class="simple-kicker">SEU TREINO, SEM DISTRAÇÕES</span><h1>Vai de V.</h1><p>'+esc('Olá'+(name?', '+first.toLowerCase():''))+'! Um treino de cada vez. O importante é conseguir repetir amanhã.</p></header>'+
      phaseCard()+
      '<div class="simple-workout-caption">SEU PRÓXIMO TREINO'+(w?' · '+esc(w.short):'')+'</div>'+
      '<div class="simple-home-actions"><button data-simple-go="workouts">Ver ficha completa<span>Treinos A–E</span></button><button data-simple-go="body">Registrar medidas<span>Cintura e peso</span></button></div>';
    const hero=main.querySelector('.perf-workout-hero');
    if(hero)hero.insertAdjacentElement('beforebegin',p);
    else (main.querySelector('.perf-topbar')||main).insertAdjacentElement('afterend',p);
    main.querySelectorAll('[data-simple-go]').forEach(btn=>btn.addEventListener('click',()=>go(btn.dataset.simpleGo)));
    main.querySelectorAll('[data-simple-action="program"]').forEach(btn=>btn.addEventListener('click',openProgram));
    if(hero){
      hero.setAttribute('aria-label','Iniciar próximo treino: '+(w?.short||''));
      const cta=hero.querySelector('.perf-start-cta b');
      if(cta)cta.textContent='Iniciar treino';
      const duration=hero.querySelector('.perf-hero-copy small');
      if(duration)duration.textContent=(w?.exercises?.length||0)+' exercícios · duração variável';
    }
  }
  function progress(){
    const main=q('.perf-progress')||q('.progress-page');
    if(!main||main.querySelector('.simple-progress'))return;
    main.classList.add('traco-simple-progress');
    const m=latestMeasurements(),p=programStatus(),count=monthSessions();
    const weight=m?.weight?String(m.weight).replace('.',',')+' kg':'—';
    const waist=m?.waist?String(m.waist).replace('.',',')+' cm':'—';
    const panel=document.createElement('section');
    panel.className='simple-progress';
    panel.innerHTML='<header class="simple-progress-intro"><span class="simple-kicker">SEU CAMINHO</span><h3>Evolução de verdade.</h3><p>O que você registrou, sem números inventados. Acompanhe força, medidas e regularidade.</p></header>'+
      '<div class="simple-stat-grid">'+stat('Treinos · últimos 28 dias',count)+stat('Programa V-Shape',p.started?(p.done?'12/12':p.week+'/12'):'Não iniciado')+stat('Último peso',weight)+stat('Última cintura',waist)+'</div>'+
      '<div class="simple-links"><button data-simple-go="history"><span>Histórico e cargas</span><span>→</span></button><button data-simple-go="body"><span>Medidas do corpo</span><span>→</span></button><button data-simple-go="photos"><span>Fotos de evolução</span><span>→</span></button><button data-simple-go="settings"><span>Ajustes e backups</span><span>→</span></button><button data-simple-action="details"><span>Ver análises avançadas</span><span>→</span></button></div>'+
      '<p class="simple-progress-foot">Sem sincronização automática entre aparelhos: seu histórico continua salvo neste dispositivo. Exporte o backup em Ajustes.</p>';
    const head=main.querySelector('.page-head');
    if(head)head.insertAdjacentElement('afterend',panel);else main.prepend(panel);
    panel.querySelectorAll('[data-simple-go]').forEach(btn=>btn.addEventListener('click',()=>go(btn.dataset.simpleGo)));
    panel.querySelector('[data-simple-action="details"]')?.addEventListener('click',()=>{
      main.classList.toggle('traco-detail-view');
      const open=main.classList.contains('traco-detail-view');
      panel.querySelector('[data-simple-action="details"] span')?.replaceChildren(document.createTextNode(open?'Ocultar análises avançadas':'Ver análises avançadas'));
    });
  }
  function session(){
    const main=q('.perf-session');
    if(!main)return;
    main.classList.add('traco-simple-session');
    const box=main.querySelector('.perf-exercise-console');
    if(!box||box.querySelector('.simple-target'))return;
    const ex=state?.activeSession?.exercises?.[state.currentExercise];
    if(!ex)return;
    const phase=programStatus();
    const plan=(Number(ex.min)||8)+'–'+(Number(ex.max)||12)+' repetições por série';
    const advice=phase.started&&!phase.done?' · '+(phase.phase===0?'2–3 reps em reserva':'1–2 reps em reserva'):'';
    const hint=document.createElement('p');
    hint.className='simple-target';
    hint.textContent='Meta: '+plan+advice+'. Priorize a execução.';
    const inputs=box.querySelector('.perf-inputs');
    if(inputs)inputs.insertAdjacentElement('beforebegin',hint);else box.prepend(hint);
  }
  function openProgram(){
    q('#simpleProgramSheet')?.remove();
    const p=programStatus(),modal=document.createElement('div');
    modal.className='simple-sheet';modal.id='simpleProgramSheet';
    modal.setAttribute('role','dialog');modal.setAttribute('aria-modal','true');modal.setAttribute('aria-label','Programa V-Shape de 12 semanas');
    modal.innerHTML='<div class="simple-sheet-panel"><header class="simple-sheet-head"><div><span class="simple-kicker">TRAÇO · V-SHAPE</span><h2>12 semanas.<br>Um treino de cada vez.</h2></div><button type="button" data-simple-close aria-label="Fechar">×</button></header>'+
      '<p class="simple-sheet-note">Plano autoral de acompanhamento; não reproduz o curso pago de Renato Cariani. Mantém sua ficha de cinco treinos, priorizando dorsal, deltoides e evolução gradual.</p>'+
      '<ol class="simple-phase-list">'+phases.map(ph=>'<li><b>'+esc(ph.range+' · '+ph.label)+'</b><p>'+esc(ph.detail)+'</p></li>').join('')+'</ol>'+
      '<p class="simple-sheet-note">Progrida quando atingir o topo das repetições com boa técnica. Em dias corridos, não é necessário bater recordes. Descanse e ajuste cargas conforme seu nível.</p>'+
      '<div class="simple-sheet-actions">'+(!p.started?'<button type="button" class="simple-primary" data-simple-start>Começar meu programa hoje</button>':p.done?'<button type="button" data-simple-restart>Iniciar um novo ciclo</button>':'<button type="button" data-simple-restart>Recomeçar ciclo do zero</button>')+'<button type="button" data-simple-close>Voltar ao app</button></div></div>';
    const close=()=>{modal.remove();document.removeEventListener('keydown',onKey);};
    const onKey=e=>{if(e.key==='Escape')close();};
    modal.addEventListener('click',e=>{if(e.target===modal)close();});
    modal.querySelectorAll('[data-simple-close]').forEach(btn=>btn.addEventListener('click',close));
    modal.querySelector('[data-simple-start]')?.addEventListener('click',()=>{if(setProgram()){close();render();}});
    modal.querySelector('[data-simple-restart]')?.addEventListener('click',()=>{
      if(!confirm('Recomeçar a contagem de 12 semanas? Seus treinos, fotos e medidas não serão apagados.'))return;
      if(setProgram()){close();render();}
    });
    document.body.appendChild(modal);
    document.addEventListener('keydown',onKey);
    modal.querySelector('[data-simple-close]')?.focus();
  }
  function newNav(){
    const opts=[['home','home','Hoje'],['workouts','play','Treinar'],['progress','chart','Evolução']];
    return '<nav class="bottom-nav perf-bottom-nav simple-bottom-nav" aria-label="Navegação principal">'+opts.map(item=>{
      const selected=state.page===item[0]||(item[0]==='progress'&&['history','body','photos'].includes(state.page));
      return '<button type="button" class="nav-btn '+(selected?'active':'')+'" data-nav="'+item[0]+'" aria-label="'+item[2]+'"'+(selected?' aria-current="page"':'')+'><span class="ico">'+iconSvg(item[1])+'</span><span>'+item[2]+'</span></button>';
    }).join('')+'</nav>';
  }
  function navRepair(){
    const old=q('#app .bottom-nav');
    if(!old||old.classList.contains('simple-bottom-nav'))return;
    old.outerHTML=newNav();
    if(typeof bindCommon==='function')bindCommon();
  }
  let queued=false;
  function apply(){
    queued=false;
    if(typeof state==='undefined')return;
    navRepair();
    if(state.page==='home')home();
    else if(state.page==='progress')progress();
    else if(state.page==='session')session();
  }
  function schedule(){
    if(queued)return;queued=true;
    requestAnimationFrame(apply);
  }
  try{if(typeof nav==='function')nav=newNav;}catch(error){console.warn('Traço navigation upgrade deferred',error);}
  if(typeof renderProgress==='function'){
    const previousProgress=renderProgress;
    renderProgress=function(){const result=previousProgress();progress();return result;};
  }
  const app=q('#app');
  if(app)new MutationObserver(schedule).observe(app,{childList:true,subtree:false});
  window.addEventListener('pageshow',schedule);
  window.TracoSimple={version:VERSION,programStatus,getProgram,openProgram};
  document.documentElement.dataset.tracoSimple=VERSION;
  schedule();
})();