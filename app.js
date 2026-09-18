const workoutPlan = [
  { id:'seg', day:1, name:'peito superior + ombros + tríceps', short:'peito + ombro', exercises:[
    ['supino-inclinado','supino inclinado','Smith + banco a ~30°',4,8,10,90,'🏋️'],
    ['desenvolvimento','desenvolvimento sentado','Halteres + banco',3,8,12,90,'⬆️'],
    ['elevacao-lateral','elevação lateral unilateral','Polia baixa / crossover',4,12,15,60,'🪽'],
    ['crucifixo-baixo-alto','crucifixo baixo → alto','Crossover',3,12,15,60,'✖️'],
    ['triceps-pushdown','tríceps pushdown','Polia alta + barra/corda',3,10,15,60,'💪'],
    ['triceps-overhead','tríceps acima da cabeça','Polia alta + corda',2,12,15,60,'🔝'] ]},
  { id:'ter', day:2, name:'pernas completas', short:'pernas', exercises:[
    ['leg-press','leg press 45°','Leg press 45°',4,8,12,90,'🦵'],
    ['agachamento-smith','agachamento no Smith','Smith',3,8,12,90,'🏋️'],
    ['extensora','cadeira extensora','Máquina extensora',3,10,15,60,'🦵'],
    ['flexora','flexora sentada','Máquina flexora',3,10,15,60,'🦿'],
    ['abdutora','abdutora','Máquina abdutora',3,15,20,60,'↔️'],
    ['panturrilha','panturrilha no leg press','Leg press',3,12,20,60,'🦶'] ]},
  { id:'qua', day:3, name:'costas + bíceps + abdômen', short:'costas + bíceps', exercises:[
    ['puxada-aberta','puxada alta aberta','Máquina de puxada',4,8,12,90,'🔻'],
    ['remada-baixa','remada baixa','Polia baixa / crossover',4,8,12,90,'🚣'],
    ['pullover','pullover braços estendidos','Polia alta',3,10,15,60,'⬇️'],
    ['crucifixo-inverso','crucifixo inverso','Duas polias do crossover',3,12,15,60,'🪽'],
    ['rosca-polia','rosca bíceps na polia','Polia baixa',3,10,15,60,'💪'],
    ['rosca-martelo','rosca martelo','Halteres',2,10,12,60,'🔨'],
    ['crunch','crunch ajoelhado','Polia alta + corda',3,10,15,60,'◼️'] ]},
  { id:'qui', day:4, name:'peito + ombro estético + braços', short:'peito + braços', exercises:[
    ['supino-reto','supino reto','Smith + banco reto',3,8,12,90,'🏋️'],
    ['crucifixo-reto','crucifixo na linha do peito','Crossover',3,10,15,60,'✖️'],
    ['elevacao-lateral-2','elevação lateral unilateral','Polia',4,12,15,60,'🪽'],
    ['face-pull','face pull','Polia alta + corda',3,12,15,60,'🎯'],
    ['triceps-overhead-2','tríceps acima da cabeça','Polia alta + corda',3,10,15,60,'🔝'],
    ['rosca-unilateral','rosca bíceps unilateral','Polia baixa',2,10,15,60,'💪'] ]},
  { id:'sex', day:5, name:'posterior + costas + ombros + abdômen', short:'posterior + costas', exercises:[
    ['rdl','stiff / RDL','Smith',3,8,12,90,'↘️'],
    ['flexora-2','flexora sentada','Máquina flexora',3,10,15,60,'🦿'],
    ['leg-press-alto','leg press — pés mais altos','Leg press 45°',3,10,12,90,'🦵'],
    ['puxada-neutra','puxada neutra / fechada','Máquina de puxada',3,10,12,90,'🔻'],
    ['elevacao-lateral-3','elevação lateral unilateral','Polia',3,12,15,60,'🪽'],
    ['abdutora-2','abdutora','Máquina abdutora',2,15,20,60,'↔️'],
    ['crunch-2','crunch na polia','Polia alta',3,10,15,60,'◼️'] ]}
].map(w=>({...w, exercises:w.exercises.map(e=>({id:e[0],name:e[1],equipment:e[2],sets:e[3],min:e[4],max:e[5],rest:e[6],icon:e[7]}))}));

const K={sessions:'v60_sessions', body:'v60_body', settings:'v60_settings', draft:'v60_draft'};
const $=s=>document.querySelector(s);
const $$=s=>[...document.querySelectorAll(s)];
const load=(k,def)=>{try{return JSON.parse(localStorage.getItem(k))??def}catch{return def}};
const save=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
const state={page:'home',activeSession:null,currentExercise:0,restTimer:null,restRemaining:0,sessionClock:null,progressEx:null,installPrompt:null,finishSummary:null,selectedWorkout:null};
const settings=()=>load(K.settings,{defaultRest:60});
const sessions=()=>load(K.sessions,[]);
const body=()=>load(K.body,[]);
const haptic=()=>{try{navigator.vibrate?.(12)}catch{}};

function fmtDate(d){return new Intl.DateTimeFormat('pt-BR',{day:'2-digit',month:'short'}).format(d)}
function fmtFull(d){return new Intl.DateTimeFormat('pt-BR',{weekday:'long',day:'2-digit',month:'long'}).format(d)}
function weekdayLabel(d=new Date()){return new Intl.DateTimeFormat('pt-BR',{weekday:'long'}).format(d)}
function todayWorkout(){const day=new Date().getDay();return workoutPlan.find(w=>w.day===day)||workoutPlan[0]}
function lastExercisePerf(exId){const ss=sessions().filter(s=>s.finishedAt).sort((a,b)=>b.startedAt-a.startedAt);for(const s of ss){const ex=s.exercises.find(e=>e.id===exId);if(ex)return ex}return null}
function toast(msg){const t=$('#toast');if(!t)return;t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),1600)}
function fmtClock(sec){const m=Math.floor(sec/60),s=sec%60;return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`}
function volumeOfSession(s){if(s?.excludeFromVolume)return 0;return s.exercises.reduce((sum,ex)=>sum+ex.sets.reduce((a,set)=>a+(set.done?Number(set.weight||0)*Number(set.reps||0):0),0),0)}
function formatLoad(v){if(v>=1000)return `${(v/1000).toFixed(v>=10000?1:2).replace('.',',')}t`;return `${Math.round(v)}kg`}
function weekSessions(){const now=new Date();const start=new Date(now);const diff=(start.getDay()+6)%7;start.setDate(start.getDate()-diff);start.setHours(0,0,0,0);return sessions().filter(s=>s.finishedAt&&s.startedAt>=start.getTime())}
function calcStreak(ss=sessions()){
  const days=[...new Set(ss.filter(s=>s.finishedAt).map(s=>new Date(s.startedAt).toISOString().slice(0,10)))].sort().reverse();
  if(!days.length)return 0;
  let streak=1;let prev=new Date(days[0]+'T12:00:00');
  for(let i=1;i<days.length;i++){
    const d=new Date(days[i]+'T12:00:00');const delta=Math.round((prev-d)/86400000);
    if(delta===1){streak++;prev=d;continue}
    const prevDay=prev.getDay();if(delta<=3&&(prevDay===1||prevDay===0)){streak++;prev=d;continue}
    break;
  }
  return streak;
}
function latestPR(){const ss=sessions().filter(s=>s.finishedAt).sort((a,b)=>b.startedAt-a.startedAt);for(const s of ss){if(Array.isArray(s.prs)&&s.prs.length)return {...s.prs[0],at:s.startedAt};}return null}
function sessionCompletion(draft){if(!draft?.exercises?.length)return 0;const all=draft.exercises.flatMap(e=>e.sets||[]);return all.length?Math.round(all.filter(s=>s.done).length/all.length*100):0}
function xpStats(){const ss=sessions().filter(s=>s.finishedAt);const prCount=ss.reduce((a,s)=>a+(Array.isArray(s.prs)?s.prs.length:0),0);const total=ss.length*20+prCount*10;const level=Math.floor(total/100)+1;const current=total%100;return{total,level,current,pct:current};}
function delta(current,previous){if(current===''||current==null||previous===''||previous==null)return null;const n=Number(current)-Number(previous);if(!Number.isFinite(n)||Math.abs(n)<0.05)return '0';return `${n>0?'+':''}${n.toFixed(1).replace('.',',')}`;}

function iconSvg(name){
  const common='viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"';
  const map={
    home:'<path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10v9h5v-5h3v5h5v-9"/>',
    history:'<path d="M4 4v6h6"/><path d="M4.5 9A8 8 0 1 1 6 17"/>',
    chart:'<path d="M4 19V9"/><path d="M10 19V5"/><path d="M16 19v-7"/><path d="M22 19V3"/>',
    ruler:'<path d="m4 17 13-13 3 3-13 13H4v-3Z"/><path d="m14 7 3 3"/><path d="m11 10 2 2"/><path d="m8 13 2 2"/>',
    gear:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21h-4v-.1A1.7 1.7 0 0 0 8.6 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1.1-.4H3v-4h.1A1.7 1.7 0 0 0 4.6 8.6a1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.83-2.83.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1.1V3h4v.1A1.7 1.7 0 0 0 15.4 4a1.7 1.7 0 0 0 1.88-.34l.06-.06 2.83 2.83-.06.06A1.7 1.7 0 0 0 19.4 9c.2.36.54.7 1 .9.34.14.7.2 1.1.2h.1v4h-.1a1.7 1.7 0 0 0-2.1.9Z"/>',
    user:'<circle cx="12" cy="8" r="4"/><path d="M4.5 20c.8-4 3.3-6 7.5-6s6.7 2 7.5 6"/>',
    back:'<path d="m15 18-6-6 6-6"/>',close:'<path d="M6 6l12 12M18 6 6 18"/>',check:'<path d="m5 12 4 4L19 6"/>',
    flame:'<path d="M13 3s1 3-1 5c-1 1-2 2-2 4 0 2 1.5 4 4 4 3 0 5-2 5-5 0-4-3-6-6-8Z"/><path d="M9 10c-2 1-4 3-4 6 0 3 2.5 5 6 5 1.5 0 2.8-.4 3.8-1.1"/>',
    trophy:'<path d="M8 4h8v3a4 4 0 0 1-8 0V4Z"/><path d="M6 5H4v2a4 4 0 0 0 4 4M18 5h2v2a4 4 0 0 1-4 4M12 11v5M9 20h6M10 16h4"/>',
    play:'<path d="m9 7 8 5-8 5V7Z"/>',spark:'<path d="m12 3 1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3Z"/><path d="m19 15 .7 2.3L22 18l-2.3.7L19 21l-.7-2.3L16 18l2.3-.7L19 15Z"/>'
  };
  return `<svg ${common}>${map[name]||map.home}</svg>`;
}

function nav(){const items=[['home','home','hoje'],['history','history','histórico'],['progress','chart','evolução'],['body','ruler','corpo'],['settings','gear','config']];return `<nav class="bottom-nav">${items.map(([p,i,l])=>`<button class="nav-btn ${state.page===p?'active':''}" data-nav="${p}" aria-label="${l}"><span class="ico">${iconSvg(i)}</span><span>${l}</span></button>`).join('')}</nav>`;}
function shell(content,{showNav=true,classes=''}={}){$('#app').innerHTML=`<main class="app-shell"><section class="main-card ${classes}">${content}</section>${showNav?nav():''}</main>`;bindCommon();}
function bindCommon(){$$('[data-nav]').forEach(b=>b.onclick=()=>{state.page=b.dataset.nav;render()});}

function renderHome(){
  const w=todayWorkout(),ws=weekSessions(),streak=calcStreak(),weeklyLoad=ws.reduce((a,s)=>a+volumeOfSession(s),0),pr=latestPR(),draft=load(K.draft,null),draftPct=sessionCompletion(draft);
  const recordHtml=pr
    ? `<div class="kpi-card kpi-orange"><span>novo recorde</span><strong>${pr.name}</strong><small>${pr.weight}kg${pr.reps?` × ${pr.reps}`:''}</small></div>`
    : `<div class="kpi-card kpi-record-empty"><span>primeiro PR</span><strong>bora buscar</strong><small>ainda sem recorde</small></div>`;
  shell(`<header class="home-head"><div class="streak-pill">${iconSvg('flame')}<b>${streak}</b> dias</div><button class="profile-btn" data-nav="settings" aria-label="perfil">${iconSvg('user')}</button></header>
    <div class="weekday">${weekdayLabel().toUpperCase()}</div><h1 class="editorial-title">${w.short}</h1>
    ${draft?`<section class="resume-card"><div><span>treino em andamento</span><strong>${draft.wName}</strong><small>${draftPct}% fechado</small></div><button id="resumeWorkout">continuar</button></section>`:''}
    <button class="today-card" id="startToday" aria-label="começar treino"><div><span class="card-kicker">treino de hoje</span><strong>${w.exercises.length} exercícios</strong><small>~ 60 min</small></div><span class="play-dot">${iconSvg('play')}</span></button>
    <section class="kpi-grid"><div class="kpi-card kpi-black"><span>carga total</span><strong>${formatLoad(weeklyLoad)}</strong><small>esta semana</small></div>${recordHtml}</section>
    <section class="week-strip">${workoutPlan.map(x=>{const done=ws.some(s=>s.workoutId===x.id);return `<button class="week-chip ${done?'done':''} ${x.id===w.id?'today':''}" data-workout="${x.id}"><b>${x.id}</b><span>${done?'✓':'·'}</span></button>`}).join('')}</section>
    <button class="text-link week-link" id="seeWeek">ver semana de treino</button>`,{classes:'home-card'});
  $('#startToday').onclick=()=>startSession(w.id);if($('#resumeWorkout'))$('#resumeWorkout').onclick=()=>startSession(draft.workoutId);
  $('#seeWeek').onclick=()=>{state.page='workouts';state.selectedWorkout=w.id;renderWorkouts()};
  $$('[data-workout]').forEach(el=>el.onclick=()=>{state.page='workouts';state.selectedWorkout=el.dataset.workout;renderWorkouts()});
}

function renderWorkouts(){
  const selected=workoutPlan.find(w=>w.id===(state.selectedWorkout||todayWorkout().id));
  shell(`<div class="page-head"><div><span class="page-kicker">semana</span><h2>seus treinos</h2></div><span class="page-count">5x</span></div>
    <div class="workout-stack">${workoutPlan.map((w,i)=>`<button class="workout-select ${w.id===selected.id?'active':''}" data-workout="${w.id}"><span class="workout-num">0${i+1}</span><span><b>${w.short}</b><small>${w.exercises.length} exercícios · ~60 min</small></span><span class="arrow">→</span></button>`).join('')}</div>
    <section class="selected-block"><div class="selected-blue"><span>selecionado</span><h3>${selected.name}</h3><p>${selected.exercises.length} exercícios</p></div><div class="exercise-preview">${selected.exercises.map(ex=>`<div class="preview-row"><span>${ex.icon}</span><div><b>${ex.name}</b><small>${ex.sets} × ${ex.min}-${ex.max} · ${ex.equipment}</small></div></div>`).join('')}</div><button class="cta-lime" id="startSelected">começar treino</button></section>`,{classes:'workouts-page'});
  $$('[data-workout]').forEach(el=>el.onclick=()=>{state.selectedWorkout=el.dataset.workout;renderWorkouts()});$('#startSelected').onclick=()=>startSession(selected.id);
}

function hydrateDraft(raw){const w=workoutPlan.find(x=>x.id===raw.workoutId);if(!raw.exercises||!w)return raw;raw.exercises=raw.exercises.map((ex,i)=>({...w.exercises[i],...ex}));return raw;}
function startSession(workoutId){
  const w=workoutPlan.find(x=>x.id===workoutId),draft=load(K.draft,null);
  if(draft&&draft.workoutId===workoutId&&!draft.finishedAt){state.activeSession=hydrateDraft(draft);}else{
    if(draft&&!draft.finishedAt&&!confirm('tem outro treino em andamento. começar este e substituir o rascunho?'))return;
    state.activeSession={id:crypto.randomUUID?crypto.randomUUID():String(Date.now()),workoutId,wName:w.name,startedAt:Date.now(),exercises:w.exercises.map(ex=>({...ex,sets:Array.from({length:ex.sets},(_,i)=>({n:i+1,weight:'',reps:'',done:false}))}))};save(K.draft,state.activeSession);
  }
  state.currentExercise=Math.max(0,state.activeSession.exercises.findIndex(ex=>ex.sets.some(s=>!s.done)));if(state.currentExercise<0)state.currentExercise=0;state.page='session';renderSession();
}
function sessionElapsed(){return state.activeSession?Math.floor((Date.now()-state.activeSession.startedAt)/1000):0}
function currentSetIndex(ex){const i=ex.sets.findIndex(s=>!s.done);return i<0?ex.sets.length-1:i}
function lastSetText(exId){const last=lastExercisePerf(exId);if(!last)return 'primeira vez — cria sua referência';const done=last.sets.filter(s=>s.done);if(!done.length)return 'sem série registrada';const best=done.reduce((a,b)=>Number(b.weight||0)>Number(a.weight||0)?b:a,done[0]);return `${best.weight||'—'}kg × ${best.reps||'—'} — bora bater`;}
function renderSession(){
  const s=state.activeSession;if(!s){state.page='home';render();return}const ex=s.exercises[state.currentExercise],si=currentSetIndex(ex),set=ex.sets[si];
  shell(`<div class="session-topbar"><button class="plain-icon" id="sessionBack">${iconSvg('back')}</button><span>exercício ${state.currentExercise+1} de ${s.exercises.length}</span><button class="plain-icon" id="cancelSession">${iconSvg('close')}</button></div>
    <div class="session-progress"><span style="width:${((state.currentExercise+(si/ex.sets.length))/s.exercises.length)*100}%"></span></div>
    <section class="exercise-hero"><span class="exercise-badge">${ex.icon}</span><h1>${ex.name}</h1><small>${ex.equipment}</small></section>
    <div class="series-label">série ${si+1} de ${ex.sets.length}</div>
    <section class="input-grid"><label><span>carga (kg)</span><input id="weightInput" type="number" inputmode="decimal" step="0.5" value="${set.weight}" placeholder="0"></label><label><span>repetições</span><input id="repsInput" type="number" inputmode="numeric" value="${set.reps}" placeholder="0"></label></section>
    <button class="cta-lime session-cta" id="completeSet">concluir série</button>
    <div class="record-strip">${iconSvg('trophy')}<span>última vez: <b>${lastSetText(ex.id)}</b></span></div>
    <div class="set-dots">${ex.sets.map((x,i)=>`<span class="${x.done?'done':''} ${i===si?'current':''}">${i+1}</span>`).join('')}</div>
    <div class="session-footer"><span id="sessionTime">${fmtClock(sessionElapsed())}</span><button class="text-link" id="finishEarly">encerrar treino</button></div>`,{showNav:false,classes:'session-page'});
  $('#weightInput').oninput=e=>{set.weight=e.target.value;save(K.draft,s)};$('#repsInput').oninput=e=>{set.reps=e.target.value;save(K.draft,s)};$('#completeSet').onclick=completeCurrentSet;$('#cancelSession').onclick=cancelSession;
  $('#sessionBack').onclick=()=>{if(state.currentExercise>0){state.currentExercise--;renderSession()}else{state.page='home';render()}};$('#finishEarly').onclick=()=>{if(confirm('encerrar o treino agora?'))finishSession()};
  clearInterval(state.sessionClock);state.sessionClock=setInterval(()=>{const el=$('#sessionTime');if(el)el.textContent=fmtClock(sessionElapsed())},1000);if(state.restRemaining>0)showRestOverlay();
}
function completeCurrentSet(){const s=state.activeSession,ex=s.exercises[state.currentExercise],si=currentSetIndex(ex),set=ex.sets[si];if(!set.weight||!set.reps){toast('preenche carga e reps');return}set.done=true;save(K.draft,s);haptic();const exDone=ex.sets.every(x=>x.done),allDone=s.exercises.every(x=>x.sets.every(z=>z.done));if(allDone){finishSession();return}if(exDone)state.currentExercise=Math.min(state.currentExercise+1,s.exercises.length-1);startRest(ex.rest||settings().defaultRest||60);}
function startRest(seconds){state.restRemaining=seconds;showRestOverlay();beginRestTicker()}
function showRestOverlay(){let el=$('#restOverlay');if(!el){document.body.insertAdjacentHTML('beforeend',`<div class="rest-overlay" id="restOverlay"><div class="rest-inner"><span>DESCANSO</span><strong id="restTime">${fmtClock(state.restRemaining)}</strong><p>respira. a próxima já tá pronta.</p><button id="skipRest">pular descanso</button></div></div>`);el=$('#restOverlay')}el.classList.add('show');$('#skipRest').onclick=stopRest;}
function beginRestTicker(){clearInterval(state.restTimer);state.restTimer=setInterval(()=>{state.restRemaining--;const el=$('#restTime');if(el)el.textContent=fmtClock(Math.max(0,state.restRemaining));if(state.restRemaining<=0){stopRest();toast('bora pra próxima série');haptic()}},1000)}
function stopRest(){clearInterval(state.restTimer);state.restRemaining=0;$('#restOverlay')?.remove();if(state.page==='session')renderSession()}
function detectPRs(s){const prev=sessions().filter(x=>x.finishedAt),best={};prev.forEach(sess=>sess.exercises.forEach(ex=>{const mx=Math.max(0,...ex.sets.filter(z=>z.done).map(z=>Number(z.weight||0)));best[ex.id]=Math.max(best[ex.id]||0,mx)}));return s.exercises.map(ex=>{const mx=Math.max(0,...ex.sets.filter(z=>z.done).map(z=>Number(z.weight||0)));return mx>(best[ex.id]||0)&&mx>0?{id:ex.id,name:ex.name,weight:mx,reps:Math.max(0,...ex.sets.filter(z=>z.done&&Number(z.weight||0)===mx).map(z=>Number(z.reps||0)))}:null}).filter(Boolean);}
function finishSession(){const s=state.activeSession;if(!s)return;const done=s.exercises.flatMap(e=>e.sets).filter(x=>x.done).length;if(done===0&&!confirm('nenhuma série marcada. encerrar mesmo assim?'))return;const prs=detectPRs(s);s.prs=prs;s.finishedAt=Date.now();s.duration=Math.floor((s.finishedAt-s.startedAt)/1000);const total=volumeOfSession(s),all=sessions();all.push(s);save(K.sessions,all);localStorage.removeItem(K.draft);state.finishSummary={name:s.wName,duration:s.duration,total,prs,streak:calcStreak(all)};state.activeSession=null;clearInterval(state.sessionClock);clearInterval(state.restTimer);state.restRemaining=0;$('#restOverlay')?.remove();state.page='finish';renderFinish();}
function cancelSession(){if(!confirm('cancelar este treino? o rascunho será apagado.'))return;localStorage.removeItem(K.draft);state.activeSession=null;clearInterval(state.sessionClock);clearInterval(state.restTimer);state.restRemaining=0;$('#restOverlay')?.remove();state.page='home';render()}
function renderFinish(){const x=state.finishSummary;if(!x){state.page='home';render();return}const pr=x.prs[0];$('#app').innerHTML=`<main class="finish-shell"><section class="finish-card"><button class="finish-close" id="finishClose">${iconSvg('close')}</button><div class="finish-check">${iconSvg('check')}</div><h1>treino fechado</h1><p>${x.name}</p><div class="finish-stats"><div><span>tempo</span><strong>${Math.max(1,Math.round(x.duration/60))}min</strong></div><div><span>carga total</span><strong>${formatLoad(x.total)}</strong></div></div>${pr?`<div class="finish-pr">${iconSvg('trophy')}<div><b>novo recorde pessoal</b><span>${pr.name} — ${pr.weight}kg × ${pr.reps}</span></div></div>`:`<div class="finish-note">sem PR hoje — consistência também conta.</div>`}<div class="finish-streak">${iconSvg('flame')}<span>streak</span><b>${x.streak} dias</b></div><button class="cta-lime" id="backHome">voltar pro início</button></section></main>`;$('#backHome').onclick=$('#finishClose').onclick=()=>{state.finishSummary=null;state.page='home';render()};}

function renderHistory(){
  const ss=sessions().filter(s=>s.finishedAt).sort((a,b)=>b.startedAt-a.startedAt),streak=calcStreak(ss),totalLoad=ss.reduce((a,s)=>a+volumeOfSession(s),0);
  const content=ss.length?`<div class="history-summary"><div><span>treinos</span><b>${ss.length}</b></div><div><span>volume</span><b>${formatLoad(totalLoad)}</b></div></div><div class="history-list">${ss.map(s=>`<article class="history-card"><div class="history-date"><b>${new Date(s.startedAt).getDate()}</b><span>${new Intl.DateTimeFormat('pt-BR',{month:'short'}).format(new Date(s.startedAt))}</span></div><div><h3>${s.wName}</h3><p>${Math.round((s.duration||0)/60)} min · ${formatLoad(volumeOfSession(s))}${s.prs?.length?` · ${s.prs.length} PR`:''}</p></div><span class="history-check">✓</span></article>`).join('')}</div>`
    : `<section class="empty-story"><span>${iconSvg('spark')}</span><h3>ainda não tem história pra contar.</h3><p>fecha o primeiro treino e essa timeline começa a ganhar vida.</p><button class="cta-lime" id="emptyStart">começar hoje</button></section>`;
  shell(`<div class="page-head history-head"><div><span class="page-kicker">timeline</span><h2>histórico</h2></div><div class="streak-pill small-pill">${iconSvg('flame')} ${streak} dias</div></div>${content}`,{classes:'history-page'});if($('#emptyStart'))$('#emptyStart').onclick=()=>startSession(todayWorkout().id);
}

function renderProgress(){
  const ss=sessions().filter(s=>s.finishedAt).sort((a,b)=>b.startedAt-a.startedAt),exOptions=[...new Map(workoutPlan.flatMap(w=>w.exercises).map(e=>[e.id,e])).values()],selected=state.progressEx||exOptions[0].id,points=[];
  ss.slice().reverse().forEach(s=>{const ex=s.exercises.find(e=>e.id===selected);if(ex){const weights=ex.sets.filter(z=>z.done&&Number(z.weight)>0).map(z=>Number(z.weight));if(weights.length)points.push({date:new Date(s.startedAt),value:Math.max(...weights)})}});
  const max=Math.max(1,...points.map(p=>p.value)),min=Math.min(...points.map(p=>p.value),max),xp=xpStats();
  shell(`<div class="page-head progress-head"><div><span class="page-kicker">xp de força</span><h2>evolução</h2></div><span class="level-chip">nível ${xp.level}</span></div>
    <section class="xp-band"><div><span>nível ${xp.level}</span><b>${xp.current} / 100 XP</b></div><small>${100-xp.current} XP pro próximo nível · 20 XP por treino + 10 por PR</small><div class="xp-track"><i style="width:${xp.pct}%"></i></div></section>
    <div class="select-wrap"><label>exercício</label><select id="progressEx">${exOptions.map(e=>`<option value="${e.id}" ${e.id===selected?'selected':''}>${e.name}</option>`).join('')}</select></div>
    <section class="progress-blue"><div class="progress-copy"><span>melhor carga</span><strong>${points.length?Math.max(...points.map(p=>p.value))+'kg':'— kg'}</strong><small>${points.length>1?`+${Math.max(0,Math.max(...points.map(p=>p.value))-min)}kg desde o início`:'primeiro registro libera seu gráfico'}</small></div><div class="mini-chart">${points.length?points.slice(-10).map(p=>`<i style="height:${Math.max(12,p.value/max*100)}%"><span>${p.value}</span></i>`).join(''):'<div class="empty-chart"><b>0%</b><span>sem dados ainda — fecha um treino e começa a subir.</span></div>'}</div></section>
    <section class="xp-grid"><div><span>treinos</span><b>${ss.length}</b></div><div><span>carga acumulada</span><b>${formatLoad(ss.reduce((a,s)=>a+volumeOfSession(s),0))}</b></div></section>`,{classes:'progress-page'});$('#progressEx').onchange=e=>{state.progressEx=e.target.value;renderProgress()};
}

function renderBody(){
  const entries=body().sort((a,b)=>b.date.localeCompare(a.date)),latest=entries[0],previous=entries[1];
  const stat=(key,unit,label)=>{const val=latest?.[key];const d=delta(val,previous?.[key]);return `<div><div class="measure-value"><b>${val||'—'}</b><small>${unit}</small></div><p>${label}</p>${d!==null?`<em class="measure-delta">${d}${unit}</em>`:''}</div>`};
  shell(`<div class="page-head body-head"><div><span class="page-kicker">check-in</span><h2>corpo</h2></div><span class="level-chip">${entries.length?`${entries.length} registros`:'medidas'}</span></div>
    <section class="body-blue"><div class="body-blue-title"><span>último registro</span><small>${latest?new Intl.DateTimeFormat('pt-BR').format(new Date(latest.date+'T12:00:00')):'ainda vazio'}</small></div><div class="body-stats">${stat('weight','kg','peso')}${stat('waist','cm','cintura')}${stat('chest','cm','peito')}${stat('arm','cm','braço')}</div>${!latest?'<p class="body-empty-copy">seu primeiro check-in vira a linha de base da evolução.</p>':''}</section>
    <section class="form-card light measure-form"><h3>nova medição</h3><div class="form-grid"><label>data<input id="bodyDate" type="date" value="${new Date().toISOString().slice(0,10)}"></label><label>peso<div class="unit-input"><input id="bodyWeight" type="number" step="0.1" inputmode="decimal"><span>kg</span></div></label><label>cintura<div class="unit-input"><input id="bodyWaist" type="number" step="0.1" inputmode="decimal"><span>cm</span></div></label><label>peito<div class="unit-input"><input id="bodyChest" type="number" step="0.1" inputmode="decimal"><span>cm</span></div></label><label>braço<div class="unit-input"><input id="bodyArm" type="number" step="0.1" inputmode="decimal"><span>cm</span></div></label></div><button class="cta-lime" id="saveBody">salvar medição</button></section>
    ${entries.length?`<div class="measure-history">${entries.slice(0,10).map(e=>`<div><b>${new Intl.DateTimeFormat('pt-BR').format(new Date(e.date+'T12:00:00'))}</b><span>${[e.weight&&e.weight+'kg',e.waist&&e.waist+'cm cintura'].filter(Boolean).join(' · ')}</span></div>`).join('')}</div>`:''}`,{classes:'body-page'});
  $('#saveBody').onclick=()=>{const entry={id:Date.now(),date:$('#bodyDate').value,weight:$('#bodyWeight').value,waist:$('#bodyWaist').value,chest:$('#bodyChest').value,arm:$('#bodyArm').value};if(!entry.date)return toast('escolhe uma data');if(!entry.weight&&!entry.waist&&!entry.chest&&!entry.arm)return toast('preenche pelo menos uma medida');const all=body();all.push(entry);save(K.body,all);toast('medição salva');haptic();renderBody()};
}

function renderSettings(){
  const st=settings(),draft=load(K.draft,null);
  shell(`<div class="page-head settings-head"><div><span class="page-kicker">ajustes</span><h2>config</h2></div><button class="profile-btn" aria-label="perfil">${iconSvg('user')}</button></div>
    <section class="settings-intro"><b>deixa do seu jeito.</b><span>o treino fica em primeiro plano; o resto mora aqui.</span></section>
    <section class="form-card light compact-card"><h3>descanso</h3><label>tempo padrão<div class="unit-input"><input id="restDefault" type="number" min="30" max="180" step="15" value="${st.defaultRest||60}"><span>s</span></div></label></section>
    <section class="form-card light compact-card"><h3>app</h3><button class="settings-row" id="installBtn">instalar no celular <span>→</span></button><button class="settings-row" id="exportData">exportar backup <span>→</span></button><label class="settings-row">importar backup <span>→</span><input id="importData" type="file" accept="application/json" hidden></label>${draft?'<button class="settings-row danger" id="clearDraft">apagar treino em andamento <span>×</span></button>':''}</section>`,{classes:'settings-page'});
  $('#restDefault').onchange=e=>save(K.settings,{...st,defaultRest:Number(e.target.value)});$('#installBtn').onclick=installApp;$('#exportData').onclick=exportData;$('#importData').onchange=importData;if($('#clearDraft'))$('#clearDraft').onclick=()=>{localStorage.removeItem(K.draft);toast('rascunho apagado');renderSettings()};
}
function installApp(){if(state.installPrompt){state.installPrompt.prompt();state.installPrompt.userChoice.finally(()=>state.installPrompt=null)}else{alert('no iPhone: Safari → Compartilhar → Adicionar à Tela de Início.')}}
function exportData(){const data={sessions:sessions(),body:body(),settings:settings(),exportedAt:new Date().toISOString()};const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='v60-backup.json';a.click();URL.revokeObjectURL(a.href)}
function importData(e){const f=e.target.files?.[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{const d=JSON.parse(r.result);if(d.sessions)save(K.sessions,d.sessions);if(d.body)save(K.body,d.body);if(d.settings)save(K.settings,d.settings);toast('backup importado');render()}catch{alert('arquivo inválido')}};r.readAsText(f)}

function render(){if(state.page!=='session')clearInterval(state.sessionClock);switch(state.page){case'home':renderHome();break;case'workouts':renderWorkouts();break;case'history':renderHistory();break;case'progress':renderProgress();break;case'body':renderBody();break;case'settings':renderSettings();break;case'session':renderSession();break;case'finish':renderFinish();break;default:state.page='home';renderHome();}}
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();state.installPrompt=e});
if('serviceWorker'in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
render();