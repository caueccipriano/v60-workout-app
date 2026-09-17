function v60SetCount(ex){
  return Array.isArray(ex?.sets) ? ex.sets.length : Number(ex?.sets||0);
}

function v60Esc(value){
  return String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[ch]));
}

function v60MotionSvg(ex,large=false){
  const g=v60GuideFor(ex), width=large?1100:720, height=large?620:360;
  const palette={blue:['#2138B0','#0F183F'],lime:['#9CAE1F','#34410A'],orange:['#E8492A','#7D2413']}[g.accent]||['#2138B0','#0F183F'];
  const startX=width*.34, endX=width*.66, baseY=height*.47, scale=large?2.1:1.35;
  const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const aStart=reduced?'':`<animate attributeName="opacity" values="1;.18;1" keyTimes="0;.5;1" dur="2.3s" repeatCount="indefinite"/>`;
  const aEnd=reduced?'':`<animate attributeName="opacity" values=".18;1;.18" keyTimes="0;.5;1" dur="2.3s" repeatCount="indefinite"/>`;
  const aArrow=reduced?'':`<animateTransform attributeName="transform" type="translate" values="-12 0;12 0;-12 0" dur="2.3s" repeatCount="indefinite"/>`;
  return `<svg class="v60-motion-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="demonstração animada de ${v60Esc(ex.name)}">
    <defs><linearGradient id="mv-${v60Esc(ex.id)}" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="${palette[0]}"/><stop offset="100%" stop-color="${palette[1]}"/></linearGradient></defs>
    <rect width="${width}" height="${height}" rx="42" fill="url(#mv-${v60Esc(ex.id)})"/>
    <circle cx="${width*.86}" cy="${height*.18}" r="${height*.20}" fill="#fff" opacity=".06"/><circle cx="${width*.16}" cy="${height*.88}" r="${height*.24}" fill="#fff" opacity=".04"/>
    <text x="${width*.06}" y="${height*.12}" fill="#FAFAFA" font-family="Arial,Helvetica,sans-serif" font-size="${large?34:20}" font-weight="700">${v60Esc(ex.name)}</text>
    <text x="${width*.06}" y="${height*.20}" fill="#FAFAFA" opacity=".74" font-family="Arial,Helvetica,sans-serif" font-size="${large?20:13}">${v60Esc(g.focus)}</text>
    <g opacity="1">${v60Pose(g.motion,false,startX,baseY,scale,1)}${aStart}</g>
    <g opacity=".18">${v60Pose(g.motion,true,endX,baseY,scale,1)}${aEnd}</g>
    <g>${aArrow}<path d="M ${width*.43} ${height*.55} H ${width*.56}" stroke="#C4D82E" stroke-width="${large?10:7}" stroke-linecap="round"/><path d="M ${width*.54} ${height*.50} L ${width*.59} ${height*.55} L ${width*.54} ${height*.60}" fill="none" stroke="#C4D82E" stroke-width="${large?10:7}" stroke-linecap="round" stroke-linejoin="round"/></g>
    <rect x="${width*.055}" y="${height*.80}" width="${width*.89}" height="${height*.13}" rx="${height*.065}" fill="#FAFAFA" opacity=".94"/>
    <text x="${width*.085}" y="${height*.885}" fill="#111" font-family="Arial,Helvetica,sans-serif" font-size="${large?22:14}" font-weight="700">${v60Esc(g.cue)}</text>
  </svg>`;
}

v60GuidePreview = function(ex){
  const g=v60GuideFor(ex);
  return `<button class="exercise-guide-preview" id="openExerciseGuide" type="button" aria-label="ver movimento de ${v60Esc(ex.name)}">
    <div class="exercise-guide-motion">${v60MotionSvg(ex,false)}<span class="motion-loop-badge">● movimento em loop</span></div>
    <span class="exercise-guide-caption"><span><b>ver movimento</b><small>${v60Esc(g.cue)}</small></span><i>↗</i></span>
  </button>`;
};

v60ShowGuide = function(ex){
  v60CloseGuide();
  const g=v60GuideFor(ex), setCount=v60SetCount(ex);
  document.body.classList.add('v60-guide-open');
  document.body.insertAdjacentHTML('beforeend',`<div class="v60-guide-backdrop" id="v60GuideBackdrop"></div>
    <aside class="v60-guide-sheet" id="v60GuideSheet" role="dialog" aria-modal="true" aria-label="execução de ${v60Esc(ex.name)}">
      <div class="v60-guide-handle"></div>
      <button class="v60-guide-close" id="v60GuideClose" aria-label="fechar">×</button>
      <div class="v60-guide-content">
        <span class="v60-guide-kicker">demonstração em movimento</span>
        <h2>${v60Esc(ex.name)}</h2>
        <p class="v60-guide-equipment">${v60Esc(ex.equipment)}</p>
        <div class="v60-guide-motion-large">${v60MotionSvg(ex,true)}<span class="motion-loop-badge">● repetindo automaticamente</span></div>
        <div class="v60-guide-tags"><span>${v60Esc(g.focus)}</span><span>${setCount} × ${ex.min}-${ex.max}</span><span>${ex.rest}s descanso</span></div>
        <section class="v60-guide-tips"><h3>dicas rápidas</h3><ol>${g.tips.map(t=>`<li>${v60Esc(t)}</li>`).join('')}</ol></section>
        <section class="v60-guide-error"><span>erro comum</span><p>${v60Esc(g.error)}</p></section>
        <button class="cta-lime" id="v60GuideDone">voltar pro treino</button>
      </div>
    </aside>`);
  $('#v60GuideBackdrop').onclick=v60CloseGuide;
  $('#v60GuideClose').onclick=v60CloseGuide;
  $('#v60GuideDone').onclick=v60CloseGuide;
};
