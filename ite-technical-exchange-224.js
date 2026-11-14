/* I.T.E. 4.0.224 — atomic technical-register exchange, synthetic TEST metadata only. */
(function(root,factory){const api=factory(root);if(typeof module==="object"&&module.exports)module.exports=api;root.ITETechnicalExchange224=api;})(typeof globalThis!=="undefined"?globalThis:this,function(root){"use strict";
const Intake=root.ITEDocumentIntake217||(typeof require==="function"?require("./ite-document-intake-217.js"):null);
const SCHEMA="ITE_TECHNICAL_EXPORT_223",MAX=250000;
const copy=x=>JSON.parse(JSON.stringify(x));
function parse(raw){
 if(typeof raw!=="string"||raw.length>MAX)throw Error("FILE_TROPPO_GRANDE");
 let data;try{data=JSON.parse(raw);}catch(_){throw Error("JSON_NON_VALIDO");}
 if(!data||data.schema!==SCHEMA||data.mode!=="SYNTHETIC_TEST_ONLY"||!Array.isArray(data.technicalDocuments))throw Error("FORMATO_NON_COMPATIBILE");
 if(Object.keys(data).some(k=>!["schema","mode","revision","technicalDocuments"].includes(k)))throw Error("CAMPO_NON_AMMESSO");
 Intake.validate(data.technicalDocuments);return copy(data.technicalDocuments);
}
function serialize(documents){
 Intake.validate(documents);
 const raw=JSON.stringify({schema:SCHEMA,mode:"SYNTHETIC_TEST_ONLY",technicalDocuments:documents},null,2);
 if(raw.length>MAX)throw Error("FILE_TROPPO_GRANDE");return raw;
}
function plan(store,raw,mode="merge"){
 if(!["merge","replace"].includes(mode))throw Error("MODALITA_NON_VALIDA");
 const current=store.snapshot(),incoming=parse(raw);
 Intake.checkRelations(incoming,current.field);
 const existing=new Map(current.technicalDocuments.map(x=>[x.id,x]));
 const conflicts=incoming.filter(x=>existing.has(x.id)&&JSON.stringify(existing.get(x.id))!==JSON.stringify(x)).map(x=>x.id);
 if(conflicts.length&&mode==="merge")throw Error("ID_GIA_PRESENTI:"+conflicts.join(","));
 const next=mode==="replace"?incoming:[...current.technicalDocuments,...incoming.filter(x=>!existing.has(x.id))];
 Intake.checkRelations(next,current.field);
 return {revision:current.revision,mode,incoming:incoming.length,existing:current.technicalDocuments.length,after:next.length,duplicates:incoming.length-(next.length-current.technicalDocuments.length),documents:next};
}
function apply(store,raw,mode="merge"){
 const preview=plan(store,raw,mode);
 const now=store.snapshot();if(now.revision!==preview.revision)throw Error("REVISIONE_CONFLITTO");
 return store.save({...now,technicalDocuments:preview.documents},preview.revision);
}
return Object.freeze({SCHEMA,parse,serialize,plan,apply});
});
