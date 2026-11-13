/* I.T.E. 4.0.209 — isolated synthetic workspace with explicit local persistence.
   NEVER connect this store to production records. */
(function(root,factory){
 const api=factory();
 if(typeof module==="object"&&module.exports)module.exports=api;
 root.ITEWorkspaceStore209=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){"use strict";
const SCHEMA="ITE_TEST_WORKSPACE_209",KEY="ite:4.0:209:synthetic-only",MAX_BYTES=800000;
const copy=x=>JSON.parse(JSON.stringify(x));
const fail=code=>{throw Error(code);};
function isObject(x){return !!x&&typeof x==="object"&&!Array.isArray(x);}
function text(x,max=160){return typeof x==="string"&&x.length>0&&x.length<=max;}
function unique(items){return new Set(items.map(x=>x.id)).size===items.length;}
function validate(field,commercial){
 if(!isObject(field)||!isObject(commercial))fail("ARCHIVIO_NON_VALIDO");
 const names=["clients","sites","systems","equipment","operators","appointments","interventions"];
 for(const n of names){if(!Array.isArray(field[n])||field[n].length>5000||!unique(field[n])||field[n].some(x=>!isObject(x)||!text(x.id,100)))fail("COLLEZIONE_NON_VALIDA:"+n);}
 for(const n of ["extras","quotes"]){if(!Array.isArray(commercial[n])||commercial[n].length>5000||!unique(commercial[n])||commercial[n].some(x=>!isObject(x)||!text(x.id,100)))fail("COLLEZIONE_NON_VALIDA:"+n);}
 const ids=n=>new Set(field[n].map(x=>x.id)),clients=ids("clients"),sites=ids("sites"),systems=ids("systems"),equipment=ids("equipment"),operators=ids("operators"),appointments=ids("appointments"),interventions=ids("interventions");
 for(const x of field.sites)if(!clients.has(x.clientId))fail("SEDE_ORFANA");
 for(const x of field.systems)if(!sites.has(x.siteId))fail("IMPIANTO_ORFANO");
 for(const x of field.equipment)if(!systems.has(x.systemId))fail("APPARECCHIATURA_ORFANA");
 for(const x of field.appointments)if(!clients.has(x.clientId)||!sites.has(x.siteId)||!equipment.has(x.equipmentId)||!operators.has(x.operatorId)||!Number.isFinite(Date.parse(x.start))||!Number.isFinite(Date.parse(x.end))||Date.parse(x.end)<=Date.parse(x.start))fail("APPUNTAMENTO_NON_VALIDO");
 for(const x of field.interventions)if(!appointments.has(x.appointmentId))fail("INTERVENTO_ORFANO");
 for(const x of commercial.extras)if(!interventions.has(x.interventionId)||!["FORNITURA","POSA"].includes(x.kind)||!Number.isSafeInteger(x.priceCents)||x.priceCents<0)fail("EXTRA_NON_VALIDO");
 const extras=new Set(commercial.extras.map(x=>x.id));
 for(const q of commercial.quotes)if(!interventions.has(q.interventionId)||!Array.isArray(q.extraIds)||q.extraIds.some(id=>!extras.has(id)))fail("PREVENTIVO_NON_VALIDO");
 return true;
}
function fiscalValid(fiscal){if(!Array.isArray(fiscal)||fiscal.length>5000)fail("FISCALE_NON_VALIDO");const F=(typeof globalThis!=="undefined"&&globalThis.ITEFiscalLedger211)||(typeof require==="function"?require("./ite-fiscal-ledger-211.js"):null);if(!F)fail("MOTORE_FISCALE_MANCANTE");return F.validate(fiscal);}
function validateDocumentLinks(links){if(!Array.isArray(links)||links.length>5000)fail("COLLEGAMENTI_NON_VALIDI");const seen=new Set();for(const x of links){if(!isObject(x)||!text(x.documentId,100)||!text(x.clientId,100)||x.quoteId!==undefined&&!text(x.quoteId,100)||x.interventionId!==undefined&&!text(x.interventionId,100)||seen.has(x.documentId))fail("COLLEGAMENTO_NON_VALIDO");seen.add(x.documentId);}return true;}
function technicalValid(documents,field){
 if(!Array.isArray(documents))fail("DOCUMENTI_NON_VALIDI");
 const M=(typeof globalThis!=="undefined"&&globalThis.ITEDocumentIntake217)||(typeof require==="function"?require("./ite-document-intake-217.js"):null);
 if(!M)fail("MOTORE_DOCUMENTALE_MANCANTE");
 return M.checkRelations(documents,field);
}
function synthetic(field,commercial){validate(field,commercial);return {schema:SCHEMA,mode:"SYNTHETIC_TEST_ONLY",revision:0,field:copy(field),commercial:copy(commercial),fiscal:[],documentLinks:[],technicalDocuments:[]};}
function decode(raw){if(typeof raw!=="string"||raw.length>MAX_BYTES)fail("DIMENSIONE_NON_VALIDA");let p;try{p=JSON.parse(raw);}catch(_){fail("JSON_NON_VALIDO");}
 if(!isObject(p)||p.schema!==SCHEMA||p.mode!=="SYNTHETIC_TEST_ONLY"||!Number.isSafeInteger(p.revision)||p.revision<0)fail("FORMATO_NON_COMPATIBILE");
 validate(p.field,p.commercial);if(p.fiscal!==undefined)fiscalValid(p.fiscal);else p.fiscal=[];if(p.documentLinks===undefined)p.documentLinks=[];validateDocumentLinks(p.documentLinks);if(p.technicalDocuments===undefined)p.technicalDocuments=[];technicalValid(p.technicalDocuments,p.field);return copy(p);}
function encode(p){const s=JSON.stringify(decode(JSON.stringify(p)));if(s.length>MAX_BYTES)fail("DIMENSIONE_NON_VALIDA");return s;}
function create(storage,initialField,initialCommercial,key=KEY){
 if(!storage||typeof storage.getItem!=="function"||typeof storage.setItem!=="function"||typeof storage.removeItem!=="function")fail("STORAGE_NON_DISPONIBILE");
 let current=synthetic(initialField,initialCommercial);
 function snapshot(){return copy(current);}
 function save(next,expectedRevision=current.revision){if(expectedRevision!==current.revision)fail("REVISIONE_CONFLITTO");validate(next.field,next.commercial);const fiscal=next.fiscal===undefined?current.fiscal:next.fiscal;fiscalValid(fiscal);const documentLinks=next.documentLinks===undefined?current.documentLinks:next.documentLinks;validateDocumentLinks(documentLinks);const technicalDocuments=next.technicalDocuments===undefined?current.technicalDocuments:next.technicalDocuments;technicalValid(technicalDocuments,next.field);const disk=storage.getItem(key);if(disk!==null){const saved=decode(disk);if(saved.revision!==current.revision)fail("REVISIONE_CONFLITTO_DISPOSITIVO");}else if(current.revision!==0)fail("ARCHIVIO_ESTERNO_ELIMINATO");const updated={schema:SCHEMA,mode:"SYNTHETIC_TEST_ONLY",revision:current.revision+1,field:copy(next.field),commercial:copy(next.commercial),fiscal:copy(fiscal),documentLinks:copy(documentLinks),technicalDocuments:copy(technicalDocuments)};const serialized=encode(updated);storage.setItem(key,serialized);current=updated;return snapshot();}
 function restore(){const raw=storage.getItem(key);if(raw===null)return null;const next=decode(raw);current=next;return snapshot();}
 function importJson(raw){const imported=decode(raw);return save(imported,current.revision);}
 function reset(){storage.removeItem(key);current=synthetic(initialField,initialCommercial);return snapshot();}
 return Object.freeze({snapshot,save,restore,importJson,exportJson:()=>encode(current),reset,key});
}
return Object.freeze({SCHEMA,KEY,validate,decode,encode,synthetic,create,fiscalValid,validateDocumentLinks,technicalValid});
});
