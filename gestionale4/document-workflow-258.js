/* I.T.E. 4.0.258 — revision batches and technical dossier integrity, metadata only. */
(function(root,factory){const api=factory(typeof module==="object"&&module.exports?require("./document-registry-255.js"):root.ITEDocumentRegistry255);if(typeof module==="object"&&module.exports)module.exports=api;root.ITEDocumentWorkflow258=api;})(typeof globalThis!=="undefined"?globalThis:this,function(registry){"use strict";
const clone=x=>JSON.parse(JSON.stringify(x));
function check(s){
 const issues=registry.audit(s).map(clone),byId=new Map(s.documents.map(d=>[d.id,d]));
 const duplicates=new Set();
 for(const d of s.documents){
  if(duplicates.has(d.id))continue;duplicates.add(d.id);
  if(d.replacesId){
   const p=byId.get(d.replacesId);
   if(p){
    if((d.version||1)!==(p.version||1)+1)issues.push({id:d.id,code:"VERSIONE_NON_SEQUENZIALE"});
    if(d.clientId!==p.clientId)issues.push({id:d.id,code:"REVISIONE_CLIENTE_DIVERSO"});
    if(d.equipmentId&&p.equipmentId&&d.equipmentId!==p.equipmentId)issues.push({id:d.id,code:"REVISIONE_APPARECCHIATURA_DIVERSA"});
   }
  }
  if(d.interventionId&&d.equipmentId){
   const i=s.interventions.find(x=>x.id===d.interventionId);
   if(i&&i.equipmentId&&i.equipmentId!==d.equipmentId)issues.push({id:d.id,code:"INTERVENTO_APPARECCHIATURA_DIVERSA"});
  }
 }
 return issues;
}
function prepare(s,entries){
 if(!Array.isArray(entries)||entries.length<1||entries.length>100)throw Error("LOTTO_NON_VALIDO");
 if(check(s).length)throw Error("ARCHIVIO_DOCUMENTALE_DA_VERIFICARE");
 const ids=new Set(s.documents.map(x=>x.id)),used=new Set(),successors=new Set(s.documents.map(x=>x.replacesId).filter(Boolean));
 const ready=[];
 for(const raw of entries){
  if(!raw||typeof raw!=="object"||typeof raw.id!=="string"||!raw.id.trim()||ids.has(raw.id)||used.has(raw.id))throw Error("ID_DOCUMENTO_DUPLICATO");
  if(raw.replacesId){
   const prev=s.documents.find(x=>x.id===raw.replacesId);
   if(!prev||successors.has(prev.id)||prev.siteId!==raw.siteId||prev.kind!==raw.kind)throw Error("REVISIONE_ORIGINE_NON_VALIDA");
   if(raw.equipmentId&&prev.equipmentId&&raw.equipmentId!==prev.equipmentId)throw Error("REVISIONE_APPARECCHIATURA_DIVERSA");
   if(raw.version!==undefined&&raw.version!==(prev.version||1)+1)throw Error("VERSIONE_NON_SEQUENZIALE");
   successors.add(prev.id);
  }
  if(raw.interventionId&&raw.equipmentId){
   const i=s.interventions.find(x=>x.id===raw.interventionId);
   if(i&&i.equipmentId&&i.equipmentId!==raw.equipmentId)throw Error("INTERVENTO_APPARECCHIATURA_DIVERSA");
  }
  used.add(raw.id);ready.push(clone(raw));
 }
 return ready;
}
function register(store,entries){
 const before=store.snapshot(),ready=prepare(before,entries);
 const result=registry.registerBatch(store,ready);
 const after=store.snapshot(),issues=check(after);
 if(issues.length)throw Error("INTEGRITA_POST_REGISTRAZIONE");
 return result;
}
function summary(s,siteId){
 const d=registry.dossier(s,siteId),issues=check(s).filter(x=>d.records.some(r=>r.id===x.id));
 const latest=d.records.filter(x=>x.isCurrent).map(x=>({id:x.id,kind:x.kind,filename:x.filename,version:x.version||1,interventionId:x.interventionId||"",equipmentId:x.equipmentId||""}));
 return {siteId,totalVersions:d.total,current:d.current,latest,issues};
}
return Object.freeze({check,prepare,register,summary});
});
