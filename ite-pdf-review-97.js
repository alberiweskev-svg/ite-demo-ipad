/* I.T.E. 4.0.97 — revisione campi PDF TEST, nessuna contabilizzazione automatica. */
(function(root,factory){const api=factory();if(typeof module==="object"&&module.exports)module.exports=api;root.ITEPDFReview97=api;})(typeof globalThis!=="undefined"?globalThis:this,function(){
"use strict";
const SCHEMA="ITE-PDF-REVIEW-TEST-97",TYPES=["DICO_ELETTRICO","DICO_IDRICO","DIRI","ALLEGATI_GAS","POS","FATTURA_ACQUISTO","FATTURA_VENDITA","PROFORMA","NOTA_CREDITO_TD04","DA_VERIFICARE"];
const FIELDS=["number","date","vat","amount","customer","system"];
function clean(v,max=140){return String(v==null?"":v).normalize("NFKC").replace(/[\u0000-\u001f\u007f]/g," ").trim().slice(0,max);}
function validDate(s){if(!/^\d{2}\/\d{2}\/\d{4}$/.test(s))return false;const [d,m,y]=s.split("/").map(Number),dt=new Date(Date.UTC(y,m-1,d));return dt.getUTCDate()===d&&dt.getUTCMonth()===m-1&&dt.getUTCFullYear()===y;}
function validate(report){if(!report||report.schema!==SCHEMA||!TYPES.includes(report.type)||!report.fields||typeof report.fields!=="object")throw Error("Revisione incompatibile");
if(!/^TEST-[A-Z0-9-]{3,60}$/.test(report.documentId))throw Error("ID documento TEST obbligatorio");
if(!clean(report.operator,80)||!clean(report.reason,300))throw Error("Operatore e motivazione obbligatori");
for(const [k,v] of Object.entries(report.fields)){if(!FIELDS.includes(k)||typeof v!=="string"||v.length>140)throw Error("Campo non valido: "+k);}
if(report.fields.date&&!validDate(report.fields.date))throw Error("Data non valida (GG/MM/AAAA)");
if(report.fields.vat&&!/^\d{11}$/.test(report.fields.vat))throw Error("Partita IVA non valida");
if(report.fields.amount&&!/^\d{1,3}(?:\.\d{3})*,\d{2}$|^\d+,\d{2}$/.test(report.fields.amount))throw Error("Importo non valido");
if(report.officialReady!==false||report.accounted!==false||report.source!=="TEST_REVIEW_ONLY")throw Error("È vietata l'emissione o contabilizzazione automatica");
return true;}
function prepare(extraction,edits){if(!extraction||!extraction.reviewRequired||extraction.officialReady!==false)throw Error("Estrazione preliminare non valida");const e=edits||{};
const fields={};for(const k of FIELDS){const v=Object.prototype.hasOwnProperty.call(e.fields||{},k)?e.fields[k]:(extraction.fields||{})[k];if(v!=null&&clean(v))fields[k]=clean(v);}
const report={schema:SCHEMA,documentId:clean(e.documentId,80),type:e.type||extraction.type,fields,operator:clean(e.operator,80),reason:clean(e.reason,300),reviewedAt:clean(e.reviewedAt,40),source:"TEST_REVIEW_ONLY",officialReady:false,accounted:false,reviewed:true};
validate(report);return Object.freeze(report);}
function exportJSON(report){validate(report);return JSON.stringify(report,null,2);}
function importJSON(raw){if(typeof raw!=="string"||raw.length>10000)throw Error("Revisione troppo grande");const r=JSON.parse(raw);validate(r);return JSON.parse(JSON.stringify(r));}
function completeness(report){validate(report);const needed=report.type.startsWith("FATTURA")||["PROFORMA","NOTA_CREDITO_TD04"].includes(report.type)?["number","date","amount"]:["customer","system"];const missing=needed.filter(k=>!report.fields[k]);return {missing,complete:missing.length===0,officialReady:false};}
return Object.freeze({SCHEMA,TYPES,FIELDS,prepare,validate,exportJSON,importJSON,completeness});
});