/* Unified, local-only legacy V60 + branded Traço backup importer.
 * The branded export contains an additional "storage" snapshot for optional
 * modules. Never silently drop that snapshot during a restore.
 */
(function(root,factory){
 const api=factory();
 if(typeof module!=="undefined"&&module.exports)module.exports=api;
 root.TracoBackupGuard=api;
})(typeof window!=="undefined"?window:globalThis,function(){
 "use strict";
 const OWN=Object.prototype.hasOwnProperty;
 const FIELDS=["sessions","body","settings"];
 const KEY={sessions:"v60_sessions",body:"v60_body",settings:"v60_settings"};
 const MAX_CHARS=8*1024*1024;
 const isObject=v=>v!==null&&typeof v==="object"&&!Array.isArray(v);
 function validSection(field,value){
  if(field==="settings"){
   if(!isObject(value))throw Error("A seção de ajustes não é válida.");
   if(OWN.call(value,"defaultRest")&&(
       typeof value.defaultRest!=="number"||!Number.isFinite(value.defaultRest)||
       value.defaultRest<30||value.defaultRest>180))
      throw Error("O descanso padrão no backup é inválido.");
  }else if(!Array.isArray(value)||value.length>10000||
     value.some(item=>!isObject(item))){
   throw Error("A seção de "+field+" não é válida.");
  }
 }
 function parse(text){
  if(typeof text!=="string"||text.length>MAX_CHARS)
    throw Error("Backup maior que o limite de 8 MB.");
  let source;
  try{source=JSON.parse(text);}catch{throw Error("Arquivo JSON inválido.");}
  if(!isObject(source))throw Error("Este arquivo não é um backup do Traço.");
  if(OWN.call(source,"brand")&&!["Traço","V60"].includes(source.brand))
    throw Error("Este arquivo pertence a outro aplicativo.");
  const result={};let sections=0;
  for(const field of FIELDS){
   if(!OWN.call(source,field))continue;
   validSection(field,source[field]);
   result[field]=source[field];sections++;
  }
  if(OWN.call(source,"storage")){
   if(!isObject(source.storage)||Object.keys(source.storage).length>150)
     throw Error("A seção de armazenamento completo não é válida.");
   const snapshot={};
   for(const [key,value] of Object.entries(source.storage)){
    if(!/^(?:v60_|traco_)[A-Za-z0-9_-]{1,100}$/.test(key)||
       typeof value!=="string"||value.length>MAX_CHARS)
      throw Error("Chave de armazenamento não reconhecida no backup.");
    const field=FIELDS.find(f=>KEY[f]===key);
    if(field){
     let decoded;
     try{decoded=JSON.parse(value);}catch{throw Error("Histórico inválido dentro do backup completo.");}
     validSection(field,decoded);
     if(OWN.call(result,field)&&JSON.stringify(result[field])!==JSON.stringify(decoded))
       throw Error("O arquivo apresenta dados divergentes para "+field+".");
    }
    snapshot[key]=value;
   }
   if(Object.keys(snapshot).length){
    result.storage=snapshot;sections++;
   }
  }
  if(!sections)throw Error("Backup sem dados de treino reconhecidos.");
  return result;
 }
 function commit(storage,keys,data){
  const writes=new Map();
  if(isObject(data.storage)){
   for(const [key,value] of Object.entries(data.storage))writes.set(key,value);
  }
  for(const field of FIELDS){
   if(OWN.call(data,field)&&!writes.has(keys[field]))
     writes.set(keys[field],JSON.stringify(data[field]));
  }
  if(!writes.size)return {ok:false,restored:true};
  const before=new Map(),done=[];
  try{
   for(const key of writes.keys())before.set(key,storage.getItem(key));
   for(const [key,value] of writes){storage.setItem(key,value);done.push(key);}
   return {ok:true,restored:true};
  }catch{
   let restored=true;
   for(const key of done.reverse()){
    try{
     const value=before.get(key);
     if(value===null)storage.removeItem(key);
     else storage.setItem(key,value);
    }catch{restored=false;}
   }
   return {ok:false,restored};
  }
 }
 return {parse,commit};
});
