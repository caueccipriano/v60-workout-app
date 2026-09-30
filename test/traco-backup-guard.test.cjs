const test=require("node:test");
const assert=require("node:assert/strict");
const guard=require("../traco-backup-guard.js");
const keys={sessions:"v60_sessions",body:"v60_body",settings:"v60_settings"};
function memory(failKey){
 const map=new Map();let failed=false;
 return {map,
  getItem:k=>map.has(k)?map.get(k):null,
  setItem:(k,v)=>{if(k===failKey&&!failed){failed=true;throw Error("synthetic quota");}map.set(k,v);},
  removeItem:k=>map.delete(k)};
}
test("accepts original unversioned V60/Traço backup sections",()=>{
 const input={sessions:[{id:"session",startedAt:100}],body:[{id:1,date:"2026-09-30"}],settings:{defaultRest:60},exportedAt:"2026-09-30"};
 assert.deepEqual(guard.parse(JSON.stringify(input)),{sessions:input.sessions,body:input.body,settings:input.settings});
});
test("refuses malformed types, empty unrelated JSON, and invalid rest",()=>{
 for(const bad of ['{}','[]','bad','{"sessions":{}}','{"body":[null]}','{"settings":{"defaultRest":999}}']){
  assert.throws(()=>guard.parse(bad));
 }
});
test("applies validated sections without deleting unrelated local data",()=>{
 const store=memory();store.map.set("traco_readiness","private");
 const d=guard.parse('{"sessions":[{"id":"s1"}],"settings":{"defaultRest":90}}');
 assert.deepEqual(guard.commit(store,keys,d),{ok:true,restored:true});
 assert.equal(JSON.parse(store.map.get("v60_sessions"))[0].id,"s1");
 assert.equal(store.map.get("traco_readiness"),"private");
 assert.equal(store.map.has("v60_body"),false);
});
test("a storage failure rolls back earlier writes and never reports success",()=>{
 const store=memory("v60_body");
 store.map.set("v60_sessions",'[{"id":"old"}]');
 store.map.set("v60_body",'[{"id":"oldBody"}]');
 const d=guard.parse('{"sessions":[{"id":"new"}],"body":[{"id":"newBody"}]}');
 assert.deepEqual(guard.commit(store,keys,d),{ok:false,restored:true});
 assert.equal(store.map.get("v60_sessions"),'[{"id":"old"}]');
 assert.equal(store.map.get("v60_body"),'[{"id":"oldBody"}]');
});
