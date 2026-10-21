/* Traço Cozinha 1.0: orientações alimentares a partir da despensa. Sem prescrição de emagrecimento. */
(function(root){
  'use strict';
  const VERSION='1.0.0',KEY='traco_pantry_v1';
  const FOODS=[
    ['ovo','Ovos',['proteína','gordura'],['B12','colina','selênio']],
    ['frango','Frango',['proteína'],['B6','selênio']],
    ['atum','Atum',['proteína'],['B12','selênio']],
    ['sardinha','Sardinha',['proteína','gordura'],['cálcio','B12','ômega-3']],
    ['carne','Carne bovina',['proteína','gordura'],['ferro','zinco','B12']],
    ['tofu','Tofu',['proteína','gordura'],['ferro']],
    ['feijao','Feijão',['proteína','carboidrato','fibra'],['ferro','folato','magnésio']],
    ['lentilha','Lentilha',['proteína','carboidrato','fibra'],['ferro','folato']],
    ['grao','Grão-de-bico',['proteína','carboidrato','fibra'],['folato','ferro']],
    ['arroz','Arroz',['carboidrato'],[]],
    ['pao','Pão',['carboidrato'],[]],
    ['aveia','Aveia',['carboidrato','fibra'],['magnésio']],
    ['macarrao','Macarrão',['carboidrato'],[]],
    ['batata','Batata',['carboidrato'],['potássio']],
    ['iogurte','Iogurte natural',['proteína','gordura'],['cálcio','B12']],
    ['leite','Leite',['proteína','gordura'],['cálcio','B12']],
    ['queijo','Queijo',['proteína','gordura'],['cálcio']],
    ['banana','Banana',['carboidrato','fibra'],['potássio','B6']],
    ['laranja','Laranja',['carboidrato','fibra'],['vitamina C']],
    ['mamao','Mamão',['carboidrato','fibra'],['vitamina C','vitamina A']],
    ['maca','Maçã',['carboidrato','fibra'],[]],
    ['tomate','Tomate',['fibra'],['vitamina C','potássio']],
    ['cenoura','Cenoura',['fibra'],['vitamina A']],
    ['folhas','Folhas verdes',['fibra'],['folato','vitamina A']],
    ['brocolis','Brócolis',['fibra'],['vitamina C','folato']],
    ['legumes','Legumes variados',['fibra'],[]],
    ['amendoim','Amendoim',['proteína','gordura','fibra'],['magnésio']],
    ['azeite','Azeite',['gordura'],[]],
    ['abacate','Abacate',['gordura','fibra'],['potássio']],
  ].map(([id,name,macros,micros])=>({id,name,macros,micros}));
  const RECIPES=[
    ['cafe','Ovos mexidos, pão e fruta',[['ovo'],['pao'],['banana','laranja','mamao','maca']],10,'Junte a fruta que tiver e uma bebida de sua preferência.'],
    ['cafe','Iogurte com aveia e banana',[['iogurte'],['aveia'],['banana','mamao','maca']],5,'Misture e ajuste a consistência conforme sua preferência.'],
    ['cafe','Pão com queijo e fruta',[['pao'],['queijo'],['banana','laranja','mamao','maca']],5,'Uma opção simples para a rotina.'],
    ['cafe','Omelete com tomate e pão',[['ovo'],['tomate'],['pao']],12,'Prepare o omelete e sirva com o pão.'],
    ['almoco','Arroz, feijão, proteína e verdura',[['arroz'],['feijao','lentilha'],['frango','ovo','carne','sardinha','tofu'],['folhas','brocolis','legumes','tomate']],25,'Monte um prato completo, respeitando sua fome.'],
    ['almoco','Frango com batata e legumes',[['frango'],['batata'],['legumes','brocolis','cenoura','folhas']],25,'Asse, refogue ou cozinhe os ingredientes.'],
    ['almoco','Macarrão com atum e tomate',[['macarrao'],['atum','sardinha'],['tomate']],20,'Acrescente vegetais que já tiver.'],
    ['almoco','Lentilha ou grão-de-bico com arroz',[['lentilha','grao'],['arroz'],['brocolis','cenoura','folhas','tomate']],25,'Leguminosas ajudam a compor uma refeição variada.'],
    ['almoco','Omelete com arroz, feijão e vegetais',[['ovo'],['arroz'],['feijao'],['folhas','legumes','tomate','brocolis']],20,'Alternativa acessível para quando não há carne.'],
    ['lanche','Iogurte e fruta',[['iogurte'],['banana','mamao','maca','laranja']],3,'Pode complementar com aveia se houver fome.'],
    ['lanche','Sanduíche de atum ou frango',[['pao'],['atum','frango'],['tomate','folhas']],7,'Utilize sobras bem armazenadas.'],
    ['lanche','Banana, aveia e leite',[['banana'],['aveia'],['leite','iogurte']],5,'Misture ou bata; não precisa adicionar açúcar.'],
    ['lanche','Pão e ovos',[['pao'],['ovo']],10,'Opção prática sem necessidade de suplemento.'],
    ['jantar','Arroz, feijão, ovos e salada',[['arroz'],['feijao'],['ovo'],['tomate','folhas','cenoura','brocolis']],20,'Uma refeição completa também funciona à noite.'],
    ['jantar','Sardinha, batata e vegetais',[['sardinha'],['batata'],['folhas','legumes','tomate']],20,'Peixe com espinhas comestíveis pode fornecer cálcio.'],
    ['jantar','Frango com arroz e brócolis',[['frango'],['arroz'],['brocolis','legumes']],20,'Pode aproveitar preparos de outras refeições.'],
    ['jantar','Omelete de queijo e legumes',[['ovo'],['queijo'],['legumes','brocolis','tomate']],15,'Se precisar de mais energia, sirva com pão ou arroz.'],
  ].map(([slot,title,groups,minutes,note],i)=>({id:'meal-'+i,slot,title,groups,minutes,note}));
  const MAP=new Map(FOODS.map(f=>[f.id,f]));
  const SLOT_NAMES={cafe:'Café da manhã',almoco:'Almoço',lanche:'Lanche',jantar:'Jantar'};
  function normalize(selected){
    return Array.from(new Set((Array.isArray(selected)?selected:[]).filter(id=>MAP.has(id))));
  }
  function evaluateRecipe(recipe,selected){
    const have=new Set(normalize(selected));
    const chosen=recipe.groups.map(g=>g.find(id=>have.has(id))||g[0]);
    const missing=recipe.groups.filter(g=>!g.some(id=>have.has(id))).map(g=>g.map(id=>MAP.get(id)?.name).filter(Boolean).join(' ou '));
    const available=chosen.filter(id=>have.has(id));
    const macros=new Set(),micros=new Set();
    available.forEach(id=>{
      const f=MAP.get(id);
      f?.macros.forEach(m=>macros.add(m));
      f?.micros.forEach(m=>micros.add(m));
    });
    return {...recipe,chosen,available,missing,complete:missing.length===0,macros:[...macros],micros:[...micros],
      score:(recipe.groups.length-missing.length)*10+macros.size*2+micros.size*0.25-missing.length*15};
  }
  function recommend(selected,slot='almoco',count=4){
    return RECIPES.filter(r=>r.slot===slot)
      .map(r=>evaluateRecipe(r,selected))
      .sort((a,b)=>(Number(b.complete)-Number(a.complete))||b.score-a.score||a.id.localeCompare(b.id))
      .slice(0,count);
  }
  function nutrientCoverage(selected){
    const macros=new Set(),micros=new Set();
    normalize(selected).forEach(id=>{
      MAP.get(id).macros.forEach(m=>macros.add(m));
      MAP.get(id).micros.forEach(m=>micros.add(m));
    });
    return {macros:[...macros],micros:[...micros]};
  }
  const api={version:VERSION,foods:FOODS,recipes:RECIPES,normalize,evaluateRecipe,recommend,nutrientCoverage};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  if(!root?.document)return;
  root.TracoPantry=api;
  const doc=root.document;
  const esc=v=>String(v==null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const get=()=>{try{return normalize(JSON.parse(root.localStorage.getItem(KEY)||'[]'));}catch{return [];}};
  const store=items=>{
    try{root.localStorage.setItem(KEY,JSON.stringify(normalize(items)));return true;}
    catch{if(typeof toast==='function')toast('Não foi possível salvar sua despensa');return false;}
  };
  let slot='almoco',menuOpen=false,queued=false;
  const filters=['proteína','carboidrato','gordura','fibra'];
  function resultHTML(selected){
    const covered=nutrientCoverage(selected),list=recommend(selected,slot,5);
    const canMake=list.filter(x=>x.complete);
    const options=(canMake.length?canMake:list.filter(x=>x.missing.length<=2)).slice(0,4);
    return '<div class="pantry-nutrient"><h4>Macro e micronutrientes dos alimentos selecionados</h4>'+
      '<p class="pantry-disclaimer">Indica fontes possíveis, não o que você comeu nem quantidades de nutrientes. Os valores exatos dependem da porção, preparo e rótulo.</p>'+
      '<div class="pantry-chips">'+filters.map(m=>'<span class="'+(covered.macros.includes(m)?'is-found':'')+'">'+esc(m)+'</span>').join('')+'</div>'+
      '<p class="pantry-micro">Micronutrientes presentes em alguns desses alimentos: '+esc(covered.micros.length?covered.micros.join(' · '):'ainda sem fontes identificadas')+'.</p></div>'+
      '<div class="pantry-slot" role="group" aria-label="Tipo de refeição">'+Object.keys(SLOT_NAMES).map(k=>
        '<button type="button" data-pantry-slot="'+k+'" aria-pressed="'+(k===slot)+'" class="'+(k===slot?'active':'')+'">'+esc(SLOT_NAMES[k])+'</button>').join('')+'</div>'+
      '<div class="pantry-meal-list">'+(options.length?options.map(m=>'<article class="pantry-meal"><div><b>'+esc(m.title)+'</b><small>'+esc(m.complete?'Você tem todos os ingredientes':'Falta: '+m.missing.join(' · '))+'</small></div>'+
        '<p>'+esc(m.chosen.map(id=>MAP.get(id)?.name||id).join(' + '))+'</p>'+
        '<small>Fontes: '+esc(m.macros.join(' · ')||'não identificadas')+' · micronutrientes: '+esc(m.micros.join(', ')||'não identificados')+'</small>'+
        '<p>'+esc(m.note)+'</p></article>').join(''):
        '<p class="pantry-disclaimer">Marque mais ingredientes para obter sugestões viáveis com o que tem em casa.</p>')+'</div>';
  }
  function render(){
    const rootSection=doc.querySelector('.traco-pantry');
    if(!rootSection)return;
    const selected=get();
    rootSection.innerHTML='<header><span>COZINHA INTELIGENTE</span><h3>O que tem em casa?</h3><p>Marque os ingredientes que você tem. O Traço sugere combinações equilibradas e acessíveis.</p></header>'+
      '<button class="pantry-toggle" type="button" data-pantry-toggle aria-expanded="'+menuOpen+'">'+
      selected.length+' ingredientes selecionados · '+(menuOpen?'fechar':'editar')+' <span>⌄</span></button>'+
      (menuOpen?'<div class="pantry-picker">'+FOODS.map(f=>'<label class="pantry-food"><input type="checkbox" data-pantry-id="'+f.id+'" '+(selected.includes(f.id)?'checked':'')+'><span>'+esc(f.name)+'</span></label>').join('')+'</div>':'')+
      (selected.length?resultHTML(selected):'<p class="pantry-empty">Selecione os alimentos que estão em casa para montar refeições sem precisar comprar ingredientes extras.</p>')+
      '<p class="pantry-safety">Foco: alimentar-se regularmente, apoiar os treinos e variar os nutrientes. Não há alimentos proibidos nem metas de emagrecimento extremo. Nenhum ingrediente reduz gordura só nos flancos.</p>';
    rootSection.querySelector('[data-pantry-toggle]')?.addEventListener('click',()=>{
      menuOpen=!menuOpen;render();
    });
    rootSection.querySelectorAll('[data-pantry-id]').forEach(el=>el.addEventListener('change',()=>{
      const next=new Set(get());
      el.checked?next.add(el.dataset.pantryId):next.delete(el.dataset.pantryId);
      if(store([...next]))render();
    }));
    rootSection.querySelectorAll('[data-pantry-slot]').forEach(btn=>btn.addEventListener('click',()=>{
      slot=btn.dataset.pantrySlot;render();
    }));
  }
  function mount(){
    queued=false;
    const page=doc.querySelector('.perf-food');
    if(!page)return;
    let section=page.querySelector('.traco-pantry');
    if(section)return;
    section=doc.createElement('section');
    section.className='traco-pantry';
    const host=page.querySelector('#tracoFoodPlannerMount');
    if(host)host.insertAdjacentElement('beforebegin',section);else page.appendChild(section);
    render();
  }
  function schedule(){
    if(queued)return;queued=true;
    root.requestAnimationFrame(()=>root.requestAnimationFrame(mount));
  }
  const app=doc.querySelector('#app');
  if(app)new MutationObserver(schedule).observe(app,{childList:true,subtree:false});
  root.addEventListener('pageshow',schedule);
  if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',schedule,{once:true});else schedule();
})(typeof window!=='undefined'?window:(typeof globalThis!=='undefined'?globalThis:null));
