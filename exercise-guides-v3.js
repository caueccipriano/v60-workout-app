function v60V3SetCount(ex){
  if(Array.isArray(ex?.sets)) return ex.sets.length;
  const n=Number(ex?.sets);
  return Number.isFinite(n) && n>0 ? n : 0;
}

function v60V3Esc(value){
  return String(value ?? '').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[ch]));
}

function v60V3MotionSvg(ex,large=false){
  const g=v60GuideFor(ex);
  const width=large?1100:720, height=large?620:360;
  const palette={blue:['#2138B0','#101845'],lime:['#9CAE1F','#36420B'],orange:['#E8492A','#7D2413']}[g.accent]||['#2138B0','#101845'];
  const x=width*.50, y=height*.49, scale=large?2.25:1.42;
  const id=`v60v3-${String(ex.id||'exercise').replace(/[^a-z0-9-]/gi,'-')}-${large?'lg':'sm'}`;
  return `<svg class="v60-v3-motion-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="movimento animado de ${v60V3Esc(ex.name)}">
    <defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="${palette[0]}"/><stop offset="100%" stop-color="${palette[1]}"/></linearGradient></defs>
    <rect width="${width}" height="${height}" rx="42" fill="url(#${id})"/>
    <circle cx="${width*.86}" cy="${height*.18}" r="${height*.20}" fill="#fff" opacity=".06"/>
    <circle cx="${width*.16}" cy="${height*.88}" r="${height*.24}" fill="#fff" opacity=".04"/>
    <text x="${width*.06}" y="${height*.12}" fill="#FAFAFA" font-family="Arial,Helvetica,sans-serif" font-size="${large?34:20}" font-weight="700">${v60V3Esc(ex.name)}</text>
    <text x="${width*.06}" y="${height*.20}" fill="#FAFAFA" opacity=".74" font-family="Arial,Helvetica,sans-serif" font-size="${large?20:13}">${v60V3Esc(g.focus)}</text>
    <g class="v60-v3-pose v60-v3-pose-a">${v60Pose(g.motion,false,x,y,scale,1)}</g>
    <g class="v60-v3-pose v60-v3-pose-b">${v60Pose(g.motion,true,x,y,scale,1)}</g>
    <g class="v60-v3-arrow"><path d="M ${width*.43} ${height*.61} H ${width*.56}" stroke="#C4D82E" stroke-width="${large?10:7}" stroke-linecap="round"/><path d="M ${width*.54} ${height*.56} L ${width*.59} ${height*.61} L ${width*.54} ${height*.66}" fill="none" stroke="#C4D82E" stroke-width="${large?10:7}" stroke-linecap="round" stroke-linejoin="round"/></g>
    <rect x="${width*.055}" y="${height*.80}" width="${width*.89}" height="${height*.13}" rx="${height*.065}" fill="#FAFAFA" opacity=".95"/>
    <text x="${width*.085}" y="${height*.885}" fill="#111" font-family="Arial,Helvetica,sans-serif" font-size="${large?22:14}" font-weight="700">${v60V3Esc(g.cue)}</text>
  </svg>`;
}

v60GuidePreview = function(ex){
  const g=v60GuideFor(ex);
  return `<button class="exercise-guide-preview v60-v3-preview" id="openExerciseGuide" type="button" aria-label="ver movimento de ${v60V3Esc(ex.name)}">
    <div class="v60-v3-motion-wrap">${v60V3MotionSvg(ex,false)}<span class="v60-v3-loop-badge"><i></i> movimento em loop</span></div>
    <span class="exercise-guide-caption"><span><b>ver movimento</b><small>${v60V3Esc(g.cue)}</small></span><i>↗</i></span>
  </button>`;
};

v60ShowGuide = function(ex){
  v60CloseGuide();
  const g=v60GuideFor(ex);
  const setCount=v60V3SetCount(ex);
  document.body.classList.add('v60-guide-open');
  document.body.insertAdjacentHTML('beforeend',`<div class="v60-guide-backdrop" id="v60GuideBackdrop"></div>
    <aside class="v60-guide-sheet v60-v3-sheet" id="v60GuideSheet" role="dialog" aria-modal="true" aria-label="execução de ${v60V3Esc(ex.name)}">
      <div class="v60-guide-handle"></div>
      <button class="v60-guide-close" id="v60GuideClose" aria-label="fechar">×</button>
      <div class="v60-guide-content">
        <span class="v60-guide-kicker">movimento em loop</span>
        <h2>${v60V3Esc(ex.name)}</h2>
        <p class="v60-guide-equipment">${v60V3Esc(ex.equipment)}</p>
        <div class="v60-v3-motion-wrap v60-v3-motion-large">${v60V3MotionSvg(ex,true)}<span class="v60-v3-loop-badge"><i></i> animação automática</span></div>
        <div class="v60-guide-tags"><span>${v60V3Esc(g.focus)}</span><span>${setCount} × ${v60V3Esc(ex.min)}-${v60V3Esc(ex.max)}</span><span>${v60V3Esc(ex.rest)}s descanso</span></div>
        <section class="v60-guide-tips"><h3>dicas rápidas</h3><ol>${g.tips.map(t=>`<li>${v60V3Esc(t)}</li>`).join('')}</ol></section>
        <section class="v60-guide-error"><span>erro comum</span><p>${v60V3Esc(g.error)}</p></section>
        <button class="cta-lime" id="v60GuideDone">voltar pro treino</button>
      </div>
    </aside>`);
  $('#v60GuideBackdrop').onclick=v60CloseGuide;
  $('#v60GuideClose').onclick=v60CloseGuide;
  $('#v60GuideDone').onclick=v60CloseGuide;
};
