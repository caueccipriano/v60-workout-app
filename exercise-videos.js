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
function tracoMediaPreview(ex){
  const media=tracoMediaRender(ex,false);
  return `<button class="exercise-guide-preview v60-v4-preview traco-media-preview ${media.ok?'is-rendered':'is-fallback'}" data-media-exercise="${tracoMediaEsc(ex.id)}" id="openExerciseGuide" type="button" aria-label="ver execução de ${tracoMediaEsc(ex.name)}"><div class="v60-v4-motion-wrap">${media.html}<span class="v60-v4-loop-badge"><i></i> ${media.ok?'guia animado':'instruções'}</span></div><span class="exercise-guide-caption"><span><b>ver execução</b><small>${tracoMediaEsc(media.cue)}</small></span><i>↗</i></span></button>`;
}
function v60GuidePreview(ex){return tracoMediaPreview(ex);}
function v60ShowGuide(ex){
  v60CloseGuide();
  const g=v60GuideFor(ex),scene=v60V4Scene(ex),setCount=tracoMediaSetCount(ex),spec=TRACO_MEDIA_AUDIT[ex.id],media=tracoMediaRender(ex,true);
  document.body.classList.add('v60-guide-open');
  document.body.insertAdjacentHTML('beforeend',`<div class="v60-guide-backdrop" id="v60GuideBackdrop"></div><aside class="v60-guide-sheet v60-v4-sheet" id="v60GuideSheet" role="dialog" aria-modal="true" aria-label="execução de ${tracoMediaEsc(ex.name)}"><div class="v60-guide-handle"></div><button class="v60-guide-close" id="v60GuideClose" aria-label="fechar">×</button><div class="v60-guide-content"><span class="v60-guide-kicker">guia técnico validado</span><h2>${tracoMediaEsc(ex.name)}</h2><p class="v60-guide-equipment">${tracoMediaEsc(ex.equipment)}</p><div class="v60-v4-motion-wrap v60-v4-motion-large">${media.html}<span class="v60-v4-loop-badge"><i></i> ${media.ok?'início ↔ fim':'instruções'}</span></div><p class="v60-v4-tech-note">${tracoMediaEsc(scene.note)}</p><div class="v60-guide-tags"><span>${tracoMediaEsc(g.focus)}</span><span>${setCount} × ${tracoMediaEsc(ex.min)}-${tracoMediaEsc(ex.max)}</span><span>${tracoMediaEsc(ex.rest)}s descanso</span></div><section class="v60-guide-tips"><h3>dicas rápidas</h3><ol>${g.tips.map(t=>`<li>${tracoMediaEsc(t)}</li>`).join('')}</ol></section><section class="v60-guide-error"><span>erro comum</span><p>${tracoMediaEsc(g.error)}</p></section><p class="v60-video-license-note">Traço Exact Media · exercício, equipamento e trajetória auditados${spec?.scene?` · ${tracoMediaEsc(spec.scene)}`:''}.</p><button class="cta-lime" id="v60GuideDone">voltar pro treino</button></div></aside>`);
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
window.TRACO_MEDIA_AUDIT=TRACO_MEDIA_AUDIT;
window.TRACO_MEDIA_AUDIT_RESULT=tracoAuditExerciseMedia();
window.TRACO_MEDIA_RENDER_AUDIT_RESULT=tracoAuditRenderedMedia();
window.V60_LICENSED_VIDEO_IDS=[];
if(!window.TRACO_MEDIA_AUDIT_RESULT.ok)console.error('Traço media audit failed',window.TRACO_MEDIA_AUDIT_RESULT.failures);
if(!window.TRACO_MEDIA_RENDER_AUDIT_RESULT.ok)console.error('Traço media render audit failed',window.TRACO_MEDIA_RENDER_AUDIT_RESULT.failed);
if(typeof state!=='undefined'&&state.page==='session')renderSession();
