window.TRACO_BRAND={name:'Traço',version:'2.3.14',legacyDataPrefix:'v60_'};
const TRACO_THEME_KEY='traco_theme';

function tracoTheme(){
  const value=localStorage.getItem(TRACO_THEME_KEY);
  return value==='dark'?'dark':'light';
}
function tracoApplyTheme(theme){
  const value=theme==='dark'?'dark':'light';
  document.documentElement.dataset.theme=value;
  document.documentElement.style.colorScheme=value;
  const themeMeta=document.querySelector('meta[name="theme-color"]');
  if(themeMeta)themeMeta.setAttribute('content',value==='dark'?'#090909':'#F6F5F0');
  const statusMeta=document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
  if(statusMeta)statusMeta.setAttribute('content',value==='dark'?'black-translucent':'default');
  document.querySelectorAll('[data-traco-theme]').forEach(btn=>{
    const active=btn.dataset.tracoTheme===value;
    btn.classList.toggle('is-active',active);
    btn.setAttribute('aria-checked',String(active));
  });
}
function tracoSetTheme(theme){
  const value=theme==='dark'?'dark':'light';
  localStorage.setItem(TRACO_THEME_KEY,value);
  tracoApplyTheme(value);
  toast(value==='dark'?'modo escuro ativado':'modo claro ativado');
}
tracoApplyTheme(tracoTheme());
document.title='Traço';

exportData=function(){
  const storage={};
  for(let i=0;i<localStorage.length;i++){
    const key=localStorage.key(i);
    if(key&&(key.startsWith('v60_')||key.startsWith('traco_')))storage[key]=localStorage.getItem(key);
  }
  const data={
    brand:'Traço',
    version:'2.3.14',
    sessions:sessions(),
    body:body(),
    settings:settings(),
    storage,
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
  const file=e.target.files?.[0];
  if(!file)return;
  const reader=new FileReader();
  reader.onload=()=>{
    try{
      const data=JSON.parse(reader.result);
      if(data.storage&&typeof data.storage==='object'){
        Object.entries(data.storage).forEach(([key,value])=>{
          if((key.startsWith('v60_')||key.startsWith('traco_'))&&typeof value==='string')localStorage.setItem(key,value);
        });
      }else{
        if(data.sessions)save(K.sessions,data.sessions);
        if(data.body)save(K.body,data.body);
        if(data.settings)save(K.settings,data.settings);
      }
      tracoApplyTheme(tracoTheme());
      toast('backup do Traço importado');
      render();
    }catch{
      alert('arquivo de backup inválido');
    }
  };
  reader.readAsText(file);
};

const tracoBaseRenderHome=renderHome;
renderHome=function(){
  tracoBaseRenderHome();
  const head=document.querySelector('.home-head');
  if(head&&!document.querySelector('.traco-brandmark')){
    head.insertAdjacentHTML('beforebegin','<div class="traco-brandmark">traço <small>treino & evolução</small></div>');
  }
};

const tracoBaseRenderSettings=renderSettings;
renderSettings=function(){
  tracoBaseRenderSettings();
  const intro=document.querySelector('.settings-intro');
  if(intro&&!document.querySelector('.traco-about-card')){
    intro.insertAdjacentHTML('afterend','<section class="traco-about-card"><img src="./assets/traco-icon-180.png" alt=""><div><span>seu app</span><b>Traço</b><small>treino · evolução · constância · versão 2.3.14</small></div></section>');
  }
  const about=document.querySelector('.traco-about-card');
  if(about&&!document.querySelector('.traco-theme-card')){
    const current=tracoTheme();
    about.insertAdjacentHTML('afterend',`<section class="traco-theme-card"><div class="traco-theme-copy"><span>aparência</span><b>tema</b><small>claro em aço ou escuro em preto + vermelho</small></div><div class="traco-theme-segment" role="radiogroup" aria-label="tema do Traço"><button class="traco-theme-option ${current==='light'?'is-active':''}" data-traco-theme="light" role="radio" aria-checked="${current==='light'}">claro</button><button class="traco-theme-option ${current==='dark'?'is-active':''}" data-traco-theme="dark" role="radio" aria-checked="${current==='dark'}">escuro</button></div></section>`);
  }
  document.querySelectorAll('[data-traco-theme]').forEach(btn=>{
    btn.onclick=()=>tracoSetTheme(btn.dataset.tracoTheme);
  });
  tracoApplyTheme(tracoTheme());
};

render();
