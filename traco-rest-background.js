/*
 * Traço Rest Background 1.0
 * Descanso baseado em deadline real + notificações do PWA.
 */
(function(){
  'use strict';

  const VERSION='1.0.0';
  const REST_KEY='traco_rest_deadline_v1';
  const NOTIFY_PREF_KEY='traco_rest_notify_v1';
  let ticker=null;
  let finishing=false;

  function qs(s){return document.querySelector(s);}
  function readRest(){try{return JSON.parse(localStorage.getItem(REST_KEY)||'null')}catch{return null}}
  function writeRest(v){if(v)localStorage.setItem(REST_KEY,JSON.stringify(v));else localStorage.removeItem(REST_KEY)}
  function notifyPref(){return localStorage.getItem(NOTIFY_PREF_KEY)!=='0'}
  function setNotifyPref(on){localStorage.setItem(NOTIFY_PREF_KEY,on?'1':'0')}
  function isStandalone(){return window.matchMedia?.('(display-mode: standalone)').matches||navigator.standalone===true}
  function notificationSupported(){return 'Notification' in window&&'serviceWorker' in navigator}
  function permission(){return notificationSupported()?Notification.permission:'unsupported'}

  function nextMovementLabel(){
    const s=state.activeSession;if(!s)return 'próxima série';
    if(typeof tracoGymNextQueueToken==='function'&&typeof tracoGymSetForToken==='function'){
      const token=tracoGymNextQueueToken(s);
      const item=token?tracoGymSetForToken(s,token):null;
      if(item?.ex?.name)return item.ex.name;
    }
    const ex=s.exercises?.[state.currentExercise];
    return ex?.name||'próxima série';
  }

  async function requestNotifications(){
    if(!notificationSupported()){toast('avisos do sistema não estão disponíveis aqui');return false;}
    if(Notification.permission==='granted'){setNotifyPref(true);updateNotifyStatus();return true;}
    if(Notification.permission==='denied'){setNotifyPref(false);toast('notificações estão bloqueadas no iPhone');updateNotifyStatus();return false;}
    try{
      const result=await Notification.requestPermission();
      const ok=result==='granted';setNotifyPref(ok);updateNotifyStatus();
      toast(ok?'avisos de descanso ativados':'notificação não autorizada');
      return ok;
    }catch{
      toast(isStandalone()?'não consegui ativar os avisos':'adicione o Traço à Tela de Início para usar avisos');
      return false;
    }
  }

  async function systemNotify(meta){
    if(!notifyPref()||!notificationSupported()||Notification.permission!=='granted')return false;
    try{
      const reg=await navigator.serviceWorker.ready;
      await reg.showNotification('Bora pra próxima série', {
        body:'Descanso acabou · '+(meta?.nextLabel||nextMovementLabel()),
        icon:'./assets/traco-icon-192.png',
        badge:'./assets/traco-icon-192.png',
        tag:'traco-rest-finished',
        renotify:true,
        data:{url:'./?rest_done=1',kind:'rest-finished'}
      });
      return true;
    }catch{return false;}
  }

  function remainingSeconds(meta=readRest()){
    if(!meta?.endsAt)return 0;
    return Math.max(0,Math.ceil((Number(meta.endsAt)-Date.now())/1000));
  }

  function updateOverlay(meta=readRest()){
    if(!meta)return;
    const left=remainingSeconds(meta);
    state.restRemaining=left;
    const time=qs('#restTime');if(time)time.textContent=fmtClock(left);
    const end=qs('#tracoRestEndsAt');
    if(end){
      const d=new Date(Number(meta.endsAt));
      end.textContent='volta às '+d.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit',second:'2-digit'});
    }
    updateNotifyStatus();
  }

  function updateNotifyStatus(){
    const el=qs('#tracoRestNotifyStatus');if(!el)return;
    const p=permission();
    if(p==='granted'&&notifyPref()){el.textContent='🔔 aviso ativado';el.dataset.state='on';}
    else if(p==='denied'){el.textContent='🔕 bloqueado no iPhone';el.dataset.state='blocked';}
    else if(p==='unsupported'){el.textContent='aviso indisponível';el.dataset.state='off';}
    else{el.textContent='🔔 ativar aviso';el.dataset.state='off';}
  }

  function showPersistentOverlay(){
    const meta=readRest();if(!meta||remainingSeconds(meta)<=0)return;
    let el=qs('#restOverlay');
    if(!el){
      document.body.insertAdjacentHTML('beforeend',
        '<div class="rest-overlay" id="restOverlay"><div class="rest-inner">'+
        '<span>DESCANSO</span><strong id="restTime">'+fmtClock(remainingSeconds(meta))+'</strong>'+
        '<p id="tracoRestEndsAt"></p>'+
        '<button class="traco-rest-notify" id="tracoRestNotifyStatus" type="button"></button>'+
        '<button id="skipRest">pular descanso</button>'+
        '</div></div>');
      el=qs('#restOverlay');
    }else if(!qs('#tracoRestNotifyStatus')){
      const skip=qs('#skipRest');
      if(skip)skip.insertAdjacentHTML('beforebegin','<p id="tracoRestEndsAt"></p><button class="traco-rest-notify" id="tracoRestNotifyStatus" type="button"></button>');
    }
    el.classList.add('show');
    const skip=qs('#skipRest');if(skip)skip.onclick=()=>stopRest();
    const notify=qs('#tracoRestNotifyStatus');if(notify)notify.onclick=()=>requestNotifications();
    updateOverlay(meta);
  }

  async function finishDeadline(meta,source){
    if(finishing||!meta)return;
    finishing=true;
    clearInterval(ticker);ticker=null;
    clearInterval(state.restTimer);state.restTimer=null;
    state.restRemaining=0;
    writeRest(null);
    qs('#restOverlay')?.remove();

    if(!meta.notified){
      await systemNotify(meta);
    }
    try{haptic()}catch{}
    if(document.visibilityState==='visible'){
      toast(source==='resume'?'descanso acabou enquanto você estava fora · bora':'bora pra próxima série');
      if(state.page==='session')renderSession();
    }
    finishing=false;
  }

  function reconcile(source='tick'){
    const meta=readRest();
    if(!meta){state.restRemaining=0;clearInterval(ticker);ticker=null;return;}
    const currentSession=state.activeSession||load(K.draft,null);
    if(meta.sessionId&&currentSession?.id&&String(meta.sessionId)!==String(currentSession.id)){
      writeRest(null);state.restRemaining=0;clearInterval(ticker);ticker=null;return;
    }
    const left=remainingSeconds(meta);
    state.restRemaining=left;
    if(left<=0){finishDeadline(meta,source);return;}
    if(document.visibilityState==='visible')showPersistentOverlay();
    updateOverlay(meta);
  }

  function beginDeadlineTicker(){
    clearInterval(ticker);
    reconcile('start');
    ticker=setInterval(()=>reconcile('tick'),250);
    state.restTimer=ticker;
  }

  async function maybeAskPermission(){
    if(!notifyPref()||!notificationSupported()||Notification.permission!=='default')return;
    // startRest acontece a partir do toque em “concluir série”, mantendo contexto de gesto do usuário.
    await requestNotifications();
  }

  startRest=function(seconds){
    const duration=Math.max(1,Number(seconds)||Number(settings().defaultRest)||60);
    const s=state.activeSession;
    const meta={
      version:1,
      startedAt:Date.now(),
      endsAt:Date.now()+duration*1000,
      duration,
      sessionId:s?.id||null,
      workoutId:s?.workoutId||null,
      nextLabel:nextMovementLabel(),
      notified:false
    };
    writeRest(meta);
    state.restDeadline=meta.endsAt;
    state.restRemaining=duration;
    showPersistentOverlay();
    beginDeadlineTicker();
    maybeAskPermission();
  };

  showRestOverlay=function(){showPersistentOverlay();};

  beginRestTicker=function(){beginDeadlineTicker();};

  stopRest=function(){
    clearInterval(ticker);ticker=null;
    clearInterval(state.restTimer);state.restTimer=null;
    state.restRemaining=0;
    state.restDeadline=null;
    writeRest(null);
    qs('#restOverlay')?.remove();
    if(state.page==='session')renderSession();
  };

  const baseFinishSession=finishSession;
  finishSession=function(){writeRest(null);clearInterval(ticker);ticker=null;return baseFinishSession();};

  const baseCancelSession=cancelSession;
  cancelSession=function(){writeRest(null);clearInterval(ticker);ticker=null;return baseCancelSession();};

  function restore(){
    const meta=readRest();if(!meta)return;
    const draft=load(K.draft,null);
    if(!draft||!meta.sessionId||String(draft.id)!==String(meta.sessionId)){writeRest(null);return;}
    if(!state.activeSession)state.activeSession=draft;
    const left=remainingSeconds(meta);
    state.restRemaining=left;
    state.restDeadline=meta.endsAt;
    if(left<=0)finishDeadline(meta,'resume');
    else{if(state.page==='session')showPersistentOverlay();beginDeadlineTicker();}
  }

  document.addEventListener('visibilitychange',()=>{
    if(document.visibilityState==='visible')reconcile('resume');
  });
  window.addEventListener('pageshow',()=>setTimeout(()=>reconcile('resume'),0));
  window.addEventListener('focus',()=>setTimeout(()=>reconcile('resume'),0));
  navigator.serviceWorker?.addEventListener?.('message',event=>{
    if(event.data?.type==='TRACO_REST_FOCUS'){reconcile('resume');}
  });

  const baseRenderSettings=renderSettings;
  renderSettings=function(){
    baseRenderSettings();
    const main=qs('.settings-page');if(!main||qs('#tracoRestSettings'))return;
    const p=permission();
    main.insertAdjacentHTML('beforeend',
      '<section class="traco-rest-settings" id="tracoRestSettings"><span>DESCANSO EM BACKGROUND</span><h3>cronômetro real + aviso</h3>'+
      '<p>o tempo usa o relógio real mesmo quando o iPhone suspende o PWA. o aviso do sistema depende da permissão de notificações do iOS.</p>'+
      '<button id="tracoRestSettingsNotify">'+(p==='granted'?'notificações ativadas':p==='denied'?'notificações bloqueadas':'ativar notificações')+'</button></section>');
    const btn=qs('#tracoRestSettingsNotify');if(btn)btn.onclick=requestNotifications;
  };

  setTimeout(restore,0);

  window.TracoRestBackground={
    version:VERSION,
    reconcile,
    requestNotifications,
    remainingSeconds,
    notificationSupported
  };
  document.documentElement.dataset.tracoRestBackground=VERSION;
})();