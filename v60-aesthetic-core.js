const V60_CORE_ADDED_IDS=['core-crunch-seg','core-pallof-ter','core-leg-raise-ter','core-woodchop-qui','core-dead-bug-qui'];

function v60CoreExercise(id,name,equipment,sets,min,max,rest,icon='◼️'){
  return {id,name,equipment,sets,min,max,rest,icon,core:true};
}
function v60InstallAestheticCorePlan(){
  const seg=workoutPlan.find(w=>w.id==='seg');
  const ter=workoutPlan.find(w=>w.id==='ter');
  const qua=workoutPlan.find(w=>w.id==='qua');
  const qui=workoutPlan.find(w=>w.id==='qui');
  const sex=workoutPlan.find(w=>w.id==='sex');

  if(seg&&!seg.exercises.some(e=>e.id==='core-crunch-seg')){
    seg.exercises.push(v60CoreExercise('core-crunch-seg','crunch na polia','Polia alta + corda',3,10,15,45,'◼️'));
  }
  if(ter&&!ter.exercises.some(e=>e.id==='core-pallof-ter')){
    ter.exercises.push(v60CoreExercise('core-pallof-ter','Pallof press','Polia / crossover',3,10,12,45,'↔️'));
  }
  if(ter&&!ter.exercises.some(e=>e.id==='core-leg-raise-ter')){
    ter.exercises.push({...v60CoreExercise('core-leg-raise-ter','reverse crunch no chão','Solo / colchonete',3,12,15,45,'◼️'),usesLoad:false});
  }
  const wed=qua?.exercises.find(e=>e.id==='crunch');
  if(wed)Object.assign(wed,{name:'crunch ajoelhado na polia',equipment:'Polia alta + corda',sets:3,min:10,max:15,rest:45,icon:'◼️',core:true});
  if(qui&&!qui.exercises.some(e=>e.id==='core-woodchop-qui')){
    qui.exercises.push(v60CoreExercise('core-woodchop-qui','Pallof press','Polia / crossover',3,10,12,45,'↔️'));
  }
  if(qui&&!qui.exercises.some(e=>e.id==='core-dead-bug-qui')){
    qui.exercises.push({...v60CoreExercise('core-dead-bug-qui','reverse crunch no chão','Solo / colchonete',3,12,15,45,'◼️'),usesLoad:false});
  }
  const fri=sex?.exercises.find(e=>e.id==='crunch-2');
  if(fri)Object.assign(fri,{name:'crunch ajoelhado na polia',equipment:'Polia alta + corda',sets:3,min:10,max:15,rest:45,icon:'◼️',core:true});
}

function v60CoreSceneReverseCrunch(){
  const dark=document.documentElement?.dataset?.theme==='dark';
  const W='#FAFAFA',M=dark?'rgba(250,250,250,.22)':'rgba(250,250,250,.28)',L=dark?'#FF3B30':'#E9342C',H=dark?'rgba(255,59,48,.34)':'rgba(233,52,44,.28)';
  const line=(x1,y1,x2,y2,sw=5,col=W)=>`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${col}" stroke-width="${sw}" stroke-linecap="round"/>`;
  const circ=(x,y,r)=>`<circle cx="${x}" cy="${y}" r="${r}" fill="none" stroke="${W}" stroke-width="4"/>`;
  const mat=`<rect x="220" y="267" width="300" height="14" rx="7" fill="${M}"/>`;
  const base=`${circ(290,232,10)}${line(301,236,390,252,6)}<ellipse cx="375" cy="251" rx="26" ry="13" fill="${H}"/>`;
  const a=`${base}${line(390,252,445,267)}${line(445,267,488,286)}`;
  const b=`${base}${line(390,252,420,210)}${line(420,210,445,180)}`;
  const motion=`<path d="M 505 284 Q 520 230 466 183" stroke="${L}" stroke-width="7" fill="none" stroke-linecap="round"/><path d="M 480 185 L 466 183 L 470 198" stroke="${L}" stroke-width="7" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
  return {equipment:`${mat}<text x="302" y="332" fill="rgba(250,250,250,.64)" font-family="Arial" font-size="10" font-weight="800">SOLO / COLCHONETE</text>`,a,b,motion,note:'enrola o quadril para cima; não embala as pernas'};
}
function v60CoreScenePallof(){
  const dark=document.documentElement?.dataset?.theme==='dark';
  const W='#FAFAFA',M=dark?'rgba(250,250,250,.22)':'rgba(250,250,250,.28)',L=dark?'#FF3B30':'#E9342C',H=dark?'rgba(255,59,48,.34)':'rgba(233,52,44,.28)';
  const line=(x1,y1,x2,y2,sw=5,c=W)=>`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${c}" stroke-width="${sw}" stroke-linecap="round"/>`;
  const tower=`<rect x="145" y="60" width="22" height="250" rx="7" fill="${M}"/>${line(156,72,156,296,3,M)}${line(156,165,325,165,3,M)}`;
  const base=`<circle cx="370" cy="122" r="10" fill="none" stroke="${W}" stroke-width="4"/>${line(370,136,370,218,6)}${line(370,218,345,292)}${line(370,218,397,292)}<ellipse cx="370" cy="178" rx="18" ry="34" fill="${H}"/>`;
  const a=`${base}${line(370,158,335,166)}${line(335,166,324,166)}`;
  const b=`${base}${line(370,158,420,166)}${line(420,166,465,166)}`;
  const motion=`<path d="M 402 205 L 471 205" stroke="${L}" stroke-width="7" fill="none" stroke-linecap="round"/><path d="M 456 195 L 471 205 L 456 215" stroke="${L}" stroke-width="7" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
  return {equipment:`${tower}<text x="135" y="332" fill="rgba(250,250,250,.64)" font-family="Arial" font-size="10" font-weight="800">POLIA LATERAL</text>`,a,b,motion,note:'empurra à frente sem deixar o tronco girar'};
}
function v60CoreSceneLegRaise(){
  const dark=document.documentElement?.dataset?.theme==='dark';
  const W='#FAFAFA',M=dark?'rgba(250,250,250,.22)':'rgba(250,250,250,.28)',L=dark?'#FF3B30':'#E9342C',H=dark?'rgba(255,59,48,.34)':'rgba(233,52,44,.28)';
  const line=(x1,y1,x2,y2,sw=5,col=W)=>`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${col}" stroke-width="${sw}" stroke-linecap="round"/>`;
  const circ=(x,y,r)=>`<circle cx="${x}" cy="${y}" r="${r}" fill="none" stroke="${W}" stroke-width="4"/>`;
  const bench=`${line(235,246,475,246,14,M)}${line(260,246,245,305,8,M)}${line(450,246,465,305,8,M)}`;
  const torso=`${circ(292,218,10)}${line(303,221,382,238,6)}<ellipse cx="370" cy="238" rx="24" ry="13" fill="${H}"/>`;
  const a=`${torso}${line(382,238,440,255)}${line(440,255,490,274)}${line(382,238,435,270)}${line(435,270,482,293)}`;
  const b=`${torso}${line(382,238,414,195)}${line(414,195,429,145)}${line(382,238,431,203)}${line(431,203,450,151)}`;
  const motion=`<path d="M 510 278 Q 532 212 462 154" stroke="${L}" stroke-width="7" fill="none" stroke-linecap="round"/><path d="M 476 157 L 462 154 L 465 169" stroke="${L}" stroke-width="7" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
  return {equipment:`${bench}<text x="318" y="332" fill="rgba(250,250,250,.64)" font-family="Arial" font-size="10" font-weight="800">BANCO RETO</text>`,a,b,motion,note:'sobe as pernas sem arquear a lombar'};
}
function v60CoreSceneDeadBug(){
  const dark=document.documentElement?.dataset?.theme==='dark';
  const W='#FAFAFA',M=dark?'rgba(250,250,250,.22)':'rgba(250,250,250,.28)',L=dark?'#FF3B30':'#E9342C',H=dark?'rgba(255,59,48,.34)':'rgba(233,52,44,.28)';
  const line=(x1,y1,x2,y2,sw=5,col=W)=>`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${col}" stroke-width="${sw}" stroke-linecap="round"/>`;
  const mat=`<rect x="225" y="260" width="280" height="14" rx="7" fill="${M}"/>`;
  const base=`<circle cx="290" cy="226" r="10" fill="none" stroke="${W}" stroke-width="4"/>${line(301,230,383,245,6)}<ellipse cx="367" cy="245" rx="24" ry="13" fill="${H}"/>`;
  const a=`${base}${line(340,238,315,190)}${line(383,245,411,198)}${line(383,245,420,210)}${line(340,238,320,194)}`;
  const b=`${base}${line(340,238,288,184)}${line(383,245,455,245)}${line(383,245,414,204)}${line(340,238,325,194)}`;
  const motion=`<path d="M 470 190 Q 500 220 508 248" stroke="${L}" stroke-width="7" fill="none" stroke-linecap="round"/><path d="M 498 235 L 508 248 L 493 249" stroke="${L}" stroke-width="7" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
  return {equipment:`${mat}<text x="305" y="332" fill="rgba(250,250,250,.64)" font-family="Arial" font-size="10" font-weight="800">SOLO / COLCHONETE</text>`,a,b,motion,note:'lombar colada no chão; alterna braço e perna opostos'};
}

function v60CoreSceneWoodchop(){
  const dark=document.documentElement?.dataset?.theme==='dark';
  const W='#FAFAFA',M=dark?'rgba(250,250,250,.22)':'rgba(250,250,250,.28)',L=dark?'#FF3B30':'#E9342C',H=dark?'rgba(255,59,48,.34)':'rgba(233,52,44,.28)';
  const line=(x1,y1,x2,y2,sw=5,c=W)=>`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${c}" stroke-width="${sw}" stroke-linecap="round"/>`;
  const tower=`<rect x="145" y="60" width="22" height="250" rx="7" fill="${M}"/>${line(156,72,156,296,3,M)}${line(156,92,315,128,3,M)}`;
  const base=`<circle cx="370" cy="120" r="10" fill="none" stroke="${W}" stroke-width="4"/>${line(370,134,370,220,6)}${line(370,220,344,292)}${line(370,220,400,292)}<ellipse cx="370" cy="178" rx="20" ry="34" fill="${H}"/>`;
  const a=`${base}${line(370,150,327,128)}${line(327,128,314,128)}`;
  const b=`${base}${line(370,150,411,215)}${line(411,215,442,242)}`;
  const motion=`<path d="M 319 112 Q 387 161 447 238" stroke="${L}" stroke-width="7" fill="none" stroke-linecap="round"/><path d="M 438 221 L 447 238 L 428 235" stroke="${L}" stroke-width="7" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
  return {equipment:`${tower}<text x="135" y="332" fill="rgba(250,250,250,.64)" font-family="Arial" font-size="10" font-weight="800">POLIA ALTA</text>`,a,b,motion,note:'costelas e quadril giram juntos, sem puxar só com os braços'};
}

v60InstallAestheticCorePlan();

if(typeof v60V4Scene==='function'){
  const v60CoreBaseScene=v60V4Scene;
  v60V4Scene=function(ex){
    const id=String(ex?.id||'');
    if(id==='core-crunch-seg')return v60CoreBaseScene({...ex,id:'crunch-2'});
    if(id==='crunch')return v60CoreBaseScene({...ex,id:'crunch-2'});
    if(id==='core-pallof-ter')return v60CoreScenePallof();
    if(id==='core-leg-raise-ter')return v60CoreSceneReverseCrunch();
    if(id==='core-woodchop-qui')return v60CoreScenePallof();
    if(id==='core-dead-bug-qui')return v60CoreSceneReverseCrunch();
    return v60CoreBaseScene(ex);
  };
}

function v60SyncCoreSession(){
  const s=state.activeSession;if(!s)return;
  const plan=workoutPlan.find(w=>w.id===s.workoutId);if(!plan)return;
  const existing=new Map((s.exercises||[]).map(e=>[e.id,e]));
  s.exercises=plan.exercises.map(p=>{
    const old=existing.get(p.id);
    if(old)return {...p,...old,name:p.name,equipment:p.equipment,min:p.min,max:p.max,rest:p.rest,icon:p.icon,core:p.core||old.core,usesLoad:p.usesLoad,sets:(old.sets||[]).map((set,i)=>({...set,n:i+1,weight:p.usesLoad===false?'':(set.weight??'')}))};
    const ex={...p,sets:Array.from({length:p.sets},(_,i)=>({n:i+1,weight:'',reps:'',done:false}))};
    if(typeof v60SeedExerciseSets==='function')v60SeedExerciseSets(ex);
    return ex;
  });
  save(K.draft,s);
}
const v60CoreBaseStartSession=startSession;
startSession=function(workoutId){
  v60CoreBaseStartSession(workoutId);
  if(!state.activeSession)return;
  v60SyncCoreSession();
  state.currentExercise=Math.max(0,state.activeSession.exercises.findIndex(ex=>ex.sets.some(s=>!s.done)));
  if(state.currentExercise<0)state.currentExercise=0;
  renderSession();
};

v60ExtrasPanel=function(){
  const extras=(state.activeSession?.extras||[]).filter(x=>x.type==='cardio');
  const total=extras.reduce((a,x)=>a+Number(x.minutes||0),0);
  return `<section class="v60-extras-card v60-cardio-only"><div><span>cardio</span><b>${total?`${total} min registrados`:'opcional hoje'}</b></div><div class="v60-extra-actions"><button id="v60AddCardio" type="button">+ adicionar cardio</button></div>${extras.length?'<button class="v60-clear-extras" id="v60ClearExtras" type="button">limpar cardio</button>':''}</section>`;
};

const v60CoreBaseRenderSession=renderSession;
renderSession=function(){
  v60CoreBaseRenderSession();
  const ex=state.activeSession?.exercises?.[state.currentExercise];
  const hero=document.querySelector('.exercise-hero');
  if(ex?.core&&hero&&!hero.querySelector('.v60-core-chip'))hero.insertAdjacentHTML('beforeend','<span class="v60-core-chip">CORE · CINTURA</span>');
};

const v60CoreBaseRenderWorkouts=renderWorkouts;
renderWorkouts=function(){
  v60CoreBaseRenderWorkouts();
  const main=document.querySelector('.workouts-page');
  if(main&&!main.querySelector('.v60-core-program-note'))main.insertAdjacentHTML('beforeend','<section class="v60-core-program-note"><b>7 estímulos de core em 5 dias</b><span>crunch na polia + reverse crunch no chão + Pallof press · abdômen e anti-rotação sem flexão lateral pesada</span></section>');
};

if(state.activeSession)v60SyncCoreSession();
render();
