/* Traço Inteligência 2.0 — motor de regras verificáveis; nunca muda dados ou ficha. */
(function(root){
  'use strict';
  const VERSION='2.0.0';
  const normalize=v=>String(v??'').trim().toLocaleLowerCase('pt-BR').replace(/\s+/g,' ');
  const escaped=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const canLoad=ex=>ex?.usesLoad!==false&&!(/solo|colchonete|peso corporal/i.test(ex?.equipment||'')||/prancha|reverse crunch|dead bug/i.test(ex?.name||''));
  function validSession(s){
    return Boolean(s&&s.finishedAt&&!s.excludeFromVolume&&!s.restored&&!s.manualConfirmed&&Array.isArray(s.exercises));
  }
  function validSet(s,weighted=true){
    return Boolean(s&&s.done===true&&!s.skipped&&!s.reported&&s.repsKnown!==false&&Number.isFinite(Number(s.reps))&&Number(s.reps)>0&&(!weighted||(Number.isFinite(Number(s.weight))&&Number(s.weight)>0)));
  }
  function matches(a,b){
    if(!a||!b||String(a.progressionKey||a.id)!==String(b.progressionKey||b.id))return false;
    // Smart Swap pode reter o ID mas trocar a variação/máquina.
    return (!a.name||!b.name||normalize(a.name)===normalize(b.name))&&
      (!a.equipment||!b.equipment||normalize(a.equipment)===normalize(b.equipment));
  }
  function recentComparable(ex,history,limit=4){
    return (Array.isArray(history)?history:[]).filter(validSession)
      .sort((a,b)=>Number(b.finishedAt||b.startedAt)-Number(a.finishedAt||a.startedAt))
      .map(s=>{
        const row=s.exercises.find(x=>matches(ex,x));
        if(!row||!Array.isArray(row.sets))return null;
        const weighted=canLoad(ex);
        const done=row.sets.filter(z=>validSet(z,weighted));
        if(!done.length)return null;
        const full=row.sets.length>0&&row.sets.every(z=>validSet(z,weighted));
        const load=weighted?done.map(z=>Number(z.weight)):null;
        return {time:Number(s.finishedAt||s.startedAt),full,sets:done.length,reps:done.map(z=>Number(z.reps)),load,raw:done};
      })
      .filter(Boolean).slice(0,limit);
  }
  function readinessLevel(checkin){
    if(!checkin||!['energy','sleep','soreness'].every(k=>Number.isFinite(Number(checkin[k]))))return null;
    const e=Number(checkin.energy),s=Number(checkin.sleep),pain=Number(checkin.soreness);
    if([e,s,pain].some(n=>n<1||n>5))return null;
    const score=Math.round((e+s+6-pain)/15*100);
    return {score,level:score<50?'baixa':score<70?'moderada':'boa'};
  }
  function exerciseAdvice(ex,history,checkin){
    const rec=recentComparable(ex,history,4),last=rec[0],ready=readinessLevel(checkin);
    const min=Math.max(1,Number(ex?.min)||8),max=Math.max(min,Number(ex?.max)||12);
    const missing={kind:'baseline',label:'Registre sua referência',detail:'Ainda não há série comparável completa para uma decisão confiável. Registre carga, repetições e execução.',reason:'Histórico insuficiente',confidence:'baixa',samples:rec.length};
    if(!last)return missing;
    const fullSets=Number(ex?.sets?.length||ex?.sets)||1;
    const heavy=last.raw.some(z=>z.rir==='heavy'||(z.rir!==''&&z.rir!=null&&Number(z.rir)===0));
    const below=last.reps.some(n=>n<min);
    const consistent=last.load===null||last.load.every(x=>x===last.load[0]);
    const atTop=last.full&&last.sets>=fullSets&&last.reps.every(n=>n>=max)&&consistent&&!heavy;
    const fullRecords=rec.filter(r=>r.full).length;
    const confidence=fullRecords>=3?'alta':fullRecords>=2?'moderada':'inicial';
    const withBase=(kind,label,detail,reason)=>({kind,label,detail,reason,confidence,samples:rec.length});
    if(ready&&ready.score<50)return withBase('recover','Priorize recuperação','Hoje, mantenha esforço controlado; não procure recorde nem aumente séries apenas por estar no plano.','Check-in subjetivo de energia, sono e dor muscular: '+ready.score+'%');
    if(!last.full)return withBase('baseline','Complete os registros','O último treino comparável ficou parcialmente registrado. Use a próxima sessão para estabelecer uma referência sólida.','Séries incompletas ou sem dados válidos');
    if(below||heavy)return withBase('hold','Consolide a carga','Algumas séries ficaram abaixo da faixa ou foram marcadas como muito pesadas. Ajuste a carga se necessário e priorize técnica.','Última sessão abaixo do alvo ou esforço alto');
    if(atTop)return withBase('increase','Pode considerar progredir','Todas as séries chegaram ao topo da faixa. Considere o menor incremento disponível, somente se tiver boa técnica e margem de esforço.','Todas as séries válidas atingiram '+max+' repetições');
    if(rec.length>=3&&rec.slice(0,3).every(r=>r.full)&&last.load&&rec.slice(0,3).every(r=>r.load?.every(n=>n===last.load[0]))){
      const current=last.reps.reduce((a,b)=>a+b,0);
      const oldest=rec[2].reps.reduce((a,b)=>a+b,0);
      if(current<=oldest&&last.time-rec[2].time>=7*86400000){
        return withBase('plateau','Revise antes de subir volume','Três registros comparáveis sem avanço de repetições. Revise descanso, técnica e recuperação antes de considerar mais séries.','Três sessões, mesma carga, sem aumento de repetições');
      }
    }
    return withBase('reps','Tente uma repetição a mais','Mantenha a carga e tente progredir em uma série dentro da faixa, sem sacrificar execução.','Séries registradas, sem atingir o topo da faixa');
  }
  function median(values){
    const a=values.filter(n=>Number.isFinite(n)&&n>0).sort((x,y)=>x-y);
    return a.length?a.length%2?a[(a.length-1)/2]:(a[a.length/2-1]+a[a.length/2])/2:null;
  }
  function evaluate({plan=[],history=[],readiness=null,nextWorkoutId=null,now=Date.now(),science=null}={}){
    const valid=(Array.isArray(history)?history:[]).filter(validSession);
    const since=Number(now)-28*86400000;
    const month=valid.filter(s=>Number(s.startedAt)>=since&&Number(s.startedAt)<=Number(now));
    const current=(Array.isArray(plan)?plan:[]).find(w=>w.id===nextWorkoutId)||plan[0]||null;
    const check=readinessLevel(readiness);
    const insights=[];
    if(check?.score<50){
      insights.push({kind:'recover',title:'Treine com margem hoje',detail:'Seu check-in sugere recuperação menor. Um treino mais leve ou adiar cargas maiores pode ser mais útil do que buscar recordes.',reason:'Energia, sono e dor muscular declarados hoje'});
    }else if(check?.score>=70){
      insights.push({kind:'ready',title:'Boa disposição registrada',detail:'Você relatou boa recuperação. Progrida apenas se as séries anteriores, técnica e esforço também sustentarem.',reason:'Check-in de hoje, não avaliação clínica'});
    }else if(check){
      insights.push({kind:'hold',title:'Dia de progressão cuidadosa',detail:'Mantenha técnica e acompanhe como o esforço evolui, sem necessidade de recorde.',reason:'Check-in de hoje'});
    }else{
      insights.push({kind:'baseline',title:'Como está sua recuperação?',detail:'Faça o check-in antes de treinar. Sem ele, o app não deve supor que você está recuperado.',reason:'Ainda sem check-in válido hoje'});
    }
    if(!month.length){
      insights.push({kind:'baseline',title:'Vamos formar suas referências',detail:'Registre séries, carga e repetições reais. O motor começa conservador, sem fabricar tendências.',reason:'Nenhuma sessão válida nos últimos 28 dias'});
    }else{
      const selected=(current?.exercises||[]).map(ex=>({ex,advice:exerciseAdvice(ex,valid,readiness)}));
      const actionable=selected.find(r=>r.advice.kind==='increase')||selected.find(r=>r.advice.kind==='plateau')||selected.find(r=>r.advice.kind==='hold');
      if(actionable){
        insights.push({kind:actionable.advice.kind,title:actionable.ex.name+': '+actionable.advice.label,detail:actionable.advice.detail,reason:actionable.advice.reason});
      }else{
        insights.push({kind:'reps',title:'Sua próxima sessão',detail:'Priorize registros completos e progressão gradual nos exercícios do treino '+(current?.short||'selecionado')+'.',reason:month.length+' sessões confiáveis nos últimos 28 dias'});
      }
    }
    const planned=science?.plannedVolumes?science.plannedVolumes(plan):null;
    if(planned&&science?.groups){
      const deficit=science.groups.filter(g=>g.priority)
        .map(g=>({name:g.name,missing:g.min-(planned[g.id]?.direct||0),direct:planned[g.id]?.direct||0,min:g.min}))
        .filter(g=>g.missing>0).sort((a,b)=>b.missing-a.missing)[0];
      if(deficit)insights.push({kind:'review',title:'Confira o volume de '+deficit.name.toLowerCase(),detail:'A ficha A–E prevê '+deficit.direct+' séries diretas por ciclo; a faixa inicial de referência começa em '+deficit.min+'. Revise após observar recuperação e consistência. Não adicione séries automaticamente.',reason:'Comparação da ficha prescrita; não é diagnóstico de volume insuficiente'});
    }
    const same=valid.filter(s=>s.workoutId===current?.id&&s.trainingMode!=='quick30')
      .map(s=>Number(s.duration)||Math.max(0,(Number(s.finishedAt)-Number(s.startedAt))/1000))
      .filter(n=>n>=10*60&&n<=3*3600).slice(-6);
    const typical=same.length>=3?Math.round(median(same)/60):null;
    if(typical&&typical>55){
      insights.push({kind:'time',title:'Seu treino costuma levar '+typical+' min',detail:'Se tiver apenas 30 minutos hoje, prefira o modo rápido já disponível; não corte séries concluídas no meio do treino.',reason:'Mediana de '+same.length+' sessões completas do mesmo treino'});
    }
    return {confidence:month.length>=6?'moderada':month.length>=2?'inicial':'baixa',sampleCount:month.length,readiness:check,nextWorkout:current?.id||null,insights:insights.slice(0,4)};
  }
  const api={version:VERSION,validSession,validSet,matches,recentComparable,readinessLevel,exerciseAdvice,evaluate};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  if(!root?.document)return;
  root.TracoIntelligence=api;
  const doc=root.document;
  const currentPlan=()=>typeof workoutPlan!=='undefined'?workoutPlan:[];
  const currentHistory=()=>typeof sessions==='function'?sessions():[];
  const ready=()=>typeof tracoTodayReadiness==='function'?tracoTodayReadiness():null;
  const nextId=()=>typeof v60RecommendedWorkout==='function'?v60RecommendedWorkout()?.id:currentPlan()[0]?.id;
  const report=()=>evaluate({plan:currentPlan(),history:currentHistory(),readiness:ready(),nextWorkoutId:nextId(),science:root.TracoScience});
  function insightMarkup(ins){
    return '<article class="intelligence-insight intelligence-'+escaped(ins.kind)+'"><strong>'+escaped(ins.title)+'</strong><p>'+escaped(ins.detail)+'</p><small>Por quê: '+escaped(ins.reason)+'</small></article>';
  }
  function mountCard(){
    const card=doc.querySelector('.science-entry');
    if(!card)return;
    const heading=card.querySelector('h3'),copy=card.querySelector('p');
    if(heading)heading.textContent='Seu treino, mais inteligente.';
    if(copy)copy.textContent=report().insights[0].title+'. '+report().insights[0].detail;
  }
  function mountPanel(){
    const panel=doc.querySelector('#scienceSheet .science-panel');
    if(!panel||panel.querySelector('.intelligence-panel'))return;
    const res=report(),sec=doc.createElement('section');
    sec.className='intelligence-panel';
    sec.innerHTML='<div class="science-section-label">O QUE SEUS REGISTROS INDICAM</div>'+
      '<p class="intelligence-confidence">'+res.sampleCount+' sessões completas confiáveis nos últimos 28 dias · confiança '+escaped(res.confidence)+'</p>'+
      res.insights.map(insightMarkup).join('')+
      '<p class="intelligence-footnote">São regras de apoio baseadas nos seus registros, não IA clínica nem previsão de crescimento. Nenhum ajuste é aplicado automaticamente.</p>';
    const anchor=panel.querySelector('.science-volume-list')||panel.querySelector('.science-section-label');
    if(anchor)anchor.insertAdjacentElement('beforebegin',sec);else panel.appendChild(sec);
  }
  function mountSession(){
    const hero=doc.querySelector('.session-page .exercise-hero');
    if(!hero||doc.querySelector('.session-page .intelligence-tip'))return;
    const active=typeof state!=='undefined'?state.activeSession:null;
    const ex=active?.exercises?.[state.currentExercise];
    if(!ex)return;
    const info=exerciseAdvice(ex,currentHistory(),ready());
    const detail=doc.createElement('details');
    detail.className='intelligence-tip';
    detail.innerHTML='<summary><span>Coach · '+escaped(info.label)+'</span><span aria-hidden="true">+</span></summary>'+
      '<p>'+escaped(info.detail)+'</p><small>'+escaped(info.reason)+' · confiança '+escaped(info.confidence)+'</small>';
    hero.insertAdjacentElement('afterend',detail);
  }
  let queued=false;
  function mount(){
    queued=false;mountCard();mountPanel();mountSession();
  }
  function schedule(){
    if(queued)return;queued=true;
    root.requestAnimationFrame(()=>root.requestAnimationFrame(mount));
  }
  if(doc.querySelector('#app'))new MutationObserver(schedule).observe(doc.querySelector('#app'),{subtree:true,childList:true});
  new MutationObserver(schedule).observe(doc.body,{childList:true,subtree:false});
  root.addEventListener('pageshow',schedule);
  if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',schedule,{once:true});else schedule();
})(typeof window!=='undefined'?window:(typeof globalThis!=='undefined'?globalThis:null));
