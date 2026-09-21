/*
 * Traço Lab 1.0
 * Recuperação, treino adaptativo, decisões de rotina e experimentos de shape.
 */
(function(){
  'use strict';

  const VERSION='1.0.0';
  const LAB_KEY='traco_lab_v1';
  const DAILY_KEY='traco_lab_daily_v1';
  const BODY_LOG_KEY='traco_body_daily_v1';
  const PREF_KEY='traco_exercise_preferences_v1';
  const PHASE_KEY='traco_shape_phase_v1';
  const GOALS_KEY='traco_shape_goals_v1';
  const EXP_KEY='traco_experiments_v1';
  const GROCERY_KEY='traco_grocery_v1';
  const PHOTO_DB='traco_photo_checkins_v1';
  const PHOTO_STORE='checkins';

  const qs=s=>document.querySelector(s);
  const qsa=s=>Array.from(document.querySelectorAll(s));
  const esc=v=>String(v==null?'':v).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[ch]));
  const read=(k,d)=>{try{const v=JSON.parse(localStorage.getItem(k));return v==null?d:v}catch{return d}};
  const write=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
  function dateKey(d=new Date()){const x=new Date(d);return x.getFullYear()+'-'+String(x.getMonth()+1).padStart(2,'0')+'-'+String(x.getDate()).padStart(2,'0')}
  function localDay(ms){return dateKey(new Date(ms))}
  function lab(){return read(LAB_KEY,{})}
  function labDaily(){return read(DAILY_KEY,{})}
  function bodyLogs(){return read(BODY_LOG_KEY,{})}
  function todayLab(){
    const all=labDaily(),key=dateKey();
    return Object.assign({date:key,salty:false,lateMeal:false,lowWater:false,constipation:false,bloating:'',soreness:{},hungerType:'',readinessNote:'',steps:''},all[key]||{});
  }
  function saveTodayLab(patch){
    const all=labDaily(),key=dateKey(),now=todayLab();
    all[key]=Object.assign({},now,patch,{date:key,updatedAt:Date.now()});
    write(DAILY_KEY,all);try{haptic()}catch{}
  }
  function todayBodyLog(){return Object.assign({},bodyLogs()[dateKey()]||{})}
  function setBodyLogPatch(patch){
    const all=bodyLogs(),key=dateKey(),current=Object.assign({date:key},all[key]||{});
    all[key]=Object.assign(current,patch,{updatedAt:Date.now()});write(BODY_LOG_KEY,all);
  }
  function latestBody(){
    return body().slice().sort((a,b)=>b.date.localeCompare(a.date))[0]||null;
  }
  function daysAgo(n){const d=new Date();d.setDate(d.getDate()-n);d.setHours(0,0,0,0);return d.getTime()}
  function recentSessions(days=28){
    return sessions().filter(s=>s.finishedAt&&s.startedAt>=daysAgo(days)).sort((a,b)=>a.startedAt-b.startedAt);
  }
  function cardioMinutes(days=7){
    return recentSessions(days).reduce((sum,s)=>sum+(s.extras||[]).filter(x=>x.type==='cardio').reduce((a,x)=>a+Number(x.minutes||0),0),0);
  }
  function workoutCount(days=7){return recentSessions(days).length}
  function avgBodyLog(field,days=7){
    const cutoff=dateKey(new Date(Date.now()-(days-1)*86400000));
    const vals=Object.values(bodyLogs()).filter(x=>x.date>=cutoff).map(x=>Number(x[field]||0)).filter(Boolean);
    return vals.length?vals.reduce((a,b)=>a+b,0)/vals.length:0;
  }

  /* RECOVERY + BLOATING */
  function readiness(){
    const b=todayBodyLog(),l=todayLab();
    const sleep=Number(b.sleepHours||0);
    const energy=b.energy||'';
    const sore=Object.values(l.soreness||{}).filter(Boolean).length;
    let score=70;
    if(sleep>=7)score+=15; else if(sleep&&sleep<6)score-=20;
    if(energy==='great')score+=15; if(energy==='low')score-=20;
    if(sore>=3)score-=15; else if(sore===0)score+=5;
    score=Math.max(0,Math.min(100,score));
    let level='normal',text='treino normal; progrida só se a execução estiver boa.';
    if(score<45){level='leve';text='recuperação baixa hoje. evite forçar progressão e considere reduzir carga/séries.'}
    else if(score<65){level='atenção';text='dá para treinar, mas vale ser conservador com progressão.'}
    return {score,level,text,sleep,energy,sore};
  }
  function bloatingAnalysis(){
    const b=todayBodyLog(),l=todayLab(),reasons=[];
    if(l.salty)reasons.push('refeição mais salgada');
    if(l.lateMeal)reasons.push('refeição mais tarde');
    if(l.lowWater||!b.water)reasons.push('hidratação baixa');
    if(l.constipation)reasons.push('intestino preso');
    if(b.alcohol)reasons.push('álcool');
    if(Number(b.sleepHours||0)>0&&Number(b.sleepHours)<6)reasons.push('pouco sono');
    const text=reasons.length
      ? 'há fatores que podem alterar retenção/digestão hoje: '+reasons.join(', ')+'. isso não significa ganho de gordura.'
      : 'sem um gatilho óbvio registrado. compare tendência de vários dias, não o espelho de uma manhã.';
    return {reasons,text};
  }
  function deloadStatus(){
    const ss=recentSessions(21);
    if(ss.length<4)return {show:false,title:'ainda aprendendo',text:'o Traço precisa de mais treinos recentes para avaliar fadiga.'};
    let heavy=0,totalRir=0;
    ss.forEach(s=>(s.exercises||[]).forEach(ex=>(ex.sets||[]).forEach(set=>{if(set.done&&set.rir){totalRir++;if(set.rir==='heavy')heavy++;}})));
    const sleep=avgBodyLog('sleepHours',7);
    const heavyRate=totalRir?heavy/totalRir:0;
    if((heavyRate>=.45&&totalRir>=6)||(sleep&&sleep<6&&ss.length>=5)){
      return {show:true,title:'vale considerar uma semana mais leve',text:'vários registros recentes apontam esforço alto/recuperação baixa. reduza carga ou séries por alguns treinos e reavalie.'};
    }
    return {show:false,title:'sem sinal claro de deload',text:'recuperação e esforço não mostram um padrão forte de fadiga acumulada.'};
  }
  const muscleWorkoutMap={
    chest:['seg','qui'],back:['qua','sex'],shoulders:['seg','qua','qui','sex'],arms:['seg','qua','qui'],legs:['ter','sex'],core:['seg','ter','qua','qui','sex']
  };
  function muscleRecovery(){
    const all=sessions().filter(s=>s.finishedAt).sort((a,b)=>b.startedAt-a.startedAt),sore=todayLab().soreness||{};
    return Object.keys(muscleWorkoutMap).map(key=>{
      const last=all.find(s=>muscleWorkoutMap[key].includes(s.workoutId));
      const hours=last?(Date.now()-last.startedAt)/3600000:null;
      let state='pronto';
      if(sore[key])state='cansado';
      else if(hours!=null&&hours<36)state='recuperando';
      return {key,state,hours};
    });
  }
  function recoveryMarkup(){
    const r=readiness(),b=bloatingAnalysis(),d=deloadStatus(),muscles=muscleRecovery();
    const labels={chest:'peito',back:'costas',shoulders:'ombros',arms:'braços',legs:'pernas',core:'core'};
    return '<section class="lab-recovery-card"><header><span>RECUPERAÇÃO</span><h3>prontidão '+r.score+'%</h3><b class="lab-status '+r.level+'">'+esc(r.level)+'</b></header><p>'+esc(r.text)+'</p>'+
      '<div class="lab-muscle-map">'+muscles.map(m=>'<button data-sore="'+m.key+'" class="'+(todayLab().soreness?.[m.key]?'is-sore':'')+'"><b>'+labels[m.key]+'</b><span>'+m.state+'</span></button>').join('')+'</div>'+
      '<div class="lab-bloat"><span>por que posso parecer mais inchado hoje?</span><div>'+
      [['salty','mais sal'],['lateMeal','refeição tarde'],['lowWater','pouca água'],['constipation','intestino preso']].map(([k,l])=>'<button data-lab-toggle="'+k+'" class="'+(todayLab()[k]?'is-on':'')+'">'+l+'</button>').join('')+
      '</div><p>'+esc(b.text)+'</p></div>'+
      '<div class="lab-deload '+(d.show?'warn':'')+'"><b>'+esc(d.title)+'</b><span>'+esc(d.text)+'</span></div></section>';
  }
  function bindRecovery(){
    qsa('[data-sore]').forEach(btn=>btn.onclick=()=>{
      const l=todayLab(),next=Object.assign({},l.soreness||{});next[btn.dataset.sore]=!next[btn.dataset.sore];
      saveTodayLab({soreness:next});renderBody();
    });
    qsa('[data-lab-toggle]').forEach(btn=>btn.onclick=()=>{
      const l=todayLab(),patch={};patch[btn.dataset.labToggle]=!l[btn.dataset.labToggle];saveTodayLab(patch);renderBody();
    });
  }

  /* EXERCISE PREFERENCES */
  function prefs(){return read(PREF_KEY,{})}
  function saveExerciseFeel(exId,value){
    const p=prefs();p[exId]={value,at:Date.now()};write(PREF_KEY,p);try{haptic()}catch{};renderSession();
  }
  function exerciseFeelMarkup(ex){
    const v=prefs()[ex.id]?.value||'';
    return '<section class="lab-exercise-feel"><span>como seu corpo se sente neste exercício?</span><div>'+
      ['great:ótimo','discomfort:incômodo','dislike:não gostei'].map(x=>{const [k,l]=x.split(':');return '<button data-ex-feel="'+k+'" class="'+(v===k?'is-on':'')+'">'+l+'</button>'}).join('')+
      '</div></section>';
  }

  /* TRAINING MODES */
  const priorityByWorkout={
    seg:['supino-inclinado','elevacao-lateral','crucifixo-baixo-alto','triceps-pushdown'],
    ter:['leg-press','flexora','extensora','agachamento-smith'],
    qua:['puxada-aberta','pullover','remada-baixa','rosca-polia'],
    qui:['supino-reto','elevacao-lateral-2','crucifixo-reto','triceps-overhead-2'],
    sex:['puxada-neutra','pullover','rdl','elevacao-lateral-3']
  };
  function resetQueue(s){delete s.tracoSetQueue;delete s.tracoSetCursor;if(typeof tracoGymEnsureSessionQueue==='function')tracoGymEnsureSessionQueue(s)}
  function compactCurrentWorkout(minutes=30){
    const s=state.activeSession;if(!s)return;
    const preferred=priorityByWorkout[s.workoutId]||s.exercises.map(x=>x.id);
    const keep=preferred.slice(0,4);
    s.exercises=s.exercises.filter(ex=>keep.includes(ex.id)).sort((a,b)=>keep.indexOf(a.id)-keep.indexOf(b.id));
    s.exercises.forEach((ex,i)=>{const maxSets=i<2?3:2;ex.sets=(ex.sets||[]).slice(0,maxSets).map((set,j)=>Object.assign({},set,{n:j+1}))});
    s.labMode='short-'+minutes;state.currentExercise=0;resetQueue(s);save(K.draft,s);toast('modo '+minutes+' min ativado');renderSession();
  }
  const travelPlans={
    dumbbells:[
      {id:'travel-db-press',name:'supino com halteres',equipment:'Halteres + banco',sets:3,min:8,max:15,rest:75,icon:'🏋️'},
      {id:'travel-db-row',name:'remada unilateral com halter',equipment:'Halter',sets:3,min:10,max:15,rest:60,icon:'🚣'},
      {id:'travel-db-lateral',name:'elevação lateral',equipment:'Halteres',sets:3,min:12,max:20,rest:45,icon:'🪽'},
      {id:'travel-db-rdl',name:'stiff com halteres',equipment:'Halteres',sets:3,min:10,max:15,rest:75,icon:'↘️'},
      {id:'travel-db-curl',name:'rosca martelo',equipment:'Halteres',sets:2,min:10,max:15,rest:45,icon:'💪'}
    ],
    cable:[
      {id:'puxada-neutra',name:'puxada neutra / fechada',equipment:'Máquina de puxada',sets:3,min:8,max:12,rest:75,icon:'🔻'},
      {id:'pullover',name:'pullover braços estendidos',equipment:'Polia alta',sets:3,min:10,max:15,rest:60,icon:'⬇️'},
      {id:'elevacao-lateral-2',name:'elevação lateral unilateral',equipment:'Polia',sets:3,min:12,max:20,rest:45,icon:'🪽'},
      {id:'triceps-pushdown',name:'tríceps pushdown',equipment:'Polia alta',sets:2,min:10,max:15,rest:45,icon:'💪'},
      {id:'rosca-polia',name:'rosca bíceps na polia',equipment:'Polia baixa',sets:2,min:10,max:15,rest:45,icon:'💪'}
    ],
    bodyweight:[
      {id:'travel-pushup',name:'flexão de braços',equipment:'Peso corporal',sets:3,min:8,max:20,rest:60,icon:'⬆️',usesLoad:false},
      {id:'travel-split',name:'agachamento búlgaro',equipment:'Peso corporal',sets:3,min:8,max:15,rest:60,icon:'🦵',usesLoad:false},
      {id:'travel-pike',name:'pike push-up',equipment:'Peso corporal',sets:3,min:6,max:15,rest:60,icon:'🪽',usesLoad:false},
      {id:'core-leg-raise-ter',name:'reverse crunch no chão',equipment:'Solo / colchonete',sets:3,min:12,max:15,rest:45,icon:'◼️',usesLoad:false}
    ]
  };
  function activateTravel(type){
    const s=state.activeSession;if(!s||!travelPlans[type])return;
    s.labOriginalWorkout={workoutId:s.workoutId,wName:s.wName};
    s.wName='modo viagem · '+({dumbbells:'halteres',cable:'polia',bodyweight:'sem academia'}[type]);
    s.exercises=travelPlans[type].map(ex=>Object.assign({},ex,{sets:Array.from({length:ex.sets},(_,i)=>({n:i+1,weight:'',reps:'',done:false}))}));
    s.labMode='travel-'+type;state.currentExercise=0;resetQueue(s);save(K.draft,s);closeLabModal();toast('modo viagem ativado');renderSession();
  }
  function crowdedGym(){
    const s=state.activeSession;if(!s)return;
    const p=prefs();
    const score=ex=>{
      const e=String(ex.equipment||'').toLowerCase();let v=0;
      if(/polia|crossover/.test(e))v+=4;
      if(/halter/.test(e))v+=3;
      if(/smith/.test(e))v+=1;
      if(/máquina|leg press/.test(e))v+=2;
      if(p[ex.id]?.value==='dislike')v-=3;if(p[ex.id]?.value==='discomfort')v-=2;if(p[ex.id]?.value==='great')v+=1;
      return v;
    };
    s.exercises=s.exercises.map((ex,i)=>({ex,i})).sort((a,b)=>score(b.ex)-score(a.ex)||a.i-b.i).map(x=>x.ex);
    state.currentExercise=Math.max(0,s.exercises.findIndex(ex=>ex.sets.some(set=>!set.done)));resetQueue(s);save(K.draft,s);toast('reorganizei para academia cheia');renderSession();
  }
  function closeLabModal(){qs('#tracoLabModal')?.remove();document.body.classList.remove('traco-lab-modal-open')}
  function openTrainingModes(){
    closeLabModal();document.body.classList.add('traco-lab-modal-open');
    document.body.insertAdjacentHTML('beforeend','<div class="traco-lab-backdrop" id="tracoLabModal"><section class="traco-lab-sheet"><header><div><span>PLANO B</span><h3>adapte sem perder o treino</h3></div><button id="tracoLabClose">×</button></header>'+
      '<div class="lab-mode-list"><button data-lab-mode="crowded"><b>academia cheia</b><small>reorganiza a ordem priorizando equipamentos mais fáceis de liberar</small></button>'+
      '<button data-lab-mode="short"><b>só tenho 30 min</b><small>fica só com os exercícios de maior prioridade estética</small></button>'+
      '<button data-lab-mode="travel-db"><b>viagem · halteres</b><small>treino temporário com halteres/banco</small></button>'+
      '<button data-lab-mode="travel-cable"><b>viagem · polia</b><small>treino temporário com polia</small></button>'+
      '<button data-lab-mode="travel-body"><b>sem academia</b><small>versão simples de peso corporal</small></button></div>'+
      '<p>esses modos alteram só o treino em andamento; seu V60 base continua intacto.</p></section></div>');
    const closeBtn=qs('#tracoLabClose'),modal=qs('#tracoLabModal');if(closeBtn)closeBtn.onclick=closeLabModal;if(modal)modal.onclick=e=>{if(e.target.id==='tracoLabModal')closeLabModal()};
    qsa('[data-lab-mode]').forEach(btn=>btn.onclick=()=>{
      const m=btn.dataset.labMode;if(m==='crowded'){closeLabModal();crowdedGym()}else if(m==='short'){closeLabModal();compactCurrentWorkout(30)}
      else if(m==='travel-db')activateTravel('dumbbells');else if(m==='travel-cable')activateTravel('cable');else activateTravel('bodyweight');
    });
  }

  /* FOOD DECISION + MEAL BUILDER + GROCERY */
  const foods={
    protein:['frango','ovos','carne magra','atum','iogurte grego','queijo cottage','tofu'],
    carbs:['arroz','feijão','batata','pão','aveia','massa','tapioca'],
    produce:['salada','legumes','banana','maçã','mamão','frutas vermelhas'],
    fats:['azeite','abacate','castanhas','queijo']
  };
  function mealBuilderMarkup(){
    return '<details class="lab-meal-card"><summary><span>CONSTRUTOR DE REFEIÇÃO</span><b>monta algo simples</b><i>+</i></summary><div>'+
      Object.entries(foods).map(([k,arr])=>'<label>'+({protein:'proteína',carbs:'carboidrato',produce:'fruta/vegetal',fats:'gordura'}[k])+'<select data-meal="'+k+'">'+arr.map(x=>'<option>'+x+'</option>').join('')+'</select></label>').join('')+
      '<button id="labBuildMeal">montar refeição</button><p id="labMealResult">escolha o que tem em casa.</p></div></details>';
  }
  function foodDecision(text){
    const t=String(text||'').toLowerCase(),b=todayBodyLog(),training=workoutPlan.some(w=>w.day===new Date().getDay());
    let msg='pode encaixar. olha o contexto do dia e a porção, não um alimento isolado.';
    if(/cerveja|vinho|drink|álcool|alcool/.test(t))msg='se quiser, encaixe com moderação. álcool frequente atrapalha recuperação e facilita exceder calorias; hoje vale priorizar água e proteína.';
    else if(/refrigerante|suco|milkshake|bebida/.test(t)&&!/zero|diet/.test(t))msg='pode, mas calorias líquidas saciam pouco. se o objetivo é cintura, versão zero/água costuma ser uma troca fácil.';
    else if(/pizza|hamburg|frit|fast|batata frita/.test(t))msg='pode entrar. tente manter proteína no prato, escolha uma porção que satisfaça e não transforme uma refeição em “dia perdido”.';
    else if(/doce|bolo|sorvete|chocolate/.test(t))msg='pode. se sua base do dia está boa, escolha uma porção que realmente mate a vontade e segue normal depois.';
    else if(/arroz|massa|pão|batata|tapioca/.test(t))msg=training?'carboidrato pode ajudar seu treino hoje. combine com proteína e não precisa tratar isso como vilão.':'pode encaixar normalmente; combine com proteína e ajuste a porção à sua fome.';
    if(b.offPlan)msg+=' você já marcou uma refeição fora do plano hoje, então só vale decidir conscientemente — sem compensação depois.';
    return msg;
  }
  function foodCoachMarkup(){
    return '<section class="lab-food-coach"><span>POSSO COMER ISSO?</span><h3>decisão sem terrorismo</h3><div><input id="labFoodInput" placeholder="ex.: pizza, pão, chocolate…"><button id="labFoodAsk">ver contexto</button></div><p id="labFoodAnswer">o Traço não proíbe comida; ele ajuda a encaixar.</p></section>';
  }
  function groceryMarkup(){
    const saved=read(GROCERY_KEY,[]);
    const defaults=['frango/atum/ovos','iogurte/leite','arroz/feijão/batata','frutas','legumes/salada','pão/aveia','opção rápida de proteína'];
    const items=[...new Set([...defaults,...saved])];
    return '<details class="lab-grocery-card"><summary><span>SUPERMERCADO</span><b>lista prática</b><i>+</i></summary><div>'+
      items.map(item=>'<label><input type="checkbox" data-grocery="'+esc(item)+'" '+(saved.includes(item)?'checked':'')+'><span>'+esc(item)+'</span></label>').join('')+
      '<p>favoritos simples para montar refeições sem depender de delivery. itens enviados pelos Cardápios aparecem aqui também.</p></div></details>';
  }
  function hungerMarkup(){
    const v=todayLab().hungerType||'';
    return '<section class="lab-hunger-card"><span>FOME OU VONTADE?</span><h3>o que está acontecendo agora?</h3><div>'+
      '<button data-hunger-type="physical" class="'+(v==='physical'?'is-on':'')+'">fome física</button><button data-hunger-type="craving" class="'+(v==='craving'?'is-on':'')+'">vontade de comer</button>'+
      '</div><p>'+(v==='craving'?'se quiser comer, tudo bem. registrar ajuda a descobrir horários e contextos — não serve para proibir.':v==='physical'?'fome física pede comida; priorize uma refeição que dê saciedade.':'registre quando quiser perceber padrões ao longo das semanas.')+'</p></section>';
  }

  /* PHASES + GOALS */
  const phasePresets={
    recomp:{name:'recomposição',weeks:8,desc:'força ↑ · cintura estável/↓ · proteína e consistência'},
    v:{name:'construir V',weeks:8,desc:'dorsal/ombros/peito ↑ · cintura monitorada'},
    waist:{name:'refinar cintura',weeks:6,desc:'manter força · cardio consistente · hábitos ajustados'}
  };
  function phase(){return read(PHASE_KEY,null)}
  function setPhase(key){
    const p=phasePresets[key];if(!p)return;
    write(PHASE_KEY,{key,name:p.name,weeks:p.weeks,desc:p.desc,start:dateKey(),startedAt:Date.now()});renderProgress();
  }
  function phaseMarkup(){
    const p=phase();
    if(!p)return '<section class="lab-phase-card"><span>FASE DO PROJETO</span><h3>escolha o foco atual</h3><div>'+Object.keys(phasePresets).map(k=>'<button data-phase="'+k+'"><b>'+phasePresets[k].name+'</b><small>'+phasePresets[k].desc+'</small></button>').join('')+'</div></section>';
    const elapsed=Math.floor((Date.now()-p.startedAt)/86400000),total=p.weeks*7,pct=Math.min(100,Math.round(elapsed/total*100));
    return '<section class="lab-phase-card active"><span>FASE DO PROJETO</span><h3>'+esc(p.name)+'</h3><p>'+esc(p.desc)+'</p><div class="lab-phase-track"><i style="width:'+pct+'%"></i></div><small>dia '+Math.min(total,elapsed+1)+' de '+total+'</small><button id="labChangePhase">trocar fase</button></section>';
  }
  function goals(){return read(GOALS_KEY,[])}
  function addGoal(type,target){
    const list=goals();list.push({id:Date.now(),type,target:Number(target),createdAt:Date.now(),done:false});write(GOALS_KEY,list);renderProgress();
  }
  function currentGoalValue(g){
    const latest=latestBody();
    if(g.type==='waist')return Number(latest?.waist||0);
    if(g.type==='shoulders')return Number(latest?.shoulders||0);
    if(g.type==='workouts')return workoutCount(7);
    if(g.type==='cardio')return cardioMinutes(7);
    return 0;
  }
  function goalsMarkup(){
    const list=goals(),names={waist:'cintura',shoulders:'ombros',workouts:'treinos/semana',cardio:'cardio/semana'};
    return '<section class="lab-goals-card"><span>METAS SEM DEPENDER DO PESO</span><h3>o que você quer mover?</h3>'+
      (list.length?'<div class="lab-goal-list">'+list.map(g=>'<article><div><b>'+names[g.type]+'</b><small>atual '+(currentGoalValue(g)||'—')+' · alvo '+g.target+(g.type==='waist'||g.type==='shoulders'?' cm':g.type==='cardio'?' min':'')+'</small></div><button data-goal-remove="'+g.id+'">×</button></article>').join('')+'</div>':'<p>ainda sem metas específicas.</p>')+
      '<div class="lab-goal-add"><select id="labGoalType"><option value="waist">cintura</option><option value="shoulders">ombros</option><option value="workouts">treinos/semana</option><option value="cardio">cardio min/semana</option></select><input id="labGoalTarget" type="number" step=".5" placeholder="alvo"><button id="labGoalAdd">adicionar</button></div></section>';
  }

  /* RECORDS + PROJECTION */
  function smartRecords(){
    const ss=sessions().filter(s=>s.finishedAt).sort((a,b)=>a.startedAt-b.startedAt),map={};
    ss.forEach(s=>(s.exercises||[]).forEach(ex=>{
      const d=(ex.sets||[]).filter(z=>z.done&&!z.skipped);
      if(!d.length)return;
      const key=ex.id;if(!map[key])map[key]={name:ex.name,bestWeight:0,bestRepsAtWeight:0,bestVolume:0,progressions:0,lastBest:0};
      const maxW=Math.max(0,...d.map(z=>Number(z.weight||0))),repsAt=Math.max(0,...d.filter(z=>Number(z.weight||0)===maxW).map(z=>Number(z.reps||0)));
      const vol=d.reduce((a,z)=>a+Number(z.weight||0)*Number(z.reps||0),0);
      const m=map[key];if(maxW>m.bestWeight){if(m.bestWeight>0)m.progressions++;m.bestWeight=maxW;m.bestRepsAtWeight=repsAt}else if(maxW===m.bestWeight&&repsAt>m.bestRepsAtWeight)m.bestRepsAtWeight=repsAt;
      m.bestVolume=Math.max(m.bestVolume,vol);
    }));
    return Object.values(map).sort((a,b)=>b.progressions-a.progressions||b.bestWeight-a.bestWeight).slice(0,5);
  }
  function projection(){
    const exId=state.progressEx||workoutPlan.flatMap(w=>w.exercises)[0]?.id;
    const points=sessions().filter(s=>s.finishedAt).sort((a,b)=>a.startedAt-b.startedAt).map(s=>{
      const ex=(s.exercises||[]).find(e=>e.id===exId);if(!ex)return null;const w=Math.max(0,...(ex.sets||[]).filter(z=>z.done).map(z=>Number(z.weight||0)));return w?{at:s.startedAt,w}:null;
    }).filter(Boolean).slice(-5);
    if(points.length<3)return {text:'preciso de pelo menos 3 sessões desse exercício para estimar tendência.'};
    const diffs=[];for(let i=1;i<points.length;i++)diffs.push(points[i].w-points[i-1].w);
    const positive=diffs.filter(x=>x>0);if(!positive.length)return {text:'sua melhor carga está estável; o foco pode ser mais reps/técnica antes de subir.'};
    const avg=positive.reduce((a,b)=>a+b,0)/positive.length,next=points[points.length-1].w+Math.min(avg,5);
    return {text:'se o ritmo recente continuar e a execução permitir, uma próxima faixa plausível é perto de '+next.toFixed(next%1?1:0)+' kg. é estimativa, não promessa.'};
  }
  function recordsMarkup(){
    const rows=smartRecords(),p=projection();
    return '<section class="lab-records-card"><span>RECORDES INTELIGENTES</span><h3>mais que “maior kg”</h3>'+
      (rows.length?'<div>'+rows.slice(0,3).map(r=>'<article><b>'+esc(r.name)+'</b><small>'+r.bestWeight+' kg · até '+r.bestRepsAtWeight+' reps nessa carga · volume máx '+Math.round(r.bestVolume)+'</small></article>').join('')+'</div>':'<p>fecha mais treinos para liberar recordes inteligentes.</p>')+
      '<p class="lab-projection">'+esc(p.text)+'</p></section>';
  }

  /* WEEKLY LIGHT + WRAPPED */
  function trafficLight(){
    const bs=window.TracoBodyCoach?.weeklyStats?.()||{adherence:0,days:0,workouts:0,avgSleep:0};
    const r=readiness();
    let color='yellow',title='amarelo',text='continue consistente e observe recuperação antes de apertar mais.';
    if(bs.days>=4&&bs.adherence>=70&&r.score>=60){color='green';title='verde';text='hábitos e recuperação estão sustentáveis. continue sem inventar cortes extras.'}
    if((bs.days>=4&&bs.adherence<45)||r.score<40){color='red';title='vermelho';text='a base/recuperação está oscilando. não é hora de apertar dieta ou volume de treino.'}
    return {color,title,text};
  }
  function wrappedMarkup(){
    const bs=window.TracoBodyCoach?.weeklyStats?.()||{},ss=recentSessions(7),prs=ss.reduce((a,s)=>a+(s.prs||[]).length,0);
    const tl=trafficLight();
    return '<section class="lab-wrapped-card"><header><span>SEU WRAPPED DA SEMANA</span><b class="'+tl.color+'">'+tl.title+'</b></header><h3>'+Number(bs.workouts||0)+' treinos · '+Number(bs.cardio||0)+' min cardio</h3><div><span>proteína '+Number(bs.protein||0)+'/7</span><span>água '+Number(bs.water||0)+'/7</span><span>'+prs+' PR'+(prs===1?'':'s')+'</span></div><p>'+esc(tl.text)+'</p></section>';
  }
  function antiFlankMarkup(){
    const bs=window.TracoBodyCoach?.weeklyStats?.()||{adherence:0,protein:0,cardio:0};
    const latest=latestBody(),rows=body().slice().sort((a,b)=>a.date.localeCompare(b.date));
    let waistTrend='coletando',hipTrend='coletando';
    if(rows.length>=2){
      const first=rows[Math.max(0,rows.length-3)],last=rows[rows.length-1];
      if(first.waist&&last.waist){const d=Number(last.waist)-Number(first.waist);waistTrend=d<-.3?'descendo':d>.3?'subindo':'estável'}
      if(first.hip&&last.hip){const d=Number(last.hip)-Number(first.hip);hipTrend=d<-.3?'descendo':d>.3?'subindo':'estável'}
    }
    const strength=recentSessions(14).some(s=>(s.prs||[]).length>0)?'progredindo':'manter';
    const habits=Number(bs.adherence||0)>=70?'consistentes':Number(bs.adherence||0)>=45?'oscilando':'baixos';
    const activity=Number(bs.cardio||0)>=45?'boa':Number(bs.cardio||0)>0?'parcial':'baixa';
    return '<section class="lab-antiflank-card"><span>PLANO ANTI-FLANCO</span><h3>4 pilares · sem exercício mágico</h3><div>'+
      '<article><b>'+esc(waistTrend)+' / '+esc(hipTrend)+'</b><small>cintura + lombar</small></article>'+
      '<article><b>'+esc(habits)+'</b><small>base alimentar</small></article>'+
      '<article><b>'+esc(activity)+'</b><small>cardio/atividade</small></article>'+
      '<article><b>'+esc(strength)+'</b><small>dorsal/ombros preservados</small></article>'+
      '</div><p>o objetivo é reduzir a região gradualmente sem sacrificar o volume que cria seu V.</p></section>';
  }

  /* EXPERIMENTS */
  const expPresets={
    protein:{name:'14 dias · proteína 3+ refeições',metric:'protein',prompt:'bati 3+ refeições com boa proteína hoje?'},
    liquids:{name:'14 dias · sem calorias líquidas',metric:'liquids',prompt:'evitei bebidas calóricas hoje?'},
    cardio:{name:'14 dias · cardio consistente',metric:'cardio',prompt:'fiz o cardio planejado hoje?'},
    sleep:{name:'14 dias · sono 7h+',metric:'sleep',prompt:'dormi pelo menos 7h?'},
    planned:{name:'14 dias · refeições planejadas',metric:'planned',prompt:'mantive refeições planejadas hoje?'}
  };
  function experiments(){return read(EXP_KEY,[])}
  function syncExperiments(){
    const list=experiments();let changed=false;
    list.forEach(e=>{
      if(!e.finishedAt&&Date.now()>=e.startedAt+14*86400000){
        const latest=latestBody();
        e.finishedAt=Date.now();
        e.result={weight:Number(latest?.weight||0)||null,waist:Number(latest?.waist||0)||null};
        changed=true;
      }
    });
    if(changed)write(EXP_KEY,list);
    return list;
  }
  function activeExperiment(){return syncExperiments().find(e=>!e.finishedAt&&Date.now()<e.startedAt+14*86400000)||null}
  function startExperiment(key){
    const p=expPresets[key],list=experiments();if(!p)return;
    const latest=latestBody();
    list.push({id:Date.now(),key,name:p.name,metric:p.metric,prompt:p.prompt,startedAt:Date.now(),startDate:dateKey(),baseline:{weight:Number(latest?.weight||0)||null,waist:Number(latest?.waist||0)||null},days:{}});
    write(EXP_KEY,list);renderBody();
  }
  function markExperiment(ok){
    const list=experiments(),e=list.find(x=>x.id===activeExperiment()?.id);if(!e)return;
    e.days[dateKey()]=Boolean(ok);
    if(Date.now()>=e.startedAt+13*86400000){e.finishedAt=Date.now();const latest=latestBody();e.result={weight:Number(latest?.weight||0)||null,waist:Number(latest?.waist||0)||null};}
    write(EXP_KEY,list);renderBody();
  }
  function experimentMarkup(){
    const e=activeExperiment(),history=syncExperiments().filter(x=>x.finishedAt).sort((a,b)=>b.finishedAt-a.finishedAt),last=history[0];
    if(!e){
      let result='';
      if(last){
        const adherence=Math.round(Object.values(last.days||{}).filter(Boolean).length/14*100);
        const wd=last.baseline?.waist&&last.result?.waist?Number(last.result.waist)-Number(last.baseline.waist):null;
        const pd=last.baseline?.weight&&last.result?.weight?Number(last.result.weight)-Number(last.baseline.weight):null;
        result='<article class="lab-exp-result"><b>último experimento</b><span>'+esc(last.name)+' · '+adherence+'% dos dias</span><small>'+((wd!=null)?((wd>0?'+':'')+wd.toFixed(1).replace('.',',')+' cm cintura'):'cintura sem comparação')+' · '+((pd!=null)?((pd>0?'+':'')+pd.toFixed(1).replace('.',',')+' kg'):'peso sem comparação')+'</small><em>isso descreve o período; não prova que uma única mudança causou o resultado.</em></article>';
      }
      return '<section class="lab-exp-card"><span>EXPERIMENTOS DE 14 DIAS</span><h3>muda uma coisa por vez</h3><p>assim você aprende o que realmente ajuda sua rotina, sem alterar dez variáveis juntas.</p>'+result+'<div>'+Object.keys(expPresets).map(k=>'<button data-start-exp="'+k+'">'+expPresets[k].name+'</button>').join('')+'</div></section>';
    }
    const day=Math.min(14,Math.floor((Date.now()-e.startedAt)/86400000)+1),done=Object.values(e.days).filter(Boolean).length;
    return '<section class="lab-exp-card active"><span>EXPERIMENTO ATIVO</span><h3>'+esc(e.name)+'</h3><p>dia '+day+'/14 · '+done+' dias cumpridos</p><div class="lab-exp-track"><i style="width:'+Math.round(day/14*100)+'%"></i></div><b>'+esc(e.prompt)+'</b><div class="lab-exp-answer"><button data-exp-answer="1">sim</button><button data-exp-answer="0">não</button></div></section>';
  }

  /* TIMELINE + PHOTO NOTES/CROPS */
  function photoDb(){
    return new Promise((resolve,reject)=>{
      const req=indexedDB.open(PHOTO_DB,1);
      req.onupgradeneeded=()=>{const db=req.result;if(!db.objectStoreNames.contains(PHOTO_STORE))db.createObjectStore(PHOTO_STORE,{keyPath:'id'})};
      req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);
    });
  }
  async function photoRows(){
    const db=await photoDb();return new Promise((resolve,reject)=>{const tx=db.transaction(PHOTO_STORE,'readonly'),req=tx.objectStore(PHOTO_STORE).getAll();req.onsuccess=()=>resolve(req.result||[]);req.onerror=()=>reject(req.error)});
  }
  async function updatePhoto(id,patch){
    const db=await photoDb(),rows=await photoRows(),row=rows.find(x=>x.id===id);if(!row)return;
    Object.assign(row,patch);return new Promise((resolve,reject)=>{const tx=db.transaction(PHOTO_STORE,'readwrite');tx.objectStore(PHOTO_STORE).put(row);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error)});
  }
  function timelineMarkup(){
    const events=[];
    sessions().filter(s=>s.finishedAt).forEach(s=>events.push({at:s.startedAt,type:'treino',title:s.wName,detail:(s.prs||[]).length+' PR · '+Math.round((s.duration||0)/60)+' min'}));
    body().forEach(x=>events.push({at:new Date(x.date+'T12:00:00').getTime(),type:'medidas',title:'check-in corporal',detail:[x.weight&&x.weight+' kg',x.waist&&x.waist+' cm cintura',x.shoulders&&x.shoulders+' cm ombros'].filter(Boolean).join(' · ')}));
    Object.values(bodyLogs()).forEach(x=>events.push({at:new Date(x.date+'T20:00:00').getTime(),type:'rotina',title:'hábitos do dia',detail:[Number(x.proteinMeals)>=3&&'proteína ✓',x.water&&'água ✓',x.sleepHours&&x.sleepHours+'h sono'].filter(Boolean).join(' · ')}));
    events.sort((a,b)=>b.at-a.at);
    return '<details class="lab-timeline-card"><summary><span>LINHA DO TEMPO</span><b>história do shape</b><i>+</i></summary><div>'+events.slice(0,20).map(e=>'<article><time>'+new Intl.DateTimeFormat('pt-BR',{day:'2-digit',month:'short'}).format(new Date(e.at))+'</time><div><b>'+esc(e.title)+'</b><small>'+esc(e.detail||e.type)+'</small></div></article>').join('')+'<div id="labTimelinePhotos"></div></div></details>';
  }
  async function decorateTimelinePhotos(){
    const target=qs('#labTimelinePhotos');if(!target)return;
    try{
      const rows=(await photoRows()).sort((a,b)=>b.id-a.id).slice(0,6);
      target.innerHTML=rows.map(row=>'<article class="lab-timeline-photo"><time>'+new Intl.DateTimeFormat('pt-BR',{day:'2-digit',month:'short'}).format(new Date(row.date+'T12:00:00'))+'</time><div><b>check-in fotográfico</b><small>'+esc(row.note||'frente · perfil · costas')+'</small></div></article>').join('');
    }catch{target.innerHTML=''}
  }
  async function decoratePhotoLab(){
    const holder=qs('#tracoLabPhotoTools');if(!holder)return;
    try{
      const rows=(await photoRows()).sort((a,b)=>a.id-b.id);
      if(!rows.length){holder.innerHTML='<p>salve um check-in fotográfico para liberar anotações e comparação por região.</p>';return}
      const latest=rows[rows.length-1],old=rows[0];
      holder.innerHTML='<label class="lab-photo-note">nota do check-in atual<textarea id="labPhotoNote" placeholder="ex.: comecei novo treino, viajei, estava mais inchado…">'+esc(latest.note||'')+'</textarea><button id="labPhotoNoteSave">salvar nota</button></label>'+
        (rows.length>1?'<div class="lab-region-compare"><span>comparar região</span><div class="lab-region-buttons">'+[['waist','cintura/flancos'],['chest','peito'],['arms','braços'],['back','costas']].map(([k,l])=>'<button data-region="'+k+'">'+l+'</button>').join('')+'</div><div class="lab-region-images" data-region-view="waist"><img src="'+old.front+'" alt=""><img src="'+latest.front+'" alt=""></div></div>':'');
      const noteSave=qs('#labPhotoNoteSave');if(noteSave)noteSave.onclick=async()=>{const note=qs('#labPhotoNote');await updatePhoto(latest.id,{note:note?.value||''});toast('anotação salva')};
      qsa('[data-region]').forEach(btn=>btn.onclick=()=>{
        const view=qs('.lab-region-images');if(!view)return;view.dataset.regionView=btn.dataset.region;
        const src=btn.dataset.region==='back'?'back':'front';view.innerHTML='<img src="'+old[src]+'" alt=""><img src="'+latest[src]+'" alt="">';
      });
    }catch{holder.innerHTML='<p>ferramentas de foto indisponíveis neste navegador.</p>'}
  }
  function photoLabMarkup(){
    return '<section class="lab-photo-tools-card"><span>FOTOS · DETALHES</span><h3>região + anotações</h3><div id="tracoLabPhotoTools"><p>carregando…</p></div></section>';
  }

  /* GUIDED CAMERA */
  let stream=null,guidedShots={};
  async function startGuidedCamera(){
    if(!navigator.mediaDevices?.getUserMedia)return toast('câmera guiada não disponível aqui');
    try{
      stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'environment'},audio:false});
      closeLabModal();document.body.classList.add('traco-lab-modal-open');
      document.body.insertAdjacentHTML('beforeend','<div class="traco-lab-backdrop" id="tracoLabModal"><section class="traco-lab-camera"><header><div><span>FOTO PADRONIZADA</span><h3 id="labCamTitle">frente</h3></div><button id="tracoLabClose">×</button></header><div class="lab-camera-view"><video id="labCameraVideo" autoplay playsinline></video><div class="lab-pose-guide"><i></i><i></i><i></i></div></div><p id="labCamTip">câmera na altura do abdômen · corpo inteiro · relaxado</p><button id="labCapture">capturar frente</button></section></div>');
      const v=qs('#labCameraVideo'),close=qs('#tracoLabClose'),capture=qs('#labCapture');if(!v||!close||!capture)throw new Error('camera UI unavailable');v.srcObject=stream;close.onclick=()=>{stopCamera();closeLabModal()};capture.onclick=captureGuided;
    }catch{toast('não consegui abrir a câmera')}
  }
  function stopCamera(){if(stream){stream.getTracks().forEach(t=>t.stop());stream=null}}
  function captureGuided(){
    const v=qs('#labCameraVideo');if(!v)return;
    const c=document.createElement('canvas'),max=900,scale=Math.min(1,max/Math.max(v.videoWidth,v.videoHeight));c.width=Math.round(v.videoWidth*scale);c.height=Math.round(v.videoHeight*scale);c.getContext('2d').drawImage(v,0,0,c.width,c.height);
    const stages=['front','side','back'],labels={front:'frente',side:'perfil',back:'costas'},current=stages.find(k=>!guidedShots[k]);
    guidedShots[current]=c.toDataURL('image/jpeg',.72);
    const next=stages.find(k=>!guidedShots[k]);
    if(next){qs('#labCamTitle').textContent=labels[next];qs('#labCapture').textContent='capturar '+labels[next];qs('#labCamTip').textContent=next==='side'?'gire 90° mantendo a mesma distância':'vire de costas sem mudar a posição da câmera';return}
    saveGuidedPhotos();
  }
  async function saveGuidedPhotos(){
    try{
      const db=await photoDb();await new Promise((resolve,reject)=>{const tx=db.transaction(PHOTO_STORE,'readwrite');tx.objectStore(PHOTO_STORE).put({id:Date.now(),date:dateKey(),front:guidedShots.front,side:guidedShots.side,back:guidedShots.back,note:'captura guiada Traço Lab'});tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error)});
      guidedShots={};stopCamera();closeLabModal();toast('check-in guiado salvo');renderBody();
    }catch{toast('não consegui salvar as fotos')}
  }

  /* BIND / DECORATE */
  function labHomeMarkup(){
    const r=readiness(),tl=trafficLight(),e=activeExperiment();
    return '<section class="lab-home-card"><header><span>TRAÇO LAB</span><b class="'+tl.color+'">'+tl.title+'</b></header><div><article><span>prontidão</span><b>'+r.score+'%</b><small>'+esc(r.level)+'</small></article><article><span>experimento</span><b>'+(e?'ativo':'—')+'</b><small>'+(e?esc(e.name.replace('14 dias · ','')):'nenhum')+'</small></article></div><button id="labOpenBody">abrir Shape Lab</button></section>';
  }
  function decorateHome(){
    const main=qs('.home-card');if(!main||qs('.lab-home-card'))return;
    const daily=qs('#tracoDailyHome');if(daily)daily.insertAdjacentHTML('afterend',labHomeMarkup());else main.insertAdjacentHTML('beforeend',labHomeMarkup());
    const openBody=qs('#labOpenBody');if(openBody)openBody.onclick=()=>{state.page='body';render()};
  }
  function decorateBody(){
    const main=qs('.body-page');if(!main||qs('.lab-recovery-card'))return;
    const coach=qs('#tracoBodyCoach');
    const html='<section class="lab-shape-focus"><span>SHAPE LAB</span><h3>seu shape, sem ruído</h3><p>recuperação e cintura primeiro. alimentação, experimentos e ferramentas ficam organizados abaixo.</p></section>'+
      recoveryMarkup()+antiFlankMarkup()+
      '<details class="lab-shape-more"><summary><div><b>hábitos & alimentação</b><small>fome · escolhas · refeições · supermercado</small></div><span>+</span></summary><div class="lab-shape-more-body">'+hungerMarkup()+foodCoachMarkup()+mealBuilderMarkup()+groceryMarkup()+'</div></details>'+
      '<details class="lab-shape-more"><summary><div><b>experimentos & evolução</b><small>testes · linha do tempo · fotos padronizadas</small></div><span>+</span></summary><div class="lab-shape-more-body">'+experimentMarkup()+timelineMarkup()+photoLabMarkup()+
      '<section class="lab-camera-entry"><div><span>FOTOS PADRONIZADAS</span><b>câmera com molde de pose</b><small>mesma altura, distância e enquadramento</small></div><button id="labGuidedCamera">abrir câmera</button></section></div></details>';
    if(coach)coach.insertAdjacentHTML('beforebegin',html);else main.insertAdjacentHTML('beforeend',html);
    bindRecovery();decorateTimelinePhotos();
    qsa('[data-hunger-type]').forEach(btn=>btn.onclick=()=>{saveTodayLab({hungerType:btn.dataset.hungerType});renderBody()});
    const foodAsk=qs('#labFoodAsk');if(foodAsk)foodAsk.onclick=()=>{const answer=qs('#labFoodAnswer'),input=qs('#labFoodInput');if(answer&&input)answer.textContent=foodDecision(input.value)};
    const mealBuild=qs('#labBuildMeal');if(mealBuild)mealBuild.onclick=()=>{
      const pick=k=>qs('[data-meal="'+k+'"]')?.value||'';const result=qs('#labMealResult');
      if(result)result.textContent=pick('protein')+' + '+pick('carbs')+' + '+pick('produce')+' + um pouco de '+pick('fats')+'. ajuste a porção pela fome.';
    };
    qsa('[data-grocery]').forEach(i=>i.onchange=()=>write(GROCERY_KEY,qsa('[data-grocery]:checked').map(x=>x.dataset.grocery)));
    qsa('[data-start-exp]').forEach(btn=>btn.onclick=()=>startExperiment(btn.dataset.startExp));
    qsa('[data-exp-answer]').forEach(btn=>btn.onclick=()=>markExperiment(btn.dataset.expAnswer==='1'));
    const cameraBtn=qs('#labGuidedCamera');if(cameraBtn)cameraBtn.onclick=startGuidedCamera;
    decoratePhotoLab();
  }
  function decorateProgress(){
    const main=qs('.progress-page');if(!main||qs('.lab-phase-card'))return;
    main.insertAdjacentHTML('beforeend',phaseMarkup()+goalsMarkup()+recordsMarkup()+wrappedMarkup());
    qsa('[data-phase]').forEach(btn=>btn.onclick=()=>setPhase(btn.dataset.phase));
    if(qs('#labChangePhase'))qs('#labChangePhase').onclick=()=>{localStorage.removeItem(PHASE_KEY);renderProgress()};
    const goalAdd=qs('#labGoalAdd');if(goalAdd)goalAdd.onclick=()=>{const type=qs('#labGoalType'),target=qs('#labGoalTarget');if(!type||!target)return;const n=Number(target.value);if(!n)return toast('define um alvo');addGoal(type.value,n)};
    qsa('[data-goal-remove]').forEach(btn=>btn.onclick=()=>{write(GOALS_KEY,goals().filter(g=>String(g.id)!==btn.dataset.goalRemove));renderProgress()});
  }
  function decorateSession(){
    const main=qs('.perf-session');if(!main||qs('.lab-session-tools'))return;
    const ex=state.activeSession?.exercises?.[state.currentExercise];if(!ex)return;
    const consoleEl=main.querySelector('.perf-exercise-console');if(!consoleEl)return;
    consoleEl.insertAdjacentHTML('beforeend','<section class="lab-session-tools">'+exerciseFeelMarkup(ex)+'<button id="labTrainingModes">adaptar treino / academia cheia</button></section>');
    qsa('[data-ex-feel]').forEach(btn=>btn.onclick=()=>saveExerciseFeel(ex.id,btn.dataset.exFeel));
    const trainingModes=qs('#labTrainingModes');if(trainingModes)trainingModes.onclick=openTrainingModes;
    const r=readiness();
    if(r.score<65&&!qs('.lab-readiness-banner'))consoleEl.insertAdjacentHTML('afterbegin','<div class="lab-readiness-banner '+r.level+'"><b>prontidão '+r.score+'%</b><span>'+esc(r.text)+'</span></div>');
  }
  function decorateFinish(){
    const card=qs('.finish-card');if(!card||qs('.lab-finish-recovery'))return;
    const r=readiness(),d=deloadStatus();
    const back=qs('#backHome'),html='<section class="lab-finish-recovery"><span>RECUPERAÇÃO</span><b>'+esc(r.level)+'</b><p>'+esc(d.show?d.text:'amanhã, observe sono e dor muscular antes de decidir progressão.')+'</p></section>';
    if(back)back.insertAdjacentHTML('beforebegin',html);else card.insertAdjacentHTML('beforeend',html);
  }
  function decorateSettings(){
    const main=qs('.settings-page');if(!main||qs('.lab-health-card'))return;
    main.insertAdjacentHTML('beforeend','<section class="lab-health-card"><span>APPLE HEALTH</span><h3>integração futura</h3><p>o PWA não consegue ler HealthKit diretamente no iPhone. quando o Traço ganhar um wrapper/app nativo, passos, sono, frequência cardíaca e peso poderão entrar automaticamente.</p><button disabled>aguardando versão nativa</button></section>');
  }

  const baseHome=renderHome;renderHome=function(){baseHome();decorateHome()};
  const baseBody=renderBody;renderBody=function(){baseBody();decorateBody()};
  const baseProgress=renderProgress;renderProgress=function(){baseProgress();decorateProgress()};
  const baseSession=renderSession;renderSession=function(){baseSession();decorateSession()};
  const baseFinish=renderFinish;renderFinish=function(){baseFinish();decorateFinish()};
  const baseSettings=renderSettings;renderSettings=function(){baseSettings();decorateSettings()};

  window.TracoLab={version:VERSION,readiness,bloatingAnalysis,deloadStatus,trafficLight,startGuidedCamera,openTrainingModes};
  document.documentElement.dataset.tracoLab=VERSION;
})();