/*
 * Traço Simple / V-Shape 1.0
 * Presentation + read-only progress + opt-in 12-week program.
 * Preserves workoutPlan, all stored sessions, drafts, body stats and photo vault.
 */
(function(){
  'use strict';
  const KEY='traco_vshape_90_v1';
  const VERSION='1.7.0';
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
      return p&&dayNumber(p.start)!==null?{start:p.start,recoveryWeek:Number(p.recoveryWeek)||0}:null;
    }catch{return null;}
  }
  function programStatus(now=new Date()){
    const p=getProgram();
    if(!p)return {started:false,week:0,phase:0,pct:0,done:false,recoveryDue:false,recoveryActive:false};
    const diff=Math.floor(dayNumber(isoLocal(now))-dayNumber(p.start));
    const elapsed=Math.max(0,diff);
    const done=elapsed>=84;
    const week=Math.min(12,Math.floor(elapsed/7)+1);
    return {started:true,start:p.start,week,phase:Math.min(2,Math.floor((week-1)/4)),pct:Math.min(100,Math.round(elapsed/84*100)),done,recoveryDue:!done&&[4,8,12].includes(week),recoveryActive:!done&&[4,8,12].includes(week)&&p.recoveryWeek===week};
  }

  // Base prescription is captured after the aesthetic-core installer has added
  // its two core exercises. Weekly adjustments affect only *future* sessions.
  const VSHAPE_PROGRESSIVE_IDS=new Set(['puxada-aberta','elevacao-lateral','remada-unilateral','elevacao-lateral-3']);
  const VSHAPE_COMPOUND_IDS=new Set(['puxada-aberta','remada-baixa','supino-inclinado','agachamento-smith','leg-press','remada-unilateral','puxada-neutra','rdl','supino-reto']);
  const basePrescription=new Map((typeof workoutPlan==='undefined'?[]:workoutPlan)
    .flatMap(w=>w.exercises.map(ex=>[ex.id,{sets:ex.sets,min:ex.min,max:ex.max,rest:ex.rest}])));
  function applyVShapePhase(){
    const p=programStatus();
    for(const workout of workoutPlan){
      for(const ex of workout.exercises){
        const base=basePrescription.get(ex.id);
        if(!base)continue;
        // Months 2 and 3 add one working set to the V-shape priority lift,
        // rather than increasing all exercise volumes at once.
        const intense=p.started&&!p.done&&p.phase>=1;
        const planned=base.sets+(intense&&VSHAPE_PROGRESSIVE_IDS.has(ex.id)?1:0);
        // Optional recovery only affects new prescriptions, not active drafts.
        ex.sets=p.recoveryActive?Math.max(1,Math.round(planned*.65)):planned;
        ex.min=base.min;
        ex.max=base.max;
        ex.rest=base.rest;
        if(p.started&&!p.done&&p.phase===2&&VSHAPE_COMPOUND_IDS.has(ex.id)){
          ex.min=Math.max(6,base.min-2);
          ex.max=Math.max(ex.min+2,base.max-2);
        }
      }
    }
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

  // Recovery is always opt-in and scoped to the exact program start + week.
  function setRecovery(active){
    const status=programStatus();
    if(!status.recoveryDue)return false;
    try{
      const stored=JSON.parse(localStorage.getItem(KEY)||'null');
      if(!stored||stored.start!==status.start)return false;
      localStorage.setItem(KEY,JSON.stringify({...stored,recoveryWeek:active?status.week:0}));
      return true;
    }catch{
      if(typeof toast==='function')toast('não foi possível salvar a semana leve');
      return false;
    }
  }
  function recoveryMarkup(){
    const p=programStatus();
    if(!p.recoveryDue)return '';
    return '<section class="simple-recovery" aria-label="Recuperação planejada">'+
      '<div class="simple-recovery-heading"><strong>Semana '+p.week+' · recuperação opcional</strong><span>'+(p.recoveryActive?'Ativada':'Disponível')+'</span></div>'+
      '<p>'+(p.recoveryActive?
        'Nas próximas sessões, aproximadamente 35% menos séries. Preserve a técnica e não treine até a falha. Nenhuma carga é alterada automaticamente.':
        'Se estiver acumulando fadiga, você pode fazer uma semana mais leve. A opção reduz cerca de 35% das séries apenas dos próximos treinos.')+
      '</p><button type="button" data-simple-recovery="'+(p.recoveryActive?'off':'on')+'">'+(p.recoveryActive?'Desativar semana leve':'Ativar semana leve')+'</button>'+
      '<small>Não altera rascunhos nem sessões concluídas. O plano volta ao normal na semana seguinte.</small></section>';
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
  // Weekly training signals, not predictions of muscle growth. Uses genuine,
  // completed sets and comparable exercise variations on local Mon–Sun weeks.
  const MUSCLE_GROUPS=[
    {id:'dorsais',name:'Dorsais',ids:['puxada-aberta','remada-baixa','pullover','remada-unilateral','puxada-neutra']},
    {id:'ombros',name:'Ombros',ids:['crucifixo-inverso','elevacao-lateral','desenvolvimento','elevacao-lateral-2','face-pull','elevacao-lateral-3']},
    {id:'peito',name:'Peito',ids:['supino-inclinado','crucifixo-baixo-alto','supino-reto']}
  ];
  const MUSCLE_IDS=new Map(MUSCLE_GROUPS.flatMap(group=>group.ids.map(id=>[id,group.id])));
  const normVariation=x=>String(x??'').trim().toLocaleLowerCase('pt-BR').replace(/\s+/g,' ');
  const fmtDateWeek=d=>new Intl.DateTimeFormat('pt-BR',{day:'2-digit',month:'short'}).format(d).replace('.','');
  function weeklyVshapeSummary(history,reference=new Date()){
    const now=new Date(reference);
    if(!Number.isFinite(now.getTime()))return null;
    const monday=new Date(now);monday.setHours(0,0,0,0);
    monday.setDate(monday.getDate()-(monday.getDay()+6)%7);
    const prev=new Date(monday);prev.setDate(prev.getDate()-7);
    const next=new Date(monday);next.setDate(next.getDate()+7);
    const make=()=>Object.fromEntries(MUSCLE_GROUPS.map(g=>[g.id,{sets:0,best:new Map()}]));
    const prevData=make(),currData=make(),seen=new Set();
    for(const session of Array.isArray(history)?history:[]){
      if(!session?.finishedAt||session.excludeFromVolume||session.manualConfirmed)continue;
      const started=Number(session.startedAt),finished=Number(session.finishedAt);
      if(!Number.isFinite(started)||!Number.isFinite(finished)||started<=0||finished<started||finished>now.getTime())continue;
      if(session.id!=null){const uid=String(session.id);if(seen.has(uid))continue;seen.add(uid);}
      const period=started>=monday.getTime()&&started<next.getTime()?currData:started>=prev.getTime()&&started<monday.getTime()?prevData:null;
      if(!period)continue;
      for(const ex of Array.isArray(session.exercises)?session.exercises:[]){
        const group=MUSCLE_IDS.get(ex?.id);
        if(!group)continue;
        const row=period[group],key=[ex.id,normVariation(ex.name),normVariation(ex.equipment)].join('|');
        for(const set of Array.isArray(ex.sets)?ex.sets:[]){
          if(!set?.done||set.skipped||set.reported||set.repsKnown===false)continue;
          const reps=Number(set.reps),weight=Number(set.weight);
          if(!Number.isFinite(reps)||reps<=0||!Number.isFinite(weight)||weight<=0)continue;
          row.sets++;
          // 4–20 repetitions: conservative estimated strength *indicator*
          // to compare the same variation, never an absolute strength claim.
          if(reps<4||reps>20)continue;
          const score=weight*(1+reps/30);
          row.best.set(key,Math.max(row.best.get(key)||0,score));
        }
      }
    }
    const groups=MUSCLE_GROUPS.map(g=>{
      const current=currData[g.id],before=prevData[g.id];
      let improved=0,steady=0,below=0;
      for(const [key,score] of current.best){
        const previous=before.best.get(key);
        if(!previous||!score)continue;
        const change=score/previous-1;
        if(change>0.02)improved++;
        else if(change< -0.02)below++;
        else steady++;
      }
      const compared=improved+steady+below;
      const status=!current.sets?'Sem registro nesta semana':
        !before.sets?'Primeira referência':
        !compared?'Sem exercício comparável':
        improved>0?'Sinal de progresso':
        below>0&&!steady?'Abaixo da referência':'Referência estável';
      const message=!current.sets?'Registre suas séries para acompanhar esta região.':
        !before.sets?'Já há dados desta semana. A comparação começa na próxima.':
        !compared?'As variações registradas foram diferentes nas duas semanas.':
        improved>0?improved+' exercício'+(improved>1?'s':'')+' acima da referência · '+compared+' comparado'+(compared>1?'s':''):
        below>0&&!steady?'O registro comparável ficou abaixo; recuperação e técnica importam.':
        steady+' exercício'+(steady>1?'s':'')+' na mesma faixa da semana passada.';
      return {id:g.id,name:g.name,sets:current.sets,previousSets:before.sets,compared,improved,steady,below,status,message};
    });
    const end=new Date(next);end.setDate(end.getDate()-1);
    const prevEnd=new Date(monday);prevEnd.setDate(prevEnd.getDate()-1);
    return {currentLabel:fmtDateWeek(monday)+'–'+fmtDateWeek(end),
      previousLabel:fmtDateWeek(prev)+'–'+fmtDateWeek(prevEnd),groups};
  }
  function weeklySummaryMarkup(){
    const summary=weeklyVshapeSummary(sessions());
    if(!summary)return '';
    const cards=summary.groups.map(g=>
      '<article class="simple-muscle-card" data-muscle="'+esc(g.id)+'">'+
        '<div class="simple-muscle-heading"><b>'+esc(g.name)+'</b><span>'+esc(g.status)+'</span></div>'+
        '<p>'+esc(g.message)+'</p>'+
        '<small>'+g.sets+' séries nesta semana · '+g.previousSets+' na anterior</small>'+
      '</article>').join('');
    return '<section class="simple-weekly" aria-label="Resumo semanal do V-Shape">'+
      '<header><div><span class="simple-kicker">CHECK-IN SEMANAL</span><h4>Seu V, semana a semana.</h4></div>'+
      '<small>'+esc(summary.currentLabel)+' vs '+esc(summary.previousLabel)+'</small></header>'+
      '<div class="simple-muscles">'+cards+'</div>'+
      '<p>Compara a melhor série de cada exercício na mesma variação. Usa uma estimativa baseada em carga e repetições; não mede crescimento muscular. Uma semana isolada não define tendência.</p>'+
    '</section>';
  }

  // Historical set volume is descriptive, not a measure of muscle gain.
  // Current (partial) week is omitted from six-week volume.
  function trainingSignals(history,reference=new Date()){
    const now=new Date(reference);
    if(!Number.isFinite(now.getTime()))return null;
    const monday=new Date(now);monday.setHours(0,0,0,0);
    monday.setDate(monday.getDate()-(monday.getDay()+6)%7);
    const weeks=Array.from({length:6},(_,i)=>{
      const d=new Date(monday);d.setDate(d.getDate()-(6-i)*7);
      return {start:d.getTime(),label:fmtDateWeek(d)};
    });
    const old=new Date(monday);old.setDate(old.getDate()-42);
    const volume=Object.fromEntries(MUSCLE_GROUPS.map(g=>[g.id,Array(6).fill(0)]));
    const exposures=new Map(),seen=new Set();
    for(const session of Array.isArray(history)?history:[]){
      if(!session?.finishedAt||session.excludeFromVolume||session.manualConfirmed)continue;
      const started=Number(session.startedAt),finished=Number(session.finishedAt);
      if(!Number.isFinite(started)||!Number.isFinite(finished)||started<=0||finished<started||finished>now.getTime()||started<old.getTime())continue;
      if(session.id!=null){const id=String(session.id);if(seen.has(id))continue;seen.add(id);}
      const week=weeks.findIndex((w,i)=>started>=w.start&&started<(weeks[i+1]?.start??monday.getTime()));
      for(const ex of Array.isArray(session.exercises)?session.exercises:[]){
        const group=MUSCLE_IDS.get(ex?.id);
        if(!group)continue;
        const key=[ex.id,normVariation(ex.name),normVariation(ex.equipment)].join('|');
        let valid=0,best=0;
        for(const set of Array.isArray(ex.sets)?ex.sets:[]){
          if(!set?.done||set.skipped||set.reported||set.repsKnown===false)continue;
          const reps=Number(set.reps),weight=Number(set.weight);
          if(!Number.isFinite(reps)||reps<=0||!Number.isFinite(weight)||weight<=0)continue;
          valid++;
          if(reps>=4&&reps<=20)best=Math.max(best,weight*(1+reps/30));
        }
        if(week>=0)volume[group][week]+=valid;
        if(best>0){
          const rows=exposures.get(key)||[];
          rows.push({when:started,sessionId:String(session.id??started),score:best,
            id:ex.id,name:String(ex.name||'exercício'),group});
          exposures.set(key,rows);
        }
      }
    }
    const plateaus=[];
    for(const rows of exposures.values()){
      const bySession=new Map();
      for(const row of rows){
        const before=bySession.get(row.sessionId);
        if(!before||row.score>before.score)bySession.set(row.sessionId,row);
      }
      const last=[...bySession.values()].sort((a,b)=>b.when-a.when).slice(0,3);
      if(last.length!==3||last[0].when-last[2].when<14*86400000)continue;
      const scores=last.map(x=>x.score),high=Math.max(...scores),low=Math.min(...scores);
      // Only flag three valid comparable sessions within a narrow 2% band.
      // Missing, noisy, swapped or clearly worsening logs remain unflagged.
      if(high/low>1.02)continue;
      plateaus.push({id:last[0].id,name:last[0].name,group:last[0].group,sessions:3,
        days:Math.round((last[0].when-last[2].when)/86400000)});
    }
    const priority=['puxada-aberta','remada-unilateral','elevacao-lateral','elevacao-lateral-3','supino-inclinado'];
    plateaus.sort((a,b)=>{
      const rank=id=>{const n=priority.indexOf(id);return n<0?999:n;};
      return rank(a.id)-rank(b.id)||a.name.localeCompare(b.name,'pt-BR');
    });
    return {weeks:weeks.map(w=>w.label),groups:MUSCLE_GROUPS.map(g=>({
      id:g.id,name:g.name,series:volume[g.id],total:volume[g.id].reduce((a,b)=>a+b,0)
    })),plateaus:plateaus.slice(0,2)};
  }
  function trainingSignalsMarkup(){
    const report=trainingSignals(sessions());
    if(!report)return '';
    const hasVolume=report.groups.some(g=>g.total>0);
    const bars=report.groups.map(g=>{
      const max=Math.max(1,...g.series);
      const strip=g.series.map((count,i)=>
        '<span class="simple-volume-bar" title="'+esc(report.weeks[i]+': '+count+' séries')+'">'+
        '<i style="height:'+(count?Math.max(6,Math.round(100*count/max)):0)+'%"></i></span>').join('');
      return '<div class="simple-volume-row"><div class="simple-volume-name"><b>'+esc(g.name)+'</b><small>'+g.total+' '+(g.total===1?'série':'séries')+' · 6 semanas</small></div>'+
        '<div class="simple-volume-bars" role="img" aria-label="'+esc(g.name+': '+g.series.join(', ')+' séries, da mais antiga à recente')+'">'+strip+'</div></div>';
    }).join('');
    return '<section class="simple-volume" aria-label="Volume das seis semanas completas">'+
      '<header><span class="simple-kicker">VISÃO DE 6 SEMANAS</span><h4>Volume de treino.</h4>'+
        '<p>Semanas completas · de '+esc(report.weeks[0])+' a '+esc(report.weeks[5])+'</p></header>'+
      (hasVolume?'<div class="simple-volume-list">'+bars+'</div>':
        '<p class="simple-volume-empty">Ainda não há séries válidas nessas seis semanas. O gráfico aparece quando houver registros.</p>')+
      '<p class="simple-volume-foot">Conta séries realmente concluídas com carga e repetições. Não mede crescimento muscular nem inclui a semana atual incompleta.</p>'+
      (report.plateaus.length?
        '<div class="simple-plateaus"><b>Possível estagnação · vale observar</b>'+
        report.plateaus.map(x=>'<p>'+esc(x.name)+' · '+x.sessions+' sessões comparáveis em '+x.days+' dias, sem evolução expressiva. Confira recuperação e execução antes de mudar a ficha.</p>').join('')+
        '</div>':'')+
      '</section>';
  }
  function stat(label,value){return '<article class="simple-stat"><b>'+esc(value)+'</b><span>'+esc(label)+'</span></article>';}
  function phaseCard(){
    const p=programStatus();
    if(!p.started){
      return '<section class="simple-program"><div class="simple-program-top"><strong>Seu V-Shape</strong><span>12 semanas</span></div><p>Uma jornada em três fases, usando seus treinos A–E. Comece quando quiser; seus registros atuais continuam intactos.</p><div class="simple-program-foot"><small>Sem contagem iniciada</small><button class="simple-quiet-button" data-simple-action="program">ver programa →</button></div></section>';
    }
    const ph=phases[p.phase];
    return '<section class="simple-program"><div class="simple-program-top"><strong>'+esc(p.done?'12 semanas completas':'Semana '+p.week+' de 12')+'</strong><span>'+esc(p.recoveryActive?'Semana leve':p.recoveryDue?'Pausa opcional':ph.label)+'</span></div><p>'+esc(p.done?'O período de 12 semanas terminou. Confira os treinos registrados antes de iniciar outro ciclo.':p.recoveryActive?'Semana leve ativada: volume menor nos próximos treinos.':p.recoveryDue?'Semana de recuperação opcional: abra o programa se quiser reduzir o volume.':ph.detail)+'</p><div class="simple-program-meter" aria-label="'+p.pct+'% do período"><i style="width:'+p.pct+'%"></i></div><div class="simple-program-foot"><small>'+programWorkoutCount()+' sessões registradas no período</small><button class="simple-quiet-button" data-simple-action="program">ver fases →</button></div></section>';
  }
  function home(){
    const main=q('.perf-home');
    if(!main||main.querySelector('.simple-home'))return;
    main.classList.add('traco-simple-home');
    const w=recommendation();
    const profile=typeof v60Profile==='function'?v60Profile():null;
    const first=String(profile?.name||'').trim().split(/\s+/)[0];
    const name=first?' '+esc(first.toLowerCase()):'';
    const hasDraft=Boolean(main.querySelector('.perf-resume'));
    main.classList.toggle('simple-has-draft',hasDraft);
    const p=document.createElement('div');
    p.className='simple-home';
    p.innerHTML='<header class="simple-lead"><span class="simple-kicker">SEU TREINO, SEM DISTRAÇÕES</span><h1>Seu ritmo.</h1><p>'+esc('Olá'+(name?', '+first.toLowerCase():''))+'! Sua evolução acontece treino após treino.</p></header>'+
      phaseCard()+
      '<div class="simple-workout-caption">ATALHOS'+(w?' · '+esc(w.short):'')+'</div>'+
      '<div class="simple-home-actions"><button data-simple-go="workouts">Ver ficha completa<span>Treinos A–E</span></button><button data-simple-go="body">Registrar medidas<span>Cintura e peso</span></button></div>'+
      '<button type="button" class="simple-help-link" data-simple-action="help">Como usar o Traço? <span>Guia em 3 passos →</span></button>';
    const hero=main.querySelector('.perf-workout-hero');
    if(hero)hero.insertAdjacentElement('afterend',p);
    else (main.querySelector('.perf-topbar')||main).insertAdjacentElement('afterend',p);
    main.querySelectorAll('[data-simple-go]').forEach(btn=>btn.addEventListener('click',()=>go(btn.dataset.simpleGo)));
    main.querySelectorAll('[data-simple-action="program"]').forEach(btn=>btn.addEventListener('click',openProgram));
    main.querySelector('[data-simple-action="help"]')?.addEventListener('click',openQuickGuide);
    if(hero){
      hero.setAttribute('aria-label','Iniciar próximo treino: '+(w?.short||''));
      const cta=hero.querySelector('.perf-start-cta b');
      if(cta)cta.textContent='Iniciar treino';
      const duration=hero.querySelector('.perf-hero-copy small');
      if(duration)duration.textContent=(w?.exercises?.length||0)+' exercícios · 45–60 min';
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
      weeklySummaryMarkup()+
      trainingSignalsMarkup()+
      '<div class="simple-links"><button data-simple-go="history"><span>Histórico e cargas</span><span>→</span></button><button data-simple-go="body"><span>Medidas do corpo</span><span>→</span></button><button data-simple-go="photos"><span>Fotos de evolução</span><span>→</span></button><button data-simple-go="food"><span>Cardápios e alimentação</span><span>→</span></button><button data-simple-go="settings"><span>Ajustes e backups</span><span>→</span></button><button data-simple-action="details"><span>Ver análises avançadas</span><span>→</span></button></div>'+
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
  function lastSetSuggestion(ex){
    if(!ex)return null;
    try{
      const key=typeof tracoExerciseProgressionKey==='function'?tracoExerciseProgressionKey(ex):ex.id;
      const norm=x=>String(x||'').trim().toLocaleLowerCase('pt-BR');
      const ordered=sessions().filter(s=>s?.finishedAt&&!s.excludeFromVolume)
        .sort((a,b)=>Number(b.finishedAt||b.startedAt)-Number(a.finishedAt||a.startedAt));
      for(const row of ordered){
        const previous=(row.exercises||[]).find(item=>
          (typeof tracoExerciseProgressionKey==='function'?tracoExerciseProgressionKey(item):item.id)===key&&
          norm(item.name)===norm(ex.name)&&norm(item.equipment)===norm(ex.equipment));
        const set=(previous?.sets||[]).slice().reverse().find(item=>item?.done&&!item.skipped&&!item.reported&&
          Number(item.reps)>0&&Number.isFinite(Number(item.weight))&&Number(item.weight)>0);
        if(set)return set;
      }
    }catch{}
    return null;
  }
  function suggestLastLoad(box,ex){
    const set=ex?.sets?.[typeof currentSetIndex==='function'?currentSetIndex(ex):0];
    const old=lastSetSuggestion(ex);
    if(!set||!old||box.querySelector('.simple-previous-load'))return;
    if(String(set.weight??'').trim()&&String(set.reps??'').trim())return;
    if(!box.querySelector('#weightInput')||!box.querySelector('#repsInput'))return;
    const control=document.createElement('button');
    control.type='button';
    control.className='simple-previous-load';
    control.innerHTML='<span>ÚLTIMA CARGA</span><b>'+esc(String(old.weight).replace('.',','))+' kg × '+esc(old.reps)+' reps</b><small>Usar referência ↗</small>';
    const inputs=box.querySelector('.perf-inputs');
    if(!inputs)return;
    inputs.insertAdjacentElement('beforebegin',control);
    control.addEventListener('click',()=>{
      const weight=box.querySelector('#weightInput'),reps=box.querySelector('#repsInput');
      if(!weight||!reps)return;
      if(!weight.value){weight.value=String(old.weight);weight.dispatchEvent(new Event('input',{bubbles:true}));}
      if(!reps.value){reps.value=String(old.reps);reps.dispatchEvent(new Event('input',{bubbles:true}));}
      if(String(weight.value)&&String(reps.value)){
        control.remove();
        try{haptic();toast('referência aplicada · confira antes de concluir');}catch{}
      }
    });
  }
  // Read-only double progression inspired by minimal open-source gym loggers.
  // A previous performance is comparable only if it was really recorded for
  // this exercise and variation. Never changes loads or a live workout.
  function nextGoal(ex,history){
    if(!ex||!Array.isArray(history))return null;
    const key=typeof tracoExerciseProgressionKey==='function'?tracoExerciseProgressionKey(ex):ex.id;
    const label=x=>String(x||'').trim().toLocaleLowerCase('pt-BR');
    const matches=history.filter(s=>s&&s.finishedAt&&!s.excludeFromVolume&&s.id!==state?.activeSession?.id)
      .sort((a,b)=>Number(b.finishedAt||b.startedAt)-Number(a.finishedAt||a.startedAt));
    for(const past of matches){
      const previous=(past.exercises||[]).find(row=>{
        if((typeof tracoExerciseProgressionKey==='function'?tracoExerciseProgressionKey(row):row.id)!==key)return false;
        // A Smart Swap retains the exercise ID, so name/equipment must match.
        if(label(row.name)!==label(ex.name)||label(row.equipment)!==label(ex.equipment))return false;
        return true;
      });
      if(!previous)continue;
      const all=Array.isArray(previous.sets)?previous.sets:[];
      const done=all.filter(row=>row&&row.done&&!row.skipped&&!row.reported&&row.repsKnown!==false&&Number.isFinite(Number(row.reps))&&Number(row.reps)>0);
      if(!done.length)continue;
      const usesLoad=typeof tracoExerciseUsesLoad==='function'?tracoExerciseUsesLoad(ex):ex.usesLoad!==false;
      const weights=done.map(row=>Number(row.weight));
      if(usesLoad&&!weights.every(w=>Number.isFinite(w)&&w>0))continue;
      const refs=done.map(row=>Number(row.reps));
      const complete=all.length>0&&all.every(row=>row?.done&&!row.skipped&&!row.reported)&&done.length>=Math.max(1,Number(ex.sets?.length||ex.sets)||1);
      const max=Number(ex.max)||12,min=Number(ex.min)||8;
      const lastLoad=usesLoad?weights[weights.length-1]:null;
      const summary=(usesLoad?String(lastLoad).replace('.',',')+' kg · ':'')+refs.join('/')+' reps';
      const heavy=done.some(row=>row.rir==='heavy'||(row.rir!==''&&row.rir!=null&&Number(row.rir)===0));
      const allTop=complete&&refs.every(r=>r>=max)&&(!usesLoad||weights.every(w=>w===lastLoad))&&!heavy;
      const below=refs.some(r=>r<min);
      const kind=allTop?'increase':below?'recover':'reps';
      const title=kind==='increase'?(usesLoad?'Pode considerar subir a carga':'Pode avançar a dificuldade'):kind==='recover'?'Consolide a execução':'Busque mais uma repetição';
      const detail=kind==='increase'?(usesLoad?'Todas as séries chegaram ao topo. Considere o menor incremento disponível, se a técnica estiver boa.':'Chegou ao topo com controle. Considere uma variação um pouco mais difícil.')
        :kind==='recover'?'Algumas séries ficaram abaixo da faixa. Mantenha ou ajuste a carga e priorize a técnica.'
        :'Mantenha a carga e tente +1 repetição em uma série, sem perder a técnica.';
      return {kind,title,detail,summary,source:'Última sessão comparável'};
    }
    return null;
  }
  function renderNextGoal(box,ex,hint){
    if(box.querySelector('.simple-next-goal'))return;
    const goal=nextGoal(ex,sessions());
    if(!goal)return;
    const card=document.createElement('section');
    card.className='simple-next-goal';
    card.dataset.goal=goal.kind;
    card.setAttribute('aria-label','Meta sugerida pela última sessão');
    card.innerHTML='<span>PRÓXIMA META · SUGESTÃO</span><b>'+esc(goal.title)+'</b><small>'+esc(goal.source+' · '+goal.summary)+'</small><p>'+esc(goal.detail)+'</p>';
    hint.insertAdjacentElement('afterend',card);
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
    const advice=phase.started&&!phase.done?' · '+(phase.recoveryActive?'semana leve · 3–4 reps em reserva':phase.phase===0?'2–3 reps em reserva':'1–2 reps em reserva'):'';
    const hint=document.createElement('p');
    hint.className='simple-target';
    hint.textContent='Meta: '+plan+advice+'. Priorize a execução.';
    const inputs=box.querySelector('.perf-inputs');
    if(inputs)inputs.insertAdjacentElement('beforebegin',hint);else box.prepend(hint);
    renderNextGoal(box,ex,hint);
    suggestLastLoad(box,ex);
  }
  function openQuickGuide(){
    q('#simpleQuickGuide')?.remove();
    const modal=document.createElement('div');
    modal.className='simple-sheet';modal.id='simpleQuickGuide';
    modal.setAttribute('role','dialog');
    modal.setAttribute('aria-modal','true');
    modal.setAttribute('aria-label','Como usar o Traço');
    modal.innerHTML='<div class="simple-sheet-panel"><header class="simple-sheet-head"><div>'+
      '<span class="simple-kicker">TRAÇO · GUIA RÁPIDO</span><h2>Treinar é simples.</h2></div>'+
      '<button type="button" data-simple-close aria-label="Fechar guia">×</button></header>'+
      '<ol class="simple-guide-list">'+
      '<li><b>1 · Comece o treino</b><p>Na aba Hoje, toque em Iniciar treino. O Traço sugere a próxima ficha A–E.</p></li>'+
      '<li><b>2 · Registre cada série</b><p>Preencha a carga e as repetições feitas. Toque em Concluir série; você pode consultar a última carga sem alterar seus dados.</p></li>'+
      '<li><b>3 · Entenda sua evolução</b><p>Na aba Evolução, veja o volume de treino, seu desempenho e as medidas que você registrar. Sem números inventados.</p></li>'+
      '</ol>'+
      '<p class="simple-guide-warning">Seus dados ficam neste dispositivo. Em Evolução → Ajustes e backups, exporte uma cópia regularmente, principalmente antes de remover o app da tela inicial.</p>'+
      '<div class="simple-sheet-actions"><button type="button" class="simple-primary" data-simple-close>Entendi, bora treinar!</button></div></div>';
    const close=()=>{modal.remove();document.removeEventListener('keydown',onKey);};
    const onKey=event=>{if(event.key==='Escape')close();};
    modal.addEventListener('click',event=>{if(event.target===modal)close();});
    modal.querySelectorAll('[data-simple-close]').forEach(button=>button.addEventListener('click',close));
    document.body.appendChild(modal);
    document.addEventListener('keydown',onKey);
    modal.querySelector('[data-simple-close]')?.focus();
  }
  function openProgram(){
    q('#simpleProgramSheet')?.remove();
    const p=programStatus(),modal=document.createElement('div');
    modal.className='simple-sheet';modal.id='simpleProgramSheet';
    modal.setAttribute('role','dialog');modal.setAttribute('aria-modal','true');modal.setAttribute('aria-label','Programa V-Shape de 12 semanas');
    modal.innerHTML='<div class="simple-sheet-panel"><header class="simple-sheet-head"><div><span class="simple-kicker">TRAÇO · V-SHAPE</span><h2>12 semanas.<br>Um treino de cada vez.</h2></div><button type="button" data-simple-close aria-label="Fechar">×</button></header>'+
      '<p class="simple-sheet-note">Plano autoral de acompanhamento; não reproduz o curso pago de Renato Cariani. Mantém sua ficha de cinco treinos, priorizando dorsal, deltoides e evolução gradual.</p>'+
      '<ol class="simple-phase-list">'+phases.map(ph=>'<li><b>'+esc(ph.range+' · '+ph.label)+'</b><p>'+esc(ph.detail)+'</p></li>').join('')+'</ol>'+
      '<section class="simple-split"><span class="simple-kicker">A FICHA QUE VOCÊ VAI FAZER</span>'+workoutPlan.map((w,i)=>'<div><b>'+String.fromCharCode(65+i)+' · '+esc(w.short)+'</b><small>'+w.exercises.map(ex=>esc(ex.name)+' ('+ex.sets+'×'+ex.min+'–'+ex.max+')').join(' · ')+'</small></div>').join('')+'</section>'+
      '<p class="simple-sheet-note">A sessão de musculação pode levar aproximadamente 45–60 min, conforme descanso e lotação. Cardio é opcional e separado. Progrida ao atingir o topo das repetições com boa técnica; preserve recuperação e ajuste cargas conforme seu nível.</p>'+
      recoveryMarkup()+
      '<div class="simple-sheet-actions">'+(!p.started?'<button type="button" class="simple-primary" data-simple-start>Começar meu programa hoje</button>':p.done?'<button type="button" data-simple-restart>Iniciar um novo ciclo</button>':'<button type="button" data-simple-restart>Recomeçar ciclo do zero</button>')+'<button type="button" data-simple-close>Voltar ao app</button></div></div>';
    const close=()=>{modal.remove();document.removeEventListener('keydown',onKey);};
    const onKey=e=>{if(e.key==='Escape')close();};
    modal.addEventListener('click',e=>{if(e.target===modal)close();});
    modal.querySelectorAll('[data-simple-close]').forEach(btn=>btn.addEventListener('click',close));
    modal.querySelector('[data-simple-recovery]')?.addEventListener('click',event=>{
      const active=event.currentTarget.dataset.simpleRecovery==='on';
      if(!setRecovery(active))return;
      applyVShapePhase();close();render();openProgram();
    });
    modal.querySelector('[data-simple-start]')?.addEventListener('click',()=>{if(setProgram()){applyVShapePhase();close();render();}});
    modal.querySelector('[data-simple-restart]')?.addEventListener('click',()=>{
      if(!confirm('Recomeçar a contagem de 12 semanas? Seus treinos, fotos e medidas não serão apagados.'))return;
      if(setProgram()){applyVShapePhase();close();render();}
    });
    document.body.appendChild(modal);
    document.addEventListener('keydown',onKey);
    modal.querySelector('[data-simple-close]')?.focus();
  }
  function settingsCoherence(){
    const main=q('.perf-settings');
    if(!main)return;
    const about=main.querySelector('.traco-about-card small');
    if(about)about.textContent='treino · evolução · constância · versão 2.36.0';
    const theme=main.querySelector('.traco-theme-copy small');
    if(theme)theme.textContent='visual claro ou escuro · mesma identidade verde-lima';
    const card=main.querySelector('.traco-about-card b');
    if(card)card.textContent='Traço';
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
    else if(state.page==='settings')settingsCoherence();
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
  applyVShapePhase();
  window.TracoSimple={version:VERSION,programStatus,getProgram,openProgram,applyVShapePhase,nextGoal,weeklyVshapeSummary,setRecovery,trainingSignals};
  document.documentElement.dataset.tracoSimple=VERSION;
  // The existing shell was rendered before this last layer was loaded.
  // Redraw once when a running program changes its next-session prescription.
  if(programStatus().started&&typeof render==='function')render();
  schedule();
})();