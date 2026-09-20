/*
 * Traço Corpo 1.0
 * Alimentação, recuperação, hábitos e evolução estética sem contagem obrigatória de calorias.
 */
(function(){
  'use strict';

  const VERSION='1.0.0';
  const LOG_KEY='traco_body_daily_v1';
  const SETTINGS_KEY='traco_body_coach_settings_v1';
  const PHOTO_DB='traco_photo_checkins_v1';
  const PHOTO_STORE='checkins';
  const PHOTO_NOTIFY_KEY='traco_photo_checkin_notify_v1';
  const PHOTO_NOTIFY_SENT_KEY='traco_photo_checkin_last_notified_v1';

  function qs(s){return document.querySelector(s);}
  function qsa(s){return Array.from(document.querySelectorAll(s));}
  function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(ch){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[ch];});}
  function dateKey(d=new Date()){const x=new Date(d);return x.getFullYear()+'-'+String(x.getMonth()+1).padStart(2,'0')+'-'+String(x.getDate()).padStart(2,'0');}
  function read(key,def){try{return JSON.parse(localStorage.getItem(key))||def;}catch(e){return def;}}
  function write(key,value){localStorage.setItem(key,JSON.stringify(value));}
  function logs(){return read(LOG_KEY,{});}
  function todayLog(){const all=logs();return Object.assign({date:dateKey(),proteinMeals:0,fruitVeg:false,water:false,planned:false,alcohol:false,treats:false,overeating:false,sleepHours:'',energy:'',hunger:'',offPlan:false,restaurant:false},all[dateKey()]||{});}
  function saveToday(patch){
    const all=logs(),key=dateKey();
    all[key]=Object.assign({},todayLog(),patch,{date:key,updatedAt:Date.now()});
    write(LOG_KEY,all);
    if(typeof haptic==='function')haptic();
  }
  function dayHasWorkout(){
    const day=new Date().getDay();
    return workoutPlan.some(function(w){return w.day===day;});
  }
  function completedWorkoutToday(){
    const key=dateKey();
    return sessions().some(function(s){return s.finishedAt&&dateKey(new Date(s.startedAt))===key;});
  }
  function latestBody(){
    return body().slice().sort(function(a,b){return b.date.localeCompare(a.date);})[0]||null;
  }
  function proteinGuide(){
    const latest=latestBody(),kg=Number(latest&&latest.weight||0);
    if(!kg)return {title:'3–4 refeições com proteína',detail:'use uma fonte de proteína em cada refeição principal; registre o peso quando quiser uma faixa em gramas.'};
    const lo=Math.round(kg*1.6),hi=Math.round(kg*2.0);
    return {title:'~'+lo+'–'+hi+' g/dia como referência',detail:'não precisa pesar tudo: 3–4 refeições bem proteicas já deixam o acompanhamento prático.'};
  }
  function guidance(){
    const training=dayHasWorkout();
    const log=todayLog();
    if(log.restaurant){
      return {
        prioritize:['proteína como base','legume/salada ou fruta','água antes e durante'],
        limit:['calorias líquidas','entrada + prato + sobremesa grande juntos','molhos muito cremosos em excesso'],
        note:'restaurante: escolha uma indulgência que realmente vale a pena e segue o dia normalmente.'
      };
    }
    if(training){
      return {
        prioritize:['proteína nas refeições','carboidrato perto do treino','água + frutas/vegetais'],
        limit:['álcool','fritura/fast-food muito pesado antes do treino','beliscar sem fome'],
        note:'dia de treino: carboidrato não é inimigo; ele ajuda você a treinar bem.'
      };
    }
    return {
      prioritize:['proteína + vegetais/frutas','água','refeições planejadas e saciantes'],
      limit:['bebidas açucaradas','beliscos sem fome','porções muito densas em calorias sem perceber'],
      note:'dia sem musculação: mantenha proteína e rotina; não precisa “compensar” nada.'
    };
  }
  function sevenDays(){
    const out=[];for(let i=6;i>=0;i--){const d=new Date();d.setDate(d.getDate()-i);out.push(dateKey(d));}return out;
  }
  function dailyScore(log){
    if(!log)return 0;
    let good=0,total=5;
    if(Number(log.proteinMeals)>=3)good++;
    if(log.fruitVeg)good++;
    if(log.water)good++;
    if(log.planned)good++;
    if(!log.overeating)good++;
    return Math.round(good/total*100);
  }
  function weeklyStats(){
    const keys=sevenDays(),all=logs();
    const rows=keys.map(function(k){return all[k];}).filter(Boolean);
    const protein=rows.filter(function(x){return Number(x.proteinMeals)>=3;}).length;
    const water=rows.filter(function(x){return x.water;}).length;
    const veg=rows.filter(function(x){return x.fruitVeg;}).length;
    const sleepRows=rows.map(function(x){return Number(x.sleepHours||0);}).filter(Boolean);
    const avgSleep=sleepRows.length?sleepRows.reduce(function(a,b){return a+b;},0)/sleepRows.length:0;
    const scores=rows.map(dailyScore);
    const adherence=scores.length?Math.round(scores.reduce(function(a,b){return a+b;},0)/scores.length):0;
    const start=new Date();start.setDate(start.getDate()-6);start.setHours(0,0,0,0);
    const ss=sessions().filter(function(s){return s.finishedAt&&s.startedAt>=start.getTime();});
    const cardio=ss.reduce(function(sum,s){return sum+(s.extras||[]).filter(function(x){return x.type==='cardio';}).reduce(function(a,x){return a+Number(x.minutes||0);},0);},0);
    return {days:rows.length,protein:protein,water:water,veg:veg,avgSleep:avgSleep,adherence:adherence,workouts:ss.length,cardio:cardio};
  }
  function avgMeasure(key,days){
    const since=new Date();since.setDate(since.getDate()-days+1);since.setHours(0,0,0,0);
    const values=body().filter(function(x){return new Date(x.date+'T12:00:00')>=since&&Number(x[key])>0;}).map(function(x){return Number(x[key]);});
    if(!values.length)return null;
    return values.reduce(function(a,b){return a+b;},0)/values.length;
  }
  function bodyTrend(key,days){
    const rows=body().filter(function(x){return Number(x[key])>0;}).slice().sort(function(a,b){return a.date.localeCompare(b.date);});
    if(rows.length<2)return null;
    const latest=rows[rows.length-1],cut=new Date();cut.setDate(cut.getDate()-days);
    let base=rows.find(function(x){return new Date(x.date+'T12:00:00')>=cut;})||rows[0];
    if(base===latest&&rows.length>1)base=rows[rows.length-2];
    return Number(latest[key])-Number(base[key]);
  }
  function fmtDelta(v,unit){
    if(v==null||!Number.isFinite(v))return '—';
    if(Math.abs(v)<0.05)return 'estável';
    return (v>0?'+':'')+v.toFixed(1).replace('.',',')+unit;
  }

  function dailyCardMarkup(compact){
    const log=todayLog(),g=guidance(),p=proteinGuide();
    return '<section class="traco-daily-card '+(compact?'is-compact':'')+'" id="tracoDailyCard">'+
      '<header><div><span>TRAÇO CORPO · HOJE</span><h3>'+esc(dayHasWorkout()?'dia de treino':'dia de recuperação')+'</h3><small>'+esc(p.title)+'</small></div><b>'+dailyScore(log)+'%</b></header>'+
      '<div class="traco-priority-limit"><article><span>priorize</span>'+g.prioritize.map(function(x){return '<i>✓ '+esc(x)+'</i>';}).join('')+'</article><article><span>evite / limite hoje</span>'+g.limit.map(function(x){return '<i>· '+esc(x)+'</i>';}).join('')+'</article></div>'+
      (compact?'<div class="traco-home-limit"><span>EVITE / LIMITE HOJE</span><b>'+g.limit.map(esc).join(' · ')+'</b></div>':'')+
      '<p>'+esc(g.note)+'</p>'+
      (compact?'<button id="tracoOpenBodyLog">ver alimentação + registrar meu dia</button>':'')+
      '</section>';
  }
  function foodLimitsMarkup(){
    const items=[
      ['bebidas açucaradas / calorias líquidas','saciam pouco e podem aumentar calorias sem você perceber'],
      ['álcool frequente','piora a recuperação e facilita exagerar nas calorias'],
      ['frituras e fast-food muito frequentes','deixe como exceção, não base da rotina'],
      ['sobremesas grandes todos os dias','prefira porção menor ou menos frequência'],
      ['molhos e cremes muito calóricos','use como detalhe, não como base da refeição'],
      ['beliscar sem fome','é fácil somar calorias sem perceber']
    ];
    return '<section class="traco-food-limits"><span>EVITE / LIMITE MAIS FREQUENTEMENTE</span><h3>não precisa proibir — só não transformar em rotina</h3><div>'+items.map(function(item){return '<article><b>'+esc(item[0])+'</b><small>'+esc(item[1])+'</small></article>';}).join('')+'</div><p><b>não são vilões:</b> arroz, pão, massa, batata, feijão e outros carboidratos podem entrar normalmente, principalmente perto do treino.</p></section>';
  }
  function quickLogMarkup(){
    const log=todayLog();
    const chip=function(id,label,on){return '<button data-body-toggle="'+id+'" class="'+(on?'is-on':'')+'">'+label+'</button>';};
    return '<section class="traco-habit-card" id="tracoHabitCard">'+
      '<header><span>CHECK-IN · 10 SEGUNDOS</span><h3>como foi seu dia?</h3><small>sem pesar comida e sem punição.</small></header>'+
      '<div class="traco-protein-step"><div><span>refeições com boa proteína</span><b id="tracoProteinCount">'+Number(log.proteinMeals||0)+'</b></div><div><button data-protein="-1">−</button><button data-protein="1">+</button></div></div>'+
      '<div class="traco-habit-grid">'+
      chip('fruitVeg','fruta/vegetais',log.fruitVeg)+chip('water','água',log.water)+chip('planned','refeições planejadas',log.planned)+
      chip('alcohol','álcool',log.alcohol)+chip('treats','doce/ultraprocessado',log.treats)+chip('overeating','comi além da fome',log.overeating)+
      '</div>'+
      '<div class="traco-recovery-grid"><label>sono<input id="tracoSleep" type="number" step=".5" min="0" max="14" inputmode="decimal" value="'+esc(log.sleepHours)+'" placeholder="h"><span>horas</span></label>'+
      '<label>energia<select id="tracoEnergy"><option value="">—</option><option value="low" '+(log.energy==='low'?'selected':'')+'>ruim</option><option value="ok" '+(log.energy==='ok'?'selected':'')+'>ok</option><option value="great" '+(log.energy==='great'?'selected':'')+'>ótima</option></select></label>'+
      '<label>fome<select id="tracoHunger"><option value="">—</option><option value="low" '+(log.hunger==='low'?'selected':'')+'>pouca</option><option value="normal" '+(log.hunger==='normal'?'selected':'')+'>normal</option><option value="high" '+(log.hunger==='high'?'selected':'')+'>muita</option></select></label></div>'+
      '<div class="traco-life-actions">'+
      '<button id="tracoRestaurant" class="'+(log.restaurant?'is-on':'')+'">🍽 restaurante / fim de semana</button>'+
      '<button id="tracoOffPlan" class="'+(log.offPlan?'is-on':'')+'">↺ comi fora do plano</button>'+
      '</div>'+
      '<p class="traco-no-punishment">'+(log.offPlan?'feito. nada de jejum ou cardio-punição — volta ao normal na próxima refeição.':'um dia imperfeito não precisa virar uma semana imperfeita.')+'</p>'+
      '</section>';
  }
  function bindQuickLog(){
    qsa('[data-protein]').forEach(function(btn){btn.onclick=function(){
      const log=todayLog(),next=Math.max(0,Math.min(6,Number(log.proteinMeals||0)+Number(btn.dataset.protein)));
      saveToday({proteinMeals:next});decorateCurrentBody();
    };});
    qsa('[data-body-toggle]').forEach(function(btn){btn.onclick=function(){
      const key=btn.dataset.bodyToggle,log=todayLog();const patch={};patch[key]=!log[key];saveToday(patch);decorateCurrentBody();
    };});
    const sleep=qs('#tracoSleep');if(sleep)sleep.onchange=function(){saveToday({sleepHours:sleep.value});};
    const energy=qs('#tracoEnergy');if(energy)energy.onchange=function(){saveToday({energy:energy.value});};
    const hunger=qs('#tracoHunger');if(hunger)hunger.onchange=function(){saveToday({hunger:hunger.value});};
    const restaurant=qs('#tracoRestaurant');if(restaurant)restaurant.onclick=function(){saveToday({restaurant:!todayLog().restaurant});decorateCurrentBody();};
    const off=qs('#tracoOffPlan');if(off)off.onclick=function(){saveToday({offPlan:!todayLog().offPlan});decorateCurrentBody();};
  }

  function weeklyDashboardMarkup(){
    const s=weeklyStats();
    return '<section class="traco-week-shape"><header><span>PAINEL SEMANAL DO SHAPE</span><h3>'+s.adherence+'% de base</h3><small>'+s.days+'/7 dias registrados</small></header>'+
      '<div class="traco-week-grid"><article><b>'+s.workouts+'</b><span>treinos</span></article><article><b>'+s.cardio+'</b><span>min cardio</span></article><article><b>'+s.protein+'/7</b><span>proteína</span></article><article><b>'+s.water+'/7</b><span>água</span></article><article><b>'+(s.avgSleep?s.avgSleep.toFixed(1).replace('.',','):'—')+'</b><span>h sono</span></article><article><b>'+s.veg+'/7</b><span>fruta/veg</span></article></div></section>';
  }
  function flankCardMarkup(){
    const waist=bodyTrend('waist',28),hip=bodyTrend('hip',28),weight=bodyTrend('weight',28),s=weeklyStats();
    return '<section class="traco-flank-card"><header><span>FOCO FLANCOS</span><h3>olha a tendência, não um dia</h3></header>'+
      '<div><article><b>'+fmtDelta(waist,' cm')+'</b><span>cintura · ~4 sem</span></article><article><b>'+fmtDelta(hip,' cm')+'</b><span>quadril/lombar</span></article><article><b>'+fmtDelta(weight,' kg')+'</b><span>peso</span></article><article><b>'+s.cardio+' min</b><span>cardio · 7 dias</span></article></div>'+
      '<p>não existe redução localizada. aqui o Traço junta cintura, região lombar, cardio e hábitos para você enxergar a mudança real.</p></section>';
  }
  function movingAveragesMarkup(){
    const w7=avgMeasure('weight',7),w14=avgMeasure('weight',14),wa7=avgMeasure('waist',7),wa14=avgMeasure('waist',14);
    return '<section class="traco-moving-card"><header><span>TENDÊNCIA</span><h3>médias móveis</h3></header><div>'+
      '<article><span>peso 7d</span><b>'+(w7?w7.toFixed(1).replace('.',',')+' kg':'—')+'</b><small>14d '+(w14?w14.toFixed(1).replace('.',',')+' kg':'—')+'</small></article>'+
      '<article><span>cintura 7d</span><b>'+(wa7?wa7.toFixed(1).replace('.',',')+' cm':'—')+'</b><small>14d '+(wa14?wa14.toFixed(1).replace('.',',')+' cm':'—')+'</small></article>'+
      '</div><p>se você mede poucas vezes por semana, a média usa somente os registros disponíveis naquele período.</p></section>';
  }
  function weeklyBuckets(count){
    const allLogs=logs(),now=new Date();now.setHours(12,0,0,0),out=[];
    for(let i=count-1;i>=0;i--){
      const end=new Date(now);end.setDate(end.getDate()-i*7);
      const start=new Date(end);start.setDate(start.getDate()-6);start.setHours(0,0,0,0);end.setHours(23,59,59,999);
      const keys=[];for(let d=new Date(start);d<=end;d.setDate(d.getDate()+1))keys.push(dateKey(d));
      const rows=keys.map(function(k){return allLogs[k];}).filter(Boolean);
      const score=rows.length?rows.map(dailyScore).reduce(function(a,b){return a+b;},0)/rows.length:null;
      const measurements=body().filter(function(x){const t=new Date(x.date+'T12:00:00');return t>=start&&t<=end&&Number(x.waist)>0;}).sort(function(a,b){return a.date.localeCompare(b.date);});
      const delta=measurements.length>=2?Number(measurements[measurements.length-1].waist)-Number(measurements[0].waist):null;
      out.push({score:score,delta:delta});
    }
    return out;
  }
  function correlationMarkup(){
    const usable=weeklyBuckets(8).filter(function(x){return x.score!=null&&x.delta!=null;});
    if(usable.length<4)return '<section class="traco-pattern-card"><span>HÁBITOS × RESULTADO</span><h3>ainda aprendendo</h3><p>registre hábitos e cintura por pelo menos 4 semanas comparáveis. depois o Traço procura padrões — sem tratar correlação como causa.</p></section>';
    const meanX=usable.reduce(function(a,x){return a+x.score;},0)/usable.length,meanY=usable.reduce(function(a,x){return a+x.delta;},0)/usable.length;
    let num=0,dx=0,dy=0;usable.forEach(function(x){num+=(x.score-meanX)*(x.delta-meanY);dx+=(x.score-meanX)**2;dy+=(x.delta-meanY)**2;});
    const r=dx&&dy?num/Math.sqrt(dx*dy):0;
    let msg='nenhum padrão claro ainda.';
    if(r<-0.35)msg='semanas com hábitos mais consistentes coincidiram com melhor tendência de cintura.';
    else if(r>0.35)msg='a cintura não acompanhou a consistência ainda; vale olhar sono, porções, cardio e tempo.';
    return '<section class="traco-pattern-card"><span>HÁBITOS × RESULTADO</span><h3>padrões das últimas semanas</h3><p>'+esc(msg)+' Correlação não prova causa.</p></section>';
  }
  function plateauMarkup(){
    const rows=body().filter(function(x){return Number(x.waist)>0||Number(x.weight)>0;}).slice().sort(function(a,b){return a.date.localeCompare(b.date);});
    const s=weeklyStats();let title='coletando referência',text='continue registrando cintura/peso e hábitos; o Traço só chama de platô quando houver dados suficientes.';
    if(rows.length>=3){
      const latest=rows[rows.length-1],cut=new Date();cut.setDate(cut.getDate()-21);
      const base=rows.find(function(x){return new Date(x.date+'T12:00:00')>=cut;})||rows[0];
      const wd=latest.waist&&base.waist?Math.abs(Number(latest.waist)-Number(base.waist)):null;
      const pd=latest.weight&&base.weight?Math.abs(Number(latest.weight)-Number(base.weight)):null;
      const days=(new Date(latest.date)-new Date(base.date))/86400000;
      if(days>=18&&wd!=null&&wd<0.5&&(pd==null||pd<0.7)){
        if(s.adherence>=70){title='possível platô';text='consistência parece boa. antes de cortar comida forte, teste uma mudança pequena: +10–15 min de cardio em 2–3 sessões ou revise porções por 2 semanas.';}
        else{title='mais consistência antes de mexer';text='as medidas parecem estáveis, mas a base semanal ainda oscila. primeiro tente fechar hábitos/treinos com regularidade.';}
      }else if(days>=18){title='não parece platô';text='as medidas ainda estão se movimentando. não há motivo para apertar a estratégia agora.';}
    }
    return '<section class="traco-plateau-card"><span>ALERTA DE PLATÔ</span><h3>'+esc(title)+'</h3><p>'+esc(text)+'</p></section>';
  }
  function choicesMarkup(){
    const groups=[
      ['café/lanche',['iogurte + fruta','ovos + pão/tapioca','sanduíche com proteína','leite/iogurte + aveia']],
      ['almoço/jantar',['proteína grelhada + arroz + feijão + salada','prato feito com proteína como base','massa + proteína + legumes','sushi: priorize peças com proteína e evite excesso de fritos/molhos']],
      ['trocas fáceis',['refrigerante comum → zero/água','frito → grelhado quando der','molho cremoso → simples','sobremesa grande diária → porção menor/menos frequência']]
    ];
    return '<details class="traco-choice-card"><summary><span>MELHORES ESCOLHAS</span><b>biblioteca rápida</b><i>+</i></summary><div>'+groups.map(function(g){return '<article><h4>'+g[0]+'</h4>'+g[1].map(function(x){return '<p>'+esc(x)+'</p>';}).join('')+'</article>';}).join('')+
      '<small>não é lista de alimentos “permitidos”. são atalhos para proteína, saciedade e consistência.</small></div></details>';
  }
  function goalMarkup(){
    return '<section class="traco-goal-card"><span>OBJETIVO VISUAL</span><h3>mais V, cintura preservada</h3><div><b>dorsal ↑</b><b>ombro ↑</b><b>peito ↑</b><b>braços ↑</b><b>cintura ↓ / manter</b></div><p>o Traço cruza força, medidas, fotos e hábitos. peso sozinho não decide se o ciclo está funcionando.</p></section>';
  }

  function photoDb(){
    return new Promise(function(resolve,reject){
      const req=indexedDB.open(PHOTO_DB,1);
      req.onupgradeneeded=function(){const db=req.result;if(!db.objectStoreNames.contains(PHOTO_STORE))db.createObjectStore(PHOTO_STORE,{keyPath:'id'});};
      req.onsuccess=function(){resolve(req.result);};req.onerror=function(){reject(req.error);};
    });
  }
  async function allPhotos(){
    const db=await photoDb();
    return new Promise(function(resolve,reject){const tx=db.transaction(PHOTO_STORE,'readonly'),req=tx.objectStore(PHOTO_STORE).getAll();req.onsuccess=function(){resolve(req.result||[]);};req.onerror=function(){reject(req.error);};});
  }
  async function renderPhotoCompare(){
    const target=qs('#tracoPhotoCompare');if(!target)return;
    try{
      const rows=(await allPhotos()).sort(function(a,b){
        const da=String(a.date||''),db=String(b.date||'');
        if(da!==db)return da.localeCompare(db);
        return Number(a.id||0)-Number(b.id||0);
      });
      if(rows.length<2){target.innerHTML='<p>salve pelo menos 2 check-ins fotográficos para liberar a comparação.</p>';return;}
      const baseline=rows.find(function(row){return row.baselineOfficial;})||rows[0];
      const candidates=rows.filter(function(row){return row.id!==baseline.id;});
      const now=candidates[candidates.length-1]||rows[rows.length-1];
      target.innerHTML='<div class="traco-photo-compare-head"><div><span>'+(baseline.baselineOfficial?'baseline oficial':'primeiro')+'</span><b>'+esc(baseline.date)+'</b></div><div><span>atual</span><b>'+esc(now.date)+'</b></div></div>'+
        '<div class="traco-photo-compare-grid"><article><img src="'+baseline.front+'" alt="frente antiga"><img src="'+now.front+'" alt="frente atual"></article><article><img src="'+baseline.side+'" alt="perfil antigo"><img src="'+now.side+'" alt="perfil atual"></article><article><img src="'+baseline.back+'" alt="costas antiga"><img src="'+now.back+'" alt="costas atual"></article></div>'+
        '<div class="traco-overlay-box"><span>sobreposição das costas</span><div><img src="'+baseline.back+'" alt=""><img id="tracoOverlayNow" src="'+now.back+'" alt=""></div><label>foto atual <input id="tracoOverlayRange" type="range" min="0" max="100" value="50"></label></div>';
      const range=qs('#tracoOverlayRange'),top=qs('#tracoOverlayNow');if(range&&top)range.oninput=function(){top.style.opacity=Number(range.value)/100;};
    }catch(e){target.innerHTML='<p>comparação de fotos indisponível neste navegador.</p>';}
  }
  function photoCompareMarkup(){
    return '<section class="traco-photo-compare-card"><span>ANTES × AGORA</span><h3>comparação padronizada</h3><div id="tracoPhotoCompare"><p>carregando fotos…</p></div></section>';
  }
  const PHOTO_INTERVAL_DAYS=14;
  function photoDateValue(row){return new Date(String(row&&row.date||'')+'T12:00:00').getTime();}
  function nextPhotoDueFrom(row){
    if(!row||!row.date)return null;
    const d=new Date(String(row.date)+'T12:00:00');d.setDate(d.getDate()+PHOTO_INTERVAL_DAYS);return d;
  }
  function photoCadenceMarkup(){
    const notifyOn=localStorage.getItem(PHOTO_NOTIFY_KEY)==='1';
    const perm=('Notification' in window)?Notification.permission:'unsupported';
    const notifyLabel=perm==='granted'&&notifyOn?'🔔 aviso quinzenal ativado':perm==='denied'?'🔕 aviso bloqueado no iPhone':'🔔 ativar aviso quinzenal';
    return '<section class="traco-photo-cadence" id="tracoPhotoCadence"><span>CHECK-IN QUINZENAL</span><h3 id="tracoPhotoCadenceTitle">calculando próxima atualização…</h3><p id="tracoPhotoCadenceText">frente + perfil + costas, sempre nas mesmas condições.</p><div class="traco-photo-standard"><b>padrão recomendado</b><small>mesma luz · mesma distância · corpo relaxado · de preferência antes do treino e sem pump</small></div><div class="traco-photo-cadence-actions"><button id="tracoGoPhotos">atualizar fotos</button><button id="tracoShareFeedback">compartilhar para feedback</button></div><button class="traco-photo-notify-btn" id="tracoPhotoNotify">'+notifyLabel+'</button></section>';
  }
  async function requestPhotoReminderPermission(){
    if(!('Notification' in window)||!('serviceWorker' in navigator)){toast('avisos do PWA não estão disponíveis aqui');return false;}
    if(Notification.permission==='denied'){localStorage.setItem(PHOTO_NOTIFY_KEY,'0');toast('notificações estão bloqueadas no iPhone');return false;}
    try{
      const result=Notification.permission==='granted'?'granted':await Notification.requestPermission();
      const ok=result==='granted';localStorage.setItem(PHOTO_NOTIFY_KEY,ok?'1':'0');
      toast(ok?'aviso quinzenal ativado':'notificação não autorizada');
      if(state.page==='body')renderBody();
      return ok;
    }catch(e){toast('não consegui ativar o aviso');return false;}
  }
  async function latestStandardPhoto(){
    const rows=(await allPhotos()).filter(function(row){return row.front&&row.side&&row.back;}).sort(function(a,b){return photoDateValue(a)-photoDateValue(b);});
    return rows.length?rows[rows.length-1]:null;
  }
  async function showPhotoReminderNotification(latest,due){
    if(localStorage.getItem(PHOTO_NOTIFY_KEY)!=='1')return false;
    if(!('Notification' in window)||Notification.permission!=='granted'||!('serviceWorker' in navigator))return false;
    const dueKey=due.toISOString().slice(0,10);
    if(localStorage.getItem(PHOTO_NOTIFY_SENT_KEY)===dueKey)return false;
    try{
      const reg=await navigator.serviceWorker.ready;
      await reg.showNotification('📸 Dia de atualizar suas fotos', {
        body:'Frente, perfil e costas · mantenha o mesmo padrão para comparar sua evolução.',
        icon:'./assets/traco-icon-192.png',
        badge:'./assets/traco-icon-192.png',
        tag:'traco-photo-checkin',
        renotify:true,
        data:{url:'./?photo_due=1',kind:'photo-checkin'}
      });
      localStorage.setItem(PHOTO_NOTIFY_SENT_KEY,dueKey);
      return true;
    }catch(e){return false;}
  }
  async function checkPhotoReminder(){
    try{
      const latest=await latestStandardPhoto();if(!latest)return;
      const due=nextPhotoDueFrom(latest);if(!due)return;
      const now=new Date();now.setHours(12,0,0,0);
      if(now>=due)await showPhotoReminderNotification(latest,due);
    }catch(e){}
  }
  function openPhotosFromReminder(){
    state.page='body';renderBody();
    setTimeout(function(){
      const card=qs('#tracoPhotoCheckin')||qs('#tracoPhotoCadence');
      if(card)card.scrollIntoView({behavior:'smooth',block:'start'});
    },80);
  }
  async function renderPhotoCadence(){
    const title=qs('#tracoPhotoCadenceTitle'),text=qs('#tracoPhotoCadenceText');if(!title||!text)return;
    try{
      const rows=(await allPhotos()).filter(function(row){return row.front&&row.side&&row.back;}).sort(function(a,b){return photoDateValue(a)-photoDateValue(b);});
      if(!rows.length){title.textContent='faça seu primeiro check-in';text.textContent='depois o Traço passa a contar 14 dias automaticamente.';return;}
      const latest=rows[rows.length-1],due=nextPhotoDueFrom(latest),now=new Date();now.setHours(12,0,0,0);
      const days=Math.ceil((due-now)/86400000);
      if(days<=0){title.textContent='hoje é dia de atualizar as fotos';text.textContent='último check-in: '+latest.date+' · já passaram 14 dias ou mais.';}
      else if(days===1){title.textContent='próxima atualização amanhã';text.textContent='último check-in: '+latest.date+' · mantenha o mesmo padrão de foto.';}
      else{title.textContent='próxima atualização em '+days+' dias';text.textContent='último check-in: '+latest.date+' · próxima referência: '+due.toLocaleDateString('pt-BR');}
    }catch(e){title.textContent='check-in quinzenal';text.textContent='não consegui ler as fotos salvas neste navegador.';}
  }
  function dataUrlToFile(dataUrl,name){
    const parts=String(dataUrl||'').split(','),meta=parts[0]||'',b64=parts[1]||'',mime=(meta.match(/data:([^;]+)/)||[])[1]||'image/jpeg';
    const bytes=atob(b64),arr=new Uint8Array(bytes.length);for(let i=0;i<bytes.length;i++)arr[i]=bytes.charCodeAt(i);
    return new File([arr],name,{type:mime});
  }
  async function sharePhotoFeedback(){
    try{
      const rows=(await allPhotos()).filter(function(row){return row.front&&row.side&&row.back;}).sort(function(a,b){return photoDateValue(a)-photoDateValue(b);});
      if(!rows.length)return toast('ainda não tem fotos padronizadas');
      const latest=rows[rows.length-1],baseline=rows.find(function(row){return row.baselineOfficial;})||rows[0];
      const selected=baseline.id===latest.id?[latest]:[baseline,latest];
      const files=[];
      selected.forEach(function(row,index){
        const tag=row.id===baseline.id?'baseline':'atual';
        files.push(dataUrlToFile(row.front,tag+'-frente.jpg'));
        files.push(dataUrlToFile(row.side,tag+'-perfil.jpg'));
        files.push(dataUrlToFile(row.back,tag+'-costas.jpg'));
      });
      const prompt='Analise meu check-in quinzenal do Traço comparando com o baseline/anterior. Quero feedback sobre cintura e flancos, costas/V-taper, peito, ombros, braços e evolução visual geral. Considere diferenças de iluminação/pose e não estime percentual de gordura exato.';
      if(navigator.share&&navigator.canShare&&navigator.canShare({files:files})){
        await navigator.share({title:'Check-in quinzenal · Traço',text:prompt,files:files});return;
      }
      await navigator.clipboard?.writeText(prompt);
      toast('prompt copiado · compartilhe as fotos com o ChatGPT');
    }catch(e){toast('não consegui preparar o compartilhamento');}
  }

  function decorateHome(){
    const main=qs('.home-card');if(!main||qs('#tracoDailyHome'))return;
    const today=main.querySelector('.perf-workout-hero, .today-card');
    if(!today)return;
    today.insertAdjacentHTML('afterend','<div id="tracoDailyHome">'+dailyCardMarkup(true)+'</div>');
    const open=qs('#tracoOpenBodyLog');if(open)open.onclick=function(){
      if(window.TracoUXPolish?.openBodyTab){window.TracoUXPolish.openBodyTab('food');return;}
      state.page='body';localStorage.setItem('traco_ux_body_tab_v1','food');renderBody();
    };
  }
  function bodySectionsMarkup(){
    return '<div id="tracoBodyCoach">'+dailyCardMarkup(false)+foodLimitsMarkup()+photoCadenceMarkup()+quickLogMarkup()+weeklyDashboardMarkup()+flankCardMarkup()+movingAveragesMarkup()+correlationMarkup()+plateauMarkup()+goalMarkup()+choicesMarkup()+photoCompareMarkup()+'</div>';
  }
  function decorateCurrentBody(){
    if(state.page!=='body')return;
    renderBody();
  }
  function decorateBody(){
    const main=qs('.body-page');if(!main||qs('#tracoBodyCoach'))return;
    const blue=main.querySelector('.body-blue');
    if(blue)blue.insertAdjacentHTML('afterend',bodySectionsMarkup());else main.insertAdjacentHTML('afterbegin',bodySectionsMarkup());
    bindQuickLog();renderPhotoCompare();renderPhotoCadence();
    const go=qs('#tracoGoPhotos');if(go)go.onclick=function(){const card=qs('#tracoPhotoCheckin');if(card)card.scrollIntoView({behavior:'smooth',block:'start'});else toast('abra a área de fotos padronizadas');};
    const share=qs('#tracoShareFeedback');if(share)share.onclick=sharePhotoFeedback;
    const notify=qs('#tracoPhotoNotify');if(notify)notify.onclick=requestPhotoReminderPermission;
  }

  const baseHome=renderHome;
  renderHome=function(){baseHome();decorateHome();};

  const baseBody=renderBody;
  renderBody=function(){baseBody();decorateBody();};

  document.addEventListener('visibilitychange',function(){if(document.visibilityState==='visible')checkPhotoReminder();});
  window.addEventListener('pageshow',function(){setTimeout(checkPhotoReminder,50);});
  navigator.serviceWorker?.addEventListener?.('message',function(event){
    if(event.data?.type==='TRACO_PHOTO_FOCUS')openPhotosFromReminder();
  });
  if(new URLSearchParams(location.search).get('photo_due')==='1')setTimeout(openPhotosFromReminder,120);
  setTimeout(checkPhotoReminder,500);
  setInterval(checkPhotoReminder,60*60*1000);

  window.TracoBodyCoach={version:VERSION,todayLog:todayLog,weeklyStats:weeklyStats,guidance:guidance,checkPhotoReminder:checkPhotoReminder};
  document.documentElement.dataset.tracoBodyCoach=VERSION;
})();