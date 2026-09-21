/*
 * Traço Final UI Guard 1.0
 * Última camada: garante a hierarquia final depois de qualquer render.
 */
(function(){
  'use strict';
  const VERSION='1.2.0';
  const q=s=>document.querySelector(s);
  const qa=s=>Array.from(document.querySelectorAll(s));
  let scheduled=false,working=false;

  function go(page){state.page=page;render();}

  async function photoMeta(){
    try{
      const rows=await window.TracoCoach?.dbAll?.();
      const valid=(rows||[]).filter(r=>r.front&&r.side&&r.back).sort((a,b)=>String(a.date||'').localeCompare(String(b.date||'')));
      const latest=valid[valid.length-1]||null;
      let due='primeiro check-in pendente';
      if(latest?.date){
        const d=new Date(latest.date+'T12:00:00');d.setDate(d.getDate()+14);
        const now=new Date();now.setHours(12,0,0,0);
        const days=Math.ceil((d-now)/86400000);
        due=days<=0?'check-in disponível agora':days===1?'próximo amanhã':'próximo em '+days+' dias';
      }
      return {count:valid.length,latest,due};
    }catch{return {count:0,latest:null,due:'abrir acompanhamento visual'};}
  }

  function progressTabs(active){
    return '<nav class="final-progress-tabs" aria-label="evolução"><button data-final-progress="overview" class="'+(active==='overview'?'is-active':'')+'">visão geral</button><button data-final-progress="photos" class="'+(active==='photos'?'is-active':'')+'">fotos</button></nav>';
  }

  async function ensureProgressPhotos(){
    const main=q('.perf-progress');if(!main)return;
    if(!main.querySelector('.final-progress-tabs')){
      main.querySelector('.page-head')?.insertAdjacentHTML('afterend',progressTabs('overview'));
    }
    main.querySelector('[data-final-progress="overview"]')?.addEventListener('click',()=>{});
    const photoTab=main.querySelector('[data-final-progress="photos"]');
    if(photoTab&&!photoTab.dataset.bound){photoTab.dataset.bound='1';photoTab.onclick=()=>go('photos');}

    let card=main.querySelector('.final-photo-entry');
    if(!card){
      card=document.createElement('section');
      card.className='final-photo-entry';
      const anchor=main.querySelector('.ux-progress-30')||main.querySelector('.final-progress-tabs')||main.querySelector('.page-head');
      anchor?.insertAdjacentElement('afterend',card);
    }
    const m=await photoMeta();
    if(!card.isConnected)return;
    const signature=[m.latest?.date||'',m.due,m.count].join('|');
    if(card.dataset.signature!==signature){
      card.dataset.signature=signature;
      card.innerHTML='<div><span>EVOLUÇÃO VISUAL</span><h3>'+(m.latest?'último check-in · '+m.latest.date:'acompanhe seu corpo por fotos')+'</h3><small>'+m.due+' · '+m.count+' check-in'+(m.count===1?'':'s')+'</small></div><button>abrir fotos</button>';
      card.querySelector('button').onclick=()=>go('photos');
    }

    // Evita duplicidade: o card final substitui a versão assíncrona antiga.
    qa('.perf-progress .evo-progress-photos').forEach(n=>n.remove());

    let more=main.querySelector('.final-progress-more');
    if(!more){
      const candidates=['.evo-volume-map','.evo-adaptive','.traco-body-map','.traco-review-card','.evo-milestones','.evo-monthly']
        .flatMap(sel=>qa('.perf-progress '+sel));
      if(candidates.length){
        more=document.createElement('details');
        more.className='final-progress-more';
        more.innerHTML='<summary><div><b>análises avançadas</b><small>volume · ciclo · marcos · detalhes</small></div><span>+</span></summary><div class="final-progress-more-body"></div>';
        main.appendChild(more);
        const body=more.querySelector('.final-progress-more-body');
        candidates.forEach(n=>body.appendChild(n));
      }
    }
  }

  async function ensurePhotos(){
    const main=q('.perf-photos');if(!main)return;
    if(!main.querySelector('.final-progress-tabs')){
      main.querySelector('.page-head')?.insertAdjacentHTML('afterend',progressTabs('photos'));
    }
    const overview=main.querySelector('[data-final-progress="overview"]');
    if(overview&&!overview.dataset.bound){overview.dataset.bound='1';overview.onclick=()=>go('progress');}
    const photos=main.querySelector('[data-final-progress="photos"]');
    if(photos)photos.onclick=()=>{};

    // Não deixa o usuário preso se o módulo de fotos falhar parcialmente.
    if(!main.querySelector('#tracoPhotoCheckin')){
      const fallback=document.createElement('section');
      fallback.className='final-photo-fallback';
      fallback.innerHTML='<span>FOTOS DE EVOLUÇÃO</span><h3>não consegui montar o uploader</h3><p>reabra o app para carregar o módulo de fotos. seus registros locais não são apagados.</p><button>voltar à evolução</button>';
      main.appendChild(fallback);
      fallback.querySelector('button').onclick=()=>go('progress');
    }
  }

  function refineHome(){
    const main=q('.perf-home');if(!main)return;
    qa('#runtimeFoodHome').forEach(n=>n.remove());
    qa('.runtime-photo-home').forEach(n=>n.remove());
    const menu=q('#tracoMenuHomeCard');
    if(menu)menu.classList.add('final-home-primary-card');
    let photo=main.querySelector('.final-home-photo-link');
    if(!photo){
      photo=document.createElement('button');
      photo.className='final-home-photo-link';
      photo.innerHTML='<span>◫</span><div><b>fotos de evolução</b><small>check-in quinzenal · frente · perfil · costas</small></div><i>→</i>';
      (menu||main.querySelector('.perf-workout-hero')||main.querySelector('.perf-greeting'))?.insertAdjacentElement('afterend',photo);
      photo.onclick=()=>go('photos');
    }
  }

  function refineFood(){
    const main=q('.perf-food');if(!main)return;
    main.querySelector('.traco-menu-planner')?.classList.add('final-menu-planner');
    const quick=main.querySelector('.traco-food-quicknav');
    if(quick)quick.classList.add('final-food-quicknav');
  }

  function refineWorkouts(){
    const main=q('.perf-workouts');if(!main)return;
    main.querySelector('.perf-history-shortcut')?.classList.add('final-compact-shortcut');
  }

  function refineSettings(){
    const main=q('.perf-settings');if(!main)return;
    main.querySelector('.traco-about-card')?.classList.add('final-about-card');
  }

  function refineSession(){
    q('.perf-session')?.classList.add('final-session');
  }

  function repairDuplicateIds(){
    const seen=new Set();
    qa('[id]').forEach(node=>{
      if(!seen.has(node.id)){seen.add(node.id);return;}
      // Duplicate ids make event binding unpredictable. Keep the first canonical
      // node and strip the duplicate id without deleting user-visible content.
      node.removeAttribute('id');
      node.dataset.tracoDuplicateId='repaired';
    });
  }

  function hardenExternalLinks(){
    qa('a[target="_blank"]').forEach(link=>{
      const rel=new Set(String(link.rel||'').split(/\s+/).filter(Boolean));
      rel.add('noopener');rel.add('noreferrer');link.rel=[...rel].join(' ');
    });
  }

  function polishAccessibility(){
    qa('button:not([type])').forEach(btn=>btn.type='button');
    qa('img:not([alt])').forEach(img=>img.alt='');
  }

  function repairViewportOverflow(){
    // Keep this runtime guard intentionally narrow. Measuring every element on
    // every render caused unnecessary layout work and could mask valid wide UI.
    const root=q('#app');if(!root)return;
    qa('#app main, #app section, #app article, #app .card, #app .perf-session, #app .perf-home').forEach(node=>{
      if(!(node instanceof HTMLElement)||node.closest('.ux-body-tabs,[role="dialog"],.traco-exercise-picker'))return;
      const rect=node.getBoundingClientRect();
      if(rect.right>window.innerWidth+8||rect.left<-8){
        node.style.maxWidth='100%';
        node.style.boxSizing='border-box';
      }
    });
  }

  function sessionSafety(){
    const main=q('.perf-session');if(!main)return;
    const busy=q('#skipExercise');
    if(busy){
      busy.disabled=!state.activeSession;
      busy.setAttribute('aria-describedby','tracoBusyHelp');
      if(!q('#tracoBusyHelp')){
        const help=document.createElement('small');
        help.id='tracoBusyHelp';help.className='final-busy-help';
        help.textContent='troca a ordem sem apagar séries, carga ou repetições';
        busy.insertAdjacentElement('afterend',help);
      }
    }
  }

  async function apply(){
    if(working)return;working=true;
    try{
      refineHome();
      refineFood();
      refineWorkouts();
      refineSettings();
      refineSession();
      repairDuplicateIds();
      hardenExternalLinks();
      polishAccessibility();
      sessionSafety();
      repairViewportOverflow();
      await ensureProgressPhotos();
      await ensurePhotos();
    }finally{working=false;}
  }

  function schedule(){
    if(scheduled)return;scheduled=true;
    requestAnimationFrame(()=>{scheduled=false;apply();});
  }

  function honorDeepLink(){
    const params=new URLSearchParams(location.search);
    if(params.get('view')!=='photos')return false;
    history.replaceState({},'',location.pathname+location.hash);
    if(state.page!=='photos'){state.page='photos';render();}
    return true;
  }

  const app=q('#app');
  if(app)new MutationObserver(schedule).observe(app,{childList:true,subtree:true});
  window.addEventListener('pageshow',schedule);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)schedule();});
  setTimeout(()=>{honorDeepLink();schedule();},30);
  window.TracoFinalUI={version:VERSION,apply,honorDeepLink};
  document.documentElement.dataset.tracoFinalUi=VERSION;
})();