const TRACO_NAME='Traço';
const TRACO_VERSION='1.0.0';

document.title='Traço — treino e evolução';

function tracoBrandMark(){
  return '<span class="traco-mark" aria-label="Traço"><img src="./assets/icon.svg" alt="" /><b>traço</b></span>';
}

const tracoBaseRenderHome=renderHome;
renderHome=function(){
  tracoBaseRenderHome();
  const head=document.querySelector('.home-head');
  if(head&&!head.querySelector('.traco-mark')){
    const profile=head.querySelector('.profile-btn');
    profile?.insertAdjacentHTML('beforebegin',tracoBrandMark());
  }
};

const tracoBaseRenderSettings=renderSettings;
renderSettings=function(){
  tracoBaseRenderSettings();
  const intro=document.querySelector('.settings-intro');
  if(intro&&!document.querySelector('.traco-identity-card')){
    intro.insertAdjacentHTML('beforebegin',`<section class="traco-identity-card"><img src="./assets/icon.svg" alt="ícone Traço"><div><span>seu treino vive aqui.</span><b>Traço</b><small>versão ${TRACO_VERSION}</small></div></section>`);
  }
};

exportData=function(){
  const data={
    app:TRACO_NAME,
    version:TRACO_VERSION,
    sessions:sessions(),
    body:body(),
    settings:settings(),
    profile:typeof v60Profile==='function'?v60Profile():load('v60_profile',{}),
    attendance:typeof v60LoadAttendance==='function'?v60LoadAttendance():load('v60_attendance_v1',[]),
    smartSequence:typeof v60SequenceState==='function'?v60SequenceState():load('v60_smart_sequence_v1',null),
    absDefaults:load('v60_abs_defaults',null),
    exportedAt:new Date().toISOString()
  };
  const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
  const a=document.createElement('a');
  a.href=URL.createObjectURL(blob);
  a.download='traco-backup.json';
  a.click();
  URL.revokeObjectURL(a.href);
};

importData=function(e){
  const f=e.target.files?.[0];if(!f)return;
  const r=new FileReader();
  r.onload=()=>{
    try{
      const d=JSON.parse(r.result);
      if(d.sessions)save(K.sessions,d.sessions);
      if(d.body)save(K.body,d.body);
      if(d.settings)save(K.settings,d.settings);
      if(d.profile)save('v60_profile',d.profile);
      if(d.attendance)save('v60_attendance_v1',d.attendance);
      if(d.smartSequence)save('v60_smart_sequence_v1',d.smartSequence);
      if(d.absDefaults)save('v60_abs_defaults',d.absDefaults);
      toast('backup Traço importado');
      render();
    }catch{alert('arquivo de backup inválido')}
  };
  r.readAsText(f);
};

render();
