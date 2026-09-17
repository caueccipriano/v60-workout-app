const V60_LICENSED_VIDEOS={
  'supino-inclinado':{pexelsId:'4920810',match:'equivalent'},
  'desenvolvimento':{pexelsId:'4367541',match:'exact'},
  'elevacao-lateral':{pexelsId:'5319088',match:'equivalent'},
  'crucifixo-baixo-alto':{pexelsId:'31105899',match:'equivalent'},
  'triceps-pushdown':{pexelsId:'5319433',match:'exact'},
  'triceps-overhead':{pexelsId:'6296281',match:'equivalent'},
  'leg-press':{pexelsId:'36457367',match:'exact'},
  'agachamento-smith':{pexelsId:'6892543',match:'exact'},
  'extensora':{pexelsId:'36539451',match:'exact'},
  'flexora':{pexelsId:'26540715',match:'equivalent'},
  'abdutora':{pexelsId:'8756633',match:'equivalent'},
  'panturrilha':{pexelsId:'32115656',match:'equivalent'},
  'puxada-aberta':{pexelsId:'5983521',match:'exact'},
  'remada-baixa':{pexelsId:'4367642',match:'exact'},
  'pullover':{pexelsId:'34324804',match:'equivalent'},
  'crucifixo-inverso':{pexelsId:'34491184',match:'equivalent'},
  'rosca-polia':{pexelsId:'5319438',match:'equivalent'},
  'rosca-martelo':{pexelsId:'35075300',match:'equivalent'},
  'crunch':{pexelsId:'36484275',match:'equivalent'},
  'supino-reto':{pexelsId:'5320004',match:'equivalent'},
  'crucifixo-reto':{pexelsId:'31105899',match:'equivalent'},
  'elevacao-lateral-2':{pexelsId:'5319088',match:'equivalent'},
  'face-pull':{pexelsId:'10336041',match:'equivalent'},
  'triceps-overhead-2':{pexelsId:'6296281',match:'equivalent'},
  'rosca-unilateral':{pexelsId:'36519964',match:'equivalent'},
  'rdl':{pexelsId:'32239229',match:'equivalent'},
  'flexora-2':{pexelsId:'26540715',match:'equivalent'},
  'leg-press-alto':{pexelsId:'36457367',match:'equivalent'},
  'puxada-neutra':{pexelsId:'35585699',match:'equivalent'},
  'elevacao-lateral-3':{pexelsId:'5319088',match:'equivalent'},
  'abdutora-2':{pexelsId:'8756633',match:'equivalent'},
  'crunch-2':{pexelsId:'36484275',match:'equivalent'}
};

function v60VideoFor(ex){return V60_LICENSED_VIDEOS[String(ex?.id||'')]||null;}
function v60VideoSrc(video){return video?`https://www.pexels.com/download/video/${video.pexelsId}/`:'';}
function v60VideoLabel(video){return video?.match==='exact'?'vídeo real · execução compatível':'vídeo real · movimento equivalente';}
function v60VideoMatchCopy(video){return video?.match==='exact'?'O vídeo corresponde ao padrão de execução e equipamento deste exercício.':'O vídeo demonstra o padrão corporal do movimento. Use a referência técnica logo abaixo para conferir a máquina, pegada e trajetória exatas do V60.';}
function v60VideoFailed(el){const wrap=el?.closest('.v60-real-video-wrap');if(wrap)wrap.classList.add('is-fallback');}
function v60VideoLoaded(el){const wrap=el?.closest('.v60-real-video-wrap');if(wrap)wrap.classList.add('is-ready');el?.play?.().catch(()=>{});}
function v60VideoEsc(v){return String(v??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[ch]));}

function v60RealVideo(ex,{large=false,controls=false}={}){
  const video=v60VideoFor(ex);
  if(!video)return `<div class="v60-real-video-wrap is-fallback"><div class="v60-video-fallback">${v60V4MotionSvg(ex,large)}</div></div>`;
  return `<div class="v60-real-video-wrap ${large?'is-large':''}">
    <video class="v60-real-video" src="${v60VideoSrc(video)}" muted playsinline autoplay loop preload="metadata" ${controls?'controls':''} onloadeddata="v60VideoLoaded(this)" onerror="v60VideoFailed(this)" aria-label="vídeo demonstrativo de ${v60VideoEsc(ex.name)}"></video>
    <div class="v60-video-fallback">${v60V4MotionSvg(ex,large)}</div>
    <span class="v60-video-badge"><i></i>${v60VideoLabel(video)}</span>
    <span class="v60-video-source">Pexels · ID ${video.pexelsId}</span>
  </div>`;
}

v60GuidePreview=function(ex){
  const g=v60GuideFor(ex),video=v60VideoFor(ex);
  return `<button class="exercise-guide-preview v60-video-preview" id="openExerciseGuide" type="button" aria-label="ver execução de ${v60VideoEsc(ex.name)}">
    ${v60RealVideo(ex)}
    <span class="exercise-guide-caption"><span><b>ver execução em vídeo</b><small>${video?.match==='exact'?v60VideoEsc(g.cue):'vídeo real + referência técnica exata'}</small></span><i>↗</i></span>
  </button>`;
};

v60ShowGuide=function(ex){
  v60CloseGuide();
  const g=v60GuideFor(ex),video=v60VideoFor(ex),setCount=Array.isArray(ex?.sets)?ex.sets.length:Number(ex?.sets)||0;
  document.body.classList.add('v60-guide-open');
  document.body.insertAdjacentHTML('beforeend',`<div class="v60-guide-backdrop" id="v60GuideBackdrop"></div><aside class="v60-guide-sheet v60-video-sheet" id="v60GuideSheet" role="dialog" aria-modal="true" aria-label="execução de ${v60VideoEsc(ex.name)}">
    <div class="v60-guide-handle"></div><button class="v60-guide-close" id="v60GuideClose" aria-label="fechar">×</button>
    <div class="v60-guide-content">
      <span class="v60-guide-kicker">execução em vídeo</span><h2>${v60VideoEsc(ex.name)}</h2><p class="v60-guide-equipment">${v60VideoEsc(ex.equipment)}</p>
      ${v60RealVideo(ex,{large:true,controls:true})}
      <p class="v60-video-match-copy">${v60VideoEsc(v60VideoMatchCopy(video))}</p>
      <section class="v60-exact-reference"><div class="v60-exact-reference-head"><span>referência técnica exata</span><small>máquina · posição · trajetória</small></div>${v60V4MotionSvg(ex,true)}</section>
      <div class="v60-guide-tags"><span>${v60VideoEsc(g.focus)}</span><span>${setCount} × ${v60VideoEsc(ex.min)}-${v60VideoEsc(ex.max)}</span><span>${v60VideoEsc(ex.rest)}s descanso</span></div>
      <section class="v60-guide-tips"><h3>dicas rápidas</h3><ol>${g.tips.map(t=>`<li>${v60VideoEsc(t)}</li>`).join('')}</ol></section>
      <section class="v60-guide-error"><span>erro comum</span><p>${v60VideoEsc(g.error)}</p></section>
      <p class="v60-video-license-note">Vídeo demonstrativo sob Licença Pexels. O V60 não sugere endosso do atleta ou criador exibido.</p>
      <button class="cta-lime" id="v60GuideDone">voltar pro treino</button>
    </div></aside>`);
  $('#v60GuideBackdrop').onclick=v60CloseGuide;$('#v60GuideClose').onclick=v60CloseGuide;$('#v60GuideDone').onclick=v60CloseGuide;
};

window.V60_LICENSED_VIDEO_IDS=Object.keys(V60_LICENSED_VIDEOS);
