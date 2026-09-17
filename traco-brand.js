window.TRACO_BRAND={name:'Traço',version:'1.0.0',legacyDataPrefix:'v60_'};
document.title='Traço';

exportData=function(){
  const storage={};
  for(let i=0;i<localStorage.length;i++){
    const key=localStorage.key(i);
    if(key&&(key.startsWith('v60_')||key.startsWith('traco_')))storage[key]=localStorage.getItem(key);
  }
  const data={
    brand:'Traço',
    version:'1.0.0',
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
    intro.insertAdjacentHTML('afterend','<section class="traco-about-card"><img src="./assets/traco-icon-180.png" alt=""><div><span>seu app</span><b>Traço</b><small>treino · evolução · constância · versão 1.0</small></div></section>');
  }
};

render();
