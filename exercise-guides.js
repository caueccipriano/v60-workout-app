const V60_GUIDES = {
  'supino-inclinado': {motion:'press',accent:'blue',focus:'peito superior · tríceps',cue:'banco ~30° · desce controlando',tips:['ajuste o banco em cerca de 30°','mantenha as escápulas firmes no banco','desça controlando e suba sem perder o peito aberto'],error:'abrir demais os cotovelos e perder estabilidade'},
  'desenvolvimento': {motion:'press-up',accent:'lime',focus:'ombros · tríceps',cue:'cotovelos abaixo das mãos · sobe reto',tips:['sente firme com o abdômen ativo','comece com os cotovelos levemente abaixo das mãos','suba em linha estável sem arquear demais a lombar'],error:'compensar jogando o tronco para trás'},
  'elevacao-lateral': {motion:'lateral',accent:'orange',focus:'deltoide lateral',cue:'braços sobem até a linha do ombro',tips:['suba até a linha dos ombros','mantenha os cotovelos levemente flexionados','controle a descida sem deixar a carga despencar'],error:'balançar o corpo para roubar o movimento'},
  'crucifixo-baixo-alto': {motion:'fly',accent:'blue',focus:'peito inferior',cue:'fecha em arco de cima para baixo',tips:['posicione as polias altas','mantenha os cotovelos levemente flexionados','leve as mãos para baixo e para dentro sem encolher os ombros'],error:'transformar o movimento em empurrão de tríceps'},
  'triceps-pushdown': {motion:'pushdown',accent:'lime',focus:'tríceps',cue:'cotovelos fixos · estende até embaixo',tips:['prenda os cotovelos ao lado do corpo','estenda totalmente sem mover os ombros','volte devagar sentindo o tríceps alongar'],error:'deixar os cotovelos abrirem ou subirem'},
  'triceps-overhead': {motion:'overhead',accent:'orange',focus:'tríceps porção longa',cue:'cotovelos apontando para cima',tips:['comece com os braços acima da cabeça','mantenha os cotovelos apontando para frente','estenda sem abrir demais os braços'],error:'abrir os cotovelos e perder a linha do movimento'},
  'leg-press': {motion:'legpress',accent:'blue',focus:'quadríceps · glúteos',cue:'joelhos acompanham os pés',tips:['apoie bem a lombar no encosto','desça até onde mantém quadril e lombar estáveis','empurre distribuindo força pelo meio do pé'],error:'tirar o quadril do banco na descida'},
  'leg-press-alto': {motion:'legpress',accent:'blue',focus:'posterior · glúteos',cue:'pés mais altos · joelhos estáveis',tips:['posicione os pés um pouco mais altos na plataforma','mantenha a lombar totalmente apoiada','empurre sem deixar os joelhos fecharem para dentro'],error:'descer além da amplitude em que o quadril fica estável'},
  'agachamento-smith': {motion:'squat',accent:'lime',focus:'quadríceps · glúteos',cue:'desce com controle e peito aberto',tips:['posicione os pés numa base confortável','mantenha peito aberto e abdômen ativo','desça controlando e suba empurrando o chão'],error:'joelhos caindo para dentro'},
  'extensora': {motion:'extension',accent:'orange',focus:'quadríceps',cue:'sobe sem chutar · desce devagar',tips:['alinhe o joelho com o eixo da máquina','suba até quase estender totalmente','segure um instante no topo e desça controlando'],error:'usar embalo para levantar a carga'},
  'flexora': {motion:'legcurl',accent:'blue',focus:'posterior de coxa',cue:'flexiona sem tirar o quadril do assento',tips:['ajuste o rolo acima do tornozelo','mantenha o quadril colado no assento','puxe controlando e volte devagar'],error:'levantar o quadril para ajudar o movimento'},
  'abdutora': {motion:'abductor',accent:'lime',focus:'glúteo médio',cue:'abre e volta com controle',tips:['sente com postura neutra','empurre para fora sem jogar o tronco','volte devagar mantendo tensão'],error:'bater as pernas na volta'},
  'panturrilha': {motion:'calf',accent:'orange',focus:'panturrilhas',cue:'sobe na ponta do pé · alonga embaixo',tips:['empurre pela ponta dos pés','segure um instante no topo','desça até alongar bem a panturrilha'],error:'fazer repetições curtas demais'},
  'puxada-aberta': {motion:'pulldown',accent:'blue',focus:'dorsal · parte superior das costas',cue:'cotovelos descem em direção às costelas',tips:['mantenha o peito levemente alto','puxe pensando nos cotovelos e não nas mãos','controle a subida sem perder a posição das escápulas'],error:'jogar o corpo demais para trás'},
  'puxada-neutra': {motion:'pulldown',accent:'lime',focus:'dorsal',cue:'cotovelos descem perto do tronco',tips:['segure firme a pegada neutra','traga os cotovelos para baixo perto do tronco','suba devagar sem relaxar tudo no topo'],error:'encolher os ombros e perder o dorsal'},
  'remada-baixa': {motion:'row',accent:'lime',focus:'costas médias · dorsal',cue:'puxa o cabo para o abdômen',tips:['inicie com peito aberto e ombros baixos','puxe o cabo em direção ao abdômen','retorne com controle alongando as costas'],error:'arredondar demais a lombar'},
  'pullover': {motion:'pullover',accent:'orange',focus:'dorsal',cue:'braços quase estendidos em arco',tips:['mantenha os braços quase estendidos','leve o cabo para baixo em arco até a coxa','segure o tronco estável sem roubar'],error:'transformar o movimento em tríceps'},
  'crucifixo-inverso': {motion:'reverse-fly',accent:'blue',focus:'posterior de ombro',cue:'abre para trás com peito estável',tips:['mantenha peito aberto e cotovelos suaves','abra as mãos para trás alinhando com os ombros','retorne sem perder tensão'],error:'subir demais os ombros'},
  'rosca-polia': {motion:'curl',accent:'lime',focus:'bíceps',cue:'cotovelos presos ao lado do corpo',tips:['mantenha os cotovelos fixos perto do tronco','flexione levando as mãos na direção do peito','desça controlando até quase estender'],error:'balançar o corpo para subir a carga'},
  'rosca-martelo': {motion:'curl',accent:'orange',focus:'bíceps · braquial',cue:'pegada neutra o tempo todo',tips:['segure os halteres em pegada neutra','suba sem mexer o ombro','desça controlando sem soltar o cotovelo'],error:'rodar a mão e perder a pegada martelo'},
  'rosca-unilateral': {motion:'curl',accent:'lime',focus:'bíceps',cue:'um braço por vez · sem balançar',tips:['estabilize o tronco','suba controlando o cabo até contrair o bíceps','desça devagar antes de trocar o braço'],error:'girar o tronco para ajudar'},
  'crunch': {motion:'crunch',accent:'blue',focus:'abdômen',cue:'fecha as costelas em direção ao quadril',tips:['mantenha o quadril estável','pense em enrolar o tronco para baixo','suba de volta sem perder totalmente a tensão'],error:'puxar demais com os braços e pouco com o abdômen'},
  'supino-reto': {motion:'press',accent:'blue',focus:'peito · tríceps',cue:'desce na linha do peito · sobe estável',tips:['mantenha escápulas firmes e pés estáveis','desça na linha do peito médio','suba empurrando com controle'],error:'deixar os ombros saírem do banco'},
  'crucifixo-reto': {motion:'fly',accent:'lime',focus:'peito inferior',cue:'fecha em arco de cima para baixo',tips:['posicione as polias altas','incline levemente o tronco','leve as mãos para baixo e para dentro mantendo tensão no peito'],error:'usar balanço ou estender demais os cotovelos'},
  'face-pull': {motion:'facepull',accent:'orange',focus:'posterior de ombro · escápulas',cue:'puxa a corda em direção ao rosto',tips:['puxe a corda para a altura do rosto','abra as mãos ao final do movimento','mantenha os ombros baixos e o peito aberto'],error:'puxar para baixo e usar pouco a parte alta das costas'},
  'rdl': {motion:'rdl',accent:'blue',focus:'posterior de coxa · glúteos',cue:'quadril vai para trás · coluna neutra',tips:['destrave levemente os joelhos','empurre o quadril para trás mantendo as costas neutras','suba trazendo o quadril para frente'],error:'arredondar a lombar na descida'},
  'core-crunch-seg': {motion:'crunch',accent:'blue',focus:'reto abdominal',cue:'fecha as costelas em direção ao quadril',tips:['ajoelhe estável e segure a corda ao lado da cabeça','flexione a coluna pensando em aproximar costelas e pelve','volte controlando sem transformar em puxada de braço'],error:'sentar o quadril nos calcanhares em vez de flexionar o tronco'},
  'core-pallof-ter': {motion:'press',accent:'lime',focus:'core · anti-rotação',cue:'empurra à frente sem deixar o tronco girar',tips:['fique de lado para a polia com pés firmes','leve as mãos do peito para frente mantendo quadril e costelas alinhados','segure a tensão sem deixar a carga te rodar'],error:'girar ombros ou quadril na direção da polia'},
  'core-leg-raise-ter': {motion:'crunch',accent:'orange',focus:'abdômen inferior · controle pélvico',cue:'enrola o quadril para cima',tips:['deite no chão com braços ao lado do corpo','traga os joelhos em direção ao peito e tire levemente o quadril do chão','desça devagar sem usar balanço'],error:'só mexer as pernas sem enrolar a pelve'},
  'core-woodchop-qui': {motion:'press',accent:'orange',focus:'core · anti-rotação',cue:'empurra à frente sem deixar o tronco girar',tips:['fique de lado para a polia com pés firmes','estenda os braços à frente mantendo costelas e quadril alinhados','controle a volta sem deixar a carga te rodar'],error:'girar ombros ou quadril em direção à polia'},
  'core-dead-bug-qui': {motion:'crunch',accent:'lime',focus:'abdômen inferior · controle pélvico',cue:'enrola o quadril para cima',tips:['deite no chão com joelhos flexionados','traga os joelhos em direção ao peito e eleve levemente o quadril','desça controlando sem embalar as pernas'],error:'ganhar impulso balançando as pernas'}
};

function v60GuideBaseId(id){return id.replace(/-\d+$/,'')}
function v60GuideFor(ex){
  const id=v60GuideBaseId(ex.id);
  return V60_GUIDES[ex.id]||V60_GUIDES[id]||{motion:'press',accent:'blue',focus:'execução guiada',cue:'controle, amplitude e técnica',tips:['ajuste o aparelho ao seu corpo','mantenha o movimento controlado','pare se sentir dor aguda'],error:'deixar a técnica piorar só para aumentar a carga'};
}

function v60Pose(motion,end,x,y,scale,opacity){
  const c='#FAFAFA', limb=`stroke="${c}" stroke-width="5" stroke-linecap="round" opacity="${opacity}"`, joint=`fill="${c}" opacity="${opacity}"`;
  const P=(px,py)=>[x+px*scale,y+py*scale];
  const line=(a,b)=>`<line x1="${P(...a)[0]}" y1="${P(...a)[1]}" x2="${P(...b)[0]}" y2="${P(...b)[1]}" ${limb}/>`;
  const circle=(p,r)=>`<circle cx="${P(...p)[0]}" cy="${P(...p)[1]}" r="${r*scale}" ${joint}/>`;
  let hip=[0,22], shoulder=[0,-10], head=[0,-29], lh=[-18,8], rh=[18,8], lk=[-9,42], rk=[9,42], lf=[-12,63], rf=[12,63];
  if(motion==='lateral'){lh=end?[-32,-8]:[-14,12];rh=end?[32,-8]:[14,12]}
  if(motion==='press-up'){lh=end?[-12,-42]:[-22,-2];rh=end?[12,-42]:[22,-2]}
  if(motion==='press'){shoulder=[0,0];hip=[-5,18];head=[-14,-8];lh=end?[-10,-32]:[-24,-7];rh=end?[20,-32]:[24,-7];lk=[10,35];rk=[22,32];lf=[15,58];rf=[30,54]}
  if(motion==='fly'||motion==='fly-up'){lh=end?[-8,-26]:[-34,-8];rh=end?[8,-26]:[34,-8]}
  if(motion==='pushdown'){lh=end?[-12,24]:[-16,0];rh=end?[12,24]:[16,0]}
  if(motion==='overhead'){lh=end?[-10,-42]:[-18,-12];rh=end?[10,-42]:[18,-12]}
  if(motion==='pulldown'){lh=end?[-20,-4]:[-26,-42];rh=end?[20,-4]:[26,-42]}
  if(motion==='row'){lh=end?[-12,4]:[-36,5];rh=end?[12,4]:[36,5]}
  if(motion==='pullover'){lh=end?[-14,18]:[-18,-40];rh=end?[14,18]:[18,-40]}
  if(motion==='reverse-fly'){lh=end?[-34,-8]:[-10,2];rh=end?[34,-8]:[10,2]}
  if(motion==='curl'){lh=end?[-14,-7]:[-14,22];rh=end?[14,-7]:[14,22]}
  if(motion==='facepull'){lh=end?[-20,-18]:[-35,0];rh=end?[20,-18]:[35,0]}
  if(motion==='squat'){hip=end?[0,22]:[0,38];shoulder=end?[0,-10]:[0,5];lk=end?[-9,42]:[-18,43];rk=end?[9,42]:[18,43];lf=end?[-12,63]:[-28,63];rf=end?[12,63]:[28,63]}
  if(motion==='legpress'){shoulder=[-18,-8];hip=[-8,18];head=[-30,-24];lk=end?[18,23]:[2,40];rk=end?[22,18]:[8,36];lf=end?[42,8]:[30,50];rf=end?[45,18]:[35,56]}
  if(motion==='extension'){hip=[-10,15];shoulder=[-16,-12];head=[-22,-30];lk=[8,28];rk=[10,31];lf=end?[40,26]:[12,58];rf=end?[42,34]:[16,61]}
  if(motion==='legcurl'){hip=[-10,15];shoulder=[-16,-12];head=[-22,-30];lk=[10,34];rk=[14,36];lf=end?[5,18]:[14,62];rf=end?[12,20]:[20,63]}
  if(motion==='abductor'){lk=end?[-25,42]:[-10,42];rk=end?[25,42]:[10,42];lf=end?[-33,62]:[-12,63];rf=end?[33,62]:[12,63]}
  if(motion==='calf'){lf=end?[-12,58]:[-12,64];rf=end?[12,58]:[12,64];hip=end?[0,17]:[0,22];shoulder=end?[0,-15]:[0,-10];head=end?[0,-34]:[0,-29]}
  if(motion==='crunch'){shoulder=end?[8,3]:[0,-10];head=end?[15,-10]:[0,-29];hip=[0,22];lh=end?[5,-2]:[-12,-20];rh=end?[18,2]:[12,-20]}
  if(motion==='rdl'){hip=end?[0,22]:[0,28];shoulder=end?[0,-10]:[24,15];head=end?[0,-29]:[38,3];lh=end?[-12,18]:[20,26];rh=end?[12,18]:[32,27]}
  return `${circle(head,7)}${line(shoulder,hip)}${line(shoulder,lh)}${line(shoulder,rh)}${line(hip,lk)}${line(hip,rk)}${line(lk,lf)}${line(rk,rf)}${circle(shoulder,2.3)}${circle(hip,2.3)}`;
}

function v60GuideSvg(ex,large=false){
  const g=v60GuideFor(ex), width=large?1100:720, height=large?620:360;
  const palette={blue:['#2138B0','#0F183F'],lime:['#C4D82E','#7D8D18'],orange:['#E8492A','#7D2413']}[g.accent]||['#2138B0','#0F183F'];
  const startX=width*.30, endX=width*.70, baseY=height*.48, scale=large?2.15:1.35;
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="${palette[0]}"/><stop offset="100%" stop-color="${palette[1]}"/></linearGradient></defs>
    <rect width="${width}" height="${height}" rx="42" fill="url(#bg)"/>
    <circle cx="${width*.86}" cy="${height*.18}" r="${height*.20}" fill="#fff" opacity=".06"/>
    <circle cx="${width*.16}" cy="${height*.88}" r="${height*.24}" fill="#fff" opacity=".04"/>
    <text x="${width*.06}" y="${height*.12}" fill="#FAFAFA" font-family="Arial,Helvetica,sans-serif" font-size="${large?34:20}" font-weight="700">${ex.name}</text>
    <text x="${width*.06}" y="${height*.20}" fill="#FAFAFA" opacity=".74" font-family="Arial,Helvetica,sans-serif" font-size="${large?20:13}">${g.focus}</text>
    ${v60Pose(g.motion,false,startX,baseY,scale,.45)}
    ${v60Pose(g.motion,true,endX,baseY,scale,1)}
    <path d="M ${width*.43} ${height*.55} H ${width*.56}" stroke="#C4D82E" stroke-width="${large?10:7}" stroke-linecap="round"/>
    <path d="M ${width*.54} ${height*.50} L ${width*.59} ${height*.55} L ${width*.54} ${height*.60}" fill="none" stroke="#C4D82E" stroke-width="${large?10:7}" stroke-linecap="round" stroke-linejoin="round"/>
    <rect x="${width*.055}" y="${height*.80}" width="${width*.89}" height="${height*.13}" rx="${height*.065}" fill="#FAFAFA" opacity=".94"/>
    <text x="${width*.085}" y="${height*.885}" fill="#111111" font-family="Arial,Helvetica,sans-serif" font-size="${large?22:14}" font-weight="700">${g.cue}</text>
  </svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function v60GuidePreview(ex){
  const g=v60GuideFor(ex);
  return `<button class="exercise-guide-preview" id="openExerciseGuide" type="button" aria-label="ver execução de ${ex.name}">
    <img src="${v60GuideSvg(ex,false)}" alt="Guia visual de ${ex.name}">
    <span class="exercise-guide-caption"><span><b>ver execução</b><small>${g.cue}</small></span><i>↗</i></span>
  </button>`;
}

function v60ShowGuide(ex){
  v60CloseGuide();
  const g=v60GuideFor(ex);
  document.body.classList.add('v60-guide-open');
  document.body.insertAdjacentHTML('beforeend',`<div class="v60-guide-backdrop" id="v60GuideBackdrop"></div>
    <aside class="v60-guide-sheet" id="v60GuideSheet" role="dialog" aria-modal="true" aria-label="execução de ${ex.name}">
      <div class="v60-guide-handle"></div>
      <button class="v60-guide-close" id="v60GuideClose" aria-label="fechar">×</button>
      <div class="v60-guide-content">
        <span class="v60-guide-kicker">guia rápido</span>
        <h2>${ex.name}</h2>
        <p class="v60-guide-equipment">${ex.equipment}</p>
        <img class="v60-guide-image" src="${v60GuideSvg(ex,true)}" alt="Movimento de ${ex.name}">
        <div class="v60-guide-tags"><span>${g.focus}</span><span>${ex.sets} × ${ex.min}-${ex.max}</span><span>${ex.rest}s descanso</span></div>
        <section class="v60-guide-tips"><h3>dicas rápidas</h3><ol>${g.tips.map(t=>`<li>${t}</li>`).join('')}</ol></section>
        <section class="v60-guide-error"><span>erro comum</span><p>${g.error}</p></section>
        <button class="cta-lime" id="v60GuideDone">voltar pro treino</button>
      </div>
    </aside>`);
  $('#v60GuideBackdrop').onclick=v60CloseGuide;
  $('#v60GuideClose').onclick=v60CloseGuide;
  $('#v60GuideDone').onclick=v60CloseGuide;
}

function v60CloseGuide(){
  document.body.classList.remove('v60-guide-open');
  $('#v60GuideBackdrop')?.remove();
  $('#v60GuideSheet')?.remove();
}

renderSession = function(){
  const s=state.activeSession;
  if(!s){state.page='home';render();return}
  const ex=s.exercises[state.currentExercise],si=currentSetIndex(ex),set=ex.sets[si];
  shell(`<div class="session-topbar"><button class="plain-icon" id="sessionBack">${iconSvg('back')}</button><span>exercício ${state.currentExercise+1} de ${s.exercises.length}</span><button class="plain-icon" id="cancelSession">${iconSvg('close')}</button></div>
    <div class="session-progress"><span style="width:${((state.currentExercise+(si/ex.sets.length))/s.exercises.length)*100}%"></span></div>
    <section class="exercise-hero"><span class="exercise-badge">${ex.icon}</span><h1>${ex.name}</h1><small>${ex.equipment}</small></section>
    ${v60GuidePreview(ex)}
    <div class="series-label">série ${si+1} de ${ex.sets.length}</div>
    <section class="input-grid"><label><span>carga (kg)</span><input id="weightInput" type="number" inputmode="decimal" step="0.5" value="${set.weight}" placeholder="0"></label><label><span>repetições</span><input id="repsInput" type="number" inputmode="numeric" value="${set.reps}" placeholder="0"></label></section>
    <button class="cta-lime session-cta" id="completeSet">concluir série</button>
    <div class="record-strip">${iconSvg('trophy')}<span>última vez: <b>${lastSetText(ex.id)}</b></span></div>
    <div class="set-dots">${ex.sets.map((x,i)=>`<span class="${x.done?'done':''} ${i===si?'current':''}">${i+1}</span>`).join('')}</div>
    <div class="session-footer"><span id="sessionTime">${fmtClock(sessionElapsed())}</span><button class="text-link" id="finishEarly">encerrar treino</button></div>`,{showNav:false,classes:'session-page'});
  $('#openExerciseGuide').onclick=()=>v60ShowGuide(ex);
  $('#weightInput').oninput=e=>{set.weight=e.target.value;save(K.draft,s)};
  $('#repsInput').oninput=e=>{set.reps=e.target.value;save(K.draft,s)};
  $('#completeSet').onclick=completeCurrentSet;
  $('#cancelSession').onclick=()=>{v60CloseGuide();cancelSession()};
  $('#sessionBack').onclick=()=>{v60CloseGuide();if(state.currentExercise>0){state.currentExercise--;renderSession()}else{state.page='home';render()}};
  $('#finishEarly').onclick=()=>{if(confirm('encerrar o treino agora?')){v60CloseGuide();finishSession()}};
  clearInterval(state.sessionClock);
  state.sessionClock=setInterval(()=>{const el=$('#sessionTime');if(el)el.textContent=fmtClock(sessionElapsed())},1000);
  if(state.restRemaining>0)showRestOverlay();
};
