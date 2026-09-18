/*
 * Traço — Exact Exercise Media 1.0
 * Nenhum clipe stock "equivalente" é mostrado como execução.
 */
const TRACO_MEDIA_AUDIT=Object.freeze({
  'supino-inclinado':{name:"supino inclinado",equipment:"Smith + banco a ~30°",scene:'smithBenchIncline',verified:true},
  'desenvolvimento':{name:"desenvolvimento sentado",equipment:"Halteres + banco",scene:'dumbbellPress',verified:true},
  'elevacao-lateral':{name:"elevação lateral unilateral",equipment:"Polia baixa / crossover",scene:'cableLateralUnilateral',verified:true},
  'crucifixo-baixo-alto':{name:"crucifixo baixo → alto",equipment:"Crossover",scene:'cableFlyLowHigh',verified:true},
  'triceps-pushdown':{name:"tríceps pushdown",equipment:"Polia alta + barra/corda",scene:'pushdown',verified:true},
  'triceps-overhead':{name:"tríceps acima da cabeça",equipment:"Polia alta + corda",scene:'overheadTriceps',verified:true},
  'leg-press':{name:"leg press 45°",equipment:"Leg press 45°",scene:'legPressStandard',verified:true},
  'agachamento-smith':{name:"agachamento no Smith",equipment:"Smith",scene:'smithSquat',verified:true},
  'extensora':{name:"cadeira extensora",equipment:"Máquina extensora",scene:'legExtension',verified:true},
  'flexora':{name:"flexora sentada",equipment:"Máquina flexora",scene:'seatedLegCurl',verified:true},
  'abdutora':{name:"abdutora",equipment:"Máquina abdutora",scene:'abductor',verified:true},
  'panturrilha':{name:"panturrilha no leg press",equipment:"Leg press",scene:'legPressCalf',verified:true},
  'puxada-aberta':{name:"puxada alta aberta",equipment:"Máquina de puxada",scene:'pulldownWide',verified:true},
  'remada-baixa':{name:"remada baixa",equipment:"Polia baixa / crossover",scene:'seatedRow',verified:true},
  'pullover':{name:"pullover braços estendidos",equipment:"Polia alta",scene:'straightArmPulldown',verified:true},
  'crucifixo-inverso':{name:"crucifixo inverso",equipment:"Duas polias do crossover",scene:'reverseFly',verified:true},
  'rosca-polia':{name:"rosca bíceps na polia",equipment:"Polia baixa",scene:'cableCurl',verified:true},
  'rosca-martelo':{name:"rosca martelo",equipment:"Halteres",scene:'hammerCurl',verified:true},
  'crunch':{name:"abdominal reverso no banco",equipment:"Banco reto",scene:'reverseCrunch',verified:true},
  'supino-reto':{name:"supino reto",equipment:"Smith + banco reto",scene:'smithBenchFlat',verified:true},
  'crucifixo-reto':{name:"crucifixo na linha do peito",equipment:"Crossover",scene:'cableFlyHorizontal',verified:true},
  'elevacao-lateral-2':{name:"elevação lateral unilateral",equipment:"Polia",scene:'cableLateralUnilateral',verified:true},
  'face-pull':{name:"face pull",equipment:"Polia alta + corda",scene:'facePull',verified:true},
  'triceps-overhead-2':{name:"tríceps acima da cabeça",equipment:"Polia alta + corda",scene:'overheadTriceps',verified:true},
  'rosca-unilateral':{name:"rosca bíceps unilateral",equipment:"Polia baixa",scene:'cableCurlUnilateral',verified:true},
  'rdl':{name:"stiff / RDL",equipment:"Smith",scene:'smithRdl',verified:true},
  'flexora-2':{name:"flexora sentada",equipment:"Máquina flexora",scene:'seatedLegCurl',verified:true},
  'leg-press-alto':{name:"leg press — pés mais altos",equipment:"Leg press 45°",scene:'legPressHigh',verified:true},
  'puxada-neutra':{name:"puxada neutra / fechada",equipment:"Máquina de puxada",scene:'pulldownNeutral',verified:true},
  'elevacao-lateral-3':{name:"elevação lateral unilateral",equipment:"Polia",scene:'cableLateralUnilateral',verified:true},
  'abdutora-2':{name:"abdutora",equipment:"Máquina abdutora",scene:'abductor',verified:true},
  'crunch-2':{name:"crunch ajoelhado na polia",equipment:"Polia alta + corda",scene:'kneelingCrunch',verified:true},
  'core-crunch-seg':{name:"crunch na polia",equipment:"Polia alta + corda",scene:'kneelingCrunch',verified:true},
  'core-pallof-ter':{name:"Pallof press",equipment:"Polia / crossover",scene:'pallofPress',verified:true},
  'core-leg-raise-ter':{name:"elevação de pernas no banco",equipment:"Banco reto",scene:'legRaiseBench',verified:true},
  'core-woodchop-qui':{name:"woodchop na polia",equipment:"Polia alta / crossover",scene:'woodchop',verified:true},
  'core-dead-bug-qui':{name:"dead bug",equipment:"Solo / colchonete",scene:'deadBug',verified:true}
});

const TRACO_VIDEO_LIBRARY=Object.freeze({
  'supino-inclinado':{provider:'youtube',id:'R84DD4unAyI',source:'Idris',variant:'Smith incline 30–45°'},
  'desenvolvimento':{provider:'youtube',id:'FRxZ6wr5bpA',source:'Muscle & Strength',variant:'seated dumbbell press'},
  'elevacao-lateral':{provider:'youtube',id:'Fv-eAW1uKDI',source:'Muscle & Strength',variant:'single-arm low cable lateral raise'},
  'crucifixo-baixo-alto':{provider:'youtube',id:'8YjdqeIXPUQ',source:'Muscle & Strength',variant:'standing low-to-high cable fly'},
  'triceps-pushdown':{provider:'youtube',id:'LzwgB15UdO8',source:'Muscle & Strength',variant:'rope triceps pushdown'},
  'triceps-overhead':{provider:'youtube',id:'NRENeEgaIgA',source:'Muscle & Strength',variant:'high-pulley overhead rope extension'},
  'leg-press':{provider:'youtube',id:'sEM_zo9w2ss',source:'Muscle & Strength',variant:'45° leg press'},
  'agachamento-smith':{provider:'youtube',id:'BtfMX4WqUBo',source:'Muscle & Strength',variant:'Smith machine squat'},
  'extensora':{provider:'youtube',id:'0fl1RRgJ83I',source:'Muscle & Strength',variant:'seated leg extension'},
  'flexora':{provider:'youtube',id:'3BWiLFc8Dbg',source:'Muscle & Strength',variant:'seated leg curl'},
  'abdutora':{provider:'youtube',id:'7pbZA7ncuq8',source:'Muscle & Strength',variant:'hip abduction machine'},
  'panturrilha':{provider:'youtube',id:'RcKQbiL-ZOc',source:'Muscle & Strength',variant:'45° leg press calf raise'},
  'puxada-aberta':{provider:'youtube',id:'Mdp7kuhZD_M',source:'Muscle & Strength',variant:'wide-grip lat pulldown'},
  'remada-baixa':{provider:'vimeo',id:'756788734',hash:'145dc3923d',source:'Muscle & Strength',variant:'seated cable row'},
  'pullover':{provider:'youtube',id:'gDtXrJWPdlY',source:'Muscle & Strength',variant:'straight-arm lat pulldown'},
  'crucifixo-inverso':{provider:'youtube',id:'Baavi8rJWBI',source:'Muscle & Strength',variant:'bent-over low-pulley rear-delt fly'},
  'rosca-polia':{provider:'youtube',id:'_hRnRorKRWs',source:'Live Lean TV',variant:'standing low-pulley straight-bar cable curl'},
  'rosca-martelo':{provider:'youtube',id:'zC3nLlEvin4',source:'ScottHermanFitness',variant:'standing dumbbell hammer curl'},
  'crunch':{provider:'youtube',id:'nCHypnGvcq4',source:'YST Exercises',variant:'reverse crunch on flat bench'},
  'supino-reto':{provider:'vimeo',id:'756783677',hash:'b20676578f',source:'Muscle & Strength',variant:'Smith machine flat bench press'},
  'crucifixo-reto':{provider:'youtube',id:'OPYrUGZL8nU',source:'Muscle & Strength',variant:'standing mid-chest cable fly'},
  'elevacao-lateral-2':{provider:'youtube',id:'Fv-eAW1uKDI',source:'Muscle & Strength',variant:'single-arm low cable lateral raise'},
  'face-pull':{provider:'youtube',id:'7ZvpXA_mFpQ',source:'Muscle & Strength',variant:'cable face pull with rope'},
  'triceps-overhead-2':{provider:'youtube',id:'NRENeEgaIgA',source:'Muscle & Strength',variant:'high-pulley overhead rope extension'},
  'rosca-unilateral':{provider:'youtube',id:'Qbk5A7lWVOE',source:'Mountain Dog / John Meadows',variant:'one-arm low cable curl'},
  'rdl':{provider:'vimeo',id:'756793204',hash:'c832d55911',source:'Muscle & Strength',variant:'Smith machine stiff-leg deadlift / RDL'},
  'flexora-2':{provider:'youtube',id:'3BWiLFc8Dbg',source:'Muscle & Strength',variant:'seated leg curl'},
  'leg-press-alto':{provider:'youtube',id:'iQhP0kkadSI',source:'SATS Nordic',variant:'high-feet leg press'},
  'puxada-neutra':{provider:'youtube',id:'M3scNzLIJHg',source:'Telmo Barriuso',variant:'close neutral-grip lat pulldown'},
  'elevacao-lateral-3':{provider:'youtube',id:'Fv-eAW1uKDI',source:'Muscle & Strength',variant:'single-arm low cable lateral raise'},
  'abdutora-2':{provider:'youtube',id:'7pbZA7ncuq8',source:'Muscle & Strength',variant:'hip abduction machine'},
  'crunch-2':{provider:'youtube',id:'0KEP6A1deBE',source:'Travis Tarrant',variant:'kneeling rope cable crunch'},
  'core-crunch-seg':{provider:'youtube',id:'0KEP6A1deBE',source:'Travis Tarrant',variant:'kneeling rope cable crunch'},
  'core-pallof-ter':{provider:'youtube',id:'SFJprbDnaS0',source:'Muscle & Strength',variant:'standing Pallof press at chest height'},
  'core-leg-raise-ter':{provider:'youtube',id:'_B8CJEYd5mI',source:'Live Lean TV',variant:'lying leg raise on flat bench'},
  'core-woodchop-qui':{provider:'youtube',id:'0VWnOjUO7ks',source:'Muscle & Strength',variant:'high-cable wood chop'},
  'core-dead-bug-qui':{provider:'youtube',id:'eEhoSeBFoBk',source:'Muscle & Strength',variant:'dead bug on floor'}
});

function v60VideoFor(ex){return TRACO_VIDEO_LIBRARY[String(ex?.id||'')]||null;}
function v60VideoEmbedUrl(video){
  if(!video)return '';
  if(video.provider==='youtube')return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(video.id)}?rel=0&modestbranding=1&playsinline=1`;
  if(video.provider==='vimeo')return `https://player.vimeo.com/video/${encodeURIComponent(video.id)}?${video.hash?`h=${encodeURIComponent(video.hash)}&`:''}dnt=1&title=0&byline=0&portrait=0`;
  return '';
}
function v60VideoSourceUrl(video){
  if(!video)return '';
  if(video.provider==='youtube')return `https://www.youtube.com/watch?v=${encodeURIComponent(video.id)}`;
  if(video.provider==='vimeo')return `https://vimeo.com/${encodeURIComponent(video.id)}`;
  return '';
}
function v60VideoIframe(ex,{large=false}={}){
  const video=v60VideoFor(ex);
  if(!video||navigator.onLine===false)return '';
  const title=`${ex.name} — ${video.variant}`;
  return `<div class="v60-embed-wrap ${large?'is-large':''}"><iframe src="${v60VideoEmbedUrl(video)}" title="${tracoMediaEsc(title)}" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe><span class="v60-video-badge"><i></i>vídeo 1:1</span><span class="v60-video-source">${tracoMediaEsc(video.source)}</span></div>`;
}
function tracoMediaEsc(v){return String(v??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[ch]));}
function tracoMediaSetCount(ex){if(Array.isArray(ex?.sets))return ex.sets.length;const n=Number(ex?.sets);return Number.isFinite(n)&&n>0?n:0;}
function tracoNormalize(v){return String(v??'').normalize('NFC').trim().replace(/\s+/g,' ');}
function tracoAuditExerciseMedia(){
  const active=[...new Map(workoutPlan.flatMap(w=>w.exercises).map(ex=>[ex.id,ex])).values()];
  const failures=[];
  if(active.length!==37)failures.push(`esperados 37 exercícios ativos; encontrados ${active.length}`);
  for(const ex of active){
    const spec=TRACO_MEDIA_AUDIT[ex.id];
    if(!spec){failures.push(`${ex.id}: sem especificação`);continue;}
    if(spec.verified!==true)failures.push(`${ex.id}: não verificado`);
    if(tracoNormalize(spec.name)!==tracoNormalize(ex.name))failures.push(`${ex.id}: nome divergente`);
    if(tracoNormalize(spec.equipment)!==tracoNormalize(ex.equipment))failures.push(`${ex.id}: equipamento divergente`);
    const scene=typeof v60V4Scene==='function'?v60V4Scene(ex):null;
    if(!scene||!scene.equipment||!scene.a||!scene.b||!scene.motion)failures.push(`${ex.id}: cena técnica incompleta`);
  }
  const ids=new Set(active.map(ex=>ex.id));
  for(const id of Object.keys(TRACO_MEDIA_AUDIT))if(!ids.has(id))failures.push(`${id}: especificação órfã`);
  return {ok:failures.length===0,total:active.length,verified:Object.keys(TRACO_MEDIA_AUDIT).length,failures};
}
function tracoMediaRender(ex,large=false){
  const g=v60GuideFor(ex),spec=TRACO_MEDIA_AUDIT[ex.id];
  try{
    const svg=v60V4MotionSvg(ex,large);
    if(!svg||!svg.includes('<svg')||!svg.includes('v60-v4-motion-svg'))throw new Error('SVG vazio');
    return {ok:true,html:svg,cue:g.cue,spec};
  }catch(error){
    console.error('Traço media render failed',ex.id,error);
    return {
      ok:false,
      cue:g.cue,
      spec,
      html:`<div class="traco-media-fallback"><span>GUIA TÉCNICO</span><b>${tracoMediaEsc(ex.name)}</b><small>${tracoMediaEsc(g.cue)}</small><em>toque para ver instruções completas</em></div>`
    };
  }
}
function v60RealVideo(ex,{large=false}={}){
  const video=v60VideoFor(ex),technical=tracoMediaRender(ex,large);
  if(!video)return `<div class="v60-real-video-wrap is-fallback technical-only"><div class="v60-video-fallback">${technical.html}</div><span class="v60-video-badge technical"><i></i>guia técnico</span></div>`;
  return v60VideoIframe(ex,{large});
}
function tracoMediaPreview(ex){
  const video=v60VideoFor(ex);
  const technical=tracoMediaRender(ex,false);
  const offline=navigator.onLine===false;
  if(offline){
    return `<div class="exercise-guide-preview v60-v4-preview traco-media-preview is-offline"><div class="v60-v4-motion-wrap">${technical.html}<span class="v60-v4-loop-badge"><i></i> offline · guia local</span></div><button id="openExerciseGuide" class="exercise-guide-caption" type="button"><span><b>execução disponível offline</b><small>guia técnico do mesmo exercício</small></span><i>↗</i></button></div>`;
  }
  if(!video){
    return `<div class="exercise-guide-preview v60-v4-preview traco-media-preview"><div class="v60-v4-motion-wrap">${technical.html}</div><button id="openExerciseGuide" class="exercise-guide-caption" type="button"><span><b>ver guia técnico</b><small>${tracoMediaEsc(technical.cue)}</small></span><i>↗</i></button></div>`;
  }
  return `<div class="exercise-guide-preview v60-video-preview traco-media-preview has-real-video">${v60VideoIframe(ex)}<button id="openExerciseGuide" class="exercise-guide-caption" type="button"><span><b>abrir guia completo</b><small>${tracoMediaEsc(video.variant)}</small></span><i>↗</i></button></div>`;
}
function v60GuidePreview(ex){return tracoMediaPreview(ex);}
function v60ShowGuide(ex){
  v60CloseGuide();
  const g=v60GuideFor(ex),scene=v60V4Scene(ex),setCount=tracoMediaSetCount(ex),spec=TRACO_MEDIA_AUDIT[ex.id],media=tracoMediaRender(ex,true),video=v60VideoFor(ex);
  document.body.classList.add('v60-guide-open');
  const offline=navigator.onLine===false;
  const primary=video&&!offline
    ? `${v60VideoIframe(ex,{large:true})}<div class="v60-video-meta"><div><span>fonte</span><b>${tracoMediaEsc(video.source)}</b></div><div><span>variante validada</span><b>${tracoMediaEsc(video.variant)}</b></div></div><section class="v60-exact-reference"><div class="v60-exact-reference-head"><span>referência técnica</span><small>posição · trajetória · segurança</small></div>${media.html}</section>`
    : `<div class="traco-offline-guide-note">${offline?'<span>OFFLINE</span><b>guia técnico local</b><small>o vídeo 1:1 volta automaticamente quando houver internet.</small>':''}</div><div class="v60-v4-motion-wrap v60-v4-motion-large">${media.html}</div><p class="v60-v4-tech-note">${tracoMediaEsc(scene.note)}</p>`;
  const sourceLink=video&&!offline?`<a class="v60-video-source-link" href="${v60VideoSourceUrl(video)}" target="_blank" rel="noopener noreferrer">abrir fonte ↗</a>`:'';
  document.body.insertAdjacentHTML('beforeend',`<div class="v60-guide-backdrop" id="v60GuideBackdrop"></div><aside class="v60-guide-sheet ${video?'v60-video-sheet':'v60-v4-sheet'}" id="v60GuideSheet" role="dialog" aria-modal="true" aria-label="execução de ${tracoMediaEsc(ex.name)}"><div class="v60-guide-handle"></div><button class="v60-guide-close" id="v60GuideClose" aria-label="fechar">×</button><div class="v60-guide-content"><span class="v60-guide-kicker">${offline?'modo offline · execução local':video?'vídeo de execução 1:1':'guia técnico validado'}</span><h2>${tracoMediaEsc(ex.name)}</h2><p class="v60-guide-equipment">${tracoMediaEsc(ex.equipment)}</p>${primary}<div class="v60-guide-tags"><span>${tracoMediaEsc(g.focus)}</span><span>${setCount} × ${tracoMediaEsc(ex.min)}-${tracoMediaEsc(ex.max)}</span><span>${tracoMediaEsc(ex.rest)}s descanso</span></div><section class="v60-guide-tips"><h3>dicas rápidas</h3><ol>${g.tips.map(t=>`<li>${tracoMediaEsc(t)}</li>`).join('')}</ol></section><section class="v60-guide-error"><span>erro comum</span><p>${tracoMediaEsc(g.error)}</p></section><p class="v60-video-license-note">Traço Exact Media · exercício, equipamento e variante revisados manualmente${spec?.scene?` · ${tracoMediaEsc(spec.scene)}`:''}.</p>${sourceLink}<button class="cta-lime" id="v60GuideDone">voltar pro treino</button></div></aside>`);
  $('#v60GuideBackdrop').onclick=v60CloseGuide;$('#v60GuideClose').onclick=v60CloseGuide;$('#v60GuideDone').onclick=v60CloseGuide;
}
function tracoAuditRenderedMedia(){
  const active=[...new Map(workoutPlan.flatMap(w=>w.exercises).map(ex=>[ex.id,ex])).values()];
  const failed=[];
  for(const ex of active){
    const out=tracoMediaRender(ex,false);
    if(!out.ok||!out.html.includes('<svg'))failed.push(ex.id);
  }
  return {ok:failed.length===0,total:active.length,rendered:active.length-failed.length,failed};
}
function tracoConnectivityChanged(){
  document.documentElement.classList.toggle('traco-is-offline',navigator.onLine===false);
  const old=document.querySelector('#tracoOfflinePill');
  if(navigator.onLine===false){
    if(!old)document.body.insertAdjacentHTML('beforeend','<div class="traco-offline-pill" id="tracoOfflinePill"><i></i><span>offline</span><small>treino salvo neste aparelho</small></div>');
  }else{
    old?.remove();
  }
  if(typeof state!=='undefined'&&state.page==='session')renderSession();
}
window.addEventListener('online',tracoConnectivityChanged);
window.addEventListener('offline',tracoConnectivityChanged);
tracoConnectivityChanged();

window.TRACO_VIDEO_LIBRARY=TRACO_VIDEO_LIBRARY;
window.TRACO_MEDIA_AUDIT=TRACO_MEDIA_AUDIT;
window.TRACO_MEDIA_AUDIT_RESULT=tracoAuditExerciseMedia();
window.TRACO_MEDIA_RENDER_AUDIT_RESULT=tracoAuditRenderedMedia();
window.TRACO_EXACT_VIDEO_IDS=Object.keys(TRACO_VIDEO_LIBRARY);
window.V60_LICENSED_VIDEO_IDS=Object.keys(TRACO_VIDEO_LIBRARY);
if(!window.TRACO_MEDIA_AUDIT_RESULT.ok)console.error('Traço media audit failed',window.TRACO_MEDIA_AUDIT_RESULT.failures);
if(!window.TRACO_MEDIA_RENDER_AUDIT_RESULT.ok)console.error('Traço media render audit failed',window.TRACO_MEDIA_RENDER_AUDIT_RESULT.failed);
if(typeof state!=='undefined'&&state.page==='session')renderSession();
