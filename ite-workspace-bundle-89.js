/* I.T.E. 4.0.89 — Backup coerente dei tre archivi TEST, ripristino atomico con rollback. */
(function(root,factory){
 const api=factory(
 typeof module==="object"&&module.exports?require("./ite-service-ledger-40.js"):root.ITEServiceLedger40,
 typeof module==="object"&&module.exports?require("./ite-finance-workspace-40.js"):root.ITEFinanceWorkspace40,
 typeof module==="object"&&module.exports?require("./ite-integrated-dossier-83.js"):root.ITEIntegratedDossier83
 );
 if(typeof module==="object"&&module.exports)module.exports=api;
 root.ITEWorkspaceBundle89=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(L,F,D){
 "use strict";
 const KEYS=Object.freeze({service:"ite-40-service-workspace-test-v1",finance:"ITE-4-FINANCE-WORKSPACE-TEST-1",estimates:"ite-40-integrated-estimates-test-v1"});
 const SCHEMA="ITE-WORKSPACE-BUNDLE-TEST-1",MAX=1000000;
 function assert(ok,msg){if(!ok)throw Error(msg);}
 function parse(raw){assert(typeof raw==="string"&&raw.length<=MAX,"Archivio TEST oltre il limite");return JSON.parse(raw);}
 function validateBundle(bundle){
  assert(bundle&&bundle.schema===SCHEMA&&bundle.archives&&typeof bundle.archives==="object","Formato backup non supportato");
  assert(Object.keys(bundle.archives).length===3&&Object.keys(KEYS).every(k=>Object.prototype.hasOwnProperty.call(bundle.archives,k)),"Backup incompleto");
  const a=bundle.archives;
  assert(typeof a.service==="string","Fascicolo obbligatorio");
  const service=L.importJSON(a.service);
  const finance=a.finance===null?F.empty():F.importJSON(a.finance);
  const estimates=a.estimates===null?[]:D.importEstimates(a.estimates,service,finance);
  L.validate(service);F.validateArchive(finance);
  D.report(service,estimates,finance);
  return {service,finance,estimates};
 }
 function snapshot(storage){
  assert(storage&&typeof storage.getItem==="function","Archivio locale non disponibile");
  const archives={};
  for(const [name,key] of Object.entries(KEYS)){const value=storage.getItem(key);assert(value===null||value.length<=MAX,"Archivio TEST oltre il limite: "+name);archives[name]=value;}
  assert(archives.service!==null,"Fascicolo TEST assente");
  const bundle={schema:SCHEMA,archives};
  validateBundle(bundle);
  return bundle;
 }
 function serialize(bundle){validateBundle(bundle);const raw=JSON.stringify(bundle,null,2);assert(raw.length<=MAX*3+1024,"Backup troppo grande");return raw;}
 function deserialize(raw){assert(typeof raw==="string"&&raw.length<=MAX*3+1024,"Backup troppo grande");const bundle=JSON.parse(raw);validateBundle(bundle);return bundle;}
 function restore(storage,bundle){
  assert(storage&&typeof storage.getItem==="function"&&typeof storage.setItem==="function"&&typeof storage.removeItem==="function","Archivio locale non scrivibile");
  validateBundle(bundle);
  const before={};for(const [name,key] of Object.entries(KEYS))before[name]=storage.getItem(key);
  const write=archives=>{for(const [name,key] of Object.entries(KEYS)){if(archives[name]===null)storage.removeItem(key);else storage.setItem(key,archives[name]);}};
  try{write(bundle.archives);const after=snapshot(storage);assert(JSON.stringify(after.archives)===JSON.stringify(bundle.archives),"Verifica ripristino fallita");return true;}
  catch(e){try{write(before);}catch(rollbackError){throw Error("Ripristino fallito e rollback incompleto: "+rollbackError.message);}throw e;}
 }
 return Object.freeze({KEYS,SCHEMA,snapshot,serialize,deserialize,validateBundle,restore});
});