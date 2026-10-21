/* Traço Ciência 1.0 — orientação explicável, sem modificar prescrições ou registros. */
(function(root){
  'use strict';
  const VERSION='1.0.0';
  const GROUPS=[
    {id:'costas',name:'Costas / grande dorsal',min:10,max:16,priority:true},
    {id:'ombro-lateral',name:'Deltoide lateral',min:8,max:14,priority:true},
    {id:'peito',name:'Peitoral',min:8,max:14,priority:true},
    {id:'quadriceps',name:'Quadríceps',min:6,max:12},
    {id:'posterior-coxa',name:'Posterior de coxa',min:6,max:12},
    {id:'ombro-posterior',name:'Deltoide posterior',min:4,max:10},
    {id:'biceps',name:'Bíceps',min:4,max:10},
    {id:'triceps',name:'Tríceps',min:4,max:10},
    {id:'core',name:'Abdômen',min:4,max:10},
    {id:'panturrilha',name:'Panturrilha',min:4,max:10}
  ];
  /* 1 = série direta; 0.5 = estímulo secundário, exibido separadamente. */
  const MUSCLES={
    'puxada-aberta':{costas:1,biceps:0.5},'puxada-neutra':{costas:1,biceps:0.5},
    'remada-baixa':{costas:1,biceps:0.5,'ombro-posterior':0.5},
    'remada-unilateral':{costas:1,biceps:0.5,'ombro-posterior':0.5},
    'pullover':{costas:1},
    'crucifixo-inverso':{'ombro-posterior':1},
    'face-pull':{'ombro-posterior':1},
    'elevacao-lateral':{'ombro-lateral':1},
    'elevacao-lateral-2':{'ombro-lateral':1},
    'elevacao-lateral-3':{'ombro-lateral':1},
    'desenvolvimento':{'ombro-lateral':0.5,triceps:0.5},
    'supino-inclinado':{peito:1,triceps:0.5},
    'supino-reto':{peito:1,triceps:0.5},
    'crucifixo-baixo-alto':{peito:1},
    'crucifixo-reto':{peito:1},
    'triceps-pushdown':{triceps:1},
    'triceps-overhead':{triceps:1},
    'triceps-overhead-2':{triceps:1},
    'rosca-martelo':{biceps:1},
    'rosca-unilateral':{biceps:1},
    'rosca-polia':{biceps:1},
    'agachamento-smith':{quadriceps:1},
    'leg-press':{quadriceps:1},
    'extensora':{quadriceps:1},
    'flexora':{'posterior-coxa':1},
    'flexora-2':{'posterior-coxa':1},
    'rdl':{'posterior-coxa':1},
    'panturrilha':{panturrilha:1},
    'crunch':{core:1},'crunch-2':{core:1},
    'core-crunch-seg':{core:1},'core-woodchop-qui':{core:1},
    'core-dead-bug-qui':{core:1}
  };
  const CUES={
    'puxada-aberta':'Cotovelos descem em direção ao tronco; mantenha amplitude confortável e evite impulso.',
    'puxada-neutra':'Puxe com os cotovelos, sem jogar o tronco para trás.',
    'remada-baixa':'Controle a volta; evite acelerar com a lombar.',
    'remada-unilateral':'Mantenha o tronco estável e conduza o cotovelo para trás.',
    'pullover':'Mantenha os braços semi-estendidos e controle a volta.',
    'elevacao-lateral':'Eleve sem balanço, dentro da amplitude confortável para os ombros.',
    'elevacao-lateral-2':'Mantenha a tensão e evite compensar com o tronco.',
    'elevacao-lateral-3':'Priorize controle, sem elevar os ombros.',
    'supino-inclinado':'Banco levemente inclinado, escápulas apoiadas e descida controlada.',
    'desenvolvimento':'Punhos alinhados e amplitude sem dor.',
    'crucifixo-baixo-alto':'Movimento em arco com cotovelos suavemente flexionados.',
    'agachamento-smith':'Amplitude confortável e controle do tronco.',
    'rdl':'Quadril vai para trás; mantenha a coluna estável.',
    'flexora':'Controle a fase de retorno, sem usar impulso.',
    'crunch':'Flexione o tronco sem tracionar o pescoço.'
  };
  const SOURCES=[
    {label:'ACSM · revisão de 137 revisões (2026)',url:'https://pubmed.ncbi.nlm.nih.gov/41843416/'},
    {label:'Volume e frequência · meta-regressão (2025/2026)',url:'https://pubmed.ncbi.nlm.nih.gov/41343037/'},
    {label:'Repetições em reserva · meta-regressão (2024)',url:'https://pubmed.ncbi.nlm.nih.gov/38970765/'},
    {label:'Elevação lateral: halteres × cabos (2025)',url:'https://pubmed.ncbi.nlm.nih.gov/40692697/'}
  ];
  const esc=(v)=>String(v==null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function startOfWeek(now=new Date()){
    const d=new Date(now);d.setHours(0,0,0,0);d.setDate(d.getDate()-((d.getDay()+6)%7));
    return d.getTime();
  }
  function add(counts,id,n){
    const map=MUSCLES[id]||{};
    Object.keys(map).forEach(key=>{
      if(!counts[key])counts[key]={direct:0,indirect:0};
      const contribution=map[key]===1?'direct':'indirect';
      counts[key][contribution]+=n*(map[key]===1?1:map[key]);
    });
  }
  function plannedVolumes(plan){
    const result={};
    (Array.isArray(plan)?plan:[]).forEach(w=>(w.exercises||[]).forEach(ex=>{
      const n=Number(ex.sets);
      if(Number.isFinite(n)&&n>0)add(result,ex.id,n);
    }));
    return result;
  }
  function completedVolumes(history,since){
    const result={};
    (Array.isArray(history)?history:[]).filter(s=>s&&s.finishedAt&&!s.excludeFromVolume&&Number(s.startedAt)>=since).forEach(s=>{
      (s.exercises||[]).forEach(ex=>{
        const done=(ex.sets||[]).filter(set=>set.done===true&&!set.skipped&&(!set.reported||set.repsKnown||Number(set.reps)>0)).length;
        if(done)add(result,ex.id,done);
      });
    });
    return result;
  }
  function progression(ex,history){
    if(!ex)return 'Sem exercício selecionado.';
    const key=ex.progressionKey||ex.id;
    const finished=(Array.isArray(history)?history:[]).filter(s=>s.finishedAt&&!s.excludeFromVolume)
      .sort((a,b)=>Number(b.startedAt)-Number(a.startedAt));
    for(const s of finished){
      const found=(s.exercises||[]).find(e=>(e.progressionKey||e.id)===key);
      if(!found)continue;
      const done=(found.sets||[]).filter(z=>z.done&&!z.skipped&&Number(z.reps)>0);
      if(!done.length)continue;
      const min=Math.max(1,Number(ex.min)||8),max=Math.max(min,Number(ex.max)||12);
      if(done.some(z=>Number(z.reps)<min))return 'Mantenha ou ajuste a carga até realizar todas as séries na faixa com boa técnica.';
      if(done.length >= Number(ex.sets||1) && done.every(z=>Number(z.reps)>=max)){
        return 'Todas as séries chegaram ao topo da faixa. Considere um aumento pequeno de carga na próxima sessão, somente se a técnica e o esforço permitirem.';
      }
      return 'Mantenha a referência e tente somar 1 repetição com boa execução, sem ultrapassar a faixa prevista.';
    }
    return 'Ainda falta histórico confiável desse movimento. Comece com carga confortável, técnica e registros completos.';
  }
  const api={version:VERSION,groups:GROUPS,mapping:MUSCLES,plannedVolumes,completedVolumes,startOfWeek,progression};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  if(!root||!root.document)return;
  root.TracoScience=api;
  const doc=root.document;
  let scheduled=false,selectedWorkout=null;
  const plan=()=>typeof workoutPlan!=='undefined'&&Array.isArray(workoutPlan)?workoutPlan:[];
  const history=()=>typeof sessions==='function'?sessions():[];
  const groupName=id=>(GROUPS.find(g=>g.id===id)||{}).name||id;
  const num=n=>Number.isInteger(n)?String(n):n.toFixed(1).replace('.',',');
  function summaryRows(counts){
    return GROUPS.map(g=>({...g,direct:counts[g.id]?.direct||0,indirect:counts[g.id]?.indirect||0}));
  }
  function renderCard(){
    const host=doc.querySelector('.perf-home .simple-home')||doc.querySelector('.perf-home');
    if(!host||host.querySelector('.science-entry'))return;
    const card=doc.createElement('section');
    card.className='science-entry';
    card.innerHTML='<div><span>TREINO COM CIÊNCIA</span><h3>Seu V-shape, com critério.</h3><p>Veja quanto cada músculo recebe de treino, o motivo dos exercícios e quando progredir. Sem trocar sua ficha sozinho.</p></div><button type="button" data-science-open>Ver análise <span aria-hidden="true">→</span></button>';
    host.appendChild(card);
    card.querySelector('[data-science-open]').addEventListener('click',()=>open());
  }
  function totalsMarkup(){
    const planned=plannedVolumes(plan()),done=completedVolumes(history(),startOfWeek());
    return '<div class="science-volume-list">'+summaryRows(planned).map(g=>{
      const actual=done[g.id]?.direct||0;
      const pct=Math.min(100,Math.round(actual/Math.max(g.min,1)*100));
      return '<div class="science-volume-row"><div><strong>'+esc(g.name)+'</strong><small>'+num(actual)+' realizadas na semana · '+num(g.direct)+' previstas no ciclo A–E</small></div>'+
        '<div class="science-meter"><i style="width:'+pct+'%"></i></div>'+
        '<small>Referência inicial: '+g.min+'–'+g.max+' séries diretas/semana'+(g.priority?' · foco estético':'')+'</small></div>';
    }).join('')+'</div>';
  }
  function exerciseMarkup(w){
    if(!w)return '';
    return '<div class="science-exercises">'+(w.exercises||[]).map(ex=>{
      const map=MUSCLES[ex.id]||{};
      const names=Object.keys(map).filter(k=>map[k]===1).map(groupName);
      return '<details><summary><span><b>'+esc(ex.name)+'</b><small>'+Number(ex.sets)+' × '+Number(ex.min)+'–'+Number(ex.max)+' · '+esc(names.join(' / ')||'complementar')+'</small></span><span aria-hidden="true">+</span></summary>'+
        '<p>'+esc(CUES[ex.id]||'Controle as repetições e priorize amplitude confortável, sem dor.')+'</p>'+
        '<p><strong>Próximo passo:</strong> '+esc(progression(ex,history()))+'</p></details>';
    }).join('')+'</div>';
  }
  function workoutMarkup(){
    const plans=plan();
    const w=plans.find(x=>x.id===selectedWorkout)||plans[0];
    return '<div class="science-tabs" role="group" aria-label="Escolher treino">'+plans.map((x,i)=>
      '<button type="button" data-science-workout="'+esc(x.id)+'" class="'+(w?.id===x.id?'active':'')+'" aria-pressed="'+(w?.id===x.id?'true':'false')+'">'+String.fromCharCode(65+i)+'</button>').join('')+'</div>'+
      '<h3 class="science-workout-name">'+esc(w?.name||'')+'</h3>'+exerciseMarkup(w);
  }
  function content(){
    return '<div class="science-sheet-header"><div><span>TRAÇO · EVIDÊNCIAS</span><h2>Treinar melhor.</h2><p>Hipertrofia baseada em princípios testados, não em promessa de resultado rápido.</p></div><button type="button" data-science-close aria-label="Fechar">×</button></div>'+
      '<p class="science-disclaimer">Os intervalos são pontos de partida práticos, não metas científicas obrigatórias. Séries secundárias não são contadas como diretas. O modo rápido pode resultar em menor volume.</p>'+
      '<div class="science-section-label">SEU VOLUME · SEMANA ATUAL</div>'+totalsMarkup()+
      '<div class="science-section-label">POR QUE CADA EXERCÍCIO?</div>'+workoutMarkup()+
      '<div class="science-section-label">REGRAS QUE O TRAÇO SEGUE</div>'+
      '<ul class="science-principles"><li>Priorize consistência e progresso gradual; não aumente séries automaticamente.</li><li>Trabalhe em geral com 1–3 repetições em reserva, ajustando à técnica e à recuperação.</li><li>Treine o corpo todo. Para o efeito visual em V, dê atenção especial a dorsais e deltoides.</li><li>Treinar abdômen não reduz gordura localizada nos flancos.</li></ul>'+
      '<div class="science-section-label">FONTES CIENTÍFICAS</div><div class="science-sources">'+SOURCES.map(s=>'<a href="'+esc(s.url)+'" target="_blank" rel="noopener noreferrer">'+esc(s.label)+' ↗</a>').join('')+'</div>'+
      '<p class="science-disclaimer">Seu histórico, suas cargas e sua ficha permanecem intactos. Ajustes por dor, lesões ou limitações precisam de avaliação individual.</p>';
  }
  function open(workoutId){
    selectedWorkout=workoutId||selectedWorkout||plan()[0]?.id;
    doc.querySelector('#scienceSheet')?.remove();
    const sheet=doc.createElement('div');sheet.className='science-overlay';sheet.id='scienceSheet';
    sheet.setAttribute('role','dialog');sheet.setAttribute('aria-modal','true');sheet.setAttribute('aria-label','Análise científica do treino');
    sheet.innerHTML='<div class="science-panel">'+content()+'</div>';
    const close=()=>{sheet.remove();doc.removeEventListener('keydown',key);};
    const key=e=>{if(e.key==='Escape')close();};
    sheet.addEventListener('click',e=>{if(e.target===sheet||e.target.closest('[data-science-close]'))close();});
    sheet.addEventListener('click',e=>{
      const button=e.target.closest('[data-science-workout]');
      if(!button)return;
      selectedWorkout=button.dataset.scienceWorkout;
      const panel=sheet.querySelector('.science-panel');
      if(panel){panel.innerHTML=content();panel.querySelector('[data-science-workout].active')?.focus();}
    });
    doc.body.appendChild(sheet);
    doc.addEventListener('keydown',key);
    sheet.querySelector('[data-science-close]')?.focus();
  }
  function mount(){
    scheduled=false;
    if(!doc.querySelector('.perf-home'))return;
    renderCard();
  }
  function schedule(){if(scheduled)return;scheduled=true;root.requestAnimationFrame(()=>root.requestAnimationFrame(mount));}
  const app=doc.querySelector('#app');
  if(app)new MutationObserver(schedule).observe(app,{childList:true,subtree:false});
  root.addEventListener('pageshow',schedule);
  if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',schedule,{once:true});else schedule();
  root.TracoScience.open=open;
})(typeof window!=='undefined'?window:(typeof globalThis!=='undefined'?globalThis:null));
