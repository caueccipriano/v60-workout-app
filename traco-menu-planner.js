/*
 * Traço Menu Planner 1.0
 * Cardápios flexíveis, trocas, porção, favoritos e lista de compras.
 */
(function(){
  'use strict';

  const VERSION='1.0.0';
  const STATE_KEY='traco_menu_planner_v1';
  const FAV_KEY='traco_menu_favorites_v1';
  const GROCERY_KEY='traco_grocery_v1';
  const SLOTS=['breakfast','lunch','snack','dinner'];
  const LABELS={breakfast:'café',lunch:'almoço',snack:'lanche',dinner:'jantar'};
  const esc=v=>String(v==null?'':v).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[ch]));
  const read=(k,d)=>{try{const v=JSON.parse(localStorage.getItem(k));return v==null?d:v}catch{return d}};
  const write=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
  const meal=(text,items)=>({text,items});

  const MODES={
    training:{
      label:'dia de treino',icon:'↗',desc:'energia para treinar + proteína distribuída',
      meals:{
        breakfast:[meal('ovos + pão + banana',['ovos','pão','banana']),meal('iogurte + aveia + banana',['iogurte','aveia','banana'])],
        lunch:[meal('arroz + feijão + frango + salada',['arroz','feijão','frango','salada']),meal('carne magra + batata + legumes',['carne magra','batata','legumes'])],
        snack:[meal('iogurte + fruta + aveia',['iogurte','fruta','aveia']),meal('sanduíche de frango ou atum',['pão','frango/atum','tomate'])],
        dinner:[meal('arroz + frango + legumes',['arroz','frango','legumes']),meal('omelete + pão + salada',['ovos','pão','salada'])]
      }
    },
    rest:{
      label:'dia sem treino',icon:'○',desc:'saciedade e proteína sem precisar “compensar”',
      meals:{
        breakfast:[meal('ovos + fruta + pão',['ovos','fruta','pão']),meal('iogurte + fruta + aveia',['iogurte','fruta','aveia'])],
        lunch:[meal('arroz + feijão + proteína + bastante salada',['arroz','feijão','frango/carne/atum','salada']),meal('batata + carne/frango + legumes',['batata','carne/frango','legumes'])],
        snack:[meal('fruta + iogurte',['fruta','iogurte']),meal('pão + queijo/ovos',['pão','queijo/ovos'])],
        dinner:[meal('omelete + legumes + pão',['ovos','legumes','pão']),meal('proteína + legumes + arroz',['frango/carne/atum','legumes','arroz'])]
      }
    },
    morning:{
      label:'treino de manhã',icon:'☀',desc:'pré simples e refeição boa depois do treino',
      labels:{breakfast:'pré / café',lunch:'pós-treino',snack:'lanche',dinner:'jantar'},
      meals:{
        breakfast:[meal('banana + iogurte; depois ovos + pão',['banana','iogurte','ovos','pão']),meal('pão + queijo; depois iogurte + aveia + fruta',['pão','queijo','iogurte','aveia','fruta'])],
        lunch:[meal('arroz + feijão + frango + legumes',['arroz','feijão','frango','legumes']),meal('massa + carne magra + salada',['massa','carne magra','salada'])],
        snack:[meal('iogurte + fruta',['iogurte','fruta']),meal('sanduíche proteico',['pão','frango/atum/ovos','tomate'])],
        dinner:[meal('proteína + arroz/batata + vegetais',['frango/carne/atum','arroz/batata','vegetais']),meal('omelete + pão + salada',['ovos','pão','salada'])]
      }
    },
    evening:{
      label:'treino à noite',icon:'☾',desc:'lanche pré-treino fácil + jantar pós sem exagero',
      labels:{breakfast:'café',lunch:'almoço',snack:'pré-treino',dinner:'pós-treino'},
      meals:{
        breakfast:[meal('ovos + pão + fruta',['ovos','pão','fruta']),meal('iogurte + aveia + banana',['iogurte','aveia','banana'])],
        lunch:[meal('arroz + feijão + frango + salada',['arroz','feijão','frango','salada']),meal('carne magra + batata + legumes',['carne magra','batata','legumes'])],
        snack:[meal('pão + frango/atum + fruta',['pão','frango/atum','fruta']),meal('iogurte + banana + aveia',['iogurte','banana','aveia'])],
        dinner:[meal('arroz + proteína + legumes',['arroz','frango/carne/atum','legumes']),meal('omelete + pão + salada',['ovos','pão','salada'])]
      }
    },
    busy:{
      label:'dia corrido',icon:'⚡',desc:'mínimo de preparo e opções fáceis de levar',
      meals:{
        breakfast:[meal('iogurte + banana + aveia',['iogurte','banana','aveia']),meal('ovos + pão',['ovos','pão'])],
        lunch:[meal('PF simples: arroz + feijão + frango + salada',['arroz','feijão','frango','salada']),meal('marmita: carne/frango + arroz + legumes',['carne/frango','arroz','legumes'])],
        snack:[meal('iogurte + fruta',['iogurte','fruta']),meal('sanduíche de atum/frango',['pão','atum/frango','tomate'])],
        dinner:[meal('omelete + pão + tomate',['ovos','pão','tomate']),meal('marmita pronta com proteína + carbo + legumes',['proteína pronta','arroz/batata','legumes'])]
      }
    },
    weekend:{
      label:'fim de semana',icon:'✦',desc:'mais flexível sem transformar uma refeição em “dia perdido”',
      meals:{
        breakfast:[meal('café normal: ovos + pão + fruta',['ovos','pão','fruta']),meal('iogurte + fruta + aveia',['iogurte','fruta','aveia'])],
        lunch:[meal('refeição livre consciente + proteína no prato',['refeição escolhida','proteína','salada/legumes']),meal('arroz + feijão + carne + salada',['arroz','feijão','carne','salada'])],
        snack:[meal('se houver fome: iogurte ou fruta',['iogurte/fruta']),meal('doce que você realmente queira + bebida sem calorias',['sobremesa escolhida','água/refrigerante zero'])],
        dinner:[meal('jantar simples e proteico',['ovos/frango/atum','pão/arroz','salada']),meal('pizza/hambúrguer em porção que satisfaça + segue normal depois',['refeição escolhida','água/refrigerante zero'])]
      }
    },
    lean:{
      label:'secar sem radicalizar',icon:'◇',desc:'mais saciedade e menos calorias líquidas/fritura frequente',
      meals:{
        breakfast:[meal('ovos + fruta + pão',['ovos','fruta','pão']),meal('iogurte + fruta + aveia',['iogurte','fruta','aveia'])],
        lunch:[meal('proteína + arroz/feijão + metade do prato de vegetais',['frango/carne/atum','arroz','feijão','vegetais']),meal('batata + frango + salada grande',['batata','frango','salada'])],
        snack:[meal('iogurte + fruta',['iogurte','fruta']),meal('ovos + fruta',['ovos','fruta'])],
        dinner:[meal('proteína + legumes + arroz/batata conforme fome',['frango/carne/atum','legumes','arroz/batata']),meal('omelete grande + salada + pão',['ovos','salada','pão'])]
      }
    },
    hungry:{
      label:'muita fome',icon:'◉',desc:'mais volume, fibra e proteína para aumentar saciedade',
      meals:{
        breakfast:[meal('omelete + pão + mamão',['ovos','pão','mamão']),meal('iogurte + aveia + banana + fruta extra',['iogurte','aveia','banana','fruta'])],
        lunch:[meal('arroz + feijão + proteína + salada grande + legumes',['arroz','feijão','frango/carne','salada','legumes']),meal('batata + carne/frango + legumes + feijão',['batata','carne/frango','legumes','feijão'])],
        snack:[meal('iogurte + fruta + aveia',['iogurte','fruta','aveia']),meal('sanduíche proteico + fruta',['pão','frango/atum/ovos','fruta'])],
        dinner:[meal('prato grande de vegetais + proteína + carbo',['vegetais','frango/carne/atum','arroz/batata']),meal('omelete + salada + pão + fruta',['ovos','salada','pão','fruta'])]
      }
    },
    sweet:{
      label:'vontade de doce',icon:'♡',desc:'doce planejado, sem precisar “compensar” depois',
      meals:{
        breakfast:[meal('iogurte + banana + aveia + canela',['iogurte','banana','aveia','canela']),meal('ovos + pão + fruta',['ovos','pão','fruta'])],
        lunch:[meal('arroz + feijão + proteína + salada; sobremesa pequena escolhida',['arroz','feijão','frango/carne','salada','sobremesa escolhida']),meal('carne/frango + batata + legumes; chocolate depois',['carne/frango','batata','legumes','chocolate'])],
        snack:[meal('iogurte + fruta + chocolate',['iogurte','fruta','chocolate']),meal('banana + aveia + iogurte',['banana','aveia','iogurte'])],
        dinner:[meal('jantar normal com proteína + vegetais + carbo',['frango/carne/atum','vegetais','arroz/batata']),meal('omelete + pão + salada',['ovos','pão','salada'])]
      }
    },
    economic:{
      label:'econômico',icon:'$',desc:'base barata, repetível e fácil de comprar',
      meals:{
        breakfast:[meal('ovos + pão + banana',['ovos','pão','banana']),meal('aveia + banana + leite/iogurte',['aveia','banana','leite/iogurte'])],
        lunch:[meal('arroz + feijão + frango + salada da estação',['arroz','feijão','frango','salada']),meal('arroz + ovos + feijão + legumes',['arroz','ovos','feijão','legumes'])],
        snack:[meal('banana + aveia',['banana','aveia']),meal('pão + ovos',['pão','ovos'])],
        dinner:[meal('arroz + feijão + ovos/frango + legumes',['arroz','feijão','ovos/frango','legumes']),meal('omelete + pão + tomate',['ovos','pão','tomate'])]
      }
    },
    out:{
      label:'vou comer fora',icon:'⌁',desc:'estrutura simples para escolher bem sem transformar restaurante em problema',
      meals:{
        breakfast:[meal('café simples com proteína + fruta',['ovos/iogurte','pão/aveia','fruta']),meal('iogurte + fruta + aveia',['iogurte','fruta','aveia'])],
        lunch:[meal('no restaurante: proteína + carbo que você gosta + vegetais',['proteína','arroz/batata/massa','salada/legumes']),meal('PF: arroz + feijão + carne/frango + salada',['arroz','feijão','carne/frango','salada'])],
        snack:[meal('se der fome: iogurte ou fruta',['iogurte/fruta']),meal('café + sanduíche simples',['café','pão','queijo/frango/atum'])],
        dinner:[meal('se o almoço foi grande: jantar simples com proteína',['ovos/frango/atum','salada/legumes','pão/arroz']),meal('se ainda vai comer fora: escolha o que quer e pare satisfeito',['refeição escolhida','água/refrigerante zero'])]
      }
    }
  };

  function blankState(){
    return {answers:{training:'yes',hunger:'normal',out:'no'},mode:'training',portion:'normal',indexes:{breakfast:0,lunch:0,snack:0,dinner:0},updatedAt:Date.now()};
  }
  function state(){return Object.assign(blankState(),read(STATE_KEY,{}))}
  function saveState(patch){
    const cur=state(),next=Object.assign({},cur,patch,{updatedAt:Date.now()});
    next.answers=Object.assign({},cur.answers||{},patch.answers||{});
    next.indexes=Object.assign({},cur.indexes||{},patch.indexes||{});
    write(STATE_KEY,next);return next;
  }
  function favorites(){return read(FAV_KEY,[])}
  function toggleFavorite(text){
    const set=new Set(favorites());
    set.has(text)?set.delete(text):set.add(text);
    write(FAV_KEY,[...set]);
  }
  function mode(){return MODES[state().mode]||MODES.training}
  function slotLabel(k){return mode().labels?.[k]||LABELS[k]}
  function selectedMeal(k){
    const s=state(),arr=mode().meals[k]||[],i=Math.max(0,Number(s.indexes?.[k]||0))%Math.max(1,arr.length);
    return arr[i]||meal('escolha uma opção',[]);
  }
  function portionHint(){
    return {
      light:'porção leve · mantenha a proteína e reduza um pouco o carbo/volume se a fome estiver baixa.',
      normal:'porção normal · coma até ficar satisfeito, sem precisar “limpar o prato”.',
      reinforced:'porção reforçada · aumente principalmente carbo/volume da refeição quando a fome ou treino pedirem.'
    }[state().portion]||'';
  }
  function buildFromAnswers(){
    const s=state(),a=s.answers||{};
    const m=a.out==='yes'?'out':(a.training==='yes'?'training':'rest');
    const p=a.hunger==='low'?'light':a.hunger==='high'?'reinforced':'normal';
    saveState({mode:m,portion:p,indexes:{breakfast:0,lunch:0,snack:0,dinner:0}});
  }
  function groceryItems(){
    const out=[];
    SLOTS.forEach(k=>selectedMeal(k).items.forEach(x=>out.push(x)));
    return [...new Set(out)];
  }
  function mealCard(k){
    const m=selectedMeal(k),fav=favorites().includes(m.text);
    return '<article class="traco-menu-meal"><header><span>'+esc(slotLabel(k))+'</span><button data-menu-fav="'+k+'" aria-label="favoritar">'+(fav?'♥':'♡')+'</button></header><b>'+esc(m.text)+'</b><div><button data-menu-swap="'+k+'">trocar</button></div></article>';
  }
  function builderMarkup(){
    const s=state(),a=s.answers||{};
    return '<section class="traco-menu-builder"><span>MONTA MEU DIA</span><h4>3 toques e pronto</h4>'+
      '<div class="traco-menu-question"><b>vai treinar?</b><div><button data-menu-answer="training|yes" class="'+(a.training==='yes'?'is-on':'')+'">sim</button><button data-menu-answer="training|no" class="'+(a.training==='no'?'is-on':'')+'">não</button></div></div>'+
      '<div class="traco-menu-question"><b>como está a fome?</b><div><button data-menu-answer="hunger|low" class="'+(a.hunger==='low'?'is-on':'')+'">baixa</button><button data-menu-answer="hunger|normal" class="'+(a.hunger==='normal'?'is-on':'')+'">normal</button><button data-menu-answer="hunger|high" class="'+(a.hunger==='high'?'is-on':'')+'">alta</button></div></div>'+
      '<div class="traco-menu-question"><b>vai comer fora?</b><div><button data-menu-answer="out|yes" class="'+(a.out==='yes'?'is-on':'')+'">sim</button><button data-menu-answer="out|no" class="'+(a.out==='no'?'is-on':'')+'">não</button></div></div>'+
      '<button class="traco-menu-build" id="tracoMenuBuild">montar meu dia</button></section>';
  }
  function presetMarkup(){
    const s=state();
    return '<details class="traco-menu-contexts"><summary><div><span>TROCAR CONTEXTO</span><b>'+esc(mode().label)+'</b></div><i>+</i></summary><div class="traco-menu-presets">'+Object.entries(MODES).map(([k,v])=>'<button data-menu-mode="'+k+'" class="'+(s.mode===k?'is-on':'')+'"><i>'+esc(v.icon)+'</i><span>'+esc(v.label)+'</span></button>').join('')+'</div></details>';
  }
  function portionMarkup(){
    const p=state().portion;
    return '<section class="traco-menu-portion"><span>PORÇÃO</span><div><button data-menu-portion="light" class="'+(p==='light'?'is-on':'')+'">leve</button><button data-menu-portion="normal" class="'+(p==='normal'?'is-on':'')+'">normal</button><button data-menu-portion="reinforced" class="'+(p==='reinforced'?'is-on':'')+'">reforçada</button></div><p>'+esc(portionHint())+'</p></section>';
  }
  function favoritesMarkup(){
    const f=favorites();
    if(!f.length)return '';
    return '<details class="traco-menu-favorites"><summary><span>FAVORITOS</span><b>'+f.length+' salvos</b></summary><div>'+f.map(x=>'<p>♥ '+esc(x)+'</p>').join('')+'</div></details>';
  }
  function groceryMarkup(){
    const items=groceryItems();
    return '<details class="traco-menu-grocery"><summary><span>LISTA DE COMPRAS</span><b>'+items.length+' itens</b></summary><div><div class="traco-menu-grocery-list">'+items.map(x=>'<span>'+esc(x)+'</span>').join('')+'</div><div class="traco-menu-grocery-actions"><button id="tracoMenuToGrocery">usar no supermercado</button><button id="tracoMenuCopy">copiar</button></div></div></details>';
  }
  function markup(){
    const m=mode();
    return '<section class="traco-menu-planner"><header><span>CARDÁPIOS</span><h3>seu dia, sem dieta engessada</h3><p>monte em 3 toques ou use o contexto atual. sem calorias inventadas e sem alimento proibido.</p></header>'+
      builderMarkup()+
      '<section class="traco-menu-current"><header><div><span>CARDÁPIO ATUAL</span><h4>'+esc(m.label)+'</h4><p>'+esc(m.desc)+'</p></div><i>'+esc(m.icon)+'</i></header>'+
      portionMarkup()+
      '<div class="traco-menu-meals">'+SLOTS.map(mealCard).join('')+'</div>'+
      '<small>base flexível: ajuste a preferências, alergias/restrições e orientações profissionais que você já tenha.</small></section>'+
      presetMarkup()+favoritesMarkup()+groceryMarkup()+
      '</section>';
  }

  function renderPlanner(){
    const dedicated=document.querySelector('.perf-food #tracoFoodPlannerMount');
    if(dedicated){dedicated.innerHTML=markup();bind();return;}
    const main=document.querySelector('.perf-body');if(!main)return;
    let host=main.querySelector('.ux-body-panel[data-ux-panel="food"]')||main;
    main.querySelector('.traco-menu-planner')?.remove();
    const wrap=document.createElement('div');wrap.innerHTML=markup();
    const planner=wrap.firstElementChild;
    host.insertAdjacentElement('afterbegin',planner);
    bind();
  }
  function renderFood(){
    const profile=typeof v60Profile==='function'?v60Profile():{name:'Cauê'};
    shell(`
      <header class="page-head traco-food-head">
        <div><span class="page-kicker">ALIMENTAÇÃO DO DIA</span><h2>cardápios</h2></div>
        <span class="traco-food-avatar">${esc((profile.name||'C').trim().charAt(0).toUpperCase())}</span>
      </header>
      <section class="traco-food-quicknav" aria-label="atalhos do corpo">
        <button id="tracoFoodBodyOverview"><span>◎</span><b>corpo</b><small>visão geral</small></button>
        <button id="tracoFoodPhotos"><span>◫</span><b>fotos</b><small>check-in</small></button>
      </section>
      <div id="tracoFoodPlannerMount"></div>
    `,{classes:'food-page perf-food'});
    const mount=document.querySelector('#tracoFoodPlannerMount');
    if(mount)mount.innerHTML=markup();
    bind();
    const bodyBtn=document.querySelector('#tracoFoodBodyOverview');
    if(bodyBtn)bodyBtn.onclick=()=>{
      localStorage.setItem('traco_ux_body_tab_v1','overview');
      state.page='body';render();
    };
    const photosBtn=document.querySelector('#tracoFoodPhotos');
    if(photosBtn)photosBtn.onclick=()=>{
      localStorage.setItem('traco_ux_body_tab_v1','photos');
      state.page='body';render();
    };
  }

  function homeCardMarkup(){
    const m=mode();
    return '<section class="traco-menu-home-card" id="tracoMenuHomeCard"><div><span>CARDÁPIO DE HOJE</span><b>'+esc(m.label)+'</b><small>4 refeições · porção '+esc(state().portion)+'</small></div><button id="tracoMenuHomeOpen">abrir</button></section>';
  }
  function renderHomeCard(){
    if(state.page!=='home')return;
    document.querySelector('#tracoMenuHomeCard')?.remove();
    document.querySelector('#tracoDailyHome')?.remove();
    document.querySelector('#runtimeFoodHome')?.remove();
    const main=document.querySelector('.perf-home');if(!main)return;
    const anchor=main.querySelector('.perf-workout-hero')||main.querySelector('.perf-greeting');
    if(!anchor)return;
    anchor.insertAdjacentHTML('afterend',homeCardMarkup());
    const btn=document.querySelector('#tracoMenuHomeOpen');
    if(btn)btn.onclick=()=>{state.page='food';render();};
  }

  function bind(){
    document.querySelectorAll('[data-menu-answer]').forEach(btn=>btn.onclick=()=>{
      const [k,v]=btn.dataset.menuAnswer.split('|');
      saveState({answers:{[k]:v}});renderPlanner();
    });
    document.querySelector('#tracoMenuBuild')?.addEventListener('click',()=>{
      buildFromAnswers();renderPlanner();try{toast('cardápio do dia montado')}catch{}
    });
    document.querySelectorAll('[data-menu-mode]').forEach(btn=>btn.onclick=()=>{
      saveState({mode:btn.dataset.menuMode,indexes:{breakfast:0,lunch:0,snack:0,dinner:0}});renderPlanner();
    });
    document.querySelectorAll('[data-menu-portion]').forEach(btn=>btn.onclick=()=>{
      saveState({portion:btn.dataset.menuPortion});renderPlanner();
    });
    document.querySelectorAll('[data-menu-swap]').forEach(btn=>btn.onclick=()=>{
      const k=btn.dataset.menuSwap,s=state(),arr=mode().meals[k]||[];
      const next=((Number(s.indexes?.[k]||0)+1)%Math.max(1,arr.length));
      saveState({indexes:{[k]:next}});renderPlanner();
    });
    document.querySelectorAll('[data-menu-fav]').forEach(btn=>btn.onclick=()=>{
      toggleFavorite(selectedMeal(btn.dataset.menuFav).text);renderPlanner();
    });
    document.querySelector('#tracoMenuToGrocery')?.addEventListener('click',()=>{
      const merged=[...new Set([...(read(GROCERY_KEY,[])||[]),...groceryItems()])];
      write(GROCERY_KEY,merged);
      try{toast('lista enviada para Supermercado')}catch{}
    });
    document.querySelector('#tracoMenuCopy')?.addEventListener('click',async()=>{
      const txt='Lista do Traço\n• '+groceryItems().join('\n• ');
      try{await navigator.clipboard.writeText(txt);toast('lista copiada')}catch{try{toast('não consegui copiar agora')}catch{}}
    });
  }

  const baseRenderBody=renderBody;
  renderBody=function(){baseRenderBody();renderPlanner();};
  const baseRenderHome=renderHome;
  renderHome=function(){baseRenderHome();renderHomeCard();};
  setTimeout(()=>{if(state.page==='body'||state.page==='food')renderPlanner();if(state.page==='home')renderHomeCard()},80);

  window.TracoMenuPlanner={version:VERSION,state,buildFromAnswers,groceryItems,renderPlanner,renderFood,renderHomeCard};
  document.documentElement.dataset.tracoMenuPlanner=VERSION;
})();