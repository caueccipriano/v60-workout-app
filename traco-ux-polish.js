/*
 * Traço UX Polish 1.0
 * Reorganiza a informação existente sem adicionar novas features.
 */
(function(){
  'use strict';

  const VERSION='1.1.0';
  const BODY_TAB_KEY='traco_ux_body_tab_v1';
  const qs=s=>document.querySelector(s);
  const qsa=s=>Array.from(document.querySelectorAll(s));
  const esc=v=>String(v==null?'':v).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[ch]));
  const move=(node,parent)=>{if(node&&parent&&node.parentElement!==parent)parent.appendChild(node);};

  function home(){
    const main=qs('.perf-home');if(!main)return;
    main.classList.add('ux-home');

    const greeting=main.querySelector('.perf-greeting');
    const resume=main.querySelector('.perf-resume');
    const hero=main.querySelector('.perf-workout-hero');
    const coach=main.querySelector('.evo-best-today');
    const sequence=main.querySelector('.perf-sequence');
    const smart=main.querySelector('.evo-smart-week');
    const daily=main.querySelector('#tracoDailyHome');
    const photo=main.querySelector('#runtimePhotoMount');
    const metrics=main.querySelector('.perf-metrics');
    const links=main.querySelector('.perf-home-links');
    const heat=main.querySelector('.evo-heatmap');

    main.querySelector('#runtimeFoodHome')?.remove();

    let anchor=resume||greeting;
    if(hero&&anchor)anchor.insertAdjacentElement('afterend',hero);
    anchor=hero||anchor;
    if(coach&&anchor)anchor.insertAdjacentElement('afterend',coach);

    let attention=main.querySelector('.ux-home-attention');
    if(!attention&&(daily||photo)){
      attention=document.createElement('section');
      attention.className='ux-home-attention';
      (coach||hero||sequence||greeting)?.insertAdjacentElement('afterend',attention);
    }
    if(attention){move(daily,attention);move(photo,attention);}

    if(sequence&&attention)attention.insertAdjacentElement('afterend',sequence);

    let more=main.querySelector('.ux-home-more');
    if(!more&&(smart||heat)){
      more=document.createElement('details');
      more.className='ux-home-more';
      more.innerHTML='<summary><span>ritmo e semana</span><b>ver detalhes</b></summary><div class="ux-home-more-body"></div>';
      (sequence||attention||coach||hero)?.insertAdjacentElement('afterend',more);
    }
    if(more){
      const body=more.querySelector('.ux-home-more-body');
      move(smart,body);move(heat,body);
    }
    if(metrics&&more)more.insertAdjacentElement('afterend',metrics);
    if(links&&metrics)metrics.insertAdjacentElement('afterend',links);
  }

  const BODY={
    overview:['.traco-body-intro','.body-blue','.measure-form','.measure-history','.traco-moving-card','.traco-pattern-card','.traco-plateau-card','.evo-perception','.traco-week-shape','.traco-flank-card','.traco-goal-card','.evo-milestones','.evo-monthly','.evo-volume-map','.lab-recovery-card','.lab-antiflank-card','.lab-phase-card','.lab-goals-card','.lab-records-card','.lab-wrapped-card','.lab-exp-card','.lab-timeline-card'],
    photos:['.traco-photo-cadence','#tracoPhotoCheckin','.traco-photo-compare-card','.evo-photo-tools-card','.lab-photo-tools-card','.lab-camera-entry','#evoVaultMount'],
  };

  function bodyShell(main){
    let tabs=main.querySelector('.ux-body-tabs');
    if(!tabs){
      tabs=document.createElement('nav');
      tabs.className='ux-body-tabs';
      tabs.setAttribute('aria-label','áreas do corpo');
      tabs.innerHTML='<button data-ux-body-tab="overview">visão geral</button><button data-ux-body-route="photos">fotos</button><button data-ux-body-route="food">cardápios</button>';
      main.querySelector('.page-head')?.insertAdjacentElement('afterend',tabs);
    }
    let panels=main.querySelector('.ux-body-panels');
    if(!panels){
      panels=document.createElement('div');
      panels.className='ux-body-panels';
      panels.innerHTML='<section class="ux-body-panel" data-ux-panel="overview"></section><section class="ux-body-panel" data-ux-panel="photos"></section><section class="ux-body-panel" data-ux-panel="food"></section>';
      tabs.insertAdjacentElement('afterend',panels);
    }
    return {tabs,panels};
  }

  function selectBodyTab(tab){
    const main=qs('.perf-body');if(!main)return;
    const valid=tab==='overview'?'overview':'overview';
    localStorage.setItem(BODY_TAB_KEY,valid);
    main.querySelectorAll('[data-ux-body-tab]').forEach(btn=>{
      const on=btn.dataset.uxBodyTab===valid;
      btn.classList.toggle('is-active',on);
      btn.setAttribute('aria-selected',String(on));
    });
    main.querySelectorAll('[data-ux-panel]').forEach(panel=>panel.hidden=panel.dataset.uxPanel!==valid);
  }

  function regroupBody(main){
    const shell=bodyShell(main);
    Object.entries(BODY).forEach(([key,selectors])=>{
      const panel=shell.panels.querySelector('[data-ux-panel="'+key+'"]');
      selectors.forEach(selector=>{
        main.querySelectorAll(selector).forEach(node=>{
          if(!node.closest('.ux-body-panel'))move(node,panel);
        });
      });
    });
    shell.tabs.querySelectorAll('[data-ux-body-tab]').forEach(btn=>btn.onclick=()=>selectBodyTab(btn.dataset.uxBodyTab));
    shell.tabs.querySelector('[data-ux-body-route="photos"]')?.addEventListener('click',()=>{state.page='photos';render();});
    shell.tabs.querySelector('[data-ux-body-route="food"]')?.addEventListener('click',()=>{state.page='food';render();});
    selectBodyTab(localStorage.getItem(BODY_TAB_KEY)||'overview');
  }

  function compactFoodTools(main){return;
    const food=main.querySelector('[data-ux-panel="food"]');if(!food)return;
    let more=food.querySelector('.ux-food-more');
    if(!more){
      more=document.createElement('details');
      more.className='ux-food-more';
      more.innerHTML='<summary><div><b>mais ferramentas</b><small>construtor · supermercado · favoritos · contexto</small></div><span>+</span></summary><div class="ux-food-more-body"></div>';
      food.appendChild(more);
    }
    const target=more.querySelector('.ux-food-more-body');
    [
      '.traco-food-limits','.traco-habit-card','.traco-choice-card','.evo-mini-plan',
      '.lab-food-coach','.lab-meal-card','.lab-grocery-card','.lab-hunger-card'
    ].forEach(selector=>food.querySelectorAll(selector).forEach(node=>move(node,target)));
  }

  function compactOverview(main){
    const overview=main.querySelector('[data-ux-panel="overview"]');if(!overview)return;

    let measures=overview.querySelector('.ux-overview-measures');
    if(!measures){
      measures=document.createElement('details');
      measures.className='ux-overview-measures';
      measures.innerHTML='<summary><div><b>medidas</b><small>registrar e ver histórico</small></div><span>+</span></summary><div class="ux-overview-measures-body"></div>';
      overview.appendChild(measures);
    }
    const measuresBody=measures.querySelector('.ux-overview-measures-body');
    ['.measure-form','.measure-history'].forEach(selector=>overview.querySelectorAll(selector).forEach(node=>move(node,measuresBody)));

    let more=overview.querySelector('.ux-overview-more');
    if(!more){
      more=document.createElement('details');
      more.className='ux-overview-more';
      more.innerHTML='<summary><div><b>mais do corpo</b><small>tendências · padrões · análises</small></div><span>+</span></summary><div class="ux-overview-more-body"></div>';
      overview.appendChild(more);
    }
    const moreBody=more.querySelector('.ux-overview-more-body');
    [
      '.traco-moving-card','.traco-pattern-card','.traco-plateau-card','.evo-volume-map',
      '.lab-recovery-card','.lab-antiflank-card','.lab-phase-card','.lab-goals-card',
      '.lab-records-card','.lab-wrapped-card','.lab-exp-card','.lab-timeline-card'
    ].forEach(selector=>overview.querySelectorAll(selector).forEach(node=>move(node,moreBody)));
  }

  function openBodyTab(tab){
    if(tab==='photos'){state.page='photos';render();return;}
    if(tab==='food'){state.page='food';render();return;}
    state.page='body';localStorage.setItem(BODY_TAB_KEY,'overview');renderBody();
  }

  function body(){
    const main=qs('.perf-body');if(!main)return;
    main.classList.add('ux-body');
    regroupBody(main);
    compactOverview(main);
    compactFoodTools(main);
    setTimeout(()=>{regroupBody(main);compactOverview(main);compactFoodTools(main)},80);
    setTimeout(()=>{regroupBody(main);compactOverview(main);compactFoodTools(main)},320);
  }

  function last30(){
    const d=new Date();d.setDate(d.getDate()-29);d.setHours(0,0,0,0);
    const ss=sessions().filter(s=>s.finishedAt&&s.startedAt>=d.getTime());
    const prs=ss.reduce((n,s)=>n+(Array.isArray(s.prs)?s.prs.length:0),0);
    const rows=bodyData().filter(r=>new Date(r.date+'T12:00:00')>=d).sort((a,b)=>a.date.localeCompare(b.date));
    const first=rows[0],last=rows[rows.length-1];
    const waist=first?.waist&&last?.waist?Number(last.waist)-Number(first.waist):null;
    const goal=Math.max(1,Number((typeof v60Profile==='function'?v60Profile():{weeklyGoal:5}).weeklyGoal)||5);
    return {workouts:ss.length,prs,waist,consistency:Math.min(100,Math.round(ss.length/(goal*(30/7))*100))};
  }
  function bodyData(){return typeof window.body==='function'?window.body():[];}
  function deltaText(v){
    if(v==null||!Number.isFinite(v))return '—';
    if(Math.abs(v)<.05)return 'estável';
    return (v>0?'+':'')+v.toFixed(1).replace('.',',')+' cm';
  }

  function progress(){
    const main=qs('.perf-progress');if(!main||main.querySelector('.ux-progress-30'))return;
    main.classList.add('ux-progress');
    const s=last30();
    const card=document.createElement('section');
    card.className='ux-progress-30';
    card.innerHTML='<header><span>ÚLTIMOS 30 DIAS</span><b>resumo primeiro, detalhes depois</b></header><div><article><b>'+s.workouts+'</b><span>treinos</span></article><article><b>'+s.prs+'</b><span>PRs</span></article><article><b>'+esc(deltaText(s.waist))+'</b><span>cintura</span></article><article><b>'+s.consistency+'%</b><span>consistência</span></article></div>';
    main.querySelector('.page-head')?.insertAdjacentElement('afterend',card);
  }

  function settingsGroup(key,title,subtitle,open){
    const el=document.createElement('details');
    el.className='ux-settings-group';
    el.dataset.uxSettingsGroup=key;
    el.open=Boolean(open);
    el.innerHTML='<summary><div><b>'+title+'</b><small>'+subtitle+'</small></div><span>+</span></summary><div class="ux-settings-group-body"></div>';
    return el;
  }

  function settings(){
    const main=qs('.perf-settings');if(!main)return;
    main.classList.add('ux-settings');
    let groups=main.querySelector('.ux-settings-groups');
    if(!groups){
      groups=document.createElement('div');groups.className='ux-settings-groups';
      (main.querySelector('.traco-theme-card')||main.querySelector('.traco-about-card')||main.querySelector('.settings-intro')||main.querySelector('.page-head'))?.insertAdjacentElement('afterend',groups);
      groups.appendChild(settingsGroup('training','treino','descanso e notificações',true));
      groups.appendChild(settingsGroup('data','dados e backup','instalação, exportação e restauração',false));
      groups.appendChild(settingsGroup('integrations','integrações','EU, Fôlego e ecossistema',false));
      groups.appendChild(settingsGroup('privacy','privacidade e diagnóstico','suporte, versão e manutenção',false));
    }
    const target=k=>groups.querySelector('[data-ux-settings-group="'+k+'"] .ux-settings-group-body');
    qsa('.perf-settings > .form-card, .perf-settings > .traco-rest-settings, .perf-settings > .evo-backup, .perf-settings > .evo-integrations, .perf-settings > .evo-migration, .perf-settings > .traco-data-support, .perf-settings > .runtime-build-card').forEach(card=>{
      if(card.closest('.ux-settings-group-body'))return;
      const t=String(card.textContent||'').toLowerCase();
      let key='privacy';
      if(card.classList.contains('traco-rest-settings')||t.includes('descanso'))key='training';
      else if(card.classList.contains('evo-integrations'))key='integrations';
      else if(card.classList.contains('evo-backup')||t.includes('instalar no celular')||t.includes('exportar backup')||t.includes('importar backup'))key='data';
      move(card,target(key));
    });
  }

  function session(){
    const main=qs('.perf-session');if(!main)return;
    main.classList.add('ux-session');
    const consoleEl=main.querySelector('.perf-exercise-console');if(!consoleEl)return;
    const last=main.querySelector('.perf-last-performance');
    const inputs=main.querySelector('.perf-inputs');
    if(last&&inputs)inputs.insertAdjacentElement('beforebegin',last);
    let details=main.querySelector('.ux-session-more');
    if(!details){
      details=document.createElement('details');
      details.className='ux-session-more';
      details.innerHTML='<summary><div><b>detalhes do exercício</b><small>técnica · lista · coach</small></div><span>+</span></summary><div class="ux-session-more-body"></div>';
      (consoleEl.querySelector('.perf-skip-exercise')||consoleEl).insertAdjacentElement('afterend',details);
    }
    const target=details.querySelector('.ux-session-more-body');
    [main.querySelector('.evo-session-intelligence'),main.querySelector('.lab-session-tools'),main.querySelector('.perf-native-exercise-list'),main.querySelector('.perf-media-block')].forEach(node=>move(node,target));
  }

  function finish(){
    const card=qs('.finish-card');if(!card||card.querySelector('.ux-finish-confirm'))return;
    const next=typeof v60RecommendedWorkout==='function'?v60RecommendedWorkout():todayWorkout();
    const item=typeof v60SequenceItem==='function'?v60SequenceItem(next.id):null;
    const el=document.createElement('section');el.className='ux-finish-confirm';
    el.innerHTML='<span>TREINO SALVO ✓</span><b>próximo: '+(item?.letter?'Treino '+item.letter+' · ':'')+esc(next.short||next.name||'')+'</b><small>histórico e sequência atualizados.</small>';
    card.querySelector('.cta-lime')?.insertAdjacentElement('beforebegin',el);
  }

  // Apply polish after the core/modules render instead of wrapping six global
  // render functions. One observer + one frame scheduler keeps ordering stable.
  let polishScheduled=false;
  function polishCurrentPage(){
    if(state.page==='home')home();
    else if(state.page==='body')body();
    else if(state.page==='progress')progress();
    else if(state.page==='settings')settings();
    else if(state.page==='session')session();
    else if(state.page==='finish')finish();
  }
  function schedulePolish(){
    if(polishScheduled)return;
    polishScheduled=true;
    requestAnimationFrame(()=>{polishScheduled=false;polishCurrentPage();});
  }
  const polishApp=qs('#app');
  if(polishApp)new MutationObserver(schedulePolish).observe(polishApp,{childList:true,subtree:false});

  window.TracoUXPolish={version:VERSION,home,body,progress,settings,session,finish,selectBodyTab,openBodyTab,compactOverview,compactFoodTools,apply:polishCurrentPage};
  document.documentElement.dataset.tracoUx=VERSION;
  setTimeout(schedulePolish,50);
})();