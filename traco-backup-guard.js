/* Original, local-only Traço backup import guard.
 * Historical V60 backups already export sessions/body/settings without version.
 * Never use a remote endpoint or load other browser data on import.
 */
(function(root,factory){
 const api=factory();
 if(typeof module!=="undefined"&&module.exports)module.exports=api;
 root.TracoBackupGuard=api;
})(typeof window!=="undefined"?window:globalThis,function(){
 "use strict";
 const OWN=Object.prototype.hasOwnProperty;
 const FIELDS=["sessions","body","settings"];
 const isObject=v=>v!==null&&typeof v==="object"&&!Array.isArray(v);
 function parse(text){
  if(typeof text!=="string"||text.length>4*1024*1024)throw Error("Backup maior que o limite de 4 MB.");
  let source;
  try{source=JSON.parse(text);}catch{throw Error("Arquivo JSON inválido.");}
  if(!isObject(source))throw Error("Este arquivo não é um backup do Traço.");
  const result={};let sections=0;
  for(const field of FIELDS){
   if(!OWN.call(source,field))continue;
   const value=source[field];
   if(field==="settings"){
    if(!isObject(value))throw Error("A seção de ajustes não é válida.");
    if(OWN.call(value,"defaultRest")&&(
      typeof value.defaultRest!=="number"||!Number.isFinite(value.defaultRest)||
      value.defaultRest<30||value.defaultRest>180)){
      throw Error("O descanso padrão no backup é inválido.");
    }
   }else{
    if(!Array.isArray(value)||value.length>10000||
      value.some(item=>!isObject(item)))throw Error("A seção de "+field+" não é válida.");
   }
   result[field]=value;sections++;
  }
  if(!sections)throw Error("Backup sem treinos, medidas ou ajustes reconhecidos.");
  return result;
 }
 function commit(storage,keys,data){
  const fields=FIELDS.filter(field=>OWN.call(data,field));
  if(!fields.length)return {ok:false,restored:true};
  const before=new Map();const done=[];
  try{
   for(const field of fields)before.set(field,storage.getItem(keys[field]));
   for(const field of fields){storage.setItem(keys[field],JSON.stringify(data[field]));done.push(field);}
   return {ok:true,restored:true};
  }catch{
   let restored=true;
   for(const field of done.reverse()){
    try{
     const value=before.get(field);
     if(value===null)storage.removeItem(keys[field]);else storage.setItem(keys[field],value);
    }catch{restored=false;}
   }
   return {ok:false,restored};
  }
 }
 return {parse,commit};
});
