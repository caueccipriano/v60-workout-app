/*
 * Traço Evolution 1.0
 * Coach do dia, treino auto-adaptável, cofre, backup, integrações e relatório mensal.
 */
(function(){
  'use strict';

  const VERSION='1.0.0';
  const SCHEMA_KEY='traco_schema_version';
  const SCHEMA_VERSION=3;
  const DAILY_KEY='traco_evolution_daily_v1';
  const CUES_KEY='traco_custom_cues_v1';
  const FAVORITES_KEY='traco_meal_favorites_v1';
  const VAULT_KEY='traco_photo_vault_v1';
  const EU_BRIDGE_KEY='eu_bridge_traco_v2';
  const FOLEGO_BRIDGE_KEY='folego_bridge_traco_v1';
  const PHOTO_DB='traco_photo_checkins_v1';
  const PHOTO_STORE='checkins';
  const BACKUP_TYPE='traco-full-backup';
  let tempoTimer=null;

  const qs=s=>document.querySelector(s);
  const qsa=s=>Array.from(document.querySelectorAll(s));
  const esc=v=>String(v==null?'':v).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[ch]));
  const read=(k,d)=>{try{const v=JSON.parse(localStorage.getItem(k));return v==null?d:v}catch{return d}};
  const write=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
  function dateKey(d=new Date()){const x=new Date(d);return x.getFullYear()+'-'+String(x.getMonth()+1).padStart(2,'0')+'-'+String(x.getDate()).padStart(2,'0')}
  function startOfWeek(d=new Date()){const x=new Date(d),diff=(x.getDay()+6)%7;x.setDate(x.getDate()-diff);x.setHours(0,0,0,0);return x}
  function monthKey(d=new Date()){return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')}
  function todayEvolution(){const all=read(DAILY_KEY,{}),k=dateKey();return Object.assign({feelings:[],note:'',motivation:''},all[k]||{})}
  function latestBody(){return body().slice().sort((a,b)=>String(b.date||'').localeCompare(String(a.date||'')))[0]||null}
  function saveTodayEvolution(patch){const all=read(DAILY_KEY,{}),k=dateKey();all[k]=Object.assign({},todayEvolution(),patch,{date:k,updatedAt:Date.now()});write(DAILY_KEY,all);try{haptic()}catch{}}

  const DUMBBELL_LATERAL_SETS_FIX_KEY='traco_manual_fix_2026_09_20_lateral_dumbbell_sets_v1';
  function applyReportedDumbbellLateralSets(){
    if(localStorage.getItem(DUMBBELL_LATERAL_SETS_FIX_KEY)==='1')return false;
    const targetDate='2026-09-20';
    let changed=false;

    function patchSession(session){
      if(!session||dateKey(new Date(session.startedAt))!==targetDate)return false;
      const ex=(session.exercises||[]).find(item=>
        item.progressionKey==='elevacao-lateral-halter'||
        (/eleva[cç][aã]o lateral/i.test(String(item.name||''))&&/halter/i.test(String(item.equipment||'')))
      );
      if(!ex)return false;
      ex.equipment='Halteres';
      ex.progressionKey='elevacao-lateral-halter';
      ex.performedVariation='halteres';
      ex.substitutionReason='academia lotada · polia ocupada';
      ex.reportedPerformance={weight:8,reps:6,sets:4,source:'user-reported'};
      ex.sets=Array.from({length:4},(_,i)=>Object.assign({},ex.sets?.[i]||{},{
        n:i+1,
        weight:'8',
        reps:'6',
        done:true,
        skipped:false,
        rir:i===3?'heavy':(ex.sets?.[i]?.rir||'right'),
        reported:true
      }));
      ex.lastWorkingWeight='8';
      ex.lastWorkingReps='6';
      return true;
    }

    const draft=load(K.draft,null);
    if(patchSession(draft)){save(K.draft,draft);changed=true;}

    const all=sessions();
    const idx=all.findIndex(s=>s.finishedAt&&dateKey(new Date(s.startedAt))===targetDate&&
      (s.exercises||[]).some(item=>item.progressionKey==='elevacao-lateral-halter'||(/eleva[cç][aã]o lateral/i.test(String(item.name||''))&&/halter/i.test(String(item.equipment||''))))
    );
    if(idx>=0&&patchSession(all[idx])){save(K.sessions,all);changed=true;}

    if(patchSession(state.activeSession)){save(K.draft,state.activeSession);changed=true;}

    if(changed)localStorage.setItem(DUMBBELL_LATERAL_SETS_FIX_KEY,'1');
    return changed;
  }
  const DUMBBELL_LATERAL_FIX_KEY='traco_manual_fix_2026_09_20_lateral_dumbbell_v1';
  function markDumbbellLateral(ex){
    if(!ex||!/eleva[cç][aã]o lateral/i.test(String(ex.name||''))||!/polia|crossover/i.test(String(ex.equipment||'')))return false;
    ex.equipmentOriginal=ex.equipment;
    ex.equipment='Halteres';
    ex.progressionKey='elevacao-lateral-halter';
    ex.performedVariation='halteres';
    ex.substitutionReason='academia lotada · polia ocupada';
    ex.manualEquipmentCorrection=true;
    return true;
  }
  function applyReportedDumbbellLateralRaise(){
    if(localStorage.getItem(DUMBBELL_LATERAL_FIX_KEY)==='1')return false;
    const targetDate='2026-09-20';
    let changed=false;

    const draft=load(K.draft,null);
    if(draft&&dateKey(new Date(draft.startedAt))===targetDate){
      const hit=(draft.exercises||[]).find(markDumbbellLateral);
      if(hit){save(K.draft,draft);changed=true;}
    }

    const all=sessions();
    const candidates=all.filter(s=>s.finishedAt&&dateKey(new Date(s.startedAt))===targetDate).sort((a,b)=>b.startedAt-a.startedAt);
    for(const session of candidates){
      const hit=(session.exercises||[]).find(markDumbbellLateral);
      if(hit){save(K.sessions,all);changed=true;break;}
    }

    if(state.activeSession&&dateKey(new Date(state.activeSession.startedAt))===targetDate){
      const hit=(state.activeSession.exercises||[]).find(markDumbbellLateral);
      if(hit){save(K.draft,state.activeSession);changed=true;}
    }

    if(changed)localStorage.setItem(DUMBBELL_LATERAL_FIX_KEY,'1');
    return changed;
  }

  /* MIGRATIONS */
  async function migrate(){
    let v=Number(localStorage.getItem(SCHEMA_KEY)||0);
    if(v<1){
      const rows=body().map(x=>Object.assign({shoulders:'',hip:''},x));
      save(K.body,rows);v=1;
    }
    if(v<2){
      const ss=sessions().map(s=>Object.assign({schemaVersion:2},s,{exercises:(s.exercises||[]).map(ex=>Object.assign({usesLoad:tracoExerciseUsesLoad(ex)},ex))}));
      save(K.sessions,ss);v=2;
    }
    if(v<3){
      const prefs=read('traco_exercise_preferences_v1',{});
      write('traco_exercise_preferences_v1',prefs);v=3;
    }
    applyReportedDumbbellLateralRaise();
    applyReportedDumbbellLateralSets();
    localStorage.setItem(SCHEMA_KEY,String(SCHEMA_VERSION));
  }

  /* SMART WEEK */
  function completedThisWeek(){
    const start=startOfWeek().getTime();
    return new Set(sessions().filter(s=>s.finishedAt&&s.startedAt>=start).map(s=>s.workoutId));
  }
  function workoutGapHours(id){
    const last=sessions().filter(s=>s.finishedAt&&s.workoutId===id).sort((a,b)=>b.startedAt-a.startedAt)[0];
    return last?(Date.now()-last.startedAt)/3600000:999;
  }
  function smartWeekOrder(){
    const done=completedThisWeek();
    const seq=['seg','ter','qua','qui','sex'];
    const pending=seq.filter(id=>!done.has(id));
    const doneIds=seq.filter(id=>done.has(id));
    const score=id=>{
      let s=0;
      const gap=workoutGapHours(id);s+=Math.min(5,gap/24);
      if(id==='qua'||id==='sex')s+=1.2; // largura/V atual
      if(id==='seg'||id==='qui')s+=.8;
      const r=window.TracoLab?.readiness?.();if(r&&r.score<45&&id==='ter')s-=1;
      return s;
    };
    return pending.sort((a,b)=>score(b)-score(a)).concat(doneIds);
  }
  function smartWorkout(){
    if(typeof v60RecommendedWorkout==='function'){
      const rec=v60RecommendedWorkout();if(rec&&!completedThisWeek().has(rec.id))return rec;
    }
    const id=smartWeekOrder()[0];
    return workoutPlan.find(w=>w.id===id)||workoutPlan[0];
  }
  const baseTodayWorkout=todayWorkout;
  todayWorkout=function(){return smartWorkout()||baseTodayWorkout()};

  /* COACH OF THE DAY */
  function bodyCoachToday(){return read('traco_body_daily_v1',{})[dateKey()]||{}}
  function dailyRecommendation(){
    const w=smartWorkout(),r=window.TracoLab?.readiness?.()||{score:70,level:'normal'},b=bodyCoachToday();
    const parts=[];
    if(r.score<45)parts.push('faça '+w.short+' sem forçar progressão');
    else parts.push('faça '+w.short);
    if(Number(b.proteinMeals||0)<3)parts.push('priorize proteína nas próximas refeições');
    if(!b.water)parts.push('feche sua hidratação');
    const weekCardio=(window.TracoBodyCoach?.weeklyStats?.().cardio)||0;
    if(weekCardio<45)parts.push('15–20 min de cardio se estiver bem');
    return {workout:w,readiness:r,text:parts.slice(0,3).join(' · ')};
  }
  function bestTodayMarkup(){
    const d=dailyRecommendation(),label=consistencyLabel();
    return '<section class="evo-best-today"><header><span>MELHOR COISA PARA FAZER HOJE</span><b>'+esc(label.title)+'</b></header><h3>'+esc(d.text)+'</h3><p>'+esc(label.text)+'</p><button id="evoStartBest">começar '+esc(d.workout.short)+'</button></section>';
  }

  /* MUSCLE VOLUME */
  const EX_MUSCLES={
    'supino-inclinado':['peito','tríceps'],'supino-reto':['peito','tríceps'],'crucifixo-baixo-alto':['peito'],'crucifixo-reto':['peito'],
    desenvolvimento:['ombros','tríceps'],'elevacao-lateral':['ombros'],'elevacao-lateral-2':['ombros'],'elevacao-lateral-3':['ombros'], 'face-pull':['ombros','costas'],'crucifixo-inverso':['ombros','costas'],
    'puxada-aberta':['dorsal','bíceps'],'puxada-neutra':['dorsal','bíceps'],pullover:['dorsal'],'remada-baixa':['costas','bíceps'],
    'triceps-pushdown':['tríceps'],'triceps-overhead':['tríceps'],'triceps-overhead-2':['tríceps'],'rosca-polia':['bíceps'],'rosca-martelo':['bíceps'],'rosca-unilateral':['bíceps'],
    'leg-press':['pernas'],'leg-press-alto':['posterior'],'agachamento-smith':['pernas'],'extensora':['pernas'],flexora:['posterior'],'flexora-2':['posterior'],rdl:['posterior'],abdutora:['glúteos'],'abdutora-2':['glúteos'],panturrilha:['panturrilha'],
    crunch:['core'],'crunch-2':['core'],'core-crunch-seg':['core'],'core-woodchop-qui':['core'],'core-dead-bug-qui':['core']
  };
  const TARGETS={peito:14,ombros:12,dorsal:14,costas:6,bíceps:9,tríceps:9,pernas:10,posterior:10,glúteos:4,panturrilha:4,core:8};
  function weeklyMuscleVolume(){
    const start=startOfWeek().getTime(),out={};
    sessions().filter(s=>s.finishedAt&&s.startedAt>=start).forEach(s=>(s.exercises||[]).forEach(ex=>{
      const sets=(ex.sets||[]).filter(z=>z.done&&!z.skipped).length;
      (EX_MUSCLES[ex.id]||[]).forEach(m=>out[m]=(out[m]||0)+sets);
    }));
    return out;
  }
  function volumeMapMarkup(){
    const vol=weeklyMuscleVolume(),keys=['dorsal','ombros','peito','bíceps','tríceps','pernas','posterior','core'];
    return '<section class="evo-volume-map"><header><span>MAPA DE VOLUME</span><h3>séries desta semana</h3></header><div>'+keys.map(k=>{
      const n=vol[k]||0,t=TARGETS[k]||8,p=Math.min(100,Math.round(n/t*100));
      return '<article><div><b>'+k+'</b><span>'+n+'/'+t+'</span></div><i><em style="width:'+p+'%"></em></i></article>';
    }).join('')+'</div></section>';
  }
  function adaptiveVolumeAdvice(){
    const vol=weeklyMuscleVolume(),r=window.TracoLab?.readiness?.()||{score:70};
    if(r.score<45)return {kind:'down',text:'recuperação baixa: reduza 1 série dos acessórios hoje; preserve os exercícios principais.'};
    const priority=['dorsal','ombros','peito'].find(m=>(vol[m]||0)<(TARGETS[m]||0)*.65);
    if(priority&&r.score>=70)return {kind:'up',text:priority+' está abaixo do alvo semanal e sua recuperação está boa: +1 série em um exercício desse grupo pode fazer sentido.'};
    return {kind:'hold',text:'volume e recuperação estão compatíveis. mantenha o plano.'};
  }
  function applyAdaptiveToSession(){
    const s=state.activeSession;if(!s||s.evolutionAdjusted)return;
    const r=window.TracoLab?.readiness?.()||{score:70},vol=weeklyMuscleVolume();
    if(r.score<45){
      s.exercises.forEach((ex,i)=>{if(i>=2&&ex.sets?.length>2)ex.sets=ex.sets.slice(0,-1).map((z,j)=>Object.assign({},z,{n:j+1}))});
      s.evolutionAdjusted='recovery-down';
    } else {
      const priority=['dorsal','ombros','peito'].find(m=>(vol[m]||0)<(TARGETS[m]||0)*.65);
      if(priority){
        const ex=s.exercises.find(e=>(EX_MUSCLES[e.id]||[]).includes(priority));
        if(ex&&ex.sets.length<5){ex.sets.push({n:ex.sets.length+1,weight:'',reps:'',done:false});s.evolutionAdjusted='volume-'+priority;}
      }
    }
    save(K.draft,s);
  }

  /* PRODUCTIVE SETS + TEMPO + CUES + SMART REST */
  const CUES={
    'supino-inclinado':['peito alto','escápulas firmes no banco','desce controlando, sem quicar'],
    'supino-reto':['peito alto','punhos alinhados','empurra sem perder as escápulas'],
    'crucifixo-baixo-alto':['abraça para baixo e para dentro','cotovelos levemente flexionados','não deixe o ombro rodar para frente'],
    'crucifixo-reto':['peito aberto','movimento em arco','segura 1s na contração'],
    desenvolvimento:['costas apoiadas','cotovelos sob os halteres','não transforme em supino inclinado'],
    'elevacao-lateral':['lidera com o cotovelo','ombro longe da orelha','pare antes de roubar com o tronco'],
    'elevacao-lateral-2':['polia sempre tensionada','cotovelo lidera','suba até a linha do ombro'],
    'elevacao-lateral-3':['tronco quieto','cotovelo lidera','controle a volta'],
    'puxada-aberta':['peito alto','puxe o cotovelo para baixo','não faça rosca com a barra'],
    'puxada-neutra':['cotovelos em direção ao bolso','segura o tronco','alongue a dorsal no topo'],
    pullover:['braços quase estendidos','pense em empurrar a barra para o quadril','costelas quietas'],
    'remada-baixa':['peito aberto','cotovelos para trás','não balance o tronco'],
    'face-pull':['puxe para a altura do rosto','abra as mãos','não encolha os ombros'],
    'triceps-pushdown':['cotovelos colados','só o antebraço mexe','estende até o fim sem jogar o ombro'],
    'triceps-overhead':['cotovelos apontam para frente','alongue bem','tronco firme'],
    'triceps-overhead-2':['cotovelos estáveis','alongue atrás da cabeça','não arqueie a lombar'],
    'rosca-polia':['cotovelos quietos','não balance','controle a descida'],
    'rosca-martelo':['punhos neutros','cotovelos presos','sem embalo'],
    'rosca-unilateral':['ombro quieto','contrai no topo','desce devagar'],
    'leg-press':['joelhos acompanham os pés','quadril fica no banco','empurre o chão com o pé inteiro'],
    'leg-press-alto':['pés altos','controle a profundidade','sinta posterior/glúteo'],
    'agachamento-smith':['pé inteiro no chão','joelhos acompanham os pés','desça só mantendo controle'],
    extensora:['sem chutar','segura 1s em cima','desce controlando'],
    flexora:['quadril no banco','puxe sem dar tranco','controle a volta'],
    'flexora-2':['quadril colado','contraia posterior','volta devagar'],
    rdl:['quadril para trás','barra perto da perna','coluna neutra'],
    abdutora:['tronco estável','abra sem impulso','segura no final'],
    'abdutora-2':['controle a volta','não balance','amplitude confortável'],
    panturrilha:['desce completo','pausa no alongamento','sobe até o máximo'],
    crunch:['fecha as costelas','pense em enrolar o tronco','quadril parado'],
    'crunch-2':['costelas em direção ao quadril','não puxe com os braços','volta controlando']
  };
  const TEMPO={
    compound:{down:2,pause:0,up:1},
    isolate:{down:2,pause:1,up:1}
  };
  function cueFor(ex){
    const custom=read(CUES_KEY,{})[ex.id];if(custom)return custom;
    const arr=CUES[ex.id]||['execução controlada','amplitude confortável','pare se houver dor'];
    const idx=((ex.sets||[]).filter(s=>s.done).length)%arr.length;return arr[idx];
  }
  function isCompound(ex){return /supino|desenvolvimento|puxada|remada|leg press|agachamento|rdl|stiff/i.test(ex.name||'')}
  function productiveSet(ex,set){
    if(!set||!set.done||set.skipped)return false;
    const reps=Number(set.reps||0),inRange=reps>=Number(ex.min||1)&&reps<=Number(ex.max||99)+2;
    const effort=set.rir!=='easy'&&set.rir!=='heavy'?true:set.rir==='right';
    const pref=read('traco_exercise_preferences_v1',{})[ex.id]?.value;
    return inRange&&effort&&pref!=='discomfort';
  }
  function productiveCount(s=state.activeSession){
    if(!s)return {good:0,total:0};
    let good=0,total=0;(s.exercises||[]).forEach(ex=>(ex.sets||[]).forEach(set=>{if(set.done&&!set.skipped){total++;if(productiveSet(ex,set))good++}}));
    return {good,total};
  }
  function dropWarning(ex){
    const done=(ex.sets||[]).filter(s=>s.done&&!s.skipped&&Number(s.reps)>0);if(done.length<2)return null;
    const a=Number(done[done.length-2].reps),b=Number(done[done.length-1].reps);
    if(a>=8&&b<=a-4)return 'queda grande de reps ('+a+' → '+b+'). aumente o descanso ou reduza levemente a carga.';
    return null;
  }
  function smartRest(ex,set){
    let sec=Number(ex.rest||settings().defaultRest||60);
    if(isCompound(ex))sec=Math.max(sec,90);
    if(set?.rir==='heavy')sec+=30;
    if(dropWarning(ex))sec+=30;
    if(!isCompound(ex)&&set?.rir==='easy')sec=Math.max(45,sec-15);
    return Math.min(180,sec);
  }
  function tempoMarkup(ex){
    const t=isCompound(ex)?TEMPO.compound:TEMPO.isolate;
    return '<div class="evo-tempo"><span>tempo</span><b>'+t.down+'s descida'+(t.pause?' · '+t.pause+'s pausa':'')+' · '+t.up+'s subida</b><button id="evoTempoStart">guiar</button></div>';
  }
  function startTempoGuide(ex){
    clearInterval(tempoTimer);
    const t=isCompound(ex)?TEMPO.compound:TEMPO.isolate,phases=[['desce',t.down],['segura',t.pause],['sobe',t.up]].filter(x=>x[1]>0);
    let pi=0,left=phases[0][1];
    const btn=qs('#evoTempoStart');if(!btn)return;
    btn.textContent=phases[0][0]+' '+left;
    tempoTimer=setInterval(()=>{
      left--;if(left<=0){try{navigator.vibrate?.(20)}catch{};pi=(pi+1)%phases.length;left=phases[pi][1];}
      if(btn)btn.textContent=phases[pi][0]+' '+left;
    },1000);
    setTimeout(()=>{clearInterval(tempoTimer);if(btn)btn.textContent='guiar'},16000);
  }

  /* MINIMUM WORKOUT */
  function minimumWorkout(){
    const s=state.activeSession;if(!s)return;
    const priorities={seg:['supino-inclinado','elevacao-lateral','crucifixo-baixo-alto'],ter:['leg-press','flexora','agachamento-smith'],qua:['puxada-aberta','pullover','remada-baixa'],qui:['supino-reto','elevacao-lateral-2','crucifixo-reto'],sex:['puxada-neutra','rdl','elevacao-lateral-3']};
    const ids=priorities[s.workoutId]||s.exercises.slice(0,3).map(x=>x.id);
    s.exercises=s.exercises.filter(ex=>ids.includes(ex.id)).sort((a,b)=>ids.indexOf(a.id)-ids.indexOf(b.id));
    s.exercises.forEach(ex=>{ex.sets=(ex.sets||[]).slice(0,2).map((z,i)=>Object.assign({},z,{n:i+1}))});
    s.wName+=' · mínimo 20 min';s.evolutionMinimum=true;state.currentExercise=0;
    delete s.tracoSetQueue;delete s.tracoSetCursor;if(typeof tracoGymEnsureSessionQueue==='function')tracoGymEnsureSessionQueue(s);
    save(K.draft,s);toast('treino mínimo ativado');renderSession();
  }

  /* CONSISTENCY + HEATMAP */
  function consistencyLabel(){
    const stats=window.TracoBodyCoach?.weeklyStats?.()||{days:0,adherence:0,workouts:0};
    if(stats.days>=4&&stats.workouts>=4&&stats.adherence>=70)return {title:'ritmo forte',text:'semana consistente; não precisa apertar mais só porque está indo bem.'};
    if(stats.workouts>=2||stats.adherence>=50)return {title:'ritmo normal',text:'há base suficiente; só continue repetindo o básico.'};
    return {title:'semana bagunçada',text:'sem julgamento: o melhor próximo passo é retomar uma coisa simples hoje.'};
  }
  function heatmapMarkup(){
    const bodyLog=read('traco_body_daily_v1',{}),ss=sessions().filter(s=>s.finishedAt),days=[];
    for(let i=55;i>=0;i--){const d=new Date();d.setDate(d.getDate()-i);const k=dateKey(d),log=bodyLog[k]||{},trained=ss.some(s=>dateKey(new Date(s.startedAt))===k);
      let score=0;if(trained)score++;if(Number(log.proteinMeals)>=3)score++;if(log.water)score++;if(Number(log.sleepHours)>=7)score++;
      days.push({k,score});
    }
    return '<section class="evo-heatmap"><header><span>RITMO · 8 SEMANAS</span><h3>'+esc(consistencyLabel().title)+'</h3></header><div>'+days.map(x=>'<i class="l'+x.score+'" title="'+x.k+'"></i>').join('')+'</div><small>treino · proteína · água · sono</small></section>';
  }

  /* PHOTO DB + VAULT */
  function photoDb(){
    return new Promise((resolve,reject)=>{
      const req=indexedDB.open(PHOTO_DB,1);
      req.onupgradeneeded=()=>{const db=req.result;if(!db.objectStoreNames.contains(PHOTO_STORE))db.createObjectStore(PHOTO_STORE,{keyPath:'id'})};
      req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);
    });
  }
  async function photos(){
    const db=await photoDb();return new Promise((resolve,reject)=>{const tx=db.transaction(PHOTO_STORE,'readonly'),req=tx.objectStore(PHOTO_STORE).getAll();req.onsuccess=()=>resolve(req.result||[]);req.onerror=()=>reject(req.error)});
  }
  async function putPhoto(row){
    const db=await photoDb();return new Promise((resolve,reject)=>{const tx=db.transaction(PHOTO_STORE,'readwrite');tx.objectStore(PHOTO_STORE).put(row);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error)});
  }
  async function clearPhotos(){
    const db=await photoDb();return new Promise((resolve,reject)=>{const tx=db.transaction(PHOTO_STORE,'readwrite');tx.objectStore(PHOTO_STORE).clear();tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error)});
  }
  function vaultState(){return read(VAULT_KEY,{locked:true,autoLock:true})}
  function setVault(p){write(VAULT_KEY,Object.assign({},vaultState(),p))}
  function nearestBody(date){
    const t=new Date(date+'T12:00:00').getTime(),rows=body().slice().sort((a,b)=>Math.abs(new Date(a.date+'T12:00:00').getTime()-t)-Math.abs(new Date(b.date+'T12:00:00').getTime()-t));
    return rows[0]||null;
  }
  function betweenStats(from,to){
    const a=new Date(from+'T00:00:00').getTime(),b=new Date(to+'T23:59:59').getTime(),ss=sessions().filter(s=>s.finishedAt&&s.startedAt>=a&&s.startedAt<=b);
    const prs=ss.reduce((n,s)=>n+(s.prs||[]).length,0),cardio=ss.reduce((n,s)=>n+(s.extras||[]).filter(x=>x.type==='cardio').reduce((q,x)=>q+Number(x.minutes||0),0),0);
    return {workouts:ss.length,prs,cardio};
  }
  function photoChangeMarkup(row,latest){
    if(!row||!latest||row.id===latest.id)return '<p>escolha uma foto antiga para comparar com a atual.</p>';
    const a=nearestBody(row.date),b=nearestBody(latest.date),st=betweenStats(row.date,latest.date);
    const d=(key,unit)=>a?.[key]&&b?.[key]?((Number(b[key])-Number(a[key])>=0?'+':'')+(Number(b[key])-Number(a[key])).toFixed(1).replace('.',',')+unit):'—';
    return '<div class="evo-photo-change"><article><b>'+d('waist',' cm')+'</b><span>cintura</span></article><article><b>'+d('shoulders',' cm')+'</b><span>ombros</span></article><article><b>'+d('chest',' cm')+'</b><span>peito</span></article><article><b>'+st.workouts+'</b><span>treinos</span></article><article><b>'+st.cardio+' min</b><span>cardio</span></article><article><b>'+st.prs+'</b><span>PRs</span></article></div>';
  }
  async function vaultMarkup(){
    const rows=(await photos()).sort((a,b)=>b.id-a.id),v=vaultState(),latest=rows[0];
    const select=rows.map(r=>'<option value="'+r.id+'">'+esc(r.date)+(r.baselineOfficial?' · baseline':'')+'</option>').join('');
    return '<section class="evo-vault '+(v.locked?'locked':'')+'"><header><div><span>COFRE DE FOTOS</span><h3>'+(v.locked?'fechado':'aberto')+'</h3><small>fotos ficam no armazenamento local do navegador</small></div><button id="evoVaultToggle">'+(v.locked?'revelar':'ocultar')+'</button></header>'+
      (v.locked?'<div class="evo-vault-cover">fotos ocultas nesta tela</div>':
      (rows.length?'<div class="evo-vault-grid">'+rows.slice(0,6).map(r=>'<article><img src="'+r.front+'" alt=""><span>'+esc(r.date)+'</span></article>').join('')+'</div>':'<p>ainda sem fotos no cofre.</p>'))+
      '<div class="evo-photo-import"><label>importar baseline privado<input id="evoPhotoPack" type="file" accept="application/json"></label></div>'+
      (rows.length>1?'<div class="evo-what-changed"><span>O QUE MUDOU DESDE…</span><select id="evoPhotoCompareSelect">'+select+'</select><div id="evoPhotoChange">'+photoChangeMarkup(rows[rows.length-1],latest)+'</div></div>':'')+
      '</section>';
  }
  function openPhotosArea(){
    if(window.TracoUXPolish?.openBodyTab){window.TracoUXPolish.openBodyTab('photos');return;}
    localStorage.setItem('traco_ux_body_tab_v1','photos');
    state.page='body';render();
  }
  async function progressPhotosMarkup(){
    const rows=(await photos()).filter(r=>r.front&&r.side&&r.back).sort((a,b)=>String(a.date||'').localeCompare(String(b.date||'')));
    const latest=rows[rows.length-1]||null,v=vaultState();
    let dueText='primeiro check-in pendente';
    if(latest?.date){
      const due=new Date(latest.date+'T12:00:00');due.setDate(due.getDate()+14);
      const now=new Date();now.setHours(12,0,0,0);
      const days=Math.ceil((due-now)/86400000);
      dueText=days<=0?'check-in disponível agora':days===1?'próximo check-in amanhã':'próximo check-in em '+days+' dias';
    }
    const thumbs=latest&&!v.locked
      ?'<div class="evo-progress-photo-thumbs"><img src="'+latest.front+'" alt="frente"><img src="'+latest.side+'" alt="perfil"><img src="'+latest.back+'" alt="costas"></div>'
      :'<div class="evo-progress-photo-locked"><span>◫</span><b>'+(latest?'fotos protegidas':'sem fotos ainda')+'</b><small>'+(latest?'revele no cofre para ver as miniaturas':'faça frente, perfil e costas para iniciar o acompanhamento')+'</small></div>';
    return '<section class="evo-progress-photos"><header><div><span>EVOLUÇÃO VISUAL</span><h3>'+(latest?'último check-in · '+esc(latest.date):'suas fotos de progresso')+'</h3><small>'+esc(dueText)+'</small></div><b>'+rows.length+' check-in'+(rows.length===1?'':'s')+'</b></header>'+thumbs+'<div class="evo-progress-photo-actions"><button id="evoOpenProgressPhotos">abrir fotos e comparar</button></div></section>';
  }
  async function decorateProgressPhotos(){
    const main=qs('.progress-page');if(!main)return;
    main.querySelector('.evo-progress-photos')?.remove();
    try{
      const html=await progressPhotosMarkup();
      const anchor=main.querySelector('.ux-progress-30')||main.querySelector('.page-head');
      if(anchor)anchor.insertAdjacentHTML('afterend',html);else main.insertAdjacentHTML('afterbegin',html);
      const btn=qs('#evoOpenProgressPhotos');if(btn)btn.onclick=openPhotosArea;
    }catch(e){
      const anchor=main.querySelector('.ux-progress-30')||main.querySelector('.page-head');
      if(anchor)anchor.insertAdjacentHTML('afterend','<section class="evo-progress-photos"><header><div><span>EVOLUÇÃO VISUAL</span><h3>fotos de progresso</h3><small>não consegui ler o cofre agora</small></div></header><div class="evo-progress-photo-actions"><button id="evoOpenProgressPhotos">abrir fotos</button></div></section>');
      const btn=qs('#evoOpenProgressPhotos');if(btn)btn.onclick=openPhotosArea;
    }
  }

  async function bindVault(){
    const toggle=qs('#evoVaultToggle');if(toggle)toggle.onclick=()=>{setVault({locked:!vaultState().locked});renderBody()};
    const input=qs('#evoPhotoPack');if(input)input.onchange=async()=>{
      const file=input.files?.[0];if(!file)return;
      try{const pack=JSON.parse(await file.text());if(pack.type!=='traco-photo-pack'||!Array.isArray(pack.photos))throw 0;for(const p of pack.photos)await putPhoto(p);toast('baseline privado importado');renderBody();}catch{toast('pacote de fotos inválido')}
    };
    const select=qs('#evoPhotoCompareSelect');if(select)select.onchange=async()=>{
      const rows=(await photos()).sort((a,b)=>b.id-a.id),latest=rows[0],row=rows.find(r=>String(r.id)===select.value);const target=qs('#evoPhotoChange');if(target)target.innerHTML=photoChangeMarkup(row,latest);
    };
  }
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&vaultState().autoLock)setVault({locked:true})});

  /* PHOTO CONDITIONS */
  function conditionsControls(){
    return '<section class="evo-photo-conditions"><span>CONDIÇÃO DA FOTO</span><div>'+
      '<label><select id="evoPhotoTime"><option value="unknown">horário — não informado</option><option value="morning">manhã</option><option value="afternoon">tarde</option><option value="night">noite</option></select></label>'+
      '<button data-photo-cond="fasted">jejum</button><button data-photo-cond="trained">treinei hoje</button><button data-photo-cond="bloated">me senti inchado</button><button data-photo-cond="normal">me senti normal</button>'+
      '</div><small>isso evita comparar pump/noite/inchaço como se fossem mudança corporal real.</small></section>';
  }
  let photoCond={};
  function bindPhotoConditions(){
    qsa('[data-photo-cond]').forEach(btn=>btn.onclick=()=>{const k=btn.dataset.photoCond;photoCond[k]=!photoCond[k];btn.classList.toggle('is-on',photoCond[k])});
    const saveBtn=qs('#tracoPhotoSave');if(saveBtn&&!saveBtn.dataset.evoPatched){
      saveBtn.dataset.evoPatched='1';saveBtn.addEventListener('click',()=>setTimeout(async()=>{
        const rows=(await photos()).sort((a,b)=>b.id-a.id);const row=rows[0];if(!row)return;
        row.kind='progress';row.conditions=Object.assign({time:qs('#evoPhotoTime')?.value||'unknown'},photoCond);await putPhoto(row);photoCond={};
      },250));
    }
  }

  /* PERCEPTION */
  const FEELINGS=['me senti seco','barriga bonita','barriga inchada','flancos me incomodaram','flancos discretos','braço cheio','peito cheio','ombro bonito','me senti forte','me senti leve','me senti cansado','sem diferença'];
  function perceptionMarkup(){
    const d=todayEvolution();
    return '<section class="evo-perception"><span>COMO VOCÊ SE VÊ HOJE?</span><h3>toque no que combina</h3><div>'+FEELINGS.map(x=>'<button data-feeling="'+esc(x)+'" class="'+((d.feelings||[]).includes(x)?'is-on':'')+'">'+esc(x)+'</button>').join('')+'</div><textarea id="evoBodyNote" placeholder="nota opcional…">'+esc(d.note||'')+'</textarea></section>';
  }
  function bindPerception(){
    qsa('[data-feeling]').forEach(btn=>btn.onclick=()=>{
      const d=todayEvolution(),arr=new Set(d.feelings||[]),v=btn.dataset.feeling;arr.has(v)?arr.delete(v):arr.add(v);saveTodayEvolution({feelings:[...arr]});renderBody();
    });
    const note=qs('#evoBodyNote');if(note)note.onchange=()=>saveTodayEvolution({note:note.value});
  }

  /* MEAL FAVORITES + MINI PLAN + HUNGER SOS */
  const DEFAULT_MEALS={
    breakfast:['ovos + pão/tapioca + fruta','iogurte + aveia + fruta'],
    lunch:['frango/carne + arroz + feijão + salada','massa + proteína + legumes'],
    snack:['iogurte + fruta','sanduíche com proteína','leite/iogurte + aveia'],
    dinner:['proteína + arroz/batata + legumes','omelete + pão + salada']
  };
  function favorites(){return read(FAVORITES_KEY,{breakfast:[],lunch:[],snack:[],dinner:[]})}
  function miniPlanMarkup(){
    const fav=favorites();
    return '<section class="evo-mini-plan"><span>ROTEIRO DE ALIMENTAÇÃO</span><h3>mini dietinha flexível</h3><p>estrutura, não cardápio rígido: proteína em 3–4 refeições, fruta/vegetal e carboidrato compatível com sua fome/treino.</p><div>'+
      Object.entries(DEFAULT_MEALS).map(([k,arr])=>'<article><b>'+({breakfast:'café',lunch:'almoço',snack:'lanche',dinner:'jantar'}[k])+'</b>'+arr.map(x=>'<button data-fav="'+k+'|'+esc(x)+'" class="'+(((fav[k]||[]).includes(x))?'is-on':'')+'">'+esc(x)+'</button>').join('')+'</article>').join('')+
      '</div></section>';
  }
  function hungerSos(){
    const b=bodyCoachToday(),training=workoutPlan.some(w=>w.day===new Date().getDay());
    const protein=Number(b.proteinMeals||0)<3?'iogurte grego + fruta':'leite/iogurte + aveia';
    const sweet='fruta + iogurte ou chocolate em porção que satisfaça';
    const savory=training?'sanduíche de frango/atum + pão':'ovos + pão/torrada + tomate';
    return {protein,sweet,savory};
  }
  function hungerSosMarkup(){
    const x=hungerSos();return '<section class="evo-hunger-sos"><span>SOCORRO, TÔ COM FOME</span><h3>3 saídas rápidas</h3><div><article><b>proteica</b><p>'+esc(x.protein)+'</p></article><article><b>doce</b><p>'+esc(x.sweet)+'</p></article><article><b>salgada</b><p>'+esc(x.savory)+'</p></article></div></section>';
  }
  function bindMeals(){
    qsa('[data-fav]').forEach(btn=>btn.onclick=()=>{const [k,item]=btn.dataset.fav.split('|'),f=favorites(),set=new Set(f[k]||[]);set.has(item)?set.delete(item):set.add(item);f[k]=[...set];write(FAVORITES_KEY,f);renderBody()});
  }

  /* MILESTONES */
  function milestones(){
    const ss=sessions().filter(s=>s.finishedAt),rows=body().slice().sort((a,b)=>a.date.localeCompare(b.date)),out=[];
    if(ss.length>=1)out.push('primeiro treino registrado');
    if(ss.length>=20)out.push('20 treinos fechados');
    if(ss.length>=50)out.push('50 treinos fechados');
    const prs=ss.reduce((n,s)=>n+(s.prs||[]).length,0);if(prs>=1)out.push('primeiro PR');if(prs>=10)out.push('10 PRs');
    if(rows.length>=2){
      const a=rows[0],b=rows[rows.length-1];
      if(a.waist&&b.waist&&Number(b.waist)<=Number(a.waist)-1)out.push('cintura -1 cm');
      if(a.shoulders&&b.shoulders&&Number(b.shoulders)>=Number(a.shoulders)+1)out.push('ombros +1 cm');
    }
    const exps=read('traco_experiments_v1',[]);if(exps.some(e=>e.finishedAt))out.push('primeiro experimento de 14 dias');
    return out;
  }
  function milestonesMarkup(){const m=milestones();return '<section class="evo-milestones"><span>MARCOS DO PROJETO</span><h3>'+m.length+' desbloqueados</h3><div>'+m.map(x=>'<b>✓ '+esc(x)+'</b>').join('')+(m.length?'':'<p>seus primeiros marcos aparecem conforme você usa o Traço.</p>')+'</div></section>'}

  /* MONTHLY REPORT */
  function monthlyReport(){
    const mk=monthKey(),ss=sessions().filter(s=>s.finishedAt&&monthKey(new Date(s.startedAt))===mk),br=body().filter(x=>x.date.startsWith(mk)).sort((a,b)=>a.date.localeCompare(b.date)),logs=read('traco_body_daily_v1',{});
    const monthLogs=Object.values(logs).filter(x=>x.date?.startsWith(mk)),prs=ss.reduce((n,s)=>n+(s.prs||[]).length,0),cardio=ss.reduce((n,s)=>n+(s.extras||[]).filter(x=>x.type==='cardio').reduce((q,x)=>q+Number(x.minutes||0),0),0);
    const first=br[0],last=br[br.length-1],delta=(k,u)=>first?.[k]&&last?.[k]?((Number(last[k])-Number(first[k])>=0?'+':'')+(Number(last[k])-Number(first[k])).toFixed(1).replace('.',',')+u):'—';
    const protein=monthLogs.filter(x=>Number(x.proteinMeals)>=3).length,water=monthLogs.filter(x=>x.water).length;
    let sentence='mês em construção — continue registrando para o relatório ficar mais inteligente.';
    if(ss.length>=12&&last?.waist&&first?.waist&&Number(last.waist)<=Number(first.waist))sentence='você manteve uma boa frequência de treino enquanto a cintura ficou estável ou caiu.';
    else if(ss.length>=12)sentence='você construiu consistência de treino; agora vale observar se as medidas acompanham.';
    return {mk,ss,br,prs,cardio,protein,water,delta,sentence};
  }
  function monthlyMarkup(){
    const r=monthlyReport();return '<section class="evo-monthly"><header><span>MEU MÊS EM UMA PÁGINA</span><h3>'+new Intl.DateTimeFormat('pt-BR',{month:'long'}).format(new Date())+'</h3></header><div><article><b>'+r.ss.length+'</b><span>treinos</span></article><article><b>'+r.prs+'</b><span>PRs</span></article><article><b>'+r.cardio+'</b><span>min cardio</span></article><article><b>'+r.protein+'</b><span>dias proteína</span></article><article><b>'+r.delta('waist',' cm')+'</b><span>cintura</span></article><article><b>'+r.delta('shoulders',' cm')+'</b><span>ombros</span></article></div><p>'+esc(r.sentence)+'</p><button id="evoShareMonth">compartilhar resumo</button></section>';
  }
  async function shareMonth(){
    const r=monthlyReport(),text='Traço · '+r.mk+'\n'+r.ss.length+' treinos · '+r.prs+' PRs · '+r.cardio+' min cardio · cintura '+r.delta('waist',' cm')+' · ombros '+r.delta('shoulders',' cm')+'\n'+r.sentence;
    if(navigator.share){try{await navigator.share({title:'Meu mês no Traço',text});return}catch{}}
    await navigator.clipboard?.writeText(text);toast('resumo copiado');
  }

  /* COMPLETE BACKUP */
  async function fullBackup(){
    const photoRows=await photos(),payload={
      type:BACKUP_TYPE,version:1,schemaVersion:SCHEMA_VERSION,exportedAt:new Date().toISOString(),
      localStorage:{}
      ,photos:photoRows
    };
    ['v60_sessions','v60_body','v60_settings','v60_profile','v60_attendance','traco_body_daily_v1','traco_lab_daily_v1','traco_exercise_preferences_v1','traco_shape_phase_v1','traco_shape_goals_v1','traco_experiments_v1','traco_grocery_v1',DAILY_KEY,CUES_KEY,FAVORITES_KEY,VAULT_KEY,'traco_menu_planner_v1','traco_menu_favorites_v1'].forEach(k=>{const v=localStorage.getItem(k);if(v!=null)payload.localStorage[k]=v});
    const blob=new Blob([JSON.stringify(payload)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='traco-backup-completo-'+dateKey()+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);
  }
  async function importFullBackup(file){
    const p=JSON.parse(await file.text());if(p.type!==BACKUP_TYPE)throw new Error('tipo inválido');
    Object.entries(p.localStorage||{}).forEach(([k,v])=>localStorage.setItem(k,v));
    if(Array.isArray(p.photos)){await clearPhotos();for(const row of p.photos)await putPhoto(row)}
    await migrate();toast('backup completo restaurado');setTimeout(()=>location.reload(),400);
  }
  function backupMarkup(){
    return '<section class="evo-backup"><span>BACKUP COMPLETO</span><h3>seu Traço inteiro</h3><p>treinos, medidas, hábitos, metas, experimentos, preferências e fotos.</p><div><button id="evoExportFull">exportar tudo</button><label>restaurar<input id="evoImportFull" type="file" accept="application/json"></label></div></section>';
  }
  function bindBackup(){
    qs('#evoExportFull')&&(qs('#evoExportFull').onclick=fullBackup);
    const input=qs('#evoImportFull');if(input)input.onchange=async()=>{const f=input.files?.[0];if(!f)return;if(!confirm('restaurar este backup e substituir os dados locais atuais?'))return;try{await importFullBackup(f)}catch{toast('backup inválido')}};
  }

  function parseBridgeRaw(raw){
    if(!raw)return null;
    try{let value=JSON.parse(raw);if(typeof value==='string')value=JSON.parse(value);return value&&typeof value==='object'?value:null}catch{return null}
  }
  function folegoContext(){
    return parseBridgeRaw(localStorage.getItem('eu_bridge_folego_v1'))
      ||parseBridgeRaw(localStorage.getItem('flutter.eu_bridge_folego_v1'));
  }
  function folegoContextMarkup(){
    const b=folegoContext(),m=b?.metrics||{};
    if(!b)return '<article class="evo-bridge-context muted"><b>Fôlego</b><span>abra o Fôlego uma vez para sincronizar o resumo financeiro local.</span></article>';
    const daily=typeof m.dailyFolego==='number'?new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:2}).format(m.dailyFolego)+'/dia':null;
    const used=typeof m.budgetUsedPercent==='number'?m.budgetUsedPercent+'% orçamento':null;
    const days=typeof m.daysUntilIncome==='number'?m.daysUntilIncome+' dias até receber':null;
    return '<article class="evo-bridge-context"><b>Fôlego</b><span>'+esc([daily,used,days].filter(Boolean).join(' · ')||b.summary||'sincronizado')+'</span></article>';
  }

  /* BRIDGES */
  function publishBridges(){
    const phase=read('traco_shape_phase_v1',null),stats=window.TracoBodyCoach?.weeklyStats?.()||{},rec=dailyRecommendation(),latest=latestBody(),m=milestones();
    const eu={
      version:2,app:'traco',title:'Traço',updatedAt:new Date().toISOString(),
      status:Number(stats.workouts||0)>=4?'ritmo forte':'em progresso',
      summary:[phase?.name?'fase '+phase.name:null,Number(stats.workouts||0)+' treinos na semana',rec.workout?.short?'próximo '+rec.workout.short:null].filter(Boolean).join(' · '),
      metrics:{
        workoutsThisWeek:Number(stats.workouts||0),
        cardioMinutesThisWeek:Number(stats.cardio||0),
        shapePhase:phase?.name||null,
        todayRecommendation:rec.text,
        waistCm:Number(latest?.waist||0)||null,
        shouldersCm:Number(latest?.shoulders||0)||null,
        chestCm:Number(latest?.chest||0)||null,
        activeExperiment:read('traco_experiments_v1',[]).find(e=>!e.finishedAt)?.name||null,
        milestones:m.slice(-5).join(' · ')||null
      }
    };
    localStorage.setItem(EU_BRIDGE_KEY,JSON.stringify(eu));
    const folego={
      version:1,app:'traco',title:'Traço',updatedAt:new Date().toISOString(),
      suggestedCategories:[
        {id:'academia',label:'academia/Wellhub',kind:'fitness'},
        {id:'mercado-shape',label:'mercado · projeto corporal',kind:'food'},
        {id:'delivery-shape',label:'delivery/restaurante · projeto corporal',kind:'food'},
        {id:'suplementos',label:'suplementos',kind:'fitness'}
      ],
      note:'Categorias opcionais para relacionar gastos do projeto corporal ao Traço.'
    };
    const folegoRaw=JSON.stringify(folego);
    localStorage.setItem(FOLEGO_BRIDGE_KEY,folegoRaw);
    // shared_preferences no Flutter Web usa o prefixo flutter. no localStorage.
    localStorage.setItem('flutter.'+FOLEGO_BRIDGE_KEY,folegoRaw);
    window.dispatchEvent(new CustomEvent('traco:bridge',{detail:{eu,folego}}));
  }

  /* SESSION WRAPPERS */
  const baseStartSession=startSession;
  startSession=function(workoutId){
    baseStartSession(workoutId);
    if(state.activeSession){applyAdaptiveToSession();renderSession();}
  };
  const baseComplete=completeCurrentSet;
  completeCurrentSet=function(){
    const s=state.activeSession,ex=s?.exercises?.[state.currentExercise],set=ex&&(ex.sets||[])[currentSetIndex(ex)];
    window.__evoRestOverride=ex?smartRest(ex,set):null;
    baseComplete();
    if(ex){const warn=dropWarning(ex);if(warn)setTimeout(()=>toast(warn),350);}
  };
  const baseStartRest=startRest;
  startRest=function(seconds){
    const n=Number(window.__evoRestOverride||seconds);window.__evoRestOverride=null;baseStartRest(n);
  };

  /* DECORATORS */
  function decorateHome(){
    const main=qs('.home-card');if(!main||qs('.evo-best-today'))return;
    const title=main.querySelector('.perf-greeting, .editorial-title');
    if(title)title.insertAdjacentHTML('afterend',bestTodayMarkup());
    else main.insertAdjacentHTML('afterbegin',bestTodayMarkup());
    const start=qs('#evoStartBest');if(start)start.onclick=()=>startSession(smartWorkout().id);
    const strip=main.querySelector('.perf-sequence, .week-strip');if(strip){
      const order=smartWeekOrder(),labels=order.map(id=>workoutPlan.find(w=>w.id===id)?.short).filter(Boolean);
      strip.insertAdjacentHTML('afterend','<section class="evo-smart-week"><span>SEMANA AUTO-ORGANIZADA</span><b>'+labels.join(' → ')+'</b><small>o próximo treino muda conforme o que você já fez e sua recuperação.</small></section>');
    }
    main.insertAdjacentHTML('beforeend',heatmapMarkup());
  }
  function decorateSession(){
    const main=qs('.perf-session');if(!main||qs('.evo-session-intelligence'))return;
    const ex=state.activeSession?.exercises?.[state.currentExercise];if(!ex)return;
    const consoleEl=main.querySelector('.perf-exercise-console');if(!consoleEl)return;
    const pc=productiveCount(),warn=dropWarning(ex),advice=adaptiveVolumeAdvice();
    consoleEl.insertAdjacentHTML('beforeend','<section class="evo-session-intelligence"><div class="evo-cue"><span>DICA DA SÉRIE</span><b>'+esc(cueFor(ex))+'</b></div>'+tempoMarkup(ex)+
      '<div class="evo-quality"><span>séries produtivas</span><b>'+pc.good+'/'+pc.total+'</b><small>'+esc(warn||advice.text)+'</small></div>'+
      '<button id="evoMinimumWorkout">tô sem vontade · versão 20 min</button></section>');
    qs('#evoTempoStart').onclick=()=>startTempoGuide(ex);qs('#evoMinimumWorkout').onclick=minimumWorkout;
  }
  async function decorateBody(){
    const main=qs('.body-page');if(!main||qs('.evo-perception'))return;
    const coach=qs('#tracoBodyCoach');
    const html=perceptionMarkup()+miniPlanMarkup()+hungerSosMarkup()+milestonesMarkup()+volumeMapMarkup()+monthlyMarkup()+'<div id="evoVaultMount"></div>';
    if(coach)coach.insertAdjacentHTML('beforebegin',html);else main.insertAdjacentHTML('beforeend',html);
    const photoCard=qs('#tracoPhotoCheckin');if(photoCard&&!qs('.evo-photo-conditions'))photoCard.insertAdjacentHTML('afterbegin',conditionsControls());
    bindPerception();bindMeals();bindPhotoConditions();qs('#evoShareMonth').onclick=shareMonth;
    const mount=qs('#evoVaultMount');if(mount){mount.innerHTML=await vaultMarkup();bindVault();}
  }
  function decorateProgress(){
    const main=qs('.progress-page');if(!main)return;
    if(!qs('.evo-volume-map')){
      main.insertAdjacentHTML('beforeend',volumeMapMarkup()+'<section class="evo-adaptive"><span>VOLUME ADAPTATIVO</span><h3>'+esc(adaptiveVolumeAdvice().text)+'</h3><p>o Traço ajusta no máximo uma série por grupo por sessão, e reduz acessórios quando a recuperação está baixa.</p></section>'+milestonesMarkup()+monthlyMarkup());
      qs('#evoShareMonth')&&(qs('#evoShareMonth').onclick=shareMonth);
    }
    setTimeout(decorateProgressPhotos,30);
  }
  function decorateSettings(){
    const main=qs('.settings-page');if(!main||qs('.evo-backup'))return;
    main.insertAdjacentHTML('beforeend',backupMarkup()+'<section class="evo-integrations"><span>ECOSSISTEMA</span><h3>Traço ↔ EU ↔ Fôlego</h3><p>o Traço publica localmente fase, treinos, medidas e categorias financeiras para os outros apps do seu ecossistema.</p><div><b>EU</b><small>fase · progresso · marcos · experimento</small><b>Fôlego</b><small>academia · mercado · delivery · suplementos</small></div>'+folegoContextMarkup()+'</section><section class="evo-migration"><span>DADOS</span><h3>schema '+SCHEMA_VERSION+'</h3><p>migrações automáticas preservam seu histórico quando o app ganha campos novos.</p></section>');
    bindBackup();
  }

  const baseHome=renderHome;renderHome=function(){baseHome();decorateHome()};
  const baseSession=renderSession;renderSession=function(){baseSession();decorateSession()};
  const baseBody=renderBody;renderBody=function(){baseBody();decorateBody()};
  const baseProgress=renderProgress;renderProgress=function(){baseProgress();decorateProgress()};
  const baseSettings=renderSettings;renderSettings=function(){baseSettings();decorateSettings()};

  migrate().then(()=>{publishBridges();setInterval(publishBridges,5000)});
  window.TracoEvolution={version:VERSION,smartWorkout,smartWeekOrder,weeklyMuscleVolume,productiveSet,fullBackup,publishBridges,photos,openPhotosArea,decorateProgressPhotos};
  document.documentElement.dataset.tracoEvolution=VERSION;
})();