function v60V3SetCount(ex){
  if(Array.isArray(ex?.sets)) return ex.sets.length;
  const n=Number(ex?.sets);
  return Number.isFinite(n)&&n>0?n:0;
}
function v60V3Esc(v){return String(v??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[ch]));}
function v60V3BaseId(id){return String(id||'').replace(/-\d+$/,'');}

function v60V3Scene(ex){
  const id=v60V3BaseId(ex.id);
  const W='#FAFAFA', G='rgba(250,250,250,.30)', L='#C4D82E';
  const line=(x1,y1,x2,y2,sw=5,c=W)=>`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${c}" stroke-width="${sw}" stroke-linecap="round"/>`;
  const rect=(x,y,w,h,r=5,c=G)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${c}"/>`;
  const circ=(x,y,r,c=W,fill='none',sw=4)=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" stroke="${c}" stroke-width="${sw}"/>`;
  const arrow=(x1,y1,x2,y2)=>`<path d="M ${x1} ${y1} L ${x2} ${y2}" stroke="${L}" stroke-width="8" stroke-linecap="round"/><path d="M ${x2-12} ${y2-10} L ${x2} ${y2} L ${x2-12} ${y2+10}" fill="none" stroke="${L}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>`;
  const head=(x,y)=>circ(x,y,10,W,'none',4);
  const torso=(x1,y1,x2,y2)=>line(x1,y1,x2,y2,6);
  const standing=(x=360,y=180)=>`${head(x,y-62)}${torso(x,y-52,x,y)}${line(x,y,x-18,y+48)}${line(x,y,x+18,y+48)}`;
  const benchPress=(incline=false)=>{
    const bench=incline?`${line(250,252,390,205,12,G)}${line(254,252,235,310,8,G)}${line(388,205,414,310,8,G)}`:`${line(245,244,400,244,12,G)}${line(255,244,238,310,8,G)}${line(390,244,410,310,8,G)}`;
    const equipment=`${rect(195,72,12,238,6,G)}${rect(520,72,12,238,6,G)}${line(170,310,555,310,8,G)}${bench}${line(205,120,522,120,7,W)}${rect(186,103,9,34,3,W)}${rect(174,98,8,44,3,W)}${rect(532,103,9,34,3,W)}${rect(544,98,8,44,3,W)}`;
    const a=incline?`${head(320,188)}${torso(328,196,370,220)}${line(370,220,400,245)}${line(328,202,310,132)}${line(350,210,365,132)}${line(400,245,435,278)}${line(400,245,385,284)}`:`${head(310,220)}${torso(320,220,370,238)}${line(370,238,420,258)}${line(322,220,310,125)}${line(350,230,365,125)}${line(420,258,452,288)}${line(420,258,400,294)}`;
    const b=incline?`${head(320,188)}${torso(328,196,370,220)}${line(370,220,400,245)}${line(328,202,305,164)}${line(350,210,360,164)}${line(400,245,435,278)}${line(400,245,385,284)}${line(304,164,304,122,4)}${line(360,164,360,122,4)}`:`${head(310,220)}${torso(320,220,370,238)}${line(370,238,420,258)}${line(322,220,300,168)}${line(350,230,366,168)}${line(420,258,452,288)}${line(420,258,400,294)}${line(300,168,300,122,4)}${line(366,168,366,122,4)}`;
    return{equipment,a,b,arrow:arrow(590,185,590,125)};
  };

  if(id==='supino-reto') return benchPress(false);
  if(id==='supino-inclinado') return benchPress(true);
  if(id==='desenvolvimento') return{equipment:`${rect(315,222,95,12,6,G)}${rect(360,140,12,92,6,G)}${rect(320,302,95,10,5,G)}`,a:`${head(360,145)}${torso(360,155,360,218)}${line(360,218,338,280)}${line(360,218,382,280)}${line(360,175,320,180)}${line(360,175,400,180)}${circ(310,180,9,W,W,0)}${circ(410,180,9,W,W,0)}`,b:`${head(360,145)}${torso(360,155,360,218)}${line(360,218,338,280)}${line(360,218,382,280)}${line(360,175,330,112)}${line(360,175,390,112)}${circ(325,100,9,W,W,0)}${circ(395,100,9,W,W,0)}`,arrow:arrow(470,205,470,118)};
  if(id==='elevacao-lateral') return{equipment:`${rect(165,72,18,238,7,G)}${circ(174,105,7,G,G,0)}${line(174,105,306,180,3,G)}`,a:`${standing(360,188)}${line(360,150,335,190)}${line(360,150,385,190)}`,b:`${standing(360,188)}${line(360,150,292,150)}${line(360,150,428,150)}`,arrow:arrow(470,210,520,154)};
  if(id==='crucifixo-baixo-alto'||id==='crucifixo-reto') return{equipment:`${rect(120,70,18,240,7,G)}${rect(582,70,18,240,7,G)}${line(129,265,325,170,3,G)}${line(591,265,395,170,3,G)}`,a:`${standing(360,190)}${line(360,150,300,190)}${line(360,150,420,190)}`,b:`${standing(360,190)}${line(360,150,338,138)}${line(360,150,382,138)}`,arrow:arrow(286,215,340,154)};
  if(id==='triceps-pushdown') return{equipment:`${rect(530,70,18,240,7,G)}${line(539,88,430,128,3,G)}${line(430,128,430,175,3,W)}`,a:`${standing(360,190)}${line(360,150,392,158)}${line(392,158,430,175)}`,b:`${standing(360,190)}${line(360,150,392,158)}${line(392,158,405,222)}`,arrow:arrow(455,160,455,220)};
  if(id==='triceps-overhead') return{equipment:`${rect(530,70,18,240,7,G)}${line(539,88,430,110,3,G)}`,a:`${standing(360,194)}${line(360,150,380,118)}${line(380,118,414,150)}`,b:`${standing(360,194)}${line(360,150,380,118)}${line(380,118,420,90)}`,arrow:arrow(460,160,460,95)};
  if(id==='leg-press'||id==='leg-press-alto'||id==='panturrilha') return{equipment:`<path d="M190 292 L275 292 L235 220 Z" fill="${G}"/><path d="M500 108 L592 175 L525 220 Z" fill="${G}"/>${line(545,82,610,130,12,W)}${line(220,294,510,120,6,G)}`,a:`${head(286,228)}${torso(296,234,345,252)}${line(345,252,402,220)}${line(402,220,478,174)}${line(345,252,398,245)}${line(398,245,478,188)}`,b:`${head(286,228)}${torso(296,234,345,252)}${line(345,252,420,238)}${line(420,238,510,185)}${line(345,252,418,258)}${line(418,258,508,198)}`,arrow:arrow(515,245,575,195)};
  if(id==='agachamento-smith') return{equipment:`${rect(200,65,15,250,7,G)}${rect(500,65,15,250,7,G)}${line(185,315,530,315,8,G)}${line(220,135,495,135,8,W)}`,a:`${standing(360,190)}${line(320,138,400,138,5,W)}${line(340,180,315,138)}${line(380,180,405,138)}`,b:`${head(360,170)}${torso(360,180,360,225)}${line(360,225,325,258)}${line(325,258,300,298)}${line(360,225,397,258)}${line(397,258,425,298)}${line(320,190,315,160)}${line(400,190,405,160)}${line(315,160,405,160,5,W)}`,arrow:arrow(555,155,555,240)};
  if(id==='extensora'||id==='flexora'||id==='abdutora'){
    const equipment=`${rect(250,225,150,14,7,G)}${rect(330,132,14,100,7,G)}${rect(245,304,165,10,5,G)}${rect(420,230,60,14,7,G)}`;
    if(id==='abdutora') return{equipment,a:`${head(332,145)}${torso(332,155,332,220)}${line(332,220,312,265)}${line(332,220,352,265)}`,b:`${head(332,145)}${torso(332,155,332,220)}${line(332,220,270,265)}${line(332,220,394,265)}`,arrow:arrow(450,260,515,260)};
    return id==='extensora'?{equipment,a:`${head(332,145)}${torso(332,155,332,220)}${line(332,220,386,235)}${line(386,235,405,290)}`,b:`${head(332,145)}${torso(332,155,332,220)}${line(332,220,386,235)}${line(386,235,475,238)}`,arrow:arrow(460,285,520,240)}:{equipment,a:`${head(332,145)}${torso(332,155,332,220)}${line(332,220,386,235)}${line(386,235,475,260)}`,b:`${head(332,145)}${torso(332,155,332,220)}${line(332,220,386,235)}${line(386,235,430,205)}`,arrow:arrow(505,270,455,215)};
  }
  if(id==='puxada-aberta'||id==='puxada-neutra') return{equipment:`${rect(520,70,18,240,7,G)}${line(360,92,530,92,6,G)}${line(360,92,360,120,3,G)}${line(300,120,420,120,8,W)}${rect(320,260,80,12,6,G)}`,a:`${head(360,182)}${torso(360,192,360,252)}${line(360,210,315,120)}${line(360,210,405,120)}${line(360,252,335,300)}${line(360,252,385,300)}`,b:`${head(360,182)}${torso(360,192,360,252)}${line(360,210,325,170)}${line(360,210,395,170)}${line(325,170,310,150)}${line(395,170,410,150)}${line(360,252,335,300)}${line(360,252,385,300)}${line(315,150,405,150,7,W)}`,arrow:arrow(470,118,470,175)};
  if(id==='remada-baixa') return{equipment:`${rect(525,70,18,240,7,G)}${rect(260,268,95,12,6,G)}${line(534,210,430,220,3,G)}`,a:`${head(350,165)}${torso(350,175,350,240)}${line(350,205,430,220)}${line(350,240,320,290)}${line(350,240,390,290)}`,b:`${head(350,165)}${torso(350,175,350,240)}${line(350,205,392,205)}${line(392,205,420,220)}${line(350,240,320,290)}${line(350,240,390,290)}`,arrow:arrow(475,240,420,220)};
  if(id==='pullover') return{equipment:`${rect(520,70,18,240,7,G)}${line(529,92,415,105,3,G)}`,a:`${standing(350,194)}${line(350,150,395,110)}${line(395,110,430,105)}`,b:`${standing(350,194)}${line(350,150,390,190)}${line(390,190,425,220)}`,arrow:arrow(470,120,450,220)};
  if(id==='crucifixo-inverso'||id==='face-pull') return{equipment:`${rect(120,70,18,240,7,G)}${rect(582,70,18,240,7,G)}${line(129,175,325,170,3,G)}${line(591,175,395,170,3,G)}`,a:`${standing(360,192)}${line(360,150,325,170)}${line(360,150,395,170)}`,b:`${standing(360,192)}${line(360,150,285,145)}${line(360,150,435,145)}`,arrow:arrow(430,210,500,145)};
  if(id==='rosca-polia'||id==='rosca-unilateral') return{equipment:`${rect(520,70,18,240,7,G)}${line(529,282,415,238,3,G)}`,a:`${standing(350,194)}${line(350,150,390,225)}${line(350,150,330,220)}`,b:`${standing(350,194)}${line(350,150,385,170)}${line(385,170,405,138)}${line(350,150,330,220)}`,arrow:arrow(455,230,430,155)};
  if(id==='rosca-martelo') return{equipment:`${circ(325,236,9,W,W,0)}${circ(395,236,9,W,W,0)}`,a:`${standing(360,194)}${line(360,150,325,225)}${line(360,150,395,225)}`,b:`${standing(360,194)}${line(360,150,330,170)}${line(330,170,325,135)}${line(360,150,390,170)}${line(390,170,395,135)}${circ(325,130,9,W,W,0)}${circ(395,130,9,W,W,0)}`,arrow:arrow(470,220,470,140)};
  if(id==='crunch') return{equipment:`${rect(520,70,18,240,7,G)}${line(529,92,410,125,3,G)}`,a:`${head(365,155)}${torso(365,165,365,230)}${line(365,230,330,285)}${line(365,230,400,285)}${line(365,180,410,125)}`,b:`${head(390,190)}${torso(382,195,350,230)}${line(350,230,330,285)}${line(350,230,390,285)}${line(382,195,410,125)}`,arrow:arrow(470,160,430,230)};
  if(id==='rdl') return{equipment:`${rect(200,65,15,250,7,G)}${rect(500,65,15,250,7,G)}${line(185,315,530,315,8,G)}${line(290,220,430,220,8,W)}`,a:`${standing(360,190)}${line(330,180,300,220)}${line(390,180,420,220)}`,b:`${head(420,180)}${torso(410,190,360,225)}${line(360,225,335,285)}${line(360,225,385,285)}${line(390,205,420,220)}${line(330,205,300,220)}`,arrow:arrow(505,155,470,230)};
  return{equipment:'',a:standing(360,190),b:`${standing(360,190)}${line(360,150,295,150)}${line(360,150,425,150)}`,arrow:arrow(485,205,525,160)};
}

function v60V3MotionSvg(ex,large=false){
  const g=v60GuideFor(ex),setCount=v60V3SetCount(ex);
  const palette={blue:['#2138B0','#101845'],lime:['#8DA114','#33410A'],orange:['#E8492A','#7D2413']}[g.accent]||['#2138B0','#101845'];
  const scene=v60V3Scene(ex);
  const id=`v60-v4-${String(ex.id||'exercise').replace(/[^a-z0-9-]/gi,'-')}-${large?'lg':'sm'}`;
  return `<svg class="v60-v3-motion-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 360" role="img" aria-label="demonstração técnica de ${v60V3Esc(ex.name)}">
    <defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="${palette[0]}"/><stop offset="100%" stop-color="${palette[1]}"/></linearGradient></defs>
    <rect width="720" height="360" rx="42" fill="url(#${id})"/><circle cx="625" cy="70" r="72" fill="#fff" opacity=".05"/><circle cx="100" cy="330" r="90" fill="#fff" opacity=".04"/>
    <text x="42" y="46" fill="#FAFAFA" font-family="Arial,Helvetica,sans-serif" font-size="20" font-weight="700">${v60V3Esc(ex.name)}</text><text x="42" y="72" fill="#FAFAFA" opacity=".72" font-family="Arial,Helvetica,sans-serif" font-size="12">${v60V3Esc(ex.equipment)} · ${v60V3Esc(g.focus)}</text>
    <g class="v60-v4-equipment">${scene.equipment}</g><g class="v60-v3-pose v60-v3-pose-a">${scene.a}</g><g class="v60-v3-pose v60-v3-pose-b">${scene.b}</g><g class="v60-v3-arrow">${scene.arrow}</g>
    <rect x="40" y="306" width="128" height="34" rx="17" fill="#C4D82E"/><text x="62" y="329" fill="#111" font-family="Arial,Helvetica,sans-serif" font-size="13" font-weight="800">${setCount} × ${v60V3Esc(ex.min)}-${v60V3Esc(ex.max)}</text><text x="190" y="329" fill="#FAFAFA" font-family="Arial,Helvetica,sans-serif" font-size="12" font-weight="700">${v60V3Esc(g.cue)}</text>
  </svg>`;
}

v60GuidePreview=function(ex){const g=v60GuideFor(ex);return `<button class="exercise-guide-preview v60-v3-preview" id="openExerciseGuide" type="button" aria-label="ver execução de ${v60V3Esc(ex.name)}"><div class="v60-v3-motion-wrap">${v60V3MotionSvg(ex,false)}<span class="v60-v3-loop-badge"><i></i> guia animado</span></div><span class="exercise-guide-caption"><span><b>ver execução</b><small>${v60V3Esc(g.cue)}</small></span><i>↗</i></span></button>`;};

v60ShowGuide=function(ex){v60CloseGuide();const g=v60GuideFor(ex),setCount=v60V3SetCount(ex);document.body.classList.add('v60-guide-open');document.body.insertAdjacentHTML('beforeend',`<div class="v60-guide-backdrop" id="v60GuideBackdrop"></div><aside class="v60-guide-sheet v60-v3-sheet" id="v60GuideSheet" role="dialog" aria-modal="true" aria-label="execução de ${v60V3Esc(ex.name)}"><div class="v60-guide-handle"></div><button class="v60-guide-close" id="v60GuideClose" aria-label="fechar">×</button><div class="v60-guide-content"><span class="v60-guide-kicker">demonstração técnica</span><h2>${v60V3Esc(ex.name)}</h2><p class="v60-guide-equipment">${v60V3Esc(ex.equipment)}</p><div class="v60-v3-motion-wrap v60-v3-motion-large">${v60V3MotionSvg(ex,true)}<span class="v60-v3-loop-badge"><i></i> início ↔ fim</span></div><div class="v60-guide-tags"><span>${v60V3Esc(g.focus)}</span><span>${setCount} × ${v60V3Esc(ex.min)}-${v60V3Esc(ex.max)}</span><span>${v60V3Esc(ex.rest)}s descanso</span></div><section class="v60-guide-tips"><h3>dicas rápidas</h3><ol>${g.tips.map(t=>`<li>${v60V3Esc(t)}</li>`).join('')}</ol></section><section class="v60-guide-error"><span>erro comum</span><p>${v60V3Esc(g.error)}</p></section><button class="cta-lime" id="v60GuideDone">voltar pro treino</button></div></aside>`);$('#v60GuideBackdrop').onclick=v60CloseGuide;$('#v60GuideClose').onclick=v60CloseGuide;$('#v60GuideDone').onclick=v60CloseGuide;};
