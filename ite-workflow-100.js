/* I.T.E. 4.0.100 — integrated TEST workflow, isolated from operational releases. */
(function(root,factory){const api=factory();if(typeof module==="object"&&module.exports)module.exports=api;root.ITEWorkflow100=api;})(typeof globalThis!=="undefined"?globalThis:this,function(){
"use strict";
const SCHEMA="ITE-WORKFLOW-TEST-100",KINDS=["clients","sites","plants","devices","operators","appointments","interventions","quotes","extras","invoices","documents"];
const MAX=1000, ID=/^TEST-[A-Z0-9-]{3,60}$/;
function copy(x){return JSON.parse(JSON.stringify(x));}
function checkId(x){if(typeof x!=="string"||!ID.test(x))throw Error("Identificativo TEST obbligatorio");return x;}
function text(x,n=200){if(typeof x!=="string"||!x.trim()||x.length>n||/[\u0000-\u001f\u007f]/.test(x))throw Error("Testo non valido");return x.trim();}
function amount(x){if(!Number.isInteger(x)||x<0||x>100000000)throw Error("Importo centesimi non valido");return x;}
function fresh(){return {schema:SCHEMA,revision:0,records:Object.fromEntries(KINDS.map(k=>[k,[]])),audit:[],officialReady:false,accounted:false};}
function validate(s){if(!s||s.schema!==SCHEMA||!Number.isSafeInteger(s.revision)||s.revision<0||s.officialReady!==false||s.accounted!==false||!s.records||!Array.isArray(s.audit))throw Error("Archivio TEST incompatibile");for(const k of KINDS){if(!Array.isArray(s.records[k])||s.records[k].length>MAX)throw Error("Collezione non valida: "+k);const seen=new Set();for(const row of s.records[k]){checkId(row.id);if(seen.has(row.id))throw Error("Duplicato: "+row.id);seen.add(row.id);}}return true;}
function get(s,k,id){return s.records[k].find(x=>x.id===id);}
function requireRef(s,k,id){checkId(id);if(!get(s,k,id))throw Error("Riferimento inesistente: "+k+"/"+id);}
function lineage(s,kind,row){if(kind==="sites")requireRef(s,"clients",row.clientId);
if(kind==="plants"){requireRef(s,"sites",row.siteId);requireRef(s,"clients",row.clientId);if(get(s,"sites",row.siteId).clientId!==row.clientId)throw Error("Sede non appartiene al cliente");}
if(kind==="devices"){requireRef(s,"plants",row.plantId);if(row.clientId!==get(s,"plants",row.plantId).clientId)throw Error("Apparecchiatura cliente incoerente");}
if(["appointments","interventions"].includes(kind)){requireRef(s,"clients",row.clientId);requireRef(s,"sites",row.siteId);requireRef(s,"plants",row.plantId);requireRef(s,"devices",row.deviceId);requireRef(s,"operators",row.operatorId);const site=get(s,"sites",row.siteId),plant=get(s,"plants",row.plantId),device=get(s,"devices",row.deviceId);if(site.clientId!==row.clientId||plant.siteId!==row.siteId||plant.clientId!==row.clientId||device.plantId!==row.plantId)throw Error("Gerarchia intervento incoerente");}
if(kind==="interventions"){requireRef(s,"appointments",row.appointmentId);const a=get(s,"appointments",row.appointmentId);for(const k of ["clientId","siteId","plantId","deviceId","operatorId"])if(a[k]!==row[k])throw Error("Intervento non coerente con appuntamento");if(row.arrivedAt&&row.leftAt&&Date.parse(row.leftAt)<Date.parse(row.arrivedAt))throw Error("Uscita prima dell'arrivo");}
if(["quotes","extras","invoices","documents"].includes(kind))requireRef(s,"clients",row.clientId);
if(kind==="extras")requireRef(s,"quotes",row.quoteId);
if(kind==="quotes"||kind==="extras"){if(!["FORNITURA","POSA","SMONTAGGIO","SMALTIMENTO","ALTRO"].includes(row.category))throw Error("Categoria commerciale obbligatoria");amount(row.unitCents);if(!Number.isInteger(row.quantity)||row.quantity<1||row.quantity>10000)throw Error("Quantità non valida");}
if(kind==="invoices"){if(!["ACQUISTO","VENDITA","PROFORMA","TD04"].includes(row.type))throw Error("Tipo fiscale non valido");amount(row.totalCents);if(row.type==="TD04"&&row.totalCents<0)throw Error("TD04 valore assoluto obbligatorio");}
if(kind==="documents"){if(row.officialReady!==false||row.accounted!==false)throw Error("Documento TEST non ufficiale");}
}
function transact(s,kind,row,operator,expected){validate(s);if(!KINDS.includes(kind))throw Error("Collezione sconosciuta");if(expected!==s.revision)throw Error("Conflitto revisione");text(operator,80);const next=copy(s),v=copy(row);checkId(v.id);if(get(next,kind,v.id))throw Error("ID già presente");if(kind==="clients"||kind==="operators")text(v.name);if(kind==="sites"||kind==="plants"||kind==="devices")text(v.name);if(kind==="appointments"){if(!Number.isFinite(Date.parse(v.startsAt)))throw Error("Data appuntamento non valida");}
lineage(next,kind,v);next.records[kind].push(v);next.revision++;next.audit.push({revision:next.revision,kind,id:v.id,operator,action:"CREATE"});if(next.audit.length>5000)next.audit=next.audit.slice(-5000);return next;}
function agenda(s,from,to,operatorId){validate(s);const a=Date.parse(from),z=Date.parse(to);if(!Number.isFinite(a)||!Number.isFinite(z)||a>z)throw Error("Intervallo non valido");return copy(s.records.appointments.filter(x=>Date.parse(x.startsAt)>=a&&Date.parse(x.startsAt)<=z&&(!operatorId||x.operatorId===operatorId)).sort((x,y)=>x.startsAt.localeCompare(y.startsAt)));}
function financial(s,clientId){validate(s);if(clientId)requireRef(s,"clients",clientId);const filter=k=>s.records[k].filter(x=>!clientId||x.clientId===clientId);const sum=k=>filter(k).reduce((n,x)=>n+x.unitCents*x.quantity,0);return {quotesCents:sum("quotes"),extrasCents:sum("extras"),salesCents:filter("invoices").filter(x=>x.type==="VENDITA").reduce((n,x)=>n+x.totalCents,0),creditsCents:filter("invoices").filter(x=>x.type==="TD04").reduce((n,x)=>n+x.totalCents,0),officialReady:false};}
function exportJSON(s){validate(s);return JSON.stringify(s);}
function importJSON(raw){if(typeof raw!=="string"||raw.length>1500000)throw Error("Archivio troppo grande");const s=JSON.parse(raw);validate(s);return copy(s);}
return Object.freeze({SCHEMA,KINDS,fresh,validate,transact,agenda,financial,exportJSON,importJSON});
});