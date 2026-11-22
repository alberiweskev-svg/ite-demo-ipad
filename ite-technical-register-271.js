/* I.T.E. 4.0.271 — synthetic technical document registry. Metadata only: no PDF bytes stored. */
(function(root,factory){const api=factory(root.ITEDossier269);if(typeof module==="object"&&module.exports)module.exports=factory(require("./ite-dossier-269.js"));root.ITETechnical271=api;})(typeof globalThis!=="undefined"?globalThis:this,function(dossier){"use strict";
const KEY="ITE_DEMO_271_TECHNICAL_TEST",SCHEMA="ITE_TECHNICAL_271",TYPES=["DICO","DIRI","POS","CAD","GAS","ALLEGATO"],copy=x=>JSON.parse(JSON.stringify(x));
function empty(){return {schema:SCHEMA,revision:0,documents:[]};}
function validate(reg,state){dossier.validate(state);if(!reg||reg.schema!==SCHEMA||!Number.isSafeInteger(reg.revision)||reg.revision<0||!Array.isArray(reg.documents))throw Error("REGISTRO_NON_VALIDO");
const ids=new Set();for(const d of reg.documents){if(!d||typeof d.id!=="string"||!/^TEST-DOC-[A-Z0-9-]{1,32}$/.test(d.id)||ids.has(d.id))throw Error("ID_DOCUMENTO_NON_VALIDO");ids.add(d.id);
if(!TYPES.includes(d.type)||!["BOZZA","VERIFICATO","ARCHIVIATO"].includes(d.status))throw Error("TIPO_O_STATO_NON_VALIDO");
if(typeof d.title!=="string"||!d.title.trim()||d.title.length>160)throw Error("TITOLO_NON_VALIDO");
if(d.filename!==null&&(typeof d.filename!=="string"||d.filename.length>180||!/^TEST-[a-zA-Z0-9_.-]+\\.pdf$/i.test(d.filename)))throw Error("FILE_NON_SINTETICO");
if(!Number.isSafeInteger(d.size)||d.size<0||d.size>50000000)throw Error("DIMENSIONE_NON_VALIDA");
if(d.filename===null&&d.size!==0)throw Error("FILE_NON_COHERENTE");
if(!d.siteId||!state.sites.some(x=>x.id===d.siteId))throw Error("SEDE_DOCUMENTO_MANCANTE");
const site=state.sites.find(x=>x.id===d.siteId);
if(d.clientId!==site.clientId)throw Error("CLIENTE_DOCUMENTO_DIVERSO");
if(d.deviceId){const device=state.devices.find(x=>x.id===d.deviceId),system=device&&state.systems.find(x=>x.id===device.systemId);if(!system||system.siteId!==d.siteId)throw Error("APPARECCHIATURA_DOCUMENTO_DIVERSA");}
if(d.interventionId){const intervention=state.interventions.find(x=>x.id===d.interventionId);if(!intervention||intervention.siteId!==d.siteId||(d.deviceId&&intervention.deviceId!==d.deviceId))throw Error("INTERVENTO_DOCUMENTO_DIVERSO");}
if(typeof d.createdAt!=="string"||!Number.isFinite(Date.parse(d.createdAt)))throw Error("DATA_DOCUMENTO_NON_VALIDA");
}return copy(reg);}
function add(reg,state,input){const s=validate(reg,state);const doc={id:input.id,type:input.type,title:input.title,filename:input.filename??null,size:input.size??0,clientId:input.clientId,siteId:input.siteId,deviceId:input.deviceId||null,interventionId:input.interventionId||null,status:"BOZZA",createdAt:input.createdAt||new Date().toISOString()};s.documents.push(doc);s.revision++;return validate(s,state);}
function setStatus(reg,state,id,status){const s=validate(reg,state),d=s.documents.find(x=>x.id===id);if(!d)throw Error("DOCUMENTO_NON_TROVATO");if(!({BOZZA:["VERIFICATO"],VERIFICATO:["ARCHIVIATO","BOZZA"],ARCHIVIATO:[]}[d.status]||[]).includes(status))throw Error("TRANSIZIONE_NON_CONSENTITA");d.status=status;s.revision++;return validate(s,state);}
function remove(reg,state,id){const s=validate(reg,state),d=s.documents.find(x=>x.id===id);if(!d)throw Error("DOCUMENTO_NON_TROVATO");if(d.status!=="BOZZA")throw Error("DOCUMENTO_BLOCCATO");s.documents=s.documents.filter(x=>x.id!==id);s.revision++;return validate(s,state);}
function persist(storage,before,after,state){validate(before,state);validate(after,state);if(after.revision!==before.revision+1)throw Error("REVISIONE_NON_SEQUENZIALE");const raw=storage.getItem(KEY);if(raw===null?before.revision!==0:JSON.stringify(validate(JSON.parse(raw),state))!==JSON.stringify(before))throw Error("CONFLITTO_REVISIONE");try{storage.setItem(KEY,JSON.stringify(after));if(JSON.stringify(validate(JSON.parse(storage.getItem(KEY)),state))!==JSON.stringify(after))throw Error("SALVATAGGIO_NON_VERIFICATO");}catch(e){try{if(raw===null)storage.removeItem(KEY);else storage.setItem(KEY,raw);}catch(_){}throw e;}return copy(after);}
function load(storage,state){const raw=storage.getItem(KEY);return validate(raw===null?empty():JSON.parse(raw),state);}
function manifest(reg,state){const s=validate(reg,state);return JSON.stringify({schema:s.schema,revision:s.revision,documents:s.documents},null,2);}
function pdfSignature(bytes){return !!bytes&&bytes.length>=5&&bytes[0]===37&&bytes[1]===80&&bytes[2]===68&&bytes[3]===70&&bytes[4]===45;}
return Object.freeze({KEY,TYPES,empty,validate,add,setStatus,remove,persist,load,manifest,pdfSignature});
});
