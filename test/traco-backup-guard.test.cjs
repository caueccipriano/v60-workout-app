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

test("restores branded Traço full snapshots without dropping optional module data",()=>{
 const sessions=[{id:"branded",finishedAt:1234}];
 const source={brand:"Traço",sessions,body:[],settings:{defaultRest:60},
  storage:{v60_sessions:JSON.stringify(sessions),v60_body:"[]",v60_settings:'{"defaultRest":60}',
    traco_theme:"dark",traco_photo_checkin_v1:'[{"id":"fictional-photo"}]'}};
 const parsed=guard.parse(JSON.stringify(source));
 const store=memory();
 assert.deepEqual(guard.commit(store,keys,parsed),{ok:true,restored:true});
 assert.equal(store.map.get("traco_theme"),"dark");
 assert.equal(store.map.get("traco_photo_checkin_v1"),source.storage.traco_photo_checkin_v1);
 assert.deepEqual(JSON.parse(store.map.get("v60_sessions")),sessions);
});
test("rejects branded snapshots with corrupt core data or contradictory sections",()=>{
 for(const source of [
  {brand:"Traço",storage:{v60_sessions:"not-json"}},
  {brand:"Traço",storage:{v60_sessions:'"not-an-array"'}},
  {brand:"Traço",sessions:[{id:"A"}],storage:{v60_sessions:'[{"id":"B"}]'}},
  {brand:"Traço",storage:{unsupported_key:"secret"}}
 ])assert.throws(()=>guard.parse(JSON.stringify(source)));
});
test("full snapshot rollback restores ancillary keys on a quota error",()=>{
 const store=memory("traco_photo_checkin_v1");
 store.map.set("v60_sessions",'[{"id":"old"}]');
 store.map.set("traco_theme","light");
 const d=guard.parse(JSON.stringify({brand:"Traço",storage:{
  v60_sessions:'[{"id":"new"}]',traco_theme:"dark",
  traco_photo_checkin_v1:"[]" }}));
 assert.deepEqual(guard.commit(store,keys,d),{ok:false,restored:true});
 assert.equal(store.map.get("v60_sessions"),'[{"id":"old"}]');
 assert.equal(store.map.get("traco_theme"),"light");
});
