const V60_SMART_SEQUENCE_KEY='v60_smart_sequence_v1';
const V60_ATTENDANCE_KEY='v60_attendance_v1';
const V60_SMART_MIGRATION_KEY='v60_smart_sequence_bootstrap_20260917';
const V60_REPORTED_HISTORY_KEY='v60_reported_history_bootstrap_20260917_v1';
const V60_REPORTED_TODAY_KEY='v60_reported_history_20260918_v1';
const V60_REPORTED_TODAY_0919_KEY='v60_reported_history_20260919_v1';

// A→E follows recovery better than weekday locking.
// Confirmed current anchor: back (A) → chest (B) → legs (C next).
const V60_SEQUENCE=[
  {letter:'A',workoutId:'qua',label:'costas + bíceps'},
  {letter:'B',workoutId:'seg',label:'peito + ombro'},
  {letter:'C',workoutId:'ter',label:'pernas'},
  {letter:'D',workoutId:'qui',label:'peito + braços'},
  {letter:'E',workoutId:'sex',label:'posterior + costas'}
];

function v60DateKey(value){
  const d=value instanceof Date?value:new Date(value);
  const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,'0'),day=String(d.getDate()).padStart(2,'0');
  return `${y}-${m}-${day}`;
}
function v60LoadAttendance(){return load(V60_ATTENDANCE_KEY,[]);}
function v60SaveAttendance(rows){save(V60_ATTENDANCE_KEY,rows);}
function v60BootstrapAttendance(){
  if(load(V60_SMART_MIGRATION_KEY,false))return;
  const confirmed=['2026-09-14','2026-09-15','2026-09-16','2026-09-17'];
  const existing=v60LoadAttendance();
  const seen=new Set(existing.map(x=>x.date));
  confirmed.forEach(date=>{if(!seen.has(date))existing.push({date,source:'manual-confirmed'});});
  v60SaveAttendance(existing);
  const seq=load(V60_SMART_SEQUENCE_KEY,null);
  if(!seq)save(V60_SMART_SEQUENCE_KEY,{nextWorkoutId:'ter',updatedAt:Date.now(),anchor:'back-chest-legs'});
  save(V60_SMART_MIGRATION_KEY,true);
}
function v60BootstrapReportedHistory(){
  if(load(V60_REPORTED_HISTORY_KEY,false))return;

  const reported=[
    {
      date:'2026-09-14',workoutId:'seg',
      loads:{
        'supino-inclinado':10,'desenvolvimento':10,'elevacao-lateral':10,
        'crucifixo-baixo-alto':10,'triceps-pushdown':30,'triceps-overhead':20
      },
      sets:{
        'supino-inclinado':3,'desenvolvimento':3,'elevacao-lateral':3,
        'crucifixo-baixo-alto':3,'triceps-pushdown':3,'triceps-overhead':3
      },
      reps:{'supino-inclinado':10}
    },
    {
      date:'2026-09-15',workoutId:'ter',
      loads:{
        'leg-press':80,'agachamento-smith':30,'extensora':20,'flexora':25,
        'abdutora':35,'adutora-historico':35,'panturrilha':60
      }
    },
    {
      date:'2026-09-16',workoutId:'qua',
      loads:{
        'puxada-aberta':30,'remada-baixa':30,'pullover':25,
        'crucifixo-inverso':10,'rosca-polia':20,'rosca-martelo':20
      }
    },
    {
      date:'2026-09-17',workoutId:'qui',
      loads:{
        'supino-reto':20,'elevacao-lateral-2':10,'face-pull':10,
        'triceps-overhead-2':10,'rosca-unilateral':5
      }
    }
  ];

  const all=sessions();
  for(const row of reported){
    const startedAt=new Date(row.date+'T12:00:00').getTime();
    if(all.some(x=>x.manualHistoryKey===row.date||(
      x.workoutId===row.workoutId&&v60DateKey(x.startedAt)===row.date
    )))continue;

    const plan=workoutPlan.find(w=>w.id===row.workoutId);
    const exercises=Object.entries(row.loads).map(([id,weight])=>{
      const base=plan?.exercises?.find(ex=>ex.id===id);
      const custom=id==='adutora-historico'
        ? {id,name:'adutora',equipment:'Máquina adutora',icon:'↔️',min:'',max:'',rest:60}
        : base;
      const count=Math.max(1,Number(row.sets?.[id])||1);
      const knownReps=row.reps?.[id];
      return {
        ...(custom||{id,name:id,equipment:'',icon:'',min:'',max:'',rest:60}),
        reportedSetCount:row.sets?.[id]||null,
        sets:Array.from({length:count},(_,i)=>({
          n:i+1,weight:String(weight),reps:knownReps?String(knownReps):'',
          done:true,reported:true,repsKnown:Boolean(knownReps)
        }))
      };
    });

    all.push({
      id:'reported-'+row.date+'-'+row.workoutId,
      manualHistoryKey:row.date,
      source:'user-reported-2026-09-17',
      manualConfirmed:true,
      excludeFromVolume:true,
      workoutId:row.workoutId,
      wName:plan?.name||row.workoutId,
      startedAt,
      finishedAt:startedAt+1,
      duration:0,
      exercises,
      extras:[],
      prs:[]
    });
  }
  save(K.sessions,all);
  save(V60_REPORTED_HISTORY_KEY,true);
}

function v60BootstrapReportedToday(){
  if(load(V60_REPORTED_TODAY_KEY,false))return;
  const date='2026-09-18',workoutId='ter';
  const all=sessions();

  const existing=all.find(x=>x.finishedAt&&x.workoutId===workoutId&&v60DateKey(x.startedAt)===date);
  if(!existing){
    const plan=workoutPlan.find(w=>w.id===workoutId);
    const rows=[
      ['extensora','extensora','Cadeira extensora',4,10,25,null],
      ['flexora','flexora','Flexora',4,10,20,null],
      ['abdutora','abdutora','Máquina abdutora',4,10,25,null],
      ['adutora','adutora','Máquina adutora',4,10,20,null],
      ['agachamento-smith','agachamento Smith','Smith',4,10,10,'por lado'],
      ['leg-press','leg press 45°','Leg press 45°',4,10,80,null],
      ['mesa-flexora','mesa flexora','Mesa flexora',3,10,20,null],
      ['elevacao-pelvica','elevação pélvica','Máquina / barra',3,10,20,'por lado']
    ];
    const exercises=rows.map(([id,name,equipment,setCount,reps,weight,loadBasis])=>{
      const base=plan?.exercises?.find(ex=>ex.id===id);
      return {
        ...(base||{id,name,equipment,icon:'',min:reps,max:reps,rest:60}),
        id,name,equipment,
        reportedLoadBasis:loadBasis||null,
        sets:Array.from({length:setCount},(_,i)=>({
          n:i+1,weight:String(weight),reps:String(reps),done:true,
          reported:true,repsKnown:true,loadBasis:loadBasis||null
        }))
      };
    });
    const startedAt=new Date(date+'T12:00:00').getTime();
    all.push({
      id:'reported-'+date+'-'+workoutId,
      manualHistoryKey:date,
      source:'user-reported-2026-09-18',
      manualConfirmed:true,
      workoutId,
      wName:'pernas completas',
      startedAt,
      finishedAt:startedAt+1,
      duration:0,
      exercises,
      extras:[],
      prs:[]
    });
    save(K.sessions,all);
  }

  const attendance=v60LoadAttendance();
  if(!attendance.some(x=>x.date===date)){
    attendance.push({date,source:'manual-confirmed'});
    v60SaveAttendance(attendance);
  }

  const seq=v60SequenceState();
  if(seq.nextWorkoutId==='ter'){
    v60AdvanceSequence('ter');
  }

  const draft=load(K.draft,null);
  if(draft&&draft.workoutId===workoutId&&!draft.finishedAt&&v60DateKey(draft.startedAt||Date.now())===date){
    const anyDone=(draft.exercises||[]).some(ex=>(ex.sets||[]).some(set=>set.done));
    if(!anyDone) localStorage.removeItem(K.draft);
  }

  save(V60_REPORTED_TODAY_KEY,true);
}

function v60BootstrapReportedToday0919(){
  if(load(V60_REPORTED_TODAY_0919_KEY,false))return;
  const date='2026-09-19',workoutId='qui';
  const all=sessions();
  const existing=all.find(x=>x.finishedAt&&x.workoutId===workoutId&&v60DateKey(x.startedAt)===date);
  if(!existing){
    const plan=workoutPlan.find(w=>w.id===workoutId);
    const draft=load(K.draft,null);
    const matchingDraft=draft&&draft.workoutId===workoutId&&v60DateKey(draft.startedAt||Date.now())===date?draft:null;
    const oldById=new Map((matchingDraft?.exercises||[]).map(ex=>[ex.id,ex]));
    const exercises=(plan?.exercises||[]).map(ex=>{
      const old=oldById.get(ex.id);
      const oldSets=Array.isArray(old?.sets)?old.sets:[];
      const count=Math.max(1,Number(ex.sets)||oldSets.length||1);
      return {...ex,reported:true,sets:Array.from({length:count},(_,i)=>{
        const prev=oldSets[i]||{};
        const usesLoad=typeof tracoExerciseUsesLoad==='function'?tracoExerciseUsesLoad(ex):true;
        return {...prev,n:i+1,weight:usesLoad?(prev.weight??''):'',reps:prev.reps??'',done:true,reported:true,repsKnown:Boolean(prev.reps),skipped:false};
      })};
    });
    const startedAt=matchingDraft?.startedAt||new Date(date+'T12:00:00').getTime();
    all.push({
      id:'reported-'+date+'-'+workoutId,manualHistoryKey:date,source:'user-reported-2026-09-19',manualConfirmed:true,excludeFromVolume:true,
      workoutId,wName:plan?.name||'peitão + ombros + braços',startedAt,finishedAt:Date.now(),duration:matchingDraft?Math.max(1,Math.floor((Date.now()-startedAt)/1000)):0,
      exercises,extras:matchingDraft?.extras||[],prs:[]
    });
    save(K.sessions,all);
  }
  const attendance=v60LoadAttendance();
  if(!attendance.some(x=>x.date===date)){attendance.push({date,source:'manual-confirmed'});v60SaveAttendance(attendance);}
  const seq=v60SequenceState();
  if(seq.nextWorkoutId===workoutId)v60AdvanceSequence(workoutId);
  const draft=load(K.draft,null);
  if(draft&&draft.workoutId===workoutId&&v60DateKey(draft.startedAt||Date.now())===date)localStorage.removeItem(K.draft);
  save(V60_REPORTED_TODAY_0919_KEY,true);
}

function v60AllAttendanceDates(){
  const dates=new Set(v60LoadAttendance().map(x=>x.date));
  sessions().filter(s=>s.finishedAt).forEach(s=>dates.add(v60DateKey(s.startedAt)));
  return dates;
}
function v60AttendanceThisWeek(){
  const start=v60WeekStart(),end=new Date(start);end.setDate(end.getDate()+7);
  return [...v60AllAttendanceDates()].filter(key=>{
    const d=new Date(key+'T12:00:00');return d>=start&&d<end;
  }).sort();
}
function v60PrevTrainingDate(d){
  const x=new Date(d);x.setDate(x.getDate()-1);
  while(x.getDay()===0||x.getDay()===6)x.setDate(x.getDate()-1);
  return x;
}
function v60TrainingStreak(){
  const set=v60AllAttendanceDates();
  if(!set.size)return 0;
  const dates=[...set].sort();
  let cursor=new Date(dates[dates.length-1]+'T12:00:00'),streak=1;
  while(true){
    const prev=v60PrevTrainingDate(cursor),key=v60DateKey(prev);
    if(!set.has(key))break;
    streak++;cursor=prev;
  }
  return streak;
}
function v60SequenceState(){return load(V60_SMART_SEQUENCE_KEY,{nextWorkoutId:'ter'});}
function v60SequenceItem(workoutId){return V60_SEQUENCE.find(x=>x.workoutId===workoutId)||V60_SEQUENCE[0];}
function v60RecommendedWorkout(){
  const id=v60SequenceState().nextWorkoutId;
  return workoutPlan.find(w=>w.id===id)||workoutPlan.find(w=>w.id==='ter')||workoutPlan[0];
}
function v60AdvanceSequence(workoutId){
  const i=V60_SEQUENCE.findIndex(x=>x.workoutId===workoutId);
  const next=V60_SEQUENCE[(i>=0?i+1:0)%V60_SEQUENCE.length];
  save(V60_SMART_SEQUENCE_KEY,{nextWorkoutId:next.workoutId,updatedAt:Date.now(),lastWorkoutId:workoutId});
}
function v60SetRecommended(workoutId){
  if(!V60_SEQUENCE.some(x=>x.workoutId===workoutId))return;
  save(V60_SMART_SEQUENCE_KEY,{...v60SequenceState(),nextWorkoutId:workoutId,updatedAt:Date.now(),manual:true});
  state.selectedWorkout=workoutId;render();
}

v60BootstrapAttendance();
v60BootstrapReportedHistory();
v60BootstrapReportedToday();
v60BootstrapReportedToday0919();

// Replace calendar-day prescription with the current A→E recommendation.
todayWorkout=function(){return v60RecommendedWorkout();};

// Streak is attendance-based and ignores Saturday/Sunday as planned recovery days.
calcStreak=function(){return v60TrainingStreak();};

// Weekly goal uses attendance, while volume remains based only on fully logged sessions.
v60WeeklyGoalMarkup=function(){
  const p=v60Profile(),done=v60AttendanceThisWeek().length,goal=Math.max(1,Number(p.weeklyGoal)||5),pct=Math.min(100,Math.round(done/goal*100));
  return `<section class="v60-goal-card"><div><span>meta da semana</span><strong>${done}/${goal} treinos</strong></div><div class="v60-goal-track"><i style="width:${pct}%"></i></div><small>${done>=goal?'meta batida. boa!':`${Math.max(0,goal-done)} pra fechar a semana`}</small></section>`;
};

v60WeekBuckets=function(count=8){
  const ss=v60CompletedSessions(),attendance=v60AllAttendanceDates(),thisWeek=v60WeekStart(),result=[];
  for(let i=count-1;i>=0;i--){
    const start=new Date(thisWeek);start.setDate(start.getDate()-i*7);
    const end=new Date(start);end.setDate(end.getDate()+7);
    const week=ss.filter(s=>s.startedAt>=start.getTime()&&s.startedAt<end.getTime());
    const attended=[...attendance].filter(key=>{const d=new Date(key+'T12:00:00');return d>=start&&d<end;});
    const cardio=week.reduce((sum,s)=>sum+(s.extras||[]).filter(x=>x.type==='cardio').reduce((a,x)=>a+Number(x.minutes||0),0),0);
    result.push({start,count:attended.length,volume:week.reduce((a,s)=>a+volumeOfSession(s),0),cardio});
  }
  return result;
};

const v60SmartBaseFinishSession=finishSession;
finishSession=function(){
  const activeId=state.activeSession?.id;
  const workoutId=state.activeSession?.workoutId;
  const startedAt=state.activeSession?.startedAt;
  v60SmartBaseFinishSession();
  const finished=activeId&&sessions().some(s=>String(s.id)===String(activeId)&&s.finishedAt);
  if(!finished)return;
  if(workoutId){
    v60AdvanceSequence(workoutId);
    const key=v60DateKey(startedAt||Date.now()),rows=v60LoadAttendance();
    if(!rows.some(x=>x.date===key)){rows.push({date:key,source:'logged-session'});v60SaveAttendance(rows);}
  }
};

function v60AttendanceStrip(){
  const start=v60WeekStart(),dates=v60AttendanceThisWeek(),set=new Set(dates),names=['seg','ter','qua','qui','sex'];
  return names.map((name,i)=>{
    const d=new Date(start);d.setDate(d.getDate()+i);const key=v60DateKey(d),done=set.has(key),today=key===v60DateKey(new Date());
    return `<span class="week-chip v60-attendance-chip ${done?'done':''} ${today?'today':''}"><b>${name}</b><span>${done?'✓':'·'}</span></span>`;
  }).join('');
}
function v60SequenceBadge(workoutId){
  const x=v60SequenceItem(workoutId);return `${x.letter}`;
}

const v60SmartBaseRenderHome=renderHome;
renderHome=function(){
  v60SmartBaseRenderHome();
  const w=v60RecommendedWorkout(),item=v60SequenceItem(w.id);
  const streak=document.querySelector('.streak-pill b');if(streak)streak.textContent=v60TrainingStreak();
  const kicker=document.querySelector('.today-card .card-kicker');if(kicker)kicker.textContent='próximo recomendado';
  const cardStrong=document.querySelector('.today-card strong');if(cardStrong)cardStrong.textContent=`Treino ${item.letter} · ${w.exercises.length} exercícios`;
  const strip=document.querySelector('.week-strip');if(strip)strip.innerHTML=v60AttendanceStrip();
  const link=document.querySelector('#seeWeek');if(link)link.textContent='ver sequência A–E';
  const title=document.querySelector('.editorial-title');if(title)title.textContent=w.short;
  if(link)link.onclick=()=>{state.page='workouts';state.selectedWorkout=w.id;renderWorkouts();};
};

const v60SmartBaseRenderWorkouts=renderWorkouts;
renderWorkouts=function(){
  v60SmartBaseRenderWorkouts();
  const stack=document.querySelector('.workout-stack');
  if(stack){
    V60_SEQUENCE.forEach(item=>{
      const el=stack.querySelector(`[data-workout="${item.workoutId}"]`);
      if(el){
        const n=el.querySelector('.workout-num');if(n)n.textContent=item.letter;
        const small=el.querySelector('small');if(small)small.textContent=small.textContent.replace(' exercícios',' exercícios · sequência');
        stack.appendChild(el);
      }
    });
  }
  const kicker=document.querySelector('.workouts-page .page-kicker');if(kicker)kicker.textContent='sequência flexível';
  const count=document.querySelector('.workouts-page .page-count');if(count)count.textContent='A→E';
  const selected=workoutPlan.find(w=>w.id===(state.selectedWorkout||v60RecommendedWorkout().id));
  const selectedItem=v60SequenceItem(selected?.id);
  const blue=document.querySelector('.selected-blue>span');if(blue)blue.textContent=selected?.id===v60RecommendedWorkout().id?`próximo recomendado · ${selectedItem.letter}`:`treino ${selectedItem.letter}`;
  const main=document.querySelector('.workouts-page');
  if(main&&!main.querySelector('.v60-sequence-note')){
    const rec=v60RecommendedWorkout(),r=v60SequenceItem(rec.id);
    main.querySelector('.workout-stack')?.insertAdjacentHTML('beforebegin',`<section class="v60-sequence-note"><div><span>agora</span><b>Treino ${r.letter} · ${v60Safe(rec.short)}</b></div><small>não depende do dia da semana · você ainda pode escolher outro treino manualmente</small></section>`);
  }
};

// Re-render after the last compatibility layer has loaded.
render();
