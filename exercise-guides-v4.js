function v60V4Esc(v){return String(v??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[ch]));}
function v60V4SetCount(ex){if(Array.isArray(ex?.sets))return ex.sets.length;const n=Number(ex?.sets);return Number.isFinite(n)&&n>0?n:0;}

function v60V4Scene(ex){
  const id=String(ex?.id||'');
  const W='#FAFAFA', M='rgba(250,250,250,.28)', D='rgba(9,16,55,.28)', L='#C4D82E', H='rgba(196,216,46,.34)';
  const line=(x1,y1,x2,y2,sw=5,c=W)=>`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${c}" stroke-width="${sw}" stroke-linecap="round"/>`;
  const rect=(x,y,w,h,r=5,c=M)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${c}"/>`;
  const circ=(x,y,r,fill='none',stroke=W,sw=4)=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;
  const path=(d,sw=5,c=W,fill='none')=>`<path d="${d}" stroke="${c}" stroke-width="${sw}" fill="${fill}" stroke-linecap="round" stroke-linejoin="round"/>`;
  const label=(x,y,t)=>`<text x="${x}" y="${y}" fill="rgba(250,250,250,.64)" font-family="Arial,Helvetica,sans-serif" font-size="10" font-weight="800" letter-spacing="1.1">${t}</text>`;
  const arrow=(d,tipX,tipY,rot=0)=>`${path(d,7,L)}<g transform="translate(${tipX} ${tipY}) rotate(${rot})"><path d="M -13 -9 L 0 0 L -13 9" stroke="${L}" stroke-width="7" fill="none" stroke-linecap="round" stroke-linejoin="round"/></g>`;
  const head=(x,y)=>circ(x,y,10,'none',W,4);
  const body=(headX,headY,shoulderX,shoulderY,hipX,hipY)=>`${head(headX,headY)}${line(shoulderX,shoulderY,hipX,hipY,6)}`;
  const standing=(x=360,y=174)=>`${body(x,y-62,x,y-48,x,y+4)}${line(x,y+4,x-18,y+54)}${line(x,y+4,x+18,y+54)}`;
  const muscle=(x,y,rx,ry)=>`<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${H}"/>`;
  const cableTower=(x=560,low=false)=>`${rect(x,60,20,250,7,M)}${rect(x-8,70,36,16,6,D)}${circ(x+10,low?280:92,7,M,M,0)}${line(x+10,75,x+10,298,3,M)}${label(x-10,330,'POLIA')}`;
  const smithFrame=()=>`${rect(185,62,16,252,7,M)}${rect(520,62,16,252,7,M)}${line(170,315,552,315,9,M)}${line(193,72,193,300,2,'rgba(250,250,250,.18)')}${line(528,72,528,300,2,'rgba(250,250,250,.18)')}${label(185,338,'SMITH')}`;
  const bench=(incline=false)=>incline?`${line(252,260,390,207,13,M)}${line(255,260,238,310,8,M)}${line(390,207,416,310,8,M)}`:`${line(245,250,410,250,13,M)}${line(255,250,238,310,8,M)}${line(398,250,416,310,8,M)}`;

  function smithBench(incline){
    const eq=`${smithFrame()}${bench(incline)}${line(216,122,505,122,8,W)}${rect(196,103,10,38,2,W)}${rect(184,98,9,48,2,W)}${rect(516,103,10,38,2,W)}${rect(529,98,9,48,2,W)}${label(285,338,incline?'BANCO 30°':'BANCO RETO')}`;
    const a=incline?`${body(315,188,326,199,377,229)}${line(326,201,307,128)}${line(349,210,365,128)}${line(377,229,410,252)}${line(410,252,438,286)}${line(410,252,390,290)}${muscle(349,208,24,12)}`:`${body(308,222,321,224,379,242)}${line(321,225,306,128)}${line(350,232,365,128)}${line(379,242,425,263)}${line(425,263,452,294)}${line(425,263,402,296)}${muscle(347,230,25,11)}`;
    const b=incline?`${body(315,188,326,199,377,229)}${line(326,201,304,166)}${line(349,210,361,166)}${line(304,166,304,124,4)}${line(361,166,361,124,4)}${line(377,229,410,252)}${line(410,252,438,286)}${line(410,252,390,290)}${muscle(349,208,24,12)}`:`${body(308,222,321,224,379,242)}${line(321,225,300,170)}${line(350,232,367,170)}${line(300,170,300,124,4)}${line(367,170,367,124,4)}${line(379,242,425,263)}${line(425,263,452,294)}${line(425,263,402,296)}${muscle(347,230,25,11)}`;
    return{equipment:eq,a,b,motion:arrow('M 585 186 L 585 127',585,127,-90),note:incline?'barra desce ao peito superior':'barra desce ao peito médio'};
  }

  function dumbbellPress(){
    const eq=`${rect(314,230,100,13,6,M)}${rect(358,145,14,90,6,M)}${rect(315,304,100,10,5,M)}${label(302,338,'BANCO + HALTERES')}`;
    const a=`${body(360,142,360,156,360,224)}${line(360,224,338,290)}${line(360,224,382,290)}${line(360,176,326,183)}${line(326,183,310,153)}${line(360,176,394,183)}${line(394,183,410,153)}${circ(310,147,9,W,W,0)}${circ(410,147,9,W,W,0)}${muscle(360,166,23,13)}`;
    const b=`${body(360,142,360,156,360,224)}${line(360,224,338,290)}${line(360,224,382,290)}${line(360,176,335,122)}${line(335,122,330,92)}${line(360,176,385,122)}${line(385,122,390,92)}${circ(330,86,9,W,W,0)}${circ(390,86,9,W,W,0)}${muscle(360,166,23,13)}`;
    return{equipment:eq,a,b,motion:arrow('M 470 198 L 470 108',470,108,-90),note:'halteres sobem acima dos ombros'};
  }

  function cableLateral(unilateral=true){
    const eq=`${cableTower(155,true)}${line(165,280,323,194,3,M)}${label(140,338,'POLIA BAIXA')}`;
    const base=standing(360,182)+muscle(unilateral?350:360,137,unilateral?11:28,8);
    const a=`${base}${line(360,135,334,198)}${unilateral?line(360,135,386,187):line(360,135,388,198)}`;
    const b=`${base}${line(360,135,292,135)}${unilateral?line(360,135,386,187):line(360,135,428,135)}`;
    return{equipment:eq,a,b,motion:arrow('M 447 202 Q 485 174 512 139',512,139,-38),note:'sobe até a linha do ombro'};
  }

  function cableFly(kind){
    const low=kind==='low-high';
    const eq=`${cableTower(120,low)}${cableTower(580,low)}${line(130,low?270:165,315,185,3,M)}${line(590,low?270:165,405,185,3,M)}${label(304,338,low?'CROSSOVER BAIXO':'CROSSOVER')}`;
    const base=standing(360,190)+muscle(360,142,30,12);
    const a=`${base}${line(360,143,300,low?204:166)}${line(360,143,420,low?204:166)}`;
    const b=low?`${base}${line(360,143,337,124)}${line(360,143,383,124)}`:`${base}${line(360,143,334,151)}${line(360,143,386,151)}`;
    return{equipment:eq,a,b,motion:low?arrow('M 275 218 Q 302 164 339 129',339,129,-48):arrow('M 282 190 Q 310 158 338 153',338,153,-25),note:low?'mãos sobem em arco':'fecha na linha do peito'};
  }

  function pushdown(){
    const eq=`${cableTower(555,false)}${line(565,92,440,126,3,M)}${line(440,126,440,169,3,W)}${line(424,169,456,169,6,W)}${label(470,338,'BARRA / CORDA')}`;
    const base=standing(360,192)+muscle(388,164,11,25);
    const a=`${base}${line(360,145,394,157)}${line(394,157,438,174)}`;
    const b=`${base}${line(360,145,394,157)}${line(394,157,407,225)}`;
    return{equipment:eq,a,b,motion:arrow('M 468 159 L 468 223',468,223,90),note:'cotovelo fica preso ao tronco'};
  }

  function overheadTriceps(){
    const eq=`${cableTower(555,false)}${line(565,92,426,108,3,M)}${label(480,338,'CORDA')}`;
    const base=standing(360,194)+muscle(378,128,11,27);
    const a=`${base}${line(360,146,382,119)}${line(382,119,418,150)}`;
    const b=`${base}${line(360,146,382,119)}${line(382,119,424,84)}`;
    return{equipment:eq,a,b,motion:arrow('M 466 160 Q 470 118 451 92',451,92,-125),note:'estende sem abrir os cotovelos'};
  }

  function legPress(mode='standard'){
    const eq=`<path d="M190 300 L285 300 L242 218 Z" fill="${M}"/>${line(230,300,510,120,8,M)}<path d="M505 104 L 598 167 L 530 224 Z" fill="${M}"/>${line(548,81,615,128,13,W)}${label(480,338,'LEG PRESS 45°')}`;
    const high=mode==='high', calf=mode==='calf';
    const base=`${body(286,226,298,235,348,258)}${line(298,235,270,278)}${muscle(calf?445:382,calf?195:244,calf?12:32,calf?20:13)}`;
    if(calf){
      const a=`${base}${line(348,258,424,230)}${line(424,230,500,183)}${line(348,258,421,248)}${line(421,248,498,196)}${line(498,183,514,177,4)}${line(498,196,514,190,4)}`;
      const b=`${base}${line(348,258,424,230)}${line(424,230,510,175)}${line(348,258,421,248)}${line(421,248,509,188)}${line(509,175,528,168,4)}${line(509,188,528,181,4)}`;
      return{equipment:eq,a,b,motion:arrow('M 535 228 L 574 202',574,202,-34),note:'só o tornozelo move; joelhos estáveis'};
    }
    const footY=high?158:184;
    const a=`${base}${line(348,258,398,222)}${line(398,222,482,footY)}${line(348,258,395,249)}${line(395,249,482,footY+15)}`;
    const b=`${base}${line(348,258,425,239)}${line(425,239,522,footY-4)}${line(348,258,423,258)}${line(423,258,520,footY+12)}`;
    return{equipment:eq,a,b,motion:arrow('M 505 255 L 577 205',577,205,-35),note:high?'pés altos; quadril fica apoiado':'joelhos seguem a linha dos pés'};
  }

  function smithSquat(){
    const eq=`${smithFrame()}${line(276,138,444,138,9,W)}${label(283,338,'BARRA GUIADA')}`;
    const a=`${standing(360,188)}${line(320,139,400,139,5,W)}${line(339,168,319,139)}${line(381,168,401,139)}${muscle(360,232,30,18)}`;
    const b=`${body(360,169,360,182,360,228)}${line(360,228,326,261)}${line(326,261,300,300)}${line(360,228,396,261)}${line(396,261,424,300)}${line(321,159,405,159,7,W)}${line(340,191,321,159)}${line(380,191,405,159)}${muscle(360,233,31,18)}`;
    return{equipment:eq,a,b,motion:arrow('M 565 150 L 565 244',565,244,90),note:'barra vertical; quadril desce controlado'};
  }

  function legExtension(){
    const eq=`${rect(246,226,155,14,7,M)}${rect(328,130,15,101,7,M)}${rect(245,304,170,10,5,M)}${rect(420,230,62,14,7,M)}${circ(466,282,13,M,M,0)}${label(290,338,'EXTENSORA')}`;
    const base=`${body(332,143,332,157,332,220)}${line(332,220,386,237)}${muscle(369,230,26,11)}`;
    const a=`${base}${line(386,237,405,291)}${circ(405,291,6,W,W,0)}`;
    const b=`${base}${line(386,237,481,240)}${circ(481,240,6,W,W,0)}`;
    return{equipment:eq,a,b,motion:arrow('M 461 288 Q 492 272 519 241',519,241,-45),note:'joelho alinhado ao eixo da máquina'};
  }

  function seatedLegCurl(){
    const eq=`${rect(246,226,155,14,7,M)}${rect(328,130,15,101,7,M)}${rect(245,304,170,10,5,M)}${rect(420,230,62,14,7,M)}${circ(460,266,13,M,M,0)}${label(294,338,'FLEXORA')}`;
    const base=`${body(332,143,332,157,332,220)}${line(332,220,386,237)}${muscle(367,236,25,10)}`;
    const a=`${base}${line(386,237,478,264)}${circ(478,264,6,W,W,0)}`;
    const b=`${base}${line(386,237,431,204)}${circ(431,204,6,W,W,0)}`;
    return{equipment:eq,a,b,motion:arrow('M 509 272 Q 477 242 447 211',447,211,-135),note:'calcanhar vem para baixo/atrás'};
  }

  function abductor(){
    const eq=`${rect(260,225,140,14,7,M)}${rect(330,130,15,101,7,M)}${rect(255,304,160,10,5,M)}${rect(296,250,16,35,6,M)}${rect(388,250,16,35,6,M)}${label(286,338,'ABDUTORA')}`;
    const base=`${body(332,143,332,157,332,220)}${muscle(332,220,32,15)}`;
    const a=`${base}${line(332,220,313,266)}${line(332,220,351,266)}`;
    const b=`${base}${line(332,220,270,266)}${line(332,220,394,266)}`;
    return{equipment:eq,a,b,motion:arrow('M 438 263 L 507 263',507,263,0),note:'abre sem jogar o tronco'};
  }

  function pulldown(grip='wide'){
    const neutral=grip==='neutral';
    const bar=neutral?`${line(337,117,383,117,8,W)}${line(344,117,344,132,5,W)}${line(376,117,376,132,5,W)}`:line(298,117,422,117,9,W);
    const eq=`${cableTower(535,false)}${line(360,88,545,88,7,M)}${line(360,88,360,117,3,M)}${bar}${rect(320,260,82,12,6,M)}${rect(330,280,62,9,5,M)}${label(304,338,neutral?'PUXADOR NEUTRO':'PUXADA ABERTA')}`;
    const base=`${body(360,180,360,193,360,252)}${line(360,252,336,302)}${line(360,252,386,302)}${muscle(360,207,30,22)}`;
    const a=neutral?`${base}${line(360,208,344,132)}${line(360,208,376,132)}`:`${base}${line(360,208,312,117)}${line(360,208,408,117)}`;
    const b=neutral?`${base}${line(360,208,338,169)}${line(338,169,344,149)}${line(360,208,382,169)}${line(382,169,376,149)}${line(344,149,376,149,7,W)}`:`${base}${line(360,208,325,169)}${line(325,169,309,150)}${line(360,208,395,169)}${line(395,169,411,150)}${line(312,150,408,150,8,W)}`;
    return{equipment:eq,a,b,motion:arrow('M 470 116 L 470 179',470,179,90),note:neutral?'cotovelos descem perto do tronco':'cotovelos descem para as costelas'};
  }

  function seatedRow(){
    const eq=`${cableTower(545,true)}${rect(252,272,105,13,6,M)}${line(555,213,435,220,3,M)}${line(435,220,420,220,7,W)}${label(286,338,'REMADA BAIXA')}`;
    const base=`${body(348,166,350,178,350,241)}${line(350,241,318,295)}${line(350,241,392,295)}${muscle(350,203,28,23)}`;
    const a=`${base}${line(350,205,434,220)}`;
    const b=`${base}${line(350,205,393,205)}${line(393,205,421,220)}`;
    return{equipment:eq,a,b,motion:arrow('M 486 241 L 425 221',425,221,-162),note:'cabo vem ao abdômen'};
  }

  function straightArmPulldown(){
    const eq=`${cableTower(548,false)}${line(558,90,428,108,3,M)}${line(410,108,447,108,7,W)}${label(300,338,'PULLOVER NA POLIA')}`;
    const base=`${standing(350,194)}${muscle(350,164,26,28)}`;
    const a=`${base}${line(350,147,398,110)}${line(398,110,430,108)}`;
    const b=`${base}${line(350,147,389,192)}${line(389,192,424,222)}`;
    return{equipment:eq,a,b,motion:arrow('M 475 118 Q 472 178 450 224',450,224,110),note:'braços quase estendidos fazem um arco'};
  }

  function reverseFly(){
    const eq=`${cableTower(120,false)}${cableTower(580,false)}${line(130,170,330,170,3,M)}${line(590,170,390,170,3,M)}${label(292,338,'CROSSOVER DUPLO')}`;
    const base=`${standing(360,192)}${muscle(360,136,36,11)}`;
    const a=`${base}${line(360,145,334,171)}${line(360,145,386,171)}`;
    const b=`${base}${line(360,145,286,146)}${line(360,145,434,146)}`;
    return{equipment:eq,a,b,motion:arrow('M 432 205 Q 472 179 505 148',505,148,-42),note:'abre os braços para trás na linha dos ombros'};
  }

  function cableCurl(unilateral=false){
    const eq=`${cableTower(545,true)}${line(555,282,419,238,3,M)}${unilateral?line(413,236,426,240,6,W):line(398,238,438,238,7,W)}${label(315,338,unilateral?'ROSCA UNILATERAL':'ROSCA NA POLIA')}`;
    const base=`${standing(350,194)}${muscle(unilateral?385:350,159,unilateral?10:25,16)}`;
    const a=unilateral?`${base}${line(350,146,390,226)}${line(350,146,330,218)}`:`${base}${line(350,146,325,224)}${line(350,146,395,224)}`;
    const b=unilateral?`${base}${line(350,146,385,173)}${line(385,173,407,139)}${line(350,146,330,218)}`:`${base}${line(350,146,330,173)}${line(330,173,325,139)}${line(350,146,390,173)}${line(390,173,395,139)}`;
    return{equipment:eq,a,b,motion:arrow('M 464 230 Q 450 185 426 150',426,150,-115),note:unilateral?'um braço por vez; tronco parado':'cotovelos ficam ao lado do corpo'};
  }

  function hammerCurl(){
    const eq=`${circ(324,238,10,W,W,0)}${circ(396,238,10,W,W,0)}${label(310,338,'HALTERES')}`;
    const base=`${standing(360,194)}${muscle(360,158,25,16)}`;
    const a=`${base}${line(360,146,325,226)}${line(360,146,395,226)}${circ(325,232,9,W,W,0)}${circ(395,232,9,W,W,0)}`;
    const b=`${base}${line(360,146,331,173)}${line(331,173,325,139)}${line(360,146,389,173)}${line(389,173,395,139)}${circ(325,133,9,W,W,0)}${circ(395,133,9,W,W,0)}`;
    return{equipment:eq,a,b,motion:arrow('M 468 226 L 468 145',468,145,-90),note:'pegada neutra do início ao fim'};
  }

  function kneelingCrunch(){
    const eq=`${cableTower(548,false)}${line(558,91,414,124,3,M)}${path('M 407 120 Q 416 129 424 120',5,W)}${label(315,338,'CORDA · POLIA ALTA')}`;
    const a=`${body(363,154,365,167,365,232)}${line(365,232,331,287)}${line(365,232,401,287)}${line(365,181,414,124)}${muscle(365,199,17,30)}`;
    const b=`${body(391,191,383,198,351,232)}${line(351,232,331,287)}${line(351,232,391,287)}${line(383,198,414,124)}${muscle(371,215,18,23)}`;
    return{equipment:eq,a,b,motion:arrow('M 477 157 Q 462 205 428 235',428,235,138),note:'fecha costelas em direção ao quadril'};
  }

  function facePull(){
    const eq=`${cableTower(548,false)}${line(558,92,453,151,3,M)}${path('M 445 147 Q 453 157 461 147',5,W)}${label(330,338,'CORDA · POLIA ALTA')}`;
    const base=`${standing(360,192)}${muscle(360,136,35,12)}`;
    const a=`${base}${line(360,145,414,162)}${line(414,162,453,151)}`;
    const b=`${base}${line(360,145,395,132)}${line(395,132,420,119)}${line(360,145,385,155)}${line(385,155,420,119)}`;
    return{equipment:eq,a,b,motion:arrow('M 485 181 Q 455 151 425 122',425,122,-135),note:'corda vem ao rosto e mãos se abrem'};
  }

  function smithRdl(){
    const eq=`${smithFrame()}${line(292,223,430,223,9,W)}${label(294,338,'STIFF / RDL')}`;
    const a=`${standing(360,190)}${line(330,181,301,223)}${line(390,181,420,223)}${muscle(360,238,25,28)}`;
    const b=`${body(420,180,410,193,359,228)}${line(359,228,335,290)}${line(359,228,386,290)}${line(389,208,420,223)}${line(330,208,301,223)}${muscle(366,244,23,29)}`;
    return{equipment:eq,a,b,motion:arrow('M 505 151 Q 500 201 469 235',469,235,132),note:'quadril vai para trás; coluna neutra'};
  }

  const scenes={
    'supino-inclinado':()=>smithBench(true),
    'desenvolvimento':dumbbellPress,
    'elevacao-lateral':()=>cableLateral(true),
    'crucifixo-baixo-alto':()=>cableFly('low-high'),
    'triceps-pushdown':pushdown,
    'triceps-overhead':overheadTriceps,
    'leg-press':()=>legPress('standard'),
    'agachamento-smith':smithSquat,
    'extensora':legExtension,
    'flexora':seatedLegCurl,
    'abdutora':abductor,
    'panturrilha':()=>legPress('calf'),
    'puxada-aberta':()=>pulldown('wide'),
    'remada-baixa':seatedRow,
    'pullover':straightArmPulldown,
    'crucifixo-inverso':reverseFly,
    'rosca-polia':()=>cableCurl(false),
    'rosca-martelo':hammerCurl,
    'crunch':kneelingCrunch,
    'supino-reto':()=>smithBench(false),
    'crucifixo-reto':()=>cableFly('horizontal'),
    'elevacao-lateral-2':()=>cableLateral(true),
    'face-pull':facePull,
    'triceps-overhead-2':overheadTriceps,
    'rosca-unilateral':()=>cableCurl(true),
    'rdl':smithRdl,
    'flexora-2':seatedLegCurl,
    'leg-press-alto':()=>legPress('high'),
    'puxada-neutra':()=>pulldown('neutral'),
    'elevacao-lateral-3':()=>cableLateral(true),
    'abdutora-2':abductor,
    'crunch-2':kneelingCrunch
  };
  return (scenes[id]||(()=>({equipment:'',a:standing(),b:standing(),motion:'',note:'execução controlada'})))();
}

function v60V4MotionSvg(ex,large=false){
  const g=v60GuideFor(ex), scene=v60V4Scene(ex), setCount=v60V4SetCount(ex);
  const palette={blue:['#2138B0','#101845'],lime:['#8DA114','#33410A'],orange:['#E8492A','#7D2413']}[g.accent]||['#2138B0','#101845'];
  const gid=`v60-v4-${String(ex.id||'exercise').replace(/[^a-z0-9-]/gi,'-')}-${large?'lg':'sm'}`;
  return `<svg class="v60-v4-motion-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 360" role="img" aria-label="guia animado de ${v60V4Esc(ex.name)}">
    <defs><linearGradient id="${gid}" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="${palette[0]}"/><stop offset="100%" stop-color="${palette[1]}"/></linearGradient></defs>
    <rect width="720" height="360" rx="42" fill="url(#${gid})"/><circle cx="625" cy="70" r="72" fill="#fff" opacity=".05"/><circle cx="100" cy="330" r="90" fill="#fff" opacity=".04"/>
    <text x="42" y="43" fill="#FAFAFA" font-family="Arial,Helvetica,sans-serif" font-size="20" font-weight="800">${v60V4Esc(ex.name)}</text>
    <text x="42" y="67" fill="#FAFAFA" opacity=".72" font-family="Arial,Helvetica,sans-serif" font-size="12">${v60V4Esc(ex.equipment)} · ${v60V4Esc(g.focus)}</text>
    <g class="v60-v4-equipment">${scene.equipment}</g><g class="v60-v4-pose v60-v4-pose-a">${scene.a}</g><g class="v60-v4-pose v60-v4-pose-b">${scene.b}</g><g class="v60-v4-arrow">${scene.motion}</g>
    <rect x="40" y="306" width="128" height="34" rx="17" fill="#C4D82E"/><text x="62" y="329" fill="#111" font-family="Arial,Helvetica,sans-serif" font-size="13" font-weight="900">${setCount} × ${v60V4Esc(ex.min)}-${v60V4Esc(ex.max)}</text>
    <text x="190" y="329" fill="#FAFAFA" font-family="Arial,Helvetica,sans-serif" font-size="12" font-weight="700">${v60V4Esc(scene.note)}</text>
  </svg>`;
}

v60GuidePreview=function(ex){
  const g=v60GuideFor(ex);
  return `<button class="exercise-guide-preview v60-v4-preview" id="openExerciseGuide" type="button" aria-label="ver execução de ${v60V4Esc(ex.name)}"><div class="v60-v4-motion-wrap">${v60V4MotionSvg(ex,false)}<span class="v60-v4-loop-badge"><i></i> guia animado</span></div><span class="exercise-guide-caption"><span><b>ver execução</b><small>${v60V4Esc(g.cue)}</small></span><i>↗</i></span></button>`;
};

v60ShowGuide=function(ex){
  v60CloseGuide();
  const g=v60GuideFor(ex),setCount=v60V4SetCount(ex),scene=v60V4Scene(ex);
  document.body.classList.add('v60-guide-open');
  document.body.insertAdjacentHTML('beforeend',`<div class="v60-guide-backdrop" id="v60GuideBackdrop"></div><aside class="v60-guide-sheet v60-v4-sheet" id="v60GuideSheet" role="dialog" aria-modal="true" aria-label="execução de ${v60V4Esc(ex.name)}"><div class="v60-guide-handle"></div><button class="v60-guide-close" id="v60GuideClose" aria-label="fechar">×</button><div class="v60-guide-content"><span class="v60-guide-kicker">demonstração técnica animada</span><h2>${v60V4Esc(ex.name)}</h2><p class="v60-guide-equipment">${v60V4Esc(ex.equipment)}</p><div class="v60-v4-motion-wrap v60-v4-motion-large">${v60V4MotionSvg(ex,true)}<span class="v60-v4-loop-badge"><i></i> início ↔ fim</span></div><p class="v60-v4-tech-note">${v60V4Esc(scene.note)}</p><div class="v60-guide-tags"><span>${v60V4Esc(g.focus)}</span><span>${setCount} × ${v60V4Esc(ex.min)}-${v60V4Esc(ex.max)}</span><span>${v60V4Esc(ex.rest)}s descanso</span></div><section class="v60-guide-tips"><h3>dicas rápidas</h3><ol>${g.tips.map(t=>`<li>${v60V4Esc(t)}</li>`).join('')}</ol></section><section class="v60-guide-error"><span>erro comum</span><p>${v60V4Esc(g.error)}</p></section><button class="cta-lime" id="v60GuideDone">voltar pro treino</button></div></aside>`);
  $('#v60GuideBackdrop').onclick=v60CloseGuide;$('#v60GuideClose').onclick=v60CloseGuide;$('#v60GuideDone').onclick=v60CloseGuide;
};

window.V60_GUIDE_SCENE_IDS=[
  'supino-inclinado','desenvolvimento','elevacao-lateral','crucifixo-baixo-alto','triceps-pushdown','triceps-overhead','leg-press','agachamento-smith','extensora','flexora','abdutora','panturrilha','puxada-aberta','remada-baixa','pullover','crucifixo-inverso','rosca-polia','rosca-martelo','crunch','supino-reto','crucifixo-reto','elevacao-lateral-2','face-pull','triceps-overhead-2','rosca-unilateral','rdl','flexora-2','leg-press-alto','puxada-neutra','elevacao-lateral-3','abdutora-2','crunch-2'
];
