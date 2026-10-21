const test=require('node:test'),assert=require('node:assert/strict');
const ai=require('../traco-intelligence.js');
const ex={id:'elevacao-lateral',name:'Elevação lateral',equipment:'Halteres',sets:3,min:12,max:20};
const set=(n,weight=8)=>({done:true,reps:n,weight});
const session=(time,reps=[15,15,15],overrides={})=>({startedAt:time-40*60000,finishedAt:time,workoutId:'seg',exercises:[{...ex,sets:reps.map(n=>set(n))}],...overrides});
const at=Date.UTC(2026,9,21);
test('com histórico vazio não inventa evolução',()=>{
  const r=ai.exerciseAdvice(ex,[],null);
  assert.equal(r.kind,'baseline');assert.equal(r.samples,0);
});
test('sem dados confiáveis não conta relato, incompleto ou sessão excluída',()=>{
  const bad=session(at,[20,20,20],{excludeFromVolume:true});
  const reported=session(at-86400000,[20,20,20]);reported.exercises[0].sets[0].reported=true;
  const incomplete=session(at-2*86400000,[20,20,20]);incomplete.exercises[0].sets[1].done=false;
  assert.equal(ai.exerciseAdvice(ex,[bad,reported,incomplete],null).kind,'baseline');
});
test('nunca mistura variações de máquina nem Smart Swap',()=>{
  const other=session(at,[20,20,20]);other.exercises[0].equipment='Polia alta';
  assert.equal(ai.exerciseAdvice(ex,[other],null).kind,'baseline');
});
test('elevação lateral só sugere aumento no topo com série completa',()=>{
  assert.equal(ai.exerciseAdvice(ex,[session(at,[20,20,20])],null).kind,'increase');
  assert.equal(ai.exerciseAdvice(ex,[session(at,[20,19,20])],null).kind,'reps');
});
test('check-in baixo bloqueia sugestão de carga',()=>{
  const r=ai.exerciseAdvice(ex,[session(at,[20,20,20])],{energy:1,sleep:1,soreness:5});
  assert.equal(r.kind,'recover');
});
test('RIR pesado não manda subir carga',()=>{
  const s=session(at,[20,20,20]);s.exercises[0].sets[2].rir='heavy';
  assert.equal(ai.exerciseAdvice(ex,[s],null).kind,'hold');
});
test('platô precisa de três registros com intervalo real',()=>{
  const history=[session(at,[15,15,15]),session(at-8*86400000,[15,15,15]),session(at-16*86400000,[15,15,15])];
  assert.equal(ai.exerciseAdvice(ex,history,null).kind,'plateau');
  assert.equal(ai.exerciseAdvice(ex,history.slice(0,2),null).kind,'reps');
});
test('análise combina prontidão, sessões válidas e volume sem inventar',()=>{
  const science={groups:[{id:'peito',name:'Peitoral',min:8,priority:true}],
    plannedVolumes:()=>({peito:{direct:7,indirect:1}})};
  const result=ai.evaluate({plan:[{id:'seg',short:'ombros',exercises:[ex]}],history:[session(at)],now:at+100,science});
  assert.equal(result.sampleCount,1);
  assert.ok(result.insights.some(x=>/peitoral/i.test(x.title)));
  assert.equal(result.readiness,null);
});
