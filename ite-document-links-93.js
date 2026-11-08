/* I.T.E. 4.0.93 — collegamento documenti TEST alla gerarchia, senza PDF o dati reali. */
(function(root,factory){const api=factory(root);if(typeof module==="object"&&module.exports)module.exports=api;root.ITEDocumentLinks93=api;})(typeof globalThis!=="undefined"?globalThis:this,function(root){
"use strict";
const KEY="ite-document-links-93-test",SCHEMA="ITE-DOCUMENT-LINKS-TEST-1",ID=/^TEST-[A-Z0-9-]{2,60}$/;
const fields=["clientId","siteId","plantId","equipmentId","appointmentId"];
const assert=(v,m)=>{if(!v)throw Error(m);};
const copy=x=>JSON.parse(JSON.stringify(x));
function empty(){return {schema:SCHEMA,links:[]};}
function validate(db){assert(db&&db.schema===SCHEMA&&Array.isArray(db.links)&&db.links.length<=2000,"Registro collegamenti non valido");const ids=new Set();for(const l of db.links){assert(l&&ID.test(l.documentId)&&!ids.has(l.documentId),"Documento duplicato o non valido");ids.add(l.documentId);for(const f of fields)assert(l[f]===null||typeof l[f]==="string"&&ID.test(l[f]),"Riferimento non valido: "+f);assert(typeof l.operator==="string"&&l.operator.length>0&&l.operator.length<=80,"Operatore non valido");assert(typeof l.at==="string"&&!Number.isNaN(Date.parse(l.at)),"Data non valida");}return true;}
function resolve(ledger,refs){const service=root.ITEServiceLedger40;assert(service,"Motore fascicoli assente");service.validate(ledger);const r={};for(const f of fields)r[f]=refs[f]||null;
 const find=(key,id)=>ledger[key].find(x=>x.id===id);
 for(const [f,key] of [["clientId","clients"],["siteId","sites"],["plantId","plants"],["equipmentId","equipment"],["appointmentId","appointments"]])if(r[f])assert(find(key,r[f]),"Riferimento inesistente: "+f);
 const a=r.appointmentId?find("appointments",r.appointmentId):null;
 if(a){for(const f of fields.slice(0,4)){if(r[f])assert(r[f]===a[f],"Appuntamento non coerente: "+f);else r[f]=a[f];}}
 const e=r.equipmentId?find("equipment",r.equipmentId):null;if(e){assert(!r.plantId||r.plantId===e.plantId,"Apparecchiatura non coerente");r.plantId=e.plantId;}
 const p=r.plantId?find("plants",r.plantId):null;if(p){assert(!r.siteId||r.siteId===p.siteId,"Impianto non coerente");r.siteId=p.siteId;}
 const s=r.siteId?find("sites",r.siteId):null;if(s){assert(!r.clientId||r.clientId===s.clientId,"Sede non coerente");r.clientId=s.clientId;}
 assert(r.clientId,"Cliente obbligatorio");return r;
}
function link(db,manifest,ledger,documentId,refs,operator,at){validate(db);root.ITEDocumentIntake90.validateManifest(manifest);assert(manifest.records.some(d=>d.id===documentId),"Documento assente");assert(ID.test(documentId),"ID documento non valido");assert(typeof operator==="string"&&operator.trim().length>0&&operator.trim().length<=80,"Operatore obbligatorio");const r=resolve(ledger,refs||{});const entry={documentId,...r,operator:operator.trim(),at:at||new Date().toISOString()};const next={schema:SCHEMA,links:[...db.links.filter(l=>l.documentId!==documentId),entry]};validate(next);return next;}
function audit(db,manifest,ledger,review){validate(db);root.ITEDocumentIntake90.validateManifest(manifest);root.ITEServiceLedger40.validate(ledger);if(review)root.ITEDocumentReview92.validate(review);
 const results=[];for(const d of manifest.records){const l=db.links.find(x=>x.documentId===d.id),issues=[];if(!l)issues.push("SENZA_COLLEGAMENTO");else{try{resolve(ledger,l);}catch(e){issues.push("COLLEGAMENTO_NON_VALIDO");}if(d.clientId&&l.clientId!==d.clientId)issues.push("CLIENTE_MANIFEST_DIFFERENTE");if(d.appointmentId&&l.appointmentId!==d.appointmentId)issues.push("APPUNTAMENTO_MANIFEST_DIFFERENTE");}
 const rev=review?root.ITEDocumentReview92.status(review,d.id):null;
 const effectiveType=rev&&rev.action==="REVIEWED"?rev.type:d.type;
 if(effectiveType==="DA_VERIFICARE"||d.reviewRequired&&(!rev||rev.action!=="REVIEWED"))issues.push("REVISIONE_RICHIESTA");
 results.push({documentId:d.id,type:effectiveType,clientId:l?l.clientId:null,appointmentId:l?l.appointmentId:null,issues});}
 for(const l of db.links)if(!manifest.records.some(d=>d.id===l.documentId))results.push({documentId:l.documentId,type:null,clientId:l.clientId,appointmentId:l.appointmentId,issues:["DOCUMENTO_MANCANTE"]});
 return results;
}
function load(store){const raw=store.getItem(KEY);if(!raw)return empty();assert(raw.length<=1000000,"Registro troppo grande");const db=JSON.parse(raw);validate(db);return db;}
function save(store,db){validate(db);const raw=JSON.stringify(db);assert(raw.length<=1000000,"Registro troppo grande");store.setItem(KEY,raw);return db;}
function importJSON(raw){assert(typeof raw==="string"&&raw.length<=1000000,"File non valido");const db=JSON.parse(raw);validate(db);return copy(db);}
return Object.freeze({KEY,SCHEMA,empty,validate,resolve,link,audit,load,save,importJSON,exportJSON:db=>(validate(db),JSON.stringify(db,null,2))});
});