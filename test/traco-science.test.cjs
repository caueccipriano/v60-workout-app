/* Execute: node --test test/traco-science.test.cjs */
const test=require('node:test'),assert=require('node:assert/strict');
const science=require('../traco-science.js');
const monday=new Date(2026,9,19).getTime();
const ex=(id,sets)=>({id,sets});
test('plano distingue estímulo direto de secundário',()=>{
  const v=science.plannedVolumes([{exercises:[ex('puxada-aberta',3),ex('elevacao-lateral',3)]}]);
  assert.equal(v.costas.direct,3);
  assert.equal(v.biceps.indirect,1.5);
  assert.equal(v['ombro-lateral'].direct,3);
});
test('séries saltadas, sessões excluídas e semanas anteriores não são contadas',()=>{
  const eligible={finishedAt:monday+10,startedAt:monday+2,exercises:[{id:'puxada-aberta',sets:[{done:true,reps:10},{done:true,skipped:true},{done:false}]}]};
  const excluded={...eligible,excludeFromVolume:true};
  const old={...eligible,startedAt:monday-1000};
  const v=science.completedVolumes([eligible,excluded,old],monday);
  assert.equal(v.costas.direct,1);
});
test('relatos sem repetições conhecidas não contam como série validada',()=>{
  const v=science.completedVolumes([{finishedAt:monday+10,startedAt:monday+2,exercises:[{id:'crunch',sets:[{done:true,reported:true},{done:true,reported:true,repsKnown:true}]}]}],monday);
  assert.equal(v.core.direct,1);
});
test('sem dados válidos não recomenda progressão',()=>assert.match(science.progression({id:'elevacao-lateral',sets:3,min:12,max:20},[]),/histórico confiável/));
test('só sugere aumento com todas as séries no topo da faixa',()=>{
  const e={id:'elevacao-lateral',sets:3,min:12,max:20};
  const build=reps=>[{finishedAt:1000,startedAt:500,exercises:[{id:e.id,sets:reps.map(n=>({done:true,reps:n,weight:8}))}]}];
  assert.match(science.progression(e,build([20,19,20])),/Mantenha a referência/);
  assert.match(science.progression(e,build([20,20,20])),/Considere um aumento pequeno/);
});
