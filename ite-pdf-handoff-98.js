/* I.T.E. 4.0.98 — transactional TEST staging of reviewed PDF fields; no production writes. */
(function(root,factory){const api=factory(root.ITEPDFReview97);if(typeof module==="object"&&module.exports)module.exports=api;root.ITEPDFHandoff98=api;})(typeof globalThis!=="undefined"?globalThis:this,function(review){
"use strict";
const SCHEMA="ITE-PDF-HANDOFF-TEST-98",MAX=250,MAX_BYTES=250000;
function clone(x){return JSON.parse(JSON.stringify(x));}
function id(x){return typeof x==="string"&&/^TEST-[A-Z0-9-]{3,60}$/.test(x);}
function assertReport(r){if(!r||r.schema!=="ITE-PDF-REVIEW-TEST-97"||r.source!=="TEST_REVIEW_ONLY"||r.reviewed!==true||r.officialReady!==false||r.accounted!==false||!id(r.documentId)||!r.operator||!r.reason)throw Error("Revisione TEST non valida");
if(!["DICO_ELETTRICO","DICO_IDRICO","DIRI","ALLEGATI_GAS","POS","FATTURA_ACQUISTO","FATTURA_VENDITA","PROFORMA","NOTA_CREDITO_TD04","DA_VERIFICARE"].includes(r.type))throw Error("Tipo non supportato");
if(!r.fields||typeof r.fields!=="object")throw Error("Campi assenti");
if(review&&typeof review.validate==="function")review.validate(r);
return true;}
function target(type){if(type==="FATTURA_ACQUISTO")return "ACQUISTI";if(type==="FATTURA_VENDITA")return "VENDITE";if(type==="PROFORMA")return "PROFORMA";if(type==="NOTA_CREDITO_TD04")return "NOTE_CREDITO";if(type==="DA_VERIFICARE")return "REVISIONE";return "DOCUMENTI_TECNICI";}
function build(report,links,operator){assertReport(report);if(!Array.isArray(links))throw Error("Collegamenti non validi");
const matches=links.filter(x=>x&&x.documentId===report.documentId);
if(matches.length>1)throw Error("Collegamenti duplicati");
const link=matches[0]||null;
if(link&&(!id(link.clientId)||!id(link.siteId)||!id(link.plantId)))throw Error("Gerarchia TEST incompleta");
const who=String(operator||"").trim().slice(0,80);if(!who)throw Error("Operatore obbligatorio");
const warnings=[];
if(!link)warnings.push("Documento senza gerarchia cliente/sede/impianto");
if(report.type==="DA_VERIFICARE")warnings.push("Classificazione da verificare");
const needed=["FATTURA_ACQUISTO","FATTURA_VENDITA","PROFORMA","NOTA_CREDITO_TD04"].includes(report.type)?["number","date","amount"]:["customer","system"];
for(const key of needed)if(!report.fields[key])warnings.push("Campo mancante: "+key);
return {documentId:report.documentId,type:report.type,destination:target(report.type),fields:clone(report.fields),link:link?clone(link):null,reviewedBy:report.operator,stagedBy:who,warnings,readyForTestImport:warnings.length===0,officialReady:false,accounted:false,source:"TEST_STAGING_ONLY"};}
function validateBundle(b){if(!b||b.schema!==SCHEMA||!Array.isArray(b.items)||b.items.length>MAX||b.officialReady!==false||b.accounted!==false)throw Error("Bundle TEST non valido");
const seen=new Set();for(const x of b.items){if(!x||!id(x.documentId)||seen.has(x.documentId)||x.source!=="TEST_STAGING_ONLY"||x.officialReady!==false||x.accounted!==false||!x.destination||!Array.isArray(x.warnings)||typeof x.readyForTestImport!=="boolean")throw Error("Elemento TEST non valido");seen.add(x.documentId);}
return true;}
function stage(reports,links,operator){if(!Array.isArray(reports)||reports.length>MAX)throw Error("Numero documenti non valido");const items=reports.map(r=>build(r,links,operator));const bundle={schema:SCHEMA,items,officialReady:false,accounted:false};validateBundle(bundle);if(JSON.stringify(bundle).length>MAX_BYTES)throw Error("Bundle troppo grande");return bundle;}
function exportJSON(bundle){validateBundle(bundle);return JSON.stringify(bundle,null,2);}
function importJSON(raw){if(typeof raw!=="string"||raw.length>MAX_BYTES)throw Error("File troppo grande");const b=JSON.parse(raw);validateBundle(b);return clone(b);}
function preview(bundle){validateBundle(bundle);return {total:bundle.items.length,ready:bundle.items.filter(x=>x.readyForTestImport).length,blocked:bundle.items.filter(x=>!x.readyForTestImport).length,byDestination:bundle.items.reduce((a,x)=>(a[x.destination]=(a[x.destination]||0)+1,a),{})};}
return Object.freeze({SCHEMA,build,stage,preview,validateBundle,exportJSON,importJSON});
});
