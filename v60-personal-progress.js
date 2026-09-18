const V60_PROFILE_KEY='v60_profile';
const V60_ABS_DEFAULTS='v60_abs_defaults';

function v60Profile(){
  return load(V60_PROFILE_KEY,{name:'Cauê',weeklyGoal:5,reviewWeeks:6});
}
function v60SaveProfile(next){save(V60_PROFILE_KEY,{...v60Profile(),...next});}
function v60Safe(v){return String(v??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[ch]));}
function v60CompletedSessions(){return sessions().filter(s=>s.finishedAt).sort((a,b)=>b.startedAt-a.startedAt);}
function v60PreviousExercise(exId){
  for(const s of v60CompletedSessions()){
    const ex=(s.exercises||[]).find(e=>e.id===exId);
    if(ex)return ex;
  }
  return null;
}
function v60SeedExerciseSets(ex){
  const prev=v60PreviousExercise(ex.id);
  if(!prev?.sets?.length)return;
  const prevKnown=prev.sets.filter(x=>x.done&&x.weight!==''&&x.weight!=null);
  if(!prevKnown.length)return;
  const fallback=prevKnown[prevKnown.length-1];
  ex.sets.forEach((set,i)=>{
    if(set.done)return;
    const source=prevKnown[i]||fallback;
    if((set.weight===''||set.weight==null)&&source?.weight!=='')set.weight=source.weight;
    if((set.reps===''||set.reps==null)&&source?.reps!==''&&source?.reps!=null)set.reps=source.reps;
  });
}
function v60SeedActiveSession(){
  if(!state.activeSession?.exercises)return;
  state.activeSession.exercises.forEach(v60SeedExerciseSets);
  if(!Array.isArray(state.activeSession.extras))state.activeSession.extras=[];
  save(K.draft,state.activeSession);
}

const v60BaseStartSession=startSession;
startSession=function(workoutId){
  v60BaseStartSession(workoutId);
  if(!state.activeSession)return;
  v60SeedActiveSession();
  renderSession();
};

const v60BaseCompleteCurrentSet=completeCurrentSet;
completeCurrentSet=function(){
  const s=state.activeSession;
  const ex=s?.exercises?.[state.currentExercise];
  const si=ex?currentSetIndex(ex):-1;
  const set=si>=0?ex.sets[si]:null;
  if(set&&set.weight&&set.reps&&si+1<ex.sets.length){
    const next=ex.sets[si+1];
    if(next.weight===''||next.weight==null)next.weight=set.weight;
    if(next.reps===''||next.reps==null)next.reps=set.reps;
    save(K.draft,s);
  }
  v60BaseCompleteCurrentSet();
};

function v60WeekStart(d=new Date()){
  const x=new Date(d);x.setHours(0,0,0,0);const diff=(x.getDay()+6)%7;x.setDate(x.getDate()-diff);return x;
}
function v60WeekBuckets(count=8){
  const ss=v60CompletedSessions();
  const thisWeek=v60WeekStart();
  const result=[];
  for(let i=count-1;i>=0;i--){
    const start=new Date(thisWeek);start.setDate(start.getDate()-i*7);
    const end=new Date(start);end.setDate(end.getDate()+7);
    const week=ss.filter(s=>s.startedAt>=start.getTime()&&s.startedAt<end.getTime());
    const cardio=week.reduce((sum,s)=>sum+(s.extras||[]).filter(x=>x.type==='cardio').reduce((a,x)=>a+Number(x.minutes||0),0),0);
    result.push({start,count:week.length,volume:week.reduce((a,s)=>a+volumeOfSession(s),0),cardio});
  }
  return result;
}
function v60WeeklyGoalMarkup(){
  const p=v60Profile(),done=weekSessions().length,goal=Math.max(1,Number(p.weeklyGoal)||5),pct=Math.min(100,Math.round(done/goal*100));
  return `<section class="v60-goal-card"><div><span>meta da semana</span><strong>${done}/${goal} treinos</strong></div><div class="v60-goal-track"><i style="width:${pct}%"></i></div><small>${done>=goal?'meta batida. boa!':`${Math.max(0,goal-done)} pra fechar a semana`}</small></section>`;
}

const v60BaseRenderHome=renderHome;
renderHome=function(){
  v60BaseRenderHome();
  const p=v60Profile(),head=document.querySelector('.home-head'),weekday=document.querySelector('.weekday');
  if(head&&!document.querySelector('.v60-personal-greeting'))head.insertAdjacentHTML('afterend',`<div class="v60-personal-greeting">e aí, <b>${v60Safe(p.name||'Cauê')}</b>!</div>`);
  if(weekday&&!document.querySelector('.v60-goal-card'))weekday.insertAdjacentHTML('beforebegin',v60WeeklyGoalMarkup());
};

function v60ExtraSummary(extras=[]){
  const parts=[];
  const abs=extras.filter(x=>x.type==='abs');
  const cardio=extras.filter(x=>x.type==='cardio');
  if(abs.length){const last=abs[abs.length-1];parts.push(`abdômen ${last.sets}×${last.reps}${last.weight?` · ${last.weight}kg`:''}`);}
  if(cardio.length){const total=cardio.reduce((a,x)=>a+Number(x.minutes||0),0);parts.push(`cardio ${total}min`);}
  return parts.join(' · ');
}
function v60ExtrasPanel(){
  const extras=state.activeSession?.extras||[],summary=v60ExtraSummary(extras);
  return `<section class="v60-extras-card"><div><span>extras de hoje</span><b>${summary||'se quiser, fecha com um extra'}</b></div><div class="v60-extra-actions"><button id="v60AddAbs" type="button">+ abdômen na polia</button><button id="v60AddCardio" type="button">+ cardio</button></div>${extras.length?`<button class="v60-clear-extras" id="v60ClearExtras" type="button">limpar extras</button>`:''}</section>`;
}
function v60CloseExtraModal(){document.querySelector('#v60ExtraModal')?.remove();}
function v60OpenExtraModal(kind){
  v60CloseExtraModal();
  const absDefaults=load(V60_ABS_DEFAULTS,{sets:3,reps:12,weight:''});
  const body=kind==='abs'
    ? `<div class="v60-modal-head"><span>extra</span><h3>abdômen na polia</h3><p>crunch ajoelhado · controlado</p></div><div class="v60-modal-grid"><label>séries<input id="v60ExtraSets" type="number" min="1" max="6" value="${v60Safe(absDefaults.sets)}"></label><label>reps<input id="v60ExtraReps" type="number" min="5" max="30" value="${v60Safe(absDefaults.reps)}"></label><label class="wide">carga (kg)<input id="v60ExtraWeight" type="number" min="0" step="0.5" value="${v60Safe(absDefaults.weight)}" placeholder="0"></label></div>`
    : `<div class="v60-modal-head"><span>extra</span><h3>cardio</h3><p>registra só se fizer hoje</p></div><div class="v60-modal-grid"><label class="wide">tipo<select id="v60CardioType"><option>escada</option><option>esteira inclinada</option><option>caminhada</option><option>corrida</option><option>bike</option><option>elíptico</option></select></label><label>minutos<input id="v60CardioMinutes" type="number" min="1" max="180" value="15"></label><label>kcal (opcional)<input id="v60CardioCalories" type="number" min="0" placeholder="0"></label></div>`;
  document.body.insertAdjacentHTML('beforeend',`<div class="v60-extra-modal" id="v60ExtraModal"><div class="v60-extra-sheet">${body}<div class="v60-modal-actions"><button id="v60CancelExtra" type="button">cancelar</button><button id="v60SaveExtra" type="button">salvar</button></div></div></div>`);
  document.querySelector('#v60ExtraModal').onclick=e=>{if(e.target.id==='v60ExtraModal')v60CloseExtraModal();};
  document.querySelector('#v60CancelExtra').onclick=v60CloseExtraModal;
  document.querySelector('#v60SaveExtra').onclick=()=>{
    if(!state.activeSession)return v60CloseExtraModal();
    if(!Array.isArray(state.activeSession.extras))state.activeSession.extras=[];
    if(kind==='abs'){
      const extra={type:'abs',name:'crunch na polia',sets:Number(document.querySelector('#v60ExtraSets').value)||3,reps:Number(document.querySelector('#v60ExtraReps').value)||12,weight:document.querySelector('#v60ExtraWeight').value||'',at:Date.now()};
      state.activeSession.extras.push(extra);save(V60_ABS_DEFAULTS,{sets:extra.sets,reps:extra.reps,weight:extra.weight});
    }else{
      const minutes=Number(document.querySelector('#v60CardioMinutes').value)||0;if(minutes<=0)return;
      state.activeSession.extras.push({type:'cardio',name:document.querySelector('#v60CardioType').value,minutes,calories:Number(document.querySelector('#v60CardioCalories').value)||0,at:Date.now()});
    }
    save(K.draft,state.activeSession);v60CloseExtraModal();toast('extra salvo');renderSession();
  };
}

const v60BaseRenderSession=renderSession;
renderSession=function(){
  v60BaseRenderSession();
  if(!state.activeSession)return;
  const footer=document.querySelector('.session-footer');
  if(footer&&!document.querySelector('.v60-extras-card'))footer.insertAdjacentHTML('beforebegin',v60ExtrasPanel());
  const abs=document.querySelector('#v60AddAbs'),cardio=document.querySelector('#v60AddCardio'),clear=document.querySelector('#v60ClearExtras');
  if(abs)abs.onclick=()=>v60OpenExtraModal('abs');
  if(cardio)cardio.onclick=()=>v60OpenExtraModal('cardio');
  if(clear)clear.onclick=()=>{state.activeSession.extras=[];save(K.draft,state.activeSession);renderSession();};
};

const v60BaseRenderHistory=renderHistory;
renderHistory=function(){
  v60BaseRenderHistory();
  const ss=v60CompletedSessions(),cards=[...document.querySelectorAll('.history-card')];
  cards.forEach((card,i)=>{
    const sess=ss[i],p=card.querySelector('p');
    if(sess?.manualConfirmed&&p){
      const loads=(sess.exercises||[]).filter(ex=>(ex.sets||[]).some(set=>set.weight!=='')).length;
      const knownReps=(sess.exercises||[]).some(ex=>(ex.sets||[]).some(set=>set.reps!==''));
      p.textContent=`${loads} cargas registradas · ${knownReps?'reps parciais':'reps pendentes'}`;
    }
    const txt=v60ExtraSummary(sess?.extras||[]);
    if(txt&&p)p.insertAdjacentHTML('beforeend',`<span class="v60-history-extra"> · ${v60Safe(txt)}</span>`);
  });
};

function v60ProgressPlusMarkup(){
  const p=v60Profile(),weeks=v60WeekBuckets(8),goal=Math.max(1,Number(p.weeklyGoal)||5),maxCount=Math.max(goal,...weeks.map(w=>w.count),1),maxVol=Math.max(...weeks.map(w=>w.volume),1);
  const cardioThisWeek=weeks[weeks.length-1]?.cardio||0;
  const totalSessions=v60CompletedSessions().length;
  const bars=weeks.map((w,i)=>`<div class="v60-week-bar"><div class="v60-bar-stack"><i style="height:${Math.max(5,Math.round(w.count/maxCount*100))}%"></i></div><b>${w.count}</b><span>${new Intl.DateTimeFormat('pt-BR',{day:'2-digit',month:'2-digit'}).format(w.start)}</span></div>`).join('');
  const volumes=weeks.map(w=>`<i style="height:${Math.max(4,Math.round(w.volume/maxVol*100))}%" title="${Math.round(w.volume)}kg"></i>`).join('');
  return `<section class="v60-progress-plus"><div class="v60-progress-title"><div><span>consistência</span><h3>últimas 8 semanas</h3></div><b>${weekSessions().length}/${goal}</b></div><div class="v60-week-bars">${bars}</div><div class="v60-mini-kpis"><div><span>treinos totais</span><b>${totalSessions}</b></div><div><span>cardio esta semana</span><b>${cardioThisWeek}min</b></div></div><div class="v60-volume-block"><span>volume semanal</span><div class="v60-volume-bars">${volumes}</div></div></section>`;
}
const v60BaseRenderProgress=renderProgress;
renderProgress=function(){
  v60BaseRenderProgress();
  const main=document.querySelector('.progress-page');
  if(main&&!document.querySelector('.v60-progress-plus'))main.insertAdjacentHTML('beforeend',v60ProgressPlusMarkup());
};

const v60BaseRenderSettings=renderSettings;
renderSettings=function(){
  v60BaseRenderSettings();
  const p=v60Profile(),intro=document.querySelector('.settings-intro');
  if(intro&&!document.querySelector('.v60-profile-card'))intro.insertAdjacentHTML('afterend',`<section class="form-card light compact-card v60-profile-card"><h3>você</h3><label>nome<input id="v60ProfileName" type="text" maxlength="24" value="${v60Safe(p.name||'Cauê')}"></label><label>meta de academia por semana<div class="unit-input"><input id="v60WeeklyGoal" type="number" min="1" max="7" value="${Number(p.weeklyGoal)||5}"><span>dias</span></div></label><label>revisar treino a cada<div class="unit-input"><input id="v60ReviewWeeks" type="number" min="4" max="12" value="${Number(p.reviewWeeks)||6}"><span>sem</span></div></label><small class="v60-profile-note">seu nome e preferências ficam neste aparelho até ativarmos a sincronização.</small></section>`);
  const name=document.querySelector('#v60ProfileName'),goal=document.querySelector('#v60WeeklyGoal'),review=document.querySelector('#v60ReviewWeeks');
  if(name)name.onchange=e=>{v60SaveProfile({name:e.target.value.trim()||'Cauê'});toast('nome salvo');};
  if(goal)goal.onchange=e=>{v60SaveProfile({weeklyGoal:Math.max(1,Math.min(7,Number(e.target.value)||5))});toast('meta salva');};
  if(review)review.onchange=e=>{v60SaveProfile({reviewWeeks:Math.max(4,Math.min(12,Number(e.target.value)||6))});toast('revisão salva');};
};
