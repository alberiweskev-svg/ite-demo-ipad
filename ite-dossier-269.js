/* ITE 4.0.269: synthetic integrated operational dossier, isolated from production. */
(function(root,factory){const api=factory(root.ITECommercial268);if(typeof module==="object"&&module.exports)module.exports=factory(require("./ite-commercial-ledger-268.js"));root.ITEDossier269=api;})(typeof globalThis!=="undefined"?globalThis:this,function(commercial){"use strict";
const KEY="ITE_DEMO_269_DOSSIER_TEST",SCHEMA="ITE_DOSSIER_269",copy=x=>JSON.parse(JSON.stringify(x));
const collections=["clients","sites","systems","devices","appointments","interventions"];
function empty(){return {schema:SCHEMA,revision:0,clients:[],sites:[],systems:[],devices:[],appointments:[],interventions:[],commercial:commercial.empty()};}
function validId(x){return typeof x==="string"&&/^TEST-[A-Z0-9-]{1,40}$/.test(x);}
function validate(s){if(!s||s.schema!==SCHEMA||!Number.isSafeInteger(s.revision)||s.revision<0)throw Error("DOSSIER_NON_VALIDO");for(const k of collections){if(!Array.isArray(s[k]))throw Error("COLLEZIONE_NON_VALIDA_"+k);const ids=new Set();for(const x of s[k]){if(!x||!validId(x.id)||ids.has(x.id))throw Error("ID_NON_VALIDO_"+k);ids.add(x.id);}}
const has=(k,id)=>s[k].some(x=>x.id===id);
for(const x of s.sites)if(!has("clients",x.clientId))throw Error("CLIENTE_MANCANTE");
for(const x of s.systems)if(!has("sites",x.siteId))throw Error("SEDE_MANCANTE");
for(const x of s.devices)if(!has("systems",x.systemId))throw Error("IMPIANTO_MANCANTE");
for(const x of [...s.appointments,...s.interventions]){if(!has("devices",x.deviceId)||!has("sites",x.siteId)||!x.operator||typeof x.operator!=="string")throw Error("COLLEGAMENTO_INTERVENTO_NON_VALIDO");const dev=s.devices.find(d=>d.id===x.deviceId),sys=s.systems.find(y=>y.id===dev.systemId);if(sys.siteId!==x.siteId)throw Error("SEDE_APPARECCHIATURA_DIVERSA");if(!Number.isFinite(Date.parse(x.start))||!Number.isFinite(Date.parse(x.end))||Date.parse(x.end)<=Date.parse(x.start))throw Error("ORARIO_NON_VALIDO");}
for(const a of s.appointments)for(const b of s.appointments){if(a.id>=b.id||a.operator!==b.operator)continue;if(Date.parse(a.start)<Date.parse(b.end)&&Date.parse(b.start)<Date.parse(a.end))throw Error("SOVRAPPOSIZIONE_OPERATORE");}
for(const x of s.interventions)if(x.appointmentId){const a=s.appointments.find(y=>y.id===x.appointmentId);if(!a||a.deviceId!==x.deviceId||a.operator!==x.operator)throw Error("APPUNTAMENTO_NON_COHERENTE");}
commercial.validate(s.commercial);
for(const q of s.commercial.quotes){if(!has("clients",q.clientId)||!has("sites",q.siteId)||s.sites.find(x=>x.id===q.siteId).clientId!==q.clientId)throw Error("PREVENTIVO_ANAGRAFICA_NON_COHERENTE");if(q.interventionId){const i=s.interventions.find(x=>x.id===q.interventionId);if(!i||i.siteId!==q.siteId)throw Error("PREVENTIVO_INTERVENTO_NON_COHERENTE");}}
return copy(s);}
function insert(state,collection,item){const s=validate(state);if(!collections.includes(collection)||!item||!validId(item.id))throw Error("INSERIMENTO_NON_VALIDO");s[collection].push(copy(item));s.revision++;return validate(s);}
function saveQuote(state,input,approved){const s=validate(state);s.commercial=commercial.saveQuote(s.commercial,input,approved);s.revision++;return validate(s);}
function draft(state,quoteId,type){const s=validate(state);s.commercial=commercial.issueDraft(s.commercial,quoteId,type);s.revision++;return validate(s);}
function credit(state,invoiceId,cents){const s=validate(state);s.commercial=commercial.issueCredit(s.commercial,invoiceId,cents);s.revision++;return validate(s);}
function persist(storage,previous,next){validate(previous);validate(next);if(next.revision!==previous.revision+1)throw Error("REVISIONE_NON_SEQUENZIALE");const old=storage.getItem(KEY);if(old!==null&&JSON.stringify(validate(JSON.parse(old)))!==JSON.stringify(previous))throw Error("CONFLITTO_REVISIONE");if(old===null&&previous.revision!==0)throw Error("CONFLITTO_REVISIONE");try{storage.setItem(KEY,JSON.stringify(next));if(JSON.stringify(validate(JSON.parse(storage.getItem(KEY))))!==JSON.stringify(next))throw Error("SALVATAGGIO_NON_VERIFICATO");}catch(e){try{if(old===null)storage.removeItem(KEY);else storage.setItem(KEY,old);}catch(_){}throw e;}return copy(next);}
function load(storage){const raw=storage.getItem(KEY);return raw===null?empty():validate(JSON.parse(raw));}
return Object.freeze({KEY,empty,validate,insert,saveQuote,draft,credit,persist,load,exportJSON:s=>JSON.stringify(validate(s),null,2)});
});