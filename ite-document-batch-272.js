/* I.T.E. 4.0.272 — atomic synthetic document batch, no PDF payload persistence. */
(function(root,factory){const api=factory(root.ITETechnical271);if(typeof module==="object"&&module.exports)module.exports=factory(require("./ite-technical-register-271.js"));root.ITEBatch272=api;})(typeof globalThis!=="undefined"?globalThis:this,function(tech){"use strict";
const MAX_FILES=25,MAX_BYTES=50000000;
function prepare(files,context,existing){if(!Array.isArray(files)||!files.length||files.length>MAX_FILES)throw Error("NUMERO_FILE_NON_VALIDO");
const seen=new Set(existing.documents.map(x=>x.id));const items=[];
for(let n=0;n<files.length;n++){const f=files[n];if(!f||typeof f.name!=="string"||!/^TEST-[a-zA-Z0-9_.-]+\.pdf$/i.test(f.name)||!Number.isSafeInteger(f.size)||f.size<5||f.size>MAX_BYTES||!tech.pdfSignature(f.header))throw Error("PDF_TEST_NON_VALIDO_"+(n+1));
const id="TEST-DOC-"+String(context.batchId).replace(/[^A-Z0-9-]/g,"").slice(0,20)+"-"+String(n+1).padStart(2,"0");if(seen.has(id))throw Error("DOCUMENTO_DUPLICATO_"+id);seen.add(id);
items.push({id,type:context.type,title:context.titlePrefix+" "+(n+1),filename:f.name,size:f.size,clientId:context.clientId,siteId:context.siteId,deviceId:context.deviceId||null,interventionId:context.interventionId||null,createdAt:context.createdAt});}return items;}
function batchAdd(reg,state,items){let next=tech.validate(reg,state);if(!Array.isArray(items)||!items.length)throw Error("LOTTO_VUOTO");for(const item of items)next=tech.add(next,state,item);return next;}
function commit(storage,state,items){const before=tech.load(storage,state),after=batchAdd(before,state,items);
// Single verified write for the entire batch; no partial document commits.
const atomic={...after,revision:before.revision+1};return tech.persist(storage,before,tech.validate(atomic,state),state);}
function readiness(reg,state){const r=tech.validate(reg,state),counts={BOZZA:0,VERIFICATO:0,ARCHIVIATO:0};const warnings=[];for(const d of r.documents){counts[d.status]++;if(!d.filename)warnings.push({id:d.id,reason:"PDF_NON_ASSOCIATO"});if(d.status==="BOZZA")warnings.push({id:d.id,reason:"VERIFICA_MANCANTE"});}
return {schema:"ITE_BATCH_REPORT_272",revision:r.revision,total:r.documents.length,counts,warnings,readyForOperationalUse:false,reason:"SOLO_METADATI_TEST; PDF NON ARCHIVIATI; NESSUNA RIGENERAZIONE DICO/DIRI"};}
return Object.freeze({MAX_FILES,prepare,batchAdd,commit,readiness});
});