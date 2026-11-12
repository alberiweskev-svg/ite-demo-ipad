/* I.T.E. 4.0.176 — portable TEST session: explicit export/import, no network or storage. */
(function(root){"use strict";
const clone=x=>JSON.parse(JSON.stringify(x));
const arrays=["clients","sites","systems","equipment","operators","appointments","interventions"];
function validate(field,extras){
 if(!field||!extras||!Number.isSafeInteger(field.revision)||field.revision<0||!Number.isSafeInteger(extras.revision)||extras.revision<0||arrays.some(k=>!Array.isArray(field[k]))||!Array.isArray(field.audit)||!Array.isArray(extras.extras)||!Array.isArray(extras.quotes)||!Array.isArray(extras.audit))throw Error("FORMATO_NON_VALIDO");
 const ids={};for(const k of arrays){ids[k]=new Set();for(const v of field[k]){if(!v||typeof v.id!=="string"||!v.id||ids[k].has(v.id))throw Error("ID_NON_VALIDO_"+k);ids[k].add(v.id)}}
 const extraIds=new Set(),quoteIds=new Set();
 for(const x of extras.extras){if(!x||typeof x.id!=="string"||extraIds.has(x.id)||!ids.interventions.has(x.interventionId)||!["FORNITURA","POSA","SMONTAGGIO","SMALTIMENTO","ALTRO"].includes(x.kind)||!["PROPOSTO","ACCETTATO","RIFIUTATO"].includes(x.status)||!Number.isFinite(x.quantity)||x.quantity<=0||!Number.isFinite(x.unitPrice)||x.unitPrice<0)throw Error("EXTRA_NON_VALIDO");extraIds.add(x.id)}
 for(const q of extras.quotes){if(!q||typeof q.id!=="string"||quoteIds.has(q.id)||!ids.interventions.has(q.interventionId)||!Array.isArray(q.extraIds)||!q.extraIds.length||!q.extraIds.every(id=>extraIds.has(id))||!Number.isSafeInteger(q.totalCents)||q.totalCents<0||!["DA_ACCETTARE","ACCETTATO","NON_ACCETTATO"].includes(q.status))throw Error("PREVENTIVO_NON_VALIDO");quoteIds.add(q.id)}
 for(const s of field.sites)if(!ids.clients.has(s.clientId))throw Error("SEDE_ORFANA");
 for(const s of field.systems)if(!ids.sites.has(s.siteId))throw Error("IMPIANTO_ORFANO");
 for(const e of field.equipment)if(!ids.systems.has(e.systemId))throw Error("APPARECCHIATURA_ORFANA");
 for(const a of field.appointments){const site=field.sites.find(s=>s.id===a.siteId),eq=field.equipment.find(e=>e.id===a.equipmentId),sys=eq&&field.systems.find(s=>s.id===eq.systemId);if(!ids.clients.has(a.clientId)||!site||site.clientId!==a.clientId||!sys||sys.siteId!==a.siteId||!ids.operators.has(a.operatorId)||!Number.isFinite(Date.parse(a.start))||!Number.isFinite(Date.parse(a.end))||Date.parse(a.end)<=Date.parse(a.start))throw Error("APPUNTAMENTO_INCOERENTE")}
 for(const i of field.interventions)if(!ids.appointments.has(i.appointmentId)||!ids.operators.has(i.operatorId))throw Error("INTERVENTO_ORFANO");
 return true;
}
function pack(field,extras){validate(field,extras);return {format:"ITE-TEST-PORTABLE",schema:1,warning:"SOLO DATI FITTIZI — NON USARE PER CLIENTI REALI",field:clone(field),extras:clone(extras)}}
function unpack(text){if(typeof text!=="string"||text.length>2000000)throw Error("FILE_TROPPO_GRANDE");let p;try{p=JSON.parse(text)}catch(_){throw Error("JSON_NON_VALIDO")}if(!p||p.format!=="ITE-TEST-PORTABLE"||p.schema!==1)throw Error("VERSIONE_NON_SUPPORTATA");validate(p.field,p.extras);return {field:clone(p.field),extras:clone(p.extras)}}
const api=Object.freeze({validate,pack,unpack});if(typeof module!=="undefined"&&module.exports)module.exports=api;root.ITE_PortableTest176=api;
})(typeof globalThis!=="undefined"?globalThis:this);
