/*
 * Traço Coach 1.0
 * Camada de inteligência local-first para treino, progressão e revisão estética.
 */
(function(){
  'use strict';

  const COACH_VERSION='1.0.0';
  const FOCUS_KEY='traco_coach_focus_v1';
  const REVIEW_KEY='traco_coach_review_v1';
  const PHOTO_DB='traco_photo_checkins_v1';
  const PHOTO_STORE='checkins';
  const photoDraft={};

  function esc(v){
    return String(v==null?'':v).replace(/[&<>"']/g,function(ch){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[ch];
    });
  }
  function qs(s){return document.querySelector(s);}
  function qsa(s){return Array.from(document.querySelectorAll(s));}
  function usesLoad(ex){return typeof tracoExerciseUsesLoad==='function'?tracoExerciseUsesLoad(ex):ex&&ex.usesLoad!==false;}
  function doneSets(ex){return (ex&&ex.sets||[]).filter(function(set){return set.done&&!set.skipped;});}
  function previousExercise(exKey,excludeSessionId){
    const all=sessions().filter(function(s){return s.finishedAt&&String(s.id)!==String(excludeSessionId||'');}).sort(function(a,b){return b.startedAt-a.startedAt;});
    for(const sess of all){
      const ex=(sess.exercises||[]).find(function(item){return tracoExerciseProgressionKey(item)===exKey;});
      if(ex&&doneSets(ex).length)return ex;
    }
    return null;
  }
  function lastCompletedSet(ex){
    const sets=doneSets(ex);
    return sets.length?sets[sets.length-1]:null;
  }
  function workingSet(ex){
    if(!ex)return null;
    const i=typeof currentSetIndex==='function'?currentSetIndex(ex):(ex.sets||[]).findIndex(function(s){return !s.done;});
    return i>=0?ex.sets[i]:null;
  }
  function loadStep(weight,ex){
    const n=Number(weight||0);
    const eq=String(ex&&ex.equipment||'').toLowerCase();
    if(/leg press/.test(eq))return 10;
    if(/smith/.test(eq)&&n>=50)return 5;
    return 2.5;
  }
  function bestWeight(ex){
    return Math.max(0,...doneSets(ex).map(function(s){return Number(s.weight||0);}));
  }
  function coachSuggestion(ex){
    const prev=previousExercise(tracoExerciseProgressionKey(ex),state.activeSession&&state.activeSession.id);
    if(!prev)return {kind:'baseline',title:'cria sua referência',detail:'faz com técnica limpa e deixa o Traço aprender sua carga.'};
    const sets=doneSets(prev);
    if(!sets.length)return {kind:'baseline',title:'sem referência completa',detail:'repete confortável e fecha todas as séries.'};
    const top=Math.max(1,Number(ex.max)||12);
    const min=Math.max(1,Number(ex.min)||8);
    const reps=sets.map(function(s){return Number(s.reps||0);});
    const last=sets[sets.length-1];
    const rir=last.rir||prev.rirLast||'';
    if(!usesLoad(ex)){
      const best=Math.max(0,...reps);
      if(best>=top&&rir!=='heavy')return {kind:'reps',title:'pode subir reps',detail:'última sessão ficou sólida. tenta +1–2 reps mantendo controle.',reps:Math.min(top+2,best+2)};
      return {kind:'hold',title:'mantém a execução',detail:'repete a faixa e busca controle antes de aumentar dificuldade.'};
    }
    const weight=Number(last.weight||bestWeight(prev)||0);
    if(!weight)return {kind:'baseline',title:'define sua carga',detail:'registra uma carga real hoje para liberar progressão automática.'};
    const allTop=reps.length>0&&reps.every(function(r){return r>=top;});
    const belowMin=reps.some(function(r){return r>0&&r<min;});
    if(allTop&&(rir==='easy'||rir==='right'||!rir)){
      const next=weight+loadStep(weight,ex);
      return {kind:'up',title:'pronto para subir',detail:weight+' → '+next+' kg · se a execução continuar limpa.',weight:next};
    }
    if(rir==='heavy'||belowMin)return {kind:'hold',title:'mantém a carga',detail:weight+' kg · fecha a faixa com boa técnica antes de subir.',weight:weight};
    return {kind:'hold',title:'consolida esta carga',detail:weight+' kg · tenta chegar ao topo da faixa de reps.',weight:weight};
  }
  function applySuggestion(){
    const s=state.activeSession,ex=s&&s.exercises&&s.exercises[state.currentExercise];if(!s||!ex)return;
    const sug=coachSuggestion(ex);
    if(sug.weight!=null&&usesLoad(ex)){
      (ex.sets||[]).forEach(function(set){if(!set.done)set.weight=String(sug.weight);});
    }
    if(sug.reps!=null){
      (ex.sets||[]).forEach(function(set){if(!set.done)set.reps=String(sug.reps);});
    }
    save(K.draft,s);haptic();toast('sugestão aplicada');renderSession();
  }
  function repeatLastSet(){
    const s=state.activeSession,ex=s&&s.exercises&&s.exercises[state.currentExercise];if(!s||!ex)return;
    const current=workingSet(ex);if(!current)return;
    const own=doneSets(ex).filter(function(set){return set!==current;});
    let src=own.length?own[own.length-1]:null;
    if(!src){
      const prev=previousExercise(tracoExerciseProgressionKey(ex),s.id);
      src=prev?lastCompletedSet(prev):null;
    }
    if(!src)return toast('ainda não tem série para repetir');
    current.weight=usesLoad(ex)?String(src.weight||''):'';
    current.reps=String(src.reps||'');
    save(K.draft,s);haptic();toast('última série repetida');renderSession();
  }
  function doLater(){
    const s=state.activeSession,ex=s&&s.exercises&&s.exercises[state.currentExercise];if(!s||!ex)return;
    if(typeof tracoGymEnsureSessionQueue==='function'&&typeof tracoGymSetForToken==='function'&&typeof tracoGymQueueParts==='function'){
      const queue=tracoGymEnsureSessionQueue(s).slice();
      const done=queue.filter(function(token){const item=tracoGymSetForToken(s,token);return item.set&&item.set.done;});
      const remaining=queue.filter(function(token){const item=tracoGymSetForToken(s,token);return item.set&&!item.set.done;});
      const mine=remaining.filter(function(token){return tracoGymQueueParts(token).exerciseId===ex.id;});
      const other=remaining.filter(function(token){return tracoGymQueueParts(token).exerciseId!==ex.id;});
      s.tracoSetQueue=done.concat(other,mine);
      save(K.draft,s);
      if(typeof tracoGymSyncQueueCursor==='function')tracoGymSyncQueueCursor(s);
      haptic();toast('joguei este exercício para o fim');renderSession();return;
    }
    const next=s.exercises.findIndex(function(item,i){return i!==state.currentExercise&&(item.sets||[]).some(function(set){return !set.done;});});
    if(next>=0){state.currentExercise=next;save(K.draft,s);toast('fazemos este depois');renderSession();}
  }

  const substituteGroups=[
    ['supino-inclinado','supino-reto','crucifixo-baixo-alto','crucifixo-reto'],
    ['puxada-aberta','puxada-neutra','pullover'],
    ['remada-baixa','pullover'],
    ['elevacao-lateral','elevacao-lateral-2','elevacao-lateral-3','face-pull','crucifixo-inverso'],
    ['triceps-pushdown','triceps-overhead','triceps-overhead-2'],
    ['rosca-polia','rosca-unilateral','rosca-martelo'],
    ['leg-press','agachamento-smith'],
    ['flexora','flexora-2','rdl'],
    ['abdutora','abdutora-2']
  ];
  function masterExercises(){
    return Array.from(new Map(workoutPlan.flatMap(function(w){return w.exercises;}).map(function(ex){return [ex.id,ex];})).values());
  }
  function substitutesFor(ex){
    const group=substituteGroups.find(function(ids){return ids.includes(ex.id);})||[];
    const all=masterExercises();
    return all.filter(function(item){return item.id!==ex.id&&group.includes(item.id);});
  }
  function closeSubstitute(){qs('#tracoCoachSubstitute')&&qs('#tracoCoachSubstitute').remove();document.body.classList.remove('traco-coach-modal-open');}
  function openSubstitute(){
    const s=state.activeSession,ex=s&&s.exercises&&s.exercises[state.currentExercise];if(!s||!ex)return;
    if(doneSets(ex).length)return toast('já começou este exercício · use “fazer depois”');
    const options=substitutesFor(ex).filter(function(item){return !(s.exercises||[]).some(function(active){return active.id===item.id;});});
    if(!options.length)return toast('não achei substituto simples neste treino');
    closeSubstitute();
    document.body.classList.add('traco-coach-modal-open');
    document.body.insertAdjacentHTML('beforeend',
      '<div class="traco-coach-backdrop" id="tracoCoachSubstitute"><section class="traco-coach-sheet">'+
      '<header><div><span>máquina ocupada?</span><h3>substituir exercício</h3><small>'+esc(ex.name)+'</small></div><button id="tracoCoachSubClose">×</button></header>'+
      '<div class="traco-coach-sub-list">'+options.map(function(item){
        return '<button data-coach-sub="'+esc(item.id)+'"><b>'+esc(item.name)+'</b><small>'+esc(item.equipment)+'</small><i>→</i></button>';
      }).join('')+'</div><p>troque só se precisar. o Traço mantém o volume do treino de hoje.</p></section></div>');
    qs('#tracoCoachSubClose').onclick=closeSubstitute;
    qs('#tracoCoachSubstitute').onclick=function(e){if(e.target.id==='tracoCoachSubstitute')closeSubstitute();};
    qsa('[data-coach-sub]').forEach(function(btn){btn.onclick=function(){applySubstitute(btn.dataset.coachSub);};});
  }
  function applySubstitute(id){
    const s=state.activeSession,old=s&&s.exercises&&s.exercises[state.currentExercise];if(!s||!old)return;
    const replacement=masterExercises().find(function(ex){return ex.id===id;});if(!replacement)return;
    const setCount=(old.sets||[]).length||Number(replacement.sets)||3;
    const next=Object.assign({},replacement,{
      sets:Array.from({length:setCount},function(_,i){return {n:i+1,weight:'',reps:'',done:false,substitutedFor:old.id};}),
      substitutedFor:old.id
    });
    s.exercises[state.currentExercise]=next;
    delete s.tracoSetQueue;
    if(typeof tracoGymEnsureSessionQueue==='function')tracoGymEnsureSessionQueue(s);
    save(K.draft,s);closeSubstitute();haptic();toast('exercício substituído');renderSession();
  }
  function setRir(value){
    const s=state.activeSession,ex=s&&s.exercises&&s.exercises[state.currentExercise];if(!s||!ex)return;
    const set=workingSet(ex)||lastCompletedSet(ex);if(!set)return;
    set.rir=value;ex.rirLast=value;save(K.draft,s);haptic();renderSession();
  }
  function addCardio(minutes){
    const s=state.activeSession;if(!s)return;
    if(!Array.isArray(s.extras))s.extras=[];
    s.extras.push({type:'cardio',name:'cardio moderado',minutes:Number(minutes),calories:0,at:Date.now(),source:'coach-quick'});
    save(K.draft,s);haptic();toast(minutes+' min de cardio registrados');renderSession();
  }
  function focusEnabled(){return localStorage.getItem(FOCUS_KEY)==='1';}
  function setFocus(on){
    localStorage.setItem(FOCUS_KEY,on?'1':'0');
    document.body.classList.toggle('traco-focus-mode',on);
    renderSession();
  }
  function decorateSession(){
    const s=state.activeSession,main=qs('.perf-session');if(!s||!main)return;
    document.body.classList.toggle('traco-focus-mode',focusEnabled());
    const ex=s.exercises[state.currentExercise];if(!ex)return;
    const consoleEl=main.querySelector('.perf-exercise-console');if(!consoleEl)return;
    if(qs('#tracoCoachPanel'))return;
    const sug=coachSuggestion(ex);
    const active=workingSet(ex),last=lastCompletedSet(ex);
    const currentRir=(active&&active.rir)||(last&&last.rir)||ex.rirLast||'';
    const canApply=sug.weight!=null||sug.reps!=null;
    consoleEl.insertAdjacentHTML('beforeend',
      '<section class="traco-coach-panel" id="tracoCoachPanel">'+
      '<div class="traco-coach-smart"><div><span>TRAÇO COACH</span><b>'+esc(sug.title)+'</b><small>'+esc(sug.detail)+'</small></div>'+(canApply?'<button id="tracoCoachApply">usar</button>':'')+'</div>'+
      '<div class="traco-coach-actions">'+
      '<button id="tracoCoachRepeat"><b>↻</b><span>repetir<br>última</span></button>'+
      '<button id="tracoCoachLater"><b>↧</b><span>fazer<br>depois</span></button>'+
      '<button id="tracoCoachSub"><b>⇄</b><span>substituir</span></button>'+
      '<button id="tracoCoachFocus"><b>◉</b><span>'+(focusEnabled()?'modo normal':'modo foco')+'</span></button>'+
      '</div>'+
      '<div class="traco-coach-rir"><span>como ficou esta série?</span><div>'+
      '<button data-rir="easy" class="'+(currentRir==='easy'?'is-active':'')+'">fácil</button>'+
      '<button data-rir="right" class="'+(currentRir==='right'?'is-active':'')+'">certo</button>'+
      '<button data-rir="heavy" class="'+(currentRir==='heavy'?'is-active':'')+'">pesado</button>'+
      '</div></div>'+
      '</section>');
    if(qs('#tracoCoachApply'))qs('#tracoCoachApply').onclick=applySuggestion;
    qs('#tracoCoachRepeat').onclick=repeatLastSet;
    qs('#tracoCoachLater').onclick=doLater;
    qs('#tracoCoachSub').onclick=openSubstitute;
    qs('#tracoCoachFocus').onclick=function(){setFocus(!focusEnabled());};
    qsa('[data-rir]').forEach(function(btn){btn.onclick=function(){setRir(btn.dataset.rir);};});

    const footer=main.querySelector('.perf-session-footer');
    if(footer&&!qs('#tracoCoachCardio')){
      footer.insertAdjacentHTML('beforebegin','<section class="traco-coach-cardio" id="tracoCoachCardio"><div><span>acabamento opcional</span><b>cardio moderado</b><small>15–20 min · 3–4x/semana</small></div><div><button data-cardio="15">+15</button><button data-cardio="20">+20</button></div></section>');
      qsa('[data-cardio]').forEach(function(btn){btn.onclick=function(){addCardio(btn.dataset.cardio);};});
    }
  }

  function compareSession(s){
    const gains=[];
    (s.exercises||[]).forEach(function(ex){
      const current=doneSets(ex);if(!current.length)return;
      const prev=previousExercise(tracoExerciseProgressionKey(ex),s.id);if(!prev)return;
      if(usesLoad(ex)){
        const now=bestWeight(ex),before=bestWeight(prev);
        if(now>before&&before>0)gains.push(ex.name+' +'+(now-before).toFixed((now-before)%1?1:0)+' kg');
      }else{
        const now=Math.max(0,...current.map(function(set){return Number(set.reps||0);}));
        const before=Math.max(0,...doneSets(prev).map(function(set){return Number(set.reps||0);}));
        if(now>before&&before>0)gains.push(ex.name+' +'+(now-before)+' reps');
      }
    });
    const skipped=(s.exercises||[]).filter(function(ex){return ex.skipped||(ex.sets||[]).every(function(set){return set.skipped;});}).length;
    const cardio=(s.extras||[]).filter(function(x){return x.type==='cardio';}).reduce(function(a,x){return a+Number(x.minutes||0);},0);
    return {sessionId:s.id,gains:gains.slice(0,3),skipped:skipped,cardio:cardio};
  }
  function decorateFinish(){
    const card=qs('.finish-card'),summary=state.tracoCoachSummary;if(!card||!summary||qs('#tracoCoachFinish'))return;
    const next=typeof v60RecommendedWorkout==='function'?v60RecommendedWorkout():null;
    const messages=[];
    if(summary.gains.length)summary.gains.forEach(function(x){messages.push('<li><b>↑</b><span>'+esc(x)+'</span></li>');});
    if(!summary.gains.length)messages.push('<li><b>✓</b><span>consistência registrada · mantém a progressão.</span></li>');
    if(summary.skipped)messages.push('<li><b>↷</b><span>'+summary.skipped+' exercício'+(summary.skipped>1?'s':'')+' pulado'+(summary.skipped>1?'s':'')+'.</span></li>');
    if(summary.cardio)messages.push('<li><b>♥</b><span>'+summary.cardio+' min de cardio registrados.</span></li>');
    const back=qs('#backHome');
    const html='<section class="traco-coach-finish" id="tracoCoachFinish"><span>RESUMO DO COACH</span><ul>'+messages.join('')+'</ul>'+(next?'<p>próximo: <b>'+esc(next.short||next.name)+'</b></p>':'')+'</section>';
    if(back)back.insertAdjacentHTML('beforebegin',html);else card.insertAdjacentHTML('beforeend',html);
  }

  function ratio(a,b){const x=Number(a),y=Number(b);return x>0&&y>0?(x/y):null;}
  function priorityMapMarkup(){
    return '<section class="traco-body-map">'+
      '<header><span>MAPA CORPORAL</span><h3>prioridades do ciclo</h3><small>construir o V sem engrossar a cintura.</small></header>'+
      '<div class="traco-body-map-grid">'+
      '<article class="high"><b>dorsal</b><span>↑ alta</span><small>abrir largura</small></article>'+
      '<article class="high"><b>ombro lateral</b><span>↑ alta</span><small>ampliar moldura</small></article>'+
      '<article class="high"><b>peito</b><span>↑ alta</span><small>volume + projeção</small></article>'+
      '<article class="medium"><b>braços</b><span>↑ média</span><small>mais espessura</small></article>'+
      '<article class="keep"><b>cintura</b><span>→ definir</span><small>sem lateral pesada</small></article>'+
      '</div></section>';
  }
  function reviewMarkup(){
    const all=sessions().filter(function(s){return s.finishedAt;});
    const now=Date.now(),windowStart=now-42*86400000;
    const recent=all.filter(function(s){return s.startedAt>=windowStart;});
    const weeks=6,avg=(recent.length/weeks).toFixed(1);
    const bodyRows=body().slice().sort(function(a,b){return a.date.localeCompare(b.date);});
    const latest=bodyRows[bodyRows.length-1],base=bodyRows.find(function(x){return new Date(x.date+'T12:00:00').getTime()>=windowStart;})||bodyRows[0];
    const waistDelta=latest&&base&&latest.waist&&base.waist?Number(latest.waist)-Number(base.waist):null;
    const lastReview=Number(localStorage.getItem(REVIEW_KEY)||0);
    const due=!lastReview||now-lastReview>=35*86400000;
    let note='mantém o plano e busca progressão de carga/reps.';
    if(recent.length<18)note='prioridade do próximo ciclo: consistência antes de aumentar volume.';
    else if(waistDelta!=null&&waistDelta>1.5)note='mantém musculação e acompanha cintura/cardio antes de subir volume.';
    else if(recent.length>=24)note='frequência boa: mantém o volume e tenta progredir dorsal, ombro e peito.';
    return '<section class="traco-review-card '+(due?'is-due':'')+'"><div><span>REVISÃO 6 SEMANAS</span><h3>'+(due?'hora de revisar':'ciclo em andamento')+'</h3><small>'+recent.length+' treinos · '+avg+'/semana</small></div><p>'+esc(note)+'</p><button id="tracoCoachReview">'+(due?'marcar revisão feita':'revisar agora')+'</button></section>';
  }
  function decorateProgress(){
    const main=qs('.progress-page');if(!main||qs('.traco-body-map'))return;
    main.insertAdjacentHTML('beforeend',priorityMapMarkup()+reviewMarkup());
    const btn=qs('#tracoCoachReview');
    if(btn)btn.onclick=function(){localStorage.setItem(REVIEW_KEY,String(Date.now()));toast('revisão do ciclo registrada');renderProgress();};
  }

  function coachDb(){
    return new Promise(function(resolve,reject){
      if(!window.indexedDB)return reject(new Error('IndexedDB indisponível'));
      const req=indexedDB.open(PHOTO_DB,1);
      req.onupgradeneeded=function(){const db=req.result;if(!db.objectStoreNames.contains(PHOTO_STORE))db.createObjectStore(PHOTO_STORE,{keyPath:'id'});};
      req.onsuccess=function(){resolve(req.result);};req.onerror=function(){reject(req.error);};
    });
  }
  async function dbPut(value){
    const db=await coachDb();
    return new Promise(function(resolve,reject){const tx=db.transaction(PHOTO_STORE,'readwrite');tx.objectStore(PHOTO_STORE).put(value);tx.oncomplete=function(){resolve();};tx.onerror=function(){reject(tx.error);};});
  }
  async function dbAll(){
    const db=await coachDb();
    return new Promise(function(resolve,reject){const tx=db.transaction(PHOTO_STORE,'readonly');const req=tx.objectStore(PHOTO_STORE).getAll();req.onsuccess=function(){resolve(req.result||[]);};req.onerror=function(){reject(req.error);};});
  }
  function compressPhoto(file){
    return new Promise(function(resolve,reject){
      const reader=new FileReader();
      reader.onerror=reject;
      reader.onload=function(){
        const img=new Image();
        img.onerror=reject;
        img.onload=function(){
          const max=900,scale=Math.min(1,max/Math.max(img.width,img.height));
          const canvas=document.createElement('canvas');canvas.width=Math.round(img.width*scale);canvas.height=Math.round(img.height*scale);
          const ctx=canvas.getContext('2d');ctx.drawImage(img,0,0,canvas.width,canvas.height);
          resolve(canvas.toDataURL('image/jpeg',0.72));
        };
        img.src=reader.result;
      };
      reader.readAsDataURL(file);
    });
  }
  function photoSlotMarkup(key,label){
    return '<label class="traco-photo-slot" data-photo-slot="'+key+'"><input type="file" accept="image/*" data-photo-input="'+key+'"><span>'+label+'</span><small>mesma luz · mesma distância</small></label>';
  }
  async function importStandardBaseline(file){
    if(!file)throw new Error('arquivo ausente');
    const pack=JSON.parse(await file.text());
    if(pack.type!=='traco-photo-pack'||!Array.isArray(pack.photos)||!pack.photos.length)throw new Error('pacote inválido');
    const incoming=pack.photos.map(function(row,index){
      if(!row.front||!row.side||!row.back)throw new Error('trio incompleto');
      return Object.assign({},row,{
        id:Number(row.id)||Date.now()+index,
        date:row.date||new Date().toISOString().slice(0,10),
        baselineOfficial:true,
        kind:'progress',
        importedToStandardCheckin:true
      });
    });
    const existing=await dbAll();
    for(const row of incoming){
      const duplicate=existing.find(function(item){
        return item.baselineOfficial&&item.date===row.date&&item.front===row.front&&item.side===row.side&&item.back===row.back;
      });
      if(!duplicate)await dbPut(row);
    }
    return incoming[0];
  }
  function photoRecordMarkup(row,label){
    const badge=row.baselineOfficial?'<em class="traco-photo-baseline-badge">BASELINE OFICIAL</em>':'';
    return '<div class="traco-photo-record '+(row.baselineOfficial?'is-baseline':'')+'"><div class="traco-photo-record-head"><div><span>'+label+'</span><b>'+esc(row.date)+'</b></div>'+badge+'</div><div class="traco-photo-thumbs"><img src="'+row.front+'" alt="frente"><img src="'+row.side+'" alt="perfil"><img src="'+row.back+'" alt="costas"></div>'+(row.note?'<small>'+esc(row.note)+'</small>':'')+'</div>';
  }
  async function refreshPhotoHistory(){
    const target=qs('#tracoPhotoHistory');if(!target)return;
    try{
      const rows=(await dbAll()).sort(function(a,b){return b.id-a.id;});
      if(!rows.length){target.innerHTML='<p>a primeira sequência vira sua referência visual. se você já tem o pacote do baseline atual, importe logo acima.</p>';return;}
      const latest=rows[0];
      const baseline=rows.find(function(row){return row.baselineOfficial;})||rows[rows.length-1];
      const parts=[];
      if(baseline)parts.push(photoRecordMarkup(baseline,'baseline / antes'));
      if(latest&&(!baseline||latest.id!==baseline.id))parts.push(photoRecordMarkup(latest,'último check-in'));
      target.innerHTML=parts.join('')+'<small class="traco-photo-count">'+rows.length+' check-in'+(rows.length>1?'s':'')+' salvo'+(rows.length>1?'s':'')+' neste aparelho</small>';
    }catch(e){target.innerHTML='<p>fotos indisponíveis neste navegador.</p>';}
  }
  function bodyRatiosMarkup(){
    const rows=body().slice().sort(function(a,b){return b.date.localeCompare(a.date);}),latest=rows[0];
    const chest=latest?ratio(latest.chest,latest.waist):null;
    const shoulders=latest?ratio(latest.shoulders,latest.waist):null;
    return '<section class="traco-ratio-card"><header><span>PROPORÇÃO</span><h3>V visual</h3></header><div>'+
      '<article><b>'+(chest?chest.toFixed(2)+'×':'—')+'</b><small>peito / cintura</small></article>'+
      '<article><b>'+(shoulders?shoulders.toFixed(2)+'×':'—')+'</b><small>ombros / cintura</small></article>'+
      '</div><p>acompanha proporção, não “nota” do corpo. mais largura em cima com cintura estável é o sinal que buscamos.</p></section>';
  }
  function decorateBody(){
    const main=qs('.body-page');if(!main||qs('#tracoPhotoCheckin'))return;
    main.insertAdjacentHTML('beforeend',bodyRatiosMarkup()+priorityMapMarkup()+
      '<section class="traco-photo-card" id="tracoPhotoCheckin"><header><span>FOTOS PADRONIZADAS</span><h3>frente · perfil · costas</h3><small>relaxado, mesma luz, distância e altura da câmera.</small></header>'+
      '<label class="traco-photo-date">data<input id="tracoPhotoDate" type="date" value="'+new Date().toISOString().slice(0,10)+'"></label>'+
      '<div class="traco-photo-grid">'+photoSlotMarkup('front','frente')+photoSlotMarkup('side','perfil')+photoSlotMarkup('back','costas')+'</div>'+
      '<button class="cta-lime" id="tracoPhotoSave">salvar check-in</button>'+
      '<div class="traco-standard-baseline-import"><div><span>JÁ TEM SEU “ANTES”?</span><b>usar baseline atual como fotos padronizadas</b><small>importe o pacote privado uma vez. ele entra aqui como frente + perfil + costas e vira seu baseline oficial.</small></div><label>importar baseline<input id="tracoStandardBaselineImport" type="file" accept="application/json"></label></div>'+
      '<div id="tracoPhotoHistory" class="traco-photo-history"></div></section>');
    qsa('[data-photo-input]').forEach(function(input){
      input.onchange=async function(){
        const file=input.files&&input.files[0];if(!file)return;
        const key=input.dataset.photoInput;
        try{
          const data=await compressPhoto(file);photoDraft[key]=data;
          const slot=qs('[data-photo-slot="'+key+'"]');if(slot){slot.style.backgroundImage='url("'+data+'")';slot.classList.add('has-photo');}
          haptic();
        }catch(e){toast('não consegui preparar esta foto');}
      };
    });
    qs('#tracoPhotoSave').onclick=async function(){
      if(!photoDraft.front||!photoDraft.side||!photoDraft.back)return toast('faltam frente, perfil e costas');
      const date=qs('#tracoPhotoDate').value;if(!date)return toast('escolhe a data');
      try{
        await dbPut({id:Date.now(),date:date,front:photoDraft.front,side:photoDraft.side,back:photoDraft.back,kind:'progress'});
        photoDraft.front=photoDraft.side=photoDraft.back=null;toast('check-in fotográfico salvo');haptic();renderBody();
      }catch(e){toast('não consegui salvar as fotos');}
    };
    const baselineInput=qs('#tracoStandardBaselineImport');
    if(baselineInput)baselineInput.onchange=async function(){
      const file=baselineInput.files&&baselineInput.files[0];if(!file)return;
      try{
        const row=await importStandardBaseline(file);
        toast('baseline oficial adicionado às fotos padronizadas');
        haptic();
        const date=qs('#tracoPhotoDate');if(date&&row&&row.date)date.value=row.date;
        renderBody();
      }catch(e){toast('não consegui importar esse baseline');}
    };
    refreshPhotoHistory();
  }

  const baseRenderSession=renderSession;
  renderSession=function(){baseRenderSession();decorateSession();};

  const baseFinishSession=finishSession;
  finishSession=function(){
    if(state.activeSession)state.tracoCoachSummary=compareSession(state.activeSession);
    return baseFinishSession();
  };

  const baseRenderFinish=renderFinish;
  renderFinish=function(){baseRenderFinish();decorateFinish();};

  const baseRenderProgress=renderProgress;
  renderProgress=function(){baseRenderProgress();decorateProgress();};

  const baseRenderBody=renderBody;
  renderBody=function(){baseRenderBody();decorateBody();};

  window.TracoCoach={
    version:COACH_VERSION,
    suggestion:coachSuggestion,
    repeatLastSet:repeatLastSet,
    doLater:doLater,
    openSubstitute:openSubstitute
  };

  document.documentElement.dataset.tracoCoach=COACH_VERSION;
})();