/* I.T.E. 4.0.99 — isolated TEST document staging store, never writes accounting or production data. */
(function(root,factory){const api=factory(root.ITEPDFHandoff98,root.ITEPDFReview97);if(typeof module==="object"&&module.exports)module.exports=api;root.ITEPDFWorkspace99=api;})(typeof globalThis!=="undefined"?globalThis:this,function(handoff,review){
"use strict";
const KEY="ite-pdf-staging-99-test",SCHEMA="ITE-PDF-STAGING-99-TEST",MAX=250,LIMIT=250000;
const clone=x=>JSON.parse(JSON.stringify(x));
const assert=(condition,message)=>{if(!condition)throw Error(message);};
function empty(){return {schema:SCHEMA,revision:0,items:[]};}
function validate(db){assert(db&&db.schema===SCHEMA&&Number.isSafeInteger(db.revision)&&db.revision>=0&&Array.isArray(db.items)&&db.items.length<=MAX,"Archivio staging TEST non valido");
const ids=new Set();for(const item of db.items){assert(item&&typeof item.documentId==="string"&&!ids.has(item.documentId),"Documento duplicato");ids.add(item.documentId);assert(item.officialReady===false&&item.accounted===false&&item.source==="TEST_STAGING_ONLY","Documento non TEST");}
assert(JSON.stringify(db).length<=LIMIT,"Archivio troppo grande");return true;}
function load(storage){const raw=storage.getItem(KEY);if(raw===null)return empty();assert(raw.length<=LIMIT,"Archivio troppo grande");const db=JSON.parse(raw);validate(db);return clone(db);}
function save(storage,db){validate(db);storage.setItem(KEY,JSON.stringify(db));return clone(db);}
function prepare(reports,links,operator){assert(handoff&&review,"Motori 4.0.97/98 mancanti");assert(Array.isArray(reports)&&reports.length>0&&reports.length<=MAX,"Revisioni TEST obbligatorie");
reports.forEach(r=>review.validate(r));const bundle=handoff.stage(reports,links,operator);return bundle;}
function apply(db,bundle,expectedRevision){validate(db);assert(handoff,"Motore handoff assente");handoff.validateBundle(bundle);assert(db.revision===expectedRevision,"Archivio modificato: ricaricare prima di salvare");const next=clone(db),existing=new Map(next.items.map(x=>[x.documentId,x]));
for(const item of bundle.items){assert(item.readyForTestImport===true&&item.warnings.length===0,"Documento bloccato: "+item.documentId);existing.set(item.documentId,clone(item));}
assert(existing.size<=MAX,"Limite documenti superato");next.items=[...existing.values()];next.revision++;validate(next);return next;}
function remove(db,documentId,expectedRevision){validate(db);assert(db.revision===expectedRevision,"Archivio modificato");const next=clone(db);next.items=next.items.filter(x=>x.documentId!==documentId);assert(next.items.length!==db.items.length,"Documento inesistente");next.revision++;validate(next);return next;}
function exportJSON(db){validate(db);return JSON.stringify(db,null,2);}
function importJSON(raw){assert(typeof raw==="string"&&raw.length<=LIMIT,"File TEST troppo grande");const db=JSON.parse(raw);validate(db);return clone(db);}
function summary(db){validate(db);return {total:db.items.length,revision:db.revision,byDestination:db.items.reduce((a,x)=>(a[x.destination]=(a[x.destination]||0)+1,a),{})};}
return Object.freeze({KEY,SCHEMA,empty,validate,load,save,prepare,apply,remove,exportJSON,importJSON,summary});});
