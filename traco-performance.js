/*
 * Traço 2.3 — Gym UX Pass
 * Final interaction/presentation layer. Internal v60_* keys remain for backwards compatibility.
 */
const TRACO_PERF_MIGRATION='traco_performance_console_v1';
const TRACO_LAST_LEVEL='traco_last_level_v1';

function tracoPerfInit(){
  document.documentElement.dataset.design='performance';
  if(!localStorage.getItem(TRACO_PERF_MIGRATION)){
    localStorage.setItem(TRACO_THEME_KEY||'traco_theme','dark');
    localStorage.setItem(TRACO_PERF_MIGRATION,'1');
  }
  if(typeof tracoApplyTheme==='function')tracoApplyTheme(localStorage.getItem('traco_theme')==='light'?'light':'dark');
  else document.documentElement.dataset.theme=localStorage.getItem('traco_theme')==='light'?'light':'dark';
}
function tracoPerfEsc(v){return String(v??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[ch]));}
function tracoPerfDumbbell(){
  return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M7 8v8M4.5 9.5v5M17 8v8M19.5 9.5v5M7 12h10M2.5 11v2M21.5 11v2"/></svg>';
}
function tracoPerfCalendar(){
  return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M8 3v4M16 3v4M3 10h18"/><path d="m9 15 2 2 4-5"/></svg>';
}
function tracoPerfShuffle(){
  return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M16 3h5v5"/><path d="m4 20 17-17"/><path d="M21 16v5h-5"/><path d="m15 15 6 6"/><path d="M4 4l5 5"/></svg>';
}
function tracoPerfWorkoutLast(id){
  const row=sessions().filter(s=>s.finishedAt&&s.workoutId===id).sort((a,b)=>b.startedAt-a.startedAt)[0];
  if(!row)return 'ainda não feito';
  const start=new Date(row.startedAt),today=new Date();
  start.setHours(0,0,0,0);today.setHours(0,0,0,0);
  const days=Math.max(0,Math.round((today-start)/86400000));
  if(days===0)return 'feito hoje';
  if(days===1)return 'feito ontem';
  return `feito há ${days} dias`;
}
function tracoPerfExerciseHistoryCount(){
  const ids=new Set();
  sessions().filter(s=>s.finishedAt).forEach(s=>(s.exercises||[]).forEach(ex=>{
    if((ex.sets||[]).some(set=>set.done&&Number(set.weight)>0))ids.add(ex.id);
  }));
  return ids.size;
}
function tracoPerfLineChart(points){
  if(points.length<2)return '<div class="perf-one-point"><i></i><b>mais 1 registro libera sua curva</b><small>o baseline já está salvo. agora é só treinar e comparar.</small></div>';
  const pts=points.slice(-8),w=320,h=116,p=12,max=Math.max(...pts.map(x=>x.value)),min=Math.min(...pts.map(x=>x.value)),range=Math.max(1,max-min);
  const coords=pts.map((x,i)=>{
    const px=p+(i*(w-p*2)/Math.max(1,pts.length-1));
    const py=h-p-((x.value-min)/range)*(h-p*2);
    return {x:px,y:py,value:x.value,date:x.date};
  });
  const line=coords.map(c=>`${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' ');
  return `<div class="perf-line-chart"><svg viewBox="0 0 ${w} ${h}" role="img" aria-label="evolução da carga"><polyline points="${line}" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>${coords.map(c=>`<circle cx="${c.x}" cy="${c.y}" r="4"/>`).join('')}</svg><div class="perf-chart-axis"><span>${pts[0].value}kg</span><span>${pts[pts.length-1].value}kg</span></div></div>`;
}
function tracoPerfExecutionTrigger(ex){
  const hasVideo=typeof v60VideoFor==='function'&&Boolean(v60VideoFor(ex));
  const offline=navigator.onLine===false;
  return `<button class="perf-execution-trigger" id="openExerciseGuide" type="button" aria-label="ver execução de ${tracoPerfEsc(ex.name)}"><span class="perf-execution-icon">${iconSvg('play')}</span><span><b>ver execução</b><small>${offline?'guia técnico disponível offline':hasVideo?'vídeo 1:1 + guia técnico':'guia técnico do movimento'}</small></span><i>↗</i></button>`;
}
function tracoPerfInfoModal(title,body){
  document.querySelector('#tracoInfoModal')?.remove();
  document.body.insertAdjacentHTML('beforeend',`<div class="traco-editor-backdrop" id="tracoInfoModal"><section class="traco-editor-sheet traco-info-sheet" role="dialog" aria-modal="true"><div class="traco-editor-head"><div><span>Traço</span><h3>${tracoPerfEsc(title)}</h3></div><button class="traco-editor-x" id="tracoInfoClose" aria-label="fechar">×</button></div><div class="traco-info-copy">${body}</div><button class="cta-lime" id="tracoInfoDone">fechar</button></section></div>`);
  const modal=$('#tracoInfoModal');
  $('#tracoInfoClose').onclick=$('#tracoInfoDone').onclick=()=>modal.remove();
  modal.onclick=e=>{if(e.target===modal)modal.remove();};
}
function tracoPerfClearData(){
  if(!confirm('apagar treinos, medidas, XP, preferências e histórico deste aparelho?'))return;
  if(!confirm('tem certeza? exporte um backup antes se quiser guardar seus dados.'))return;
  const keep=new Set(['traco_theme',TRACO_PERF_MIGRATION]);
  Object.keys(localStorage).forEach(k=>{
    if((k.startsWith('v60_')||k.startsWith('traco_'))&&!keep.has(k))localStorage.removeItem(k);
  });
  toast('dados apagados deste aparelho');
  haptic();
  setTimeout(()=>location.reload(),500);