const test=require('node:test'),assert=require('node:assert/strict');
const pantry=require('../traco-pantry.js');
const by=id=>pantry.foods.find(x=>x.id===id);
test('ingredientes conhecidos, normalizados e sem duplicatas',()=>{
 assert.deepEqual(pantry.normalize(['ovo','ovo','invalid','banana']),['ovo','banana']);
 assert.equal(by('ovo').name,'Ovos');
});
test('sugere receita viável com ingredientes reais',()=>{
 const selected=['arroz','feijao','ovo','tomate'];
 const results=pantry.recommend(selected,'jantar');
 assert.equal(results[0].complete,true);
 assert.equal(results[0].missing.length,0);
 assert.match(results[0].title,/Arroz/);
});
test('nenhuma refeição ganha micronutriente de item ausente',()=>{
 const recipe=pantry.recipes.find(x=>x.title==='Arroz, feijão, proteína e verdura');
 const r=pantry.evaluateRecipe(recipe,['arroz','feijao']);
 assert.ok(r.missing.length>0);
 assert.equal(r.micros.includes('B12'),false);
 assert.ok(r.macros.includes('fibra'));
});
test('não calcula nem finge metas e números de macros sem porções',()=>{
 const results=pantry.recommend(['ovo','pao','banana'],'cafe');
 assert.equal(results[0].complete,true);
 assert.equal('calories' in results[0],false);
 assert.equal('proteinGrams' in results[0],false);
});
test('fontes qualitativas distintas de fibras, carbo, proteina e gordura',()=>{
 const covered=pantry.nutrientCoverage(['aveia','ovo','iogurte']);
 assert.ok(covered.macros.includes('proteína'));
 assert.ok(covered.macros.includes('carboidrato'));
 assert.ok(covered.macros.includes('fibra'));
 assert.ok(covered.micros.includes('cálcio'));
});
